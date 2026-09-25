import clamp from "lodash-es/clamp.js";

/** Clamp finite normalized values to [0, 1], treating invalid input as zero. */
export function clampUnit(value: number): number {
  return clamp(Number.isFinite(value) ? value : 0, 0, 1);
}
