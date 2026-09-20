import { describe, expect, it } from "vitest";

import {
  answerChoiceCount,
  createSeededRng,
  generateQuestion,
  intervalDemandForSetting,
  isCorrectAnswer,
  noteToMidi,
} from "./index";

describe("question generation", () => {
  it("generates both forms for all four tracked skills", () => {
    const controls = {
      navigationDemand: 1,
      intervalNameDemand: 1,
      answerChoiceBreadth: 0,
    };
    const expected = [
      ["numericalDestination", "forward", "note"],
      ["numericalDistance", "reverse", "numericalDistance"],
      ["intervalInterpretation", "forward", "note"],
      ["intervalIdentification", "reverse", "namedInterval"],
    ] as const;

    for (const [targetSkill, form, answerKind] of expected) {
      const question = generateQuestion({
        id: targetSkill,
        controls,
        targetSkill,
        rng: createSeededRng(11),
      });
      expect(question.form).toBe(form);
      expect(question.answer.kind).toBe(answerKind);
      expect(
        question.demands.some((demand) => demand.skill === targetSkill),
      ).toBe(true);
    }
  });

  it("keeps crossings and edge enharmonics out of the locked repertoire", () => {
    const edgeEnharmonics = new Set(["B:sharp", "E:sharp", "C:flat", "F:flat"]);
    const targetSkills = [
      "numericalDestination",
      "numericalDistance",
      "intervalInterpretation",
      "intervalIdentification",
    ] as const;

    for (const targetSkill of targetSkills) {
      for (let seed = 0; seed < 50; seed += 1) {
        const question = generateQuestion({
          id: `${targetSkill}-${seed}`,
          controls: {
            navigationDemand: 1,
            intervalNameDemand: 1,
            answerChoiceBreadth: 0,
          },
          targetSkill,
          repertoire: { octaveCrossings: false, edgeEnharmonics: false },
          rng: createSeededRng(seed),
        });
        const end =
          question.form === "reverse"
            ? question.end
            : question.answer.kind === "note"
              ? question.answer.note
              : undefined;
        expect(question.keyboardMode).toBe("singleRegister");
        expect(end?.octave).toBe(question.start.octave);
        for (const note of [question.start, end]) {
          expect(
            note && edgeEnharmonics.has(`${note.letter}:${note.accidental}`),
          ).toBeFalsy();
        }
      }
    }
  });

  it("keeps the lowest interval-name demand numerical-only", () => {
    const level = intervalDemandForSetting(0.01);
    expect(level).toEqual({
      numericalOnly: true,
      introductionGroup: 0,
      numericalReminders: false,
      intervals: [],
    });

    for (const targetSkill of [
      "intervalInterpretation",
      "intervalIdentification",
    ] as const) {
      const question = generateQuestion({
        id: targetSkill,
        controls: {
          navigationDemand: 0.1,
          intervalNameDemand: 0.01,
          answerChoiceBreadth: 0,
        },
        targetSkill,
        rng: createSeededRng(4),
      });
      expect(["numerical", "identifyNumerical"]).toContain(
        question.instruction.kind,
      );
    }
  });

  it("introduces interval names with reminders and removes their independent evidence", () => {
    const level = intervalDemandForSetting(0.1);
    expect(level.numericalReminders).toBe(true);
    expect(level.intervals.map((interval) => interval.id)).toEqual([
      "M2",
      "M3",
    ]);

    const question = generateQuestion({
      id: "supported",
      controls: {
        navigationDemand: 0.01,
        intervalNameDemand: 0.1,
        answerChoiceBreadth: 0,
      },
      targetSkill: "intervalInterpretation",
      rng: createSeededRng(4),
    });
    expect(question.instruction.kind).toBe("namedInterval");
    if (question.instruction.kind !== "namedInterval") {
      throw new Error("Expected a supported named-interval question");
    }
    expect(question.instruction.numericalReminder).toBe("1 whole tone");
    expect(
      question.demands.find(
        (demand) => demand.skill === "intervalInterpretation",
      )?.support,
    ).toBe(1);

    const reverse = generateQuestion({
      id: "supported-reverse",
      controls: {
        navigationDemand: 0.01,
        intervalNameDemand: 0.1,
        answerChoiceBreadth: 0,
      },
      targetSkill: "intervalIdentification",
      rng: createSeededRng(4),
    });
    if (reverse.choices.mode !== "curated") {
      throw new Error("Expected curated interval choices");
    }
    expect(
      reverse.choices.options.every(
        (choice) =>
          choice.kind === "namedInterval" &&
          choice.reminder?.includes("whole tone") &&
          !choice.reminder.includes("/") &&
          !choice.reminder.includes("semitone"),
      ),
    ).toBe(true);
  });

  it("uses curated 3/4/6 choices and an explicit full-choice marker", () => {
    expect(answerChoiceCount(0)).toBe(3);
    expect(answerChoiceCount(0.34)).toBe(4);
    expect(answerChoiceCount(0.67)).toBe(6);
    expect(answerChoiceCount(1)).toBe("full");

    const full = generateQuestion({
      id: "full",
      controls: {
        navigationDemand: 1,
        intervalNameDemand: 1,
        answerChoiceBreadth: 1,
      },
      targetSkill: "numericalDestination",
      rng: createSeededRng(2),
    });
    expect(full.choices).toEqual({ mode: "full" });

    const curated = generateQuestion({
      id: "curated-support",
      controls: {
        navigationDemand: 1,
        intervalNameDemand: 0,
        answerChoiceBreadth: 0,
      },
      targetSkill: "numericalDestination",
      rng: createSeededRng(2),
    });
    expect(curated.demands[0]?.support).toBeGreaterThan(
      full.demands[0]?.support ?? 0,
    );
  });

  it("never offers an enharmonic-equivalent destination as an incorrect competitor", () => {
    for (let seed = 0; seed < 50; seed += 1) {
      const question = generateQuestion({
        id: String(seed),
        controls: {
          navigationDemand: 1,
          intervalNameDemand: 0,
          answerChoiceBreadth: 0.8,
        },
        targetSkill: "numericalDestination",
        rng: createSeededRng(seed),
      });
      if (
        question.answer.kind !== "note" ||
        question.choices.mode !== "curated"
      ) {
        throw new Error("Expected a curated destination question");
      }
      const answerMidi = noteToMidi(question.answer.note);
      const equivalentOptions = question.choices.options.filter(
        (choice) =>
          choice.kind === "note" && noteToMidi(choice.note) === answerMidi,
      );
      expect(equivalentOptions).toHaveLength(1);
      expect(
        new Set(question.choices.options.map((choice) => choice.id)).size,
      ).toBe(question.choices.options.length);
    }
  });

  it("accepts enharmonic spellings for numerical movement but not named intervals", () => {
    const numerical = generateQuestion({
      id: "numeric",
      controls: {
        navigationDemand: 1,
        intervalNameDemand: 0,
        answerChoiceBreadth: 1,
      },
      targetSkill: "numericalDestination",
      rng: createSeededRng(8),
    });
    if (numerical.answer.kind !== "note")
      throw new Error("Expected note answer");
    const noteAnswer = numerical.answer;
    const alternate = noteAnswer.acceptedSpellings.find(
      (spelling) =>
        spelling !== noteAnswer.note.letter + noteAnswer.note.octave,
    );
    expect(
      noteAnswer.acceptedSpellings.some((spelling) =>
        isCorrectAnswer(numerical, { kind: "note", value: spelling }),
      ),
    ).toBe(true);
    expect(alternate).toBeDefined();

    const named = generateQuestion({
      id: "named",
      controls: {
        navigationDemand: 1,
        intervalNameDemand: 1,
        answerChoiceBreadth: 1,
      },
      targetSkill: "intervalInterpretation",
      rng: createSeededRng(8),
    });
    if (named.answer.kind !== "note") throw new Error("Expected note answer");
    if (
      named.instruction.kind === "namedInterval" &&
      named.instruction.interval.id !== "tritone"
    ) {
      expect(named.answer.acceptedSpellings).toHaveLength(1);
    }
  });

  it("accepts all valid spellings for a generic forward tritone", () => {
    let tritone: ReturnType<typeof generateQuestion> | undefined;
    for (let seed = 0; seed < 500 && tritone === undefined; seed += 1) {
      const candidate = generateQuestion({
        id: `tritone-${seed}`,
        controls: {
          navigationDemand: 1,
          intervalNameDemand: 1,
          answerChoiceBreadth: 1,
        },
        targetSkill: "intervalInterpretation",
        rng: createSeededRng(seed),
      });
      if (
        candidate.instruction.kind === "namedInterval" &&
        candidate.instruction.interval.id === "tritone"
      ) {
        tritone = candidate;
      }
    }

    expect(tritone).toBeDefined();
    if (tritone?.answer.kind !== "note")
      throw new Error("Expected note answer");
    expect(tritone.answer.acceptedSpellings.length).toBeGreaterThan(1);
    expect(
      tritone.answer.acceptedSpellings.every((spelling) =>
        isCorrectAnswer(tritone, { kind: "note", value: spelling }),
      ),
    ).toBe(true);
  });
});
