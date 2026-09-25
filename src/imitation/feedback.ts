import { directionOf } from "./checker";
import type {
  ImitationPuzzle,
  MovementFeedback,
  MovementFeedbackStatus,
  SubmissionCheck,
  SubmissionFeedback,
} from "./types";

function directionLabel(movement: number): "higher" | "lower" | "repeated" {
  const direction = directionOf(movement);
  return direction === 0 ? "repeated" : direction > 0 ? "higher" : "lower";
}

function statusForMovement(
  movement: SubmissionCheck["movements"][number],
): MovementFeedbackStatus {
  if (!movement.accepted) return "error";
  if (movement.exact) return "exact";
  if (movement.nearToleranceBoundary) return "nearBoundary";
  return "variation";
}

function feedbackSlotForMovement(
  movement: SubmissionCheck["movements"][number],
  anchorIndex: number,
  response: readonly number[],
  exactReconstruction: readonly number[],
): number {
  if (movement.destinationIndex === anchorIndex) return movement.sourceIndex;
  if (movement.sourceIndex === anchorIndex) return movement.destinationIndex;

  const sourceDiffers =
    response[movement.sourceIndex] !==
    exactReconstruction[movement.sourceIndex];
  const destinationDiffers =
    response[movement.destinationIndex] !==
    exactReconstruction[movement.destinationIndex];
  if (sourceDiffers !== destinationDiffers) {
    return sourceDiffers ? movement.sourceIndex : movement.destinationIndex;
  }
  return movement.destinationIndex;
}

export function buildSubmissionFeedback(
  puzzle: ImitationPuzzle,
  response: readonly number[],
  check: SubmissionCheck,
): SubmissionFeedback {
  const bySlot: MovementFeedback[][] = Array.from(
    { length: puzzle.referencePitches.length },
    () => [],
  );
  for (const movement of check.movements) {
    const attachedSlot = feedbackSlotForMovement(
      movement,
      puzzle.anchorIndex,
      response,
      puzzle.exactReconstruction,
    );
    bySlot[attachedSlot]!.push({
      kind: "movement",
      movementIndex: movement.movementIndex,
      attachedSlot,
      expectedMovement: movement.expected,
      enteredMovement: movement.entered,
      expectedDirection: directionLabel(movement.expected),
      status: statusForMovement(movement),
    });
  }

  return {
    accepted: check.accepted,
    exact: check.exact,
    issues: check.issues,
    slots: puzzle.referencePitches.map((_, slotIndex) => {
      const enteredPitch = response[slotIndex];
      const exactTarget = puzzle.exactReconstruction[slotIndex]!;
      return {
        slotIndex,
        suppliedAnchor: slotIndex === puzzle.anchorIndex,
        movements: bySlot[slotIndex]!,
        targetComparison:
          slotIndex === puzzle.anchorIndex ||
          enteredPitch === undefined ||
          enteredPitch === exactTarget
            ? null
            : {
                kind: "targetComparison" as const,
                slotIndex,
                exactTarget,
                enteredPitch,
                signedOffset: enteredPitch - exactTarget,
              },
      };
    }),
  };
}
