import {
  DEFAULT_INSTRUMENT_SOUND,
  INSTRUMENT_PRESETS,
  type InstrumentSound,
} from "./instrumentPresets";
import { rewardMilestones, type PuzzleId, type Unlocks } from "./progression";

type PresetReward = {
  [Slot in keyof InstrumentSound]: {
    slot: Slot;
    preset: InstrumentSound[Slot];
    puzzle: PuzzleId;
    id: string;
  };
}[keyof InstrumentSound];

const PRESET_REWARDS = [
  {
    puzzle: "navigation",
    id: "reward:navigation:33",
    slot: "shape",
    preset: "round",
  },
  {
    puzzle: "navigation",
    id: "reward:navigation:66",
    slot: "filter",
    preset: "mellow",
  },
  {
    puzzle: "navigation",
    id: "reward:navigation:100",
    slot: "tone",
    preset: "triangle",
  },
  {
    puzzle: "imitation",
    id: "reward:imitation:33",
    slot: "effect",
    preset: "room",
  },
  {
    puzzle: "imitation",
    id: "reward:imitation:66",
    slot: "effect",
    preset: "grit",
  },
  {
    puzzle: "imitation",
    id: "reward:imitation:100",
    slot: "tone",
    preset: "reed",
  },
] as const satisfies readonly PresetReward[];

export function isInstrumentPresetUnlocked(
  slot: keyof InstrumentSound,
  preset: string,
  unlocks: Unlocks,
): boolean {
  if (preset === DEFAULT_INSTRUMENT_SOUND[slot]) return true;
  const reward = PRESET_REWARDS.find(
    (reward) => reward.slot === slot && reward.preset === preset,
  );
  return reward !== undefined && unlocks.includes(reward.id);
}

export function availableInstrumentSound(
  requested: InstrumentSound,
  unlocks: Unlocks,
): InstrumentSound {
  const available = { ...DEFAULT_INSTRUMENT_SOUND };
  function choose<Slot extends keyof InstrumentSound>(slot: Slot) {
    if (isInstrumentPresetUnlocked(slot, requested[slot], unlocks)) {
      available[slot] = requested[slot];
    }
  }
  choose("tone");
  choose("shape");
  choose("filter");
  choose("effect");
  return available;
}

export function instrumentMilestones(
  puzzle: PuzzleId,
  unlocks: Unlocks,
): readonly {
  id: string;
  threshold: number;
  earned: boolean;
  label: string;
}[] {
  return rewardMilestones(puzzle, unlocks).map((milestone) => {
    const reward = PRESET_REWARDS.find(({ id }) => id === milestone.id);
    const label = reward
      ? INSTRUMENT_PRESETS[reward.slot].find(({ id }) => id === reward.preset)
          ?.label
      : undefined;
    return { ...milestone, label: label ?? "Sound reward" };
  });
}

export function instrumentPresetRequirement(
  slot: keyof InstrumentSound,
  preset: string,
): string | undefined {
  const reward = PRESET_REWARDS.find(
    (reward) => reward.slot === slot && reward.preset === preset,
  );
  if (!reward) return undefined;
  const milestone = rewardMilestones(reward.puzzle, []).find(
    ({ id }) => id === reward.id,
  );
  if (!milestone) return undefined;
  const puzzleLabel =
    reward.puzzle === "navigation" ? "Navigation" : "Imitation";
  return `${puzzleLabel} ${Math.round(milestone.threshold * 100)}%`;
}
