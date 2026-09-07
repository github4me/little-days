import React, { useContext } from "react";
import { View } from "react-native";
import Svg, { Path, Line, Circle, Text as SvgText } from "react-native-svg";
import { Entry, State } from "./domain";
import { referenceSeries } from "./growth";
import { T, Theme } from "./ui";
export type Metric = "weight" | "length" | "head";
function ageMonths(birth: string, instant: string) {
  const d = new Date(instant);
  const days =
    (Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) -
      Date.parse(birth + "T00:00:00Z")) /
    86400000;
  return days / 30.4375;
}
export default function GrowthChart({
  entries,
  profile,
  metric,
}: {
  entries: Entry[];
  profile: State["profile"];
  metric: Metric;
}) {
  const c = useContext(Theme);
  if (!profile.birthDate)
    return (
      <T style={{ color: c.muted }}>
        先在「我的」设置出生日期，即可按月龄查看曲线。
      </T>
    );
  const points = entries
    .filter((e) => e.type === "growth" && e[metric] !== undefined)
    .map((e) => ({
      month: ageMonths(profile.birthDate, e.start),
      value: e[metric]!,
      id: e.id,
    }))
    .filter((e) => e.month >= 0)
    .sort((a, b) => a.month - b.month);
  const maxMonth = Math.max(
    3,
    Math.ceil(Math.max(0, ...points.map((p) => p.month))),
  );
  const refs = referenceSeries(metric, profile.sex, Math.min(24, maxMonth));
  const values = [
    ...points.map((p) => p.value),
    ...refs.flatMap((r) => [r.p3, r.p97]),
  ];
  if (!values.length)
    return (
      <T style={{ color: c.muted }}>添加测量记录，或设置性别查看参考曲线。</T>
    );
  const min = Math.floor(Math.min(...values) * 0.9),
    max = Math.ceil(Math.max(...values) * 1.08),
    range = Math.max(1, max - min);
  const x = (m: number) => 42 + (m / maxMonth) * 272,
    y = (v: number) => 190 - ((v - min) / range) * 165;
  const curve = (items: { month: number; value: number }[]) =>
    items
      .map((p, i) => `${i ? "L" : "M"}${x(p.month)},${y(p.value)}`)
      .join(" ");
  return (
    <View>
      <Svg
        width="100%"
        height={240}
        viewBox="0 0 340 240"
        accessibilityLabel="生长曲线，详细数值见下方记录"
      >
        {[0, 1, 2, 3].map((i) => {
          const v = min + (i * range) / 3;
          return (
            <React.Fragment key={i}>
              <Line x1={42} x2={314} y1={y(v)} y2={y(v)} stroke={c.line} />
              <SvgText
                x={34}
                y={y(v) + 4}
                textAnchor="end"
                fill={c.muted}
                fontSize={10}
              >
                {v.toFixed(metric === "weight" ? 1 : 0)}
              </SvgText>
            </React.Fragment>
          );
        })}
        {(["p3", "p15", "p50", "p85", "p97"] as const).map((k) => (
          <Path
            key={k}
            d={curve(refs.map((r) => ({ month: r.months, value: r[k] })))}
            fill="none"
            stroke={k === "p50" ? "#A3B89C" : c.line}
            strokeWidth={k === "p50" ? 2 : 1.2}
            strokeDasharray={k === "p50" ? undefined : "4 4"}
          />
        ))}
        <Path
          d={curve(points)}
          fill="none"
          stroke={c.primary}
          strokeWidth={3}
        />
        {points.map((p) => (
          <Circle
            key={p.id}
            cx={x(p.month)}
            cy={y(p.value)}
            r={4}
            fill={c.primary}
            stroke={c.card}
            strokeWidth={2}
          />
        ))}
        {[0, 1, 2, 3].map((i) => (
          <SvgText
            key={i}
            x={x((i * maxMonth) / 3)}
            y={216}
            fill={c.muted}
            fontSize={11}
            textAnchor="middle"
          >
            {((i * maxMonth) / 3).toFixed(0)}月
          </SvgText>
        ))}
      </Svg>
      <T style={{ color: c.muted, fontSize: 12 }}>
        ● 宝宝实测　— WHO P50　┄ P3 / P15 / P85 / P97
      </T>
      <T style={{ color: c.muted, fontSize: 12 }}>
        {profile.sex === "unspecified"
          ? "设置性别后显示参考线。"
          : "WHO 0–24月参考；月龄按天数 ÷ 30.4375 展示。"}{" "}
        曲线用于记录趋势，不作诊断。
      </T>
    </View>
  );
}
