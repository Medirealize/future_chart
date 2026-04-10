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
            style={isXLarge ? { fontSize: "1.25rem", fontWeight: 700 } : undefined}
            className={cn(
              "rounded-2xl border font-semibold transition-all shadow-sm",
              isXLarge
                ? "flex min-h-[4.25rem] w-full items-center justify-center rounded-xl px-5 py-3 text-center leading-tight active:scale-[0.98] sm:min-h-[4.5rem] sm:px-6 sm:py-3.5"
                : isLarge
                  ? "min-h-[56px] px-5 py-4 text-left text-base leading-snug active:scale-[0.99]"
                  : "min-h-[48px] px-5 py-3.5 text-left text-base leading-snug active:scale-[0.99]",
              isXLarge && selected
                ? "border-primary bg-primary text-primary-foreground shadow-md ring-2 ring-ring hover:bg-primary/90 hover:text-primary-foreground"
                : isXLarge
                  ? "border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground hover:shadow-sm"
                  : selected
                    ? "border-primary bg-accent text-accent-foreground shadow-sm ring-2 ring-ring"
                    : "border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground hover:shadow-sm"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

