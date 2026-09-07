import React, { useContext, useEffect, useRef, useState } from "react";
import { Platform, Switch, View } from "react-native";
import { State, validateState } from "./domain";
import { Theme, T, Card, Field, Button, Chips, row, heading } from "./ui";
import { exportBackup, importBackup } from "./backup";
import { loadRecovery } from "./storage";
import {
  Reminder,
  addReminder,
  cancelReminder,
  listReminders,
} from "./reminders";

export default function Settings({
  state,
  onCommit,
  darkMode,
  onDarkMode,
}: {
  state: State;
  onCommit: (next: State, recovery?: boolean) => Promise<void>;
  darkMode: boolean;
  onDarkMode: (v: boolean) => void;
}) {
  const c = useContext(Theme);
  const [name, setName] = useState(state.profile.name),
    [birthDate, setBirthDate] = useState(state.profile.birthDate),
    [sex, setSex] = useState<string>(state.profile.sex);
  const [busy, setBusy] = useState(false),
    lock = useRef(false),
    mounted = useRef(true);
  const [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const [pending, setPending] = useState<State | null>(null),
    [source, setSource] = useState("备份文件");
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [mode, setMode] = useState("once"),
    [minutes, setMinutes] = useState("120"),
    [dailyTime, setDailyTime] = useState("09:00"),
    [kind, setKind] = useState("喂养"),
    [title, setTitle] = useState(""),
    [silent, setSilent] = useState(true);
  useEffect(() => {
    setName(state.profile.name);
    setBirthDate(state.profile.birthDate);
    setSex(state.profile.sex);
  }, [state.profile.name, state.profile.birthDate, state.profile.sex]);
  useEffect(() => {
    mounted.current = true;
    if (Platform.OS !== "web")
      listReminders()
        .then((v) => {
          if (mounted.current) setReminders(v);
        })
        .catch((e) => {
          if (mounted.current)
            setError(e instanceof Error ? e.message : "暂时无法读取提醒");
        });
    return () => {
      mounted.current = false;
    };
  }, []);
  async function run(task: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await task();
    } catch (e) {
      if (mounted.current)
        setError(e instanceof Error ? e.message : "操作失败，请重试");
    } finally {
      lock.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  async function refresh() {
    const values = await listReminders();
    if (mounted.current) setReminders(values);
  }
  return (
    <View style={{ gap: 18 }}>
      <View>
        <T style={heading}>我的</T>
        <T style={{ color: c.muted, marginTop: 5 }}>
          属于宝宝，也属于你的小小日常。
        </T>
      </View>
      {!!error && (
        <Card>
          <T accessibilityRole="alert" style={{ color: "#B34B3B" }}>
            {error}
          </T>
        </Card>
      )}
      {!!message && (
        <Card>
          <T accessibilityLiveRegion="polite" style={{ color: c.primary }}>
            {message}
          </T>
        </Card>
      )}
      <Card>
        <T style={{ fontSize: 18, fontWeight: "700" }}>宝宝档案</T>
        <View pointerEvents={busy ? "none" : "auto"} style={{ gap: 14 }}>
          <Field
            label="宝宝名字"
            value={name}
            onChange={setName}
            maxLength={100}
            placeholder="宝宝"
          />
          <Field
            label="出生日期 · 可暂不填写"
            value={birthDate}
            onChange={setBirthDate}
            placeholder="YYYY-MM-DD"
            maxLength={10}
          />
          <T style={{ color: c.muted, fontSize: 13 }}>
            性别 · 用于匹配成长参考曲线
          </T>
          <Chips
            value={sex}
            onChange={setSex}
            options={[
              { label: "男宝宝", value: "male" },
              { label: "女宝宝", value: "female" },
              { label: "暂不填写", value: "unspecified" },
            ]}
          />
        </View>
        <Button
          label="保存档案"
          disabled={busy}
          onPress={() =>
            run(async () => {
              const next = validateState({
                ...state,
                profile: {
                  name: name.trim(),
                  birthDate: birthDate.trim(),
                  sex,
                },
              });
              if (next.profile.birthDate) {
                const now = new Date(),
                  today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
                if (next.profile.birthDate > today)
                  throw new Error("出生日期不能在未来");
              }
              await onCommit(next);
              setMessage("宝宝档案已保存");
            })
          }
        />
      </Card>
      <Card>
        <View style={row}>
          <View>
            <T style={{ fontSize: 18, fontWeight: "700" }}>夜间模式</T>
            <T style={{ color: c.muted, fontSize: 13 }}>柔和配色，夜里也舒适</T>
          </View>
          <Switch
            accessibilityLabel="夜间模式"
            value={darkMode}
            onValueChange={onDarkMode}
            disabled={busy}
            trackColor={{ true: c.primary }}
          />
        </View>
      </Card>
      <Card>
        <T style={{ fontSize: 18, fontWeight: "700" }}>照护提醒</T>
        <T style={{ color: c.muted, fontSize: 13 }}>
          按自己的需要设置。间隔提醒从现在算起，只提醒一次；记录喂养后不会自动重置。
        </T>
        {Platform.OS === "web" ? (
          <T style={{ color: c.muted }}>
            浏览器预览不支持本地通知，请在手机安装版中设置和测试。
          </T>
        ) : (
          <>
            <View pointerEvents={busy ? "none" : "auto"} style={{ gap: 13 }}>
              <Chips
                value={kind}
                onChange={setKind}
                options={["喂养", "换尿布", "睡眠"].map((value) => ({
                  value,
                  label: value,
                }))}
              />
              <Field
                label="提醒标题 · 可选"
                value={title}
                onChange={setTitle}
                placeholder={`${kind}提醒`}
                maxLength={100}
              />
              <Chips
                value={mode}
                onChange={setMode}
                options={[
                  { label: "稍后提醒一次", value: "once" },
                  { label: "每天固定时间", value: "daily" },
                ]}
              />
              {mode === "once" ? (
                <Field
                  label="多少分钟后"
                  value={minutes}
                  onChange={setMinutes}
                  keyboardType="number-pad"
                  placeholder="120"
                />
              ) : (
                <Field
                  label="每天当地时间 · HH:mm"
                  value={dailyTime}
                  onChange={setDailyTime}
                  placeholder="09:00"
                  maxLength={5}
                />
              )}
              <View style={row}>
                <T>静音提醒</T>
                <Switch
                  accessibilityLabel="静音提醒"
                  value={silent}
                  onValueChange={setSilent}
                  trackColor={{ true: c.primary }}
                />
              </View>
            </View>
            <Button
              label="添加提醒"
              disabled={busy}
              onPress={() =>
                run(async () => {
                  if (mode === "once" && !minutes.trim())
                    throw new Error("请填写提醒间隔");
                  if (
                    mode === "daily" &&
                    !/^([01]\d|2[0-3]):[0-5]\d$/.test(dailyTime.trim())
                  )
                    throw new Error("时间格式应为 HH:mm");
                  await addReminder(
                    title.trim() || `${kind}提醒`,
                    Number(minutes),
                    mode === "daily" ? dailyTime.trim() : undefined,
                    silent,
                  );
                  await refresh();
                  setMessage("提醒已添加");
                })
              }
            />
            {reminders.length === 0 ? (
              <T style={{ color: c.muted, fontSize: 13 }}>还没有待提醒事项</T>
            ) : (
              reminders.map((reminder) => (
                <View
                  key={reminder.id}
                  style={{
                    ...row,
                    borderTopWidth: 1,
                    borderTopColor: c.line,
                    paddingTop: 12,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <T style={{ fontWeight: "600" }}>{reminder.title}</T>
                    <T style={{ color: c.muted, fontSize: 12 }}>
                      {reminder.detail}
                    </T>
                  </View>
                  <Button
                    label="取消"
                    secondary
                    disabled={busy}
                    onPress={() =>
                      run(async () => {
                        await cancelReminder(reminder.id);
                        await refresh();
                        setMessage("提醒已取消");
                      })
                    }
                  />
                </View>
              ))
            )}
          </>
        )}
      </Card>
      <Card>
        <T style={{ fontSize: 18, fontWeight: "700" }}>备份与恢复</T>
        <T style={{ color: c.muted, fontSize: 13 }}>
          记录保存在当前设备。换手机或卸载前，请导出备份并妥善保存。备份包含宝宝档案和全部记录，不含提醒；重新安装后需重新设置提醒。
        </T>
        <Button
          label="导出备份文件"
          disabled={busy || !!pending}
          onPress={() =>
            run(async () => {
              await exportBackup(state);
              setMessage("导出操作已完成，请确认备份文件已保存");
            })
          }
        />
        <Button
          label="选择备份文件"
          secondary
          disabled={busy || !!pending}
          onPress={() =>
            run(async () => {
              const next = await importBackup();
              if (next) {
                setSource("备份文件");
                setPending(next);
              }
            })
          }
        />
        <Button
          label="查看上次替换前的数据"
          secondary
          disabled={busy || !!pending}
          onPress={() =>
            run(async () => {
              const next = await loadRecovery();
              if (!next) {
                setMessage("暂无恢复副本；首次导入并替换记录后会保留一份");
                return;
              }
              setSource("上次替换前的数据");
              setPending(next);
            })
          }
        />
        {pending && (
          <View
            style={{
              backgroundColor: c.soft,
              padding: 16,
              borderRadius: 16,
              gap: 12,
            }}
          >
            <T style={{ fontWeight: "700" }}>确认恢复：{source}</T>
            <T>
              {pending.profile.name} · {pending.entries.length} 条记录
            </T>
            <T style={{ fontSize: 13 }}>
              这会替换当前「{state.profile.name}」的 {state.entries.length}{" "}
              条记录，不会合并。替换前的数据会保留一份，可从上方入口恢复。
            </T>
            <Button
              label="确认替换当前数据"
              disabled={busy}
              onPress={() =>
                run(async () => {
                  await onCommit(pending, true);
                  setPending(null);
                  setMessage("记录已恢复；现有提醒保持不变，请按需检查");
                })
              }
            />
            <Button
              label="取消恢复"
              secondary
              disabled={busy}
              onPress={() => setPending(null)}
            />
          </View>
        )}
      </Card>
      <View style={{ padding: 10, gap: 5 }}>
        <T style={{ color: c.muted, fontSize: 12, textAlign: "center" }}>
          Little Days · 单机离线版
        </T>
        <T style={{ color: c.muted, fontSize: 12, textAlign: "center" }}>
          无需账号 · 无后台服务器 · 不共享 · 不上传照片
        </T>
        <T style={{ color: c.muted, fontSize: 12, textAlign: "center" }}>
          日期按设备当地时区显示和统计
        </T>
      </View>
    </View>
  );
}
