import "server-only";

// Firestore への書き込み。Admin SDK は使わず、REST API にログインした本人の ID トークンを付けて送る。
// そのため Firestore のセキュリティルール（firestore.rules）がそのまま適用される

function documentUrl(path: string) {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) throw new Error("NEXT_PUBLIC_FIREBASE_PROJECT_ID が設定されていません");
  return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${path}`;
}

/** 申し込んだ人の名前を rounds/{roundKey}/entries/{uid} に保存する（あれば上書き） */
export async function saveEntryName(
  idToken: string,
  { roundKey, uid, name }: { roundKey: string; uid: string; name: string },
) {
  const path = `rounds/${encodeURIComponent(roundKey)}/entries/${encodeURIComponent(uid)}`;
  const response = await fetch(documentUrl(path), {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fields: {
        name: { stringValue: name },
        createdAt: { timestampValue: new Date().toISOString() },
      },
    }),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Firestore への保存に失敗しました (${response.status}): ${await response.text()}`);
  }
}
