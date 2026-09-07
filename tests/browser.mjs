import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
const bundled = process.env.USE_BUNDLED_CHROMIUM
  ? (await import("@sparticuz/chromium")).default
  : null;
const browser = await chromium.launch({
  headless: true,
  executablePath: bundled ? await bundled.executablePath() : undefined,
  args: bundled ? bundled.args : ["--no-sandbox", "--disable-dev-shm-usage"],
});
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  timezoneId: "Australia/Melbourne",
});
const page = await context.newPage();
const fontDir = process.env.SCREENSHOT_FONT_DIR;
const fontCSS = fontDir
  ? (await fs.readFile(path.join(fontDir, "400.css"), "utf8")).replaceAll(
      "./files/",
      "/font/files/",
    ) + "\n* { font-family: 'Noto Sans SC', sans-serif !important; }"
  : "";

const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.route("http://little-days.test/**", async (route) => {
  const url = new URL(route.request().url());
  const local =
    url.pathname.startsWith("/font/") && fontDir
      ? path.join(fontDir, url.pathname.slice(6))
      : path.resolve(
          "dist-web",
          "." + (url.pathname === "/" ? "/index.html" : url.pathname),
        );
  try {
    let body = await fs.readFile(local);
    if (local.endsWith(".html") && fontCSS)
      body = Buffer.from(
        body
          .toString()
          .replace("</head>", "<style>" + fontCSS + "</style></head>"),
      );
    await route.fulfill({
      body,
      contentType: local.endsWith(".js")
        ? "application/javascript"
        : local.endsWith(".html")
          ? "text/html"
          : "application/octet-stream",
    });
  } catch {
    await route.fulfill({ status: 404, body: "not found" });
  }
});
await page.goto("http://little-days.test/");
await page.getByText("今天的小日子", { exact: true }).waitFor();
await page.getByRole("tab", { name: "我的", exact: true }).click();
await page.getByLabel("宝宝名字", { exact: true }).fill("测试宝宝");
await page.getByLabel("出生日期 · 可暂不填写").fill("2026-07-01");
await page.getByRole("button", { name: "男宝宝", exact: true }).click();
await page.getByRole("button", { name: "保存档案", exact: true }).click();
await page.getByText("宝宝档案已保存", { exact: true }).waitFor();
await page.getByRole("tab", { name: "今天", exact: true }).click();
await page.getByRole("button", { name: "＋记录", exact: true }).first().click();
await page.getByLabel("实际喝奶量", { exact: true }).fill("135");
await page.getByLabel("备注", { exact: true }).fill("测试记录");
await page.getByRole("button",{name:"+ 记录结束时间（可选）",exact:true}).click();
await page.getByRole("button", { name: "保存记录", exact: true }).click();
await page.getByText("已保存到本机", { exact: false }).waitFor();
let state = await page.evaluate(() =>
  JSON.parse(localStorage.getItem("little-days-v1")),
);
assert.equal(state.entries[0].amount, 135);
await page.reload();
await page.getByText("测试宝宝", { exact: true }).waitFor();
assert.equal(
  (
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("little-days-v1")),
    )
  ).entries.length,
  1,
);
await page.getByRole("button", { name: "睡了", exact: true }).click();
await page.getByRole("button", { name: "醒了", exact: true }).waitFor();
state = await page.evaluate(() =>
  JSON.parse(localStorage.getItem("little-days-v1")),
);
const sleepStart = state.entries.find((e) => e.type === "sleep").start;
await page.reload();
await page.getByRole("button", { name: "醒了", exact: true }).waitFor();
assert.equal(
  (
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("little-days-v1")),
    )
  ).entries.find((e) => e.type === "sleep").start,
  sleepStart,
);
await page.getByRole("button", { name: "醒了", exact: true }).click();
await page.getByRole("button", { name: "睡了", exact: true }).waitFor();
await page.getByRole("button", { name: "＋记录", exact: true }).last().click();
await page.getByRole("button", { name: "尿 + 便", exact: true }).click();
await page.getByRole("button", { name: "保存记录", exact: true }).click();
await page.getByRole("tab", { name: "记录", exact: true }).click();
await page.getByRole("button", { name: "＋测量", exact: true }).click();
await page.getByLabel("体重 · kg", { exact: true }).fill("5.16");
await page.getByLabel("身长 · cm", { exact: true }).fill("56");
await page.getByLabel("头围 · cm", { exact: true }).fill("39");
await page.getByRole("button", { name: "保存记录", exact: true }).click();
await page.getByRole("button", { name: "＋里程碑", exact: true }).click();
await page.getByLabel("里程碑标题", { exact: true }).fill("第一次微笑");
await page.getByRole("button", { name: "保存记录", exact: true }).click();
await page.getByRole("button", { name: "编辑喂奶", exact: true }).click();
await page.getByLabel("实际喝奶量", { exact: true }).fill("-1");
await page.getByRole("button", { name: "保存记录", exact: true }).click();
await page.getByRole("alert").waitFor();
assert.equal(
  (
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("little-days-v1")),
    )
  ).entries.find((e) => e.type === "feed").amount,
  135,
);
await page.getByLabel("实际喝奶量", { exact: true }).fill("150");
await page.getByRole("button", { name: "保存记录", exact: true }).click();
await page.getByRole("button", { name: "删除尿布", exact: true }).click();
await page.getByRole("button", { name: "确认删除", exact: true }).click();
await page.getByRole("button", { name: "撤销删除", exact: true }).click();
await page.getByRole("tab", { name: "成长", exact: true }).click();
await page.getByText("成长曲线", { exact: true }).waitFor();
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: "docs/growth-preview.png", fullPage: false });
await page.getByRole("tab", { name: "今天", exact: true }).click();
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: "docs/home-preview.png", fullPage: false });
assert.equal(
  await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth,
  ),
  true,
);
await page.getByRole("tab", { name: "我的", exact: true }).click();
const downloadEvent = page.waitForEvent("download");
await page.getByRole("button", { name: "导出备份文件", exact: true }).click();
const download = await downloadEvent;
await download.saveAs("/tmp/little-days-export.json");
const exported = JSON.parse(
  await fs.readFile("/tmp/little-days-export.json", "utf8"),
);
assert.equal(exported.entries.length, 5);
// Verify invalid backup cannot replace data, followed by a valid replacement + recovery.
await fs.writeFile(
  "/tmp/little-days-invalid.json",
  JSON.stringify({ ...exported, schemaVersion: 99 }),
);
let chooserEvent = page.waitForEvent("filechooser");
await page.getByRole("button", { name: "选择备份文件", exact: true }).click();
await (await chooserEvent).setFiles("/tmp/little-days-invalid.json");
await page.getByRole("alert").waitFor();
assert.equal(
  (
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("little-days-v1")),
    )
  ).entries.length,
  5,
);
await fs.writeFile(
  "/tmp/little-days-import.json",
  JSON.stringify({
    ...exported,
    profile: { ...exported.profile, name: "恢复测试" },
    entries: exported.entries.slice(0, 1),
  }),
);
chooserEvent = page.waitForEvent("filechooser");
await page.getByRole("button", { name: "选择备份文件", exact: true }).click();
await (await chooserEvent).setFiles("/tmp/little-days-import.json");
await page
  .getByRole("button", { name: "确认替换当前数据", exact: true })
  .click();
await page.getByText("记录已恢复；现有提醒保持不变，请按需检查").waitFor();
assert.equal(
  (
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("little-days-v1")),
    )
  ).entries.length,
  1,
);
await page
  .getByRole("button", { name: "查看上次替换前的数据", exact: true })
  .click();
await page
  .getByRole("button", { name: "确认替换当前数据", exact: true })
  .click();
await page.waitForFunction(
  () => JSON.parse(localStorage.getItem("little-days-v1")).entries.length === 5,
);
await page.getByRole("switch", { name: "夜间模式", exact: true }).click();
await page.reload();
await page.getByRole("tab", { name: "今天", exact: true }).waitFor();
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: "docs/night-preview.png", fullPage: false });
// Timestamp preservation: edit only a note on the second repeated local DST hour.
await page.evaluate(() => {
  const s = JSON.parse(localStorage.getItem("little-days-v1"));
  s.profile.birthDate = "2026-01-01";
  s.entries = [
    {
      id: "dst",
      type: "diaper",
      start: "2026-04-05T02:30:45+10:00",
      diaperKind: "wet",
      note: "",
    },
  ];
  localStorage.setItem("little-days-v1", JSON.stringify(s));
});
await page.reload();
await page.getByRole("tab", { name: "记录", exact: true }).click();
await page.getByRole("button", { name: "编辑尿布", exact: true }).click();
await page.getByLabel("备注", { exact: true }).fill("只修改备注");
await page.getByRole("button", { name: "保存记录", exact: true }).click();
await page.waitForFunction(
  () =>
    JSON.parse(localStorage.getItem("little-days-v1")).entries[0].note ===
    "只修改备注",
);
assert.equal(
  (
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("little-days-v1")),
    )
  ).entries[0].start,
  "2026-04-05T02:30:45+10:00",
);
await page.evaluate(() => localStorage.setItem("little-days-v1", "{corrupt"));
await page.reload();
await page.getByText("无法读取本地数据", { exact: false }).waitFor();
await page.getByRole("button", { name: "读取恢复副本", exact: true }).click();
await page.getByRole("button", { name: "确认恢复", exact: true }).click();
await page.getByText("今天的小日子", { exact: true }).waitFor();
assert.equal(
  (
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("little-days-v1")),
    )
  ).entries.length,
  1,
);
assert.deepEqual(errors, []);
console.log(
  "PASS: profile, five record types, reload/timer persistence, validation, edit, delete/undo, charts, backup/export/import/recovery, dark mode, DST edit, 390px layout; no page errors.",
);
await browser.close();
