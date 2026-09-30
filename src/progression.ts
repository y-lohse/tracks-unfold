export type PuzzleId =
  "navigation" | "imitation" | "rhythm" | "contours" | "intervals";

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
} as const;

const PUZZLE_RULES: readonly {
  source: PuzzleId;
  threshold: number;
  id: string;
}[] = [
  { source: "navigation", threshold: 0.2, id: PUZZLE_UNLOCK_IDS.imitation },
  { source: "navigation", threshold: 0.2, id: PUZZLE_UNLOCK_IDS.rhythm },
  { source: "navigation", threshold: 0.2, id: PUZZLE_UNLOCK_IDS.contours },
  { source: "imitation", threshold: 0.6, id: PUZZLE_UNLOCK_IDS.intervals },
];

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
  for (const { source, threshold, id } of PUZZLE_RULES) {
    const current = progress[source];
    if (isUnitNumber(current) && current >= threshold) earned.add(id);
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
