"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Laptop } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-48 h-8 rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
    );
  }

  const activeIndex = theme === "light" ? 0 : theme === "dark" ? 1 : 2;

  return (
    <div className="relative w-full max-w-[210px] h-8 p-1 rounded-xl bg-zinc-200/80 dark:bg-zinc-900 border border-zinc-300/80 dark:border-zinc-800 shadow-inner grid grid-cols-3 gap-0 box-border select-none font-sans">
      
      {/* Normal Clean Active Sliding Pill */}
      <div
        className="absolute top-1 bottom-1 w-1/3 rounded-lg bg-white dark:bg-zinc-800 shadow-sm transition-transform duration-200 ease-out pointer-events-none"
        style={{ transform: `translateX(${activeIndex * 100}%)` }}
      />

      {/* Light Option */}
      <button
        onClick={() => setTheme("light")}
        title="Light Mode"
        className={`relative z-10 w-full h-full flex items-center justify-center gap-1.5 text-xs font-bold transition-colors cursor-pointer ${
          theme === "light" ? "text-zinc-900 dark:text-zinc-100 font-extrabold" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
        }`}
      >
        <Sun className={`w-3.5 h-3.5 ${theme === "light" ? "text-amber-500" : ""}`} />
        <span className="truncate">Light</span>
      </button>

      {/* Dark Option */}
      <button
        onClick={() => setTheme("dark")}
        title="Dark Mode"
        className={`relative z-10 w-full h-full flex items-center justify-center gap-1.5 text-xs font-bold transition-colors cursor-pointer ${
          theme === "dark" ? "text-zinc-900 dark:text-zinc-100 font-extrabold" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
        }`}
      >
        <Moon className={`w-3.5 h-3.5 ${theme === "dark" ? "text-indigo-400" : ""}`} />
        <span className="truncate">Dark</span>
      </button>

      {/* Auto Option */}
      <button
        onClick={() => setTheme("system")}
        title="System Auto Preference"
        className={`relative z-10 w-full h-full flex items-center justify-center gap-1.5 text-xs font-bold transition-colors cursor-pointer ${
          theme === "system" ? "text-zinc-900 dark:text-zinc-100 font-extrabold" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
        }`}
      >
        <Laptop className={`w-3.5 h-3.5 ${theme === "system" ? "text-emerald-500" : ""}`} />
        <span className="truncate">Auto</span>
      </button>

    </div>
  );
}
