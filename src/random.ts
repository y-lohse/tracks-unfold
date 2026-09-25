import clamp from "lodash-es/clamp.js";

export type Rng = () => number;

function sample(rng: Rng): number {
  const value = rng();
  return clamp(Number.isFinite(value) ? value : 0, 0, 1 - Number.EPSILON);
}

export function randomIndex(length: number, rng: Rng): number {
  if (!Number.isInteger(length) || length <= 0) {
    throw new RangeError("Cannot choose from an empty collection");
  }
  return Math.floor(sample(rng) * length);
}

export function choose<T>(values: readonly T[], rng: Rng): T {
  const value = values[randomIndex(values.length, rng)];
  if (value === undefined) {
    throw new RangeError("Cannot choose from an empty collection");
  }
  return value;
}

export function shuffled<T>(values: readonly T[], rng: Rng): T[] {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = randomIndex(index + 1, rng);
    [result[index], result[other]] = [result[other] as T, result[index] as T];
  }
  return result;
}

export function weightedChoice<T>(
  values: readonly T[],
  weight: (value: T) => number,
  rng: Rng,
): T {
  if (values.length === 0) {
    throw new RangeError("Cannot choose from an empty collection");
  }
  const weights = values.map((value) => Math.max(0, weight(value)));
  const total = weights.reduce((sum, value) => sum + value, 0);
  if (total === 0) return choose(values, rng);

  let cursor = sample(rng) * total;
  for (let index = 0; index < values.length; index += 1) {
    cursor -= weights[index] ?? 0;
    if (cursor < 0) return values[index] as T;
  }
  return values[values.length - 1] as T;
}

export function weightedSampleWithoutReplacement<T>(
  values: readonly T[],
  count: number,
  weight: (value: T) => number,
  rng: Rng,
): T[] {
  const pool = [...values];
  const result: T[] = [];
  while (pool.length > 0 && result.length < count) {
    const picked = weightedChoice(pool, weight, rng);
    result.push(picked);
    pool.splice(pool.indexOf(picked), 1);
  }
  return result;
}

/** Small deterministic RNG useful for tests, replays, and reproducible previews. */
export function createSeededRng(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}
