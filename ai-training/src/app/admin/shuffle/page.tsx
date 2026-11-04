import { Suspense } from "react";
import { io } from "next/cache";
import { CategoryBadge } from "../../category-badge";
import { publish, runShuffle } from "@/app/actions";
import { formatMonth, getCurrentRound } from "@/lib/schedule";
import { groupWarnings } from "@/lib/shuffle";
import { getRound } from "@/lib/store";

export default function ShufflePage() {
  return (
    <Suspense fallback={<p className="text-muted">読み込み中…</p>}>
      <Shuffle />
    </Suspense>
  );
}

const buttonClass =
  "inline-flex min-h-12 items-center gap-2 rounded-[10px] px-5 font-bold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40";

async function Shuffle() {
  await io();
  const round = getCurrentRound();
  const data = await getRound(round.key);

  const groups = (data.groups ?? []).map((ids) => {
    const members = ids.map((id) => data.entries.find((e) => e.id === id)).filter((e) => e !== undefined);
    return { members, warnings: groupWarnings(members) };
  });
  const warned = groups.filter((g) => g.warnings.length > 0).length;
  const tooFew = data.entries.length < 3;
  const canShuffle = !round.isOpen && !data.published && !tooFew;

  let notice: string | undefined;
  if (round.isOpen) notice = "締め切り後にシャッフルできます。";
  else if (tooFew) notice = "申込者が3人未満のため、今月は開催しません。";
  else if (data.published) notice = "結果を公開しました。公開後はシャッフルできません。";

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-3xl font-bold">シャッフル結果</h1>
          <p className="text-muted">
            {formatMonth(round.key)}の開催・申込者 {data.entries.length}人
            {groups.length > 0 && `・${groups.length}グループ`}・
            <strong className={data.published ? "text-accent-ink" : "text-foreground"}>
              {data.published ? "公開済み" : "未公開"}
            </strong>
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <form action={runShuffle}>
            <button
              disabled={!canShuffle}
              className={`${buttonClass} border border-zinc-300 bg-surface font-medium dark:border-zinc-700`}
            >
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 3h5v5" />
                <path d="M4 20 21 3" />
                <path d="M21 16v5h-5" />
                <path d="M15 15l6 6" />
                <path d="M4 4l5 5" />
              </svg>
              {data.groups ? "もう一度シャッフル" : "シャッフルする"}
            </button>
          </form>
          <form action={publish}>
            <button
              disabled={!canShuffle || groups.length === 0}
              className={`${buttonClass} bg-accent-ink text-white dark:text-zinc-950`}
            >
              この結果を公開する
            </button>
          </form>
        </div>
      </div>

      {notice && <p className="rounded-[10px] bg-surface px-5 py-3.5 text-muted">{notice}</p>}

      {warned > 0 && (
        <div role="status" className="flex gap-3 rounded-xl border border-primary bg-primary/10 px-5 py-4 text-primary-ink">
          <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
            <path d="M12 3 2 21h20L12 3z" />
            <path d="M12 10v5" />
            <path d="M12 18h.01" />
          </svg>
          <div className="flex flex-col gap-0.5">
            <strong>{warned}グループで条件を満たせませんでした</strong>
            <span>
              {data.published
                ? "このまま公開しています。"
                : "このまま公開するか、もう一度シャッフルしてください。"}
            </span>
          </div>
        </div>
      )}

      <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map(({ members, warnings }, i) => (
          <section
            key={i}
            className={`flex flex-col gap-3 rounded-2xl bg-surface p-6 ${
              warnings.length > 0 ? "border-2 border-primary" : "border border-line"
            }`}
          >
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-xl font-bold">グループ {i + 1}</h2>
              <span className="text-sm text-muted">{members.length}人</span>
            </div>
            {warnings.length === 0 ? (
              <p className="flex items-center gap-1.5 text-sm font-medium text-accent-ink">
                <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12l5 5L20 6" />
                </svg>
                条件をすべて満たしています
              </p>
            ) : (
              <ul className="flex flex-col gap-1">
                {warnings.map((w) => (
                  <li key={w} className="rounded-lg bg-primary/10 px-2.5 py-1.5 text-sm font-medium text-primary-ink">
                    {w}
                  </li>
                ))}
              </ul>
            )}
            <ul className="flex flex-col">
              {members.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-2 border-t border-line py-2.5">
                  <div className="flex flex-col">
                    <span className="font-medium">{m.name}</span>
                    <span className="text-sm text-muted">
                      {m.department}・{m.joinYear}年入社
                    </span>
                  </div>
                  <CategoryBadge category={m.category} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
