import test from "node:test";
import assert from "node:assert/strict";
import { type Entry } from "./domain";
import { feedReminderTime, latestFeedStart } from "./feedReminder";

const feed = (id: string, start: string): Entry => ({
  id,
  type: "feed",
  start,
  feedKind: "formula",
  amount: 120,
  note: "",
});

test("automatic feed reminders use the latest feed start, not record order", () => {
  const entries: Entry[] = [
    feed("newer", "2026-09-07T14:30:00+10:00"),
    {
      id: "diaper",
      type: "diaper",
      start: "2026-09-07T16:00:00+10:00",
      diaperKind: "wet",
      note: "",
    },
    feed("older", "2026-09-07T12:00:00+10:00"),
  ];
  const latest = Date.parse("2026-09-07T14:30:00+10:00");
  assert.equal(latestFeedStart(entries), latest);
  assert.equal(
    feedReminderTime(entries, 120, Date.parse("2026-09-07T14:31:00+10:00")),
    latest + 120 * 60000,
  );
});

test("automatic feed reminders trigger promptly when the latest feed is already overdue", () => {
  const now = Date.parse("2026-09-07T16:31:00+10:00");
  assert.equal(
    feedReminderTime([feed("f", "2026-09-07T14:30:00+10:00")], 120, now),
    now + 1000,
  );
  assert.equal(feedReminderTime([], 120, now), null);
});
