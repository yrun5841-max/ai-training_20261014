import { findMyEntry } from "./session";
import { getCurrentRound, type Round } from "./schedule";
import { getRound, type Entry, type RoundData } from "./store";

/** 参加者のトップ画面で、どの表示にするか */
export type ParticipantStatus =
  | { kind: "closed" } // 申し込んでいないまま締め切った
  | { kind: "apply" } // 募集中で、まだ申し込んでいない
  | { kind: "applied" } // 申し込み済みで、締め切り前（取り消せる）
  | { kind: "tooFew" } // 申込者が3人未満で開催しない（SPEC.md 5.1）
  | { kind: "waiting" } // 締め切ったが、まだ公開していない
  | { kind: "group"; groupNumber: number; members: Entry[] }; // 公開後の自分のグループ（SPEC.md 4.3）

/** 募集回の状態と自分の申し込みから、画面に出す内容を決める */
export function participantStatus(
  round: Round,
  data: RoundData,
  me: Entry | undefined,
): ParticipantStatus {
  if (!me) return round.isOpen ? { kind: "apply" } : { kind: "closed" };
  if (round.isOpen) return { kind: "applied" };
  if (data.entries.length < 3) return { kind: "tooFew" };

  // 公開するまでは参加者に見せない。公開後も自分のグループだけを返す
  const groupIndex = data.published ? (data.groups?.findIndex((g) => g.includes(me.id)) ?? -1) : -1;
  if (groupIndex < 0) return { kind: "waiting" };

  const members = data.groups![groupIndex]
    .map((id) => data.entries.find((e) => e.id === id))
    .filter((e) => e !== undefined);
  return { kind: "group", groupNumber: groupIndex + 1, members };
}

/** トップ画面に必要なデータを読み込む（日付・ファイル・Cookie を読む） */
export async function loadParticipantView() {
  const round = getCurrentRound();
  const data = await getRound(round.key);
  const me = await findMyEntry(round.key, data);
  return { round, applicantCount: data.entries.length, me, status: participantStatus(round, data, me) };
}
