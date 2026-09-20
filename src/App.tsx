import { useEffect, useState } from "react";

import { AnswerControls } from "./AnswerControls";
import { MainMenu } from "./MainMenu";
import { PuzzleKeyboard } from "./PuzzleKeyboard";
import { keyboardSynth } from "./keyboardSynth";
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

type AppScreen = "menu" | "introduction" | "run" | "results";

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

function correctAnswerLabel(question: NavigationQuestion) {
  if (question.answer.kind === "note") return renderNote(question.answer.note);
  if (question.answer.kind === "numericalDistance") {
    return displayUnit(question.answer.value, question.answer.unit);
  }
  return question.answer.interval.name;
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

function ActionButton({
  children,
  disabled = false,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={styles.action}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function RunView({
  session,
  onSelect,
  onSubmit,
  onContinue,
}: {
  session: RunSession;
  onSelect: (answer: SubmittedAnswer | null) => void;
  onSubmit: () => void;
  onContinue: () => void;
}) {
  const feedback = session.result;
  const destination = destinationFor(session.question);
  const puzzleNumber =
    session.run.puzzlesPresented + (feedback === null ? 1 : 0);

  return (
    <main className={styles.runScreen}>
      <div className={styles.runShell}>
        <header className={styles.runStatus}>
          <span>Lives {session.run.lives}</span>
          <span>Puzzle {puzzleNumber}</span>
        </header>

        <aside
          className={styles.debugAssessments}
          aria-label="Skill assessments"
        >
          {SKILLS.map((skill) => (
            <div key={skill}>
              <span>{skillLabels[skill]}</span>
              <span>
                P {session.run.profile[skill].proficiency.toFixed(2)} · C{" "}
                {session.run.profile[skill].certainty.toFixed(2)}
              </span>
            </div>
          ))}
        </aside>

        <section className={styles.question} aria-labelledby="question-prompt">
          <PuzzleKeyboard
            destination={destination}
            octaves={
              session.question.keyboardMode === "singleRegister"
                ? [NOTE_NAVIGATION_TUNING.singleRegisterOctave]
                : [3, 4, 5]
            }
            revealDestinationLabel={
              session.question.form === "reverse" || feedback !== null
            }
            start={session.question.start}
          />
          <h1 id="question-prompt">{questionPrompt(session.question)}</h1>
          {feedback ? (
            <div
              className={`${styles.feedback} ${feedback.correct ? styles.correct : styles.incorrect}`}
              role="status"
            >
              <strong>{feedback.correct ? "Correct" : "Mistake"}</strong>
              {!feedback.correct ? (
                <p>
                  Correct answer: {correctAnswerLabel(session.question)}.{" "}
                  {wrongAnswerExplanation(session.question)}
                </p>
              ) : null}
            </div>
          ) : null}
        </section>

        <section className={styles.answerArea} aria-label="Answer">
          <AnswerControls
            disabled={feedback !== null}
            key={session.question.id}
            onSelect={onSelect}
            question={session.question}
            selected={session.selected}
          />

          {feedback ? (
            <ActionButton onClick={onContinue}>Continue</ActionButton>
          ) : (
            <ActionButton
              disabled={session.selected === null}
              onClick={onSubmit}
            >
              Submit
            </ActionButton>
          )}
        </section>
      </div>
    </main>
  );
}

function Introduction({
  onBack,
  onBegin,
  onReset,
}: {
  onBack: () => void;
  onBegin: () => void;
  onReset: () => void;
}) {
  return (
    <main className={styles.centeredScreen}>
      <div className={styles.panel}>
        <button className={styles.textButton} onClick={onBack} type="button">
          ← Back
        </button>
        <h1>Note navigation</h1>
        <p>Read the marked keys, then choose the note or distance.</p>
        <p>Three wrong answers end the run.</p>
        <ActionButton onClick={onBegin}>Begin run</ActionButton>
        <button className={styles.reset} onClick={onReset} type="button">
          Reset learning data
        </button>
      </div>
    </main>
  );
}

function Results({
  session,
  onAgain,
  onMenu,
}: {
  session: RunSession;
  onAgain: () => void;
  onMenu: () => void;
}) {
  return (
    <main className={styles.centeredScreen}>
      <div className={styles.panel}>
        <h1>
          {session.run.status === "succeeded" ? "Run complete" : "Run ended"}
        </h1>
        <p>{session.run.puzzlesPresented} puzzles played.</p>
        <dl className={styles.scores}>
          {SKILLS.map((skill) => (
            <div key={skill}>
              <dt>{skillLabels[skill]}</dt>
              <dd>
                {Math.round(session.startingProfile[skill].proficiency * 100)} →{" "}
                {Math.round(session.run.profile[skill].proficiency * 100)}
              </dd>
            </div>
          ))}
        </dl>
        <div className={styles.resultActions}>
          <ActionButton onClick={onAgain}>Play again</ActionButton>
          <button className={styles.textButton} onClick={onMenu} type="button">
            Return to instrument
          </button>
        </div>
      </div>
    </main>
  );
}

export function App() {
  const [screen, setScreen] = useState<AppScreen>("menu");
  const [profile, setProfile] = useState(() =>
    loadProfile(window.localStorage),
  );
  const [session, setSession] = useState<RunSession | null>(null);

  useEffect(() => stopReveal, []);

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
    saveProfile(transition.state.profile, window.localStorage);
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
      setScreen("results");
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

  const resetProfile = () => {
    clearSavedProfile(window.localStorage);
    setProfile(createDefaultProfile());
  };

  if (screen === "menu") {
    return <MainMenu onOpenNoteNavigation={() => setScreen("introduction")} />;
  }
  if (screen === "introduction") {
    return (
      <Introduction
        onBack={() => setScreen("menu")}
        onBegin={beginRun}
        onReset={resetProfile}
      />
    );
  }
  if (!session) return null;
  if (screen === "results") {
    return (
      <Results
        onAgain={beginRun}
        onMenu={() => setScreen("menu")}
        session={session}
      />
    );
  }
  return (
    <RunView
      onContinue={continueRun}
      onSelect={(selected) => setSession({ ...session, selected })}
      onSubmit={submitAnswer}
      session={session}
    />
  );
}
