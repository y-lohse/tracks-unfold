import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const synth = vi.hoisted(() => ({
  noteOn: vi.fn(),
  noteOff: vi.fn(),
  releaseAll: vi.fn(),
}));

vi.mock("./keyboardSynth", () => ({ keyboardSynth: synth }));

import { App } from "./App";
import {
  loadImitationProfile,
  saveImitationProfile,
} from "./imitation/persistence";
import { createImitationProfile } from "./imitation/profile";
import {
  createDefaultProfile,
  loadProfile,
  saveProfile,
} from "./noteNavigation";

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
    expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
    expect(
      screen.getByText(
        "Learn to identify the direction and distance between notes.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/a whole tone is two semitones/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Three wrong answers/)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /reset/i }),
    ).not.toBeInTheDocument();
  });

  it("opens Imitation as a playable second area", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /imitation/i }));

    expect(
      screen.getByRole("heading", { level: 1, name: "Imitation" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "← Back" })).toBeEnabled();
    expect(
      screen.queryByRole("button", { name: /reset/i }),
    ).not.toBeInTheDocument();
  });

  it("erases both puzzle profiles from settings without clearing unrelated data", () => {
    const navigation = createDefaultProfile();
    const imitation = createImitationProfile();
    saveProfile(navigation, window.localStorage);
    saveImitationProfile(imitation, window.localStorage);
    window.localStorage.setItem("unrelated", "keep");
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    fireEvent.click(screen.getByRole("button", { name: "Erase all progress" }));
    expect(window.localStorage.length).toBe(3);
    fireEvent.click(
      screen.getByRole("button", { name: "Confirm erase all progress" }),
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "All progress erased.",
    );
    expect(window.localStorage.length).toBe(1);
    expect(window.localStorage.getItem("unrelated")).toBe("keep");
    expect(loadProfile(window.localStorage)).toEqual(createDefaultProfile());
    expect(loadImitationProfile(window.localStorage)).toEqual(
      createImitationProfile(),
    );
    fireEvent.click(screen.getByRole("button", { name: "← Back" }));
    fireEvent.click(screen.getByRole("button", { name: /imitation/i }));
    expect(
      screen.getByRole("heading", { name: "Imitation" }),
    ).toBeInTheDocument();
  });

  it("starts a three-life run and requires selection before submission", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /note navigation/i }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByLabelText("3 lives remaining")).toBeInTheDocument();
    const puzzleVents = screen.getByLabelText("Puzzle 1");
    expect(puzzleVents).toBeInTheDocument();
    expect(puzzleVents.firstElementChild?.children).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Exit run" })).toBeEnabled();
    expect(document.querySelectorAll('[aria-label^="Octave "]')).toHaveLength(
      1,
    );
    expect(screen.queryByText("Debug")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled();

    const choices = screen.getAllByRole("button", { pressed: false });
    fireEvent.click(choices[0]!);

    expect(choices[0]).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Submit" })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
    expect(
      document.querySelectorAll('[data-answer-state="correct"]'),
    ).toHaveLength(1);
    expect(screen.queryByText("Correct")).not.toBeInTheDocument();
    expect(screen.queryByText("Mistake")).not.toBeInTheDocument();
    expect(synth.noteOn).toHaveBeenCalledOnce();
    expect(window.localStorage.length).toBe(1);

    fireEvent.click(screen.getByRole("button", { name: "Exit run" }));
    expect(
      screen.getByRole("button", { name: /note navigation/i }),
    ).toBeInTheDocument();
  });
});
