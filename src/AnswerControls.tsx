import { useMemo, useState } from "react";

import {
  ACCIDENTALS,
  NAMED_INTERVALS,
  isInDisplayRange,
  noteKey,
  type Accidental,
  type AnswerChoice,
  type AnswerResult,
  type NavigationQuestion,
  type NoteLetter,
  type SubmittedAnswer,
} from "./noteNavigation";
import styles from "./AnswerControls.module.css";

type AnswerControlsProps = {
  question: NavigationQuestion;
  disabled: boolean;
  selected: SubmittedAnswer | null;
  result: AnswerResult | null;
  onSelect: (answer: SubmittedAnswer | null) => void;
};

type RadioState = "idle" | "selected" | "correct" | "incorrect";

function choiceToAnswer(choice: AnswerChoice): SubmittedAnswer {
  if (choice.kind === "note") return { kind: "note", value: choice.note };
  if (choice.kind === "numericalDistance") {
    return { kind: "numericalDistance", value: choice.value };
  }
  return { kind: "namedInterval", value: choice.interval.id };
}

function isSelected(choice: AnswerChoice, selected: SubmittedAnswer | null) {
  if (choice.kind !== selected?.kind) return false;
  if (choice.kind === "note" && selected.kind === "note") {
    return (
      typeof selected.value !== "string" &&
      choice.id === noteKey(selected.value)
    );
  }
  if (
    choice.kind === "numericalDistance" &&
    selected.kind === "numericalDistance"
  ) {
    return choice.value === selected.value;
  }
  return (
    choice.kind === "namedInterval" &&
    selected.kind === "namedInterval" &&
    choice.interval.id === selected.value
  );
}

function RadioButton({
  disabled,
  label,
  detail,
  onClick,
  state,
}: {
  disabled: boolean;
  label: string;
  detail?: string;
  onClick: () => void;
  state: RadioState;
}) {
  return (
    <button
      aria-pressed={state === "selected"}
      className={`${styles.radio} ${styles[state]}`}
      data-answer-state={state}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <span className={styles.switch} aria-hidden="true">
        <span className={styles.lamp} />
      </span>
      <span className={styles.radioText}>
        <span className={styles.radioLabel}>{label}</span>
        {detail ? <span className={styles.radioDetail}>{detail}</span> : null}
      </span>
    </button>
  );
}

function CuratedChoices({
  question,
  disabled,
  selected,
  result,
  onSelect,
}: AnswerControlsProps) {
  if (question.choices.mode !== "curated") return null;

  return (
    <div
      className={styles.choiceGrid}
      data-layout={question.choices.options.length === 3 ? "full" : "half"}
      aria-label="Answer choices"
    >
      {question.choices.options.map((choice) => {
        const selectedChoice = isSelected(choice, selected);
        const correctChoice = isSelected(choice, choiceToAnswerFor(question));
        const state: RadioState = result
          ? correctChoice
            ? "correct"
            : selectedChoice
              ? "incorrect"
              : "idle"
          : selectedChoice
            ? "selected"
            : "idle";

        return (
          <RadioButton
            detail={
              choice.kind === "namedInterval" ? choice.reminder : undefined
            }
            disabled={disabled}
            key={choice.id}
            label={choice.label}
            onClick={() => onSelect(choiceToAnswer(choice))}
            state={state}
          />
        );
      })}
    </div>
  );
}

function choiceToAnswerFor(question: NavigationQuestion): SubmittedAnswer {
  if (question.answer.kind === "note") {
    return { kind: "note", value: question.answer.note };
  }
  if (question.answer.kind === "numericalDistance") {
    return { kind: "numericalDistance", value: question.answer.value };
  }
  return { kind: "namedInterval", value: question.answer.interval.id };
}

const noteLetters = ["A", "B", "C", "D", "E", "F", "G"] as const;
const accidentalLabels: Record<Accidental, string> = {
  flat: "♭",
  natural: "♮",
  sharp: "♯",
};

function SelectorBank<T extends string | number>({
  label,
  values,
  value,
  disabled,
  render,
  onChange,
}: {
  label: string;
  values: readonly T[];
  value: T | null;
  disabled: boolean;
  render?: (value: T) => string;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className={styles.bank} disabled={disabled}>
      <legend>{label}</legend>
      <div className={styles.bankButtons}>
        {values.map((option) => (
          <button
            aria-pressed={value === option}
            className={`${styles.selector} ${value === option ? styles.engaged : ""}`}
            key={option}
            onClick={() => onChange(option)}
            type="button"
          >
            {render?.(option) ?? option}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function FullNoteControl({
  disabled,
  onSelect,
}: Pick<AnswerControlsProps, "disabled" | "onSelect">) {
  const [letter, setLetter] = useState<NoteLetter | null>(null);
  const [accidental, setAccidental] = useState<Accidental | null>(null);
  const [octave, setOctave] = useState<number | null>(null);

  const update = (
    nextLetter: NoteLetter | null,
    nextAccidental: Accidental | null,
    nextOctave: number | null,
  ) => {
    if (nextLetter && nextAccidental && nextOctave !== null) {
      const note = {
        letter: nextLetter,
        accidental: nextAccidental,
        octave: nextOctave,
      } as const;
      onSelect(isInDisplayRange(note) ? { kind: "note", value: note } : null);
    } else {
      onSelect(null);
    }
  };

  return (
    <div className={styles.composer}>
      <output className={styles.display} aria-live="polite">
        {letter ?? "–"}
        {accidental ? accidentalLabels[accidental] : "–"}
        {octave ?? "–"}
      </output>
      <SelectorBank
        disabled={disabled}
        label="Note"
        onChange={(value) => {
          setLetter(value);
          update(value, accidental, octave);
        }}
        value={letter}
        values={noteLetters}
      />
      <SelectorBank
        disabled={disabled}
        label="Accidental"
        onChange={(value) => {
          setAccidental(value);
          update(letter, value, octave);
        }}
        render={(value) => accidentalLabels[value]}
        value={accidental}
        values={ACCIDENTALS}
      />
      <SelectorBank
        disabled={disabled}
        label="Octave"
        onChange={(value) => {
          setOctave(value);
          update(letter, accidental, value);
        }}
        value={octave}
        values={[3, 4, 5]}
      />
    </div>
  );
}

function FullNumericalControl({
  question,
  disabled,
  selected,
  onSelect,
}: AnswerControlsProps) {
  if (question.answer.kind !== "numericalDistance") return null;
  const maximum = question.answer.unit === "wholeTones" ? 6 : 12;
  const selectedValue =
    selected?.kind === "numericalDistance" ? selected.value : null;

  return (
    <SelectorBank
      disabled={disabled}
      label={
        question.answer.unit === "wholeTones" ? "Whole tones" : "Semitones"
      }
      onChange={(value) =>
        onSelect({ kind: "numericalDistance", value: Number(value) })
      }
      value={selectedValue}
      values={Array.from({ length: maximum }, (_, index) => index + 1)}
    />
  );
}

const qualities = [
  "minor",
  "major",
  "perfect",
  "augmented",
  "diminished",
] as const;
type Quality = (typeof qualities)[number];
const intervalNumbers = [2, 3, 4, 5, 6, 7, 8] as const;

function FullIntervalControl({
  disabled,
  onSelect,
}: Pick<AnswerControlsProps, "disabled" | "onSelect">) {
  const [quality, setQuality] = useState<Quality | null>(null);
  const [number, setNumber] = useState<number | null>(null);
  const [tritone, setTritone] = useState(false);

  const selectedInterval = useMemo(
    () =>
      quality === null || number === null
        ? undefined
        : NAMED_INTERVALS.find(
            (interval) =>
              interval.number === number && interval.name.startsWith(quality),
          ),
    [number, quality],
  );

  const update = (nextQuality: Quality | null, nextNumber: number | null) => {
    const interval =
      nextQuality === null || nextNumber === null
        ? undefined
        : NAMED_INTERVALS.find(
            (candidate) =>
              candidate.number === nextNumber &&
              candidate.name.startsWith(nextQuality),
          );
    onSelect(interval ? { kind: "namedInterval", value: interval.id } : null);
  };

  return (
    <div className={styles.composer}>
      <output className={styles.display} aria-live="polite">
        {tritone ? "Tritone" : (selectedInterval?.name ?? "—")}
      </output>
      <RadioButton
        disabled={disabled}
        label="Tritone"
        onClick={() => {
          setTritone(true);
          setQuality(null);
          setNumber(null);
          onSelect({ kind: "namedInterval", value: "tritone" });
        }}
        state={tritone ? "selected" : "idle"}
      />
      <SelectorBank
        disabled={disabled}
        label="Quality"
        onChange={(value) => {
          setTritone(false);
          setQuality(value);
          update(value, number);
        }}
        value={quality}
        values={qualities}
      />
      <SelectorBank
        disabled={disabled}
        label="Number"
        onChange={(value) => {
          setTritone(false);
          setNumber(value);
          update(quality, value);
        }}
        value={number}
        values={intervalNumbers}
      />
    </div>
  );
}

export function AnswerControls(props: AnswerControlsProps) {
  if (props.question.choices.mode === "curated") {
    return <CuratedChoices {...props} />;
  }
  if (props.question.requestedAnswer === "note") {
    return (
      <FullNoteControl disabled={props.disabled} onSelect={props.onSelect} />
    );
  }
  if (props.question.requestedAnswer === "numericalDistance") {
    return <FullNumericalControl {...props} />;
  }
  return (
    <FullIntervalControl disabled={props.disabled} onSelect={props.onSelect} />
  );
}
