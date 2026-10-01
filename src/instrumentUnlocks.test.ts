import { afterEach, describe, expect, it, vi } from "vitest";

import {
  DEFAULT_INSTRUMENT_SOUND,
  INSTRUMENT_PRESETS,
  type InstrumentSound,
} from "./instrumentPresets";
import {
  availableInstrumentSound,
  instrumentMilestones,
  instrumentPresetRequirement,
  isInstrumentPresetUnlocked,
} from "./instrumentUnlocks";
import * as progression from "./progression";
import {
  loadUnlocks,
  profileProgress,
  reconcileUnlocks,
  rewardMilestones,
  saveUnlocks,
  type ProgressionStorage,
} from "./progression";

const slots = ["tone", "shape", "filter", "effect"] as const;
const rewards = [
  {
    puzzle: "navigation",
    id: "reward:navigation:33",
    threshold: 0.33,
    slot: "shape",
    preset: "round",
    label: "Round",
    requirement: "Navigation 33%",
  },
  {
    puzzle: "navigation",
    id: "reward:navigation:66",
    threshold: 0.66,
    slot: "filter",
    preset: "mellow",
    label: "Mellow",
    requirement: "Navigation 66%",
  },
  {
    puzzle: "navigation",
    id: "reward:navigation:100",
    threshold: 1,
    slot: "tone",
    preset: "triangle",
    label: "Triangle",
    requirement: "Navigation 100%",
  },
  {
    puzzle: "imitation",
    id: "reward:imitation:33",
    threshold: 0.33,
    slot: "effect",
    preset: "room",
    label: "Room",
    requirement: "Imitation 33%",
  },
  {
    puzzle: "imitation",
    id: "reward:imitation:66",
    threshold: 0.66,
    slot: "effect",
    preset: "grit",
    label: "Grit",
    requirement: "Imitation 66%",
  },
  {
    puzzle: "imitation",
    id: "reward:imitation:100",
    threshold: 1,
    slot: "tone",
    preset: "reed",
    label: "Reed",
    requirement: "Imitation 100%",
  },
] as const;

function memoryStorage(): ProgressionStorage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
}

afterEach(() => vi.restoreAllMocks());

describe("instrument preset unlocks", () => {
  it("makes only the four defaults available and locks all 16 alternatives", () => {
    let locked = 0;
    for (const slot of slots) {
      for (const { id } of INSTRUMENT_PRESETS[slot]) {
        const isDefault = id === DEFAULT_INSTRUMENT_SOUND[slot];
        expect(isInstrumentPresetUnlocked(slot, id, [])).toBe(isDefault);
        if (!isDefault) locked++;
      }
    }
    expect(locked).toBe(16);
  });

  it.each(rewards)(
    "unlocks $preset at exactly $id, not just below",
    ({ puzzle, id, threshold, slot, preset }) => {
      const below = reconcileUnlocks([], { [puzzle]: threshold - 0.000001 });
      expect(isInstrumentPresetUnlocked(slot, preset, below)).toBe(false);
      const exact = reconcileUnlocks([], { [puzzle]: threshold });
      expect(exact).toContain(id);
      expect(isInstrumentPresetUnlocked(slot, preset, exact)).toBe(true);
    },
  );

  it.each(rewards)(
    "grants only $preset for the isolated ledger ID $id",
    ({ id, slot, preset }) => {
      for (const candidateSlot of slots) {
        for (const candidate of INSTRUMENT_PRESETS[candidateSlot]) {
          expect(
            isInstrumentPresetUnlocked(candidateSlot, candidate.id, [id]),
          ).toBe(
            candidate.id === DEFAULT_INSTRUMENT_SOUND[candidateSlot] ||
              (candidateSlot === slot && candidate.id === preset),
          );
        }
      }
    },
  );

  it("preserves earned access through save/load and declining progress", () => {
    const storage = memoryStorage();
    saveUnlocks(reconcileUnlocks([], { navigation: 1, imitation: 1 }), storage);
    const declined = reconcileUnlocks(loadUnlocks(storage), {
      navigation: 0,
      imitation: 0,
    });
    saveUnlocks(declined, storage);
    const reloaded = loadUnlocks(storage);
    for (const { slot, preset } of rewards) {
      expect(isInstrumentPresetUnlocked(slot, preset, reloaded)).toBe(true);
    }
  });

  it("does not grant access for unknown IDs or puzzle unlocks", () => {
    const unlocks = [
      "reward:navigation:999",
      "reward:imitation:room",
      "preset:square",
      "puzzle:imitation",
    ];
    for (const slot of slots) {
      for (const { id } of INSTRUMENT_PRESETS[slot]) {
        expect(isInstrumentPresetUnlocked(slot, id, unlocks)).toBe(
          id === DEFAULT_INSTRUMENT_SOUND[slot],
        );
      }
      expect(isInstrumentPresetUnlocked(slot, "unknown", unlocks)).toBe(false);
    }
  });

  it("aggregates existing profiles with saved permanent rewards during bootstrap", () => {
    const storage = memoryStorage();
    saveUnlocks(["reward:imitation:100", "future:reward"], storage);
    const unlocks = reconcileUnlocks(loadUnlocks(storage), {
      navigation: profileProgress({
        first: { proficiency: 1 },
        second: { proficiency: 0.5 },
      }),
      imitation: profileProgress({
        first: { proficiency: 0.2 },
        second: { proficiency: 0 },
      }),
    });
    expect(
      rewards.map(({ slot, preset }) =>
        isInstrumentPresetUnlocked(slot, preset, unlocks),
      ),
    ).toEqual([true, true, false, false, false, true]);
    expect(unlocks).toContain("future:reward");
  });

  it("keeps all ten unassigned presets locked even after both puzzles reach 100%", () => {
    const unlocks = reconcileUnlocks([], { navigation: 1, imitation: 1 });
    let unassigned = 0;
    for (const slot of slots) {
      expect(
        isInstrumentPresetUnlocked(
          slot,
          DEFAULT_INSTRUMENT_SOUND[slot],
          unlocks,
        ),
      ).toBe(true);
      for (const { id } of INSTRUMENT_PRESETS[slot]) {
        if (
          id === DEFAULT_INSTRUMENT_SOUND[slot] ||
          rewards.some((reward) => reward.slot === slot && reward.preset === id)
        )
          continue;
        expect(isInstrumentPresetUnlocked(slot, id, unlocks)).toBe(false);
        expect(instrumentPresetRequirement(slot, id)).toBeUndefined();
        unassigned++;
      }
      expect(isInstrumentPresetUnlocked(slot, "unknown", unlocks)).toBe(false);
    }
    expect(unassigned).toBe(10);
  });
});

describe("availableInstrumentSound", () => {
  it("falls back per slot without mutating the requested sound or ledger", () => {
    const requested = Object.freeze<InstrumentSound>({
      tone: "reed",
      shape: "swell",
      filter: "mellow",
      effect: "room",
    });
    const unlocks = Object.freeze([
      "reward:imitation:100",
      "reward:navigation:66",
    ]);
    expect(availableInstrumentSound(requested, unlocks)).toEqual({
      tone: "reed",
      shape: "steady",
      filter: "mellow",
      effect: "dry",
    });
    expect(requested).toEqual({
      tone: "reed",
      shape: "swell",
      filter: "mellow",
      effect: "room",
    });
    expect(unlocks).toEqual(["reward:imitation:100", "reward:navigation:66"]);
  });

  it.each(slots)(
    "replaces an unknown runtime choice in $0 while retaining earned choices",
    (slot) => {
      const requested = {
        tone: "triangle",
        shape: "round",
        filter: "mellow",
        effect: "grit",
      } satisfies InstrumentSound;
      const invalid = { ...requested, [slot]: "unknown" } as InstrumentSound;
      const unlocks = reconcileUnlocks([], { navigation: 1, imitation: 1 });
      expect(availableInstrumentSound(invalid, unlocks)).toEqual({
        ...requested,
        [slot]: DEFAULT_INSTRUMENT_SOUND[slot],
      });
    },
  );

  it("returns defaults when nothing is earned, and a fresh value even for defaults", () => {
    expect(
      availableInstrumentSound(
        { tone: "triangle", shape: "round", filter: "mellow", effect: "room" },
        [],
      ),
    ).toEqual(DEFAULT_INSTRUMENT_SOUND);
    const result = availableInstrumentSound(DEFAULT_INSTRUMENT_SOUND, []);
    expect(result).toEqual(DEFAULT_INSTRUMENT_SOUND);
    expect(result).not.toBe(DEFAULT_INSTRUMENT_SOUND);
  });
});

describe("instrument reward presentation", () => {
  it.each(["navigation", "imitation"] as const)(
    "preserves %s milestones and adds exact short preset labels",
    (puzzle) => {
      const unlocks = ["reward:navigation:66", "reward:imitation:100"];
      expect(instrumentMilestones(puzzle, unlocks)).toEqual(
        rewardMilestones(puzzle, unlocks).map((milestone) => ({
          ...milestone,
          label: rewards.find(({ id }) => id === milestone.id)!.label,
        })),
      );
    },
  );

  it.each(["rhythm", "contours", "intervals"] as const)(
    "does not invent milestones for %s",
    (puzzle) => {
      expect(instrumentMilestones(puzzle, [])).toEqual([]);
    },
  );

  it.each(rewards)(
    "describes the requirement for $preset",
    ({ slot, preset, requirement }) => {
      expect(instrumentPresetRequirement(slot, preset)).toBe(requirement);
    },
  );

  it("has no requirement for defaults, unknown presets, or a preset in the wrong slot", () => {
    for (const slot of slots) {
      expect(
        instrumentPresetRequirement(slot, DEFAULT_INSTRUMENT_SOUND[slot]),
      ).toBeUndefined();
      expect(instrumentPresetRequirement(slot, "unknown")).toBeUndefined();
    }
    expect(instrumentPresetRequirement("tone", "round")).toBeUndefined();
  });

  it("uses progression thresholds rather than inferring them from reward IDs, and labels unknown milestones", () => {
    vi.spyOn(progression, "rewardMilestones").mockReturnValue([
      { id: "reward:navigation:33", threshold: 0.42, earned: true },
      { id: "reward:navigation:future", threshold: 0.9, earned: false },
    ]);
    expect(instrumentPresetRequirement("shape", "round")).toBe(
      "Navigation 42%",
    );
    expect(instrumentMilestones("navigation", [])).toEqual([
      {
        id: "reward:navigation:33",
        threshold: 0.42,
        earned: true,
        label: "Round",
      },
      {
        id: "reward:navigation:future",
        threshold: 0.9,
        earned: false,
        label: "Sound reward",
      },
    ]);
    expect(instrumentPresetRequirement("filter", "mellow")).toBeUndefined();
  });
});
