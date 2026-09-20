import { describe, expect, it } from "vitest";

import {
  allDisplayNotes,
  identifyNamedInterval,
  navigationMilestoneForDemand,
  NAVIGATION_MILESTONES,
  noteToMidi,
  parseNote,
  renderNote,
  transposeNamedInterval,
} from "./index";

describe("note theory", () => {
  it("parses and renders every allowed single-accidental spelling", () => {
    expect(renderNote(parseNote("E#4"))).toBe("E♯4");
    expect(renderNote(parseNote("B♯3"))).toBe("B♯3");
    expect(renderNote(parseNote("Cb4"))).toBe("C♭4");
    expect(renderNote(parseNote("F♭4"))).toBe("F♭4");
    expect(noteToMidi(parseNote("B#3"))).toBe(noteToMidi(parseNote("C4")));
    expect(noteToMidi(parseNote("Cb4"))).toBe(noteToMidi(parseNote("B3")));
    expect(() => parseNote("C##4")).toThrow();
  });

  it("keeps generated note names within the fixed three-octave display", () => {
    expect(allDisplayNotes().every((note) => note.octave >= 3)).toBe(true);
    expect(allDisplayNotes().every((note) => note.octave <= 5)).toBe(true);
  });

  it("constructs named intervals by letter span as well as pitch distance", () => {
    expect(
      renderNote(transposeNamedInterval(parseNote("C4"), "m3", "up")!),
    ).toBe("E♭4");
    expect(
      renderNote(transposeNamedInterval(parseNote("C4"), "A4", "up")!),
    ).toBe("F♯4");
    expect(
      renderNote(transposeNamedInterval(parseNote("C4"), "d5", "up")!),
    ).toBe("G♭4");
    expect(
      renderNote(transposeNamedInterval(parseNote("C4"), "M7", "down")!),
    ).toBe("D♭3");
    expect(identifyNamedInterval(parseNote("C4"), parseNote("Eb4"))?.id).toBe(
      "m3",
    );
    expect(identifyNamedInterval(parseNote("C4"), parseNote("D#4"))).toBeNull();
  });
});

describe("navigation milestones", () => {
  it("contains the exact eleven cumulative movement ranges", () => {
    expect(NAVIGATION_MILESTONES).toHaveLength(11);
    expect(
      NAVIGATION_MILESTONES.map((milestone) =>
        milestone.categories.map((category) => [
          category.direction,
          category.unit,
          category.maximum,
        ]),
      ),
    ).toEqual([
      [["up", "wholeTones", 1]],
      [["up", "wholeTones", 2]],
      [
        ["up", "wholeTones", 2],
        ["up", "semitones", 2],
      ],
      [
        ["up", "wholeTones", 3],
        ["up", "semitones", 4],
      ],
      [
        ["up", "wholeTones", 4],
        ["up", "semitones", 4],
        ["down", "wholeTones", 2],
      ],
      [
        ["up", "wholeTones", 5],
        ["up", "semitones", 4],
        ["down", "wholeTones", 3],
        ["down", "semitones", 2],
      ],
      [
        ["up", "wholeTones", 6],
        ["up", "semitones", 4],
        ["down", "wholeTones", 4],
        ["down", "semitones", 4],
      ],
      [
        ["up", "wholeTones", 6],
        ["up", "semitones", 6],
        ["down", "wholeTones", 6],
        ["down", "semitones", 6],
      ],
      [
        ["up", "wholeTones", 6],
        ["up", "semitones", 8],
        ["down", "wholeTones", 6],
        ["down", "semitones", 8],
      ],
      [
        ["up", "wholeTones", 6],
        ["up", "semitones", 10],
        ["down", "wholeTones", 6],
        ["down", "semitones", 10],
      ],
      [
        ["up", "wholeTones", 6],
        ["up", "semitones", 12],
        ["down", "wholeTones", 6],
        ["down", "semitones", 12],
      ],
    ]);
  });

  it("maps the endpoints of the control to the first and last milestones", () => {
    expect(navigationMilestoneForDemand(0).number).toBe(1);
    expect(navigationMilestoneForDemand(1).number).toBe(11);
  });
});
