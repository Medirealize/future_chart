"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient, getSupabaseEnvDebugInfo } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AuthMode = "signin" | "signup";

export default function LoginClient() {
  const router = useRouter();
  const supabase = React.useMemo(() => createSupabaseClient(), []);

  const [mode, setMode] = React.useState<AuthMode>("signin");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  async function handleAuth() {
    console.debug("[UI] auth button clicked", { mode });
    if (!email.trim() || password.length < 6) {
      alert("メールアドレスと、6文字以上のパスワードを入力してください。");
      return;
    }

    setIsLoading(true);
    try {
      // ログイン処理の直前に、supabase が正しく初期化されているか確認ログを出す
      const dbg = getSupabaseEnvDebugInfo();
      if (!dbg.urlPresent || !dbg.anonKeyPresent) {
        console.error("[Supabase] login aborted: env missing.", dbg);
        alert("Supabase の設定が正しくありません。開発者コンソールのログを確認してください。");
        return;
      }
      if (!supabase?.auth?.signInWithPassword) {
        console.error("[Supabase] login aborted: supabase.auth not ready.", {
          hasAuth: Boolean((supabase as any)?.auth),
          hasSignInWithPassword: Boolean((supabase as any)?.auth?.signInWithPassword),
          dbg,
        });
        alert("Supabase 認証が初期化されていません。");
        return;
      }

      console.debug("[Supabase] login attempt.", {
        mode,
        email: email.trim(),
        urlHost: dbg.urlHost,
        anonKeyPrefix: dbg.anonKeyPrefix,
      });

      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) {
          console.error("[Supabase] signInWithPassword error", error);
          alert(error.message);
          return;
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (error) {
          console.error("[Supabase] signUp error", error);
          alert(error.message);
          return;
        }
        alert("初回登録が完了しました。メール認証が必要な場合は、メールをご確認ください。");
      }

      router.push("/onboarding/diagnosis");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen px-4 py-10 flex items-center justify-center bg-gradient-to-br from-[#3B82F6]/15 via-white to-[#F97316]/10">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-950">
        <div className="text-center">
          <h1 className="text-[1.65rem] font-black leading-[1.25] tracking-tight text-slate-900 sm:text-4xl sm:leading-tight dark:text-slate-50">
            未来を、
            <br className="sm:hidden" />
            迎えに行こう
          </h1>
          <p className="mt-3 max-w-sm mx-auto text-sm font-normal leading-relaxed text-slate-500 sm:mt-4 sm:text-[0.9375rem] dark:text-slate-400">
            その記録が、明日を変える力になる
          </p>
        </div>

        <div className="mt-8 flex gap-3">
          <Button
            variant={mode === "signin" ? "secondary" : "outline"}
            onClick={() => setMode("signin")}
            className="h-14 min-h-[3.5rem] flex-1 rounded-2xl text-base font-semibold sm:h-16 sm:min-h-16 sm:text-lg"
            disabled={isLoading}
          >
            ログイン
          </Button>
          <Button
            variant={mode === "signup" ? "secondary" : "outline"}
            onClick={() => setMode("signup")}
            className="h-14 min-h-[3.5rem] flex-1 rounded-2xl text-base font-semibold sm:h-16 sm:min-h-16 sm:text-lg"
            disabled={isLoading}
          >
            初回登録
          </Button>
        </div>

        <div className="mt-6 space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
              メールアドレス
            </label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className="rounded-full border-[#3B82F6]/30 focus-visible:ring-[#3B82F6]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
              パスワード
            </label>
            <Input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              className="rounded-full border-[#3B82F6]/30 focus-visible:ring-[#3B82F6]"
            />
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center">
          <Button
            variant="ghost"
            onClick={handleAuth}
            disabled={isLoading}
            className="h-14 min-w-[min(100%,16rem)] rounded-2xl border-2 border-sky-600/80 bg-sky-500/15 px-10 text-base font-bold text-sky-900 shadow-sm backdrop-blur-[2px] transition-colors hover:border-sky-600 hover:bg-sky-500/25 hover:text-sky-950 disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 sm:h-16 sm:text-lg dark:border-sky-400/90 dark:bg-sky-400/20 dark:text-sky-50 dark:hover:border-sky-300 dark:hover:bg-sky-400/30 dark:hover:text-white"
          >
            {mode === "signin" ? "ログイン" : "初回登録"}
          </Button>
        </div>
      </div>
    </div>
  );
}

