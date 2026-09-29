import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const synth = vi.hoisted(() => ({
  noteOn: vi.fn(),
  noteOff: vi.fn(),
  releaseAll: vi.fn(),
}));

vi.mock("./keyboardSynth", () => ({ keyboardSynth: synth }));

import { App } from "./App";
import * as navigation from "./noteNavigation";
import {
  loadImitationProfile,
  saveImitationProfile,
} from "./imitation/persistence";
import { createImitationProfile } from "./imitation/profile";
import { createProfile } from "./noteNavigation/profile";
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
    expect(screen.getByRole("button", { name: "Start" })).toBeEnabled();
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

  it("opens Imitation as a playable second area at 20% Navigation progress", () => {
    const navigation = createProfile({
      numericalDestination: { proficiency: 0.2 },
      numericalDistance: { proficiency: 0.2 },
      intervalInterpretation: { proficiency: 0.2 },
      intervalIdentification: { proficiency: 0.2 },
    });
    saveProfile(navigation, window.localStorage);
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /imitation/i }));

    expect(
      screen.getByRole("heading", { level: 1, name: "Imitation" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "← Back" })).toBeEnabled();
    expect(
      screen.queryByRole("button", { name: /reset/i }),
    ).not.toBeInTheDocument();
  });

  it("shows saved skill percentages and keeps locked Imitation inspectable", () => {
    const navigation = createProfile({
      numericalDestination: { proficiency: 0.4 },
    });
    saveProfile(navigation, window.localStorage);
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /note navigation/i }));
    expect(screen.getByText("Finding a note")).toBeInTheDocument();
    expect(screen.getByText("40%")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "← Back" }));
    fireEvent.click(screen.getByRole("button", { name: /imitation/i }));
    expect(screen.getByRole("button", { name: "Start" })).toBeDisabled();
    expect(
      screen.getByText("Reach 20% in Navigation to unlock."),
    ).toBeInTheDocument();
    expect(screen.getByText("Pitch direction")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Listen to a melody, then recreate its pattern on the keyboard.",
      ),
    ).toBeInTheDocument();
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

  it.each(["succeeded", "failed"] as const)(
    "returns a %s run to the puzzle home with updated skills and a fresh replay",
    (status) => {
      const initialProfile = createDefaultProfile();
      const updatedProfile = createProfile({
        numericalDestination: { proficiency: 0.43 },
      });
      const answer = navigation.answerQuestion;
      vi.spyOn(navigation, "answerQuestion").mockImplementation((...args) => {
        const transition = answer(...args);
        return {
          ...transition,
          state: {
            ...transition.state,
            status,
            puzzlesPresented: 7,
            profile: updatedProfile,
          },
        };
      });
      render(<App />);
      fireEvent.click(screen.getByRole("button", { name: /note navigation/i }));
      fireEvent.click(screen.getByRole("button", { name: "Start" }));
      fireEvent.click(screen.getAllByRole("button", { pressed: false })[0]!);
      fireEvent.click(screen.getByRole("button", { name: "Submit" }));
      expect(
        screen.queryByRole("button", { name: "Play again" }),
      ).not.toBeInTheDocument();
      const releases = synth.releaseAll.mock.calls.length;
      fireEvent.click(screen.getByRole("button", { name: "Continue" }));
      expect(synth.releaseAll.mock.calls.length).toBeGreaterThan(releases);
      expect(
        screen.getByRole("heading", { level: 1, name: "Note navigation" }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          `${status === "succeeded" ? "Run complete" : "Run ended"} · 7 puzzles played.`,
        ),
      ).toBeInTheDocument();
      expect(
        screen.queryByText(
          "Learn to identify the direction and distance between notes.",
        ),
      ).not.toBeInTheDocument();
      const skill = screen.getByText("Finding a note").parentElement;
      expect(skill).toHaveTextContent(
        `${Math.round(initialProfile.numericalDestination.proficiency * 100)}%`,
      );
      expect(skill).toHaveTextContent("43%");
      expect(loadProfile(window.localStorage)).toEqual(updatedProfile);
      fireEvent.click(screen.getByRole("button", { name: "Play again" }));
      expect(screen.getByLabelText("3 lives remaining")).toBeInTheDocument();
      expect(screen.getByLabelText("Puzzle 1")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled();
      fireEvent.click(screen.getAllByRole("button", { pressed: false })[0]!);
      fireEvent.click(screen.getByRole("button", { name: "Submit" }));
      fireEvent.click(screen.getByRole("button", { name: "Continue" }));
      fireEvent.click(screen.getByRole("button", { name: "← Back" }));
      fireEvent.click(screen.getByRole("button", { name: /note navigation/i }));
      expect(screen.getByRole("button", { name: "Start" })).toBeEnabled();
      expect(
        screen.getByText(
          "Learn to identify the direction and distance between notes.",
        ),
      ).toBeInTheDocument();
      expect(screen.queryByText(/7 puzzles played/)).not.toBeInTheDocument();
      expect(screen.queryByText("Before run:")).not.toBeInTheDocument();
      expect(screen.getByText("43%")).toBeInTheDocument();
    },
  );

  it("starts a three-life run and requires selection before submission", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /note navigation/i }));
    fireEvent.click(screen.getByRole("button", { name: "Start" }));

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
