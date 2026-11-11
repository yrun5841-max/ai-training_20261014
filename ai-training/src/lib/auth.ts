import "server-only";
import { cookies } from "next/headers";
import { createRemoteJWKSet, jwtVerify } from "jose";

// ログイン状態を持つ Cookie。中身は Firebase の ID トークン（有効期限は発行から1時間）
export const SESSION_COOKIE = "session";

export type User = {
  uid: string;
  name: string;
  email: string;
};

// Firebase の ID トークンに署名した Google の公開鍵（取得した鍵はメモリに保持される）
const googleKeys = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"),
);

/**
 * Firebase の ID トークンを検証する（Admin SDK を使わない方法）。
 * 署名・発行元・対象のプロジェクト・有効期限を確かめ、正しければ本人の情報と有効期限を返す
 */
export async function verifyIdToken(idToken: string): Promise<{ user: User; expiresAt: number }> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) throw new Error("NEXT_PUBLIC_FIREBASE_PROJECT_ID が設定されていません");

  const { payload } = await jwtVerify(idToken, googleKeys, {
    algorithms: ["RS256"],
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
  });
  if (typeof payload.sub !== "string" || payload.sub === "" || payload.exp === undefined) {
    throw new Error("ID トークンの内容が正しくありません");
  }

  return {
    user: {
      uid: payload.sub,
      name: typeof payload.name === "string" ? payload.name : "",
      email: typeof payload.email === "string" ? payload.email : "",
    },
    expiresAt: payload.exp,
  };
}

/**
 * ログインしている人と、その人の ID トークン（Firestore にその人の権限で書き込むときに使う）。
 * ログインしていない・トークンが無効や期限切れなら null
 */
export async function getSession(): Promise<{ user: User; idToken: string } | null> {
  const idToken = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!idToken) return null;

  try {
    return { user: (await verifyIdToken(idToken)).user, idToken };
  } catch {
    return null;
  }
}

/** ログインしている人。ログインしていない・トークンが無効や期限切れなら null */
export async function getCurrentUser(): Promise<User | null> {
  return (await getSession())?.user ?? null;
}
