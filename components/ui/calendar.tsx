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
          caption_label: "text-sm font-medium",
          nav: "space-x-1 flex items-center",
          nav_button:
            "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 transition-opacity",
          table: "w-full border-collapse space-y-1",
          head_row: "flex",
          head_cell:
            "text-slate-500 font-normal text-[0.8rem] w-[14.28%] rounded-md",
          row: "flex w-full mt-2",
          cell: "w-[14.28%] h-9 relative",
          day: cn(
            "h-9 w-9 p-0 font-normal aria-selected:opacity-100 relative",
            "hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
          ),
          day_today:
            "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300",
          day_outside:
            "opacity-50 text-slate-400 dark:text-slate-600",
          day_disabled: "opacity-30",
          day_selected:
            "bg-indigo-600 text-white hover:bg-indigo-600 focus:bg-indigo-600",
          day_hidden: "invisible",
        }}
        {...props}
      />
    </div>
  );
}

