import React, { useContext, useEffect, useRef, useState } from "react";
import { Linking, Pressable, ScrollView, View } from "react-native";
import { Card, T, Theme } from "./ui";
import { useI18n } from "./i18n";
import { loadPlayFavorites, savePlayFavorites } from "./storage";
import {
  activitiesForMonths,
  ageBands,
  completedMonths,
  dailyActivities,
  learningSources,
  playActivities,
  scenes,
  words,
  type LearningText,
  type PlayScene,
} from "./learning";

function Options({
  options,
  value,
  onChange,
}: {
  options: { value: string; icon: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  const c = useContext(Theme);
  return (
    <View style={{ flexDirection: "row", gap: 6 }}>
      {options.map((o) => (
        <Pressable
          key={o.value}
          accessibilityRole="button"
          accessibilityLabel={o.label}
          accessibilityState={{ selected: value === o.value }}
          onPress={() => onChange(o.value)}
          style={{
            flex: 1,
            minWidth: 0,
            minHeight: 62,
            borderRadius: 16,
            padding: 4,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: value === o.value ? c.soft : c.card,
            borderWidth: 1,
            borderColor: value === o.value ? c.primary : c.line,
          }}
        >
          <T raw style={{ fontSize: 21, lineHeight: 27, color: c.primary }}>
            {o.icon}
          </T>
          <T
            raw
            style={{
              fontSize: 11,
              lineHeight: 16,
              textAlign: "center",
              fontWeight: value === o.value ? "700" : "400",
            }}
          >
            {o.label}
          </T>
        </Pressable>
      ))}
    </View>
  );
}

export default function PlayLearning({
  birthDate,
  now,
}: {
  birthDate: string;
  now: number;
}) {
  const c = useContext(Theme);
  const { locale } = useI18n();
  const copy = (value: LearningText) =>
    locale === "en-US" ? value.en : value.zh;
  const text = (zh: string, en: string) => copy(words(zh, en));
  const actualMonths = completedMonths(birthDate, new Date(now));
  const actualSupported = actualMonths !== null && actualMonths < 24;
  const [manualMonths, setManualMonths] = useState<number | null>(null);
  const [mode, setMode] = useState("today");
  const [scene, setScene] = useState<PlayScene>("quiet");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<"load" | "save" | "link" | null>(null);
  const [retry, setRetry] = useState(0);
  const lock = useRef(false);
  useEffect(() => {
    let active = true;
    void loadPlayFavorites()
      .then((ids) => {
        if (active) {
          setFavorites(ids);
          setReady(true);
          setError(null);
        }
      })
      .catch(() => {
        if (active) setError("load");
      });
    return () => {
      active = false;
    };
  }, [retry]);
  useEffect(() => {
    setManualMonths(null);
    setExpanded(null);
  }, [birthDate]);
  const months = manualMonths ?? (actualSupported ? actualMonths : null);
  const eligible = months === null ? [] : activitiesForMonths(months);
  const shown =
    mode === "favorites"
      ? playActivities.filter((a) => favorites.includes(a.id))
      : months === null
        ? []
        : mode === "today"
          ? dailyActivities(months, new Date(now))
          : eligible.filter((a) => a.scene === scene);
  async function toggleFavorite(id: string) {
    if (!ready || lock.current) return;
    lock.current = true;
    setSaving(true);
    try {
      const next = favorites.includes(id)
        ? favorites.filter((item) => item !== id)
        : [...favorites, id];
      await savePlayFavorites(next);
      setFavorites(next);
      setError(null);
    } catch {
      setError("save");
    } finally {
      lock.current = false;
      setSaving(false);
    }
  }
  async function openSource(url: string) {
    try {
      await Linking.openURL(url);
    } catch {
      setError("link");
    }
  }
  return (
    <View style={{ gap: 16 }}>
      <View
        style={{
          borderLeftWidth: 3,
          borderLeftColor: c.primary,
          paddingLeft: 12,
          gap: 4,
        }}
      >
        <T raw style={{ fontWeight: "600", fontSize: 16 }}>
          {text(
            "把日常，变成一起玩的时光",
            "A little play in everyday moments",
          )}
        </T>
        <T raw style={{ color: c.muted, fontSize: 13, lineHeight: 20 }}>
          {text(
            "给家长看的点子，不是宝宝的屏幕课程。先读步骤，再放下手机；全程陪伴，累了就停，不必打卡。",
            "Ideas for parents, not screen lessons for babies. Read first, then put the phone away. Stay together, stop when tired; no streaks to keep.",
          )}
        </T>
      </View>
      <View style={{ gap: 8 }}>
        <T raw style={{ fontSize: 13, color: c.muted }}>
          {manualMonths !== null
            ? text("正在浏览手选月龄", "Browsing a selected age group")
            : actualSupported
              ? text(
                  `按宝宝满 ${actualMonths} 个月推荐`,
                  `Ideas for your baby's age: ${actualMonths} months`,
                )
              : actualMonths !== null && actualMonths >= 24
                ? text(
                    "首版覆盖 0–23 个月，可手选月龄浏览，不作为当前推荐。",
                    "This starter library covers 0–23 months. Choose a group to browse, not as a current-age recommendation.",
                  )
                : text(
                    "还没有可用的出生日期，请先选月龄浏览。",
                    "No usable birth date yet. Choose an age group to browse.",
                  )}
        </T>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 6 }}
        >
          {ageBands.map((band) => (
            <Pressable
              key={band.min}
              accessibilityRole="button"
              accessibilityLabel={text(
                `${band.label} 个月`,
                `${band.label} months`,
              )}
              accessibilityState={{
                selected:
                  months !== null && months >= band.min && months < band.max,
              }}
              onPress={() => {
                setManualMonths(band.min);
                setExpanded(null);
              }}
              style={{
                minHeight: 44,
                paddingHorizontal: 12,
                justifyContent: "center",
                borderRadius: 13,
                backgroundColor:
                  months !== null && months >= band.min && months < band.max
                    ? c.soft
                    : c.card,
              }}
            >
              <T raw style={{ fontSize: 12, color: c.primary }}>
                {text(`${band.label} 月`, `${band.label} mo`)}
              </T>
            </Pressable>
          ))}
        </ScrollView>
        {manualMonths !== null && actualSupported ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setManualMonths(null);
              setExpanded(null);
            }}
            style={{ minHeight: 40, justifyContent: "center" }}
          >
            <T raw style={{ fontSize: 12, color: c.primary }}>
              {text("回到宝宝实际月龄", "Use baby's actual age")}
            </T>
          </Pressable>
        ) : null}
      </View>
      <Options
        value={mode}
        onChange={(value) => {
          setMode(value);
          setExpanded(null);
        }}
        options={[
          {
            value: "today",
            icon: "☀",
            label: text("今日点子", "Today’s ideas"),
          },
          { value: "scenes", icon: "▧", label: text("生活场景", "By setting") },
          {
            value: "favorites",
            icon: "☆",
            label: text("我的收藏", "Favorites"),
          },
        ]}
      />
      {mode === "scenes" ? (
        <Options
          value={scene}
          onChange={(value) => {
            setScene(value as PlayScene);
            setExpanded(null);
          }}
          options={scenes.map((s) => ({
            value: s.id,
            icon: s.icon,
            label: copy(s.label),
          }))}
        />
      ) : null}
      {error ? (
        <View style={{ gap: 4 }}>
          <T raw accessibilityRole="alert" style={{ color: c.primary }}>
            {error === "load"
              ? text(
                  "收藏暂时无法读取，原数据未覆盖。",
                  "Favorites could not be loaded; existing data was not changed.",
                )
              : error === "save"
                ? text(
                    "收藏未保存，请重试。",
                    "Favorite was not saved. Please try again.",
                  )
                : text(
                    "无法打开参考链接，请联网后重试。",
                    "Could not open the reference. Check your connection and try again.",
                  )}
          </T>
          {error === "load" ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => setRetry((v) => v + 1)}
              style={{ minHeight: 44, justifyContent: "center" }}
            >
              <T raw>{text("重新读取收藏", "Reload favorites")}</T>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      {mode === "today" && months !== null ? (
        <T raw style={{ color: c.muted, fontSize: 12 }}>
          {text(
            "每天两个点子，想玩哪个都可以，也可以重复昨天的。",
            "Two ideas a day. Choose either, skip both, or repeat a favourite.",
          )}
        </T>
      ) : null}
      {shown.map((a) => {
        const open = expanded === a.id;
        const saved = favorites.includes(a.id);
        const currentScene = scenes.find((s) => s.id === a.scene)!;
        const source = learningSources[a.source];
        return (
          <Card key={a.id} style={{ padding: 16, gap: 8 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={text(
                `${open ? "收起" : "查看"}${a.title.zh}`,
                `${open ? "Hide" : "View"} ${a.title.en}`,
              )}
              accessibilityState={{ expanded: open }}
              onPress={() => setExpanded(open ? null : a.id)}
              style={{ minHeight: 48, gap: 4 }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <T
                  raw
                  style={{
                    color: c.primary,
                    fontWeight: "700",
                    fontSize: 17,
                    lineHeight: 23,
                    flex: 1,
                  }}
                >
                  {copy(a.title)}
                </T>
                <T raw style={{ color: c.primary }}>
                  {open ? "▴" : "▾"}
                </T>
              </View>
              <T raw style={{ color: c.muted, fontSize: 12, lineHeight: 18 }}>
                {copy(currentScene.label)} ·{" "}
                {text(`约 ${a.minutes} 分钟`, `About ${a.minutes} min`)} ·{" "}
                {copy(a.focus)}
              </T>
            </Pressable>
            {mode === "favorites" &&
            (months === null || months < a.min || months >= a.max) ? (
              <T raw style={{ fontSize: 12, color: c.muted }}>
                {text(
                  `参考月龄 ${a.min}–${a.max - 1} 个月，不是当前月龄推荐。`,
                  `Reference ages ${a.min}–${a.max - 1} months; not a current-age recommendation.`,
                )}
              </T>
            ) : null}
            {open ? (
              <View style={{ gap: 10, paddingTop: 4 }}>
                <T raw style={{ fontSize: 13 }}>
                  {text("准备：", "You need: ")}
                  {copy(a.materials)}
                </T>
                {a.steps.map((step, index) => (
                  <View key={index} style={{ flexDirection: "row", gap: 8 }}>
                    <T raw style={{ color: c.primary, fontSize: 13 }}>
                      {index + 1}.
                    </T>
                    <T raw style={{ fontSize: 14, lineHeight: 22, flex: 1 }}>
                      {copy(step)}
                    </T>
                  </View>
                ))}
                <View
                  style={{
                    backgroundColor: c.soft,
                    padding: 10,
                    borderRadius: 12,
                  }}
                >
                  <T raw style={{ fontSize: 12, lineHeight: 19 }}>
                    {text("安全提醒：", "Keep it safe: ")}
                    {copy(a.safety)}
                  </T>
                </View>
                <Pressable
                  accessibilityRole="link"
                  accessibilityLabel={text(
                    `参考来源：${source.label}`,
                    `Reference: ${source.label}`,
                  )}
                  onPress={() => void openSource(source.url)}
                  style={{ minHeight: 40, justifyContent: "center" }}
                >
                  <T raw style={{ fontSize: 12, color: c.primary }}>
                    {text("参考原则 · ", "Reference · ")}
                    {source.label} ↗
                  </T>
                </Pressable>
              </View>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={text(
                `${saved ? "取消收藏" : "收藏"}${a.title.zh}`,
                `${saved ? "Unfavorite" : "Favorite"} ${a.title.en}`,
              )}
              accessibilityState={{
                selected: saved,
                disabled: !ready || saving,
              }}
              disabled={!ready || saving}
              onPress={() => void toggleFavorite(a.id)}
              style={{
                minHeight: 44,
                justifyContent: "center",
                alignSelf: "flex-start",
                paddingHorizontal: 4,
                opacity: ready && !saving ? 1 : 0.5,
              }}
            >
              <T raw style={{ color: c.primary, fontSize: 13 }}>
                {saved ? "★ " : "☆ "}
                {text(
                  saved ? "已收藏" : "收藏点子",
                  saved ? "Favorited" : "Keep this idea",
                )}
              </T>
            </Pressable>
          </Card>
        );
      })}
      {!shown.length && (mode === "favorites" || months !== null) ? (
        <T raw style={{ color: c.muted }}>
          {mode === "favorites"
            ? text(
                ready
                  ? "还没有收藏，遇到喜欢的点子就点星星。"
                  : "正在读取收藏…",
                ready
                  ? "No favorites yet. Tap a star on an idea you like."
                  : "Loading favorites…",
              )
            : text(
                "这个月龄暂没有此场景的点子，换个场景看看。",
                "No ideas for this setting at this age yet. Try another setting.",
              )}
        </T>
      ) : null}
      <View style={{ gap: 8, paddingTop: 6 }}>
        <T raw style={{ fontSize: 12, lineHeight: 20, color: c.muted }}>
          {text(
            "月龄只是浏览参考，不是敏感期或达标清单。按宝宝兴趣和能力选择；早产或有特殊需要时，适龄活动请咨询儿科医生。若担心发展或已会的技能退步，请及时咨询专业人员。",
            "Age is a browsing guide, not a sensitive-period deadline or checklist. Follow your child's interests and abilities. Ask your clinician about suitable play for prematurity or additional needs, or if development or loss of skills concerns you.",
          )}
        </T>
        <T raw style={{ fontSize: 11, lineHeight: 18, color: c.muted }}>
          {text(
            "首版离线活动由参考资料整理改写，时长和分组为产品建议，未作临床验证。收藏仅存本机，不包含在记录备份中。",
            "These offline ideas are editorial adaptations. Durations and age groups are suggestions, not clinically validated guidance. Favorites stay on this device and are not included in record backups.",
          )}
        </T>
        <Pressable
          accessibilityRole="link"
          onPress={() => void openSource(learningSources.who.url)}
          style={{ minHeight: 44, justifyContent: "center" }}
        >
          <T raw style={{ fontSize: 12, color: c.primary }}>
            {text(
              "为什么先放下屏幕？WHO 参考 ↗",
              "Why put the screen away? WHO reference ↗",
            )}
          </T>
        </Pressable>
      </View>
    </View>
  );
}
