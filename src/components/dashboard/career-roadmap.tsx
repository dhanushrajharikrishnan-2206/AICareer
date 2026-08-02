"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  CheckCircle2,
  Clock,
  Sparkles,
  Award,
  BookOpen,
  MessageSquare,
  ArrowRight,
  TrendingUp,
  CircleDot,
  FileText,
  Briefcase,
  ChevronRight,
  HelpCircle,
  Zap,
  Star
} from "lucide-react";
import Link from "next/link";

interface CareerRoadmapProps {
  resumes: any[];
  skills: any[];
  interviews: any[];
  savedJobsCount: number;
}

export function CareerRoadmap({ resumes, skills, interviews, savedJobsCount }: CareerRoadmapProps) {
  const [filter, setFilter] = useState<"all" | "past" | "current" | "future">("all");

  // 1. Process Milestones
  const milestones: any[] = [];

  // Add resumes (Past / Current)
  resumes.forEach((resume, idx) => {
    milestones.push({
      id: `resume-${resume.id}`,
      type: "resume",
      title: idx === 0 ? `Primary Resume: ${resume.title}` : `Archive Draft: ${resume.title}`,
      description: idx === 0 ? "Optimized and ready for ATS check." : "Previous resume copy preserved for history.",
      date: new Date(resume.updatedAt),
      timeframe: idx === 0 ? "current" : "past",
      icon: FileText,
      color: "from-emerald-500 to-teal-500",
      actionLabel: "Build/Edit",
      actionUrl: "/resume-builder"
    });
  });

  // If no resumes
  if (resumes.length === 0) {
    milestones.push({
      id: "resume-empty",
      type: "resume",
      title: "Draft First Modern Resume",
      description: "Build a Swiss-A4 responsive template to represent your career narrative.",
      timeframe: "future",
      icon: FileText,
      color: "from-zinc-500 to-zinc-600",
      actionLabel: "Launch Builder",
      actionUrl: "/resume-builder"
    });
  }

  // Process Skills
  skills.forEach((skill) => {
    let timeframe: "past" | "current" | "future" = "future";
    if (skill.status === "done") timeframe = "past";
    else if (skill.status === "in_progress") timeframe = "current";

    milestones.push({
      id: `skill-${skill.id}`,
      type: "skill",
      title: timeframe === "past" ? `Mastered ${skill.skillName}` : timeframe === "current" ? `Learning ${skill.skillName}` : `Target: ${skill.skillName}`,
      description: timeframe === "past" ? "Added successfully to resume credentials." : timeframe === "current" ? "Actively working on courses or practice tasks." : "Required domain criteria matching target job descriptions.",
      date: timeframe === "past" ? new Date(skill.updatedAt) : undefined,
      timeframe,
      icon: BookOpen,
      proficiency: skill.proficiency || "Beginner",
      color: timeframe === "past" ? "from-emerald-500 to-teal-500" : timeframe === "current" ? "from-amber-400 to-amber-600" : "from-indigo-400 to-indigo-600",
      actionLabel: "Manage Skills",
      actionUrl: "/learning"
    });
  });

  // If no skills at all
  if (skills.length === 0) {
    milestones.push({
      id: "skill-empty",
      type: "skill",
      title: "Map Custom Skill Roadmap",
      description: "Generate adaptive study plans to bypass requirements gaps for target jobs.",
      timeframe: "future",
      icon: BookOpen,
      color: "from-indigo-400 to-indigo-600",
      actionLabel: "Create Roadmap",
      actionUrl: "/learning"
    });
  }

  // Process Mock Interviews
  interviews.forEach((interview) => {
    milestones.push({
      id: `interview-${interview.id}`,
      type: "interview",
      title: `Completed ${interview.type.toUpperCase()} Prep`,
      description: interview.feedback ? "AI Evaluator review complete. Strengths recorded." : "Session drafted, awaiting AI evaluation summary.",
      date: new Date(interview.createdAt),
      timeframe: "past",
      icon: MessageSquare,
      color: "from-purple-500 to-pink-500",
      actionLabel: "View Feedback",
      actionUrl: "/interview"
    });
  });

  // Always offer a Future mock drill milestone if none or just to progress
  milestones.push({
    id: "interview-future-drill",
    type: "interview",
    title: "Adaptive Chat Mock Session",
    description: "Conduct realistic technical and behavioral voice/chat drills with adaptive coaching tips.",
    timeframe: "future",
    icon: Award,
    color: "from-pink-500 to-rose-500",
    actionLabel: "Start Drill",
    actionUrl: "/interview"
  });

  // Saved jobs milestones
  if (savedJobsCount > 0) {
    milestones.push({
      id: "jobs-saved",
      type: "jobs",
      title: `Saved ${savedJobsCount} Target Roles`,
      description: "Track outreach progress and trigger custom cover letters for each.",
      timeframe: "current",
      icon: Briefcase,
      color: "from-teal-500 to-cyan-500",
      actionLabel: "Go to Job Feed",
      actionUrl: "/jobs"
    });
  } else {
    milestones.push({
      id: "jobs-empty",
      type: "jobs",
      title: "LinkedIn Job Application Target",
      description: "Search and save 3 roles on the LinkedIn Job Board to trigger custom cover letter prep.",
      timeframe: "future",
      icon: Briefcase,
      color: "from-zinc-500 to-zinc-600",
      actionLabel: "Browse Jobs",
      actionUrl: "/jobs"
    });
  }

  // Sort milestones: Past milestones with dates first (newest to oldest), then Current, then Future
  const sortedMilestones = [...milestones].sort((a, b) => {
    // Rank timeframe
    const tfRank = { past: 0, current: 1, future: 2 };
    if (tfRank[a.timeframe as keyof typeof tfRank] !== tfRank[b.timeframe as keyof typeof tfRank]) {
      return tfRank[a.timeframe as keyof typeof tfRank] - tfRank[b.timeframe as keyof typeof tfRank];
    }
    // If both past and have dates, newest first
    if (a.date && b.date) {
      return b.date.getTime() - a.date.getTime();
    }
    return 0;
  });

  // Filtered list
  const filteredMilestones = sortedMilestones.filter((m) => {
    if (filter === "all") return true;
    return m.timeframe === filter;
  });

  // Timeframe statistics
  const pastCount = milestones.filter(m => m.timeframe === "past").length;
  const currentCount = milestones.filter(m => m.timeframe === "current").length;
  const futureCount = milestones.filter(m => m.timeframe === "future").length;

  return (
    <div className="space-y-6" id="career-roadmap-section">
      
      {/* Header and Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ink/5 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <h3 className="font-extrabold text-lg text-ink">Visual Career Roadmap</h3>
          </div>
          <p className="text-xs text-ink/60">
            A dynamic vertical roadmap connecting achievements, current study blocks, and future interviews.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex bg-zinc-100 p-1 rounded-xl border border-ink/5 text-xs font-bold gap-1 self-start sm:self-auto">
          {[
            { id: "all", label: "All Items", count: milestones.length },
            { id: "past", label: "Achieved", count: pastCount },
            { id: "current", label: "Active", count: currentCount },
            { id: "future", label: "Upcoming", count: futureCount }
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setFilter(btn.id as any)}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                filter === btn.id
                  ? "bg-white text-zinc-950 shadow-sm"
                  : "text-ink/60 hover:text-ink hover:bg-zinc-50"
              }`}
            >
              <span>{btn.label}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                filter === btn.id ? "bg-emerald-100 text-emerald-800" : "bg-ink/5 text-ink/40"
              }`}>
                {btn.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Timeline Body */}
      {filteredMilestones.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-ink/10 rounded-2xl text-ink/40 text-xs italic">
          No roadmap milestones fit this criteria currently. Generate some details inside the resume, learning, or interview pages!
        </div>
      ) : (
        <div className="relative pl-6 md:pl-8 space-y-8 py-2">
          
          {/* Vertical central spine line */}
          <div className="absolute left-3 md:left-4 top-2 bottom-2 w-[2px] bg-gradient-to-b from-emerald-500 via-amber-400 to-indigo-500/20 rounded-full" />

          {/* Timeline Nodes */}
          {filteredMilestones.map((m, idx) => {
            const Icon = m.icon;
            
            // Layout status style elements
            let statusBadge = null;
            if (m.timeframe === "past") {
              statusBadge = (
                <span className="inline-flex items-center gap-1 text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                  <CheckCircle2 className="w-2.5 h-2.5" /> Achieved
                </span>
              );
            } else if (m.timeframe === "current") {
              statusBadge = (
                <span className="inline-flex items-center gap-1 text-[9px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold animate-pulse">
                  <Clock className="w-2.5 h-2.5" /> Active Goal
                </span>
              );
            } else {
              statusBadge = (
                <span className="inline-flex items-center gap-1 text-[9px] bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full font-bold">
                  <Star className="w-2.5 h-2.5 text-zinc-400" /> Upcoming
                </span>
              );
            }

            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className="relative flex flex-col md:flex-row gap-4 items-start"
              >
                
                {/* Visual node bullet on the vertical spine */}
                <div className={`absolute -left-[27px] md:-left-[31px] top-1.5 h-6 w-6 rounded-full border-4 border-white bg-zinc-950 flex items-center justify-center z-10 shadow-sm transition-all ${
                  m.timeframe === "past" 
                    ? "text-emerald-500 shadow-emerald-500/15 ring-2 ring-emerald-500/30" 
                    : m.timeframe === "current"
                    ? "text-amber-500 shadow-amber-500/15 ring-2 ring-amber-500/30 animate-pulse"
                    : "text-zinc-400"
                }`}>
                  <CircleDot className="w-3 h-3 fill-current" />
                </div>

                {/* Main Card Content */}
                <div className="flex-1 bg-white border border-ink/10 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-ink/20 transition-all space-y-3 relative group">
                  
                  {/* Subtle color-themed left accent border */}
                  <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-r-md bg-gradient-to-b ${m.color}`} />

                  {/* Header info */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1 pl-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-sm text-ink tracking-tight group-hover:text-emerald-600 transition-colors">
                          {m.title}
                        </span>
                        {statusBadge}
                        {m.proficiency && (
                          <span className={`inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full font-bold border ${
                            m.proficiency === "Advanced" 
                              ? "bg-purple-50 text-purple-700 border-purple-200" 
                              : m.proficiency === "Intermediate" 
                              ? "bg-blue-50 text-blue-700 border-blue-200" 
                              : "bg-zinc-50 text-zinc-600 border-zinc-200"
                          }`}>
                            {m.proficiency} Level
                          </span>
                        )}
                      </div>
                      
                      {m.date && (
                        <p className="text-[10px] text-ink/40 font-semibold font-mono">
                          Completed on {m.date.toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    {/* Right-aligned dynamic Icon representation */}
                    <div className={`p-2 rounded-xl bg-zinc-50 border border-ink/5 shrink-0 text-zinc-500`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Description body */}
                  <p className="text-xs text-ink/60 leading-relaxed pl-1">
                    {m.description}
                  </p>

                  {/* Footer Action Trigger */}
                  <div className="pt-2 border-t border-ink/5 flex justify-between items-center pl-1 text-[10px] font-bold uppercase tracking-wider text-ink/40">
                    <span className="flex items-center gap-1">
                      <Zap className={`w-3.5 h-3.5 ${m.timeframe === "current" ? "text-amber-500" : "text-zinc-300"}`} />
                      {m.type} Milestone
                    </span>
                    
                    <Link
                      href={m.actionUrl}
                      className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-500 hover:underline cursor-pointer font-bold"
                    >
                      {m.actionLabel} <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>

                </div>

              </motion.div>
            );
          })}

        </div>
      )}

    </div>
  );
}
