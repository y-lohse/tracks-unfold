import { useId, type CSSProperties, type ReactNode } from "react";

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
  progress?: number;
  milestones?: readonly {
    id: string;
    threshold: number;
    earned: boolean;
    label?: string;
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
  progress,
  milestones,
  lockedReason,
  runSummary,
}: IntroductionProps) {
  const id = useId();
  const currentProgress =
    progress === undefined
      ? undefined
      : Number.isFinite(progress)
        ? Math.max(0, Math.min(1, progress))
        : 0;
  const percentage = Math.floor((currentProgress ?? 0) * 100);
  const rewards: NonNullable<IntroductionProps["milestones"]> = milestones ?? [
    { id: "33", threshold: 0.33, earned: false },
    { id: "66", threshold: 0.66, earned: false },
    { id: "100", threshold: 1, earned: false },
  ];

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
        {skills?.length ||
        progress !== undefined ||
        milestones !== undefined ? (
          <div className="border-rule mt-7 border-t pt-5">
            {skills?.length ? (
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
            ) : null}
            {currentProgress !== undefined ? (
              <div className={skills?.length ? "mt-6" : undefined}>
                <p
                  id={`${id}-progress`}
                  className="text-muted flex justify-between text-xs"
                >
                  <span>Overall progress</span>
                  <span className="tabular-nums">{percentage}%</span>
                </p>
                <div
                  role="progressbar"
                  aria-label="Overall progress"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={currentProgress * 100}
                  aria-valuetext={`${percentage}%`}
                  className="bg-rule mt-2 h-1 overflow-hidden rounded-full"
                >
                  <div
                    className={`${styles.progressFill} bg-accent h-full`}
                    style={
                      {
                        "--progress": `${currentProgress * 100}%`,
                      } as CSSProperties
                    }
                  />
                </div>
              </div>
            ) : null}
            {rewards.length ? (
              <section className="mt-6" aria-labelledby={`${id}-unlocks`}>
                <h2
                  id={`${id}-unlocks`}
                  className="text-muted text-xs font-semibold tracking-wide uppercase"
                >
                  Sound unlocks
                </h2>
                <ol
                  className={`${styles.track} relative mt-4 flex`}
                  style={
                    { "--milestone-count": rewards.length } as CSSProperties
                  }
                >
                  {rewards.map(({ id: rewardId, threshold, earned, label }) => (
                    <li
                      key={rewardId}
                      className="relative flex min-w-0 flex-1 flex-col items-center gap-3 text-xs tabular-nums"
                    >
                      <span
                        className={`${styles.marker} ${threshold === 1 ? styles.finalMarker : "rounded-full"} ${earned ? styles.earnedMarker : ""} relative block size-3`}
                        role={
                          milestones !== undefined || threshold === 1
                            ? "img"
                            : undefined
                        }
                        aria-hidden={
                          milestones === undefined && threshold !== 1
                            ? true
                            : undefined
                        }
                        aria-label={
                          milestones !== undefined
                            ? `${Math.floor(threshold * 100)}% ${label ?? "Sound reward"}, ${earned ? "unlocked" : "locked"}`
                            : threshold === 1
                              ? "Final milestone: diamond"
                              : undefined
                        }
                      />
                      <span
                        aria-hidden={
                          milestones !== undefined ? true : undefined
                        }
                      >
                        {Math.floor(threshold * 100)}%
                      </span>
                      {label ? (
                        <span
                          className="text-muted text-center"
                          aria-hidden="true"
                        >
                          {label}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}
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
