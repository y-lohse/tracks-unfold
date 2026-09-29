import { useState } from "react";
import { PuzzleIcon, type PuzzleIconName } from "./PuzzleIcon";
import styles from "./MainMenu.module.css";

const puzzles: readonly {
  id: PuzzleIconName;
  title: string;
  label: string;
  placement: string;
}[] = [
  {
    id: "navigation",
    title: "Navigation",
    label: "Note navigation",
    placement: "col-start-2 row-start-1",
  },
  {
    id: "imitation",
    title: "Imitation",
    label: "Imitation",
    placement: "col-start-1 row-start-2",
  },
  {
    id: "rhythm",
    title: "Rhythm",
    label: "Rhythm performance",
    placement: "col-start-2 row-start-2",
  },
  {
    id: "contours",
    title: "Contours",
    label: "Tonal contours",
    placement: "col-start-3 row-start-2",
  },
  {
    id: "intervals",
    title: "Intervals",
    label: "Interval identification",
    placement: "col-start-1 row-start-3",
  },
];

type MainMenuProps = {
  navigationProgress?: number;
  imitationProgress?: number;
  onOpenNoteNavigation?: () => void;
  onOpenImitation?: () => void;
  onOpenSettings?: () => void;
};

export function MainMenu({
  navigationProgress = 0,
  imitationProgress = 0,
  onOpenNoteNavigation,
  onOpenImitation,
  onOpenSettings,
}: MainMenuProps) {
  const [upcoming, setUpcoming] = useState<PuzzleIconName | null>(null);
  const branchOpen = navigationProgress >= 0.2;
  const intervalsOpen = branchOpen && imitationProgress >= 0.6;
  const selected = puzzles.find((puzzle) => puzzle.id === upcoming);

  if (selected) {
    const requirement =
      selected.id === "intervals"
        ? "Reach 60% in Imitation to unlock."
        : "Reach 20% in Navigation to unlock.";
    const met = selected.id === "intervals" ? intervalsOpen : branchOpen;
    return (
      <main className="bg-canvas text-ink min-h-svh px-6 py-8">
        <div className="mx-auto max-w-md">
          <button
            type="button"
            onClick={() => setUpcoming(null)}
            className="text-muted focus-visible:outline-accent min-h-11 cursor-pointer text-sm focus-visible:outline-2"
          >
            ← Back
          </button>
          <PuzzleIcon
            name={selected.id}
            className="text-accent mt-10 h-16 w-16"
          />
          <h1 className="mt-6 text-2xl font-semibold">{selected.label}</h1>
          <p className="text-muted mt-4 text-sm">Coming soon.</p>
          {!met && <p className="text-muted mt-4 text-sm">{requirement}</p>}
        </div>
      </main>
    );
  }

  return (
    <main
      className={`${styles.menu} bg-canvas text-ink min-h-svh px-4 py-8 sm:px-8`}
    >
      <div className="mx-auto max-w-lg">
        <header className="relative flex min-h-11 items-center justify-center px-11">
          <h1 className="text-center text-xl font-medium tracking-tight">
            Tracks Unfold
          </h1>
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="Settings"
            className="text-muted focus-visible:outline-accent absolute top-0 right-0 flex size-11 cursor-pointer items-center justify-center rounded-full focus-visible:outline-2"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className={`${styles.lockIcon} size-5`}
            >
              <path
                d="M9.5 3h5l.6 2.5 2 1.2 2.5-.8 2.5 4.2-1.9 1.9v2.3l1.9 1.8-2.5 4.3-2.5-.8-2 1.1-.6 2.5h-5l-.6-2.5-2-1.1-2.5.8L1.9 16l1.9-1.8V12l-1.9-1.9 2.5-4.2 2.5.8 2-1.2Z"
                transform="translate(1.2 -.6) scale(.9)"
              />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </header>
        <section
          aria-label="Puzzle tree"
          className="relative mt-14 grid grid-cols-3 gap-y-20"
        >
          <svg
            aria-hidden="true"
            className={`${styles.connections} pointer-events-none absolute inset-0 h-full w-full`}
            viewBox="0 0 300 496"
            preserveAspectRatio="none"
          >
            <path
              className={branchOpen ? styles.openConnection : undefined}
              d="M150 112 V148 M50 192 V148 H250 V192 M150 148 V192"
            />
            <path
              className={intervalsOpen ? styles.openConnection : undefined}
              d="M50 304 V384"
            />
          </svg>
          {puzzles.map((puzzle) => {
            const locked =
              puzzle.id === "navigation"
                ? false
                : puzzle.id === "intervals"
                  ? !intervalsOpen
                  : !branchOpen;
            const available =
              puzzle.id === "navigation" || puzzle.id === "imitation";
            const onClick =
              puzzle.id === "navigation"
                ? onOpenNoteNavigation
                : puzzle.id === "imitation"
                  ? onOpenImitation
                  : () => setUpcoming(puzzle.id);
            return (
              <button
                key={puzzle.id}
                type="button"
                onClick={onClick}
                aria-label={`Open ${puzzle.label}${locked ? ", locked" : !available ? ", coming soon" : ""}`}
                className={`${puzzle.placement} ${styles.treeNode} focus-visible:outline-accent relative flex h-28 min-w-0 cursor-pointer flex-col items-center gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4`}
              >
                <span
                  className={`${styles.tile} ${locked ? styles.locked : ""} relative flex h-18 w-18 shrink-0 items-center justify-center rounded-2xl`}
                >
                  <PuzzleIcon name={puzzle.id} className="h-12 w-12" />
                  {locked && (
                    <span className="bg-canvas text-muted absolute -right-1 -bottom-1 rounded-full p-1.5">
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 16 16"
                        className={`${styles.lockIcon} h-3 w-3`}
                      >
                        <rect x="4" y="7" width="8" height="7" rx="1" />
                        <path d="M5 7 V5 A3 3 0 0 1 11 5 V7" />
                      </svg>
                    </span>
                  )}
                </span>
                <span
                  className={`bg-canvas px-1 text-xs ${locked ? "text-muted" : "text-ink"}`}
                >
                  {puzzle.title}
                </span>
              </button>
            );
          })}
        </section>
      </div>
    </main>
  );
}
