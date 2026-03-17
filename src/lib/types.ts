/** 程度: ひどい / そこそこ / すこし */
export type Severity = 'high' | 'mid' | 'low';

/** いつから */
export type TimeRange =
  | 'just_now'
  | 'today'
  | 'yesterday'
  | 'day_2'
  | 'day_3'
  | 'day_4'
  | 'day_5'
  | 'day_6'
  | 'week_1'
  | 'week_2'
  | 'week_3'
  | 'month_1'
  | 'month_2'
  | 'month_3'
  | 'month_4'
  | 'month_5'
  | 'month_6_plus';

/** 症状タイプ（仕様に合わせたID） */
export type SymptomType =
  | 'fever'           // 発熱（体温とセット）
  | 'fatigue'         // だるい（全身）
  | 'mood'            // 機嫌 😊/😐/😫
  | 'cough'           // 咳
  | 'sputum'          // 痰絡み（呼吸）
  | 'sore_throat'     // 咽頭痛（呼吸）
  | 'runny_nose'      // 鼻水
  | 'soft_stool'      // 軟便
  | 'watery_stool'    // 水様便
  | 'nausea'          // 吐き気
  | 'vomit'           // 嘔吐
  | 'appetite'        // 食欲 食べれる/半分/水分のみ
  | 'abdominal_pain'  // 腹痛（消化器）
  | 'back_pain'       // 背部痛（消化器）
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
  timeRange: string;
  symptom: string;
  severity: string;
}
