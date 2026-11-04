import { Suspense } from "react";
import { io } from "next/cache";
import { ApplyForm } from "./apply-form";
import { cancel } from "./actions";
import { CategoryBadge } from "./category-badge";
import { loadParticipantView, type ParticipantStatus } from "@/lib/participant";
import { currentYear, formatDate, formatMonth, type Round } from "@/lib/schedule";
import { categories, departments, type Entry } from "@/lib/store";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto max-w-2xl px-4 py-4 sm:px-6">
          <p className="text-xl font-bold">シャッフルランチ</p>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6">
        <section className="flex flex-col gap-1">
          <p className="text-sm font-bold tracking-[0.3em] text-accent-ink">SHUFFLE LUNCH</p>
          <h1 className="text-4xl font-black leading-tight tracking-tight text-primary-ink sm:text-5xl">
            ランチで、はじめまして。
          </h1>
        </section>

        <Suspense
          fallback={<div className="h-96 rounded-2xl border border-line bg-surface" aria-busy="true" />}
        >
          <RoundCard />
        </Suspense>
      </main>
    </div>
  );
}

async function RoundCard() {
  await io();
  const { round, applicantCount, me, status } = await loadParticipantView();

  const facts = [
    { label: "開催日", value: formatDate(round.eventDate) },
    { label: "締め切り", value: formatDate(round.deadline) },
    { label: "現在の申込者", value: `${applicantCount}人` },
  ];

  return (
    <section
      aria-labelledby="this-month"
      className="flex flex-col gap-6 rounded-2xl border border-line bg-surface p-5 sm:p-8"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="this-month" className="text-2xl font-bold">
          {formatMonth(round.key)}のシャッフルランチ
        </h2>
        <span
          className={`rounded-full px-3 py-1 text-sm font-bold ${
            round.isOpen ? "bg-accent/15 text-accent-ink" : "bg-primary/15 text-primary-ink"
          }`}
        >
          {round.isOpen ? "募集中" : "締め切りました"}
        </span>
      </div>

      <dl className="grid grid-cols-3 gap-2 sm:gap-3">
        {facts.map(({ label, value }) => (
          <div key={label} className="rounded-xl bg-background px-3 py-3 sm:px-4">
            <dt className="text-xs text-muted sm:text-sm">{label}</dt>
            <dd className="text-base font-bold sm:text-lg">{value}</dd>
          </div>
        ))}
      </dl>

      <Status round={round} status={status} myId={me?.id} />
    </section>
  );
}

function Message({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl bg-background px-4 py-8 text-center text-lg font-bold">{children}</p>
  );
}

function Status({
  round,
  status,
  myId,
}: {
  round: Round;
  status: ParticipantStatus;
  myId: string | undefined;
}) {
  switch (status.kind) {
    case "closed":
      return <Message>今月の受付は終了しました</Message>;
    case "apply":
      return <ApplyForm departments={departments} categories={categories} thisYear={currentYear()} />;
    case "applied":
      return (
        <div className="flex flex-col items-center gap-3 rounded-xl bg-accent/10 px-4 py-8 text-center">
          <p className="text-2xl font-bold text-accent-ink">申し込みました！</p>
          <p className="text-sm text-muted">締め切り後にグループが決まったら、この画面でお知らせします。</p>
          <form action={cancel}>
            <button className="mt-2 min-h-11 rounded-[10px] border border-zinc-300 bg-surface px-5 text-sm hover:border-primary hover:text-primary-ink dark:border-zinc-700">
              申し込みを取り消す
            </button>
          </form>
        </div>
      );
    case "tooFew":
      return <Message>申込者が3人未満のため、今月は開催を見送ります</Message>;
    case "waiting":
      return <Message>グループ分けの結果をお待ちください</Message>;
    case "group":
      return (
        <MyGroup
          round={round}
          groupNumber={status.groupNumber}
          members={status.members}
          myId={myId}
        />
      );
  }
}

function MyGroup({
  round,
  groupNumber,
  members,
  myId,
}: {
  round: Round;
  groupNumber: number;
  members: Entry[];
  myId: string | undefined;
}) {
  return (
    <section
      aria-labelledby="my-group"
      className="flex flex-col gap-4 rounded-xl border-2 border-primary px-5 py-5 sm:px-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 id="my-group" className="text-xl font-bold text-primary-ink">
          あなたのグループ（グループ {groupNumber}）
        </h3>
        <p className="text-sm text-muted">{formatDate(round.eventDate)}</p>
      </div>
      <ul className="flex flex-col">
        {members.map((m) => (
          <li
            key={m.id}
            className="flex flex-wrap items-center justify-between gap-2 border-t border-line py-3"
          >
            <div className="flex flex-col">
              <span className="font-bold">
                {m.name}
                {m.id === myId && <span className="ml-2 text-sm text-accent-ink">（あなた）</span>}
              </span>
              <span className="text-sm text-muted">
                {m.department}・{m.joinYear}年入社
              </span>
            </div>
            <CategoryBadge category={m.category} />
          </li>
        ))}
      </ul>
      <p className="rounded-[10px] bg-background px-4 py-3 text-sm">
        集合場所やお店は、メンバーで相談して決めてください。
      </p>
    </section>
  );
}
