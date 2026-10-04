import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MainMenu } from "./MainMenu";
import { reconcileUnlocks, puzzleRequirements } from "./progression";
import { PUZZLES, PUZZLE_IDS } from "./puzzleCatalog";

describe("MainMenu", () => {
  it("shows all fifteen puzzles with Navigation initially unlocked", () => {
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
    expect(PUZZLE_IDS).toHaveLength(15);
    for (const name of PUZZLE_IDS.filter((id) => id !== "navigation").map(
      (id) => PUZZLES[id].title,
    )) {
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

  it("keeps detailed AND/OR requirements in the previews", () => {
    render(
      <MainMenu unlocks={reconcileUnlocks([], { scaleConveyors: 0.35 })} />,
    );
    expect(screen.queryByText("All required")).not.toBeInTheDocument();
    expect(screen.queryByText("Your musical paths")).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Open Numeral dominoes, locked" }),
    );
    expect(screen.getByText("All required")).toBeInTheDocument();
    expect(screen.getByText(/Scale conveyors ≥ 35%/)).toHaveTextContent(
      "earned",
    );
    expect(screen.getByText("Chordfall ≥ 35%")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "← Back" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Open Cover versions, locked" }),
    );
    expect(screen.getByText("OR")).toBeInTheDocument();
    expect(screen.getByText(/Chord covers/)).toBeInTheDocument();
    expect(screen.getByText(/Melody covers/)).toBeInTheDocument();
  });

  it("connects every shared prerequisite and highlights earned connections", () => {
    const unlocks = reconcileUnlocks([], { scaleConveyors: 0.35 });
    render(<MainMenu unlocks={unlocks} />);
    const tree = screen.getByRole("region", { name: "Puzzle tree" });
    const edges = tree.querySelectorAll("path[data-source]");
    const requirements = PUZZLE_IDS.flatMap((target) =>
      puzzleRequirements(target, unlocks).flatMap((route) =>
        route.requirements.map((item) => ({ ...item, target })),
      ),
    );
    expect(edges).toHaveLength(requirements.length);
    for (const { source, target, earned } of requirements) {
      const edge = [...edges].find(
        (edge) =>
          edge.getAttribute("data-source") === source &&
          edge.getAttribute("data-target") === target,
      );
      expect(edge).toBeDefined();
      expect(Boolean(edge?.getAttribute("class"))).toBe(earned);
    }
    const navigation = screen.getByRole("button", {
      name: "Open Note navigation",
    });
    expect(navigation.style.getPropertyValue("--tree-column")).toBe("2");
    expect(navigation.style.getPropertyValue("--tree-row")).toBe("1");
    expect(
      screen
        .getByRole("button", { name: "Open Interval identification, locked" })
        .style.getPropertyValue("--tree-row"),
    ).toBe("3");
    expect(tree.querySelectorAll("article")).toHaveLength(0);
  });

  it("provides a non-playable preview and back navigation for every placeholder", () => {
    render(<MainMenu />);
    for (const id of PUZZLE_IDS.filter((id) => !PUZZLES[id].implemented)) {
      fireEvent.click(
        screen.getByRole("button", {
          name: `Open ${PUZZLES[id].title}, locked`,
        }),
      );
      expect(
        screen.getByRole("heading", { name: PUZZLES[id].title }),
      ).toBeInTheDocument();
      expect(screen.getByText(PUZZLES[id].description)).toBeInTheDocument();
      expect(screen.getByText("Coming soon.")).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Start" }),
      ).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "← Back" }));
    }
  });

  it("explains prerequisites for an upcoming locked puzzle", () => {
    render(<MainMenu />);
    fireEvent.click(screen.getByRole("button", { name: /tonal contours/i }));
    expect(screen.getByText("Note navigation ≥ 20%")).toBeInTheDocument();
    expect(screen.getByText("Coming soon.")).toBeInTheDocument();
  });
});
