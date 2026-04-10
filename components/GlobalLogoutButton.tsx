"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { LogoutButton, isDashboardPath } from "@/components/LogoutButton";

function isLoginPath(path: string | null) {
  if (!path) return false;
  return path === "/login" || path.startsWith("/login/");
}

/**
 * ログイン画面・ダッシュボード以外で右上固定表示。
 * ダッシュボードのモバイルは DashboardShell 内のメニュー下バーに任せる。
 */
export function GlobalLogoutButton() {
  const pathname = usePathname();
  const [mounted, setMounted] = React.useState(false);

  React.useLayoutEffect(() => {
    setMounted(true);
  }, []);

  if (isLoginPath(pathname) || isDashboardPath(pathname)) return null;

  const bar = (
    <div data-fc-global-logout="1" role="navigation" aria-label="アカウント">
      <div className="pointer-events-auto shrink-0">
        <LogoutButton />
      </div>
    </div>
  );

  if (!mounted) {
    return bar;
  }

  return createPortal(bar, document.body);
}
