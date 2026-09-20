import { NOTE_NAVIGATION_TUNING, clamp01 } from "./tuning";
import type { Direction, DistanceUnit } from "./types";

export interface MovementCategory {
  readonly direction: Direction;
  readonly unit: DistanceUnit;
  readonly minimum: number;
  readonly maximum: number;
}

export interface NavigationMilestone {
  readonly number: number;
  readonly categories: readonly MovementCategory[];
}

type RangeMaximums = readonly [number, number, number, number];

const RANGE_MAXIMUMS: readonly RangeMaximums[] = [
  [1, 0, 0, 0],
  [2, 0, 0, 0],
  [2, 2, 0, 0],
  [3, 4, 0, 0],
  [4, 4, 2, 0],
  [5, 4, 3, 2],
  [6, 4, 4, 4],
  [6, 6, 6, 6],
  [6, 8, 6, 8],
  [6, 10, 6, 10],
  [6, 12, 6, 12],
];

const CATEGORY_IDENTITIES = [
  ["up", "wholeTones"],
  ["up", "semitones"],
  ["down", "wholeTones"],
  ["down", "semitones"],
] as const satisfies readonly (readonly [Direction, DistanceUnit])[];

export const NAVIGATION_MILESTONES: readonly NavigationMilestone[] =
  RANGE_MAXIMUMS.map((maximums, milestoneIndex) => ({
    number: milestoneIndex + 1,
    categories: maximums.flatMap((maximum, categoryIndex) => {
      if (maximum === 0) return [];
      const identity = CATEGORY_IDENTITIES[categoryIndex];
      if (identity === undefined) return [];
      return [
        {
          direction: identity[0],
          unit: identity[1],
          minimum: 1,
          maximum,
        },
      ];
    }),
  }));

export function navigationMilestoneForDemand(
  demand: number,
): NavigationMilestone {
  const normalized = clamp01(demand);
  const index = Math.min(
    NOTE_NAVIGATION_TUNING.navigationMilestoneCount - 1,
    Math.floor(normalized * NOTE_NAVIGATION_TUNING.navigationMilestoneCount),
  );
  const milestone = NAVIGATION_MILESTONES[index];
  if (milestone === undefined)
    throw new Error("Navigation milestone table is incomplete");
  return milestone;
}

export function categoryContainsSemitones(
  category: MovementCategory,
  semitones: number,
): boolean {
  const value = category.unit === "wholeTones" ? semitones / 2 : semitones;
  return (
    Number.isInteger(value) &&
    value >= category.minimum &&
    value <= category.maximum
  );
}
