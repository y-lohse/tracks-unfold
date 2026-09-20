const dormantAreas = [
  "Imitation",
  "Tonal contours",
  "Rhythm performance",
  "Interval identification",
] as const;

type MainMenuProps = {
  onOpenNoteNavigation?: () => void;
};

export function MainMenu({ onOpenNoteNavigation }: MainMenuProps) {
  return (
    <main className="bg-canvas text-ink flex min-h-svh justify-center px-6 py-12 sm:px-10 sm:py-16">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-medium tracking-tight">Tracks Unfold</h1>

        <ul
          aria-label="Instrument areas"
          className="border-rule divide-rule mt-24 divide-y border-y"
        >
          <li>
            <button
              className="focus-visible:outline-accent flex w-full cursor-pointer items-center justify-between gap-6 py-5 text-left focus-visible:outline-2 focus-visible:outline-offset-4"
              onClick={onOpenNoteNavigation}
              type="button"
            >
              <span>Note navigation</span>
              <span aria-hidden="true">→</span>
            </button>
          </li>
          {dormantAreas.map((area) => (
            <li
              className="flex items-center justify-between gap-6 py-5"
              key={area}
            >
              <span>{area}</span>
              <span className="text-muted text-xs tracking-widest uppercase">
                Dormant
              </span>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
