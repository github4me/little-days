import React, { useContext, useRef, useState } from "react";
import { Linking, Pressable, View } from "react-native";
import { Button, Card, Field, T, Theme } from "./ui";
import { useI18n } from "./i18n";
import { CareRecord, validateCareRecord, makeId } from "./domain";
import { careOptions, careTime, temperatureMethods } from "./care";
import { playDayKey, type LearningText } from "./learning";

export default function DailyCare({
  records,
  birthDate,
  now,
  onSave,
  onDelete,
}: {
  records: CareRecord[];
  birthDate: string;
  now: number;
  onSave: (record: CareRecord) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const c = useContext(Theme);
  const { locale } = useI18n();
  const copy = (w: LearningText) => (locale === "en-US" ? w.en : w.zh);
  const text = (zh: string, en: string) => (locale === "en-US" ? en : zh);
  const [kind, setKind] = useState<CareRecord["kind"]>("temperature");
  const [temperature, setTemperature] = useState("");
  const [method, setMethod] = useState<CareRecord["method"]>();
  const [date, setDate] = useState(playDayKey(new Date(now)));
  const [time, setTime] = useState(new Date(now).toTimeString().slice(0, 5));
  const [note, setNote] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<LearningText | null>(null);
  const lock = useRef(false);
  const option = careOptions.find((o) => o.id === kind)!;
  const history = records
    .filter((r) => r.kind === kind)
    .sort((a, b) => Date.parse(b.time) - Date.parse(a.time));
  const shown = expanded ? history : history.slice(0, 5);
  function reset() {
    setTemperature("");
    setMethod(undefined);
    setNote("");
    setEditing(null);
    setDate(playDayKey(new Date(now)));
    setTime(new Date(now).toTimeString().slice(0, 5));
  }
  async function save() {
    if (lock.current) return;
    setMessage(null);
    let record: CareRecord;
    try {
      const at = careTime(date, time, now, birthDate);
      if (
        kind === "temperature" &&
        (!/^\d{2}(?:[.,]\d{1,2})?$/.test(temperature.trim()) || !method)
      )
        throw new Error("value");
      record = validateCareRecord({
        id: editing ?? makeId(),
        kind,
        time: at,
        note,
        ...(kind === "temperature"
          ? { temperature: Number(temperature.replace(",", ".")), method }
          : {}),
      });
    } catch {
      setMessage({
        zh: "请检查日期、时间和读数；体温需为 25–45°C 并选择测量方式，时间不能晚于现在或早于出生。",
        en: "Check the date, time and reading. Temperature must be 25–45°C with a measurement method; time cannot be in the future or before birth.",
      });
      return;
    }
    lock.current = true;
    setBusy(true);
    try {
      await onSave(record);
      reset();
      setMessage({ zh: "照护记录已保存", en: "Care record saved" });
    } catch {
      setMessage({
        zh: "照护记录未保存，请重试。",
        en: "Care record was not saved. Please try again.",
      });
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function remove(id: string) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      await onDelete(id);
      setConfirm(null);
      if (editing === id) reset();
      setMessage({ zh: "照护记录已删除", en: "Care record deleted" });
    } catch {
      setMessage({
        zh: "删除失败，记录仍保留，请重试。",
        en: "Deletion failed. The record is still saved; please try again.",
      });
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function openSource(url: string) {
    try {
      await Linking.openURL(url);
    } catch {
      setMessage({
        zh: "无法打开来源，请检查网络。",
        en: "Could not open the source. Check your connection.",
      });
    }
  }
  return (
    <View style={{ gap: 14 }}>
      <View style={{ flexDirection: "row", gap: 5 }}>
        {careOptions.map((o) => (
          <Pressable
            key={o.id}
            accessibilityRole="button"
            accessibilityLabel={copy(o.label)}
            accessibilityState={{ selected: kind === o.id, disabled: busy }}
            disabled={busy}
            onPress={() => {
              setKind(o.id);
              reset();
              setConfirm(null);
              setExpanded(false);
              setMessage(null);
            }}
            style={{
              flex: 1,
              minWidth: 0,
              minHeight: 62,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 14,
              borderWidth: 1,
              borderColor: kind === o.id ? c.primary : c.line,
              backgroundColor: kind === o.id ? c.soft : c.card,
            }}
          >
            <T raw style={{ color: c.primary, fontSize: 20 }}>
              {o.icon}
            </T>
            <T raw style={{ fontSize: 11 }}>
              {copy(o.label)}
            </T>
          </Pressable>
        ))}
      </View>
      <T raw style={{ fontSize: 12, color: c.muted, lineHeight: 19 }}>
        {copy(option.hint)}
      </T>
      {kind === "temperature" ? (
        <View style={{ gap: 6 }}>
          <T raw style={{ fontSize: 12, lineHeight: 19 }}>
            {text(
              "本应用不能测温。请使用适龄体温计并遵循说明；不同测量方式的读数不能直接比较。",
              "This app cannot measure temperature. Use an age-suitable thermometer as directed; readings from different methods are not directly comparable.",
            )}
          </T>
          <T raw style={{ fontSize: 12, lineHeight: 19, fontWeight: "600" }}>
            {text(
              "未满 3 个月且体温 ≥38°C，请立即就医。任何年龄出现呼吸困难、难以唤醒或抽搐，应立即寻求急救，不要等记录完成。",
              "Under 3 months with a temperature of 38°C or above: seek urgent medical care. At any age, breathing difficulty, difficulty waking or seizures need emergency help. Do not wait to finish recording.",
            )}
          </T>
          <Pressable
            accessibilityRole="link"
            onPress={() =>
              void openSource(
                "https://www.healthdirect.gov.au/fever-and-high-temperature-in-children",
              )
            }
            style={{ minHeight: 44, justifyContent: "center" }}
          >
            <T raw style={{ color: c.primary, fontSize: 12 }}>
              {text(
                "发热安全提示 · healthdirect ↗",
                "Fever safety · healthdirect ↗",
              )}
            </T>
          </Pressable>
        </View>
      ) : null}
      <Card style={{ padding: 14, gap: 12 }}>
        <T raw style={{ fontWeight: "700" }}>
          {text(
            editing ? "编辑照护记录" : "记录一次照护",
            editing ? "Edit care record" : "Record a care session",
          )}
        </T>
        {kind === "temperature" ? (
          <>
            <Field
              editable={!busy}
              label={text("体温 · °C", "Temperature · °C")}
              value={temperature}
              onChange={setTemperature}
              keyboardType="decimal-pad"
              maxLength={5}
              placeholder="36.8"
            />
            <T raw style={{ fontSize: 12, color: c.muted }}>
              {text("测量方式 · 必选", "Measurement method · required")}
            </T>
            <View style={{ flexDirection: "row", gap: 4 }}>
              {temperatureMethods.map((m) => (
                <Pressable
                  key={m.id}
                  accessibilityRole="button"
                  accessibilityLabel={copy(m.label)}
                  accessibilityState={{ selected: method === m.id }}
                  disabled={busy}
                  onPress={() => setMethod(m.id)}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    minHeight: 44,
                    justifyContent: "center",
                    alignItems: "center",
                    borderRadius: 10,
                    backgroundColor: method === m.id ? c.soft : c.bg,
                  }}
                >
                  <T raw style={{ fontSize: 10 }}>
                    {copy(m.label)}
                  </T>
                </Pressable>
              ))}
            </View>
          </>
        ) : null}
        <View style={{ flexDirection: "row", gap: 8 }}>
          <View style={{ flex: 1.4, minWidth: 0 }}>
            <Field
              editable={!busy}
              label={text("照护日期", "Care date")}
              value={date}
              onChange={setDate}
              placeholder="YYYY-MM-DD"
              maxLength={10}
            />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Field
              editable={!busy}
              label={text("照护时间", "Care time")}
              value={time}
              onChange={setTime}
              placeholder="HH:mm"
              maxLength={5}
            />
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={() => {
            setDate(playDayKey(new Date(now)));
            setTime(new Date(now).toTimeString().slice(0, 5));
          }}
          style={{ minHeight: 44, justifyContent: "center" }}
        >
          <T raw style={{ color: c.primary, fontSize: 12 }}>
            {text("使用当前时间", "Use current time")}
          </T>
        </Pressable>
        <Field
          editable={!busy}
          label={text("照护备注", "Care notes")}
          value={note}
          onChange={setNote}
          maxLength={1000}
        />
        <Button
          label={text("保存照护记录", "Save care record")}
          disabled={busy}
          onPress={() => void save()}
        />
        {editing ? (
          <Button
            label={text("取消编辑", "Cancel edit")}
            secondary
            disabled={busy}
            onPress={reset}
          />
        ) : null}
      </Card>
      {message ? (
        <T
          raw
          accessibilityRole="alert"
          style={{ fontSize: 13, color: c.primary }}
        >
          {copy(message)}
        </T>
      ) : null}
      <View style={{ gap: 4 }}>
        <T raw style={{ fontWeight: "700" }}>
          {copy(option.label)} · {text("历史记录", "History")} ({history.length}
          )
        </T>
        {!history.length ? (
          <T raw style={{ fontSize: 13, color: c.muted }}>
            {text(
              "还没有记录，保存后会保留在这里。",
              "No records yet. Saved sessions will stay here.",
            )}
          </T>
        ) : null}
        {shown.map((r) => (
          <View
            key={r.id}
            style={{
              borderBottomWidth: 1,
              borderBottomColor: c.line,
              paddingVertical: 10,
              gap: 4,
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <View style={{ flex: 1 }}>
                <T raw style={{ fontSize: 14, fontWeight: "600" }}>
                  {r.kind === "temperature"
                    ? `${r.temperature}°C · ${copy(temperatureMethods.find((m) => m.id === r.method)!.label)}`
                    : copy(option.label)}
                </T>
                <T raw style={{ fontSize: 12, color: c.muted }}>
                  {new Date(r.time).toLocaleString(locale, {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })}
                </T>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={text("编辑照护记录", "Edit care record")}
                disabled={busy}
                onPress={() => {
                  setEditing(r.id);
                  setDate(playDayKey(new Date(r.time)));
                  setTime(new Date(r.time).toTimeString().slice(0, 5));
                  setTemperature(
                    r.temperature === undefined ? "" : String(r.temperature),
                  );
                  setMethod(r.method);
                  setNote(r.note);
                  setMessage(null);
                }}
                style={{
                  minHeight: 44,
                  justifyContent: "center",
                  paddingHorizontal: 4,
                }}
              >
                <T raw style={{ fontSize: 12, color: c.primary }}>
                  {text("编辑", "Edit")}
                </T>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={text("删除照护记录", "Delete care record")}
                disabled={busy}
                onPress={() => setConfirm(r.id)}
                style={{
                  minHeight: 44,
                  justifyContent: "center",
                  paddingHorizontal: 4,
                }}
              >
                <T raw style={{ fontSize: 12, color: c.muted }}>
                  {text("删除", "Delete")}
                </T>
              </Pressable>
            </View>
            {r.note ? (
              <T raw style={{ fontSize: 12, color: c.muted }}>
                {r.note}
              </T>
            ) : null}
            {confirm === r.id ? (
              <View style={{ gap: 8 }}>
                <T raw>
                  {text(
                    "确定删除这条照护记录？无法撤销。",
                    "Delete this care record? This cannot be undone.",
                  )}
                </T>
                <Button
                  label={text("确认删除照护记录", "Confirm care deletion")}
                  disabled={busy}
                  onPress={() => void remove(r.id)}
                />
                <Button
                  label={text("取消删除", "Cancel deletion")}
                  secondary
                  disabled={busy}
                  onPress={() => setConfirm(null)}
                />
              </View>
            ) : null}
          </View>
        ))}
        {history.length > 5 ? (
          <Button
            label={text(
              expanded
                ? "收起照护历史"
                : `展开更早的 ${history.length - 5} 条照护记录`,
              expanded
                ? "Collapse care history"
                : `Show ${history.length - 5} older care records`,
            )}
            secondary
            onPress={() => setExpanded(!expanded)}
          />
        ) : null}
      </View>
      <Pressable
        accessibilityRole="link"
        onPress={() => void openSource(option.url)}
        style={{ minHeight: 44, justifyContent: "center" }}
      >
        <T raw style={{ color: c.primary, fontSize: 12 }}>
          {text("查看照护参考来源 ↗", "Care reference ↗")}
        </T>
      </Pressable>
      <T raw style={{ fontSize: 12, color: c.muted }}>
        {text(
          "照护历史保存在本机并包含在记录备份中；每天可记多次，不替代医疗评估。",
          "Care history stays locally and is included in record backups. Multiple sessions per day are supported; this is not a medical assessment.",
        )}
      </T>
    </View>
  );
}
