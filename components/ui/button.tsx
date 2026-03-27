"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1877F2]/40 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-[#1877F2] text-white hover:bg-[#166FE5]",
        outline:
          "border border-[#CED0D4] bg-white text-[#1C1E21] hover:bg-[#F2F3F5]",
        secondary:
          "bg-[#E4E6EB] text-[#1C1E21] hover:bg-[#D8DBE1]",
        ghost:
          "text-[#1C1E21] hover:bg-[#F0F2F5]",
      },
      size: {
        sm: "h-9 px-3",
        md: "h-11 px-4.5",
        lg: "h-12 px-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

