import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

vi.mock("./keyboardSynth", () => ({
  keyboardSynth: {
    configure: vi.fn(),
    noteOn: vi.fn(),
    noteOff: vi.fn(),
    releaseAll: vi.fn(),
  },
}));

import { App } from "./App";
import { ImitationGame } from "./imitation/ImitationGame";
import * as navigation from "./noteNavigation";
import { createProfile } from "./noteNavigation/profile";
import { loadUnlocks } from "./progression";

beforeEach(() => {
  window.localStorage.clear();
  vi.spyOn(Math, "random").mockReturnValue(0.2);
});
afterEach(() => {
  vi.restoreAllMocks();
});

it("survives a throwing localStorage getter across screens and keeps Navigation playable", () => {
  vi.spyOn(window, "localStorage", "get").mockImplementation(() => {
    throw new Error("denied");
  });
  render(<App />);
  expect(screen.getByRole("status")).toHaveTextContent("may not be saved");
  fireEvent.click(screen.getByRole("button", { name: /note navigation/i }));
  fireEvent.click(screen.getByRole("button", { name: "Start" }));
  fireEvent.click(screen.getAllByRole("button", { pressed: false })[0]!);
  fireEvent.click(screen.getByRole("button", { name: "Submit" }));
  expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
  fireEvent.click(screen.getByRole("button", { name: "Exit run" }));
  fireEvent.click(screen.getByRole("button", { name: "Instrument" }));
  expect(screen.getByRole("alert")).toHaveTextContent("could not be loaded");
  expect(screen.getByRole("status")).toHaveTextContent("may not be saved");
});

it("retains unsaved Navigation progress and unlocks, shares them with Imitation, and retries saving", () => {
  const answer = navigation.answerQuestion;
  vi.spyOn(navigation, "answerQuestion").mockImplementation((...args) => {
    const result = answer(...args);
    return {
      ...result,
      state: {
        ...result.state,
        profile: createProfile({
          numericalDestination: { proficiency: 1 },
          numericalDistance: { proficiency: 1 },
          intervalInterpretation: { proficiency: 1 },
          intervalIdentification: { proficiency: 1 },
        }),
      },
    };
  });
  const writes = vi
    .spyOn(Storage.prototype, "setItem")
    .mockImplementation(() => {
      throw new Error("quota");
    });
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: /note navigation/i }));
  fireEvent.click(screen.getByRole("button", { name: "Start" }));
  fireEvent.click(screen.getAllByRole("button", { pressed: false })[0]!);
  fireEvent.click(screen.getByRole("button", { name: "Submit" }));
  expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
  fireEvent.click(screen.getByRole("button", { name: "Exit run" }));
  fireEvent.click(screen.getByRole("button", { name: /imitation/i }));
  expect(screen.getByRole("button", { name: "Start" })).toBeEnabled();
  fireEvent.click(screen.getByRole("button", { name: "← Back" }));
  fireEvent.click(screen.getByRole("button", { name: "Instrument" }));
  expect(screen.getByRole("option", { name: "Triangle" })).toBeEnabled();
  writes.mockRestore();
  fireEvent.click(screen.getByRole("button", { name: "Retry saving" }));
  expect(
    screen.queryByRole("complementary", { name: "Storage warning" }),
  ).not.toBeInTheDocument();
  expect(loadUnlocks(window.localStorage)).toContain("puzzle:imitation");
  expect(
    navigation.loadProfile(window.localStorage).numericalDestination
      .proficiency,
  ).toBe(1);
});

it("erases session progress even when removals fail, without resurrecting saved unlocks", () => {
  navigation.saveProfile(
    createProfile({ numericalDestination: { proficiency: 1 } }),
    window.localStorage,
  );
  render(<App />);
  vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
    throw new Error("denied");
  });
  fireEvent.click(screen.getByRole("button", { name: "Settings" }));
  fireEvent.click(screen.getByRole("button", { name: "Erase all progress" }));
  fireEvent.click(
    screen.getByRole("button", { name: "Confirm erase all progress" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "← Back" }));
  fireEvent.click(screen.getByRole("button", { name: /imitation/i }));
  expect(screen.getByRole("button", { name: "Start" })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "← Back" }));
  fireEvent.click(screen.getByRole("button", { name: /imitation/i }));
  expect(screen.getByRole("button", { name: "Start" })).toBeDisabled();
  expect(screen.getByRole("status")).toHaveTextContent(
    "erasures may not be saved",
  );
});

it("protects standalone Imitation with supplied throwing storage", () => {
  render(
    <ImitationGame
      storage={{
        getItem: () => {
          throw new Error("read");
        },
        setItem: () => {
          throw new Error("write");
        },
      }}
    />,
  );
  expect(screen.getByRole("button", { name: "Start" })).toBeEnabled();
  expect(screen.getByRole("status")).toHaveTextContent("may not be saved");
});
