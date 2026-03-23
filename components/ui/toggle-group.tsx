"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type ToggleGroupOption = {
  value: string;
  label: string;
};

export type ToggleGroupProps = {
  type?: "single";
  value: string | null;
  onValueChange: (value: string) => void;
  options: ToggleGroupOption[];
  className?: string;
  /** large: 合言葉など長文・誤タップ防止向け（高さ・余白を広げる） */
  size?: "default" | "large";
};

export function ToggleGroup({
  value,
  onValueChange,
  options,
  className,
  size = "default",
}: ToggleGroupProps) {
  const isLarge = size === "large";
  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2",
        isLarge ? "gap-4 sm:gap-5" : "gap-3 sm:gap-4",
        className
      )}
    >
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onValueChange(opt.value)}
            className={cn(
              "rounded-2xl border text-left font-medium transition-all shadow-sm",
              isLarge
                ? "min-h-[56px] px-5 py-4 text-base leading-snug active:scale-[0.99]"
                : "min-h-[48px] px-5 py-3.5 text-base leading-snug active:scale-[0.99]",
              selected
                ? "border-sky-400/90 bg-gradient-to-br from-sky-100 to-sky-50 text-sky-900 shadow-md ring-2 ring-sky-200/60"
                : "border-amber-200/70 bg-white/90 text-stone-700 hover:border-amber-300 hover:bg-amber-50/60 hover:shadow"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

