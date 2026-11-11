"use server";

import { cookies } from "next/headers";
import { refresh } from "next/cache";
import { SESSION_COOKIE, verifyIdToken } from "@/lib/auth";

export type LoginResult = { error?: string };

/** Google ログインで受け取った ID トークンを検証し、Cookie に保存する */
export async function login(idToken: string): Promise<LoginResult> {
  if (typeof idToken !== "string" || idToken === "") return { error: "ログインに失敗しました" };

  try {
    const { expiresAt } = await verifyIdToken(idToken);
    (await cookies()).set(SESSION_COOKIE, idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      // トークンの有効期限が切れたら Cookie も消える
      maxAge: Math.max(0, expiresAt - Math.floor(Date.now() / 1000)),
    });
  } catch (error) {
    console.error("login failed", error);
    return { error: "ログインに失敗しました" };
  }

  refresh();
  return {};
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  refresh();
}
