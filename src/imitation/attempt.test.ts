import { describe, expect, it } from "vitest";

import type { ImitationPuzzle } from "./types";
import {
  completeResponse,
  createImitationAttempt,
  imitationAttemptReducer,
  remainingPitchAuditions,
  remainingReferencePlays,
} from "./attempt";

const puzzle = {
  referencePitches: [60, 62, 64],
  anchorIndex: 1,
  anchorPitch: 67,
  enabledPitches: [65, 67, 69],
  budgets: { referencePlays: 2, pitchAuditions: 1 },
} satisfies Pick<
  ImitationPuzzle,
  | "referencePitches"
  | "anchorIndex"
  | "anchorPitch"
  | "enabledPitches"
  | "budgets"
>;

describe("Imitation attempt", () => {
  it("starts with the locked anchor and counts the initial reference play", () => {
    const state = createImitationAttempt(puzzle);

    expect(state.response).toEqual([null, 67, null]);
    expect(remainingReferencePlays(state, puzzle)).toBe(1);
    expect(remainingPitchAuditions(state, puzzle)).toBe(1);
  });

  it("enters enabled pitches silently into one explicitly selected editable slot", () => {
    let state = createImitationAttempt(puzzle);
    state = imitationAttemptReducer(
      state,
      { type: "selectSlot", slotIndex: 0 },
      puzzle,
    );
    state = imitationAttemptReducer(
      state,
      { type: "enterPitch", pitch: 65 },
      puzzle,
    );

    expect(state.response).toEqual([65, 67, null]);
    expect(state.selectedSlot).toBeNull();
    expect(state.pitchAuditionsUsed).toBe(0);
  });

  it("lets the anchor deselect without changing it", () => {
    let state = createImitationAttempt(puzzle);
    state = imitationAttemptReducer(
      state,
      { type: "selectSlot", slotIndex: 2 },
      puzzle,
    );
    state = imitationAttemptReducer(
      state,
      { type: "selectSlot", slotIndex: 1 },
      puzzle,
    );

    expect(state.selectedSlot).toBeNull();
    expect(state.response[1]).toBe(67);
  });

  it("enforces listening budgets but allows unlimited silent replacement edits", () => {
    let state = createImitationAttempt(puzzle);
    state = imitationAttemptReducer(
      state,
      { type: "useReferencePlay" },
      puzzle,
    );
    state = imitationAttemptReducer(
      state,
      { type: "useReferencePlay" },
      puzzle,
    );
    state = imitationAttemptReducer(
      state,
      { type: "usePitchAudition" },
      puzzle,
    );
    state = imitationAttemptReducer(
      state,
      { type: "usePitchAudition" },
      puzzle,
    );

    expect(state.referencePlaysUsed).toBe(2);
    expect(state.pitchAuditionsUsed).toBe(1);

    for (const pitch of [65, 69, 65] as const) {
      state = imitationAttemptReducer(
        state,
        { type: "selectSlot", slotIndex: 0 },
        puzzle,
      );
      state = imitationAttemptReducer(
        state,
        { type: "enterPitch", pitch },
        puzzle,
      );
    }
    expect(state.response[0]).toBe(65);
    expect(state.pitchAuditionsUsed).toBe(1);
  });

  it("accepts one complete submission and locks subsequent changes", () => {
    let state = createImitationAttempt(puzzle);
    for (const [slotIndex, pitch] of [
      [0, 65],
      [2, 69],
    ] as const) {
      state = imitationAttemptReducer(
        state,
        { type: "selectSlot", slotIndex },
        puzzle,
      );
      state = imitationAttemptReducer(
        state,
        { type: "enterPitch", pitch },
        puzzle,
      );
    }

    expect(completeResponse(state)).toEqual([65, 67, 69]);
    state = imitationAttemptReducer(state, { type: "submit" }, puzzle);
    const locked = imitationAttemptReducer(
      state,
      { type: "selectSlot", slotIndex: 0 },
      puzzle,
    );

    expect(state.submitted).toBe(true);
    expect(locked).toBe(state);
  });
});
