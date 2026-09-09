import test from "node:test";
import assert from "node:assert/strict";
import { recordRangeStart, recordChartBuckets } from "./recordRange";

const date = (y: number, m: number, d: number) => new Date(y, m - 1, d);
const key = (d: Date) => [d.getFullYear(), d.getMonth() + 1, d.getDate()];

test("record ranges include today and use clamped calendar months", () => {
  const now = date(2026, 9, 9);
  assert.deepEqual(key(recordRangeStart("7d", now)), [2026, 9, 3]);
  assert.deepEqual(key(recordRangeStart("2w", now)), [2026, 8, 27]);
  assert.deepEqual(key(recordRangeStart("1m", now)), [2026, 8, 10]);
  assert.deepEqual(key(recordRangeStart("3m", now)), [2026, 6, 10]);
  assert.deepEqual(key(recordRangeStart("6m", now)), [2026, 3, 10]);
  assert.deepEqual(
    key(recordRangeStart("1m", date(2024, 3, 31))),
    [2024, 3, 1],
  );
  assert.deepEqual(
    key(recordRangeStart("1m", date(2026, 3, 31))),
    [2026, 3, 1],
  );
  assert.deepEqual(
    key(recordRangeStart("3m", date(2026, 1, 9))),
    [2025, 10, 10],
  );
  assert.deepEqual(key(now), [2026, 9, 9]);
});

test("All starts at earliest history; empty history still has today", () => {
  const now = date(2026, 9, 9);
  assert.deepEqual(
    key(recordRangeStart("all", now, date(2025, 1, 1))),
    [2025, 1, 1],
  );
  assert.deepEqual(key(recordRangeStart("all", now)), [2026, 9, 9]);
  assert.deepEqual(
    key(recordRangeStart("all", now, date(2027, 1, 1))),
    [2026, 9, 9],
  );
});

test("long charts preserve all daily totals in at most 31 bars", () => {
  const seen: string[] = [];
  const result = recordChartBuckets(
    date(2026, 1, 1),
    date(2026, 12, 31),
    (d) => {
      seen.push(key(d).join("-"));
      return d.getDate() === 1 ? 120 : 0;
    },
  );
  assert.equal(seen.length, 365);
  assert.equal(new Set(seen).size, 365);
  assert.ok(result.buckets.length <= 31);
  assert.equal(
    result.buckets.reduce((sum, b) => sum + b.total, 0),
    1440,
  );
  assert.deepEqual(key(result.buckets.at(-1)!.end), [2026, 12, 31]);
});

test("chart dates step by calendar day through both Sydney DST transitions", () => {
  const previous = process.env.TZ;
  process.env.TZ = "Australia/Sydney";
  try {
    for (const month of [4, 10]) {
      const result = recordChartBuckets(
        date(2026, month, 1),
        date(2026, month, 7),
        () => 1,
      );
      assert.equal(result.daysPerBar, 1);
      assert.deepEqual(
        result.buckets.map((b) => b.date.getDate()),
        [1, 2, 3, 4, 5, 6, 7],
      );
      assert.ok(result.buckets.every((b) => b.date.getHours() === 0));
    }
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
});
