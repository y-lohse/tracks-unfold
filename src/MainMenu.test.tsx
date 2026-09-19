import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MainMenu } from "./MainMenu";

const areas = [
  "Note navigation",
  "Imitation",
  "Tonal contours",
  "Rhythm performance",
  "Interval identification",
];

describe("MainMenu", () => {
  it("shows the title and five dormant areas", () => {
    render(<MainMenu />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Tracks Unfold" }),
    ).toBeInTheDocument();

    for (const area of areas) {
      expect(screen.getByText(area)).toBeInTheDocument();
    }

    expect(screen.getAllByText("Dormant")).toHaveLength(5);
  });
});
