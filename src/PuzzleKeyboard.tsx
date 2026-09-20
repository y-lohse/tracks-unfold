import { noteToMidi, type Note } from "./noteNavigation";
import styles from "./PuzzleKeyboard.module.css";

const blackKeys = [
  { offset: 1, position: styles.wideRight },
  { offset: 3, position: styles.wideLeft },
  { offset: 6, position: styles.wideRight },
  { offset: 8, position: styles.centered },
  { offset: 10, position: styles.wideLeft },
] as const;

const whiteKeys = [0, 2, 4, 5, 7, 9, 11] as const;

type Marker = {
  note: Note;
  label?: string;
  role: "start" | "destination";
};

type PuzzleKeyboardProps = {
  start: Note;
  destination: Note;
  revealDestinationLabel: boolean;
  octaves?: readonly number[];
};

function markerAt(midi: number, markers: readonly Marker[]) {
  return markers.find((marker) => noteToMidi(marker.note) === midi);
}

function KeyFace({ black, marker }: { black: boolean; marker?: Marker }) {
  const markerClass =
    marker?.role === "start"
      ? styles.start
      : marker?.role === "destination"
        ? styles.destination
        : "";

  return (
    <span className={`${styles.key} ${markerClass}`}>
      <span
        className={`${styles.dot} ${black ? styles.blackDot : styles.whiteDot}`}
      >
        {marker?.label ? (
          <span className={styles.label}>{marker.label}</span>
        ) : null}
      </span>
    </span>
  );
}

function Octave({ octave, markers }: { octave: number; markers: Marker[] }) {
  const baseMidi = (octave + 1) * 12;

  return (
    <div className={styles.octave} aria-label={`Octave ${octave}`}>
      <ol className={styles.row}>
        {blackKeys.map(({ offset, position }) => (
          <li className={`${styles.keySlot} ${position}`} key={offset}>
            <KeyFace black marker={markerAt(baseMidi + offset, markers)} />
          </li>
        ))}
      </ol>
      <ol className={styles.row}>
        {whiteKeys.map((offset) => {
          const marker = markerAt(baseMidi + offset, markers);
          return (
            <li className={`${styles.keySlot} ${styles.whiteKey}`} key={offset}>
              <KeyFace black={false} marker={marker} />
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function PuzzleKeyboard({
  start,
  destination,
  revealDestinationLabel,
  octaves = [3, 4, 5],
}: PuzzleKeyboardProps) {
  const markers: Marker[] = [
    { note: start, label: renderKeyboardLabel(start), role: "start" },
    {
      note: destination,
      ...(revealDestinationLabel
        ? { label: renderKeyboardLabel(destination) }
        : {}),
      role: "destination",
    },
  ];

  return (
    <figure className={styles.instrument} aria-hidden="true">
      {octaves.map((octave) => (
        <Octave key={octave} octave={octave} markers={markers} />
      ))}
    </figure>
  );
}

function renderKeyboardLabel(note: Note) {
  const accidental =
    note.accidental === "sharp" ? "♯" : note.accidental === "flat" ? "♭" : "";
  return `${note.letter}${accidental}${note.octave}`;
}
