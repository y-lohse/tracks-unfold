import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const synth = vi.hoisted(() => ({
  unlock: vi.fn().mockResolvedValue(undefined),
  noteOn: vi.fn(),
  noteOff: vi.fn(),
  releaseAll: vi.fn(),
}));

vi.mock("../keyboardSynth", () => ({ keyboardSynth: synth }));

import { createSeededRng } from "../noteNavigation/random";
import { ImitationGame } from "./ImitationGame";
import { PLAYBACK_TIMING } from "./playback";
import { movementFeedback } from "./slotFeedbackPresentation";
import { IMITATION_TUNING } from "./tuning";
import type { MovementFeedback, SlotFeedback } from "./types";
import type { ImitationStorage } from "./persistence";

function memoryStorage() {
  const values = new Map<string, string>();
  const storage: ImitationStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
  return { storage, values };
}

function finishPlayback() {
  act(() => vi.runAllTimers());
}

function feedbackWith(...movements: readonly MovementFeedback[]): SlotFeedback {
  return {
    slotIndex: 1,
    suppliedAnchor: false,
    movements,
    targetComparison: null,
  };
}

function movement(
  status: MovementFeedback["status"],
  movementIndex: number,
  enteredMovement = 3,
): MovementFeedback {
  return {
    kind: "movement",
    movementIndex,
    attachedSlot: 1,
    expectedMovement: 2,
    enteredMovement,
    expectedDirection: "higher",
    status,
  };
}

function enabledPitchButton(): HTMLButtonElement {
  const pitchName = /^[A-G](?:♯)?[345]$/;
  const button = screen
    .getAllByRole("button")
    .find(
      (candidate) =>
        pitchName.test(candidate.getAttribute("aria-label") ?? "") &&
        !(candidate as HTMLButtonElement).disabled,
    );
  if (!button) throw new Error("Expected an enabled keyboard pitch");
  return button as HTMLButtonElement;
}

describe("slot correction copy", () => {
  it("deduplicates equivalent feedback and prioritizes the displayed state", () => {
    const tolerance = { kind: "tolerance", tolerance: 2 } as const;

    expect(
      movementFeedback(
        tolerance,
        feedbackWith(movement("variation", 0), movement("variation", 1)),
      ),
    ).toBe("Close enough");
    expect(
      movementFeedback(
        tolerance,
        feedbackWith(movement("variation", 0), movement("nearBoundary", 1)),
      ),
    ).toBe("Just within range");
    expect(
      movementFeedback(
        tolerance,
        feedbackWith(movement("error", 0, -3), movement("variation", 1)),
      ),
    ).toBe("Should be higher than the previous note");
  });

  it("shows one correction when both neighboring movements blame one slot", () => {
    const tolerance = { kind: "tolerance", tolerance: 2 } as const;
    const precedingMovement = movement("error", 0, 4);
    const followingMovement = {
      ...movement("error", 1, 2),
      expectedMovement: 5,
    };

    expect(
      movementFeedback(
        tolerance,
        feedbackWith(precedingMovement, followingMovement),
      ),
    ).toBe("Make this jump 2 semitones smaller");
  });
});

describe("ImitationGame", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("owns its introduction and resets only the persisted Imitation profile", () => {
    const { storage, values } = memoryStorage();
    values.set(IMITATION_TUNING.persistence.key, "saved");
    const onExit = vi.fn();

    render(<ImitationGame onExit={onExit} storage={storage} />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Imitation" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Imitation profile")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Reset Imitation profile" }),
    );
    expect(values.has(IMITATION_TUNING.persistence.key)).toBe(false);
    expect(screen.getByText("Imitation profile reset.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "← Back" }));
    expect(onExit).toHaveBeenCalledOnce();
  });

  it("does not create or charge an attempt when mobile audio cannot unlock", async () => {
    const { storage } = memoryStorage();
    synth.unlock.mockRejectedValueOnce(new Error("blocked"));
    render(<ImitationGame rng={createSeededRng(19)} storage={storage} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Begin run" }));
    });

    expect(
      screen.getByText("Audio could not start. Try beginning the run again."),
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText("3 lives remaining"),
    ).not.toBeInTheDocument();
  });

  it("auto-plays reference and anchor, separates silent entry from auditions, and locks one submission", async () => {
    const { storage, values } = memoryStorage();
    render(<ImitationGame rng={createSeededRng(19)} storage={storage} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Begin run" }));
    });

    expect(screen.getByLabelText("3 lives remaining")).toBeInTheDocument();
    expect(synth.unlock).toHaveBeenCalledOnce();
    expect(screen.queryByText("Listen to the phrase")).not.toBeInTheDocument();
    expect(enabledPitchButton).toThrow();

    const slots = screen.getAllByRole("button", { name: /Response slot/ });
    const phraseLength = slots.length;
    expect(
      screen.getByRole("list", { name: "Response phrase" }),
    ).toHaveAttribute("data-slot-count", String(phraseLength));
    const anchorSlot = slots.find((slot) =>
      slot.getAttribute("aria-label")?.includes("supplied anchor"),
    );
    if (!anchorSlot) throw new Error("Expected a supplied anchor slot");
    const anchorPitch = anchorSlot
      .getAttribute("aria-label")
      ?.match(/supplied anchor (.+)$/)?.[1];
    if (!anchorPitch) throw new Error("Expected the anchor pitch label");
    const anchorKey = screen.getByRole("button", {
      name: new RegExp(`^${anchorPitch}$`),
    });

    act(() => vi.advanceTimersByTime(0));
    expect(slots[0]).toHaveAttribute("data-playback-source", "reference");
    expect(anchorKey).toHaveAttribute("aria-pressed", "false");

    const referenceDuration =
      phraseLength * (PLAYBACK_TIMING.noteDuration + PLAYBACK_TIMING.noteGap) -
      PLAYBACK_TIMING.noteGap;
    act(() =>
      vi.advanceTimersByTime(referenceDuration + PLAYBACK_TIMING.sectionPause),
    );
    expect(anchorSlot).toHaveAttribute("data-playback-source", "anchor");
    expect(anchorKey).toHaveAttribute("aria-pressed", "true");

    finishPlayback();

    expect(synth.noteOn).toHaveBeenCalledTimes(phraseLength + 1);
    expect(screen.queryByText("Rebuild the phrase")).not.toBeInTheDocument();
    expect(
      screen.queryByText(/keyboard taps audition/),
    ).not.toBeInTheDocument();

    const replay = screen.getByRole("button", { name: /Replay reference/ });
    expect(replay).toHaveTextContent("∞");
    fireEvent.click(replay);
    finishPlayback();
    expect(synth.noteOn).toHaveBeenCalledTimes(phraseLength * 2 + 1);

    const firstEmpty = screen.getAllByRole("button", {
      name: /Response slot .*empty/,
    })[0]!;
    const soundCountBeforeEntry = synth.noteOn.mock.calls.length;
    fireEvent.click(firstEmpty);
    const entryPitch = enabledPitchButton();
    fireEvent.click(entryPitch);

    expect(synth.noteOn).toHaveBeenCalledTimes(soundCountBeforeEntry);
    expect(screen.queryByText(/entered silently/)).not.toBeInTheDocument();
    expect(firstEmpty).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(enabledPitchButton());
    act(() => vi.advanceTimersByTime(0));
    expect(synth.noteOn).toHaveBeenCalledTimes(soundCountBeforeEntry + 1);
    finishPlayback();

    for (const emptySlot of screen.queryAllByRole("button", {
      name: /Response slot .*empty/,
    })) {
      fireEvent.click(emptySlot);
      fireEvent.click(enabledPitchButton());
    }

    const submit = screen.getByRole("button", { name: "Submit response" });
    expect(submit).toBeEnabled();
    fireEvent.click(submit);
    act(() => vi.advanceTimersByTime(0));
    expect(
      screen.getAllByRole("button", { name: /Response slot/ })[0],
    ).toHaveAttribute("data-playback-source", "response");

    expect(values.has(IMITATION_TUNING.persistence.key)).toBe(true);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    for (const slot of screen.getAllByRole("button", {
      name: /Response slot/,
    })) {
      expect(slot).toBeDisabled();
      expect(slot).toHaveTextContent(
        /Given note|Perfect|Correct direction|Correct distance|Close enough|Just within range|should|Move|Repeat/i,
      );
    }
    expect(screen.queryByText(/Target|offset/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Exact note:/i)).not.toBeInTheDocument();
    expect(
      screen
        .getAllByRole("button", { name: /Response slot/ })
        .some((slot) => slot.textContent?.includes("→")),
    ).toBe(true);
    expect(screen.queryByText("◆")).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Exact higher|Exact lower/),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Review listening is unlimited/),
    ).not.toBeInTheDocument();
    const reviewPlayback = screen.getByRole("button", {
      name: /Play response|Compare/,
    });
    expect(reviewPlayback).toBe(replay);
    expect(reviewPlayback).toHaveTextContent("∞");
    expect(screen.getByText("Auditions").parentElement).toHaveTextContent("∞");

    finishPlayback();
    expect(reviewPlayback).toBeEnabled();

    const reviewedSlots = screen.getAllByRole("button", {
      name: /Response slot/,
    });
    for (const slot of reviewedSlots) expect(slot).toBeEnabled();

    const correctedSlot = reviewedSlots.find((slot) =>
      slot.textContent?.includes("→"),
    );
    if (!correctedSlot) throw new Error("Expected a corrected response slot");
    const soundCountBeforeSlotComparison = synth.noteOn.mock.calls.length;
    fireEvent.click(correctedSlot);
    act(() => vi.advanceTimersByTime(0));
    expect(correctedSlot).toHaveAttribute("data-playback-source", "response");
    act(() =>
      vi.advanceTimersByTime(
        PLAYBACK_TIMING.noteDuration + PLAYBACK_TIMING.sectionPause,
      ),
    );
    expect(correctedSlot).toHaveAttribute("data-playback-source", "target");
    expect(synth.noteOn).toHaveBeenCalledTimes(
      soundCountBeforeSlotComparison + 2,
    );
    finishPlayback();

    const reviewedAnchor = screen
      .getAllByRole("button", { name: /Response slot/ })
      .find((slot) =>
        slot.getAttribute("aria-label")?.includes("supplied anchor"),
      );
    if (!reviewedAnchor) throw new Error("Expected a reviewed anchor slot");
    const soundCountBeforeSharedNote = synth.noteOn.mock.calls.length;
    fireEvent.click(reviewedAnchor);
    act(() => vi.advanceTimersByTime(0));
    expect(reviewedAnchor).toHaveAttribute("data-playback-source", "response");
    finishPlayback();
    expect(synth.noteOn).toHaveBeenCalledTimes(soundCountBeforeSharedNote + 1);
  });
});
