import { NOTE_NAVIGATION_TUNING } from "./tuning";
import type { Accidental, Note, NoteLetter } from "./types";

export const NOTE_LETTERS = ["C", "D", "E", "F", "G", "A", "B"] as const;
export const ACCIDENTALS = ["flat", "natural", "sharp"] as const;

const NATURAL_PITCH_CLASSES: Readonly<Record<NoteLetter, number>> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

const ACCIDENTAL_OFFSETS: Readonly<Record<Accidental, number>> = {
  flat: -1,
  natural: 0,
  sharp: 1,
};

const SHARP_NAMES = [
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
const FLAT_NAMES = [
  "C",
  "Db",
  "D",
  "Eb",
  "E",
  "F",
  "Gb",
  "G",
  "Ab",
  "A",
  "Bb",
  "B",
] as const;

export function noteToMidi(note: Note): number {
  return (
    (note.octave + 1) * 12 +
    NATURAL_PITCH_CLASSES[note.letter] +
    ACCIDENTAL_OFFSETS[note.accidental]
  );
}

export function isInDisplayRange(note: Note): boolean {
  const midi = noteToMidi(note);
  return (
    midi >= NOTE_NAVIGATION_TUNING.displayMidiMin &&
    midi <= NOTE_NAVIGATION_TUNING.displayMidiMax
  );
}

export function parseNote(value: string): Note {
  const match = /^([A-Ga-g])([#♯b♭]?)(-?\d+)$/.exec(value.trim());
  if (match === null) throw new Error(`Invalid note: ${value}`);
  const rawLetter = match[1];
  const rawOctave = match[3];
  if (rawLetter === undefined || rawOctave === undefined)
    throw new Error(`Invalid note: ${value}`);
  const accidentalToken = match[2] ?? "";
  const accidental: Accidental =
    accidentalToken === "#" || accidentalToken === "♯"
      ? "sharp"
      : accidentalToken === "b" || accidentalToken === "♭"
        ? "flat"
        : "natural";
  return {
    letter: rawLetter.toUpperCase() as NoteLetter,
    accidental,
    octave: Number.parseInt(rawOctave, 10),
  };
}

export function renderNote(note: Note, unicode = true): string {
  const accidental =
    note.accidental === "sharp"
      ? unicode
        ? "♯"
        : "#"
      : note.accidental === "flat"
        ? unicode
          ? "♭"
          : "b"
        : "";
  return `${note.letter}${accidental}${note.octave}`;
}

export function noteKey(note: Note): string {
  return renderNote(note, false);
}

export function sameWrittenNote(left: Note, right: Note): boolean {
  return noteKey(left) === noteKey(right);
}

export function areEnharmonic(left: Note, right: Note): boolean {
  return noteToMidi(left) === noteToMidi(right);
}

export function spellPitch(
  midi: number,
  preference: "sharp" | "flat" = "sharp",
): Note {
  if (!Number.isInteger(midi))
    throw new RangeError("MIDI pitch must be an integer");
  const pitchClass = ((midi % 12) + 12) % 12;
  const name = (preference === "sharp" ? SHARP_NAMES : FLAT_NAMES)[pitchClass];
  if (name === undefined)
    throw new Error("Pitch-class spelling table is incomplete");
  const note = parseNote(`${name}${Math.floor(midi / 12) - 1}`);
  return note;
}

export function spellingsForMidi(midi: number): Note[] {
  const results: Note[] = [];
  for (let octave = 2; octave <= 6; octave += 1) {
    for (const letter of NOTE_LETTERS) {
      for (const accidental of ACCIDENTALS) {
        const note: Note = { letter, accidental, octave };
        if (noteToMidi(note) === midi) results.push(note);
      }
    }
  }
  return results;
}

export function allDisplayNotes(): Note[] {
  const notes: Note[] = [];
  for (
    let midi = NOTE_NAVIGATION_TUNING.displayMidiMin;
    midi <= NOTE_NAVIGATION_TUNING.displayMidiMax;
    midi += 1
  ) {
    notes.push(
      ...spellingsForMidi(midi).filter(
        (note) => note.octave >= 3 && note.octave <= 5,
      ),
    );
  }
  return notes;
}

export function naturalDiatonicIndex(note: Note): number {
  const letterIndex = NOTE_LETTERS.indexOf(note.letter);
  return note.octave * 7 + letterIndex;
}

export function noteFromDiatonicIndex(
  index: number,
  accidental: Accidental,
): Note {
  const letterIndex = ((index % 7) + 7) % 7;
  const letter = NOTE_LETTERS[letterIndex];
  if (letter === undefined)
    throw new Error("Diatonic note table is incomplete");
  return { letter, accidental, octave: Math.floor(index / 7) };
}
