"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { motion } from "motion/react";
import Link from "next/link";
import {
  Sparkles,
  Eye,
  EyeOff,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  CheckCircle2
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      setLoading(false);

      if (!res.ok) {
        let errMsg = "Something went wrong.";
        try {
          const data = await res.json();
          errMsg = data.error || errMsg;
        } catch {
          // ignore parsing error
        }
        setError(errMsg);
        return;
      }

      router.push("/login");
    } catch (err) {
      setLoading(false);
      setError("Network or system error. Please try again.");
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500 selection:text-black">
      
      {/* LEFT COLUMN: BRAND & VALUE PROP */}
      <div className="hidden lg:flex lg:col-span-5 relative bg-gradient-to-b from-zinc-900 to-black p-12 flex-col justify-between overflow-hidden border-r border-zinc-800">
        {/* Animated glowing backdrop circles */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px]" />
        
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

        {/* Benefits list */}
        <div className="relative z-10 space-y-6 my-auto max-w-sm">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 px-3 py-1 rounded-full uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Start Free Today
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-white leading-tight">
            Unlock your full professional potential.
          </h2>
          <p className="text-zinc-400 text-sm">
            Create an account to gain full access to state-of-the-art career preparation features:
          </p>
          
          <ul className="space-y-4 pt-2 text-zinc-300 text-xs">
            <li className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3 h-3" />
              </div>
              <span>Custom real-time Swiss-Modern Resume builders</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3 h-3" />
              </div>
              <span>Deep-dive ATS analysis & cover letter generation</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3 h-3" />
              </div>
              <span>Interactive technical & HR interview practices</span>
            </li>
          </ul>
        </div>

        {/* Footer info branding */}
        <div className="relative z-10 flex items-center gap-1 text-xs text-zinc-500">
          <ShieldCheck className="w-4 h-4 text-emerald-500/80" />
          <span>Secured, private, and powered by Gemini 2.5</span>
        </div>
      </div>

      {/* RIGHT COLUMN: REGISTER FORM SECTION */}
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
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Create your account
            </h1>
            <p className="text-sm text-zinc-400">
              Set up your profile to optimize your application process.
            </p>
          </div>

          <Card className="bg-zinc-900 border-zinc-800 p-6 md:p-8 rounded-2xl shadow-xl">
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">
                  Full Name
                </label>
                <Input
                  type="text"
                  placeholder="Your Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="bg-zinc-950 border-zinc-800 text-sm text-white placeholder-zinc-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl h-11"
                />
              </div>

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
                  className="bg-zinc-950 border-zinc-800 text-sm text-white placeholder-zinc-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl h-11"
                />
              </div>

              <div className="space-y-1.5 relative">
                <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">
                  Password (Min 8 characters)
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    minLength={8}
                    className="bg-zinc-950 border-zinc-800 text-sm text-white placeholder-zinc-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-950/40 border border-red-800/50 text-red-400 text-xs rounded-xl flex items-start gap-2">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold transition-all text-sm rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/10"
              >
                {loading ? "Creating Account..." : "Create Account"}
                {!loading && <ChevronRight className="w-4 h-4" />}
              </Button>
            </form>
          </Card>

          <p className="text-center text-xs text-zinc-500">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-emerald-400 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
