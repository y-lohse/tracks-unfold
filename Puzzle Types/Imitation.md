---
type: puzzle-type
status: behavioral-spec
---

# Imitation

## Scope and role

Develop hearing and reproduction of pitch relationships through generated phrase-imitation puzzles. The player hears a short monophonic phrase, receives one response pitch as an anchor, and reconstructs the phrase's pitch relationships on the shared keyboard instrument.

Use the shared [[Run director]] for focus, assessment, escalation, lives and run completion. This specification defines Imitation's task, skills, controls, generation contract and feedback. Numerical thresholds, update formulas and visual styling remain implementation tuning unless stated otherwise.

Imitation assesses relative pitch relationships. It does not require absolute pitch, performed rhythm, interval naming, a fixed key or scale, or aesthetic judgment.

## Player loop

1. Play the complete reference phrase automatically, followed by one free playback of the supplied response anchor.
2. Let the player replay the reference within its allowance, audition enabled keyboard pitches within a shared allowance, and fill every editable response slot silently.
3. Accept one complete submission.
4. Check every adjacent movement against the puzzle's relationship contract. A single failed movement fails the puzzle and costs one life.
5. Lock the submitted response, show feedback in the response slots, and provide unlimited review listening.
6. Continue to fresh material without a retry. A final-life failure still receives full review before the run summary.

The initial reference playback counts toward the reference-play allowance. The initial anchor cue is free and occurs only once. Replaying the reference does not repeat the free cue; hearing the anchor again consumes an ordinary pitch audition.

## Musical material

- Reference phrases contain three to six sequential single pitches.
- Notes use equal duration and fixed playback timing. Timing is supplied rather than performed or assessed.
- Reference and response contain the same number of slots.
- Exactly one response slot is supplied and locked as the anchor.
- The response anchor may correspond to the first, last or a middle reference pitch.
- Reference and response pitches stay within the keyboard's C3–B5 range.
- There is no required key, scale or tonic. The anchor is an orientation pitch, not necessarily a tonic.
- Enharmonic spelling is not assessed. Exact sounding pitch and register determine movements.

## Puzzle-type skills

Track proficiency and certainty separately for four task-specific skills.

| Skill | Ability |
| --- | --- |
| Pitch-direction sequence reproduction | Reproduce whether each successive pitch is higher, lower or repeated |
| Interval-size sequence reproduction | Reproduce the magnitude of successive pitch movements at the precision required by the question |
| Pitch navigation | Locate and select intended pitches on the playable keyboard relative to supplied and entered pitches, including movement across register boundaries |
| Pitch-relationship transposition | Reconstruct a heard pitch pattern from a different supplied anchor while preserving the relationships required by the question |

Repetitions provide direction evidence but do not by themselves provide meaningful evidence of nonzero interval-size perception. Pitch-relationship transposition is narrower than tonal melody transposition into another key.

Runs target these puzzle-type skills. Their later contributions to overall curriculum skills and puzzle-type unlocks are outside this specification.

## Difficulty controls

The director translates targeted puzzle-type skill challenges into nine normalized controls. Each control ranges from 0 to 1 through categorical or continuous milestones. A control can affect several skills, and its effect need not be equally difficult for every skill.

| Control | Ordered settings or effect |
| --- | --- |
| Contour structure | One direction without repeats; one direction with required repeats; one turn without repeats; one turn with required repeats; multiple turns, repeats allowed |
| Phrase length | Three, four, five or six pitches |
| Interval precision | Direction only; ±3; ±2; ±1 semitone; exact |
| Pitch-selection demand | Progressively removes the support supplied by a curated pitch set and requires broader keyboard navigation |
| Anchor position | First; last; middle |
| Transposition | No shift; octave shift; separated non-octave placement; overlapping non-octave placement |
| Reference plays | Unlimited; three; two; one complete play, including the initial play |
| Pitch auditions | Unlimited; three per editable slot; one per editable slot; none |
| Reference movement range | 1–2; 1–5; 1–12 semitones for non-repeated adjacent movements |

Store exact generated features as well as normalized control settings, including signed movements, numeric tolerance, enabled pitches, anchor index and pitch, and the signed anchor shift.

### Control interpretation

A turn is a reversal between successive nonzero movement directions. Repetitions do not themselves count as turns. Settings that require repetitions or turns must actually generate them rather than merely permit them.

Phrase length, reference plays and pitch auditions increase task difficulty or reduce support; they do not define a separately tracked memory or limited-listening skill. Their demand follows the run balance, but maximum skill challenge does not require every general support control to use its harshest setting in the same puzzle.

Interval precision determines both the answer contract and whether interval-size reproduction is required. Direction-only questions do not penalize nonexact movement sizes.

Pitch-selection demand is contextual rather than a raw enabled-key count. Generation accounts for the active relationship contract, invalid alternatives and valid-solution breadth. Even the most curated supply includes at least two more choices in each direction from the anchor than there are editable slots, so recognizing direction alone does not determine the response. A broader supply is not automatically harder when it mostly adds valid answers.

Reference movement range is also skill-specific. Small movements can be more difficult for pitch-direction discrimination, while broader and larger movements increase interval-size reproduction and pitch-navigation demand. At broader range settings, include at least one non-repeated movement from the newly available range.

Transposition is a pragmatic progression rather than a claim that every shift category has a universally strict difficulty order:

1. No shift provides no transposition evidence.
2. An octave shift preserves note identities in another register.
3. A separated non-octave placement puts reference and response in clearly different pitch regions.
4. An overlapping non-octave placement leaves original pitches as plausible nearby choices that must be suppressed.

For even phrase lengths, either central slot may be selected as a middle anchor.

Use control-specific categorical thresholds rather than treating every ladder as equally spaced. Introduce the focal demand early while other supports remain generous. When several desired settings cross boundaries together, stage at most two categorical control changes in one new puzzle and carry the remaining changes forward. A control advances at most one category at a time. Continuous values may continue moving within the current category.

Resolve feasibility while staging related controls. In particular, do not combine separated non-octave placement with the wide movement range: defer the wide range until overlapping placement is active.

## Relationship contract

For each adjacent pair, calculate the signed pitch movement in semitones for both reference and response.

Every movement must pass independently:

- **Direction only:** higher, lower or repeated must match. Nonzero movement size is unrestricted.
- **Repetition:** a repeated reference pitch always requires a repeated response pitch.
- **Tolerance:** direction must match, and the difference between the absolute movement sizes must not exceed the stated tolerance.
- **Exact:** signed movements must match exactly.

The anchor must remain unchanged, and every entered pitch must belong to the enabled supply.

Any response satisfying the active relationship contract is fully correct. Do not compare only against a generated witness or require the exact anchored reconstruction when the contract permits alternatives.

### Exact anchored reconstruction

Transpose every reference pitch by the signed difference between the response anchor and its corresponding reference pitch. The resulting phrase is the exact anchored reconstruction.

Every generated puzzle must:

- keep the complete exact anchored reconstruction within C3–B5;
- include all of its pitches in the enabled supply;
- use it as the generator's solvability witness; and
- verify it through the same independent checker used for player responses.

Do not fall back to a puzzle that is solvable only through a nonexact tolerant alternative. The exact reconstruction is always available, but it remains a comparison target rather than the sole accepted answer.

## Keyboard and response interaction

Use the existing keyboard visual language as the interactive instrument. Generalize it from its current illustrative two-marker role rather than introducing the prototype's spiral.

- Keep exact pitch positions stable throughout the puzzle.
- Always show the central C4–B4 section. Show lower or higher octave sections when their pitches are available or needed for the current material.
- Distinguish natural and accidental keys through the established keyboard design.
- Show unavailable pitches as inactive without changing the placement of available pitches.
- Keep every enabled exact pitch directly tappable.
- Display note name and octave for entered response pitches and the locked anchor.

The response slots and keyboard have two explicit interaction modes:

- With an editable response slot selected, tapping an enabled pitch enters or replaces that slot silently and then deselects it.
- With no response slot selected, tapping an enabled pitch auditions it and consumes one audition.

Silent edits are unlimited and cannot be used to hear pitches. Each entry requires an explicit slot selection. Selecting the locked anchor does not provide a free audition; it may deselect the current editable slot.

Highlight a selected response slot independently from a sounding keyboard pitch. Entering a pitch does not leave the keyboard key highlighted as selected.

If no auditions remain, do not play a pitch and draw attention to the allowance. Rapid successive auditions should respond immediately and may interrupt the previous audition. Reference playback takes priority during an attempt; ordinary auditions must not interrupt or obscure it.

## Playback and listening allowances

Reference replay always plays the complete phrase. There is no individual pre-submission replay of reference pitches and no whole-response preview before submission.

Use the response slots as the shared sequential playback display. A small state change within each slot may indicate the currently sounding position during reference, response and comparison playback. Before submission, playback must not reveal reference pitch names, heights or contour.

After any submitted response:

- reference replay and pitch auditions become unlimited;
- review listening cannot add assessment evidence;
- the enabled pitch supply remains unchanged; and
- the submitted response remains locked.

For an exact correct response, automatically play the entered response once. For a correct nonexact variation or an incorrect response, automatically play the exact anchored reconstruction followed by the entered response. A manual comparison action may repeat the appropriate review playback.

## Review feedback

Keep feedback inside the response slots rather than placing interval results between slots. Show at most three equal-sized slots per row so complete student-facing corrections remain readable.

Relationship feedback is primary. Show what relationship was expected and how the submitted movement differed:

- expected higher, lower or repeated for direction-only failures;
- expected and entered signed movements for tolerant or exact failures; and
- tolerance proximity for accepted movements close to rejection.

When the submitted pitch differs from the exact anchored reconstruction, show the entered and expected pitches together in the slot's primary pitch area. Do not add a separate `Exact note` label or expose an absolute semitone offset. The expected pitch is secondary comparison information, not the pass rule: tolerance applies to adjacent movements, and accumulated absolute differences may grow while every movement remains valid.

Attach a movement's feedback to an editable endpoint. When exactly one endpoint differs from the exact anchored reconstruction, attach the movement feedback to that differing pitch. Otherwise prefer the destination slot. If the destination is the locked anchor, attach feedback to the editable source instead. Never style the supplied anchor as though its pitch were wrong. Assessment may still consider both neighboring movements, but show at most one relationship message in a slot. Show the most actionable status represented by the slot: failed corrections before near-boundary feedback, and near-boundary feedback before comfortable accepted variation. When both neighboring movements have that status, prefer the movement from the preceding note; the expected pitch remains the complete correction.

Communicate the overall result unambiguously:

- exact successful movements receive the strongest success treatment;
- accepted nonexact movements are successful valid variations, not corrected mistakes;
- accepted movements near a tolerance boundary may receive a proximity treatment without losing their success state; and
- failed movements receive error treatment.

Retain the player's entered pitches throughout review.

## Assessment

Puzzle outcome and skill assessment use different granularity.

- Puzzle acceptance is all-or-nothing. One failed movement fails the submission and costs one life.
- Skill updates use bounded per-movement evidence instead of treating every involved skill as a total success or failure.
- A narrowly failed phrase can provide mostly positive evidence for a skill while still failing the puzzle.
- Phrase length changes challenge and evidence breadth, but one submitted phrase remains one bounded assessment event rather than multiplying updates without limit.
- Mixed-demand failures provide weaker negative evidence for any one skill than an isolated failure would.

Adjust evidence for the support actually available, including reference plays, pitch auditions and pitch-selection demand.

Performance beyond the stated contract may provide lower-weight positive evidence. For example, an exact movement in a direction-only question may support interval-size assessment, adjusted for pitch-supply and audition support. A valid nonexact movement provides neither positive nor negative interval-size evidence when precision was not required.

Transposition evidence requires a shifted response anchor. Octave and non-octave placements can provide different transposition demands. Review activity, automatic playback and development shortcuts provide no evidence.

Exact proficiency, certainty and evidence-update formulas belong to shared director tuning. Persist the four puzzle-type skill assessments across runs.

## Generation

Separate director selection, instance generation and answer checking.

The generator receives:

- a complete nine-control configuration;
- targeted skill challenges;
- a reproducible random source or seed; and
- enough recent material to avoid immediate repetition where alternatives exist.

It returns:

- reference pitches;
- anchor index and response pitch;
- enabled exact pitches;
- relationship contract and numeric tolerance where applicable;
- reference-play and audition budgets;
- exact generated features; and
- the exact anchored reconstruction as a validated witness.

Generation must validate that:

- required repetitions and turns actually occur;
- phrase length can realize the requested contour;
- movement-range requirements actually occur;
- reference and exact anchored response fit the instrument;
- the anchor and all exact reconstruction pitches are enabled;
- listening budgets follow the editable-slot count;
- the witness passes the independent checker; and
- at least one valid response exists.

Prefer compact central-register material for introductory unshifted puzzles. As challenge grows, vary direction, register, anchor position, contour and exact pitches without moving keyboard positions within a puzzle.

Use bounded resampling. If a requested combination is infeasible, the director may select a compatible actual configuration and record the difference. Never silently present a puzzle under a different contract. Exhausted generation is a development/configuration failure, not a player mistake, and costs no life.

## Run behavior

Follow the shared [[Run director]]:

- three lives;
- puzzle-type skill focus and personalized starting challenge;
- escalating pressure across presented puzzles, including failures;
- approximately fifteen presented puzzles as the ordinary pacing target;
- one submission per puzzle;
- one life lost per failed puzzle; and
- successful run completion after the shared ceiling condition is met.

For Imitation, ceiling-generated questions assign maximum challenge to all four puzzle-type skills and use the applicable focus-weighted control settings. Maximum skill challenge does not mean setting all nine controls to `1`; the controls are generation mechanisms rather than nine additional skills. Ordinary feasible generation and variation continue, including staged control changes; there is no separate final exam or requirement to combine every harshest setting in one puzzle.

## Learning coverage

Imitation contributes to the curriculum through practical listening and reconstruction:

- [[P1 - Pitch direction]]: hear and reproduce higher, lower and repeated pitch relationships.
- [[P2 - Octaves and note identity]]: begin encountering and applying octave distances, register changes and octave-shifted relationships.
- [[I3 - Hearing intervals]]: hear successive pitch distances and reproduce them without requiring interval names.
- [[M1 - Melodic movement and contour]]: reproduce repetitions, steps, leaps, turns and broader contour.
- [[T1 - Melody transposition]] and [[T6 - Reconstructing phrases by ear]]: develop foundational relationship transfer and reconstruction used by these later, broader abilities.

Octave material contributes ordinary early P2 exposure and assessment without requiring a separate octave-specific Imitation skill or question form. Correct octave-related answers receive ordinary success treatment. Incorrect answers use the ordinary relationship correction and comparison feedback.

Imitation does not assess structural interval naming, simultaneous harmonic intervals, performed rhythm, tonal function or absolute pitch.

## Presentation boundaries

Design for current portrait-phone browsers and reuse the project's established surfaces, typography, keyboard and run-status language.

Do not carry over the prototype's desktop split layout, chromatic spiral, nine-axis radar or visible development readout. Show each piece of run and puzzle information once. Keep the active relationship contract and remaining listening allowances visible without instructional paragraphs around every control.

Development observability may use tests or development-only tooling, but it is not part of the player-facing puzzle specification and must not leak unanswered reference material.

## Implementation tuning and deferred work

Tune through implementation and playtesting:

- categorical thresholds along each normalized control;
- mapping from targeted skill challenge to compatible control combinations;
- evidence weights for per-movement, supported and above-contract performance;
- relative demand of octave, separated non-octave and overlapping non-octave transposition;
- pitch-supply generation and valid-solution breadth;
- phrase sampling and immediate-repeat avoidance;
- playback timing and synthesized sound;
- compact slot feedback at narrow phone widths; and
- overall curriculum-skill contribution and puzzle-unlock formulas.

Do not add performed rhythm, timers, interval-name questions, retries, manual parameter panels or a separate memory skill to solve tuning problems within this puzzle type.
