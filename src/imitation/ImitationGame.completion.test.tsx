import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

interface IntroductionContract {
  title: string;
  instruction: string;
  theoryTip: string;
  progress?: number;
  milestones?: readonly { id: string; threshold: number; earned: boolean }[];
  onBack: () => void;
  onContinue: () => void;
  runSummary?: { status: "succeeded" | "failed"; puzzlesPlayed: number };
  skills: readonly {
    label: string;
    proficiency: number;
    previousProficiency?: number;
  }[];
}

const { synth, introduction } = vi.hoisted(() => ({
  synth: {
    unlock: vi.fn().mockResolvedValue(undefined),
    noteOn: vi.fn(),
    noteOff: vi.fn(),
    releaseAll: vi.fn(),
  },
  introduction: vi.fn(),
}));

vi.mock("../keyboardSynth", () => ({ keyboardSynth: synth }));
vi.mock("../Introduction", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../Introduction")>();
  return {
    Introduction: (props: IntroductionContract) => {
      introduction(props);
      return <actual.Introduction {...props} />;
    },
  };
});

import { createSeededRng } from "../noteNavigation/random";
import {
  loadUnlocks,
  profileProgress,
  reconcileUnlocks,
  rewardMilestones,
  saveUnlocks,
} from "../progression";
import * as director from "./director";
import { ImitationGame } from "./ImitationGame";
import { loadImitationProfile, type ImitationStorage } from "./persistence";
import { IMITATION_SKILLS } from "./types";

function memoryStorage(): ImitationStorage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

function introProps(): IntroductionContract {
  return introduction.mock.lastCall![0] as IntroductionContract;
}

function finishPlayback() {
  act(() => vi.runAllTimers());
}

async function start(label = "Start") {
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: label }));
  });
}

function submitResponse() {
  for (const slot of screen.getAllByRole("button", {
    name: /Response slot .*empty/,
  })) {
    fireEvent.click(slot);
    const pitch = screen
      .getAllByRole("button")
      .find(
        (button) =>
          /^[A-G](?:♯)?[345]$/.test(button.getAttribute("aria-label") ?? "") &&
          !(button as HTMLButtonElement).disabled,
      );
    if (!pitch) throw new Error("Expected an enabled pitch");
    fireEvent.click(pitch);
  }
  fireEvent.click(screen.getByRole("button", { name: "Submit response" }));
}

function completeAfterTwoSubmissions(status: "succeeded" | "failed") {
  const submit = director.submitImitationResponse;
  return vi
    .spyOn(director, "submitImitationResponse")
    .mockImplementation((state, puzzle, response) => {
      const result = submit(state, puzzle, response);
      const count = result.state.puzzlesPresented;
      return {
        ...result,
        state: {
          ...result.state,
          status: count === 2 ? status : "active",
          profile: Object.fromEntries(
            IMITATION_SKILLS.map((skill, index) => [
              skill,
              {
                ...result.state.profile[skill],
                proficiency: count * 0.2 + index * 0.03,
              },
            ]),
          ) as typeof state.profile,
        },
      };
    });
}

async function finishRun() {
  await start();
  finishPlayback();
  submitResponse();
  finishPlayback();
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  finishPlayback();
  submitResponse();
}

describe("Imitation completion on Introduction", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it.each(["succeeded", "failed"] as const)(
    "keeps %s feedback review until Continue, then shows the full-run summary and updated skills",
    async (status) => {
      completeAfterTwoSubmissions(status);
      const storage = memoryStorage();
      render(<ImitationGame rng={createSeededRng(19)} storage={storage} />);
      const initialSkills = introProps().skills;
      expect(introProps().runSummary).toBeUndefined();
      for (const skill of initialSkills) {
        expect(skill).not.toHaveProperty("previousProficiency");
      }

      await finishRun();
      expect(loadUnlocks(storage)).toContain("reward:imitation:33");
      expect(screen.queryByRole("heading", { name: "Imitation" })).toBeNull();
      expect(screen.queryByRole("button", { name: "View results" })).toBeNull();
      expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
      fireEvent.click(screen.getByRole("button", { name: "Continue" }));
      expect(screen.queryByRole("button", { name: "Play again" })).toBeNull();
      finishPlayback();

      fireEvent.click(
        screen.getByRole("button", { name: /Play response|Compare/ }),
      );
      expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
      finishPlayback();
      const releases = synth.releaseAll.mock.calls.length;
      fireEvent.click(screen.getByRole("button", { name: "Continue" }));

      expect(screen.getByRole("button", { name: "Play again" })).toBeEnabled();
      expect(introProps().runSummary).toEqual({ status, puzzlesPlayed: 2 });
      expect(
        screen.getByText(
          `${status === "succeeded" ? "Run complete" : "Run ended"} · 2 puzzles played.`,
        ),
      ).toBeInTheDocument();
      expect(introProps().skills).toEqual(
        initialSkills.map((skill, index) => ({
          label: skill.label,
          proficiency: 0.4 + index * 0.03,
          previousProficiency: skill.proficiency,
        })),
      );
      const saved = loadImitationProfile(storage);
      expect(introProps().progress).toBe(profileProgress(saved));
      expect(introProps().milestones).toEqual(
        rewardMilestones("imitation", loadUnlocks(storage)),
      );
      expect(IMITATION_SKILLS.map((skill) => saved[skill].proficiency)).toEqual(
        introProps().skills.map((skill) => skill.proficiency),
      );
      expect(synth.releaseAll.mock.calls.length).toBeGreaterThan(releases);
      const notes = synth.noteOn.mock.calls.length;
      finishPlayback();
      expect(synth.noteOn).toHaveBeenCalledTimes(notes);
      expect(vi.getTimerCount()).toBe(0);
    },
  );

  it("persists threshold crossings immediately, merges the latest ledger, and keeps rewards after a decline and exit", async () => {
    const storage = memoryStorage();
    const submit = director.submitImitationResponse;
    let proficiency = 0.66;
    vi.spyOn(director, "submitImitationResponse").mockImplementation(
      (...args) => {
        const result = submit(...args);
        return {
          ...result,
          state: {
            ...result.state,
            status: "active",
            profile: Object.fromEntries(
              IMITATION_SKILLS.map((skill) => [
                skill,
                { ...result.state.profile[skill], proficiency },
              ]),
            ) as typeof result.state.profile,
          },
        };
      },
    );
    const view = render(
      <ImitationGame rng={createSeededRng(19)} storage={storage} />,
    );
    await start();
    finishPlayback();
    const navigationUnlocks = reconcileUnlocks([], { navigation: 0.66 });
    saveUnlocks(navigationUnlocks, storage);
    submitResponse();
    const earned = reconcileUnlocks(navigationUnlocks, { imitation: 0.66 });
    expect(loadUnlocks(storage)).toEqual(earned);
    finishPlayback();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    finishPlayback();
    proficiency = 0;
    submitResponse();
    expect(loadUnlocks(storage)).toEqual(earned);
    fireEvent.click(screen.getByRole("button", { name: "Exit run" }));
    expect(introProps().progress).toBe(0);
    expect(introProps().milestones).toEqual(
      rewardMilestones("imitation", earned),
    );
    view.unmount();
    render(<ImitationGame storage={storage} />);
    expect(introProps().milestones).toEqual(
      rewardMilestones("imitation", earned),
    );
    expect(loadUnlocks(storage)).toEqual(earned);
  });

  it("Play again starts a fresh attempt and uses the updated profile as the next baseline", async () => {
    completeAfterTwoSubmissions("succeeded");
    const startRun = vi.spyOn(director, "startImitationRun");
    render(
      <ImitationGame rng={createSeededRng(19)} storage={memoryStorage()} />,
    );
    await finishRun();
    finishPlayback();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    const previousSkills = introProps().skills;

    await start("Play again");
    expect(startRun).toHaveBeenCalledTimes(2);
    expect(startRun.mock.results[1]!.value).toMatchObject({
      status: "active",
      puzzlesPresented: 0,
      lives: 3,
    });
    expect(screen.getByLabelText("3 lives remaining")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Submit response" }),
    ).toBeDisabled();
    expect(
      screen.getAllByRole("button", { name: /Response slot .*empty/ }).length,
    ).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "Continue" })).toBeNull();
    finishPlayback();
    submitResponse();
    finishPlayback();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    finishPlayback();
    submitResponse();
    finishPlayback();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(introProps().runSummary?.puzzlesPlayed).toBe(2);
    expect(
      introProps().skills.map((skill) => skill.previousProficiency),
    ).toEqual(previousSkills.map((skill) => skill.proficiency));
  });

  it("Back clears the summary without clearing saved progress, even when onExit keeps the game mounted", async () => {
    completeAfterTwoSubmissions("failed");
    const onExit = vi.fn();
    const storage = memoryStorage();
    render(
      <ImitationGame
        onExit={onExit}
        rng={createSeededRng(19)}
        storage={storage}
      />,
    );
    await finishRun();
    finishPlayback();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    const saved = loadImitationProfile(storage);
    fireEvent.click(screen.getByRole("button", { name: "← Back" }));
    expect(onExit).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Start" })).toBeEnabled();
    expect(introProps().runSummary).toBeUndefined();
    for (const skill of introProps().skills) {
      expect(skill).not.toHaveProperty("previousProficiency");
    }
    expect(loadImitationProfile(storage)).toEqual(saved);
  });

  it("cancels pending review audio on unmount", async () => {
    completeAfterTwoSubmissions("failed");
    const { unmount } = render(
      <ImitationGame rng={createSeededRng(19)} storage={memoryStorage()} />,
    );
    await finishRun();
    act(() => vi.advanceTimersByTime(0));
    const notes = synth.noteOn.mock.calls.length;
    const releases = synth.releaseAll.mock.calls.length;
    unmount();
    expect(synth.releaseAll.mock.calls.length).toBeGreaterThan(releases);
    finishPlayback();
    expect(synth.noteOn).toHaveBeenCalledTimes(notes);
    expect(vi.getTimerCount()).toBe(0);
  });
});
