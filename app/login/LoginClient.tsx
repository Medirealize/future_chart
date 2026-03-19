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
        alert("サインアップしました。メール認証が必要な場合は、メールをご確認ください。");
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
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
            家族の未来を描こう
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            今日の一歩が、未来のあなたを支えます。
          </p>
        </div>

        <div className="mt-6 flex gap-2">
          <Button
            variant={mode === "signin" ? "secondary" : "outline"}
            onClick={() => setMode("signin")}
            className="flex-1 rounded-full"
            disabled={isLoading}
          >
            Sign in
          </Button>
          <Button
            variant={mode === "signup" ? "secondary" : "outline"}
            onClick={() => setMode("signup")}
            className="flex-1 rounded-full"
            disabled={isLoading}
          >
            Sign up
          </Button>
        </div>

        <div className="mt-6 space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Email
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
              Password
            </label>
            <Input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              className="rounded-full border-[#3B82F6]/30 focus-visible:ring-[#3B82F6]"
            />
          </div>
        </div>

        <div className="mt-7 flex items-center justify-center">
          <Button
            onClick={handleAuth}
            disabled={isLoading}
            className="rounded-full bg-[#3B82F6] text-white hover:bg-[#3B82F6]/90 dark:bg-[#3B82F6] dark:hover:bg-[#3B82F6]/90"
          >
            {mode === "signin" ? "ログイン" : "登録"}
          </Button>
        </div>
      </div>
    </div>
  );
}

