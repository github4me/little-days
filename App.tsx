import React, { useEffect, useRef, useState } from "react";
import {
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  AppState,
  Image,
  Platform,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  Entry,
  State,
  ageLabel,
  elapsedLabel,
  summarize,
  validateState,
} from "./src/domain";
import {
  loadState,
  saveState,
  loadTheme,
  saveTheme,
  loadRecovery,
  loadAvatarUri,
  saveAvatarUri,
} from "./src/storage";
import { importBackup } from "./src/backup";
import EntryEditor, { newEntry } from "./src/EntryEditor";
import GrowthChart, { Metric } from "./src/GrowthChart";
import Records from "./src/Records";
import Settings from "./src/Settings";
import { rescheduleAutoFeedReminders } from "./src/reminders";
import {
  Theme,
  light,
  dark,
  T,
  Card,
  Button,
  Chips,
  Field,
  row,
  heading,
} from "./src/ui";
const kinds: Record<
  Entry["type"],
  { label: string; icon: string; color: string }
> = {
  feed: { label: "喂奶", icon: "◒", color: "#FBE0D3" },
  diaper: { label: "尿布", icon: "♧", color: "#FFF0C9" },
  sleep: { label: "睡眠", icon: "☾", color: "#E5DDF7" },
  growth: { label: "测量", icon: "↗", color: "#D8EEE8" },
  milestone: { label: "里程碑", icon: "✧", color: "#F0D7B5" },
};
const feedLabels = {
  formula: "配方奶",
  expressed: "瓶喂母乳",
  "breast-left": "亲喂 · 左侧",
  "breast-right": "亲喂 · 右侧",
  "breast-both": "亲喂 · 双侧",
};
const diaperLabels = { wet: "尿", dirty: "便", mixed: "尿＋便" };
const time = (iso: string) =>
  new Date(iso).toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
const localDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
function detail(e: Entry, now: number) {
  if (e.type === "feed")
    return `${feedLabels[e.feedKind!]}${e.amount !== undefined ? ` · ${e.amount} mL` : ""}${e.end ? ` · ${elapsedLabel(Date.parse(e.end) - Date.parse(e.start))}` : ""}`;
  if (e.type === "diaper") return diaperLabels[e.diaperKind!];
  if (e.type === "sleep")
    return e.end
      ? `${time(e.start)}–${time(e.end)} · ${elapsedLabel(Date.parse(e.end) - Date.parse(e.start))}`
      : `正在睡 · ${elapsedLabel(now - Date.parse(e.start))}`;
  if (e.type === "growth")
    return [
      e.weight !== undefined ? `${e.weight} kg` : null,
      e.length !== undefined ? `${e.length} cm 身长` : null,
      e.head !== undefined ? `${e.head} cm 头围` : null,
    ]
      .filter(Boolean)
      .join(" · ");
  return e.title!;
}
export default function App() {
  return (
    <SafeAreaProvider>
      <BabyApp />
    </SafeAreaProvider>
  );
}
function BabyApp() {
  const [darkMode, setDarkMode] = useState(false);
  const c = darkMode ? dark : light;
  const [state, setState] = useState<State | null>(null),
    [avatarUri, setAvatarUri] = useState<string | null>(null),
    [avatarFailed, setAvatarFailed] = useState(false),
    [fatal, setFatal] = useState(""),
    [message, setMessage] = useState(""),
    [tab, setTab] = useState("today"),
    [now, setNow] = useState(Date.now()),
    [editor, setEditor] = useState<Entry | null>(null),
    [busy, setBusy] = useState(false),
    [deleting, setDeleting] = useState<Entry | null>(null),
    [undo, setUndo] = useState<Entry | null>(null);
  const stateRef = useRef<State | null>(null),
    lock = useRef(false);
  const [rescue, setRescue] = useState<State | null>(null);
  const [metric, setMetric] = useState<Metric>("weight");
  async function init() {
    try {
      const [s, preference, savedAvatarUri] = await Promise.all([
        loadState(),
        loadTheme(),
        loadAvatarUri(),
      ]);
      stateRef.current = s;
      setState(s);
      setAvatarUri(savedAvatarUri);
      setFatal("");
      if (preference !== null) setDarkMode(preference);
    } catch (e) {
      setFatal(`无法读取本地数据，原数据没有被覆盖。${(e as Error).message}`);
    }
  }
  useEffect(() => {
    void init();
    const timer = setInterval(() => setNow(Date.now()), 1000);
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") setNow(Date.now());
    });
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, []);
  useEffect(() => setAvatarFailed(false), [avatarUri]);
  async function commit(next: State, recovery = false) {
    if (lock.current) throw new Error("正在保存，请稍后再试");
    lock.current = true;
    setBusy(true);
    try {
      const checked = validateState(next);
      await saveState(checked, recovery);
      stateRef.current = checked;
      setState(checked);
      try {
        await rescheduleAutoFeedReminders(checked.entries);
      } catch {
        // Saving a record must not fail just because a previously configured notification cannot refresh.
      }
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function upsert(e: Entry) {
    const current = stateRef.current!;
    if (
      current.profile.birthDate &&
      localDay(new Date(e.start)) < current.profile.birthDate
    )
      throw new Error("记录日期不能早于出生日期");
    await commit({
      ...current,
      entries: [...current.entries.filter((x) => x.id !== e.id), e],
    });
    setEditor(null);
    setMessage("已保存到本机");
  }
  async function updateAvatar(uri: string | null) {
    await saveAvatarUri(uri);
    setAvatarUri(uri);
  }
  async function act(fn: () => Promise<void>) {
    try {
      await fn();
    } catch (e) {
      setMessage((e as Error).message);
    }
  }
  if (!state)
    return (
      <Theme.Provider value={c}>
        <SafeAreaView
          style={{
            flex: 1,
            backgroundColor: c.bg,
            padding: 24,
            justifyContent: "center",
            gap: 20,
          }}
        >
          {fatal ? (
            <>
              <T>{fatal}</T>
              <Button label="重新读取" onPress={() => void init()} />
              <Button
                label="从备份文件恢复"
                disabled={busy}
                onPress={() =>
                  void act(async () => {
                    setRescue(await importBackup());
                  })
                }
              />
              <Button
                label="读取恢复副本"
                disabled={busy}
                secondary
                onPress={() =>
                  void act(async () => {
                    const old = await loadRecovery();
                    if (!old) throw new Error("没有恢复副本");
                    setRescue(old);
                  })
                }
              />
              {message ? <T>{message}</T> : null}
              {rescue ? (
                <Card>
                  <T>
                    用「{rescue.profile.name}」的 {rescue.entries.length}{" "}
                    条记录替换当前数据？
                  </T>
                  <Button
                    label="确认恢复"
                    disabled={busy}
                    onPress={() =>
                      void act(async () => {
                        await commit(rescue, true);
                        setRescue(null);
                        setFatal("");
                      })
                    }
                  />
                  <Button
                    label="取消"
                    secondary
                    onPress={() => setRescue(null)}
                  />
                </Card>
              ) : null}
            </>
          ) : (
            <>
              <ActivityIndicator color={c.primary} />
              <T style={{ textAlign: "center" }}>打开成长记录…</T>
            </>
          )}
        </SafeAreaView>
      </Theme.Provider>
    );
  const entries = [...state.entries].sort(
    (a, b) => Date.parse(b.start) - Date.parse(a.start),
  );
  const active = entries.find((e) => e.type === "sleep" && !e.end);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const forStats = entries.map((e) =>
    e.type === "sleep" && !e.end
      ? { ...e, end: new Date(now).toISOString() }
      : e,
  );
  const summary = summarize(forStats, today, tomorrow);
  const latestFeed = entries.find((e) => e.type === "feed"),
    latestDiaper = entries.find((e) => e.type === "diaper"),
    latestSleep = entries
      .filter((e) => e.type === "sleep" && e.end)
      .sort((a, b) => Date.parse(b.end!) - Date.parse(a.end!))[0];
  const pageTitles: Record<string, string> = {
    today: "今天的小日子",
    records: "每一天，都记得",
    growth: "慢慢长大的你",
    settings: "我的",
  };
  function entryRow(e: Entry) {
    return (
      <View
        key={e.id}
        style={{
          paddingVertical: 13,
          borderBottomWidth: 1,
          borderColor: c.line,
          gap: 8,
        }}
      >
        <View style={row}>
          <View
            style={{
              flexDirection: "row",
              gap: 12,
              alignItems: "center",
              flex: 1,
            }}
          >
            <View
              style={{
                backgroundColor: kinds[e.type].color,
                borderRadius: 15,
                width: 43,
                height: 43,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <T style={{ color: "#3A5267", fontSize: 23 }}>
                {kinds[e.type].icon}
              </T>
            </View>
            <View style={{ flex: 1 }}>
              <T style={{ fontWeight: "600" }}>
                {e.type === "milestone" ? e.title : kinds[e.type].label}
              </T>
              <T style={{ fontSize: 13, color: c.muted }}>{detail(e, now)}</T>
              <T style={{ fontSize: 12, color: c.muted }}>
                {localDay(new Date(e.start))} · {time(e.start)}
              </T>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`编辑${kinds[e.type].label}`}
            onPress={() => setEditor(e)}
            style={{ minHeight: 44, minWidth: 44, justifyContent: "center" }}
          >
            <T style={{ color: c.primary, fontSize: 13 }}>编辑</T>
          </Pressable>
        </View>
        {e.note ? (
          <T style={{ color: c.muted, fontSize: 13, paddingLeft: 55 }}>
            {e.note}
          </T>
        ) : null}
        {tab !== "today" ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`删除${kinds[e.type].label}`}
            onPress={() => setDeleting(e)}
            style={{
              alignSelf: "flex-end",
              minHeight: 44,
              justifyContent: "center",
            }}
          >
            <T style={{ fontSize: 12, color: c.muted }}>删除</T>
          </Pressable>
        ) : null}
      </View>
    );
  }
  return (
    <Theme.Provider value={c}>
      <SafeAreaView
        style={{ flex: 1, backgroundColor: c.bg }}
        edges={["top", "left", "right"]}
      >
        <StatusBar style={darkMode ? "light" : "dark"} />
        <View
          style={{ flex: 1, width: "100%", maxWidth: 720, alignSelf: "center" }}
        >
          <ScrollView
            contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 28 }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={row}>
              <View>
                <T
                  style={{
                    fontSize: 11,
                    letterSpacing: 3,
                    color: c.muted,
                    fontWeight: "700",
                  }}
                >
                  LITTLE DAYS · 小日子
                </T>
                {tab !== "settings" ? (
                  <T
                    style={[
                      heading,
                      { marginTop: 6, fontSize: 28, lineHeight: 36 },
                    ]}
                  >
                    {tab === "today"
                      ? `${state.profile.name}的小日子`
                      : pageTitles[tab]}
                  </T>
                ) : null}
              </View>
              <View
                style={{
                  backgroundColor: c.soft,
                  paddingHorizontal: 11,
                  paddingVertical: 5,
                  borderRadius: 20,
                }}
              >
                <T style={{ fontSize: 11, color: c.primary }}>● 仅此设备</T>
              </View>
            </View>
            {message ? (
              <Pressable
                onPress={() => setMessage("")}
                accessibilityLabel="关闭提示"
                style={{
                  padding: 12,
                  borderRadius: 14,
                  backgroundColor: c.soft,
                }}
              >
                <T style={{ fontSize: 13 }}>{message}　×</T>
              </Pressable>
            ) : null}
            {deleting ? (
              <Card>
                <T>删除这条{kinds[deleting.type].label}记录？</T>
                <View style={row}>
                  <Button
                    label="取消"
                    secondary
                    onPress={() => setDeleting(null)}
                  />
                  <Button
                    label="确认删除"
                    disabled={busy}
                    onPress={() =>
                      void act(async () => {
                        const e = deleting;
                        await commit({
                          ...stateRef.current!,
                          entries: stateRef.current!.entries.filter(
                            (x) => x.id !== e.id,
                          ),
                        });
                        setUndo(e);
                        setDeleting(null);
                        setMessage("记录已删除，可撤销");
                      })
                    }
                  />
                </View>
              </Card>
            ) : null}
            {undo ? (
              <View style={row}>
                <T style={{ fontSize: 13 }}>已删除一条记录</T>
                <Button
                  label="撤销删除"
                  secondary
                  disabled={busy}
                  onPress={() =>
                    void act(async () => {
                      await upsert(undo);
                      setUndo(null);
                    })
                  }
                />
              </View>
            ) : null}
            {tab === "today" ? (
              <>
                <View
                  style={{
                    backgroundColor: c.hero,
                    borderRadius: 28,
                    paddingHorizontal: 24,
                    paddingVertical: 20,
                    gap: 14,
                    overflow: "hidden",
                  }}
                >
                  <View style={row}>
                    <View style={{ flex: 1 }}>
                      <T
                        style={{
                          color: c.heroMuted,
                          fontSize: 12,
                          lineHeight: 18,
                        }}
                      >
                        一点一滴，都是成长
                      </T>
                      <Pressable onPress={() => setTab("settings")}>
                        <T
                          style={{
                            color: c.heroMuted,
                            fontSize: 13,
                            lineHeight: 20,
                            marginTop: 5,
                          }}
                        >
                          {ageLabel(state.profile.birthDate, new Date(now))}　›
                        </T>
                      </Pressable>
                    </View>
                    <View
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 32,
                        backgroundColor: c.avatar,
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                      }}
                    >
                      {avatarUri && !avatarFailed ? (
                        <Image
                          accessibilityLabel="宝宝头像"
                          onError={() => setAvatarFailed(true)}
                          resizeMode="cover"
                          source={{ uri: avatarUri }}
                          style={{ width: 64, height: 64, borderRadius: 32 }}
                        />
                      ) : (
                        <T
                          style={{
                            fontSize: 34,
                            lineHeight: 42,
                            color: c.heroText,
                          }}
                        >
                          ☘
                        </T>
                      )}
                    </View>
                  </View>
                  <View style={{ height: 1, backgroundColor: c.heroLine }} />
                  <View style={row}>
                    {[
                      [
                        summary.feedCount ? String(summary.feedMl) : "—",
                        "mL 已记录奶量",
                      ],
                      [
                        summary.sleepMinutes
                          ? (summary.sleepMinutes / 60).toFixed(1)
                          : "—",
                        "小时 已记录睡眠",
                      ],
                      [
                        summary.diaperCount ? String(summary.diaperCount) : "—",
                        "次 换尿布",
                      ],
                    ].map(([v, l]) => (
                      <View key={l}>
                        <T
                          style={{
                            color: c.heroText,
                            fontSize: 25,
                            fontWeight: "600",
                            lineHeight: 32,
                          }}
                        >
                          {v}
                        </T>
                        <T style={{ color: c.heroMuted, fontSize: 10 }}>{l}</T>
                      </View>
                    ))}
                  </View>
                </View>
                <View style={row}>
                  <T style={heading}>照顾此刻</T>
                  <T style={{ fontSize: 12, color: c.muted }}>
                    {new Date(now).toLocaleDateString("zh-CN", {
                      month: "long",
                      day: "numeric",
                      weekday: "short",
                    })}
                  </T>
                </View>
                {(["feed", "sleep", "diaper"] as const).map((type) => {
                  const last =
                    type === "feed"
                      ? latestFeed
                      : type === "diaper"
                        ? latestDiaper
                        : latestSleep;
                  return (
                    <Card key={type} style={{ padding: 18 }}>
                      <View style={row}>
                        <View
                          style={{
                            backgroundColor: kinds[type].color,
                            width: 45,
                            height: 45,
                            borderRadius: 15,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <T style={{ fontSize: 26, color: "#3A5267" }}>
                            {kinds[type].icon}
                          </T>
                        </View>
                        <View style={{ flex: 1 }}>
                          <T style={{ fontWeight: "700", fontSize: 17 }}>
                            {type === "sleep" && active
                              ? "正在睡觉"
                              : kinds[type].label}
                          </T>
                          <T style={{ fontSize: 12, color: c.muted }}>
                            {type === "sleep" && active
                              ? `已睡 ${elapsedLabel(now - Date.parse(active.start))}`
                              : last
                                ? `上次 ${time(type === "sleep" ? last.end! : last.start)} · ${elapsedLabel(now - Date.parse(type === "sleep" ? last.end! : last.start))}前`
                                : "还没有记录，轻点开始"}
                          </T>
                        </View>
                        <Button
                          label={
                            type === "sleep"
                              ? active
                                ? "醒了"
                                : "睡了"
                              : "＋记录"
                          }
                          disabled={busy}
                          secondary
                          onPress={() => {
                            if (type === "sleep")
                              void act(async () => {
                                await upsert(
                                  active
                                    ? {
                                        ...active,
                                        end: new Date().toISOString(),
                                      }
                                    : newEntry("sleep"),
                                );
                              });
                            else setEditor(newEntry(type));
                          }}
                        />
                      </View>
                      {type === "feed" && latestFeed ? (
                        <T style={{ color: c.muted, fontSize: 13 }}>
                          {detail(latestFeed, now)}
                        </T>
                      ) : null}
                      {type === "sleep" ? (
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => setEditor(newEntry("sleep"))}
                          style={{
                            alignSelf: "flex-start",
                            minHeight: 36,
                            justifyContent: "center",
                          }}
                        >
                          <T style={{ fontSize: 12, color: c.primary }}>
                            补录睡眠 ›
                          </T>
                        </Pressable>
                      ) : null}
                    </Card>
                  );
                })}
              </>
            ) : null}
            {tab === "records" ? (
              <Records
                entries={entries}
                now={now}
                onEdit={setEditor}
                onDelete={setDeleting}
              />
            ) : null}
            {tab === "growth" ? (
              <>
                <Card>
                  <View style={row}>
                    <T style={heading}>成长曲线</T>
                    <Button
                      label="＋测量"
                      secondary
                      onPress={() => setEditor(newEntry("growth"))}
                    />
                  </View>
                  <Chips
                    options={[
                      { label: "全部", value: "all" },
                      { label: "体重 kg", value: "weight" },
                      { label: "身长 cm", value: "length" },
                      { label: "头围 cm", value: "head" },
                    ]}
                    value={metric}
                    onChange={(v) => setMetric(v as Metric)}
                  />
                  <GrowthChart
                    entries={entries}
                    profile={state.profile}
                    metric={metric}
                  />
                  {entries.filter((e) => e.type === "growth").map(entryRow)}
                </Card>
              </>
            ) : null}
            {tab === "settings" ? (
              <Settings
                state={state}
                avatarUri={avatarUri}
                onAvatarChange={updateAvatar}
                onCommit={async (next, recovery) => {
                  await commit(next, recovery);
                  if (recovery) setUndo(null);
                }}
                darkMode={darkMode}
                onDarkMode={(v) =>
                  void act(async () => {
                    await saveTheme(v);
                    setDarkMode(v);
                  })
                }
              />
            ) : null}
            <T
              style={{
                fontSize: 10,
                color: c.muted,
                textAlign: "center",
                letterSpacing: 1,
              }}
            >
              陪伴成长 · 不必完美记录
            </T>
          </ScrollView>
          <SafeAreaView
            edges={["bottom"]}
            style={{
              backgroundColor: c.card,
              borderTopWidth: 1,
              borderColor: c.line,
            }}
          >
            <View style={{ flexDirection: "row", paddingVertical: 7 }}>
              {[
                ["today", "⌂", "今天"],
                ["records", "≡", "记录"],
                ["growth", "↗", "成长"],
                ["settings", "☷", "我的"],
              ].map(([key, icon, label]) => (
                <Pressable
                  accessibilityRole="tab"
                  accessibilityState={{ selected: tab === key }}
                  accessibilityLabel={label}
                  key={key}
                  onPress={() => {
                    setTab(key);
                    setMessage("");
                    setDeleting(null);
                  }}
                  style={{
                    flex: 1,
                    alignItems: "center",
                    gap: 1,
                    minHeight: 49,
                    justifyContent: "center",
                  }}
                >
                  <T
                    style={{
                      fontSize: 23,
                      color: tab === key ? c.primary : c.muted,
                      fontWeight: "600",
                    }}
                  >
                    {icon}
                  </T>
                  <T
                    style={{
                      fontSize: 11,
                      color: tab === key ? c.primary : c.muted,
                      fontWeight: tab === key ? "700" : "400",
                    }}
                  >
                    {label}
                  </T>
                </Pressable>
              ))}
            </View>
          </SafeAreaView>
        </View>
        {editor ? (
          <EntryEditor
            entry={editor}
            onSave={upsert}
            onClose={() => setEditor(null)}
            dark={darkMode}
          />
        ) : null}
      </SafeAreaView>
    </Theme.Provider>
  );
}
