import type { Entry } from "./domain";

export function latestFeedStart(entries: Entry[]): number | null {
  let latest: number | null = null;
  for (const entry of entries) {
    if (entry.type !== "feed") continue;
    const start = Date.parse(entry.start);
    if (Number.isFinite(start) && (latest === null || start > latest))
      latest = start;
  }
  return latest;
}

export function feedReminderTime(
  entries: Entry[],
  minutes: number,
  now = Date.now(),
): number | null {
  const start = latestFeedStart(entries);
  if (start === null || !Number.isFinite(minutes) || minutes < 1) return null;
  return Math.max(start + minutes * 60000, now + 1000);
}
