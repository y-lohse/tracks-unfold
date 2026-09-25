import chunk from "lodash-es/chunk.js";
import range from "lodash-es/range.js";
import type { ReactNode } from "react";

import styles from "./RunShell.module.css";

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
  const groups = chunk(range(1, count + 1), 5);

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

export function RunShell({
  lives,
  puzzleNumber,
  onExit,
  question,
  questionLabel,
  answer,
}: {
  readonly lives: number;
  readonly puzzleNumber: number;
  readonly onExit: () => void;
  readonly question: ReactNode;
  readonly questionLabel?: string;
  readonly answer: ReactNode;
}) {
  return (
    <main className={styles.runScreen}>
      <div className={styles.runShell}>
        <header className={styles.runStatus}>
          <Lives remaining={lives} />
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
        <section
          className={styles.question}
          {...(questionLabel
            ? { "aria-label": questionLabel }
            : { "aria-labelledby": "question-prompt" })}
        >
          {question}
        </section>
        <section className={styles.answerArea} aria-label="Answer">
          {answer}
        </section>
      </div>
    </main>
  );
}
