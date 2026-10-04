export type PuzzleId =
  | "navigation"
  | "imitation"
  | "rhythm"
  | "contours"
  | "intervals"
  | "chordfall"
  | "scaleConveyors"
  | "chordDraft"
  | "voicingSculpture"
  | "numeralDominoes"
  | "melodyTrails"
  | "tonalSwitchboard"
  | "coverVersions"
  | "harmonyFitting"
  | "progressionWordle";

export type Unlocks = readonly string[];

export interface ProgressionStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem?(key: string): void;
}

const STORAGE_KEY = "tracks-unfold.progression.unlocks";
const STORAGE_VERSION = 1;

const PUZZLE_UNLOCK_IDS = {
  imitation: "puzzle:imitation",
  rhythm: "puzzle:rhythm",
  contours: "puzzle:contours",
  intervals: "puzzle:intervals",
  chordfall: "puzzle:chordfall",
  scaleConveyors: "puzzle:scale-conveyors",
  chordDraft: "puzzle:chord-draft",
  voicingSculpture: "puzzle:voicing-sculpture",
  numeralDominoes: "puzzle:numeral-dominoes",
  melodyTrails: "puzzle:melody-trails",
  tonalSwitchboard: "puzzle:tonal-switchboard",
  coverVersions: "puzzle:cover-versions",
  harmonyFitting: "puzzle:harmony-fitting",
  progressionWordle: "puzzle:progression-wordle",
} as const satisfies Record<Exclude<PuzzleId, "navigation">, string>;

type Requirement = { source: PuzzleId; threshold: number };
type UnlockRoute = { label: string; requirements: readonly Requirement[] };

const requirement = (source: PuzzleId, threshold: number): Requirement => ({
  source,
  threshold,
});
const all = (...requirements: Requirement[]): readonly UnlockRoute[] => [
  { label: "Requirements", requirements },
];

const PUZZLE_RULES: Record<PuzzleId, readonly UnlockRoute[]> = {
  navigation: [],
  imitation: all(requirement("navigation", 0.2)),
  rhythm: all(requirement("navigation", 0.2)),
  contours: all(requirement("navigation", 0.2)),
  intervals: all(requirement("imitation", 0.6)),
  chordfall: all(requirement("navigation", 0.35)),
  scaleConveyors: all(requirement("navigation", 0.35)),
  chordDraft: all(requirement("imitation", 0.3)),
  voicingSculpture: all(requirement("chordfall", 0.35)),
  numeralDominoes: all(
    requirement("scaleConveyors", 0.35),
    requirement("chordfall", 0.35),
  ),
  melodyTrails: all(
    requirement("scaleConveyors", 0.35),
    requirement("imitation", 0.3),
  ),
  tonalSwitchboard: all(
    requirement("scaleConveyors", 0.45),
    requirement("contours", 0.35),
  ),
  coverVersions: [
    {
      label: "Chord covers",
      requirements: [requirement("numeralDominoes", 0.4)],
    },
    {
      label: "Melody covers",
      requirements: [
        requirement("scaleConveyors", 0.4),
        requirement("melodyTrails", 0.3),
      ],
    },
  ],
  harmonyFitting: all(
    requirement("chordfall", 0.4),
    requirement("numeralDominoes", 0.4),
  ),
  progressionWordle: all(
    requirement("chordDraft", 0.4),
    requirement("numeralDominoes", 0.4),
    requirement("contours", 0.35),
  ),
};

function readinessId({ source, threshold }: Requirement): string {
  return `readiness:${source}:${Math.round(threshold * 100)}`;
}

/** Alternatives are OR routes; every requirement within a route is required. */
export function puzzleRequirements(puzzle: PuzzleId, unlocks: Unlocks) {
  return PUZZLE_RULES[puzzle].map(({ label, requirements }) => ({
    label,
    requirements: requirements.map((item) => ({
      ...item,
      earned: unlocks.includes(readinessId(item)),
    })),
  }));
}

const REWARD_RULES = {
  navigation: [
    { id: "reward:navigation:33", threshold: 0.33 },
    { id: "reward:navigation:66", threshold: 0.66 },
    { id: "reward:navigation:100", threshold: 1 },
  ],
  imitation: [
    { id: "reward:imitation:33", threshold: 0.33 },
    { id: "reward:imitation:66", threshold: 0.66 },
    { id: "reward:imitation:100", threshold: 1 },
  ],
  rhythm: [],
  contours: [],
  intervals: [],
  chordfall: [],
  scaleConveyors: [],
  chordDraft: [],
  voicingSculpture: [],
  numeralDominoes: [],
  melodyTrails: [],
  tonalSwitchboard: [],
  coverVersions: [],
  harmonyFitting: [],
  progressionWordle: [],
} as const satisfies Record<
  PuzzleId,
  readonly { id: string; threshold: number }[]
>;

function isUnitNumber(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 1
  );
}

export function profileProgress(
  profile: Readonly<Record<string, { readonly proficiency: number }>>,
): number {
  const assessments = Object.values(profile);
  if (assessments.length === 0) return 0;
  return (
    assessments.reduce(
      (sum, { proficiency }) =>
        sum + (isUnitNumber(proficiency) ? proficiency : 0),
      0,
    ) / assessments.length
  );
}

export function rewardMilestones(
  puzzle: PuzzleId,
  unlocks: Unlocks,
): readonly { id: string; threshold: number; earned: boolean }[] {
  return REWARD_RULES[puzzle].map(({ id, threshold }) => ({
    id,
    threshold,
    earned: unlocks.includes(id),
  }));
}

export function isPuzzleUnlocked(puzzle: PuzzleId, unlocks: Unlocks): boolean {
  return puzzle === "navigation" || unlocks.includes(PUZZLE_UNLOCK_IDS[puzzle]);
}

export function reconcileUnlocks(
  unlocks: Unlocks,
  progress: Partial<Record<PuzzleId, number>>,
): Unlocks {
  const earned = new Set(unlocks);
  // Retain individual thresholds so AND gates work across partial reports and reloads.
  for (const routes of Object.values(PUZZLE_RULES)) {
    for (const { requirements } of routes) {
      for (const item of requirements) {
        const current = progress[item.source];
        if (isUnitNumber(current) && current >= item.threshold)
          earned.add(readinessId(item));
      }
    }
  }
  for (const puzzle of Object.keys(PUZZLE_UNLOCK_IDS) as Exclude<
    PuzzleId,
    "navigation"
  >[]) {
    if (
      PUZZLE_RULES[puzzle].some(({ requirements }) =>
        requirements.every((item) => earned.has(readinessId(item))),
      )
    ) {
      earned.add(PUZZLE_UNLOCK_IDS[puzzle]);
    }
  }
  for (const puzzle of Object.keys(REWARD_RULES) as PuzzleId[]) {
    const current = progress[puzzle];
    if (!isUnitNumber(current)) continue;
    for (const { id, threshold } of REWARD_RULES[puzzle]) {
      if (current >= threshold) earned.add(id);
    }
  }
  return [...earned];
}

function isUnlocks(value: unknown): value is Unlocks {
  return (
    Array.isArray(value) &&
    value.every((id) => typeof id === "string" && id.trim().length > 0)
  );
}

export function loadUnlocks(storage: ProgressionStorage): Unlocks {
  const serialized = storage.getItem(STORAGE_KEY);
  if (serialized === null) return [];
  try {
    const payload: unknown = JSON.parse(serialized);
    if (typeof payload !== "object" || payload === null) return [];
    if (!("version" in payload) || payload.version !== STORAGE_VERSION)
      return [];
    if (!("unlocks" in payload) || !isUnlocks(payload.unlocks)) return [];
    return [...new Set(payload.unlocks)];
  } catch {
    return [];
  }
}

export function saveUnlocks(
  unlocks: Unlocks,
  storage: ProgressionStorage,
): void {
  if (!isUnlocks(unlocks)) throw new TypeError("Invalid unlock IDs");
  storage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      version: STORAGE_VERSION,
      unlocks: [...new Set(unlocks)],
    }),
  );
}

export function clearUnlocks(storage: ProgressionStorage): void {
  if (storage.removeItem) storage.removeItem(STORAGE_KEY);
  else saveUnlocks([], storage);
}
