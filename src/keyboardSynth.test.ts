import { beforeEach, describe, expect, it, vi } from "vitest";

const tone = vi.hoisted(() => ({
  instrument: {
    toDestination: vi.fn(),
    triggerAttack: vi.fn(),
    triggerRelease: vi.fn(),
  },
  start: vi.fn<() => Promise<void>>(),
}));

vi.mock("tone", () => ({
  PolySynth: function MockPolySynth() {
    return tone.instrument;
  },
  Synth: function MockSynth() {},
  start: tone.start,
}));

import { keyboardSynth } from "./keyboardSynth";

beforeEach(() => {
  keyboardSynth.releaseAll();
  vi.clearAllMocks();
  tone.instrument.toDestination.mockReturnValue(tone.instrument);
});

describe("keyboardSynth", () => {
  it("unlocks audio from an initiating user gesture", async () => {
    tone.start.mockResolvedValue();

    await keyboardSynth.unlock();

    expect(tone.start).toHaveBeenCalledOnce();
  });

  it("attacks and releases a note after audio starts", async () => {
    tone.start.mockResolvedValue();

    keyboardSynth.noteOn("C4");

    await vi.waitFor(() => {
      expect(tone.instrument.triggerAttack).toHaveBeenCalledWith("C4");
    });

    keyboardSynth.noteOff("C4");

    expect(tone.instrument.triggerRelease).toHaveBeenCalledWith("C4");
  });

  it("does not attack a note released while audio is starting", async () => {
    let finishStarting = () => {};
    tone.start.mockReturnValue(
      new Promise<void>((resolve) => {
        finishStarting = resolve;
      }),
    );

    keyboardSynth.noteOn("D4");
    keyboardSynth.noteOff("D4");
    finishStarting();
    await Promise.resolve();

    expect(tone.instrument.triggerAttack).not.toHaveBeenCalled();
    expect(tone.instrument.triggerRelease).not.toHaveBeenCalled();
  });
});
