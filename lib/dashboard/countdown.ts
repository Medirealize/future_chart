import {
  addMonths,
  addYears,
  differenceInCalendarDays,
  differenceInMonths,
  differenceInYears,
  isBefore,
  startOfDay,
} from "date-fns";

/** DBの date / timestamptz など先頭10文字が YYYY-MM-DD ならローカル日の0:00として解釈 */
export function parseDateOnlyLocal(iso: string): Date {
  const datePart = String(iso).trim().slice(0, 10);
  const parts = datePart.split("-").map((x) => Number(x));
  const y = parts[0];
  const m = parts[1];
  const d = parts[2];
  if (!y || !m || !d || parts.some((n) => !Number.isFinite(n))) {
    throw new Error("Invalid date string");
  }
  return startOfDay(new Date(y, m - 1, d));
}

/** 表示・計算用に生年月日を YYYY-MM-DD に正規化（未設定は null） */
export function normalizeBirthDateString(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m?.[1] ?? null;
}

/**
 * カレンダー日「from」から目標日「goal」までの残りを 年・月・日 で返す（日付境界は startOfDay で揃える）
 */
export function computeTimeLeftYearsMonthsDays(
  from: Date,
  goal: Date
): { years: number; months: number; days: number } {
  const fromD = startOfDay(from);
  const goalD = startOfDay(goal);
  if (isBefore(goalD, fromD)) return { years: 0, months: 0, days: 0 };
  const years = Math.max(0, differenceInYears(goalD, fromD));
  const afterYears = addYears(fromD, years);
  const months = Math.max(0, differenceInMonths(goalD, afterYears));
  const afterMonths = addMonths(afterYears, months);
  const days = Math.max(0, differenceInCalendarDays(goalD, afterMonths));
  return { years, months, days };
}
