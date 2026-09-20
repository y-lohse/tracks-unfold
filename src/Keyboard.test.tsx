import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Keyboard, type KeyboardLabels } from "./Keyboard";
import { PuzzleKeyboard } from "./PuzzleKeyboard";

const labels = {
  C: "C",
  "C sharp": "C♯",
  D: "D",
  "D sharp": "D♯",
  E: "E",
  F: "F",
  "F sharp": "F♯",
  G: "G",
  "G sharp": "G♯",
  A: "A",
  "A sharp": "A♯",
  B: "B",
} satisfies KeyboardLabels;

describe("PuzzleKeyboard", () => {
  it("preserves the question's enharmonic spelling on the key", () => {
    render(
      <PuzzleKeyboard
        destination={{ letter: "D", accidental: "natural", octave: 4 }}
        revealDestinationLabel={false}
        start={{ letter: "B", accidental: "sharp", octave: 3 }}
      />,
    );

    expect(screen.getByText("B♯3")).toBeInTheDocument();
    expect(screen.queryByText("C4")).not.toBeInTheDocument();
  });
});

describe("Keyboard", () => {
  it("renders labeled keys and disables the requested notes", () => {
    render(<Keyboard labels={labels} disabledNotes={["D sharp", "A"]} />);

    expect(screen.getAllByRole("button")).toHaveLength(12);
    expect(screen.getByRole("button", { name: "D sharp" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "A" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "C" })).toBeEnabled();

    for (const [note, label] of Object.entries(labels)) {
      expect(screen.getByRole("button", { name: note })).toHaveTextContent(
        label,
      );
    }
  });

  it("reports the start and end of pointer and keyboard presses", () => {
    const onNoteAttack = vi.fn();
    const onNoteRelease = vi.fn();

    const { container } = render(
      <Keyboard onNoteAttack={onNoteAttack} onNoteRelease={onNoteRelease} />,
    );

    const cKey = within(container).getByRole("button", { name: "C" });
    cKey.setPointerCapture = vi.fn();

    fireEvent.pointerDown(cKey, { button: 0, pointerId: 1 });
    fireEvent.pointerUp(cKey, { button: 0, pointerId: 1 });
    fireEvent.keyDown(cKey, { key: " " });
    fireEvent.keyDown(cKey, { key: " ", repeat: true });
    fireEvent.keyUp(cKey, { key: " " });

    expect(onNoteAttack).toHaveBeenCalledTimes(2);
    expect(onNoteAttack).toHaveBeenNthCalledWith(1, "C");
    expect(onNoteAttack).toHaveBeenNthCalledWith(2, "C");
    expect(onNoteRelease).toHaveBeenCalledTimes(2);
    expect(onNoteRelease).toHaveBeenNthCalledWith(1, "C");
    expect(onNoteRelease).toHaveBeenNthCalledWith(2, "C");
  });

  it("does not report interactions on disabled notes", () => {
    const onNoteAttack = vi.fn();
    const onNoteRelease = vi.fn();

    const { container } = render(
      <Keyboard
        disabledNotes={["A"]}
        onNoteAttack={onNoteAttack}
        onNoteRelease={onNoteRelease}
      />,
    );

    const aKey = within(container).getByRole("button", { name: "A" });
    aKey.setPointerCapture = vi.fn();

    fireEvent.pointerDown(aKey, { button: 0, pointerId: 1 });
    fireEvent.pointerUp(aKey, { button: 0, pointerId: 1 });
    fireEvent.keyDown(aKey, { key: " " });
    fireEvent.keyUp(aKey, { key: " " });

    expect(onNoteAttack).not.toHaveBeenCalled();
    expect(onNoteRelease).not.toHaveBeenCalled();
  });
});
