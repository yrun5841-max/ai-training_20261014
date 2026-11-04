import { cookies } from "next/headers";
import type { RoundData } from "./store";

// 申し込んだ本人を見分けるための Cookie（募集回ごと）
export const tokenCookie = (roundKey: string) => `lunch-${roundKey}`;

/** 自分の申し込み。Cookie の識別コードで判定する */
export async function findMyEntry(roundKey: string, data: RoundData) {
  const token = (await cookies()).get(tokenCookie(roundKey))?.value;
  if (!token) return undefined;
  return data.entries.find((e) => e.token === token);
}
