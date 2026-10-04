# Shared progression

`src/progression.ts` separates **current skill progress** from **permanently earned unlocks**. `App.tsx` reconciles saved profiles at startup and reports Navigation answers; `imitation/ImitationGame.tsx` reports Imitation answers. Both puzzle pages display current progress and earned milestones, and `MainMenu.tsx` reads puzzle access from the unlock ledger.

## API

- `PuzzleId`: `navigation | imitation | rhythm | contours | intervals | chordfall | scaleConveyors | chordDraft | voicingSculpture | numeralDominoes | melodyTrails | tonalSwitchboard | coverVersions | harmonyFitting | progressionWordle`.
- `puzzleRequirements(puzzle, unlocks)`: the shared unlock routes with labels and `{ source, threshold, earned }` prerequisites. Routes are alternatives (OR); all prerequisites within a route are required (AND). Navigation has no prerequisites. The menu renders these rules directly rather than maintaining separate threshold text.
- `Unlocks`: `readonly string[]`, containing stable earned IDs, not percentages.
- `profileProgress(profile)`: current unweighted mean of all own enumerable skill proficiencies, on a 0–1 scale. An empty profile returns zero. Nonfinite or out-of-range proficiencies count as zero and remain in the denominator. Certainty does not affect progress. Valid profiles should already be validated by their feature's persistence layer.
- `rewardMilestones(puzzle, unlocks)`: ordered `{ id, threshold, earned }` markers. Only navigation and imitation have reward milestones; their instrument content is assigned separately in `src/instrumentUnlocks.ts`. Earned status comes exclusively from IDs, never from current progress.
- `isPuzzleUnlocked(puzzle, unlocks)`: navigation is always available; other puzzles require their stable puzzle ID.
- `reconcileUnlocks(unlocks, progress)`: returns the union of existing IDs and everything earned by the supplied partial progress report. It never mutates its inputs or removes earned IDs, preserves unknown IDs, and deduplicates in insertion order. Missing, nonfinite, or out-of-range progress is ignored. All checks use inclusive, unrounded thresholds.
- `loadUnlocks(storage)`, `saveUnlocks(unlocks, storage)`, `clearUnlocks(storage)`: explicit persistence operations. Reconciliation itself does not save.
- `ProgressionStorage`: `getItem`, `setItem`, and optional `removeItem`, compatible with `localStorage` and existing profile-storage adapters.

## Current rules and stable IDs

| Source readiness | Earned puzzle IDs |
| --- | --- |
| Navigation ≥ 0.2 | `puzzle:imitation`, `puzzle:rhythm`, `puzzle:contours` |
| Imitation ≥ 0.6 | `puzzle:intervals` |
| Navigation ≥ 0.35 | `puzzle:chordfall`, `puzzle:scale-conveyors` |
| Imitation ≥ 0.3 | `puzzle:chord-draft` |
| Chordfall ≥ 0.35 | `puzzle:voicing-sculpture` |
| Scale conveyors ≥ 0.35 AND Chordfall ≥ 0.35 | `puzzle:numeral-dominoes` |
| Scale conveyors ≥ 0.35 AND Imitation ≥ 0.3 | `puzzle:melody-trails` |
| Scale conveyors ≥ 0.45 AND Tonal contours ≥ 0.35 | `puzzle:tonal-switchboard` |
| Numeral dominoes ≥ 0.4 OR (Scale conveyors ≥ 0.4 AND Melody trails ≥ 0.3) | `puzzle:cover-versions` |
| Chordfall ≥ 0.4 AND Numeral dominoes ≥ 0.4 | `puzzle:harmony-fitting` |
| Chord draft ≥ 0.4 AND Numeral dominoes ≥ 0.4 AND Tonal contours ≥ 0.35 | `puzzle:progression-wordle` |

Navigation is always available. Cover versions exposes labelled **Chord covers** and **Melody covers** routes. Earning either route earns access to the puzzle; it does not imply readiness for the other form. No within-puzzle advanced-form gates are implemented yet.

Instrument rewards are unchanged:

| Source progress | Earned reward IDs |
| --- | --- |
| Navigation ≥ 0.33 / 0.66 / 1 | `reward:navigation:33`, `reward:navigation:66`, `reward:navigation:100` respectively |
| Imitation ≥ 0.33 / 0.66 / 1 | `reward:imitation:33`, `reward:imitation:66`, `reward:imitation:100` respectively |

The imitation rule is independent: imitation progress can unlock intervals even if navigation progress is missing or low and imitation's own puzzle ID has not been earned. Reporting progress is evidence, not an access-control check.

Reward fractions are exactly **0.33, 0.66, and 1**, not thirds or rounded display percentages. A report at 1 earns all earlier milestones in the same call. The progression module defines no sounds or reward-delivery effects. `src/instrumentUnlocks.ts` gives these existing IDs concrete content: Navigation unlocks Round shape, Mellow filter, and Triangle tone; Imitation unlocks Room effect, Grit effect, and Reed tone. Defaults (Sine, Steady, Open, Dry) are always available, while unassigned presets remain locked. The Instrument view checks the ledger, not current percentages or saved sound selections. See `Instrument.md` for selection and erase semantics. Only Navigation and Imitation have instrument reward milestones. Other puzzles may supply prerequisites without receiving instrument rewards.

Stable IDs are persistence contracts. Do not rename, recycle, or reinterpret an earned ID when changing presentation or thresholds. Removing a rule must not remove already earned IDs.

## Readiness milestones and placeholders

Reconciliation records each reached prerequisite as a stable string ID, `readiness:<PuzzleId>:<percentage>`, for example `readiness:scaleConveyors:35`. These are discrete earned milestones, not stored current progress or another proficiency profile. They use the existing version-1 unlock ledger, so no storage-shape migration is needed.

All relevant milestones are awarded from valid reports before evaluating puzzle routes. This allows an AND gate to be satisfied across separate reports, sessions and reloads. Once a prerequisite is earned, later decreases do not undo it. A missing or invalid report supplies no new evidence. An access ID alone does not imply a particular historical source proficiency; old earned access remains valid even when its prerequisite milestone IDs are absent. Startup reconciliation awards milestones justified by the actual loaded profiles, but does not invent historical peaks.

These threshold achievements are distinct from instrument rewards. Readiness IDs and existing puzzle IDs must not be repurposed when changing rules.

The menu includes all fifteen puzzle types in the original compact three-column icon-and-connection tree. Navigation and the original branches retain their positions; additional nodes extend the tree downward. Connections come from the shared prerequisite routes and become solid when the corresponding prerequisite milestone is earned. Lock badges represent puzzle access. Exact thresholds, earned prerequisite checks and AND/OR route explanations appear in each placeholder preview rather than as cards or stage headings on the home page. Locked items remain inspectable. Navigation and Imitation still open their existing introductions; all other puzzles open descriptive **Coming soon** previews without a Start action, simulated progress or placeholder profiles. Earning access never makes an unimplemented puzzle playable.

The proposed percentages for future types are initial readiness targets, not validated musical mastery measures. Their eventual reports must reflect the relevant foundations: for example, natural-minor familiarity for Switchboard, tonal-home experience rather than tension matching alone for Contours' downstream gates, and basic endings for Dominoes' harmonic applications. Do not automatically average every advanced extension into an introductory readiness gate. Navigation and Imitation retain their current whole-profile progress calculations unchanged. No future readiness estimator is invented by this placeholder implementation.

## Integration recipe

1. **Bootstrap existing profiles.** Load the unlock ledger and the existing navigation and imitation profiles separately. Compute current progress from those loaded profiles, reconcile all available reports, and save the resulting ledger. This gives returning players credit for their current profiles without persisting an aggregate or requiring another answer.
2. **Report after every answer.** Once the feature has applied skill changes, pass the updated profile to `profileProgress`, reconcile against the latest shared ledger, then save the new ledger. Do this for correct and incorrect answers, including the answer that ends a run; do not wait for a run-completion event. Retain the returned ledger in shared application state. Save the feature profile separately through its own persistence API.
3. **Render current and earned state separately.** Use the freshly computed aggregate for progress bars and percentages. Use `isPuzzleUnlocked` for puzzle availability and `rewardMilestones` for persistent earned markers. If current proficiency falls below a threshold, its earned marker and puzzle access remain. A rounded percentage must never award an unlock.
4. **Handle storage errors at the application boundary.** Keep earned IDs in memory if a write fails, inform the player when appropriate, and retry according to the application's policy. Do not pretend a failed write was durable.

For example, inside the application's bootstrap path, with already loaded feature profiles and a storage adapter:

```ts
let unlocks = reconcileUnlocks(loadUnlocks(storage), {
  navigation: profileProgress(navigationProfile),
  imitation: profileProgress(imitationProfile),
});
saveUnlocks(unlocks, storage);
```

After applying an imitation answer's skill updates:

```ts
unlocks = reconcileUnlocks(unlocks, {
  imitation: profileProgress(updatedImitationProfile),
});
saveUnlocks(unlocks, storage);
// Persist updatedImitationProfile through imitation's existing persistence API.
```

These snippets illustrate the shared API. The existing answer handlers read the latest persisted ledger before reconciling; App refreshes its state when leaving Imitation. Future features must likewise avoid reconciling against stale private copies.

### Adding a future puzzle or reward

1. For a new puzzle kind, extend `PuzzleId`, add its stable `puzzle:<name>` ID in `PUZZLE_UNLOCK_IDS`, and add its `REWARD_RULES` entry (empty unless rewards are actually required). Existing rhythm, contours, and intervals already have puzzle IDs and empty reward entries.
2. Add the source/threshold requirements and alternative routes to `PUZZLE_RULES`. Access rules belong here, not in menu components. Reuse the same routes through `puzzleRequirements` for presentation. Choose new IDs for genuinely new rewards in `REWARD_RULES`; preserve the identity of previously earned placeholders if those placeholders receive real content later.
3. Define how the feature reports relevant foundational readiness, then report after **each** answer using the same shared ledger as existing features. Include loaded readiness in bootstrap reconciliation. Existing Navigation and Imitation continue using `profileProgress`. Do not introduce a separately persisted aggregate.
4. Display availability through `isPuzzleUnlocked` and earned reward markers through `rewardMilestones`, independently of the current progress bar. Provide reward presentation/content separately; IDs do not implement sounds or side effects.
5. Add the puzzle's menu metadata in `src/puzzleCatalog.ts` and its icon in `src/PuzzleIcon.tsx`. Keep descriptive metadata separate from unlock rules. Mark it implemented only when it has a real playable entry point.
6. Extend tests for immediately below and exactly at each new threshold, AND/OR routes, independently earned prerequisites, decreases, idempotence, and persistence reload. If changing storage shape, introduce explicit version migration rather than silently reinterpreting old data.

## Persistence and erase semantics

The key is `tracks-unfold.progression.unlocks`; version 1 stores only:

```json
{ "version": 1, "unlocks": ["puzzle:imitation", "reward:navigation:33"] }
```

Loading validates the envelope version and the entire ID array. IDs must be nonblank strings; unknown nonblank strings are preserved verbatim for compatibility, not filtered against today's rules. Duplicate IDs collapse. Missing data, invalid JSON, malformed data (including a mixed valid/invalid ID array), and unsupported versions return an empty ledger without rewriting storage. Saving also rejects invalid IDs. There is no automatic version migration; an older client that subsequently saves over an unsupported version can lose that newer ledger.

Storage access failures propagate, matching existing profile persistence conventions. `clearUnlocks` removes only this key, or writes an empty versioned ledger if the adapter lacks `removeItem`. Profile keys are untouched. Saving replaces the stored ledger; callers must pass the full reconciled ledger, not just newly earned IDs. Neither loading nor saving merges concurrent writers.

Earned IDs last until explicit erase **within valid retained storage and the integration contract above**. `localStorage` is device/browser/origin-specific, can be blocked, cleared or evicted, may be ephemeral in private browsing, can run out of quota, and is user-editable. It is not cloud backup or tamper-proof achievement storage. Concurrent tabs can overwrite each other's snapshots; cross-tab coordination is outside this module.

A full “erase player data” action must clear both feature profiles and unlock persistence and reset their in-memory state. Clearing profiles alone does not revoke earned unlocks. Clearing unlocks alone while keeping high-proficiency profiles allows those unlocks to be earned again at the next bootstrap or report. Bootstrap can recover milestones justified by current profiles, but cannot recover historical peaks after proficiency has fallen.

## Verification

`src/progression.test.ts` covers aggregate calculation, invalid numeric inputs, inclusive puzzle and reward boundaries, every new prerequisite route, partial-report AND gates across reloads, alternative Cover versions routes, old ledgers without readiness milestones, absent future rewards, monotonic earned state, deduplication, unknown IDs, persistence round trips after decreases, malformed/versioned data, explicit erase, adapters without removal, and storage failures. `src/MainMenu.test.tsx` covers all fifteen entries, shared prerequisite presentation, earned versus coming-soon states, placeholder navigation and unchanged implemented-game callbacks.

Run `npm run test -- src/progression.test.ts` for the focused suite, then the project's typecheck, lint, formatting check, full tests, and production build.
