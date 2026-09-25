import type { RunDirectorTuning } from "../run/director";
import type { SkillAssessment } from "./types";

/** Numerical values here are provisional and intended for playtesting. */
export const IMITATION_TUNING = {
  provisional: true,
  generation: {
    maximumAttempts: 128,
  },
  focusConvergence: {
    startsAtChallenge: 0,
    completesAtChallenge: 0.8,
  },
  director: {
    initialLives: 3,
    ceilingCorrectAnswersRequired: 3,
    ceilingPuzzle: 15,
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
  } satisfies RunDirectorTuning,
  defaultAssessment: {
    proficiency: 0,
    certainty: 0,
  } satisfies SkillAssessment,
  persistence: {
    key: "tracks-unfold.imitation.profile",
    version: 1,
  },
} as const;
