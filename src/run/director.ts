import sum from "lodash-es/sum.js";

import { weightedSampleWithoutReplacement } from "../random";
import { clampUnit } from "../utils/numbers";

export interface SkillAssessment {
  readonly proficiency: number;
  readonly certainty: number;
}

export type RunProfile<Skill extends string> = Readonly<
  Record<Skill, SkillAssessment>
>;

export type RunStatus = "active" | "succeeded" | "failed";

export interface RunState<Skill extends string> {
  readonly runId: string;
  readonly status: RunStatus;
  readonly lives: number;
  readonly puzzlesPresented: number;
  readonly ceilingCorrectAnswers: number;
  readonly focus: readonly Skill[];
  readonly focusWeights: Readonly<Record<Skill, number>>;
  readonly startingChallenge: Readonly<Record<Skill, number>>;
  readonly assignedChallenge: Readonly<Record<Skill, number>>;
  readonly profile: RunProfile<Skill>;
}

export interface AssessmentEvidence<Skill extends string> {
  readonly skill: Skill;
  readonly challenge: number;
  readonly correct: boolean;
  readonly weight: number;
  /** The fraction of this skill supplied by the question rather than recalled. */
  readonly support: number;
}

export interface AssessmentChange<Skill extends string> {
  readonly skill: Skill;
  readonly before: SkillAssessment;
  readonly after: SkillAssessment;
}

export interface CompletedPuzzle<Skill extends string> {
  readonly state: RunState<Skill>;
  readonly assessmentChanges: readonly AssessmentChange<Skill>[];
}

export interface RunDirectorTuning {
  readonly initialLives: number;
  readonly ceilingCorrectAnswersRequired: number;
  readonly ceilingPuzzle: number;
  readonly pressureExponent: number;
  readonly familiarProficiency: number;
  readonly familiarCertainty: number;
  readonly broadFocusProficiency: number;
  readonly broadFocusCertainty: number;
  readonly focalSafetyMargin: number;
  readonly nonFocalSafetyMargin: number;
  readonly uncertaintySafetyMargin: number;
  readonly minimumFocusWeight: number;
  readonly proficiencyEmphasisWeight: number;
  readonly certaintyEmphasisWeight: number;
  readonly focalWeightMultiplier: number;
  readonly proficiencyLearningRate: number;
  readonly certaintyLearningRate: number;
  readonly surprisePenaltyRate: number;
  readonly surpriseChallengeGap: number;
  readonly expectedSuccessSlope: number;
}

export interface RunDirector<Skill extends string> {
  chooseRunFocus(
    profile: RunProfile<Skill>,
    rng: () => number,
  ): readonly Skill[];
  startRun(
    profile: RunProfile<Skill>,
    rng: () => number,
    runId?: string,
  ): RunState<Skill>;
  runPressure(puzzleNumber: number): number;
  assignedChallengeForPuzzle(
    state: RunState<Skill>,
    puzzleNumber?: number,
  ): Readonly<Record<Skill, number>>;
  completePuzzle(
    state: RunState<Skill>,
    result: {
      readonly correct: boolean;
      readonly atCeiling: boolean;
      readonly evidence: readonly AssessmentEvidence<Skill>[];
    },
  ): CompletedPuzzle<Skill>;
}

export function createRunDirector<Skill extends string>({
  skills,
  tuning,
  runIdPrefix,
}: {
  readonly skills: readonly Skill[];
  readonly tuning: RunDirectorTuning;
  readonly runIdPrefix: string;
}): RunDirector<Skill> {
  if (skills.length === 0) throw new Error("A run director requires skills");

  const isFamiliar = (assessment: SkillAssessment) =>
    assessment.proficiency >= tuning.familiarProficiency &&
    assessment.certainty >= tuning.familiarCertainty;

  const isBroadlyReady = (assessment: SkillAssessment) =>
    assessment.proficiency >= tuning.broadFocusProficiency &&
    assessment.certainty >= tuning.broadFocusCertainty;

  const emphasisWeight = (profile: RunProfile<Skill>, skill: Skill) => {
    const assessment = profile[skill];
    return (
      tuning.minimumFocusWeight +
      (1 - assessment.proficiency) * tuning.proficiencyEmphasisWeight +
      (1 - assessment.certainty) * tuning.certaintyEmphasisWeight
    );
  };

  const chooseRunFocus = (
    profile: RunProfile<Skill>,
    rng: () => number,
  ): readonly Skill[] => {
    const familiar = skills.filter((skill) => isFamiliar(profile[skill]));
    let count = 1;
    if (skills.every((skill) => isBroadlyReady(profile[skill]))) {
      count = skills.length;
    } else if (familiar.length >= 3) {
      count = 3;
    } else if (familiar.length >= 2) {
      count = 2;
    }

    const first = weightedSampleWithoutReplacement(
      skills,
      1,
      (skill) => emphasisWeight(profile, skill),
      rng,
    );
    if (count === 1) return first;

    const firstSkill = first[0];
    const selected = [
      ...first,
      ...weightedSampleWithoutReplacement(
        familiar.filter((skill) => skill !== firstSkill),
        count - 1,
        (skill) => emphasisWeight(profile, skill),
        rng,
      ),
    ];
    if (selected.length < count) {
      selected.push(
        ...weightedSampleWithoutReplacement(
          skills.filter((skill) => !selected.includes(skill)),
          count - selected.length,
          (skill) => emphasisWeight(profile, skill),
          rng,
        ),
      );
    }
    return selected;
  };

  const focusWeights = (
    profile: RunProfile<Skill>,
    focus: readonly Skill[],
  ): Readonly<Record<Skill, number>> => {
    const raw = Object.fromEntries(
      skills.map((skill) => [
        skill,
        emphasisWeight(profile, skill) *
          (focus.includes(skill) ? tuning.focalWeightMultiplier : 1),
      ]),
    ) as Record<Skill, number>;
    const total = sum(skills.map((skill) => raw[skill]));
    return Object.fromEntries(
      skills.map((skill) => [skill, raw[skill] / total]),
    ) as Record<Skill, number>;
  };

  const initialChallenge = (
    profile: RunProfile<Skill>,
    focus: readonly Skill[],
  ): Readonly<Record<Skill, number>> =>
    Object.fromEntries(
      skills.map((skill) => {
        const assessment = profile[skill];
        if (!isFamiliar(assessment)) return [skill, 0];
        const safety = focus.includes(skill)
          ? tuning.focalSafetyMargin
          : tuning.nonFocalSafetyMargin;
        const uncertainty =
          (1 - assessment.certainty) * tuning.uncertaintySafetyMargin;
        return [
          skill,
          clampUnit(assessment.proficiency - safety - uncertainty),
        ];
      }),
    ) as Record<Skill, number>;

  const runPressure = (puzzleNumber: number): number => {
    if (puzzleNumber <= 0) return 0;
    if (puzzleNumber >= tuning.ceilingPuzzle) return 1;
    const position = puzzleNumber / tuning.ceilingPuzzle;
    return (
      (Math.exp(tuning.pressureExponent * position) - 1) /
      (Math.exp(tuning.pressureExponent) - 1)
    );
  };

  const assignedChallengeForPuzzle = (
    state: RunState<Skill>,
    puzzleNumber = state.puzzlesPresented + 1,
  ): Readonly<Record<Skill, number>> => {
    const pressure = runPressure(puzzleNumber);
    const adaptiveBaseline = initialChallenge(state.profile, state.focus);
    return Object.fromEntries(
      skills.map((skill) => {
        const baseline =
          puzzleNumber === 1
            ? state.startingChallenge[skill]
            : adaptiveBaseline[skill];
        return [skill, clampUnit(baseline + (1 - baseline) * pressure)];
      }),
    ) as Record<Skill, number>;
  };

  const startRun = (
    profile: RunProfile<Skill>,
    rng: () => number,
    runId?: string,
  ): RunState<Skill> => {
    const focus = chooseRunFocus(profile, rng);
    const startingChallenge = initialChallenge(profile, focus);
    return {
      runId:
        runId ??
        `${runIdPrefix}-${Math.floor(rng() * 1_000_000_000).toString(36)}`,
      status: "active",
      lives: tuning.initialLives,
      puzzlesPresented: 0,
      ceilingCorrectAnswers: 0,
      focus,
      focusWeights: focusWeights(profile, focus),
      startingChallenge,
      assignedChallenge: { ...startingChallenge },
      profile,
    };
  };

  const updateAssessment = (
    assessment: SkillAssessment,
    challenge: number,
    correct: boolean,
    evidence: number,
  ): SkillAssessment => {
    if (evidence <= 0) return assessment;
    const expectedSuccess =
      1 /
      (1 +
        Math.exp(
          (challenge - assessment.proficiency) * tuning.expectedSuccessSlope,
        ));
    const proficiency = clampUnit(
      assessment.proficiency +
        tuning.proficiencyLearningRate *
          evidence *
          ((correct ? 1 : 0) - expectedSuccess),
    );
    const challengeGap = challenge - assessment.proficiency;
    const surprisingGap = correct
      ? challengeGap - tuning.surpriseChallengeGap
      : -challengeGap - tuning.surpriseChallengeGap;
    const surpriseSeverity = clampUnit(
      surprisingGap / (1 - tuning.surpriseChallengeGap),
    );
    const certainty =
      surpriseSeverity > 0
        ? clampUnit(
            assessment.certainty -
              tuning.surprisePenaltyRate *
                evidence *
                surpriseSeverity *
                assessment.certainty,
          )
        : clampUnit(
            assessment.certainty +
              tuning.certaintyLearningRate *
                evidence *
                (1 - assessment.certainty),
          );
    return { proficiency, certainty };
  };

  const completePuzzle: RunDirector<Skill>["completePuzzle"] = (
    state,
    result,
  ) => {
    if (state.status !== "active") {
      throw new Error("Cannot complete a puzzle for a completed run");
    }

    let profile = state.profile;
    const assessmentChanges: AssessmentChange<Skill>[] = [];
    for (const observation of result.evidence) {
      const evidence =
        clampUnit(observation.weight) * (1 - clampUnit(observation.support));
      if (evidence <= 0) continue;
      const before = profile[observation.skill];
      const after = updateAssessment(
        before,
        clampUnit(observation.challenge),
        observation.correct,
        evidence,
      );
      profile = { ...profile, [observation.skill]: after };
      assessmentChanges.push({ skill: observation.skill, before, after });
    }

    const lives = result.correct ? state.lives : state.lives - 1;
    const ceilingCorrectAnswers =
      state.ceilingCorrectAnswers +
      (result.correct && result.atCeiling ? 1 : 0);
    const succeeded =
      ceilingCorrectAnswers >= tuning.ceilingCorrectAnswersRequired;
    const status = succeeded ? "succeeded" : lives <= 0 ? "failed" : "active";

    return {
      assessmentChanges,
      state: {
        ...state,
        status,
        lives,
        puzzlesPresented: state.puzzlesPresented + 1,
        ceilingCorrectAnswers,
        profile,
      },
    };
  };

  return {
    chooseRunFocus,
    startRun,
    runPressure,
    assignedChallengeForPuzzle,
    completePuzzle,
  };
}
