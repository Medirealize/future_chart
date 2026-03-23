"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import { ja } from "react-day-picker/locale";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

/**
 * shadcn/ui風 Calendar ラッパー（DayPickerをそのまま利用）
 * dot 等のカスタムは pages 側で `components` / `modifiers` を使って注入します。
 */
export function Calendar({ className, ...props }: CalendarProps) {
  return (
    <div className={cn("w-full", className)}>
      <DayPicker
        locale={ja}
        className={cn("w-full p-3", className)}
        classNames={{
          months: "flex w-full flex-col gap-4 sm:flex-row",
          month: "w-full space-y-4",
          month_caption: "relative flex items-center justify-center pt-1",
          caption_label:
            "text-base font-semibold tracking-tight text-stone-800",
          nav: "flex items-center gap-2",
          button_previous:
            "absolute left-0 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-amber-200/60 bg-white/80 text-base text-stone-600 shadow-sm transition-all hover:bg-amber-50/80 hover:text-sky-700 hover:shadow",
          button_next:
            "absolute right-0 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-amber-200/60 bg-white/80 text-base text-stone-600 shadow-sm transition-all hover:bg-amber-50/80 hover:text-sky-700 hover:shadow",
          month_grid: "w-full border-collapse",
          weekdays: "grid grid-cols-7",
          weekday:
            "py-2 text-center text-xs font-medium tracking-wide text-stone-500",
          weeks: "mt-2 space-y-2",
          week: "grid grid-cols-7",
          day: "relative p-1 text-center",
          outside: "opacity-45 text-stone-400",
          disabled: "opacity-30",
          hidden: "invisible",
          day_button: cn(
            "mx-auto flex h-11 w-11 items-center justify-center rounded-full p-0 text-sm font-medium text-stone-700 transition-colors",
            "hover:bg-amber-100/70 hover:text-stone-900"
          ),
          today:
            "bg-sky-100/90 text-sky-800 ring-2 ring-sky-200/60 ring-offset-2 ring-offset-[#FFFBF7]",
          selected:
            "bg-sky-500 text-white shadow-md hover:bg-sky-500 focus:bg-sky-500 hover:text-white",
          day_today:
            "bg-sky-100/90 text-sky-800 ring-2 ring-sky-200/60 ring-offset-2 ring-offset-[#FFFBF7]",
          day_selected:
            "bg-sky-500 text-white shadow-md hover:bg-sky-500 focus:bg-sky-500 hover:text-white",
        }}
        {...props}
      />
    </div>
  );
}

