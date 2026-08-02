import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("bg-white border border-ink/10 rounded-xl p-5 shadow-sm", className || "")}
      {...props}
    />
  );
}
