import { NAMED_INTERVALS, intervalReminder } from "./intervals";
import { noteKey, noteToMidi, renderNote, spellPitch } from "./notes";
import { shuffled } from "./random";
import { NOTE_NAVIGATION_TUNING, clamp01 } from "./tuning";
import type {
  AnswerChoice,
  CorrectAnswer,
  DistanceUnit,
  IntervalChoice,
  Rng,
} from "./types";

export function answerChoiceCount(breadth: number): 3 | 4 | 6 | "full" {
  const value = clamp01(breadth);
  const thresholds = NOTE_NAVIGATION_TUNING.curatedChoiceThresholds;
  if (value >= thresholds.full) return "full";
  if (value >= thresholds.six) return 6;
  if (value >= thresholds.four) return 4;
  return 3;
}

function numericalLabel(value: number, unit: DistanceUnit): string {
  const singular = unit === "semitones" ? "semitone" : "whole tone";
  return `${value} ${value === 1 ? singular : `${singular}s`}`;
}

function correctChoice(
  answer: CorrectAnswer,
  reminderUnit: DistanceUnit | undefined,
): AnswerChoice {
  if (answer.kind === "note") {
    return {
      kind: "note",
      id: noteKey(answer.note),
      note: answer.note,
      label: renderNote(answer.note),
    };
  }
  if (answer.kind === "numericalDistance") {
    return {
      kind: "numericalDistance",
      id: `${answer.unit}:${answer.value}`,
      value: answer.value,
      unit: answer.unit,
      label: numericalLabel(answer.value, answer.unit),
    };
  }
  return {
    kind: "namedInterval",
    id: answer.interval.id,
    interval: answer.interval,
    label: answer.interval.name,
    ...(reminderUnit
      ? { reminder: intervalReminder(answer.interval, reminderUnit) }
      : {}),
  };
}

function distractorPool(
  answer: CorrectAnswer,
  reminderUnit: DistanceUnit | undefined,
): AnswerChoice[] {
  if (answer.kind === "note") {
    const answerMidi = noteToMidi(answer.note);
    const pitches: AnswerChoice[] = [];
    for (
      let midi = NOTE_NAVIGATION_TUNING.displayMidiMin;
      midi <= NOTE_NAVIGATION_TUNING.displayMidiMax;
      midi += 1
    ) {
      if (midi === answerMidi) continue;
      const note = spellPitch(midi, midi > answerMidi ? "sharp" : "flat");
      pitches.push({
        kind: "note",
        id: noteKey(note),
        note,
        label: renderNote(note),
      });
    }
    return pitches;
  }
  if (answer.kind === "numericalDistance") {
    const maximum = answer.unit === "wholeTones" ? 6 : 12;
    return Array.from({ length: maximum }, (_, index) => index + 1)
      .filter((value) => value !== answer.value)
      .map((value) => ({
        kind: "numericalDistance" as const,
        id: `${answer.unit}:${value}`,
        value,
        unit: answer.unit,
        label: numericalLabel(value, answer.unit),
      }));
  }
  return NAMED_INTERVALS.filter((interval) => {
    if (interval.id === answer.interval.id) return false;
    // A generic and specifically spelled tritone cannot compete as single answers.
    if (interval.semitones === 6 && answer.interval.semitones === 6)
      return false;
    return true;
  }).map<IntervalChoice>((interval) => ({
    kind: "namedInterval",
    id: interval.id,
    interval,
    label: interval.name,
    ...(reminderUnit
      ? { reminder: intervalReminder(interval, reminderUnit) }
      : {}),
  }));
}

export function buildAnswerChoices(
  answer: CorrectAnswer,
  breadth: number,
  rng: Rng,
  intervalReminderUnit?: DistanceUnit,
):
  | { readonly mode: "curated"; readonly options: readonly AnswerChoice[] }
  | { readonly mode: "full" } {
  const requestedCount = answerChoiceCount(breadth);
  if (requestedCount === "full") return { mode: "full" };
  const correct = correctChoice(answer, intervalReminderUnit);
  const distractors = shuffled(
    distractorPool(answer, intervalReminderUnit),
    rng,
  ).slice(0, requestedCount - 1);
  return { mode: "curated", options: shuffled([correct, ...distractors], rng) };
}
