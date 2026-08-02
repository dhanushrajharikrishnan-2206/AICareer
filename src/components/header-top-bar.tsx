"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { Sparkles, ShieldCheck } from "lucide-react";

export function HeaderTopBar() {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800/80 px-6 py-2.5 flex items-center justify-between transition-colors shadow-2xs">
      {/* Left Badge */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" /> Career Pulse AI Studio
        </span>
        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Database Synced
        </span>
      </div>

      {/* Right Top Webpage Theme Toggle */}
      <div className="flex items-center gap-3">
        <div className="w-56 shrink-0">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
