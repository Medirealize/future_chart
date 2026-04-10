"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, CalendarDays, Menu, Sparkles, X } from "lucide-react";
import { LogoutButton } from "@/components/LogoutButton";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "カレンダー", icon: CalendarDays },
  { href: "/dashboard/timeline", label: "年表", icon: BookOpen },
  { href: "/onboarding/future/edit", label: "未来設定", icon: Sparkles },
] as const;

const SIDEBAR_W = "w-64"; /* 16rem — shadcn / v0 既定幅 */

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
    <div className="flex min-h-svh w-full flex-col bg-slate-50 text-slate-900 antialiased">
      <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border bg-background px-3 sm:px-4 lg:hidden">
        <span className="min-w-0 truncate text-base font-semibold tracking-tight text-foreground">
          FutureChart
        </span>
        <div className="flex shrink-0 items-center gap-0.5">
          <LogoutButton tone="subtle" />
          <button
            type="button"
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "メニューを閉じる" : "メニューを開く"}
            className="relative z-50 inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            onClick={() => setMobileOpen((o) => !o)}
          >
            {mobileOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
          </button>
        </div>
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
          "fixed bottom-0 left-0 z-50 flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-sm transition-transform duration-200 ease-out lg:top-0 lg:translate-x-0",
          SIDEBAR_W,
          "top-14 lg:top-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="hidden h-14 shrink-0 flex-col justify-center border-b border-sidebar-border px-4 lg:flex">
          <p className="text-sm font-semibold tracking-tight text-sidebar-foreground">FutureChart</p>
          <p className="text-xs text-muted-foreground">未来の自分との対話</p>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2 pt-3 lg:pt-2" aria-label="メインナビゲーション">
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
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground"
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-sidebar-border bg-background",
                    active && "border-transparent bg-sidebar-primary text-sidebar-primary-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
                </span>
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="hidden border-t border-sidebar-border p-2 lg:block">
          <LogoutButton
            tone="subtle"
            className="w-full justify-center text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
          />
        </div>
        <div className="border-t border-sidebar-border p-3 text-[11px] leading-snug text-muted-foreground">
          スマホではメニューから画面を切り替えられます。
        </div>
      </aside>

      <main className="flex-1 pb-10 pt-4 lg:pl-64 lg:pb-12 lg:pr-8 lg:pt-8">
        <div className="mx-auto w-full max-w-6xl px-4 lg:px-0">
          <div className="flex flex-col gap-6">{children}</div>
        </div>
      </main>
    </div>
  );
}
