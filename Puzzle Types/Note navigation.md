---
type: puzzle-type
status: behavioral-spec
---

# Note navigation

## Scope and role

Teach note structure, numerical pitch distances, and named-interval construction and identification. Listening is not the primary activity. Use the shared [[Run director]] for focus, assessment, escalation, lives, and run completion.

This specification settles behavior. Numerical thresholds, assessment formulas, and pacing constants will be tuned during implementation and playtesting. Submission gestures, buttons, and detailed control layouts are out of scope.

## Player task

Produce both question forms:

- **Forward:** give a starting note and an upward or downward distance; ask for the resulting note.
- **Reverse:** give two ordered, named notes; ask for their numerical distance or named interval.

Distances can be expressed numerically, through interval names with numerical reminders, or through interval names alone. These are variations within one puzzle type, not separate unlockable types.

Use a regular keyboard as an illustration, not an answer surface or playable instrument. It introduces the instrument used interactively in later puzzles. Illustrate the starting note for forward questions and both supplied notes for reverse questions. Keep note positions stable; do not label every key during the question. Players answer separately from the keyboard.

Include octave identifiers wherever register matters. For example, B3 up one semitone reaches C4. Before octave-boundary movement is available, show the single keyboard register containing the question. After it becomes available, show the full three-register keyboard range. The displayed range remains distinct from the maximum movement distance.

## Learning coverage

- [[P3 - Natural-note sequence]]: repeating note order and octave transitions.
- [[P4 - Semitones tones and accidentals]]: semitone and whole-tone movement, natural-note gaps, sharps and flats.
- [[P5 - Enharmonic equivalents]]: equivalent pitch names and context-sensitive spelling.
- [[I1 - Semitone distances]]: construct and identify ascending and descending distances.
- [[I2 - Interval names and construction]]: interpret, construct, and identify correctly spelled named intervals.
- Reinforces the structural component of [[P2 - Octaves and note identity]], without establishing auditory octave recognition or equivalence.

Does not assess [[I3 - Hearing intervals]]. Identifying an interval between supplied note names is not the auditory task in [[Interval identification]]. Optional sound would not itself demonstrate listening competence.

## Skills and generation controls

### Separately tracked skills

Track proficiency and certainty separately for:

| Skill | What the player supplies |
| --- | --- |
| Numerical destination construction | The destination reached from a note by a numerical distance |
| Numerical distance identification | The numerical distance between supplied notes |
| Interval-name interpretation | The meaning of a supplied interval name when constructing a destination |
| Interval-name identification | The interval name for a supplied note relationship |

Forward success does not establish reverse proficiency. Unsupported named-interval questions can exercise navigation and vocabulary together; assessment attributes evidence according to the demands actually present. Supplied numerical reminders are not evidence of independent interval-name recall. Merely encountering a name, including as a distractor, is not demonstrated proficiency.

### Generation controls

The director targets skills, then selects a question form and three difficulty controls, each on a 0–1 scale:

| Control | Lower settings | Increasing settings |
| --- | --- | --- |
| Navigation demand | Small ascending whole-tone movements | More distances, semitones, and descending movements |
| Interval-name demand | Numerical distances only | Names with numerical equivalents, then names without reminders |
| Answer-choice breadth | Three candidates | Four candidates, six candidates, then full choice |

A control is not necessarily an independently assessed skill. In particular, answer-choice breadth changes the support provided by the answer set; it does not require an invented answer-options proficiency score. Introducing a name with its numerical equivalent creates exposure, not necessarily a harder calculation.

Focus is the director's intent to challenge skills, expressed through question selection and settings—not solely question frequency. A navigation focus can keep vocabulary and answer-choice demands comfortable. A vocabulary focus can use comfortable navigation demands. Detailed mappings from skill targets to settings are implementation-tuning work.

## Movement and spelling boundaries

- Every question involves movement: **1–12 semitones inclusive**, ascending or descending.
- One octave is the absolute maximum, not merely an introductory limit. Compound intervals are out of scope.
- Zero-distance and repeated-note questions are excluded.
- Octave-boundary crossings are allowed within the distance limit after the relevant register repertoire becomes available.
- Use natural notes, single sharps, and single flats. **Double accidentals are excluded at every difficulty.**

Do not add a natural-note-only introductory gate. E up one whole tone may yield F♯ even at low settings. Ordinary sharps and flats do not require a separate accidental control or unlock.

For numerical movement, default to sharps ascending and flats descending. This is a presentation convention, not a correctness restriction. Named intervals instead require the spelling determined by their letter span and pitch distance.

Edge enharmonic spellings E♯, B♯, C♭, and F♭ become available only after strong readiness in the relevant numerical-navigation and interval-name skill. Once available, they remain valid anchors and destinations, and the keyboard label must preserve the spelling used by the question. Generate named-interval anchors whose correct endpoints fit the allowed spelling vocabulary. For example, use E♭ to G for a major third rather than D♯ to F𝄪; do not substitute G for F𝄪 and call D♯–G a major third.

### Assessment-gated register repertoire

Before the relevant numerical-navigation skill is familiar, both notes must remain within the same C–B octave register. Forward eligibility derives from numerical destination construction; reverse eligibility derives from numerical distance identification. Forward and reverse readiness remain separate.

Once that skill is familiar with sufficient certainty, octave-boundary crossings join the cumulative repertoire. Navigation demand then controls which eligible movements are sampled. Run pressure and high control settings must not override repertoire readiness. If a selected distance has no valid within-register placement, exclude that distance until crossings are available rather than silently crossing the boundary.

Register readiness is not another tracked skill or difficulty control. It is a puzzle-specific eligibility rule derived from the existing assessment. Likewise, edge enharmonic readiness is a later eligibility rule rather than an exposure counter or first-run exception.

## Navigation-demand progression

One fine-grained, cumulative ladder controls both movement categories and distance ranges. Each milestone expands the generator's repertoire. Distance range is not a separate control.

Start with small ascending whole-tone movements. Interleave distance expansion with the introduction of ascending semitones, descending whole tones, and descending semitones. Retain earlier movements rather than replacing them.

Sample available numerical movement categories equally. After ascending semitones enter, ascending whole-tone and ascending semitone questions each have a 50% category probability. Equal category sampling does not imply equal probability for every pitch distance.

### Working milestone table

The agreed shape is eleven cumulative milestones, with whole-tone ranges reaching 1–6 in both directions by milestone 8 and semitone ranges expanding afterward. The intermediate ranges below are implementation starting values, not separately validated constants. Uniform sampling within a category is the proposed baseline to tune.

Each range contains integer distances in that column's unit. A dash means the category is not yet available.

| Milestone | Up, whole tones | Up, semitones | Down, whole tones | Down, semitones |
| --- | --- | --- | --- | --- |
| 1 | 1 | — | — | — |
| 2 | 1–2 | — | — | — |
| 3 | 1–2 | 1–2 | — | — |
| 4 | 1–3 | 1–4 | — | — |
| 5 | 1–4 | 1–4 | 1–2 | — |
| 6 | 1–5 | 1–4 | 1–3 | 1–2 |
| 7 | 1–6 | 1–4 | 1–4 | 1–4 |
| 8 | 1–6 | 1–6 | 1–6 | 1–6 |
| 9 | 1–6 | 1–8 | 1–6 | 1–8 |
| 10 | 1–6 | 1–10 | 1–6 | 1–10 |
| 11 | 1–6 | 1–12 | 1–6 | 1–12 |

Milestones are settings along the 0–1 control, not puzzle numbers, permanent unlocks, or separate readiness gates. Their exact thresholds remain tunable.

Whole-tone questions use integer counts of 1–6 whole tones; semitone questions use integer counts of 1–12 semitones, including even counts. “Up 4 semitones” and “up 2 whole tones” are valid variants of the same movement. Reverse numerical prompts must distinguish the requested unit, or accept equivalent distances without making them competing single-answer options.

## Interval-name progression

### Vocabulary and introduction order

1. Major second and major third.
2. Minor second and minor third.
3. Perfect fourth, perfect fifth, and perfect octave.
4. Minor and major sixths.
5. Minor and major sevenths.
6. Tritone, followed by its augmented-fourth and diminished-fifth spellings.

This covers every allowed pitch distance. Other augmented and diminished intervals are outside the generated named-interval vocabulary, not musically invalid. Both movement directions use the same vocabulary, with spelling interpreted in the requested direction.

### Numerical support

Introduce new names with one numerical equivalent, then require recall at later milestones. Use a unit already available in the navigation repertoire for that direction; do not introduce semitone terminology through support before semitone movement is available. When both units can express the movement, prefer the first available supporting category rather than showing both equivalents. Retain earlier vocabulary. For example:

| Level of support | Forward question | Reverse answer vocabulary |
| --- | --- | --- |
| Numerical | C4, up 2 whole tones | Numerical distances |
| Supported name | C4, up a major third — 2 whole tones | Names paired with numerical distances |
| Unsupported name | C4, up a major third | Names without distance reminders |

These are progression levels, not three rigid phases for the whole game. Estimate the player's skill and challenge the next level; failures are part of learning and feed ordinary assessment. Do not add per-interval exposure counters, separate introduction gates, or a special probe scheduler. Separate forward and reverse assessment does not require a progression record for each interval in each form.

### Combining the controls

A named-interval question must fit both controls:

- Navigation demand permits its physical distance and direction.
- Interval-name demand permits its name and determines numerical support.

A movement is eligible if it occurs anywhere in the current navigation repertoire, regardless of whether it entered through whole-tone or semitone instructions. Navigation milestone 1 permits an ascending major second; milestone 2 also permits an ascending major third. Descending named intervals require descending movement to be available. Vocabulary settings must not silently override navigation settings.

### Tritone

First introduce **tritone** as six semitones or three whole tones, with numerical support. Later introduce the specific spellings: C–F♯ is an augmented fourth; C–G♭ is a diminished fifth.

Accept “tritone” when asking for the distance name. Require the appropriate specific spelling when explicitly asking for it. Do not offer “tritone” and the correct specific name as competing single-answer choices without distinguishing what is requested. A generic forward tritone instruction does not itself uniquely specify a destination letter.

## Answer contract and teaching

- Numerical movement determines pitch distance, not a unique enharmonic spelling. Accept valid equivalent spellings or avoid presenting them as competing single-answer choices.
- A specifically named interval determines letter span and pitch distance; assess the corresponding spelling.
- A correct pitch class in the wrong octave is not the requested destination when register is specified.
- Answers and distractors must respect the applicable numerical, interval, and note-spelling vocabularies.

Teach the natural-note gaps B–C and E–F as one semitone without implying that B♯ or E♯ are invalid.

Teach that interval number counts letter names, including both endpoints, while quality determines pitch distance within that span. A third above C uses E: C–D–E. A minor third above C is E♭; D♯ has the same sounding pitch in the tuning used here but forms an augmented second. Introductions and feedback must explain this logic rather than assume players already know the convention.

Vary starting notes, direction, and octave crossings within the selected repertoire rather than teaching a single memorized route.

## Answer-choice breadth

Use **3 → 4 → 6 → full choice**. Cap candidate counts at the distinct valid answer vocabulary; six choices already give full choice for integer whole-tone distances.

Full choice removes the curated shortlist. It uses structured answers rather than text entry:

- Destination: note letter, single accidental or natural, and octave where needed.
- Numerical distance: a value in the requested unit.
- Named interval: number and quality, with tritone available when the prompt requests that distance name.

Keep answers separate from the illustrative keyboard. Submission interactions and layouts are outside this specification.

### Distractors

Random distinct incorrect answers are sufficient. Plausible-mistake distractors are a low-complexity optional enhancement, not a required error model or another difficulty control. Every distractor must be genuinely incorrect under the answer contract; avoid duplicate or equivalent competing choices.

Distractors may include intervals beyond the current correct-answer repertoire, but within the overall vocabulary. This lets answer-choice breadth grow independently of how many names have been introduced as correct answers.

When numerical reminders are enabled, provide them for every interval option, including distractors, using the same single unit as the question. For example: major second — 1 whole tone; major third — 2 whole tones; perfect fourth — 2½ whole tones. Fractional whole-tone reminders do not expand the integer-only whole-tone question category.

## Feedback and run outcomes

A wrong answer costs one life. Reveal the correct answer and explain it briefly using the keyboard before continuing. For example: “C4 → E4 is 2 whole tones: a major third.” Explain spelling distinctions when relevant. Do not require a retry; the director selects the next question if lives remain. Final-life failures still receive feedback.

Follow [[Run director]]: three lives, approximately fifteen presented puzzles as the ordinary pacing target, and successful completion after three qualifying correct answers once every skill's assigned challenge has reached its ceiling. This includes skills absent from those questions; it does not require proficiency estimates of 100%.

For Note navigation, ceiling-generated questions use the applicable maximum repertoire, full answer choice, and no numerical reminder when assessing interval vocabulary. Ordinary sampling remains unchanged: a short sampled distance still counts. There is no special final exam.

## Implementation tuning and deferred work

Behavior above is the baseline. Tune during implementation and playtesting:

- Navigation milestone thresholds, intermediate ranges, and within-category distance sampling.
- Exact interval-name milestones and support-removal thresholds along that control.
- Skill-target mappings to question form and the three controls, including how answer-choice breadth affects demand and evidence.
- Question-form coverage and named-interval sampling within the permitted intersection.
- Exact familiarity and strong-readiness thresholds for octave crossings and edge enharmonic spellings.
- Sampling frequency for newly available octave crossings and edge enharmonic spellings.
- Shared director formulas and ceiling representation, as listed in [[Run director]].

Detailed control layout and persistent curriculum unlock or world-progress milestones are not settled here. Validate that the generated questions and changing demands sustain enjoyable runs; multiple-choice correctness alone does not establish engagement or comprehensive mastery.
