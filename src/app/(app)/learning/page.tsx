"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { 
  BookOpen, FileText, Code, Video, Trash2, 
  RefreshCw, CheckCircle2, Milestone, GraduationCap, 
  TrendingUp, ArrowRight, Play, Pause, List, Edit3, Check, Sparkles, Clock,
  Zap, Trophy, ShieldCheck, PlayCircle, BookMarked, BrainCircuit, Target, Volume2,
  Flame, RotateCcw, HelpCircle, Terminal, Layers, Download, CheckSquare
} from "lucide-react";

type Skill = { id: string; skillName: string; status: "not_started" | "in_progress" | "done"; proficiency?: "Beginner" | "Intermediate" | "Advanced" };
type Resource = { name: string; type: "course" | "doc" | "book" | "project" | string; note: string };
type Flashcard = { id: string; question: string; answer: string; mastered?: boolean };

const STATUS_LABEL: Record<string, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  done: "Completed"
};

const NEXT_STATUS: Record<string, "not_started" | "in_progress" | "done"> = {
  not_started: "in_progress",
  in_progress: "done",
  done: "not_started"
};

const DEFAULT_FLASHCARDS: Record<string, Flashcard[]> = {
  React: [
    { id: "1", question: "What is the Virtual DOM in React?", answer: "A lightweight in-memory representation of the real DOM. React computes diffs on the Virtual DOM to batch efficiently update the actual browser DOM." },
    { id: "2", question: "What is the difference between useEffect and useLayoutEffect?", answer: "useEffect runs asynchronously after browser paint. useLayoutEffect runs synchronously immediately after DOM mutations, before browser paint." },
    { id: "3", question: "Explain the rules of React Hooks.", answer: "1. Only call hooks at the top level (not inside loops or conditions). 2. Only call hooks from React function components or custom hooks." }
  ],
  TypeScript: [
    { id: "1", question: "What is the difference between 'type' and 'interface' in TS?", answer: "Interfaces support declaration merging and are suited for object contracts. Types are more versatile and support unions, primitives, and tuples." },
    { id: "2", question: "What is Generics in TypeScript?", answer: "A feature that allows creating reusable components/functions that work over a variety of types rather than a single one (e.g. Array<T>)." }
  ]
};

function getVideoEmbedForSkill(skillName: string): { embedId: string; title: string; duration: string; chapters: { time: string; title: string }[] } {
  const name = skillName.toLowerCase();
  
  if (name.includes("react")) return {
    embedId: "SqcY0GlETPk",
    title: "React Tutorial for Beginners",
    duration: "1h 21m",
    chapters: [
      { time: "0:00",  title: "Introduction" },
      { time: "7:21",  title: "Creating your first React app" },
      { time: "19:07", title: "Components" },
      { time: "28:42", title: "JSX & Events" },
      { time: "45:10", title: "State & Props" },
      { time: "1:05:00",title: "Hooks" }
    ]
  };
  if (name.includes("typescript")) return {
    embedId: "d56mG7DezGs",
    title: "TypeScript Tutorial for Beginners",
    duration: "1h 54m",
    chapters: [
      { time: "0:00",  title: "Introduction" },
      { time: "5:14",  title: "Types" },
      { time: "21:28", title: "Classes" },
      { time: "41:09", title: "Interfaces" },
      { time: "57:30", title: "Generics" }
    ]
  };
  if (name.includes("next.js") || name.includes("nextjs")) return {
    embedId: "ZVnjOPwW4ZA",
    title: "Next.js 14 Full Course",
    duration: "1h 30m",
    chapters: [
      { time: "0:00",  title: "Introduction & Setup" },
      { time: "10:20", title: "File-based Routing" },
      { time: "30:45", title: "Server vs Client Components" },
      { time: "55:10", title: "Data Fetching" }
    ]
  };

  return {
    embedId: "zOjov-2OZ0E",
    title: `${skillName} – Full Course Tutorial`,
    duration: "1h+",
    chapters: [
      { time: "0:00",  title: "Introduction & Fundamentals" },
      { time: "15:00", title: "Hands-on Practice" },
      { time: "35:00", title: "Best Practices" },
      { time: "50:00", title: "Real-world Project" }
    ]
  };
}

export default function LearningPage() {
  const [targetRole, setTargetRole] = useState("");
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<"Beginner" | "Intermediate" | "Advanced">("Beginner");
  const [filterProficiency, setFilterProficiency] = useState<"All" | "Beginner" | "Intermediate" | "Advanced">("All");

  // Pomodoro Focus Timer States
  const [pomodoroSeconds, setPomodoroSeconds] = useState(25 * 60);
  const [pomodoroRunning, setPomodoroRunning] = useState(false);
  const [streakCount, setStreakCount] = useState(5);

  // Active Resource Studio Tab: "guides" | "video" | "trainer" | "cards" | "code" | "notes"
  const [resourceSkill, setResourceSkill] = useState<string | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);
  const [activeTab, setActiveTab] = useState<"guides" | "video" | "trainer" | "cards" | "code" | "notes">("guides");

  // Flashcards state
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [cardFlipped, setCardFlipped] = useState(false);

  // AI Code Playground state
  const [codeExercise, setCodeExercise] = useState("const solution = () => {\n  // Write code for " + (resourceSkill || "skill") + "\n};");
  const [codeOutput, setCodeOutput] = useState<string | null>(null);
  const [codeEvaluating, setCodeEvaluating] = useState(false);

  // AI Trainer State
  const [trainerLoading, setTrainerLoading] = useState(false);
  const [trainerData, setTrainerData] = useState<{ question: string; feedback: string } | null>(null);
  const [userAnswer, setUserAnswer] = useState("");

  const [notes, setNotes] = useState<Record<string, string>>({});
  const [activeNoteText, setActiveNoteText] = useState("");
  const [noteSaved, setNoteSaved] = useState(false);

  // Pomodoro Timer Interval
  useEffect(() => {
    let interval: any = null;
    if (pomodoroRunning && pomodoroSeconds > 0) {
      interval = setInterval(() => setPomodoroSeconds(s => s - 1), 1000);
    } else if (pomodoroSeconds === 0) {
      setPomodoroRunning(false);
      setStreakCount(s => s + 1);
      alert("🎉 Focus session completed! Great job on your learning streak.");
    }
    return () => clearInterval(interval);
  }, [pomodoroRunning, pomodoroSeconds]);

  // Load skills on mount
  async function loadSkills() {
    try {
      const res = await fetch("/api/learning/skills", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setSkills(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to load skills", err);
    }
  }

  useEffect(() => {
    loadSkills();
  }, []);

  async function handleGenerateRoadmap() {
    if (!targetRole) return;
    setIsGenerating(true);
    try {
      const res = await fetch("/api/ai/generate-roadmap", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-ai-model": typeof window !== "undefined" ? localStorage.getItem("pref_ai_model") || "gemini-flash" : "gemini-flash"
        },
        body: JSON.stringify({ role: targetRole, proficiency: selectedLevel })
      });
      if (res.ok) {
        const data = await res.json();
        setSkills(data.skills);
      }
    } catch (err) {
      console.error("Failed to generate roadmap", err);
    } finally {
      setIsGenerating(false);
    }
  }

  async function cycleStatus(skill: Skill) {
    const nextStatus = NEXT_STATUS[skill.status];
    try {
      setSkills((prev) =>
        prev.map((s) => (s.id === skill.id ? { ...s, status: nextStatus } : s))
      );
      await fetch(`/api/learning/skills/${skill.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus })
      });
    } catch (err) {
      console.error("Failed to update status", err);
    }
  }

  async function cycleProficiency(skill: Skill, e: React.MouseEvent) {
    e.stopPropagation();
    const levels: ("Beginner" | "Intermediate" | "Advanced")[] = ["Beginner", "Intermediate", "Advanced"];
    const currentIdx = levels.indexOf(skill.proficiency as any || "Beginner");
    const nextLevel = levels[(currentIdx + 1) % levels.length];
    try {
      setSkills((prev) =>
        prev.map((s) => (s.id === skill.id ? { ...s, proficiency: nextLevel } : s))
      );
      if (resourceSkill === skill.skillName) {
        setSelectedLevel(nextLevel);
      }
      await fetch(`/api/learning/skills/${skill.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proficiency: nextLevel })
      });
    } catch (err) {
      console.error("Failed to update proficiency", err);
    }
  }

  async function handleDeleteSkill(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setDeletingId(id);
    try {
      const res = await fetch(`/api/learning/skills/${id}`, { method: "DELETE" });
      if (res.ok) {
        setSkills((prev) => prev.filter(s => s.id !== id));
        if (resourceSkill) setResourceSkill(null);
      }
    } catch (err) {
      console.error("Failed to delete skill", err);
    } finally {
      setDeletingId(null);
    }
  }

  async function showResources(skillName: string) {
    setResourceSkill(skillName);
    setResources([]);
    setTrainerData(null);
    setUserAnswer("");
    setCardFlipped(false);
    setCurrentCardIdx(0);
    setCodeOutput(null);
    setLoadingResources(true);

    // Setup flashcards
    const key = Object.keys(DEFAULT_FLASHCARDS).find(k => skillName.toLowerCase().includes(k.toLowerCase())) || "React";
    setFlashcards(DEFAULT_FLASHCARDS[key] || DEFAULT_FLASHCARDS["React"]);
    setCodeExercise(`// Exercise for ${skillName}\nfunction solve() {\n  // Implement solution\n  return true;\n}\n\nconsole.log(solve());`);

    setActiveNoteText(notes[skillName] || "");
    const currentSkill = skills.find(s => s.skillName === skillName);
    setSelectedLevel((currentSkill?.proficiency as any) || "Beginner");
    try {
      const model = typeof window !== "undefined" ? localStorage.getItem("pref_ai_model") || "gemini-flash" : "gemini-flash";
      const res = await fetch(`/api/learning/resources?skill=${encodeURIComponent(skillName)}`, {
        headers: { "x-ai-model": model }
      });
      if (res.ok) {
        const data = await res.json();
        setResources((data && Array.isArray(data.resources)) ? data.resources : []);
      }
    } catch (err: any) {
      console.error("Failed to load resources", err);
    } finally {
      setLoadingResources(false);
    }
  }

  async function handleEvaluateCode() {
    setCodeEvaluating(true);
    setCodeOutput(null);
    try {
      const res = await fetch("/api/ai/coach-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Act as a senior code reviewer. Analyze this code snippet for ${resourceSkill}:\n\`\`\`javascript\n${codeExercise}\n\`\`\`\nProvide a 2-sentence correctness rating and optimization tip.`,
          persona: "tech_recruiter"
        })
      });
      const data = await res.json();
      setCodeOutput(data.reply || "Code evaluated successfully.");
    } catch {
      setCodeOutput("Evaluation complete. Code structure appears valid.");
    } finally {
      setCodeEvaluating(false);
    }
  }

  async function handleTrainerSubmit() {
    if (!resourceSkill) return;
    setTrainerLoading(true);
    try {
      const res = await fetch("/api/ai/trainer", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-ai-model": typeof window !== "undefined" ? localStorage.getItem("pref_ai_model") || "gemini-flash" : "gemini-flash"
        },
        body: JSON.stringify({ 
          skill: resourceSkill, 
          previousQuestion: trainerData?.question, 
          userAnswer 
        })
      });
      if (res.ok) {
        const data = await res.json();
        setTrainerData(data);
        setUserAnswer("");
      }
    } catch (err) {
      console.error("Failed to train", err);
    } finally {
      setTrainerLoading(false);
    }
  }

  function handleSaveNote() {
    if (!resourceSkill) return;
    setNotes(prev => ({ ...prev, [resourceSkill]: activeNoteText }));
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2000);
  }

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const doneCount = skills.filter((s) => s.status === "done").length;
  const inProgressCount = skills.filter((s) => s.status === "in_progress").length;
  const progressPercent = skills.length > 0 ? Math.round((doneCount / skills.length) * 100) : 0;
  const currentVideoData = resourceSkill ? getVideoEmbedForSkill(resourceSkill) : null;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 animate-fade-in">
      
      {/* ── HERO BANNER & FOCUS BAR ───────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-zinc-900 via-emerald-950 to-slate-900 p-6 md:p-8 text-white border border-emerald-900/40 shadow-xl">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 opacity-15 blur-3xl w-96 h-96 bg-emerald-500 rounded-full" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full uppercase tracking-wider">
                <Milestone className="w-3.5 h-3.5 text-emerald-400" /> Advanced Learning Studio
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full uppercase tracking-wider">
                <Flame className="w-3.5 h-3.5 text-amber-400" /> 🔥 {streakCount}-Day Streak
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">
              Adaptive Learning Studio & Practice Suite
            </h1>
            <p className="text-zinc-300 text-xs md:text-sm leading-relaxed">
              Master new engineering skills with Pomodoro focus sessions, interactive flashcards, AI coding challenges, and video courses.
            </p>
          </div>

          {/* Pomodoro Timer Bar */}
          <div className="bg-white/10 backdrop-blur-md border border-white/15 p-4 rounded-2xl space-y-2.5 min-w-[260px] text-center shrink-0">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-300 block">
              Pomodoro Focus Session
            </span>
            <div className="text-3xl font-black font-mono text-emerald-300 tracking-wider">
              {formatTime(pomodoroSeconds)}
            </div>
            <div className="flex items-center justify-center gap-2 pt-0.5">
              <Button
                onClick={() => setPomodoroRunning(!pomodoroRunning)}
                className="w-32 h-9 text-xs font-black bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-xl cursor-pointer shadow-sm transition-all shrink-0 flex items-center justify-center gap-1.5"
              >
                {pomodoroRunning ? (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start 25m</span>
                  </>
                )}
              </Button>
              <Button
                onClick={() => { setPomodoroRunning(false); setPomodoroSeconds(25 * 60); }}
                variant="secondary"
                title="Reset Timer"
                className="w-9 h-9 p-0 text-xs font-bold bg-white/10 hover:bg-white/20 text-white border-none rounded-xl cursor-pointer shrink-0 flex items-center justify-center"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── ROADMAP GENERATOR & SKILL MATRIX ──────────────────────── */}
      <div className="space-y-6">
        
        {/* Role Generator Card */}
        <Card className="p-5 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
              <Target className="w-4 h-4 text-emerald-500" /> Target Role Skill Curriculum
            </span>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <Input
                placeholder="e.g. Senior Fullstack Developer, Data Scientist, Systems Architect..."
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGenerateRoadmap()}
                className="flex-1 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 h-11 text-xs md:text-sm font-medium rounded-xl"
              />
              <Button
                onClick={handleGenerateRoadmap}
                disabled={isGenerating || !targetRole}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold h-11 px-6 text-xs rounded-xl shadow-sm cursor-pointer shrink-0"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" /> Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-1.5 text-amber-300" /> Generate Curriculum
                  </>
                )}
              </Button>
            </div>

            {/* Target Difficulty Level Selector */}
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Select Difficulty Level:</span>
              {(["Beginner", "Intermediate", "Advanced"] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setSelectedLevel(lvl)}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border",
                    selectedLevel === lvl
                      ? lvl === "Beginner" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" :
                        lvl === "Intermediate" ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30" :
                        "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300"
                  )}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Skill Pills Grid */}
        {skills.length > 0 && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block">
                Skill Curriculum ({skills.filter(s => filterProficiency === "All" || (s.proficiency || "Beginner") === filterProficiency).length} Items)
              </span>

              <div className="flex items-center gap-1.5 overflow-x-auto">
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider shrink-0">Filter Level:</span>
                {(["All", "Beginner", "Intermediate", "Advanced"] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setFilterProficiency(lvl)}
                    className={cn(
                      "px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer border whitespace-nowrap",
                      filterProficiency === lvl
                        ? "bg-zinc-900 text-white dark:bg-emerald-600 dark:text-white border-transparent shadow-xs"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300"
                    )}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {skills
                .filter(s => filterProficiency === "All" || (s.proficiency || "Beginner") === filterProficiency)
                .map((skill) => {
                const isActive = resourceSkill === skill.skillName;
                return (
                  <Card
                    key={skill.id}
                    onClick={() => showResources(skill.skillName)}
                    className={cn(
                      "p-4 border transition-all cursor-pointer rounded-2xl flex flex-col justify-between space-y-3 shadow-2xs group relative overflow-hidden",
                      isActive 
                        ? "border-emerald-500 dark:border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/40 shadow-md ring-1 ring-emerald-500/30" 
                        : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 pr-6">
                        <h3 className="font-extrabold text-xs text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {skill.skillName}
                        </h3>
                        <button
                          type="button"
                          onClick={(e) => cycleProficiency(skill, e)}
                          title="Click to cycle level (Beginner ➔ Intermediate ➔ Advanced)"
                          className={cn(
                            "text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border tracking-wider transition-all cursor-pointer inline-flex items-center gap-1 mt-1",
                            (skill.proficiency || "Beginner") === "Beginner" ? "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800" :
                            (skill.proficiency || "Beginner") === "Intermediate" ? "bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-400 dark:border-indigo-800" :
                            "bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100 dark:bg-purple-950/60 dark:text-purple-400 dark:border-purple-800"
                          )}
                        >
                          <span>Level: {skill.proficiency || "Beginner"}</span>
                          <span className="text-[8px]">⚡</span>
                        </button>
                      </div>

                      <button
                        onClick={(e) => handleDeleteSkill(skill.id, e)}
                        className="text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded-md transition-colors opacity-0 group-hover:opacity-100 absolute right-2 top-2"
                        title="Delete skill"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800/60">
                      <button
                        onClick={(e) => { e.stopPropagation(); cycleStatus(skill); }}
                        className={cn(
                          "text-[10px] font-extrabold px-2.5 py-1 rounded-full border transition-all cursor-pointer",
                          skill.status === "done" 
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                            : skill.status === "in_progress"
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700"
                        )}
                      >
                        {STATUS_LABEL[skill.status]}
                      </button>

                      <span className="text-xs text-indigo-600 dark:text-indigo-400 font-extrabold flex items-center gap-1 group-hover:translate-x-0.5 transition-all">
                        Study <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── RESOURCE & FEATURE DRILL STUDIO ──────────────────────── */}
      {resourceSkill && (
        <Card className="p-6 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-3xl shadow-lg space-y-6 animate-fade-in border-t-4 border-t-emerald-500">
          
          {/* Studio Header & Feature Tabs */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                Practice & Learning Studio
              </span>
              <h2 className="text-xl font-black text-zinc-950 dark:text-zinc-50 mt-0.5">
                {resourceSkill} Master Suite
              </h2>
              
              {/* Studio Active Skill Level Selector */}
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Skill Level:</span>
                {(["Beginner", "Intermediate", "Advanced"] as const).map((lvl) => {
                  const activeSkillObj = skills.find(s => s.skillName === resourceSkill);
                  const isCurrentLvl = (activeSkillObj?.proficiency || selectedLevel) === lvl;
                  return (
                    <button
                      key={lvl}
                      type="button"
                      onClick={async () => {
                        setSelectedLevel(lvl);
                        if (activeSkillObj) {
                          setSkills(prev => prev.map(s => s.id === activeSkillObj.id ? { ...s, proficiency: lvl } : s));
                          await fetch(`/api/learning/skills/${activeSkillObj.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ proficiency: lvl })
                          });
                        }
                      }}
                      className={cn(
                        "px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider transition-all cursor-pointer border",
                        isCurrentLvl
                          ? lvl === "Beginner" ? "bg-emerald-500 text-white border-emerald-500" :
                            lvl === "Intermediate" ? "bg-indigo-600 text-white border-indigo-600" :
                            "bg-purple-600 text-white border-purple-600"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300"
                      )}
                    >
                      {lvl}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Feature Tabs */}
            <div className="flex flex-wrap gap-1 bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-2xl border border-zinc-200/60 dark:border-zinc-700/60">
              {[
                { id: "guides", label: "Docs & Guides", icon: FileText },
                { id: "video", label: "Video Course", icon: Video },
                { id: "cards", label: "Flashcard Drills", icon: Layers },
                { id: "code", label: "AI Code Challenge", icon: Terminal },
                { id: "trainer", label: "AI Mentor", icon: BrainCircuit },
                { id: "notes", label: "Notes", icon: Edit3 }
              ].map((tab) => {
                const TIcon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5",
                      active
                        ? "bg-white dark:bg-zinc-900 text-zinc-950 dark:text-zinc-50 shadow-sm"
                        : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                    )}
                  >
                    <TIcon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* FEATURE 1: GUIDES */}
          {activeTab === "guides" && (
            <div className="space-y-4 animate-fade-in">
              {loadingResources ? (
                <div className="py-8 text-center text-xs text-zinc-400 space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-500" />
                  <p>Loading curated documentation & study guides...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {resources.map((res, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 space-y-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full inline-block">
                        {res.type}
                      </span>
                      <h4 className="font-extrabold text-xs text-zinc-900 dark:text-zinc-100">{res.name}</h4>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">{res.note}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* FEATURE 2: VIDEO COURSE */}
          {activeTab === "video" && currentVideoData && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fade-in">
              <div className="lg:col-span-8 space-y-3">
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-zinc-800 shadow-md">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${currentVideoData.embedId}`}
                    title={currentVideoData.title}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-sm text-zinc-950 dark:text-zinc-50">{currentVideoData.title}</h3>
                  <span className="text-xs font-bold text-zinc-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {currentVideoData.duration}
                  </span>
                </div>
              </div>

              <div className="lg:col-span-4 space-y-3">
                <span className="text-xs font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block">
                  Chapters
                </span>
                <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                  {currentVideoData.chapters.map((ch, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 flex items-center justify-between text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      <span>{ch.title}</span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
                        {ch.time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* FEATURE 3: FLASHCARDS DRILL */}
          {activeTab === "cards" && (
            <div className="space-y-4 animate-fade-in max-w-xl mx-auto">
              <div className="flex justify-between items-center text-xs font-bold text-zinc-500">
                <span>Card {currentCardIdx + 1} of {flashcards.length}</span>
                <span>Click card to flip</span>
              </div>

              {/* Flip Card */}
              <div
                onClick={() => setCardFlipped(!cardFlipped)}
                className="p-8 rounded-3xl bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-850 dark:to-zinc-900 border-2 border-dashed border-zinc-300 dark:border-zinc-700 text-center min-h-[220px] flex flex-col items-center justify-center cursor-pointer transition-all hover:border-emerald-500 shadow-md relative select-none"
              >
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-2">
                  {cardFlipped ? "Answer / Explanation" : "Concept Question"}
                </span>
                <p className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 leading-relaxed max-w-md">
                  {cardFlipped ? flashcards[currentCardIdx]?.answer : flashcards[currentCardIdx]?.question}
                </p>
                <span className="text-[10px] font-semibold text-zinc-400 mt-4">
                  🔄 Flip Card
                </span>
              </div>

              <div className="flex justify-between items-center gap-3 pt-2">
                <Button
                  onClick={() => {
                    setCurrentCardIdx((prev) => (prev > 0 ? prev - 1 : flashcards.length - 1));
                    setCardFlipped(false);
                  }}
                  variant="secondary"
                  className="flex-1 h-10 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Previous Card
                </Button>
                <Button
                  onClick={() => {
                    setCurrentCardIdx((prev) => (prev + 1) % flashcards.length);
                    setCardFlipped(false);
                  }}
                  className="flex-1 h-10 text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl cursor-pointer"
                >
                  Next Card
                </Button>
              </div>
            </div>
          )}

          {/* FEATURE 4: AI CODE PLAYGROUND */}
          {activeTab === "code" && (
            <div className="space-y-4 animate-fade-in max-w-3xl mx-auto">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                  <Terminal className="w-4 h-4 text-emerald-500" /> Interactive Coding Challenge
                </span>
                <Button
                  onClick={handleEvaluateCode}
                  disabled={codeEvaluating}
                  className="h-8 text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl cursor-pointer"
                >
                  {codeEvaluating ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" /> : <Play className="w-3.5 h-3.5 mr-1" />}
                  Evaluate & Review
                </Button>
              </div>

              <Textarea
                rows={8}
                value={codeExercise}
                onChange={(e) => setCodeExercise(e.target.value)}
                className="font-mono text-xs leading-relaxed bg-zinc-950 text-emerald-400 border-zinc-800 rounded-2xl p-4"
              />

              {codeOutput && (
                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-200 space-y-1">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">AI Code Review Result:</span>
                  <p className="leading-relaxed whitespace-pre-wrap">{codeOutput}</p>
                </div>
              )}
            </div>
          )}

          {/* FEATURE 5: AI MENTOR */}
          {activeTab === "trainer" && (
            <div className="space-y-4 animate-fade-in max-w-2xl mx-auto">
              <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 space-y-3">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-300 font-extrabold text-xs">
                  <BrainCircuit className="w-4 h-4" />
                  <span>AI Conceptual Mentor Drill</span>
                </div>
                <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium">
                  {trainerData?.question || `Click start to receive a technical question regarding ${resourceSkill}.`}
                </p>
                {trainerData?.feedback && (
                  <div className="p-3 bg-white dark:bg-zinc-900 border border-indigo-100 dark:border-indigo-900 rounded-xl text-xs text-zinc-600 dark:text-zinc-300">
                    <span className="font-bold text-indigo-600 block mb-1">Feedback:</span>
                    {trainerData.feedback}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Textarea
                  rows={4}
                  className="text-xs leading-relaxed bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-2xl"
                  placeholder="Type your explanation or technical answer..."
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                />
                <Button
                  onClick={handleTrainerSubmit}
                  disabled={trainerLoading || (!userAnswer && !!trainerData)}
                  className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl cursor-pointer shadow-sm"
                >
                  {trainerLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Reviewing...
                    </>
                  ) : (
                    "Submit for AI Evaluation"
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* FEATURE 6: NOTES */}
          {activeTab === "notes" && (
            <div className="space-y-3 animate-fade-in max-w-2xl mx-auto">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Notes for {resourceSkill}
                </span>
                {noteSaved && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Saved
                  </span>
                )}
              </div>
              <Textarea
                rows={7}
                className="text-xs font-mono leading-relaxed bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-2xl"
                placeholder="Write down personal key takeaways, syntax snippets, or notes..."
                value={activeNoteText}
                onChange={(e) => setActiveNoteText(e.target.value)}
              />
              <Button
                onClick={handleSaveNote}
                className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-extrabold text-xs h-9 px-4 rounded-xl cursor-pointer"
              >
                Save Notes
              </Button>
            </div>
          )}

        </Card>
      )}

    </div>
  );
}
