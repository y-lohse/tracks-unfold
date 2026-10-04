import type { PuzzleId } from "./progression";

type PuzzleInfo = {
  title: string;
  implemented: boolean;
  description: string;
};

export const PUZZLES = {
  navigation: {
    title: "Note navigation",
    implemented: true,
    description: "Find notes and distances on a familiar keyboard.",
  },
  imitation: {
    title: "Imitation",
    implemented: true,
    description: "Listen to a phrase and reproduce its pitch relationships.",
  },
  rhythm: {
    title: "Rhythm performance",
    implemented: false,
    description:
      "Press, hold and release to bring rhythmic phrases to life. Pitch choice is yours.",
  },
  contours: {
    title: "Tonal contours",
    implemented: false,
    description:
      "Explore tonal home and complete a phrase against a musical backing.",
  },
  chordfall: {
    title: "Chordfall",
    implemented: false,
    description: "Build chords from exposed notes to clear a collapsing board.",
  },
  scaleConveyors: {
    title: "Scale conveyors",
    implemented: false,
    description:
      "Construct scales that move parcels together, then plan their deliveries.",
  },
  chordDraft: {
    title: "Chord draft",
    implemented: false,
    description:
      "Audition chords and recruit a lineup for a shared musical brief.",
  },
  intervals: {
    title: "Interval identification",
    implemented: false,
    description:
      "Connect heard pitch distances with interval names and semitone counts.",
  },
  voicingSculpture: {
    title: "Voicing sculpture",
    implemented: false,
    description:
      "Rearrange chord notes to fit a space while preserving their identity.",
  },
  numeralDominoes: {
    title: "Numeral dominoes",
    implemented: false,
    description:
      "Connect chords and Roman numerals into a playable progression.",
  },
  melodyTrails: {
    title: "Melody trails",
    implemented: false,
    description: "Choose a melodic path through a supplied musical setting.",
  },
  tonalSwitchboard: {
    title: "Tonal switchboard",
    implemented: false,
    description:
      "Change tonal contexts with shared switches to bring every signal home.",
  },
  coverVersions: {
    title: "Cover versions",
    implemented: false,
    description:
      "Transpose recordings using a shared, limited supply of chords or notes. Each form opens through its own route.",
  },
  harmonyFitting: {
    title: "Harmony fitting",
    implemented: false,
    description:
      "Find chords that support a melody and reach a requested ending.",
  },
  progressionWordle: {
    title: "Progression Wordle",
    implemented: false,
    description: "Listen, audition and deduce a hidden chord progression.",
  },
} as const satisfies Record<PuzzleId, PuzzleInfo>;

export const PUZZLE_IDS = Object.keys(PUZZLES) as PuzzleId[];
