/** 合言葉を設定画面保存直後に日記画面へ即時反映するためのキー */
export const CORE_VALUE_STORAGE_KEY = "futurechart_core_value";

/** 同一タブ内で Calendar 等が購読する更新イベント */
export const CORE_VALUE_UPDATED_EVENT = "futurechart:core-value-updated";

export type CoreValueUpdatedDetail = { coreValue: string };

export function readCachedCoreValue(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(CORE_VALUE_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function writeCachedCoreValue(coreValue: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CORE_VALUE_STORAGE_KEY, coreValue);
  } catch {
    // ignore
  }
}

export function clearCachedCoreValue() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(CORE_VALUE_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function broadcastCoreValueUpdate(coreValue: string) {
  writeCachedCoreValue(coreValue);
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<CoreValueUpdatedDetail>(CORE_VALUE_UPDATED_EVENT, {
      detail: { coreValue },
    })
  );
}
