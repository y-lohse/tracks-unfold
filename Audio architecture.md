---
type: design-decision
status: proposed
---

# Audio architecture

## Decision

Use **Tone.js on top of the Web Audio API** for the first playable audio implementation. Keep it behind one small application-owned audio module rather than exposing Tone objects throughout React.

This is a proposed decision until it has passed a short iPhone Safari and Android Chrome latency test with the initial touch instrument.

## Why this project needs more than file playback

The immediate instrument needs polyphonic note-on and note-off with audible release tails. Later exercises need accurately scheduled simultaneous and sequential notes, metronome ticks, tempo-relative subdivisions and attack/release timing assessment. The longer-term instrument and menu soundtrack add synthesis, sample playback, effects, mixing and changing arrangements.

The Web Audio API is the correct execution layer: its specification includes sample-accurate scheduled playback, parameter automation, oscillators, buffers, routing, effects and low-latency musical use cases ([Web Audio API specification](https://www.w3.org/TR/webaudio/)). The choice is whether to use those primitives directly or through a music-oriented library.

## Candidate comparison

### Tone.js

**Facts**

- The current npm `latest` package is `tone@15.1.22`. It is an ES module, ships its own TypeScript declarations, and depends on `tslib` and `standardized-audio-context`; npm reports 5.4 MB unpacked, which is an installation footprint rather than the final Vite bundle size ([npm package metadata](https://registry.npmjs.org/tone/latest)). The repository is TypeScript and remained active in September 2026 ([repository metadata](https://api.github.com/repos/Tonejs/Tone.js), [latest commit endpoint](https://api.github.com/repos/Tonejs/Tone.js/commits?per_page=1)).
- Tone describes itself as a Web Audio framework for interactive music and provides a transport, tempo-relative time notation, synths, samplers, effects and signal routing ([official README](https://raw.githubusercontent.com/Tonejs/Tone.js/dev/README.md), [API index](https://tonejs.github.io/docs/15.1.22/index.html)).
- `PolySynth` allocates voices and accepts separate `triggerAttack` and note-specific `triggerRelease` calls, matching touch note-on/note-off and chords ([PolySynth API](https://tonejs.github.io/docs/15.1.22/classes/PolySynth.html)). `Synth` combines an oscillator and amplitude envelope, including a separately scheduled release phase ([Synth API](https://tonejs.github.io/docs/15.1.22/classes/Synth.html)).
- `Sampler` maps pitches to samples, repitches missing notes, is polyphonic, and exposes attack/release controls ([Sampler API](https://tonejs.github.io/docs/15.1.22/classes/Sampler.html)). `Player` covers scheduled, looped buffer playback ([Player API](https://tonejs.github.io/docs/15.1.22/classes/Player.html)).
- `Loop`, `Part` and `Sequence` schedule repeating, timestamped and subdivided events on the transport ([Loop API](https://tonejs.github.io/docs/15.1.22/classes/Loop.html), [Part API](https://tonejs.github.io/docs/15.1.22/classes/Part.html), [Sequence API](https://tonejs.github.io/docs/15.1.22/classes/Sequence.html)). The official guide documents quarter-note, triplet and measure notation, BPM changes, and warns that callbacks must use the exact audio time passed to them rather than callback arrival time ([official README](https://raw.githubusercontent.com/Tonejs/Tone.js/dev/README.md)).
- Channels provide volume, pan, mute, solo and sends; the library also includes filters, delays, reverbs and other effects ([Channel API](https://tonejs.github.io/docs/15.1.22/classes/Channel.html), [API index](https://tonejs.github.io/docs/15.1.22/index.html)).
- Audio must be unlocked from a user interaction by awaiting `Tone.start()` before scheduling or playback ([start API](https://tonejs.github.io/docs/15.1.22/functions/start.html), [official README](https://raw.githubusercontent.com/Tonejs/Tone.js/dev/README.md)).

**Assessment**

Tone covers the difficult shared mechanisms the roadmap actually requires: voice allocation, envelopes, musical time and audio-clock scheduling. It works independently of React; keeping its long-lived mutable graph in an external module avoids tying notes or transport callbacks to React renders.

Its cost is a materially larger dependency and API surface than a playback wrapper. An isolated production build using this project's Vite 8.3.0 and imports for `PolySynth`, `Synth` and `start` produced 234.56 kB minified / 59.07 kB gzip on 20 September 2026. This is a reproducible local measurement rather than a library guarantee; the real application bundle must be measured again after integration. Its package declarations were produced by the library's TypeScript build, but compatibility with this project's TypeScript 6 toolchain still needs to be proven by the normal typecheck after installation. Tone also does not remove device output latency or make JavaScript callbacks precise; code must schedule against the supplied audio time.

### Howler.js

**Facts**

- The current release is `howler@2.2.4`, published in September 2023; npm reports no runtime dependencies, 318 KB unpacked, and no bundled TypeScript declaration entry ([npm package metadata](https://registry.npmjs.org/howler/latest), [release](https://github.com/goldfire/howler.js/releases/tag/v2.2.4)). Separate community declarations are available as `@types/howler@2.2.13` ([package metadata](https://registry.npmjs.org/@types/howler/latest)). The repository is not archived and its latest fetched commit is from November 2025 ([repository metadata](https://api.github.com/repos/goldfire/howler.js), [latest commit endpoint](https://api.github.com/repos/goldfire/howler.js/commits?per_page=1)).
- Howler defaults to Web Audio and falls back to HTML media. It documents multiple concurrent instances, sprites, fades, rate, seek, loop, per-sound IDs, global volume/mute, automatic mobile unlock and automatic context suspension; its core is advertised as about 7 KB gzipped ([official repository documentation](https://github.com/goldfire/howler.js#documentation)).
- Its documented API is centered on loading and controlling audio files. It does not expose a musical transport, synth instruments, ADSR note envelopes or sampler pitch maps ([official repository documentation](https://github.com/goldfire/howler.js#documentation)).

**Assessment**

Howler is strong for game sound effects and robust file playback, but it does not solve this project's central synthesis and musical-scheduling problems. Combining it with custom Web Audio would create two abstraction layers while still requiring a transport, voice allocator and envelope system. It is therefore not the primary engine choice.

### Direct Web Audio API

**Facts**

- Web Audio directly supplies sample-accurate source start/stop times in the `AudioContext.currentTime` coordinate system and precise `AudioParam` automation suitable for envelopes ([scheduled source documentation](https://developer.mozilla.org/en-US/docs/Web/API/AudioScheduledSourceNode/start), [AudioParam documentation](https://developer.mozilla.org/en-US/docs/Web/API/AudioParam), [specification](https://www.w3.org/TR/webaudio/)).
- It includes oscillators, decoded buffers, filters, gain, delay, convolution, compression, analysis, custom `AudioWorklet` processing and arbitrary routing ([specification](https://www.w3.org/TR/webaudio/)). TypeScript includes browser DOM API definitions, so these APIs need no additional type package ([TypeScript `lib` documentation](https://www.typescriptlang.org/tsconfig/lib.html)).
- The specification recommends normally using one `AudioContext` per document because contexts are expensive system resources ([Web Audio API specification](https://www.w3.org/TR/webaudio/)).

**Assessment**

Direct Web Audio has no library bundle cost and gives maximum control. It would also make the project responsible for voice allocation, click-free note envelopes, sample loading and pitch mapping, transport lookahead, tempo/meter conversion, event cancellation, lifecycle cleanup and browser differences. Those are real present and near-term requirements, not useful product differentiation. Direct Web Audio should remain available underneath Tone for timing and latency data, not become the initial application-level API.

### No fourth candidate

A fourth library is not justified now. These three options already cover the meaningful decision space: music framework, playback abstraction and native primitives. Adding another candidate would not change the key choice between adopting a maintained musical scheduler/instrument layer and building one.

## Recommendation

Adopt the current stable Tone.js release, initially pinned to its resolved version by the existing npm lockfile. Use Tone for sound generation, samples, effects and scheduling; use browser timing APIs directly only where Tone does not provide the measurement boundary needed for performance scoring.

The choice fits the roadmap as follows:

- **Touch synth:** one `PolySynth<Synth>` can cover the visible octave and later three-octave pitch range; range is application data, not an engine concern. Keep the active note identity from pointer-down through pointer-up/cancel so the exact voice receives note-off.
- **Examples and harmony:** schedule generated note events with explicit audio times; arrays of notes cover simultaneity, while `Part` or `Sequence` can cover ordered material.
- **Rhythm and meter:** represent BPM, meter and subdivision in application-owned exercise data. Convert 2/4, 3/4, 4/4 and later 6/8 into scheduled event positions; do not encode curriculum meaning in the audio engine. Schedule metronome sound through the audio clock, never `setInterval` alone.
- **Tonal context:** schedule the key-setting cadence or accompaniment through the same engine and mix it on a separate channel from prompts, metronome and player feedback.
- **Future soundtrack:** Tone's players, synths, transport, channels and effects are sufficient building blocks for voices, phrases, sections and variations. The arrangement policy remains project domain logic rather than a Tone graph.

## Minimal architecture now

Create one lazily initialized, framework-independent keyboard-synth module. Its interface should contain only the behavior the first instrument needs:

- `noteOn(note)` — unlock/resume audio from the originating user gesture if necessary, then attack the note.
- `noteOff(note)`.
- `releaseAll()` — for view cleanup, blur, visibility interruption and pointer cancellation.

Inside it, start with one app-lifetime `PolySynth<Synth>` connected to Tone's shared destination. Keep mutable Tone nodes and active-note tracking out of React state. React owns controls and displays; the synth module owns its graph and note lifecycle. Tone owns the single shared audio context at this stage, so do not wrap it in a second context-management framework. Add explicit instrument disposal only if instruments later become dynamically created resources rather than app-lifetime modules.

Add master volume and mute only with the first application-level sound control. At that point, place those controls at the shared destination rather than independently on every instrument. Add named mixer channels only when two sound categories actually need independent control.

When the first scheduled exercise is implemented, add one domain event shape such as `{ at, pitch, duration, velocity }` and one scheduling entry point. Only then add a metronome channel and separate prompt/accompaniment channels. Keep score calculation outside Tone.

Do **not** build yet:

- a generic audio plugin system or dependency-injection framework;
- the persistent soundtrack arranger;
- a sample asset manager before a sampled voice is selected;
- custom `AudioWorklet` DSP;
- a generalized mixer, effects rack or bus graph;
- a full sequencer abstraction over Tone's transport;
- a universal instrument interface for hypothetical future engines;
- latency calibration UI before real-device measurements show it is needed.

## Timing and scoring boundary

Scheduled targets must be stored in audio-context time. User attacks and releases arrive on the browser event timeline; fair scoring therefore needs an explicit conversion between input event time and audio output time rather than comparing against when a JavaScript transport callback happened. Web Audio's `getOutputTimestamp()` returns paired `contextTime` and `performanceTime` values for that mapping ([Web Audio API specification](https://www.w3.org/TR/webaudio/)).

Treat this mapping as measurement infrastructure, not part of the synth API. Record raw attack/release timestamps and the scheduled targets so scoring policy can evolve. Output latency varies by platform and device; `baseLatency` and `outputLatency` describe different parts of it, and the specification notes that latency is cumulative ([Web Audio API specification](https://www.w3.org/TR/webaudio/)). Do not promise acoustic millisecond accuracy without testing real devices and, if necessary, adding calibration.

## Mobile startup and lifecycle

Never start menu music on page load. Current browser policy requires creating or resuming audio from a user gesture; MDN's guidance is to create or resume the context inside that gesture ([MDN Web Audio best practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices)). Tone likewise requires awaiting `Tone.start()` from a click or keypress handler ([Tone start API](https://tonejs.github.io/docs/15.1.22/functions/start.html)). Apple's Safari guidance explicitly applies its user-initiation requirement to Web Audio on iOS ([Safari HTML5 Audio and Video Guide](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/Using_HTML5_Audio_Video/Device-SpecificConsiderations/Device-SpecificConsiderations.html)); Chrome may create an early context suspended and requires `resume()` after interaction ([Chrome autoplay policy](https://developer.chrome.com/blog/autoplay/)).

Provide an intentional first sound action or sound-on control, retain a visible mute control, and handle a context returning to `suspended`. Test pointer cancellation, app background/foreground, screen lock, Bluetooth output and silent-mode/device-volume behavior on physical iOS and Android devices.

## Reconsideration triggers

Revisit this decision if any of the following occurs:

- the initial production bundle shows Tone is a material load-time cost after real Vite bundle measurement and route-level lazy loading;
- TypeScript 6 or supported mobile browsers expose unresolved compatibility problems;
- physical-device tests show unacceptable touch latency, release behavior, scheduling drift or resume failures;
- the product settles on file-only playback with no procedural voices, musical transport or generated examples, making Howler sufficient;
- custom DSP becomes core and requires audio-thread processing that Tone cannot express cleanly, justifying targeted `AudioWorklet` code;
- the persistent soundtrack needs streaming long-form stems rather than short decoded buffers, requiring an `HTMLMediaElement`-based path;
- Tone maintenance or stable-release cadence no longer supports the browser/toolchain baseline.

Until one of these triggers is observed, direct Web Audio would spend project effort rebuilding musical infrastructure, while Howler would leave that infrastructure unbuilt. Tone.js is the smallest choice that covers both the immediate instrument and the already documented near-term audio behavior.
