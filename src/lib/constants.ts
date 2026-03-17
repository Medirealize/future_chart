import type { SymptomType, MoodValue, AppetiteValue } from './types';

/** 症状タイプ → 表示ラベル */
export const SYMPTOM_LABELS: Record<SymptomType, string> = {
  fever: '発熱',
  mood: '機嫌',
  cough: '咳',
  runny_nose: '鼻水',
  soft_stool: '軟便',
  watery_stool: '水様便',
  nausea: '吐き気',
  vomit: '嘔吐',
  appetite: '食欲低下',
  rash: '発疹',
  pain: '痛み',
  itch: 'かゆみ',
};

/** 機嫌の表示 */
export const MOOD_OPTIONS: { value: MoodValue; label: string; emoji: string }[] = [
  { value: 'good', label: '良い', emoji: '😊' },
  { value: 'normal', label: '普通', emoji: '😐' },
  { value: 'bad', label: '悪い', emoji: '😫' },
];

/** 食欲の表示 */
export const APPETITE_OPTIONS: { value: AppetiteValue; label: string }[] = [
  { value: 'eat', label: '食べれる' },
  { value: 'half', label: '半分' },
  { value: 'water_only', label: '水分のみ' },
];

/** いつから */
export const TIME_RANGE_OPTIONS: { value: import('./types').TimeRange; label: string }[] = [
  { value: 'just_now', label: 'さっきから' },
  { value: 'today', label: '今日から' },
  { value: 'yesterday', label: '昨日から' },
  { value: 'week_1', label: '1週間前から' },
  { value: 'week_2', label: '2週間前から' },
  { value: 'week_3', label: '3週間前から' },
  { value: 'weeks_ago', label: '数週間前から' },
  { value: 'months_ago', label: '何ヶ月か前から' },
];

/** 程度 */
export const SEVERITY_OPTIONS: { id: 'high' | 'mid' | 'low'; label: string; color: string; activeClass: string }[] = [
  // 選択中は「枠のみ（中は透明）」にして視認性を上げる
  { id: 'low', label: 'すこし', color: 'bg-transparent text-blue-700 border border-blue-300', activeClass: 'bg-transparent text-blue-700 border-2 border-blue-600 ring-2 ring-blue-200' },
  { id: 'mid', label: 'そこそこ', color: 'bg-transparent text-amber-800 border border-amber-300', activeClass: 'bg-transparent text-amber-800 border-2 border-amber-600 ring-2 ring-amber-200' },
  { id: 'high', label: 'ひどい', color: 'bg-transparent text-red-700 border border-red-300', activeClass: 'bg-transparent text-red-700 border-2 border-red-600 ring-2 ring-red-200' },
];

/** 体温 35.0 ～ 41.0 を 0.1 刻み */
export const TEMPERATURES = Array.from({ length: 61 }, (_, i) => (35 + i * 0.1).toFixed(1));
