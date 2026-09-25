import styles from "./PuzzleKeyboard.module.css";

const blackKeys = [
  { offset: 1, position: styles.wideRight },
  { offset: 3, position: styles.wideLeft },
  { offset: 6, position: styles.wideRight },
  { offset: 8, position: styles.centered },
  { offset: 10, position: styles.wideLeft },
] as const;

const whiteKeys = [0, 2, 4, 5, 7, 9, 11] as const;
const pitchClassLabels = [
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

export type PuzzleKeyboardMarker = {
  pitch: number;
  label?: string;
  role: "primary" | "secondary";
};

type PuzzleKeyboardProps = {
  octaves: readonly number[];
  markers?: readonly PuzzleKeyboardMarker[];
  enabledPitches?: ReadonlySet<number>;
  soundingPitch?: number;
  showPitchLabels?: boolean;
  onPitchPress?: (pitch: number) => void;
};

function markerAt(pitch: number, markers: readonly PuzzleKeyboardMarker[]) {
  return markers.find((marker) => marker.pitch === pitch);
}

function accessiblePitchLabel(pitch: number) {
  const pitchClass = ((pitch % 12) + 12) % 12;
  const octave = Math.floor(pitch / 12) - 1;
  return `${pitchClassLabels[pitchClass]}${octave}`;
}

function KeyFace({
  black,
  enabled,
  marker,
  onPress,
  pitch,
  sounding,
  showPitchLabel,
}: {
  black: boolean;
  enabled: boolean;
  marker?: PuzzleKeyboardMarker;
  onPress?: (pitch: number) => void;
  pitch: number;
  sounding: boolean;
  showPitchLabel: boolean;
}) {
  const markerClass =
    marker?.role === "primary"
      ? styles.primary
      : marker?.role === "secondary"
        ? styles.secondary
        : "";
  const className = [
    styles.key,
    markerClass,
    sounding ? styles.sounding : "",
    enabled ? "" : styles.unavailable,
  ]
    .filter(Boolean)
    .join(" ");
  const visibleLabel =
    marker?.label ?? (showPitchLabel ? accessiblePitchLabel(pitch) : undefined);
  const face = (
    <span
      className={`${styles.dot} ${black ? styles.blackDot : styles.whiteDot}`}
    >
      {visibleLabel ? (
        <span className={styles.label}>{visibleLabel}</span>
      ) : null}
    </span>
  );

  if (onPress) {
    return (
      <button
        aria-label={accessiblePitchLabel(pitch)}
        aria-pressed={sounding}
        className={className}
        disabled={!enabled}
        onClick={() => onPress(pitch)}
        type="button"
      >
        {face}
      </button>
    );
  }

  return <span className={className}>{face}</span>;
}

function Octave({
  enabledPitches,
  markers,
  octave,
  onPitchPress,
  soundingPitch,
  showPitchLabels,
}: {
  enabledPitches?: ReadonlySet<number>;
  markers: readonly PuzzleKeyboardMarker[];
  octave: number;
  onPitchPress?: (pitch: number) => void;
  soundingPitch?: number;
  showPitchLabels: boolean;
}) {
  const basePitch = (octave + 1) * 12;
  const keyFace = (offset: number, black: boolean) => {
    const pitch = basePitch + offset;
    return (
      <KeyFace
        black={black}
        enabled={enabledPitches?.has(pitch) ?? true}
        marker={markerAt(pitch, markers)}
        onPress={onPitchPress}
        pitch={pitch}
        sounding={soundingPitch === pitch}
        showPitchLabel={showPitchLabels}
      />
    );
  };

  return (
    <div className={styles.octave} aria-label={`Octave ${octave}`}>
      <ol className={styles.row}>
        {blackKeys.map(({ offset, position }) => (
          <li className={`${styles.keySlot} ${position}`} key={offset}>
            {keyFace(offset, true)}
          </li>
        ))}
      </ol>
      <ol className={styles.row}>
        {whiteKeys.map((offset) => (
          <li className={`${styles.keySlot} ${styles.whiteKey}`} key={offset}>
            {keyFace(offset, false)}
          </li>
        ))}
      </ol>
    </div>
  );
}

export function PuzzleKeyboard({
  enabledPitches,
  markers = [],
  octaves,
  onPitchPress,
  showPitchLabels = false,
  soundingPitch,
}: PuzzleKeyboardProps) {
  const interactive = onPitchPress !== undefined;

  return (
    <figure
      className={styles.instrument}
      {...(!interactive && { "aria-hidden": true })}
    >
      {octaves.map((octave) => (
        <Octave
          enabledPitches={enabledPitches}
          key={octave}
          markers={markers}
          octave={octave}
          onPitchPress={onPitchPress}
          showPitchLabels={showPitchLabels}
          soundingPitch={soundingPitch}
        />
      ))}
    </figure>
  );
}
