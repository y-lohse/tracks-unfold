import {
  DEFAULT_INSTRUMENT_SOUND,
  INSTRUMENT_PRESETS,
  type InstrumentSound,
} from "./instrumentPresets";

export const INSTRUMENT_STORAGE_KEY = "tracks-unfold.instrument";

type InstrumentStorage = Pick<Storage, "getItem" | "setItem">;

function isInstrumentSound(value: unknown): value is InstrumentSound {
  if (typeof value !== "object" || value === null) return false;
  return (Object.keys(INSTRUMENT_PRESETS) as (keyof InstrumentSound)[]).every(
    (slot) =>
      slot in value &&
      INSTRUMENT_PRESETS[slot].some(
        (preset) => preset.id === (value as Record<string, unknown>)[slot],
      ),
  );
}

export function loadInstrumentSound(
  storage: InstrumentStorage,
): InstrumentSound {
  const raw = storage.getItem(INSTRUMENT_STORAGE_KEY);
  if (raw !== null) {
    try {
      const data: unknown = JSON.parse(raw);
      if (
        typeof data === "object" &&
        data !== null &&
        "version" in data &&
        data.version === 1 &&
        "sound" in data
      ) {
        let sound = data.sound;
        // Version 1's removed Pluck migrates to Round in memory only, preserving
        // the other choices without forcing a storage write during loading.
        if (
          typeof sound === "object" &&
          sound !== null &&
          "shape" in sound &&
          sound.shape === "pluck"
        ) {
          sound = { ...sound, shape: "round" };
        }
        if (isInstrumentSound(sound)) {
          const { tone, shape, filter, effect } = sound;
          return { tone, shape, filter, effect };
        }
      }
    } catch {
      // Malformed stored data falls back without overwriting the saved value.
    }
  }
  return { ...DEFAULT_INSTRUMENT_SOUND };
}

export function saveInstrumentSound(
  sound: InstrumentSound,
  storage: InstrumentStorage,
): void {
  if (!isInstrumentSound(sound)) throw new Error("Invalid instrument sound");
  storage.setItem(
    INSTRUMENT_STORAGE_KEY,
    JSON.stringify({ version: 1, sound }),
  );
}
