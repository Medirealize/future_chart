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
  size?: "default" | "large" | "xlarge";
};

export function ToggleGroup({
  value,
  onValueChange,
  options,
  className,
  size = "default",
}: ToggleGroupProps) {
  const isLarge = size === "large";
  const isXLarge = size === "xlarge";
  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2",
        isXLarge ? "gap-4 sm:gap-5" : isLarge ? "gap-4 sm:gap-5" : "gap-3 sm:gap-4",
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
            style={isXLarge ? { fontSize: "1.5rem", fontWeight: 700 } : undefined}
            className={cn(
              "rounded-2xl border font-semibold transition-all shadow-sm",
              isXLarge
                ? "flex min-h-[5.25rem] w-full items-center justify-center px-5 py-4 text-center leading-tight active:scale-[0.98] sm:min-h-[5.75rem] sm:px-6 sm:py-5"
                : isLarge
                  ? "min-h-[56px] px-5 py-4 text-left text-base leading-snug active:scale-[0.99]"
                  : "min-h-[48px] px-5 py-3.5 text-left text-base leading-snug active:scale-[0.99]",
              isXLarge && selected
                ? "border-sky-900 bg-sky-800 text-white shadow-lg ring-2 ring-sky-950/40 hover:bg-sky-900 hover:text-white"
                : isXLarge
                  ? "border-amber-300/90 bg-white text-stone-800 hover:border-amber-400 hover:bg-amber-50/90 hover:shadow-md"
                  : selected
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

