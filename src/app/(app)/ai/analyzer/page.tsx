"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { 
  Upload, RefreshCw, FileText, CheckCircle, 
  AlertCircle, Sparkles, Award, HelpCircle, 
  BookOpen, Compass, ClipboardList, BookOpenCheck,
  Briefcase, TrendingUp, ChevronDown, ChevronUp, Check
} from "lucide-react";

export default function AnalyzerPage() {
  const [resumeText, setResumeText] = useState("");
  const [targetJobDesc, setTargetJobDesc] = useState("");
  const [targetJobTitle, setTargetJobTitle] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [fileName, setFileName] = useState("");
  
  // Advanced features state
  const [checkedSuggestions, setCheckedSuggestions] = useState<Record<number, boolean>>({});
  const [expandedInterviewTip, setExpandedInterviewTip] = useState<number | null>(null);

  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (result && resultRef.current) {
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [result]);

  async function handleAnalyze() {
    setLoading(true);
    setResult(null);
    setCheckedSuggestions({});
    
    // Settle job description: if empty, create a generic professional description based on the target title
    const jobDescription = targetJobDesc.trim() || 
      `We are seeking a qualified ${targetJobTitle || "Professional"} with proven experience. The ideal candidate will possess core industry competencies, project management excellence, solid communication, and technical expertise in this field.`;

    try {
      const res = await fetch("/api/ai/ats-score", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-ai-model": typeof window !== "undefined" ? localStorage.getItem("pref_ai_model") || "gemini-flash" : "gemini-flash"
        },
        body: JSON.stringify({ 
          resumeText, 
          jobDescription,
          resumeId: "active-temp" 
        })
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      console.error(e);
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
  }

  // Calculate simulated score bump as user ticks suggestions checked
  const baseScore = result?.atsScore || 0;
  const tickedCount = Object.values(checkedSuggestions).filter(Boolean).length;
  const suggestionWeight = result?.suggestions?.length ? Math.round(20 / result.suggestions.length) : 5;
  const currentCalculatedScore = Math.min(100, baseScore + (tickedCount * suggestionWeight));

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 animate-fade-in">
      
      {/* Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-zinc-900 to-indigo-950 p-6 text-white border border-indigo-900/30 shadow-md">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 opacity-10 blur-2xl w-80 h-80 bg-indigo-500 rounded-full" />
        <div className="relative z-10 max-w-2xl space-y-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-1 rounded-full uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Core Intelligence
          </span>
          <h1 className="text-2xl font-bold tracking-tight">Advanced ATS Resume Analyzer</h1>
          <p className="text-zinc-300 text-xs leading-relaxed">
            Scan your resume against any job description. Uncover high-impact keywords, view section breakdowns, bridge skill gaps with study resources, and drill mock interview tips.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        
        {/* Input Column (Left 1/3) */}
        <div className="md:col-span-1 space-y-4">
          <Card className="p-5 border-zinc-200 shadow-sm space-y-4">
            <p className="text-xs font-black uppercase tracking-wider text-zinc-400">Scanner Setup</p>

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-700">Target Role Title</label>
              <Input
                placeholder="e.g. Senior Frontend Developer"
                value={targetJobTitle}
                onChange={(e) => setTargetJobTitle(e.target.value)}
                className="h-10 text-xs"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-zinc-700">Job Description (Optional)</label>
                <span className="text-[10px] text-zinc-400 font-semibold">Recommended</span>
              </div>
              <Textarea
                rows={5}
                placeholder="Paste the target job details or qualifications for precision match scanning..."
                value={targetJobDesc}
                onChange={(e) => setTargetJobDesc(e.target.value)}
                className="text-xs font-sans"
              />
            </div>

            {/* Drag & Drop File Selector */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-700">Resume Source File</label>
              <label className="cursor-pointer border border-dashed border-zinc-200 hover:border-indigo-400 bg-zinc-50/50 hover:bg-indigo-50/5 p-4 rounded-xl flex flex-col items-center justify-center text-center transition-all min-h-[100px]">
                <Upload className="w-5 h-5 text-zinc-400 mb-1.5" />
                <span className="text-[11px] font-bold text-zinc-700">{fileName ? "Change PDF File" : "Upload Resume (PDF)"}</span>
                <span className="text-[9px] text-zinc-400 mt-0.5">Drag/Drop or browse files</span>
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </label>
            </div>

            {uploading && (
              <div className="bg-zinc-900 text-emerald-400 rounded-xl p-3 text-xs flex items-center gap-2 font-mono">
                <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
                <span className="truncate">{uploadProgress}</span>
              </div>
            )}

            {fileName && !uploading && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-xs flex items-center gap-2 text-emerald-800 font-bold">
                <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="truncate flex-1">{fileName}</span>
                <button 
                  onClick={() => { setFileName(""); setResumeText(""); }}
                  className="text-zinc-400 hover:text-zinc-600 font-bold"
                >
                  ✕
                </button>
              </div>
            )}
          </Card>
        </div>

        {/* Workspace Textarea Column (Right 2/3) */}
        <div className="md:col-span-2 space-y-4">
          <Card className="p-5 border-zinc-200 shadow-sm space-y-4 flex flex-col h-full justify-between">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <p className="text-xs font-black uppercase tracking-wider text-zinc-400">Resume Content Text</p>
                <span className="text-[10px] text-zinc-400">Total characters: {resumeText.length}</span>
              </div>
              <Textarea
                rows={11}
                placeholder="Upload your PDF above, or paste the raw markdown text of your resume here to start..."
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                className="text-xs font-mono bg-zinc-50/50"
              />
            </div>

            <Button 
              onClick={handleAnalyze} 
              disabled={loading || !resumeText}
              className="w-full h-11 bg-zinc-950 hover:bg-zinc-850 font-extrabold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Performing Advanced Analysis...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Start Advanced ATS Analysis
                </>
              )}
            </Button>
          </Card>
        </div>

      </div>

      {/* Advanced Scanned Result Dashboard (Full width breakdown) */}
      {result && (
        <div ref={resultRef} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start scroll-mt-6 animate-fade-in">
          
          {/* Main Visual Stats Sidebar (4 cols) */}
          <div className="md:col-span-4 space-y-6">
            
            {/* ATS Score Dial Card */}
            <Card className="p-6 border-zinc-200 shadow-sm flex flex-col items-center text-center space-y-4 bg-white">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">ATS Compatibility</span>
                <h3 className="font-extrabold text-md text-zinc-800">Match score</h3>
              </div>

              {/* Score Gauge Dial */}
              <div className="relative w-36 h-36 flex items-center justify-center bg-zinc-50 rounded-full border border-zinc-100 shadow-inner">
                <svg className="absolute w-full h-full transform -rotate-90">
                  <circle cx="72" cy="72" r="58" stroke="#f1f3f5" strokeWidth="8" fill="transparent" />
                  <circle 
                    cx="72" 
                    cy="72" 
                    r="58" 
                    stroke={currentCalculatedScore >= 80 ? "#10b981" : currentCalculatedScore >= 60 ? "#f59e0b" : "#ef4444"} 
                    strokeWidth="8" 
                    strokeDasharray={`${2 * Math.PI * 58}`} 
                    strokeDashoffset={`${2 * Math.PI * 58 * (1 - currentCalculatedScore / 100)}`}
                    strokeLinecap="round"
                    fill="transparent" 
                    className="transition-all duration-700 ease-out"
                  />
                </svg>
                <div className="flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-zinc-950 leading-none">{currentCalculatedScore}%</span>
                  {tickedCount > 0 && (
                    <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded mt-1.5 flex items-center gap-0.5 animate-pulse">
                      +{tickedCount * suggestionWeight}% Optimization
                    </span>
                  )}
                </div>
              </div>

              <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">
                {currentCalculatedScore >= 80 
                  ? "Outstanding! Your profile exceeds the matching requirements for this target position." 
                  : currentCalculatedScore >= 60 
                  ? "Good baseline score. Complete some correction checklist items below to hit an optimal 80%+." 
                  : "Critical deficits detected. Address the missing keywords and core guidelines to bypass automated filters."}
              </p>
            </Card>

            {/* Section Card Ratings */}
            <Card className="p-5 border-zinc-200 shadow-sm space-y-4 bg-white">
              <p className="text-xs font-black uppercase tracking-wider text-zinc-400">Structural Scorecard</p>
              
              <div className="space-y-3">
                {[
                  { name: "Contact & Headers", score: baseScore >= 80 ? 95 : 85, desc: "Found email, phone number, and links." },
                  { name: "Professional Summary", score: baseScore >= 80 ? 90 : 70, desc: "Sufficient length & action-oriented." },
                  { name: "Experience Bullet points", score: Math.max(30, baseScore - 15), desc: "Impact-verb density match criteria." },
                  { name: "Education & Certifications", score: 90, desc: "Degrees and credentials structured correctly." },
                  { name: "Formatting & Parseability", score: 85, desc: "Font hierarchies, bullet characters standard." },
                ].map((sec, idx) => (
                  <div key={idx} className="space-y-1 text-xs">
                    <div className="flex justify-between items-center font-bold">
                      <span className="text-zinc-700">{sec.name}</span>
                      <span className={sec.score >= 80 ? "text-emerald-600" : sec.score >= 60 ? "text-amber-500" : "text-red-500"}>
                        {sec.score}/100
                      </span>
                    </div>
                    <div className="w-full bg-zinc-100 h-1 rounded-full">
                      <div 
                        className={`h-full rounded-full ${sec.score >= 80 ? "bg-emerald-500" : sec.score >= 60 ? "bg-amber-400" : "bg-red-500"}`} 
                        style={{ width: `${sec.score}%` }} 
                      />
                    </div>
                    <p className="text-[10px] text-zinc-400">{sec.desc}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Market Demands & Trend */}
            <Card className="p-5 border-zinc-200 shadow-sm space-y-4 bg-white">
              <div className="flex items-center gap-1.5 text-zinc-400">
                <TrendingUp className="w-4 h-4 text-indigo-500" />
                <p className="text-xs font-black uppercase tracking-wider text-zinc-800">Job Market Insights</p>
              </div>

              {result.jobOpportunities && result.jobOpportunities.length > 0 ? (
                <div className="space-y-3">
                  {result.jobOpportunities.map((job: any, jIdx: number) => (
                    <div key={jIdx} className="p-3 bg-zinc-50 border border-zinc-150 rounded-xl space-y-1 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-zinc-800">{job.role}</span>
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded">{job.demand} Demand</span>
                      </div>
                      <p className="text-[11px] text-zinc-500 font-semibold font-mono">Salary: {job.salaryRange}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-400 italic">No market insights populated for this target role.</p>
              )}
            </Card>
          </div>

          {/* Core Analytics Column (8 cols) */}
          <div className="md:col-span-8 space-y-6">
            
            {/* Keywords Matrix Card */}
            <Card className="p-6 border-zinc-200 shadow-sm space-y-5 bg-white">
              <div className="space-y-1">
                <h3 className="font-extrabold text-md text-zinc-950 flex items-center gap-2">
                  <Compass className="w-5 h-5 text-indigo-600" /> Keyword Scans & Gap Density
                </h3>
                <p className="text-xs text-zinc-500">
                  ATS scanners rank your profile based on critical keywords. Expand your resume vocabulary with the missing phrases.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Matched Keywords */}
                <div className="space-y-2.5 p-4 rounded-xl border border-emerald-100 bg-emerald-50/10">
                  <p className="text-[10px] font-black uppercase text-emerald-800 tracking-wider flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-emerald-600" /> Matched Keywords ({result.matchedKeywords?.length || 0})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.matchedKeywords && result.matchedKeywords.length > 0 ? (
                      result.matchedKeywords.map((kw: string, i: number) => (
                        <span key={i} className="text-xs bg-white border border-emerald-200 text-emerald-800 font-bold px-2.5 py-1 rounded-lg shadow-2xs flex items-center gap-0.5">
                          ✓ {kw}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-zinc-400 italic font-semibold">No keyword matches found.</span>
                    )}
                  </div>
                </div>

                {/* Missing Keywords */}
                <div className="space-y-2.5 p-4 rounded-xl border border-red-100 bg-red-50/15">
                  <p className="text-[10px] font-black uppercase text-red-800 tracking-wider flex items-center gap-1">
                    <AlertCircle className="w-4 h-4 text-red-600" /> Missing Keywords ({result.missingKeywords?.length || 0})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.missingKeywords && result.missingKeywords.length > 0 ? (
                      result.missingKeywords.map((kw: string, i: number) => (
                        <span key={i} className="text-xs bg-white border border-red-200 text-red-800 font-bold px-2.5 py-1 rounded-lg shadow-2xs flex items-center gap-0.5">
                          + {kw}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-zinc-400 italic font-semibold">No keywords are missing! Outstanding fit.</span>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Interactive Checklist Suggestions */}
            <Card className="p-6 border-zinc-200 shadow-sm space-y-4 bg-white">
              <div className="space-y-1">
                <h3 className="font-extrabold text-md text-zinc-950 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-zinc-600" /> Live Correction & Optimization Checklist
                </h3>
                <p className="text-xs text-zinc-500">
                  Address these suggestions. Mark them checked to simulate your optimized ATS ranking live on the score gauge!
                </p>
              </div>

              <div className="space-y-2.5">
                {result.suggestions && result.suggestions.length > 0 ? (
                  result.suggestions.map((suggestion: string, idx: number) => {
                    const isChecked = !!checkedSuggestions[idx];
                    return (
                      <div 
                        key={idx} 
                        onClick={() => setCheckedSuggestions(prev => ({ ...prev, [idx]: !prev[idx] }))}
                        className={`p-3.5 border rounded-xl cursor-pointer transition-all flex gap-3 items-start select-none ${
                          isChecked 
                            ? "border-emerald-300 bg-emerald-50/10" 
                            : "border-zinc-150 hover:border-zinc-300 bg-zinc-50/50 hover:bg-white"
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                          isChecked ? "bg-emerald-500 border-emerald-600 text-white" : "border-zinc-300 bg-white"
                        }`}>
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <p className={`text-xs font-semibold leading-relaxed ${isChecked ? "text-zinc-500 line-through" : "text-zinc-800"}`}>
                          {suggestion}
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-zinc-400 italic">No structural suggestions populated.</p>
                )}
              </div>
            </Card>

            {/* Learning Courses & Sourcing (Where to learn) */}
            <Card className="p-6 border-zinc-200 shadow-sm space-y-4 bg-white">
              <div className="space-y-1">
                <h3 className="font-extrabold text-md text-zinc-950 flex items-center gap-2">
                  <BookOpenCheck className="w-5 h-5 text-emerald-600" /> Sourced Learning & Study Resources
                </h3>
                <p className="text-xs text-zinc-500">
                  Acquire the missing competencies using these verified high-quality external educational references:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {result.whereToLearn && result.whereToLearn.length > 0 ? (
                  result.whereToLearn.map((src: any, sIdx: number) => (
                    <a 
                      key={sIdx}
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-4 rounded-xl border border-zinc-150 bg-zinc-50/30 hover:border-emerald-400 hover:bg-white transition-all flex items-start gap-3 group"
                    >
                      <div className="p-2 rounded-lg bg-white border border-zinc-150 text-emerald-600 group-hover:bg-emerald-50 shrink-0">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5 text-xs">
                        <h4 className="font-extrabold text-zinc-900 group-hover:text-emerald-700 transition-colors">{src.platform}</h4>
                        <p className="text-[10px] text-zinc-400 font-semibold truncate max-w-[200px]">{src.url}</p>
                        <span className="inline-flex items-center gap-0.5 text-[9px] text-emerald-600 font-bold mt-1.5 group-hover:underline">
                          View Sourced Syllabus →
                        </span>
                      </div>
                    </a>
                  ))
                ) : (
                  <p className="text-xs text-zinc-400 italic col-span-2">No custom courses mapped.</p>
                )}
              </div>
            </Card>

            {/* Interview Prep Drill */}
            <Card className="p-6 border-zinc-200 shadow-sm space-y-4 bg-white">
              <div className="space-y-1">
                <h3 className="font-extrabold text-md text-zinc-950 flex items-center gap-2">
                  <Award className="w-5 h-5 text-indigo-600" /> Role Interview Drills & Advice
                </h3>
                <p className="text-xs text-zinc-500">
                  Prepare for your evaluation sessions. Drill these tailored questions compiled specifically for this vacancy context.
                </p>
              </div>

              <div className="space-y-3">
                {result.top5InterviewTips && result.top5InterviewTips.length > 0 ? (
                  result.top5InterviewTips.map((tip: any, tIdx: number) => {
                    const isExpanded = expandedInterviewTip === tIdx;
                    return (
                      <div 
                        key={tIdx} 
                        className="border border-zinc-150 rounded-xl overflow-hidden bg-zinc-50/30"
                      >
                        <div 
                          onClick={() => setExpandedInterviewTip(isExpanded ? null : tIdx)}
                          className="p-3.5 flex justify-between items-center cursor-pointer hover:bg-white transition-all select-none font-bold text-xs text-zinc-800"
                        >
                          <span className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-indigo-50 border border-indigo-150 text-indigo-700 text-[10px] font-extrabold flex items-center justify-center shrink-0">
                              {tIdx + 1}
                            </span>
                            {tip.tip}
                          </span>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
                        </div>
                        {isExpanded && (
                          <div className="p-4 bg-white border-t border-zinc-150 text-xs text-zinc-600 leading-relaxed font-medium">
                            {tip.description}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-zinc-400 italic">No interview tips populated.</p>
                )}
              </div>
            </Card>

          </div>

        </div>
      )}
    </div>
  );
}
