import { NOTE_NAVIGATION_TUNING, clamp01 } from "./tuning";
import {
  SKILLS,
  type PlayerProfile,
  type Skill,
  type SkillAssessment,
} from "./types";

export function createDefaultProfile(): PlayerProfile {
  return Object.fromEntries(
    SKILLS.map((skill) => [
      skill,
      { ...NOTE_NAVIGATION_TUNING.defaultAssessment },
    ]),
  ) as unknown as PlayerProfile;
}

export function createProfile(
  assessments: Partial<Record<Skill, Partial<SkillAssessment>>> = {},
): PlayerProfile {
  const defaults = createDefaultProfile();
  return Object.fromEntries(
    SKILLS.map((skill) => {
      const assessment = assessments[skill];
      return [
        skill,
        {
          proficiency: clamp01(
            assessment?.proficiency ?? defaults[skill].proficiency,
          ),
          certainty: clamp01(
            assessment?.certainty ?? defaults[skill].certainty,
          ),
        },
      ];
    }),
  ) as unknown as PlayerProfile;
}
