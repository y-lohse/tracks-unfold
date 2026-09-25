import { describe, expect, it } from "vitest";

import { MIDI_B5, MIDI_C3 } from "../music";
import { createSeededRng } from "../noteNavigation/random";
import {
  assessmentEvidenceForSubmission,
  assignedImitationChallenge,
  checkResponse,
  controlsForSkillChallenges,
  createImitationProfile,
  focusedImitationChallenges,
  generateImitationPuzzle,
  ImitationGenerationError,
  IMITATION_SKILLS,
  IMITATION_TUNING,
  imitationRunPressure,
  loadImitationProfile,
  normalizeControls,
  prepareNextImitationPuzzle,
  saveImitationProfile,
  settingsForControls,
  stageImitationControls,
  startImitationRun,
  submitImitationResponse,
  type ImitationControls,
  type ImitationStorage,
} from "./index";

const BASE: ImitationControls = {
  contourStructure: 0,
  phraseLength: 0,
  intervalPrecision: 0,
  pitchSelectionDemand: 0,
  anchorPosition: 0,
  transposition: 0,
  referencePlays: 0,
  pitchAuditions: 0,
  referenceMovementRange: 0,
};

describe("nine controls", () => {
  it("normalizes all controls and resolves ordered categorical settings", () => {
    const normalized = normalizeControls({
      contourStructure: Number.NaN,
      phraseLength: 2,
      intervalPrecision: -1,
      pitchSelectionDemand: 1,
      anchorPosition: 1,
      transposition: 1,
      referencePlays: 1,
      pitchAuditions: 1,
      referenceMovementRange: 1,
    });
    expect(normalized).toEqual({
      contourStructure: 0,
      phraseLength: 1,
      intervalPrecision: 0,
      pitchSelectionDemand: 1,
      anchorPosition: 1,
      transposition: 1,
      referencePlays: 1,
      pitchAuditions: 1,
      referenceMovementRange: 1,
    });
    expect(settingsForControls(normalized)).toEqual({
      contourStructure: "oneDirectionNoRepeats",
      phraseLength: 6,
      intervalPrecision: "direction",
      pitchSelectionDemand: "fullKeyboard",
      anchorPosition: "middle",
      transposition: "overlappingNonOctave",
      referencePlays: "one",
      pitchAuditions: "none",
      referenceMovementRange: "wide",
    });
  });

  it("maps all four skill challenges into a compatible nine-control request", () => {
    const controls = controlsForSkillChallenges({
      pitchDirection: 0.9,
      intervalSize: 0.8,
      pitchNavigation: 0.7,
      relationshipTransposition: 0.6,
    });
    expect(Object.keys(controls)).toHaveLength(9);
    expect(
      Object.values(controls).every((value) => value >= 0 && value <= 1),
    ).toBe(true);
    expect(settingsForControls(controls).phraseLength).not.toBe(3);
  });
});

describe("bounded generator", () => {
  it("does not reveal the opening direction through an asymmetric curated supply", () => {
    for (let seed = 0; seed < 50; seed += 1) {
      const puzzle = generateImitationPuzzle({
        id: `balanced-${seed}`,
        controls: BASE,
        rng: createSeededRng(seed),
      });
      const below = puzzle.enabledPitches.filter(
        (pitch) => pitch < puzzle.anchorPitch,
      );
      const above = puzzle.enabledPitches.filter(
        (pitch) => pitch > puzzle.anchorPitch,
      );
      const editableSlots = puzzle.referencePitches.length - 1;
      const minimumChoicesPerDirection = editableSlots + 2;
      const lowerReach = puzzle.anchorPitch - Math.min(...below);
      const upperReach = Math.max(...above) - puzzle.anchorPitch;

      expect(below.length).toBeGreaterThanOrEqual(minimumChoicesPerDirection);
      expect(above.length).toBeGreaterThanOrEqual(minimumChoicesPerDirection);
      expect(lowerReach).toBe(upperReach);
    }
  });

  it("centers every constrained supply across anchor and transposition settings", () => {
    for (const pitchSelectionDemand of [0, 0.5]) {
      for (const anchorPosition of [0, 0.4, 0.8]) {
        for (const transposition of [0, 0.3, 0.6, 0.9]) {
          for (let seed = 0; seed < 10; seed += 1) {
            const puzzle = generateImitationPuzzle({
              id: `symmetric-${pitchSelectionDemand}-${anchorPosition}-${transposition}-${seed}`,
              controls: {
                ...BASE,
                anchorPosition,
                phraseLength: 0.3,
                pitchSelectionDemand,
                transposition,
              },
              rng: createSeededRng(seed),
            });
            const offsets = puzzle.enabledPitches.map(
              (pitch) => pitch - puzzle.anchorPitch,
            );
            const below = offsets.filter((offset) => offset < 0);
            const above = offsets.filter((offset) => offset > 0);
            const editableSlots = puzzle.referencePitches.length - 1;

            expect(below).toHaveLength(above.length);
            expect(below.length).toBeGreaterThanOrEqual(editableSlots);
            expect(Math.min(...offsets)).toBe(-Math.max(...offsets));
          }
        }
      }
    }
  });

  it("keeps the anchor on a central key when the full keyboard is enabled", () => {
    for (const anchorPosition of [0, 0.4, 0.8]) {
      for (const transposition of [0, 0.3, 0.6, 0.9]) {
        for (let seed = 0; seed < 10; seed += 1) {
          let puzzle: ReturnType<typeof generateImitationPuzzle>;
          try {
            puzzle = generateImitationPuzzle({
              id: `full-center-${anchorPosition}-${transposition}-${seed}`,
              controls: {
                ...BASE,
                anchorPosition,
                phraseLength: 0.3,
                pitchSelectionDemand: 1,
                transposition,
              },
              rng: createSeededRng(seed),
            });
          } catch (error) {
            throw new Error(
              `Failed full-keyboard case anchor=${anchorPosition}, transposition=${transposition}, seed=${seed}`,
              { cause: error },
            );
          }
          const below = puzzle.anchorPitch - MIDI_C3;
          const above = MIDI_B5 - puzzle.anchorPitch;

          expect(Math.abs(below - above)).toBeLessThanOrEqual(1);
          expect(below).toBeGreaterThanOrEqual(3);
          expect(above).toBeGreaterThanOrEqual(3);
        }
      }
    }
  });

  it.each([
    ["oneDirectionNoRepeats", 0, 0, 0],
    ["oneDirectionWithRepeats", 0.1, 0, 1],
    ["oneTurnNoRepeats", 0.4, 1, 0],
    ["oneTurnWithRepeats", 0.65, 1, 1],
    ["multipleTurns", 0.85, 2, 0],
  ] as const)(
    "realizes required %s contour features",
    (expectedContour, contourStructure, minimumTurns, minimumRepeats) => {
      const puzzle = generateImitationPuzzle({
        id: expectedContour,
        controls: {
          ...BASE,
          contourStructure,
          phraseLength: 0.3,
          intervalPrecision: 1,
          referenceMovementRange: 0.5,
        },
        rng: createSeededRng(31),
      });
      expect(puzzle.settings.contourStructure).toBe(expectedContour);
      expect(puzzle.features.turnCount).toBeGreaterThanOrEqual(minimumTurns);
      expect(puzzle.features.repetitionCount).toBeGreaterThanOrEqual(
        minimumRepeats,
      );
      if (expectedContour.includes("NoRepeats")) {
        expect(puzzle.features.repetitionCount).toBe(0);
      }
      expect(puzzle.features.maximumMovement).toBeGreaterThanOrEqual(3);
      expect(checkResponse(puzzle, puzzle.exactReconstruction)).toMatchObject({
        accepted: true,
        exact: true,
      });
    },
  );

  it.each([
    ["first", 0.1],
    ["last", 0.4],
    ["middle", 0.8],
  ] as const)("places a %s anchor", (position, anchorPosition) => {
    const puzzle = generateImitationPuzzle({
      id: position,
      controls: { ...BASE, anchorPosition },
      rng: createSeededRng(12),
    });
    expect(puzzle.settings.anchorPosition).toBe(position);
    if (position === "first") expect(puzzle.anchorIndex).toBe(0);
    if (position === "last") {
      expect(puzzle.anchorIndex).toBe(puzzle.referencePitches.length - 1);
    }
    if (position === "middle") expect(puzzle.anchorIndex).toBe(1);
  });

  it.each([
    ["none", 0],
    ["octave", 0.2],
    ["separatedNonOctave", 0.5],
    ["overlappingNonOctave", 0.8],
  ] as const)("realizes %s transposition", (setting, transposition) => {
    const puzzle = generateImitationPuzzle({
      id: setting,
      controls: { ...BASE, transposition },
      rng: createSeededRng(82),
    });
    expect(puzzle.settings.transposition).toBe(setting);
    if (setting === "none") expect(puzzle.features.anchorShift).toBe(0);
    if (setting === "octave") {
      expect(Math.abs(puzzle.features.anchorShift)).toBe(12);
    }
    if (setting.includes("NonOctave")) {
      expect(puzzle.features.anchorShift).not.toBe(0);
      expect(Math.abs(puzzle.features.anchorShift)).not.toBe(12);
    }
  });

  it("stores exact features, budgets, supply and an in-range validated witness", () => {
    const puzzle = generateImitationPuzzle({
      id: "invariants",
      controls: {
        ...BASE,
        phraseLength: 1,
        intervalPrecision: 0.7,
        pitchSelectionDemand: 1,
        anchorPosition: 1,
        transposition: 1,
        referencePlays: 1,
        pitchAuditions: 0.7,
        referenceMovementRange: 1,
      },
      targetedSkills: Object.fromEntries(
        IMITATION_SKILLS.map((skill) => [skill, 0.8]),
      ),
      rng: createSeededRng(4),
    });
    expect(puzzle.referencePitches).toHaveLength(6);
    expect(puzzle.budgets).toEqual({ referencePlays: 1, pitchAuditions: 5 });
    expect(
      puzzle.exactReconstruction.every((value) => value >= 48 && value <= 83),
    ).toBe(true);
    expect(
      puzzle.exactReconstruction.every((value) =>
        puzzle.enabledPitches.includes(value),
      ),
    ).toBe(true);
    expect(puzzle.enabledPitches).toHaveLength(36);
    expect(puzzle.features.signedMovements).toHaveLength(5);
    expect(checkResponse(puzzle, puzzle.exactReconstruction).accepted).toBe(
      true,
    );
  });

  it("distinguishes incompatible configuration from bounded exhaustion", () => {
    expect(() =>
      generateImitationPuzzle({
        id: "incompatible",
        controls: { ...BASE, contourStructure: 1, phraseLength: 0 },
        rng: createSeededRng(1),
      }),
    ).toThrowError(
      expect.objectContaining<Partial<ImitationGenerationError>>({
        reason: "incompatibleConfiguration",
      }),
    );

    try {
      generateImitationPuzzle({
        id: "exhausted",
        controls: {
          ...BASE,
          phraseLength: 0,
          transposition: 0.6,
          referenceMovementRange: 1,
        },
        rng: () => 1,
        maxAttempts: 3,
      });
      throw new Error("Expected generation to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(ImitationGenerationError);
      expect(error).toMatchObject({ reason: "attemptsExhausted", attempts: 3 });
    }
  });
});

describe("assessment, run adapter, and persistence", () => {
  it("keeps late-run pressure gradual before reaching the ceiling", () => {
    expect(imitationRunPressure(12)).toBeLessThan(0.6);
    expect(imitationRunPressure(14)).toBeLessThan(1);
    expect(imitationRunPressure(15)).toBe(1);
  });

  it("introduces each focus early without changing controls in batches", () => {
    const profile = createImitationProfile({
      pitchDirection: { proficiency: 0.32, certainty: 0.5 },
      intervalSize: { proficiency: 0.14, certainty: 0.5 },
      pitchNavigation: { proficiency: 0.35, certainty: 0.5 },
      relationshipTransposition: { proficiency: 0.13, certainty: 0.5 },
    });
    const seenFocus = new Set<string>();
    const batches: string[] = [];

    for (const roll of [0, 0.3, 0.6, 0.9]) {
      const run = startImitationRun(profile, () => roll, `staged-${roll}`);
      seenFocus.add(run.focus[0]!);
      let previousControls: ImitationControls | undefined;
      let stagingCursor = 0;
      const settings = Array.from({ length: 15 }, (_, index) => {
        const challenge = assignedImitationChallenge(run, index + 1);
        const focused = focusedImitationChallenges(run, challenge);
        const desired = controlsForSkillChallenges(focused, run.focusWeights);
        const staged = stageImitationControls(
          previousControls,
          desired,
          stagingCursor,
        );
        previousControls = staged.controls;
        stagingCursor = staged.nextCursor;
        return settingsForControls(staged.controls);
      });
      const opening = JSON.stringify(settings[0]);
      const firstChange = settings.findIndex(
        (setting) => JSON.stringify(setting) !== opening,
      );

      expect(firstChange).toBeGreaterThan(0);
      expect(firstChange + 1).toBeLessThanOrEqual(6);
      for (let index = 1; index < 14; index += 1) {
        const previous = settings[index - 1]!;
        const current = settings[index]!;
        const changedControls = Object.keys(current).filter(
          (key) =>
            current[key as keyof typeof current] !==
            previous[key as keyof typeof previous],
        );
        if (changedControls.length > 2) {
          batches.push(
            `${run.focus[0]} Q${index + 1}: ${changedControls.join(", ")}`,
          );
        }
      }
    }

    expect(batches).toEqual([]);
    expect(seenFocus).toEqual(new Set(IMITATION_SKILLS));
  });

  it("bounds movement-level evidence to one per skill and omits unshifted transposition", () => {
    const puzzle = generateImitationPuzzle({
      id: "evidence",
      controls: { ...BASE, phraseLength: 1, intervalPrecision: 1 },
      targetedSkills: Object.fromEntries(
        IMITATION_SKILLS.map((skill) => [skill, 0.5]),
      ),
      rng: createSeededRng(10),
    });
    const check = checkResponse(puzzle, puzzle.exactReconstruction);
    const evidence = assessmentEvidenceForSubmission(puzzle, check);
    for (const skill of IMITATION_SKILLS) {
      const total = evidence
        .filter((item) => item.skill === skill)
        .reduce((sum, item) => sum + item.weight, 0);
      expect(total).toBeLessThanOrEqual(1);
    }
    expect(
      evidence.some((item) => item.skill === "relationshipTransposition"),
    ).toBe(false);
  });

  it("uses the stable run balance to emphasize focal demands before the ceiling", () => {
    const rng = createSeededRng(71);
    const opening = startImitationRun(createImitationProfile(), rng, "focused");
    const midRun = prepareNextImitationPuzzle(
      { ...opening, puzzlesPresented: 4 },
      rng,
    );
    const focalSkill = opening.focus[0]!;
    const nonFocalSkill = IMITATION_SKILLS.find(
      (skill) => skill !== focalSkill,
    )!;
    expect(midRun.puzzle.targetedSkills[focalSkill]).toBeGreaterThan(
      midRun.puzzle.targetedSkills[nonFocalSkill] ?? 0,
    );

    const ceiling = prepareNextImitationPuzzle(
      { ...opening, puzzlesPresented: 14 },
      rng,
    );
    expect(Object.values(ceiling.puzzle.targetedSkills)).toEqual([1, 1, 1, 1]);
    expect(
      Object.values(ceiling.puzzle.requestedControls).every(
        (control) => control === 1,
      ),
    ).toBe(false);
  });

  it("generates complete successful runs across deterministic seeds", () => {
    for (let seed = 0; seed < 50; seed += 1) {
      const rng = createSeededRng(seed);
      let state = startImitationRun(
        createImitationProfile(),
        rng,
        `complete-${seed}`,
      );
      while (state.status === "active") {
        let prepared: ReturnType<typeof prepareNextImitationPuzzle>;
        try {
          prepared = prepareNextImitationPuzzle(state, rng);
        } catch (error) {
          const puzzleNumber = state.puzzlesPresented + 1;
          const challenge = assignedImitationChallenge(state, puzzleNumber);
          const focused = focusedImitationChallenges(state, challenge);
          const desired = controlsForSkillChallenges(
            focused,
            state.focusWeights,
          );
          const staged = stageImitationControls(
            state.lastControls,
            desired,
            state.controlStagingCursor,
          );
          throw new Error(
            `Failed complete run seed=${seed} puzzle=${puzzleNumber} settings=${JSON.stringify(settingsForControls(staged.controls))}`,
            { cause: error },
          );
        }
        state = submitImitationResponse(
          prepared.state,
          prepared.puzzle,
          prepared.puzzle.exactReconstruction,
        ).state;
        expect(state.puzzlesPresented).toBeLessThanOrEqual(17);
      }
      expect(state.status).toBe("succeeded");
    }
  });

  it("uses the shared director and applies one complete submission", () => {
    const profile = createImitationProfile();
    const state = startImitationRun(profile, createSeededRng(2), "run");
    expect(state.lives).toBe(3);
    const prepared = prepareNextImitationPuzzle(state, createSeededRng(3));
    const result = submitImitationResponse(
      prepared.state,
      prepared.puzzle,
      prepared.puzzle.exactReconstruction,
    );
    expect(result.check.accepted).toBe(true);
    expect(result.state.puzzlesPresented).toBe(1);
    expect(result.state.lives).toBe(3);
    expect(result.proficiencyChanges.length).toBeGreaterThan(0);
  });

  it("creates and safely persists a versioned four-skill profile", () => {
    expect(IMITATION_TUNING.provisional).toBe(true);
    const values = new Map<string, string>();
    const storage: ImitationStorage = {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
    };
    const profile = createImitationProfile({
      pitchDirection: { proficiency: 0.7, certainty: 0.6 },
    });
    saveImitationProfile(profile, storage);
    expect(loadImitationProfile(storage)).toEqual(profile);
    expect(
      JSON.parse(values.get(IMITATION_TUNING.persistence.key) ?? "null"),
    ).toEqual({
      version: 1,
      profile,
    });

    values.set(IMITATION_TUNING.persistence.key, "not-json");
    expect(loadImitationProfile(storage)).toEqual(createImitationProfile());
  });
});
