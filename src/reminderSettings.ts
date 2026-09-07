export type ReminderKind = "feed" | "diaper" | "sleep";
export type ReminderMode = "once" | "daily" | "after-feed";
export type ReminderSettings = {
  kind: ReminderKind;
  mode: ReminderMode;
  title: string;
  minutes: number;
  dailyTime: string;
  silent: boolean;
};

function normalizeKind(value: unknown): ReminderKind | null {
  if (value === "feed" || value === "喂养") return "feed";
  if (value === "diaper" || value === "换尿布") return "diaper";
  if (value === "sleep" || value === "睡眠") return "sleep";
  return null;
}

export function parseReminderSettings(value: unknown): ReminderSettings | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  const kind = normalizeKind(input.kind);
  if (
    !kind ||
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
  if (input.mode === "after-feed" && kind !== "feed") return null;
  if (
    input.mode === "daily" &&
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(input.dailyTime)
  )
    return null;
  if (input.mode !== "daily" && input.dailyTime !== "") return null;
  return { ...input, kind } as ReminderSettings;
}

export function settingsFromReminderData(
  title: string,
  data: Record<string, unknown> | undefined,
): ReminderSettings | undefined {
  const mode = data?.reminderMode;
  const kind = data?.reminderKind ?? (mode === "after-feed" ? "feed" : "");
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
