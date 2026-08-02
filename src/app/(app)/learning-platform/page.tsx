"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Play, Code, FileText, Search, Signal } from "lucide-react";
import { Input } from "@/components/ui/input";

type Category = "all" | "videos" | "labs" | "docs";
type Difficulty = "all" | "Beginner" | "Intermediate" | "Advanced";

const resources = [
  { id: 1, title: "Next.js 15 Foundations", category: "videos", difficulty: "Beginner", icon: Play },
  { id: 2, title: "React Hooks Masterclass", category: "videos", difficulty: "Intermediate", icon: Play },
  { id: 3, title: "Tailwind CSS Layout Lab", category: "labs", difficulty: "Beginner", icon: Code },
  { id: 4, title: "PostgreSQL Schema Design", category: "labs", difficulty: "Advanced", icon: Code },
  { id: 5, title: "TypeScript Best Practices", category: "docs", difficulty: "Intermediate", icon: FileText },
  { id: 6, title: "App Router Documentation", category: "docs", difficulty: "Advanced", icon: FileText },
];

export default function LearningPlatformPage() {
  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const [activeDifficulty, setActiveDifficulty] = useState<Difficulty>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const categories: { id: Category; label: string; icon: any }[] = [
    { id: "all", label: "All Types", icon: Search },
    { id: "videos", label: "Videos", icon: Play },
    { id: "labs", label: "Interactive Labs", icon: Code },
    { id: "docs", label: "Documentations", icon: FileText },
  ];

  const difficulties: { id: Difficulty; label: string; badgeColor: string }[] = [
    { id: "all", label: "All Levels", badgeColor: "bg-zinc-100 text-zinc-700" },
    { id: "Beginner", label: "Beginner", badgeColor: "bg-emerald-50 text-emerald-600 border border-emerald-200" },
    { id: "Intermediate", label: "Intermediate", badgeColor: "bg-indigo-50 text-indigo-600 border border-indigo-200" },
    { id: "Advanced", label: "Advanced", badgeColor: "bg-purple-50 text-purple-600 border border-purple-200" },
  ];

  const filteredResources = resources.filter(r =>
    (activeCategory === "all" || r.category === activeCategory) &&
    (activeDifficulty === "all" || r.difficulty === activeDifficulty) &&
    r.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50 mb-8 text-center">Learning Platform</h1>
      
      {/* Search & Category Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
        <div className="flex gap-2 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeCategory === cat.id 
                  ? "bg-white dark:bg-zinc-900 text-zinc-950 dark:text-zinc-50 shadow-sm" 
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
              }`}
            >
              <cat.icon className="w-4 h-4" />
              {cat.label}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input 
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Difficulty Level Option Filter Bar */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-1">
        <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
          <Signal className="w-3.5 h-3.5 text-emerald-500" /> Difficulty Level:
        </span>
        {difficulties.map((diff) => (
          <button
            key={diff.id}
            onClick={() => setActiveDifficulty(diff.id)}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
              activeDifficulty === diff.id
                ? "bg-zinc-900 text-white dark:bg-emerald-600 dark:text-white border-transparent shadow-sm"
                : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300"
            }`}
          >
            {diff.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory + activeDifficulty + searchQuery}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {filteredResources.map((resource) => (
            <div key={resource.id} className="p-6 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-2xl hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-4 shadow-sm">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <resource.icon className="w-7 h-7 text-emerald-500" />
                  <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md tracking-wider ${
                    resource.difficulty === "Beginner" ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" :
                    resource.difficulty === "Intermediate" ? "bg-indigo-500/10 text-indigo-600 border border-indigo-500/20" :
                    "bg-purple-500/10 text-purple-600 border border-purple-500/20"
                  }`}>
                    {resource.difficulty}
                  </span>
                </div>
                <h3 className="font-bold text-zinc-950 dark:text-zinc-50 text-base">{resource.title}</h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">Explore this resource to master skills at the {resource.difficulty} level.</p>
              </div>
            </div>
          ))}
          {filteredResources.length === 0 && (
            <p className="col-span-full text-center text-zinc-500 py-10 text-xs">No resources found matching the selected filters.</p>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
