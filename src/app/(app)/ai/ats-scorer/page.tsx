"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { 
  Upload, FileText, Check, Copy, Sparkles, AlertCircle, RefreshCw, 
  CheckSquare, GraduationCap, Compass, Lightbulb, Briefcase, ChevronRight, HelpCircle,
  Globe, Link, ArrowUpRight, ShieldCheck, Zap, Layers, Target, BarChart3, Award
} from "lucide-react";

export default function AtsScorerPage() {
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [scraping, setScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState("");
  const [scrapeSuccess, setScrapeSuccess] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [fileName, setFileName] = useState("");
  const [copiedType, setCopiedType] = useState<string | null>(null);

  const resultRef = useRef<HTMLDivElement>(null);
  const shouldScroll = useRef(false);

  async function handleScrape() {
    if (!jobUrl) return;
    setScraping(true);
    setScrapeError("");
    setScrapeSuccess(false);

    try {
      const res = await fetch("/api/ai/scrape-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: jobUrl })
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setScrapeError(data.error || "Failed to scrape job details.");
      } else {
        const fullDesc = `Job Title: ${data.title}\n\n${data.description}`;
        setJobDescription(fullDesc);
        setScrapeSuccess(true);
        setTimeout(() => setScrapeSuccess(false), 5000);
      }
    } catch (err: any) {
      setScrapeError(err.message || "Failed to connect to the scraping service.");
    } finally {
      setScraping(false);
    }
  }

  useEffect(() => {
    if (result && shouldScroll.current) {
      shouldScroll.current = false;
      const timer = setTimeout(() => {
        if (resultRef.current) {
          try {
            resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
          } catch (e) {
            try { resultRef.current.scrollIntoView(true); } catch (err) {}
          }
          try {
            const rect = resultRef.current.getBoundingClientRect();
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const targetY = rect.top + scrollTop - 24;
            window.scrollTo({ top: targetY, behavior: "smooth" });
          } catch (e) {}
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [result]);

  async function handleScore() {
    setLoading(true);
    shouldScroll.current = true;
    try {
      const res = await fetch("/api/ai/ats-score", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-ai-model": typeof window !== "undefined" ? localStorage.getItem("pref_ai_model") || "gemini-flash" : "gemini-flash"
        },
        body: JSON.stringify({ resumeText, jobDescription })
      });
      setResult(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setUploading(true);
    setUploadProgress("Uploading file to AI engine...");

    const reader = new FileReader();

    if (file.name.endsWith(".pdf")) {
      reader.onload = async () => {
        try {
          setUploadProgress("Extracting PDF contents with Gemini AI...");
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
            setResumeText(json.text);
          } else {
            setResumeText(`[Failed to parse PDF: ${json.error || "Unknown error"}]`);
          }
        } catch (err: any) {
          setResumeText(`[Error reading file: ${err.message || "Unknown error"}]`);
        } finally {
          setUploading(false);
          setUploadProgress("");
        }
      };
      reader.readAsDataURL(file);
    } else {
      reader.onload = (event) => {
        setResumeText(event.target?.result as string || "");
        setUploading(false);
        setUploadProgress("");
      };
      reader.readAsText(file);
    }
  }

  function handleCopy(text: string, type: string) {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  }

  // Tailored prompts based on ATS evaluation
  const resumePrompt = result ? `Act as an elite executive resume writer. Take my existing resume text:
"""
${resumeText}
"""

Optimize it to match this job description:
"""
${jobDescription}
"""

Incorporate these MISSING Keywords seamlessly: ${result.missingKeywords?.join(", ") || "Provide generic target keywords"}.
Ensure every accomplishment is formatted using the Google X-Y-Z formula: "Accomplished [X] as measured by [Y], by doing [Z]" and uses active verbs.` : "";

  const coverLetterPrompt = result ? `Act as an expert career counselor. Write a highly tailored, persuasive, single-page Cover Letter on my behalf targeting the following role:
"""
Job Description: ${jobDescription}
"""

My profile keywords and background:
- Matched strengths: ${result.matchedKeywords?.join(", ") || "Not specified"}
- Target attributes: ${result.missingKeywords?.join(", ") || "Not specified"}
- Base Resume background: ${resumeText.slice(0, 400)}...

Format it with a modern minimalist layout, and ensure the tone is highly confident and professional.` : "";

  const sectionImproverPrompt = result ? `Act as an expert resume editor. Here is a section or bullet point from my resume:
"""
${resumeText.slice(0, 300)}
"""

Rewrite this specific section to emphasize and incorporate these missing target competencies: ${result.missingKeywords?.slice(0, 3).join(", ") || "Not specified"}. Provide 3 alternate high-impact bullet variants.` : "";

  const getScoreColor = (score: number) => {
    if (score >= 75) return { color: "#10b981", badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30", text: "text-emerald-500", label: "🚀 Excellent ATS Match" };
    if (score >= 50) return { color: "#f59e0b", badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30", text: "text-amber-500", label: "⚠️ Moderate Keywords Match" };
    return { color: "#ef4444", badge: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30", text: "text-rose-500", label: "❌ Optimization Required" };
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12 animate-fade-in">
      
      {/* ── HERO BANNER ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-zinc-900 via-indigo-950 to-slate-900 p-6 md:p-8 text-white border border-indigo-900/40 shadow-xl">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 opacity-15 blur-3xl w-96 h-96 bg-indigo-500 rounded-full" />
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full uppercase tracking-wider">
              <Target className="w-3.5 h-3.5" /> AI Keyword Matcher
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" /> Real-time Scorer
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">
            ATS Resume Scorer & Optimization Engine
          </h1>
          <p className="text-zinc-300 text-xs md:text-sm leading-relaxed">
            Audit your resume against specific target job specs, extract crucial missing keywords, and automatically generate tailored AI prompt prompts for Gemini & ChatGPT.
          </p>
        </div>
      </div>

      {/* ── MAIN WORKSPACE GRID ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Input Forms (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Resume Upload & Text Input */}
          <Card className="p-5 border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3 bg-white dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-500" /> Resume Content
              </span>
              
              <label className="cursor-pointer bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700/60 border border-zinc-200 dark:border-zinc-700 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 text-zinc-700 dark:text-zinc-200 transition-all select-none shadow-2xs">
                <Upload className="w-3.5 h-3.5 text-zinc-500" />
                <span>{fileName ? `Change File` : "Upload PDF / TXT"}</span>
                <input
                  type="file"
                  accept=".pdf,.txt"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </label>
            </div>

            {uploading && (
              <div className="bg-zinc-900 text-emerald-400 rounded-xl p-3 text-xs flex items-center gap-2 font-mono border border-emerald-500/30">
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-400 shrink-0" />
                <span>{uploadProgress}</span>
                {fileName && <span className="text-zinc-500 truncate ml-auto">({fileName})</span>}
              </div>
            )}

            {fileName && !uploading && (
              <div className="bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl px-3.5 py-2 text-xs flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold">
                <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="truncate">Active File: {fileName}</span>
                <button 
                  onClick={() => { setFileName(""); setResumeText(""); }}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 ml-auto font-bold text-[11px]"
                >
                  Clear
                </button>
              </div>
            )}

            <Textarea
              rows={8}
              className="text-xs font-mono leading-relaxed bg-zinc-50/50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 rounded-xl"
              placeholder="Paste your resume text or click Upload PDF above..."
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
            />
          </Card>

          {/* Job Scraper & Description Card */}
          <Card className="p-5 border-zinc-200 dark:border-zinc-800 space-y-4 bg-white dark:bg-zinc-900 shadow-sm">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block mb-2 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-indigo-500" /> Target Job URL (Auto-Scrape)
              </span>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Globe className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                  <input
                    type="url"
                    placeholder="https://careers.google.com/jobs/results/12345..."
                    value={jobUrl}
                    onChange={(e) => setJobUrl(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-zinc-900 dark:text-zinc-100 font-medium"
                  />
                </div>
                <Button
                  onClick={handleScrape}
                  disabled={scraping || !jobUrl}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 h-9 rounded-xl text-xs transition-all cursor-pointer shrink-0 shadow-sm"
                >
                  {scraping ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Scraping...
                    </>
                  ) : (
                    "Scrape Job"
                  )}
                </Button>
              </div>
              {scrapeSuccess && (
                <p className="mt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Successfully extracted job details & title!
                </p>
              )}
              {scrapeError && (
                <p className="mt-2 text-xs font-semibold text-rose-600 dark:text-rose-400 leading-relaxed">
                  ⚠️ {scrapeError}
                </p>
              )}
            </div>

            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3">
              <span className="text-xs font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block mb-2">
                Target Job Description
              </span>
              <Textarea
                rows={7}
                className="text-xs leading-relaxed bg-zinc-50/50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 rounded-xl"
                placeholder="Paste the target job description here (or auto-fill via URL scraping above)..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </div>
          </Card>

          {/* Action Trigger */}
          <Button 
            className="w-full bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 hover:from-indigo-500 hover:to-purple-600 text-white font-black text-sm h-12 rounded-2xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2" 
            onClick={handleScore} 
            disabled={loading || !resumeText || !jobDescription}
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Analyzing Keywords & Evaluating Fit...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-amber-300" />
                Audit Resume & Calculate ATS Score
              </>
            )}
          </Button>

          {/* Tailored Prompts Panel */}
          {result && !result.error && (
            <Card className="p-6 border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/30 dark:bg-indigo-950/20 space-y-4 rounded-2xl shadow-sm">
              <div className="flex items-center gap-2 border-b border-indigo-200/50 dark:border-indigo-800/50 pb-3">
                <Sparkles className="w-5 h-5 text-amber-500 fill-amber-400" />
                <div>
                  <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                    Custom AI Command Prompts
                  </h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Use these tailored prompts in our Career Coach or Gemini to instantly generate target materials.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {/* Resume Prompt Card */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      Resume Rewrite Prompt
                    </span>
                    <button
                      onClick={() => handleCopy(resumePrompt, "resume")}
                      className="text-xs font-bold text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {copiedType === "resume" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedType === "resume" ? "Copied!" : "Copy Prompt"}</span>
                    </button>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
                    Optimizes accomplishments using Google X-Y-Z formula and injects missing keywords seamlessly.
                  </p>
                </div>

                {/* Cover Letter Prompt Card */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      Cover Letter Prompt
                    </span>
                    <button
                      onClick={() => handleCopy(coverLetterPrompt, "letter")}
                      className="text-xs font-bold text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {copiedType === "letter" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedType === "letter" ? "Copied!" : "Copy Prompt"}</span>
                    </button>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
                    Drafts a high-converting cover letter aligned with matched strengths and company specifications.
                  </p>
                </div>

                {/* Section Improver Prompt */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      Bullet Point Improver Prompt
                    </span>
                    <button
                      onClick={() => handleCopy(sectionImproverPrompt, "improve")}
                      className="text-xs font-bold text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {copiedType === "improve" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedType === "improve" ? "Copied!" : "Copy Prompt"}</span>
                    </button>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
                    Generates 3 high-impact alternate bullet variants incorporating missing target competencies.
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Score Results Display (5 Cols) */}
        <div ref={resultRef} className="lg:col-span-5 space-y-5">
          {result && !result.error ? (
            <div className="space-y-5 animate-fade-in">
              
              {/* Radial Score Gauge Card */}
              <Card className="p-6 text-center space-y-3 border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900 rounded-2xl relative overflow-hidden">
                <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block">
                  Overall ATS Keyword Match
                </span>
                
                <div className="relative w-36 h-36 mx-auto flex items-center justify-center my-2">
                  <svg className="absolute w-full h-full transform -rotate-90">
                    <circle cx="72" cy="72" r="60" stroke="currentColor" className="text-zinc-100 dark:text-zinc-800" strokeWidth="10" fill="transparent" />
                    <circle 
                      cx="72" 
                      cy="72" 
                      r="60" 
                      stroke={getScoreColor(result.atsScore).color} 
                      strokeWidth="10" 
                      strokeDasharray={`${2 * Math.PI * 60}`} 
                      strokeDashoffset={`${2 * Math.PI * 60 * (1 - result.atsScore / 100)}`}
                      strokeLinecap="round"
                      fill="transparent" 
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="flex flex-col items-center">
                    <span className="text-4xl font-black text-zinc-950 dark:text-zinc-50">{result.atsScore}%</span>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase">Match Score</span>
                  </div>
                </div>

                <div className="pt-1">
                  <span className={`inline-flex items-center gap-1 text-xs font-extrabold px-3 py-1 rounded-full border ${getScoreColor(result.atsScore).badge}`}>
                    {getScoreColor(result.atsScore).label}
                  </span>
                </div>
              </Card>

              {/* Matched Keywords */}
              <Card className="p-5 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-2xl space-y-3 shadow-sm">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Matched Keywords
                  </span>
                  <span className="text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                    {result.matchedKeywords?.length || 0} Found
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(result.matchedKeywords || []).length > 0 ? (
                    (result.matchedKeywords as string[]).map((kw, i) => (
                      <span key={i} className="text-xs bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-semibold px-2.5 py-1 rounded-xl">
                        ✓ {kw}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-zinc-400 italic">No exact matches detected yet.</span>
                  )}
                </div>
              </Card>

              {/* Missing Keywords */}
              <Card className="p-5 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-2xl space-y-3 shadow-sm">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" /> Missing Keywords
                  </span>
                  <span className="text-[10px] font-extrabold bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded-full">
                    {result.missingKeywords?.length || 0} Missing
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(result.missingKeywords || []).length > 0 ? (
                    (result.missingKeywords as string[]).map((kw, i) => (
                      <span key={i} className="text-xs bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-semibold px-2.5 py-1 rounded-xl">
                        + {kw}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-zinc-400 italic">Perfect match! No keywords missing.</span>
                  )}
                </div>
              </Card>

              {/* Optimization Suggestions */}
              <Card className="p-5 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-2xl space-y-3 shadow-sm">
                <span className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                  <Lightbulb className="w-4 h-4 text-amber-500" /> Optimization Suggestions
                </span>
                <ul className="text-xs text-zinc-600 dark:text-zinc-300 space-y-2 pl-4 list-disc font-medium leading-relaxed">
                  {(result.suggestions as string[])?.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </Card>

              {/* Interview Preparation Checklist */}
              {result.top5InterviewTips && result.top5InterviewTips.length > 0 && (
                <Card className="p-5 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-2xl space-y-3 shadow-sm">
                  <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2.5">
                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                    <h3 className="font-extrabold text-xs uppercase tracking-wide text-zinc-900 dark:text-zinc-100">
                      Top 5 Interview Prep Checklist
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {result.top5InterviewTips.map((item: any, i: number) => (
                      <div key={i} className="flex items-start gap-3 p-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                        <input 
                          type="checkbox" 
                          id={`tip-${i}`} 
                          className="mt-0.5 w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                        />
                        <label htmlFor={`tip-${i}`} className="text-xs leading-relaxed text-zinc-700 dark:text-zinc-300 cursor-pointer select-none">
                          <span className="font-bold text-zinc-900 dark:text-zinc-100 block">{item.tip}</span>
                          <span className="text-zinc-500 dark:text-zinc-400 mt-0.5 block">{item.description}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Learning Pathways: How & Where to Learn */}
              {((result.howToLearn && result.howToLearn.length > 0) || (result.whereToLearn && result.whereToLearn.length > 0)) && (
                <Card className="p-5 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-2xl space-y-4 shadow-sm">
                  <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2.5">
                    <GraduationCap className="w-4 h-4 text-blue-600" />
                    <h3 className="font-extrabold text-xs uppercase tracking-wide text-zinc-900 dark:text-zinc-100">
                      Learning Pathways & Resources
                    </h3>
                  </div>
                  
                  {result.howToLearn && result.howToLearn.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">How to Learn (Core Strategy)</h4>
                      <ul className="text-xs text-zinc-600 dark:text-zinc-300 space-y-1.5 pl-4 list-disc font-medium leading-relaxed">
                        {result.howToLearn.map((step: string, idx: number) => (
                          <li key={idx}>{step}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.whereToLearn && result.whereToLearn.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                      <h4 className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Where to Learn (Trusted Platforms)</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {result.whereToLearn.map((platform: any, idx: number) => (
                          <a
                            key={idx}
                            href={platform.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2.5 bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 rounded-xl flex items-center justify-between text-xs font-bold text-zinc-800 dark:text-zinc-200 transition-all cursor-pointer group"
                          >
                            <span>{platform.platform}</span>
                            <ChevronRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-0.5 transition-all" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              )}

            </div>
          ) : (
            <Card className="p-8 text-center border-dashed border-zinc-300 dark:border-zinc-800 h-[360px] flex flex-col items-center justify-center bg-white dark:bg-zinc-900 rounded-2xl space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-500 mb-1">
                <BarChart3 className="w-7 h-7" />
              </div>
              <p className="text-base font-black text-zinc-900 dark:text-zinc-100">Awaiting Comparison</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto leading-relaxed">
                Upload your resume PDF or paste texts, input target job criteria, and click Compare to compute keyword metrics.
              </p>
            </Card>
          )}

          {result?.error && (
            <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-4 rounded-2xl border border-rose-200 dark:border-rose-800">
              ⚠️ {result.error}
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
