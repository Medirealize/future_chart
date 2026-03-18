import type { SymptomLog, FamilyMember, SummaryLogEntry, TimeRange } from './types';
import { SYMPTOM_LABELS, MOOD_OPTIONS, APPETITE_OPTIONS, SEVERITY_OPTIONS, TIME_RANGE_OPTIONS } from './constants';

function symptomLabel(log: SymptomLog): string {
  if (log.type === 'fever' && log.value) return `発熱 ${log.value}℃`;
  if (log.type === 'mood' && log.mood) {
    const m = MOOD_OPTIONS.find((o) => o.value === log.mood);
    return m ? `機嫌 ${m.emoji}` : '機嫌';
  }
  if (log.type === 'appetite' && log.appetite) {
    const a = APPETITE_OPTIONS.find((o) => o.value === log.appetite);
    return a ? `食欲 ${a.label}` : '食欲';
  }
  return SYMPTOM_LABELS[log.type];
}

function severityLabel(s: string): string {
  return SEVERITY_OPTIONS.find((o) => o.id === s)?.label ?? s;
}

function timeRangeLabel(v: string): string {
  return TIME_RANGE_OPTIONS.find((o) => o.value === v)?.label ?? v;
}

/** 主訴：程度が「ひどい」かつ最新のものを1つ。2つ目は任意（ここでは未使用で1つのみ自動） */
export function getChiefComplaintAuto(logs: SymptomLog[]): string[] {
  const sorted = [...logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const high = sorted.filter((l) => l.severity === 'high');
  const first = high[0] ? symptomLabel(high[0]) : '';
  const second = high[1] ? symptomLabel(high[1]) : '';
  return [first || '（なし）', second || ''];
}

/** 発症時期（いつから）が古いほど小さい番号＝一覧の上に来る */
const ONSET_ORDER: Record<TimeRange, number> = {
  month_6_plus: 0,
  month_5: 1,
  month_4: 2,
  month_3: 3,
  month_2: 4,
  month_1: 5,
  week_3: 6,
  week_2: 7,
  week_1: 8,
  day_6: 9,
  day_5: 10,
  day_4: 11,
  day_3: 12,
  day_2: 13,
  yesterday: 14,
  today: 15,
  just_now: 16,
};

function onsetOrder(tr: string): number {
  return ONSET_ORDER[tr as TimeRange] ?? 99;
}

/** 診察メモ用：発症時期が古い順（同じ時期は記録時刻の古い順） */
export function sortLogsByOnsetOldestFirst(logs: SymptomLog[]): SymptomLog[] {
  return [...logs].sort((a, b) => {
    const oa = onsetOrder(a.timeRange);
    const ob = onsetOrder(b.timeRange);
    if (oa !== ob) return oa - ob;
    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
  });
}

/** 診察メモ「経過の要約」用テキスト（発症時期の古い順・改行区切り） */
export function buildDoctorSummaryFromLogs(logs: SymptomLog[]): string {
  const sorted = sortLogsByOnsetOldestFirst(logs);
  if (sorted.length === 0) return '記録がありません。';
  return sorted
    .map(
      (l) =>
        `・${timeRangeLabel(l.timeRange)}：${symptomLabel(l)}（${severityLabel(l.severity)}）`
    )
    .join('\n');
}

/** API用のログ配列（発症時期の古い順＝要約入力も同じ並び） */
export function toSummaryLogs(logs: SymptomLog[]): SummaryLogEntry[] {
  const sorted = sortLogsByOnsetOldestFirst(logs);
  return sorted.map((l) => ({
    timeRange: timeRangeLabel(l.timeRange),
    symptom: symptomLabel(l),
    severity: severityLabel(l.severity),
  }));
}

/** 周辺情報：直近の食欲・機嫌を抽出 */
export function getContextFromLogs(logs: SymptomLog[]): { appetite?: string; mood?: string; epidemic?: string } {
  const sorted = [...logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  let appetite: string | undefined;
  let mood: string | undefined;
  for (const l of sorted) {
    if (l.type === 'appetite' && l.appetite && !appetite) {
      const a = APPETITE_OPTIONS.find((o) => o.value === l.appetite);
      appetite = a?.label;
    }
    if (l.type === 'mood' && l.mood && !mood) {
      const m = MOOD_OPTIONS.find((o) => o.value === l.mood);
      mood = m?.label ?? m?.emoji;
    }
    if (appetite && mood) break;
  }
  return { appetite, mood, epidemic: undefined };
}

/** 医師画面用の周辺情報テキスト行 */
export function getContextLines(logs: SymptomLog[]): string[] {
  const ctx = getContextFromLogs(logs);
  const lines: string[] = [];
  if (ctx.appetite) lines.push(`食欲：${ctx.appetite}`);
  if (ctx.mood) lines.push(`機嫌：${ctx.mood}`);
  if (ctx.epidemic) lines.push(`周囲：${ctx.epidemic}`);
  return lines;
}

export function getPatientInfo(member: FamilyMember): { name: string; age?: string; gender?: string; allergies: string } {
  const age = member.birthYear
    ? `${new Date().getFullYear() - member.birthYear}歳`
    : undefined;
  const gender =
    member.gender === 'male' ? '男' : member.gender === 'female' ? '女' : undefined;
  return {
    name: member.name,
    age,
    gender,
    allergies: member.allergy,
  };
}
