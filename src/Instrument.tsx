import { useEffect, useRef, useState } from "react";

import { INSTRUMENT_PRESETS, type InstrumentSound } from "./instrumentPresets";
import { keyboardSynth } from "./keyboardSynth";
import {
  instrumentPresetRequirement,
  isInstrumentPresetUnlocked,
} from "./instrumentUnlocks";
import type { Unlocks } from "./progression";
import { renderNote, spellPitch } from "./noteNavigation";
import { PuzzleKeyboard } from "./PuzzleKeyboard";
import styles from "./Instrument.module.css";

const slots = [
  { id: "tone", label: "Tone" },
  { id: "shape", label: "Shape" },
  { id: "filter", label: "Filter" },
  { id: "effect", label: "Effect" },
] as const;

const MINIMUM_NOTE_MS = 250;

function audioPitch(pitch: number) {
  return renderNote(spellPitch(pitch, "sharp"), false);
}

function InstrumentKeyboard() {
  const [sounding, setSounding] = useState<ReadonlySet<number>>(new Set());
  const notes = useRef(
    new Map<
      number,
      { started: number; timer?: ReturnType<typeof setTimeout> }
    >(),
  );

  useEffect(() => {
    const active = notes.current;
    function stop() {
      for (const note of active.values()) clearTimeout(note.timer);
      active.clear();
      keyboardSynth.releaseAll();
    }
    function interrupt() {
      stop();
      setSounding(new Set());
    }
    function visibilityChanged() {
      if (document.visibilityState === "hidden") interrupt();
    }
    window.addEventListener("blur", interrupt);
    document.addEventListener("visibilitychange", visibilityChanged);
    return () => {
      window.removeEventListener("blur", interrupt);
      document.removeEventListener("visibilitychange", visibilityChanged);
      stop();
    };
  }, []);

  function press(pitch: number) {
    const previous = notes.current.get(pitch);
    if (previous) {
      clearTimeout(previous.timer);
      keyboardSynth.noteOff(audioPitch(pitch));
    }
    notes.current.set(pitch, { started: performance.now() });
    keyboardSynth.noteOn(audioPitch(pitch));
    setSounding((current) => new Set(current).add(pitch));
  }

  function release(pitch: number) {
    const note = notes.current.get(pitch);
    if (!note) return;
    const finish = () => {
      notes.current.delete(pitch);
      keyboardSynth.noteOff(audioPitch(pitch));
      setSounding((current) => {
        const next = new Set(current);
        next.delete(pitch);
        return next;
      });
    };
    // Minimum audition length belongs here, not in rhythm/puzzle playback.
    const remaining = MINIMUM_NOTE_MS - (performance.now() - note.started);
    clearTimeout(note.timer);
    if (remaining > 0) note.timer = setTimeout(finish, remaining);
    else finish();
  }

  return (
    <PuzzleKeyboard
      octaves={[4]}
      onPitchPress={press}
      onPitchRelease={release}
      soundingPitches={sounding}
    />
  );
}

export function Instrument({
  sound,
  unlocks,
  onChange,
  onBack,
  storageError,
}: {
  sound: InstrumentSound;
  unlocks: Unlocks;
  onChange: (sound: InstrumentSound) => void;
  onBack: () => void;
  storageError: string | null;
}) {
  return (
    <main className="bg-canvas text-ink flex h-dvh flex-col px-4 pt-6 sm:px-6 sm:pt-8">
      <div className="mx-auto flex min-h-0 w-full max-w-xl flex-1 flex-col gap-6">
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="flex flex-col gap-6">
            <header className="flex items-center gap-4">
              <button
                aria-label="Back"
                className="text-muted focus-visible:outline-accent flex size-11 cursor-pointer items-center justify-center rounded-full focus-visible:outline-2"
                onClick={onBack}
                type="button"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="size-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="m14 6-6 6 6 6" />
                </svg>
              </button>
              <h1 className="text-xl font-semibold">Instrument</h1>
            </header>

            <div className="grid grid-cols-2 gap-3">
              {slots.map((slot) => (
                <label
                  className="text-muted flex min-w-0 flex-col gap-1.5 text-xs"
                  key={slot.id}
                >
                  {slot.label}
                  <select
                    className="border-rule bg-instrument-face text-ink focus-visible:outline-accent min-h-11 w-full rounded-lg border px-3 py-2 text-base focus-visible:outline-2"
                    value={sound[slot.id]}
                    onChange={(event) => {
                      if (
                        isInstrumentPresetUnlocked(
                          slot.id,
                          event.target.value,
                          unlocks,
                        )
                      ) {
                        onChange({ ...sound, [slot.id]: event.target.value });
                      }
                    }}
                  >
                    {INSTRUMENT_PRESETS[slot.id].map((preset) => {
                      const unlocked = isInstrumentPresetUnlocked(
                        slot.id,
                        preset.id,
                        unlocks,
                      );
                      const requirement = instrumentPresetRequirement(
                        slot.id,
                        preset.id,
                      );
                      return (
                        <option
                          key={preset.id}
                          value={preset.id}
                          disabled={!unlocked}
                        >
                          {preset.label}
                          {unlocked ? "" : ` — ${requirement ?? "Locked"}`}
                        </option>
                      );
                    })}
                  </select>
                </label>
              ))}
            </div>
            {storageError ? (
              <p className="text-error text-sm" role="alert">
                {storageError}
              </p>
            ) : null}
          </div>
        </div>
        <div className={`${styles.keyboardDock} shrink-0`}>
          <InstrumentKeyboard
            key={`${sound.tone}:${sound.shape}:${sound.filter}:${sound.effect}`}
          />
        </div>
      </div>
    </main>
  );
}
