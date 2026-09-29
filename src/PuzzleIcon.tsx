import styles from "./PuzzleIcon.module.css";

const paths = {
  navigation: "M12 32 H50 M38 20 L50 32 L38 44 M18 20 V44",
  imitation: "M14 38 V26 M24 46 V18 M40 38 V26 M50 46 V18",
  rhythm: "M12 34 H21 L27 16 L37 48 L43 30 H52",
  contours: "M12 44 L25 24 L38 36 L52 16",
  intervals: "M20 42 V24 H28 M44 22 V40 H36 M20 42 H12 M44 22 H52",
};

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
