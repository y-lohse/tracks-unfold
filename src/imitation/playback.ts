import { audioPitchName, type Pitch } from "../music";

export type PlaybackSource =
  "reference" | "anchor" | "target" | "response" | "audition";

export interface PlaybackCue {
  readonly pitch: Pitch;
  readonly slotIndex: number | null;
  readonly source: PlaybackSource;
}

export interface PlaybackSection {
  readonly pitches: readonly Pitch[];
  readonly source: PlaybackSource;
  readonly slotIndices?: readonly number[];
  readonly pauseAfter?: number;
}

export interface PlaybackListeners {
  readonly onCue?: (cue: PlaybackCue | null) => void;
  readonly onComplete?: () => void;
}

export interface PlaybackSynth {
  noteOn(pitch: string): void;
  noteOff(pitch: string): void;
  releaseAll(): void;
}

export interface PlaybackScheduler {
  setTimeout(callback: () => void, delay: number): number;
  clearTimeout(handle: number): void;
}

export interface PlaybackController {
  play(
    sections: readonly PlaybackSection[],
    listeners?: PlaybackListeners,
  ): void;
  cancel(): void;
  readonly playing: boolean;
}

export const PLAYBACK_TIMING = {
  noteDuration: 320,
  noteGap: 80,
  sectionPause: 360,
} as const;

const browserScheduler: PlaybackScheduler = {
  setTimeout: (callback, delay) => window.setTimeout(callback, delay),
  clearTimeout: (handle) => window.clearTimeout(handle),
};

export function createPlaybackController(
  synth: PlaybackSynth,
  scheduler: PlaybackScheduler = browserScheduler,
): PlaybackController {
  let handles: number[] = [];
  let generation = 0;
  let playing = false;

  const clear = () => {
    generation += 1;
    for (const handle of handles) scheduler.clearTimeout(handle);
    handles = [];
    playing = false;
    synth.releaseAll();
  };

  const schedule = (callback: () => void, delay: number) => {
    handles.push(scheduler.setTimeout(callback, delay));
  };

  return {
    play(sections, listeners = {}) {
      clear();
      const sequence = generation;
      const populated = sections.filter(
        (section) => section.pitches.length > 0,
      );
      if (populated.length === 0) {
        listeners.onCue?.(null);
        listeners.onComplete?.();
        return;
      }

      playing = true;
      let cursor = 0;
      for (const [sectionIndex, section] of populated.entries()) {
        section.pitches.forEach((pitch, pitchIndex) => {
          const audioName = audioPitchName(pitch);
          const cue: PlaybackCue = {
            pitch,
            slotIndex:
              section.slotIndices?.[pitchIndex] ??
              (section.source === "audition" ? null : pitchIndex),
            source: section.source,
          };
          schedule(() => {
            if (sequence !== generation) return;
            synth.releaseAll();
            synth.noteOn(audioName);
            listeners.onCue?.(cue);
          }, cursor);
          schedule(() => {
            if (sequence !== generation) return;
            synth.noteOff(audioName);
            listeners.onCue?.(null);
          }, cursor + PLAYBACK_TIMING.noteDuration);
          cursor += PLAYBACK_TIMING.noteDuration + PLAYBACK_TIMING.noteGap;
        });
        cursor -= PLAYBACK_TIMING.noteGap;
        if (sectionIndex < populated.length - 1) {
          cursor += section.pauseAfter ?? PLAYBACK_TIMING.sectionPause;
        }
      }

      schedule(() => {
        if (sequence !== generation) return;
        handles = [];
        playing = false;
        synth.releaseAll();
        listeners.onCue?.(null);
        listeners.onComplete?.();
      }, cursor);
    },
    cancel: clear,
    get playing() {
      return playing;
    },
  };
}
