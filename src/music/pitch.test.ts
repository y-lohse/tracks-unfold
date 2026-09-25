import { describe, expect, it } from "vitest";

import {
  audioPitchName,
  displayPitch,
  IMITATION_PITCHES,
  isPitch,
  MIDI_B5,
  MIDI_C3,
  pitch,
  pitchPresentation,
} from "./index";

describe("Imitation pitch primitives", () => {
  it("defines every chromatic MIDI pitch from C3 through B5", () => {
    expect(MIDI_C3).toBe(48);
    expect(MIDI_B5).toBe(83);
    expect(IMITATION_PITCHES).toHaveLength(36);
    expect(IMITATION_PITCHES[0]).toBe(48);
    expect(IMITATION_PITCHES.at(-1)).toBe(83);
    expect(IMITATION_PITCHES.every(isPitch)).toBe(true);
  });

  it("provides stable display and audio spellings", () => {
    expect(displayPitch(pitch(48))).toBe("C3");
    expect(displayPitch(pitch(61))).toBe("C♯4");
    expect(audioPitchName(pitch(61))).toBe("C#4");
    expect(pitchPresentation(pitch(83))).toEqual({
      midi: 83,
      pitchClass: 11,
      octave: 5,
      displayLabel: "B5",
      audioName: "B5",
    });
  });

  it("rejects pitches outside the instrument and non-integers", () => {
    expect(isPitch(47)).toBe(false);
    expect(isPitch(84)).toBe(false);
    expect(isPitch(60.5)).toBe(false);
    expect(() => pitch(84)).toThrow(RangeError);
  });
});
