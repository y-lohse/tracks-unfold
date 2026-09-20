import { generateQuestion, isCorrectAnswer } from "./questions";
import { weightedChoice, weightedSampleWithoutReplacement } from "./random";
import { NOTE_NAVIGATION_TUNING, clamp01 } from "./tuning";
import {
  SKILLS,
  type AnswerResult,
  type AnswerTransition,
  type DifficultyControls,
  type GenerationRepertoire,
  type NavigationQuestion,
  type PlayerProfile,
  type Rng,
  type RunState,
  type Skill,
  type SkillAssessment,
  type SkillProficiencyChange,
  type SubmittedAnswer,
} from "./types";

export interface PreparedQuestion {
  readonly state: RunState;
  readonly question: NavigationQuestion;
}

function isFamiliar(assessment: SkillAssessment): boolean {
  const tuning = NOTE_NAVIGATION_TUNING.director;
  return (
    assessment.proficiency >= tuning.familiarProficiency &&
    assessment.certainty >= tuning.familiarCertainty
  );
}

function isBroadlyReady(assessment: SkillAssessment): boolean {
  const tuning = NOTE_NAVIGATION_TUNING.director;
  return (
    assessment.proficiency >= tuning.broadFocusProficiency &&
    assessment.certainty >= tuning.broadFocusCertainty
  );
}

function emphasisWeight(profile: PlayerProfile, skill: Skill): number {
  const assessment = profile[skill];
  const tuning = NOTE_NAVIGATION_TUNING.director;
  return (
    tuning.minimumFocusWeight +
    (1 - assessment.proficiency) * tuning.proficiencyEmphasisWeight +
    (1 - assessment.certainty) * tuning.certaintyEmphasisWeight
  );
}

export function chooseRunFocus(
  profile: PlayerProfile,
  rng: Rng,
): readonly Skill[] {
  const familiar = SKILLS.filter((skill) => isFamiliar(profile[skill]));
  let count = 1;
  if (SKILLS.every((skill) => isBroadlyReady(profile[skill]))) {
    count = SKILLS.length;
  } else if (familiar.length >= 3) {
    count = 3;
  } else if (familiar.length >= 2) {
    count = 2;
  }

  const first = weightedSampleWithoutReplacement(
    SKILLS,
    1,
    (skill) => emphasisWeight(profile, skill),
    rng,
  );
  if (count === 1) return first;

  const firstSkill = first[0];
  const remainingFamiliar = familiar.filter((skill) => skill !== firstSkill);
  const selected = [
    ...first,
    ...weightedSampleWithoutReplacement(
      remainingFamiliar,
      count - 1,
      (skill) => emphasisWeight(profile, skill),
      rng,
    ),
  ];
  if (selected.length < count) {
    selected.push(
      ...weightedSampleWithoutReplacement(
        SKILLS.filter((skill) => !selected.includes(skill)),
        count - selected.length,
        (skill) => emphasisWeight(profile, skill),
        rng,
      ),
    );
  }
  return selected;
}

function focusWeights(
  profile: PlayerProfile,
  focus: readonly Skill[],
): Readonly<Record<Skill, number>> {
  const raw = Object.fromEntries(
    SKILLS.map((skill) => [
      skill,
      emphasisWeight(profile, skill) *
        (focus.includes(skill)
          ? NOTE_NAVIGATION_TUNING.director.focalWeightMultiplier
          : 1),
    ]),
  ) as Record<Skill, number>;
  const total = SKILLS.reduce((sum, skill) => sum + raw[skill], 0);
  return Object.fromEntries(
    SKILLS.map((skill) => [skill, raw[skill] / total]),
  ) as Record<Skill, number>;
}

function initialChallenge(
  profile: PlayerProfile,
  focus: readonly Skill[],
): Readonly<Record<Skill, number>> {
  const tuning = NOTE_NAVIGATION_TUNING.director;
  return Object.fromEntries(
    SKILLS.map((skill) => {
      const assessment = profile[skill];
      if (!isFamiliar(assessment)) return [skill, 0];
      const safety = focus.includes(skill)
        ? tuning.focalSafetyMargin
        : tuning.nonFocalSafetyMargin;
      const uncertainty =
        (1 - assessment.certainty) * tuning.uncertaintySafetyMargin;
      return [skill, clamp01(assessment.proficiency - safety - uncertainty)];
    }),
  ) as Record<Skill, number>;
}

export function startRun(
  profile: PlayerProfile,
  rng: Rng,
  runId?: string,
): RunState {
  const focus = chooseRunFocus(profile, rng);
  const startingChallenge = initialChallenge(profile, focus);
  return {
    runId:
      runId ??
      `note-navigation-${Math.floor(rng() * 1_000_000_000).toString(36)}`,
    status: "active",
    lives: NOTE_NAVIGATION_TUNING.director.initialLives,
    puzzlesPresented: 0,
    ceilingCorrectAnswers: 0,
    focus,
    focusWeights: focusWeights(profile, focus),
    startingChallenge,
    assignedChallenge: { ...startingChallenge },
    profile,
  };
}

/** Normalized exponential run pressure. It reaches 1 on the configured ceiling puzzle. */
export function runPressure(puzzleNumber: number): number {
  if (puzzleNumber <= 0) return 0;
  const tuning = NOTE_NAVIGATION_TUNING.director;
  if (puzzleNumber >= tuning.ceilingPuzzle) return 1;
  const position = puzzleNumber / tuning.ceilingPuzzle;
  return (
    (Math.exp(tuning.pressureExponent * position) - 1) /
    (Math.exp(tuning.pressureExponent) - 1)
  );
}

export function assignedChallengeForPuzzle(
  state: RunState,
  puzzleNumber = state.puzzlesPresented + 1,
): Readonly<Record<Skill, number>> {
  const pressure = runPressure(puzzleNumber);
  const adaptiveBaseline = initialChallenge(state.profile, state.focus);
  return Object.fromEntries(
    SKILLS.map((skill) => {
      const baseline =
        puzzleNumber === 1
          ? state.startingChallenge[skill]
          : adaptiveBaseline[skill];
      return [skill, clamp01(baseline + (1 - baseline) * pressure)];
    }),
  ) as Record<Skill, number>;
}

function repertoireForTarget(
  profile: PlayerProfile,
  target: Skill,
): GenerationRepertoire {
  const isForward =
    target === "numericalDestination" || target === "intervalInterpretation";
  const numericalSkill: Skill = isForward
    ? "numericalDestination"
    : "numericalDistance";
  const intervalSkill: Skill = isForward
    ? "intervalInterpretation"
    : "intervalIdentification";
  return {
    octaveCrossings: isFamiliar(profile[numericalSkill]),
    edgeEnharmonics:
      isBroadlyReady(profile[numericalSkill]) &&
      isBroadlyReady(profile[intervalSkill]),
  };
}

function controlsForTarget(
  target: Skill,
  challenge: Readonly<Record<Skill, number>>,
): DifficultyControls {
  const globalMinimum = Math.min(...SKILLS.map((skill) => challenge[skill]));
  const globalAverage =
    SKILLS.reduce((sum, skill) => sum + challenge[skill], 0) / SKILLS.length;
  const isForward =
    target === "numericalDestination" || target === "intervalInterpretation";
  const numericalPartner = isForward
    ? "numericalDestination"
    : "numericalDistance";
  const intervalPartner = isForward
    ? "intervalInterpretation"
    : "intervalIdentification";
  const navigationDemand =
    target === intervalPartner
      ? Math.max(challenge[target], challenge[numericalPartner])
      : challenge[target];
  const intervalNameDemand =
    target === intervalPartner ? challenge[target] : globalMinimum;
  return {
    navigationDemand: clamp01(navigationDemand),
    intervalNameDemand: clamp01(intervalNameDemand),
    answerChoiceBreadth: clamp01(globalAverage),
  };
}

export function prepareNextQuestion(
  state: RunState,
  rng: Rng,
): PreparedQuestion {
  if (state.status !== "active")
    throw new Error("Cannot create a question for a completed run");
  const puzzleNumber = state.puzzlesPresented + 1;
  const assignedChallenge = assignedChallengeForPuzzle(state, puzzleNumber);
  const targetSkill = weightedChoice(
    SKILLS,
    (skill) => state.focusWeights[skill],
    rng,
  );
  const controls = controlsForTarget(targetSkill, assignedChallenge);
  const preparedState: RunState = { ...state, assignedChallenge };
  return {
    state: preparedState,
    question: generateQuestion({
      id: `${state.runId}:${puzzleNumber}`,
      controls,
      targetSkill,
      skillChallenges: assignedChallenge,
      repertoire: repertoireForTarget(state.profile, targetSkill),
      rng,
    }),
  };
}

function updateAssessment(
  assessment: SkillAssessment,
  challenge: number,
  correct: boolean,
  evidence: number,
): SkillAssessment {
  if (evidence <= 0) return assessment;
  const tuning = NOTE_NAVIGATION_TUNING.director;
  const expectedSuccess =
    1 /
    (1 +
      Math.exp(
        (challenge - assessment.proficiency) * tuning.expectedSuccessSlope,
      ));
  const outcome = correct ? 1 : 0;
  const proficiency = clamp01(
    assessment.proficiency +
      tuning.proficiencyLearningRate * evidence * (outcome - expectedSuccess),
  );
  const challengeGap = challenge - assessment.proficiency;
  const surprisingGap = correct
    ? challengeGap - tuning.surpriseChallengeGap
    : -challengeGap - tuning.surpriseChallengeGap;
  const surpriseSeverity = clamp01(
    surprisingGap / (1 - tuning.surpriseChallengeGap),
  );
  const certainty =
    surpriseSeverity > 0
      ? clamp01(
          assessment.certainty -
            tuning.surprisePenaltyRate *
              evidence *
              surpriseSeverity *
              assessment.certainty,
        )
      : clamp01(
          assessment.certainty +
            tuning.certaintyLearningRate *
              evidence *
              (1 - assessment.certainty),
        );
  return { proficiency, certainty };
}

function isGlobalCeiling(
  state: RunState,
  question: NavigationQuestion,
): boolean {
  const assignedAtCeiling = SKILLS.every(
    (skill) => state.assignedChallenge[skill] === 1,
  );
  const controlsAtCeiling =
    question.controls.navigationDemand === 1 &&
    question.controls.intervalNameDemand === 1 &&
    question.controls.answerChoiceBreadth === 1;
  return assignedAtCeiling && controlsAtCeiling;
}

export function answerQuestion(
  state: RunState,
  question: NavigationQuestion,
  submitted: SubmittedAnswer,
): AnswerTransition {
  if (state.status !== "active")
    throw new Error("Cannot answer a question for a completed run");
  if (question.id !== `${state.runId}:${state.puzzlesPresented + 1}`) {
    throw new Error("Question does not belong to the next puzzle in this run");
  }

  const correct = isCorrectAnswer(question, submitted);
  let profile = state.profile;
  const proficiencyChanges: SkillProficiencyChange[] = [];
  for (const demand of question.demands) {
    const evidence = clamp01(demand.weight) * (1 - clamp01(demand.support));
    if (evidence <= 0) continue;
    const before = profile[demand.skill];
    const after = updateAssessment(before, demand.challenge, correct, evidence);
    profile = { ...profile, [demand.skill]: after };
    proficiencyChanges.push({
      skill: demand.skill,
      before: before.proficiency,
      after: after.proficiency,
    });
  }

  const lives = correct ? state.lives : state.lives - 1;
  const qualifying = correct && isGlobalCeiling(state, question);
  const ceilingCorrectAnswers =
    state.ceilingCorrectAnswers + (qualifying ? 1 : 0);
  const succeeded =
    ceilingCorrectAnswers >=
    NOTE_NAVIGATION_TUNING.director.ceilingCorrectAnswersRequired;
  const status = succeeded ? "succeeded" : lives <= 0 ? "failed" : "active";
  const result: AnswerResult = {
    correct,
    correctAnswer: question.answer,
    proficiencyChanges,
  };
  return {
    result,
    state: {
      ...state,
      status,
      lives,
      puzzlesPresented: state.puzzlesPresented + 1,
      ceilingCorrectAnswers,
      profile,
    },
  };
}
