import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
};

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  return (
    <button
      suppressHydrationWarning
      className={cn(
        "px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50",
        variant === "primary" ? "bg-ink text-white hover:bg-ink/90" : "border border-ink/20 hover:bg-ink/5",
        className || ""
      )}
      {...props}
    />
  );
}
