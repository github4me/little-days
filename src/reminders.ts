import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import type { Entry } from "./domain";
import { feedReminderTime } from "./feedReminder";

export type Reminder = { id: string; title: string; detail: string };
const autoFeedMode = "after-feed";

Notifications.setNotificationHandler({
  handleNotification: async (notification) => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: !!notification.request.content.sound,
    shouldSetBadge: false,
  }),
});

function validMinutes(minutes: number) {
  if (!Number.isFinite(minutes) || minutes < 1 || minutes > 10080)
    throw new Error("请填写 1–10080 分钟");
}

async function prepareChannel(silent: boolean) {
  if (Platform.OS === "android")
    await Notifications.setNotificationChannelAsync(silent ? "quiet" : "care", {
      name: silent ? "安静提醒" : "照护提醒",
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: silent ? null : "default",
    });
  return silent ? "quiet" : "care";
}

async function requirePermission() {
  const permission = await Notifications.requestPermissionsAsync();
  if (
    !permission.granted &&
    permission.ios?.status !== Notifications.IosAuthorizationStatus.PROVISIONAL
  )
    throw new Error("请在手机设置中允许通知后再试");
}

function autoFeedDetail(time: number) {
  return `随最新喂养 · ${new Date(time).toLocaleString("zh-CN")}`;
}

async function scheduleAutoFeedReminder(
  title: string,
  minutes: number,
  silent: boolean,
  time: number,
) {
  const channelId = await prepareChannel(silent);
  const detail = autoFeedDetail(time);
  return Notifications.scheduleNotificationAsync({
    content: {
      title,
      body: "距离上次喂养已到设定间隔。",
      sound: silent ? false : "default",
      data: {
        detail,
        reminderMode: autoFeedMode,
        minutes,
        silent,
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: new Date(time),
      channelId,
    },
  });
}

export async function listReminders(): Promise<Reminder[]> {
  return (await Notifications.getAllScheduledNotificationsAsync()).map((n) => ({
    id: n.identifier,
    title: n.content.title ?? "照护提醒",
    detail: String(n.content.data?.detail ?? ""),
  }));
}

export async function cancelReminder(id: string) {
  await Notifications.cancelScheduledNotificationAsync(id);
}

export async function addReminder(
  title: string,
  minutes: number,
  dailyTime?: string,
  silent = true,
) {
  const channelId = await prepareChannel(silent);
  await requirePermission();
  let trigger: Notifications.NotificationTriggerInput;
  let detail: string;
  if (dailyTime) {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(dailyTime))
      throw new Error("时间格式应为 HH:mm");
    const [hour, minute] = dailyTime.split(":").map(Number);
    trigger = {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId,
    };
    detail = `每天 ${dailyTime}`;
  } else {
    validMinutes(minutes);
    const date = new Date(Date.now() + minutes * 60000);
    trigger = {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
      channelId,
    };
    detail = date.toLocaleString("zh-CN");
  }
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body: "按宝宝当下的需要安排照护。",
      sound: silent ? false : "default",
      data: { detail },
    },
    trigger,
  });
}

export async function addAutoFeedReminder(
  title: string,
  minutes: number,
  silent: boolean,
  entries: Entry[],
) {
  validMinutes(minutes);
  const time = feedReminderTime(entries, minutes);
  if (time === null) throw new Error("请先保存一条喂养记录，再启用自动提醒");
  await requirePermission();
  await scheduleAutoFeedReminder(title, minutes, silent, time);
}

export async function rescheduleAutoFeedReminders(entries: Entry[]) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const reminder of scheduled) {
    const data = reminder.content.data;
    if (data?.reminderMode !== autoFeedMode) continue;
    const minutes = Number(data.minutes);
    if (!Number.isFinite(minutes) || minutes < 1 || minutes > 10080) continue;
    const time = feedReminderTime(entries, minutes);
    if (time === null) {
      await Notifications.cancelScheduledNotificationAsync(reminder.identifier);
      continue;
    }
    await scheduleAutoFeedReminder(
      reminder.content.title ?? "喂养提醒",
      minutes,
      data.silent === true,
      time,
    );
    await Notifications.cancelScheduledNotificationAsync(reminder.identifier);
  }
}
