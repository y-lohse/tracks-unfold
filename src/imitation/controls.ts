import mapValues from "lodash-es/mapValues.js";

import { clampUnit } from "../utils/numbers";
import type {
  ActualImitationSettings,
  ImitationControls,
  RelationshipContract,
} from "./types";

const CONTOURS = [
  "oneDirectionNoRepeats",
  "oneDirectionWithRepeats",
  "oneTurnNoRepeats",
  "oneTurnWithRepeats",
  "multipleTurns",
] as const;
const LENGTHS = [3, 4, 5, 6] as const;
const PRECISIONS = [
  "direction",
  "tolerance3",
  "tolerance2",
  "tolerance1",
  "exact",
] as const;
const PITCH_SELECTION = ["curated", "expanded", "fullKeyboard"] as const;
const ANCHORS = ["first", "last", "middle"] as const;
const TRANSPOSITIONS = [
  "none",
  "octave",
  "separatedNonOctave",
  "overlappingNonOctave",
] as const;
const REFERENCE_PLAYS = ["unlimited", "three", "two", "one"] as const;
const AUDITIONS = [
  "unlimited",
  "threePerEditable",
  "onePerEditable",
  "none",
] as const;
const MOVEMENT_RANGES = ["small", "medium", "wide"] as const;

const CONTROL_THRESHOLDS = {
  contourStructure: [0, 0.05, 0.34, 0.62, 0.79],
  phraseLength: [0, 0.17, 0.46, 0.72],
  intervalPrecision: [0, 0.065, 0.3, 0.56, 0.8],
  pitchSelectionDemand: [0, 0.08, 0.67],
  anchorPosition: [0, 0.34, 0.73],
  transposition: [0, 0.095, 0.46, 0.68],
  referencePlays: [0, 0.28, 0.55, 0.78],
  pitchAuditions: [0, 0.3, 0.62, 0.82],
  referenceMovementRange: [0, 0.21, 0.64],
} as const;

export const DEFAULT_IMITATION_CONTROLS: ImitationControls = {
  contourStructure: 0,
  phraseLength: 0,
  intervalPrecision: 0,
  pitchSelectionDemand: 0,
  anchorPosition: 0,
  transposition: 0,
  referencePlays: 0,
  pitchAuditions: 0,
  referenceMovementRange: 0,
};

export const clampControl = clampUnit;

export function normalizeControls(
  controls: ImitationControls,
): ImitationControls {
  return mapValues(controls, clampControl) as ImitationControls;
}

function categoryIndex(value: number, thresholds: readonly number[]): number {
  const normalized = clampControl(value);
  let index = 0;
  for (let candidate = 1; candidate < thresholds.length; candidate += 1) {
    if (normalized < thresholds[candidate]!) break;
    index = candidate;
  }
  return index;
}

function category<T>(
  value: number,
  settings: readonly T[],
  thresholds: readonly number[],
): T {
  const index = categoryIndex(value, thresholds);
  return settings[Math.min(index, settings.length - 1)] as T;
}

const CONTROL_STAGING_ORDER = [
  "contourStructure",
  "intervalPrecision",
  "transposition",
  "pitchSelectionDemand",
  "phraseLength",
  "referenceMovementRange",
  "anchorPosition",
  "referencePlays",
  "pitchAuditions",
] as const satisfies readonly (keyof ImitationControls)[];

export interface StagedImitationControls {
  readonly controls: ImitationControls;
  readonly nextCursor: number;
}

export function stageImitationControls(
  previous: ImitationControls | undefined,
  desired: ImitationControls,
  cursor = 0,
  maximumCategoryChanges = 2,
): StagedImitationControls {
  const normalizedDesired = normalizeControls(desired);
  if (!previous) return { controls: normalizedDesired, nextCursor: cursor };

  const normalizedPrevious = normalizeControls(previous);
  const changed = new Set(
    CONTROL_STAGING_ORDER.filter(
      (control) =>
        categoryIndex(
          normalizedPrevious[control],
          CONTROL_THRESHOLDS[control],
        ) !==
        categoryIndex(normalizedDesired[control], CONTROL_THRESHOLDS[control]),
    ),
  );
  const selected: (keyof ImitationControls)[] = [];
  let nextCursor = cursor;
  for (
    let offset = 0;
    offset < CONTROL_STAGING_ORDER.length &&
    selected.length < maximumCategoryChanges;
    offset += 1
  ) {
    const index = (cursor + offset) % CONTROL_STAGING_ORDER.length;
    const control = CONTROL_STAGING_ORDER[index]!;
    if (!changed.has(control)) continue;
    selected.push(control);
    nextCursor = (index + 1) % CONTROL_STAGING_ORDER.length;
  }

  const selectedControls = new Set(selected);
  const controls = Object.fromEntries(
    CONTROL_STAGING_ORDER.map((control) => {
      if (!changed.has(control)) return [control, normalizedDesired[control]];
      if (!selectedControls.has(control)) {
        return [control, normalizedPrevious[control]];
      }
      const thresholds = CONTROL_THRESHOLDS[control];
      const previousCategory = categoryIndex(
        normalizedPrevious[control],
        thresholds,
      );
      const desiredCategory = categoryIndex(
        normalizedDesired[control],
        thresholds,
      );
      const step = Math.sign(desiredCategory - previousCategory);
      const nextCategory = previousCategory + step;
      const value =
        nextCategory === desiredCategory
          ? normalizedDesired[control]
          : thresholds[nextCategory]!;
      return [control, value];
    }),
  ) as unknown as Record<keyof ImitationControls, number>;

  const stagedSettings = settingsForControls(controls);
  if (
    stagedSettings.transposition === "separatedNonOctave" &&
    stagedSettings.referenceMovementRange === "wide"
  ) {
    controls.referenceMovementRange = normalizedPrevious.referenceMovementRange;
  }

  return { controls, nextCursor };
}

export function settingsForControls(
  requested: ImitationControls,
): ActualImitationSettings {
  const controls = normalizeControls(requested);
  return {
    contourStructure: category(
      controls.contourStructure,
      CONTOURS,
      CONTROL_THRESHOLDS.contourStructure,
    ),
    phraseLength: category(
      controls.phraseLength,
      LENGTHS,
      CONTROL_THRESHOLDS.phraseLength,
    ),
    intervalPrecision: category(
      controls.intervalPrecision,
      PRECISIONS,
      CONTROL_THRESHOLDS.intervalPrecision,
    ),
    pitchSelectionDemand: category(
      controls.pitchSelectionDemand,
      PITCH_SELECTION,
      CONTROL_THRESHOLDS.pitchSelectionDemand,
    ),
    anchorPosition: category(
      controls.anchorPosition,
      ANCHORS,
      CONTROL_THRESHOLDS.anchorPosition,
    ),
    transposition: category(
      controls.transposition,
      TRANSPOSITIONS,
      CONTROL_THRESHOLDS.transposition,
    ),
    referencePlays: category(
      controls.referencePlays,
      REFERENCE_PLAYS,
      CONTROL_THRESHOLDS.referencePlays,
    ),
    pitchAuditions: category(
      controls.pitchAuditions,
      AUDITIONS,
      CONTROL_THRESHOLDS.pitchAuditions,
    ),
    referenceMovementRange: category(
      controls.referenceMovementRange,
      MOVEMENT_RANGES,
      CONTROL_THRESHOLDS.referenceMovementRange,
    ),
  };
}

export function contractForPrecision(
  precision: ActualImitationSettings["intervalPrecision"],
): RelationshipContract {
  if (precision === "direction") return { kind: "direction" };
  if (precision === "exact") return { kind: "exact" };
  const tolerance = Number(precision.at(-1)) as 1 | 2 | 3;
  return { kind: "tolerance", tolerance };
}

export function listeningBudgets(settings: ActualImitationSettings): {
  referencePlays: number | null;
  pitchAuditions: number | null;
} {
  const editableSlots = settings.phraseLength - 1;
  const referencePlays =
    settings.referencePlays === "unlimited"
      ? null
      : settings.referencePlays === "three"
        ? 3
        : settings.referencePlays === "two"
          ? 2
          : 1;
  const pitchAuditions =
    settings.pitchAuditions === "unlimited"
      ? null
      : settings.pitchAuditions === "threePerEditable"
        ? editableSlots * 3
        : settings.pitchAuditions === "onePerEditable"
          ? editableSlots
          : 0;
  return { referencePlays, pitchAuditions };
}
