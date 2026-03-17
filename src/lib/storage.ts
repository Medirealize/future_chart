import type { FamilyMember, SymptomLog } from './types';

const FAMILY_KEY = 'symptom-block-family';
const FAMILY_VERSION_KEY = 'symptom-block-family-version';
const LOGS_KEY_PREFIX = 'symptom-block-logs-';
const ARCHIVE_KEY_PREFIX = 'symptom-block-archive-';

/** ストレージのバージョン（上げると既存の家族データを破棄して「自分」1人にリセット） */
const CURRENT_FAMILY_VERSION = '6';

/** 初回用：自分1人のみ（個人用・2人目以降は＋で追加） */
export const DEFAULT_FAMILY: FamilyMember[] = [
  { id: 'self', name: '自分', allergy: 'なし' },
];

function forceResetFamily(): FamilyMember[] {
  const reset = [...DEFAULT_FAMILY];
  localStorage.removeItem(FAMILY_KEY);
  localStorage.setItem(FAMILY_VERSION_KEY, CURRENT_FAMILY_VERSION);
  localStorage.setItem(FAMILY_KEY, JSON.stringify(reset));
  return reset;
}

export function generateMemberId(): string {
  return `member-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getLogsKey(memberId: string): string {
  return `${LOGS_KEY_PREFIX}${memberId}`;
}

export function loadFamily(): FamilyMember[] {
  if (typeof window === 'undefined') return [...DEFAULT_FAMILY];
  try {
    const version = localStorage.getItem(FAMILY_VERSION_KEY);
    if (version !== CURRENT_FAMILY_VERSION) {
      return forceResetFamily();
    }
    const raw = localStorage.getItem(FAMILY_KEY);
    if (!raw) return [...DEFAULT_FAMILY];
    const parsed = JSON.parse(raw) as FamilyMember[];
    if (!Array.isArray(parsed) || parsed.length === 0) return [...DEFAULT_FAMILY];
    return parsed;
  } catch {
    return forceResetFamily();
  }
}

export function saveFamily(members: FamilyMember[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(FAMILY_KEY, JSON.stringify(members));
}

export function loadLogs(memberId: string): SymptomLog[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(getLogsKey(memberId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SymptomLog[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLogs(memberId: string, logs: SymptomLog[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(getLogsKey(memberId), JSON.stringify(logs));
}

/** 48時間経過したログをリセットし、要約のみアーカイブに保存 */
export function archiveOldLogs(memberId: string): { archived: boolean; count: number } {
  if (typeof window === 'undefined') return { archived: false, count: 0 };
  const logs = loadLogs(memberId);
  const now = Date.now();
  const ms48h = 48 * 60 * 60 * 1000;
  const recent: SymptomLog[] = [];
  let count = 0;
  for (const log of logs) {
    const t = new Date(log.timestamp).getTime();
    if (now - t <= ms48h) recent.push(log);
    else count++;
  }
  if (count === 0) return { archived: false, count: 0 };
  saveLogs(memberId, recent);
  const archiveKey = `${ARCHIVE_KEY_PREFIX}${memberId}-${Date.now()}`;
  const toArchive = logs.filter((l) => !recent.some((r) => r.id === l.id));
  localStorage.setItem(archiveKey, JSON.stringify({ date: new Date().toISOString(), logs: toArchive }));
  return { archived: true, count };
}
