"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createSupabaseClient, getSupabaseEnvDebugInfo } from "@/utils/supabase/client";

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
    <div className="min-h-screen bg-[radial-gradient(circle_at_85%_95%,rgba(255,230,206,0.55),transparent_36%),linear-gradient(165deg,#c7e1f8_0%,#e4f1fd_48%,#ffffff_100%)] px-3 py-6">
      <div className="mx-auto w-full max-w-[430px]">
        <h1 className="mb-4 text-center text-[clamp(24px,6vw,42px)] font-medium text-[#111]">
          未来処方 (Future Prescription)
        </h1>

        <div className="relative mx-auto w-full max-w-[390px] rounded-[52px] border-[4px] border-[#202020] bg-[linear-gradient(160deg,#d6ecff_0%,#fafcfe_62%,#fdf7f2_100%)] px-3 pb-6 pt-[66px] shadow-[0_16px_34px_rgba(16,30,44,0.22),inset_0_0_0_2px_rgba(255,255,255,0.5)]">
          <div className="absolute left-1/2 top-2 h-9 w-[176px] -translate-x-1/2 rounded-full bg-[#0b0b0c]" />

          <div className="rounded-[28px] border-2 border-[#3a3a3a] bg-[linear-gradient(165deg,rgba(252,253,255,0.58),rgba(245,247,251,0.68))] px-2.5 pb-5 pt-5 shadow-[inset_0_10px_22px_rgba(187,206,225,0.3),0_12px_26px_rgba(133,155,176,0.2)]">
            <p className="text-center text-[clamp(22px,5.1vw,36px)] font-bold text-[#111]">
              「未来の君」からのアドバイスが、
            </p>

            <div className="mx-auto my-3 w-full max-w-[314px] overflow-hidden rounded-xl bg-[linear-gradient(140deg,rgba(229,236,246,0.4),rgba(216,226,238,0.32))]">
              <Image
                src="/login-hero-icon.svg"
                alt="光るラインとカルテの代替アイコン"
                width={360}
                height={220}
                className="block h-auto w-full"
                priority
              />
            </div>

            <p className="text-center text-[clamp(18px,4.5vw,32px)] text-[#111]">
              その記録が、明日を変える力になる
            </p>

            <h2 className="mt-3 text-center text-[clamp(36px,8.2vw,62px)] font-bold leading-[1.05] text-[#111]">
              未来処方、はじめよう
            </h2>
            <p className="text-center text-[clamp(18px,4.5vw,30px)] font-bold leading-[1.05] text-[#111]">
              「未来の君」からのアドバイスが、
            </p>
            <p className="text-center text-[clamp(18px,4.5vw,30px)] font-bold leading-[1.05] text-[#111]">
              今の君を変える
            </p>
            <p className="mt-2 text-center text-[clamp(18px,4.5vw,30px)] text-[#111]">
              その記録が、明日を変える力になる
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode("signin")}
                className={`h-[52px] rounded-[10px] border border-[#eef1f5] text-[clamp(16px,4vw,28px)] font-medium text-[#1b1c1e] ${
                  mode === "signin" ? "bg-[#b8d7fa]" : "bg-[#e6e7eb]"
                }`}
                disabled={isLoading}
              >
                ログイン
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`h-[52px] rounded-[10px] border border-[#eef1f5] text-[clamp(16px,4vw,28px)] font-medium text-[#1b1c1e] ${
                  mode === "signup" ? "bg-[#b8d7fa]" : "bg-[#e6e7eb]"
                }`}
                disabled={isLoading}
              >
                初回登録
              </button>
            </div>

            <form
              className="mt-2"
              onSubmit={(e) => {
                e.preventDefault();
                void handleAuth();
              }}
            >
              <label htmlFor="email" className="mt-1 block text-[clamp(14px,4vw,30px)] font-medium text-[#111]">
                メールアドレス
              </label>
              <div className="ml-2 mt-0.5 text-[clamp(18px,4.5vw,32px)]">📜</div>
              <input
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                autoComplete="email"
                className="h-[clamp(30px,6.4vw,52px)] w-full rounded-full border-2 border-[#b4ccdf] bg-[rgba(248,251,255,0.9)] px-4 text-[clamp(15px,3.8vw,26px)] outline-none focus:border-[#8db4d2] focus:shadow-[0_0_0_3px_rgba(131,175,205,0.18)]"
              />

              <label
                htmlFor="password"
                className="mt-1 block text-[clamp(14px,4vw,30px)] font-medium text-[#111]"
              >
                パスワード
              </label>
              <div className="mt-0.5 flex max-w-[52%] items-center justify-between text-[clamp(18px,4.5vw,32px)]">
                <span>🖋️</span>
                <span>🧠</span>
              </div>
              <input
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                autoComplete="current-password"
                className="h-[clamp(30px,6.4vw,52px)] w-full rounded-full border-2 border-[#b4ccdf] bg-[rgba(248,251,255,0.9)] px-4 text-[clamp(15px,3.8vw,26px)] outline-none focus:border-[#8db4d2] focus:shadow-[0_0_0_3px_rgba(131,175,205,0.18)]"
              />

              <button
                type="submit"
                disabled={isLoading}
                className="mt-3 block w-full border-none bg-transparent text-center text-[clamp(20px,4.8vw,30px)] font-semibold text-[#4f8db7] disabled:opacity-50"
              >
                {isLoading ? "処理中..." : "未来の君に相談する"}
              </button>
            </form>
          </div>

          <div className="mx-auto mt-3 h-[5px] w-[126px] rounded-full bg-[#0b0c0e]" />
        </div>
      </div>
    </div>
  );
}

