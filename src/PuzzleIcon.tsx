import type { PuzzleId } from "./progression";
import styles from "./PuzzleIcon.module.css";

const paths = {
  navigation: "M12 32 H50 M38 20 L50 32 L38 44 M18 20 V44",
  imitation: "M14 38 V26 M24 46 V18 M40 38 V26 M50 46 V18",
  rhythm: "M12 34 H21 L27 16 L37 48 L43 30 H52",
  contours: "M12 44 L25 24 L38 36 L52 16",
  intervals: "M20 42 V24 H28 M44 22 V40 H36 M20 42 H12 M44 22 H52",
  chordfall:
    "M14 12 H24 V22 H14 Z M28 12 H38 V22 H28 Z M42 12 H52 V22 H42 Z M14 28 H24 V38 H14 Z M42 28 H52 V38 H42 Z M28 36 V52 M22 46 L28 52 L34 46",
  scaleConveyors:
    "M16 20 H46 L52 26 V40 L46 46 H18 L12 40 V26 Z M22 20 L28 26 L22 32 M34 34 L40 40 L34 46",
  chordDraft:
    "M12 22 H28 V48 H12 Z M24 14 H40 V40 M36 20 H52 V46 H40 M16 30 H24 M16 36 H24",
  voicingSculpture:
    "M12 18 H52 M12 32 H52 M12 46 H52 M20 12 V24 M42 26 V38 M30 40 V52",
  numeralDominoes:
    "M10 24 H32 V46 H10 Z M32 12 H54 V34 H32 M16 30 V40 M22 30 V40 M38 18 L42 28 L46 18",
  melodyTrails:
    "M12 44 L24 28 L36 36 L52 16 M12 39 V49 M24 23 V33 M36 31 V41 M52 11 V21",
  tonalSwitchboard:
    "M12 16 H24 L40 48 H52 M12 48 H24 L40 16 H52 M20 12 V20 M44 44 V52 M20 44 V52 M44 12 V20",
  coverVersions:
    "M12 14 H34 V38 H12 Z M30 26 H52 V50 H30 M18 22 H28 M18 28 H24 M36 34 H46 M36 40 H42",
  harmonyFitting:
    "M12 20 L24 12 L38 24 L52 16 M12 34 H24 V50 H12 Z M26 28 H38 V50 H26 Z M40 36 H52 V50 H40 Z",
  progressionWordle:
    "M12 12 H24 V24 H12 Z M28 12 H40 V24 H28 Z M44 12 H56 V24 H44 Z M12 32 H24 V44 H12 Z M28 32 H40 V44 H28 Z M46 38 L50 42 L56 32",
} satisfies Record<PuzzleId, string>;

export type PuzzleIconName = keyof typeof paths;

export function PuzzleIcon({
  name,
  className = "",
}: {
  name: PuzzleIconName;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 64 64"
      className={`${styles.icon} ${className}`}
    >
      <path d={paths[name]} />
    </svg>
  );
}
