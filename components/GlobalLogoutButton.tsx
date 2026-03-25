"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/utils/supabase/browser";
import { clearClientAppStores } from "@/lib/auth/clear-client-stores";

function isLoginPath(path: string | null) {
  if (!path) return false;
  return path === "/login" || path.startsWith("/login/");
}

function getBrowserSupabase() {
  try {
    return createSupabaseBrowserClient();
  } catch {
    return null;
  }
}

/**
 * ログイン画面以外で常に右上に表示。body 直下へポータルし、親レイアウトの
 * overflow / transform / z-index の影響を受けにくくする。
 */
export function GlobalLogoutButton() {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = React.useState(false);

  React.useLayoutEffect(() => {
    setMounted(true);
  }, []);

  const [isSigningOut, setIsSigningOut] = React.useState(false);

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

  if (isLoginPath(pathname)) return null;

  const bar = (
    <div data-fc-global-logout="1" role="navigation" aria-label="アカウント">
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

  if (!mounted) {
    return bar;
  }

  return createPortal(bar, document.body);
}
