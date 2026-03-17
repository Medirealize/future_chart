/** 程度: ひどい / そこそこ / すこし */
export type Severity = 'high' | 'mid' | 'low';

/** いつから */
export type TimeRange =
  | 'just_now'
  | 'today'
  | 'yesterday'
  | 'week_1'
  | 'week_2'
  | 'week_3'
  | 'weeks_ago'
  | 'months_ago';

/** 症状タイプ（仕様に合わせたID） */
export type SymptomType =
  | 'fever'           // 発熱（体温とセット）
  | 'mood'            // 機嫌 😊/😐/😫
  | 'cough'           // 咳
  | 'runny_nose'      // 鼻水
  | 'soft_stool'      // 軟便
  | 'watery_stool'    // 水様便
  | 'nausea'          // 吐き気
  | 'vomit'           // 嘔吐
  | 'appetite'        // 食欲 食べれる/半分/水分のみ
  | 'rash'            // 発疹（その他）
  | 'pain'            // 痛み（その他）
  | 'itch';           // かゆみ（その他）

/** 機嫌の値 */
export type MoodValue = 'good' | 'normal' | 'bad';

/** 食欲の値 */
export type AppetiteValue = 'eat' | 'half' | 'water_only';

/** 1件の症状ログ */
export interface SymptomLog {
  id: string;
  timestamp: string; // ISO
  timeRange: TimeRange;
  type: SymptomType;
  severity: Severity;
  /** 発熱時は体温 (35.0-41.0) */
  value?: string;
  /** 機嫌: good / normal / bad */
  mood?: MoodValue;
  /** 食欲: eat / half / water_only */
  appetite?: AppetiteValue;
}

/** 家族メンバー */
export interface FamilyMember {
  id: string;
  name: string;
  /** 生年で表示用（長男・長女 等） */
  birthYear?: number;
  gender?: 'male' | 'female' | 'other';
  allergy: string; // アレルギー（なしの場合は「なし」等）
}

/** 要約APIに渡す患者情報 */
export interface PatientInfo {
  name: string;
  age?: string;
  gender?: string;
  allergies: string;
}

/** 要約APIに渡すコンテキスト */
export interface SummaryContext {
  appetite?: string;
  mood?: string;
  epidemic?: string;
}

/** 要約APIに渡すログ行 */
export interface SummaryLogEntry {
  time: string;
  symptom: string;
  severity: string;
}
