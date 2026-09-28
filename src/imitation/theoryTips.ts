import { IMITATION_TUNING } from "./tuning";
import type { ImitationProfile, SkillAssessment } from "./types";

const { familiarProficiency, familiarCertainty } = IMITATION_TUNING.director;

function familiar(assessment: SkillAssessment) {
  return (
    assessment.proficiency >= familiarProficiency &&
    assessment.certainty >= familiarCertainty
  );
}

export function imitationTheoryTip(profile: ImitationProfile): string {
  if (familiar(profile.relationshipTransposition)) {
    return "Transposing a melody moves every note by the same distance, preserving its pattern.";
  }
  if (familiar(profile.intervalSize)) {
    return "An interval is the distance between two notes; its direction tells you whether the melody rises or falls.";
  }
  return "A melody's contour is its pattern of rising, falling, and repeated notes.";
}
