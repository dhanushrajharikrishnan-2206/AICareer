"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, Sparkles, User, ArrowRight, MessageSquare, X, Minimize2, Maximize2, RefreshCw, Volume2, Sparkle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const CHARACTER_PRESETS = [
  "Do I have any skills gap for my saved jobs?",
  "Analyze my active career milestones.",
  "Help me prepare for my upcoming interview drills.",
  "Recommend what skill I should learn next."
];

const SPEECH_BUBBLES = [
  "Psst! Need me to draft a LinkedIn hook?",
  "I have synchronized your resumes. Ask me anything!",
  "Let's check your ATS match rating for active roles!",
  "Ready to crush your next technical screen? 🚀",
  "Hover me for an interactive secret spin!"
];

export function AnimatedCoach() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I am Gemmy, your animated workspace companion. I have complete access to your saved jobs, resume variants, and skills roadmap. Ask me any targeted question!"
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [mood, setMood] = useState<"idle" | "thinking" | "happy" | "talking">("idle");
  const [bubbleText, setBubbleText] = useState("");
  const [showBubble, setShowBubble] = useState(false);
  const [spinCount, setSpinCount] = useState(0);

  const endRef = useRef<HTMLDivElement>(null);
  const shouldScroll = useRef(false);

  // Cycle idle speech bubbles
  useEffect(() => {
    if (isOpen) {
      setShowBubble(false);
      return;
    }

    // Show initial bubble after 3 seconds
    const initialTimeout = setTimeout(() => {
      setBubbleText(SPEECH_BUBBLES[0]);
      setShowBubble(true);
    }, 4000);

    // Rotate every 15 seconds
    const interval = setInterval(() => {
      const idx = Math.floor(Math.random() * SPEECH_BUBBLES.length);
      setBubbleText(SPEECH_BUBBLES[idx]);
      setShowBubble(true);
      
      // Hide after 6 seconds
      setTimeout(() => setShowBubble(false), 6000);
    }, 15000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && shouldScroll.current && endRef.current) {
      const container = endRef.current.parentElement;
      if (container) {
        const timer = setTimeout(() => {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: "smooth"
          });
          shouldScroll.current = false;
        }, 100);
        return () => clearTimeout(timer);
      } else {
        endRef.current.scrollIntoView({ behavior: "smooth" });
        shouldScroll.current = false;
      }
    }
  }, [messages, loading, isOpen]);

  async function handleSend(textToSend?: string) {
    const activeText = textToSend || message;
    if (!activeText.trim() || loading) return;

    shouldScroll.current = true;
    setMessage("");
    setMessages(prev => [...prev, { role: "user", content: activeText }]);
    setLoading(true);
    setMood("thinking");

    try {
      const res = await fetch("/api/ai/coach-chat", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-ai-model": typeof window !== "undefined" ? localStorage.getItem("pref_ai_model") || "gemini-flash" : "gemini-flash"
        },
        body: JSON.stringify({ message: activeText, persona: "general" })
      });
      const data = await res.json();
      if (data.reply) {
        setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
        setMood("talking");
        setTimeout(() => setMood("idle"), 4000);
      } else if (data.error) {
        setMessages(prev => [...prev, { role: "assistant", content: `Error: ${data.error}` }]);
        setMood("idle");
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I ran into an error. Let's try again." }]);
      setMood("idle");
    } finally {
      setLoading(false);
    }
  }

  function triggerInteractiveSpin() {
    setSpinCount(prev => prev + 1);
    setMood("happy");
    setBubbleText("Woohoo! Spin time! 🌀");
    setShowBubble(true);
    setTimeout(() => {
      setMood("idle");
      setShowBubble(false);
    }, 2500);
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none" id="animated-coach-root">
      
      {/* 1. THE MAIN CHATWINDOW DIALOGUE OVERLAY */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="w-[360px] md:w-[420px] h-[520px] bg-white/95 backdrop-blur-md border border-zinc-200 shadow-2xl rounded-2xl overflow-hidden flex flex-col pointer-events-auto mb-4 mr-1"
          >
            {/* Header */}
            <div className="bg-zinc-950 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {/* Micro Animated Avatar in header */}
                <div className="relative w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 overflow-hidden flex items-center justify-center shrink-0">
                  <motion.div
                    animate={{
                      y: mood === "thinking" ? [0, -3, 0] : 0,
                    }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="w-5 h-5"
                  >
                    <svg viewBox="0 0 100 100" className="w-full h-full fill-emerald-400">
                      <circle cx="50" cy="50" r="40" />
                      <circle cx="35" cy="45" r="8" className="fill-white" />
                      <circle cx="65" cy="45" r="8" className="fill-white" />
                      {mood === "thinking" ? (
                        <rect x="35" y="65" width="30" height="8" rx="4" className="fill-white" />
                      ) : (
                        <path d="M 35 65 Q 50 80 65 65" stroke="white" strokeWidth="6" strokeLinecap="round" fill="none" />
                      )}
                    </svg>
                  </motion.div>
                </div>
                
                <div>
                  <h3 className="font-extrabold text-xs text-white tracking-wide uppercase flex items-center gap-1.5">
                    Gemmy Workspace Companion
                  </h3>
                  <p className="text-[10px] text-zinc-400 font-semibold">
                    {loading ? "Analyzing profile databases..." : "Synced with real workspace profile"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Sync Alert bar */}
            <div className="bg-emerald-50 border-b border-emerald-100 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Direct Workspace Integration Active</p>
              </div>
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100" />
            </div>

            {/* Conversation Flow */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin bg-zinc-50/50">
              {messages.map((msg, idx) => {
                const isUser = msg.role === "user";
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-start gap-2.5 max-w-[85%] ${
                      isUser ? "ml-auto flex-row-reverse" : "mr-auto"
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-black text-[10px] shadow-sm ${
                        isUser ? "bg-zinc-100 text-zinc-800" : "bg-emerald-600 text-white"
                      }`}
                    >
                      {isUser ? <User className="w-3.5 h-3.5" /> : "G"}
                    </div>
                    <div
                      className={`text-xs p-3 rounded-2xl whitespace-pre-wrap leading-relaxed shadow-xs border ${
                        isUser
                          ? "bg-zinc-950 text-white rounded-tr-none border-zinc-900"
                          : "bg-white text-zinc-800 rounded-tl-none border-zinc-200/80"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </motion.div>
                );
              })}

              {loading && (
                <div className="flex items-start gap-2.5 max-w-[85%] mr-auto">
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 font-bold text-xs shadow-sm animate-pulse">
                    G
                  </div>
                  <div className="bg-white text-zinc-600 border border-zinc-200/80 rounded-2xl rounded-tl-none p-3 shadow-xs flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce delay-150" />
                    <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce delay-300" />
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Presets Grid */}
            {messages.length === 1 && !loading && (
              <div className="p-4 bg-white border-t border-zinc-100 space-y-2">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500 fill-amber-400" /> Try Workspace Inquiries:
                </p>
                <div className="grid grid-cols-1 gap-1.5">
                  {CHARACTER_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(preset)}
                      className="text-left text-xs font-semibold px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 hover:bg-zinc-100 hover:border-zinc-300 transition-all text-zinc-700 flex items-center justify-between group"
                    >
                      <span className="truncate">{preset}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-400 opacity-0 group-hover:opacity-100 transition-all" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Footer Input */}
            <div className="p-3 bg-white border-t border-zinc-100 flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask about resumes, skills gaps, or interviews..."
                className="text-xs flex-1 rounded-xl h-10 border-zinc-200 focus:border-emerald-500 bg-zinc-50/50"
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
              <Button
                onClick={() => handleSend()}
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-500 text-white shrink-0 font-bold text-xs h-10 px-4 rounded-xl flex items-center justify-center"
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. CUTE SPEECH BUBBLE ABOVE CHARACTER */}
      <AnimatePresence>
        {showBubble && !isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 5 }}
            className="mb-3 px-3.5 py-2.5 bg-zinc-950 text-white rounded-2xl text-[11px] font-semibold tracking-wide shadow-xl max-w-[220px] relative pointer-events-auto cursor-pointer border border-zinc-800"
            onClick={() => {
              shouldScroll.current = true;
              setIsOpen(true);
            }}
          >
            {bubbleText}
            {/* Arrow */}
            <div className="absolute right-6 bottom-0 translate-y-1/2 rotate-45 w-2 h-2 bg-zinc-950 border-r border-b border-zinc-800" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. THE FLOATING ANIMATED CHARACTER */}
      <div className="relative pointer-events-auto flex items-end justify-end">
        
        {/* Soft shadow that updates based on height */}
        <motion.div
          animate={{
            scale: mood === "thinking" ? [1, 1.15, 1] : [1, 0.85, 1],
            opacity: [0.35, 0.15, 0.35]
          }}
          transition={{
            repeat: Infinity,
            duration: mood === "thinking" ? 1.5 : 4,
            ease: "easeInOut"
          }}
          className="absolute bottom-0 right-1 w-14 h-2 bg-black/40 rounded-full blur-xs -z-10"
        />

        {/* Character Button */}
        <motion.button
          onClick={() => {
            const nextOpen = !isOpen;
            if (nextOpen) {
              shouldScroll.current = true;
            }
            setIsOpen(nextOpen);
            setShowBubble(false);
          }}
          onHoverStart={() => {
            if (mood === "idle") setMood("happy");
          }}
          onHoverEnd={() => {
            if (mood === "happy") setMood("idle");
          }}
          onDoubleClick={triggerInteractiveSpin}
          animate={{
            y: mood === "thinking" ? [0, -6, 0] : [0, -10, 0],
            rotate: spinCount * 360
          }}
          transition={{
            y: {
              repeat: Infinity,
              duration: mood === "thinking" ? 1.2 : 3.5,
              ease: "easeInOut"
            },
            rotate: {
              duration: 0.8,
              ease: "easeOut"
            }
          }}
          className={`w-16 h-16 rounded-full flex items-center justify-center shadow-xl relative border cursor-pointer transition-colors focus:outline-none ${
            isOpen 
              ? "bg-zinc-950 border-zinc-800 text-emerald-400" 
              : "bg-emerald-600 hover:bg-emerald-500 border-emerald-500/30 text-white"
          }`}
          title="Double click me for a secret spin!"
        >
          {/* Animated Face and Eyes */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-3">
            
            {/* Antenna LED */}
            <motion.div
              animate={{
                opacity: [0.5, 1, 0.5],
                scale: mood === "thinking" ? [1, 1.3, 1] : 1
              }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className={`absolute top-1.5 w-1.5 h-1.5 rounded-full ${
                mood === "thinking" ? "bg-amber-400" : "bg-emerald-300"
              }`}
            />

            {/* Face Shield Container */}
            <div className="w-11 h-11 bg-zinc-950 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden border border-zinc-800/80 shadow-inner">
              
              {/* Inner glowing grids */}
              <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:8px_8px] opacity-15" />

              {/* EYE ROW */}
              <div className="flex gap-2.5 z-10">
                {/* Left Eye */}
                <motion.div
                  animate={{
                    scaleY: mood === "thinking" ? [1, 0.1, 1] : [1, 0.1, 1],
                    height: mood === "thinking" ? 3 : 6,
                    width: mood === "thinking" ? 6 : 6
                  }}
                  transition={{
                    repeat: Infinity,
                    repeatDelay: mood === "thinking" ? 1 : 4,
                    duration: 0.15
                  }}
                  className={`rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)] ${
                    mood === "thinking" ? "bg-amber-400" : "bg-emerald-400"
                  }`}
                />

                {/* Right Eye */}
                <motion.div
                  animate={{
                    scaleY: mood === "thinking" ? [1, 0.1, 1] : [1, 0.1, 1],
                    height: mood === "thinking" ? 3 : 6,
                    width: mood === "thinking" ? 6 : 6
                  }}
                  transition={{
                    repeat: Infinity,
                    repeatDelay: mood === "thinking" ? 1 : 4.2,
                    duration: 0.15
                  }}
                  className={`rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)] ${
                    mood === "thinking" ? "bg-amber-400" : "bg-emerald-400"
                  }`}
                />
              </div>

              {/* MOUTH OR VOICE WAVE */}
              <div className="mt-1.5 z-10 h-1.5 flex items-center gap-0.5">
                {mood === "thinking" ? (
                  <div className="w-3 h-1 bg-amber-400/80 rounded-full animate-pulse" />
                ) : mood === "talking" ? (
                  <>
                    <motion.div animate={{ height: [2, 6, 2] }} transition={{ repeat: Infinity, duration: 0.2 }} className="w-0.5 bg-emerald-400" />
                    <motion.div animate={{ height: [1, 8, 1] }} transition={{ repeat: Infinity, duration: 0.25 }} className="w-0.5 bg-emerald-400" />
                    <motion.div animate={{ height: [2, 6, 2] }} transition={{ repeat: Infinity, duration: 0.2 }} className="w-0.5 bg-emerald-400" />
                  </>
                ) : mood === "happy" ? (
                  // Smiling arc
                  <svg className="w-4 h-1.5 stroke-emerald-400 fill-none" viewBox="0 0 10 4">
                    <path d="M 1 1 Q 5 4 9 1" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                ) : (
                  // Neutral line
                  <div className="w-3 h-[1.5px] bg-emerald-400/80 rounded-full" />
                )}
              </div>

            </div>

          </div>

          {/* Little green notification bubble */}
          {!isOpen && (
            <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border border-white"></span>
            </span>
          )}

        </motion.button>
      </div>

    </div>
  );
}
