import { describe, expect, it } from "vitest";

import { createProfile } from "./profile";
import { navigationTheoryTip } from "./theoryTips";

const familiar = { proficiency: 0.5, certainty: 0.5 };
const broadlyReady = { proficiency: 0.8, certainty: 0.8 };

describe("navigation theory tips", () => {
  it("starts with semitones and whole tones, then follows the unlocked concepts", () => {
    expect(navigationTheoryTip(createProfile())).toMatch(/whole tone/);
    expect(
      navigationTheoryTip({
        ...createProfile(),
        numericalDestination: familiar,
      }),
    ).toMatch(/octave/);
    expect(
      navigationTheoryTip({
        ...createProfile(),
        intervalIdentification: familiar,
      }),
    ).toMatch(/interval's number/);
    expect(
      navigationTheoryTip({
        ...createProfile(),
        numericalDestination: broadlyReady,
        intervalInterpretation: broadlyReady,
      }),
    ).toMatch(/C♯ and D♭/);
  });
});
