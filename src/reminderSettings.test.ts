import test from "node:test";
import assert from "node:assert/strict";
import {
  parseReminderSettings,
  settingsFromReminderData,
} from "./reminderSettings";

const automatic = {
  kind: "喂养",
  mode: "after-feed",
  title: "喂养提醒",
  minutes: 120,
  dailyTime: "",
  silent: true,
};

test("reminder settings round-trip only supported configurations", () => {
  assert.deepEqual(parseReminderSettings(automatic), automatic);
  assert.deepEqual(
    parseReminderSettings({
      ...automatic,
      kind: "睡眠",
      mode: "daily",
      dailyTime: "21:30",
    }),
    { ...automatic, kind: "睡眠", mode: "daily", dailyTime: "21:30" },
  );
  assert.deepEqual(
    settingsFromReminderData("喂养提醒", {
      reminderMode: "after-feed",
      minutes: 120,
      silent: true,
    }),
    automatic,
  );
});

test("reminder settings reject incomplete, invalid, and incompatible values", () => {
  for (const value of [
    null,
    { ...automatic, minutes: 0 },
    { ...automatic, silent: "yes" },
    { ...automatic, kind: "睡眠" },
    { ...automatic, mode: "daily", dailyTime: "9:30" },
  ])
    assert.equal(parseReminderSettings(value), null);
});
