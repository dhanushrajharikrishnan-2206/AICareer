"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Overview" },
  { href: "/career-roadmap", label: "Career roadmap" },
  { href: "/resume-builder", label: "Resume builder" },
  { href: "/ai/analyzer", label: "Resume analyzer" },
  { href: "/ai/ats-scorer", label: "ATS scorer" },
  { href: "/ai/improver", label: "Resume improver" },
  { href: "/ai/cover-letter", label: "Cover letter" },
  { href: "/ai/coach-chat", label: "Career coach chat" },
  { href: "/jobs", label: "Jobs" },
  { href: "/learning", label: "Learning" },
  { href: "/interview", label: "Interview prep" },
  { href: "/settings", label: "Settings" }
];

export function Sidebar({ isAdmin }: { isAdmin?: boolean }) {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 border-r border-zinc-200 dark:border-zinc-800 min-h-screen py-6 px-3 flex flex-col justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
      <div className="space-y-6">
        <div className="px-3">
          <Link href="/dashboard" className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-widest flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm"></span>
            Resume Coach
          </Link>
        </div>
        
        <nav className="flex flex-col gap-1">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-xs font-semibold px-3 py-2 rounded-xl transition-all flex items-center justify-between",
                  isActive
                    ? "bg-zinc-900 text-white shadow-sm dark:bg-emerald-600 dark:text-white"
                    : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/80 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800/60"
                )}
              >
                {link.label}
              </Link>
            );
          })}
          {isAdmin && (
            <Link
              href="/admin"
              className={cn(
                "text-xs font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 mt-2 border-t border-zinc-200/60 dark:border-zinc-800 pt-3",
                pathname.startsWith("/admin") ? "bg-red-950 text-red-100" : "text-zinc-600 dark:text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
              )}
            >
              <Shield className="w-3.5 h-3.5" />
              Admin Panel
            </Link>
          )}
        </nav>
      </div>

      <div className="pt-4 border-t border-zinc-200/60 dark:border-zinc-800 px-1">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full text-left text-xs font-bold text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 dark:hover:text-red-400 px-3 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
