import mean from "lodash-es/mean.js";

import { createRunDirector } from "../run/director";
import { clampUnit } from "../utils/numbers";
import { buildSubmissionFeedback } from "./feedback";
import { checkResponse } from "./checker";
import { stageImitationControls } from "./controls";
import { assessmentEvidenceForSubmission } from "./evidence";
import { generateImitationPuzzle } from "./generator";
import { IMITATION_TUNING } from "./tuning";
import {
  IMITATION_SKILLS,
  type ImitationControls,
  type ImitationProfile,
  type ImitationPuzzle,
  type ImitationRunState,
  type ImitationSkill,
  type Rng,
  type SubmissionCheck,
  type SubmissionFeedback,
} from "./types";

const director = createRunDirector({
  skills: IMITATION_SKILLS,
  tuning: IMITATION_TUNING.director,
  runIdPrefix: "imitation",
});

export const chooseImitationRunFocus = director.chooseRunFocus;
export function startImitationRun(
  profile: ImitationProfile,
  rng: Rng,
  runId?: string,
): ImitationRunState {
  return director.startRun(profile, rng, runId);
}
export const imitationRunPressure = director.runPressure;
export const assignedImitationChallenge = director.assignedChallengeForPuzzle;

/** Provisional many-to-many mapping from skill challenge to the nine controls. */
export function controlsForSkillChallenges(
  challenge: Readonly<Record<ImitationSkill, number>>,
  emphasis?: Readonly<Record<ImitationSkill, number>>,
): ImitationControls {
  const direction = clampUnit(challenge.pitchDirection);
  const interval = clampUnit(challenge.intervalSize);
  const navigation = clampUnit(challenge.pitchNavigation);
  const transposition = clampUnit(challenge.relationshipTransposition);
  const average = mean([direction, interval, navigation, transposition]);
  const strongestEmphasis = emphasis ? Math.max(...Object.values(emphasis)) : 1;
  const supportScale = (skill: ImitationSkill) => {
    const relativeEmphasis = emphasis
      ? emphasis[skill] / strongestEmphasis
      : 1 / IMITATION_SKILLS.length;
    return 0.7 + relativeEmphasis * 0.3;
  };
  const contourStructure = clampUnit(direction * 0.8 + interval * 0.2);
  let phraseLength = clampUnit(average * supportScale("pitchDirection"));
  // Required repeats/turns need at least three movements.
  if (contourStructure >= 0.6) phraseLength = Math.max(phraseLength, 0.25);

  return {
    contourStructure,
    phraseLength,
    intervalPrecision: interval,
    pitchSelectionDemand: navigation,
    anchorPosition: clampUnit(
      transposition * supportScale("relationshipTransposition"),
    ),
    transposition,
    referencePlays: clampUnit(average * supportScale("intervalSize")),
    pitchAuditions: clampUnit(navigation * supportScale("pitchNavigation")),
    referenceMovementRange: clampUnit(
      interval * 0.5 + navigation * 0.3 + direction * 0.2,
    ),
  };
}

export interface PreparedImitationPuzzle {
  readonly state: ImitationRunState;
  readonly puzzle: ImitationPuzzle;
}

export function focusedImitationChallenges(
  state: ImitationRunState,
  assignedChallenge: Readonly<Record<ImitationSkill, number>>,
): Readonly<Record<ImitationSkill, number>> {
  const strongestWeight = Math.max(
    ...IMITATION_SKILLS.map((skill) => state.focusWeights[skill]),
  );
  const strongestChallenge = Math.max(...Object.values(assignedChallenge));
  const { startsAtChallenge, completesAtChallenge } =
    IMITATION_TUNING.focusConvergence;
  const convergence = clampUnit(
    (strongestChallenge - startsAtChallenge) /
      (completesAtChallenge - startsAtChallenge),
  );
  return Object.fromEntries(
    IMITATION_SKILLS.map((skill) => {
      const relativeEmphasis = state.focusWeights[skill] / strongestWeight;
      const focusScale = 0.4 + relativeEmphasis * 0.6;
      const demandScale = focusScale + (1 - focusScale) * convergence;
      return [skill, clampUnit(assignedChallenge[skill] * demandScale)];
    }),
  ) as Record<ImitationSkill, number>;
}

export function prepareNextImitationPuzzle(
  state: ImitationRunState,
  rng: Rng,
  recentReferencePitches: readonly (readonly number[])[] = [],
): PreparedImitationPuzzle {
  if (state.status !== "active") {
    throw new Error("Cannot create a puzzle for a completed run");
  }
  const puzzleNumber = state.puzzlesPresented + 1;
  const assignedChallenge = assignedImitationChallenge(state, puzzleNumber);
  const puzzleChallenges = focusedImitationChallenges(state, assignedChallenge);
  const desiredControls = controlsForSkillChallenges(
    puzzleChallenges,
    state.focusWeights,
  );
  const staged = stageImitationControls(
    state.lastControls,
    desiredControls,
    state.controlStagingCursor,
  );
  const controls = staged.controls;
  const preparedState: ImitationRunState = {
    ...state,
    assignedChallenge,
    lastControls: controls,
    controlStagingCursor: staged.nextCursor,
  };
  return {
    state: preparedState,
    puzzle: generateImitationPuzzle({
      id: `${state.runId}:${puzzleNumber}`,
      controls,
      targetedSkills: puzzleChallenges,
      recentReferencePitches,
      maxAttempts: IMITATION_TUNING.generation.maximumAttempts,
      rng,
    }),
  };
}

function isCeiling(state: ImitationRunState): boolean {
  return IMITATION_SKILLS.every(
    (skill) => state.assignedChallenge[skill] === 1,
  );
}

export interface ImitationSubmissionResult {
  readonly state: ImitationRunState;
  readonly check: SubmissionCheck;
  readonly feedback: SubmissionFeedback;
  readonly proficiencyChanges: readonly {
    readonly skill: ImitationSkill;
    readonly before: number;
    readonly after: number;
  }[];
}

export function submitImitationResponse(
  state: ImitationRunState,
  puzzle: ImitationPuzzle,
  response: readonly number[],
): ImitationSubmissionResult {
  if (state.status !== "active") {
    throw new Error("Cannot answer a puzzle for a completed run");
  }
  if (puzzle.id !== `${state.runId}:${state.puzzlesPresented + 1}`) {
    throw new Error("Puzzle does not belong to the next position in this run");
  }
  const check = checkResponse(puzzle, response);
  const completed = director.completePuzzle(state, {
    correct: check.accepted,
    atCeiling: isCeiling(state),
    evidence: assessmentEvidenceForSubmission(puzzle, check),
  });
  return {
    state: completed.state,
    check,
    feedback: buildSubmissionFeedback(puzzle, response, check),
    proficiencyChanges: completed.assessmentChanges.map(
      ({ skill, before, after }) => ({
        skill,
        before: before.proficiency,
        after: after.proficiency,
      }),
    ),
  };
}
