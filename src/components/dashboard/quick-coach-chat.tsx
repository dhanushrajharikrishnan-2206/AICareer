"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, User, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PRESETS = [
  "Draft a cold outreach LinkedIn message",
  "How should I explain a 6-month career gap?",
  "Give me 3 salary negotiation scripts"
];

export function QuickCoachChat() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    {
      role: "assistant",
      content: "Hi there! I'm your AI Career Coach. Ask me anything about your job hunt, interview prep, or resume strategies!"
    }
  ]);
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const shouldScroll = useRef(false);

  useEffect(() => {
    if (!shouldScroll.current) return;
    if (endRef.current) {
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
  }, [messages, loading]);

  async function handleSend(textToSend?: string) {
    const activeText = textToSend || message;
    if (!activeText.trim() || loading) return;

    shouldScroll.current = true;
    setMessage("");
    setMessages(prev => [...prev, { role: "user", content: activeText }]);
    setLoading(true);

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
      } else if (data.error) {
        setMessages(prev => [...prev, { role: "assistant", content: `Error: ${data.error}` }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I ran into an error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-[380px] border border-ink/10 rounded-xl bg-card overflow-hidden">
      {/* Header */}
      <div className="bg-ink/5 px-4 py-3 border-b border-ink/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold text-sm">Ask your AI Career Coach</span>
        </div>
        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-medium px-1.5 py-0.5 rounded-full">
          Online
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 scrollbar-thin">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-2.5 max-w-[85%] ${
              msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                msg.role === "user" ? "bg-ink/10 text-ink" : "bg-emerald-600 text-white"
              }`}
            >
              {msg.role === "user" ? <User className="w-3 h-3" /> : "AI"}
            </div>
            <div
              className={`text-xs px-3 py-2 rounded-xl whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-ink text-white rounded-tr-none"
                  : "bg-ink/5 text-ink rounded-tl-none border border-ink/5"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-2.5 max-w-[85%]">
            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 text-[10px] font-bold">
              AI
            </div>
            <div className="bg-ink/5 text-ink rounded-xl rounded-tl-none border border-ink/5 p-3 flex gap-1 items-center">
              <span className="w-1.5 h-1.5 bg-ink/40 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-ink/40 rounded-full animate-bounce delay-150" />
              <span className="w-1.5 h-1.5 bg-ink/40 rounded-full animate-bounce delay-300" />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Presets when empty */}
      {messages.length === 1 && !loading && (
        <div className="px-4 pb-1 space-y-1.5">
          <p className="text-[10px] text-ink/40 uppercase font-semibold tracking-wider">Quick prompts:</p>
          <div className="flex flex-col gap-1">
            {PRESETS.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(preset)}
                className="text-left text-[11px] px-2.5 py-1.5 rounded-lg border border-ink/10 hover:bg-ink/5 hover:border-ink/20 transition-all text-ink/80 flex items-center justify-between"
              >
                <span>{preset}</span>
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 shrink-0 text-ink/40" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-ink/10 bg-card flex gap-2">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your career or resume question..."
          className="text-xs flex-1"
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <Button onClick={() => handleSend()} disabled={loading} className="px-3 py-1.5 text-xs shrink-0">
          <Send className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
