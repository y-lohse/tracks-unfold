import { useEffect } from "react";

import { Keyboard, type KeyboardLabels, type KeyboardNote } from "./Keyboard";
import styles from "./KeyboardPrototype.module.css";
import { keyboardSynth } from "./keyboardSynth";

const labels = {
  C: "C",
  "C sharp": "C♯",
  D: "D",
  "D sharp": "D♯",
  E: "E",
  F: "F",
  "F sharp": "F♯",
  G: "G",
  "G sharp": "G♯",
  A: "A",
  "A sharp": "A♯",
  B: "B",
} satisfies KeyboardLabels;

const disabledNotes = ["D sharp", "A"] satisfies readonly KeyboardNote[];

const pitches = {
  C: "C4",
  "C sharp": "C#4",
  D: "D4",
  "D sharp": "D#4",
  E: "E4",
  F: "F4",
  "F sharp": "F#4",
  G: "G4",
  "G sharp": "G#4",
  A: "A4",
  "A sharp": "A#4",
  B: "B4",
} satisfies Record<KeyboardNote, string>;

function attackNote(note: KeyboardNote) {
  keyboardSynth.noteOn(pitches[note]);
}

function releaseNote(note: KeyboardNote) {
  keyboardSynth.noteOff(pitches[note]);
}

export function KeyboardPrototype() {
  useEffect(() => {
    const releaseAll = () => keyboardSynth.releaseAll();
    const releaseWhenHidden = () => {
      if (document.visibilityState === "hidden") releaseAll();
    };

    window.addEventListener("blur", releaseAll);
    document.addEventListener("visibilitychange", releaseWhenHidden);

    return () => {
      window.removeEventListener("blur", releaseAll);
      document.removeEventListener("visibilitychange", releaseWhenHidden);
      releaseAll();
    };
  }, []);

  return (
    <main className="bg-canvas text-ink flex min-h-svh justify-center py-10 sm:px-8 sm:py-16">
      <div className="flex w-full max-w-lg flex-col justify-center">
        <header className="mb-12 px-4 sm:px-0">
          <p className="text-muted mb-2 text-xs tracking-widest uppercase">
            Instrument study
          </p>
          <h1 className="text-2xl font-medium tracking-tight">One octave</h1>
        </header>

        <div className={styles.keyboardBackdrop}>
          <Keyboard
            labels={labels}
            disabledNotes={disabledNotes}
            onNoteAttack={attackNote}
            onNoteRelease={releaseNote}
          />
        </div>
      </div>
    </main>
  );
}
