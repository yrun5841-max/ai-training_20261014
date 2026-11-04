import type { Metadata } from "next";
import { AdminNav } from "./admin-nav";

export const metadata: Metadata = {
  title: "管理 | シャッフルランチ",
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b-4 border-primary bg-[#1c1f23] text-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="text-xl font-bold">シャッフルランチ</span>
            <span className="rounded-md bg-primary px-2.5 py-0.5 text-xs font-bold text-[#1c1f23]">管理</span>
          </div>
          <AdminNav />
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10 sm:px-6">{children}</main>
    </div>
  );
}
