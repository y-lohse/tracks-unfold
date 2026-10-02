---
type: puzzle-type
status: provisional-concept
---

# Progression Wordle

## Role

Recognize a heard chord progression through a Wordle-style listening and deduction game. The opening form supplies the key; an agreed unknown-key extension asks the player to identify the key and progression together. Each chord position contains a whole chord expressed as a Roman numeral. The player does not construct individual chord notes or perform on an instrument.

The concept is promoted for further design. Positional feedback replaces the earlier Progression safe proposal's count-only feedback. Grid size, attempt budget, scoring and detailed run integration remain provisional. Use the shared [[Run director]] for lives, progression and assessment; guesses within one puzzle are not automatically separate life-losing failures.

## Opening form: supplied key

1. Establish the key with a short musical introduction and a replayable tonic reference. Keep the key fixed throughout the puzzle.
2. Play the hidden progression. Its recording remains available for unlimited replay from the beginning, not as a hint to unlock.
3. The player enters a proposed progression into a row of the grid, using whole-chord numeral buttons.
4. Allow editing, individual chord auditions and playback of the proposed progression before submission.
5. On submission, score every position and preserve that row as visible evidence for subsequent attempts.
6. Continue until the progression is identified or the attempt budget is exhausted. Reveal and replay the answer at the end so the player can hear the relationships with their identities known.

Only submitting a row spends an attempt. Listening, auditioning and editing do not. There is no daily limit; generate many puzzles with different progressions and keys across repeated play.

An opening format to test is **four chord positions and six attempts**. These are not fixed balance constants. Shorter introductory puzzles can use three positions and a smaller taught vocabulary; there is no requirement to copy Wordle's five-letter length.

## Feedback and repeated chords

Each submitted position receives one of three results:

- **Correct:** this chord belongs in this position.
- **Misplaced:** another occurrence of this chord belongs elsewhere in the answer.
- **Absent/excess:** this occurrence does not belong in the answer.

Use symbols or another non-color cue alongside color. The feedback concerns chord identity and position, not whether the guessed voicing matches the recording.

Follow Wordle's duplicate rules: assign exact matches first, then allocate remaining target occurrences to unmatched guesses. Once those occurrences are exhausted, further copies are excess. A duplicate receiving an excess marker does not establish that its chord is absent from the progression.

The chord palette can retain discovered information, but must preserve this distinction. A chord confirmed present must not be globally marked absent because an extra copy received an excess result.

## Worked example

Hidden progression: **I – vi – IV – V**.

| Attempt | Position 1 | Position 2 | Position 3 | Position 4 |
| --- | --- | --- | --- | --- |
| I – IV – V – I | Correct | Misplaced | Misplaced | Excess |
| I – vi – V – IV | Correct | Correct | Misplaced | Misplaced |
| I – vi – IV – V | Correct | Correct | Correct | Correct |

The first I in the opening attempt uses the target's only I. The last I is therefore excess. The middle two chords are present but misplaced.

The second attempt narrows the remaining uncertainty to the last two positions. Feedback gives the player specific places to focus their next listen, rather than merely reporting that the whole progression was wrong.

## Chord input and musical presentation

Use a palette of numerals from the current taught vocabulary, such as I, ii, IV, V and vi. The set need not include every diatonic chord at the outset. Case and other quality markings are part of chord identity, not decorative formatting.

Introductory buttons can display both numeral and chord name: in C major, I · C, ii · Dm, IV · F, V · G and vi · Am. Audition plays the corresponding whole chord in the established key. Pitch-reference support avoids an absolute-pitch requirement.

Start with clear root-position triads and equal supplied timing. Keep comparisons easy to hear before varying voicing, register or instrumentation. The response is a chord-degree sequence; the player need not reproduce the target's exact register, doubling, timbre or instrumental articulation.

Include meaningful contrasts between chords of the same quality. Distinguishing I, IV and V requires hearing their relationships within the key, not merely recognizing that each is major.

Any complete row using the offered vocabulary can be submitted and scored against the target. Do not reject a guess simply because it is not a preferred conventional progression. The answer is the specific heard sequence, not the most aesthetically pleasing arrangement.

## Unknown-key form

This is the agreed extension for [[K3 - Identifying a key]], not a separate questionnaire before the game. A short passage establishes a clear key without naming it. Each submitted row contains a **key hypothesis plus a numeral sequence**:

**[Key] [Chord 1] [Chord 2] [Chord 3] [Chord 4]**

The guessed key determines the realization of the numeral buttons and the proposed progression. Changing that key changes what the row means and sounds like. The puzzle is solved only when both the key and chord sequence match the clearly established passage.

### Listening and input support

- Keep unlimited passage replay, chord auditions and candidate-progression playback. Submit the key and sequence together as one attempt, not as separately charged questions.
- Provide a neutral named pitch reference or audition keyboard so absolute pitch is unnecessary. Do not supply a labelled tonic reference that reveals the answer.
- Build the chord palette from the guessed key and taught vocabulary, not the hidden true key. A true-key palette would leak the interpretation the player is meant to determine.
- Introductory forms can offer a few plausible key candidates and optional note or chord-content readouts. Relative-key alternatives ensure that a shared collection alone does not always settle the answer.
- Freeze each submitted row's key and realization along with its feedback. Later key changes apply to the new guess, not to previous rows.

### Chord feedback and key feedback

Apply ordinary duplicate-aware Wordle feedback to the **actual chord identities realized by the guess**, rather than comparing numeral strings without regard to key. Separately indicate whether the proposed key matches the established context. The key result is not a chord occurrence and does not participate in misplaced/duplicate scoring.

For example, suppose a passage clearly establishes C major and the target sequence is C–F–G–C:

| Guessed key | Numerals | Realized chords | Result |
| --- | --- | --- | --- |
| C major | I–IV–V–I | C–F–G–C | Key and all chord positions correct |
| A minor | III–VI–VII–III | C–F–G–C | All chord positions correct; key incorrect |

The second interpretation uses the same collection and identifies every chord sound, but does not identify the home established by this passage. Feedback can say: **All four chord sounds identified. The tonal home is not correct yet.** Use this example only after the corresponding minor-key numeral vocabulary is available.

Preserve realized chord names alongside submitted numerals to make feedback interpretable. A correct IV in C major means F major was correct at that position; it does not establish that IV in another guessed key is correct. Palette history must be keyed to actual chord identity or to a specific key interpretation, rather than carrying unqualified numeral colors across key changes.

### Musical evidence and fairness

Generate clear passages with tonic, collection and cadential evidence available together. Phrasing and emphasis establish home; notes and chord qualities support or contradict candidates; harmonic endings help establish the interpretation. The player submits an interpretation through the row, not three separate explanations of these clues.

A short contextual lead-in can establish the key of a selected target progression. Distinguish that lead-in from the chord events the player must enter. An ambiguous four-chord loop is not made unambiguous by the generator secretly assigning it a key: avoid such puzzles rather than marking another plausible interpretation wrong.

Across repeated play, vary what is informative. Relative-key comparisons expose the limits of note collection alone; parallel-key comparisons exercise quality and collection differences. Include passages beginning away from tonic and varied endings, while keeping the complete passage clear. Do not teach that the first or last chord invariably names the key. Modulation and deliberately ambiguous excerpts are outside this introductory scope.

## Teaching and progression

The intended learning loop is **listen → form a hypothesis → compare → submit → listen again with better information**. Feedback supplies useful evidence without requiring immediate recognition of the entire sequence.

Begin with a small demonstrated vocabulary, short progressions, named reference buttons and clear tonic establishment. For example, contrast I–IV–I and I–V–I before asking the player to distinguish several longer patterns and endings.

Later vary progression length, vocabulary and realization separately. Occasionally revisit a degree pattern in a newly established key so familiarity transfers through harmonic relationships rather than only through its original pitches. Add minor and seventh-chord vocabulary when the relevant relationships and sounds have been introduced.

Introduce the unknown-key form after relevant tonic, major/minor-context and cadence familiarity. Keep sequences short, the chord vocabulary small and comparison tools generous while adding key uncertainty. Candidate-key selection can broaden separately from progression length and harmonic vocabulary.

A player with a strong ear may solve a puzzle immediately. A learner can combine partial recognition with feedback and deduction. Both are legitimate play; do not add an extra recognition quiz or try to prevent deduction from contributing to a win.

## Learning coverage and assessment

The principal target of the supplied-key form is [[H9 - Recognizing progressions by ear]]: identifying the chord sequence or degree pattern of a short heard progression in an established key.

The unknown-key extension adds [[K3 - Identifying a key]]: determine the key using tonic, collection and cadential evidence in a clear passage. Its relevant foundations include [[K2 - Major and minor tonal contexts]] and [[H4 - Tonal endings and cadences]].

Relevant foundations are [[C3 - Hearing triad qualities]], [[K1 - Hearing the tonic]], [[H2 - Roman-numeral progressions]] and [[H4 - Tonal endings and cadences]]. Familiarity supports entry; perfect mastery of each branch is not required before trying short, supported forms.

This connects the quality listening developed in [[Chord draft]] with the chord–numeral relationships exercised in [[Numeral dominoes]]. Identifying an unknown key belongs to the explicit extension, not the supplied-key opening task. Supplied playback timing leaves rhythmic reconstruction and performance outside both answer contracts.

Evaluate patterns across many varied puzzles, accounting for vocabulary, support and accumulated feedback. An individual solve may involve strong listening, deduction or some luck. That does not require excluding it from the game or treating each row as an isolated mastery verdict. Exact evidence weighting remains design work under the shared director.

## Generation and open design work

- Generate short musical progressions within the taught vocabulary rather than arbitrary symbol codes. Include repeated chords, differing orders and contrasting endings.
- Vary openings and endings within that vocabulary instead of making fixed positions permanently inferable without listening.
- Use varied roots, keys and realizations across puzzles while keeping each individual puzzle's tonal reference stable.
- Test grid length and attempt budgets together with vocabulary size and introductory assistance. Longer progressions and more chord symbols are not the only sources of difficulty.
- Keep all rows, duplicate feedback and chord controls legible on portrait phones. Unknown-key rows must retain their key and realized chord identities without making the grid unwieldy.
- Validate tonal clarity for unknown-key material, including any contextual lead-in, rather than relying solely on the intended key stored by the generator.
- Test key-aware chord scoring, duplicate handling and palette history when different key hypotheses realize the same chords. All-correct chord feedback alone must not end an unknown-key puzzle with an incorrect key hypothesis.
- Stage key uncertainty independently from harmonic and auditory complexity; test whether the combined interpretation remains approachable.
- Resolve editing, audition and comparison gestures, along with the exact form of end-of-puzzle feedback.
- Define how completing or exhausting a puzzle maps to the shared run's success and lives. Do not silently turn six guesses into six lives or add a daily-play restriction.
- Determine whether scores beyond solving the puzzle are useful; no guess-count reward scheme or hard mode is settled.

Progression splice remains an unpromoted alternative, not an additional mode required by this concept.
