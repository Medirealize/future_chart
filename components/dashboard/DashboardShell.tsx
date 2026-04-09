"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, CalendarDays, Menu, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "カレンダー", icon: CalendarDays },
  { href: "/dashboard/timeline", label: "年表", icon: BookOpen },
  { href: "/onboarding/future/edit", label: "未来設定", icon: Sparkles },
] as const;

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  return (
    <div className="min-h-screen bg-[#F0F2F5] text-[#1C1E21] antialiased">
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-[#DADDE1] bg-white/95 px-4 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/80 lg:hidden">
        <span className="text-base font-bold tracking-tight text-[#1C1E21]">FutureChart</span>
        <button
          type="button"
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "メニューを閉じる" : "メニューを開く"}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#DADDE1] bg-white text-[#1C1E21] shadow-sm transition-colors hover:bg-[#F2F3F5]"
          onClick={() => setMobileOpen((o) => !o)}
        >
          {mobileOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
        </button>
      </header>

      {mobileOpen ? (
        <button
          type="button"
          aria-label="オーバーレイを閉じる"
          className="fixed inset-x-0 bottom-0 top-14 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed bottom-0 left-0 z-50 flex w-[min(280px,88vw)] flex-col border-r border-[#DADDE1] bg-white shadow-[4px_0_24px_-8px_rgba(0,0,0,0.08)] transition-transform duration-200 ease-out lg:top-0 lg:translate-x-0",
          "top-14 lg:top-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="hidden border-b border-[#E4E6EB] px-5 py-6 lg:block">
          <p className="text-lg font-bold tracking-tight text-[#1C1E21]">FutureChart</p>
          <p className="mt-1 text-xs leading-relaxed text-[#65676B]">診察前整理 · 未来の自分との対話</p>
        </div>
        <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-3 pt-4 lg:pt-3">
          {nav.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/dashboard"
                ? pathname === "/dashboard" || pathname === "/dashboard/"
                : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors",
                  active
                    ? "bg-[#E7F3FF] text-[#1877F2]"
                    : "text-[#65676B] hover:bg-[#F2F3F5] hover:text-[#1C1E21]"
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
                    active
                      ? "border-[#BCDDFD] bg-white text-[#1877F2]"
                      : "border-[#E4E6EB] bg-[#F0F2F5] text-[#65676B]"
                  )}
                >
                  <Icon className="h-[1.125rem] w-[1.125rem]" strokeWidth={2} aria-hidden />
                </span>
                {label}
              </Link>
            );
          })}
        </div>
        <div className="border-t border-[#E4E6EB] p-3 text-[11px] leading-snug text-[#8A8D91] lg:block">
          スマホでは左上メニューから各画面へ移動できます。
        </div>
      </aside>

      <main className="min-h-[calc(100dvh-3.5rem)] pb-10 pt-4 lg:ml-[280px] lg:min-h-screen lg:pb-12 lg:pl-8 lg:pr-8 lg:pt-10">
        <div className="mx-auto w-full max-w-[1200px] px-4 lg:px-0">{children}</div>
      </main>
    </div>
  );
}
