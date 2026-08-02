import { cn } from "@/lib/utils";
import { InputHTMLAttributes } from "react";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full px-3 py-2 rounded-lg border border-ink/20 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gold/50",
        className || ""
      )}
      {...props}
    />
  );
}
