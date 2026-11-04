import { Suspense } from "react";
import { io } from "next/cache";
import { CategoryBadge } from "../category-badge";
import { formatDate, formatMonth, getCurrentRound } from "@/lib/schedule";
import { groupSizes } from "@/lib/shuffle";
import { categories, getRound, type Entry } from "@/lib/store";

export default function EntriesPage() {
  return (
    <Suspense fallback={<p className="text-muted">読み込み中…</p>}>
      <Entries />
    </Suspense>
  );
}

function planMessage(entries: Entry[]) {
  const sizes = groupSizes(entries.length);
  if (sizes.length === 0) return "申込者が3人未満のため、このままでは開催できません。";
  const existing = entries.filter((e) => e.category === "既存社員").length;
  return (
    <>
      {entries.length}人なので <strong>{sizes.length}グループ</strong>（{sizes.map((s) => `${s}人`).join("・")}
      ）に分かれる予定です。
      {existing >= sizes.length
        ? "既存社員は各グループに1人以上入れられます。"
        : `既存社員が${sizes.length - existing}人足りないため、既存社員のいないグループができます。`}
    </>
  );
}

async function Entries() {
  await io();
  const round = getCurrentRound();
  const { entries } = await getRound(round.key);

  const stats = [
    { label: "申込者", count: entries.length },
    ...categories.map((c) => ({ label: c, count: entries.filter((e) => e.category === c).length })),
  ];
  const byDepartment = [
    ...entries.reduce((m, e) => m.set(e.department, (m.get(e.department) ?? 0) + 1), new Map<string, number>()),
  ];

  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-3xl font-bold">申込者一覧</h1>
        <p className="text-muted">
          {formatMonth(round.key)}の開催・締め切り {formatDate(round.deadline)}
          {round.isOpen ? "（受付中）" : "（締め切り済み）"}
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(({ label, count }, i) => (
          <div key={label} className="rounded-xl border border-line bg-surface px-5 py-4">
            <dt className="text-sm text-muted">{label}</dt>
            <dd className={`text-3xl font-bold ${i === 0 ? "text-primary-ink" : ""}`}>{count}人</dd>
          </div>
        ))}
      </dl>

      <p className="rounded-[10px] bg-accent/10 px-5 py-3.5 text-accent-ink">{planMessage(entries)}</p>

      {byDepartment.length > 0 && (
        <ul aria-label="部署別の人数" className="flex flex-wrap gap-2">
          {byDepartment.map(([department, count]) => (
            <li key={department} className="rounded-full border border-line bg-surface px-3 py-1 text-sm">
              {department} <span className="font-bold">{count}人</span>
            </li>
          ))}
        </ul>
      )}

      <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
        {entries.length === 0 ? (
          <p className="px-5 py-8 text-center text-muted">まだ申し込みはありません</p>
        ) : (
          <table className="w-full min-w-[560px] border-collapse">
            <thead>
              <tr className="bg-background text-left text-sm text-muted">
                <th scope="col" className="px-5 py-3 font-bold">名前</th>
                <th scope="col" className="px-5 py-3 font-bold">部署</th>
                <th scope="col" className="px-5 py-3 font-bold">入社年</th>
                <th scope="col" className="px-5 py-3 font-bold">区分</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-t border-line">
                  <td className="px-5 py-3 font-medium">{e.name}</td>
                  <td className="px-5 py-3">{e.department}</td>
                  <td className="px-5 py-3">{e.joinYear}年</td>
                  <td className="px-5 py-3">
                    <CategoryBadge category={e.category} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
