"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient, getSupabaseEnvDebugInfo } from "@/utils/supabase/client";

type AuthMode = "signin" | "signup";

const LOGIN_PREFS_KEY = "futurechart_login_prefs";

function readStoredLoginPrefs(): { remember: boolean; email: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LOGIN_PREFS_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as { remember?: boolean; email?: string };
    if (p.remember === true && typeof p.email === "string" && p.email.trim()) {
      return { remember: true, email: p.email.trim() };
    }
  } catch {
    /* ignore */
  }
  return null;
}

function persistLoginPrefs(remember: boolean, emailValue: string) {
  if (typeof window === "undefined") return;
  try {
    if (remember && emailValue.trim()) {
      localStorage.setItem(
        LOGIN_PREFS_KEY,
        JSON.stringify({ remember: true, email: emailValue.trim() }),
      );
    } else {
      localStorage.removeItem(LOGIN_PREFS_KEY);
    }
  } catch {
    /* ignore */
  }
}

export default function LoginClient() {
  const router = useRouter();
  const supabase = React.useMemo(() => createSupabaseClient(), []);

  const [mode, setMode] = React.useState<AuthMode>("signin");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [rememberLogin, setRememberLogin] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    const prefs = readStoredLoginPrefs();
    if (prefs) {
      setEmail(prefs.email);
      setRememberLogin(true);
    }
  }, []);

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
        persistLoginPrefs(rememberLogin, email);
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
        persistLoginPrefs(rememberLogin, email);
      }

      router.push("/onboarding/diagnosis");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 md:py-10">
      <div className="mx-auto w-full max-w-[430px]">
        <div className="rounded-2xl border border-slate-200 bg-white px-4 pb-7 pt-5 shadow-sm md:px-5 md:pb-8 md:pt-6">
            <div className="mx-auto my-3 w-full max-w-[314px] overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
              <img
                src="/login-hero-icon.svg"
                alt="光るラインとカルテの代替アイコン"
                className="block h-auto w-full"
              />
            </div>

            <h2 className="fc-page-title mt-3 text-center">
              未来からの処方箋
            </h2>
            <p className="fc-muted mt-1.5 text-center font-medium tracking-wide">
              Prescription from the Future
            </p>
            <p className="fc-card-title mt-4 text-center">
              「未来の君」からのアドバイスが、
            </p>
            <p className="fc-card-title text-center">
              今の君を変える
            </p>
            <p className="fc-lead mx-auto mt-2 max-w-[20rem] text-center font-medium">
              その記録が、明日を変える力になる
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setMode("signin")}
                className={`min-h-12 rounded-xl border py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40 md:text-[15px] ${
                  mode === "signin"
                    ? "border-sky-500 bg-sky-500 text-white shadow-sm shadow-sky-500/25"
                    : "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
                disabled={isLoading}
              >
                ログイン
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`min-h-12 rounded-xl border py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40 md:text-[15px] ${
                  mode === "signup"
                    ? "border-sky-500 bg-sky-500 text-white shadow-sm shadow-sky-500/25"
                    : "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
                disabled={isLoading}
              >
                初回登録
              </button>
            </div>

            <form
              className="mt-3"
              onSubmit={(e) => {
                e.preventDefault();
                void handleAuth();
              }}
            >
              <label htmlFor="email" className="fc-label mt-2 block">
                メールアドレス
              </label>
              <div className="mt-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                <div className="ml-0.5 text-base md:text-lg">📜</div>
                <input
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  autoComplete="email"
                  className="mt-1 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 md:text-[15px]"
                />
              </div>

              <label
                htmlFor="password"
                className="fc-label mt-3 block"
              >
                パスワード
              </label>
              <div className="mt-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                <div className="flex max-w-[52%] items-center justify-between text-base md:text-lg">
                  <span>🖋️</span>
                  <span>🧠</span>
                </div>
                <input
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  autoComplete="current-password"
                  className="mt-1 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 md:text-[15px]"
                />
              </div>

              <label className="fc-body mt-3 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 px-2 py-2 transition hover:bg-slate-100">
                <input
                  type="checkbox"
                  checked={rememberLogin}
                  onChange={(e) => {
                    const next = e.target.checked;
                    setRememberLogin(next);
                    if (!next) persistLoginPrefs(false, "");
                  }}
                  className="mt-0.5 h-5 w-5 shrink-0 rounded border-sky-500 text-sky-500 accent-sky-500 md:h-[22px] md:w-[22px]"
                  disabled={isLoading}
                />
                <span>
                  <span className="font-medium text-slate-900">ログイン条件を保持する</span>
                  <span className="fc-muted mt-0.5 block">
                    （メールアドレスのみこの端末に保存します。パスワードは保存しません）
                  </span>
                </span>
              </label>

              <button
                type="submit"
                disabled={isLoading}
                className="mb-10 mt-5 block min-h-14 w-full rounded-xl border border-sky-500 bg-sky-500 px-5 py-4 text-center text-base font-bold leading-snug text-white shadow-md shadow-sky-500/25 transition hover:bg-sky-600 disabled:opacity-50 md:mb-14 md:min-h-16 md:text-lg sm:py-5"
              >
                {isLoading ? "処理中…" : "未来の君に相談する"}
              </button>
            </form>
        </div>
      </div>
    </div>
  );
}

