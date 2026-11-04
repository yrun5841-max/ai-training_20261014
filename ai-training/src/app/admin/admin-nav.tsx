"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "申込者一覧" },
  { href: "/admin/shuffle", label: "シャッフル" },
] as const;

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="管理メニュー" className="flex flex-wrap gap-2">
      {links.map(({ href, label }) => {
        const current = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={current ? "page" : undefined}
            className={`rounded-lg px-4 py-2.5 ${
              current ? "bg-white font-medium text-[#1c1f23]" : "text-zinc-200 hover:text-white"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
