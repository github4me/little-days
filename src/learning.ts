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
  { min: 0, max: 1, label: "0–1" },
  { min: 1, max: 2, label: "1–2" },
  { min: 2, max: 3, label: "2–3" },
  ...Array.from({ length: 11 }, (_, i) => ({
    min: 3 + i * 2,
    max: 5 + i * 2,
    label: `${3 + i * 2}–${5 + i * 2}`,
  })),
] as const;
export const learningSources = {
  touch: {
    label: "NHS · Infant massage",
    url: "https://www.cuh.nhs.uk/patient-information/infant-massage/",
  },
  cdc4: {
    label: "CDC · 4 months",
    url: "https://www.cdc.gov/act-early/milestones/4-months.html",
  },
  cdc6: {
    label: "CDC · 6 months",
    url: "https://www.cdc.gov/act-early/milestones/6-months.html",
  },
  cdc15: {
    label: "CDC · 15 months",
    url: "https://www.cdc.gov/act-early/milestones/15-months.html",
  },
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
    id: "gentle-touch",
    min: 0,
    max: 12,
    scene: "quiet",
    minutes: "1–2",
    title: words("轻柔抚触", "Gentle touch"),
    focus: words("安稳陪伴", "Comfort and connection"),
    materials: words("温暖、干净的双手", "Warm, clean hands"),
    steps: [
      words(
        "宝宝清醒安稳时，在安全平面上，先轻轻触碰手或脚，观察是否愿意。",
        "With baby awake and settled on a safe surface, gently touch a hand or foot and watch their response.",
      ),
      words(
        "愿意时用手轻柔抚摸手臂或腿，配合轻声说话；随时可以结束。",
        "If welcomed, gently stroke an arm or leg while talking softly. Finish whenever needed.",
      ),
    ],
    safety: words(
      "不按压腹部、不拉伸关节，也不作为排气治疗；哭闹、躲避或皮肤不适就停。早产、患病或有医疗需要时先问照护团队。",
      "Do not press the tummy, stretch joints or use this as gas treatment. Stop for distress, withdrawal or skin irritation. Ask the care team first for prematurity, illness or medical needs.",
    ),
    source: "touch",
  },
  {
    id: "rattle-listen",
    min: 4,
    max: 12,
    scene: "quiet",
    minutes: "1–2",
    title: words("听听小摇铃", "A gentle rattle"),
    focus: words("听、看与抓握", "Listening and grasping"),
    materials: words(
      "完整、适龄、易握的婴儿摇铃",
      "An intact, age-suitable, easy-grip rattle",
    ),
    steps: [
      words(
        "把摇铃放在宝宝看得见的位置，轻摇一下，再停下来。",
        "Show the rattle, give it a gentle shake, then pause.",
      ),
      words(
        "等宝宝回应或自己伸手，不强行转头或抓握。",
        "Wait for a response or reach; do not force their head or hands.",
      ),
    ],
    safety: words(
      "成人看护；不用散装铃铛或小零件，不贴耳摇响，惊吓或烦躁就停。",
      "Supervise. No loose bells or small parts; keep sound away from ears. Stop if startled or upset.",
    ),
    source: "cdc4",
  },
  {
    id: "kick-play",
    min: 4,
    max: 9,
    scene: "floor",
    minutes: "1–3",
    title: words("小脚自由踢", "Little kicks"),
    focus: words("自主探索", "Free movement"),
    materials: words(
      "地垫；可选适龄脚踏琴",
      "A floor mat; an age-suitable kick piano is optional",
    ),
    steps: [
      words(
        "清醒时仰卧在地垫上，留出腿部活动空间。",
        "While awake, lie baby on their back on a mat with space for their legs.",
      ),
      words(
        "让宝宝自己踢动；有脚踏玩具时按说明放好，不抓着脚踩。",
        "Let baby kick freely. Position any kick toy as directed; never move their feet for them.",
      ),
    ],
    safety: words(
      "成人陪伴，音量轻柔；无绳带或松脱零件，困倦就结束并移至安全睡眠处。",
      "Supervise; keep sound gentle. No cords or loose parts. End when sleepy and move to a safe sleep space.",
    ),
    source: "cdc4",
  },
  {
    id: "mirror-play",
    min: 6,
    max: 18,
    scene: "quiet",
    minutes: "1–2",
    title: words("镜子里的笑脸", "Mirror smiles"),
    focus: words("一起注视与回应", "Looking and responding together"),
    materials: words(
      "适龄、不易碎、无锐边的婴儿镜",
      "An age-suitable, shatter-resistant baby mirror with smooth edges",
    ),
    steps: [
      words(
        "抱稳宝宝，或让宝宝清醒躺在地垫上，把婴儿镜稳稳放在看得到的位置。",
        "Support baby securely or let them lie awake on a mat, with the baby mirror held securely in view.",
      ),
      words(
        "指指镜中笑脸，叫宝宝的名字，停下来等回应。",
        "Point to the smiling face, say baby's name, and pause for a response.",
      ),
    ],
    safety: words(
      "不用玻璃镜或手机屏幕，不强迫坐立；成人全程看护，宝宝转开视线就休息。",
      "No glass mirrors or phone screens; do not force sitting. Supervise throughout and pause when baby turns away.",
    ),
    source: "cdc6",
  },
  {
    id: "gentle-song",
    min: 0,
    max: 25,
    scene: "quiet",
    minutes: "1–2",
    title: words("轻声唱一小段", "A gentle song"),
    focus: words("熟悉声音与陪伴", "A familiar voice"),
    materials: words("你的声音，不用播放器", "Your voice, no player needed"),
    steps: [
      words(
        "清醒安稳时，唱一小段熟悉的歌。",
        "Sing a short familiar song while your child is awake and settled.",
      ),
      words(
        "留些停顿，跟随宝宝的反应，不需要唱完。",
        "Pause and follow their response; no need to finish the song.",
      ),
    ],
    safety: words(
      "声音轻柔、不贴耳唱；困倦或烦躁就停。",
      "Keep your voice gentle and away from the ears. Stop for tiredness or fussing.",
    ),
    source: "cdc2",
  },
  {
    id: "reach-toy",
    min: 4,
    max: 12,
    scene: "floor",
    minutes: "1–3",
    title: words("伸手碰一碰", "Reach for a toy"),
    focus: words("自主伸手", "Reaching"),
    materials: words(
      "完整、易握的适龄玩具",
      "An intact, easy-grip, age-suitable toy",
    ),
    steps: [
      words(
        "宝宝清醒躺在地垫上时，把玩具拿在容易够到的位置。",
        "With baby awake on a floor mat, hold a toy within easy reach.",
      ),
      words(
        "等宝宝自己伸手，左右都留机会，不拉着手完成。",
        "Wait for their reach. Offer both sides without moving their hands for them.",
      ),
    ],
    safety: words(
      "玩具不能有小零件、长绳或锐边；成人全程陪伴。",
      "Avoid loose parts, long cords and sharp edges. Supervise throughout.",
    ),
    source: "cdc4",
  },
  {
    id: "texture-touch",
    min: 4,
    max: 12,
    scene: "quiet",
    minutes: "1–2",
    title: words("摸摸不同的布", "Feel two textures"),
    focus: words("触觉探索", "Exploring touch"),
    materials: words(
      "两块干净、完整、不掉毛的布",
      "Two clean, intact, non-shedding fabrics",
    ),
    steps: [
      words(
        "成人拿稳布料，让宝宝用手碰一碰。",
        "Hold the fabrics securely for baby to touch.",
      ),
      words(
        "简单说说感觉，例如“柔软的”，不要求分辨。",
        "Name a feeling, such as soft, without asking them to identify it.",
      ),
    ],
    safety: words(
      "不盖脸、不放入口中，不用散线或小布片。",
      "Keep fabrics away from the face and mouth; no loose threads or tiny scraps.",
    ),
    source: "unicef",
  },
  {
    id: "floor-reach",
    min: 6,
    max: 10,
    scene: "floor",
    minutes: "1–3",
    title: words("转身找玩具", "Turn toward a toy"),
    focus: words("自由活动", "Free movement"),
    materials: words("安全地垫和适龄玩具", "A safe mat and age-suitable toy"),
    steps: [
      words(
        "宝宝清醒时，在地垫上把玩具放在身旁稍远处。",
        "While baby is awake on a floor mat, place a toy a little to one side.",
      ),
      words(
        "让宝宝尝试伸手或转身，够不到就移近些。",
        "Let them try reaching or turning; move it closer if needed.",
      ),
    ],
    safety: words(
      "不推拉身体强迫翻身；离开床、台阶和家具边缘，全程看护。",
      "Never force a roll. Stay on the floor, away from steps and furniture edges, and supervise.",
    ),
    source: "cdc6",
  },
  {
    id: "copy-actions",
    min: 9,
    max: 18,
    scene: "quiet",
    minutes: "1–2",
    title: words("你做，我学", "You lead, I copy"),
    focus: words("来回互动", "Taking turns"),
    materials: words("面对面的空间", "Space to face each other"),
    steps: [
      words(
        "观察宝宝的安全动作，例如张手或拍手，跟着模仿。",
        "Copy a safe movement, such as opening hands or clapping.",
      ),
      words(
        "停下来看看宝宝想做什么，让宝宝带领。",
        "Pause to see what they do next and let them lead.",
      ),
    ],
    safety: words(
      "不模仿拍头、摔倒等危险动作，不要求宝宝跟做。",
      "Do not copy head-hitting or other unsafe actions. Do not demand imitation.",
    ),
    source: "unicef",
  },
  {
    id: "find-toy",
    min: 12,
    max: 25,
    scene: "floor",
    minutes: "1–3",
    title: words("玩具在哪里", "Where is the toy?"),
    focus: words("一起寻找", "Finding together"),
    materials: words(
      "大块适龄玩具和一块完整布",
      "A large age-suitable toy and an intact cloth",
    ),
    steps: [
      words(
        "当着宝宝的面，用布盖住玩具的一部分。",
        "Let your child watch as you partly cover a toy.",
      ),
      words(
        "邀请一起找，必要时揭开一点，不考记忆。",
        "Look together and uncover more if needed; this is not a memory test.",
      ),
    ],
    safety: words(
      "只盖玩具，不盖宝宝；成人看护，结束后收走布料。",
      "Cover only the toy, never your child. Supervise and put the cloth away afterward.",
    ),
    source: "unicef",
  },
  {
    id: "big-blocks",
    min: 12,
    max: 25,
    scene: "floor",
    minutes: "2–3",
    title: words("叠一叠大积木", "Stack large blocks"),
    focus: words("动手尝试", "Trying things out"),
    materials: words(
      "无松脱件的大块适龄积木",
      "Large age-suitable blocks without loose parts",
    ),
    steps: [
      words(
        "在地垫上示范把一块放到另一块上。",
        "On the floor, show one block going on another.",
      ),
      words(
        "让宝宝尝试，倒了也可以一起重新摆。",
        "Let your child try and rebuild together if it falls.",
      ),
    ],
    safety: words(
      "不用小积木或磁力零件，不追求叠高。",
      "No small blocks or magnetic parts; keep stacks low.",
    ),
    source: "cdc12",
  },
  {
    id: "sock-basket",
    min: 15,
    max: 25,
    scene: "care",
    minutes: "1–3",
    title: words("袜子放进篮子", "Socks in the basket"),
    focus: words("参与家务", "Helping together"),
    materials: words(
      "干净袜子和稳固空篮子",
      "Clean socks and a stable empty basket",
    ),
    steps: [
      words(
        "拿一只袜子，示范放进地上的篮子。",
        "Show a sock going into a basket on the floor.",
      ),
      words(
        "邀请宝宝帮忙，想停就停。",
        "Invite your child to help and stop when they wish.",
      ),
    ],
    safety: words(
      "篮子无锐边，远离洗衣机、清洁剂与塑料袋。",
      "Use smooth edges and stay away from appliances, detergents and plastic bags.",
    ),
    source: "cdc15",
  },
  {
    id: "action-song",
    min: 15,
    max: 25,
    scene: "quiet",
    minutes: "1–3",
    title: words("儿歌配个动作", "Sing with gestures"),
    focus: words("动作与语言", "Movement and words"),
    materials: words("一首熟悉的短儿歌", "A familiar short song"),
    steps: [
      words(
        "边唱边做一个简单动作，例如张开手。",
        "Sing while making one simple gesture, such as opening your hands.",
      ),
      words(
        "留时间让宝宝参与，只听也可以。",
        "Allow time to join in; listening is fine too.",
      ),
    ],
    safety: words(
      "坐稳或站稳，不拉手臂，不需要跳跃。",
      "Sit or stand securely; do not pull arms or require jumping.",
    ),
    source: "cdc15",
  },
  {
    id: "roll-ball",
    min: 18,
    max: 25,
    scene: "floor",
    minutes: "2–3",
    title: words("把球滚给你", "Roll a ball together"),
    focus: words("轮流玩耍", "Taking turns"),
    materials: words(
      "不能吞咽的柔软大球",
      "A large soft ball that cannot be swallowed",
    ),
    steps: [
      words(
        "在空旷地面坐好，把球轻轻滚向宝宝。",
        "Sit on a clear floor and gently roll the ball to your child.",
      ),
      words(
        "等宝宝用自己的方式回应。",
        "Wait for them to respond in their own way.",
      ),
    ],
    safety: words(
      "不用气球、小球或破损球；远离楼梯，全程陪伴。",
      "No balloons, small or damaged balls. Stay away from stairs and supervise.",
    ),
    source: "cdc18",
  },
  {
    id: "name-body",
    min: 18,
    max: 25,
    scene: "care",
    minutes: "1–2",
    title: words("我的鼻子在哪里", "Here is my nose"),
    focus: words("认识身体词语", "Body words"),
    materials: words("你的示范", "Your example"),
    steps: [
      words(
        "穿衣时指指自己的鼻子或脚，说出名称。",
        "While dressing, point to your own nose or foot and name it.",
      ),
      words(
        "让宝宝自愿指一指，不要求答对。",
        "Invite a point if they want to; there is no right-answer test.",
      ),
    ],
    safety: words(
      "不戳眼睛，不拉扯宝宝身体。",
      "Do not poke eyes or pull your child's body.",
    ),
    source: "cdc18",
  },
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
    max: 25,
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
    max: 25,
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
    max: 25,
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
    max: 25,
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
    max: 25,
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
    max: 25,
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
    max: 25,
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
  return Number.isInteger(months) && months >= 0 && months < 25
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

export type PlaySelection = { included: string[]; excluded: string[] };
export function parsePlaySelection(raw: string | null): PlaySelection {
  if (raw === null) return { included: [], excluded: [] };
  const value: unknown = JSON.parse(raw);
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.keys(value).some((k) => k !== "included" && k !== "excluded")
  )
    throw new Error("Invalid activity selection");
  const v = value as Record<string, unknown>;
  if (!Array.isArray(v.included) || !Array.isArray(v.excluded))
    throw new Error("Invalid activity selection");
  const included = parsePlayFavorites(JSON.stringify(v.included));
  const excluded = parsePlayFavorites(JSON.stringify(v.excluded));
  if (included.some((id) => excluded.includes(id)))
    throw new Error("Conflicting activity selection");
  return { included, excluded };
}
export function selectedPlayIds(
  months: number | null,
  selection: PlaySelection,
): string[] {
  const defaults =
    months === null ? [] : activitiesForMonths(months).map((a) => a.id);
  return playActivities
    .filter(
      (a) =>
        !selection.excluded.includes(a.id) &&
        (defaults.includes(a.id) || selection.included.includes(a.id)),
    )
    .map((a) => a.id);
}
export function changePlaySelection(
  selection: PlaySelection,
  id: string,
  selected: boolean,
): PlaySelection {
  if (!playActivities.some((a) => a.id === id))
    throw new Error("Unknown activity");
  return {
    included: [
      ...selection.included.filter((v) => v !== id),
      ...(selected ? [id] : []),
    ],
    excluded: [
      ...selection.excluded.filter((v) => v !== id),
      ...(selected ? [] : [id]),
    ],
  };
}
export function activitiesForBand(min: number): PlayActivity[] {
  const band = ageBands.find((b) => b.min === min);
  return band
    ? playActivities.filter((a) => a.min < band.max && a.max > band.min)
    : [];
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
