export const INSTRUMENT_PRESETS = {
  tone: [
    {
      id: "sine",
      label: "Sine",
      description: "Pure and rounded, with no extra harmonics.",
    },
    {
      id: "triangle",
      label: "Triangle",
      description: "Soft and woody, with gentle odd harmonics.",
    },
    {
      id: "square",
      label: "Square",
      description: "Hollow and bold, with strong odd harmonics.",
    },
    {
      id: "saw",
      label: "Saw",
      description: "Bright and buzzy, with a full set of harmonics.",
    },
    {
      id: "reed",
      label: "Reed",
      description: "Reedy and nasal, with a custom blend of odd harmonics.",
    },
  ],
  shape: [
    {
      id: "steady",
      label: "Steady",
      description: "A quick start that holds while you press.",
    },
    {
      id: "round",
      label: "Round",
      description: "A quick, rounded start that sustains while you hold.",
    },
    {
      id: "struck",
      label: "Struck",
      description: "A quick strike that settles into a quieter held note.",
    },
    {
      id: "soft",
      label: "Soft",
      description: "A gentle start and a smooth release.",
    },
    {
      id: "swell",
      label: "Swell",
      description: "A slow rise that blooms while you hold.",
    },
  ],
  filter: [
    {
      id: "open",
      label: "Open",
      description: "Keeps the full brightness of the tone.",
    },
    {
      id: "mellow",
      label: "Mellow",
      description: "A low-pass filter softens the upper harmonics.",
    },
    {
      id: "thin",
      label: "Thin",
      description: "A high-pass filter removes low frequencies.",
    },
    {
      id: "focused",
      label: "Focused",
      description: "A band-pass filter brings forward the middle frequencies.",
    },
    {
      id: "bloom",
      label: "Bloom",
      description: "Each note opens its own low-pass filter, then settles.",
    },
  ],
  effect: [
    {
      id: "dry",
      label: "Dry",
      description: "The direct sound, without an added effect.",
    },
    {
      id: "room",
      label: "Room",
      description: "A short, intimate reverberation.",
    },
    {
      id: "hall",
      label: "Hall",
      description: "A spacious reverberation with a longer tail.",
    },
    {
      id: "warmth",
      label: "Warmth",
      description: "Gentle saturation adds body and harmonics.",
    },
    {
      id: "grit",
      label: "Grit",
      description: "Stronger distortion adds a rough edge.",
    },
  ],
} as const;

export type ToneId = (typeof INSTRUMENT_PRESETS.tone)[number]["id"];
export type ShapeId = (typeof INSTRUMENT_PRESETS.shape)[number]["id"];
export type FilterId = (typeof INSTRUMENT_PRESETS.filter)[number]["id"];
export type EffectId = (typeof INSTRUMENT_PRESETS.effect)[number]["id"];

export type InstrumentSound = {
  tone: ToneId;
  shape: ShapeId;
  filter: FilterId;
  effect: EffectId;
};

export const DEFAULT_INSTRUMENT_SOUND: InstrumentSound = {
  tone: "sine",
  shape: "steady",
  filter: "open",
  effect: "dry",
};
