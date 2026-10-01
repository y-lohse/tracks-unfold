import { describe, expect, it, vi } from "vitest";

import { DEFAULT_INSTRUMENT_SOUND } from "./instrumentPresets";
import {
  INSTRUMENT_STORAGE_KEY,
  loadInstrumentSound,
  saveInstrumentSound,
} from "./instrumentStorage";

function storage(raw: string | null = null) {
  let value = raw;
  return {
    getItem: vi.fn(() => value),
    setItem: vi.fn((_key: string, next: string) => {
      value = next;
    }),
  };
}

describe("instrument selections", () => {
  it("round trips all four selections in a versioned envelope", () => {
    const saved = storage();
    const sound = {
      tone: "reed",
      shape: "round",
      filter: "bloom",
      effect: "hall",
    } as const;
    saveInstrumentSound(sound, saved);
    expect(saved.setItem).toHaveBeenCalledWith(
      INSTRUMENT_STORAGE_KEY,
      JSON.stringify({ version: 1, sound }),
    );
    expect(loadInstrumentSound(saved)).toEqual(sound);
  });

  it("migrates version 1 Pluck to Round while preserving other choices without writing", () => {
    const sound = {
      tone: "reed",
      shape: "pluck",
      filter: "bloom",
      effect: "hall",
    };
    const raw = JSON.stringify({ version: 1, sound });
    const saved = storage(raw);
    expect(loadInstrumentSound(saved)).toEqual({ ...sound, shape: "round" });
    expect(saved.setItem).not.toHaveBeenCalled();
    expect(saved.getItem()).toBe(raw);
  });

  it.each([
    null,
    "garbage",
    "null",
    "[]",
    "{}",
    JSON.stringify({ version: 2, sound: DEFAULT_INSTRUMENT_SOUND }),
    JSON.stringify({
      version: 2,
      sound: { ...DEFAULT_INSTRUMENT_SOUND, shape: "pluck" },
    }),
    JSON.stringify({
      version: 1,
      sound: { ...DEFAULT_INSTRUMENT_SOUND, shape: "pluck", tone: "unknown" },
    }),
    JSON.stringify({
      version: 1,
      sound: { ...DEFAULT_INSTRUMENT_SOUND, tone: "unknown" },
    }),
    JSON.stringify({
      version: 1,
      sound: { ...DEFAULT_INSTRUMENT_SOUND, shape: null },
    }),
    JSON.stringify({ version: 1, sound: { tone: "sine" } }),
  ])("uses defaults without rewriting invalid or absent data: %s", (raw) => {
    const saved = storage(raw);
    expect(loadInstrumentSound(saved)).toEqual(DEFAULT_INSTRUMENT_SOUND);
    expect(saved.setItem).not.toHaveBeenCalled();
  });

  it("returns a fresh copy and propagates storage failures", () => {
    const saved = storage();
    const first = loadInstrumentSound(saved);
    first.tone = "saw";
    expect(loadInstrumentSound(saved)).toEqual(DEFAULT_INSTRUMENT_SOUND);
    saved.getItem.mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => loadInstrumentSound(saved)).toThrow("blocked");
    saved.setItem.mockImplementation(() => {
      throw new Error("quota");
    });
    expect(() => saveInstrumentSound(first, saved)).toThrow("quota");
  });
});
