import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PuzzleKeyboard } from "./PuzzleKeyboard";
import styles from "./PuzzleKeyboard.module.css";

describe("PuzzleKeyboard", () => {
  it("preserves marker roles, optional labels, and enharmonic spelling", () => {
    const { container } = render(
      <PuzzleKeyboard
        markers={[
          { label: "B♯3", pitch: 60, role: "primary" },
          { pitch: 62, role: "secondary" },
        ]}
        octaves={[4]}
      />,
    );

    const label = screen.getByText("B♯3");
    expect(label.parentElement?.parentElement).toHaveClass(styles.primary);
    expect(screen.queryByText("C4")).not.toBeInTheDocument();
    expect(screen.queryByText("D4")).not.toBeInTheDocument();
    expect(container.querySelector("figure")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("enables only the supplied pitches in interactive mode", () => {
    const onPitchPress = vi.fn();
    render(
      <PuzzleKeyboard
        enabledPitches={new Set([60])}
        octaves={[4]}
        onPitchPress={onPitchPress}
        showPitchLabels
      />,
    );

    const enabledKey = screen.getByRole("button", { name: "C4" });
    const disabledKey = screen.getByRole("button", { name: "D4" });
    expect(screen.getByText("C4")).toBeInTheDocument();
    expect(screen.getByText("D4")).toBeInTheDocument();
    expect(screen.getByText("B4")).toBeInTheDocument();

    expect(enabledKey).toBeEnabled();
    expect(disabledKey).toBeDisabled();

    fireEvent.click(enabledKey);
    fireEvent.click(disabledKey);

    expect(onPitchPress).toHaveBeenCalledOnce();
    expect(onPitchPress).toHaveBeenCalledWith(60);
  });

  it("represents sounding pitch independently from markers", () => {
    render(
      <PuzzleKeyboard
        markers={[{ label: "C4", pitch: 60, role: "primary" }]}
        octaves={[4]}
        onPitchPress={vi.fn()}
        soundingPitch={62}
      />,
    );

    expect(screen.getByRole("button", { name: "C4" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByRole("button", { name: "D4" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
