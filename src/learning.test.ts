import test from "node:test";
import assert from "node:assert/strict";
import {
  activitiesForMonths,
  ageBands,
  completedMonths,
  dailyActivities,
  learningSources,
  parsePlayFavorites,
  playActivities,
  playDayKey,
  playCheckinKey,
} from "./learning";

test("play age uses completed calendar months and safely handles missing or invalid birthdays", () => {
  assert.equal(completedMonths("2026-07-01", new Date(2026, 8, 8)), 2);
  assert.equal(completedMonths("2026-07-09", new Date(2026, 8, 8)), 1);
  assert.equal(completedMonths("2026-01-31", new Date(2026, 1, 28)), 1);
  assert.equal(completedMonths("2024-02-29", new Date(2025, 1, 28)), 12);
  assert.equal(completedMonths("2026-09-08", new Date(2026, 8, 8)), 0);
  for (const birth of ["", "invalid", "2026-02-30", "2026-13-01", "2026-09-09"])
    assert.equal(completedMonths(birth, new Date(2026, 8, 8)), null);
  assert.equal(completedMonths("2026-07-01", new Date(NaN)), null);
});

test("check-ins use validated local calendar dates including midnight and DST days", () => {
  assert.equal(playDayKey(new Date(2026, 8, 8, 23, 59)), "2026-09-08");
  assert.equal(playDayKey(new Date(2026, 8, 9, 0, 0)), "2026-09-09");
  for (const day of ["2026-04-05", "2026-10-04", "2024-02-29"])
    assert.equal(playCheckinKey(day), `play-checkins-${day}`);
  for (const day of [
    "2026-02-29",
    "2026-02-30",
    "2026-13-01",
    "bad",
    "2026-9-08",
    "__proto__",
  ])
    assert.throws(() => playCheckinKey(day));
  assert.throws(() => playDayKey(new Date(NaN)));
  assert.ok(activitiesForMonths(0).some((a) => a.id === "contrast-card"));
  assert.ok(!activitiesForMonths(3).some((a) => a.id === "contrast-card"));
  assert.ok(activitiesForMonths(5).some((a) => a.id === "tummy-time"));
  assert.ok(!activitiesForMonths(6).some((a) => a.id === "tummy-time"));
});

test("every supported age has two distinct safe-filtered daily ideas stable within a local day", () => {
  for (let months = 0; months < 25; months++) {
    assert.ok(
      activitiesForMonths(months).length >= 6,
      `month ${months} needs at least six choices`,
    );
    assert.equal(
      ageBands.filter((b) => months >= b.min && months < b.max).length,
      1,
    );
    const ideas = dailyActivities(months, new Date(2026, 8, 8, 0));
    assert.equal(ideas.length, 2);
    assert.equal(new Set(ideas.map((a) => a.id)).size, 2);
    assert.ok(ideas.every((a) => a.min <= months && a.max > months));
    assert.deepEqual(
      ideas,
      dailyActivities(months, new Date(2026, 8, 8, 23, 59)),
    );
  }
  for (const invalid of [-1, 25, 36, NaN, 1.5])
    assert.deepEqual(activitiesForMonths(invalid), []);
  assert.deepEqual(dailyActivities(2, new Date(NaN)), []);
  assert.ok(ageBands.every((b) => activitiesForMonths(b.min).length >= 2));
});

test("play catalog has unique IDs, bilingual steps, safety notes and known HTTPS sources", () => {
  assert.equal(
    new Set(playActivities.map((a) => a.id)).size,
    playActivities.length,
  );
  for (const a of playActivities) {
    assert.ok(a.min >= 0 && a.max <= 25 && a.min < a.max);
    assert.equal(a.steps.length, 2);
    for (const value of [a.title, a.focus, a.materials, a.safety, ...a.steps]) {
      assert.ok(value.zh.trim());
      assert.ok(value.en.trim());
      assert.doesNotMatch(value.en, /[\p{Script=Han}]/u);
    }
    assert.ok(learningSources[a.source].url.startsWith("https://"));
  }
});

test("favorites preserve known IDs, deduplicate and reject corrupt data without overwriting it", () => {
  assert.deepEqual(parsePlayFavorites(null), []);
  assert.deepEqual(parsePlayFavorites('["peekaboo", "peekaboo", "unknown"]'), [
    "peekaboo",
  ]);
  for (const raw of ["bad json", "null", "{}", '["peekaboo", 3]'])
    assert.throws(() => parsePlayFavorites(raw));
});
