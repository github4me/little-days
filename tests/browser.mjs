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
assert.equal(await page.getByText("最近记录", { exact: true }).count(), 0);
await page.evaluate(() => {
  const a = new Date();
  a.setDate(a.getDate() - 1);
  a.setHours(6, 2, 0, 0);
  const b = new Date(a);
  b.setHours(3, 1, 0, 0);
  const old = new Date(a);
  old.setDate(old.getDate() - 1);
  const e = (id, start, amount, minutes) => ({
    id,
    type: "feed",
    feedKind: "formula",
    start: start.toISOString(),
    end: new Date(start.getTime() + minutes * 60000).toISOString(),
    amount,
    note: "",
  });
  const entries = [
    e("f1", a, 100, 11),
    e("f2", b, 150, 10),
    e("f3", old, 120, 5),
    {
      id: "d1",
      type: "diaper",
      diaperKind: "mixed",
      start: a.toISOString(),
      note: "",
    },
    {
      id: "s1",
      type: "sleep",
      start: b.toISOString(),
      end: a.toISOString(),
      note: "",
    },
    {
      id: "g1",
      type: "growth",
      weight: 5.16,
      start: a.toISOString(),
      note: "",
    },
    {
      id: "m1",
      type: "milestone",
      title: "旧里程碑",
      start: a.toISOString(),
      note: "",
    },
  ];
  localStorage.setItem(
    "little-days-v1",
    JSON.stringify({
      schemaVersion: 1,
      profile: { name: "测试宝宝", birthDate: "2026-07-01", sex: "male" },
      entries,
    }),
  );
});
await page.reload();
await page.getByText("测试宝宝", { exact: true }).waitFor();
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: "docs/home-preview.png" });
await page.getByRole("tab", { name: "记录", exact: true }).click();
for (const label of [
  "全部",
  "测量",
  "里程碑",
  "＋喂奶",
  "＋尿布",
  "＋睡眠",
  "＋测量",
  "＋里程碑",
  "清除",
])
  assert.equal(
    await page.getByRole("button", { name: label, exact: true }).count(),
    0,
    label,
  );
assert.equal(await page.getByRole("textbox").count(), 0);
await page.getByText("2 次喂奶 · 250 mL · 21分钟", { exact: true }).waitFor();
await page.getByText("距上次 3小时1分", { exact: true }).waitFor();
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: "docs/records-preview.png" });
await page.getByRole("button", { name: "时长", exact: true }).click();
await page
  .getByRole("button", { name: "编辑喂奶", exact: true })
  .first()
  .click();
const quickAmountButtons = await Promise.all(
  [60, 90, 120, 150].map((amount) =>
    page
      .getByRole("button", { name: `${amount} mL`, exact: true })
      .boundingBox(),
  ),
);
assert.ok(quickAmountButtons.every(Boolean));
const quickAmountTop = quickAmountButtons[0].y;
assert.ok(
  quickAmountButtons.every((box) => Math.abs(box.y - quickAmountTop) < 1),
  "quick amount choices should stay on one row",
);
await page.getByLabel("实际喝奶量", { exact: true }).fill("110");
await page.getByRole("button", { name: "保存记录", exact: true }).click();
await page.getByText("2 次喂奶 · 260 mL · 21分钟", { exact: true }).waitFor();
await page.getByRole("button", { name: "尿布", exact: true }).click();
await page
  .getByText("1 次更换 · 有尿 1 次 · 有便 1 次", { exact: true })
  .waitFor();
await page.getByRole("button", { name: "删除尿布", exact: true }).click();
await page.getByRole("button", { name: "确认删除", exact: true }).click();
await page.getByRole("button", { name: "撤销删除", exact: true }).click();
await page
  .getByText("1 次更换 · 有尿 1 次 · 有便 1 次", { exact: true })
  .waitFor();
await page.getByRole("button", { name: "睡眠", exact: true }).click();
await page.getByText("1 段睡眠 · 3小时1分", { exact: true }).waitFor();
await page.getByRole("tab", { name: "成长", exact: true }).click();
assert.equal(await page.getByText("小小里程碑", { exact: true }).count(), 0);
assert.equal(await page.getByText("日常趋势", { exact: true }).count(), 0);
await page.getByRole("button", { name: "＋测量", exact: true }).waitFor();
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: "docs/growth-preview.png" });
assert.equal(
  (
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("little-days-v1")),
    )
  ).entries.length,
  7,
);
await page.getByRole("tab", { name: "我的", exact: true }).click();
await page.getByRole("switch", { name: "夜间模式", exact: true }).click();
await page.getByRole("tab", { name: "今天", exact: true }).click();
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: "docs/night-preview.png" });
await page.getByRole("tab", { name: "记录", exact: true }).click();
await page.setViewportSize({ width: 340, height: 740 });
assert.equal(
  await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth,
  ),
  true,
);
assert.deepEqual(errors, []);
console.log(
  "PASS: clean home, removed controls/milestones, daily chart summaries and intervals, unit switch, edit/delete/undo, growth, old data retained, dark mode, narrow layout.",
);
await browser.close();
