import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_INSTRUMENT_SOUND,
  INSTRUMENT_PRESETS,
  type InstrumentSound,
} from "./instrumentPresets";

const tone = vi.hoisted(() => {
  const node = () => ({
    connect: vi.fn().mockReturnThis(),
    toDestination: vi.fn().mockReturnThis(),
    dispose: vi.fn(),
    triggerAttack: vi.fn(),
    triggerRelease: vi.fn(),
    volume: { value: 0 },
  });
  return {
    PolySynth: vi.fn(function () {
      return node();
    }),
    MonoSynth: vi.fn(),
    Gain: vi.fn(function () {
      return node();
    }),
    Convolver: vi.fn(function () {
      return node();
    }),
    Distortion: vi.fn(function () {
      return node();
    }),
    start: vi.fn<() => Promise<void>>(),
    createBuffer: vi.fn(
      (channels: number, length: number, sampleRate: number) => ({
        length,
        sampleRate,
        getChannelData: vi.fn(() => new Float32Array(length)),
      }),
    ),
  };
});

vi.mock("tone", () => ({
  ...tone,
  getContext: () => ({ sampleRate: 48000, createBuffer: tone.createBuffer }),
}));

let keyboardSynth: typeof import("./keyboardSynth").keyboardSynth;
const instrument = () => tone.PolySynth.mock.results.at(-1)!.value;
const flush = async () => {
  await Promise.resolve();
  await Promise.resolve();
};
const deferred = () => {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};
const configure = (overrides: Partial<InstrumentSound>) =>
  keyboardSynth.configure({ ...DEFAULT_INSTRUMENT_SOUND, ...overrides });

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  tone.start.mockReset().mockResolvedValue();
  ({ keyboardSynth } = await import("./keyboardSynth"));
});

describe("keyboardSynth", () => {
  it("retains a copied selection without constructing or starting audio", async () => {
    const selection: InstrumentSound = {
      tone: "reed",
      shape: "round",
      filter: "bloom",
      effect: "grit",
    };
    keyboardSynth.configure(selection);
    selection.tone = "sine";
    expect(tone.start).not.toHaveBeenCalled();
    expect(tone.PolySynth).not.toHaveBeenCalled();
    expect(tone.Gain).not.toHaveBeenCalled();
    expect(tone.Distortion).not.toHaveBeenCalled();
    keyboardSynth.noteOn("C4");
    await flush();
    expect(tone.PolySynth).toHaveBeenCalledWith(
      tone.MonoSynth,
      expect.objectContaining({
        oscillator: {
          type: "custom",
          partials: [1, 0, 0.65, 0, 0.35, 0, 0.18],
        },
        envelope: expect.objectContaining({ sustain: 0.65 }),
        filterEnvelope: expect.objectContaining({ octaves: 4 }),
      }),
    );
  });

  it("unlocks without constructing an instrument", async () => {
    await keyboardSynth.unlock();
    expect(tone.start).toHaveBeenCalledOnce();
    expect(tone.PolySynth).not.toHaveBeenCalled();
  });

  it("attacks once per held pitch and releases notes independently", async () => {
    keyboardSynth.noteOn("C4");
    keyboardSynth.noteOn("C4");
    keyboardSynth.noteOn("E4");
    await flush();
    expect(instrument().triggerAttack.mock.calls).toEqual([["C4"], ["E4"]]);
    keyboardSynth.noteOff("C4");
    keyboardSynth.noteOff("C4");
    expect(instrument().triggerRelease.mock.calls).toEqual([["C4"]]);
    keyboardSynth.releaseAll();
    expect(instrument().triggerRelease).toHaveBeenLastCalledWith(["E4"]);
  });

  it.each(["noteOff", "releaseAll", "configure"] as const)(
    "cancels pending startup with %s",
    async (cancel) => {
      const startup = deferred();
      tone.start.mockReturnValue(startup.promise);
      keyboardSynth.noteOn("D4");
      if (cancel === "configure") configure({ tone: "square" });
      else if (cancel === "noteOff") keyboardSynth.noteOff("D4");
      else keyboardSynth.releaseAll();
      startup.resolve();
      await flush();
      expect(tone.PolySynth).not.toHaveBeenCalled();
    },
  );

  it.each(["resolve", "reject"] as const)(
    "ignores an old startup %s after the same pitch is re-pressed",
    async (settle) => {
      const old = deferred();
      const current = deferred();
      tone.start
        .mockReturnValueOnce(old.promise)
        .mockReturnValueOnce(current.promise);
      const log = vi.spyOn(console, "error").mockImplementation(() => {});
      keyboardSynth.noteOn("D4");
      keyboardSynth.noteOff("D4");
      keyboardSynth.noteOn("D4");
      if (settle === "resolve") old.resolve();
      else old.reject(new Error("startup failed"));
      await flush();
      expect(tone.PolySynth).not.toHaveBeenCalled();
      current.resolve();
      await flush();
      expect(instrument().triggerAttack).toHaveBeenCalledExactlyOnceWith("D4");
      keyboardSynth.noteOff("D4");
      expect(instrument().triggerRelease).toHaveBeenCalledWith("D4");
      log.mockRestore();
    },
  );

  it("allows retry after startup failure", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    tone.start.mockRejectedValueOnce(new Error("blocked"));
    keyboardSynth.noteOn("C4");
    await flush();
    expect(tone.PolySynth).not.toHaveBeenCalled();
    keyboardSynth.noteOn("C4");
    await flush();
    expect(instrument().triggerAttack).toHaveBeenCalledWith("C4");
    log.mockRestore();
  });

  it("releases held notes, disposes the graph, and rebuilds only on the next note", async () => {
    configure({ effect: "hall" });
    keyboardSynth.noteOn("C4");
    await flush();
    const old = instrument();
    const oldNodes = [
      ...tone.Gain.mock.results,
      ...tone.Convolver.mock.results,
    ].map(({ value }) => value);
    configure({ effect: "grit" });
    expect(old.triggerRelease).toHaveBeenCalledWith(["C4"]);
    expect(old.dispose).toHaveBeenCalledOnce();
    for (const node of oldNodes) expect(node.dispose).toHaveBeenCalledOnce();
    expect(tone.Distortion).not.toHaveBeenCalled();
    keyboardSynth.noteOff("C4");
    keyboardSynth.noteOn("C4");
    await flush();
    expect(tone.PolySynth).toHaveBeenCalledTimes(2);
    expect(instrument().triggerAttack).toHaveBeenCalledWith("C4");
    expect(tone.Distortion).toHaveBeenCalledOnce();
    const drive = tone.Gain.mock.results.at(-1)!.value;
    configure({ effect: "dry" });
    expect(drive.dispose).toHaveBeenCalledOnce();
    expect(
      tone.Distortion.mock.results[0].value.dispose,
    ).toHaveBeenCalledOnce();
  });

  it("keeps held notes and tails when configuring the same selection", async () => {
    keyboardSynth.noteOn("C4");
    await flush();
    keyboardSynth.configure({ ...DEFAULT_INSTRUMENT_SOUND });
    expect(instrument().dispose).not.toHaveBeenCalled();
    expect(instrument().triggerRelease).not.toHaveBeenCalled();
  });

  it.each(INSTRUMENT_PRESETS.tone)(
    "maps $id tone to an oscillator",
    async ({ id }) => {
      configure({ tone: id });
      keyboardSynth.noteOn("C4");
      await flush();
      expect(tone.PolySynth).toHaveBeenCalledWith(
        tone.MonoSynth,
        expect.objectContaining({
          oscillator: expect.objectContaining({
            type: id === "reed" ? "custom" : id === "saw" ? "sawtooth" : id,
          }),
        }),
      );
    },
  );

  it.each([
    ["sine", 0],
    ["triangle", 1.5],
    ["square", -4],
    ["saw", 2],
    ["reed", -0.5],
  ] as const)("balances %s before effects by %s dB", async (id, trim) => {
    configure({ tone: id });
    keyboardSynth.noteOn("C4");
    await flush();
    expect(instrument().volume.value).toBe(trim);
  });

  it.each(INSTRUMENT_PRESETS.tone)(
    "uses bounded filter compensation for $id without changing its envelope",
    async ({ id }) => {
      for (const { id: filter } of INSTRUMENT_PRESETS.filter) {
        configure({ tone: id, filter });
        keyboardSynth.noteOn("C4");
        await flush();
        expect(instrument().volume.value).toBeGreaterThanOrEqual(-4);
        expect(instrument().volume.value).toBeLessThanOrEqual(12);
        expect(tone.PolySynth).toHaveBeenLastCalledWith(
          tone.MonoSynth,
          expect.objectContaining({
            envelope: {
              attack: 0.008,
              decay: 0.1,
              sustain: 0.8,
              release: 0.18,
            },
          }),
        );
      }
    },
  );

  it("compensates filtering differently for pure and harmonic-rich waves", async () => {
    configure({ tone: "sine", filter: "thin" });
    keyboardSynth.noteOn("C4");
    await flush();
    expect(instrument().volume.value).toBe(12);
    configure({ tone: "square", filter: "thin" });
    keyboardSynth.noteOn("C4");
    await flush();
    expect(instrument().volume.value).toBe(-1);
  });

  it.each(INSTRUMENT_PRESETS.shape)(
    "maps $id shape to an amplitude envelope",
    async ({ id }) => {
      configure({ shape: id });
      keyboardSynth.noteOn("C4");
      await flush();
      const attacks = {
        steady: 0.008,
        round: 0.04,
        struck: 0.002,
        soft: 0.18,
        swell: 0.8,
      };
      expect(tone.PolySynth).toHaveBeenCalledWith(
        tone.MonoSynth,
        expect.objectContaining({
          envelope: expect.objectContaining({
            attack: attacks[id],
            sustain:
              id === "round"
                ? 0.65
                : id === "struck"
                  ? 0.3
                  : expect.any(Number),
          }),
        }),
      );
    },
  );

  it("gives Round a quick rounded onset and a sustained body until release", async () => {
    configure({ shape: "round" });
    keyboardSynth.noteOn("C4");
    await flush();
    expect(tone.PolySynth).toHaveBeenCalledWith(
      tone.MonoSynth,
      expect.objectContaining({
        envelope: { attack: 0.04, decay: 0.15, sustain: 0.65, release: 0.25 },
      }),
    );
    expect(instrument().triggerRelease).not.toHaveBeenCalled();
    keyboardSynth.noteOff("C4");
    expect(instrument().triggerRelease).toHaveBeenCalledExactlyOnceWith("C4");
  });

  it.each(INSTRUMENT_PRESETS.filter)(
    "maps $id filter inside each MonoSynth voice",
    async ({ id }) => {
      configure({ filter: id });
      keyboardSynth.noteOn("C4");
      keyboardSynth.noteOn("E4");
      await flush();
      const cutoffs = {
        open: 20000,
        mellow: 1400,
        thin: 900,
        focused: 1600,
        bloom: 350,
      };
      expect(tone.PolySynth).toHaveBeenCalledExactlyOnceWith(
        tone.MonoSynth,
        expect.objectContaining({
          filter: expect.objectContaining({
            type:
              id === "thin"
                ? "highpass"
                : id === "focused"
                  ? "bandpass"
                  : "lowpass",
          }),
          filterEnvelope: expect.objectContaining({
            baseFrequency: cutoffs[id],
            octaves: id === "bloom" ? 4 : 0,
          }),
        }),
      );
      expect(instrument().triggerAttack.mock.calls).toEqual([["C4"], ["E4"]]);
    },
  );

  it.each(INSTRUMENT_PRESETS.effect)(
    "routes $id with output compensation after processing",
    async ({ id }) => {
      configure({ effect: id });
      keyboardSynth.noteOn("C4");
      await flush();
      const output = tone.Gain.mock.results[0].value;
      expect(output.toDestination).toHaveBeenCalledOnce();
      expect(instrument().volume.value).toBe(0);
      const trim = { dry: 0, room: 1, hall: 3, warmth: 0, grit: 4 }[id];
      expect(tone.Gain).toHaveBeenNthCalledWith(1, 10 ** ((-24 + trim) / 20));
      if (id === "room" || id === "hall") {
        expect(tone.createBuffer).toHaveBeenCalledWith(
          2,
          Math.ceil(48000 * (id === "hall" ? 2.8 : 0.65)),
          48000,
        );
        const convolver = tone.Convolver.mock.results[0].value;
        expect(instrument().connect).toHaveBeenCalledWith(convolver);
        expect(convolver.connect).toHaveBeenCalledWith(
          tone.Gain.mock.results[2].value,
        );
        expect(tone.Gain.mock.results[1].value.connect).toHaveBeenCalledWith(
          output,
        );
        expect(tone.Gain.mock.results[2].value.connect).toHaveBeenCalledWith(
          output,
        );
      } else if (id === "warmth" || id === "grit") {
        expect(tone.Distortion).toHaveBeenCalledWith(
          expect.objectContaining({
            distortion: id === "warmth" ? 0.12 : 0.9,
            wet: id === "warmth" ? 0.3 : 1,
            oversample: "4x",
          }),
        );
        const drive = tone.Gain.mock.results[1].value;
        expect(tone.Gain).toHaveBeenNthCalledWith(2, id === "grit" ? 3 : 1);
        expect(instrument().connect).toHaveBeenCalledExactlyOnceWith(drive);
        expect(drive.connect).toHaveBeenCalledExactlyOnceWith(
          tone.Distortion.mock.results[0].value,
        );
        expect(
          tone.Distortion.mock.results[0].value.connect,
        ).toHaveBeenCalledWith(output);
      } else {
        expect(instrument().connect).toHaveBeenCalledExactlyOnceWith(output);
        expect(tone.Convolver).not.toHaveBeenCalled();
        expect(tone.Distortion).not.toHaveBeenCalled();
      }
    },
  );
});
