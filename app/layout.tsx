import "./globals.css";

import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Noto_Sans_JP } from "next/font/google";
import { GlobalLogoutButton } from "@/components/GlobalLogoutButton";
import ThemeGuard from "./ThemeGuard";

const notoSansJp = Noto_Sans_JP({
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "FutureChart",
  description: "日記アプリのオンボーディング",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body
        className={[
          notoSansJp.className,
          "min-h-screen bg-[#F0F2F5] text-[#1C1E21] antialiased",
        ].join(" ")}
      >
        <ThemeGuard />
        {children}
        {/* 最後に描画して全ページで確実に右上に重ねる */}
        <GlobalLogoutButton />
      </body>
    </html>
  );
}

