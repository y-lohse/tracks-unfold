import range from "lodash-es/range.js";

export const MIDI_C3 = 48;
export const MIDI_B5 = 83;

export type Pitch = number;

export interface PitchPresentation {
  readonly midi: Pitch;
  readonly pitchClass: number;
  readonly octave: number;
  readonly displayLabel: string;
  readonly audioName: string;
}

const AUDIO_NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
] as const;

const DISPLAY_NAMES = [
  "C",
  "C♯",
  "D",
  "D♯",
  "E",
  "F",
  "F♯",
  "G",
  "G♯",
  "A",
  "A♯",
  "B",
] as const;

export function isPitch(value: unknown): value is Pitch {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= MIDI_C3 &&
    value <= MIDI_B5
  );
}

export function pitch(value: number): Pitch {
  if (!isPitch(value)) {
    throw new RangeError(
      `Pitch must be an integer from ${MIDI_C3} to ${MIDI_B5}`,
    );
  }
  return value;
}

export function pitchPresentation(value: Pitch): PitchPresentation {
  const midi = pitch(value);
  const pitchClass = midi % 12;
  const octave = Math.floor(midi / 12) - 1;
  return {
    midi,
    pitchClass,
    octave,
    displayLabel: `${DISPLAY_NAMES[pitchClass]}${octave}`,
    audioName: `${AUDIO_NAMES[pitchClass]}${octave}`,
  };
}

export function displayPitch(value: Pitch): string {
  return pitchPresentation(value).displayLabel;
}

export function audioPitchName(value: Pitch): string {
  return pitchPresentation(value).audioName;
}

export const IMITATION_PITCHES: readonly Pitch[] = Object.freeze(
  range(MIDI_C3, MIDI_B5 + 1),
);
