import type { RelationshipContract, SlotFeedback } from "./types";

function semitoneCount(value: number): string {
  return `${value} ${value === 1 ? "semitone" : "semitones"}`;
}

export function movementFeedback(
  contract: RelationshipContract,
  feedback: SlotFeedback,
): string | null {
  if (feedback.movements.length === 0) return null;
  const statuses = ["error", "nearBoundary", "variation"] as const;
  const activeStatus = statuses.find((status) =>
    feedback.movements.some((movement) => movement.status === status),
  );
  if (!activeStatus) return null;

  const candidates = feedback.movements.filter(
    (movement) => movement.status === activeStatus,
  );
  const movement =
    candidates.find(
      (candidate) => candidate.movementIndex + 1 === feedback.slotIndex,
    ) ?? candidates[0];
  if (!movement) return null;

  if (movement.status === "nearBoundary") return "Just within range";
  if (movement.status === "variation") {
    return contract.kind === "direction" ? "Correct direction" : "Close enough";
  }
  const describesNext = movement.attachedSlot === movement.movementIndex;
  if (movement.expectedMovement === 0) {
    return describesNext
      ? "The next note should repeat"
      : "Repeat the previous note";
  }
  if (
    Math.sign(movement.expectedMovement) !== Math.sign(movement.enteredMovement)
  ) {
    const relation = movement.expectedDirection;
    return describesNext
      ? `The next note should be ${relation}`
      : `Should be ${relation} than the previous note`;
  }
  const difference =
    Math.abs(movement.expectedMovement) - Math.abs(movement.enteredMovement);
  return difference > 0
    ? `Make this jump ${semitoneCount(difference)} larger`
    : `Make this jump ${semitoneCount(Math.abs(difference))} smaller`;
}
