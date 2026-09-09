export type RecordRange = "7d" | "2w" | "1m" | "3m" | "6m" | "all";

const midnight = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());

// Include today. Month windows start the day after the clamped calendar anniversary.
export function recordRangeStart(
  range: RecordRange,
  now: Date,
  earliest?: Date,
): Date {
  const today = midnight(now);
  if (range === "all")
    return earliest && earliest < today ? midnight(earliest) : today;
  if (range === "7d" || range === "2w") {
    today.setDate(today.getDate() - (range === "7d" ? 6 : 13));
    return today;
  }
  const months = range === "1m" ? 1 : range === "3m" ? 3 : 6;
  const month = new Date(today.getFullYear(), today.getMonth() - months, 1);
  const lastDay = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0,
  ).getDate();
  month.setDate(Math.min(today.getDate(), lastDay) + 1);
  return month;
}

export function recordChartBuckets(
  start: Date,
  now: Date,
  totalForDay: (date: Date) => number,
) {
  const last = midnight(now);
  const ordinal = (d: Date) =>
    Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000;
  const dayCount = Math.max(1, ordinal(last) - ordinal(start) + 1);
  const daysPerBar = Math.ceil(dayCount / 31);
  const buckets: { date: Date; end: Date; total: number }[] = [];
  let index = 0;
  for (
    const date = midnight(start);
    date <= last;
    date.setDate(date.getDate() + 1), index++
  ) {
    if (index % daysPerBar === 0)
      buckets.push({ date: new Date(date), end: new Date(date), total: 0 });
    const bucket = buckets[buckets.length - 1];
    bucket.end = new Date(date);
    bucket.total += totalForDay(new Date(date));
  }
  return { buckets, daysPerBar };
}
