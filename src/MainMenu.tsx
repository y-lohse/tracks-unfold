import { type CSSProperties } from "react";

import styles from "./MainMenu.module.css";

const dormantAreas = [
  "Imitation",
  "Tonal contours",
  "Rhythm performance",
  "Interval identification",
] as const;

const chromaticNotes = [
  "C",
  "C♯",
  "D",
  "D♯",
  "E",
  "F",
  "F♯",
  "G",
  "G♯",
  "A",
  "A♯",
  "B",
] as const;

type NoteStyle = CSSProperties & {
  "--note-angle": string;
  "--note-counter-angle": string;
};

type StationStyle = CSSProperties & {
  "--station-delay": string;
};

type MainMenuProps = {
  onOpenNoteNavigation?: () => void;
};

const routeDuration = 13;
const routeTravelDuration = (routeDuration * 100) / 124;
const stationRoutes = [
  {
    className: styles.stationPrimary,
    startDelay: 0,
    points: [
      [160, 38, 0],
      [221, 54.3, 0.228],
      [204, 83.8, 0.349],
      [236.2, 116, 0.513],
      [248, 160, 0.677],
      [216, 160, 0.791],
      [208.5, 188, 0.894],
      [188, 208.5, 1],
    ],
  },
  {
    className: styles.stationSecondary,
    startDelay: routeDuration / 3,
    points: [
      [54.3, 221, 0],
      [38, 160, 0.17],
      [54.3, 99, 0.339],
      [111.5, 132, 0.514],
      [132, 111.5, 0.592],
      [160, 104, 0.67],
      [160, 72, 0.755],
      [204, 83.8, 0.877],
      [236.2, 116, 1],
    ],
  },
  {
    className: styles.stationTertiary,
    startDelay: (routeDuration * 2) / 3,
    points: [
      [204, 236.2, 0],
      [160, 248, 0.16],
      [116, 236.2, 0.32],
      [99, 265.7, 0.438],
      [54.3, 221, 0.66],
      [38, 160, 0.882],
      [72, 160, 1],
    ],
  },
] as const;

const stationPoints = Array.from(
  new Map(
    stationRoutes.flatMap((route) =>
      route.points.map(([cx, cy]) => [`${cx}-${cy}`, [cx, cy] as const]),
    ),
  ).values(),
);

function NoteCompass() {
  return (
    <figure
      aria-label="A locked note compass with a chromatic rim and melodic routes"
      className={styles.compass}
    >
      <div className={styles.dial}>
        <div className={styles.tickField} aria-hidden="true" />

        <svg
          aria-hidden="true"
          className={styles.compassGrid}
          viewBox="0 0 320 320"
        >
          <circle className={styles.track} cx="160" cy="160" r="122" />
          <circle className={styles.track} cx="160" cy="160" r="88" />
          <circle className={styles.track} cx="160" cy="160" r="56" />
          <g className={styles.radials}>
            {chromaticNotes.map((note, index) => (
              <line
                key={note}
                transform={`rotate(${index * 30} 160 160)`}
                x1="160"
                x2="160"
                y1="98"
                y2="25"
              />
            ))}
          </g>
        </svg>

        <div className={styles.noteRing} aria-hidden="true">
          {chromaticNotes.map((note, index) => (
            <span
              className={styles.notePosition}
              key={note}
              style={
                {
                  "--note-angle": `${index * 30 - 90}deg`,
                  "--note-counter-angle": `${90 - index * 30}deg`,
                } as NoteStyle
              }
            >
              <span className={styles.note}>{note}</span>
            </span>
          ))}
        </div>

        <svg aria-hidden="true" className={styles.routes} viewBox="0 0 320 320">
          <g className={styles.routeGuides}>
            <path d="M160 38 A122 122 0 0 1 221 54.3 L204 83.8 A88 88 0 0 1 248 160 L216 160 A56 56 0 0 1 188 208.5" />
            <path d="M54.3 221 A122 122 0 0 1 54.3 99 L111.5 132 A56 56 0 0 1 160 104 L160 72 A88 88 0 0 1 236.2 116" />
            <path d="M204 236.2 A88 88 0 0 1 116 236.2 L99 265.7 A122 122 0 0 1 38 160 L72 160" />
          </g>
          <g className={styles.routeSnakes}>
            <path
              className={`${styles.route} ${styles.routePrimary}`}
              d="M160 38 A122 122 0 0 1 221 54.3 L204 83.8 A88 88 0 0 1 248 160 L216 160 A56 56 0 0 1 188 208.5"
              pathLength="100"
            />
            <path
              className={`${styles.route} ${styles.routeSecondary}`}
              d="M54.3 221 A122 122 0 0 1 54.3 99 L111.5 132 A56 56 0 0 1 160 104 L160 72 A88 88 0 0 1 236.2 116"
              pathLength="100"
            />
            <path
              className={`${styles.route} ${styles.routeTertiary}`}
              d="M204 236.2 A88 88 0 0 1 116 236.2 L99 265.7 A122 122 0 0 1 38 160 L72 160"
              pathLength="100"
            />
          </g>
          <g className={styles.stationBases}>
            {stationPoints.map(([cx, cy]) => (
              <circle cx={cx} cy={cy} key={`${cx}-${cy}`} r="3" />
            ))}
          </g>
          <g className={styles.stations}>
            {stationRoutes.flatMap((route) =>
              route.points.map(([cx, cy, progress], index) => (
                <circle
                  className={route.className}
                  cx={cx}
                  cy={cy}
                  key={`${route.className}-${cx}-${cy}`}
                  r={index === 0 || index === route.points.length - 1 ? 4 : 3}
                  style={
                    {
                      "--station-delay": `${route.startDelay + progress * routeTravelDuration}s`,
                    } as StationStyle
                  }
                />
              )),
            )}
          </g>
        </svg>

        <div className={styles.lockCore} aria-hidden="true">
          <span className={styles.corePulse} />
          <svg className={styles.lockIcon} viewBox="0 0 48 48">
            <path d="M15 21v-5a9 9 0 0 1 18 0v5" />
            <rect height="19" rx="3" width="28" x="10" y="20" />
            <path d="M24 27v6" />
            <circle cx="24" cy="27" r="2" />
          </svg>
        </div>
      </div>
    </figure>
  );
}

function NavigationButton({ onClick }: { onClick?: () => void }) {
  return (
    <button
      aria-label="Open Note navigation"
      className={styles.navigationButton}
      onClick={onClick}
      type="button"
    >
      <span className={styles.buttonIndex}>01</span>
      <span className={styles.buttonTitle}>Navigation</span>
      <span className={styles.buttonArrow} aria-hidden="true">
        →
      </span>
    </button>
  );
}

export function MainMenu({ onOpenNoteNavigation }: MainMenuProps) {
  return (
    <main
      className={`${styles.menu} bg-canvas text-ink min-h-svh px-4 py-8 sm:px-8 sm:py-12`}
    >
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-2xl font-medium tracking-tight">Tracks Unfold</h1>

        <section className={styles.activeArea}>
          <NoteCompass />
          <NavigationButton onClick={onOpenNoteNavigation} />
        </section>

        <ul
          aria-label="Dormant instrument areas"
          className={styles.dormantAreas}
        >
          {dormantAreas.map((area) => (
            <li key={area}>
              <span>{area}</span>
              <span className={styles.dormantState}>Dormant</span>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
