import { useEffect, useState } from "react";

import { StorageBoundary } from "./StorageBoundary";
import type { ResilientStorage } from "./resilientStorage";

import { AnswerControls } from "./AnswerControls";
import { Button } from "./Button";
import { ImitationGame } from "./imitation/ImitationGame";
import {
  clearImitationProfile,
  loadImitationProfile,
} from "./imitation/persistence";
import { Introduction } from "./Introduction";
import { Instrument } from "./Instrument";
import {
  availableInstrumentSound,
  instrumentMilestones,
} from "./instrumentUnlocks";
import {
  DEFAULT_INSTRUMENT_SOUND,
  type InstrumentSound,
} from "./instrumentPresets";
import { loadInstrumentSound, saveInstrumentSound } from "./instrumentStorage";
import { MainMenu } from "./MainMenu";
import {
  clearUnlocks,
  isPuzzleUnlocked,
  loadUnlocks,
  profileProgress,
  reconcileUnlocks,
  saveUnlocks,
} from "./progression";
import { PuzzleKeyboard } from "./PuzzleKeyboard";
import { PuzzleIcon } from "./PuzzleIcon";
import { keyboardSynth } from "./keyboardSynth";
import { RunShell } from "./run";
import { Settings } from "./Settings";
import { navigationTheoryTip } from "./noteNavigation/theoryTips";
import {
  NOTE_NAVIGATION_TUNING,
  SKILLS,
  answerQuestion,
  clearSavedProfile,
  createDefaultProfile,
  getInterval,
  loadProfile,
  noteToMidi,
  prepareNextQuestion,
  renderNote,
  saveProfile,
  spellPitch,
  startRun,
  type AnswerResult,
  type NavigationQuestion,
  type Note,
  type PlayerProfile,
  type RunState,
  type Skill,
  type SubmittedAnswer,
} from "./noteNavigation";
import styles from "./App.module.css";

type AppScreen =
  "menu" | "settings" | "instrument" | "introduction" | "run" | "imitation";

type RunSession = {
  run: RunState;
  question: NavigationQuestion;
  selected: SubmittedAnswer | null;
  result: AnswerResult | null;
  startingProfile: PlayerProfile;
};

const skillLabels: Record<Skill, string> = {
  numericalDestination: "Finding a note",
  numericalDistance: "Measuring distance",
  intervalInterpretation: "Using interval names",
  intervalIdentification: "Naming intervals",
};

function displayUnit(value: number, unit: "semitones" | "wholeTones") {
  const singular = unit === "semitones" ? "semitone" : "whole tone";
  return `${value} ${value === 1 ? singular : `${singular}s`}`;
}

function destinationFor(question: NavigationQuestion): Note {
  if (question.form === "reverse" && question.end) return question.end;
  if (question.answer.kind === "note") return question.answer.note;
  throw new Error("Forward question is missing its destination");
}

function questionPrompt(question: NavigationQuestion) {
  const start = renderNote(question.start);
  const direction = question.direction === "up" ? "up" : "down";
  if (question.instruction.kind === "numerical") {
    return `${start}, ${direction} ${displayUnit(question.instruction.value, question.instruction.unit)}`;
  }
  if (question.instruction.kind === "namedInterval") {
    const reminder = question.instruction.numericalReminder
      ? ` (${question.instruction.numericalReminder})`
      : "";
    return `${start}, ${direction} a ${question.instruction.interval.name}${reminder}`;
  }
  const end = question.end ? renderNote(question.end) : "";
  if (question.instruction.kind === "identifyNumerical") {
    const unit =
      question.instruction.unit === "semitones" ? "semitones" : "whole tones";
    return `How many ${unit} from ${start} ${direction} to ${end}?`;
  }
  return `Name the interval from ${start} ${direction} to ${end}`;
}

function wrongAnswerExplanation(question: NavigationQuestion) {
  const start = renderNote(question.start);
  const end = renderNote(destinationFor(question));
  if (question.answer.kind === "numericalDistance") {
    return `${start} to ${end} is ${displayUnit(question.answer.value, question.answer.unit)}.`;
  }
  if (question.answer.kind === "namedInterval") {
    const interval = question.answer.interval;
    const letterCount = interval.number
      ? ` It spans ${interval.number} letter names and ${interval.semitones} semitones.`
      : ` It spans ${interval.semitones} semitones.`;
    return `${start} to ${end} is a ${interval.name}.${letterCount}`;
  }
  if (question.instruction.kind === "namedInterval") {
    const interval = getInterval(question.instruction.interval.id);
    const spelling = interval.number
      ? ` The ${interval.number} counts letter names; the quality fixes the ${interval.semitones}-semitone distance.`
      : "";
    return `${start} to ${end} is a ${interval.name}.${spelling}`;
  }
  return `Moving ${question.direction} from ${start} lands on ${end}.`;
}

function audioPitch(note: Note) {
  return renderNote(spellPitch(noteToMidi(note), "sharp"), false);
}

let revealSequence = 0;

function stopReveal() {
  revealSequence += 1;
  keyboardSynth.releaseAll();
}

function playReveal(question: NavigationQuestion) {
  stopReveal();
  const sequence = revealSequence;
  const first = audioPitch(question.start);
  const second = audioPitch(destinationFor(question));
  keyboardSynth.noteOn(first);
  window.setTimeout(() => {
    if (sequence !== revealSequence) return;
    keyboardSynth.noteOff(first);
    keyboardSynth.noteOn(second);
  }, 320);
  window.setTimeout(() => {
    if (sequence === revealSequence) keyboardSynth.noteOff(second);
  }, 760);
}

function RunView({
  session,
  onSelect,
  onSubmit,
  onContinue,
  onExit,
}: {
  session: RunSession;
  onSelect: (answer: SubmittedAnswer | null) => void;
  onSubmit: () => void;
  onContinue: () => void;
  onExit: () => void;
}) {
  const feedback = session.result;
  const destination = destinationFor(session.question);
  const puzzleNumber =
    session.run.puzzlesPresented + (feedback === null ? 1 : 0);

  return (
    <RunShell
      answer={
        <>
          <AnswerControls
            disabled={feedback !== null}
            key={session.question.id}
            onSelect={onSelect}
            question={session.question}
            result={session.result}
            selected={session.selected}
          />
          {feedback ? (
            <Button onClick={onContinue}>Continue</Button>
          ) : (
            <Button disabled={session.selected === null} onClick={onSubmit}>
              Submit
            </Button>
          )}
        </>
      }
      lives={session.run.lives}
      onExit={onExit}
      puzzleNumber={puzzleNumber}
      question={
        <>
          <PuzzleKeyboard
            markers={[
              {
                label: renderNote(session.question.start),
                pitch: noteToMidi(session.question.start),
                role: "primary",
              },
              {
                ...(session.question.form === "reverse" || feedback !== null
                  ? { label: renderNote(destination) }
                  : {}),
                pitch: noteToMidi(destination),
                role: "secondary",
              },
            ]}
            octaves={
              session.question.keyboardMode === "singleRegister"
                ? [NOTE_NAVIGATION_TUNING.singleRegisterOctave]
                : [3, 4, 5]
            }
          />
          <h1 id="question-prompt">{questionPrompt(session.question)}</h1>
          {feedback && !feedback.correct ? (
            <div className={styles.feedback} role="status">
              <p>{wrongAnswerExplanation(session.question)}</p>
            </div>
          ) : null}
        </>
      }
    />
  );
}

function loadReconciledUnlocks(storage: ResilientStorage) {
  return reconcileUnlocks(loadUnlocks(storage), {
    navigation: profileProgress(loadProfile(storage)),
    imitation: profileProgress(loadImitationProfile(storage)),
  });
}

export function App() {
  return (
    <StorageBoundary>
      {(storage) => <AppContent storage={storage} />}
    </StorageBoundary>
  );
}

function AppContent({ storage }: { storage: ResilientStorage }) {
  const [screen, setScreen] = useState<AppScreen>("menu");
  const [profile, setProfile] = useState(() => loadProfile(storage));
  const [unlocks, setUnlocks] = useState(() => loadReconciledUnlocks(storage));
  const [session, setSession] = useState<RunSession | null>(null);
  const [initialInstrument] = useState(() => {
    try {
      return {
        sound: availableInstrumentSound(
          loadInstrumentSound(window.localStorage),
          unlocks,
        ),
        error: null,
      };
    } catch {
      return {
        sound: { ...DEFAULT_INSTRUMENT_SOUND },
        error:
          "Your saved instrument could not be loaded. Changes will still work for this session.",
      };
    }
  });
  const [sound, setSound] = useState(initialInstrument.sound);
  const [instrumentStorageError, setInstrumentStorageError] = useState<
    string | null
  >(initialInstrument.error);

  useEffect(() => {
    keyboardSynth.configure(sound);
  }, [sound]);

  function changeSound(next: InstrumentSound) {
    const available = availableInstrumentSound(next, unlocks);
    if (
      (Object.keys(next) as (keyof InstrumentSound)[]).some(
        (slot) => next[slot] !== available[slot],
      )
    )
      return;
    keyboardSynth.configure(available);
    setSound(next);
    try {
      saveInstrumentSound(next, window.localStorage);
      setInstrumentStorageError(null);
    } catch {
      setInstrumentStorageError(
        "Your sound works for this session, but could not be saved. Choose another option to retry.",
      );
    }
  }
  const navigationProgress = profileProgress(profile);

  useEffect(() => stopReveal, []);
  useEffect(() => {
    if (unlocks.length) saveUnlocks(unlocks, storage);
    else clearUnlocks(storage);
  }, [unlocks, storage]);

  const beginRun = () => {
    stopReveal();
    const initial = startRun(profile, Math.random);
    const prepared = prepareNextQuestion(initial, Math.random);
    setSession({
      run: prepared.state,
      question: prepared.question,
      selected: null,
      result: null,
      startingProfile: profile,
    });
    setScreen("run");
  };

  const submitAnswer = () => {
    if (!session?.selected || session.result) return;
    const transition = answerQuestion(
      session.run,
      session.question,
      session.selected,
    );
    setProfile(transition.state.profile);
    saveProfile(transition.state.profile, storage);
    const nextUnlocks = loadReconciledUnlocks(storage);
    saveUnlocks(nextUnlocks, storage);
    setUnlocks(nextUnlocks);
    setSession({
      ...session,
      run: transition.state,
      result: transition.result,
    });
    playReveal(session.question);
  };

  const continueRun = () => {
    if (!session?.result) return;
    stopReveal();
    if (session.run.status !== "active") {
      setScreen("introduction");
      return;
    }
    const prepared = prepareNextQuestion(session.run, Math.random);
    setSession({
      ...session,
      run: prepared.state,
      question: prepared.question,
      selected: null,
      result: null,
    });
  };

  const eraseProgress = () => {
    clearSavedProfile(storage);
    clearImitationProfile(storage);
    clearUnlocks(storage);
    changeSound({ ...DEFAULT_INSTRUMENT_SOUND });
    setUnlocks([]);
    setProfile(createDefaultProfile());
    setSession(null);
  };

  const exitRun = () => {
    stopReveal();
    setSession(null);
    setScreen("menu");
  };

  if (screen === "menu") {
    return (
      <MainMenu
        unlocks={unlocks}
        onOpenImitation={() => setScreen("imitation")}
        onOpenNoteNavigation={() => setScreen("introduction")}
        onOpenSettings={() => setScreen("settings")}
        onOpenInstrument={() => setScreen("instrument")}
      />
    );
  }
  if (screen === "settings") {
    return (
      <Settings
        onBack={() => setScreen("menu")}
        onEraseProgress={eraseProgress}
      />
    );
  }
  if (screen === "instrument") {
    return (
      <Instrument
        sound={sound}
        unlocks={unlocks}
        onChange={changeSound}
        onBack={() => setScreen("menu")}
        storageError={instrumentStorageError}
      />
    );
  }
  if (screen === "imitation") {
    return (
      <ImitationGame
        storage={storage}
        onExit={() => {
          setUnlocks(loadReconciledUnlocks(storage));
          setScreen("menu");
        }}
        lockedReason={
          !isPuzzleUnlocked("imitation", unlocks)
            ? "Reach 20% in Navigation to unlock."
            : undefined
        }
      />
    );
  }
  if (screen === "introduction") {
    return (
      <Introduction
        onBack={exitRun}
        onContinue={beginRun}
        title="Note navigation"
        instruction="Learn to identify the direction and distance between notes."
        theoryTip={navigationTheoryTip(profile)}
        progress={navigationProgress}
        milestones={instrumentMilestones("navigation", unlocks)}
        icon={<PuzzleIcon name="navigation" className="h-full w-full" />}
        skills={SKILLS.map((skill) => ({
          label: skillLabels[skill],
          proficiency: profile[skill].proficiency,
          previousProficiency:
            session?.run.status !== "active"
              ? session?.startingProfile[skill].proficiency
              : undefined,
        }))}
        runSummary={
          session && session.run.status !== "active"
            ? {
                status: session.run.status,
                puzzlesPlayed: session.run.puzzlesPresented,
              }
            : undefined
        }
      />
    );
  }
  if (!session) return null;

  return (
    <RunView
      onContinue={continueRun}
      onExit={exitRun}
      onSelect={(selected) => setSession({ ...session, selected })}
      onSubmit={submitAnswer}
      session={session}
    />
  );
}
