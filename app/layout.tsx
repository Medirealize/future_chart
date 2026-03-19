import "./globals.css";

import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Noto_Sans_JP } from "next/font/google";

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
          "min-h-screen text-slate-900 antialiased",
          "bg-gradient-to-b from-blue-50 via-white to-white",
          "dark:bg-gradient-to-b dark:from-slate-950 dark:via-slate-950 dark:to-slate-950 dark:text-slate-50",
        ].join(" ")}
      >
        {children}
      </body>
    </html>
  );
}

