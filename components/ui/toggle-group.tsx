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
};

export function ToggleGroup({
  value,
  onValueChange,
  options,
  className,
}: ToggleGroupProps) {
  return (
    <div className={cn("grid grid-cols-1 gap-2 sm:grid-cols-2", className)}>
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onValueChange(opt.value)}
            className={cn(
              "rounded-2xl border px-4 py-3 text-left text-sm font-medium transition-all shadow-sm",
              selected
                ? "border-sky-300/80 bg-gradient-to-br from-sky-100 to-sky-50 text-sky-900 shadow-md ring-1 ring-sky-200/50"
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

