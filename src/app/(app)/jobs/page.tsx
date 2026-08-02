"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Search,
  MapPin,
  Briefcase,
  Star,
  CheckCircle,
  Clock,
  FileText,
  Award,
  ArrowUpRight,
  Copy,
  Check,
  Building2,
  Sparkles,
  UserCheck,
  AlertCircle,
  Zap,
  TrendingUp,
  BarChart2,
  RefreshCw,
  ChevronDown,
  X,
} from "lucide-react";

type Job = { id: string; title: string; company: string; location: string | null; description: string; postedAt?: string };
type AIRecommendation = {
  title: string;
  company: string;
  location: string;
  matchScore: number;
  reason: string;
  description: string;
  bridgingSkills: string[];
};

export default function JobsPage() {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [resumeText, setResumeText] = useState("");
  const [matchScores, setMatchScores] = useState<Record<string, { score: number; reason: string }>>({});
  const [digest, setDigest] = useState("");
  const [loading, setLoading] = useState(false);
  const [matchingJobId, setMatchingJobId] = useState<string | null>(null);

  // AI recommendations tab state
  const [activeTab, setActiveTab] = useState<"all" | "ai">("all");
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendation[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [latencyMode, setLatencyMode] = useState<"low" | "high">("low");
  const [recommendationError, setRecommendationError] = useState("");

  // Easy Apply Flow States
  const [isApplying, setIsApplying] = useState(false);
  const [applyStep, setApplyStep] = useState<"confirm" | "resume" | "submitting" | "success">("confirm");
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());

  // Show/Hide Resume Textarea
  const [showResumeInput, setShowResumeInput] = useState(false);

  // Copy success feedback state
  const [copied, setCopied] = useState(false);

  // Post a Job Form States
  const [isPostingJob, setIsPostingJob] = useState(false);
  const [newJobTitle, setNewJobTitle] = useState("");
  const [newJobCompany, setNewJobCompany] = useState("");
  const [newJobLocation, setNewJobLocation] = useState("");
  const [newJobDescription, setNewJobDescription] = useState("");
  const [newJobUrl, setNewJobUrl] = useState("");
  const [postingError, setPostingError] = useState("");
  const [postingSuccess, setPostingSuccess] = useState(false);

  // Daily Digest Alert States
  const [dailyDigest, setDailyDigest] = useState<any>(null);
  const [loadingDaily, setLoadingDaily] = useState(false);
  const [dailySubscribed, setDailySubscribed] = useState(true);
  const [showDailyPreview, setShowDailyPreview] = useState(false);

  async function triggerDailyCron() {
    setLoadingDaily(true);
    try {
      const res = await fetch("/api/jobs/digest/daily");
      const data = await res.json();
      setDailyDigest(data);
      setShowDailyPreview(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDaily(false);
    }
  }

  async function handlePostJob(e: React.FormEvent) {
    e.preventDefault();
    setPostingError("");
    setPostingSuccess(false);

    if (!newJobTitle || !newJobCompany || !newJobDescription) {
      setPostingError("Title, Company, and Description are required.");
      return;
    }

    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newJobTitle,
          company: newJobCompany,
          location: newJobLocation || "Remote",
          description: newJobDescription,
          url: newJobUrl
        })
      });

      if (res.ok) {
        setPostingSuccess(true);
        setNewJobTitle("");
        setNewJobCompany("");
        setNewJobLocation("");
        setNewJobDescription("");
        setNewJobUrl("");
        
        // Refresh job listings
        handleSearch();
        
        // Close modal after delay
        setTimeout(() => {
          setIsPostingJob(false);
          setPostingSuccess(false);
        }, 1500);
      } else {
        const errData = await res.json();
        setPostingError(errData.error || "Failed to create job posting.");
      }
    } catch (err: any) {
      setPostingError(err.message || "An error occurred.");
    }
  }

  async function loadSaved() {
    const res = await fetch("/api/jobs/save");
    if (!res.ok) {
      setSavedIds(new Set());
      return;
    }
    const data = await res.json();
    if (Array.isArray(data)) {
      setSavedIds(new Set(data.map((s: any) => s.jobId)));
    } else {
      setSavedIds(new Set());
    }
  }

  async function fetchRecommendations(forcedModel?: string) {
    setLoadingRecommendations(true);
    setRecommendationError("");
    const targetModel = forcedModel || (latencyMode === "low" ? "gemini-3.1-flash-lite" : "gemini-3.5-flash");
    try {
      const res = await fetch("/api/jobs/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: targetModel })
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.recommendations)) {
        setAiRecommendations(data.recommendations);
        if (data.recommendations.length > 0) {
          const firstRec = data.recommendations[0];
          const recAsJob: Job = {
            id: `rec-${firstRec.company.replace(/\s+/g, "-")}-${firstRec.title.replace(/\s+/g, "-")}`,
            title: firstRec.title,
            company: firstRec.company,
            location: firstRec.location,
            description: firstRec.description
          };
          setSelectedJob(recAsJob);
          setMatchScores(prev => ({
            ...prev,
            [recAsJob.id]: {
              score: firstRec.matchScore,
              reason: firstRec.reason
            }
          }));
        }
      } else {
        setRecommendationError(data.error || "Failed to generate customized job suggestions.");
      }
    } catch (err: any) {
      setRecommendationError(err.message || "An error occurred fetching recommendations.");
    } finally {
      setLoadingRecommendations(false);
    }
  }

  async function handleSearch(initialLoad = false) {
    if (!initialLoad) setLoading(true);
    const params = new URLSearchParams({ query, location });
    const res = await fetch(`/api/jobs?${params}`);
    if (res.ok) {
      const data = await res.json();
      const jobList = Array.isArray(data) ? data : [];
      setJobs(jobList);
      if (jobList.length > 0 && !selectedJob && activeTab === "all") {
        setSelectedJob(jobList[0]);
      }
    } else {
      setJobs([]);
    }
    if (!initialLoad) setLoading(false);
  }

  useEffect(() => {
    loadSaved();
    handleSearch(true);

    // Auto-populate user's latest resume on mount
    fetch("/api/resume")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const latest = data[0];
          if (latest.content) {
            let resumeStr = "";
            try {
              const parsed = typeof latest.content === "string" ? JSON.parse(latest.content) : latest.content;
              if (parsed.summary || parsed.skills || parsed.experience) {
                resumeStr = `Resume Title: ${latest.title}\n\n`;
                if (parsed.summary) resumeStr += `Summary:\n${parsed.summary}\n\n`;
                if (Array.isArray(parsed.skills)) resumeStr += `Skills:\n${parsed.skills.join(", ")}\n\n`;
                if (Array.isArray(parsed.experience)) {
                  resumeStr += `Experience:\n${parsed.experience.map((e: any) => `- ${e.role} at ${e.company} (${e.duration || ""}): ${e.description || ""}`).join("\n")}\n\n`;
                }
              } else {
                resumeStr = latest.content;
              }
            } catch {
              resumeStr = latest.content;
            }
            setResumeText(resumeStr);
          }
        }
      })
      .catch((err) => console.error("Error loading resume in jobs page:", err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleMatch(jobId: string) {
    if (!resumeText) return;
    setMatchingJobId(jobId);
    try {
      const res = await fetch("/api/jobs/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, resumeText })
      });
      const data = await res.json();
      setMatchScores((prev) => ({ ...prev, [jobId]: { score: data.matchScore, reason: data.reason } }));
    } catch (e) {
      console.error(e);
    }
    setMatchingJobId(null);
  }

  async function toggleSave(jobId: string) {
    if (savedIds.has(jobId)) {
      await fetch("/api/jobs/save", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId })
      });
    } else {
      const isRec = jobId.startsWith("rec-") && selectedJob;
      const jobDetails = isRec ? {
        title: selectedJob.title,
        company: selectedJob.company,
        location: selectedJob.location,
        description: selectedJob.description
      } : undefined;

      await fetch("/api/jobs/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          matchScore: matchScores[jobId]?.score,
          jobDetails
        })
      });
    }
    loadSaved();
  }

  async function handleDigest() {
    setLoading(true);
    const res = await fetch("/api/jobs/digest");
    const data = await res.json();
    setDigest(data.digest);
    setLoading(false);
  }

  function handleEasyApplyTrigger() {
    setApplyStep("confirm");
    setIsApplying(true);
  }

  function handleEasyApplySubmit() {
    setApplyStep("submitting");
    setTimeout(() => {
      if (selectedJob) {
        setAppliedJobIds((prev) => {
          const next = new Set(prev);
          next.add(selectedJob.id);
          return next;
        });
      }
      setApplyStep("success");
    }, 1500);
  }

  function copyDigestToClipboard() {
    navigator.clipboard.writeText(digest);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Generate simple letter avatar background color based on company name
  function getCompanyGradient(name: string) {
    const charCodeSum = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const gradients = [
      "from-blue-600 to-cyan-500",
      "from-purple-600 to-indigo-500",
      "from-emerald-600 to-teal-500",
      "from-rose-600 to-pink-500",
      "from-amber-500 to-orange-500",
      "from-zinc-700 to-zinc-900"
    ];
    return gradients[charCodeSum % gradients.length];
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f0f1a 0%, #111827 50%, #0d1117 100%)", fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        .jobs-wrap { max-width: 1400px; margin: 0 auto; padding: 2rem 1rem; display: flex; flex-direction: column; gap: 1.5rem; }
        .jglass { background: rgba(255,255,255,0.04); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.08); border-radius: 1rem; }
        .jcard { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 0.75rem; padding: 1rem; cursor: pointer; display: flex; gap: 0.75rem; position: relative; transition: all 0.2s; }
        .jcard:hover { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.13); }
        .jcard-sel { background: rgba(99,102,241,0.14) !important; border-color: rgba(99,102,241,0.5) !important; }
        .jscroll::-webkit-scrollbar{width:3px}.jscroll::-webkit-scrollbar-track{background:rgba(255,255,255,0.02)}.jscroll::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.12);border-radius:2px}
        .jin{animation:jin .35s cubic-bezier(.16,1,.3,1) forwards}@keyframes jin{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .jshim{background:linear-gradient(90deg,rgba(255,255,255,0.03) 0%,rgba(255,255,255,0.07) 50%,rgba(255,255,255,0.03) 100%);background-size:200% 100%;animation:jshim 1.5s infinite}@keyframes jshim{0%{background-position:-200% 0}100%{background-position:200% 0}}
        .jin-score{transition:width 1s cubic-bezier(.4,0,.2,1)}
        .jin-input{background:rgba(255,255,255,0.05) !important;border:1px solid rgba(255,255,255,0.1) !important;color:#e5e7eb !important;border-radius:0.75rem !important;outline:none !important}
        .jin-input::placeholder{color:rgba(255,255,255,0.28) !important}
        .jin-input:focus{border-color:rgba(99,102,241,0.55) !important;box-shadow:0 0 0 3px rgba(99,102,241,0.13) !important}
        .jin-btn{display:inline-flex;align-items:center;gap:6px;border:none;font-weight:700;cursor:pointer;font-size:0.75rem;border-radius:0.75rem;transition:all 0.2s;padding:0 1rem;height:40px}
        .jin-primary{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white}
        .jin-emerald{background:linear-gradient(135deg,#10b981,#059669);color:white;box-shadow:0 4px 15px rgba(16,185,129,0.3)}
        .jin-ghost{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.09) !important;color:#9ca3af}
        .jin-ghost:hover{background:rgba(255,255,255,0.09);border-color:rgba(255,255,255,0.16) !important}
      `}</style>
      <div className="jobs-wrap">
      
      {/* ── HERO SEARCH BAR ─────────────────────────────────────── */}
      <div className="jglass" style={{ padding: "1.5rem", background: "linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(139,92,246,0.05) 100%)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: "1.25rem" }}>
          <div>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#818cf8", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", padding: "4px 10px", borderRadius: 9999, marginBottom: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#6366f1" }} /> AI-Powered Job Search
            </span>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 900, color: "white", margin: 0 }}>Find Your Next Opportunity</h1>
            <p style={{ fontSize: "0.875rem", color: "#6b7280", margin: "4px 0 0" }}>AI-matched jobs tailored to your resume and career goals</p>
          </div>
          <button onClick={() => setIsPostingJob(true)} className="jin-btn jin-primary"><Building2 style={{ width: 15, height: 15 }} /> Post a Job</button>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 180, position: "relative" }}>
            <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "#6b7280" }} />
            <input placeholder="Job title, company, or keywords..." value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSearch()} className="jin-input" style={{ width: "100%", height: 44, paddingLeft: 40, paddingRight: 12, fontSize: "0.875rem", border: "1px solid rgba(255,255,255,0.1)" }} />
          </div>
          <div style={{ width: 220, position: "relative" }}>
            <MapPin style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "#6b7280" }} />
            <input placeholder="City or Remote" value={location} onChange={e => setLocation(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSearch()} className="jin-input" style={{ width: "100%", height: 44, paddingLeft: 40, paddingRight: 12, fontSize: "0.875rem", border: "1px solid rgba(255,255,255,0.1)" }} />
          </div>
          <button onClick={() => handleSearch()} disabled={loading} className="jin-btn jin-primary" style={{ height: 44, opacity: loading ? 0.6 : 1 }}>
            {loading ? <RefreshCw style={{ width: 14, height: 14 }} /> : <Search style={{ width: 14, height: 14 }} />}
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: "1rem", paddingTop: "0.875rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: resumeText ? "#10b981" : "#f59e0b" }} />
            <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>{resumeText ? "Resume loaded — AI scoring active" : "Add resume to enable AI match scoring"}</span>
          </div>
          <button onClick={() => setShowResumeInput(!showResumeInput)} className="jin-btn jin-ghost" style={{ height: 34, fontSize: "0.7rem" }}>
            <FileText style={{ width: 13, height: 13 }} />{showResumeInput ? "Hide Editor" : "Open Resume Workspace"}
            <ChevronDown style={{ width: 13, height: 13, transform: showResumeInput ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
          </button>
        </div>
        {showResumeInput && (
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "0.875rem", marginTop: "0.5rem" }} className="jin">
            <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "#9ca3af", marginBottom: 6 }}>Resume Workspace</p>
            <textarea rows={4} placeholder="Paste your resume text here to enable AI match scoring..." value={resumeText} onChange={e => setResumeText(e.target.value)} style={{ width: "100%", padding: "0.75rem", fontSize: "0.75rem", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.75rem", color: "#d1d5db", outline: "none", resize: "none" }} />
          </div>
        )}
      </div>

      {/* ── DIGEST + DAILY ALERTS ───────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
        {/* Weekly Digest */}
        <div className="jglass" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Sparkles style={{ width: 16, height: 16, color: "white" }} />
            </div>
            <div><p style={{ fontSize: "0.875rem", fontWeight: 700, color: "white", margin: 0 }}>Weekly AI Digest</p><p style={{ fontSize: "0.625rem", color: "#6b7280", margin: 0 }}>Curated vacancy summary</p></div>
          </div>
          <button onClick={handleDigest} disabled={loading} className="jin-btn jin-ghost" style={{ width: "100%", justifyContent: "center", height: 38, opacity: loading ? 0.5 : 1 }}>
            {loading ? <RefreshCw style={{ width: 13, height: 13 }} /> : <Zap style={{ width: 13, height: 13, color: "#818cf8" }} />}
            {loading ? "Generating..." : "Generate Weekly Digest"}
          </button>
          {digest && (
            <div style={{ borderRadius: 12, padding: "0.875rem", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }} className="jin">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#818cf8" }}>Weekly Summary</span>
                <button onClick={copyDigestToClipboard} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.65rem", color: "#818cf8", background: "none", border: "none", cursor: "pointer" }}>
                  {copied ? <Check style={{ width: 11, height: 11 }} /> : <Copy style={{ width: 11, height: 11 }} />}{copied ? "Copied" : "Copy"}
                </button>
              </div>
              <p style={{ fontSize: "0.7rem", color: "#d1d5db", whiteSpace: "pre-wrap", lineHeight: 1.7, maxHeight: 120, overflowY: "auto" }} className="jscroll">{digest}</p>
            </div>
          )}
        </div>
        {/* Daily Alerts */}
        <div className="jglass" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#10b981,#059669)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <TrendingUp style={{ width: 16, height: 16, color: "white" }} />
              </div>
              <div><p style={{ fontSize: "0.875rem", fontWeight: 700, color: "white", margin: 0 }}>Daily Skill Alerts</p><p style={{ fontSize: "0.625rem", color: "#6b7280", margin: 0 }}>Roadmap-matched listings</p></div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: "0.6rem", color: "#6b7280", fontWeight: 700 }}>EMAIL</span>
              <button onClick={() => setDailySubscribed(!dailySubscribed)} style={{ width: 36, height: 20, borderRadius: 10, padding: "2px", background: dailySubscribed ? "#10b981" : "rgba(255,255,255,0.1)", border: "none", cursor: "pointer", transition: "background 0.2s" }}>
                <div style={{ width: 16, height: 16, borderRadius: "50%", background: "white", transform: dailySubscribed ? "translateX(16px)" : "translateX(0)", transition: "transform 0.2s" }} />
              </button>
            </div>
          </div>
          <button onClick={triggerDailyCron} disabled={loadingDaily} className="jin-btn jin-ghost" style={{ width: "100%", justifyContent: "center", height: 38, opacity: loadingDaily ? 0.5 : 1 }}>
            {loadingDaily ? <RefreshCw style={{ width: 13, height: 13 }} /> : <Zap style={{ width: 13, height: 13, color: "#34d399" }} />}
            {loadingDaily ? "Scanning..." : "⚡ Simulate Daily Cron"}
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.65rem", color: "#6b7280" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} />
            {dailySubscribed ? "Active · Triggers at 8:00 AM" : "Paused"}
          </div>
        </div>
      </div>

      {/* Daily Preview */}
      {showDailyPreview && dailyDigest && (
        <div className="jglass jin" style={{ padding: "1.25rem", border: "1px solid rgba(16,185,129,0.3)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "0.75rem", marginBottom: "0.875rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <CheckCircle style={{ width: 18, height: 18, color: "#34d399" }} />
              <div>
                <p style={{ fontWeight: 900, fontSize: "0.7rem", color: "white", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>Daily Match Alert Generated!</p>
                <p style={{ fontSize: "0.6rem", color: "#34d399", margin: 0 }}>From your saved skill roadmaps</p>
              </div>
            </div>
            <button onClick={() => setShowDailyPreview(false)} style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer" }}><X style={{ width: 16, height: 16 }} /></button>
          </div>
          {dailyDigest.matches?.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10 }}>
              {dailyDigest.matches.map((m: any, i: number) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "0.75rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: "0.75rem", color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.jobTitle}</span>
                    <span style={{ fontSize: "0.6rem", fontWeight: 700, color: "#34d399", background: "rgba(16,185,129,0.1)", padding: "2px 6px", borderRadius: 4, flexShrink: 0 }}>{m.company}</span>
                  </div>
                  <p style={{ fontSize: "0.7rem", color: "#9ca3af", lineHeight: 1.6 }}>{m.whyMatch}</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                    {m.matchingSkills?.map((sk: string, si: number) => (
                      <span key={si} style={{ fontSize: "0.6rem", fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "rgba(16,185,129,0.1)", color: "#34d399", border: "1px solid rgba(16,185,129,0.2)" }}>{sk}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : <p style={{ fontSize: "0.75rem", color: "#fbbf24" }}>{dailyDigest.message || "No exact skill overlap today."}</p>}
        </div>
      )}


      {/* ── MAIN SPLIT PANE ──────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "5fr 7fr", gap: "1.25rem", alignItems: "start" }}>
        
        {/* LEFT: Job List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          
          {/* Tabs */}
          <div className="jglass" style={{ padding: 4, display: "flex", gap: 4 }}>
            <button onClick={() => { setActiveTab("all"); if (jobs.length > 0) setSelectedJob(jobs[0]); }} style={{ flex: 1, padding: "8px", borderRadius: 10, border: "none", cursor: "pointer", fontWeight: 700, fontSize: "0.75rem", background: activeTab === "all" ? "rgba(255,255,255,0.1)" : "transparent", color: activeTab === "all" ? "white" : "#6b7280", transition: "all 0.2s" }}>
              All Jobs ({jobs.length})
            </button>
            <button
              onClick={() => { setActiveTab("ai"); if (aiRecommendations.length === 0) fetchRecommendations(); else { const r = aiRecommendations[0]; setSelectedJob({ id: `rec-${r.company.replace(/\s+/g, "-")}-${r.title.replace(/\s+/g, "-")}`, title: r.title, company: r.company, location: r.location, description: r.description }); } }}
              style={{ flex: 1, padding: "8px", borderRadius: 10, border: "none", cursor: "pointer", fontWeight: 700, fontSize: "0.75rem", background: activeTab === "ai" ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "transparent", color: activeTab === "ai" ? "white" : "#6b7280", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
            >
              <Sparkles style={{ width: 13, height: 13 }} /> AI Picks
            </button>
          </div>

          {activeTab === "ai" && (
            <div className="jglass jin" style={{ padding: "0.75rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: "0.6rem", fontWeight: 700, color: "#818cf8", textTransform: "uppercase", letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: 4 }}><Zap style={{ width: 11, height: 11 }} /> AI Engine Speed</span>
                <span style={{ fontSize: "0.6rem", color: "#6b7280" }}>{latencyMode === "low" ? "⚡ < 1.5s" : "🧠 Full Reasoning"}</span>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {[{ k: "low", l: "⚡ Ultra-Fast", m: "gemini-3.1-flash-lite" }, { k: "high", l: "🧠 Deep Flash", m: "gemini-3.5-flash" }].map(o => (
                  <button key={o.k} onClick={() => { setLatencyMode(o.k as any); fetchRecommendations(o.m); }} style={{ flex: 1, padding: "6px", borderRadius: 8, border: latencyMode === o.k ? "none" : "1px solid rgba(255,255,255,0.1)", cursor: "pointer", fontWeight: 700, fontSize: "0.65rem", background: latencyMode === o.k ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "transparent", color: latencyMode === o.k ? "white" : "#6b7280", transition: "all 0.2s" }}>{o.l}</button>
                ))}
              </div>
            </div>
          )}

          {activeTab === "all" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 720, overflowY: "auto" }} className="jscroll">
              <p style={{ fontSize: "0.625rem", fontWeight: 700, color: "#4b5563", textTransform: "uppercase", letterSpacing: "0.1em", paddingLeft: 2 }}>{jobs.length} Positions</p>
              {jobs.map((job) => {
                const isSelected = selectedJob?.id === job.id;
                const hasApplied = appliedJobIds.has(job.id);
                const isSaved = savedIds.has(job.id);
                const score = matchScores[job.id];
                const scoreColor = score ? (score.score >= 80 ? "#34d399" : score.score >= 60 ? "#fbbf24" : "#f87171") : null;
                const colors = ["from-violet-600 to-indigo-600", "from-emerald-500 to-teal-600", "from-rose-500 to-pink-600", "from-amber-500 to-orange-500", "from-sky-500 to-blue-600", "from-purple-600 to-fuchsia-600"];
                const gradClass = colors[job.company.split("").reduce((a,c)=>a+c.charCodeAt(0),0)%colors.length];
                return (
                  <div key={job.id} onClick={() => setSelectedJob(job)} className={isSelected ? "jcard jcard-sel" : "jcard"}>
                    <div className={`bg-gradient-to-br ${gradClass}`} style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 900, fontSize: "0.875rem" }}>{job.company.substring(0,2).toUpperCase()}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: "0.875rem", color: isSelected ? "#a5b4fc" : "#f3f4f6", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{job.title}</span>
                        {isSaved && <Star style={{ width: 14, height: 14, color: "#fbbf24", fill: "#fbbf24", flexShrink: 0 }} />}
                      </div>
                      <p style={{ fontSize: "0.75rem", color: "#6b7280", margin: "2px 0 4px" }}>{job.company}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.625rem", color: "#4b5563" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 2 }}><MapPin style={{ width: 10, height: 10 }} />{job.location || "Remote"}</span>
                        <span>·</span><span>{job.postedAt ? new Date(job.postedAt).toLocaleDateString() : "Just now"}</span>
                      </div>
                      <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                        <span style={{ fontSize: "0.6rem", fontWeight: 700, padding: "2px 8px", borderRadius: 9999, background: "rgba(16,185,129,0.1)", color: "#34d399", border: "1px solid rgba(16,185,129,0.2)" }}>Easy Apply</span>
                        {hasApplied && <span style={{ fontSize: "0.6rem", fontWeight: 700, padding: "2px 8px", borderRadius: 9999, background: "rgba(99,102,241,0.1)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.2)" }}>Applied ✓</span>}
                        {score && <span style={{ fontSize: "0.6rem", fontWeight: 700, padding: "2px 8px", borderRadius: 9999, background: `${scoreColor}18`, color: scoreColor!, border: `1px solid ${scoreColor}40` }}>{score.score}% match</span>}
                      </div>
                    </div>
                    {isSelected && <div style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", width: 3, height: 24, background: "#6366f1", borderRadius: 99 }} />}
                  </div>
                );
              })}

              {jobs.length === 0 && !loading && (
                <div className="jglass" style={{ padding: "2rem", textAlign: "center" }}>
                  <Briefcase style={{ width: 32, height: 32, color: "#4b5563", margin: "0 auto 12px" }} />
                  <p style={{ fontSize: "0.75rem", color: "#6b7280" }}>No jobs found. Try clearing filters.</p>
                  <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 12 }}>
                    <button onClick={() => { setQuery(""); setLocation(""); handleSearch(false); }} className="jin-btn jin-ghost" style={{ height: 34 }}>Reset</button>
                    <button onClick={() => setIsPostingJob(true)} className="jin-btn jin-primary" style={{ height: 34 }}>Post a Job</button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 720, overflowY: "auto" }} className="jscroll">
              <p style={{ fontSize: "0.625rem", fontWeight: 700, color: "#4b5563", textTransform: "uppercase", letterSpacing: "0.1em", paddingLeft: 2 }}>AI Picks ({aiRecommendations.length})</p>
              {loadingRecommendations ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[1,2,3].map(i => <div key={i} className="jcard"><div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0 }} className="jshim" /><div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}><div style={{ height: 16, borderRadius: 6, width: "60%" }} className="jshim" /><div style={{ height: 12, borderRadius: 6, width: "40%" }} className="jshim" /></div></div>)}
                </div>
              ) : recommendationError ? (
                <div className="jglass" style={{ padding: "1.5rem", textAlign: "center" }}>
                  <AlertCircle style={{ width: 28, height: 28, color: "#f87171", margin: "0 auto 10px" }} />
                  <p style={{ fontSize: "0.75rem", color: "#fca5a5" }}>{recommendationError}</p>
                  <button onClick={() => fetchRecommendations()} className="jin-btn jin-ghost" style={{ margin: "10px auto 0", height: 34 }}>Retry</button>
                </div>
              ) : aiRecommendations.length === 0 ? (
                <div className="jglass" style={{ padding: "2rem", textAlign: "center" }}>
                  <Sparkles style={{ width: 32, height: 32, color: "#818cf8", margin: "0 auto 12px" }} />
                  <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "white" }}>Unlock AI Suggestions</p>
                  <p style={{ fontSize: "0.7rem", color: "#6b7280", margin: "6px 0 14px", lineHeight: 1.6 }}>Jobs tailored to your resume & skills.</p>
                  <button onClick={() => fetchRecommendations()} className="jin-btn jin-primary" style={{ margin: "0 auto", height: 38 }}>Generate AI Suggestions</button>
                </div>
              ) : (
                aiRecommendations.map((rec, idx) => {
                  const recId = `rec-${rec.company.replace(/\s+/g, "-")}-${rec.title.replace(/\s+/g, "-")}`;
                  const isSelected = selectedJob?.id === recId;
                  const isSaved = savedIds.has(recId);
                  const sc = rec.matchScore >= 80 ? "#34d399" : rec.matchScore >= 60 ? "#fbbf24" : "#f87171";
                  const colors = ["from-violet-600 to-indigo-600","from-emerald-500 to-teal-600","from-rose-500 to-pink-600","from-amber-500 to-orange-500","from-sky-500 to-blue-600","from-purple-600 to-fuchsia-600"];
                  const gc = colors[rec.company.split("").reduce((a,c)=>a+c.charCodeAt(0),0)%colors.length];
                  return (
                    <div key={idx} onClick={() => { setSelectedJob({ id: recId, title: rec.title, company: rec.company, location: rec.location, description: rec.description }); setMatchScores(prev => ({ ...prev, [recId]: { score: rec.matchScore, reason: rec.reason } })); }} className={isSelected ? "jcard jcard-sel" : "jcard"}>
                      <div className={`bg-gradient-to-br ${gc}`} style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 900, fontSize: "0.875rem" }}>{rec.company.substring(0,2).toUpperCase()}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                          <span style={{ fontWeight: 700, fontSize: "0.875rem", color: isSelected ? "#a5b4fc" : "#f3f4f6", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{rec.title}</span>
                          {isSaved && <Star style={{ width: 14, height: 14, color: "#fbbf24", fill: "#fbbf24", flexShrink: 0 }} />}
                        </div>
                        <p style={{ fontSize: "0.75rem", color: "#6b7280", margin: "2px 0 4px" }}>{rec.company}</p>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.625rem", color: "#4b5563" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: 2 }}><MapPin style={{ width: 10, height: 10 }} />{rec.location}</span>
                          <span>·</span>
                          <span style={{ fontWeight: 700, padding: "1px 6px", borderRadius: 9999, background: `${sc}18`, color: sc, border: `1px solid ${sc}40` }}>{rec.matchScore}% match</span>
                        </div>
                        {rec.bridgingSkills?.slice(0,3).length > 0 && (
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 6 }}>
                            {rec.bridgingSkills.slice(0,3).map((sk, si) => (
                              <span key={si} style={{ fontSize: "0.6rem", fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "rgba(245,158,11,0.1)", color: "#fbbf24", border: "1px solid rgba(245,158,11,0.2)" }}>{sk}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      {isSelected && <div style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", width: 3, height: 24, background: "#6366f1", borderRadius: 99 }} />}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* RIGHT: Job Detail */}
        <div style={{ position: "sticky", top: "1rem" }}>
          {selectedJob ? (
            <div className="jglass jin" style={{ overflow: "hidden" }}>
              
              {/* Header */}
              <div style={{ padding: "1.5rem", background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.04))", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: "1rem" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                      <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#818cf8", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", padding: "3px 8px", borderRadius: 9999, display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <Building2 style={{ width: 9, height: 9 }} /> Active Role
                      </span>
                      {appliedJobIds.has(selectedJob.id) && <span style={{ fontSize: "0.6rem", fontWeight: 700, color: "#34d399", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", padding: "3px 8px", borderRadius: 9999 }}>Applied ✓</span>}
                    </div>
                    <h2 style={{ fontSize: "1.25rem", fontWeight: 900, color: "white", margin: 0, lineHeight: 1.2 }}>{selectedJob.title}</h2>
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginTop: 6, fontSize: "0.75rem", color: "#6b7280" }}>
                      <span style={{ fontWeight: 700, color: "#d1d5db" }}>{selectedJob.company}</span>
                      <span>·</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}><MapPin style={{ width: 12, height: 12 }} />{selectedJob.location || "Remote"}</span>
                      <span>·</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock style={{ width: 12, height: 12 }} />Posted recently</span>
                    </div>
                  </div>
                  {(() => { const colors = ["from-violet-600 to-indigo-600","from-emerald-500 to-teal-600","from-rose-500 to-pink-600","from-amber-500 to-orange-500","from-sky-500 to-blue-600","from-purple-600 to-fuchsia-600"]; const gc = colors[selectedJob.company.split("").reduce((a,c)=>a+c.charCodeAt(0),0)%colors.length]; return <div className={`bg-gradient-to-br ${gc}`} style={{ width: 52, height: 52, borderRadius: 14, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 900, fontSize: "1rem", boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>{selectedJob.company.substring(0,2).toUpperCase()}</div>; })()}
                </div>

                {/* Actions */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
                  {appliedJobIds.has(selectedJob.id) ? (
                    <button disabled className="jin-btn jin-ghost" style={{ color: "#34d399", cursor: "not-allowed" }}><UserCheck style={{ width: 14, height: 14 }} /> Sent</button>
                  ) : (
                    <button onClick={handleEasyApplyTrigger} className="jin-btn jin-emerald">Easy Apply <ArrowUpRight style={{ width: 14, height: 14 }} /></button>
                  )}
                  <button onClick={() => toggleSave(selectedJob.id)} className="jin-btn jin-ghost" style={{ color: savedIds.has(selectedJob.id) ? "#fbbf24" : "#9ca3af" }}>
                    <Star style={{ width: 14, height: 14, fill: savedIds.has(selectedJob.id) ? "#fbbf24" : "none" }} />{savedIds.has(selectedJob.id) ? "Saved" : "Save"}
                  </button>
                  <button onClick={() => handleMatch(selectedJob.id)} disabled={!resumeText || matchingJobId === selectedJob.id} className="jin-btn jin-ghost" style={{ marginLeft: "auto", color: "#818cf8", opacity: (!resumeText || matchingJobId === selectedJob.id) ? 0.4 : 1, cursor: (!resumeText || matchingJobId === selectedJob.id) ? "not-allowed" : "pointer" }}>
                    <Sparkles style={{ width: 14, height: 14 }} />{matchingJobId === selectedJob.id ? "Analyzing..." : "AI Compat"}
                  </button>
                </div>
              </div>

              {/* Score */}
              {matchScores[selectedJob.id] ? (
                <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.05)" }} className="jin">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: 6 }}>
                      <BarChart2 style={{ width: 13, height: 13 }} /> Compatibility
                    </span>
                    {(() => { const s = matchScores[selectedJob.id].score; const c = s >= 80 ? "#34d399" : s >= 60 ? "#fbbf24" : "#f87171"; return <span style={{ fontWeight: 900, fontSize: "1rem", color: c }}>{s}<span style={{ fontSize: "0.7rem", color: "#4b5563", fontWeight: 400 }}>/100</span></span>; })()}
                  </div>
                  {(() => { const s = matchScores[selectedJob.id].score; const barClass = s >= 80 ? "from-emerald-400 to-emerald-600" : s >= 60 ? "from-amber-400 to-orange-500" : "from-rose-400 to-rose-600"; return <div style={{ height: 6, borderRadius: 9999, background: "rgba(255,255,255,0.06)", overflow: "hidden", marginBottom: 8 }}><div className={`bg-gradient-to-r ${barClass} jin-score`} style={{ height: "100%", borderRadius: 9999, width: `${s}%` }} /></div>; })()}
                  <p style={{ fontSize: "0.75rem", color: "#9ca3af", lineHeight: 1.7 }}>{matchScores[selectedJob.id].reason}</p>
                </div>
              ) : !resumeText ? (
                <div style={{ padding: "0.875rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <AlertCircle style={{ width: 14, height: 14, color: "#4b5563", marginTop: 2, flexShrink: 0 }} />
                  <p style={{ fontSize: "0.7rem", color: "#6b7280", lineHeight: 1.6 }}>Open <strong style={{ color: "#9ca3af" }}>Resume Workspace</strong> above to unlock AI scoring.</p>
                </div>
              ) : null}
              {/* Description */}
              <div style={{ padding: "1.25rem 1.5rem" }}>
                <p style={{ fontSize: "0.65rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Role Details & Expectations</p>
                <div style={{ fontSize: "0.75rem", color: "#d1d5db", whiteSpace: "pre-wrap", lineHeight: 1.85, maxHeight: 440, overflowY: "auto" }} className="jscroll">{selectedJob.description}</div>
              </div>
            </div>
          ) : (
            <div className="jglass" style={{ padding: "4rem", textAlign: "center", minHeight: 400, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <Briefcase style={{ width: 28, height: 28, color: "#4b5563" }} />
              </div>
              <p style={{ fontWeight: 700, fontSize: "0.9rem", color: "#6b7280" }}>Select a Job to View Details</p>
              <p style={{ fontSize: "0.7rem", color: "#4b5563", marginTop: 6, maxWidth: 240, lineHeight: 1.6 }}>Click any listing to read requirements, check AI fit, and apply.</p>
            </div>
          )}
        </div>
      </div>

      {/* EASY APPLY MODAL */}
      {isApplying && selectedJob && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}>
          <div className="jglass jin" style={{ width: "100%", maxWidth: 440, padding: "1.5rem", border: "1px solid rgba(255,255,255,0.12)" }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.25rem" }}>
              <div><h3 style={{ fontWeight: 700, fontSize: "1rem", color: "white", margin: 0 }}>Easy Apply</h3><p style={{ fontSize: "0.7rem", color: "#6b7280", margin: "2px 0 0" }}>Apply to {selectedJob.company} in seconds</p></div>
              <button onClick={() => setIsApplying(false)} style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer" }}><X style={{ width: 18, height: 18 }} /></button>
            </div>

            {applyStep === "confirm" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }} className="jin">
                <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "0.875rem" }}>
                  <p style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6b7280", marginBottom: 6 }}>Contact Information</p>
                  <p style={{ fontWeight: 700, fontSize: "0.875rem", color: "white" }}>Dharsan Deva</p>
                  <p style={{ fontSize: "0.75rem", color: "#9ca3af" }}>dharsandeva2007@gmail.com</p>
                </div>
                <div>
                  <label style={{ fontSize: "0.7rem", fontWeight: 600, color: "#9ca3af", display: "block", marginBottom: 4 }}>Phone (Optional)</label>
                  <input defaultValue="+1 (555) 019-2831" className="jin-input" style={{ width: "100%", height: 36, padding: "0 12px", border: "1px solid rgba(255,255,255,0.1)" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                  <button onClick={() => setIsApplying(false)} className="jin-btn jin-ghost" style={{ height: 36 }}>Cancel</button>
                  <button onClick={() => setApplyStep("resume")} className="jin-btn jin-primary" style={{ height: 36 }}>Next: Resume</button>
                </div>
              </div>
            )}
            {applyStep === "resume" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }} className="jin">
                <p style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Select the resume to share with {selectedJob.company}&apos;s recruiters.</p>
                <div style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 12, padding: "0.875rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <FileText style={{ width: 18, height: 18, color: "#34d399" }} />
                    <div><p style={{ fontWeight: 700, fontSize: "0.8rem", color: "white" }}>Primary_Resume.pdf</p><p style={{ fontSize: "0.65rem", color: "#6b7280", fontFamily: "monospace" }}>142 KB · Updated today</p></div>
                  </div>
                  <CheckCircle style={{ width: 18, height: 18, color: "#34d399" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                  <button onClick={() => setApplyStep("confirm")} className="jin-btn jin-ghost" style={{ height: 36 }}>Back</button>
                  <button onClick={handleEasyApplySubmit} className="jin-btn jin-emerald" style={{ height: 36 }}>Submit Application</button>
                </div>
              </div>
            )}
            {applyStep === "submitting" && (
              <div style={{ padding: "3rem 0", textAlign: "center" }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", border: "4px solid rgba(99,102,241,0.3)", borderTop: "4px solid #6366f1", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
                <p style={{ fontSize: "0.75rem", color: "#6b7280" }}>Packaging credentials securely...</p>
              </div>
            )}
            {applyStep === "success" && (
              <div style={{ padding: "2rem 0", textAlign: "center" }} className="jin">
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(16,185,129,0.12)", border: "2px solid rgba(16,185,129,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", margin: "0 auto 16px" }}>✓</div>
                <h4 style={{ fontWeight: 700, fontSize: "1rem", color: "white" }}>Application Submitted!</h4>
                <p style={{ fontSize: "0.75rem", color: "#9ca3af", margin: "6px 0 20px", lineHeight: 1.6 }}>Delivered to <strong style={{ color: "white" }}>{selectedJob.company}</strong>.</p>
                <button onClick={() => setIsApplying(false)} className="jin-btn jin-primary" style={{ margin: "0 auto", height: 38 }}>Back to Jobs</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* POST JOB MODAL */}
      {isPostingJob && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}>
          <div className="jglass jin" style={{ width: "100%", maxWidth: 520, padding: "1.5rem", border: "1px solid rgba(255,255,255,0.12)" }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.25rem", paddingBottom: "0.75rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div>
                <h3 style={{ fontWeight: 700, fontSize: "0.875rem", color: "white", margin: 0, display: "flex", alignItems: "center", gap: 8 }}><Building2 style={{ width: 15, height: 15, color: "#818cf8" }} /> Publish Job Offer</h3>
                <p style={{ fontSize: "0.65rem", color: "#6b7280", margin: "2px 0 0" }}>Add an open position for AI-powered matching</p>
              </div>
              <button onClick={() => setIsPostingJob(false)} style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer" }}><X style={{ width: 18, height: 18 }} /></button>
            </div>

            {postingSuccess ? (
              <div style={{ padding: "2.5rem 0", textAlign: "center" }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(16,185,129,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem", margin: "0 auto 12px" }}>✓</div>
                <p style={{ fontWeight: 700, fontSize: "0.9rem", color: "white" }}>Job Posted!</p>
                <p style={{ fontSize: "0.7rem", color: "#9ca3af", marginTop: 4 }}>Now active in the search index.</p>
              </div>
            ) : (
              <form onSubmit={handlePostJob} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {postingError && <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0.75rem", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", fontSize: "0.75rem", color: "#fca5a5" }}><AlertCircle style={{ width: 14, height: 14, flexShrink: 0 }} />{postingError}</div>}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div><label style={{ fontSize: "0.65rem", fontWeight: 600, color: "#9ca3af", display: "block", marginBottom: 4 }}>Job Title *</label><input required placeholder="e.g. Senior Frontend Engineer" value={newJobTitle} onChange={e => setNewJobTitle(e.target.value)} className="jin-input" style={{ width: "100%", height: 36, padding: "0 12px", border: "1px solid rgba(255,255,255,0.1)" }} /></div>
                  <div><label style={{ fontSize: "0.65rem", fontWeight: 600, color: "#9ca3af", display: "block", marginBottom: 4 }}>Company *</label><input required placeholder="e.g. Google" value={newJobCompany} onChange={e => setNewJobCompany(e.target.value)} className="jin-input" style={{ width: "100%", height: 36, padding: "0 12px", border: "1px solid rgba(255,255,255,0.1)" }} /></div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div><label style={{ fontSize: "0.65rem", fontWeight: 600, color: "#9ca3af", display: "block", marginBottom: 4 }}>Location</label><input placeholder="e.g. Remote" value={newJobLocation} onChange={e => setNewJobLocation(e.target.value)} className="jin-input" style={{ width: "100%", height: 36, padding: "0 12px", border: "1px solid rgba(255,255,255,0.1)" }} /></div>
                  <div><label style={{ fontSize: "0.65rem", fontWeight: 600, color: "#9ca3af", display: "block", marginBottom: 4 }}>Application URL</label><input placeholder="https://careers.google.com" value={newJobUrl} onChange={e => setNewJobUrl(e.target.value)} className="jin-input" style={{ width: "100%", height: 36, padding: "0 12px", border: "1px solid rgba(255,255,255,0.1)" }} /></div>
                </div>
                <div><label style={{ fontSize: "0.65rem", fontWeight: 600, color: "#9ca3af", display: "block", marginBottom: 4 }}>Description *</label><textarea required rows={5} placeholder="Describe duties, tech stacks, experience required..." value={newJobDescription} onChange={e => setNewJobDescription(e.target.value)} style={{ width: "100%", padding: "0.625rem 0.75rem", fontSize: "0.75rem", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.75rem", color: "#d1d5db", outline: "none", resize: "none" }} /></div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <button type="button" onClick={() => setIsPostingJob(false)} className="jin-btn jin-ghost" style={{ height: 36 }}>Cancel</button>
                  <button type="submit" className="jin-btn jin-primary" style={{ height: 36 }}>Publish Position</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      </div>
    </div>
  );
}
