import type { SkillAssessment } from "./types";

export const NOTE_NAVIGATION_TUNING = {
  displayMidiMin: 48, // C3
  displayMidiMax: 83, // B5
  singleRegisterOctave: 4,
  navigationMilestoneCount: 11,
  intervalProgressionSteps: 12,
  curatedChoiceThresholds: {
    four: 0.34,
    six: 0.67,
    full: 1,
  },
  assessment: {
    curatedChoiceSupport: {
      three: 0.35,
      four: 0.25,
      six: 0.12,
      full: 0,
    },
    unsupportedNamedNumericalWeight: 0.45,
    unsupportedNamedVocabularyWeight: 0.55,
  },
  director: {
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
    proficiencyLearningRate: 0.2,
    certaintyLearningRate: 0.13,
    surprisePenaltyRate: 0.18,
    surpriseChallengeGap: 0.2,
    expectedSuccessSlope: 4,
  },
  defaultAssessment: {
    proficiency: 0,
    certainty: 0,
  } satisfies SkillAssessment,
  persistence: {
    key: "tracks-unfold.note-navigation.profile",
    version: 1,
  },
} as const;

export function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}
