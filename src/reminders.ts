import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
export type Reminder = { id: string; title: string; detail: string };
Notifications.setNotificationHandler({
  handleNotification: async (notification) => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: !!notification.request.content.sound,
    shouldSetBadge: false,
  }),
});
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
  if (Platform.OS === "android")
    await Notifications.setNotificationChannelAsync(silent ? "quiet" : "care", {
      name: silent ? "安静提醒" : "照护提醒",
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: silent ? null : "default",
    });
  const permission = await Notifications.requestPermissionsAsync();
  if (
    !permission.granted &&
    permission.ios?.status !== Notifications.IosAuthorizationStatus.PROVISIONAL
  )
    throw new Error("请在手机设置中允许通知后再试");
  const channelId = silent ? "quiet" : "care";
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
    if (!Number.isFinite(minutes) || minutes < 1 || minutes > 10080)
      throw new Error("请填写 1–10080 分钟");
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
