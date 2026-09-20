import {
  naturalDiatonicIndex,
  noteFromDiatonicIndex,
  noteToMidi,
  spellPitch,
} from "./notes";
import type {
  Direction,
  DistanceUnit,
  IntervalId,
  NamedInterval,
  Note,
} from "./types";

export const NAMED_INTERVALS: readonly NamedInterval[] = [
  {
    id: "M2",
    name: "major second",
    semitones: 2,
    number: 2,
    introductionGroup: 1,
  },
  {
    id: "M3",
    name: "major third",
    semitones: 4,
    number: 3,
    introductionGroup: 1,
  },
  {
    id: "m2",
    name: "minor second",
    semitones: 1,
    number: 2,
    introductionGroup: 2,
  },
  {
    id: "m3",
    name: "minor third",
    semitones: 3,
    number: 3,
    introductionGroup: 2,
  },
  {
    id: "P4",
    name: "perfect fourth",
    semitones: 5,
    number: 4,
    introductionGroup: 3,
  },
  {
    id: "P5",
    name: "perfect fifth",
    semitones: 7,
    number: 5,
    introductionGroup: 3,
  },
  {
    id: "P8",
    name: "perfect octave",
    semitones: 12,
    number: 8,
    introductionGroup: 3,
  },
  {
    id: "m6",
    name: "minor sixth",
    semitones: 8,
    number: 6,
    introductionGroup: 4,
  },
  {
    id: "M6",
    name: "major sixth",
    semitones: 9,
    number: 6,
    introductionGroup: 4,
  },
  {
    id: "m7",
    name: "minor seventh",
    semitones: 10,
    number: 7,
    introductionGroup: 5,
  },
  {
    id: "M7",
    name: "major seventh",
    semitones: 11,
    number: 7,
    introductionGroup: 5,
  },
  {
    id: "tritone",
    name: "tritone",
    semitones: 6,
    number: null,
    introductionGroup: 6,
  },
  {
    id: "A4",
    name: "augmented fourth",
    semitones: 6,
    number: 4,
    introductionGroup: 6,
  },
  {
    id: "d5",
    name: "diminished fifth",
    semitones: 6,
    number: 5,
    introductionGroup: 6,
  },
];

export function getInterval(id: IntervalId): NamedInterval {
  const interval = NAMED_INTERVALS.find((candidate) => candidate.id === id);
  if (interval === undefined) throw new Error(`Unknown interval: ${id}`);
  return interval;
}

export function intervalReminder(
  interval: NamedInterval,
  unit: DistanceUnit,
): string {
  if (unit === "semitones") {
    return `${interval.semitones} ${interval.semitones === 1 ? "semitone" : "semitones"}`;
  }
  const wholeTones = interval.semitones / 2;
  const value = Number.isInteger(wholeTones)
    ? String(wholeTones)
    : `${Math.floor(wholeTones)}½`;
  return `${value} ${wholeTones === 1 ? "whole tone" : "whole tones"}`;
}

export function transposeNamedInterval(
  start: Note,
  interval: NamedInterval | IntervalId,
  direction: Direction,
): Note | null {
  const resolved =
    typeof interval === "string" ? getInterval(interval) : interval;
  const sign = direction === "up" ? 1 : -1;
  const destinationMidi = noteToMidi(start) + sign * resolved.semitones;

  if (resolved.number === null) {
    return spellPitch(destinationMidi, direction === "up" ? "sharp" : "flat");
  }

  const targetDiatonicIndex =
    naturalDiatonicIndex(start) + sign * (resolved.number - 1);
  const natural = noteFromDiatonicIndex(targetDiatonicIndex, "natural");
  const accidentalOffset = destinationMidi - noteToMidi(natural);
  if (accidentalOffset < -1 || accidentalOffset > 1) return null;
  return {
    ...natural,
    accidental:
      accidentalOffset === -1
        ? "flat"
        : accidentalOffset === 1
          ? "sharp"
          : "natural",
  };
}

export function identifyNamedInterval(
  start: Note,
  end: Note,
): NamedInterval | null {
  const semitones = Math.abs(noteToMidi(end) - noteToMidi(start));
  if (semitones < 1 || semitones > 12) return null;
  const diatonicDistance =
    Math.abs(naturalDiatonicIndex(end) - naturalDiatonicIndex(start)) + 1;
  return (
    NAMED_INTERVALS.find(
      (interval) =>
        interval.number === diatonicDistance &&
        interval.semitones === semitones,
    ) ?? null
  );
}

export function intervalDirection(start: Note, end: Note): Direction | null {
  const difference = noteToMidi(end) - noteToMidi(start);
  if (difference === 0) return null;
  return difference > 0 ? "up" : "down";
}
