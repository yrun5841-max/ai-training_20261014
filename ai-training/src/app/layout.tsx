import type { Metadata } from "next";
import { Geist_Mono, Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const notoSansJp = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "シャッフルランチ",
  description: "ランチで、はじめまして。社内シャッフルランチの申し込み",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      className={`${notoSansJp.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col leading-relaxed">{children}</body>
    </html>
  );
}
