import { NOTE_NAVIGATION_TUNING } from "./tuning";
import type { PlayerProfile, SkillAssessment } from "./types";

const {
  familiarProficiency,
  familiarCertainty,
  broadFocusProficiency,
  broadFocusCertainty,
} = NOTE_NAVIGATION_TUNING.director;

function familiar(assessment: SkillAssessment) {
  return (
    assessment.proficiency >= familiarProficiency &&
    assessment.certainty >= familiarCertainty
  );
}

function broadlyReady(assessment: SkillAssessment) {
  return (
    assessment.proficiency >= broadFocusProficiency &&
    assessment.certainty >= broadFocusCertainty
  );
}

export function navigationTheoryTip(profile: PlayerProfile): string {
  if (
    broadlyReady(profile.numericalDestination) &&
    broadlyReady(profile.intervalInterpretation)
  ) {
    return "C♯ and D♭ can sound the same pitch, even though they are written differently.";
  }
  if (
    familiar(profile.intervalInterpretation) ||
    familiar(profile.intervalIdentification)
  ) {
    return "An interval's number counts letter names; major, minor, or perfect describes its size.";
  }
  if (
    familiar(profile.numericalDestination) ||
    familiar(profile.numericalDistance)
  ) {
    return "Notes an octave apart share a letter name and are 12 semitones apart.";
  }
  return "A semitone is one step to the next key; a whole tone is two semitones.";
}
