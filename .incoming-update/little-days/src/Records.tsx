import React, { useContext, useState } from "react";
import { View, Pressable } from "react-native";
import Svg, { Rect, Line, Text as Label } from "react-native-svg";
import { Entry, elapsedLabel, summarize } from "./domain";
import { Theme, T, Card, Chips, Button, row } from "./ui";
type Kind = "feed" | "diaper" | "sleep";
const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const midnight = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());
const clock = (iso: string) =>
  new Date(iso).toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
const colors = ["#99CBEA", "#AAD7CD", "#C7B9E5"];
type Bar = { x: number; value: number; color: string; label?: string };
function Bars({
  bars,
  labels,
  maxX = 24,
  unit,
  values = false,
}: {
  bars: Bar[];
  labels: { x: number; text: string }[];
  maxX?: number;
  unit: string;
  values?: boolean;
}) {
  const c = useContext(Theme),
    max = Math.max(1, ...bars.map((b) => b.value));
  const x = (v: number) => 12 + (v / maxX) * 272;
  const width = Math.min(
    values ? 18 : 30,
    (260 / Math.max(1, bars.length)) * 0.6,
  );
  return (
    <Svg
      width="100%"
      height={values ? 132 : 172}
      viewBox={`0 0 330 ${values ? 132 : 172}`}
      accessibilityLabel={`统计图，单位${unit}，数值见每日汇总和明细`}
    >
      {[0, 0.5, 1].map((f) => (
        <React.Fragment key={f}>
          <Line
            x1={12}
            x2={294}
            y1={110 - f * 82}
            y2={110 - f * 82}
            stroke={c.line}
          />
          {!values ? (
            <Label
              x={326}
              y={114 - f * 82}
              fill={c.muted}
              fontSize={10}
              textAnchor="end"
            >
              {(max * f).toFixed(unit === "小时" ? 1 : 0)}
            </Label>
          ) : null}
        </React.Fragment>
      ))}
      {bars.map((b, i) => (
        <React.Fragment key={i}>
          <Rect
            x={x(b.x) - width / 2}
            y={110 - (b.value / max) * 82}
            width={width}
            height={Math.max(0, (b.value / max) * 82)}
            fill={b.color}
            rx={3}
          />
          {values && bars.length <= 12 ? (
            <Label
              x={x(b.x)}
              y={103 - (b.value / max) * 82}
              fontSize={9}
              textAnchor="middle"
              fill={c.muted}
            >
              {b.label ?? b.value.toFixed(0)}
            </Label>
          ) : null}
        </React.Fragment>
      ))}
      {labels.map((l, i) => (
        <Label
          key={i}
          x={x(l.x)}
          y={129}
          fill={c.muted}
          fontSize={10}
          textAnchor="middle"
        >
          {l.text}
        </Label>
      ))}
    </Svg>
  );
}
export default function Records({
  entries,
  now,
  onEdit,
  onDelete,
}: {
  entries: Entry[];
  now: number;
  onEdit: (e: Entry) => void;
  onDelete: (e: Entry) => void;
}) {
  const c = useContext(Theme),
    [kind, setKind] = useState<Kind>("feed"),
    [unit, setUnit] = useState("mL"),
    [limit, setLimit] = useState(14);
  const selected = entries
    .filter((e) => e.type === kind)
    .sort((a, b) => Date.parse(b.start) - Date.parse(a.start));
  const value = (e: Entry) =>
    kind === "feed"
      ? unit === "mL"
        ? (e.amount ?? 0)
        : e.end
          ? (Date.parse(e.end) - Date.parse(e.start)) / 3600000
          : 0
      : kind === "sleep"
        ? (Date.parse(e.end ?? new Date(now).toISOString()) -
            Date.parse(e.start)) /
          3600000
        : 1;
  const color = (e: Entry) =>
    kind === "feed"
      ? e.feedKind?.startsWith("breast")
        ? colors[1]
        : colors[0]
      : kind === "sleep"
        ? colors[2]
        : e.diaperKind === "wet"
          ? colors[0]
          : e.diaperKind === "dirty"
            ? colors[2]
            : colors[1];
  const groups = new Map<string, { date: Date; events: Entry[] }>();
  for (const e of selected) {
    const first = midnight(new Date(e.start)),
      last =
        kind === "sleep"
          ? midnight(
              new Date(
                Math.max(
                  Date.parse(e.start),
                  Date.parse(e.end ?? new Date(now).toISOString()) - 1,
                ),
              ),
            )
          : first;
    // Iterate days (not fixed 24h) so DST boundaries remain correct.
    for (let d = new Date(first); d <= last; d.setDate(d.getDate() + 1)) {
      const key = dayKey(d);
      if (!groups.has(key)) groups.set(key, { date: new Date(d), events: [] });
      groups.get(key)!.events.push(e);
    }
  }
  const days = [...groups.values()].sort(
    (a, b) => b.date.getTime() - a.date.getTime(),
  );
  const perDay = (date: Date, events: Entry[]) => {
    const end = new Date(date);
    end.setDate(end.getDate() + 1);
    const normalized = events.map((e) =>
      e.type === "sleep" && !e.end
        ? { ...e, end: new Date(now).toISOString() }
        : e,
    );
    const s = summarize(normalized, date, end);
    return {
      s,
      total:
        kind === "sleep"
          ? s.sleepMinutes / 60
          : kind === "diaper"
            ? s.diaperCount
            : unit === "mL"
              ? s.feedMl
              : events.reduce((a, e) => a + value(e), 0),
    };
  };
  const chartDays = Array.from({ length: 7 }, (_, i) => {
    const d = midnight(new Date(now));
    d.setDate(d.getDate() - 6 + i);
    return { date: d, events: groups.get(dayKey(d))?.events ?? [] };
  });
  const displayUnit =
    kind === "feed"
      ? unit === "mL"
        ? "mL"
        : "小时"
      : kind === "sleep"
        ? "小时"
        : "次";
  return (
    <View style={{ gap: 20 }}>
      <Chips
        value={kind}
        options={[
          { label: "喂奶", value: "feed" },
          { label: "尿布", value: "diaper" },
          { label: "睡眠", value: "sleep" },
        ]}
        onChange={(v) => {
          setKind(v as Kind);
          setLimit(14);
        }}
      />
      <Card>
        <View style={row}>
          <T style={{ fontSize: 18, fontWeight: "700" }}>近 7 天</T>
          {kind === "feed" ? (
            <Chips
              value={unit}
              options={[
                { label: "mL", value: "mL" },
                { label: "时长", value: "hours" },
              ]}
              onChange={setUnit}
            />
          ) : (
            <T style={{ color: c.muted }}>{displayUnit}</T>
          )}
        </View>
        <Bars
          unit={displayUnit}
          maxX={7}
          bars={chartDays.map((d, i) => ({
            x: i + 0.5,
            value: perDay(d.date, d.events).total,
            color: kind === "sleep" ? colors[2] : colors[0],
          }))}
          labels={chartDays.map((d, i) => ({
            x: i + 0.5,
            text: `${d.date.getMonth() + 1}/${d.date.getDate()}`,
          }))}
        />
        <T style={{ fontSize: 12, color: c.muted }}>
          {kind === "feed"
            ? "● 瓶喂　● 亲喂只计时长，不估算奶量"
            : kind === "sleep"
              ? "已记录睡眠，跨日拆分；重叠时段只计一次"
              : "一次混合尿布按一次更换统计"}
        </T>
      </Card>
      {!days.length ? (
        <Card>
          <T style={{ color: c.muted }}>
            还没有
            {kind === "feed" ? "喂奶" : kind === "sleep" ? "睡眠" : "尿布"}记录
          </T>
        </Card>
      ) : null}
      {days.slice(0, limit).map(({ date, events }) => {
        const { s } = perDay(date, events);
        const dayEnd = new Date(date);
        dayEnd.setDate(dayEnd.getDate() + 1);
        const minutes = events.reduce(
          (n, e) =>
            n + (e.end ? (Date.parse(e.end) - Date.parse(e.start)) / 60000 : 0),
          0,
        );
        return (
          <View key={dayKey(date)} style={{ gap: 10 }}>
            <T style={{ fontSize: 17, fontWeight: "600" }}>
              {date.toLocaleDateString("zh-CN", {
                month: "long",
                day: "numeric",
                weekday: "long",
              })}{" "}
              <T style={{ fontSize: 12, color: c.muted }}>
                {date.getFullYear()}
              </T>
            </T>
            <Card>
              <T style={{ fontSize: 16, color: c.muted }}>
                {kind === "feed"
                  ? `${events.length} 次喂奶 · ${s.feedMl} mL · ${elapsedLabel(minutes * 60000)}`
                  : kind === "sleep"
                    ? `${events.length} 段睡眠 · ${elapsedLabel(s.sleepMinutes * 60000)}`
                    : `${s.diaperCount} 次更换 · 有尿 ${s.wetCount} 次 · 有便 ${s.dirtyCount} 次`}
              </T>
              <Bars
                values
                unit={displayUnit}
                bars={events.map((e) => {
                  const start = Math.max(date.getTime(), Date.parse(e.start)),
                    d = new Date(start);
                  return {
                    x: d.getHours() + d.getMinutes() / 60,
                    value:
                      kind === "sleep"
                        ? Math.max(
                            0,
                            Math.min(
                              dayEnd.getTime(),
                              Date.parse(e.end ?? new Date(now).toISOString()),
                            ) - start,
                          ) / 3600000
                        : value(e),
                    color: color(e),
                    label:
                      kind === "feed" && unit === "mL"
                        ? String(e.amount ?? "亲喂")
                        : undefined,
                  };
                })}
                labels={[0, 6, 12, 18, 24].map((x) => ({
                  x,
                  text: String(x).padStart(2, "0"),
                }))}
              />
              {events.map((e) => {
                const index = selected.findIndex((v) => v.id === e.id),
                  prev = selected[index + 1];
                return (
                  <View
                    key={e.id}
                    style={{
                      borderTopWidth: 1,
                      borderColor: c.line,
                      paddingTop: 12,
                      gap: 4,
                    }}
                  >
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`编辑${kind === "feed" ? "喂奶" : kind === "sleep" ? "睡眠" : "尿布"}`}
                      onPress={() => onEdit(e)}
                      style={{ minHeight: 44, gap: 6 }}
                    >
                      <View style={row}>
                        <T style={{ fontWeight: "600" }}>
                          {clock(e.start)}
                          {kind === "sleep"
                            ? `–${e.end ? clock(e.end) : "正在睡"}`
                            : ""}
                        </T>
                        <T>
                          {kind === "feed"
                            ? e.amount !== undefined
                              ? `${e.amount} mL`
                              : "亲喂"
                            : kind === "diaper"
                              ? { wet: "尿", dirty: "便", mixed: "尿＋便" }[
                                  e.diaperKind!
                                ]
                              : elapsedLabel(
                                  Date.parse(
                                    e.end ?? new Date(now).toISOString(),
                                  ) - Date.parse(e.start),
                                )}
                        </T>
                        <T style={{ color: c.muted, fontSize: 12 }}>
                          {kind === "feed"
                            ? e.end
                              ? elapsedLabel(
                                  Date.parse(e.end) - Date.parse(e.start),
                                )
                              : "未记时长"
                            : "编辑 ›"}
                        </T>
                      </View>
                      {kind === "feed" ? (
                        <T style={{ fontSize: 12, color: c.muted }}>
                          距上次{" "}
                          {prev
                            ? elapsedLabel(
                                Date.parse(e.start) - Date.parse(prev.start),
                              )
                            : "—"}
                        </T>
                      ) : null}
                      {kind === "sleep" &&
                      dayKey(new Date(e.start)) !== dayKey(date) ? (
                        <T style={{ fontSize: 12, color: c.muted }}>
                          开始于 {dayKey(new Date(e.start))}；本日时长见汇总
                        </T>
                      ) : null}
                      {e.note ? (
                        <T style={{ fontSize: 12, color: c.muted }}>{e.note}</T>
                      ) : null}
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`删除${kind === "feed" ? "喂奶" : kind === "sleep" ? "睡眠" : "尿布"}`}
                      onPress={() => onDelete(e)}
                      style={{
                        minHeight: 32,
                        alignSelf: "flex-end",
                        justifyContent: "center",
                      }}
                    >
                      <T style={{ fontSize: 11, color: c.muted }}>删除</T>
                    </Pressable>
                  </View>
                );
              })}
            </Card>
          </View>
        );
      })}
      {days.length > limit ? (
        <Button
          label="更早的记录"
          secondary
          onPress={() => setLimit(limit + 14)}
        />
      ) : null}
    </View>
  );
}
