"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ResumeContent } from "@/types";
import {
  Plus,
  Trash2,
  FileText,
  Download,
  Check,
  Sparkles,
  ChevronRight,
  Briefcase,
  GraduationCap,
  Wrench,
  Upload,
  RefreshCw,
  AlertCircle,
  Printer,
  Loader2
} from "lucide-react";
import { BrainCircuit } from "lucide-react";
import { downloadElementAsPdf } from "@/lib/pdf-export";

const initialEmpty: ResumeContent = {
  summary: "Results-driven software professional experienced in modern full-stack engineering, scalable application architecture, and AI-assisted cloud integrations.",
  experience: [
    {
      title: "Senior Software Engineer",
      company: "InnovateTech Solutions",
      startDate: "2023",
      endDate: "Present",
      bullets: [
        "Led a squad of 4 developers to transition the core platform to Next.js App Router, increasing page performance by 40%.",
        "Configured robust RESTful API proxies and integrated real-time Gemini LLM features, boosting user engagement metrics by 25%."
      ]
    },
    {
      title: "Software Engineer",
      company: "CloudCore Systems",
      startDate: "2021",
      endDate: "2023",
      bullets: [
        "Developed and maintained scalable microservices using Node.js, Express, and PostgreSQL, supporting over 100k active daily sessions.",
        "Created an automated testing pipeline reducing integration release failures by 18%."
      ]
    }
  ],
  education: [
    {
      school: "State Technical University",
      degree: "B.S. Computer Science",
      year: "2021"
    }
  ],
  skills: ["React", "Next.js", "TypeScript", "Node.js", "Prisma", "PostgreSQL", "Tailwind CSS", "Docker"]
};

export function ResumeForm() {
  const [content, setContent] = useState<ResumeContent>(initialEmpty);
  const [title, setTitle] = useState("My Professional Resume");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  // New States for PDF Parser & AI Agent
  const [parsingPdf, setParsingPdf] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [generatingResume, setGeneratingResume] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // AI Suggestions States
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestionsData, setSuggestionsData] = useState<{
    summaryCritique: string;
    bulletImprovements: Array<{ original: string; improved: string }>;
    suggestedSkills: string[];
    formatAdvice: string;
  } | null>(null);
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);

  // ATS Score States
  const [loadingAts, setLoadingAts] = useState(false);
  const [atsData, setAtsData] = useState<{ score: number; feedback: string; missingKeywords: string[] } | null>(null);
  const [atsError, setAtsError] = useState<string | null>(null);

  // Resume Analysis States
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [analysisData, setAnalysisData] = useState<{ strengths: string[]; weaknesses: string[]; suggestions: string[] } | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  async function handleAnalyzeResume() {
    setLoadingAnalysis(true);
    setAnalysisError(null);
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText: content, jobTitle: jobDescription })
      });
      const data = await res.json();
      if (data.strengths) {
        setAnalysisData(data);
      } else {
        setAnalysisError(data.error || "Failed to analyze resume.");
      }
    } catch (err: any) {
      setAnalysisError(err.message || "An unexpected error occurred.");
    } finally {
      setLoadingAnalysis(false);
    }
  }

  async function handleGetAtsScore() {
    setLoadingAts(true);
    setAtsError(null);
    try {
      const res = await fetch("/api/ai/ats-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeContent: content, jobDescription })
      });
      const json = await res.json();
      if (json.success && json.data) {
        setAtsData(json.data);
      } else {
        setAtsError(json.error || "Failed to score resume.");
      }
    } catch (err: any) {
      setAtsError(err.message || "An unexpected error occurred.");
    } finally {
      setLoadingAts(false);
    }
  }

  async function handleGetSuggestions() {
    setLoadingSuggestions(true);
    setSuggestionsError(null);
    try {
      const res = await fetch("/api/ai/resume-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeContent: content })
      });
      const json = await res.json();
      if (json.success && json.data) {
        setSuggestionsData(json.data);
      } else {
        setSuggestionsError(json.error || "Failed to generate suggestions.");
      }
    } catch (err: any) {
      setSuggestionsError(err.message || "An unexpected error occurred.");
    } finally {
      setLoadingSuggestions(false);
    }
  }

  // Load existing resume if available
  useEffect(() => {
    async function fetchResume() {
      try {
        const res = await fetch("/api/resume");
        if (res.ok) {
          const resumes = await res.json();
          if (resumes && resumes.length > 0) {
            setTitle(resumes[0].title);
            if (resumes[0].content) {
              setContent(resumes[0].content);
            }
          }
        }
      } catch (e) {
        console.error("Failed to load existing resume:", e);
      }
    }
    fetchResume();
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content })
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (e) {
      console.error("Save failed:", e);
    } finally {
      setSaving(false);
    }
  }

  // Handle PDF Parsing to extract resume structure
  async function handlePdfUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPdfFileName(file.name);
    setParsingPdf(true);
    setParseError(null);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const res = await fetch("/api/ai/parse-pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pdfBase64: base64, mode: "json" })
        });
        const json = await res.json();
        if (json.success && json.data) {
          setContent(json.data);
          setTitle(`Imported: ${file.name.replace(/\.[^/.]+$/, "")}`);
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          setParseError(json.error || "Failed to parse resume PDF. Please verify formatting.");
        }
      } catch (err: any) {
        setParseError(err.message || "An unexpected error occurred during PDF parsing.");
      } finally {
        setParsingPdf(false);
      }
    };
    reader.readAsDataURL(file);
  }

  // AI Agent: Create resume tailored to target Job Description
  async function handleGenerateFromJob() {
    if (!jobDescription.trim()) return;

    setGeneratingResume(true);
    setGenerationError(null);

    try {
      const res = await fetch("/api/ai/generate-resume", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-ai-model": typeof window !== "undefined" ? localStorage.getItem("pref_ai_model") || "gemini-flash" : "gemini-flash"
        },
        body: JSON.stringify({
          jobDescription,
          userBackground: JSON.stringify(content) // Pass current form content as reference context
        })
      });
      const json = await res.json();
      if (json.success && json.data) {
        setContent(json.data);
        setTitle(`AI Optimized Resume`);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setGenerationError(json.error || "Failed to generate tailored resume.");
      }
    } catch (err: any) {
      setGenerationError(err.message || "An error occurred during resume generation.");
    } finally {
      setGeneratingResume(false);
    }
  }

  // Experience Helpers
  const addExperience = () => {
    setContent({
      ...content,
      experience: [
        ...content.experience,
        { title: "", company: "", startDate: "", endDate: "", bullets: [""] }
      ]
    });
  };

  const removeExperience = (index: number) => {
    const updated = content.experience.filter((_, idx) => idx !== index);
    setContent({ ...content, experience: updated });
  };

  const updateExperience = (index: number, field: string, value: any) => {
    const updated = content.experience.map((exp, idx) => {
      if (idx === index) {
        return { ...exp, [field]: value };
      }
      return exp;
    });
    setContent({ ...content, experience: updated });
  };

  const addBullet = (expIdx: number) => {
    const updated = content.experience.map((exp, idx) => {
      if (idx === expIdx) {
        return { ...exp, bullets: [...exp.bullets, ""] };
      }
      return exp;
    });
    setContent({ ...content, experience: updated });
  };

  const updateBullet = (expIdx: number, bulletIdx: number, value: string) => {
    const updated = content.experience.map((exp, idx) => {
      if (idx === expIdx) {
        const updatedBullets = exp.bullets.map((b, bIdx) => (bIdx === bulletIdx ? value : b));
        return { ...exp, bullets: updatedBullets };
      }
      return exp;
    });
    setContent({ ...content, experience: updated });
  };

  const removeBullet = (expIdx: number, bulletIdx: number) => {
    const updated = content.experience.map((exp, idx) => {
      if (idx === expIdx) {
        const updatedBullets = exp.bullets.filter((_, bIdx) => bIdx !== bulletIdx);
        return { ...exp, bullets: updatedBullets };
      }
      return exp;
    });
    setContent({ ...content, experience: updated });
  };

  // Education Helpers
  const addEducation = () => {
    setContent({
      ...content,
      education: [...content.education, { school: "", degree: "", year: "" }]
    });
  };

  const removeEducation = (index: number) => {
    const updated = content.education.filter((_, idx) => idx !== index);
    setContent({ ...content, education: updated });
  };

  const updateEducation = (index: number, field: string, value: string) => {
    const updated = content.education.map((edu, idx) => {
      if (idx === index) {
        return { ...edu, [field]: value };
      }
      return edu;
    });
    setContent({ ...content, education: updated });
  };

  async function handleDownloadPDF() {
    setExportingPdf(true);
    try {
      const filename = title ? title : "Professional_Resume";
      await downloadElementAsPdf("printable-resume-page", { filename });
    } catch (err) {
      console.error("PDF Export error:", err);
      window.print();
    } finally {
      setExportingPdf(false);
    }
  }

  function handlePrintPDF() {
    window.print();
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full" id="resume-builder-container">
      {/* LEFT COLUMN: EDITOR FORM */}
      <div className="lg:col-span-6 space-y-6 print:hidden">
        
        {/* Document Title & Save Action */}
        <div className="flex gap-3 items-center justify-between p-4 bg-ink/5 rounded-xl border border-ink/5">
          <div className="flex-1">
            <label className="text-[10px] uppercase font-bold text-ink/40 tracking-wide block mb-1">Document Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Resume title"
              className="text-xs bg-white font-medium h-9"
            />
          </div>
          <div className="flex items-end gap-2 pt-5">
            <Button onClick={handleSave} disabled={saving} className="px-4.5 py-2">
              {saving ? "Saving..." : "Save draft"}
            </Button>
            <Button
              onClick={handleDownloadPDF}
              disabled={exportingPdf}
              className="flex items-center gap-1.5 px-4.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm transition-all cursor-pointer"
            >
              {exportingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Preparing PDF...
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" /> Download PDF
                </>
              )}
            </Button>
            <Button
              variant="secondary"
              onClick={handlePrintPDF}
              title="Print layout"
              className="flex items-center gap-1 px-3 py-2 text-xs font-semibold cursor-pointer border-zinc-200"
            >
              <Printer className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {saved && (
          <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg flex items-center gap-2 text-xs">
            <Check className="w-4 h-4" /> Draft persisted successfully.
          </div>
        )}

        {/* ATS Scorer Section */}
        <Card className="p-5 border-indigo-100 bg-indigo-50/10 space-y-4">
          <div className="flex items-center justify-between border-b border-indigo-500/10 pb-2.5">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-indigo-600 animate-pulse" />
              <h3 className="font-bold text-sm text-zinc-900">Advanced ATS Scorer & Optimizer</h3>
            </div>
            <Button
              variant="secondary"
              onClick={handleGetAtsScore}
              disabled={loadingAts || !jobDescription.trim()}
              className="text-xs h-7 px-2.5 border border-indigo-200 text-indigo-700 hover:bg-indigo-50 cursor-pointer font-bold animate-pulse"
            >
              {loadingAts ? (
                <>
                  <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Scoring...
                </>
              ) : (
                <>Run ATS Scan</>
              )}
            </Button>
          </div>

          {!jobDescription.trim() && <p className="text-[10px] text-amber-600 font-medium italic">Please enter a Job Description first.</p>}

          {atsError && (
            <p className="text-xs text-red-500 bg-red-50 p-2.5 rounded-lg border border-red-100">{atsError}</p>
          )}

          {!atsData && !loadingAts && jobDescription.trim() && (
            <p className="text-xs text-zinc-500 italic">
              Click &quot;Run ATS Scan&quot; to get a score out of 100 and actionable keyword optimization feedback.
            </p>
          )}

          {atsData && (
            <div className="space-y-3 text-xs animate-fade-in">
              {/* ATS Score Visual */}
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="40" cy="40" r="36" stroke="#e4e4e7" strokeWidth="6" fill="transparent" />
                    <circle 
                      cx="40" cy="40" r="36" 
                      stroke={atsData.score > 80 ? "#10b981" : atsData.score > 50 ? "#f59e0b" : "#ef4444"} 
                      strokeWidth="6" 
                      fill="transparent" 
                      strokeDasharray={`${atsData.score * 2.26} 226`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute text-2xl font-black text-zinc-950">{atsData.score}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-zinc-950 leading-tight mb-1">
                    {atsData.score > 80 ? "Excellent Match" : atsData.score > 50 ? "Moderate Match" : "Significant Improvements Needed"}
                  </p>
                  <p className="text-xs text-zinc-600 font-medium leading-relaxed">
                    {atsData.feedback}
                  </p>
                </div>
              </div>
              {atsData.missingKeywords && atsData.missingKeywords.length > 0 && (
                <div className="space-y-1">
                  <span className="font-bold text-zinc-700 block text-[10px] uppercase tracking-wider">Missing Keywords</span>
                  <div className="flex flex-wrap gap-1">
                    {atsData.missingKeywords.map((kw, idx) => (
                      <span key={idx} className="bg-red-50 border border-red-100 text-red-800 px-2 py-0.5 rounded-md font-bold text-[10px]">
                        - {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Resume Analysis Section */}
        <Card className="p-5 border-zinc-200 bg-zinc-50/50 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-2.5">
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-emerald-600 animate-pulse" />
              <h3 className="font-bold text-sm text-zinc-900">Resume Intelligence Analysis</h3>
            </div>
            <Button
              variant="secondary"
              onClick={handleAnalyzeResume}
              disabled={loadingAnalysis || !content.summary.trim()}
              className="text-xs h-7 px-2.5 border border-zinc-200 text-zinc-700 hover:bg-zinc-100 cursor-pointer font-bold"
            >
              {loadingAnalysis ? (
                <>
                  <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Analyzing...
                </>
              ) : (
                <>Get AI Insight</>
              )}
            </Button>
          </div>

          {analysisError && (
            <p className="text-xs text-red-500 bg-red-50 p-2.5 rounded-lg border border-red-100">{analysisError}</p>
          )}

          {!analysisData && !loadingAnalysis && content.summary.trim() && (
            <p className="text-xs text-zinc-500 italic">
              Click &quot;Get AI Insight&quot; to receive expert feedback on resume strengths, weaknesses, and structural suggestions.
            </p>
          )}

          {analysisData && (
            <div className="space-y-4 text-xs animate-fade-in">
              {analysisData.strengths.length > 0 && (
                <div className="space-y-1">
                  <span className="font-bold text-emerald-700 block text-[10px] uppercase tracking-wider">Strengths</span>
                  <ul className="list-disc pl-4 text-zinc-700 space-y-0.5">
                    {analysisData.strengths.map((s, idx) => <li key={idx}>{s}</li>)}
                  </ul>
                </div>
              )}
              {analysisData.weaknesses.length > 0 && (
                <div className="space-y-1">
                  <span className="font-bold text-red-700 block text-[10px] uppercase tracking-wider">Weaknesses</span>
                  <ul className="list-disc pl-4 text-zinc-700 space-y-0.5">
                    {analysisData.weaknesses.map((w, idx) => <li key={idx}>{w}</li>)}
                  </ul>
                </div>
              )}
              {analysisData.suggestions.length > 0 && (
                <div className="space-y-1">
                  <span className="font-bold text-indigo-700 block text-[10px] uppercase tracking-wider">Suggestions</span>
                  <ul className="list-disc pl-4 text-zinc-700 space-y-0.5">
                    {analysisData.suggestions.map((s, idx) => <li key={idx}>{s}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* AI Agent and PDF Import Actions */}
        <Card className="p-5 border-zinc-200 bg-white space-y-4">
          <div className="flex items-center gap-2 border-b border-zinc-100 pb-2.5">
            <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
            <h3 className="font-bold text-sm text-zinc-900">AI Agent & PDF Import</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Box: PDF Importer */}
            <div className="border border-zinc-100 rounded-xl p-3.5 bg-zinc-50/50 space-y-2">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Import Existing Resume</span>
              <p className="text-xs text-zinc-500">Upload your existing resume PDF. Gemini will parse and structure it instantly.</p>
              
              <label className="cursor-pointer mt-2 w-full bg-white hover:bg-zinc-50 border border-zinc-200 px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 text-zinc-700 transition-all select-none shadow-sm">
                {parsingPdf ? (
                  <RefreshCw className="w-3.5 h-3.5 text-zinc-500 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5 text-zinc-500" />
                )}
                <span>{parsingPdf ? "Parsing..." : "Upload PDF Resume"}</span>
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={handlePdfUpload}
                  disabled={parsingPdf}
                />
              </label>
              {pdfFileName && !parseError && !parsingPdf && (
                <p className="text-[10px] text-emerald-600 font-semibold truncate mt-1">Successfully parsed: {pdfFileName}</p>
              )}
              {parseError && (
                <p className="text-[10px] text-red-500 font-medium mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-red-500 shrink-0" /> {parseError}
                </p>
              )}
            </div>

            {/* Right Box: AI Agent Builder */}
            <div className="border border-zinc-100 rounded-xl p-3.5 bg-zinc-50/50 space-y-2">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">AI Resume Builder Agent</span>
              <p className="text-xs text-zinc-500">Enter a job description. Gemini will draft a fully tailored resume for it.</p>
              
              <Textarea
                rows={2}
                className="text-[11px] leading-normal bg-white border border-zinc-200 rounded-lg p-2 resize-none mt-1"
                placeholder="Paste the target job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />

              <Button
                variant="secondary"
                className="w-full mt-1 font-bold text-xs h-8.5 bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg flex items-center justify-center gap-1.5"
                onClick={handleGenerateFromJob}
                disabled={generatingResume || !jobDescription.trim()}
              >
                {generatingResume ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>{generatingResume ? "Generating..." : "Generate Tailored Resume"}</span>
              </Button>
              {generationError && (
                <p className="text-[10px] text-red-500 font-medium mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-red-500 shrink-0" /> {generationError}
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* 1. Summary Section */}
        <Card className="p-5 border-ink/10 space-y-3">
          <div className="flex items-center gap-2 border-b border-ink/5 pb-2">
            <FileText className="w-4 h-4 text-emerald-600" />
            <h3 className="font-semibold text-sm">Professional Summary</h3>
          </div>
          <Textarea
            rows={4}
            value={content.summary}
            onChange={(e) => setContent({ ...content, summary: e.target.value })}
            placeholder="A short professional summary summarizing your career focus and value offer..."
            className="text-xs leading-relaxed"
          />
        </Card>

        {/* 2. Technical Skills Section */}
        <Card className="p-5 border-ink/10 space-y-3">
          <div className="flex items-center gap-2 border-b border-ink/5 pb-2">
            <Wrench className="w-4 h-4 text-emerald-600" />
            <h3 className="font-semibold text-sm">Skills & Competencies</h3>
          </div>
          <label className="text-[10px] font-bold text-ink/40 uppercase tracking-wider block">
            Skills (comma separated)
          </label>
          <Input
            value={content.skills.join(", ")}
            onChange={(e) =>
              setContent({ ...content, skills: e.target.value.split(",").map((s) => s.trim()) })
            }
            placeholder="React, TypeScript, Next.js, Node.js"
            className="text-xs"
          />
          <div className="flex flex-wrap gap-1 pt-1">
            {content.skills.filter(s => s.length > 0).map((skill, idx) => (
              <span key={idx} className="text-[10px] bg-ink/5 text-ink/80 px-2.5 py-0.5 rounded border border-ink/10">
                {skill}
              </span>
            ))}
          </div>
        </Card>

        {/* 3. Professional Experience Section */}
        <Card className="p-5 border-ink/10 space-y-5">
          <div className="flex items-center justify-between border-b border-ink/5 pb-2">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-emerald-600" />
              <h3 className="font-semibold text-sm">Work Experience</h3>
            </div>
            <Button variant="secondary" onClick={addExperience} className="h-8 text-xs flex items-center gap-1 px-3 py-1">
              <Plus className="w-3.5 h-3.5" /> Add Experience
            </Button>
          </div>

          <div className="space-y-6">
            {content.experience.map((exp, expIdx) => (
              <div key={expIdx} className="border border-ink/5 p-4 rounded-xl bg-ink/5/10 relative space-y-3">
                <button
                  onClick={() => removeExperience(expIdx)}
                  className="absolute right-3 top-3 text-ink/40 hover:text-rose-600 transition-colors p-1"
                  title="Remove experience block"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-bold text-ink/40 uppercase block mb-0.5">Job Title</label>
                    <Input
                      value={exp.title}
                      onChange={(e) => updateExperience(expIdx, "title", e.target.value)}
                      placeholder="e.g. Senior Software Engineer"
                      className="text-xs bg-white h-8"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-ink/40 uppercase block mb-0.5">Company</label>
                    <Input
                      value={exp.company}
                      onChange={(e) => updateExperience(expIdx, "company", e.target.value)}
                      placeholder="e.g. InnovateTech Solutions"
                      className="text-xs bg-white h-8"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-bold text-ink/40 uppercase block mb-0.5">Start Year</label>
                    <Input
                      value={exp.startDate}
                      onChange={(e) => updateExperience(expIdx, "startDate", e.target.value)}
                      placeholder="e.g. 2021"
                      className="text-xs bg-white h-8"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-ink/40 uppercase block mb-0.5">End Year</label>
                    <Input
                      value={exp.endDate}
                      onChange={(e) => updateExperience(expIdx, "endDate", e.target.value)}
                      placeholder="e.g. Present"
                      className="text-xs bg-white h-8"
                    />
                  </div>
                </div>

                {/* Bullets Sub-section */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-ink/60 uppercase">Impact Achievements</span>
                    <button
                      onClick={() => addBullet(expIdx)}
                      className="text-[10px] font-bold text-emerald-700 hover:underline flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" /> Add bullet
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {exp.bullets.map((bullet, bIdx) => (
                      <div key={bIdx} className="flex gap-2 items-center">
                        <Input
                          value={bullet}
                          onChange={(e) => updateBullet(expIdx, bIdx, e.target.value)}
                          placeholder="Accomplished X, measured by Y, by doing Z..."
                          className="text-xs bg-white flex-1 h-8"
                        />
                        <button
                          onClick={() => removeBullet(expIdx, bIdx)}
                          className="text-ink/30 hover:text-rose-600 transition-colors shrink-0"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* 4. Education Section */}
        <Card className="p-5 border-ink/10 space-y-5">
          <div className="flex items-center justify-between border-b border-ink/5 pb-2">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-emerald-600" />
              <h3 className="font-semibold text-sm">Education</h3>
            </div>
            <Button variant="secondary" onClick={addEducation} className="h-8 text-xs flex items-center gap-1 px-3 py-1">
              <Plus className="w-3.5 h-3.5" /> Add Education
            </Button>
          </div>

          <div className="space-y-4">
            {content.education.map((edu, eduIdx) => (
              <div key={eduIdx} className="border border-ink/5 p-4 rounded-xl bg-ink/5/10 relative space-y-3">
                <button
                  onClick={() => removeEducation(eduIdx)}
                  className="absolute right-3 top-3 text-ink/40 hover:text-rose-600 transition-colors p-1"
                  title="Remove education block"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-bold text-ink/40 uppercase block mb-0.5">School</label>
                    <Input
                      value={edu.school}
                      onChange={(e) => updateEducation(eduIdx, "school", e.target.value)}
                      placeholder="e.g. State Technical University"
                      className="text-xs bg-white h-8"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-ink/40 uppercase block mb-0.5">Degree</label>
                    <Input
                      value={edu.degree}
                      onChange={(e) => updateEducation(eduIdx, "degree", e.target.value)}
                      placeholder="e.g. B.S. Computer Science"
                      className="text-xs bg-white h-8"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-ink/40 uppercase block mb-0.5">Year of Graduation</label>
                  <Input
                    value={edu.year}
                    onChange={(e) => updateEducation(eduIdx, "year", e.target.value)}
                    placeholder="e.g. 2021"
                    className="text-xs bg-white h-8"
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* AI Recommendations & Suggestions Panel */}
        <Card className="p-5 border-emerald-100 bg-emerald-50/5 space-y-4">
          <div className="flex items-center justify-between border-b border-emerald-500/10 pb-2.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
              <h3 className="font-bold text-sm text-zinc-900">AI Resume Optimizer Suggestions</h3>
            </div>
            <Button
              variant="secondary"
              onClick={handleGetSuggestions}
              disabled={loadingSuggestions}
              className="text-xs h-7 px-2.5 border border-emerald-200 text-emerald-700 hover:bg-emerald-50 cursor-pointer font-bold animate-pulse"
            >
              {loadingSuggestions ? (
                <>
                  <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Analyzing...
                </>
              ) : (
                <>Get AI Tips</>
              )}
            </Button>
          </div>

          {suggestionsError && (
            <p className="text-xs text-red-500 bg-red-50 p-2.5 rounded-lg border border-red-100">{suggestionsError}</p>
          )}

          {!suggestionsData && !loadingSuggestions && (
            <p className="text-xs text-zinc-500 italic">
              Click &quot;Get AI Tips&quot; to scan your draft for keyword improvements, metric phrases, and actionable section critiques.
            </p>
          )}

          {loadingSuggestions && (
            <div className="space-y-2 py-4 animate-pulse">
              <div className="h-4 bg-zinc-100 rounded w-3/4"></div>
              <div className="h-3 bg-zinc-100 rounded w-1/2"></div>
              <div className="h-3 bg-zinc-100 rounded w-5/6"></div>
            </div>
          )}

          {suggestionsData && (
            <div className="space-y-4 text-xs animate-fade-in">
              {/* Summary Critique */}
              {suggestionsData.summaryCritique && (
                <div className="space-y-1">
                  <span className="font-bold text-zinc-700 block text-[10px] uppercase tracking-wider">Summary Critique & Rewrite</span>
                  <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl leading-relaxed text-zinc-600 font-medium">
                    {suggestionsData.summaryCritique}
                  </div>
                </div>
              )}

              {/* Bullet Improvements */}
              {suggestionsData.bulletImprovements && suggestionsData.bulletImprovements.length > 0 && (
                <div className="space-y-2">
                  <span className="font-bold text-zinc-700 block text-[10px] uppercase tracking-wider">Impact Bullet Rewrites (Google X-Y-Z formula)</span>
                  <div className="space-y-2">
                    {suggestionsData.bulletImprovements.map((item, idx) => (
                      <div key={idx} className="border border-emerald-100 bg-emerald-50/10 rounded-xl p-3 space-y-1">
                        <p className="text-[10px] text-zinc-400 font-semibold line-through">Original: {item.original}</p>
                        <p className="text-emerald-950 font-semibold flex items-start gap-1">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{item.improved}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggested Skills */}
              {suggestionsData.suggestedSkills && suggestionsData.suggestedSkills.length > 0 && (
                <div className="space-y-1.5">
                  <span className="font-bold text-zinc-700 block text-[10px] uppercase tracking-wider">Suggested Hot Skills to Add</span>
                  <div className="flex flex-wrap gap-1">
                    {suggestionsData.suggestedSkills.map((skill, idx) => (
                      <span key={idx} className="bg-emerald-50 border border-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold text-[10px]">
                        + {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Formatting Advice */}
              {suggestionsData.formatAdvice && (
                <div className="space-y-1">
                  <span className="font-bold text-zinc-700 block text-[10px] uppercase tracking-wider">Format & Style Advice</span>
                  <p className="text-zinc-600 leading-relaxed font-semibold italic">{suggestionsData.formatAdvice}</p>
                </div>
              )}
            </div>
          )}
        </Card>

      </div>

      {/* RIGHT COLUMN: LIVE A4 PREVIEW (ALSO TARGETED FOR PRINT) */}
      <div className="lg:col-span-6 w-full lg:sticky lg:top-6 print:absolute print:inset-0 print:m-0 print:p-0 print:w-full print:bg-white z-20">
        <h3 className="font-semibold text-xs uppercase text-ink/40 tracking-wider mb-2 flex items-center gap-1.5 print:hidden">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin-slow" /> Live A4 Swiss-Modern Preview
        </h3>
        
        {/* Printable Resume Canvas */}
        <div
          id="printable-resume-page"
          className="bg-white text-zinc-900 border border-zinc-200 shadow-md p-10 font-sans aspect-[1/1.41] w-full max-w-[595px] mx-auto overflow-hidden text-[11px] leading-relaxed select-text print:border-none print:shadow-none print:p-12 print:max-w-none print:w-full print:aspect-auto"
        >
          {/* Header Block */}
          <div className="border-b-2 border-zinc-900 pb-5 mb-5 text-center">
            <h1 className="text-2xl font-bold tracking-tight uppercase text-zinc-900 mb-1">
              {title || "Executive Candidate Profile"}
            </h1>
            <p className="text-xs text-zinc-500 tracking-wider font-semibold">
              Software Engineering Portfolio & Resume Summary
            </p>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 gap-5">
            
            {/* Executive Summary */}
            {content.summary && (
              <div className="space-y-1.5 section-block">
                <h2 className="text-[10px] font-bold uppercase tracking-wider text-zinc-800 border-b border-zinc-200 pb-0.5">
                  Professional Summary
                </h2>
                <p className="text-zinc-700 text-justify text-[10px] leading-normal">{content.summary}</p>
              </div>
            )}

            {/* Core Skills */}
            {content.skills.length > 0 && content.skills[0] !== "" && (
              <div className="space-y-1.5 section-block">
                <h2 className="text-[10px] font-bold uppercase tracking-wider text-zinc-800 border-b border-zinc-200 pb-0.5">
                  Technical Core Competencies
                </h2>
                <div className="flex flex-wrap gap-1">
                  {content.skills.filter(s => s.trim().length > 0).map((skill, idx) => (
                    <span
                      key={idx}
                      className="text-[9px] bg-zinc-100 text-zinc-800 px-2 py-0.5 rounded border border-zinc-200 font-semibold skill-badge"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Experience */}
            {content.experience.length > 0 && content.experience[0].title !== "" && (
              <div className="space-y-3 section-block">
                <h2 className="text-[10px] font-bold uppercase tracking-wider text-zinc-800 border-b border-zinc-200 pb-0.5">
                  Professional Experience
                </h2>
                <div className="space-y-3">
                  {content.experience.map((exp, idx) => (
                    <div key={idx} className="space-y-1 experience-item">
                      <div className="flex justify-between items-baseline font-bold">
                        <span className="text-[10px] text-zinc-900">{exp.title}</span>
                        <span className="text-[9px] text-zinc-500 font-normal">
                          {exp.startDate} – {exp.endDate}
                        </span>
                      </div>
                      <p className="text-[9px] font-semibold text-zinc-700 italic">{exp.company}</p>
                      {exp.bullets.length > 0 && (
                        <ul className="list-disc pl-4 space-y-0.5 text-zinc-600 text-[9px] leading-normal">
                          {exp.bullets.filter(b => b.trim().length > 0).map((bullet, bIdx) => (
                            <li key={bIdx} className="text-justify">{bullet}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {content.education.length > 0 && content.education[0].school !== "" && (
              <div className="space-y-1.5 section-block">
                <h2 className="text-[10px] font-bold uppercase tracking-wider text-zinc-800 border-b border-zinc-200 pb-0.5">
                  Academic Background
                </h2>
                <div className="space-y-2">
                  {content.education.map((edu, idx) => (
                    <div key={idx} className="flex justify-between items-baseline text-[9px] education-item">
                      <div>
                        <span className="font-bold text-zinc-800">{edu.school}</span>
                        <span className="text-zinc-500"> • {edu.degree}</span>
                      </div>
                      <span className="text-zinc-500 font-medium">{edu.year}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Printable helpers strictly active when browser triggers page printing */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            @page {
              size: A4 portrait;
              margin: 10mm 10mm 10mm 10mm;
            }

            html, body {
              width: 100% !important;
              height: auto !important;
              background: #ffffff !important;
              color: #111827 !important;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              margin: 0 !important;
              padding: 0 !important;
            }

            /* Hide app navigation, headers, sidebars, coach, hero sections and print-hidden elements */
            aside, header, nav, footer, .print\\:hidden, #resume-builder-container > div:first-child, .fixed {
              display: none !important;
              opacity: 0 !important;
              visibility: hidden !important;
              height: 0 !important;
              width: 0 !important;
              margin: 0 !important;
              padding: 0 !important;
            }

            #resume-builder-container {
              display: block !important;
              width: 100% !important;
              max-width: none !important;
              margin: 0 !important;
              padding: 0 !important;
            }

            #resume-builder-container > div:last-child {
              position: static !important;
              width: 100% !important;
              max-width: none !important;
              margin: 0 !important;
              padding: 0 !important;
              border: none !important;
              box-shadow: none !important;
              background: transparent !important;
            }

            #printable-resume-page {
              border: none !important;
              box-shadow: none !important;
              padding: 0 !important;
              margin: 0 !important;
              max-width: none !important;
              width: 100% !important;
              height: auto !important;
              min-height: 100% !important;
              aspect-ratio: auto !important;
              background: transparent !important;
            }

            #printable-resume-page h1 {
              font-size: 20pt !important;
              line-height: 1.2 !important;
              color: #111827 !important;
              margin-bottom: 2pt !important;
            }

            #printable-resume-page h2 {
              font-size: 11pt !important;
              color: #111827 !important;
              border-bottom: 1px solid #111827 !important;
              padding-bottom: 2pt !important;
              margin-top: 12pt !important;
              margin-bottom: 6pt !important;
            }

            #printable-resume-page p, 
            #printable-resume-page li, 
            #printable-resume-page span {
              font-size: 9.5pt !important;
              line-height: 1.4 !important;
              color: #374151 !important;
            }

            #printable-resume-page .font-bold, 
            #printable-resume-page .font-semibold {
              color: #111827 !important;
            }

            .section-block {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              margin-bottom: 12pt !important;
            }

            .experience-item, .education-item {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              margin-bottom: 8pt !important;
            }

            .skill-badge {
              background-color: #f3f4f6 !important;
              border: 1px solid #e5e7eb !important;
              color: #1f2937 !important;
              display: inline-block !important;
              margin: 2pt !important;
              padding: 2pt 6pt !important;
              border-radius: 4px !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        ` }} />
      </div>
    </div>
  );
}
