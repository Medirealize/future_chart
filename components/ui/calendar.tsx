"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import { ja } from "react-day-picker/locale";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

/**
 * shadcn/ui 風 Calendar（v0 / デザイントークン準拠）
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
          caption_label: "text-sm font-medium text-foreground md:text-base",
          nav: "flex items-center gap-1",
          button_previous:
            "absolute left-0 inline-flex size-9 items-center justify-center rounded-md border border-border bg-background p-0 text-foreground opacity-80 transition hover:opacity-100",
          button_next:
            "absolute right-0 inline-flex size-9 items-center justify-center rounded-md border border-border bg-background p-0 text-foreground opacity-80 transition hover:opacity-100",
          month_grid: "w-full border-collapse",
          weekdays: "grid grid-cols-7",
          weekday: "py-2 text-center text-xs font-medium text-muted-foreground md:text-sm",
          weeks: "mt-2 space-y-2",
          week: "grid grid-cols-7",
          day: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
          outside: "text-muted-foreground/50",
          disabled: "text-muted-foreground/30",
          hidden: "invisible",
          day_button: cn(
            "mx-auto flex size-9 items-center justify-center rounded-md p-0 font-normal text-foreground transition-colors",
            "hover:bg-accent hover:text-accent-foreground",
            "[[data-selected-single=true]_&]:bg-primary [[data-selected-single=true]_&]:text-primary-foreground [[data-selected-single=true]_&]:hover:bg-primary/90"
          ),
          today: "bg-accent text-accent-foreground data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground",
          selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
          day_today: "bg-accent text-accent-foreground",
          day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
        }}
        {...props}
      />
    </div>
  );
}
