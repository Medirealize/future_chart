import { clearCachedCoreValue } from "@/utils/core-value-sync";

/** ログアウト時にブラウザ側の下書き・オンボーディングキャッシュ等を消す */
export function clearClientAppStores() {
  try {
    const draftKeys = Object.keys(localStorage).filter((k) =>
      k.startsWith("entry_draft_")
    );
    for (const key of draftKeys) localStorage.removeItem(key);
    localStorage.removeItem("onboarding_diagnosis");
    localStorage.removeItem("onboarding_future");
    clearCachedCoreValue();
  } catch {
    // ignore
  }
  try {
    sessionStorage.clear();
  } catch {
    // ignore
  }
}
