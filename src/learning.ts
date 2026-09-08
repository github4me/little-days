export type LearningText = { zh: string; en: string };
export const words = (zh: string, en: string): LearningText => ({ zh, en });
export const scenes = [
  { id: "quiet", icon: "♡", label: words("安静互动", "Quiet") },
  { id: "care", icon: "☀", label: words("日常照护", "Care") },
  { id: "floor", icon: "▧", label: words("地垫玩耍", "Floor") },
  { id: "outside", icon: "♧", label: words("出门散步", "Outside") },
] as const;
export type PlayScene = (typeof scenes)[number]["id"];
export const ageBands = [
  { min: 0, max: 3, label: "0–2" },
  { min: 3, max: 6, label: "3–5" },
  { min: 6, max: 9, label: "6–8" },
  { min: 9, max: 12, label: "9–11" },
  { min: 12, max: 18, label: "12–17" },
  { min: 18, max: 24, label: "18–23" },
] as const;
export const learningSources = {
  vision: {
    label: "AAP · Newborn vision",
    url: "https://www.healthychildren.org/English/ages-stages/baby/Pages/Developmental-Milestones-1-Month.aspx",
  },
  tummy: {
    label: "NIH · Tummy time",
    url: "https://safetosleep.nichd.nih.gov/reduce-risk/tummy-time",
  },
  cdc2: {
    label: "CDC · 2 months",
    url: "https://www.cdc.gov/act-early/milestones/2-months.html",
  },
  cdc9: {
    label: "CDC · 9 months",
    url: "https://www.cdc.gov/act-early/milestones/9-months.html",
  },
  cdc12: {
    label: "CDC · 1 year",
    url: "https://www.cdc.gov/act-early/milestones/1-year.html",
  },
  cdc18: {
    label: "CDC · 18 months",
    url: "https://www.cdc.gov/act-early/milestones/18-months.html",
  },
  unicef: {
    label: "UNICEF · Play",
    url: "https://www.unicef.org/parenting/child-care/21-learning-activities-babies-and-toddlers",
  },
  tips: {
    label: "UNICEF · Parenting",
    url: "https://www.unicef.org/parenting/child-development/baby-tips",
  },
  who: {
    label: "WHO · Screen time",
    url: "https://www.who.int/news-room/detail/24-04-2019-to-grow-up-healthy-children-need-to-sit-less-and-play-more",
  },
};
export type PlayActivity = {
  id: string;
  min: number;
  max: number;
  scene: PlayScene;
  minutes: string;
  title: LearningText;
  focus: LearningText;
  materials: LearningText;
  steps: LearningText[];
  safety: LearningText;
  source: keyof typeof learningSources;
};

// Editorial play ideas, not milestone tests. Bounds are broad browsing aids,
// not scientifically validated prescriptions or developmental deadlines.
export const playActivities: PlayActivity[] = [
  {
    id: "contrast-card",
    min: 0,
    max: 3,
    scene: "quiet",
    minutes: "1–2",
    title: words("看看黑白卡", "Black-and-white cards"),
    focus: words("轻松注视，不是视力训练", "Looking, not vision training"),
    materials: words(
      "完整、无锐边的纸质黑白卡或硬页书",
      "An intact, smooth-edged printed contrast card or board book",
    ),
    steps: [
      words(
        "宝宝清醒舒适时，成人拿稳一张简单图案，放在脸前约 20–30 厘米处。",
        "While baby is awake and comfortable, hold a simple pattern about 20–30 cm from their face.",
      ),
      words(
        "让宝宝自己看，也可以换成看你的脸；转开目光就休息，不要求看满时长。",
        "Let baby look, or offer your face instead. Pause when they look away; there is no time target.",
      ),
    ],
    safety: words(
      "不用手机展示，不把卡片放入睡眠空间或让宝宝咬碎。黑白卡只是可选互动，不保证提升视力或智力。",
      "Use a printed card, not a screen. Keep it out of the sleep space and prevent chewing off pieces. This optional game does not promise better vision or intelligence.",
    ),
    source: "vision",
  },
  {
    id: "tummy-time",
    min: 0,
    max: 6,
    scene: "floor",
    minutes: "3–5",
    title: words("清醒时趴一会儿", "Awake tummy time"),
    focus: words("自主抬头与活动", "Moving and lifting the head"),
    materials: words(
      "地面上平坦、稳固、清空的活动垫",
      "A flat, firm, clear mat on the floor",
    ),
    steps: [
      words(
        "选择宝宝清醒、成人也清醒能全程看护的时候，在地垫上轻轻让宝宝俯卧，成人面对面陪伴。",
        "When baby and caregiver are awake, gently place baby on their tummy on the mat. Stay face to face and watch throughout.",
      ),
      words(
        "从短时间开始，观察宝宝反应，不适就停；逐步增加，不按打卡数决定活动量。",
        "Begin with short sessions and stop for discomfort. Build up gradually; check-in counts do not determine how much to do.",
      ),
    ],
    safety: words(
      "只在清醒且成人全程看护时进行，不强行抬头。困了立即结束，转移到独立、平坦坚实且无杂物的睡眠空间，仰卧入睡；有特殊健康情况先问医生。",
      "Awake and supervised only; never force the head up. If sleepy, stop and place baby on their back in a separate, flat, firm, clear sleep space. Ask a clinician first about special health needs.",
    ),
    source: "tummy",
  },
  {
    id: "little-conversation",
    min: 0,
    max: 6,
    scene: "quiet",
    minutes: "1–2",
    title: words("你一句，我一句", "A little conversation"),
    focus: words("回应与连接", "Connection"),
    materials: words("你的声音", "Your voice"),
    steps: [
      words(
        "宝宝清醒、舒服时，面对面轻声说句话。",
        "When baby is awake and comfortable, speak softly face to face.",
      ),
      words(
        "回应宝宝的声音或表情，然后停一会儿；没有回应也没关系。",
        "Respond to a sound or expression, then pause. No response is needed.",
      ),
    ],
    safety: words(
      "抱稳并支撑头颈；转头、打哈欠或烦躁就休息。",
      "Support the head and neck when holding. Pause for turning away, yawning or fussing.",
    ),
    source: "cdc2",
  },
  {
    id: "care-song",
    min: 0,
    max: 12,
    scene: "care",
    minutes: "1–2",
    title: words("换衣服的小旁白", "Getting dressed together"),
    focus: words("熟悉日常声音", "Everyday language"),
    materials: words("日常衣物", "Everyday clothes"),
    steps: [
      words(
        "穿衣或换好尿布时，轻声说出你正在做的事。",
        "While dressing or finishing a diaper change, describe what you are doing.",
      ),
      words(
        "用短短一句小调重复，跟着宝宝的反应慢下来。",
        "Repeat a short gentle tune and slow down with baby's cues.",
      ),
    ],
    safety: words(
      "照护优先，不看手机；在高处换衣时始终用手护住宝宝。",
      "Care comes first: put the phone away and keep a hand on baby on raised surfaces.",
    ),
    source: "cdc2",
  },
  {
    id: "follow-face",
    min: 0,
    max: 6,
    scene: "floor",
    minutes: "1–2",
    title: words("看看我的脸", "Follow my face"),
    focus: words("一起注视", "Looking together"),
    materials: words("干净安全的地垫", "A clean, safe floor mat"),
    steps: [
      words(
        "宝宝清醒仰躺时，在能看到你的地方微笑。",
        "With baby awake on their back, smile where they can see you.",
      ),
      words(
        "慢慢挪动一点位置，等宝宝自己看过来，不要求追视。",
        "Move slightly and wait for baby to look, without asking them to track you.",
      ),
    ],
    safety: words(
      "全程陪伴，不强行转动宝宝的头；困了就结束并按安全睡眠方式安置。",
      "Stay with baby; never turn their head for them. End when sleepy and use their safe sleep space.",
    ),
    source: "tips",
  },
  {
    id: "picture-chat",
    min: 3,
    max: 24,
    scene: "quiet",
    minutes: "2–3",
    title: words("一页也算共读", "One page is enough"),
    focus: words("共同注意", "Shared attention"),
    materials: words("完整的布书或硬页书", "An intact cloth or board book"),
    steps: [
      words(
        "选一张宝宝感兴趣的图片，用一句话说说它。",
        "Choose a picture that interests your child and say something about it.",
      ),
      words(
        "让宝宝看、指或翻页，不提问考试，也不必读完。",
        "Let them look, point or turn the page. No quiz and no need to finish.",
      ),
    ],
    safety: words(
      "检查书页没有松脱小件，成人拿稳；不让宝宝撕咬吞下碎片。",
      "Check for loose parts and hold the book securely; prevent chewing off pieces.",
    ),
    source: "tips",
  },
  {
    id: "outside-sounds",
    min: 6,
    max: 24,
    scene: "outside",
    minutes: "1–3",
    title: words("听听外面的声音", "Listen outside"),
    focus: words("聆听与交流", "Listening together"),
    materials: words("一次平常的散步", "An ordinary walk"),
    steps: [
      words(
        "在安全处停下来，听一听鸟叫或树叶的声音。",
        "Stop somewhere safe and listen for birds or rustling leaves.",
      ),
      words(
        "说出你们听到的声音，留一点安静让宝宝回应。",
        "Name a sound, then leave a quiet moment for a response.",
      ),
    ],
    safety: words(
      "成人照护并看路；避开车流、强光和噪声，不戴耳机。",
      "Watch the path and supervise; avoid traffic, glare and loud noise. No headphones.",
    ),
    source: "unicef",
  },
  {
    id: "peekaboo",
    min: 6,
    max: 12,
    scene: "quiet",
    minutes: "1–2",
    title: words("躲在手后的笑脸", "A smile behind my hands"),
    focus: words("轮流与期待", "Taking turns"),
    materials: words("你的双手", "Your hands"),
    steps: [
      words(
        "用手短暂遮住自己的脸，再慢慢露出笑脸。",
        "Briefly cover your own face with your hands, then reveal a smile.",
      ),
      words(
        "等宝宝回应，喜欢才再玩一次。",
        "Wait for a response; repeat only if baby enjoys it.",
      ),
    ],
    safety: words(
      "不遮住宝宝口鼻，不突然大声吓宝宝。",
      "Never cover baby's face or startle them with a loud voice.",
    ),
    source: "cdc9",
  },
  {
    id: "in-and-out",
    min: 9,
    max: 24,
    scene: "floor",
    minutes: "2–3",
    title: words("放进去，拿出来", "In and out"),
    focus: words("动手探索", "Hands-on discovery"),
    materials: words(
      "无锐边容器、大块婴幼儿玩具",
      "A smooth container and large baby-safe toys",
    ),
    steps: [
      words(
        "宝宝能舒适坐稳时，在地垫上示范把玩具放进容器。",
        "When your child can sit comfortably, show a toy going into a container on the floor.",
      ),
      words(
        "让宝宝自己取放，成人陪着说“进去了”“出来了”。",
        "Let them take it out or put it in while you describe the action.",
      ),
    ],
    safety: words(
      "全程看护，只用不能吞咽且无松脱小件的玩具；不用豆子、硬币或磁铁。",
      "Supervise. Use toys too large to swallow, without loose parts; no beans, coins or magnets.",
    ),
    source: "cdc9",
  },
  {
    id: "after-bath",
    min: 12,
    max: 24,
    scene: "care",
    minutes: "1–2",
    title: words("洗完澡的小歌", "An after-bath song"),
    focus: words("日常词语", "Routine words"),
    materials: words("干毛巾和干净衣物", "A dry towel and clean clothes"),
    steps: [
      words(
        "离开浴盆、擦干保暖后，边穿衣边唱一句自己的小歌。",
        "After leaving the bath, drying and keeping warm, sing a little dressing song.",
      ),
      words(
        "说说正在穿哪件衣服，等宝宝用动作参与。",
        "Name the clothing and give your child time to join with a gesture.",
      ),
    ],
    safety: words(
      "只在洗澡结束后玩；水边不操作手机，也不让宝宝独处。",
      "Play only after the bath. Never use your phone by the water or leave your child alone.",
    ),
    source: "cdc12",
  },
  {
    id: "point-and-name",
    min: 12,
    max: 24,
    scene: "outside",
    minutes: "1–3",
    title: words("你指哪里，我说哪里", "You point, I name"),
    focus: words("回应兴趣", "Following their interest"),
    materials: words("身边看得到的东西", "Things you can see nearby"),
    steps: [
      words(
        "跟着宝宝的目光或手指，说出一个看到的东西。",
        "Follow your child's gaze or pointing and name something they notice.",
      ),
      words(
        "加一句简单描述，不要求跟读。",
        "Add a short description, without asking them to repeat it.",
      ),
    ],
    safety: words(
      "牵好或安全抱好宝宝；只看，不采摘或捡小物件入口。",
      "Hold your child safely; look without picking plants or small objects to mouth.",
    ),
    source: "cdc12",
  },
  {
    id: "choose-shirt",
    min: 18,
    max: 24,
    scene: "care",
    minutes: "1–2",
    title: words("今天穿哪一件？", "Which shirt today?"),
    focus: words("表达选择", "Making a choice"),
    materials: words("两件适合当天的衣服", "Two suitable shirts"),
    steps: [
      words(
        "拿出两件衣服，请宝宝选一件。",
        "Offer two shirts and invite your child to choose.",
      ),
      words(
        "接受目光、指认或说话的选择；不想选时就帮忙。",
        "Accept a look, point or word; help if they do not want to choose.",
      ),
    ],
    safety: words(
      "不是测试，不反复催促；先满足保暖与舒适。",
      "This is not a test. Do not keep prompting; comfort comes first.",
    ),
    source: "cdc18",
  },
  {
    id: "care-for-toy",
    min: 18,
    max: 24,
    scene: "floor",
    minutes: "2–3",
    title: words("照顾小玩偶", "Care for a toy"),
    focus: words("简单假装游戏", "Simple pretend play"),
    materials: words(
      "无松脱配件的适龄玩偶",
      "An age-suitable toy without loose parts",
    ),
    steps: [
      words(
        "和宝宝一起假装给玩偶擦擦手、道声晚安。",
        "Pretend to wipe a toy's hands or say goodnight together.",
      ),
      words(
        "跟随宝宝想出来的动作，不设定必须完成的故事。",
        "Follow their ideas rather than requiring a particular story.",
      ),
    ],
    safety: words(
      "不使用真食物或小配件；玩偶在玩耍后收好，不放入婴儿睡眠空间。",
      "Use no real food or tiny accessories. Put the toy away afterward, outside an infant's sleep space.",
    ),
    source: "cdc18",
  },
];

export function completedMonths(birthDate: string, now: Date): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate) || !Number.isFinite(now.getTime()))
    return null;
  const [y, m, d] = birthDate.split("-").map(Number);
  const birth = new Date(y, m - 1, d);
  if (
    birth.getFullYear() !== y ||
    birth.getMonth() !== m - 1 ||
    birth.getDate() !== d ||
    birth > now
  )
    return null;
  const anniversary = Math.min(
    d,
    new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(),
  );
  return (
    (now.getFullYear() - y) * 12 +
    now.getMonth() -
    (m - 1) -
    (now.getDate() < anniversary ? 1 : 0)
  );
}
export function activitiesForMonths(months: number): PlayActivity[] {
  return Number.isInteger(months) && months >= 0 && months < 24
    ? playActivities.filter((a) => months >= a.min && months < a.max)
    : [];
}
export function dailyActivities(months: number, now: Date): PlayActivity[] {
  const options = activitiesForMonths(months);
  if (!options.length || !Number.isFinite(now.getTime())) return [];
  const day = Math.floor(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000,
  );
  const first = ((day % options.length) + options.length) % options.length;
  const rotated = [...options.slice(first), ...options.slice(0, first)];
  const otherScene = rotated.slice(1).find((a) => a.scene !== rotated[0].scene);
  return [rotated[0], otherScene ?? rotated[1]].filter(
    (a): a is PlayActivity => !!a,
  );
}
export function parsePlayFavorites(raw: string | null): string[] {
  if (raw === null) return [];
  const value: unknown = JSON.parse(raw);
  if (!Array.isArray(value) || value.some((id) => typeof id !== "string"))
    throw new Error("Invalid play favorites");
  return [...new Set(value as string[])].filter((id) =>
    playActivities.some((a) => a.id === id),
  );
}

// Calendar days, not rolling 24-hour windows: check-ins reset at local midnight.
export function playDayKey(now: Date): string {
  if (!Number.isFinite(now.getTime())) throw new Error("Invalid play date");
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
export function playCheckinKey(day: string): string {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(day) ||
    playDayKey(new Date(`${day}T12:00:00`)) !== day
  )
    throw new Error("Invalid check-in day");
  return `play-checkins-${day}`;
}
