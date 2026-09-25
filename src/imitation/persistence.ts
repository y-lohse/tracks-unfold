import { createImitationProfile } from "./profile";
import { IMITATION_TUNING } from "./tuning";
import { IMITATION_SKILLS, type ImitationProfile } from "./types";

export interface ImitationStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem?(key: string): void;
}

interface PersistedImitationProfileV1 {
  readonly version: 1;
  readonly profile: ImitationProfile;
}

function isUnitNumber(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 1
  );
}

function isProfile(value: unknown): value is ImitationProfile {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return IMITATION_SKILLS.every((skill) => {
    const assessment = record[skill];
    if (typeof assessment !== "object" || assessment === null) return false;
    const fields = assessment as Record<string, unknown>;
    return isUnitNumber(fields.proficiency) && isUnitNumber(fields.certainty);
  });
}

export function saveImitationProfile(
  profile: ImitationProfile,
  storage: ImitationStorage,
): void {
  const payload: PersistedImitationProfileV1 = {
    version: IMITATION_TUNING.persistence.version,
    profile,
  };
  storage.setItem(IMITATION_TUNING.persistence.key, JSON.stringify(payload));
}

export function loadImitationProfile(
  storage: ImitationStorage,
): ImitationProfile {
  const serialized = storage.getItem(IMITATION_TUNING.persistence.key);
  if (serialized === null) return createImitationProfile();
  try {
    const payload = JSON.parse(serialized) as Record<string, unknown>;
    if (
      payload.version !== IMITATION_TUNING.persistence.version ||
      !isProfile(payload.profile)
    ) {
      return createImitationProfile();
    }
    return createImitationProfile(payload.profile);
  } catch {
    return createImitationProfile();
  }
}

export function clearImitationProfile(storage: ImitationStorage): void {
  storage.removeItem?.(IMITATION_TUNING.persistence.key);
}
