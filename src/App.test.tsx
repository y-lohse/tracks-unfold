import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const synth = vi.hoisted(() => ({
  configure: vi.fn(),
  noteOn: vi.fn(),
  noteOff: vi.fn(),
  releaseAll: vi.fn(),
}));

vi.mock("./keyboardSynth", () => ({ keyboardSynth: synth }));

import { App } from "./App";
import { DEFAULT_INSTRUMENT_SOUND } from "./instrumentPresets";
import {
  loadInstrumentSound,
  saveInstrumentSound,
  INSTRUMENT_STORAGE_KEY,
} from "./instrumentStorage";
import { loadUnlocks, reconcileUnlocks, saveUnlocks } from "./progression";
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
    vi.useRealTimers();
  });

  it("assembles four compact slots directly from home and restores the shared sound", () => {
    vi.useFakeTimers();
    saveUnlocks(
      reconcileUnlocks([], { navigation: 1, imitation: 1 }),
      window.localStorage,
    );
    const first = render(<App />);
    expect(synth.configure).toHaveBeenLastCalledWith(DEFAULT_INSTRUMENT_SOUND);
    fireEvent.click(screen.getByRole("button", { name: "Instrument" }));
    expect(screen.getAllByRole("combobox")).toHaveLength(4);
    expect(
      screen.queryByRole("combobox", { name: "Octave" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Hold keys/)).not.toBeInTheDocument();
    const sound = {
      tone: "reed",
      shape: "round",
      filter: "mellow",
      effect: "grit",
    } as const;
    for (const [label, value] of [
      ["Tone", "reed"],
      ["Shape", "round"],
      ["Filter", "mellow"],
      ["Effect", "grit"],
    ]) {
      fireEvent.change(screen.getByRole("combobox", { name: label }), {
        target: { value },
      });
    }
    expect(synth.configure).toHaveBeenLastCalledWith(sound);
    expect(loadInstrumentSound(window.localStorage)).toEqual(sound);
    const key = screen.getByRole("button", { name: "C4" });
    fireEvent.keyDown(key, { key: " " });
    expect(synth.noteOn).toHaveBeenLastCalledWith("C4");
    act(() => vi.advanceTimersByTime(300));
    fireEvent.keyUp(key, { key: " " });
    expect(synth.noteOff).toHaveBeenLastCalledWith("C4");
    expect(key).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(
      screen.getByRole("heading", { name: "Tracks Unfold" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /note navigation/i }));
    expect(synth.configure).toHaveBeenLastCalledWith(sound);
    first.unmount();
    render(<App />);
    expect(synth.configure).toHaveBeenLastCalledWith(sound);
    fireEvent.click(screen.getByRole("button", { name: "Instrument" }));
    expect(screen.getByRole("combobox", { name: "Shape" })).toHaveValue(
      "round",
    );
    expect(screen.getByRole("combobox", { name: "Effect" })).toHaveValue(
      "grit",
    );
  });

  it("cancels pending minimum notes on preset changes and exit", () => {
    vi.useFakeTimers();
    saveUnlocks(reconcileUnlocks([], { navigation: 1 }), window.localStorage);
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Instrument" }));
    const key = screen.getByRole("button", { name: "C4" });
    fireEvent.keyDown(key, { key: "Enter" });
    fireEvent.keyUp(key, { key: "Enter" });
    fireEvent.change(screen.getByRole("combobox", { name: "Tone" }), {
      target: { value: "triangle" },
    });
    expect(synth.releaseAll).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "C4" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    synth.noteOff.mockClear();
    act(() => vi.advanceTimersByTime(300));
    expect(synth.noteOff).not.toHaveBeenCalled();
    fireEvent.keyDown(screen.getByRole("button", { name: "D4" }), {
      key: "Enter",
    });
    fireEvent.keyUp(screen.getByRole("button", { name: "D4" }), {
      key: "Enter",
    });
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    synth.noteOff.mockClear();
    act(() => vi.advanceTimersByTime(300));
    expect(synth.noteOff).not.toHaveBeenCalled();
  });

  it("gives taps 250ms, retriggers repeated taps, and releases longer holds immediately", () => {
    vi.useFakeTimers();
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Instrument" }));
    const key = screen.getByRole("button", { name: "C4" });
    synth.noteOff.mockClear();
    fireEvent.keyDown(key, { key: "Enter" });
    act(() => vi.advanceTimersByTime(20));
    fireEvent.keyUp(key, { key: "Enter" });
    act(() => vi.advanceTimersByTime(229));
    expect(synth.noteOff).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(synth.noteOff).toHaveBeenCalledWith("C4");
    expect(key).toHaveAttribute("aria-pressed", "false");
    fireEvent.keyDown(key, { key: "Enter" });
    fireEvent.keyUp(key, { key: "Enter" });
    act(() => vi.advanceTimersByTime(100));
    fireEvent.keyDown(key, { key: "Enter" });
    synth.noteOff.mockClear();
    act(() => vi.advanceTimersByTime(300));
    expect(synth.noteOff).not.toHaveBeenCalled();
    fireEvent.keyUp(key, { key: "Enter" });
    expect(synth.noteOff).toHaveBeenCalledWith("C4");
  });

  it("interrupts tap timers when the window loses focus", () => {
    vi.useFakeTimers();
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Instrument" }));
    const key = screen.getByRole("button", { name: "C4" });
    fireEvent.keyDown(key, { key: "Enter" });
    fireEvent.keyUp(key, { key: "Enter" });
    fireEvent.blur(window);
    expect(key).toHaveAttribute("aria-pressed", "false");
    synth.noteOff.mockClear();
    act(() => vi.advanceTimersByTime(300));
    expect(synth.noteOff).not.toHaveBeenCalled();
  });

  it("relocks and resets equipped rewards when progress is erased", () => {
    saveUnlocks(reconcileUnlocks([], { imitation: 1 }), window.localStorage);
    saveInstrumentSound(
      { ...DEFAULT_INSTRUMENT_SOUND, tone: "reed" },
      window.localStorage,
    );
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    fireEvent.click(screen.getByRole("button", { name: "Erase all progress" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Confirm erase all progress" }),
    );
    expect(loadInstrumentSound(window.localStorage)).toEqual(
      DEFAULT_INSTRUMENT_SOUND,
    );
    expect(synth.configure).toHaveBeenLastCalledWith(DEFAULT_INSTRUMENT_SOUND);
    expect(loadUnlocks(window.localStorage)).toEqual([]);
  });

  it("keeps unsaved choices active and reports persistence failure", () => {
    saveUnlocks(reconcileUnlocks([], { navigation: 1 }), window.localStorage);
    const setItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (
      this: Storage,
      key,
      value,
    ) {
      if (key === INSTRUMENT_STORAGE_KEY) throw new Error("quota");
      setItem.call(this, key, value);
    });
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Instrument" }));
    fireEvent.change(screen.getByRole("combobox", { name: "Tone" }), {
      target: { value: "triangle" },
    });
    expect(screen.getByRole("combobox", { name: "Tone" })).toHaveValue(
      "triangle",
    );
    expect(synth.configure).toHaveBeenLastCalledWith({
      ...DEFAULT_INSTRUMENT_SOUND,
      tone: "triangle",
    });
    expect(screen.getByRole("alert")).toHaveTextContent("could not be saved");
  });

  it("offers only defaults initially and rejects selecting a locked option", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Instrument" }));
    const options = screen.getAllByRole("option") as HTMLOptionElement[];
    expect(
      options
        .filter((option) => !option.disabled)
        .map((option) => option.value),
    ).toEqual(["sine", "steady", "open", "dry"]);
    expect(
      screen.getByRole("option", { name: "Round — Navigation 33%" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("option", { name: "Grit — Imitation 66%" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("option", { name: "Square — Locked" }),
    ).toBeDisabled();
    fireEvent.change(screen.getByRole("combobox", { name: "Tone" }), {
      target: { value: "reed" },
    });
    expect(synth.configure).toHaveBeenLastCalledWith(DEFAULT_INSTRUMENT_SOUND);
    expect(window.localStorage.getItem(INSTRUMENT_STORAGE_KEY)).toBeNull();
  });

  it("does not treat saved prototype sound choices as earned content", () => {
    saveUnlocks(["reward:navigation:33"], window.localStorage);
    saveInstrumentSound(
      { tone: "reed", shape: "round", filter: "thin", effect: "grit" },
      window.localStorage,
    );
    render(<App />);
    const available = { ...DEFAULT_INSTRUMENT_SOUND, shape: "round" };
    expect(synth.configure).toHaveBeenLastCalledWith(available);
    fireEvent.click(screen.getByRole("button", { name: "Instrument" }));
    expect(screen.getByRole("combobox", { name: "Tone" })).toHaveValue("sine");
    expect(screen.getByRole("combobox", { name: "Shape" })).toHaveValue(
      "round",
    );
    expect(screen.getByRole("combobox", { name: "Filter" })).toHaveValue(
      "open",
    );
    expect(screen.getByRole("combobox", { name: "Effect" })).toHaveValue("dry");
  });

  it("credits both existing profiles on startup but leaves unassigned content locked", () => {
    const profile = createProfile({
      numericalDestination: { proficiency: 1 },
      numericalDistance: { proficiency: 1 },
      intervalInterpretation: { proficiency: 1 },
      intervalIdentification: { proficiency: 1 },
    });
    saveProfile(profile, window.localStorage);
    const imitation = Object.fromEntries(
      Object.entries(createImitationProfile()).map(([key, skill]) => [
        key,
        { ...skill, proficiency: 1 },
      ]),
    ) as ReturnType<typeof createImitationProfile>;
    saveImitationProfile(imitation, window.localStorage);
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Instrument" }));
    const options = screen.getAllByRole("option") as HTMLOptionElement[];
    expect(options.filter((option) => !option.disabled)).toHaveLength(10);
    for (const name of [
      "Round",
      "Mellow",
      "Triangle",
      "Room",
      "Grit",
      "Reed",
    ]) {
      expect(screen.getByRole("option", { name })).toBeEnabled();
    }
    expect(
      screen.getByRole("option", { name: "Square — Locked" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("option", { name: "Hall — Locked" }),
    ).toBeDisabled();
  });

  it.each([
    [0.33, "Shape", "round", "Round"],
    [0.66, "Filter", "mellow", "Mellow"],
    [1, "Tone", "triangle", "Triangle"],
  ] as const)(
    "makes Navigation reward at %s usable immediately after an answer and permanent across reload",
    (threshold, slot, preset, label) => {
      const withProgress = (progress: number) =>
        createProfile({
          numericalDestination: { proficiency: progress },
          numericalDistance: { proficiency: progress },
          intervalInterpretation: { proficiency: progress },
          intervalIdentification: { proficiency: progress },
        });
      saveProfile(withProgress(threshold - 0.0001), window.localStorage);
      const answer = navigation.answerQuestion;
      vi.spyOn(navigation, "answerQuestion").mockImplementation((...args) => {
        const result = answer(...args);
        return {
          ...result,
          state: {
            ...result.state,
            profile: withProgress(threshold),
            status: "failed",
          },
        };
      });
      const first = render(<App />);
      fireEvent.click(screen.getByRole("button", { name: "Instrument" }));
      expect(
        screen.getByRole("option", { name: new RegExp(`^${label} —`) }),
      ).toBeDisabled();
      fireEvent.click(screen.getByRole("button", { name: "Back" }));
      fireEvent.click(screen.getByRole("button", { name: /note navigation/i }));
      fireEvent.click(screen.getByRole("button", { name: "Start" }));
      fireEvent.click(screen.getAllByRole("button", { pressed: false })[0]!);
      fireEvent.click(screen.getByRole("button", { name: "Submit" }));
      fireEvent.click(screen.getByRole("button", { name: "Exit run" }));
      fireEvent.click(screen.getByRole("button", { name: "Instrument" }));
      expect(screen.getByRole("option", { name: label })).toBeEnabled();
      fireEvent.change(screen.getByRole("combobox", { name: slot }), {
        target: { value: preset },
      });
      expect(synth.configure).toHaveBeenLastCalledWith({
        ...DEFAULT_INSTRUMENT_SOUND,
        [slot.toLowerCase()]: preset,
      });
      first.unmount();
      saveProfile(createDefaultProfile(), window.localStorage);
      render(<App />);
      fireEvent.click(screen.getByRole("button", { name: "Instrument" }));
      expect(screen.getByRole("option", { name: label })).toBeEnabled();
      expect(screen.getByRole("combobox", { name: slot })).toHaveValue(preset);
    },
  );

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

  it("migrates both saved profiles and retains earned access after proficiency falls and reloads", () => {
    const navigationProfile = createProfile({
      numericalDestination: { proficiency: 0.66 },
      numericalDistance: { proficiency: 0.66 },
      intervalInterpretation: { proficiency: 0.66 },
      intervalIdentification: { proficiency: 0.66 },
    });
    const imitationProfile = Object.fromEntries(
      Object.entries(createImitationProfile()).map(([key, skill]) => [
        key,
        { ...skill, proficiency: 0.66 },
      ]),
    ) as ReturnType<typeof createImitationProfile>;
    saveProfile(navigationProfile, window.localStorage);
    saveImitationProfile(imitationProfile, window.localStorage);
    const first = render(<App />);
    const earned = loadUnlocks(window.localStorage);
    expect(earned).toEqual(
      reconcileUnlocks([], { navigation: 0.66, imitation: 0.66 }),
    );
    first.unmount();
    saveProfile(createDefaultProfile(), window.localStorage);
    saveImitationProfile(createImitationProfile(), window.localStorage);
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /imitation/i }));
    expect(screen.getByRole("button", { name: "Start" })).toBeEnabled();
    expect(loadUnlocks(window.localStorage)).toEqual(earned);
  });

  it.each(["active", "failed"] as const)(
    "saves Navigation threshold rewards on an answer in a %s run, before exit",
    (status) => {
      const updatedProfile = createProfile({
        numericalDestination: { proficiency: 0.66 },
        numericalDistance: { proficiency: 0.66 },
        intervalInterpretation: { proficiency: 0.66 },
        intervalIdentification: { proficiency: 0.66 },
      });
      const answer = navigation.answerQuestion;
      vi.spyOn(navigation, "answerQuestion").mockImplementation((...args) => {
        const result = answer(...args);
        return {
          ...result,
          state: { ...result.state, status, profile: updatedProfile },
        };
      });
      render(<App />);
      fireEvent.click(screen.getByRole("button", { name: /note navigation/i }));
      fireEvent.click(screen.getByRole("button", { name: "Start" }));
      fireEvent.click(screen.getAllByRole("button", { pressed: false })[0]!);
      fireEvent.click(screen.getByRole("button", { name: "Submit" }));
      expect(loadProfile(window.localStorage)).toEqual(updatedProfile);
      expect(loadUnlocks(window.localStorage)).toEqual(
        reconcileUnlocks([], { navigation: 0.66 }),
      );
      fireEvent.click(screen.getByRole("button", { name: "Exit run" }));
      fireEvent.click(screen.getByRole("button", { name: /imitation/i }));
      expect(screen.getByRole("button", { name: "Start" })).toBeEnabled();
    },
  );

  it("refreshes the latest Imitation ledger on exit instead of overwriting it", () => {
    saveUnlocks(reconcileUnlocks([], { navigation: 0.2 }), window.localStorage);
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /imitation/i }));
    const earned = reconcileUnlocks(loadUnlocks(window.localStorage), {
      imitation: 0.66,
    });
    saveUnlocks(earned, window.localStorage);
    fireEvent.click(screen.getByRole("button", { name: "← Back" }));
    expect(loadUnlocks(window.localStorage)).toEqual(earned);
    fireEvent.click(screen.getByRole("button", { name: "Instrument" }));
    expect(screen.getByRole("option", { name: "Room" })).toBeEnabled();
    expect(screen.getByRole("option", { name: "Grit" })).toBeEnabled();
    expect(
      screen.getByRole("option", { name: "Reed — Imitation 100%" }),
    ).toBeDisabled();
    fireEvent.change(screen.getByRole("combobox", { name: "Effect" }), {
      target: { value: "grit" },
    });
    expect(synth.configure).toHaveBeenLastCalledWith({
      ...DEFAULT_INSTRUMENT_SOUND,
      effect: "grit",
    });
    expect(loadUnlocks(window.localStorage)).toEqual(earned);
  });

  it("erases both puzzle profiles and unlocks from settings without clearing unrelated data", () => {
    const navigation = createDefaultProfile();
    const imitation = createImitationProfile();
    saveProfile(navigation, window.localStorage);
    saveImitationProfile(imitation, window.localStorage);
    saveUnlocks(
      reconcileUnlocks([], { navigation: 1, imitation: 1 }),
      window.localStorage,
    );
    window.localStorage.setItem("unrelated", "keep");
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    fireEvent.click(screen.getByRole("button", { name: "Erase all progress" }));
    expect(window.localStorage.length).toBe(4);
    fireEvent.click(
      screen.getByRole("button", { name: "Confirm erase all progress" }),
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "All progress erased.",
    );
    expect(window.localStorage.length).toBe(2);
    expect(window.localStorage.getItem("unrelated")).toBe("keep");
    expect(loadUnlocks(window.localStorage)).toEqual([]);
    expect(loadProfile(window.localStorage)).toEqual(createDefaultProfile());
    expect(loadImitationProfile(window.localStorage)).toEqual(
      createImitationProfile(),
    );
    fireEvent.click(screen.getByRole("button", { name: "← Back" }));
    fireEvent.click(screen.getByRole("button", { name: /imitation/i }));
    expect(
      screen.getByRole("heading", { name: "Imitation" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start" })).toBeDisabled();
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
