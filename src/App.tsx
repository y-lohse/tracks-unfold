import { useEffect, useState } from "react";

import { AnswerControls } from "./AnswerControls";
import { Button } from "./Button";
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

function Lives({ remaining }: { remaining: number }) {
  return (
    <div className={styles.lives} aria-label={`${remaining} lives remaining`}>
      {[0, 1, 2].map((index) => (
        <span
          aria-hidden="true"
          className={index < remaining ? styles.lifeActive : styles.lifeLost}
          key={index}
        />
      ))}
    </div>
  );
}

function PuzzleVents({ count }: { count: number }) {
  const groups = Array.from({ length: Math.ceil(count / 5) }, (_, group) =>
    Array.from(
      { length: Math.min(5, count - group * 5) },
      (_, index) => group * 5 + index + 1,
    ),
  );

  return (
    <div className={styles.puzzleVents} aria-label={`Puzzle ${count}`}>
      {groups.map((group) => (
        <span className={styles.ventGroup} key={group[0]}>
          {group.map((puzzle) => (
            <span aria-hidden="true" className={styles.vent} key={puzzle} />
          ))}
        </span>
      ))}
    </div>
  );
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
    <main className={styles.runScreen}>
      <div className={styles.runShell}>
        <header className={styles.runStatus}>
          <Lives remaining={session.run.lives} />
          <PuzzleVents count={puzzleNumber} />
          <button
            aria-label="Exit run"
            className={styles.exitRun}
            onClick={onExit}
            type="button"
          >
            <svg aria-hidden="true" viewBox="0 0 16 16">
              <path d="M3 3l10 10M13 3L3 13" />
            </svg>
          </button>
        </header>

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
          {feedback && !feedback.correct ? (
            <div className={styles.feedback} role="status">
              <p>{wrongAnswerExplanation(session.question)}</p>
            </div>
          ) : null}
        </section>

        <details
          className={styles.debugAssessments}
          aria-label="Skill assessments"
        >
          <summary>Debug</summary>
          <div className={styles.debugBody}>
            <section className={styles.debugGroup} aria-label="Skill levels">
              <strong>Skills</strong>
              {SKILLS.map((skill) => (
                <div className={styles.debugRow} key={skill}>
                  <span>{skillLabels[skill]}</span>
                  <span>
                    P {session.run.profile[skill].proficiency.toFixed(2)} · C{" "}
                    {session.run.profile[skill].certainty.toFixed(2)} · CH{" "}
                    {session.run.assignedChallenge[skill].toFixed(2)}
                  </span>
                </div>
              ))}
            </section>
            <section
              className={styles.debugGroup}
              aria-label="Question controls"
            >
              <strong>Question controls</strong>
              <div className={styles.debugRow}>
                <span>Navigation</span>
                <span>
                  {session.question.controls.navigationDemand.toFixed(2)}
                </span>
              </div>
              <div className={styles.debugRow}>
                <span>Interval names</span>
                <span>
                  {session.question.controls.intervalNameDemand.toFixed(2)}
                </span>
              </div>
              <div className={styles.debugRow}>
                <span>Answer breadth</span>
                <span>
                  {session.question.controls.answerChoiceBreadth.toFixed(2)}
                </span>
              </div>
            </section>
          </div>
        </details>

        <section className={styles.answerArea} aria-label="Answer">
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
        <Button className={styles.panelAction} onClick={onBegin}>
          Begin run
        </Button>
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
          <Button onClick={onAgain}>Play again</Button>
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

  const exitRun = () => {
    stopReveal();
    setSession(null);
    setScreen("menu");
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
      onExit={exitRun}
      onSelect={(selected) => setSession({ ...session, selected })}
      onSubmit={submitAnswer}
      session={session}
    />
  );
}
