import { describe, expect, it } from "vitest";

import {
  answerQuestion,
  createProfile,
  createSeededRng,
  loadProfile,
  NOTE_NAVIGATION_TUNING,
  prepareNextQuestion,
  runPressure,
  saveProfile,
  SKILLS,
  startRun,
  type NavigationQuestion,
  type StorageLike,
  type SubmittedAnswer,
} from "./index";

function correctSubmission(question: NavigationQuestion): SubmittedAnswer {
  if (question.answer.kind === "note") {
    return { kind: "note", value: question.answer.note };
  }
  if (question.answer.kind === "numericalDistance") {
    return { kind: "numericalDistance", value: question.answer.value };
  }
  return { kind: "namedInterval", value: question.answer.interval.id };
}

function incorrectSubmission(question: NavigationQuestion): SubmittedAnswer {
  if (question.answer.kind === "note") return { kind: "note", value: "C-1" };
  if (question.answer.kind === "numericalDistance") {
    return {
      kind: "numericalDistance",
      value: question.answer.value === 1 ? 2 : 1,
    };
  }
  return {
    kind: "namedInterval",
    value: question.answer.interval.id === "M2" ? "M3" : "M2",
  };
}

describe("run director", () => {
  it("chooses a stable familiarity-aware focus without a first-run branch", () => {
    const beginnerProfile = createProfile();
    const beginner = startRun(beginnerProfile, createSeededRng(1), "beginner");
    expect(beginner.focus).toHaveLength(1);

    const advancedProfile = createProfile(
      Object.fromEntries(
        SKILLS.map((skill) => [skill, { proficiency: 0.9, certainty: 0.9 }]),
      ),
    );
    let advanced = startRun(advancedProfile, createSeededRng(1), "advanced");
    const focus = advanced.focus;
    expect(focus).toHaveLength(4);
    const prepared = prepareNextQuestion(advanced, createSeededRng(3));
    expect(prepared.question.keyboardMode).toBe("fullRange");
    advanced = answerQuestion(
      prepared.state,
      prepared.question,
      correctSubmission(prepared.question),
    ).state;
    expect(advanced.focus).toEqual(focus);
  });

  it("keeps the opening question numerical for an unfamiliar profile", () => {
    for (let seed = 0; seed < 100; seed += 1) {
      const rng = createSeededRng(seed);
      const state = startRun(createProfile(), rng, `opening-${seed}`);
      const { question } = prepareNextQuestion(state, rng);
      expect(["numerical", "identifyNumerical"]).toContain(
        question.instruction.kind,
      );
      expect(question.keyboardMode).toBe("singleRegister");
      const endOctave =
        question.form === "reverse"
          ? question.end?.octave
          : question.answer.kind === "note"
            ? question.answer.note.octave
            : undefined;
      expect(endOctave).toBe(question.start.octave);
    }
  });

  it("uses increasing exponential pressure and reaches the global ceiling on puzzle 13", () => {
    expect(runPressure(1)).toBeGreaterThan(0);
    expect(runPressure(6)).toBeGreaterThan(runPressure(5));
    expect(runPressure(12)).toBeLessThan(1);
    expect(runPressure(13)).toBe(1);

    let state = startRun(createProfile(), createSeededRng(7), "ceiling");
    const rng = createSeededRng(9);
    for (let puzzle = 1; puzzle <= 13; puzzle += 1) {
      const prepared = prepareNextQuestion(state, rng);
      if (puzzle === 13) {
        expect(
          SKILLS.every(
            (skill) => prepared.state.assignedChallenge[skill] === 1,
          ),
        ).toBe(true);
        expect(prepared.question.controls).toEqual({
          navigationDemand: 1,
          intervalNameDemand: 1,
          answerChoiceBreadth: 1,
        });
      }
      state = answerQuestion(
        prepared.state,
        prepared.question,
        correctSubmission(prepared.question),
      ).state;
    }
    expect(state.ceilingCorrectAnswers).toBe(1);
  });

  it("requires three qualifying ceiling answers for success", () => {
    let state = startRun(createProfile(), createSeededRng(5), "success");
    const rng = createSeededRng(6);
    while (state.status === "active") {
      const prepared = prepareNextQuestion(state, rng);
      state = answerQuestion(
        prepared.state,
        prepared.question,
        correctSubmission(prepared.question),
      ).state;
    }
    expect(state.status).toBe("succeeded");
    expect(state.puzzlesPresented).toBe(
      NOTE_NAVIGATION_TUNING.director.ceilingPuzzle +
        NOTE_NAVIGATION_TUNING.director.ceilingCorrectAnswersRequired -
        1,
    );
    expect(state.ceilingCorrectAnswers).toBe(3);
  });

  it("charges every wrong answer and fails on the third", () => {
    let state = startRun(createProfile(), createSeededRng(10), "failure");
    const rng = createSeededRng(12);
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const prepared = prepareNextQuestion(state, rng);
      state = answerQuestion(
        prepared.state,
        prepared.question,
        incorrectSubmission(prepared.question),
      ).state;
    }
    expect(state.lives).toBe(0);
    expect(state.status).toBe("failed");
    expect(state.puzzlesPresented).toBe(3);
  });

  it("reports proficiency before/after while keeping certainty internal", () => {
    const state = startRun(createProfile(), createSeededRng(14), "results");
    const prepared = prepareNextQuestion(state, createSeededRng(15));
    const transition = answerQuestion(
      prepared.state,
      prepared.question,
      correctSubmission(prepared.question),
    );
    expect(transition.result.proficiencyChanges.length).toBeGreaterThan(0);
    expect(transition.result.proficiencyChanges[0]).toEqual(
      expect.objectContaining({
        before: expect.any(Number),
        after: expect.any(Number),
      }),
    );
    expect(transition.result.proficiencyChanges[0]).not.toHaveProperty(
      "certaintyBefore",
    );
    expect(transition.state.profile).not.toEqual(state.profile);
  });
});

describe("profile persistence", () => {
  it("starts every assessment at zero when no learning data exists", () => {
    expect(createProfile()).toEqual(
      Object.fromEntries(
        SKILLS.map((skill) => [skill, { proficiency: 0, certainty: 0 }]),
      ),
    );
  });

  it("stores only a versioned profile and safely rejects unknown data", () => {
    const values = new Map<string, string>();
    const storage: StorageLike = {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
    };
    const profile = createProfile({
      numericalDestination: { proficiency: 0.73, certainty: 0.64 },
    });
    saveProfile(profile, storage);

    const serialized = values.get(NOTE_NAVIGATION_TUNING.persistence.key);
    expect(JSON.parse(serialized ?? "null")).toEqual({ version: 1, profile });
    expect(loadProfile(storage)).toEqual(profile);

    values.set(
      NOTE_NAVIGATION_TUNING.persistence.key,
      JSON.stringify({ version: 2, profile }),
    );
    expect(loadProfile(storage)).toEqual(createProfile());
  });
});
