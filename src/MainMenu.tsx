const areas = [
  "Note navigation",
  "Imitation",
  "Tonal contours",
  "Rhythm performance",
  "Interval identification",
] as const;

export function MainMenu() {
  return (
    <main className="bg-canvas text-ink flex min-h-svh justify-center px-6 py-12 sm:px-10 sm:py-16">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-medium tracking-tight">Tracks Unfold</h1>

        <ul
          aria-label="Dormant areas"
          className="border-rule divide-rule mt-24 divide-y border-y"
        >
          {areas.map((area) => (
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
