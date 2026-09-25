import type { Pitch } from "../music";
import type { ImitationPuzzle } from "./types";

export interface ImitationAttemptState {
  readonly response: readonly (Pitch | null)[];
  readonly selectedSlot: number | null;
  readonly referencePlaysUsed: number;
  readonly pitchAuditionsUsed: number;
  readonly submitted: boolean;
}

export type ImitationAttemptAction =
  | { readonly type: "selectSlot"; readonly slotIndex: number }
  | { readonly type: "enterPitch"; readonly pitch: Pitch }
  | { readonly type: "useReferencePlay" }
  | { readonly type: "usePitchAudition" }
  | { readonly type: "submit" };

export function createImitationAttempt(
  puzzle: Pick<
    ImitationPuzzle,
    "referencePitches" | "anchorIndex" | "anchorPitch"
  >,
): ImitationAttemptState {
  return {
    response: puzzle.referencePitches.map((_, index) =>
      index === puzzle.anchorIndex ? puzzle.anchorPitch : null,
    ),
    selectedSlot: null,
    referencePlaysUsed: 1,
    pitchAuditionsUsed: 0,
    submitted: false,
  };
}

export function remainingAllowance(
  allowance: number | null,
  used: number,
): number | null {
  return allowance === null ? null : Math.max(0, allowance - used);
}

export function remainingReferencePlays(
  state: ImitationAttemptState,
  puzzle: Pick<ImitationPuzzle, "budgets">,
): number | null {
  return remainingAllowance(
    puzzle.budgets.referencePlays,
    state.referencePlaysUsed,
  );
}

export function remainingPitchAuditions(
  state: ImitationAttemptState,
  puzzle: Pick<ImitationPuzzle, "budgets">,
): number | null {
  return remainingAllowance(
    puzzle.budgets.pitchAuditions,
    state.pitchAuditionsUsed,
  );
}

export function hasAllowance(remaining: number | null): boolean {
  return remaining === null || remaining > 0;
}

export function completeResponse(
  state: ImitationAttemptState,
): readonly Pitch[] | null {
  return state.response.every((value): value is Pitch => value !== null)
    ? state.response
    : null;
}

export function imitationAttemptReducer(
  state: ImitationAttemptState,
  action: ImitationAttemptAction,
  puzzle: Pick<ImitationPuzzle, "anchorIndex" | "enabledPitches" | "budgets">,
): ImitationAttemptState {
  if (state.submitted) return state;

  switch (action.type) {
    case "selectSlot": {
      if (
        !Number.isInteger(action.slotIndex) ||
        action.slotIndex < 0 ||
        action.slotIndex >= state.response.length
      ) {
        return state;
      }
      if (action.slotIndex === puzzle.anchorIndex) {
        return { ...state, selectedSlot: null };
      }
      return {
        ...state,
        selectedSlot:
          state.selectedSlot === action.slotIndex ? null : action.slotIndex,
      };
    }
    case "enterPitch": {
      if (
        state.selectedSlot === null ||
        !puzzle.enabledPitches.includes(action.pitch)
      ) {
        return state;
      }
      const response = [...state.response];
      response[state.selectedSlot] = action.pitch;
      return { ...state, response, selectedSlot: null };
    }
    case "useReferencePlay":
      return hasAllowance(remainingReferencePlays(state, puzzle))
        ? { ...state, referencePlaysUsed: state.referencePlaysUsed + 1 }
        : state;
    case "usePitchAudition":
      return hasAllowance(remainingPitchAuditions(state, puzzle))
        ? { ...state, pitchAuditionsUsed: state.pitchAuditionsUsed + 1 }
        : state;
    case "submit":
      return completeResponse(state) === null
        ? state
        : { ...state, selectedSlot: null, submitted: true };
  }
}
