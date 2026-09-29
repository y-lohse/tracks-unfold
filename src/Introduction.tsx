import { useId, type ReactNode } from "react";

import { Button } from "./Button";
import styles from "./Introduction.module.css";

type IntroductionProps = {
  title: string;
  instruction: string;
  theoryTip: string;
  onBack: () => void;
  onContinue: () => void;
  message?: string;
  icon?: ReactNode;
  skills?: readonly {
    label: string;
    proficiency: number;
    previousProficiency?: number;
  }[];
  lockedReason?: string;
  runSummary?: { status: "succeeded" | "failed"; puzzlesPlayed: number };
};

export function Introduction({
  title,
  instruction,
  theoryTip,
  onBack,
  onContinue,
  message,
  icon,
  skills,
  lockedReason,
  runSummary,
}: IntroductionProps) {
  const id = useId();

  return (
    <main className="bg-canvas text-ink flex min-h-svh justify-center px-6 py-8">
      <div className="flex w-full max-w-md flex-col justify-center">
        <button
          className="text-muted focus-visible:outline-accent w-fit cursor-pointer py-1 text-xs focus-visible:outline-2 focus-visible:outline-offset-2"
          onClick={onBack}
          type="button"
        >
          ← Back
        </button>
        <header className="mt-8">
          {icon ? (
            <div
              className="text-accent mb-4 flex size-10 items-center justify-center"
              aria-hidden="true"
            >
              {icon}
            </div>
          ) : null}
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-muted mt-4 text-sm leading-relaxed">
            {runSummary
              ? `${runSummary.status === "succeeded" ? "Run complete" : "Run ended"} · ${runSummary.puzzlesPlayed} ${runSummary.puzzlesPlayed === 1 ? "puzzle" : "puzzles"} played.`
              : instruction}
          </p>
        </header>
        {skills?.length ? (
          <div className="border-rule mt-7 border-t pt-5">
            <section aria-labelledby={`${id}-skills`}>
              <h2
                id={`${id}-skills`}
                className="text-muted text-xs font-semibold tracking-wide uppercase"
              >
                Your skills
              </h2>
              <dl className="mt-3 space-y-3 text-sm">
                {skills.map(({ label, proficiency, previousProficiency }) => (
                  <div
                    key={label}
                    className="flex items-baseline justify-between gap-4"
                  >
                    <dt className="min-w-0 break-words">{label}</dt>
                    <dd className="shrink-0 tabular-nums">
                      {runSummary && previousProficiency !== undefined ? (
                        <>
                          <span className="sr-only">Before run: </span>
                          <span className="text-muted">
                            {Math.round(previousProficiency * 100)}%
                          </span>
                          <span aria-hidden="true"> → </span>
                          <span className="sr-only">; now: </span>
                        </>
                      ) : null}
                      {Math.round(proficiency * 100)}%
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
            <section className="mt-6" aria-labelledby={`${id}-unlocks`}>
              <h2
                id={`${id}-unlocks`}
                className="text-muted text-xs font-semibold tracking-wide uppercase"
              >
                Sound unlocks
              </h2>
              <ol className={`${styles.track} relative mt-4 grid grid-cols-3`}>
                {[33, 66, 100].map((threshold) => (
                  <li
                    key={threshold}
                    className="relative flex flex-col items-center gap-3 text-xs tabular-nums"
                  >
                    {threshold === 100 ? (
                      <span
                        className={`${styles.marker} ${styles.finalMarker} relative block size-3`}
                        role="img"
                        aria-label="Final milestone: diamond"
                      />
                    ) : (
                      <span
                        className={`${styles.marker} relative block size-3 rounded-full`}
                        aria-hidden="true"
                      />
                    )}
                    <span>{threshold}%</span>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        ) : null}

        <Button
          className="mt-8"
          onClick={onContinue}
          disabled={Boolean(lockedReason)}
          aria-describedby={lockedReason ? `${id}-lock` : undefined}
        >
          {runSummary ? "Play again" : "Start"}
        </Button>
        {lockedReason ? (
          <p
            id={`${id}-lock`}
            className="text-muted mt-3 text-sm leading-relaxed"
          >
            {lockedReason}
          </p>
        ) : null}
        {message ? (
          <p className="text-muted mt-4 text-sm" role="status">
            {message}
          </p>
        ) : null}
        <aside className="border-rule mt-8 border-t pt-5">
          <h2 className="text-muted text-xs font-semibold tracking-wide uppercase">
            Music theory
          </h2>
          <p className="mt-2 text-sm leading-relaxed">{theoryTip}</p>
        </aside>
      </div>
    </main>
  );
}
