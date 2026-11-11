import { io } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { LoginButton } from "./login-button";
import { LogoutButton } from "./logout-button";

/** ヘッダー右側。ログインしていれば名前とログアウト、していなければログインボタン */
export async function UserMenu() {
  await io();
  const user = await getCurrentUser();
  if (!user) return <LoginButton />;

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm">
        <span className="font-bold">{user.name || user.email}</span> さん
      </span>
      <LogoutButton />
    </div>
  );
}
