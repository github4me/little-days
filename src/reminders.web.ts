import type { Entry } from "./domain";

export type Reminder = { id: string; title: string; detail: string };

export async function listReminders(): Promise<Reminder[]> {
  return [];
}

export async function cancelReminder(_id: string) {}

export async function addReminder(
  _title: string,
  _minutes: number,
  _dailyTime?: string,
  _silent = true,
) {
  throw new Error(
    "本地提醒需要在 iPhone 或 Android 真机中设置，网页预览不支持。",
  );
}

export async function addAutoFeedReminder(
  _title: string,
  _minutes: number,
  _silent: boolean,
  _entries: Entry[],
) {
  throw new Error(
    "本地提醒需要在 iPhone 或 Android 真机中设置，网页预览不支持。",
  );
}

export async function rescheduleAutoFeedReminders(_entries: Entry[]) {}
