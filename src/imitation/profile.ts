import { clampUnit } from "../utils/numbers";
import {
  IMITATION_SKILLS,
  type ImitationProfile,
  type SkillAssessment,
} from "./types";
import { IMITATION_TUNING } from "./tuning";

export function createImitationProfile(
  assessments: Partial<
    Record<keyof ImitationProfile, Partial<SkillAssessment>>
  > = {},
): ImitationProfile {
  return Object.fromEntries(
    IMITATION_SKILLS.map((skill) => {
      const value = assessments[skill];
      return [
        skill,
        {
          proficiency: clampUnit(
            value?.proficiency ??
              IMITATION_TUNING.defaultAssessment.proficiency,
          ),
          certainty: clampUnit(
            value?.certainty ?? IMITATION_TUNING.defaultAssessment.certainty,
          ),
        },
      ];
    }),
  ) as unknown as ImitationProfile;
}
