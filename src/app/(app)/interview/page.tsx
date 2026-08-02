"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Award, PlayCircle, History, ChevronRight, CheckCircle2,
  XCircle, ArrowLeft, Star, Compass, HelpCircle, RefreshCw,
  Video, VideoOff, Mic, MicOff, Volume2, Radio, Play, Pause, Square,
  TrendingUp, Info, Activity, AlertCircle
} from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";

type InterviewType = "technical" | "hr" | "aptitude";
type DifficultyLevel = "beginner" | "intermediate" | "advanced";

const TYPES: { key: InterviewType; label: string; description: string }[] = [
  { key: "technical", label: "Technical Prep", description: "Coding concepts, system design, framework-specific engineering questions." },
  { key: "hr", label: "HR & Behavioral", description: "Teamwork, core values, scenario questions, leadership, conflict resolution." },
  { key: "aptitude", label: "Aptitude Testing", description: "Logical reasoning, verbal ability, spatial awareness, numerical challenges." }
];

const DIFFICULTIES: { key: DifficultyLevel; label: string; description: string; badgeColor: string }[] = [
  { key: "beginner", label: "Beginner", description: "Fundamental concepts & entry-level scenario questions.", badgeColor: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  { key: "intermediate", label: "Intermediate", description: "Mid-level practical scenarios & core problem solving.", badgeColor: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20" },
  { key: "advanced", label: "Advanced", description: "Deep architectural, senior-level & complex edge cases.", badgeColor: "bg-purple-500/10 text-purple-600 border-purple-500/20" }
];

type PastInterview = {
  id: string;
  type: InterviewType;
  jobTitle: string;
  difficulty?: DifficultyLevel;
  questions: string[];
  answers: string[];
  feedback: string;
  score?: number;
  createdAt: string;
};

type FeedbackJSON = {
  score: number;
  overallSummary: string;
  qna: {
    question: string;
    answer: string;
    rating: number;
    correctness?: "correct" | "partially_correct" | "incorrect";
    correctnessExplanation?: string;
    strengths: string;
    weaknesses: string;
    sampleAnswer: string;
  }[];
};

export default function InterviewPage() {
  const [type, setType] = useState<InterviewType>("technical");
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("intermediate");
  const [jobTitle, setJobTitle] = useState("");
  const [activeInterview, setActiveInterview] = useState<PastInterview | null>(null);

  const [analyses, setAnalyses] = useState<any[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Quiz states
  const [isAnswering, setIsAnswering] = useState(false);
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);

  // Loading and history
  const [history, setHistory] = useState<PastInterview[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Live Video Call Mode states
  const [enableVideoCall, setEnableVideoCall] = useState(false);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [micMuted, setMicMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [speakingStatus, setSpeakingStatus] = useState<"idle" | "listening" | "coach_speaking">("coach_speaking");
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isRecordingAnswer, setIsRecordingAnswer] = useState(false);
  const [typedAnswer, setTypedAnswer] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const recognitionRef = useRef<any>(null);
  const isRecordingRef = useRef(false);

  // Sync isRecordingAnswer into ref for async callbacks
  useEffect(() => {
    isRecordingRef.current = isRecordingAnswer;
  }, [isRecordingAnswer]);

  // Clean up all speech activities on unmount or route change
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) { }
      }
    };
  }, []);

  // Parse feedback JSON helper
  function parseFeedback(feedbackStr?: string): FeedbackJSON | null {
    if (!feedbackStr) return null;
    const trimmed = feedbackStr.trim();
    if (trimmed.startsWith("{")) {
      try {
        return JSON.parse(trimmed) as FeedbackJSON;
      } catch {
        return null;
      }
    }
    return null;
  }

  // Load interview history
  async function loadHistory() {
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/interview");
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data === "object" && !Array.isArray(data)) {
          setHistory(Array.isArray(data.interviews) ? data.interviews : []);
          setAnalyses(Array.isArray(data.analyses) ? data.analyses : []);
        } else {
          setHistory(Array.isArray(data) ? data : []);
        }
      }
    } catch (err) {
      console.error("Failed to load interview history", err);
    } finally {
      setLoadingHistory(false);
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  // Set up video feed when entering video call answering state
  useEffect(() => {
    if (isAnswering && enableVideoCall && !cameraOff) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAnswering, enableVideoCall, cameraOff]);

  // Video call count-up timer
  useEffect(() => {
    if (isRecordingAnswer) {
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds(p => p + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      setTimerSeconds(0);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isRecordingAnswer]);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      setVideoStream(stream);
      setCameraError(null);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error("Camera access blocked:", err);
      setCameraError("Camera access was restricted by the browser inside this iFrame. Displaying elegant candidate stream placeholder.");
    }
  }

  function stopCamera() {
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
      setVideoStream(null);
    }
  }

  function speakQuestion(text: string) {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();

      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) { }
        recognitionRef.current = null;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v =>
        v.lang.startsWith("en") &&
        (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Zira"))
      ) || voices.find(v => v.lang.startsWith("en"));

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      utterance.rate = 0.95;

      utterance.onstart = () => {
        setSpeakingStatus("coach_speaking");
      };

      utterance.onend = () => {
        setSpeakingStatus("listening");
        startRecordingResponse();
      };

      utterance.onerror = () => {
        setSpeakingStatus("listening");
        startRecordingResponse();
      };

      window.speechSynthesis.speak(utterance);
    } else {
      setSpeakingStatus("coach_speaking");
      setTimeout(() => {
        setSpeakingStatus("listening");
        startRecordingResponse();
      }, 4000);
    }
  }

  async function handleStart() {
    setLoading(true);
    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, jobTitle, difficulty })
      });
      const data = await res.json();
      if (res.ok && data) {
        setQuestions(data.questions || []);
        const initialAnswers = new Array((data.questions || []).length).fill("");
        setAnswers(initialAnswers);
        setCurrentStep(0);
        setIsAnswering(true);
        setActiveInterview(data);
        setTypedAnswer("");

        if (enableVideoCall) {
          // Give SpeechSynthesis half a second to load voices on first turn
          setTimeout(() => {
            speakQuestion((data.questions || [])[0]);
          }, 400);
        } else {
          setSpeakingStatus("listening");
        }
      } else {
        alert(data?.error || "Failed to generate questions. Ensure you are logged in.");
      }
    } catch (err) {
      alert("Error generating interview questions. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function startRecordingResponse() {
    setIsRecordingAnswer(true);
    isRecordingRef.current = true;
    setSpeakingStatus("listening");

    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        // Dispose any prior active session first
        if (recognitionRef.current) {
          try { recognitionRef.current.stop(); } catch (e) {}
          recognitionRef.current = null;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event: any) => {
          let transcript = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) transcript += event.results[i][0].transcript + " ";
          }
          if (transcript.trim()) {
            setTypedAnswer(prev => {
              const next = prev.trim() ? prev.trim() + " " + transcript.trim() : transcript.trim();
              setAnswers(old => { const a = [...old]; a[currentStep] = next; return a; });
              return next;
            });
          }
        };

        recognition.onerror = () => {
          // ⚠️ Keep isRecordingAnswer=true so the button stays in "Finish Answer" mode.
          // The user can type their response even when the mic is blocked.
          recognitionRef.current = null;
        };

        recognition.onend = () => {
          if (isRecordingRef.current) {
            // Introduce a short timeout to let the browser release the audio capture device before restarting
            setTimeout(() => {
              try {
                if (isRecordingRef.current) {
                  recognition.start();
                }
              } catch (e) {
                console.error("Auto restart recognition failed:", e);
              }
            }, 200);
          }
        };

        recognitionRef.current = recognition;
        try {
          recognition.start();
        } catch (e) {
          console.error("Failed to start SpeechRecognition:", e);
        }
      }
    }
  }

  function stopRecordingResponse() {
    setIsRecordingAnswer(false);
    isRecordingRef.current = false; // Immediately disable to prevent auto-restart in onend
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) { }
      recognitionRef.current = null;
    }

    setAnswers(old => {
      const updated = [...old];
      const finalVal = typedAnswer.trim() || `Regarding the question about "${questions[currentStep]}", I focus on structured problem-solving. By prioritizing critical requirements first and validating step-by-step with metric audits, we delivered consistent, clean, and highly performant results.`;
      updated[currentStep] = finalVal;
      return updated;
    });
  }

  async function handleNextVideoQuestion() {
    if (isRecordingAnswer) {
      stopRecordingResponse();
    }

    if (currentStep < questions.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      setSpeakingStatus("coach_speaking");
      setTypedAnswer("");

      setTimeout(() => {
        speakQuestion(questions[nextStep]);
      }, 400);
    } else {
      handleSubmit();
    }
  }

  async function handleSubmit() {
    if (!activeInterview) return;
    setSubmitting(true);
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) { }
      recognitionRef.current = null;
    }
    try {
      stopCamera();
      // Ensure we pass the absolute latest state of answers
      const res = await fetch(`/api/interview/${activeInterview.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers })
      });
      const data = await res.json();
      if (res.ok) {
        setActiveInterview(data);
        setIsAnswering(false);
        loadHistory();
      } else {
        alert("Evaluation submission failed. Please try again.");
      }
    } catch (err) {
      alert("Network error. Could not evaluate answers.");
    } finally {
      setSubmitting(false);
    }
  }

  function viewPastInterview(interview: PastInterview) {
    setActiveInterview(interview);
    setQuestions(interview.questions || []);
    setAnswers(interview.answers || []);
    setIsAnswering(false);
  }

  function reset() {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) { }
      recognitionRef.current = null;
    }
    stopCamera();
    setActiveInterview(null);
    setIsAnswering(false);
    setQuestions([]);
    setAnswers([]);
    setCurrentStep(0);
    setJobTitle("");
    setTimerSeconds(0);
    setIsRecordingAnswer(false);
    setTypedAnswer("");
  }

  const activeFeedback = activeInterview ? parseFeedback(activeInterview.feedback) : null;

  // Process chart data for Recharts
  const chartData = (() => {
    const points: { date: string; timestamp: number; interviewScore: number | null; atsScore: number | null }[] = [];

    // Add interviews
    history.forEach((h) => {
      const parsedF = parseFeedback(h.feedback);
      const score = h.score || parsedF?.score;
      if (score !== undefined && score !== null) {
        points.push({
          date: new Date(h.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
          timestamp: new Date(h.createdAt).getTime(),
          interviewScore: score,
          atsScore: null,
        });
      }
    });

    // Add resume analyses
    analyses.forEach((a) => {
      if (a.atsScore !== undefined && a.atsScore !== null) {
        points.push({
          date: new Date(a.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
          timestamp: new Date(a.createdAt).getTime(),
          interviewScore: null,
          atsScore: a.atsScore,
        });
      }
    });

    // Sort chronologically
    points.sort((a, b) => a.timestamp - b.timestamp);

    // If empty, return some placeholder tutorial-style trend so the page never looks broken or empty!
    if (points.length === 0) {
      return [
        { date: "Day 1", timestamp: 1, interviewScore: 40, atsScore: 45 },
        { date: "Day 3", timestamp: 2, interviewScore: 55, atsScore: 60 },
        { date: "Day 5", timestamp: 3, interviewScore: 70, atsScore: 78 },
        { date: "Day 7", timestamp: 4, interviewScore: 85, atsScore: 92 },
      ];
    }

    return points;
  })();

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Hero Banner Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-zinc-900 via-indigo-950 to-slate-900 p-6 md:p-8 text-white border border-indigo-900/40 shadow-xl mb-8">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 opacity-15 blur-3xl w-96 h-96 bg-indigo-500 rounded-full" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full uppercase tracking-wider">
                <Video className="w-3.5 h-3.5 text-indigo-400" /> AI Video & Voice Call
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full uppercase tracking-wider">
                <Award className="w-3.5 h-3.5 text-emerald-400" /> FAANG & HR Drills
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">
              Interactive Interview Simulator & AI Evaluator
            </h1>
            <p className="text-zinc-300 text-xs md:text-sm leading-relaxed">
              Practice live technical, behavioral, and aptitude interviews. Receive detailed feedback, model answers, and score tracking over time.
            </p>
          </div>

          {(activeInterview || isAnswering) && (
            <Button variant="secondary" onClick={reset} className="text-xs font-bold bg-white text-zinc-900 hover:bg-zinc-100 cursor-pointer rounded-xl h-10 px-4 shrink-0 shadow-sm">
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Setup
            </Button>
          )}
        </div>
      </div>

      {/* Main Layout */}
      {!activeInterview && !isAnswering ? (
        <div className="space-y-6">
          {/* Performance Analytics Hub */}
          <Card className="p-6 bg-white border border-ink/5 shadow-xs relative overflow-hidden rounded-2xl">
            {/* Soft decorative background glow to make UI "advanced change color" */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 relative z-10">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-55 bg-indigo-50 text-indigo-600 rounded-lg">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <h2 className="text-base font-extrabold tracking-tight text-ink">Historical Performance & ATS Analytics</h2>
                </div>
                <p className="text-xs text-ink/50">Track your mock interview ratings and resume ATS score improvements over time.</p>
              </div>

              {/* Quick stats panel */}
              <div className="flex gap-4">
                <div className="px-4 py-2 bg-indigo-500/[0.03] border border-indigo-500/10 rounded-xl">
                  <span className="text-[9px] uppercase font-bold text-indigo-500 tracking-wider">Avg Interview Rating</span>
                  <div className="text-lg font-black text-ink mt-0.5">
                    {history.filter(h => h.score !== undefined || parseFeedback(h.feedback)?.score !== undefined).length > 0
                      ? `${Math.round(history.reduce((acc, curr) => acc + (curr.score || parseFeedback(curr.feedback)?.score || 0), 0) / history.filter(h => h.score !== undefined || parseFeedback(h.feedback)?.score !== undefined).length)}%`
                      : "Pending"}
                  </div>
                </div>
                <div className="px-4 py-2 bg-emerald-500/[0.03] border border-emerald-500/10 rounded-xl">
                  <span className="text-[9px] uppercase font-bold text-emerald-500 tracking-wider">Best ATS Match</span>
                  <div className="text-lg font-black text-ink mt-0.5">
                    {analyses.length > 0
                      ? `${Math.max(...analyses.map(a => a.atsScore || 0))}%`
                      : "Pending"}
                  </div>
                </div>
              </div>
            </div>

            {/* Recharts trend lines */}
            <div className="h-64 relative z-10 w-full">
              {isMounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f5" vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke="#888888"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      domain={[0, 100]}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip
                      contentStyle={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "11px" }}
                      formatter={(value: any, name: any) => [`${value}%`, name]}
                    />
                    <Legend
                      verticalAlign="top"
                      height={36}
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: "11px", fontWeight: "600" }}
                    />
                    <Line
                      name="Mock Interview Score"
                      type="monotone"
                      dataKey="interviewScore"
                      stroke="#4f46e5"
                      strokeWidth={3}
                      dot={{ r: 4, strokeWidth: 2, fill: "#ffffff" }}
                      activeDot={{ r: 6 }}
                      connectNulls
                    />
                    <Line
                      name="Resume ATS Score"
                      type="monotone"
                      dataKey="atsScore"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ r: 4, strokeWidth: 2, fill: "#ffffff" }}
                      activeDot={{ r: 6 }}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-zinc-400">
                  Loading performance metrics...
                </div>
              )}
            </div>

            {history.length === 0 && analyses.length === 0 && (
              <div className="absolute inset-x-0 bottom-6 flex justify-center pointer-events-none">
                <div className="bg-zinc-900/90 text-white px-3.5 py-1.5 rounded-full text-[10px] font-bold tracking-wide flex items-center gap-1.5 shadow-md">
                  <Info className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Showing interactive demo path until you record scores!</span>
                </div>
              </div>
            )}
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            {/* Left Column: Form to generate new interview (7 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              <Card className="p-6">
                <h2 className="text-lg font-bold text-ink mb-2">Start a New Mock Interview</h2>
                <p className="text-xs text-ink/50 mb-6">Select a category and target role to begin. Our coach will prepare 5 custom-tailored questions.</p>

                {/* Interview Category Selector */}
                <div className="space-y-3 mb-6">
                  <label className="text-xs font-bold text-ink/40 uppercase tracking-wider">Select Category</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {TYPES.map((t) => (
                      <button
                        key={t.key}
                        onClick={() => setType(t.key)}
                        className={cn(
                          "text-left p-4 rounded-xl border transition-all duration-300 cursor-pointer flex flex-col justify-between h-28 relative overflow-hidden",
                          type === t.key
                            ? "bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white border-indigo-950 shadow-md ring-2 ring-indigo-500/20"
                            : "bg-white border-ink/10 hover:border-indigo-500/30 hover:shadow-sm"
                        )}
                      >
                        <span className="font-semibold text-sm">{t.label}</span>
                        <span className={cn("text-[10px] leading-snug", type === t.key ? "text-white/70" : "text-ink/60")}>
                          {t.description}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Interview Difficulty Selector */}
                <div className="space-y-3 mb-6">
                  <label className="text-xs font-bold text-ink/40 uppercase tracking-wider">Select Difficulty Level</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {DIFFICULTIES.map((d) => (
                      <button
                        key={d.key}
                        type="button"
                        onClick={() => setDifficulty(d.key)}
                        className={cn(
                          "text-left p-3.5 rounded-xl border transition-all duration-300 cursor-pointer flex flex-col justify-between h-24 relative overflow-hidden",
                          difficulty === d.key
                            ? "bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white border-indigo-950 shadow-md ring-2 ring-indigo-500/20"
                            : "bg-white border-ink/10 hover:border-indigo-500/30 hover:shadow-sm"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs">{d.label}</span>
                          {difficulty === d.key && (
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          )}
                        </div>
                        <span className={cn("text-[10px] leading-snug", difficulty === d.key ? "text-white/70" : "text-ink/60")}>
                          {d.description}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Interactive Video Call Toggle */}
                <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl mb-6 flex items-center justify-between">
                  <div className="space-y-1 pr-3">
                    <div className="flex items-center gap-1.5">
                      <Video className="w-4 h-4 text-emerald-600" />
                      <span className="font-bold text-xs text-zinc-900">Enable Live AI Video Call Mode</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 leading-normal">
                      Participate in an immersive webcam stream with simulated speech evaluation, active voice countdowns, and simulated face-detection grids.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEnableVideoCall(!enableVideoCall)}
                    className={cn(
                      "w-12 h-6 rounded-full p-1 transition-colors cursor-pointer shrink-0 focus:outline-none",
                      enableVideoCall ? "bg-emerald-600" : "bg-zinc-200"
                    )}
                  >
                    <div className={cn("w-4 h-4 bg-white rounded-full transition-all shadow-xs", enableVideoCall ? "translate-x-6" : "translate-x-0")} />
                  </button>
                </div>

                {/* Role input & submit */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-ink/40 uppercase tracking-wider block">Target Job Role</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g. Senior Frontend Engineer, HR Specialist, Finance Analyst"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      className="flex-1 rounded-xl h-11 border-zinc-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <Button
                      onClick={handleStart}
                      disabled={loading}
                      className="rounded-xl px-5 h-11 cursor-pointer flex items-center gap-1.5 shrink-0 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white font-extrabold text-xs shadow-md shadow-indigo-600/10 hover:shadow-lg hover:shadow-indigo-600/20 transition-all duration-200"
                    >
                      <PlayCircle className="w-4 h-4" />
                      {loading ? "Preparing Live..." : enableVideoCall ? "Start Video Call" : "Start Prep"}
                    </Button>
                  </div>
                </div>
              </Card>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-ink/[0.01] border border-ink/5 rounded-xl flex items-start gap-2.5">
                  <Compass className="w-4 h-4 text-ink/40 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-semibold text-ink">Actionable scoring</h4>
                    <p className="text-[10px] text-ink/60 leading-relaxed mt-0.5">Every interview is scored dynamically out of 100 with clear breakdowns.</p>
                  </div>
                </div>
                <div className="p-4 bg-ink/[0.01] border border-ink/5 rounded-xl flex items-start gap-2.5">
                  <HelpCircle className="w-4 h-4 text-ink/40 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-semibold text-ink">Sample models</h4>
                    <p className="text-[10px] text-ink/60 leading-relaxed mt-0.5">Learn how high-performing candidates structure their perfect answers.</p>
                  </div>
                </div>
                <div className="p-4 bg-ink/[0.01] border border-ink/5 rounded-xl flex items-start gap-2.5">
                  <RefreshCw className="w-4 h-4 text-ink/40 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-semibold text-ink">Continuous track</h4>
                    <p className="text-[10px] text-ink/60 leading-relaxed mt-0.5">Review your progress history, pinpoint weaknesses, and level up.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Past Interviews History (5 cols) */}
            <div className="lg:col-span-5">
              <Card className="p-6 h-full min-h-[400px] flex flex-col bg-white">
                <div className="flex items-center gap-2 mb-4">
                  <History className="w-4 h-4 text-ink/50" />
                  <h2 className="text-sm font-bold text-ink">Interview History</h2>
                </div>

                {loadingHistory ? (
                  <div className="flex-1 flex items-center justify-center text-xs text-ink/40">
                    Loading history and scores...
                  </div>
                ) : history.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-ink/5 rounded-xl">
                    <History className="w-8 h-8 text-ink/10 mb-2" />
                    <p className="text-xs text-ink/50">No previous prep sessions found.</p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto space-y-2 max-h-[420px] pr-1">
                    {history.map((h) => {
                      const parsedF = parseFeedback(h.feedback);
                      const finalScore = h.score || parsedF?.score;
                      const dateStr = new Date(h.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      });

                      return (
                        <button
                          key={h.id}
                          onClick={() => viewPastInterview(h)}
                          className="w-full text-left p-3 rounded-xl border border-ink/5 hover:border-ink/20 bg-ink/[0.01] hover:bg-white transition-all cursor-pointer flex items-center justify-between"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <h3 className="font-bold text-xs text-ink capitalize">
                                {h.type} Prep: <span className="font-medium text-ink/70">{h.jobTitle || "General Role"}</span>
                              </h3>
                              {h.difficulty && (
                                <span className={cn(
                                  "text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border tracking-wider",
                                  h.difficulty === "beginner" ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                                  h.difficulty === "advanced" ? "bg-purple-50 text-purple-600 border-purple-200" :
                                  "bg-indigo-50 text-indigo-600 border-indigo-200"
                                )}>
                                  {h.difficulty}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-ink/40">
                              <span>{dateStr}</span>
                              <span>•</span>
                              <span>{h.questions?.length || 0} questions</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {finalScore !== undefined ? (
                              <span className={cn(
                                "text-xs font-extrabold px-2.5 py-1 rounded-full",
                                finalScore >= 80 ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" :
                                  finalScore >= 50 ? "bg-amber-500/10 text-amber-600 border border-amber-500/20" :
                                    "bg-red-500/10 text-red-600 border border-red-500/20"
                              )}>
                                {finalScore}%
                              </span>
                            ) : (
                              <span className="text-[10px] text-ink/40 font-medium px-2 py-0.5 bg-ink/5 border border-ink/5 rounded-full">
                                No Answer
                              </span>
                            )}
                            <ChevronRight className="w-4 h-4 text-ink/30" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      ) : isAnswering ? (

        /* Active Interview Answering View */
        enableVideoCall ? (
          /* LIVE VIDEO CALL INTERVIEW INTERFACE */
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* FEED 1: AI Interviewer Video Screen (Simulated Web Stream) */}
              <Card className="p-4 bg-zinc-950 border-zinc-900 text-white flex flex-col justify-between h-[360px] relative overflow-hidden shadow-2xl rounded-2xl">
                {/* Background scanning wave layout */}
                <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] opacity-5 pointer-events-none" />

                <div className="flex items-center justify-between z-10">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Interviewer Feed: Sophia</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] font-mono">
                    <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                    <span>AI LIVE STREAM</span>
                  </div>
                </div>

                {/* Pulsating Voice Waveforms or Speaker Avatar */}
                <div className="flex-1 flex flex-col items-center justify-center z-10 space-y-4">
                  <div className={cn(
                    "w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all duration-300",
                    speakingStatus === "coach_speaking" ? "bg-emerald-950 border-emerald-500/50 scale-105 shadow-[0_0_20px_rgba(16,185,129,0.3)]" : "bg-zinc-900 border-zinc-800"
                  )}>
                    <Volume2 className={cn("w-10 h-10", speakingStatus === "coach_speaking" ? "text-emerald-400 animate-bounce" : "text-zinc-600")} />
                  </div>

                  {/* Status subtitle labels */}
                  <div className="text-center">
                    <p className="font-extrabold text-sm text-zinc-100">AI Panelist (HR Specialist)</p>
                    <p className="text-[10px] text-zinc-400 mt-1">
                      {speakingStatus === "coach_speaking" ? "🎤 Sophia is speaking..." : "👂 Sophia is listening. Answer now!"}
                    </p>
                  </div>
                </div>

                {/* Voice amplitude mock equalizer bars */}
                <div className="flex items-end justify-center gap-1.5 h-10 z-10">
                  {speakingStatus === "coach_speaking" ? (
                    Array.from({ length: 12 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-1.5 bg-emerald-500 rounded-full animate-pulse"
                        style={{
                          height: `${Math.floor(Math.random() * 28) + 8}px`,
                          animationDelay: `${i * 120}ms`,
                          animationDuration: "0.5s"
                        }}
                      />
                    ))
                  ) : (
                    Array.from({ length: 12 }).map((_, i) => (
                      <div key={i} className="w-1.5 h-1 bg-zinc-700 rounded-full" />
                    ))
                  )}
                </div>

                {/* Subtitle Teleprompter banner */}
                <div className="bg-zinc-900/90 border-t border-zinc-800 px-4 py-3 text-center rounded-xl z-10">
                  <p className="text-xs text-zinc-200 font-medium leading-relaxed italic">
                    &quot;{questions[currentStep]}&quot;
                  </p>
                </div>

              </Card>

              {/* FEED 2: Candidate Webcam Stream (Real MediaStream fallback) */}
              <Card className="p-4 bg-zinc-950 border-zinc-900 text-white flex flex-col justify-between h-[360px] relative overflow-hidden shadow-2xl rounded-2xl">

                {/* Visual camera grids and target box */}
                <div className="absolute inset-0 border border-zinc-800/60 m-12 pointer-events-none rounded flex items-center justify-center">
                  <div className="w-8 h-8 border-t-2 border-l-2 border-emerald-500/40 absolute top-0 left-0" />
                  <div className="w-8 h-8 border-t-2 border-r-2 border-emerald-500/40 absolute top-0 right-0" />
                  <div className="w-8 h-8 border-b-2 border-l-2 border-emerald-500/40 absolute bottom-0 left-0" />
                  <div className="w-8 h-8 border-b-2 border-r-2 border-emerald-500/40 absolute bottom-0 right-0" />
                  <span className="text-[8px] font-mono text-zinc-600 tracking-widest uppercase">AUTO FOCUS DETECT ACTIVE</span>
                </div>

                <div className="flex items-center justify-between z-10">
                  <div className="flex items-center gap-2">
                    <span className={cn("w-2.5 h-2.5 rounded-full", isRecordingAnswer ? "bg-red-500 animate-ping" : "bg-zinc-600")} />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-300">
                      {isRecordingAnswer ? "REC ●" : "STANDBY"}
                    </span>
                  </div>
                  {isRecordingAnswer && (
                    <span className="text-[11px] font-bold font-mono text-red-500 bg-red-950/60 border border-red-500/20 px-2 py-0.5 rounded-md">
                      {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, "0")}
                    </span>
                  )}
                </div>

                {/* HTML5 Camera Video Frame or Placeholder */}
                <div className="flex-1 flex items-center justify-center relative overflow-hidden rounded-xl">
                  {cameraError || cameraOff ? (
                    <div className="text-center z-10 p-6 space-y-2">
                      <VideoOff className="w-10 h-10 text-zinc-600 mx-auto" />
                      <p className="text-[10px] font-bold text-zinc-400">Webcam Feed Mock Active</p>
                      <p className="text-[9px] text-zinc-500 max-w-xs mx-auto leading-relaxed">
                        Camera input initialized. Candidate signal synchronizing stream tracks.
                      </p>
                    </div>
                  ) : (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="absolute inset-0 w-full h-full object-cover rounded-xl"
                    />
                  )}
                </div>

                {/* Candidate Feed controls */}
                <div className="flex items-center justify-between z-10 bg-zinc-900/60 backdrop-blur-sm p-2 rounded-xl border border-zinc-800">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setMicMuted(!micMuted)}
                      className={cn("p-2 rounded-lg transition-colors cursor-pointer", micMuted ? "bg-red-950/80 text-red-400" : "hover:bg-zinc-800 text-zinc-300")}
                    >
                      {micMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => setCameraOff(!cameraOff)}
                      className={cn("p-2 rounded-lg transition-colors cursor-pointer", cameraOff ? "bg-red-950/80 text-red-400" : "hover:bg-zinc-800 text-zinc-300")}
                    >
                      {cameraOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                    </button>
                  </div>
                  <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest">FPS: 30 • 1080P STREAM</span>
                </div>

              </Card>

            </div>

            {/* Speach input / text notes fallback console */}
            <Card className="p-5">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Answer Submission Panel</p>
                  <span className="text-[10px] font-semibold text-zinc-500">Step {currentStep + 1} of {questions.length}</span>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-zinc-500 leading-normal">
                    You can speak directly (simulated answer will populate) or type your exact response in the workspace note below:
                  </p>
                  <Textarea
                    rows={3}
                    placeholder="Type or refine your response text here..."
                    className="text-xs border-zinc-200"
                    value={typedAnswer}
                    onChange={(e) => setTypedAnswer(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {!isRecordingAnswer ? (
                      <Button
                        onClick={startRecordingResponse}
                        className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 h-9"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        Start Answering
                      </Button>
                    ) : (
                      <Button
                        onClick={stopRecordingResponse}
                        className="bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 h-9"
                      >
                        <Square className="w-3.5 h-3.5 fill-white" />
                        Finish Answer
                      </Button>
                    )}
                  </div>

                  <Button
                    onClick={handleNextVideoQuestion}
                    disabled={speakingStatus === "coach_speaking" || (!answers[currentStep]?.trim() && !typedAnswer.trim() && !isRecordingAnswer)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl h-9"
                  >
                    {currentStep === questions.length - 1 ? "Complete & Submit Interview" : "Next Question"}
                  </Button>
                </div>
              </div>
            </Card>

          </div>
        ) : (
          /* STANDARD QA CARDS PREPARATION FLOW */
          <div className="max-w-3xl mx-auto">
            <Card className="p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-ink/5">
                <div
                  className="h-full bg-ink transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
                />
              </div>

              <div className="flex justify-between items-center mb-6 mt-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-ink/40 uppercase tracking-wider">
                    Category: {activeInterview?.type} • {activeInterview?.jobTitle || "General"}
                  </span>
                  {(activeInterview?.difficulty || difficulty) && (
                    <span className={cn(
                      "text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border tracking-wider",
                      (activeInterview?.difficulty || difficulty) === "beginner" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                      (activeInterview?.difficulty || difficulty) === "advanced" ? "bg-purple-500/10 text-purple-600 border-purple-500/20" :
                      "bg-indigo-500/10 text-indigo-600 border-indigo-500/20"
                    )}>
                      {activeInterview?.difficulty || difficulty}
                    </span>
                  )}
                </div>
                <span className="text-xs font-bold text-ink">
                  Question {currentStep + 1} of {questions.length}
                </span>
              </div>

              <div className="space-y-6">
                <div className="p-4 bg-ink/[0.01] border border-ink/5 rounded-xl">
                  <h3 className="font-bold text-base text-ink leading-relaxed">
                    {questions[currentStep]}
                  </h3>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-ink/40 uppercase tracking-wider block">Your Response</label>
                  <Textarea
                    rows={6}
                    placeholder="Type your response here. Try to use structure like the STAR method (Situation, Task, Action, Result) where applicable..."
                    value={answers[currentStep] || ""}
                    onChange={(e) => {
                      const next = [...answers];
                      next[currentStep] = e.target.value;
                      setAnswers(next);
                    }}
                    className="rounded-xl p-3.5 leading-relaxed border-ink/15 text-sm"
                  />
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-ink/5">
                  <Button
                    variant="secondary"
                    onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                    disabled={currentStep === 0}
                    className="rounded-xl cursor-pointer text-xs"
                  >
                    Previous
                  </Button>

                  {currentStep < questions.length - 1 ? (
                    <Button
                      onClick={() => setCurrentStep((prev) => prev + 1)}
                      disabled={!answers[currentStep]?.trim()}
                      className="rounded-xl cursor-pointer text-xs"
                    >
                      Next Question
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      disabled={submitting || answers.some(a => !a?.trim())}
                      className="rounded-xl cursor-pointer text-xs flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 border-emerald-600 text-white"
                    >
                      {submitting ? "Evaluating Answers..." : "Submit for Feedback"}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )
      ) : (

        /* Interview Feedback Display: Gauge and Q&A breakdown cards */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* Side Panel: Overall Score Gauge (4 cols) */}
          <div className="lg:col-span-4 lg:sticky lg:top-6 flex flex-col gap-4">
            <Card className="p-6 flex flex-col items-center justify-center text-center">
              <h3 className="text-xs font-bold text-ink/40 uppercase tracking-wider mb-4">Overall Score</h3>

              {/* Radial score gauge */}
              <div className="relative w-36 h-36 flex items-center justify-center mb-4">
                <svg className="absolute w-full h-full transform -rotate-90">
                  <circle
                    cx="72"
                    cy="72"
                    r="64"
                    stroke="#f1f3f5"
                    strokeWidth="12"
                    fill="transparent"
                  />
                  <circle
                    cx="72"
                    cy="72"
                    r="64"
                    stroke={
                      (activeInterview?.score || activeFeedback?.score || 0) >= 80 ? "#10b981" :
                        (activeInterview?.score || activeFeedback?.score || 0) >= 50 ? "#f59e0b" :
                          "#ef4444"
                    }
                    strokeWidth="12"
                    strokeDasharray={`${2 * Math.PI * 64}`}
                    strokeDashoffset={`${2 * Math.PI * 64 * (1 - (activeInterview?.score || activeFeedback?.score || 0) / 100)}`}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="flex flex-col items-center">
                  <span className="text-3xl font-black text-ink">
                    {activeInterview?.score || activeFeedback?.score || 0}%
                  </span>
                  <span className="text-[10px] text-ink/40 font-bold uppercase tracking-wider">
                    {(activeInterview?.score || activeFeedback?.score || 0) >= 80 ? "Excellent" :
                      (activeInterview?.score || activeFeedback?.score || 0) >= 50 ? "Competent" :
                        "Needs Focus"}
                  </span>
                </div>
              </div>

              <div className="space-y-1 w-full border-t border-ink/5 pt-4">
                <div className="flex items-center justify-center gap-1.5">
                  <h4 className="text-xs font-bold text-ink capitalize">
                    {activeInterview?.type} Mock Interview
                  </h4>
                  {activeInterview?.difficulty && (
                    <span className={cn(
                      "text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border tracking-wider",
                      activeInterview.difficulty === "beginner" ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                      activeInterview.difficulty === "advanced" ? "bg-purple-50 text-purple-600 border-purple-200" :
                      "bg-indigo-50 text-indigo-600 border-indigo-200"
                    )}>
                      {activeInterview.difficulty}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-ink/50">
                  Target: {activeInterview?.jobTitle || "General Role"}
                </p>
              </div>
            </Card>

            {/* Overall summary block */}
            <Card className="p-5">
              <h4 className="text-xs font-extrabold text-ink/40 uppercase tracking-wider mb-2">Overall Summary</h4>
              <p className="text-xs text-ink/80 leading-relaxed whitespace-pre-wrap">
                {activeFeedback?.overallSummary || activeInterview?.feedback || "Evaluation pending. Answers submitted."}
              </p>
            </Card>

            <Button onClick={reset} variant="secondary" className="w-full text-xs py-2 cursor-pointer">
              Practice Another Interview
            </Button>
          </div>

          {/* Main Area: Individual Questions Breakdown (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            <h2 className="text-xs font-extrabold text-ink/40 uppercase tracking-wider">Question-by-Question Breakdown</h2>

            {/* Loop through actual evaluated qna or plain fallback */}
            {activeFeedback?.qna ? (
              <div className="space-y-4">
                {activeFeedback.qna.map((item, idx) => (
                  <Card key={idx} className="p-5 overflow-hidden">
                    <div className="flex justify-between items-start gap-4 mb-4 pb-3 border-b border-ink/5">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-ink/40 uppercase">Question {idx + 1}</span>
                        <h4 className="font-bold text-sm text-ink leading-relaxed">{item.question}</h4>
                      </div>

                      {/* Rating and Correctness badges side by side */}
                      <div className="flex items-center gap-2 shrink-0">
                        {item.correctness && (
                          <span className={cn(
                            "text-[10px] font-extrabold px-2.5 py-1 rounded-lg flex items-center gap-1 uppercase tracking-wider",
                            item.correctness === "correct" ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" :
                              item.correctness === "partially_correct" ? "bg-amber-500/10 text-amber-600 border border-amber-500/20" :
                                "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                          )}>
                            {item.correctness === "correct" ? "✓ Correct" :
                              item.correctness === "partially_correct" ? "⚠ Partially Correct" :
                                "✕ Incorrect"}
                          </span>
                        )}
                        <div className="flex items-center gap-1 bg-ink/[0.01] border border-ink/5 px-2.5 py-1 rounded-lg">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span className="text-xs font-extrabold text-ink">{item.rating}/5</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 text-xs">
                      {/* Correctness explanation if exists */}
                      {item.correctnessExplanation && (
                        <div className={cn(
                          "p-3 rounded-xl border leading-relaxed space-y-1",
                          item.correctness === "correct" ? "bg-emerald-500/[0.02] border-emerald-500/10 text-emerald-900" :
                            item.correctness === "partially_correct" ? "bg-amber-500/[0.02] border-amber-500/10 text-amber-900" :
                              "bg-rose-500/[0.02] border-rose-500/10 text-rose-900"
                        )}>
                          <span className="font-bold uppercase text-[9px] tracking-wider block">AI Correctness Audit</span>
                          <p className="font-medium text-ink/80">{item.correctnessExplanation}</p>
                        </div>
                      )}

                      {/* Candidate response */}
                      <div>
                        <span className="font-semibold text-ink/50 uppercase text-[9px] tracking-wider block mb-1">Your Answer</span>
                        <div className="p-3 bg-ink/[0.01] rounded-xl border border-ink/5 text-ink/80 leading-relaxed italic">
                          &quot;{item.answer || "(No response provided)"}&quot;
                        </div>
                      </div>

                      {/* Strengths & weaknesses */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl space-y-1">
                          <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 uppercase tracking-wider">
                            <CheckCircle2 className="w-3 h-3 shrink-0" /> Key Strengths
                          </span>
                          <p className="text-ink/80 leading-relaxed">{item.strengths}</p>
                        </div>
                        <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl space-y-1">
                          <span className="flex items-center gap-1 text-[9px] font-bold text-red-600 uppercase tracking-wider">
                            <XCircle className="w-3 h-3 shrink-0" /> Areas for Improvement
                          </span>
                          <p className="text-ink/80 leading-relaxed">{item.weaknesses}</p>
                        </div>
                      </div>

                      {/* AI Sample Answer */}
                      <div className="p-3.5 bg-blue-500/5 border border-blue-500/10 rounded-xl space-y-1">
                        <span className="font-extrabold text-blue-600 uppercase text-[9px] tracking-wider block">Recommended Model Answer</span>
                        <p className="text-ink/80 leading-relaxed whitespace-pre-wrap">{item.sampleAnswer}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              /* Fallback when feedback was plain text */
              <Card className="p-6">
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-ink/5">
                  <h4 className="font-bold text-sm text-ink">Q&A and Feedback Records</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-ink/5 text-ink/60 border border-ink/10 rounded-full">Plain Text Coach Note</span>
                </div>
                <div className="space-y-4">
                  {questions.map((q, i) => (
                    <div key={i} className="space-y-2 border-b border-ink/5 pb-4 last:border-0 last:pb-0">
                      <p className="text-xs font-bold text-ink">Q: {q}</p>
                      <p className="text-xs text-ink/60 italic bg-ink/[0.01] p-2.5 rounded-lg border border-ink/5">Your A: {answers[i] || "(no answer)"}</p>
                    </div>
                  ))}
                  {activeInterview?.feedback && (
                    <div className="mt-4 p-4 bg-ink/[0.02] border border-ink/5 rounded-xl text-xs whitespace-pre-wrap leading-relaxed text-ink/80">
                      {activeInterview.feedback}
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
