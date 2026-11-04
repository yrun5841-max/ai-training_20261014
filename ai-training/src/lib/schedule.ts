// 開催日・締め切り日のルール（SPEC.md 6章）
// - 開催日: 毎月第3金曜
// - 締め切り日: 開催日の1週間前（その日の 23:59 まで受け付ける）
// 日付はすべて日本時間（JST）の "YYYY-MM-DD" で扱う。

// 祝日などで日付を変えたい月だけ、ここで上書きする。
// 例: "2026-12": { eventDate: "2026-12-11", deadline: "2026-12-04" }
export type Overrides = Record<string, { eventDate: string; deadline: string }>;

const defaultOverrides: Overrides = {};

export type Round = {
  /** 開催月 "YYYY-MM" */
  key: string;
  eventDate: string;
  deadline: string;
  /** 締め切り日を過ぎていなければ true */
  isOpen: boolean;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

function toDateString(utcMs: number) {
  return new Date(utcMs).toISOString().slice(0, 10);
}

function jstToday(now: Date) {
  return toDateString(now.getTime() + JST_OFFSET_MS);
}

function roundOf(year: number, month: number, overrides: Overrides): Omit<Round, "isOpen"> {
  const key = `${year}-${String(month).padStart(2, "0")}`;
  const override = overrides[key];
  if (override) return { key, ...override };

  const firstDay = Date.UTC(year, month - 1, 1);
  const firstFriday = 1 + ((5 - new Date(firstDay).getUTCDay() + 7) % 7);
  const event = Date.UTC(year, month - 1, firstFriday + 14);
  return {
    key,
    eventDate: toDateString(event),
    deadline: toDateString(event - 7 * DAY_MS),
  };
}

/** 今の募集回。今月の開催日を過ぎていれば翌月の回を返す。 */
export function getCurrentRound(now = new Date(), overrides = defaultOverrides): Round {
  const today = jstToday(now);
  const [year, month] = today.split("-").map(Number);

  let round = roundOf(year, month, overrides);
  if (today > round.eventDate) {
    round = month === 12 ? roundOf(year + 1, 1, overrides) : roundOf(year, month + 1, overrides);
  }
  return { ...round, isOpen: today <= round.deadline };
}

/** "2026-11-20" → "11月20日（金）" */
export function formatDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  const weekday = "日月火水木金土"[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  return `${month}月${day}日（${weekday}）`;
}

/** "2026-11" → "11月" */
export function formatMonth(roundKey: string) {
  return `${Number(roundKey.slice(5))}月`;
}

/** 日本時間での今年 */
export function currentYear(now = new Date()) {
  return Number(jstToday(now).slice(0, 4));
}
