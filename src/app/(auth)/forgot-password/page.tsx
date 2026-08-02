"use client";

import { useState } from "react";
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
  ShieldCheck,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Mail,
  KeyRound
} from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "reset" | "success">("email");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState("");

  async function handleCheckEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error || "Failed to find account.");
        return;
      }

      setUserName(data.name || "User");
      setStep("reset");
    } catch (err) {
      setLoading(false);
      setError("Network or system error. Please try again.");
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword })
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error || "Failed to reset password.");
        return;
      }

      setStep("success");
    } catch (err) {
      setLoading(false);
      setError("Network or system error. Please try again.");
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500 selection:text-black">
      
      {/* LEFT COLUMN: BRAND & SECURITY INFO */}
      <div className="hidden lg:flex lg:col-span-5 relative bg-gradient-to-b from-zinc-900 to-black p-12 flex-col justify-between overflow-hidden border-r border-zinc-800">
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

        {/* Dynamic messaging based on active step */}
        <div className="relative z-10 space-y-6 my-auto max-w-sm">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 px-3 py-1 rounded-full uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5" /> Security Center
          </span>
          
          <AnimatePresence mode="wait">
            {step === "email" && (
              <motion.div
                key="email-stage"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-3"
              >
                <h2 className="text-3xl font-bold tracking-tight text-white leading-tight">
                  Recover your account password.
                </h2>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Enter your email address. We will verify your credentials and guide you through updating your security keys securely.
                </p>
              </motion.div>
            )}

            {step === "reset" && (
              <motion.div
                key="reset-stage"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-3"
              >
                <h2 className="text-3xl font-bold tracking-tight text-white leading-tight">
                  Hi {userName}, choose a strong password.
                </h2>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Provide a new password for your account. Ensure it contains at least 8 characters with safe combinations.
                </p>
              </motion.div>
            )}

            {step === "success" && (
              <motion.div
                key="success-stage"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-3"
              >
                <h2 className="text-3xl font-bold tracking-tight text-white leading-tight">
                  Account security keys updated!
                </h2>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Your password has been successfully reset. You can now use your new password to sign into the system.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer info branding */}
        <div className="relative z-10 flex items-center gap-1 text-xs text-zinc-500">
          <ShieldCheck className="w-4 h-4 text-emerald-500/80" />
          <span>Secured, private, and powered by Gemini 2.5</span>
        </div>
      </div>

      {/* RIGHT COLUMN: ACTION PANELS */}
      <div className="lg:col-span-7 flex flex-col justify-center px-6 md:px-16 py-12 lg:py-24 max-w-2xl mx-auto w-full">
        
        {/* Mobile Logo Header */}
        <div className="flex lg:hidden items-center gap-2 mb-8">
          <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-black" />
          </div>
          <span className="font-bold tracking-tight text-white">AI Resume Coach</span>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="text-xs font-semibold text-zinc-500 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to login
            </Link>
          </div>

          <Card className="bg-zinc-900 border-zinc-800 p-6 md:p-8 rounded-2xl shadow-xl">
            <AnimatePresence mode="wait">
              {step === "email" && (
                <motion.div
                  key="email-form"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <h2 className="text-xl font-bold text-white tracking-tight">
                      Reset Password
                    </h2>
                    <p className="text-xs text-zinc-400">
                      We will locate your account profile to initiate the reset sequence.
                    </p>
                  </div>

                  <form onSubmit={handleCheckEmail} className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">
                        Email Address
                      </label>
                      <div className="relative">
                        <Input
                          type="email"
                          placeholder="name@domain.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="bg-zinc-950 border-zinc-800 text-sm text-white placeholder-zinc-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl h-11 pl-10"
                        />
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600 w-4 h-4" />
                      </div>
                    </div>

                    {error && (
                      <div className="p-3 bg-red-950/40 border border-red-800/50 text-red-400 text-xs rounded-xl">
                        ⚠️ {error}
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full h-11 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold transition-all text-sm rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/10"
                    >
                      {loading ? "Searching..." : "Verify Account"}
                      {!loading && <ChevronRight className="w-4 h-4" />}
                    </Button>
                  </form>
                </motion.div>
              )}

              {step === "reset" && (
                <motion.div
                  key="reset-form"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <h2 className="text-xl font-bold text-white tracking-tight">
                      Choose New Password
                    </h2>
                    <p className="text-xs text-zinc-400">
                      Update your account security key for <span className="text-zinc-200 font-semibold">{email}</span>.
                    </p>
                  </div>

                  <form onSubmit={handleResetPassword} className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">
                        New Password
                      </label>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="At least 8 characters"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          className="bg-zinc-950 border-zinc-800 text-sm text-white placeholder-zinc-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl h-11 pl-10 pr-10"
                        />
                        <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600 w-4 h-4" />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Re-enter password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          className="bg-zinc-950 border-zinc-800 text-sm text-white placeholder-zinc-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl h-11 pl-10 pr-10"
                        />
                        <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600 w-4 h-4" />
                      </div>
                    </div>

                    {error && (
                      <div className="p-3 bg-red-950/40 border border-red-800/50 text-red-400 text-xs rounded-xl">
                        ⚠️ {error}
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full h-11 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold transition-all text-sm rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/10"
                    >
                      {loading ? "Resetting Password..." : "Update Security Keys"}
                      {!loading && <ChevronRight className="w-4 h-4" />}
                    </Button>
                  </form>
                </motion.div>
              )}

              {step === "success" && (
                <motion.div
                  key="success-form"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="text-center space-y-6 py-4"
                >
                  <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 animate-bounce" />
                  </div>

                  <div className="space-y-1.5">
                    <h2 className="text-xl font-extrabold text-white tracking-tight">
                      Security Reset Successful
                    </h2>
                    <p className="text-xs text-zinc-400">
                      Your password credentials have been securely updated. You can now log back into the suite.
                    </p>
                  </div>

                  <Button
                    onClick={() => router.push("/login")}
                    className="w-full h-11 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold transition-all text-sm rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/10"
                  >
                    Go to Login Screen
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </div>
      </div>
    </div>
  );
}
