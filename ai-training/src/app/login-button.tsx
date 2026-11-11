"use client";

import { useEffect, useState, useTransition } from "react";
import { GoogleAuthProvider, signInWithPopup, type User } from "firebase/auth";
import { clientAuth } from "@/lib/firebase-client";
import { login } from "./auth-actions";

/** ID トークンをサーバーに送り、ログイン状態の Cookie を作ってもらう */
async function sendIdToken(user: User) {
  return login(await user.getIdToken());
}

export function LoginButton() {
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  // サーバーの Cookie が期限切れでも、ブラウザに Google ログインが残っていれば自動でログインし直す
  useEffect(() => {
    const auth = clientAuth();
    auth.authStateReady().then(() => {
      const user = auth.currentUser;
      if (user) startTransition(async () => void (await sendIdToken(user)));
    });
  }, []);

  const handleClick = () => {
    setError(undefined);
    startTransition(async () => {
      try {
        const credential = await signInWithPopup(clientAuth(), new GoogleAuthProvider());
        const result = await sendIdToken(credential.user);
        if (result.error) setError(result.error);
      } catch (e) {
        // ポップアップを閉じただけのときは、エラーを出さない
        const code = (e as { code?: string }).code;
        if (code !== "auth/popup-closed-by-user" && code !== "auth/cancelled-popup-request") {
          setError("ログインに失敗しました");
        }
      }
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="min-h-10 rounded-[10px] border border-zinc-300 bg-surface px-4 text-sm font-bold hover:border-primary hover:text-primary-ink disabled:opacity-60 dark:border-zinc-700"
      >
        {pending ? "ログイン中…" : "Google でログイン"}
      </button>
      {error && (
        <p role="alert" className="text-xs font-medium text-primary-ink">
          {error}
        </p>
      )}
    </div>
  );
}
