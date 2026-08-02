import { ResumeForm } from "@/components/resume/resume-form";
import { Sparkles, FileText, Download, ShieldCheck, Cpu } from "lucide-react";

export default function ResumeBuilderPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 animate-fade-in">
      
      {/* ── HERO BANNER ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-zinc-900 via-slate-900 to-indigo-950 p-6 md:p-8 text-white border border-indigo-900/40 shadow-xl">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 opacity-15 blur-3xl w-96 h-96 bg-indigo-500 rounded-full" />
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Interactive Studio
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full uppercase tracking-wider">
              <Download className="w-3.5 h-3.5 text-emerald-400" /> A4 PDF Export Ready
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">
            Professional AI Resume Builder & Real-Time Canvas
          </h1>
          <p className="text-zinc-300 text-xs md:text-sm leading-relaxed">
            Build, import, and tailor your executive resume against target job criteria. Features real-time Swiss-Modern preview, ATS scoring, and one-click PDF printing.
          </p>
        </div>
      </div>

      {/* ── RESUME FORM & CANVAS ───────────────────────────────────── */}
      <ResumeForm />
    </div>
  );
}
