import range from "lodash-es/range.js";
import times from "lodash-es/times.js";

import { MIDI_B5, MIDI_C3, isPitch, type Pitch } from "../music";
import { choose, randomIndex } from "../random";
import {
  checkResponse,
  exactAnchoredReconstruction,
  signedMovements,
} from "./checker";
import {
  contractForPrecision,
  listeningBudgets,
  normalizeControls,
  settingsForControls,
} from "./controls";
import type {
  ActualImitationSettings,
  AnchorPositionSetting,
  ImitationControls,
  ImitationPuzzle,
  ImitationSkill,
  MovementRangeSetting,
  PitchSelectionSetting,
  Rng,
  TranspositionSetting,
} from "./types";

export type GenerationFailureReason =
  "incompatibleConfiguration" | "attemptsExhausted";

export class ImitationGenerationError extends Error {
  readonly reason: GenerationFailureReason;
  readonly attempts: number;

  constructor(reason: GenerationFailureReason, message: string, attempts = 0) {
    super(message);
    this.name = "ImitationGenerationError";
    this.reason = reason;
    this.attempts = attempts;
  }
}

export interface GenerateImitationPuzzleOptions {
  readonly id: string;
  readonly controls: ImitationControls;
  readonly targetedSkills?: Readonly<Partial<Record<ImitationSkill, number>>>;
  readonly rng: Rng;
  readonly recentReferencePitches?: readonly (readonly Pitch[])[];
  readonly maxAttempts?: number;
}

function movementBounds(setting: MovementRangeSetting): {
  maximum: number;
  requiredMinimum: number;
} {
  if (setting === "small") return { maximum: 2, requiredMinimum: 1 };
  if (setting === "medium") return { maximum: 5, requiredMinimum: 3 };
  return { maximum: 12, requiredMinimum: 6 };
}

function randomMagnitude(maximum: number, rng: Rng): number {
  return randomIndex(maximum, rng) + 1;
}

function movementDirections(
  settings: ActualImitationSettings,
  rng: Rng,
): number[] {
  const count = settings.phraseLength - 1;
  const first = choose([-1, 1] as const, rng);
  const contour = settings.contourStructure;
  let directions: number[];

  if (
    contour === "oneDirectionNoRepeats" ||
    contour === "oneDirectionWithRepeats"
  ) {
    directions = Array<number>(count).fill(first);
  } else if (
    contour === "oneTurnNoRepeats" ||
    contour === "oneTurnWithRepeats"
  ) {
    const turnAfter = randomIndex(count - 1, rng) + 1;
    directions = times(count, (index) => (index < turnAfter ? first : -first));
  } else {
    directions = times(count, (index) => (index % 2 === 0 ? first : -first));
  }

  if (
    contour === "oneDirectionWithRepeats" ||
    contour === "oneTurnWithRepeats"
  ) {
    const eligible = directions
      .map((_, index) => index)
      .filter((index) => {
        if (contour !== "oneTurnWithRepeats") return true;
        const without = directions.filter(
          (_, candidate) => candidate !== index,
        );
        return without.some(
          (value, candidate) =>
            candidate > 0 && value !== without[candidate - 1],
        );
      });
    directions[choose(eligible, rng)] = 0;
  }
  return directions;
}

function sampleMovements(
  settings: ActualImitationSettings,
  rng: Rng,
): number[] {
  const directions = movementDirections(settings, rng);
  const { maximum, requiredMinimum } = movementBounds(
    settings.referenceMovementRange,
  );
  const nonzeroIndices = directions
    .map((direction, index) => (direction === 0 ? -1 : index))
    .filter((index) => index >= 0);
  const requiredIndex = choose(nonzeroIndices, rng);
  return directions.map((direction, index) => {
    if (direction === 0) return 0;
    const magnitude =
      index === requiredIndex
        ? requiredMinimum + randomIndex(maximum - requiredMinimum + 1, rng)
        : randomMagnitude(maximum, rng);
    return direction * magnitude;
  });
}

function phraseFromMovements(
  movements: readonly number[],
  rng: Rng,
): Pitch[] | null {
  const offsets = [0];
  for (const movement of movements) {
    offsets.push(offsets[offsets.length - 1]! + movement);
  }
  const minimumStart = MIDI_C3 - Math.min(...offsets);
  const maximumStart = MIDI_B5 - Math.max(...offsets);
  if (minimumStart > maximumStart) return null;
  const centralMinimum = Math.max(minimumStart, MIDI_C3 + 5);
  const centralMaximum = Math.min(maximumStart, MIDI_B5 - 5);
  const low = centralMinimum <= centralMaximum ? centralMinimum : minimumStart;
  const high = centralMinimum <= centralMaximum ? centralMaximum : maximumStart;
  const start = low + randomIndex(high - low + 1, rng);
  return offsets.map((offset) => start + offset);
}

function anchorIndexFor(
  setting: AnchorPositionSetting,
  length: number,
  rng: Rng,
): number {
  if (setting === "first") return 0;
  if (setting === "last") return length - 1;
  const lower = Math.floor((length - 1) / 2);
  const upper = Math.ceil((length - 1) / 2);
  return lower === upper ? lower : choose([lower, upper], rng);
}

function rangesOverlap(a: readonly number[], b: readonly number[]): boolean {
  return Math.max(...a) >= Math.min(...b) && Math.max(...b) >= Math.min(...a);
}

function shiftsFor(
  setting: TranspositionSetting,
  reference: readonly Pitch[],
): number[] {
  if (setting === "none") return [0];
  const candidates = range(-12, 13).filter(
    (shift) =>
      shift !== 0 &&
      reference.every((value) => isPitch(value + shift)) &&
      (setting === "octave" ? Math.abs(shift) === 12 : Math.abs(shift) !== 12),
  );
  if (setting === "octave") return candidates;
  return candidates.filter((shift) => {
    const shifted = reference.map((value) => value + shift);
    const overlap = rangesOverlap(reference, shifted);
    return setting === "overlappingNonOctave" ? overlap : !overlap;
  });
}

const SURPLUS_CHOICES_PER_DIRECTION = 2;

function hasDirectionalCapacity(
  supply: ReadonlySet<number>,
  anchor: Pitch,
  minimumChoicesPerDirection: number,
): boolean {
  let below = 0;
  let above = 0;
  for (const candidate of supply) {
    if (candidate < anchor) below += 1;
    if (candidate > anchor) above += 1;
  }
  return (
    below >= minimumChoicesPerDirection && above >= minimumChoicesPerDirection
  );
}

function enabledSupply(
  setting: PitchSelectionSetting,
  exact: readonly Pitch[],
  reference: readonly Pitch[],
  anchor: Pitch,
): Pitch[] | null {
  const editableSlots = exact.length - 1;
  const minimumChoicesPerDirection =
    editableSlots + SURPLUS_CHOICES_PER_DIRECTION;
  if (setting === "fullKeyboard") {
    const supply = new Set(range(MIDI_C3, MIDI_B5 + 1));
    const pitchesBelow = anchor - MIDI_C3;
    const pitchesAbove = MIDI_B5 - anchor;
    return Math.abs(pitchesBelow - pitchesAbove) <= 1 &&
      hasDirectionalCapacity(supply, anchor, minimumChoicesPerDirection)
      ? [...supply]
      : null;
  }

  const seeds = new Set<number>(exact);
  if (setting === "expanded") {
    for (const value of reference) seeds.add(value);
    for (const value of exact) {
      for (let offset = -2; offset <= 2; offset += 1) {
        if (isPitch(value + offset)) seeds.add(value + offset);
      }
    }
  }

  const supply = new Set<number>([anchor]);
  const addSymmetricPair = (candidate: number): boolean => {
    const mirror = anchor * 2 - candidate;
    if (!isPitch(candidate) || !isPitch(mirror)) return false;
    supply.add(candidate);
    supply.add(mirror);
    return true;
  };
  for (const candidate of seeds) {
    if (!addSymmetricPair(candidate)) return null;
  }
  for (
    let offset = 1;
    !hasDirectionalCapacity(supply, anchor, minimumChoicesPerDirection);
    offset += 1
  ) {
    if (!addSymmetricPair(anchor + offset)) return null;
  }
  return [...supply].sort((left, right) => left - right);
}

function countTurns(movements: readonly number[]): number {
  const directions = movements
    .filter((movement) => movement !== 0)
    .map(Math.sign);
  return directions
    .slice(1)
    .filter((value, index) => value !== directions[index]).length;
}

function samePhrase(
  left: readonly number[],
  right: readonly number[],
): boolean {
  return (
    left.length === right.length &&
    left.every((pitch, index) => pitch === right[index])
  );
}

function satisfiesGeneratedRequirements(
  puzzle: ImitationPuzzle,
  movements: readonly number[],
): boolean {
  const { maximum, requiredMinimum } = movementBounds(
    puzzle.settings.referenceMovementRange,
  );
  const nonzero = movements.filter((movement) => movement !== 0);
  const turnCount = countTurns(movements);
  const repetitionCount = movements.length - nonzero.length;
  const contour = puzzle.settings.contourStructure;
  const contourValid =
    contour === "oneDirectionNoRepeats"
      ? turnCount === 0 && repetitionCount === 0
      : contour === "oneDirectionWithRepeats"
        ? turnCount === 0 && repetitionCount > 0
        : contour === "oneTurnNoRepeats"
          ? turnCount === 1 && repetitionCount === 0
          : contour === "oneTurnWithRepeats"
            ? turnCount === 1 && repetitionCount > 0
            : turnCount >= 2;
  const rangeValid =
    nonzero.length > 0 &&
    nonzero.every((movement) => Math.abs(movement) <= maximum) &&
    nonzero.some((movement) => Math.abs(movement) >= requiredMinimum);
  const witness = checkResponse(puzzle, puzzle.exactReconstruction);
  const supply = new Set<number>(puzzle.enabledPitches);

  return (
    contourValid &&
    rangeValid &&
    puzzle.referencePitches.length === puzzle.settings.phraseLength &&
    puzzle.referencePitches.every(isPitch) &&
    puzzle.exactReconstruction.every(isPitch) &&
    puzzle.exactReconstruction.every((value) => supply.has(value)) &&
    supply.has(puzzle.anchorPitch) &&
    witness.accepted &&
    witness.exact
  );
}

function validateConfiguration(settings: ActualImitationSettings): void {
  if (
    settings.contourStructure === "multipleTurns" &&
    settings.phraseLength < 4
  ) {
    throw new ImitationGenerationError(
      "incompatibleConfiguration",
      "Multiple turns require at least four pitches",
    );
  }
  if (
    settings.contourStructure === "oneTurnWithRepeats" &&
    settings.phraseLength < 4
  ) {
    throw new ImitationGenerationError(
      "incompatibleConfiguration",
      "A required turn and repetition require at least four pitches",
    );
  }
}

export function generateImitationPuzzle(
  options: GenerateImitationPuzzleOptions,
): ImitationPuzzle {
  const requestedControls = normalizeControls(options.controls);
  const settings = settingsForControls(requestedControls);
  validateConfiguration(settings);
  const maxAttempts = Math.max(1, Math.floor(options.maxAttempts ?? 128));
  const contract = contractForPrecision(settings.intervalPrecision);
  const recent = options.recentReferencePitches ?? [];

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const movements = sampleMovements(settings, options.rng);
    const referencePitches = phraseFromMovements(movements, options.rng);
    if (referencePitches === null) continue;
    if (recent.some((phrase) => samePhrase(phrase, referencePitches))) continue;
    const anchorIndex = anchorIndexFor(
      settings.anchorPosition,
      settings.phraseLength,
      options.rng,
    );
    const shifts = shiftsFor(settings.transposition, referencePitches);
    if (shifts.length === 0) continue;
    const anchorShift = choose(shifts, options.rng);
    const anchorPitch = referencePitches[anchorIndex]! + anchorShift;
    if (!isPitch(anchorPitch)) continue;

    let exactReconstruction: Pitch[];
    try {
      exactReconstruction = exactAnchoredReconstruction(
        referencePitches,
        anchorIndex,
        anchorPitch,
      );
    } catch {
      continue;
    }
    const enabledPitches = enabledSupply(
      settings.pitchSelectionDemand,
      exactReconstruction,
      referencePitches,
      anchorPitch,
    );
    if (enabledPitches === null) continue;
    const puzzle: ImitationPuzzle = {
      id: options.id,
      requestedControls,
      settings,
      referencePitches,
      anchorIndex,
      anchorPitch,
      enabledPitches,
      contract,
      budgets: listeningBudgets(settings),
      exactReconstruction,
      features: {
        signedMovements: signedMovements(referencePitches),
        tolerance: contract.kind === "tolerance" ? contract.tolerance : null,
        enabledPitches,
        anchorIndex,
        anchorPitch,
        anchorShift,
        turnCount: countTurns(movements),
        repetitionCount: movements.filter((movement) => movement === 0).length,
        maximumMovement: Math.max(...movements.map(Math.abs)),
      },
      targetedSkills: options.targetedSkills ?? {},
    };
    if (satisfiesGeneratedRequirements(puzzle, movements)) return puzzle;
  }

  throw new ImitationGenerationError(
    "attemptsExhausted",
    `Could not generate a valid Imitation puzzle in ${maxAttempts} attempts`,
    maxAttempts,
  );
}
