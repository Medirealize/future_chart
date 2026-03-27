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
            "text-lg font-semibold tracking-tight text-[#1C1E21] md:text-xl",
          nav: "flex items-center gap-2",
          button_previous:
            "absolute left-0 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#DADDE1] bg-white text-base text-[#4B4F56] shadow-sm transition-all hover:bg-[#F2F3F5] hover:text-[#1877F2] hover:shadow",
          button_next:
            "absolute right-0 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#DADDE1] bg-white text-base text-[#4B4F56] shadow-sm transition-all hover:bg-[#F2F3F5] hover:text-[#1877F2] hover:shadow",
          month_grid: "w-full border-collapse",
          weekdays: "grid grid-cols-7",
          weekday:
            "py-2.5 text-center text-sm font-semibold tracking-wide text-[#65676B] md:text-base",
          weeks: "mt-2 space-y-2",
          week: "grid grid-cols-7",
          day: "relative p-1 text-center",
          outside: "opacity-45 text-stone-400",
          disabled: "opacity-30",
          hidden: "invisible",
          day_button: cn(
            "mx-auto flex h-12 w-12 items-center justify-center rounded-full p-0 text-[1rem] font-semibold leading-none text-[#1C1E21] transition-colors md:h-12 md:w-12",
            "hover:bg-[#E7F3FF] hover:text-[#1877F2]"
          ),
          today:
            "bg-[#E7F3FF] text-[#1877F2] ring-2 ring-[#BCDDFD]",
          selected:
            "bg-[#1877F2] text-white shadow-md hover:bg-[#166FE5] focus:bg-[#166FE5] hover:text-white",
          day_today:
            "bg-[#E7F3FF] text-[#1877F2] ring-2 ring-[#BCDDFD]",
          day_selected:
            "bg-[#1877F2] text-white shadow-md hover:bg-[#166FE5] focus:bg-[#166FE5] hover:text-white",
        }}
        {...props}
      />
    </div>
  );
}

