import { isPitch, pitch, type Pitch } from "../music";
import type {
  ImitationPuzzle,
  MovementCheck,
  RelationshipContract,
  SubmissionCheck,
  SubmissionIssue,
} from "./types";

export function signedMovements(pitches: readonly number[]): number[] {
  return pitches.slice(1).map((value, index) => value - pitches[index]!);
}

export function directionOf(movement: number): -1 | 0 | 1 {
  return movement === 0 ? 0 : movement > 0 ? 1 : -1;
}

export function exactAnchoredReconstruction(
  referencePitches: readonly Pitch[],
  anchorIndex: number,
  anchorPitch: Pitch,
): Pitch[] {
  if (referencePitches.length === 0) {
    throw new RangeError("A reference phrase cannot be empty");
  }
  if (
    !Number.isInteger(anchorIndex) ||
    referencePitches[anchorIndex] === undefined
  ) {
    throw new RangeError("Anchor index must identify a reference pitch");
  }
  const checkedAnchor = pitch(anchorPitch);
  const shift = checkedAnchor - referencePitches[anchorIndex];
  return referencePitches.map((value) => pitch(value + shift));
}

export function checkMovement(
  expected: number,
  entered: number,
  contract: RelationshipContract,
  movementIndex: number,
): MovementCheck {
  const directionMatches = directionOf(expected) === directionOf(entered);
  const exact = expected === entered;
  const sizeDifference = Math.abs(Math.abs(expected) - Math.abs(entered));
  let accepted: boolean;
  let nearToleranceBoundary = false;

  if (expected === 0) {
    // Repetition is exact under every contract.
    accepted = entered === 0;
  } else if (contract.kind === "direction") {
    accepted = directionMatches;
  } else if (contract.kind === "tolerance") {
    accepted = directionMatches && sizeDifference <= contract.tolerance;
    nearToleranceBoundary = accepted && sizeDifference === contract.tolerance;
  } else {
    accepted = exact;
  }

  return {
    movementIndex,
    sourceIndex: movementIndex,
    destinationIndex: movementIndex + 1,
    expected,
    entered,
    directionMatches,
    exact,
    sizeDifference,
    nearToleranceBoundary,
    accepted,
  };
}

export function checkResponse(
  puzzle: Pick<
    ImitationPuzzle,
    | "referencePitches"
    | "anchorIndex"
    | "anchorPitch"
    | "enabledPitches"
    | "contract"
    | "exactReconstruction"
  >,
  response: readonly number[],
): SubmissionCheck {
  const issues: SubmissionIssue[] = [];
  if (response.length !== puzzle.referencePitches.length) {
    issues.push("wrongLength");
  }
  const pitchesValid = response.every(isPitch);
  if (!pitchesValid) issues.push("invalidPitch");

  const anchorValid = response[puzzle.anchorIndex] === puzzle.anchorPitch;
  if (!anchorValid) issues.push("anchorChanged");
  const enabled = new Set<number>(puzzle.enabledPitches);
  const supplyValid =
    pitchesValid && response.every((value) => enabled.has(value));
  if (!supplyValid) issues.push("pitchOutsideSupply");

  const canCheckMovements =
    response.length === puzzle.referencePitches.length && pitchesValid;
  const expected = signedMovements(puzzle.referencePitches);
  const entered = canCheckMovements ? signedMovements(response) : [];
  const movements = canCheckMovements
    ? expected.map((movement, index) =>
        checkMovement(movement, entered[index]!, puzzle.contract, index),
      )
    : [];
  const accepted =
    issues.length === 0 && movements.every((movement) => movement.accepted);
  const exact =
    accepted &&
    response.every(
      (value, index) => value === puzzle.exactReconstruction[index],
    );

  return {
    accepted,
    exact,
    anchorValid,
    supplyValid,
    issues,
    movements,
  };
}
