"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/utils/supabase/browser";
import { clearClientAppStores } from "@/lib/auth/clear-client-stores";
import { cn } from "@/lib/utils";

function getBrowserSupabase() {
  try {
    return createSupabaseBrowserClient();
  } catch {
    return null;
  }
}

type LogoutButtonProps = {
  className?: string;
  /** @deprecated tone=subtle を優先 */
  compact?: boolean;
  /**
   * prominent: 目立つ（オンボーディング等のグローバル右上向け）
   * subtle: 小さく控えめ（ダッシュボードヘッダー・サイドバー向け）
   */
  tone?: "prominent" | "subtle";
};

export function LogoutButton({ className, compact, tone = "prominent" }: LogoutButtonProps) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  const resolvedTone = tone === "prominent" && compact ? "subtle" : tone;

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      const supabase = getBrowserSupabase();
      if (supabase) {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      }
      clearClientAppStores();
      router.replace("/login");
      router.refresh();
    } catch {
      clearClientAppStores();
      router.replace("/login");
    } finally {
      setIsSigningOut(false);
    }
  }

  if (resolvedTone === "subtle") {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn(
          "h-8 gap-1 px-2 text-[11px] font-normal leading-none text-slate-500 shadow-none",
          "hover:bg-slate-100/90 hover:text-slate-700",
          "focus-visible:ring-1 focus-visible:ring-slate-300",
          className
        )}
        disabled={isSigningOut}
        onClick={() => void handleSignOut()}
      >
        <LogOut className="h-3.5 w-3.5 shrink-0 text-slate-400" strokeWidth={2} aria-hidden />
        {isSigningOut ? "処理中…" : "ログアウト"}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      className={cn(
        "min-h-[3.25rem] gap-2.5 rounded-2xl border-slate-200/90 bg-white/95 px-6 py-3 text-sm font-medium text-slate-600 shadow-sm backdrop-blur-sm",
        "hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800",
        className
      )}
      disabled={isSigningOut}
      onClick={() => void handleSignOut()}
    >
      <LogOut className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
      {isSigningOut ? "ログアウト中..." : "ログアウト"}
    </Button>
  );
}

export function isDashboardPath(path: string | null) {
  if (!path) return false;
  return path === "/dashboard" || path.startsWith("/dashboard/");
}
