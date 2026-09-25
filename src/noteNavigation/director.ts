import mean from "lodash-es/mean.js";

import { createRunDirector } from "../run/director";
import { clampUnit } from "../utils/numbers";
import { generateQuestion, isCorrectAnswer } from "./questions";
import { weightedChoice } from "./random";
import { NOTE_NAVIGATION_TUNING } from "./tuning";
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

const director = createRunDirector({
  skills: SKILLS,
  tuning: NOTE_NAVIGATION_TUNING.director,
  runIdPrefix: "note-navigation",
});

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

export const chooseRunFocus = director.chooseRunFocus;
export const startRun = director.startRun;
export const runPressure = director.runPressure;
export const assignedChallengeForPuzzle = director.assignedChallengeForPuzzle;

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
  const globalAverage = mean(SKILLS.map((skill) => challenge[skill]));
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
    navigationDemand: clampUnit(navigationDemand),
    intervalNameDemand: clampUnit(intervalNameDemand),
    answerChoiceBreadth: clampUnit(globalAverage),
  };
}

export function prepareNextQuestion(
  state: RunState,
  rng: Rng,
): PreparedQuestion {
  if (state.status !== "active") {
    throw new Error("Cannot create a question for a completed run");
  }
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
  if (state.status !== "active") {
    throw new Error("Cannot answer a question for a completed run");
  }
  if (question.id !== `${state.runId}:${state.puzzlesPresented + 1}`) {
    throw new Error("Question does not belong to the next puzzle in this run");
  }

  const correct = isCorrectAnswer(question, submitted);
  const completed = director.completePuzzle(state, {
    correct,
    atCeiling: isGlobalCeiling(state, question),
    evidence: question.demands.map((demand) => ({ ...demand, correct })),
  });
  const proficiencyChanges: SkillProficiencyChange[] =
    completed.assessmentChanges.map(({ skill, before, after }) => ({
      skill,
      before: before.proficiency,
      after: after.proficiency,
    }));
  const result: AnswerResult = {
    correct,
    correctAnswer: question.answer,
    proficiencyChanges,
  };
  return { result, state: completed.state };
}
