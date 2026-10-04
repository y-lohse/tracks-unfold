import { useState, type CSSProperties } from "react";
import { PuzzleIcon } from "./PuzzleIcon";
import { PUZZLES, PUZZLE_IDS } from "./puzzleCatalog";
import {
  isPuzzleUnlocked,
  puzzleRequirements,
  type PuzzleId,
  type Unlocks,
} from "./progression";
import styles from "./MainMenu.module.css";

// Rows retain the original Navigation → three branches → Intervals arrangement.
const positions: Record<PuzzleId, { column: number; row: number }> = {
  navigation: { column: 1, row: 0 },
  imitation: { column: 0, row: 1 },
  rhythm: { column: 1, row: 1 },
  contours: { column: 2, row: 1 },
  intervals: { column: 0, row: 2 },
  chordfall: { column: 1, row: 2 },
  scaleConveyors: { column: 2, row: 2 },
  chordDraft: { column: 0, row: 3 },
  voicingSculpture: { column: 1, row: 3 },
  tonalSwitchboard: { column: 2, row: 3 },
  melodyTrails: { column: 0, row: 4 },
  numeralDominoes: { column: 1, row: 4 },
  progressionWordle: { column: 0, row: 5 },
  harmonyFitting: { column: 1, row: 5 },
  coverVersions: { column: 2, row: 5 },
};

const shortTitles: Partial<Record<PuzzleId, string>> = {
  navigation: "Navigation",
  rhythm: "Rhythm",
  contours: "Contours",
  intervals: "Intervals",
};

type NodePosition = CSSProperties & {
  "--tree-column": number;
  "--tree-row": number;
};

function connectionPath(source: PuzzleId, target: PuzzleId) {
  const from = positions[source];
  const to = positions[target];
  const x1 = from.column * 100 + 50;
  const x2 = to.column * 100 + 50;
  // Match the original h-28 nodes and gap-y-20 spacing in the SVG coordinate space.
  const y1 = from.row * 192 + 112;
  const y2 = to.row * 192;
  if (to.row === from.row + 1) {
    return `M${x1} ${y1} V${y1 + 36} H${x2} V${y2}`;
  }
  // Long dependencies use the gutters instead of passing through intervening tiles.
  const gutter =
    from.column === to.column
      ? [4, 200, 296][from.column]
      : from.column < to.column
        ? (from.column + 1) * 100
        : from.column * 100;
  return `M${x1} ${y1} V${y1 + 36} H${gutter} V${y2 - 44} H${x2} V${y2}`;
}

function Requirements({
  puzzle,
  unlocks,
}: {
  puzzle: PuzzleId;
  unlocks: Unlocks;
}) {
  const routes = puzzleRequirements(puzzle, unlocks);
  if (routes.length === 0)
    return <p className="text-muted text-xs">Available from the start</p>;
  return (
    <div className="space-y-3 text-xs">
      {routes.map((route, index) => (
        <div key={route.label}>
          {index > 0 && <p className="text-accent mb-2 font-semibold">OR</p>}
          <p className="text-muted mb-1 font-medium">
            {routes.length > 1 ? `${route.label} · ` : ""}
            {route.requirements.length > 1 ? "All required" : "Requires"}
          </p>
          <ul className="space-y-1">
            {route.requirements.map(({ source, threshold, earned }) => (
              <li
                key={source}
                className={earned ? "text-success" : "text-muted"}
              >
                {earned ? "✓ " : ""}
                {PUZZLES[source].title} ≥ {Math.round(threshold * 100)}%
                {earned && <span className="sr-only"> — earned</span>}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

type MainMenuProps = {
  unlocks?: Unlocks;
  onOpenNoteNavigation?: () => void;
  onOpenImitation?: () => void;
  onOpenSettings?: () => void;
  onOpenInstrument?: () => void;
};

export function MainMenu({
  unlocks = [],
  onOpenNoteNavigation,
  onOpenImitation,
  onOpenSettings,
  onOpenInstrument,
}: MainMenuProps) {
  const [upcoming, setUpcoming] = useState<PuzzleId | null>(null);
  if (upcoming) {
    const selected = PUZZLES[upcoming];

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
          <PuzzleIcon name={upcoming} className="text-accent mt-10 size-16" />
          <h1 className="mt-6 text-2xl font-semibold">{selected.title}</h1>
          <p className="text-muted mt-4 text-sm">Coming soon.</p>
          <p className="mt-4 text-sm leading-relaxed">{selected.description}</p>
          <div className="border-rule mt-8 space-y-4 border-t pt-6">
            <Requirements puzzle={upcoming} unlocks={unlocks} />

            {upcoming === "coverVersions" && (
              <p className="text-muted text-xs leading-relaxed">
                Either route earns access to Cover versions. Chord and melody
                forms have separate requirements; one route does not establish
                readiness for both.
              </p>
            )}
          </div>
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
            onClick={onOpenInstrument}
            aria-label="Instrument"
            className="text-muted focus-visible:outline-accent absolute top-0 left-0 flex size-11 cursor-pointer items-center justify-center rounded-full focus-visible:outline-2"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            >
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="M9 5v14M15 5v14M6 5v8h3M12 5v8h3M18 5v8h3" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="Settings"
            className="text-muted focus-visible:outline-accent absolute top-0 right-0 flex size-11 cursor-pointer items-center justify-center rounded-full focus-visible:outline-2"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className={`${styles.lineIcon} size-5`}
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
            viewBox="0 0 300 1072"
            preserveAspectRatio="none"
          >
            {PUZZLE_IDS.flatMap((target) =>
              puzzleRequirements(target, unlocks).flatMap((route) =>
                route.requirements.map(({ source, earned }) => (
                  <path
                    key={`${target}-${route.label}-${source}`}
                    data-source={source}
                    data-target={target}
                    className={earned ? styles.openConnection : undefined}
                    d={connectionPath(source, target)}
                  />
                )),
              ),
            )}
          </svg>
          {[...PUZZLE_IDS]
            .sort(
              (a, b) =>
                positions[a].row - positions[b].row ||
                positions[a].column - positions[b].column,
            )
            .map((id) => {
              const puzzle = PUZZLES[id];
              const locked = !isPuzzleUnlocked(id, unlocks);
              const position: NodePosition = {
                "--tree-column": positions[id].column + 1,
                "--tree-row": positions[id].row + 1,
              };
              return (
                <button
                  key={id}
                  type="button"
                  style={position}
                  onClick={
                    id === "navigation"
                      ? onOpenNoteNavigation
                      : id === "imitation"
                        ? onOpenImitation
                        : () => setUpcoming(id)
                  }
                  aria-label={`Open ${puzzle.title}${locked ? ", locked" : !puzzle.implemented ? ", coming soon" : ""}`}
                  className={`${styles.treeNode} focus-visible:outline-accent relative flex h-28 min-w-0 cursor-pointer flex-col items-center gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4`}
                >
                  <span
                    className={`${styles.tile} ${locked ? styles.locked : ""} relative flex size-18 shrink-0 items-center justify-center rounded-2xl`}
                  >
                    <PuzzleIcon name={id} className="size-12" />
                    {locked && (
                      <span className="bg-canvas text-muted absolute -right-1 -bottom-1 rounded-full p-1.5">
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 16 16"
                          className={`${styles.lineIcon} size-3`}
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
                    {shortTitles[id] ?? puzzle.title}
                  </span>
                </button>
              );
            })}
        </section>
      </div>
    </main>
  );
}
