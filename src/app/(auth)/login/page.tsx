"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import {
  Sparkles,
  Eye,
  EyeOff,
  TrendingUp,
  Award,
  CheckCircle2,
  GraduationCap,
  MessageSquare,
  ShieldCheck,
  ChevronRight,
  ArrowRight
} from "lucide-react";

const showcaseSteps = [
  {
    title: "AI ATS Optimization",
    desc: "Instantly score your resume against real jobs and identify critical keyword gaps.",
    metric: "94%",
    metricLabel: "Average Match Score Improvement",
    icon: TrendingUp,
    color: "from-emerald-500 to-teal-500"
  },
  {
    title: "Interactive Skill Roadmaps",
    desc: "Receive customized, step-by-step competency curricula to bypass requirements gaps.",
    metric: "12 Days",
    metricLabel: "Average Mastery Cycle",
    icon: GraduationCap,
    color: "from-blue-500 to-indigo-500"
  },
  {
    title: "Real-Time AI Interview Prep",
    desc: "Conduct realistic technical and behavioral chat drills with adaptive coaching tips.",
    metric: "+35%",
    metricLabel: "Higher Callback Rate",
    icon: MessageSquare,
    color: "from-purple-500 to-pink-500"
  }
];

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Showcase state to toggle features automatically on the left pane
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % showcaseSteps.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false
    });

    setLoading(false);

    if (res?.error) {
      setError("Invalid email or password. Feel free to use the quick-fill demo account!");
      return;
    }

    router.push("/dashboard");
  }

  // Pre-fill helper for frictionless onboarding in preview
  function handleQuickFillDemo() {
    setForm({
      email: "demo@example.com",
      password: "password123"
    });
    setError("");
  }

  const StepIcon = showcaseSteps[activeStep].icon;

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500 selection:text-black">
      
      {/* LEFT COLUMN: BRAND & SHOWCASE STAGE */}
      <div className="hidden lg:flex lg:col-span-5 relative bg-gradient-to-b from-zinc-900 to-black p-12 flex-col justify-between overflow-hidden border-r border-zinc-800">
        {/* Animated glowing backdrop circles */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px]" />
        
        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Sparkles className="w-5 h-5 text-zinc-950 font-bold" />
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-white block">
              AI RESUME COACH
            </span>
            <span className="text-[10px] uppercase font-bold text-emerald-400/80 tracking-widest block -mt-1">
              Precision Career Suite
            </span>
          </div>
        </div>

        {/* Feature Carousel Section */}
        <div className="relative z-10 space-y-8 my-auto max-w-sm">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              <div className={`p-3.5 rounded-2xl bg-gradient-to-r ${showcaseSteps[activeStep].color} w-fit shadow-md text-zinc-950`}>
                <StepIcon className="w-6 h-6" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight text-white">
                  {showcaseSteps[activeStep].title}
                </h2>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  {showcaseSteps[activeStep].desc}
                </p>
              </div>

              {/* Advanced UI metric snippet */}
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 backdrop-blur-md space-y-1">
                <span className="text-[10px] text-emerald-400 font-bold tracking-wider uppercase">
                  Verified Metric
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white tracking-tight">
                    {showcaseSteps[activeStep].metric}
                  </span>
                  <span className="text-xs text-zinc-400 font-medium">
                    {showcaseSteps[activeStep].metricLabel}
                  </span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Carousel dots indicators */}
          <div className="flex gap-1.5 pt-2">
            {showcaseSteps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveStep(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === activeStep ? "w-8 bg-emerald-500" : "w-1.5 bg-zinc-800 hover:bg-zinc-700"
                }`}
                title={`Show slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Footer info branding */}
        <div className="relative z-10 flex items-center gap-1 text-xs text-zinc-500">
          <ShieldCheck className="w-4 h-4 text-emerald-500/80" />
          <span>Secured, private, and powered by Gemini 2.5</span>
        </div>
      </div>

      {/* RIGHT COLUMN: LOGIN FORM SECTION */}
      <div className="lg:col-span-7 flex flex-col justify-center px-6 md:px-16 py-12 lg:py-24 max-w-2xl mx-auto w-full">
        
        {/* Tiny logo display for mobile */}
        <div className="flex lg:hidden items-center gap-2 mb-8">
          <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-black" />
          </div>
          <span className="font-bold tracking-tight text-white">AI Resume Coach</span>
        </div>

        <div className="space-y-6">
          <div className="space-y-1.5">
            <h1 className="text-3xl font-extrabold tracking-tight text-white bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              Welcome back
            </h1>
            <p className="text-sm text-zinc-400">
              Sign in to manage resumes, check ATS scores, and launch mock interviews.
            </p>
          </div>

          <Card className="bg-zinc-900/60 border border-zinc-850 p-6 md:p-8 rounded-2xl shadow-2xl space-y-6 backdrop-blur-md relative overflow-hidden">
            {/* Top decorative gradient bar */}
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-emerald-500 via-indigo-500 to-emerald-500" />
            
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="name@domain.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  className="bg-zinc-950/80 border-zinc-800 text-sm text-white placeholder-zinc-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl h-11 transition-all"
                />
              </div>

              <div className="space-y-1.5 relative">
                <div className="flex justify-between items-baseline">
                  <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">
                    Password
                  </label>
                  <Link href="/forgot-password" className="text-[10px] font-semibold text-emerald-400 hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    className="bg-zinc-950/80 border-zinc-800 text-sm text-white placeholder-zinc-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl h-11 pr-10 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-950/40 border border-red-800/50 text-red-400 text-xs rounded-xl flex items-start gap-2 animate-shake">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-extrabold transition-all duration-200 text-sm rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/10 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
              >
                {loading ? "Authenticating..." : "Sign In"}
                {!loading && <ChevronRight className="w-4 h-4" />}
              </Button>
            </form>

            {/* Quick Demo Account Section (highly crucial for rapid AI Studio testing) */}
            <div className="pt-4 border-t border-zinc-800/80 space-y-3">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase text-zinc-500">
                <span>AI Studio Sandbox Only</span>
                <span className="text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">Quick Access</span>
              </div>
              <button
                type="button"
                onClick={handleQuickFillDemo}
                className="w-full py-2.5 px-3 bg-zinc-950/80 hover:bg-zinc-950 border border-zinc-800 hover:border-emerald-500/40 rounded-xl text-left text-xs text-zinc-400 hover:text-zinc-200 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <span className="font-semibold block text-zinc-300">Quick-Fill Demo Account</span>
                  <span className="text-[10px] text-zinc-500">demo@example.com / password123</span>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-emerald-400 transition-colors" />
              </button>
            </div>
          </Card>

          <p className="text-center text-xs text-zinc-500">
            Don&apos;t have an account yet?{" "}
            <Link href="/register" className="font-semibold text-emerald-400 hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
