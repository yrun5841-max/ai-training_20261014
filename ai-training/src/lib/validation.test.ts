import { describe, expect, test } from "vitest";
import { validateApplication } from "./validation";
import { departments } from "./store";

const thisYear = 2026;

const form = (fields: Partial<Record<"name" | "department" | "joinYear" | "category", string>>) => {
  const data = new FormData();
  const filled = { name: "社員A", department: departments[0], joinYear: "2026", category: "新入社員", ...fields };
  for (const [key, value] of Object.entries(filled)) data.set(key, value);
  return data;
};

// SPEC 4.1
describe("validateApplication: 申し込み内容のチェック", () => {
  test("正しい入力なら、申し込み内容を返す", () => {
    expect(validateApplication(form({}), thisYear)).toEqual({
      ok: true,
      value: { name: "社員A", department: departments[0], joinYear: 2026, category: "新入社員" },
    });
  });

  test.each(["name", "department", "joinYear", "category"] as const)(
    "E-1: %s が空なら受け付けない",
    (field) => {
      expect(validateApplication(form({ [field]: "" }), thisYear).ok).toBe(false);

      const missing = form({});
      missing.delete(field);
      expect(validateApplication(missing, thisYear).ok).toBe(false);
    },
  );

  test("E-2: 名前の前後の空白は取り除く", () => {
    const result = validateApplication(form({ name: "　 社員A  " }), thisYear);
    expect(result.ok && result.value.name).toBe("社員A");
  });

  test("E-2: 空白だけの名前は受け付けない", () => {
    expect(validateApplication(form({ name: " 　 " }), thisYear).ok).toBe(false);
  });

  test("E-3: 一覧にない部署は受け付けない", () => {
    expect(validateApplication(form({ department: "[部署A]" }), thisYear).ok).toBe(false);
  });

  test.each(["新入社員", "異動者", "既存社員"])("E-4: 区分「%s」は受け付ける", (category) => {
    expect(validateApplication(form({ category }), thisYear).ok).toBe(true);
  });

  test.each(["異動してきた", "管理者"])("E-4: 区分「%s」は受け付けない", (category) => {
    expect(validateApplication(form({ category }), thisYear).ok).toBe(false);
  });

  test("E-5: 来年以降の入社年は受け付けない", () => {
    expect(validateApplication(form({ joinYear: "2026" }), thisYear).ok).toBe(true);
    expect(validateApplication(form({ joinYear: "2027" }), thisYear).ok).toBe(false);
  });

  test("E-6: 名前は30文字まで受け付け、31文字は受け付けない", () => {
    expect(validateApplication(form({ name: "あ".repeat(30) }), thisYear).ok).toBe(true);
    expect(validateApplication(form({ name: "あ".repeat(31) }), thisYear).ok).toBe(false);
  });

  test("E-7: 入社年は1970年から受け付け、1969年は受け付けない", () => {
    expect(validateApplication(form({ joinYear: "1970" }), thisYear).ok).toBe(true);
    expect(validateApplication(form({ joinYear: "1969" }), thisYear).ok).toBe(false);
  });

  test("E-7: 入社年が整数でなければ受け付けない", () => {
    expect(validateApplication(form({ joinYear: "2020.5" }), thisYear).ok).toBe(false);
    expect(validateApplication(form({ joinYear: "abc" }), thisYear).ok).toBe(false);
  });
});
