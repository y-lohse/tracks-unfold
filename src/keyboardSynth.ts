import { PolySynth, Synth, start } from "tone";

let synth: PolySynth<Synth> | undefined;
const activePitches = new Set<string>();
const soundingPitches = new Set<string>();

function getSynth() {
  synth ??= new PolySynth(Synth).toDestination();
  return synth;
}

function unlock(): Promise<void> {
  return start();
}

function noteOn(pitch: string) {
  activePitches.add(pitch);
  const instrument = getSynth();

  void start()
    .then(() => {
      if (activePitches.has(pitch) && !soundingPitches.has(pitch)) {
        instrument.triggerAttack(pitch);
        soundingPitches.add(pitch);
      }
    })
    .catch((error: unknown) => {
      activePitches.delete(pitch);
      console.error("Unable to start audio", error);
    });
}

function noteOff(pitch: string) {
  activePitches.delete(pitch);

  if (soundingPitches.delete(pitch)) {
    synth?.triggerRelease(pitch);
  }
}

function releaseAll() {
  activePitches.clear();

  if (synth && soundingPitches.size > 0) {
    synth.triggerRelease([...soundingPitches]);
    soundingPitches.clear();
  }
}

export const keyboardSynth = { unlock, noteOn, noteOff, releaseAll };
