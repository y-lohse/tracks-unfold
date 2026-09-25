import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MainMenu } from "./MainMenu";

const dormantAreas = [
  "Tonal contours",
  "Rhythm performance",
  "Interval identification",
];

describe("MainMenu", () => {
  it("shows two playable areas and three dormant areas", () => {
    render(<MainMenu />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Tracks Unfold" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /note navigation/i }),
    ).toHaveTextContent("01Navigation");

    expect(
      screen.getByRole("button", { name: /imitation/i }),
    ).toHaveTextContent("02Imitation");

    for (const area of dormantAreas) {
      expect(screen.getByText(area)).toBeInTheDocument();
    }

    expect(screen.getAllByText("Dormant")).toHaveLength(3);
  });

  it("opens each playable area", () => {
    const onOpenNoteNavigation = vi.fn();
    const onOpenImitation = vi.fn();
    render(
      <MainMenu
        onOpenImitation={onOpenImitation}
        onOpenNoteNavigation={onOpenNoteNavigation}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /note navigation/i }));
    fireEvent.click(screen.getByRole("button", { name: /imitation/i }));

    expect(onOpenNoteNavigation).toHaveBeenCalledOnce();
    expect(onOpenImitation).toHaveBeenCalledOnce();
  });
});
