import { describe, expect, test } from "vitest";
import { groupSizes, groupWarnings, shuffle } from "./shuffle";
import type { Entry } from "./store";
import { dummyEntries, makeEntry, plantedEntries } from "./test-data";

const sorted = (sizes: number[]) => [...sizes].sort((a, b) => a - b);

const hasSameDepartment = (group: Entry[]) =>
  new Set(group.map((e) => e.department)).size < group.length;
const hasExisting = (group: Entry[]) => group.some((e) => e.category === "既存社員");
const allSameJoinYear = (group: Entry[]) => new Set(group.map((e) => e.joinYear)).size === 1;

/** グループ分けの並び順によらない比較用の文字列 */
const signature = (groups: Entry[][]) =>
  groups
    .map((g) => g.map((e) => e.id).sort().join(","))
    .sort()
    .join(" | ");

// SPEC 5.1
describe("groupSizes: グループの人数", () => {
  test.each([0, 1, 2])("A-1: %i人ならグループを作らない（開催しない）", (count) => {
    expect(groupSizes(count)).toEqual([]);
  });

  test.each([
    [3, [3]],
    [4, [4]],
    [5, [5]],
    [6, [3, 3]],
    [7, [3, 4]],
    [10, [3, 3, 4]],
    [11, [3, 4, 4]],
  ])("A-2〜A-8: %i人 → %j", (count, expected) => {
    expect(sorted(groupSizes(count))).toEqual(expected);
  });

  test("A-9: 6〜30人なら、全グループが3〜4人で、合計が申込者数と一致する", () => {
    for (let count = 6; count <= 30; count++) {
      const sizes = groupSizes(count);
      expect(sizes.every((s) => s === 3 || s === 4), `${count}人`).toBe(true);
      expect(sizes.reduce((a, b) => a + b, 0), `${count}人`).toBe(count);
    }
  });
});

// SPEC 5.2
describe("shuffle: グループ分け", () => {
  test("B-1, B-2: 全員がどこか1つのグループにだけ入り、人数は groupSizes と一致する", () => {
    for (let count = 3; count <= 30; count++) {
      const entries = plantedEntries(groupSizes(count), count);
      const groups = shuffle(entries);
      const ids = groups.flat().map((e) => e.id);
      expect(ids, `${count}人`).toHaveLength(count);
      expect(new Set(ids), `${count}人`).toEqual(new Set(entries.map((e) => e.id)));
      expect(sorted(groups.map((g) => g.length)), `${count}人`).toEqual(sorted(groupSizes(count)));
    }
  });

  test("B-3: 3人未満ならグループを作らない", () => {
    expect(shuffle(dummyEntries.slice(0, 2))).toEqual([]);
    expect(shuffle([])).toEqual([]);
  });

  test("B-4〜B-7: ダミーの10人は、何度実行しても条件をすべて満たす", () => {
    for (let run = 0; run < 200; run++) {
      const groups = shuffle(dummyEntries);
      expect(sorted(groups.map((g) => g.length))).toEqual([3, 3, 4]);
      for (const group of groups) {
        expect(hasSameDepartment(group), signature(groups)).toBe(false);
        expect(hasExisting(group), signature(groups)).toBe(true);
        expect(allSameJoinYear(group), signature(groups)).toBe(false);
      }
    }
  });

  test("B-4〜B-7: 条件を満たせる組み合わせがあれば、人数によらず必ず見つける", () => {
    for (let count = 3; count <= 30; count++) {
      for (let seed = 0; seed < 20; seed++) {
        const entries = plantedEntries(groupSizes(count), count * 100 + seed);
        const groups = shuffle(entries);
        for (const group of groups) {
          expect(groupWarnings(group), `${count}人 seed=${seed}: ${signature(groups)}`).toEqual([]);
        }
      }
    }
  });

  test("B-8: 既存社員を全グループに入れられなくても、部署は分ける", () => {
    // 3グループに対して既存社員が1人だけ
    const entries = [
      makeEntry("A", "[部署A]", 2026, "新入社員"),
      makeEntry("B", "[部署B]", 2023, "異動者"),
      makeEntry("C", "[部署C]", 2009, "既存社員"),
      makeEntry("D", "[部署A]", 2025, "新入社員"),
      makeEntry("E", "[部署B]", 2024, "新入社員"),
      makeEntry("F", "[部署C]", 2019, "異動者"),
      makeEntry("G", "[部署A]", 2026, "新入社員"),
      makeEntry("H", "[部署B]", 2018, "異動者"),
      makeEntry("I", "[部署C]", 2026, "新入社員"),
    ];
    for (let run = 0; run < 50; run++) {
      const groups = shuffle(entries);
      for (const group of groups) {
        expect(hasSameDepartment(group), signature(groups)).toBe(false);
        expect(allSameJoinYear(group), signature(groups)).toBe(false);
      }
      expect(groups.filter(hasExisting)).toHaveLength(1);
    }
  });

  test("B-8: 部署を分けきれなくても、既存社員は全グループに入れ、部署の重複は最小にする", () => {
    // 2グループに対して [部署A] が3人いるので、1グループは必ず重複する
    const entries = [
      makeEntry("A", "[部署A]", 2026, "既存社員"),
      makeEntry("B", "[部署A]", 2010, "新入社員"),
      makeEntry("C", "[部署A]", 2015, "既存社員"),
      makeEntry("D", "[部署B]", 2026, "新入社員"),
      makeEntry("E", "[部署C]", 2020, "異動者"),
      makeEntry("F", "[部署D]", 2026, "新入社員"),
    ];
    for (let run = 0; run < 50; run++) {
      const groups = shuffle(entries);
      expect(groups.filter(hasSameDepartment), signature(groups)).toHaveLength(1);
      expect(groups.every(hasExisting), signature(groups)).toBe(true);
      expect(groups.some(allSameJoinYear), signature(groups)).toBe(false);
    }
  });

  test("B-9: 既存社員がいなくても、グループ分けはする", () => {
    const entries = dummyEntries.map((e) => ({ ...e, category: "新入社員" as const }));
    const groups = shuffle(entries);
    expect(sorted(groups.map((g) => g.length))).toEqual([3, 3, 4]);
    expect(groups.some(hasSameDepartment)).toBe(false);
  });

  test("B-10: 再実行すると、別の組み合わせになることがある", () => {
    const results = new Set(Array.from({ length: 30 }, () => signature(shuffle(dummyEntries))));
    expect(results.size).toBeGreaterThan(1);
  });
});

// SPEC 5.3
describe("groupWarnings: 警告", () => {
  test("C-1: 条件をすべて満たすグループには警告を出さない", () => {
    const [a, b, c] = [dummyEntries[0], dummyEntries[1], dummyEntries[2]]; // A, B, C
    expect(groupWarnings([a, b, c])).toEqual([]);
  });

  test("C-2: 同じ部署の人がいると、部署名つきで警告する", () => {
    const group = [
      makeEntry("E", "[部署D]", 2026, "新入社員"),
      makeEntry("H", "[部署D]", 2025, "新入社員"),
      makeEntry("I", "[部署A]", 2004, "既存社員"),
    ];
    expect(groupWarnings(group)).toEqual(["同じ部署の人がいます（[部署D]）"]);
  });

  test("C-3: 既存社員がいないと警告する", () => {
    const group = [
      makeEntry("A", "[部署A]", 2026, "新入社員"),
      makeEntry("B", "[部署B]", 2023, "異動者"),
      makeEntry("E", "[部署D]", 2026, "新入社員"),
    ];
    expect(groupWarnings(group)).toEqual(["既存社員がいません"]);
  });

  test("C-4: 全員の入社年が同じなら警告する", () => {
    const group = [
      makeEntry("A", "[部署A]", 2026, "新入社員"),
      makeEntry("D", "[部署B]", 2026, "新入社員"),
      makeEntry("X", "[部署C]", 2026, "既存社員"),
    ];
    expect(groupWarnings(group)).toEqual(["全員の入社年が同じです"]);
  });

  test("C-4: 入社年が同じ人が一部だけなら警告しない", () => {
    const group = [
      makeEntry("A", "[部署A]", 2026, "新入社員"),
      makeEntry("D", "[部署B]", 2026, "新入社員"),
      makeEntry("C", "[部署C]", 2009, "既存社員"),
    ];
    expect(groupWarnings(group)).toEqual([]);
  });

  test("C-5: 当てはまる警告はすべて出す", () => {
    const group = [
      makeEntry("A", "[部署A]", 2026, "新入社員"),
      makeEntry("D", "[部署A]", 2026, "新入社員"),
      makeEntry("H", "[部署B]", 2026, "異動者"),
    ];
    expect(groupWarnings(group)).toEqual([
      "同じ部署の人がいます（[部署A]）",
      "既存社員がいません",
      "全員の入社年が同じです",
    ]);
  });
});
