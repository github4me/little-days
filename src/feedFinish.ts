import { Entry, validateEntry } from "./domain";

export const isBottleFeed = (entry: Entry) =>
  entry.feedKind === "formula" || entry.feedKind === "expressed";

// Retain an existing non-step amount exactly until the parent changes it.
export function milkAmounts(original: number): number[] {
  return [
    ...new Set([...Array.from({ length: 401 }, (_, i) => i * 5), original]),
  ]
    .filter((n) => Number.isFinite(n) && n >= 0 && n <= 2000)
    .sort((a, b) => a - b);
}

export function finishFeed(
  entry: Entry,
  stoppedAt: string,
  amount?: number,
): Entry {
  if (entry.type !== "feed" || !entry.feedRunning || entry.end)
    throw new Error("喂养计时状态无效");
  const finished = { ...entry, end: stoppedAt };
  delete finished.feedRunning;
  if (isBottleFeed(entry)) finished.amount = amount;
  else delete finished.amount;
  return validateEntry(finished);
}
