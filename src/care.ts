import { words } from "./learning";

export const careOptions = [
  {
    id: "temperature",
    icon: "♨",
    label: words("体温", "Temp"),
    hint: words(
      "有需要时测量，不要求每日测温。记录原始读数，不按测量部位自行加减。",
      "Measure when needed, not as a daily target. Record the reading without adding or subtracting for the measurement site.",
    ),
    url: "https://www.healthdirect.gov.au/types-of-thermometer",
  },
  {
    id: "bath",
    icon: "≈",
    label: words("洗澡", "Bath"),
    hint: words(
      "不必每天洗澡。提前备好用品，成人全程看护；水边不操作手机。",
      "A bath is not needed every day. Prepare supplies first, supervise continuously and keep the phone away from water.",
    ),
    url: "https://www.nhs.uk/baby/caring-for-a-newborn/washing-and-bathing-your-baby/",
  },
  {
    id: "wash",
    icon: "☀",
    label: words("清洁", "Wash"),
    hint: words(
      "按需要轻柔清洁脸、颈部、手和皮肤褶皱，并轻轻擦干。",
      "Gently clean the face, neck, hands and skin folds as needed, then pat dry.",
    ),
    url: "https://www.nhs.uk/baby/caring-for-a-newborn/washing-and-bathing-your-baby/",
  },
  {
    id: "oral",
    icon: "◇",
    label: words("口腔", "Teeth"),
    hint: words(
      "第一颗牙萌出后开始刷牙；牙刷和牙膏选择遵循当地儿童牙医建议。请记录实际完成的一次照护。",
      "Start brushing when the first tooth appears. Follow local dental advice on toothbrushes and toothpaste. Record each actual care session.",
    ),
    url: "https://www.nhs.uk/baby/babys-development/teething/looking-after-your-babys-teeth/",
  },
  {
    id: "nails",
    icon: "✂",
    label: words("指甲", "Nails"),
    hint: words(
      "按需要记录指甲护理，不是每日任务。由成人使用婴儿适用工具，宝宝挣动时暂停。",
      "Record nail care as needed, not as a daily task. An adult should use baby-suitable tools and pause if baby wriggles.",
    ),
    url: "https://www.nhs.uk/baby/caring-for-a-newborn/washing-and-bathing-your-baby/",
  },
] as const;
export const temperatureMethods = [
  { id: "armpit", label: words("腋下", "Armpit") },
  { id: "ear", label: words("耳温", "Ear") },
  { id: "forehead", label: words("额温", "Forehead") },
  { id: "rectal", label: words("肛温", "Rectal") },
  { id: "other", label: words("其他", "Other") },
] as const;

export function careTime(
  date: string,
  time: string,
  now: number,
  birthDate: string,
): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time))
    throw new Error("time");
  const d = new Date(`${date}T${time}:00`);
  const [y, m, day] = date.split("-").map(Number);
  const [h, minute] = time.split(":").map(Number);
  if (
    !Number.isFinite(d.getTime()) ||
    d.getFullYear() !== y ||
    d.getMonth() !== m - 1 ||
    d.getDate() !== day ||
    d.getHours() !== h ||
    d.getMinutes() !== minute ||
    d.getTime() > now ||
    (birthDate && date < birthDate)
  )
    throw new Error("time");
  return d.toISOString();
}
