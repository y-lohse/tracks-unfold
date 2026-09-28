import { describe, expect, it } from "vitest";

import { createImitationProfile } from "./profile";
import { imitationTheoryTip } from "./theoryTips";

const familiar = { proficiency: 0.5, certainty: 0.5 };

describe("imitation theory tips", () => {
  it("starts with contour, then introduces intervals and transposition", () => {
    expect(imitationTheoryTip(createImitationProfile())).toMatch(/contour/);
    expect(
      imitationTheoryTip(createImitationProfile({ intervalSize: familiar })),
    ).toMatch(/interval/);
    expect(
      imitationTheoryTip(
        createImitationProfile({ relationshipTransposition: familiar }),
      ),
    ).toMatch(/Transposing/);
  });
});
