import { useCallback, useEffect, useState } from "react";

import { Button } from "../Button";
import { keyboardSynth } from "../keyboardSynth";
import { displayPitch, type Pitch } from "../music";
import { PuzzleKeyboard } from "../PuzzleKeyboard";
import { RunShell } from "../run";
import {
  clearImitationProfile,
  loadImitationProfile,
  saveImitationProfile,
  type ImitationStorage,
} from "./persistence";
import { createImitationProfile } from "./profile";
import {
  prepareNextImitationPuzzle,
  startImitationRun,
  submitImitationResponse,
  type ImitationSubmissionResult,
} from "./director";
import type {
  ImitationProfile,
  ImitationPuzzle,
  ImitationRunState,
  ImitationSkill,
  Rng,
  SlotFeedback,
} from "./types";
import {
  completeResponse,
  createImitationAttempt,
  hasAllowance,
  imitationAttemptReducer,
  remainingPitchAuditions,
  remainingReferencePlays,
  type ImitationAttemptAction,
  type ImitationAttemptState,
} from "./attempt";
import {
  createPlaybackController,
  type PlaybackCue,
  type PlaybackSection,
} from "./playback";
import styles from "./ImitationGame.module.css";
import { movementFeedback } from "./slotFeedbackPresentation";

type GameScreen = "introduction" | "run" | "results";
type PlaybackKind = "opening" | "reference" | "review" | "audition";

interface PlaybackState {
  readonly kind: PlaybackKind;
  readonly cue: PlaybackCue | null;
}

interface ImitationSession {
  readonly run: ImitationRunState;
  readonly puzzle: ImitationPuzzle;
  readonly attempt: ImitationAttemptState;
  readonly result: ImitationSubmissionResult | null;
  readonly startingProfile: ImitationProfile;
  readonly recentReferences: readonly (readonly Pitch[])[];
}

export interface ImitationGameProps {
  readonly onExit?: () => void;
  readonly rng?: Rng;
  readonly storage?: ImitationStorage;
}

const skillLabels: Readonly<Record<ImitationSkill, string>> = {
  pitchDirection: "Pitch direction",
  intervalSize: "Interval size",
  pitchNavigation: "Pitch navigation",
  relationshipTransposition: "Relationship transposition",
};

function defaultStorage(): ImitationStorage {
  return window.localStorage;
}

function allowanceLabel(value: number | null): string {
  return value === null ? "∞" : String(value);
}

function slotReviewState(feedback: SlotFeedback | undefined): string {
  if (!feedback || feedback.suppliedAnchor) return "anchor";
  if (feedback.movements.some((movement) => movement.status === "error")) {
    return "error";
  }
  if (
    feedback.movements.some((movement) => movement.status === "nearBoundary")
  ) {
    return "near";
  }
  if (feedback.movements.some((movement) => movement.status === "variation")) {
    return "variation";
  }
  return "exact";
}

function octavesFor(puzzle: ImitationPuzzle): readonly number[] {
  const material = [
    ...puzzle.enabledPitches,
    ...puzzle.referencePitches,
    ...puzzle.exactReconstruction,
  ];
  const used = new Set(material.map((pitch) => Math.floor(pitch / 12) - 1));
  return [3, 4, 5].filter((octave) => octave === 4 || used.has(octave));
}

function reviewSections(
  puzzle: ImitationPuzzle,
  response: readonly Pitch[],
  exact: boolean,
): readonly PlaybackSection[] {
  if (exact) return [{ pitches: response, source: "response" }];
  return [
    { pitches: response, source: "response" },
    { pitches: puzzle.exactReconstruction, source: "target" },
  ];
}

function SlotStrip({
  attempt,
  cue,
  disabled,
  onSelect,
  puzzle,
  result,
}: {
  readonly attempt: ImitationAttemptState;
  readonly cue: PlaybackCue | null;
  readonly disabled: boolean;
  readonly onSelect: (slotIndex: number) => void;
  readonly puzzle: ImitationPuzzle;
  readonly result: ImitationSubmissionResult | null;
}) {
  return (
    <ol
      aria-label="Response phrase"
      className={styles.slots}
      data-slot-count={attempt.response.length}
    >
      {attempt.response.map((pitch, index) => {
        const anchor = index === puzzle.anchorIndex;
        const feedback = result?.feedback.slots[index];
        const relationship = feedback
          ? movementFeedback(puzzle.contract, feedback)
          : null;
        const comparison = feedback?.targetComparison;
        const summary = anchor
          ? "Given note"
          : (relationship ??
            (comparison
              ? puzzle.contract.kind === "direction"
                ? "Correct direction"
                : "Correct distance"
              : result
                ? "Perfect"
                : null));
        const selected = attempt.selectedSlot === index;
        const playbackSource =
          cue?.slotIndex === index ? cue.source : undefined;
        const state = result
          ? slotReviewState(feedback)
          : anchor
            ? "anchor"
            : "idle";
        const enteredPitch = pitch === null ? "—" : displayPitch(pitch);
        const expectedPitch = comparison
          ? displayPitch(comparison.exactTarget)
          : null;
        const slotLabel = anchor
          ? `Response slot ${index + 1}, supplied anchor ${displayPitch(puzzle.anchorPitch)}`
          : `Response slot ${index + 1}${pitch === null ? ", empty" : `, entered ${enteredPitch}`}${expectedPitch ? `, exact note ${expectedPitch}` : ""}${summary ? `, ${summary}` : ""}`;

        return (
          <li className={styles.slotItem} key={index}>
            <button
              aria-label={slotLabel}
              aria-pressed={selected}
              className={styles.slot}
              data-anchor={anchor || undefined}
              data-playback-source={playbackSource}
              data-review-state={state}
              disabled={disabled}
              onClick={() => onSelect(index)}
              type="button"
            >
              <strong className={styles.slotPitch}>
                <span className={styles.enteredPitch}>{enteredPitch}</span>
                {expectedPitch ? (
                  <>
                    <span className={styles.pitchArrow} aria-hidden="true">
                      →
                    </span>
                    <span className={styles.expectedPitch}>
                      {expectedPitch}
                    </span>
                  </>
                ) : null}
              </strong>
              {summary ? (
                <span className={styles.relationship}>{summary}</span>
              ) : null}
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function Introduction({
  onBegin,
  onExit,
  onReset,
  profile,
  resetMessage,
}: {
  readonly onBegin: () => void;
  readonly onExit: () => void;
  readonly onReset: () => void;
  readonly profile: ImitationProfile;
  readonly resetMessage: string;
}) {
  return (
    <main className="bg-canvas text-ink min-h-svh px-4 py-8 sm:px-8 sm:py-12">
      <section className={`${styles.panel} mx-auto w-full max-w-md`}>
        <button className={styles.textButton} onClick={onExit} type="button">
          ← Back
        </button>
        <p className={styles.eyebrow}>Instrument 02</p>
        <h1>Imitation</h1>
        <p>
          Hear a phrase, then rebuild its pitch relationships from the supplied
          anchor.
        </p>
        <p>
          Select a response slot before entering silently. With no slot
          selected, the keyboard plays an audition.
        </p>
        <Button className={styles.primaryAction} onClick={onBegin}>
          Begin run
        </Button>
        <dl className={styles.profileSummary} aria-label="Imitation profile">
          {Object.entries(skillLabels).map(([skill, label]) => (
            <div key={skill}>
              <dt>{label}</dt>
              <dd>
                {Math.round(profile[skill as ImitationSkill].proficiency * 100)}
              </dd>
            </div>
          ))}
        </dl>
        <button className={styles.resetButton} onClick={onReset} type="button">
          Reset Imitation profile
        </button>
        <p className={styles.liveMessage} aria-live="polite">
          {resetMessage}
        </p>
      </section>
    </main>
  );
}

function Results({
  session,
  onAgain,
  onExit,
}: {
  readonly session: ImitationSession;
  readonly onAgain: () => void;
  readonly onExit: () => void;
}) {
  return (
    <main className="bg-canvas text-ink min-h-svh px-4 py-8 sm:px-8 sm:py-12">
      <section className={`${styles.panel} mx-auto w-full max-w-md`}>
        <p className={styles.eyebrow}>Imitation profile</p>
        <h1>
          {session.run.status === "succeeded" ? "Run complete" : "Run ended"}
        </h1>
        <p>{session.run.puzzlesPresented} phrases completed.</p>
        <dl className={styles.skillResults}>
          {Object.entries(skillLabels).map(([key, label]) => {
            const skill = key as ImitationSkill;
            const before = session.startingProfile[skill];
            const after = session.run.profile[skill];
            return (
              <div key={skill}>
                <dt>{label}</dt>
                <dd>
                  <span>
                    Skill {Math.round(before.proficiency * 100)} →{" "}
                    {Math.round(after.proficiency * 100)}
                  </span>
                  <span>
                    Certainty {Math.round(before.certainty * 100)} →{" "}
                    {Math.round(after.certainty * 100)}
                  </span>
                </dd>
              </div>
            );
          })}
        </dl>
        <div className={styles.resultActions}>
          <Button onClick={onAgain}>Play again</Button>
          <button className={styles.textButton} onClick={onExit} type="button">
            Leave Imitation
          </button>
        </div>
      </section>
    </main>
  );
}

export function ImitationGame({
  onExit,
  rng = Math.random,
  storage: suppliedStorage,
}: ImitationGameProps) {
  const storage = suppliedStorage ?? defaultStorage();
  const [screen, setScreen] = useState<GameScreen>("introduction");
  const [profile, setProfile] = useState(() => loadImitationProfile(storage));
  const [session, setSession] = useState<ImitationSession | null>(null);
  const [playback, setPlayback] = useState<PlaybackState | null>(null);
  const [message, setMessage] = useState("");
  const [playbackController] = useState(() =>
    createPlaybackController(keyboardSynth),
  );

  const play = useCallback(
    (kind: PlaybackKind, sections: readonly PlaybackSection[]) => {
      setPlayback({ kind, cue: null });
      playbackController.play(sections, {
        onCue: (cue) =>
          setPlayback((current) => (current ? { ...current, cue } : current)),
        onComplete: () => setPlayback(null),
      });
    },
    [playbackController],
  );

  const activePuzzle = screen === "run" ? session?.puzzle : undefined;
  useEffect(() => {
    if (!activePuzzle) return;
    playbackController.play(
      [
        { pitches: activePuzzle.referencePitches, source: "reference" },
        {
          pitches: [activePuzzle.anchorPitch],
          source: "anchor",
          slotIndices: [activePuzzle.anchorIndex],
        },
      ],
      {
        onCue: (cue) =>
          setPlayback((current) => (current ? { ...current, cue } : current)),
        onComplete: () => setPlayback(null),
      },
    );
    return () => playbackController.cancel();
  }, [activePuzzle, playbackController]);

  useEffect(() => () => playbackController.cancel(), [playbackController]);

  const beginRun = async () => {
    playbackController.cancel();
    try {
      await keyboardSynth.unlock();
    } catch {
      setMessage("Audio could not start. Try beginning the run again.");
      return;
    }
    const initial = startImitationRun(profile, rng);
    const prepared = prepareNextImitationPuzzle(initial, rng);
    setSession({
      run: prepared.state,
      puzzle: prepared.puzzle,
      attempt: createImitationAttempt(prepared.puzzle),
      result: null,
      startingProfile: profile,
      recentReferences: [prepared.puzzle.referencePitches],
    });
    setMessage("");
    setPlayback({ kind: "opening", cue: null });
    setScreen("run");
  };

  const leaveFeature = () => {
    playbackController.cancel();
    setPlayback(null);
    setSession(null);
    if (onExit) onExit();
    else setScreen("introduction");
  };

  const dispatchAttempt = (action: ImitationAttemptAction) => {
    setSession((current) =>
      current
        ? {
            ...current,
            attempt: imitationAttemptReducer(
              current.attempt,
              action,
              current.puzzle,
            ),
          }
        : current,
    );
  };

  const selectSlot = (slotIndex: number) => {
    if (session?.result) {
      if (playback) return;
      const response = completeResponse(session.attempt);
      if (!response) return;
      const enteredPitch = response[slotIndex];
      const correctedPitch = session.puzzle.exactReconstruction[slotIndex];
      if (enteredPitch === undefined || correctedPitch === undefined) return;
      const slotIndices = [slotIndex];
      const sections: PlaybackSection[] = [
        { pitches: [enteredPitch], source: "response", slotIndices },
      ];
      if (correctedPitch !== enteredPitch) {
        sections.push({
          pitches: [correctedPitch],
          source: "target",
          slotIndices,
        });
      }
      play("review", sections);
      return;
    }
    if (playback?.kind === "audition") {
      playbackController.cancel();
      setPlayback(null);
    }
    dispatchAttempt({ type: "selectSlot", slotIndex });
  };

  const audition = (pitch: Pitch) => {
    if (!session || (playback && playback.kind !== "audition")) return;
    if (session.result) {
      play("audition", [{ pitches: [pitch], source: "audition" }]);
      return;
    }
    if (session.attempt.selectedSlot !== null) {
      dispatchAttempt({ type: "enterPitch", pitch });
      return;
    }
    const remaining = remainingPitchAuditions(session.attempt, session.puzzle);
    if (!hasAllowance(remaining)) return;
    dispatchAttempt({ type: "usePitchAudition" });
    play("audition", [{ pitches: [pitch], source: "audition" }]);
  };

  const replayReference = () => {
    if (!session || playback) return;
    if (!session.result) {
      const remaining = remainingReferencePlays(
        session.attempt,
        session.puzzle,
      );
      if (!hasAllowance(remaining)) return;
      dispatchAttempt({ type: "useReferencePlay" });
    }
    play("reference", [
      { pitches: session.puzzle.referencePitches, source: "reference" },
    ]);
  };

  const playReview = () => {
    if (!session?.result || playback) return;
    const response = completeResponse(session.attempt);
    if (!response) return;
    play(
      "review",
      reviewSections(session.puzzle, response, session.result.check.exact),
    );
  };

  const submit = () => {
    if (!session || session.result || playback) return;
    const response = completeResponse(session.attempt);
    if (!response) return;
    const result = submitImitationResponse(
      session.run,
      session.puzzle,
      response,
    );
    const submittedAttempt = imitationAttemptReducer(
      session.attempt,
      { type: "submit" },
      session.puzzle,
    );
    setProfile(result.state.profile);
    saveImitationProfile(result.state.profile, storage);
    setSession({
      ...session,
      run: result.state,
      attempt: submittedAttempt,
      result,
    });
    play(
      "review",
      reviewSections(session.puzzle, response, result.check.exact),
    );
  };

  const continueRun = () => {
    if (!session?.result || playback) return;
    if (session.run.status !== "active") {
      setScreen("results");
      return;
    }
    const prepared = prepareNextImitationPuzzle(
      session.run,
      rng,
      session.recentReferences,
    );
    setSession({
      ...session,
      run: prepared.state,
      puzzle: prepared.puzzle,
      attempt: createImitationAttempt(prepared.puzzle),
      result: null,
      recentReferences: [
        ...session.recentReferences.slice(-3),
        prepared.puzzle.referencePitches,
      ],
    });
    setMessage("");
    setPlayback({ kind: "opening", cue: null });
  };

  const resetProfile = () => {
    clearImitationProfile(storage);
    setProfile(createImitationProfile());
    setMessage("Imitation profile reset.");
  };

  if (screen === "introduction") {
    return (
      <Introduction
        onBegin={beginRun}
        onExit={leaveFeature}
        onReset={resetProfile}
        profile={profile}
        resetMessage={message}
      />
    );
  }
  if (!session) return null;
  if (screen === "results") {
    return (
      <Results onAgain={beginRun} onExit={leaveFeature} session={session} />
    );
  }

  const response = completeResponse(session.attempt);
  const inReview = session.result !== null;
  const referenceRemaining = inReview
    ? null
    : remainingReferencePlays(session.attempt, session.puzzle);
  const auditionRemaining = inReview
    ? null
    : remainingPitchAuditions(session.attempt, session.puzzle);
  const keyboardBlocked = playback !== null && playback.kind !== "audition";
  const enabledPitches = keyboardBlocked
    ? new Set<number>()
    : new Set(session.puzzle.enabledPitches);

  const puzzleNumber =
    session.run.puzzlesPresented + (session.result === null ? 1 : 0);
  const soundingPitch =
    playback?.cue?.source === "reference" ? undefined : playback?.cue?.pitch;
  const markers = [
    {
      label: displayPitch(session.puzzle.anchorPitch),
      pitch: session.puzzle.anchorPitch,
      role: "primary" as const,
    },
  ];

  return (
    <RunShell
      answer={
        <>
          <PuzzleKeyboard
            enabledPitches={enabledPitches}
            markers={markers}
            octaves={octavesFor(session.puzzle)}
            onPitchPress={audition}
            showPitchLabels
            soundingPitch={soundingPitch}
          />
          <p className={styles.auditionAllowance}>
            Auditions <strong>{allowanceLabel(auditionRemaining)}</strong>
          </p>
          <div className={styles.actions}>
            {inReview ? (
              <Button disabled={playback !== null} onClick={continueRun}>
                {session.run.status === "active" ? "Continue" : "View results"}
              </Button>
            ) : (
              <Button
                disabled={response === null || playback !== null}
                onClick={submit}
              >
                Submit response
              </Button>
            )}
          </div>
        </>
      }
      lives={session.run.lives}
      onExit={leaveFeature}
      puzzleNumber={puzzleNumber}
      question={
        <div className={styles.puzzleConsole}>
          <SlotStrip
            attempt={session.attempt}
            cue={playback?.cue ?? null}
            disabled={playback !== null}
            onSelect={selectSlot}
            puzzle={session.puzzle}
            result={session.result}
          />
          <Button
            className={styles.referenceButton}
            disabled={playback !== null || !hasAllowance(referenceRemaining)}
            onClick={inReview ? playReview : replayReference}
          >
            <span>
              {inReview
                ? session.result?.check.exact
                  ? "Play response"
                  : "Compare"
                : "Replay reference"}
            </span>
            <strong>{allowanceLabel(referenceRemaining)}</strong>
          </Button>
        </div>
      }
      questionLabel="Imitation phrase"
    />
  );
}
