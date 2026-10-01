import { describe, expect, it } from "vitest";
import {
  DEFAULT_INSTRUMENT_SOUND,
  INSTRUMENT_PRESETS,
} from "./instrumentPresets";

describe("instrument presets", () => {
  it("offers all five discrete choices in each of the four slots", () => {
    expect(Object.keys(INSTRUMENT_PRESETS)).toEqual([
      "tone",
      "shape",
      "filter",
      "effect",
    ]);
    expect(INSTRUMENT_PRESETS.tone.map(({ id }) => id)).toEqual([
      "sine",
      "triangle",
      "square",
      "saw",
      "reed",
    ]);
    expect(INSTRUMENT_PRESETS.shape.map(({ id }) => id)).toEqual([
      "steady",
      "round",
      "struck",
      "soft",
      "swell",
    ]);
    expect(INSTRUMENT_PRESETS.filter.map(({ id }) => id)).toEqual([
      "open",
      "mellow",
      "thin",
      "focused",
      "bloom",
    ]);
    expect(INSTRUMENT_PRESETS.effect.map(({ id }) => id)).toEqual([
      "dry",
      "room",
      "hall",
      "warmth",
      "grit",
    ]);
  });

  it("provides labels, descriptions, unique IDs, and an available default for every slot", () => {
    for (const slot of Object.keys(
      INSTRUMENT_PRESETS,
    ) as (keyof typeof INSTRUMENT_PRESETS)[]) {
      const choices = INSTRUMENT_PRESETS[slot];
      expect(new Set(choices.map(({ id }) => id)).size).toBe(choices.length);
      expect(
        choices.some(({ id }) => id === DEFAULT_INSTRUMENT_SOUND[slot]),
      ).toBe(true);
      for (const choice of choices) {
        expect(choice.label.trim()).not.toBe("");
        expect(choice.description.trim()).not.toBe("");
      }
    }
  });
});
