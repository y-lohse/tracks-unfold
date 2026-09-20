import type { KeyboardEvent, PointerEvent } from "react";

import styles from "./Keyboard.module.css";

const blackKeys = [
  { note: "C sharp", position: styles.wideRight },
  { note: "D sharp", position: styles.wideLeft },
  { note: "F sharp", position: styles.wideRight },
  { note: "G sharp", position: styles.centered },
  { note: "A sharp", position: styles.wideLeft },
] as const;

const whiteKeys = ["C", "D", "E", "F", "G", "A", "B"] as const;

type BlackNote = (typeof blackKeys)[number]["note"];
type WhiteNote = (typeof whiteKeys)[number];

export type KeyboardNote = BlackNote | WhiteNote;
export type KeyboardLabels = Partial<Record<KeyboardNote, string>>;

type KeyboardProps = {
  labels?: KeyboardLabels;
  disabledNotes?: readonly KeyboardNote[];
  onNoteAttack?: (note: KeyboardNote) => void;
  onNoteRelease?: (note: KeyboardNote) => void;
};

function KeyLabel({ label }: { label?: string }) {
  if (!label) return null;

  return <span className="text-sm font-semibold sm:text-base">{label}</span>;
}

export function Keyboard({
  labels,
  disabledNotes = [],
  onNoteAttack,
  onNoteRelease,
}: KeyboardProps) {
  const isDisabled = (note: KeyboardNote) => disabledNotes.includes(note);
  const attackWithPointer = (
    event: PointerEvent<HTMLButtonElement>,
    note: KeyboardNote,
  ) => {
    if (event.button !== 0 || isDisabled(note)) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    onNoteAttack?.(note);
  };
  const releaseWithPointer = (note: KeyboardNote) => {
    if (!isDisabled(note)) onNoteRelease?.(note);
  };
  const attackWithKeyboard = (
    event: KeyboardEvent<HTMLButtonElement>,
    note: KeyboardNote,
  ) => {
    if (
      !isDisabled(note) &&
      !event.repeat &&
      (event.key === " " || event.key === "Enter")
    ) {
      event.preventDefault();
      onNoteAttack?.(note);
    }
  };
  const releaseWithKeyboard = (
    event: KeyboardEvent<HTMLButtonElement>,
    note: KeyboardNote,
  ) => {
    if (!isDisabled(note) && (event.key === " " || event.key === "Enter")) {
      event.preventDefault();
      onNoteRelease?.(note);
    }
  };

  return (
    <figure
      className={`${styles.keyboard} m-0 w-full`}
      aria-label="One octave keyboard"
    >
      <ol className={`${styles.row} list-none p-0`} aria-label="Black keys">
        {blackKeys.map(({ note, position }) => (
          <li className={`${styles.keySlot} ${position}`} key={note}>
            <button
              aria-label={note}
              className={styles.key}
              disabled={isDisabled(note)}
              onKeyDown={(event) => attackWithKeyboard(event, note)}
              onKeyUp={(event) => releaseWithKeyboard(event, note)}
              onPointerCancel={() => releaseWithPointer(note)}
              onPointerDown={(event) => attackWithPointer(event, note)}
              onPointerUp={() => releaseWithPointer(note)}
              type="button"
            >
              <span
                className={`${styles.dot} ${styles.blackDot}`}
                aria-hidden="true"
              >
                <KeyLabel label={labels?.[note]} />
              </span>
            </button>
          </li>
        ))}
      </ol>

      <ol className={`${styles.row} list-none p-0`} aria-label="White keys">
        {whiteKeys.map((note) => (
          <li className={`${styles.keySlot} ${styles.whiteKey}`} key={note}>
            <button
              aria-label={note}
              className={styles.key}
              disabled={isDisabled(note)}
              onKeyDown={(event) => attackWithKeyboard(event, note)}
              onKeyUp={(event) => releaseWithKeyboard(event, note)}
              onPointerCancel={() => releaseWithPointer(note)}
              onPointerDown={(event) => attackWithPointer(event, note)}
              onPointerUp={() => releaseWithPointer(note)}
              type="button"
            >
              <span
                className={`${styles.dot} ${styles.whiteDot}`}
                aria-hidden="true"
              >
                <KeyLabel label={labels?.[note]} />
              </span>
            </button>
          </li>
        ))}
      </ol>
    </figure>
  );
}
