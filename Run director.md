---
type: shared-mechanic
status: behavioral-spec
---

# Run director

## Scope and purpose

The director shapes personalized, escalating challenge within each run, informed by learning evidence carried across runs. This shared mechanic applies across puzzle types, including [[Puzzle Types/Note navigation|Note navigation]] and [[Puzzle Types/Imitation|Imitation]].

This is a behavioral specification. Formulas, numerical thresholds, and pacing constants will be tuned during implementation and playtesting. Puzzle-specific generation rules belong in the corresponding puzzle specification; UX details are outside this document.

Near the start, a mistake can indicate that the director overestimated the player's understanding, and subsequent difficulty may decrease. Toward the end, run pressure should allow the player to lose rather than repeatedly rescue the run. Ending a run does not erase established learning progress.

## Skills, question forms, and difficulty controls

Separate what the player learns from how puzzles are generated:

- **Skills** have separately tracked proficiency and certainty.
- **Question forms** determine what the player must supply.
- **Difficulty controls** have settings from 0 to 1 and determine generation demands and support.

The director targets skills, then selects a question form and difficulty settings that exercise them. Assessment credits only what the player actually had to supply. Controls need not correspond one-to-one with tracked skills. Supplied reminders can introduce knowledge without establishing independent recall.

Each puzzle type defines the mapping between assessed skills and generation controls. Do not assume all controls combine in every question, or that every control needs its own proficiency score.

Which skills are exercised together depends on the question and its support; there is no shared fixed number of skills per puzzle. Non-focal skills are not disabled, but every skill need not be independently assessed in every question.

A focus does not exclude other skills from the run. Exact coverage rules depend on the puzzle type and remain implementation work; exposure and independent assessment are not interchangeable.

## Run balance and focus

At the start of a run, the director chooses a stable balance expressing which skills it aims to challenge. Question selection and difficulty settings can both express this intent. Their exact relationship is puzzle-specific implementation work; focus is an intent to challenge, not a prescribed frequency-only algorithm.

The director chooses a varied balance informed by proficiency and certainty. Lower proficiency and lower certainty can each justify emphasis, but the director should not always target the weakest skill.

The breadth of focus grows with familiarity:

- Beginners receive runs focused mainly on one skill, introducing it in relative isolation.
- Familiar skills can be combined into focuses involving two or three skills.
- More advanced players can receive broadly balanced runs.

Readiness for mixed focus is evaluated per skill, using demonstrated success at modest difficulty with sufficient certainty, not exposure count or a global beginner/advanced label. A player familiar with A and B can receive A+B-focused runs while unfamiliar C still receives predominantly single-focus runs.

The chosen focus stays stable rather than changing in response to performance. Profile updates may change selected difficulty settings without changing that focus. When a control reaches 1, further challenge growth must use remaining headroom elsewhere. The exact ceiling-driven redistribution rule remains open.

## Starting challenge

Focal skill demands start somewhat below estimated capability, providing an approachable opening before escalation. Lower certainty makes the start more conservative; unfamiliar demands start at their minimum.

Non-focal demands start at personalized, very comfortable levels, clearly below estimated capability rather than merely at the expected level. Familiar demands need not reset to zero. They may still increase later under the challenge-selection rules.

A puzzle type may also define assessment-gated repertoire eligibility for a qualitatively new demand, such as crossing an octave boundary. These gates derive from relevant proficiency and certainty, not exposure counts or a first-run branch. Run pressure and high difficulty-control settings do not override unavailable repertoire. Eligibility is distinct from persistent world or curriculum unlocks and does not automatically create another tracked skill or control.

The exact mapping from skill assessments and safety margins to generation controls remains to be designed.

## Continuous player assessment

Every answer throughout the run updates the player's profile, including late-run answers. Success raises and failure lowers associated proficiency estimates, weighted by the skills actually demanded and their contributions. Supplied support must be accounted for: an answer cannot establish independent recall of information supplied in the puzzle.

Certainty does not increase monotonically. A result is surprising only when the challenge differs significantly from the existing proficiency estimate in the opposite direction from the outcome: the player answers correctly significantly above their estimated level, or fails significantly below it. These surprising results can temporarily lower certainty as proficiency is corrected. Every other result carrying assessment evidence increases certainty while updating proficiency normally. The exact significant-gap threshold remains implementation tuning. Failure in a mixed-demand question is weaker evidence against any single skill than failure attributable mainly to that skill.

Updates account for challenge relative to the existing assessment. Failing far above estimated proficiency causes only a small downward correction; failing something believed mastered causes a stronger correction. Exact formulas remain open.

## Selecting each puzzle's challenge

For each new puzzle, the director combines current skill assessments with exponentially increasing run pressure. Conceptually, challenge follows an exponential curve, and the director selects a position along it. Puzzle-type adapters translate that smooth pressure into question forms and categorical controls. They should stage qualitative setting changes rather than allowing several aligned control thresholds to create an unintended difficulty cliff.

A separate post-failure easing modifier is optional, not an agreed requirement. If used, it should taper off during the run. Profile updates may already provide enough early correction without this modifier.

Assessment never stops or tapers merely because the run is nearing its target length. Late-run pressure should allow the run to end rather than repeatedly rescue it; its exact interaction with changing proficiency estimates remains open.

No blanket restriction requires every challenge to use only previously taught material. This does not remove puzzle-specific teaching and answer-contract requirements.

## Lives and pacing

A run starts with three lives. Each failed puzzle costs one life, including opening failures. The run ends in failure when the player loses their last life. It can also end successfully after demonstrated success at the available challenge ceiling; merely reaching maximum settings is insufficient.

Run progression counts puzzles presented, whether solved or not, rather than elapsed time. Playtesting suggests a target length of about 15 puzzles. This is not a hard limit: actual length varies. Difficulty should begin peaking beforehand, aiming for the last life to be lost around puzzle 15.

## Successful completion

A run has a success condition for players who can handle the available challenge ceiling. Do not introduce timers, out-of-scope content, or indefinite play solely to force a proficient player to lose. The approximately 15-puzzle loss target governs ordinary pacing, not a requirement that every run end in failure.

Successful completion requires three correct answers at maximum challenge, not necessarily consecutive, together with a global ceiling requirement: every skill must be at maximum challenge difficulty, including skills not exercised by those three questions. Maxing only the current focus or the skills present in the final questions is insufficient. Mistakes continue to cost lives rather than resetting a separate success streak.

Maximum challenge refers to the difficulty the director assigns to each skill, not a requirement that stored proficiency estimates reach 100%. It also does not require every difficulty control to be numerically maximal in the same question: controls are puzzle-generation mechanisms, and puzzle-specific mappings determine the applicable settings for maximum skill challenge. Count qualifying correct answers only after the global skill-challenge ceiling has been reached; earlier successes do not count toward the three-answer condition. Each counted answer must use the applicable ceiling mapping. Qualification depends on those settings, not on the randomly sampled question being the longest movement or otherwise the hardest individual example in the repertoire. Keep the ordinary generation and sampling rules; do not add a special final exam or a hardest-example filter.

The concrete representation of per-skill challenge ceilings remains to be designed. Run completion remains distinct from continuously updated proficiency and certainty estimates; it is not a declaration of comprehensive mastery.

## Implementation tuning and deferred work

- Puzzle-specific mappings from target skills to question forms, support, and difficulty controls.
- Run coverage requirements after separating skill assessment from control settings.
- Exact balance-selection weights, familiarity thresholds, and starting safety margins.
- Ceiling-driven redistribution while other skill demands still have remaining headroom.
- Difficulty-aware proficiency updates, evidence attribution, and certainty formulas.
- Whether a separate post-failure easing modifier is needed.
- The exponential curve and how the director selects a position and generates the corresponding puzzle.
- How to represent and establish maximum challenge for every skill, including skills absent from a question.
- No hard run-length cutoff is specified; the fifteen-puzzle duration is a target, not a forced ending.
- How answer-choice breadth affects skill demands and evidence without automatically receiving its own proficiency score.

Use the agreed lives, success condition, and behavioral boundaries while tuning these details. Do not silently add timers, new skills, special assessment phases, or progression gates to solve tuning problems.
