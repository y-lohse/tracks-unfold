import { describe, expect, it } from "vitest";

import { createRunDirector, type RunProfile } from "./director";

const skills = ["direction", "interval"] as const;
type Skill = (typeof skills)[number];

const tuning = {
  initialLives: 3,
  ceilingCorrectAnswersRequired: 3,
  ceilingPuzzle: 13,
  pressureExponent: 3.2,
  familiarProficiency: 0.45,
  familiarCertainty: 0.4,
  broadFocusProficiency: 0.75,
  broadFocusCertainty: 0.65,
  focalSafetyMargin: 0.12,
  nonFocalSafetyMargin: 0.3,
  uncertaintySafetyMargin: 0.2,
  minimumFocusWeight: 0.12,
  proficiencyEmphasisWeight: 0.55,
  certaintyEmphasisWeight: 0.33,
  focalWeightMultiplier: 3,
  proficiencyLearningRate: 0.095,
  certaintyLearningRate: 0.13,
  surprisePenaltyRate: 0.18,
  surpriseChallengeGap: 0.2,
  expectedSuccessSlope: 4,
} as const;

const director = createRunDirector({
  skills,
  tuning,
  runIdPrefix: "test",
});

function profile(proficiency = 0.5): RunProfile<Skill> {
  return {
    direction: { proficiency, certainty: 0.5 },
    interval: { proficiency, certainty: 0.5 },
  };
}

describe("shared run director", () => {
  it("owns run pacing without knowing how a puzzle is generated", () => {
    const run = director.startRun(profile(), () => 0, "test-run");

    expect(run).toEqual(
      expect.objectContaining({
        runId: "test-run",
        status: "active",
        lives: 3,
        puzzlesPresented: 0,
      }),
    );
    expect(director.runPressure(12)).toBeLessThan(1);
    expect(director.runPressure(13)).toBe(1);
    expect(director.assignedChallengeForPuzzle(run, 13)).toEqual({
      direction: 1,
      interval: 1,
    });
  });

  it("accepts skill evidence that differs from the binary puzzle outcome", () => {
    const run = director.startRun(profile(), () => 0, "observations");
    const completed = director.completePuzzle(run, {
      correct: false,
      atCeiling: false,
      evidence: [
        {
          skill: "direction",
          challenge: 0.5,
          correct: true,
          weight: 1,
          support: 0,
        },
        {
          skill: "interval",
          challenge: 0.5,
          correct: false,
          weight: 1,
          support: 0,
        },
      ],
    });

    expect(completed.state.lives).toBe(2);
    expect(completed.state.puzzlesPresented).toBe(1);
    expect(completed.state.profile.direction.proficiency).toBeGreaterThan(0.5);
    expect(completed.state.profile.interval.proficiency).toBeLessThan(0.5);
  });

  it("keeps puzzle-specific ceiling qualification outside the module", () => {
    let run = director.startRun(profile(), () => 0, "ceiling");
    for (let answer = 0; answer < 3; answer += 1) {
      run = director.completePuzzle(run, {
        correct: true,
        atCeiling: true,
        evidence: [],
      }).state;
    }

    expect(run.status).toBe("succeeded");
    expect(run.ceilingCorrectAnswers).toBe(3);
  });
});
