---
type: puzzle-type
status: provisional-concept
---

# Rhythm performance

## Role

Develop pulse, timing, duration, subdivision, meter and syncopation through a full performance game, using a scrolling piano roll in the spirit of rhythm games with held notes. This is the planned primary home for the performance and recognition aspects of R1–R7. Independently constructing rhythms is deferred; a separate construction puzzle is not an immediate requirement.

Use the shared [[Run director]] for lives, progression and assessment. The piano-roll direction is agreed, but interaction details, generation, timing tolerances and scoring remain provisional rather than an implementation-ready specification.

## Player action

Play any available note at the indicated time, hold it for the indicated duration, and leave the indicated silences.

The instrument offers a fixed scale as a sound palette. Pitch choice is free and unscored; using the same note throughout is always sufficient. Changing notes is optional expression, not another demand. The scale limits the available pitches but does not guarantee every sequence sounds harmonious.

One rhythmic lane and one playable surface are sufficient for the foundational game. Multiple pitch lanes, chord shapes and finger-selection demands are not required. If a keyboard or other instrument offers optional pitch expression, the rhythmic task remains the same.

## Piano roll and performance loop

1. Establish the tempo and meter with an audible count-in and visible beat grouping.
2. Scroll upcoming notes toward a fixed play line. A note's leading edge indicates its attack, its length indicates its duration, and its trailing edge indicates release.
3. The player presses, holds and releases as those edges cross the line. Gaps are required silence, not unscored waiting time.
4. Keep the pulse and bar grouping visible and audible through notes, holds and rests. Musical backing can make the performance satisfying without adding pitch requirements.
5. Give concise timing feedback during play and a readable summary afterward. Exact feedback and puzzle-success thresholds remain open.

Design first for portrait phones, with a comfortable input area and enough preview to anticipate rather than merely react. Represent time in beat-relative distances: changing tempo should preserve a pattern's proportions while changing how quickly it passes the play line.

Distinguish main beats, subdivisions and bar boundaries visually. Reinforce the downbeat audibly through the metronome or accompaniment; thicker lines alone do not establish meter. Use an instrument whose attack, sustain and release make the player's timing audible. Backing should not mask mistakes or automatically perform the player's part in a way that makes input irrelevant.

Both onset and release matter. A two-beat hold, two one-beat attacks, and a one-beat note followed by a one-beat rest must require different actions and produce distinguishable results. A hold must not retrigger at internal beat markers.

## Musical vocabulary

Connect the roll's geometry to duration names and notation as those concepts are introduced. Show familiar note and rest symbols alongside lengths or in focused explanations without requiring staff-pitch reading or crowding every target with text.

Make ties and dotted durations explicit when introduced. A tie joins written durations into one uninterrupted hold; it does not request a new attack at the join. A dot adds half the original duration. The roll should expose these relationships, rather than rendering everything as anonymous long rectangles.

In simple quarter-note-beat meters, introduce quarter, eighth and sixteenth notes as one beat, half a beat and a quarter beat respectively. Do not teach those beat counts as universal: in the later 6/8 form, the main beat is a dotted quarter, divided into three eighth notes.

## Learning coverage

### R1 — Pulse and rhythm

[[R1 - Pulse and rhythm]] begins with playing on a steady pulse. Later, rests and subdivisions make the performed rhythm clearly distinct from the metronome beat.

Progress from explicit beat targets to patterns containing gaps and holds while the pulse continues independently. Later explore reduced visual timing guidance over short, familiar stretches while retaining an audible pulse or clear accompaniment. This supports anticipation and maintaining the beat rather than only reacting to approaching objects; assistance should fade gradually, not disappear as a punishment.

### R2 — Tempo and relative timing

[[R2 - Tempo and relative timing]] develops through varying BPM. Reuse recognizable rhythmic patterns at different tempos so the player hears the speed change and preserves the same relative attacks, holds and rests. Keep beat-relative geometry consistent rather than making the same pattern appear structurally different at each speed.

Begin with a stable tempo during each performance and a fresh count-in when it changes between performances. Higher BPM is one challenge control, not a substitute for introducing new rhythmic relationships or a requirement to force every learner toward extreme speed. In compound meter, specify which note value the BPM counts.

### R3 — Durations and rests

[[R3 - Durations and rests]] requires both note starts and releases to matter. Distinguish holding a note across beats, playing briefly followed by silence, and retriggering on the next beat.

Show held-note durations and make silence an intentional part of the contract. Releasing too early, holding into a rest, and adding an attack during silence are distinct timing errors. Include patterns whose bars contain substantial silence, not only streams of targets.

Duration names and fractional relationships accompany the corresponding shapes. Performing supplied durations develops recognition and execution; independently choosing durations to construct a pattern remains deferred.

### R4 — Beat subdivisions

[[R4 - Beat subdivisions]] develops by placing note starts between beats, initially on half-beat and then quarter-beat positions. A visible subdivision grid can support understanding while the metronome maintains the main pulse.

### R5 — Meter and downbeats

[[R5 - Meter and downbeats]] develops through recurring beat groups across several bars. Explore visible bar grouping and a distinct first-beat metronome sound or visual emphasis.

Repeat short patterns across bars. Later include patterns with no played note on the downbeat while the metronome still marks it: the first beat exists even when the player is silent.

Vary meter meaningfully so players hear and anticipate the grouping, not merely follow different visual separators. Initial curriculum coverage is 2/4, 3/4 and 4/4. Use backing and count-ins that make their recurring groups audible, including examples with similar note activity but different metric grouping.

Performing patterns that fit the supplied meter is in scope. Independently constructing those patterns is deferred.

### R6 — Offbeats, ties and syncopation

[[R6 - Offbeats ties and syncopation]] follows familiarity with subdivisions and meter. Place attacks between beats, sustain through beat boundaries and contrast those holds with patterns that reattack on the beat.

For example, against a clear 4/4 pulse, rest for half of beat 1, attack on its second half, and hold until halfway through beat 2. Contrast this with a version that adds a fresh attack on beat 2. The beat marker passes through the sustained note in the first version; it does not instruct another press.

Introduce ties across beats and later bar boundaries, along with relevant dotted durations. Keep the pulse clearly established so displaced attacks and sustained accents have a reference. Not every offbeat note is automatically syncopation; choose and demonstrate simple patterns whose accent or continuation works against the expected beat emphasis.

The game teaches hearing, reading and performing these relationships. Independently constructing syncopation remains deferred.

### R7 — Triple subdivision and compound meter

[[R7 - Triple subdivision and compound meter]] extends the same performance model after subdivision and meter familiarity. Compare two equal subdivisions within a main beat with three, using matched main-beat tempos and explicit grouping. Introduce simple triplets in a familiar meter before or alongside the compound-meter examples.

For 6/8, show and sound two main beats, each containing three eighth-note subdivisions. Contrast this with 3/4's three main beats, each dividing into two eighth notes. Both bars can contain six eighth notes, but their main-beat grouping is different. Do not present 6/8 as six equivalent main beats or confuse three subdivisions of one beat with three beats in a bar.

Make triplet markings, the dotted-quarter main beat and the 6/8 time signature part of the teaching. Advanced polyrhythms and extensive odd-meter study are outside this foundational scope.

## Scope boundaries

Keep non-rhythmic performance demands out of the foundational type. Do not require specific pitches, melodic memory or rapid navigation to particular instrument positions.

Prescribed or familiar melodies are a possible later integration variant or separate type, combining pitch navigation and rhythm. They are not required for this concept. Familiar melodies would introduce authored musical material and cannot be assumed familiar to every player.

Rhythmic challenge can come from rests, holds, subdivisions, tempo and tracking patterns across bars without scoring pitch choice. Musical backing and recognizable recurring phrases should support enjoyment, but optional melodic decoration must not be necessary to make the game work.

Independent rhythm construction in R3, R5 and R6 remains a future design question. Do not add an editor, assembly mode or separate construction game merely to claim those abilities now.

## Progression, generation and assessment

Introduce a new rhythmic relationship with a clear demonstration and manageable performance before combining it with other demands. Familiarity, not perfect completion of a whole branch, supports progression: pulse first; durations and rests; subdivisions and simple meter; then offbeats, ties, syncopation and triple subdivision.

Generate short, musically legible phrases with repetition, variation and room to breathe, not only random attacks. Repeat patterns across bars to establish grouping, then vary a feature the player can hear and anticipate. Keep duration, silence and bar accounting valid, including held notes crossing boundaries.

Separate challenge controls such as tempo, attack density, rhythmic vocabulary, phrase length, preview and guidance. Slower syncopation can introduce a new relationship without simultaneously demanding faster reactions. Do not increase every control together or treat additional lanes as the default next difficulty level.

Assess patterns across many performances, accounting for supplied guidance and the rhythmic demands actually exercised. Isolated timing mistakes are expected; long-term evaluation need not attach a separate recognition quiz to each pattern. Reduced visual support and varied musical contexts can strengthen the listening component without requiring a separate game.

Performance scores can reflect early or late attacks, premature or late releases, missed notes and extra attacks. Exact weights and thresholds remain open. Distinguish recognizing or interpreting a rhythm from executing it accurately, and account for device latency and motor demands when interpreting results. Multiple event errors within a phrase do not automatically mean multiple lost lives; define phrase-level success under the shared director.

## Open design work

- Refine scrolling direction, beat-relative spacing, preview and touch interactions for portrait phones.
- Define audio scheduling, input-latency handling, reasonable onset/release tolerances and feedback that does not distract from the next event.
- Choose count-ins, backing and instrument behavior that keep pulse, holds and releases audible.
- Define phrase boundaries, summaries and the mapping from performance errors to puzzle success under the shared lives-and-runs structure.
- Develop pattern-generation rules and supported introductions for R1–R7, with notation and terminology attached to the relevant experiences.
- Test that changing meter is perceptually meaningful, especially the distinction between 3/4 and 6/8.
- Test whether play remains enjoyable with a single repeated pitch and whether lighter guidance develops anticipation rather than merely increasing reaction difficulty.

No numerical scoring model, fixed difficulty ladder or implementation brief is specified yet.
