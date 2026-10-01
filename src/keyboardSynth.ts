import {
  Convolver,
  Distortion,
  Gain,
  MonoSynth,
  PolySynth,
  getContext,
  start,
} from "tone";
import {
  DEFAULT_INSTRUMENT_SOUND,
  type InstrumentSound,
  type ShapeId,
  type ToneId,
} from "./instrumentPresets";

const envelopes = {
  steady: { attack: 0.008, decay: 0.1, sustain: 0.8, release: 0.18 },
  round: { attack: 0.04, decay: 0.15, sustain: 0.65, release: 0.25 },
  struck: { attack: 0.002, decay: 0.6, sustain: 0.3, release: 0.35 },
  soft: { attack: 0.18, decay: 0.2, sustain: 0.75, release: 0.5 },
  swell: { attack: 0.8, decay: 0.3, sustain: 0.85, release: 0.7 },
} satisfies Record<
  ShapeId,
  { attack: number; decay: number; sustain: number; release: number }
>;

// Static trims preserve envelope dynamics; bright, high-energy waves need less level.
const toneTrimDb = {
  sine: 0,
  triangle: 1.5,
  square: -4,
  saw: 2,
  reed: -0.5,
} satisfies Record<ToneId, number>;

// Restore some body lost to filtering, without trying to amplify near-silence
// back to full level. Compensation is deliberately bounded, not an AGC.
const filterTrimDb = {
  open: { sine: 0, triangle: 0, square: 0, saw: 0, reed: 0 },
  mellow: { sine: 0, triangle: 0, square: 1, saw: 1, reed: 1 },
  thin: { sine: 12, triangle: 9, square: 3, saw: 5, reed: 3 },
  focused: { sine: 10, triangle: 9, square: 6, saw: 8, reed: 5 },
  bloom: { sine: 0, triangle: 0, square: 1, saw: 1, reed: 1 },
} satisfies Record<InstrumentSound["filter"], Record<ToneId, number>>;

const gainFromDb = (db: number) => 10 ** (db / 20);

let sound = { ...DEFAULT_INSTRUMENT_SOUND };
let synth: PolySynth<MonoSynth> | undefined;
let effectNodes: (Gain | Convolver | Distortion)[] = [];
// Request identities prevent an old start promise from attacking a re-pressed pitch.
const activePitches = new Map<string, object>();
const soundingPitches = new Set<string>();

function reverbBuffer(seconds: number) {
  const context = getContext();
  const length = Math.ceil(context.sampleRate * seconds);
  const buffer = context.createBuffer(2, length, context.sampleRate);
  // Synchronous, deterministic noise avoids loading/generation promises during switching.
  let seed = 12345;
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      data[i] = (seed / 2147483648 - 1) * Math.pow(1 - i / length, 3);
    }
  }
  return buffer;
}

function getSynth() {
  if (synth) return synth;

  const bloom = sound.filter === "bloom";
  const cutoff = {
    open: 20000,
    mellow: 1400,
    thin: 900,
    focused: 1600,
    bloom: 350,
  }[sound.filter];
  synth = new PolySynth(MonoSynth, {
    oscillator:
      sound.tone === "reed"
        ? { type: "custom", partials: [1, 0, 0.65, 0, 0.35, 0, 0.18] }
        : { type: sound.tone === "saw" ? "sawtooth" : sound.tone },
    envelope: envelopes[sound.shape],
    filter: {
      type:
        sound.filter === "thin"
          ? "highpass"
          : sound.filter === "focused"
            ? "bandpass"
            : "lowpass",
      Q: sound.filter === "focused" ? 1.2 : 0.7,
      rolloff: -12,
    },
    // MonoSynth connects this envelope to its own filter; zero octaves gives a static cutoff.
    filterEnvelope: {
      baseFrequency: cutoff,
      octaves: bloom ? 4 : 0,
      exponent: 1,
      attack: 0.04,
      decay: 0.6,
      sustain: 0.25,
      release: 0.4,
    },
  });
  synth.volume.value =
    toneTrimDb[sound.tone] + filterTrimDb[sound.filter][sound.tone];
  // Headroom belongs AFTER the effects: attenuating first starves distortion of drive.
  const effectTrimDb = { dry: 0, room: 1, hall: 3, warmth: 0, grit: 4 }[
    sound.effect
  ];
  const output = new Gain(gainFromDb(-24 + effectTrimDb)).toDestination();
  effectNodes = [output];

  if (sound.effect === "room" || sound.effect === "hall") {
    const hall = sound.effect === "hall";
    const convolver = new Convolver({
      url: reverbBuffer(hall ? 2.8 : 0.65),
      normalize: true,
    });
    const dry = new Gain(hall ? 0.65 : 0.8);
    const wet = new Gain(hall ? 0.35 : 0.2);
    synth.connect(dry);
    dry.connect(output);
    synth.connect(convolver);
    convolver.connect(wet);
    wet.connect(output);
    effectNodes.push(convolver, dry, wet);
  } else if (sound.effect === "warmth" || sound.effect === "grit") {
    const grit = sound.effect === "grit";
    const drive = new Gain(grit ? 3 : 1);
    const distortion = new Distortion({
      distortion: grit ? 0.9 : 0.12,
      wet: grit ? 1 : 0.3,
      oversample: "4x",
    });
    synth.connect(drive);
    drive.connect(distortion);
    distortion.connect(output);
    effectNodes.push(drive, distortion);
  } else {
    synth.connect(output);
  }
  return synth;
}

/** Changes stop held/pending notes and cut effect tails. The next note builds the new graph. */
function configure(next: InstrumentSound): void {
  if (
    sound.tone === next.tone &&
    sound.shape === next.shape &&
    sound.filter === next.filter &&
    sound.effect === next.effect
  )
    return;
  releaseAll();
  synth?.dispose();
  synth = undefined;
  for (const node of effectNodes) node.dispose();
  effectNodes = [];
  sound = { ...next };
}

function unlock(): Promise<void> {
  return start();
}

function noteOn(pitch: string) {
  if (activePitches.has(pitch)) return;
  const request = {};
  activePitches.set(pitch, request);

  void start()
    .then(() => {
      if (activePitches.get(pitch) === request) {
        getSynth().triggerAttack(pitch);
        soundingPitches.add(pitch);
      }
    })
    .catch((error: unknown) => {
      if (activePitches.get(pitch) === request) activePitches.delete(pitch);
      console.error("Unable to start audio", error);
    });
}

function noteOff(pitch: string) {
  activePitches.delete(pitch);
  if (soundingPitches.delete(pitch)) synth?.triggerRelease(pitch);
}

function releaseAll() {
  activePitches.clear();
  if (synth && soundingPitches.size > 0)
    synth.triggerRelease([...soundingPitches]);
  soundingPitches.clear();
}

export const keyboardSynth = { configure, unlock, noteOn, noteOff, releaseAll };
