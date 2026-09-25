import type { AssessmentEvidence } from "../run/director";
import { clampUnit } from "../utils/numbers";
import type { ImitationPuzzle, ImitationSkill, SubmissionCheck } from "./types";

function supportForPuzzle(puzzle: ImitationPuzzle): number {
  const selectionSupport =
    puzzle.settings.pitchSelectionDemand === "curated"
      ? 0.35
      : puzzle.settings.pitchSelectionDemand === "expanded"
        ? 0.15
        : 0;
  const playSupport =
    puzzle.budgets.referencePlays === null
      ? 0.25
      : puzzle.budgets.referencePlays >= 3
        ? 0.15
        : puzzle.budgets.referencePlays === 2
          ? 0.08
          : 0;
  const auditionSupport =
    puzzle.budgets.pitchAuditions === null
      ? 0.25
      : puzzle.budgets.pitchAuditions > puzzle.referencePitches.length - 1
        ? 0.15
        : puzzle.budgets.pitchAuditions > 0
          ? 0.08
          : 0;
  return clampUnit(selectionSupport + playSupport + auditionSupport);
}

function challengeFor(puzzle: ImitationPuzzle, skill: ImitationSkill): number {
  return clampUnit(puzzle.targetedSkills[skill] ?? 0);
}

/**
 * Produces movement-level observations whose total raw weight is at most one
 * per skill for a submitted phrase. Weight/support values are provisional
 * director tuning, not musical rules.
 */
export function assessmentEvidenceForSubmission(
  puzzle: ImitationPuzzle,
  check: SubmissionCheck,
): AssessmentEvidence<ImitationSkill>[] {
  if (check.movements.length === 0) return [];
  const evidence: AssessmentEvidence<ImitationSkill>[] = [];
  const support = supportForPuzzle(puzzle);
  const movementWeight = 1 / check.movements.length;
  const mixedFailureMultiplier = check.accepted ? 1 : 0.7;

  for (const movement of check.movements) {
    evidence.push({
      skill: "pitchDirection",
      challenge: challengeFor(puzzle, "pitchDirection"),
      correct: movement.directionMatches,
      weight: movementWeight * mixedFailureMultiplier,
      support,
    });

    if (movement.expected !== 0) {
      const precisionRequired = puzzle.contract.kind !== "direction";
      const aboveContractExact = !precisionRequired && movement.exact;
      if (precisionRequired || aboveContractExact) {
        evidence.push({
          skill: "intervalSize",
          challenge: challengeFor(puzzle, "intervalSize"),
          correct: movement.accepted,
          weight:
            movementWeight *
            mixedFailureMultiplier *
            (aboveContractExact ? 0.25 : 1),
          support,
        });
      }
    }

    evidence.push({
      skill: "pitchNavigation",
      challenge: challengeFor(puzzle, "pitchNavigation"),
      correct: movement.accepted && check.supplyValid && check.anchorValid,
      weight: movementWeight * mixedFailureMultiplier,
      support,
    });

    if (puzzle.features.anchorShift !== 0) {
      evidence.push({
        skill: "relationshipTransposition",
        challenge: challengeFor(puzzle, "relationshipTransposition"),
        correct: movement.accepted,
        weight: movementWeight * mixedFailureMultiplier,
        support,
      });
    }
  }
  return evidence;
}
