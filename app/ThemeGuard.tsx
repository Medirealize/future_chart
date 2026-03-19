"use client";

import * as React from "react";

/**
 * Tailwind の `dark:` 適用が意図せず走ってしまうケースに備え、
 * アプリ初期表示で `dark` クラスを強制的に外して可読性を担保します。
 */
export default function ThemeGuard() {
  React.useEffect(() => {
    try {
      document.documentElement.classList.remove("dark");
      document.body.classList.remove("dark");
    } catch {
      // ignore
    }
  }, []);

  return null;
}

