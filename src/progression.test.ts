import { describe, expect, it } from "vitest";

import {
  clearUnlocks,
  isPuzzleUnlocked,
  loadUnlocks,
  profileProgress,
  puzzleRequirements,
  reconcileUnlocks,
  rewardMilestones,
  saveUnlocks,
  type ProgressionStorage,
  type PuzzleId,
} from "./progression";

const key = "tracks-unfold.progression.unlocks";

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    },
  } satisfies ProgressionStorage;
}

describe("profileProgress", () => {
  it("returns zero for an empty profile", () => {
    expect(profileProgress({})).toBe(0);
  });

  it("computes the current unweighted mean without mutating the profile", () => {
    const profile = Object.freeze({
      first: Object.freeze({ proficiency: 0.2, certainty: 1 }),
      second: Object.freeze({ proficiency: 0.8, certainty: 0 }),
    });
    expect(profileProgress(profile)).toBe(0.5);
    expect(profileProgress({ first: { proficiency: 1 } })).toBe(1);
    expect(profileProgress({ first: { proficiency: 0 } })).toBe(0);
  });

  it.each([NaN, Infinity, -Infinity, -0.1, 1.1])(
    "counts invalid proficiency %s as zero without dropping the skill",
    (proficiency) => {
      expect(
        profileProgress({ a: { proficiency }, b: { proficiency: 1 } }),
      ).toBe(0.5);
    },
  );
});

describe("unlock rules", () => {
  it("always makes navigation available and locks other puzzles initially", () => {
    expect(isPuzzleUnlocked("navigation", [])).toBe(true);
    for (const puzzle of [
      "imitation",
      "rhythm",
      "contours",
      "intervals",
    ] as const) {
      expect(isPuzzleUnlocked(puzzle, [])).toBe(false);
    }
  });

  it.each([0.199999, 0.2, 0.200001])(
    "unlocks the navigation branches inclusively at 20%% (%s)",
    (navigation) => {
      const unlocks = reconcileUnlocks([], { navigation });
      for (const puzzle of ["imitation", "rhythm", "contours"] as const) {
        expect(isPuzzleUnlocked(puzzle, unlocks)).toBe(navigation >= 0.2);
      }
      expect(isPuzzleUnlocked("intervals", unlocks)).toBe(false);
    },
  );

  it.each([0.599999, 0.6, 0.600001])(
    "unlocks intervals independently at 60%% imitation (%s)",
    (imitation) => {
      const unlocks = reconcileUnlocks([], { imitation });
      expect(isPuzzleUnlocked("intervals", unlocks)).toBe(imitation >= 0.6);
      expect(isPuzzleUnlocked("imitation", unlocks)).toBe(false);
    },
  );

  it.each<PuzzleId>(["navigation", "imitation"])(
    "awards each %s placeholder at the exact fraction, not rounded display progress",
    (puzzle) => {
      expect(
        rewardMilestones(puzzle, []).map(({ threshold }) => threshold),
      ).toEqual([0.33, 0.66, 1]);
      for (const threshold of [0.33, 0.66, 1]) {
        for (const progress of [threshold - 0.000001, threshold]) {
          const unlocks = reconcileUnlocks([], { [puzzle]: progress });
          const milestones = rewardMilestones(puzzle, unlocks);
          expect(milestones.map(({ earned }) => earned)).toEqual(
            [0.33, 0.66, 1].map((value) => progress >= value),
          );
          expect(
            milestones.every(({ id }) => id.startsWith(`reward:${puzzle}:`)),
          ).toBe(true);
        }
      }
    },
  );

  it.each<PuzzleId>(["rhythm", "intervals"])(
    "does not invent rewards or outgoing unlocks for %s",
    (puzzle) => {
      expect(rewardMilestones(puzzle, [])).toEqual([]);
      expect(reconcileUnlocks([], { [puzzle]: 1 })).toEqual([]);
    },
  );

  it("keeps all earned and unknown IDs through decreases, missing reports, and repeated reconciliation", () => {
    const original = Object.freeze(["future:earned"]);
    const earned = reconcileUnlocks(original, { navigation: 1, imitation: 1 });
    expect(earned).toContain("future:earned");
    expect(new Set(earned).size).toBe(earned.length);
    expect(original).toEqual(["future:earned"]);
    expect(reconcileUnlocks(earned, { navigation: 0, imitation: 0 })).toEqual(
      earned,
    );
    expect(reconcileUnlocks(earned, {})).toEqual(earned);
    expect(reconcileUnlocks(earned, { navigation: 1, imitation: 1 })).toEqual(
      earned,
    );
    expect(
      rewardMilestones("navigation", earned).every(({ earned }) => earned),
    ).toBe(true);
  });

  it.each([NaN, Infinity, -Infinity, -1, 1.01, undefined])(
    "ignores invalid or missing progress %s without revoking IDs",
    (progress) => {
      expect(
        reconcileUnlocks(["future:earned"], {
          navigation: progress,
          imitation: progress,
        }),
      ).toEqual(["future:earned"]);
    },
  );

  it("deduplicates existing IDs and does not confuse rewards with puzzle unlocks", () => {
    expect(reconcileUnlocks(["future:earned", "future:earned"], {})).toEqual([
      "future:earned",
    ]);
    expect(isPuzzleUnlocked("imitation", ["reward:imitation:100"])).toBe(false);
    expect(
      rewardMilestones("imitation", ["puzzle:imitation"]).some(
        ({ earned }) => earned,
      ),
    ).toBe(false);
  });
});

describe("branching progression", () => {
  const cases: [PuzzleId, Partial<Record<PuzzleId, number>>][] = [
    ["chordfall", { navigation: 0.35 }],
    ["scaleConveyors", { navigation: 0.35 }],
    ["chordDraft", { imitation: 0.3 }],
    ["voicingSculpture", { chordfall: 0.35 }],
    ["numeralDominoes", { scaleConveyors: 0.35, chordfall: 0.35 }],
    ["melodyTrails", { scaleConveyors: 0.35, imitation: 0.3 }],
    ["tonalSwitchboard", { scaleConveyors: 0.45, contours: 0.35 }],
    ["coverVersions", { numeralDominoes: 0.4 }],
    ["coverVersions", { scaleConveyors: 0.4, melodyTrails: 0.3 }],
    ["harmonyFitting", { chordfall: 0.4, numeralDominoes: 0.4 }],
    [
      "progressionWordle",
      { chordDraft: 0.4, numeralDominoes: 0.4, contours: 0.35 },
    ],
  ];

  it.each(cases)(
    "requires every threshold of a route for %s",
    (puzzle, report) => {
      expect(isPuzzleUnlocked(puzzle, [])).toBe(false);
      expect(rewardMilestones(puzzle, [])).toEqual([]);
      expect(isPuzzleUnlocked(puzzle, reconcileUnlocks([], report))).toBe(true);
      for (const [source, threshold] of Object.entries(report)) {
        for (const invalid of [
          threshold - 0.000001,
          NaN,
          Infinity,
          -1,
          1.1,
          undefined,
        ]) {
          expect(
            isPuzzleUnlocked(
              puzzle,
              reconcileUnlocks([], { ...report, [source]: invalid }),
            ),
          ).toBe(false);
        }
      }
    },
  );

  it("combines permanent prerequisite milestones across partial reports and reloads", () => {
    const storage = memoryStorage();
    const first = reconcileUnlocks([], { scaleConveyors: 0.35 });
    expect(isPuzzleUnlocked("numeralDominoes", first)).toBe(false);
    saveUnlocks(first, storage);
    const earned = reconcileUnlocks(loadUnlocks(storage), {
      scaleConveyors: 0,
      chordfall: 0.35,
    });
    expect(isPuzzleUnlocked("numeralDominoes", earned)).toBe(true);
    expect(
      puzzleRequirements("numeralDominoes", earned)[0].requirements.every(
        (item) => item.earned,
      ),
    ).toBe(true);
    expect(
      reconcileUnlocks(earned, { chordfall: 0, scaleConveyors: 0 }),
    ).toEqual(earned);
  });

  it("exposes alternative routes without granting the other form's readiness", () => {
    const earned = reconcileUnlocks([], { numeralDominoes: 0.4 });
    const routes = puzzleRequirements("coverVersions", earned);
    expect(routes.map(({ label }) => label)).toEqual([
      "Chord covers",
      "Melody covers",
    ]);
    expect(routes[0].requirements.every((item) => item.earned)).toBe(true);
    expect(routes[1].requirements.some((item) => item.earned)).toBe(false);
    expect(puzzleRequirements("navigation", [])).toEqual([]);
  });

  it("preserves older unlocks without inventing historical prerequisite evidence", () => {
    const old = ["puzzle:imitation", "puzzle:intervals", "future:earned"];
    expect(reconcileUnlocks(old, {})).toEqual(old);
    expect(isPuzzleUnlocked("intervals", old)).toBe(true);
    expect(puzzleRequirements("intervals", old)[0].requirements[0].earned).toBe(
      false,
    );
    expect(isPuzzleUnlocked("chordDraft", old)).toBe(false);
  });
});

describe("unlock persistence", () => {
  it("round-trips earned IDs without storing profiles or current progress", () => {
    const storage = memoryStorage();
    expect(loadUnlocks(storage)).toEqual([]);
    const earned = reconcileUnlocks(["future:reward"], {
      navigation: 1,
      imitation: 1,
    });
    saveUnlocks(earned, storage);
    expect(JSON.parse(storage.getItem(key)!)).toEqual({
      version: 1,
      unlocks: earned,
    });
    const reloaded = loadUnlocks(storage);
    expect(reloaded).toEqual(earned);
    const decreased = reconcileUnlocks(reloaded, {
      navigation: 0,
      imitation: 0,
    });
    saveUnlocks(decreased, storage);
    expect(loadUnlocks(storage)).toEqual(earned);
  });

  it("preserves unknown nonblank string IDs and deduplicates on save and load", () => {
    const storage = memoryStorage();
    storage.setItem(
      key,
      JSON.stringify({
        version: 1,
        unlocks: ["future:one", "future:one", "older reward"],
      }),
    );
    expect(loadUnlocks(storage)).toEqual(["future:one", "older reward"]);
    saveUnlocks(["future:one", "future:one"], storage);
    expect(JSON.parse(storage.getItem(key)!)).toEqual({
      version: 1,
      unlocks: ["future:one"],
    });
  });

  it.each([
    "broken JSON",
    "null",
    "[]",
    "true",
    "1",
    '"text"',
    "{}",
    JSON.stringify({ version: 2, unlocks: ["future:one"] }),
    JSON.stringify({ version: "1", unlocks: [] }),
    JSON.stringify({ unlocks: [] }),
    JSON.stringify({ version: 1 }),
    JSON.stringify({ version: 1, unlocks: null }),
    JSON.stringify({ version: 1, unlocks: "puzzle:imitation" }),
    ...[null, 1, {}, [], "", "   "].map((bad) =>
      JSON.stringify({ version: 1, unlocks: ["puzzle:imitation", bad] }),
    ),
  ])(
    "rejects malformed or unsupported payload %s without overwriting it",
    (serialized) => {
      const storage = memoryStorage();
      storage.setItem(key, serialized);
      expect(loadUnlocks(storage)).toEqual([]);
      expect(storage.getItem(key)).toBe(serialized);
    },
  );

  it("rejects blank IDs on save without overwriting existing data", () => {
    const storage = memoryStorage();
    saveUnlocks(["future:one"], storage);
    expect(() => saveUnlocks([" "], storage)).toThrow(TypeError);
    expect(loadUnlocks(storage)).toEqual(["future:one"]);
  });

  it("erases only unlock persistence", () => {
    const storage = memoryStorage();
    storage.setItem("tracks-unfold.imitation.profile", "profile data");
    saveUnlocks(["future:one"], storage);
    clearUnlocks(storage);
    expect(storage.getItem(key)).toBeNull();
    expect(loadUnlocks(storage)).toEqual([]);
    expect(storage.getItem("tracks-unfold.imitation.profile")).toBe(
      "profile data",
    );
  });

  it("erases with an empty versioned payload if removeItem is unavailable", () => {
    const { getItem, setItem } = memoryStorage();
    const storage = { getItem, setItem };
    saveUnlocks(["future:one"], storage);
    clearUnlocks(storage);
    expect(loadUnlocks(storage)).toEqual([]);
  });

  it("propagates storage failures so the caller can report unsaved progress", () => {
    const fail = () => {
      throw new Error("Storage unavailable");
    };
    const storage: ProgressionStorage = {
      getItem: fail,
      setItem: fail,
      removeItem: fail,
    };
    expect(() => loadUnlocks(storage)).toThrow("Storage unavailable");
    expect(() => saveUnlocks([], storage)).toThrow("Storage unavailable");
    expect(() => clearUnlocks(storage)).toThrow("Storage unavailable");
    expect(() => clearUnlocks({ getItem: fail, setItem: fail })).toThrow(
      "Storage unavailable",
    );
  });
});
