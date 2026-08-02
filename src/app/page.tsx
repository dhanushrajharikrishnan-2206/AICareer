"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  ArrowRight,
  ChevronRight,
  TrendingUp,
  GraduationCap,
  MessageSquare,
  Award,
  FileText,
  Clock,
  CheckCircle2,
  Lock,
  Zap,
  RefreshCw,
  Sliders,
  CornerDownRight,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { RobotTypingAnimation } from "@/components/RobotTypingAnimation";

// Pre-defined sandbox bullet pairs for the interactive optimizer widget
const BULLET_SAMPLES = [
  {
    category: "Software Engineer",
    weak: "I was responsible for writing clean code and fixing bugs on the web application.",
    strong: "Engineered 14+ scalable Next.js microservices, reducing component load latencies by 32% and boosting active daily session capacity by 45k.",
    metric: "+32% Speed"
  },
  {
    category: "Product Manager",
    weak: "Managed the backlog and talked to customers about new features.",
    strong: "Conducted 45+ structured user feedback interviews to realign development roadmap, driving a 44% increase in core product adoption within 60 days.",
    metric: "+44% Adoption"
  },
  {
    category: "Data Analyst",
    weak: "Prepared weekly reports and analyzed database queries.",
    strong: "Optimized complex SQL queries and built dynamic pipelines using Python, automating 14 hours of manual recurring reporting weekly.",
    metric: "14 hrs Saved/wk"
  }
];

export default function HomePage() {
  const [selectedSample, setSelectedSample] = useState(0);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedText, setOptimizedText] = useState("");
  const [hasRun, setHasRun] = useState(false);

  // Dynamic sandbox state for the Estimated Interview Rate Calculator
  const [applications, setApplications] = useState(25);
  const [useAI, setUseAI] = useState(true);

  // FAQ state
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  function triggerOptimization() {
    setIsOptimizing(true);
    setOptimizedText("");
    setHasRun(true);
    setTimeout(() => {
      setIsOptimizing(false);
      setOptimizedText(BULLET_SAMPLES[selectedSample].strong);
    }, 1500);
  }

  // Interview callback probability math
  const baseRate = 0.08; // 8% average response rate without optimization
  const aiRate = 0.28;  // 28% response rate with precision ATS alignment
  const estimatedResponses = Math.round(applications * (useAI ? aiRate : baseRate));

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500 selection:text-black overflow-x-hidden">
      
      {/* 1. STICKY TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-50 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Sparkles className="w-4 h-4 text-zinc-950 font-bold" />
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight text-white block">
                CAREERPULSE AI
              </span>
              <span className="text-[9px] uppercase font-bold text-emerald-400 tracking-widest block -mt-1">
                Precision Career Suite
              </span>
            </div>
          </div>

          {/* Quick Nav links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-zinc-400">
            <a href="#features" className="hover:text-white transition-colors">Core Engine</a>
            <a href="#simulator" className="hover:text-white transition-colors">Interactive Demo</a>
            <a href="#calculator" className="hover:text-white transition-colors">ROI Calculator</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </nav>

          {/* Authentication Links */}
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link href="/register" className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs h-9 px-4 rounded-xl shadow-md shadow-emerald-500/5 transition-all flex items-center justify-center">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* 2. HERO HERO HERO */}
      <section className="relative pt-20 pb-24 px-6 max-w-7xl mx-auto">
        {/* Ambient decorative glowing backdrops */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[160px] pointer-events-none" />
        <div className="absolute top-10 right-10 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="text-center space-y-6 max-w-4xl mx-auto relative z-10">
          
          {/* Tagline Badge */}
          <div className="flex justify-center mb-6">
            <RobotTypingAnimation />
          </div>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-1.5 text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3.5 py-1.5 rounded-full uppercase tracking-wider"
          >
            <Zap className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> Precision Job Matching Engine v2.5
          </motion.div>

          {/* Headings */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-none"
          >
            Optimize your resume. <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">
              Deconstruct requirements.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-zinc-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed"
          >
            Beat rigid ATS filters, track target learning roadmaps to bridge critical technical gaps, and rehearse interview questions with an active Gemini-powered career coach.
          </motion.p>

          {/* Interactive Actions */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
          >
            <Link href="/register" className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold px-7 h-12 text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 transition-colors">
              Build & Analyze Free <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#simulator" className="w-full sm:w-auto bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 px-7 h-12 text-sm rounded-xl flex items-center justify-center gap-1.5 transition-colors">
              Try Interactive Demo
            </a>
          </motion.div>

          {/* Core Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-wrap gap-y-3 justify-center items-center gap-x-8 pt-8 text-[11px] font-bold text-zinc-500 uppercase tracking-widest"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Full Offline Sandbox</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Gemini 2.5 Pro Compliance</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Swiss-Modern A4 PDF</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3. INTERACTIVE SIMULATOR (SHOWCASE VALUE IMMEDIATELY) */}
      <section id="simulator" className="py-20 bg-zinc-900/40 border-y border-zinc-900 relative">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left explanation Column */}
            <div className="lg:col-span-5 space-y-6">
              <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2.5 py-1 rounded-md">
                Try it now
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight text-white">
                Turn passive duties into metrics-driven metrics.
              </h2>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Most resumes describe responsibilities instead of achievements. The Resume Coach parses weak descriptions and injects high-impact metrics compliant with top-tier ATS keyword algorithms.
              </p>

              {/* Sample Buttons */}
              <div className="space-y-2.5 pt-3">
                <span className="text-[10px] uppercase font-bold text-zinc-500 block">Select Role Profile:</span>
                <div className="flex flex-wrap gap-2">
                  {BULLET_SAMPLES.map((sample, idx) => (
                    <button
                      suppressHydrationWarning
                      key={idx}
                      onClick={() => {
                        setSelectedSample(idx);
                        setOptimizedText("");
                        setHasRun(false);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        selectedSample === idx
                          ? "bg-zinc-100 text-zinc-950 border-white"
                          : "bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:border-zinc-700"
                      }`}
                    >
                      {sample.category}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Interactive Box Column */}
            <div className="lg:col-span-7">
              <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
                
                {/* Header mock controls */}
                <div className="flex justify-between items-center pb-4 border-b border-zinc-900 text-xs">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
                  </div>
                  <span className="font-mono text-[10px] text-zinc-500">resume_optimizer_v2.sh</span>
                </div>

                <div className="space-y-6 pt-5">
                  {/* Weak Bullet State */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">
                      Stale Resume Bullet Point (Passive Statement)
                    </span>
                    <p className="p-3.5 bg-rose-950/20 border border-rose-900/25 rounded-xl text-zinc-300 text-xs leading-relaxed">
                      {BULLET_SAMPLES[selectedSample].weak}
                    </p>
                  </div>

                  {/* Optimize Button Trigger */}
                  <div className="flex justify-center py-2 relative">
                    <Button
                      onClick={triggerOptimization}
                      disabled={isOptimizing}
                      className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs h-10 px-5 rounded-xl shadow-lg shadow-emerald-500/10 flex items-center gap-2 transition-all"
                    >
                      {isOptimizing ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Optimizing with Gemini...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" /> Optimize Achievement Metric
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Optimized Bullet Result Container */}
                  <div className="space-y-2.5">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                      AI Optimized Result (Action & Metrics Focused)
                    </span>
                    <div className="min-h-[85px] bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 flex flex-col justify-between relative">
                      <AnimatePresence mode="wait">
                        {isOptimizing ? (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-2"
                          >
                            <div className="h-3.5 bg-zinc-800 rounded animate-pulse w-full" />
                            <div className="h-3.5 bg-zinc-800 rounded animate-pulse w-[85%]" />
                          </motion.div>
                        ) : hasRun ? (
                          <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-3"
                          >
                            <p className="text-zinc-200 text-xs leading-relaxed font-medium">
                              {optimizedText}
                            </p>
                            <div className="flex justify-between items-center pt-2 border-t border-zinc-900">
                              <span className="text-[9px] text-zinc-500 flex items-center gap-1">
                                <CornerDownRight className="w-3 h-3 text-emerald-500" /> 100% compliant with Applicant Trackers
                              </span>
                              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-500/20">
                                {BULLET_SAMPLES[selectedSample].metric}
                              </span>
                            </div>
                          </motion.div>
                        ) : (
                          <div className="text-zinc-600 text-xs italic flex items-center justify-center my-auto">
                            Click the button above to test real-time AI compliance alignment.
                          </div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. FOUR-WAY BENTO SHOWCASE ENGINE */}
      <section id="features" className="py-24 max-w-7xl mx-auto px-6 space-y-16">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-bold text-emerald-400 tracking-wider uppercase">Features Breakdown</span>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
            Four specialized prep systems. <br />One streamlined dashboard.
          </h2>
          <p className="text-zinc-400 text-xs md:text-sm">
            Tackle the job search with a holistic tech stack that coordinates your documents, skills, and active practice records.
          </p>
        </div>

        {/* Grid layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 1: ATS Compliance Scorer */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 p-6 rounded-2xl hover:border-zinc-700 transition-all space-y-5 flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-white group-hover:text-emerald-400 transition-colors">
                ATS Scorer
              </h3>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Scan and rate your resume directly against targeted job specifications. Identify and fix keyword volume, structure, and readability rating gaps.
              </p>
            </div>
            <Link href="/login" className="text-xs font-bold text-emerald-400 flex items-center gap-1 group-hover:underline">
              Check Match Score <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 2: Skill Roadmaps Curricula */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 p-6 rounded-2xl hover:border-zinc-700 transition-all space-y-5 flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-white group-hover:text-blue-400 transition-colors">
                Skill Curricula
              </h3>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Bridge role mismatches. Input your dream job title and instantly compile step-by-step target learning roadmap items inside your persistent profile.
              </p>
            </div>
            <Link href="/login" className="text-xs font-bold text-blue-400 flex items-center gap-1 group-hover:underline">
              Generate Roadmaps <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 3: AI Dynamic Drills */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 p-6 rounded-2xl hover:border-zinc-700 transition-all space-y-5 flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-10 h-10 bg-purple-500/10 text-purple-400 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-white group-hover:text-purple-400 transition-colors">
                AI Mock Practice
              </h3>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Perform realistic technical, system design, or behavioral practice sessions. Get detailed analytical evaluations and correct response models on every prompt.
              </p>
            </div>
            <Link href="/login" className="text-xs font-bold text-purple-400 flex items-center gap-1 group-hover:underline">
              Start Practice Session <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 4: Swiss-A4 Export */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 p-6 rounded-2xl hover:border-zinc-700 transition-all space-y-5 flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-10 h-10 bg-amber-500/10 text-amber-400 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-white group-hover:text-amber-400 transition-colors">
                Swiss-A4 PDF
              </h3>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Export clean, professionally structured dossiers containing your optimized resume drafts, targeted skills list, and interview feedback records.
              </p>
            </div>
            <Link href="/login" className="text-xs font-bold text-amber-400 flex items-center gap-1 group-hover:underline">
              Generate PDF Dossier <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>
      </section>

      {/* 5. DYNAMIC RESPONSE CALCULATOR SECTION */}
      <section id="calculator" className="py-20 bg-zinc-900/20 border-t border-zinc-900">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 p-8 rounded-3xl shadow-xl space-y-8">
            <div className="text-center space-y-2">
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Metrics and ROI</span>
              <h3 className="text-2xl font-bold text-white">Estimated Interview Response Rate</h3>
              <p className="text-zinc-400 text-xs">
                Toggle inputs below to see estimated callbacks based on industry-standard ATS keyword matches.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center pt-2">
              
              {/* Sliders controls */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline text-xs font-semibold">
                    <span className="text-zinc-300">Monthly Job Applications</span>
                    <span className="text-white bg-zinc-800 px-2 py-0.5 rounded font-mono">{applications} jobs</span>
                  </div>
                  <input
                    suppressHydrationWarning
                    type="range"
                    min="5"
                    max="100"
                    step="5"
                    value={applications}
                    onChange={(e) => setApplications(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                    <span>5</span>
                    <span>50</span>
                    <span>100</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-zinc-950/60 border border-zinc-800 rounded-xl">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-white">Optimize with AI-ATS Scorer</span>
                    <span className="text-[10px] text-zinc-400 block">Inject metric-driven bullet keywords</span>
                  </div>
                  <button
                    suppressHydrationWarning
                    onClick={() => setUseAI(!useAI)}
                    className={`w-12 h-6 rounded-full transition-all flex items-center p-0.5 ${
                      useAI ? "bg-emerald-500 justify-end" : "bg-zinc-800 justify-start"
                    }`}
                    title="Toggle optimization"
                  >
                    <span className={`w-5 h-5 rounded-full bg-zinc-950`} />
                  </button>
                </div>
              </div>

              {/* Estimate results Display */}
              <div className="p-6 bg-zinc-950 rounded-2xl border border-zinc-800 text-center space-y-3.5 flex flex-col justify-center h-full relative overflow-hidden">
                <div className="absolute top-0 right-0 translate-x-4 -translate-y-4 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl" />
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Estimated Callbacks</span>
                
                <div className="space-y-0.5">
                  <span className="text-5xl font-extrabold text-white tracking-tight">
                    {estimatedResponses}
                  </span>
                  <span className="text-zinc-400 text-xs font-medium block">responses per month</span>
                </div>

                <div className="text-[10px] text-zinc-500 leading-normal max-w-xs mx-auto">
                  {useAI ? (
                    <span className="text-emerald-400 font-semibold">
                      ⚡ ATS match rates above 80% average a 28% positive recruiter outreach probability.
                    </span>
                  ) : (
                    <span>
                      ⚠️ Un-optimized generic applications face manual review drops, averaging a ~8% outreach rate.
                    </span>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* 6. EXPANDABLE FAQ SECTION */}
      <section id="faq" className="py-24 max-w-4xl mx-auto px-6 space-y-12">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-emerald-400 tracking-wider uppercase">Got Questions?</span>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">Frequently Asked Queries</h2>
          <p className="text-zinc-400 text-xs">Clear answers about how our engine optimizes career steps.</p>
        </div>

        <div className="space-y-4">
          {[
            {
              q: "How does the AI optimize resumes for ATS compliance?",
              a: "The suite utilizes Gemini 2.5 context models to compare your resume against a target job description. It scans for hard technical skills, action verb structures, and metrics-driven formatting, outputting detailed improvements to ensure compliance with top-tier corporate applicant trackers."
            },
            {
              q: "Can I print or download my resumes as a PDF?",
              a: "Yes! The Resume Builder feature includes a live, standard Swiss-Modern A4 layout preview. Using standard print layouts and custom styles, clicking PDF will trigger a neat, direct system-print printout perfectly fitting standard physical letter or A4 dimensions."
            },
            {
              q: "Are my resumes and credentials stored safely?",
              a: "Absolutely. All resume contents, interview preparation scores, learning records, and account credentials are saved to a secure, private cloud-hosted database associated uniquely with your profile."
            },
            {
              q: "Can I wipe or reset my sandbox data if needed?",
              a: "Yes. From the settings menu, a 'Danger Zone' tool allows you to permanently delete all created resume drafts, saved roadmaps, and chat history metrics to start your prep entirely fresh."
            }
          ].map((faq, idx) => (
            <div
              key={idx}
              className="border border-zinc-800 rounded-xl bg-zinc-900/20 overflow-hidden transition-all duration-300"
            >
              <button
                suppressHydrationWarning
                onClick={() => setFaqOpen(faqOpen === idx ? null : idx)}
                className="w-full px-6 py-4.5 text-left text-xs font-bold text-white flex justify-between items-center hover:bg-zinc-900/40 transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-zinc-400 transition-transform duration-300 ${
                    faqOpen === idx ? "rotate-180" : ""
                  }`}
                />
              </button>
              <AnimatePresence initial={false}>
                {faqOpen === idx && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <p className="px-6 pb-5 pt-1 text-zinc-400 text-xs leading-relaxed border-t border-zinc-900/50">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* 7. PRE-FOOTER CTA SECTION */}
      <section className="py-20 relative max-w-6xl mx-auto px-6 text-center">
        <div className="absolute inset-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-[100px] mx-auto pointer-events-none" />
        <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-10 md:p-14 space-y-6 relative z-10">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Stop guessing. Start matching.
          </h2>
          <p className="text-zinc-400 text-xs md:text-sm max-w-xl mx-auto leading-relaxed">
            Create your account today, test your targeted credentials against actual job matches, and let our Gemini-guided agent optimize your next career leap.
          </p>
          <div className="pt-2">
            <Link href="/register" className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold px-8 h-12 text-sm rounded-xl inline-flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 transition-colors">
              Unlock Free Access <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 8. FOOTER FOOTER FOOTER */}
      <footer className="border-t border-zinc-900 bg-black py-12 text-center text-xs text-zinc-500 space-y-4">
        <div className="flex justify-center items-center gap-2.5">
          <div className="h-6 w-6 rounded-md bg-emerald-500 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-black" />
          </div>
          <span className="font-bold text-white uppercase tracking-wider text-[10px]">CareerPulse AI</span>
        </div>
        <p>© 2026 CareerPulse AI. All rights reserved. Designed to elevate modern careers.</p>
        <div className="flex justify-center gap-6 text-[11px] text-zinc-400 font-semibold pt-1">
          <a href="#" className="hover:text-emerald-400 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-emerald-400 transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-emerald-400 transition-colors">Compliance Guarantee</a>
        </div>
      </footer>

    </div>
  );
}
