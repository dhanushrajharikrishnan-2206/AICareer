"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { 
  Upload, RefreshCw, FileText, Check, Copy, 
  Sparkles, Award, ArrowRight, CornerDownRight, 
  Trash2, Layers, Flame, Lightbulb, Zap, UserCheck
} from "lucide-react";

interface SavedImprovement {
  id: string;
  original: string;
  improved: string;
  rationale: string;
  tone: string;
  jobTitle: string;
  timestamp: string;
}

export default function ImproverPage() {
  const [text, setText] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [tone, setTone] = useState("star"); // star, executive, technical, concise
  const [improved, setImproved] = useState("");
  const [rationale, setRationale] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [fileName, setFileName] = useState("");
  
  // History tracking
  const [history, setHistory] = useState<SavedImprovement[]>([]);
  const [copied, setCopied] = useState(false);

  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (improved && resultRef.current) {
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [improved]);

  async function handleImprove() {
    setLoading(true);
    setImproved("");
    setRationale("");
    setCopied(false);

    try {
      const res = await fetch("/api/ai/improve", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-ai-model": typeof window !== "undefined" ? localStorage.getItem("pref_ai_model") || "gemini-flash" : "gemini-flash"
        },
        body: JSON.stringify({ text, jobTitle, tone })
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setImproved(`Error: ${data.error || "Failed to process text. Please try again."}`);
        setRationale("Please try again or select a different model in settings.");
        return;
      }
      
      const improvedText = data.improved || "An error occurred.";
      const rationaleText = data.rationale || "AI did not produce a separate rationale breakdown.";
      
      setImproved(improvedText);
      setRationale(rationaleText);

      // Save to local session history
      const newImprovement: SavedImprovement = {
        id: Date.now().toString(),
        original: text,
        improved: improvedText,
        rationale: rationaleText,
        tone,
        jobTitle: jobTitle || "General Role",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setHistory(prev => [newImprovement, ...prev]);

    } catch (e) {
      console.error(e);
      setImproved("Could not improve the text. Please check your network.");
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setUploading(true);
    setUploadProgress("Uploading file to AI engine...");

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        setUploadProgress("Extracting layout & structural contents with Gemini...");
        const base64 = reader.result as string;
        const res = await fetch("/api/ai/parse-pdf", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "x-ai-model": typeof window !== "undefined" ? localStorage.getItem("pref_ai_model") || "gemini-flash" : "gemini-flash"
          },
          body: JSON.stringify({ pdfBase64: base64, mode: "text" })
        });
        const json = await res.json();
        if (json.success && json.text) {
          setText(json.text);
        } else {
          setText(`[Failed to parse PDF: ${json.error || "Unknown error"}]`);
        }
      } catch (err: any) {
        setText(`[Error reading file: ${err.message || "Unknown error"}]`);
      } finally {
        setUploading(false);
        setUploadProgress("");
      }
    };
    reader.readAsDataURL(file);
  }

  function handleCopy() {
    navigator.clipboard.writeText(improved);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function deleteHistoryItem(id: string) {
    setHistory(prev => prev.filter(item => item.id !== id));
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12 animate-fade-in">
      
      {/* Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-zinc-900 to-indigo-950 p-6 text-white border border-indigo-900/30 shadow-md">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 opacity-10 blur-2xl w-80 h-80 bg-indigo-500 rounded-full" />
        <div className="relative z-10 max-w-2xl space-y-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-1 rounded-full uppercase tracking-wider">
            <Flame className="w-3.5 h-3.5" /> High-Impact Copywriter
          </span>
          <h1 className="text-2xl font-bold tracking-tight">Advanced Resume Improver & Copilot</h1>
          <p className="text-zinc-300 text-xs leading-relaxed">
            Upgrade weak bullet points into high-performing professional milestones. Choose standard STAR structures, executive tones, or high-density technical frameworks to stand out.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Workspace Form (7 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="p-6 border-zinc-200 shadow-sm space-y-5">
            <p className="text-xs font-black uppercase tracking-wider text-zinc-400">Bullet Improver Input</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700">Target Role Title (Optional)</label>
                <Input
                  placeholder="e.g. Senior Software Engineer"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="h-10 text-xs"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-zinc-700">Upload PDF Context (Optional)</label>
                  {fileName && (
                    <button 
                      onClick={() => { setFileName(""); setText(""); }}
                      className="text-[10px] text-zinc-400 hover:text-zinc-600 font-extrabold"
                    >
                      Clear File
                    </button>
                  )}
                </div>
                <label className="cursor-pointer border border-zinc-200 hover:border-indigo-400 hover:bg-zinc-50 px-3.5 h-10 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 text-zinc-700 transition-all select-none shadow-2xs">
                  <Upload className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{fileName ? `Change PDF` : "Extract from PDF"}</span>
                  <input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                </label>
              </div>
            </div>

            {uploading && (
              <div className="bg-zinc-900 text-emerald-400 rounded-xl p-3 text-xs flex items-center gap-2 font-mono">
                <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
                <span>{uploadProgress}</span>
              </div>
            )}

            {fileName && !uploading && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-xs flex items-center gap-2 text-emerald-800 font-semibold truncate">
                <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Active: {fileName}</span>
              </div>
            )}

            {/* Tone/Style Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-700 block">Select Improvement Goal & Tone</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "star", name: "STAR Method", desc: "Results & metrics", icon: Award },
                  { id: "executive", name: "Executive", desc: "Leadership vocabulary", icon: UserCheck },
                  { id: "technical", name: "Technical", desc: "Framework density", icon: Zap },
                  { id: "concise", name: "Minimalist", desc: "Concise summaries", icon: Layers }
                ].map((item) => {
                  const Icon = item.icon;
                  const active = tone === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setTone(item.id)}
                      className={`p-3 text-left border rounded-xl transition-all flex flex-col justify-between h-[76px] cursor-pointer ${
                        active 
                          ? "border-zinc-950 bg-zinc-950 text-white" 
                          : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 bg-white"
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <Icon className={`w-4 h-4 ${active ? "text-amber-400" : "text-zinc-500"}`} />
                        {active && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-xs font-extrabold block leading-none">{item.name}</span>
                        <span className={`text-[9px] font-medium leading-none block ${active ? "text-zinc-300" : "text-zinc-400"}`}>{item.desc}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-700">Original Bullet Point or Paragraph</label>
              <Textarea
                rows={5}
                placeholder="e.g. Worked with teams to build the web app and design frontend buttons..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="text-xs font-sans leading-relaxed"
              />
            </div>

            <Button 
              onClick={handleImprove} 
              disabled={loading || !text}
              className="w-full h-11 bg-zinc-950 hover:bg-zinc-850 text-white font-extrabold text-sm rounded-xl cursor-pointer"
            >
              {loading ? "Transforming text..." : "⚡ Upgrade Resume Bullet"}
            </Button>
          </Card>

          {/* Side by Side Comparative Diff & Upgrade Breakdown */}
          {improved && (
            <div ref={resultRef} className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Before Column */}
                <Card className="p-5 border-rose-100 bg-rose-50/5/5 shadow-2xs space-y-3 relative overflow-hidden bg-rose-50/10">
                  <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-5 bg-rose-500 w-24 h-24 rounded-full" />
                  <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider font-extrabold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-md">
                    Original bullet
                  </span>
                  <p className="text-xs text-rose-950 font-medium whitespace-pre-wrap leading-relaxed">
                    {text}
                  </p>
                </Card>

                {/* After Column */}
                <Card className="p-5 border-emerald-100 bg-emerald-50/10 shadow-2xs space-y-3 relative overflow-hidden">
                  <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-5 bg-emerald-500 w-24 h-24 rounded-full" />
                  <div className="flex justify-between items-center">
                    <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                      AI Improved
                    </span>
                    <Button
                      variant="secondary"
                      onClick={handleCopy}
                      className="h-7 text-[10px] text-emerald-800 hover:text-emerald-950 hover:bg-emerald-100/50 flex items-center gap-1.5 px-2.5 border border-emerald-200 bg-white"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      {copied ? "Copied" : "Copy Rewrite"}
                    </Button>
                  </div>
                  <p className="text-xs text-emerald-950 font-bold whitespace-pre-wrap leading-relaxed font-mono">
                    {improved}
                  </p>
                </Card>
              </div>

              {/* Upgrade Rationale */}
              <Card className="p-5 border-zinc-200 shadow-sm space-y-3 bg-white">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-amber-500 fill-amber-100" />
                  <p className="text-xs font-black uppercase tracking-wider text-zinc-800">Transformation Rationale</p>
                </div>
                <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-150 text-xs text-zinc-600 leading-relaxed font-medium">
                  {rationale}
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* History Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="p-5 border-zinc-200 shadow-sm space-y-4 h-full bg-white">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-wider text-zinc-400">Session History</p>
              <span className="text-[10px] text-zinc-400 font-bold">{history.length} items</span>
            </div>

            {history.length > 0 ? (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                {history.map((item) => (
                  <div key={item.id} className="p-3 bg-zinc-50 hover:bg-zinc-100/50 border border-zinc-150 rounded-xl space-y-2 text-xs relative group transition-all">
                    <button 
                      onClick={() => deleteHistoryItem(item.id)}
                      className="absolute right-2 top-2 text-zinc-400 hover:text-red-500 transition-colors p-1 rounded bg-white border border-zinc-100 shadow-2xs cursor-pointer opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>

                    <div className="flex items-center justify-between w-full">
                      <span className="text-[9px] uppercase tracking-wider font-extrabold bg-zinc-200/60 px-1.5 py-0.5 rounded text-zinc-700">
                        {item.tone.toUpperCase()} style
                      </span>
                      <span className="text-[10px] text-zinc-400 font-semibold">{item.timestamp}</span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] text-zinc-400 font-bold uppercase">Before</p>
                      <p className="text-[11px] text-zinc-500 truncate font-sans">{item.original}</p>
                    </div>

                    <div className="space-y-1 pt-1.5 border-t border-zinc-200/50">
                      <div className="flex justify-between items-center">
                        <p className="text-[10px] text-zinc-700 font-bold uppercase">Improved</p>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(item.improved);
                          }}
                          className="text-[10px] text-indigo-600 hover:underline font-bold flex items-center gap-0.5"
                        >
                          <Copy className="w-2.5 h-2.5" /> Copy
                        </button>
                      </div>
                      <p className="text-[11px] text-zinc-800 font-bold font-mono leading-relaxed line-clamp-2">{item.improved}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-zinc-400 space-y-2">
                <CornerDownRight className="w-5 h-5 mx-auto text-zinc-300" />
                <p className="text-xs italic font-medium">Your optimized bullet history will show here during this session.</p>
              </div>
            )}
          </Card>
        </div>

      </div>
    </div>
  );
}
