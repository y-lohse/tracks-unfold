import { Button } from "./Button";

type IntroductionProps = {
  title: string;
  instruction: string;
  theoryTip: string;
  onBack: () => void;
  onContinue: () => void;
  message?: string;
};

export function Introduction({
  title,
  instruction,
  theoryTip,
  onBack,
  onContinue,
  message,
}: IntroductionProps) {
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
        <h1 className="mt-10 mb-5 text-2xl font-semibold">{title}</h1>
        <p className="text-muted text-sm leading-relaxed">{instruction}</p>
        <aside className="border-rule mt-8 border-t pt-5">
          <h2 className="text-muted text-xs font-semibold tracking-wide uppercase">
            Music theory
          </h2>
          <p className="mt-2 text-sm leading-relaxed">{theoryTip}</p>
        </aside>
        <Button className="mt-8" onClick={onContinue}>
          Continue
        </Button>
        {message ? (
          <p className="text-muted mt-4 text-sm" role="status">
            {message}
          </p>
        ) : null}
      </div>
    </main>
  );
}
