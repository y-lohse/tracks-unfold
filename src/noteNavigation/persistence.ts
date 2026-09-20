import { createProfile } from "./profile";
import { NOTE_NAVIGATION_TUNING } from "./tuning";
import { SKILLS, type PlayerProfile, type SkillAssessment } from "./types";

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem?(key: string): void;
}

interface PersistedProfileV1 {
  readonly version: 1;
  readonly profile: PlayerProfile;
}

function isAssessment(value: unknown): value is SkillAssessment {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.proficiency === "number" &&
    Number.isFinite(candidate.proficiency) &&
    candidate.proficiency >= 0 &&
    candidate.proficiency <= 1 &&
    typeof candidate.certainty === "number" &&
    Number.isFinite(candidate.certainty) &&
    candidate.certainty >= 0 &&
    candidate.certainty <= 1
  );
}

function isProfile(value: unknown): value is PlayerProfile {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return SKILLS.every((skill) => isAssessment(candidate[skill]));
}

export function saveProfile(
  profile: PlayerProfile,
  storage: StorageLike,
): void {
  const payload: PersistedProfileV1 = {
    version: NOTE_NAVIGATION_TUNING.persistence.version,
    profile,
  };
  storage.setItem(
    NOTE_NAVIGATION_TUNING.persistence.key,
    JSON.stringify(payload),
  );
}

export function loadProfile(storage: StorageLike): PlayerProfile {
  const serialized = storage.getItem(NOTE_NAVIGATION_TUNING.persistence.key);
  if (serialized === null) return createProfile();
  try {
    const payload = JSON.parse(serialized) as Record<string, unknown>;
    if (
      payload.version !== NOTE_NAVIGATION_TUNING.persistence.version ||
      !isProfile(payload.profile)
    ) {
      return createProfile();
    }
    return createProfile(payload.profile);
  } catch {
    return createProfile();
  }
}

export function clearSavedProfile(storage: StorageLike): void {
  storage.removeItem?.(NOTE_NAVIGATION_TUNING.persistence.key);
}
