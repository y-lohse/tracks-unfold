---
type: puzzle-type
status: provisional-concept
---

# Chordfall

## Role

Learn chord construction through a collapsing note-board puzzle. Building a chord gives the player a legal move; choosing which chord to remove determines whether the board can be cleared.

The concept is promoted for further design. Interaction, assistance, generation and assessment are not yet a behavioral specification. Use the shared [[Run director]] when those details are developed.

## Player action

Several columns contain note tiles. Only the lowest remaining tile in each column is available. Construct a chord from exposed notes to remove them; the tiles above fall into reach.

The objective is to empty the board without stranding notes. In the opening triad form, a removal uses all three distinct chord tones from three different columns. Columns are storage, not voices or octave positions: this is construction of chord contents, not [[Voicing sculpture]].

Two musically correct moves can have different strategic consequences. Undo and editing within a puzzle are proposed so a legal move into a dead end need not be reported as a theory error. How exploratory board moves relate to submission, lives and skill evidence remains open; promotion does not change the shared run rules.

## Worked example

Allow major and minor triads:

| Layer | Column 1 | Column 2 | Column 3 | Column 4 |
| --- | --- | --- | --- | --- |
| Top | G | B | D | A |
| Middle | D | F | F | C |
| Exposed bottom | A | C | E | G |

Two opening removals are available: A–C–E (A minor) and C–E–G (C major).

Removing A minor exposes D, F, F and G, which cannot make another allowed triad. Removing C major permits a full clear:

| Move | Chord | Columns removed | Newly exposed notes |
| --- | --- | --- | --- |
| 1 | C–E–G | 2, 3, 4 | A, F, F, C |
| 2 | F–A–C | 3, 1, 4 | D, F, D, A |
| 3 | D–F–A | 1, 2, 4 | G, B, D, empty |
| 4 | G–B–D | 1, 2, 3 | Empty |

The two physical F tiles can be used in different orders to produce two winning routes. Accept both. A valid chord is not necessarily a useful move, and an unhelpful move is not necessarily an invalid chord.

## Learning through play and observation

Learning happens through repeated play, visible note relationships and hearing the results, not an explicit theory lesson followed by an exercise. Begin with accessible boards and support that leaves a real strategic choice. Relevant interval and note-navigation familiarity helps, but scale construction, numeral fluency and ear-training mastery are not opening requirements.

An assisted board may make two valid constructions visible without marking the strategically better removal. Repeated encounters across roots let the player observe what changes and what remains. Complete-match support can become lighter as those relationships become familiar; independent root, quality and note selection is a possible later demand, not the purpose of every board. Keep useful references available when they support musical attention and leave the clearing decisions meaningful.

The construction contracts include:

- Major: root, major third, perfect fifth; 0, 4 and 7 semitones from the root.
- Minor: root, minor third, perfect fifth; 0, 3 and 7 semitones.
- Letter span matters to the third and fifth; enharmonic spellings are not interchangeable when identifying those roles.

These define valid play, not a required introductory lecture or a recipe to memorize before entering the game. Occasional corrections or short contextual tips can put a name to a relationship the player has already encountered. Do not require explanations or a separate post-move quiz after successful removals.

A correction made after revealing the required note is assisted evidence. Automatically generated chord names or constantly highlighted legal moves must not be counted as independent naming or construction. Ordinary feedback remains part of play; it does not introduce a separate diagnosis task.

## Sources of variation

- Roots, accidentals, column arrangements, depth and duplicate tiles.
- Multiple legal moves with different future consequences.
- Diminished and augmented triads as changed constructions encountered through play.
- Small supplies of chord-symbol actions that the player chooses when to use.
- Diatonic forms: derive allowable chords from alternate notes of a stated scale.
- Later seventh-chord constructions using four-note removals.
- Suspended, sixth, added-note and extended constructions as specified below.
- Key-specific minor and diatonic-seventh boards.

Available vocabulary and removal size must be explicit. Generate inventories for the actual allowed actions rather than freely mixing chord sizes and assuming a clear exists.

## Expanded chord vocabulary

C9–C11 are agreed extensions of the construction mechanic, not new games or lesson sequences. Boards make the differing contents useful choices for clearing tiles. Controlled playback of a triad and its altered construction lets the player observe the difference; corrections or occasional tips can attach terminology to that experience.

### Suspended chords — C9

Suspended constructions retain three-note removals:

| Chord | Contents | Construction distinction |
| --- | --- | --- |
| C | C–E–G | Major triad |
| Csus2 | C–D–G | Second replaces the third |
| Csus4 | C–F–G | Fourth replaces the third |

Use sus2 and sus4 as chord-symbol constructions. Historical suspension treatment and mandatory resolution are not required. Later contrast Csus2 with Cadd9: the latter retains the third.

### Sixth and added-note chords — C10

These use four-note constructions:

| Chord | Contents |
| --- | --- |
| C6 | C–E–G–A |
| Cm6 | C–E♭–G–A |
| Cadd9 | C–E–G–D |
| Cm(add9) | C–E♭–G–D |

The third remains when a note is added. Cm6 contains A, not A♭: comparison with C6 lets the player observe the changing third and unchanged sixth. This is material for play and, if useful, a contextual correction or tip—not a fact that must be explained before play.

### Basic extensions — C11

Use complete constructions under explicit symbol conventions, including seventh quality:

| Chord | Contents |
| --- | --- |
| Cadd9 | C–E–G–D |
| C9 | C–E–G–B♭–D |
| Cmaj9 | C–E–G–B–D |
| C11 | C–E–G–B♭–D–F |
| C13 | C–E–G–B♭–D–F–A |

Contrasting removals and playback expose the difference between add9 and 9, and between dominant and major-seventh extensions. The tables specify chord contents, not mandatory voicings or the vertical order of columns.

There is no separate I4 compound-interval branch or prerequisite. The relationship of 9, 11 and 13 to 2, 4 and 6 above the octave can be encountered here and named in a short contextual tip when useful. This does not introduce a general compound-interval assessment track.

Complete ninth, eleventh and thirteenth constructions require five, six and seven exposed tones. Test an appropriately sized board on portrait phones rather than silently omitting notes to fit the opening layout. Real voicings can omit tones, but professional omission conventions and altered extensions are not required here.

If a note collection supports several chord names, a supplied root or available symbol action defines the requested construction; otherwise accept every interpretation allowed by the current vocabulary. Do not mark a valid C6/Am7 interpretation wrong merely because the generator preferred the other name.

## Chords within keys

These are explicit extensions of the existing diatonic construction forms. Constructing an isolated minor or seventh chord is not the same task as deriving it from a key. The key or scale must participate in the board's construction contract, rather than appear only as a decorative label.

### Minor-key chords — H3

Include natural-minor triads and their numeral relationships, alongside the major V produced by the raised seventh. In A minor:

- Natural-minor v is E–G–B.
- Raising G to G♯ permits V, E–G♯–B.

Boards and playback allow the player to encounter both constructions and their difference. Keep the applicable collection or raised-seventh allowance clear; do not imply that every minor-key passage uses one unchanging collection. [[Scale conveyors]] supplies related scale practice. [[Numeral dominoes]] and [[Cover versions]] exercise these chords as whole-chord numeral relationships and transpositions, without making note decomposition a prerequisite to their moves.

### Diatonic seventh chords — H8

Extend alternate-scale-note derivation from three notes to four. In a major key the resulting qualities are Imaj7, ii7, iii7, IVmaj7, V7, vi7 and viiø7, with lowercase triad numerals indicating minor-seventh chords here.

Examples in C major:

| Degree | Construction | Chord |
| --- | --- | --- |
| Imaj7 | C–E–G–B | Cmaj7 |
| ii7 | D–F–A–C | Dm7 |
| V7 | G–B–D–F | G7 |
| viiø7 | B–D–F–A | Bm7♭5 |

Include the half-diminished seventh on degree seven within this scope, not in a deferred advanced-harmony branch. [[Numeral dominoes]] and [[Cover versions]] provide complementary use of the resulting chord–degree relationships.

## Learning coverage and boundaries

- [[C1 - Major and minor triads]]: construction, roles, root/quality recognition and symbol interpretation. Equivalent symbol spellings need recurring exposure and contextual clarification in play.
- [[C2 - Diminished and augmented triads]]: changed interval structures in later forms.
- [[C7 - Common seventh chords]]: later four-note constructions, symbols and comparisons, including the qualities needed for diatonic seventh derivation.
- [[C9 - Suspended chords]], [[C10 - Sixth and added-note chords]] and [[C11 - Basic chord extensions]]: agreed construction extensions above, with board generation and interaction still provisional.
- [[H1 - Diatonic triads in major]]: later alternate-scale-note derivation, after S2 and relevant chord-quality foundations.
- [[H3 - Minor-key chords and progressions]]: natural-minor chord derivation and the raised-seventh v/V contrast; numeral use also develops in the existing whole-chord games.
- [[H8 - Diatonic seventh chords]]: four-note derivation in major, including viiø7, and its degree relationships.
- [[T3 - Chord construction on unfamiliar roots]]: varied roots within familiar taught vocabulary.

[[Numeral dominoes]] is the planned home for introductory whole-chord numeral play, and [[Cover versions]] for progression transposition. Chordfall's key-specific forms support derivation without turning repeated note construction into the main numeral game.

Chord playback supports observation and comparison; identifying unlabelled qualities by ear also has a home in [[Chord draft]]. A board's clearing sequence need not be a conventional functional progression. [[T5 - Diagnosing and correcting constructions]] and [[C12 - Accounting for every chord note]] are deferred: do not add dedicated repair or exhaustive note-accounting tasks to satisfy them now.

## Generation and open design work

Generate from a valid clearing sequence, then solve the board to check alternatives, traps and the intended amount of choice. A solvability witness alone does not establish an interesting puzzle. Avoid only changing the key of a memorized board.

Resolve:

- Selection, audition, preview, undo and submission interactions.
- Assistance that lets players learn through practice and observation without solving strategic decisions; corrections and occasional tips should respond to what the player has encountered, not impose lessons before play.
- When lighter support creates worthwhile construction and recognition practice, and when references should remain available.
- How to distinguish musical errors, strategic dead ends and revealed-answer corrections in assessment.
- Compact boards that remain legible on portrait phones, including the exposed-tone counts required by complete extensions.
- Generation for each permitted chord size and key-specific vocabulary, including minor v/V and major-key viiø7.
- Whether generated boards offer sustained choice rather than forced chord searches.
