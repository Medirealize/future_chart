"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/utils/supabase/browser";
import { clearClientAppStores } from "@/lib/auth/clear-client-stores";

/**
 * ログイン中のみ表示。全ページ共通の固定位置ログアウト。
 */
export function GlobalLogoutButton() {
  const router = useRouter();
  const supabase = React.useMemo(() => {
    try {
      return createSupabaseBrowserClient();
    } catch {
      // 環境変数未設定のビルド環境ではボタンを非表示にする
      return null;
    }
  }, []);
  const [visible, setVisible] = React.useState(false);
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  React.useEffect(() => {
    if (!supabase) {
      setVisible(false);
      return;
    }
    let cancelled = false;
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (!cancelled) setVisible(Boolean(session));
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setVisible(Boolean(session));
    });
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleSignOut() {
    if (!supabase) return;
    setIsSigningOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      clearClientAppStores();
      router.replace("/login");
      router.refresh();
    } catch {
      // 失敗時もセッションが切れていればログインへ
      clearClientAppStores();
      router.replace("/login");
    } finally {
      setIsSigningOut(false);
    }
  }

  if (!visible) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[9999] flex justify-end pt-[max(0.75rem,env(safe-area-inset-top))] pr-[max(0.75rem,env(safe-area-inset-right))] pl-3 sm:pr-[max(1rem,env(safe-area-inset-right))] sm:pt-[max(1rem,env(safe-area-inset-top))]"
      role="navigation"
      aria-label="アカウント"
    >
      <div className="pointer-events-auto shrink-0">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="min-h-[3.25rem] gap-2.5 rounded-2xl border-rose-200/85 bg-white/95 px-7 py-3.5 text-base font-semibold text-rose-900 shadow-md backdrop-blur-sm transition-all hover:border-rose-300 hover:bg-rose-50/95 hover:shadow-lg"
          disabled={isSigningOut}
          onClick={() => void handleSignOut()}
        >
          <LogOut className="h-5 w-5 shrink-0 text-rose-500" aria-hidden />
          {isSigningOut ? "ログアウト中..." : "ログアウト"}
        </Button>
      </div>
    </div>
  );
}
