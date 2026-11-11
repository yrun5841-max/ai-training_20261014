"use client";

import { useTransition } from "react";
import { signOut } from "firebase/auth";
import { clientAuth } from "@/lib/firebase-client";
import { logout } from "./auth-actions";

export function LogoutButton() {
  const [pending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      // ブラウザ側の Google ログインも消さないと、自動でログインし直してしまう
      await signOut(clientAuth());
      await logout();
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="min-h-10 rounded-[10px] border border-zinc-300 bg-surface px-4 text-sm hover:border-primary hover:text-primary-ink disabled:opacity-60 dark:border-zinc-700"
    >
      {pending ? "ログアウト中…" : "ログアウト"}
    </button>
  );
}
