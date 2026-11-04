import { categories, departments, type Category } from "./store";

// 申し込み内容のチェック（SPEC.md 4.1）

export type Application = {
  name: string;
  department: string;
  joinYear: number;
  category: Category;
};

export type ValidationResult = { ok: true; value: Application } | { ok: false; error: string };

const MAX_NAME_LENGTH = 30;
const MIN_JOIN_YEAR = 1970;

export function validateApplication(formData: FormData, thisYear: number): ValidationResult {
  const name = String(formData.get("name") ?? "").trim();
  const department = String(formData.get("department") ?? "");
  const joinYearText = String(formData.get("joinYear") ?? "");
  const joinYear = Number(joinYearText);
  const category = String(formData.get("category") ?? "");

  if (!name || name.length > MAX_NAME_LENGTH) {
    return { ok: false, error: `名前を${MAX_NAME_LENGTH}文字以内で入力してください` };
  }
  if (!(departments as readonly string[]).includes(department)) {
    return { ok: false, error: "部署を選んでください" };
  }
  if (!/^\d+$/.test(joinYearText) || joinYear < MIN_JOIN_YEAR || joinYear > thisYear) {
    return { ok: false, error: "入社年を選んでください" };
  }
  if (!(categories as readonly string[]).includes(category)) {
    return { ok: false, error: "区分を選んでください" };
  }
  return { ok: true, value: { name, department, joinYear, category: category as Category } };
}
