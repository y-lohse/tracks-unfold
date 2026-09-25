import { beforeEach, describe, expect, it, vi } from "vitest";

import { createPlaybackController, PLAYBACK_TIMING } from "./playback";

const synth = {
  noteOn: vi.fn(),
  noteOff: vi.fn(),
  releaseAll: vi.fn(),
};

describe("Imitation playback controller", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  it("plays complete sections in order and reports their slot display cues", () => {
    const onCue = vi.fn();
    const onComplete = vi.fn();
    const controller = createPlaybackController(synth);

    controller.play(
      [
        { pitches: [60, 62], source: "reference" },
        { pitches: [67], source: "anchor", slotIndices: [1] },
      ],
      { onCue, onComplete },
    );

    vi.advanceTimersByTime(0);
    expect(synth.noteOn).toHaveBeenLastCalledWith("C4");
    expect(onCue).toHaveBeenLastCalledWith({
      pitch: 60,
      slotIndex: 0,
      source: "reference",
    });

    vi.advanceTimersByTime(
      PLAYBACK_TIMING.noteDuration + PLAYBACK_TIMING.noteGap,
    );
    expect(synth.noteOn).toHaveBeenLastCalledWith("D4");

    vi.advanceTimersByTime(
      PLAYBACK_TIMING.noteDuration + PLAYBACK_TIMING.sectionPause,
    );
    expect(synth.noteOn).toHaveBeenLastCalledWith("G4");

    vi.runAllTimers();
    expect(onComplete).toHaveBeenCalledOnce();
    expect(controller.playing).toBe(false);
  });

  it("cancels stale timers and lets a rapid audition interrupt the previous one", () => {
    const firstComplete = vi.fn();
    const onCue = vi.fn();
    const controller = createPlaybackController(synth);

    controller.play([{ pitches: [60], source: "audition" }], {
      onComplete: firstComplete,
      onCue,
    });
    vi.advanceTimersByTime(0);
    expect(onCue).toHaveBeenLastCalledWith({
      pitch: 60,
      slotIndex: null,
      source: "audition",
    });
    controller.play([{ pitches: [62], source: "audition" }]);
    vi.advanceTimersByTime(0);
    vi.runAllTimers();

    expect(synth.noteOn.mock.calls).toEqual([["C4"], ["D4"]]);
    expect(firstComplete).not.toHaveBeenCalled();
    expect(synth.releaseAll).toHaveBeenCalled();
  });

  it("stops all sound and prevents future cues when cancelled", () => {
    const onCue = vi.fn();
    const controller = createPlaybackController(synth);

    controller.play([{ pitches: [60, 64], source: "response" }], {
      onCue,
    });
    vi.advanceTimersByTime(0);
    controller.cancel();
    vi.runAllTimers();

    expect(synth.noteOn).toHaveBeenCalledOnce();
    expect(synth.noteOff).not.toHaveBeenCalled();
    expect(controller.playing).toBe(false);
  });
});
