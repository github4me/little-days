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
page.setDefaultTimeout(8000);
await page.addInitScript(() => {
  localStorage.setItem("little-days-v1-language", "zh");
});
const fontDir = process.env.SCREENSHOT_FONT_DIR;
const fontCSS = fontDir
  ? (await fs.readFile(path.join(fontDir, "400.css"), "utf8")).replaceAll(
      "./files/",
      "/font/files/",
    ) + "\n* { font-family: 'Noto Sans SC', sans-serif !important; }"
  : "";

const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
async function assertNoUntranslatedChinese(screen) {
  const text = await page.locator("body").innerText();
  // The Chinese language selector intentionally uses 中 as its icon in all locales.
  const match = text.replace(/^中$/gm, "").match(/[\p{Script=Han}]/u);
  assert.equal(
    match,
    null,
    `${screen} still contains untranslated Chinese: ${text}`,
  );
}
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
await page.getByText("宝宝的小日子", { exact: true }).waitFor();
await page.getByRole("tab", { name: "早教", exact: true }).click();
await page
  .getByText(
    "活动清单还是空的，请到「选择活动」添加。未设置出生日期时不会自动选择。",
    { exact: true },
  )
  .waitFor();
assert.equal(await page.getByRole("button", { name: /^查看/ }).count(), 0);
await page.getByRole("button", { name: "选择活动", exact: true }).click();
await page.getByRole("button", { name: "0–1 个月", exact: true }).click();
assert.equal(await page.getByRole("button", { name: /^查看/ }).count(), 6);
assert.equal(
  await page
    .getByRole("checkbox", { name: /^选择活动：/, checked: true })
    .count(),
  0,
);
await page
  .getByRole("checkbox", { name: "选择活动：轻声唱一小段", exact: true })
  .click();
await page
  .getByText("尚未设置有效的出生日期，无法判断是否适龄。", { exact: true })
  .waitFor();
await page.getByRole("button", { name: "仍然加入", exact: true }).click();
await page.getByRole("button", { name: "活动清单", exact: true }).click();
await page
  .getByRole("button", { name: "查看轻声唱一小段", exact: true })
  .waitFor();
assert.equal(await page.getByRole("button", { name: /^查看/ }).count(), 1);
await page.evaluate(() =>
  localStorage.removeItem("little-days-v1-play-selection"),
);
await page.getByRole("tab", { name: "今天", exact: true }).click();
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
    ...[80, 90, 100, 110, 130].map((amount, index) => {
      const start = new Date(old);
      start.setDate(start.getDate() - (index + 1));
      return e(`f${index + 4}`, start, amount, 8);
    }),
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
    ...[4.9, 4.7, 4.5, 4.3, 4.1].map((weight, index) => {
      const start = new Date(a);
      start.setDate(start.getDate() - (index + 1) * 7);
      return {
        id: `g${index + 2}`,
        type: "growth",
        weight,
        start: start.toISOString(),
        note: "",
      };
    }),
    {
      id: "m1",
      type: "milestone",
      title: "First smile",
      start: a.toISOString(),
      note: "",
    },
  ];
  localStorage.setItem(
    "little-days-v1",
    JSON.stringify({
      schemaVersion: 1,
      profile: { name: "QQ", birthDate: "2026-07-01", sex: "male" },
      entries,
    }),
  );
});
await page.reload();
await page.getByText("QQ的小日子", { exact: true }).waitFor();
assert.equal(await page.getByText("● 仅此设备", { exact: true }).count(), 0);
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
assert.equal(
  await page.getByRole("button", { name: "编辑喂奶", exact: true }).count(),
  0,
);
assert.equal(
  await page.getByRole("button", { name: "展开当日明细", exact: true }).count(),
  6,
);
await page
  .getByRole("button", { name: "展开当日明细", exact: true })
  .first()
  .click();
await page.getByText("距上次 3小时1分", { exact: true }).waitFor();
await page
  .getByRole("button", { name: "显示 1 天历史记录", exact: true })
  .waitFor();
const compactEdit = await page
  .getByRole("button", { name: "编辑喂奶", exact: true })
  .first()
  .boundingBox();
assert.ok(
  compactEdit && compactEdit.height <= 38,
  "record actions should be compact",
);
const recordKindOptions = await Promise.all(
  ["喂奶", "尿布", "睡眠"].map((name) =>
    page.getByRole("button", { name, exact: true }).boundingBox(),
  ),
);
assert.ok(recordKindOptions.every(Boolean));
assert.ok(
  recordKindOptions.every(
    (box) => Math.abs(box.y - recordKindOptions[0].y) < 1 && box.height >= 60,
  ),
  "record type choices should be icon cards on one row",
);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: "docs/records-preview.png" });
await page.getByRole("button", { name: "时长", exact: true }).click();
const recordUnitOptions = await Promise.all(
  ["mL", "时长"].map((name) =>
    page.getByRole("button", { name, exact: true }).boundingBox(),
  ),
);
assert.ok(recordUnitOptions.every((box) => box.height >= 50));
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
await page.evaluate(() => window.scrollTo(0, 0));
await page
  .getByRole("button", { name: "展开当日明细", exact: true })
  .first()
  .click();
await page.getByRole("button", { name: "编辑尿布", exact: true }).click();
// Read all three boxes in one frame, even if the sheet is still animating.
const diaperOptions = await page
  .getByRole("button", { name: /^(有尿|有便|尿 \+ 便)$/ })
  .evaluateAll((elements) =>
    elements.map((el) => {
      const box = el.getBoundingClientRect();
      return { x: box.x, y: box.y, width: box.width, height: box.height };
    }),
  );
assert.equal(diaperOptions.length, 3);
assert.ok(
  diaperOptions.every(
    (box) => Math.abs(box.y - diaperOptions[0].y) < 1 && box.height >= 60,
  ),
  `diaper choices should be icon cards on one row: ${JSON.stringify(diaperOptions)}`,
);
await page.evaluate(() => window.scrollTo(0, 0));
await page.screenshot({
  path: path.join(
    process.env.TEMP ?? "docs",
    "little-days-diaper-options-preview.png",
  ),
});
await page.getByLabel("关闭记录编辑", { exact: true }).click();
await page.getByRole("button", { name: "删除尿布", exact: true }).click();
const deleteConfirmation = await page
  .getByRole("button", { name: "确认删除", exact: true })
  .boundingBox();
assert.ok(
  deleteConfirmation &&
    deleteConfirmation.y >= 0 &&
    deleteConfirmation.y + deleteConfirmation.height <= 844,
  "delete confirmation must appear inside the viewport without scrolling",
);
await page.getByRole("button", { name: "取消", exact: true }).click();
assert.equal(
  await page.getByRole("button", { name: "删除尿布", exact: true }).count(),
  1,
);
await page.getByRole("button", { name: "删除尿布", exact: true }).click();
await page.getByRole("button", { name: "确认删除", exact: true }).click();
await page
  .getByRole("button", { name: "删除尿布", exact: true })
  .waitFor({ state: "detached" });
assert.equal(
  await page.getByRole("button", { name: "撤销删除", exact: true }).count(),
  0,
);
assert.equal(
  await page.getByText("已删除一条记录", { exact: true }).count(),
  0,
);
assert.equal(
  await page.evaluate(() =>
    JSON.parse(localStorage.getItem("little-days-v1")).entries.some(
      (e) => e.id === "d1",
    ),
  ),
  false,
);
await page.getByRole("button", { name: "睡眠", exact: true }).click();
await page.getByText("1 段睡眠 · 3小时1分", { exact: true }).waitFor();
await page.getByRole("tab", { name: "成长", exact: true }).click();
assert.equal(await page.getByText("小小里程碑", { exact: true }).count(), 0);
assert.equal(await page.getByText("日常趋势", { exact: true }).count(), 0);
await page.getByRole("button", { name: "＋测量", exact: true }).waitFor();
await page.getByRole("button", { name: "全部", exact: true }).click();
await page
  .getByText("三项曲线按各自单位缩放；切换到单项可查看 WHO 参考。", {
    exact: true,
  })
  .waitFor();
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: "docs/growth-preview.png" });
assert.equal(
  (
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("little-days-v1")),
    )
  ).entries.length,
  16,
);
await page.getByRole("tab", { name: "我的", exact: true }).click();
assert.equal(await page.getByLabel("宝宝名字", { exact: true }).count(), 0);
assert.equal(
  await page
    .getByRole("button", { name: "查看上次替换前的数据", exact: true })
    .count(),
  0,
);
await page.getByRole("button", { name: "展开宝宝档案", exact: true }).click();
await page.getByLabel("宝宝名字", { exact: true }).waitFor();
const sexOptions = await Promise.all(
  ["男宝宝", "女宝宝", "暂不填写"].map((name) =>
    page.getByRole("button", { name, exact: true }).boundingBox(),
  ),
);
assert.ok(
  sexOptions.every(
    (box) => Math.abs(box.y - sexOptions[0].y) < 1 && box.height >= 60,
  ),
  "profile choices should be icon cards on one row",
);
const nightModeSwitch = page.getByRole("switch", {
  name: "夜间模式",
  exact: true,
});
const nightModeBox = await nightModeSwitch.boundingBox();
assert.ok(nightModeBox);
assert.ok(
  nightModeBox.x + nightModeBox.width <= 370,
  "night mode switch should fit inside the settings card",
);
await nightModeSwitch.click();
await page.waitForFunction(
  () => localStorage.getItem("little-days-v1-dark") === "true",
);
assert.equal(
  await page.evaluate(() => localStorage.getItem("little-days-v1-dark")),
  "true",
);
await page.getByRole("button", { name: "English", exact: true }).click();
await page.getByText("Care reminders", { exact: true }).waitFor();
assert.equal(await page.getByText("● This device", { exact: true }).count(), 0);
const languageOptions = await Promise.all(
  ["Follow system", "Simplified Chinese", "English"].map((name) =>
    page.getByRole("button", { name, exact: true }).boundingBox(),
  ),
);
assert.ok(languageOptions.every(Boolean));
assert.ok(
  languageOptions.every((box) => Math.abs(box.y - languageOptions[0].y) < 1),
  "language choices should stay on one row",
);
await page
  .getByRole("button", { name: "Privacy & support", exact: true })
  .click();
await page.getByText("Your data stays with you", { exact: true }).waitFor();
await page.getByText("Software updates", { exact: true }).waitFor();
await page.getByText("admin@reticle.com.au", { exact: true }).waitFor();
assert.equal(
  await page
    .getByRole("button", { name: "Contact support", exact: true })
    .count(),
  1,
);
await assertNoUntranslatedChinese("Privacy & support");
await page.getByRole("button", { name: "Back to More", exact: true }).click();
await page.getByText("Care reminders", { exact: true }).waitFor();
await page.screenshot({
  path: path.join(
    process.env.TEMP ?? "docs",
    "little-days-language-preview.png",
  ),
});
await assertNoUntranslatedChinese("Settings");
await page.getByRole("tab", { name: "Today", exact: true }).click();
await page.getByText("QQ's little days", { exact: true }).waitFor();
await assertNoUntranslatedChinese("Today");
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: "docs/night-preview.png" });
await page.getByRole("tab", { name: "Growth", exact: true }).click();
await page.getByText("Growth charts", { exact: true }).waitFor();
await page
  .getByRole("button", { name: "Show 1 earlier records", exact: true })
  .waitFor();
assert.equal(
  await page.getByText("4.1 kg", { exact: false }).count(),
  0,
  "older growth measurements should be collapsed by default",
);
await page
  .getByRole("button", { name: "Show 1 earlier records", exact: true })
  .click();
await page
  .getByRole("button", { name: "Hide earlier records", exact: true })
  .waitFor();
await page.getByText("4.1 kg", { exact: false }).waitFor();
await page
  .getByRole("button", { name: "Delete Measure", exact: true })
  .last()
  .click();
const growthDeleteConfirmation = await page
  .getByRole("button", { name: "Delete record", exact: true })
  .boundingBox();
assert.ok(
  growthDeleteConfirmation &&
    growthDeleteConfirmation.y >= 0 &&
    growthDeleteConfirmation.y + growthDeleteConfirmation.height <= 844,
);
await page.getByRole("button", { name: "Cancel", exact: true }).click();
await page.getByText("4.1 kg", { exact: false }).waitFor();
await page
  .getByRole("button", { name: "Delete Measure", exact: true })
  .last()
  .click();
await page.getByRole("button", { name: "Delete record", exact: true }).click();
await page.getByText("4.1 kg", { exact: false }).waitFor({ state: "detached" });
assert.equal(
  await page.evaluate(() =>
    JSON.parse(localStorage.getItem("little-days-v1")).entries.some(
      (e) => e.id === "g6",
    ),
  ),
  false,
);
const metricOptions = await Promise.all(
  ["All", "Weight", "Length", "Head"].map((name) =>
    page.getByRole("button", { name, exact: true }).boundingBox(),
  ),
);
assert.ok(metricOptions.every(Boolean));
assert.ok(
  metricOptions.every((box) => Math.abs(box.y - metricOptions[0].y) < 1),
  "growth metric choices should stay on one row",
);
await assertNoUntranslatedChinese("Growth");
await page.screenshot({
  path: path.join(
    process.env.TEMP ?? "docs",
    "little-days-growth-picker-preview.png",
  ),
});
await page.getByRole("button", { name: "+ Measure", exact: true }).click();
await page.getByText("Measurement", { exact: true }).waitFor();
await page
  .getByText("Enter at least one value; decimals are kept as measured.", {
    exact: true,
  })
  .waitFor();
for (const label of ["Weight · kg", "Length · cm", "Head · cm"])
  await page.getByLabel(label, { exact: true }).waitFor();
await assertNoUntranslatedChinese("Growth measurement editor");
await page.getByLabel("Close editor", { exact: true }).click();
await page.getByRole("tab", { name: "Records", exact: true }).click();
await page.getByText("Last 7 days", { exact: true }).waitFor();
await page
  .getByRole("button", { name: "Show 1 earlier days", exact: true })
  .click();
await page
  .getByRole("button", { name: "Hide earlier days", exact: true })
  .waitFor();
assert.equal(
  await page
    .getByRole("button", { name: "Show day details", exact: true })
    .count(),
  7,
);
assert.equal(
  await page.getByRole("button", { name: "Edit Feed", exact: true }).count(),
  0,
);
await page
  .getByRole("button", { name: "Show day details", exact: true })
  .last()
  .click();
await page.getByRole("button", { name: "Edit Feed", exact: true }).waitFor();
await assertNoUntranslatedChinese("Records");
await page.getByRole("button", { name: "Diaper", exact: true }).click();
await page.getByText("changes", { exact: true }).waitFor();
await assertNoUntranslatedChinese("Diaper records");
await page.setViewportSize({ width: 340, height: 740 });
await page.getByRole("tab", { name: "Growth", exact: true }).click();
await page.getByText("Growth charts", { exact: true }).waitFor();
const narrowMetricOptions = await Promise.all(
  ["All", "Weight", "Length", "Head"].map((name) =>
    page.getByRole("button", { name, exact: true }).boundingBox(),
  ),
);
assert.ok(
  narrowMetricOptions.every(
    (box) => Math.abs(box.y - narrowMetricOptions[0].y) < 1,
  ),
  "growth metric choices should stay on one row on a narrow phone",
);
assert.equal(
  await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth,
  ),
  true,
);
await page.getByRole("tab", { name: "Records", exact: true }).click();
await page.getByText("Last 7 days", { exact: true }).waitFor();
const narrowRecordsHeading = await page
  .getByText("Every day remembered", { exact: true })
  .boundingBox();
assert.ok(narrowRecordsHeading);
assert.ok(
  narrowRecordsHeading.x + narrowRecordsHeading.width <= 320,
  "records heading should fit the narrow screen content",
);
const narrowRecordKindOptions = await Promise.all(
  ["Feed", "Diaper", "Sleep"].map((name) =>
    page.getByRole("button", { name, exact: true }).boundingBox(),
  ),
);
assert.ok(
  narrowRecordKindOptions.every(
    (box) => Math.abs(box.y - narrowRecordKindOptions[0].y) < 1,
  ),
  "record type choices should stay on one row on a narrow phone",
);
await page.getByRole("tab", { name: "Today", exact: true }).click();
await page.getByRole("button", { name: "+ Add", exact: true }).first().click();
await page.getByRole("button", { name: "Start", exact: true }).click();
await page.getByRole("button", { name: "Stop", exact: true }).waitFor();
const runningFeed = await page.evaluate(() =>
  JSON.parse(localStorage.getItem("little-days-v1")).entries.find(
    (e) => e.feedRunning,
  ),
);
assert.ok(runningFeed && !runningFeed.end);
await page.reload();
await page.getByRole("button", { name: "停止", exact: true }).waitFor();
await page.getByText("正在喂养", { exact: true }).waitFor();
await page.getByRole("button", { name: "停止", exact: true }).click();
await page
  .getByRole("button", { name: "＋记录", exact: true })
  .first()
  .waitFor();
const finishedFeed = await page.evaluate(
  (id) =>
    JSON.parse(localStorage.getItem("little-days-v1")).entries.find(
      (e) => e.id === id,
    ),
  runningFeed.id,
);
assert.equal(finishedFeed.feedRunning, undefined);
assert.equal(finishedFeed.start, runningFeed.start);
assert.ok(Date.parse(finishedFeed.end) >= Date.parse(finishedFeed.start));
await page.getByRole("tab", { name: "记录", exact: true }).click();
await page.getByRole("button", { name: "编辑喂奶", exact: true }).waitFor();
assert.equal(
  await page.getByRole("button", { name: "编辑喂奶", exact: true }).count(),
  1,
);
await page.getByRole("tab", { name: "早教", exact: true }).click();
await page.getByText("亲子早教", { exact: true }).waitFor();
await page
  .getByRole("checkbox", { name: "今天做过：看看黑白卡", exact: true })
  .waitFor();
assert.equal(await page.getByRole("button", { name: /^查看/ }).count(), 6);
assert.equal(
  await page.getByRole("button", { name: /个月$/, exact: false }).count(),
  0,
); // no age filter on the daily list
await page.getByRole("button", { name: "选择活动", exact: true }).click();
await page
  .getByRole("checkbox", { name: "选择活动：看看黑白卡", exact: true })
  .click();
await page.getByRole("button", { name: "19–21 个月", exact: true }).click();
await page
  .getByRole("checkbox", { name: "选择活动：今天穿哪一件？", exact: true })
  .click();
await page
  .getByText("宝宝实际满 2 个月，这项活动不在当前参考月龄内。", { exact: true })
  .waitFor();
assert.equal(
  await page.evaluate(() =>
    JSON.parse(
      localStorage.getItem("little-days-v1-play-selection"),
    ).included.includes("choose-shirt"),
  ),
  false,
);
await page.getByRole("button", { name: "暂不加入", exact: true }).click();
await page
  .getByRole("checkbox", { name: "选择活动：今天穿哪一件？", checked: false })
  .waitFor();
await page
  .getByRole("checkbox", { name: "选择活动：今天穿哪一件？", exact: true })
  .click();
await page.getByRole("button", { name: "仍然加入", exact: true }).click();
await page
  .getByRole("checkbox", { name: "选择活动：今天穿哪一件？", checked: true })
  .waitFor();
await page.getByRole("button", { name: "活动清单", exact: true }).click();
assert.equal(await page.getByRole("button", { name: /^查看/ }).count(), 6);
assert.equal(
  await page
    .getByRole("button", { name: "查看看看黑白卡", exact: true })
    .count(),
  0,
);
await page
  .getByRole("button", { name: "查看今天穿哪一件？", exact: true })
  .waitFor();
await page.reload();
await page.getByRole("tab", { name: "早教", exact: true }).click();
await page
  .getByRole("button", { name: "查看今天穿哪一件？", exact: true })
  .waitFor();
assert.equal(
  await page
    .getByRole("button", { name: "查看看看黑白卡", exact: true })
    .count(),
  0,
);
await page.getByRole("tab", { name: "我的", exact: true }).click();
await page.getByRole("button", { name: "English", exact: true }).click();
await page.getByRole("tab", { name: "Play", exact: true }).click();
await page
  .getByRole("button", { name: "Choose activities", exact: true })
  .click();
await page.getByRole("button", { name: "19–21 months", exact: true }).click();
const playCount = await page.getByRole("button", { name: /^View / }).count();
assert.ok(playCount >= 6);
for (let i = 0; i < playCount; i++) {
  await page
    .getByRole("button", { name: /^(View|Hide) / })
    .nth(i)
    .click();
  await assertNoUntranslatedChinese("Choose activities");
}
await page
  .getByRole("checkbox", {
    name: "Select activity: Roll a ball together",
    exact: true,
  })
  .click();
await page.getByText("Confirm activity selection", { exact: true }).waitFor();
await assertNoUntranslatedChinese("Cross-age selection confirmation");
await page.getByText(/Activity reference age: 18 to under 25 months/).waitFor();
await page.screenshot({
  path: path.join(
    process.env.TEMP ?? "docs",
    "little-days-selection-warning.png",
  ),
});
await page.getByRole("button", { name: "Not now", exact: true }).click();
await page
  .getByText("Confirm activity selection", { exact: true })
  .waitFor({ state: "hidden" });
assert.equal(
  await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth,
  ),
  true,
);
await page.screenshot({
  path: path.join(
    process.env.TEMP ?? "docs",
    "little-days-choose-activities.png",
  ),
});
// A corrupt selection must not be overwritten by computed defaults.
await page.evaluate(() =>
  localStorage.setItem("little-days-v1-play-selection", "corrupt"),
);
await page.reload();
await page.getByRole("tab", { name: "早教", exact: true }).click();
await page
  .getByText("活动选择无法读取，原数据未覆盖。", { exact: true })
  .waitFor();
assert.equal(
  await page.evaluate(() =>
    localStorage.getItem("little-days-v1-play-selection"),
  ),
  "corrupt",
);
await page.evaluate(() =>
  localStorage.removeItem("little-days-v1-play-selection"),
);
await page
  .getByRole("button", { name: "重新读取活动选择", exact: true })
  .click();
await page
  .getByRole("checkbox", { name: "今天做过：看看黑白卡", exact: true })
  .waitFor();
await page.evaluate(() => {
  window.selectionSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function (key, value) {
    if (key === "little-days-v1-play-selection")
      throw new Error("simulated selection failure");
    return window.selectionSetItem.call(this, key, value);
  };
});
await page
  .getByRole("checkbox", { name: "选择活动：看看黑白卡", exact: true })
  .click();
await page.getByText("活动选择未保存，请重试。", { exact: true }).waitFor();
await page
  .getByRole("checkbox", { name: "选择活动：看看黑白卡", checked: true })
  .waitFor();
await page.evaluate(() => {
  Storage.prototype.setItem = window.selectionSetItem;
  delete window.selectionSetItem;
});
await context.setOffline(true);
await page
  .getByRole("checkbox", { name: "选择活动：看看黑白卡", exact: true })
  .click();
assert.equal(
  await page
    .getByRole("button", { name: "查看看看黑白卡", exact: true })
    .count(),
  0,
);
await page.getByRole("button", { name: "选择活动", exact: true }).click();
await page
  .getByRole("checkbox", { name: "选择活动：看看黑白卡", exact: true })
  .click();
await page
  .getByRole("checkbox", { name: "选择活动：看看黑白卡", checked: true })
  .waitFor();
await page.getByRole("button", { name: "活动清单", exact: true }).click();
// Check-ins remain independent of selection and persist across reload and midnight.
await page
  .getByRole("checkbox", { name: "今天做过：看看黑白卡", exact: true })
  .click();
await page
  .getByRole("checkbox", { name: "今天做过：看看黑白卡", checked: true })
  .waitFor();
await context.setOffline(false);
const checkinKey = await page.evaluate(() => {
  const d = new Date();
  return (
    "little-days-v1-play-checkins-" +
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
});
await page.reload();
await page.getByRole("tab", { name: "早教", exact: true }).click();
await page
  .getByRole("checkbox", { name: "今天做过：看看黑白卡", checked: true })
  .waitFor();
await page
  .getByRole("checkbox", { name: "选择活动：看看黑白卡", exact: true })
  .click();
await page.getByRole("button", { name: "选择活动", exact: true }).click();
await page
  .getByRole("checkbox", { name: "选择活动：看看黑白卡", exact: true })
  .click();
await page.getByRole("button", { name: "活动清单", exact: true }).click();
await page
  .getByRole("checkbox", { name: "今天做过：看看黑白卡", checked: true })
  .waitFor();
const nextDay = new Date();
// A failed daily check-in write must still preserve the previous checked state.
await page.evaluate(() => {
  window.checkinSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function (key, value) {
    if (key.includes("play-checkins-"))
      throw new Error("simulated check-in failure");
    return window.checkinSetItem.call(this, key, value);
  };
});
await page
  .getByRole("checkbox", { name: "今天做过：看看黑白卡", exact: true })
  .click();
await page.getByText("打卡未保存，请重试。", { exact: true }).waitFor();
await page
  .getByRole("checkbox", { name: "今天做过：看看黑白卡", checked: true })
  .waitFor();
await page.evaluate(() => {
  Storage.prototype.setItem = window.checkinSetItem;
  delete window.checkinSetItem;
});
nextDay.setDate(nextDay.getDate() + 1);
nextDay.setHours(0, 1, 0, 0);
await page.clock.setFixedTime(nextDay);
await page
  .getByRole("checkbox", { name: "今天做过：看看黑白卡", checked: false })
  .waitFor();
assert.deepEqual(
  await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)),
    checkinKey,
  ),
  ["contrast-card"],
);
await page.getByRole("tab", { name: "我的", exact: true }).click();
await page.getByRole("button", { name: "English", exact: true }).click();
await page.getByRole("tab", { name: "Play", exact: true }).click();
await page
  .getByRole("button", { name: "View Awake tummy time", exact: true })
  .click();
await assertNoUntranslatedChinese("Selected activity list");
// Daily care is a separate history, not a daily play checkbox.
await page.getByRole("button", { name: "Daily care", exact: true }).click();
assert.equal(
  await page.getByRole("button", { name: "By setting", exact: true }).count(),
  0,
);
await page
  .getByRole("button", { name: "Save care record", exact: true })
  .click();
await page.getByText(/Check the date, time and reading/).waitFor();
await page
  .getByRole("textbox", { name: "Temperature · °C", exact: true })
  .fill("36.85");
await page.getByRole("button", { name: "Armpit", exact: true }).click();
await page
  .getByRole("textbox", { name: "Care notes", exact: true })
  .fill("after waking");
// Form changes must not write before Save.
assert.equal(
  await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("little-days-v1")).careRecords?.length ??
      0,
  ),
  0,
);
await page
  .getByRole("button", { name: "Save care record", exact: true })
  .click();
await page.getByText("Care record saved", { exact: true }).waitFor();
assert.equal(
  await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("little-days-v1")).careRecords[0]
        .temperature,
  ),
  36.85,
);
await page
  .getByRole("button", { name: "Edit care record", exact: true })
  .click();
await page
  .getByRole("textbox", { name: "Temperature · °C", exact: true })
  .fill("37.2");
await page
  .getByRole("button", { name: "Save care record", exact: true })
  .click();
await page.getByText("Care record saved", { exact: true }).waitFor();
assert.equal(
  await page.evaluate(
    () => JSON.parse(localStorage.getItem("little-days-v1")).careRecords.length,
  ),
  1,
);
assert.equal(
  await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("little-days-v1")).careRecords[0]
        .temperature,
  ),
  37.2,
);
for (let i = 0; i < 5; i++) {
  await page
    .getByRole("textbox", { name: "Temperature · °C", exact: true })
    .fill(String(36 + i / 10));
  await page.getByRole("button", { name: "Forehead", exact: true }).click();
  await page
    .getByRole("button", { name: "Save care record", exact: true })
    .click();
  await page.getByText("Care record saved", { exact: true }).waitFor();
}
assert.equal(
  await page
    .getByRole("button", { name: "Delete care record", exact: true })
    .count(),
  5,
);
await page
  .getByRole("button", { name: "Show 1 older care records", exact: true })
  .click();
assert.equal(
  await page
    .getByRole("button", { name: "Delete care record", exact: true })
    .count(),
  6,
);
await page
  .getByRole("button", { name: "Delete care record", exact: true })
  .last()
  .click();
assert.equal(
  await page.evaluate(
    () => JSON.parse(localStorage.getItem("little-days-v1")).careRecords.length,
  ),
  6,
);
await page
  .getByRole("button", { name: "Cancel deletion", exact: true })
  .click();
await page
  .getByRole("button", { name: "Delete care record", exact: true })
  .last()
  .click();
await page
  .getByRole("button", { name: "Confirm care deletion", exact: true })
  .click();
await page.getByText("Care record deleted", { exact: true }).waitFor();
assert.equal(
  await page.evaluate(
    () => JSON.parse(localStorage.getItem("little-days-v1")).careRecords.length,
  ),
  5,
);
await page.getByRole("button", { name: "Bath", exact: true }).click();
await page
  .getByRole("button", { name: "Save care record", exact: true })
  .click();
await page.getByText("Care record saved", { exact: true }).waitFor();
await assertNoUntranslatedChinese("Bath care");
for (const kind of ["Wash", "Teeth", "Nails"]) {
  await page.getByRole("button", { name: kind, exact: true }).click();
  await assertNoUntranslatedChinese(`Daily care ${kind}`);
}
await page.getByRole("button", { name: "Temp", exact: true }).click();
await page.evaluate(() => {
  window.careSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function (key, value) {
    if (key === "little-days-v1")
      throw new Error("simulated care save failure");
    return window.careSetItem.call(this, key, value);
  };
});
await page
  .getByRole("textbox", { name: "Temperature · °C", exact: true })
  .fill("36.9");
await page.getByRole("button", { name: "Armpit", exact: true }).click();
await page
  .getByRole("button", { name: "Save care record", exact: true })
  .click();
await page
  .getByText("Care record was not saved. Please try again.", { exact: true })
  .waitFor();
assert.equal(
  await page.evaluate(
    () => JSON.parse(localStorage.getItem("little-days-v1")).careRecords.length,
  ),
  6,
);
await page.evaluate(() => {
  Storage.prototype.setItem = window.careSetItem;
  delete window.careSetItem;
});
await page.reload();
await page.getByRole("tab", { name: "早教", exact: true }).click();
await page.getByRole("button", { name: "日常照护", exact: true }).click();
assert.equal(
  await page.getByRole("button", { name: "删除照护记录", exact: true }).count(),
  5,
);
assert.equal(
  await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth,
  ),
  true,
);
await page.screenshot({
  path: path.join(process.env.TEMP ?? "docs", "little-days-daily-care.png"),
});
await page.getByRole("tab", { name: "我的", exact: true }).click();
const careDownloadPromise = page.waitForEvent("download");
await page.getByRole("button", { name: "导出备份文件", exact: true }).click();
const careDownload = await careDownloadPromise;
const careBackupBytes = await fs.readFile(await careDownload.path());
const careBackup = JSON.parse(careBackupBytes.toString());
assert.equal(careBackup.careRecords.length, 6);
const careChooserPromise = page.waitForEvent("filechooser");
await page.getByRole("button", { name: "选择备份文件", exact: true }).click();
await (
  await careChooserPromise
).setFiles({
  name: "care-backup.json",
  mimeType: "application/json",
  buffer: careBackupBytes,
});
await page
  .getByRole("button", { name: "确认替换当前数据", exact: true })
  .click();
await page.getByRole("tab", { name: "早教", exact: true }).click();
await page.getByRole("button", { name: "日常照护", exact: true }).click();
assert.equal(
  await page.getByRole("button", { name: "删除照护记录", exact: true }).count(),
  5,
);
assert.deepEqual(
  await page.evaluate(
    () => JSON.parse(localStorage.getItem("little-days-v1")).careRecords,
  ),
  careBackup.careRecords,
);
await page.evaluate(() => localStorage.setItem("little-days-v1-dark", "true"));
await page.reload();
await page.getByRole("tab", { name: "早教", exact: true }).click();
await page.getByRole("button", { name: "日常照护", exact: true }).click();
await context.setOffline(true);
await page
  .getByRole("textbox", { name: "体温 · °C", exact: true })
  .fill("36.7");
await page.getByRole("button", { name: "腋下", exact: true }).click();
await page.getByRole("button", { name: "保存照护记录", exact: true }).click();
await page.getByText("照护记录已保存", { exact: true }).waitFor();
assert.equal(
  await page.evaluate(
    () => JSON.parse(localStorage.getItem("little-days-v1")).careRecords.length,
  ),
  7,
);
await context.setOffline(false);
await page.screenshot({
  path: path.join(
    process.env.TEMP ?? "docs",
    "little-days-daily-care-dark.png",
  ),
});
assert.deepEqual(errors, []);
console.log(
  "PASS: clean home, removed controls/milestones, daily chart summaries and intervals, unit switch, confirmed deletion without undo, growth, old data retained, dark mode, narrow layout.",
);
await browser.close();
