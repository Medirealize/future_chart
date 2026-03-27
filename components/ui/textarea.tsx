"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, ...props },
  ref
) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[100px] w-full rounded-lg border border-[#CCD0D5] bg-white px-3.5 py-2.5 text-[15px] text-[#1C1E21] shadow-sm transition-colors placeholder:text-[#8A8D91] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1877F2]/35 focus-visible:border-[#1877F2] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
});

