"use server";

import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { refresh } from "next/cache";
import { currentYear, getCurrentRound } from "@/lib/schedule";
import { tokenCookie } from "@/lib/session";
import { updateRound } from "@/lib/store";
import { shuffle } from "@/lib/shuffle";
import { validateApplication } from "@/lib/validation";

export type ApplyState = { error?: string };

export async function apply(_prev: ApplyState, formData: FormData): Promise<ApplyState> {
  const round = getCurrentRound();
  if (!round.isOpen) return { error: "今月の受付は終了しました" };

  const result = validateApplication(formData, currentYear());
  if (!result.ok) return { error: result.error };

  const cookieStore = await cookies();
  const existingToken = cookieStore.get(tokenCookie(round.key))?.value;
  const token = randomUUID();

  const error = await updateRound(round.key, (data) => {
    if (existingToken && data.entries.some((e) => e.token === existingToken)) {
      return "すでに申し込み済みです";
    }
    data.entries.push({
      id: randomUUID(),
      token,
      ...result.value,
      createdAt: new Date().toISOString(),
    });
  });
  if (error) return { error };

  cookieStore.set(tokenCookie(round.key), token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 90,
  });
  refresh();
  return {};
}

export async function cancel() {
  const round = getCurrentRound();
  if (!round.isOpen) return;

  const cookieStore = await cookies();
  const token = cookieStore.get(tokenCookie(round.key))?.value;
  if (!token) return;

  await updateRound(round.key, (data) => {
    data.entries = data.entries.filter((e) => e.token !== token);
  });
  cookieStore.delete(tokenCookie(round.key));
  refresh();
}

// ---- 管理者 ----

export async function runShuffle() {
  const round = getCurrentRound();
  if (round.isOpen) return;

  await updateRound(round.key, (data) => {
    if (data.published) return;
    data.groups = shuffle(data.entries).map((group) => group.map((e) => e.id));
  });
  refresh();
}

export async function publish() {
  const round = getCurrentRound();
  await updateRound(round.key, (data) => {
    if (data.groups && data.groups.length > 0) data.published = true;
  });
  refresh();
}
