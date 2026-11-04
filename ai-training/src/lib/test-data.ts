// テストで使うダミーデータ（画面設計 Artifact の申込者一覧と同じ10人）
import type { Category, Entry } from "./store";

export function makeEntry(
  id: string,
  department: string,
  joinYear: number,
  category: Category,
): Entry {
  return {
    id,
    token: `token-${id}`,
    name: `社員${id}`,
    department,
    joinYear,
    category,
    createdAt: "2026-11-01T00:00:00Z",
  };
}

export const dummyEntries: Entry[] = [
  makeEntry("A", "[部署A]", 2026, "新入社員"),
  makeEntry("B", "[部署B]", 2023, "異動者"),
  makeEntry("C", "[部署C]", 2009, "既存社員"),
  makeEntry("D", "[部署B]", 2026, "新入社員"),
  makeEntry("E", "[部署D]", 2026, "新入社員"),
  makeEntry("F", "[部署A]", 2019, "異動者"),
  makeEntry("G", "[部署D]", 2012, "既存社員"),
  makeEntry("H", "[部署D]", 2026, "新入社員"),
  makeEntry("I", "[部署A]", 2004, "既存社員"),
  makeEntry("J", "[部署B]", 2016, "既存社員"),
];

/** 再現できる乱数（テストデータを作るためだけに使う） */
export function seededRandom(seed: number) {
  let t = seed;
  return () => {
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 条件をすべて満たすグループ分けを先に作り、並びを崩した申込者を返す。
 * shuffle() はここから条件を満たすグループ分けを必ず見つけられるはず。
 */
export function plantedEntries(sizes: number[], seed: number): Entry[] {
  const random = seededRandom(seed);
  const pick = <T,>(items: T[]) => items[Math.floor(random() * items.length)];
  const departmentPool = Array.from({ length: 6 }, (_, i) => `[部署${"ABCDEF"[i]}]`);
  const years = [2004, 2009, 2012, 2016, 2019, 2023, 2026];

  const entries: Entry[] = [];
  sizes.forEach((size, g) => {
    // 部署は全員ちがう・1人目は既存社員・1人目と2人目は入社年がちがう
    const departments = [...departmentPool].sort(() => random() - 0.5).slice(0, size);
    const firstYear = pick(years);
    departments.forEach((department, i) => {
      const category: Category = i === 0 ? "既存社員" : pick(["新入社員", "異動者", "既存社員"]);
      const joinYear =
        i === 0 ? firstYear : i === 1 ? pick(years.filter((y) => y !== firstYear)) : pick(years);
      entries.push(makeEntry(`${g}-${i}`, department, joinYear, category));
    });
  });
  return entries.sort(() => random() - 0.5);
}
