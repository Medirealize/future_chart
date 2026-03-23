import {
  addMonths,
  addYears,
  differenceInCalendarDays,
  differenceInMonths,
  differenceInYears,
  isBefore,
  startOfDay,
} from "date-fns";

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
