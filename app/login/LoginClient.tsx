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
    <div className="min-h-screen bg-[radial-gradient(circle_at_85%_95%,rgba(255,230,206,0.55),transparent_36%),linear-gradient(165deg,#c7e1f8_0%,#e4f1fd_48%,#ffffff_100%)] px-3 py-2">
      <div className="mx-auto w-full max-w-[430px]">
        <div className="mx-auto w-full max-w-[390px] rounded-[32px] border-2 border-[#3a3a3a] bg-[linear-gradient(165deg,rgba(252,253,255,0.58),rgba(245,247,251,0.68))] px-2.5 pb-9 pt-5 shadow-[inset_0_10px_22px_rgba(187,206,225,0.3),0_12px_26px_rgba(133,155,176,0.2)]">
            <div className="mx-auto my-3 w-full max-w-[314px] overflow-hidden rounded-xl bg-[linear-gradient(140deg,rgba(229,236,246,0.4),rgba(216,226,238,0.32))]">
              <img
                src="/login-hero-icon.svg"
                alt="光るラインとカルテの代替アイコン"
                className="block h-auto w-full"
              />
            </div>

            <h2 className="mb-0 mt-3 text-center text-[clamp(26px,6.5vw,40px)] font-extrabold leading-tight tracking-[0.02em] text-[#111] [font-family:'Hiragino_Kaku_Gothic_ProN','Yu_Gothic_UI','Noto_Sans_JP',sans-serif]">
              未来からの処方箋
            </h2>
            <p className="mt-1.5 text-center text-[clamp(13px,3.2vw,16px)] font-medium tracking-[0.04em] text-[#3d3d3d]">
              Prescription from the Future
            </p>
            <p className="mt-4 text-center text-[clamp(15px,3.8vw,19px)] font-bold leading-snug text-[#111]">
              「未来の君」からのアドバイスが、
            </p>
            <p className="text-center text-[clamp(15px,3.8vw,19px)] font-bold leading-snug text-[#111]">
              今の君を変える
            </p>
            <p className="mx-auto mt-2 max-w-[20rem] text-center text-[clamp(14px,3.4vw,17px)] leading-snug text-[#333]">
              その記録が、明日を変える力になる
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setMode("signin")}
                className={`min-h-[3rem] rounded-[10px] border border-[#eef1f5] py-2.5 text-[clamp(15px,3.6vw,19px)] font-semibold text-[#1b1c1e] ${
                  mode === "signin" ? "bg-[#b8d7fa]" : "bg-[#e6e7eb]"
                }`}
                disabled={isLoading}
              >
                ログイン
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`min-h-[3rem] rounded-[10px] border border-[#eef1f5] py-2.5 text-[clamp(15px,3.6vw,19px)] font-semibold text-[#1b1c1e] ${
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
              <label htmlFor="email" className="mt-2 block text-[clamp(14px,3.5vw,17px)] font-semibold text-[#111]">
                メールアドレス
              </label>
              <div className="ml-2 mt-0.5 text-[clamp(16px,4vw,22px)]">📜</div>
              <input
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                autoComplete="email"
                className="min-h-[2.75rem] w-full rounded-full border-2 border-[#b4ccdf] bg-[rgba(248,251,255,0.9)] px-4 py-2.5 outline-none focus:border-[#8db4d2] focus:shadow-[0_0_0_3px_rgba(131,175,205,0.18)]"
                style={{ fontSize: "clamp(16px, 3.6vw, 18px)" }}
              />

              <label
                htmlFor="password"
                className="mt-2 block text-[clamp(14px,3.5vw,17px)] font-semibold text-[#111]"
              >
                パスワード
              </label>
              <div className="mt-0.5 flex max-w-[52%] items-center justify-between text-[clamp(16px,4vw,22px)]">
                <span>🖋️</span>
                <span>🧠</span>
              </div>
              <input
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                autoComplete="current-password"
                className="min-h-[2.75rem] w-full rounded-full border-2 border-[#b4ccdf] bg-[rgba(248,251,255,0.9)] px-4 py-2.5 outline-none focus:border-[#8db4d2] focus:shadow-[0_0_0_3px_rgba(131,175,205,0.18)]"
                style={{ fontSize: "clamp(16px, 3.6vw, 18px)" }}
              />

              <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-xl border border-transparent px-1 py-1 text-[clamp(14px,3.4vw,16px)] leading-snug text-[#2b2b2b] transition hover:bg-white/40">
                <input
                  type="checkbox"
                  checked={rememberLogin}
                  onChange={(e) => {
                    const next = e.target.checked;
                    setRememberLogin(next);
                    if (!next) persistLoginPrefs(false, "");
                  }}
                  className="mt-0.5 h-[clamp(18px,4.5vw,22px)] w-[clamp(18px,4.5vw,22px)] shrink-0 rounded border-[#7fb0d1] text-[#3e7fa8] accent-[#5a9fd4]"
                  disabled={isLoading}
                />
                <span>
                  <span className="font-medium text-[#111]">ログイン条件を保持する</span>
                  <span className="mt-0.5 block text-[clamp(12px,3vw,14px)] leading-snug text-[#555]">
                    （メールアドレスのみこの端末に保存します。パスワードは保存しません）
                  </span>
                </span>
              </label>

              <button
                type="submit"
                disabled={isLoading}
                className="mb-[clamp(42px,8.5vw,56px)] mt-5 block w-full rounded-full border-2 border-[#5a9fd4] bg-[linear-gradient(180deg,rgba(226,241,252,0.98),rgba(198,222,242,0.98))] px-5 py-4 text-center font-bold leading-snug text-[#2d6a8f] shadow-[0_8px_18px_rgba(80,130,170,0.22)] transition hover:brightness-[1.03] disabled:opacity-50 sm:py-5"
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

