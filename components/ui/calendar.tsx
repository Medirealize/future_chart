"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
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
        className={cn("w-full p-3", className)}
        classNames={{
          months: "flex w-full flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0",
          month: "space-y-4 w-full",
          caption: "flex justify-center pt-1 relative items-center",
          caption_label:
            "text-base font-semibold tracking-tight text-stone-800",
          nav: "gap-2 flex items-center",
          nav_button:
            "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-200/60 bg-white/80 text-base text-stone-600 shadow-sm transition-all hover:bg-amber-50/80 hover:text-sky-700 hover:shadow",
          table: "w-full border-collapse space-y-1",
          head_row: "flex",
          head_cell:
            "text-stone-500 font-medium text-xs w-[14.28%] rounded-lg py-2 uppercase tracking-wide",
          row: "flex w-full mt-3",
          cell: "relative flex w-[14.28%] min-h-[3.25rem] items-center justify-center p-1",
          day: cn(
            "flex h-11 w-11 items-center justify-center p-0 text-sm font-medium aria-selected:opacity-100",
            "rounded-full text-stone-700 transition-colors",
            "hover:bg-amber-100/70 hover:text-stone-900"
          ),
          day_today:
            "bg-sky-100/90 text-sky-800 ring-2 ring-sky-200/60 ring-offset-2 ring-offset-[#FFFBF7]",
          day_outside: "opacity-45 text-stone-400",
          day_disabled: "opacity-30",
          day_selected:
            "bg-sky-500 text-white shadow-md hover:bg-sky-500 focus:bg-sky-500 hover:text-white",
          day_hidden: "invisible",
        }}
        {...props}
      />
    </div>
  );
}

