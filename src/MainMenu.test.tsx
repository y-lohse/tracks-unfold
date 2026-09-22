import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MainMenu } from "./MainMenu";

const dormantAreas = [
  "Imitation",
  "Tonal contours",
  "Rhythm performance",
  "Interval identification",
];

describe("MainMenu", () => {
  it("shows one active area and four dormant areas", () => {
    render(<MainMenu />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Tracks Unfold" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /note navigation/i }),
    ).toHaveTextContent("01Navigation");

    for (const area of dormantAreas) {
      expect(screen.getByText(area)).toBeInTheDocument();
    }

    expect(screen.getAllByText("Dormant")).toHaveLength(4);
  });

  it("opens note navigation", () => {
    const onOpenNoteNavigation = vi.fn();
    render(<MainMenu onOpenNoteNavigation={onOpenNoteNavigation} />);

    fireEvent.click(screen.getByRole("button", { name: /note navigation/i }));

    expect(onOpenNoteNavigation).toHaveBeenCalledOnce();
  });
});
