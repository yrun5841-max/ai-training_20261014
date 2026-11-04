"use client";

import { useActionState } from "react";
import { apply, type ApplyState } from "./actions";

const inputClass =
  "min-h-12 w-full rounded-[10px] border border-zinc-300 bg-surface px-3.5 text-base outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 dark:border-zinc-700";

const labelClass = "font-bold";

export function ApplyForm({
  departments,
  categories,
  thisYear,
}: {
  departments: readonly string[];
  categories: readonly string[];
  thisYear: number;
}) {
  const [state, formAction, pending] = useActionState<ApplyState, FormData>(apply, {});
  const years = Array.from({ length: thisYear - 1980 + 1 }, (_, i) => thisYear - i);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className={labelClass}>
          名前
        </label>
        <input
          id="name"
          name="name"
          required
          maxLength={30}
          autoComplete="name"
          placeholder="例: 山田 花子"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="department" className={labelClass}>
            部署
          </label>
          <select id="department" name="department" required defaultValue="" className={inputClass}>
            <option value="" disabled>
              選んでください
            </option>
            {departments.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="joinYear" className={labelClass}>
            入社年
          </label>
          <select id="joinYear" name="joinYear" required defaultValue={thisYear} className={inputClass}>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}年
              </option>
            ))}
          </select>
        </div>
      </div>

      <fieldset className="flex flex-col gap-1.5">
        <legend className={`${labelClass} mb-1.5`}>区分</legend>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {categories.map((c) => (
            <label
              key={c}
              className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-zinc-300 px-2 text-sm font-medium transition-colors has-[:checked]:border-2 has-[:checked]:border-accent has-[:checked]:bg-accent/10 has-[:checked]:text-accent-ink has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent/40 sm:text-base dark:border-zinc-700"
            >
              <input
                type="radio"
                name="category"
                value={c}
                required
                className="size-4 shrink-0 accent-[var(--accent)]"
              />
              {c}
            </label>
          ))}
        </div>
      </fieldset>

      {state.error && (
        <p role="alert" className="rounded-[10px] bg-primary/10 px-4 py-2.5 text-sm font-medium text-primary-ink">
          {state.error}
        </p>
      )}

      <button
        disabled={pending}
        className="min-h-13 rounded-[10px] bg-accent-ink text-lg font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:text-zinc-950"
      >
        {pending ? "送信中…" : "参加する！"}
      </button>
    </form>
  );
}
