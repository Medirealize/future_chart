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

            <h2 className="mb-0 mt-3 text-center text-[clamp(26px,6.5vw,40px)] font-extrabold leading-tight tracking-[0.02em] text-slate-900 [font-family:'Hiragino_Kaku_Gothic_ProN','Yu_Gothic_UI','Noto_Sans_JP',sans-serif]">
              未来からの処方箋
            </h2>
            <p className="mt-1.5 text-center text-[clamp(13px,3.2vw,16px)] font-medium tracking-[0.04em] text-slate-500">
              Prescription from the Future
            </p>
            <p className="mt-4 text-center text-[clamp(15px,3.8vw,19px)] font-bold leading-snug text-slate-900">
              「未来の君」からのアドバイスが、
            </p>
            <p className="text-center text-[clamp(15px,3.8vw,19px)] font-bold leading-snug text-slate-900">
              今の君を変える
            </p>
            <p className="mx-auto mt-2 max-w-[20rem] text-center text-[clamp(14px,3.4vw,17px)] leading-snug text-slate-600">
              その記録が、明日を変える力になる
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setMode("signin")}
                className={`min-h-[3rem] rounded-xl border py-2.5 text-[clamp(15px,3.6vw,19px)] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40 ${
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
                className={`min-h-[3rem] rounded-xl border py-2.5 text-[clamp(15px,3.6vw,19px)] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40 ${
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
              <label htmlFor="email" className="mt-2 block text-[clamp(14px,3.5vw,17px)] font-semibold text-slate-700">
                メールアドレス
              </label>
              <div className="mt-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                <div className="ml-0.5 text-[clamp(16px,4vw,22px)]">📜</div>
                <input
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  autoComplete="email"
                  className="mt-1 min-h-[2.6rem] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                  style={{ fontSize: "clamp(16px, 3.6vw, 18px)" }}
                />
              </div>

              <label
                htmlFor="password"
                className="mt-3 block text-[clamp(14px,3.5vw,17px)] font-semibold text-slate-700"
              >
                パスワード
              </label>
              <div className="mt-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                <div className="flex max-w-[52%] items-center justify-between text-[clamp(16px,4vw,22px)]">
                  <span>🖋️</span>
                  <span>🧠</span>
                </div>
                <input
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  autoComplete="current-password"
                  className="mt-1 min-h-[2.6rem] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                  style={{ fontSize: "clamp(16px, 3.6vw, 18px)" }}
                />
              </div>

              <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 px-2 py-2 text-[clamp(14px,3.4vw,16px)] leading-snug text-slate-700 transition hover:bg-slate-100">
                <input
                  type="checkbox"
                  checked={rememberLogin}
                  onChange={(e) => {
                    const next = e.target.checked;
                    setRememberLogin(next);
                    if (!next) persistLoginPrefs(false, "");
                  }}
                  className="mt-0.5 h-[clamp(18px,4.5vw,22px)] w-[clamp(18px,4.5vw,22px)] shrink-0 rounded border-sky-500 text-sky-500 accent-sky-500"
                  disabled={isLoading}
                />
                <span>
                  <span className="font-medium text-slate-900">ログイン条件を保持する</span>
                  <span className="mt-0.5 block text-[clamp(12px,3vw,14px)] leading-snug text-slate-500">
                    （メールアドレスのみこの端末に保存します。パスワードは保存しません）
                  </span>
                </span>
              </label>

              <button
                type="submit"
                disabled={isLoading}
                className="mb-[clamp(42px,8.5vw,56px)] mt-5 block w-full rounded-xl border border-sky-500 bg-sky-500 px-5 py-4 text-center font-bold leading-snug text-white shadow-md shadow-sky-500/25 transition hover:bg-sky-600 disabled:opacity-50 sm:py-5"
                style={{
                  fontSize: "clamp(1.25rem, 4.8vw, 1.625rem)",
                  minHeight: "clamp(3.5rem, 12vw, 4.75rem)",
                }}
              >
                {isLoading ? "処理中…" : "未来の君に相談する"}
              </button>
            </form>
        </div>
      </div>
    </div>
  );
}

