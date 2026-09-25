import { describe, expect, it } from "vitest";

import type { Pitch } from "../music";
import {
  buildSubmissionFeedback,
  checkResponse,
  exactAnchoredReconstruction,
  listeningBudgets,
  settingsForControls,
  type ImitationControls,
  type ImitationPuzzle,
  type RelationshipContract,
} from "./index";

const BASE_CONTROLS: ImitationControls = {
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

function puzzleFor(
  referencePitches: readonly Pitch[],
  anchorIndex: number,
  anchorPitch: Pitch,
  contract: RelationshipContract,
  enabledPitches: readonly Pitch[],
): ImitationPuzzle {
  const exactReconstruction = exactAnchoredReconstruction(
    referencePitches,
    anchorIndex,
    anchorPitch,
  );
  const settings = settingsForControls(BASE_CONTROLS);
  return {
    id: "test:1",
    requestedControls: BASE_CONTROLS,
    settings,
    referencePitches,
    anchorIndex,
    anchorPitch,
    enabledPitches,
    contract,
    budgets: listeningBudgets(settings),
    exactReconstruction,
    features: {
      signedMovements: referencePitches
        .slice(1)
        .map((value, index) => value - referencePitches[index]!),
      tolerance: contract.kind === "tolerance" ? contract.tolerance : null,
      enabledPitches,
      anchorIndex,
      anchorPitch,
      anchorShift: anchorPitch - referencePitches[anchorIndex]!,
      turnCount: 0,
      repetitionCount: 0,
      maximumMovement: 4,
    },
    targetedSkills: {},
  };
}

describe("exact anchored reconstruction", () => {
  it("transposes around middle and last anchors, including octave shifts", () => {
    expect(exactAnchoredReconstruction([60, 64, 62], 1, 76)).toEqual([
      72, 76, 74,
    ]);
    expect(exactAnchoredReconstruction([67, 65, 60], 2, 48)).toEqual([
      55, 53, 48,
    ]);
  });

  it("rejects reconstructions outside C3-B5", () => {
    expect(() => exactAnchoredReconstruction([72, 83], 0, 80)).toThrow(
      RangeError,
    );
  });
});

describe("independent response checker", () => {
  it("accepts direction-only alternatives while requiring repetitions", () => {
    const puzzle = puzzleFor(
      [60, 64, 64, 62],
      0,
      60,
      { kind: "direction" },
      [60, 61, 66, 67, 68],
    );
    const valid = checkResponse(puzzle, [60, 61, 61, 60]);
    expect(valid.accepted).toBe(true);
    expect(valid.exact).toBe(false);

    const brokenRepeat = checkResponse(puzzle, [60, 61, 66, 60]);
    expect(brokenRepeat.accepted).toBe(false);
    expect(brokenRepeat.movements[1]?.accepted).toBe(false);
  });

  it("checks tolerance per movement rather than accumulated note offset", () => {
    const puzzle = puzzleFor(
      [60, 64, 68],
      0,
      60,
      { kind: "tolerance", tolerance: 3 },
      [60, 67, 74],
    );
    const result = checkResponse(puzzle, [60, 67, 74]);
    expect(result.accepted).toBe(true);
    expect(result.exact).toBe(false);
    expect(
      result.movements.every((movement) => movement.nearToleranceBoundary),
    ).toBe(true);
    expect(74 - puzzle.exactReconstruction[2]!).toBe(6);
  });

  it("requires exact signed movements under the exact contract", () => {
    const puzzle = puzzleFor(
      [60, 64, 62],
      1,
      65,
      { kind: "exact" },
      [61, 63, 65],
    );
    expect(checkResponse(puzzle, [61, 65, 63])).toMatchObject({
      accepted: true,
      exact: true,
    });
    expect(checkResponse(puzzle, [62, 65, 63]).accepted).toBe(false);
  });

  it("checks anchor, supply, length, and pitch validity independently", () => {
    const puzzle = puzzleFor(
      [60, 62, 64],
      1,
      62,
      { kind: "direction" },
      [60, 62, 64],
    );
    expect(checkResponse(puzzle, [60, 63, 64]).issues).toContain(
      "anchorChanged",
    );
    expect(checkResponse(puzzle, [60, 62, 65]).issues).toContain(
      "pitchOutsideSupply",
    );
    expect(checkResponse(puzzle, [60, 62]).issues).toContain("wrongLength");
    expect(checkResponse(puzzle, [60, 62, 90]).issues).toEqual(
      expect.arrayContaining(["invalidPitch", "pitchOutsideSupply"]),
    );
  });
});

describe("structured feedback", () => {
  it("attaches an inexact movement to the endpoint whose pitch differs", () => {
    const puzzle = puzzleFor(
      [62, 64, 64, 66],
      3,
      66,
      { kind: "tolerance", tolerance: 1 },
      [62, 63, 64, 66],
    );
    const response = [63, 64, 64, 66];
    const check = checkResponse(puzzle, response);
    const feedback = buildSubmissionFeedback(puzzle, response, check);

    expect(check.accepted).toBe(true);
    expect(feedback.slots[0]?.targetComparison).toMatchObject({
      exactTarget: 62,
      enteredPitch: 63,
    });
    expect(feedback.slots[0]?.movements).toEqual([
      expect.objectContaining({ movementIndex: 0, status: "nearBoundary" }),
    ]);
    expect(feedback.slots[1]?.targetComparison).toBeNull();
    expect(feedback.slots[1]?.movements).toEqual([]);
  });

  it("attaches movement feedback to editable endpoints and preserves valid variations", () => {
    const puzzle = puzzleFor(
      [60, 64, 68],
      1,
      64,
      { kind: "tolerance", tolerance: 1 },
      [59, 60, 63, 64, 68, 69],
    );
    const response = [59, 64, 69];
    const check = checkResponse(puzzle, response);
    const feedback = buildSubmissionFeedback(puzzle, response, check);

    expect(feedback.accepted).toBe(true);
    expect(feedback.exact).toBe(false);
    expect(feedback.slots[0]?.movements[0]).toMatchObject({
      movementIndex: 0,
      attachedSlot: 0,
      status: "nearBoundary",
    });
    expect(feedback.slots[1]?.movements).toEqual([]);
    expect(feedback.slots[1]?.targetComparison).toBeNull();
    expect(feedback.slots[2]?.targetComparison).toMatchObject({
      exactTarget: 68,
      enteredPitch: 69,
      signedOffset: 1,
    });
  });
});
