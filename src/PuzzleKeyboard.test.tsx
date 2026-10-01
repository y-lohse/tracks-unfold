import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PuzzleKeyboard } from "./PuzzleKeyboard";
import styles from "./PuzzleKeyboard.module.css";

function pointer(target: HTMLElement, type: string, pointerId: number) {
  const event = new MouseEvent(type, { bubbles: true, button: 0 });
  Object.defineProperty(event, "pointerId", { value: pointerId });
  fireEvent(target, event);
}

function heldKeyboard() {
  const onPitchPress = vi.fn();
  const onPitchRelease = vi.fn();
  const view = render(
    <PuzzleKeyboard
      octaves={[4]}
      onPitchPress={onPitchPress}
      onPitchRelease={onPitchRelease}
    />,
  );
  const c = screen.getByRole("button", { name: "C4" });
  const d = screen.getByRole("button", { name: "D4" });
  const capture = vi.fn();
  c.setPointerCapture = capture;
  d.setPointerCapture = capture;
  return { ...view, c, d, capture, onPitchPress, onPitchRelease };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

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

  it("keeps auditions click-only without a release callback", () => {
    const onPitchPress = vi.fn();
    render(<PuzzleKeyboard octaves={[4]} onPitchPress={onPitchPress} />);
    const c = screen.getByRole("button", { name: "C4" });
    pointer(c, "pointerdown", 1);
    fireEvent.keyDown(c, { key: "Enter" });
    expect(onPitchPress).not.toHaveBeenCalled();
    pointer(c, "pointerup", 1);
    fireEvent.keyUp(c, { key: "Enter" });
    fireEvent.click(c, { detail: 1 });
    fireEvent.click(c, { detail: 0 });
    expect(onPitchPress.mock.calls).toEqual([[60], [60]]);
  });

  it("holds captured pointers until their matching release, without click replay", () => {
    const { c, capture, onPitchPress, onPitchRelease } = heldKeyboard();
    pointer(c, "pointerdown", 7);
    expect(capture).toHaveBeenCalledWith(7);
    expect(onPitchPress.mock.calls).toEqual([[60]]);
    expect(onPitchRelease).not.toHaveBeenCalled();
    pointer(c, "pointerup", 8);
    expect(onPitchRelease).not.toHaveBeenCalled();
    pointer(c, "pointerup", 7);
    pointer(c, "lostpointercapture", 7);
    fireEvent.click(c, { detail: 1 });
    expect(onPitchRelease.mock.calls).toEqual([[60]]);
    expect(onPitchPress).toHaveBeenCalledOnce();
  });

  it.each(["pointercancel", "lostpointercapture"])(
    "releases once on %s and allows a fresh attack",
    (event) => {
      const { c, onPitchPress, onPitchRelease } = heldKeyboard();
      pointer(c, "pointerdown", 1);
      pointer(c, event, 1);
      pointer(c, "pointerup", 1);
      expect(onPitchRelease.mock.calls).toEqual([[60]]);
      pointer(c, "pointerdown", 1);
      expect(onPitchPress.mock.calls).toEqual([[60], [60]]);
    },
  );

  it("holds chords independently and reference-counts same-key inputs", () => {
    const { c, d, onPitchPress, onPitchRelease } = heldKeyboard();
    pointer(c, "pointerdown", 1);
    pointer(c, "pointerdown", 2);
    pointer(d, "pointerdown", 3);
    fireEvent.keyDown(c, { key: " " });
    expect(onPitchPress.mock.calls).toEqual([[60], [62]]);
    pointer(c, "pointerup", 1);
    pointer(c, "pointercancel", 2);
    expect(onPitchRelease).not.toHaveBeenCalled();
    pointer(d, "pointerup", 3);
    expect(onPitchRelease.mock.calls).toEqual([[62]]);
    fireEvent.keyUp(c, { key: " " });
    expect(onPitchRelease.mock.calls).toEqual([[62], [60]]);
  });

  it.each([" ", "Enter"])(
    "sustains %j until keyup, ignores repeats and suppresses keyboard clicks",
    (key) => {
      vi.useFakeTimers();
      const { c, onPitchPress, onPitchRelease } = heldKeyboard();
      fireEvent.keyDown(c, { key });
      fireEvent.keyDown(c, { key, repeat: true });
      fireEvent.keyDown(c, { key });
      fireEvent.click(c, { detail: 0 });
      expect(onPitchPress.mock.calls).toEqual([[60]]);
      expect(onPitchRelease).not.toHaveBeenCalled();
      fireEvent.keyUp(c, { key });
      fireEvent.click(c, { detail: 0 });
      expect(onPitchRelease.mock.calls).toEqual([[60]]);
      expect(onPitchPress).toHaveBeenCalledOnce();
      vi.runAllTimers();
      fireEvent.click(c, { detail: 0 });
      expect(onPitchPress.mock.calls).toEqual([[60], [60]]);
      expect(onPitchRelease.mock.calls).toEqual([[60]]);
      vi.advanceTimersByTime(180);
      expect(onPitchRelease.mock.calls).toEqual([[60], [60]]);
    },
  );

  it("releases both keyboard inputs on key blur without releasing a pointer", () => {
    const { c, d, onPitchRelease } = heldKeyboard();
    fireEvent.keyDown(c, { key: " " });
    fireEvent.keyDown(c, { key: "Enter" });
    pointer(d, "pointerdown", 2);
    fireEvent.blur(c);
    fireEvent.keyUp(c, { key: " " });
    expect(onPitchRelease.mock.calls).toEqual([[60]]);
    pointer(d, "pointerup", 2);
    expect(onPitchRelease.mock.calls).toEqual([[60], [62]]);
  });

  it("holds an assistive-technology click for 180ms but ignores ordinary clicks", () => {
    vi.useFakeTimers();
    const { c, onPitchPress, onPitchRelease } = heldKeyboard();
    fireEvent.click(c, { detail: 1 });
    expect(onPitchPress).not.toHaveBeenCalled();
    fireEvent.click(c, { detail: 0 });
    expect(onPitchPress.mock.calls).toEqual([[60]]);
    vi.advanceTimersByTime(179);
    expect(onPitchRelease).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onPitchRelease.mock.calls).toEqual([[60]]);
  });

  it("extends repeated synthetic clicks without duplicate attacks or early release", () => {
    vi.useFakeTimers();
    const { c, onPitchPress, onPitchRelease } = heldKeyboard();
    fireEvent.click(c, { detail: 0 });
    vi.advanceTimersByTime(100);
    fireEvent.click(c, { detail: 0 });
    vi.advanceTimersByTime(179);
    expect(onPitchPress.mock.calls).toEqual([[60]]);
    expect(onPitchRelease).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onPitchRelease.mock.calls).toEqual([[60]]);
  });

  it.each(["pointer", "keyboard"])(
    "keeps a %s input held after the synthetic click timer expires",
    (input) => {
      vi.useFakeTimers();
      const { c, onPitchPress, onPitchRelease } = heldKeyboard();
      fireEvent.click(c, { detail: 0 });
      if (input === "pointer") pointer(c, "pointerdown", 1);
      else fireEvent.keyDown(c, { key: "Enter" });
      vi.advanceTimersByTime(180);
      expect(onPitchPress.mock.calls).toEqual([[60]]);
      expect(onPitchRelease).not.toHaveBeenCalled();
      if (input === "pointer") pointer(c, "pointerup", 1);
      else fireEvent.keyUp(c, { key: "Enter" });
      expect(onPitchRelease.mock.calls).toEqual([[60]]);
    },
  );

  it("keeps the synthetic click held after a pointer releases", () => {
    vi.useFakeTimers();
    const { c, onPitchPress, onPitchRelease } = heldKeyboard();
    pointer(c, "pointerdown", 1);
    fireEvent.click(c, { detail: 0 });
    pointer(c, "pointerup", 1);
    expect(onPitchPress.mock.calls).toEqual([[60]]);
    expect(onPitchRelease).not.toHaveBeenCalled();
    vi.advanceTimersByTime(180);
    expect(onPitchRelease.mock.calls).toEqual([[60]]);
  });

  it.each(["key blur", "window blur", "hidden", "unmount", "remount"])(
    "cancels the synthetic release timer on %s",
    (reason) => {
      vi.useFakeTimers();
      const { c, rerender, unmount, onPitchPress, onPitchRelease } =
        heldKeyboard();
      fireEvent.click(c, { detail: 0 });
      vi.advanceTimersByTime(100);
      if (reason === "key blur") fireEvent.blur(c);
      if (reason === "window blur") fireEvent.blur(window);
      if (reason === "hidden") {
        vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
        fireEvent(document, new Event("visibilitychange"));
      }
      if (reason === "unmount") unmount();
      if (reason === "remount") {
        rerender(
          <PuzzleKeyboard
            key="new-sound"
            octaves={[4]}
            onPitchPress={onPitchPress}
            onPitchRelease={onPitchRelease}
          />,
        );
      }
      expect(onPitchRelease.mock.calls).toEqual([[60]]);
      vi.advanceTimersByTime(0);
      expect(vi.getTimerCount()).toBe(0);
      if (reason !== "unmount") {
        fireEvent.click(screen.getByRole("button", { name: "C4" }), {
          detail: 0,
        });
        vi.advanceTimersByTime(80);
        expect(onPitchRelease).toHaveBeenCalledOnce();
        vi.advanceTimersByTime(100);
        expect(onPitchRelease.mock.calls).toEqual([[60], [60]]);
      } else {
        vi.runAllTimers();
        expect(onPitchRelease).toHaveBeenCalledOnce();
      }
    },
  );

  it.each(["blur", "hidden", "unmount"])(
    "cleans up all held inputs on %s without stale releases",
    (reason) => {
      const { c, d, unmount, onPitchPress, onPitchRelease } = heldKeyboard();
      pointer(c, "pointerdown", 1);
      pointer(c, "pointerdown", 2);
      fireEvent.keyDown(d, { key: "Enter" });
      if (reason === "blur") fireEvent.blur(window);
      if (reason === "hidden") {
        vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
        fireEvent(document, new Event("visibilitychange"));
        expect(onPitchRelease).not.toHaveBeenCalled();
        vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
        fireEvent(document, new Event("visibilitychange"));
      }
      if (reason === "unmount") unmount();
      expect(onPitchRelease.mock.calls.map(([pitch]) => pitch).sort()).toEqual([
        60, 62,
      ]);
      pointer(c, "pointerup", 1);
      pointer(c, "lostpointercapture", 2);
      fireEvent.keyUp(d, { key: "Enter" });
      expect(onPitchRelease).toHaveBeenCalledTimes(2);
      if (reason !== "unmount") {
        pointer(c, "pointerdown", 1);
        expect(onPitchPress.mock.calls).toEqual([[60], [62], [60]]);
        unmount();
        expect(onPitchRelease).toHaveBeenCalledTimes(3);
      }
    },
  );

  it("does not interrupt held inputs on callback rerenders and releases when disabled", () => {
    const { c, rerender, onPitchPress, onPitchRelease } = heldKeyboard();
    pointer(c, "pointerdown", 1);
    const nextRelease = vi.fn();
    rerender(
      <PuzzleKeyboard
        octaves={[4]}
        onPitchPress={vi.fn()}
        onPitchRelease={nextRelease}
      />,
    );
    expect(onPitchRelease).not.toHaveBeenCalled();
    rerender(
      <PuzzleKeyboard
        octaves={[4]}
        enabledPitches={new Set([62])}
        onPitchPress={onPitchPress}
        onPitchRelease={nextRelease}
      />,
    );
    expect(onPitchRelease.mock.calls).toEqual([[60]]);
    expect(nextRelease).not.toHaveBeenCalled();
    pointer(c, "pointerdown", 2);
    fireEvent.keyDown(c, { key: "Enter" });
    fireEvent.click(c, { detail: 0 });
    expect(onPitchPress).toHaveBeenCalledOnce();
  });

  it("allows synthetic clicks again after keyboard focus leaves", () => {
    vi.useFakeTimers();
    const { c, onPitchPress, onPitchRelease } = heldKeyboard();
    fireEvent.keyDown(c, { key: "Enter" });
    fireEvent.blur(c);
    vi.runAllTimers();
    fireEvent.click(c, { detail: 0 });
    expect(onPitchPress.mock.calls).toEqual([[60], [60]]);
    expect(onPitchRelease.mock.calls).toEqual([[60]]);
    vi.advanceTimersByTime(180);
    expect(onPitchRelease.mock.calls).toEqual([[60], [60]]);
  });

  it("releases the old selection on a keyed remount", () => {
    const { c, rerender, onPitchPress, onPitchRelease } = heldKeyboard();
    pointer(c, "pointerdown", 1);
    rerender(
      <PuzzleKeyboard
        key="new-preset"
        octaves={[4]}
        onPitchPress={onPitchPress}
        onPitchRelease={onPitchRelease}
      />,
    );
    expect(onPitchRelease.mock.calls).toEqual([[60]]);
    const newC = screen.getByRole("button", { name: "C4" });
    newC.setPointerCapture = vi.fn();
    pointer(newC, "pointerup", 1);
    expect(onPitchRelease).toHaveBeenCalledOnce();
    pointer(newC, "pointerdown", 1);
    expect(onPitchPress.mock.calls).toEqual([[60], [60]]);
  });

  it("combines chord highlighting with the original single sounding pitch", () => {
    render(
      <PuzzleKeyboard
        octaves={[4]}
        onPitchPress={vi.fn()}
        soundingPitch={60}
        soundingPitches={new Set([62, 64])}
      />,
    );
    for (const name of ["C4", "D4", "E4"]) {
      const key = screen.getByRole("button", { name });
      expect(key).toHaveAttribute("aria-pressed", "true");
      expect(key).toHaveClass(styles.sounding);
    }
    expect(screen.getByRole("button", { name: "F4" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
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
