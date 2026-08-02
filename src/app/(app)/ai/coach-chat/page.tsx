"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { 
  MessageSquare, Trash2, Send, ArrowRight, User, 
  Sparkles, Briefcase, Target, Coins, ShieldCheck, Cpu, RefreshCw
} from "lucide-react";

type Message = { role: "user" | "assistant"; content: string };
type PersonaKey = "general" | "tech_recruiter" | "career_strategist" | "salary_negotiator";

const PERSONAS = [
  {
    key: "general" as PersonaKey,
    name: "Marcus - Career Coach",
    role: "Warm & Actionable Advisor",
    icon: Target,
    color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    description: "Helps you with general job search, resume layout, and positive motivation.",
    suggestions: [
      "Review my uploaded resumes and give me a custom executive summary.",
      "Suggest what job roles fit my current experience level based on my resume.",
      "How can I stay motivated during a long job search?"
    ]
  },
  {
    key: "tech_recruiter" as PersonaKey,
    name: "Sarah - Tech Recruiter",
    role: "FAANG & Startup Recruiter",
    icon: Briefcase,
    color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    description: "Focuses on technical skills, impact-driven metrics, portfolio polish, and coding interviews.",
    suggestions: [
      "Analyze my skills progress database and recommend what I should learn next.",
      "Help me prepare a strategy for my upcoming technical interview prep.",
      "Explain the Google X-Y-Z formula for resume bullet points."
    ]
  },
  {
    key: "career_strategist" as PersonaKey,
    name: "Marcus - Executive Advisor",
    role: "Hidden Market Specialist",
    icon: Sparkles,
    color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    description: "Specializes in targeting the hidden job market, elite networking, and LinkedIn positioning.",
    suggestions: [
      "Look at my saved jobs list and tell me what the core common skills are.",
      "Generate an outreach script targeting a company from my saved jobs list.",
      "Help me design a high-leverage weekly job hunt routine."
    ]
  },
  {
    key: "salary_negotiator" as PersonaKey,
    name: "Elena - Negotiation Expert",
    role: "Total Compensation Strategist",
    icon: Coins,
    color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    description: "Provides tactical scripts and email templates to maximize base salary, stock options, and sign-ons.",
    suggestions: [
      "Draft a salary counter-offer based on my target roles and skills.",
      "Tell me what negotiation leverage I have based on my resumes on file.",
      "Should I disclose my current salary expectations to a recruiter?"
    ]
  }
];

export default function CoachChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activePersona, setActivePersona] = useState<PersonaKey>("general");
  const [clearing, setClearing] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const shouldScroll = useRef(false);

  // Load chat history on mount
  async function loadHistory() {
    try {
      const res = await fetch("/api/ai/coach-chat");
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error("Failed to load chat history", err);
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    if (shouldScroll.current && chatEndRef.current) {
      const container = chatEndRef.current.parentElement;
      if (container) {
        const timer = setTimeout(() => {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: "smooth"
          });
          shouldScroll.current = false;
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [messages, loading]);

  async function handleSend(customText?: string) {
    const textToSend = customText || input;
    if (!textToSend.trim()) return;

    shouldScroll.current = true;
    const userMessage: Message = { role: "user", content: textToSend };
    setMessages((prev) => [...prev, userMessage]);
    if (!customText) setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/coach-chat", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-ai-model": typeof window !== "undefined" ? localStorage.getItem("pref_ai_model") || "gemini-flash" : "gemini-flash"
        },
        body: JSON.stringify({ message: textToSend, persona: activePersona })
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply || data.error }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, a communication error occurred. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  async function handleClearChat() {
    if (!confirm("Are you sure you want to clear your conversation history? This cannot be undone.")) return;
    setClearing(true);
    try {
      const res = await fetch("/api/ai/coach-chat", { method: "DELETE" });
      if (res.ok) {
        setMessages([]);
      }
    } catch (err) {
      console.error("Failed to clear chat", err);
    } finally {
      setClearing(false);
    }
  }

  const selectedCoach = PERSONAS.find(p => p.key === activePersona) || PERSONAS[0];
  const IconComponent = selectedCoach.icon;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-fade-in">
      
      {/* ── HERO BANNER ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-zinc-900 via-indigo-950 to-slate-900 p-6 md:p-7 text-white border border-indigo-900/40 shadow-xl">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 opacity-15 blur-3xl w-96 h-96 bg-indigo-500 rounded-full" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full uppercase tracking-wider">
                <Cpu className="w-3.5 h-3.5 text-indigo-400" /> AI Career Copilot
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Real-Time Database Synced
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">
              Interactive AI Career Coach Studio
            </h1>
            <p className="text-zinc-300 text-xs leading-relaxed">
              Ask anything! The coach dynamically inspects your uploaded resumes, active skills progress, mock interview logs, and saved target jobs.
            </p>
          </div>

          <div className="hidden lg:flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/15 p-3 rounded-2xl text-xs text-zinc-200">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="font-semibold text-[11px]">Synced: Resumes • Skills • Interviews • Jobs</span>
          </div>
        </div>
      </div>

      {/* ── WORKSPACE GRID ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start h-[calc(100vh-14rem)] min-h-[550px]">
        
        {/* Left Column: Coach Personas & Quick Tools (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4 h-full overflow-y-auto pr-1">
          <span className="text-xs font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block">
            Select Specialized Coach
          </span>

          <div className="space-y-2.5">
            {PERSONAS.map((p) => {
              const PIcon = p.icon;
              const isSelected = activePersona === p.key;
              return (
                <button
                  key={p.key}
                  onClick={() => setActivePersona(p.key)}
                  className={cn(
                    "w-full text-left p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer shadow-2xs",
                    isSelected 
                      ? "bg-white dark:bg-zinc-900 border-indigo-500 dark:border-indigo-500 shadow-md ring-1 ring-indigo-500/20" 
                      : "bg-white/60 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 hover:bg-white dark:hover:bg-zinc-900"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn("p-2.5 rounded-xl border shrink-0", p.color)}>
                      <PIcon className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <h3 className="font-extrabold text-xs text-zinc-900 dark:text-zinc-100">{p.name}</h3>
                      <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">{p.role}</p>
                      <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-2 mt-1">{p.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick Workflows */}
          <Card className="p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-2xl space-y-3 shadow-xs">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> One-Click Workflows
            </h3>
            <div className="grid grid-cols-1 gap-1.5">
              {[
                { label: "Draft LinkedIn Cold Outreach", text: "Write a professional, highly engaging LinkedIn cold outreach message to a Hiring Manager for a role matching my background. Keep it under 150 words." },
                { label: "Analyze Skill Gaps & Roadmap", text: "Based on my uploaded resume and active skill progress tracker, analyze my key skill gaps for a Senior position and outline a learning roadmap." },
                { label: "Salary Offer Counter Script", text: "Draft a highly tactical, confident salary counter-offer script and email template to negotiate a 12-15% increase or equity using my market value as leverage." },
                { label: "30-60-90 Day Success Plan", text: "Create a comprehensive 30-60-90 day success plan template for a new role matching my background." }
              ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(item.text)}
                  disabled={loading}
                  className="text-left text-xs p-2.5 bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 rounded-xl font-bold text-zinc-700 dark:text-zinc-300 transition-all cursor-pointer flex items-center justify-between group"
                >
                  <span className="text-[11px]">{item.label}</span>
                  <ArrowRight className="w-3 h-3 text-zinc-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              ))}
            </div>
          </Card>

          <div className="mt-auto pt-2">
            <Button
              variant="secondary"
              onClick={handleClearChat}
              disabled={clearing || messages.length === 0}
              className="w-full text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-800/50 cursor-pointer h-9 rounded-xl"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              {clearing ? "Clearing..." : "Clear Conversation History"}
            </Button>
          </div>
        </div>

        {/* Right Column: Interactive Chat Interface (8 cols) */}
        <div className="lg:col-span-8 flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm h-full overflow-hidden">
          
          {/* Active Coach Header */}
          <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-xl border shrink-0", selectedCoach.color)}>
                <IconComponent className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">{selectedCoach.name}</h2>
                <p className="text-[10px] text-zinc-400 font-semibold">{selectedCoach.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full text-[10px] font-extrabold">
              <ShieldCheck className="w-3 h-3" /> Live Synced
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className={cn("p-4 rounded-2xl border shadow-sm", selectedCoach.color)}>
                  <IconComponent className="w-8 h-8" />
                </div>
                <div className="space-y-1 max-w-sm">
                  <h3 className="font-black text-base text-zinc-900 dark:text-zinc-100">Start your Advisory Session</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Ask {selectedCoach.name.split(" - ")[0]} anything or select a prompt starter below.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-2 w-full max-w-md pt-2">
                  {selectedCoach.suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(suggestion)}
                      className="text-left text-xs p-3 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-2xl transition-all cursor-pointer flex items-center justify-between group shadow-2xs"
                    >
                      <span className="text-zinc-800 dark:text-zinc-200 font-semibold text-[11px]">{suggestion}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => {
              const isUser = m.role === "user";
              return (
                <div
                  key={i}
                  className={cn(
                    "flex gap-3 max-w-[85%] animate-fade-in",
                    isUser ? "ml-auto flex-row-reverse" : "mr-auto"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-2xl flex items-center justify-center shrink-0 border text-xs font-bold shadow-2xs",
                    isUser ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100" : selectedCoach.color
                  )}>
                    {isUser ? <User className="w-4 h-4" /> : <IconComponent className="w-4 h-4" />}
                  </div>

                  <div className={cn(
                    "p-4 rounded-2xl text-xs md:text-sm leading-relaxed whitespace-pre-wrap font-sans shadow-2xs",
                    isUser 
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-tr-none font-medium" 
                      : "bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-tl-none font-medium"
                  )}>
                    {m.content}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-3 mr-auto animate-pulse">
                <div className={cn("w-8 h-8 rounded-2xl flex items-center justify-center shrink-0 border", selectedCoach.color)}>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-4 rounded-2xl text-xs text-zinc-500 dark:text-zinc-400 rounded-tl-none font-medium">
                  Evaluating data & formulating personalized insights...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick-Select Prompt Chips */}
          {messages.length > 0 && (
            <div className="px-4 py-2.5 bg-zinc-50/50 dark:bg-zinc-950/50 border-t border-zinc-100 dark:border-zinc-800 flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-none">
              {selectedCoach.suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(suggestion)}
                  disabled={loading}
                  className="inline-block text-[11px] px-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full hover:border-indigo-500 cursor-pointer font-bold text-zinc-700 dark:text-zinc-300 transition-all shadow-2xs"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {/* Input Bar */}
          <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex gap-2">
            <Input
              placeholder={`Ask ${selectedCoach.name.split(" - ")[0]}...`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !loading && handleSend()}
              disabled={loading}
              className="flex-1 bg-zinc-50/80 dark:bg-zinc-950/80 focus:bg-white text-xs md:text-sm border-zinc-200 dark:border-zinc-800 rounded-2xl h-11 px-4"
            />
            <Button 
              onClick={() => handleSend()} 
              disabled={loading || !input.trim()}
              className="rounded-2xl px-5 h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer shrink-0 shadow-sm"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
