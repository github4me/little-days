import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Entry, makeId, validateEntry } from "./domain";

const names = {
  feed: "喂养",
  diaper: "尿布",
  sleep: "睡眠",
  growth: "成长测量",
  milestone: "成长里程碑",
};
const pad = (n: number) => String(n).padStart(2, "0");
function localFields(iso: string) {
  const d = new Date(iso);
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}
function localISO(date: string, time: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time))
    throw new Error("时间格式应为 YYYY-MM-DD 和 HH:mm");
  const [y, m, day] = date.split("-").map(Number),
    [h, min] = time.split(":").map(Number);
  const d = new Date(y, m - 1, day, h, min);
  if (
    d.getFullYear() !== y ||
    d.getMonth() !== m - 1 ||
    d.getDate() !== day ||
    d.getHours() !== h ||
    d.getMinutes() !== min
  )
    throw new Error("日期或时间无效，请检查输入");
  return d.toISOString();
}
export function newEntry(type: Entry["type"]): Entry {
  const base: Entry = {
    id: makeId(),
    type,
    start: new Date().toISOString(),
    note: "",
  };
  if (type === "feed") return { ...base, feedKind: "formula", amount: 120 };
  if (type === "diaper") return { ...base, diaperKind: "wet" };
  if (type === "milestone") return { ...base, title: "" };
  return base;
}
export default function EntryEditor({
  entry,
  onSave,
  onClose,
  dark,
}: {
  entry: Entry;
  onSave: (entry: Entry) => Promise<void>;
  onClose: () => void;
  dark: boolean;
}) {
  const [draft, setDraft] = useState(entry);
  const initialEnd = useRef(entry.end ?? new Date().toISOString());
  const [start, setStart] = useState(localFields(entry.start));
  const [end, setEnd] = useState(localFields(initialEnd.current));
  const [hasEnd, setHasEnd] = useState(!!entry.end);
  const [amount, setAmount] = useState(String(entry.amount ?? 120));
  const [weight, setWeight] = useState(
    entry.weight === undefined ? "" : String(entry.weight),
  );
  const [length, setLength] = useState(
    entry.length === undefined ? "" : String(entry.length),
  );
  const [head, setHead] = useState(
    entry.head === undefined ? "" : String(entry.head),
  );
  const [picker, setPicker] = useState<{
    target: "start" | "end";
    mode: "date" | "time";
  } | null>(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const saving = useRef(false);
  const bg = dark ? "#101C28" : "#FAF8F3",
    card = dark ? "#1B2A38" : "#FFFFFF",
    ink = dark ? "#F7F5F0" : "#263B40",
    muted = dark ? "#A9BCC5" : "#73858A";
  const accent =
    entry.type === "sleep"
      ? "#776AB4"
      : entry.type === "feed"
        ? "#B95C48"
        : "#237D70";
  const bottle = draft.feedKind === "formula" || draft.feedKind === "expressed";
  const inputStyle = [
    s.input,
    {
      backgroundColor: card,
      color: ink,
      borderColor: dark ? "#354553" : "#E4E7E0",
    },
  ];
  const label = (text: string) => (
    <Text style={[s.label, { color: ink }]}>{text}</Text>
  );
  const chip = (text: string, selected: boolean, press: () => void) => (
    <Pressable
      key={text}
      disabled={busy}
      onPress={press}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[
        s.chip,
        {
          backgroundColor: selected ? accent : card,
          borderColor: selected ? accent : dark ? "#354553" : "#E4E7E0",
        },
      ]}
    >
      <Text
        style={{
          color: selected ? "#FFFFFF" : ink,
          fontSize: 15,
          fontWeight: "600",
        }}
      >
        {text}
      </Text>
    </Pressable>
  );
  const timeFields = (target: "start" | "end", title: string) => {
    const fields = target === "start" ? start : end,
      update = target === "start" ? setStart : setEnd;
    return (
      <View style={s.section}>
        {label(title)}
        <View style={s.row}>
          {Platform.OS === "web" ? (
            <>
              <TextInput
                accessibilityLabel={`${title}日期`}
                editable={!busy}
                value={fields.date}
                onChangeText={(date) => update({ ...fields, date })}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={muted}
                style={[inputStyle, { flex: 1.4 }]}
              />
              <TextInput
                accessibilityLabel={`${title}时刻`}
                editable={!busy}
                value={fields.time}
                onChangeText={(time) => update({ ...fields, time })}
                placeholder="HH:mm"
                placeholderTextColor={muted}
                style={[inputStyle, { flex: 1 }]}
              />
            </>
          ) : (
            <>
              <Pressable
                disabled={busy}
                onPress={() => setPicker({ target, mode: "date" })}
                style={[inputStyle, { flex: 1.4 }]}
              >
                <Text style={{ color: ink, fontSize: 17 }}>{fields.date}</Text>
              </Pressable>
              <Pressable
                disabled={busy}
                onPress={() => setPicker({ target, mode: "time" })}
                style={[inputStyle, { flex: 1 }]}
              >
                <Text style={{ color: ink, fontSize: 17 }}>{fields.time}</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    );
  };
  async function save() {
    if (saving.current) return;
    saving.current = true;
    setBusy(true);
    setError("");
    try {
      const originalStart = localFields(entry.start);
      const originalEnd = localFields(initialEnd.current);
      const result: Entry = {
        ...draft,
        start:
          start.date === originalStart.date && start.time === originalStart.time
            ? entry.start
            : localISO(start.date, start.time),
      };
      delete result.end;
      if (hasEnd && (entry.type === "feed" || entry.type === "sleep"))
        result.end =
          originalEnd &&
          end.date === originalEnd.date &&
          end.time === originalEnd.time
            ? initialEnd.current
            : localISO(end.date, end.time);
      if (
        Date.parse(result.start) > Date.now() + 60000 ||
        (result.end && Date.parse(result.end) > Date.now() + 60000)
      )
        throw new Error("请填写已经发生的时间");
      if (entry.type === "feed") {
        if (bottle) {
          if (!amount.trim()) throw new Error("请填写实际喝奶量");
          result.amount = Number(amount);
        } else delete result.amount;
      }
      if (entry.type === "growth") {
        delete result.weight;
        delete result.length;
        delete result.head;
        if (weight.trim()) result.weight = Number(weight);
        if (length.trim()) result.length = Number(length);
        if (head.trim()) result.head = Number(head);
      }
      await onSave(validateEntry(result));
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败，请重试");
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }
  return (
    <Modal
      visible
      animationType="slide"
      onRequestClose={() => {
        if (!saving.current) onClose();
      }}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={s.header}>
            <View>
              <Text style={[s.kicker, { color: accent }]}>
                每一刻，都值得记住
              </Text>
              <Text style={[s.title, { color: ink }]}>{names[entry.type]}</Text>
            </View>
            <Pressable
              accessibilityLabel="关闭记录编辑"
              disabled={busy}
              onPress={() => {
                if (!saving.current) onClose();
              }}
              style={[s.close, { backgroundColor: card }]}
            >
              <Text style={{ fontSize: 24, color: ink }}>×</Text>
            </Pressable>
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={s.content}
          >
            {entry.type === "feed" && (
              <View style={s.section}>
                {label("喂养方式")}
                <View style={s.wrap}>
                  {(
                    [
                      ["formula", "配方奶"],
                      ["expressed", "瓶喂母乳"],
                      ["breast-left", "亲喂 · 左"],
                      ["breast-right", "亲喂 · 右"],
                      ["breast-both", "亲喂 · 双侧"],
                    ] as const
                  ).map(([kind, text]) =>
                    chip(text, draft.feedKind === kind, () =>
                      setDraft({ ...draft, feedKind: kind }),
                    ),
                  )}
                </View>
                {bottle && (
                  <View style={{ marginTop: 20 }}>
                    {label("实际喝奶量 · mL")}
                    <TextInput
                      accessibilityLabel="实际喝奶量"
                      editable={!busy}
                      value={amount}
                      onChangeText={setAmount}
                      keyboardType="decimal-pad"
                      style={[inputStyle, s.largeInput]}
                    />
                    <View style={[s.wrap, { marginTop: 10 }]}>
                      {[60, 90, 120, 150].map((n) =>
                        chip(`${n} mL`, amount === String(n), () =>
                          setAmount(String(n)),
                        ),
                      )}
                    </View>
                  </View>
                )}
              </View>
            )}
            {entry.type === "diaper" && (
              <View style={s.section}>
                {label("尿布情况")}
                <View style={s.wrap}>
                  {(
                    [
                      ["wet", "有尿"],
                      ["dirty", "有便"],
                      ["mixed", "尿 + 便"],
                    ] as const
                  ).map(([kind, text]) =>
                    chip(text, draft.diaperKind === kind, () =>
                      setDraft({ ...draft, diaperKind: kind }),
                    ),
                  )}
                </View>
              </View>
            )}
            {entry.type === "sleep" && (
              <View style={s.section}>
                {label("睡眠状态")}
                <View style={s.wrap}>
                  {chip("正在睡", !hasEnd, () => setHasEnd(false))}
                  {chip("已睡醒 / 补录", hasEnd, () => setHasEnd(true))}
                </View>
                <Text style={[s.hint, { color: muted }]}>
                  保存开始时间后，关闭应用也不会丢失计时。
                </Text>
              </View>
            )}
            {timeFields(
              "start",
              entry.type === "sleep" ? "入睡时间" : "记录时间",
            )}
            {entry.type === "feed" && (
              <View style={s.section}>
                <View style={s.wrap}>
                  {chip(
                    hasEnd ? "✓ 记录结束时间" : "+ 记录结束时间（可选）",
                    hasEnd,
                    () => setHasEnd(!hasEnd),
                  )}
                </View>
              </View>
            )}
            {hasEnd &&
              (entry.type === "feed" || entry.type === "sleep") &&
              timeFields(
                "end",
                entry.type === "sleep" ? "醒来时间" : "结束时间",
              )}
            {entry.type === "growth" && (
              <View style={s.section}>
                {label("测量数据")}
                <Text style={[s.hint, { color: muted, marginBottom: 14 }]}>
                  至少填写一项；保留实际测量的小数。
                </Text>
                {(
                  [
                    ["体重 · kg", weight, setWeight],
                    ["身长 · cm", length, setLength],
                    ["头围 · cm", head, setHead],
                  ] as const
                ).map(([text, value, update]) => (
                  <View key={text} style={{ marginBottom: 15 }}>
                    {label(text)}
                    <TextInput
                      accessibilityLabel={text}
                      editable={!busy}
                      value={value}
                      onChangeText={update}
                      keyboardType="decimal-pad"
                      placeholder="未填写"
                      placeholderTextColor={muted}
                      style={inputStyle}
                    />
                  </View>
                ))}
              </View>
            )}
            {entry.type === "milestone" && (
              <View style={s.section}>
                {label("里程碑标题")}
                <TextInput
                  accessibilityLabel="里程碑标题"
                  editable={!busy}
                  value={draft.title ?? ""}
                  onChangeText={(title) => setDraft({ ...draft, title })}
                  maxLength={200}
                  placeholder="例如：第一次对我笑"
                  placeholderTextColor={muted}
                  style={inputStyle}
                />
              </View>
            )}
            <View style={s.section}>
              {label("备注 · 可选")}
              <TextInput
                accessibilityLabel="备注"
                editable={!busy}
                value={draft.note}
                onChangeText={(note) => setDraft({ ...draft, note })}
                multiline
                maxLength={10000}
                placeholder="记下一点小细节…"
                placeholderTextColor={muted}
                style={[
                  inputStyle,
                  { minHeight: 106, textAlignVertical: "top" },
                ]}
              />
            </View>
            {!!error && (
              <Text accessibilityRole="alert" style={s.error}>
                {error}
              </Text>
            )}
            <Pressable
              accessibilityRole="button"
              disabled={busy}
              onPress={save}
              style={[
                s.save,
                { backgroundColor: accent, opacity: busy ? 0.6 : 1 },
              ]}
            >
              {busy ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={s.saveText}>
                  {entry.type === "sleep" && !hasEnd
                    ? "保存 · 继续计时"
                    : "保存记录"}
                </Text>
              )}
            </Pressable>
            <Text style={[s.footer, { color: muted }]}>
              仅保存在这台设备 · 无需联网
            </Text>
          </ScrollView>
          {picker && Platform.OS !== "web" && (
            <View style={{ backgroundColor: card }}>
              {Platform.OS === "ios" && (
                <Pressable
                  onPress={() => setPicker(null)}
                  style={{ padding: 14, alignSelf: "flex-end" }}
                >
                  <Text style={{ color: accent, fontWeight: "700" }}>完成</Text>
                </Pressable>
              )}
              <DateTimePicker
                value={
                  new Date(
                    localISO(
                      (picker.target === "start" ? start : end).date,
                      (picker.target === "start" ? start : end).time,
                    ),
                  )
                }
                mode={picker.mode}
                display={Platform.OS === "ios" ? "spinner" : "default"}
                themeVariant={dark ? "dark" : "light"}
                onChange={(_, value) => {
                  if (Platform.OS !== "ios") setPicker(null);
                  if (value) {
                    const update =
                      picker.target === "start" ? setStart : setEnd;
                    update(localFields(value.toISOString()));
                  }
                }}
              />
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
const s = StyleSheet.create({
  header: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  kicker: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    marginBottom: 7,
  },
  title: { fontSize: 29, fontWeight: "800" },
  close: {
    height: 44,
    width: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: 24,
    paddingTop: 12,
    paddingBottom: 40,
    width: "100%",
    maxWidth: 700,
    alignSelf: "center",
  },
  section: { marginBottom: 24 },
  label: { fontSize: 15, fontWeight: "600", marginBottom: 10 },
  row: { flexDirection: "row", gap: 12 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 15,
    borderWidth: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 15,
    fontSize: 17,
    minHeight: 52,
  },
  largeInput: { fontSize: 34, fontWeight: "700", paddingVertical: 18 },
  hint: { fontSize: 13, lineHeight: 21, marginTop: 10 },
  error: { color: "#C64440", marginBottom: 18, fontSize: 14, lineHeight: 21 },
  save: {
    minHeight: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  saveText: { color: "#FFFFFF", fontSize: 17, fontWeight: "700" },
  footer: { textAlign: "center", fontSize: 12, marginTop: 16 },
});
