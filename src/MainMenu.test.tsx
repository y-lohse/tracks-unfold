import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MainMenu } from "./MainMenu";
import { reconcileUnlocks } from "./progression";

describe("MainMenu", () => {
  it("shows a five-puzzle tree with Navigation initially unlocked", () => {
    render(<MainMenu />);
    expect(
      screen.getByRole("heading", { name: "Tracks Unfold" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Puzzle tree" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Open Note navigation" }),
    ).toHaveTextContent("Navigation");
    for (const name of [
      "Imitation",
      "Rhythm performance",
      "Tonal contours",
      "Interval identification",
    ]) {
      expect(
        screen.getByRole("button", { name: `Open ${name}, locked` }),
      ).toBeEnabled();
    }
    expect(screen.queryByText("Dormant")).not.toBeInTheDocument();
  });

  it("keeps locked introductions inspectable and opens Settings", () => {
    const onOpenNoteNavigation = vi.fn();
    const onOpenImitation = vi.fn();
    const onOpenSettings = vi.fn();
    const onOpenInstrument = vi.fn();
    render(
      <MainMenu
        onOpenImitation={onOpenImitation}
        onOpenNoteNavigation={onOpenNoteNavigation}
        onOpenSettings={onOpenSettings}
        onOpenInstrument={onOpenInstrument}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /note navigation/i }));
    fireEvent.click(screen.getByRole("button", { name: /imitation/i }));
    const settings = screen.getByRole("button", { name: "Settings" });
    expect(settings.closest("header")).not.toBeNull();
    expect(settings.querySelector("svg")).not.toBeNull();

    expect(screen.queryByText("Settings")).not.toBeInTheDocument();
    fireEvent.click(settings);
    expect(onOpenSettings).toHaveBeenCalledOnce();
    const instrument = screen.getByRole("button", { name: "Instrument" });
    expect(instrument.closest("header")).toBe(settings.closest("header"));
    expect(instrument.querySelector("svg")).not.toBeNull();
    expect(screen.queryByText("Instrument")).not.toBeInTheDocument();
    fireEvent.click(instrument);
    expect(onOpenInstrument).toHaveBeenCalledOnce();
    expect(onOpenNoteNavigation).toHaveBeenCalledOnce();
    expect(onOpenImitation).toHaveBeenCalledOnce();
  });

  it("applies exact prerequisite thresholds without making future puzzles playable", () => {
    const { rerender } = render(
      <MainMenu unlocks={reconcileUnlocks([], { navigation: 0.199 })} />,
    );
    expect(
      screen.getByRole("button", { name: "Open Imitation, locked" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Open Interval identification, locked",
      }),
    ).toBeInTheDocument();
    const branchUnlocks = reconcileUnlocks([], {
      navigation: 0.2,
      imitation: 0.599,
    });
    rerender(<MainMenu unlocks={branchUnlocks} />);
    expect(
      screen.getByRole("button", { name: "Open Imitation" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Open Interval identification, locked",
      }),
    ).toBeInTheDocument();
    const unlocks = reconcileUnlocks(branchUnlocks, { imitation: 0.6 });
    rerender(
      <MainMenu
        unlocks={reconcileUnlocks(unlocks, { navigation: 0, imitation: 0 })}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Open Interval identification, coming soon",
      }),
    );
    expect(
      screen.getByRole("heading", { name: "Interval identification" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Coming soon.")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Start" }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "← Back" }));
    expect(
      screen.getByRole("region", { name: "Puzzle tree" }),
    ).toBeInTheDocument();
  });

  it("explains prerequisites for an upcoming locked puzzle", () => {
    render(<MainMenu />);
    fireEvent.click(screen.getByRole("button", { name: /tonal contours/i }));
    expect(
      screen.getByText("Reach 20% in Navigation to unlock."),
    ).toBeInTheDocument();
    expect(screen.getByText("Coming soon.")).toBeInTheDocument();
  });
});
