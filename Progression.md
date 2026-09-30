# Shared progression

`src/progression.ts` separates **current skill progress** from **permanently earned unlocks**. `App.tsx` reconciles saved profiles at startup and reports Navigation answers; `imitation/ImitationGame.tsx` reports Imitation answers. Both puzzle pages display current progress and earned milestones, and `MainMenu.tsx` reads puzzle access from the unlock ledger.

## API

- `PuzzleId`: `navigation | imitation | rhythm | contours | intervals`.
- `Unlocks`: `readonly string[]`, containing stable earned IDs, not percentages.
- `profileProgress(profile)`: current unweighted mean of all own enumerable skill proficiencies, on a 0–1 scale. An empty profile returns zero. Nonfinite or out-of-range proficiencies count as zero and remain in the denominator. Certainty does not affect progress. Valid profiles should already be validated by their feature's persistence layer.
- `rewardMilestones(puzzle, unlocks)`: ordered `{ id, threshold, earned }` markers. Only navigation and imitation have placeholder rewards. Earned status comes exclusively from IDs, never from current progress.
- `isPuzzleUnlocked(puzzle, unlocks)`: navigation is always available; other puzzles require their stable puzzle ID.
- `reconcileUnlocks(unlocks, progress)`: returns the union of existing IDs and everything earned by the supplied partial progress report. It never mutates its inputs or removes earned IDs, preserves unknown IDs, and deduplicates in insertion order. Missing, nonfinite, or out-of-range progress is ignored. All checks use inclusive, unrounded thresholds.
- `loadUnlocks(storage)`, `saveUnlocks(unlocks, storage)`, `clearUnlocks(storage)`: explicit persistence operations. Reconciliation itself does not save.
- `ProgressionStorage`: `getItem`, `setItem`, and optional `removeItem`, compatible with `localStorage` and existing profile-storage adapters.

## Current rules and stable IDs

| Source progress              | Earned IDs                                                                           |
| ---------------------------- | ------------------------------------------------------------------------------------ |
| Navigation ≥ 0.2             | `puzzle:imitation`, `puzzle:rhythm`, `puzzle:contours`                               |
| Imitation ≥ 0.6              | `puzzle:intervals`                                                                   |
| Navigation ≥ 0.33 / 0.66 / 1 | `reward:navigation:33`, `reward:navigation:66`, `reward:navigation:100` respectively |
| Imitation ≥ 0.33 / 0.66 / 1  | `reward:imitation:33`, `reward:imitation:66`, `reward:imitation:100` respectively    |

The imitation rule is independent: imitation progress can unlock intervals even if navigation progress is missing or low and imitation's own puzzle ID has not been earned. Reporting progress is evidence, not an access-control check.

Reward fractions are exactly **0.33, 0.66, and 1**, not thirds or rounded display percentages. A report at 1 earns all earlier milestones in the same call. These rewards are placeholders only: the module defines no sounds, instruments, content, or reward-delivery effects. Rhythm, contours, and intervals currently have no reward milestones or outgoing progression rules.

Stable IDs are persistence contracts. Do not rename, recycle, or reinterpret an earned ID when changing presentation or thresholds. Removing a rule must not remove already earned IDs.

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
2. Add the required source/threshold/target-ID entries to `PUZZLE_RULES`. Access rules belong here, not in menu components. Choose new IDs for genuinely new rewards in `REWARD_RULES`; preserve the identity of previously earned placeholders if those placeholders receive real content later.
3. Make the feature report its updated profile after **each** answer, using the same shared ledger as existing features. Include its loaded profile in bootstrap reconciliation. Do not introduce a separately persisted aggregate.
4. Display availability through `isPuzzleUnlocked` and earned reward markers through `rewardMilestones`, independently of the current progress bar. Provide reward presentation/content separately; IDs do not implement sounds or side effects.
5. Extend tests for immediately below and exactly at each new threshold, independent source reports, decreases, idempotence, and persistence reload. If changing storage shape, introduce explicit version migration rather than silently reinterpreting old data.

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

`src/progression.test.ts` covers aggregate calculation, invalid numeric inputs, inclusive puzzle and reward boundaries, independent unlock rules, absent future rewards, monotonic earned state, deduplication, unknown IDs, persistence round trips after decreases, malformed/versioned data, explicit erase, adapters without removal, and storage failures.

Run `npm run test -- src/progression.test.ts` for the focused suite, then the project's typecheck, lint, formatting check, full tests, and production build.
