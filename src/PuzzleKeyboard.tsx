import { useEffect, useRef } from "react";

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
  soundingPitches?: ReadonlySet<number>;
  showPitchLabels?: boolean;
  onPitchPress?: (pitch: number) => void;
  onPitchRelease?: (pitch: number) => void;
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
  onRelease,
  pitch,
  sounding,
  showPitchLabel,
}: {
  black: boolean;
  enabled: boolean;
  marker?: PuzzleKeyboardMarker;
  onPress?: (pitch: number) => void;
  onRelease?: (pitch: number) => void;
  pitch: number;
  sounding: boolean;
  showPitchLabel: boolean;
}) {
  const sustained = Boolean(onPress && onRelease);
  const inputs = useRef(new Set<string>());
  const releaseHeld = useRef<(() => void) | undefined>(undefined);
  const suppressClick = useRef(false);
  const clickTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  const syntheticReleaseTimer = useRef<
    ReturnType<typeof setTimeout> | undefined
  >(undefined);

  function attack(input: string) {
    if (!enabled || !onPress || !onRelease || inputs.current.has(input)) return;
    const first = inputs.current.size === 0;
    inputs.current.add(input);
    if (first) {
      releaseHeld.current = () => onRelease(pitch);
      onPress(pitch);
    }
  }

  function release(input: string) {
    if (!inputs.current.delete(input) || inputs.current.size > 0) return;
    const notify = releaseHeld.current;
    releaseHeld.current = undefined;
    notify?.();
  }

  function allowSyntheticClickAfterKeyboard() {
    clearTimeout(clickTimer.current);
    // Native keyboard clicks occur before the next task.
    clickTimer.current = setTimeout(() => {
      suppressClick.current = false;
    }, 0);
  }

  useEffect(() => {
    if (!sustained || !enabled) return;
    const heldInputs = inputs.current;
    function clearHeld() {
      heldInputs.clear();
      const notify = releaseHeld.current;
      releaseHeld.current = undefined;
      notify?.();
      clearTimeout(clickTimer.current);
      clearTimeout(syntheticReleaseTimer.current);
      suppressClick.current = false;
    }
    function onVisibilityChange() {
      if (document.visibilityState === "hidden") clearHeld();
    }
    window.addEventListener("blur", clearHeld);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("blur", clearHeld);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      clearHeld();
    };
  }, [sustained, enabled, pitch]);

  const markerClass =
    marker?.role === "primary"
      ? styles.primary
      : marker?.role === "secondary"
        ? styles.secondary
        : "";
  const className = [
    styles.key,
    sustained ? "touch-none select-none" : "",
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
        onClick={(event) => {
          if (!sustained) {
            onPress(pitch);
          } else if (event.detail === 0 && !suppressClick.current) {
            attack("click");
            clearTimeout(syntheticReleaseTimer.current);
            // Allow asynchronous audio startup before ending the audition.
            syntheticReleaseTimer.current = setTimeout(
              () => release("click"),
              180,
            );
          }
        }}
        {...(sustained && {
          onPointerDown: (event) => {
            if (event.button !== 0 || !enabled) return;
            event.preventDefault();
            event.currentTarget.setPointerCapture(event.pointerId);
            attack(`pointer:${event.pointerId}`);
          },
          onPointerUp: (event) => release(`pointer:${event.pointerId}`),
          onPointerCancel: (event) => release(`pointer:${event.pointerId}`),
          onLostPointerCapture: (event) =>
            release(`pointer:${event.pointerId}`),
          onKeyDown: (event) => {
            if (event.key !== " " && event.key !== "Enter") return;
            event.preventDefault();
            suppressClick.current = true;
            clearTimeout(clickTimer.current);
            if (!event.repeat) attack(`key:${event.key}`);
          },
          onKeyUp: (event) => {
            if (event.key !== " " && event.key !== "Enter") return;
            event.preventDefault();
            release(`key:${event.key}`);
            allowSyntheticClickAfterKeyboard();
          },
          onBlur: () => {
            clearTimeout(syntheticReleaseTimer.current);
            release("click");
            release("key: ");
            release("key:Enter");
            allowSyntheticClickAfterKeyboard();
          },
        })}
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
  onPitchRelease,
  soundingPitch,
  soundingPitches,
  showPitchLabels,
}: {
  enabledPitches?: ReadonlySet<number>;
  markers: readonly PuzzleKeyboardMarker[];
  octave: number;
  onPitchPress?: (pitch: number) => void;
  onPitchRelease?: (pitch: number) => void;
  soundingPitch?: number;
  soundingPitches?: ReadonlySet<number>;
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
        onRelease={onPitchRelease}
        pitch={pitch}
        sounding={
          soundingPitch === pitch || (soundingPitches?.has(pitch) ?? false)
        }
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
  onPitchRelease,
  showPitchLabels = false,
  soundingPitch,
  soundingPitches,
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
          onPitchRelease={onPitchRelease}
          showPitchLabels={showPitchLabels}
          soundingPitch={soundingPitch}
          soundingPitches={soundingPitches}
        />
      ))}
    </figure>
  );
}
