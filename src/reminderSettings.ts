export type ReminderKind = "喂养" | "换尿布" | "睡眠";
export type ReminderMode = "once" | "daily" | "after-feed";
export type ReminderSettings = {
  kind: ReminderKind;
  mode: ReminderMode;
  title: string;
  minutes: number;
  dailyTime: string;
  silent: boolean;
};

export function parseReminderSettings(value: unknown): ReminderSettings | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  if (
    !["喂养", "换尿布", "睡眠"].includes(input.kind as string) ||
    !["once", "daily", "after-feed"].includes(input.mode as string) ||
    typeof input.title !== "string" ||
    input.title.length > 100 ||
    typeof input.minutes !== "number" ||
    !Number.isFinite(input.minutes) ||
    input.minutes < 1 ||
    input.minutes > 10080 ||
    typeof input.dailyTime !== "string" ||
    typeof input.silent !== "boolean"
  )
    return null;
  if (input.mode === "after-feed" && input.kind !== "喂养") return null;
  if (
    input.mode === "daily" &&
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(input.dailyTime)
  )
    return null;
  if (input.mode !== "daily" && input.dailyTime !== "") return null;
  return input as ReminderSettings;
}

export function settingsFromReminderData(
  title: string,
  data: Record<string, unknown> | undefined,
): ReminderSettings | undefined {
  const mode = data?.reminderMode;
  const kind = data?.reminderKind ?? (mode === "after-feed" ? "喂养" : "");
  return (
    parseReminderSettings({
      kind,
      mode,
      title,
      minutes: Number(data?.minutes),
      dailyTime: typeof data?.dailyTime === "string" ? data.dailyTime : "",
      silent: data?.silent === true,
    }) ?? undefined
  );
}
