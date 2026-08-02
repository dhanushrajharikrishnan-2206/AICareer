"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { 
  Upload, RefreshCw, FileText, Download, Sparkles, Copy, 
  Check, Building2, UserCheck, Briefcase, Wand2, Layers, Award, Printer, Loader2
} from "lucide-react";
import { downloadElementAsPdf } from "@/lib/pdf-export";

export default function CoverLetterPage() {
  const [resumeText, setResumeText] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [tone, setTone] = useState("persuasive");
  const [letter, setLetter] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [fileName, setFileName] = useState("");
  const [copied, setCopied] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  async function handleDownloadPDF() {
    setExportingPdf(true);
    try {
      const filename = company ? `Cover_Letter_${company}` : "Cover_Letter";
      await downloadElementAsPdf("printable-cover-letter-page", { filename });
    } catch (e) {
      console.error(e);
      window.print();
    } finally {
      setExportingPdf(false);
    }
  }

  const resultRef = useRef<HTMLDivElement>(null);
  const shouldScroll = useRef(false);

  useEffect(() => {
    if (letter && shouldScroll.current) {
      shouldScroll.current = false;
      const timer = setTimeout(() => {
        if (resultRef.current) {
          try {
            resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
          } catch (e) {
            try { resultRef.current.scrollIntoView(true); } catch (err) {}
          }
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [letter]);

  async function handleGenerate() {
    setLoading(true);
    shouldScroll.current = true;
    try {
      const res = await fetch("/api/ai/cover-letter", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-ai-model": typeof window !== "undefined" ? localStorage.getItem("pref_ai_model") || "gemini-flash" : "gemini-flash"
        },
        body: JSON.stringify({ resumeText, jobTitle, company, jobDescription, tone })
      });
      const data = await res.json();
      setLetter(data.content || data.error || "Failed to generate cover letter.");
    } catch (e) {
      console.error(e);
      setLetter("An error occurred connecting to the AI generator.");
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

  function handleCopy() {
    navigator.clipboard.writeText(letter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12 animate-fade-in">
      
      {/* ── HERO BANNER ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-zinc-900 via-purple-950 to-slate-900 p-6 md:p-8 text-white border border-purple-900/40 shadow-xl">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 opacity-15 blur-3xl w-96 h-96 bg-purple-500 rounded-full" />
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30 px-3 py-1 rounded-full uppercase tracking-wider">
              <Wand2 className="w-3.5 h-3.5 text-purple-400" /> AI Letter Architect
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full uppercase tracking-wider">
              <Printer className="w-3.5 h-3.5 text-emerald-400" /> A4 PDF Export Ready
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">
            AI Cover Letter Generator & Studio
          </h1>
          <p className="text-zinc-300 text-xs md:text-sm leading-relaxed">
            Craft tailored, high-converting cover letters matching target role qualifications. Formatted for A4 print and instant PDF exports.
          </p>
        </div>
      </div>

      {/* ── MAIN WORKSPACE GRID ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Form Controls (6 Cols) */}
        <div className="lg:col-span-6 space-y-5">
          <Card className="p-5 border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4 bg-white dark:bg-zinc-900">
            <p className="text-xs font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-purple-500" /> Target Role Credentials
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Target Role Title *</label>
                <Input 
                  placeholder="e.g. Senior Product Designer" 
                  value={jobTitle} 
                  onChange={(e) => setJobTitle(e.target.value)} 
                  className="h-10 text-xs bg-zinc-50/50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Company Name *</label>
                <Input 
                  placeholder="e.g. Stripe" 
                  value={company} 
                  onChange={(e) => setCompany(e.target.value)} 
                  className="h-10 text-xs bg-zinc-50/50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800"
                />
              </div>
            </div>

            {/* Tone Selector */}
            <div className="space-y-2 pt-1">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">Letter Tone & Writing Style</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "persuasive", name: "Persuasive", desc: "Results & ROI focused" },
                  { id: "executive", name: "Executive", desc: "Leadership & Strategy" },
                  { id: "creative", name: "Startup", desc: "Modern & Energetic" },
                  { id: "technical", name: "Technical", desc: "Frameworks & Systems" }
                ].map((item) => {
                  const active = tone === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setTone(item.id)}
                      className={`p-2.5 text-left border rounded-xl transition-all cursor-pointer ${
                        active 
                          ? "border-purple-600 bg-purple-50/50 dark:bg-purple-950/40 text-purple-950 dark:text-purple-200 font-bold" 
                          : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                      }`}
                    >
                      <span className="text-xs font-bold block">{item.name}</span>
                      <span className="text-[9px] text-zinc-400 block">{item.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PDF Upload */}
            <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Resume Source Content *</label>
                
                <label className="cursor-pointer bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700/60 border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 text-zinc-700 dark:text-zinc-200 transition-all select-none shadow-2xs">
                  <Upload className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{fileName ? `Change PDF` : "Upload PDF"}</span>
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
                <div className="bg-zinc-900 text-emerald-400 rounded-xl p-3 text-xs flex items-center gap-2 font-mono border border-emerald-500/30">
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-400 shrink-0" />
                  <span>{uploadProgress}</span>
                </div>
              )}

              {fileName && !uploading && (
                <div className="bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl px-3 py-2 text-xs flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold">
                  <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="truncate">Active: {fileName}</span>
                  <button 
                    onClick={() => { setFileName(""); setResumeText(""); }}
                    className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 ml-auto font-bold text-[11px]"
                  >
                    Clear
                  </button>
                </div>
              )}

              <Textarea
                rows={5}
                className="text-xs font-mono leading-relaxed bg-zinc-50/50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 rounded-xl"
                placeholder="Paste resume text here, or upload a PDF above..."
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Target Job Description (Optional)</label>
              <Textarea
                rows={4}
                className="text-xs leading-relaxed bg-zinc-50/50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 rounded-xl"
                placeholder="Paste job description here to align competencies..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={loading || !resumeText || !jobTitle || !company}
              className="w-full h-11 bg-gradient-to-r from-purple-700 via-indigo-700 to-slate-900 hover:from-purple-600 hover:to-indigo-600 text-white font-black text-sm rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Drafting Personalized Cover Letter...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  Generate A4 Cover Letter
                </>
              )}
            </Button>
          </Card>
        </div>

        {/* Right Column: Live Printable A4 Document Preview (6 Cols) */}
        <div ref={resultRef} className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              A4 Document Preview
            </span>
            {letter && (
              <div className="flex items-center gap-2 print:hidden">
                <Button
                  variant="secondary"
                  onClick={handleCopy}
                  className="h-8 px-3 text-xs font-bold flex items-center gap-1.5 cursor-pointer border-zinc-200 dark:border-zinc-800"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied" : "Copy Text"}</span>
                </Button>
                <Button
                  onClick={handleDownloadPDF}
                  disabled={exportingPdf}
                  className="h-8 px-3 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 cursor-pointer shadow-sm"
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
                  onClick={() => window.print()}
                  title="System Print"
                  className="h-8 px-2 text-xs font-semibold cursor-pointer border-zinc-200"
                >
                  <Printer className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
          </div>

          {letter ? (
            <div
              id="printable-cover-letter-page"
              className="bg-white text-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl p-10 font-sans aspect-[1/1.41] w-full max-w-[650px] mx-auto overflow-hidden text-xs leading-relaxed select-text rounded-2xl print:border-none print:shadow-none print:p-0 print:max-w-none print:w-full print:aspect-auto"
            >
              {/* Professional Letter Header */}
              <div className="mb-6 border-b border-zinc-200 pb-4 flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-black uppercase tracking-tight text-zinc-950">{company} Application</h2>
                  <p className="text-indigo-600 font-bold text-[10px] tracking-wider uppercase mt-0.5">
                    Position: {jobTitle}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-semibold text-zinc-400 block">{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Confidential</span>
                </div>
              </div>
              
              {/* Letter Body */}
              <div className="text-zinc-700 font-normal whitespace-pre-wrap text-[11px] leading-relaxed text-justify space-y-3 font-sans">
                {letter}
              </div>
            </div>
          ) : (
            <Card className="p-8 text-center border-dashed border-zinc-300 dark:border-zinc-800 h-[480px] flex flex-col items-center justify-center bg-white dark:bg-zinc-900 rounded-2xl space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-500 mb-1">
                <FileText className="w-7 h-7" />
              </div>
              <p className="text-base font-black text-zinc-900 dark:text-zinc-100">Cover Letter Canvas Ready</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto leading-relaxed">
                Fill in the job title, company, and resume details on the left, then click Generate to create a tailored A4 letter.
              </p>
            </Card>
          )}

          {/* Print CSS Rules */}
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              @page {
                size: A4 portrait;
                margin: 20mm 20mm 20mm 20mm;
              }
              html, body {
                width: 210mm !important;
                height: auto !important;
                background: #ffffff !important;
                color: #111827 !important;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              aside, header, nav, footer, .print\\:hidden, button, svg {
                display: none !important;
                opacity: 0 !important;
                visibility: hidden !important;
                height: 0 !important;
                width: 0 !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              #printable-cover-letter-page {
                border: none !important;
                box-shadow: none !important;
                padding: 0 !important;
                margin: 0 !important;
                max-width: none !important;
                width: 100% !important;
                height: auto !important;
                aspect-ratio: auto !important;
                background: transparent !important;
              }
            }
          ` }} />
        </div>

      </div>
    </div>
  );
}
