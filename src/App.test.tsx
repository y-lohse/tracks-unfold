import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const synth = vi.hoisted(() => ({
  noteOn: vi.fn(),
  noteOff: vi.fn(),
  releaseAll: vi.fn(),
}));

vi.mock("./keyboardSynth", () => ({ keyboardSynth: synth }));

import { App } from "./App";

describe("App", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.spyOn(Math, "random").mockReturnValue(0.2);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("opens the puzzle introduction from the instrument menu", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /note navigation/i }));

    expect(
      screen.getByRole("heading", { level: 1, name: "Note navigation" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Begin run" })).toBeEnabled();
  });

  it("starts a three-life run and requires selection before submission", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /note navigation/i }));
    fireEvent.click(screen.getByRole("button", { name: "Begin run" }));

    expect(screen.getByText("Lives 3")).toBeInTheDocument();
    expect(screen.getByText("Puzzle 1")).toBeInTheDocument();
    expect(document.querySelectorAll('[aria-label^="Octave "]')).toHaveLength(
      1,
    );
    const assessments = screen.getByLabelText("Skill assessments");
    expect(assessments).not.toHaveAttribute("open");
    fireEvent.click(within(assessments).getByText("Debug"));
    expect(assessments).toHaveAttribute("open");
    expect(within(assessments).getByText("Finding a note")).toBeInTheDocument();
    expect(
      within(assessments).getAllByText(/P 0\.\d{2} · C 0\.\d{2} · CH 0\.\d{2}/),
    ).toHaveLength(4);
    expect(within(assessments).getByText("Navigation")).toBeInTheDocument();
    expect(within(assessments).getByText("Interval names")).toBeInTheDocument();
    expect(within(assessments).getByText("Answer breadth")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled();

    const choices = screen.getAllByRole("button", { pressed: false });
    fireEvent.click(choices[0]!);

    expect(choices[0]).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Submit" })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
    expect(synth.noteOn).toHaveBeenCalledOnce();
    expect(window.localStorage.length).toBe(1);
  });
});
