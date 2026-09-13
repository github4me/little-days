import test from "node:test";
import assert from "node:assert/strict";
import { Entry } from "./domain";
import { finishFeed, milkAmounts } from "./feedFinish";

const running: Entry = {
  id: "timer",
  type: "feed",
  start: "2026-09-12T23:55:00+10:00",
  feedKind: "formula",
  amount: 120,
  feedRunning: true,
  note: "Keep note",
};
const stoppedAt = "2026-09-13T00:15:00+10:00";
test("finish feed preserves Stop time and original record while replacing actual volume", () => {
  for (const amount of [0, 85, 120, 123.5, 2000]) {
    const finished = finishFeed(running, stoppedAt, amount);
    assert.equal(finished.amount, amount);
    assert.equal(finished.end, stoppedAt);
    assert.equal(finished.id, running.id);
    assert.equal(finished.note, running.note);
    assert.equal(finished.start, running.start);
    assert.equal(finished.feedRunning, undefined);
  }
  assert.equal(running.amount, 120);
  assert.equal(running.feedRunning, true);
});
test("finish rejects invalid or already finished timers and keeps breastfeeding duration-only", () => {
  for (const amount of [-1, 2001, NaN, undefined])
    assert.throws(() => finishFeed(running, stoppedAt, amount));
  assert.throws(() => finishFeed(running, "2026-09-12T20:00:00+10:00", 120));
  assert.throws(() =>
    finishFeed(finishFeed(running, stoppedAt, 120), stoppedAt, 120),
  );
  const breast = { ...running, feedKind: "breast-left" as const };
  delete breast.amount;
  assert.equal(finishFeed(breast, stoppedAt).amount, undefined);
});
test("wheel covers allowed boundaries and retains original non-step amounts", () => {
  const options = milkAmounts(123.5);
  assert.equal(options[0], 0);
  assert.equal(options.at(-1), 2000);
  assert.ok(options.includes(123.5));
  assert.equal(new Set(options).size, options.length);
  assert.equal(milkAmounts(120).length, 401);
});
