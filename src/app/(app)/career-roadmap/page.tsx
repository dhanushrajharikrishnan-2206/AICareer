import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CareerRoadmap } from "@/components/dashboard/career-roadmap";
import { Sparkles, Trophy, Calendar, CheckSquare } from "lucide-react";
import { Card } from "@/components/ui/card";

export default async function CareerRoadmapPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  const user = session.user as any;
  const userId = user?.id;

  // Query real milestone records
  let resumes: any[] = [];
  let skills: any[] = [];
  let interviews: any[] = [];
  let savedJobsCount = 0;

  if (userId) {
    [resumes, skills, interviews, savedJobsCount] = await Promise.all([
      prisma.resume.findMany({ where: { userId }, orderBy: { updatedAt: "desc" } }),
      prisma.skillProgress.findMany({ where: { userId } }),
      prisma.mockInterview.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
      prisma.savedJob.count({ where: { userId } })
    ]);
  }

  const completedCount = skills.filter((s) => s.status === "done").length;
  const inProgressCount = skills.filter((s) => s.status === "in_progress").length;
  const totalCount = skills.length;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-12">
      
      {/* Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950 to-zinc-950 p-8 text-white border border-emerald-900/40 shadow-xl">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 opacity-10 blur-2xl w-96 h-96 bg-emerald-500 rounded-full" />
        <div className="relative z-10 max-w-2xl space-y-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full uppercase tracking-wider">
            <Trophy className="w-3.5 h-3.5" /> Career Milestones
          </span>
          <h1 className="text-3xl font-bold tracking-tight">Interactive Career Roadmap</h1>
          <p className="text-zinc-300 text-sm leading-relaxed">
            Organize your professional progression. Track your completed resume versions, pending learning roadmaps, and mock evaluations as you prepare for your target tech roles.
          </p>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <Card className="p-5 flex items-center gap-4 border-ink/10 shadow-sm">
          <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold">
            ✓
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-ink/40 tracking-wider block">Completed Skills</span>
            <span className="text-lg font-extrabold text-ink">{completedCount} / {totalCount}</span>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 border-ink/10 shadow-sm">
          <div className="h-10 w-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-bold">
            ✏
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-ink/40 tracking-wider block">Active Learnings</span>
            <span className="text-lg font-extrabold text-ink">{inProgressCount} skill items</span>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 border-ink/10 shadow-sm">
          <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
            ★
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-ink/40 tracking-wider block">Interviews Evaluated</span>
            <span className="text-lg font-extrabold text-ink">{interviews.length} practice drills</span>
          </div>
        </Card>

      </div>

      {/* The Visual vertical timeline */}
      <Card className="p-6 md:p-8 border-ink/10 shadow-sm">
        <CareerRoadmap
          resumes={resumes}
          skills={skills}
          interviews={interviews}
          savedJobsCount={savedJobsCount}
        />
      </Card>

    </div>
  );
}
