"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  User,
  Settings,
  Sliders,
  Sparkles,
  Trash2,
  Check,
  AlertTriangle,
  RotateCcw,
  BookOpen,
  Monitor,
  Volume2,
  LogOut
} from "lucide-react";

interface UserProfile {
  name: string;
  email: string;
}

export function SettingsForm({ initialUser }: { initialUser: UserProfile }) {
  const router = useRouter();
  
  // Profile state
  const [profile, setProfile] = useState<UserProfile>(initialUser);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState("");

  // AI Preferences state (saved to localStorage for client-side persistence)
  const [coachPersona, setCoachPersona] = useState("structured");
  const [targetDomain, setTargetDomain] = useState("software");
  const [experienceLevel, setExperienceLevel] = useState("mid");
  const [aiModel, setAiModel] = useState("gemini-flash");
  const [prefSuccess, setPrefSuccess] = useState(false);

  // Resume Formatting Defaults state
  const [fontFamily, setFontFamily] = useState("sans");
  const [marginSize, setMarginSize] = useState("normal");

  // Danger Zone state
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      setCoachPersona(localStorage.getItem("pref_coach_persona") || "structured");
      setTargetDomain(localStorage.getItem("pref_target_domain") || "software");
      setExperienceLevel(localStorage.getItem("pref_experience_level") || "mid");
      setAiModel(localStorage.getItem("pref_ai_model") || "gemini-flash");
      setFontFamily(localStorage.getItem("pref_font_family") || "sans");
      setMarginSize(localStorage.getItem("pref_margin_size") || "normal");
    }
  }, []);

  // Save profile changes to the API route (persists to Database)
  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSuccess(false);
    setProfileError("");

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: profile.name, email: profile.email })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save profile.");
      }

      setProfileSuccess(true);
      router.refresh(); // Refresh Next.js server components to sync updated header name
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: any) {
      setProfileError(err.message || "Something went wrong.");
    } finally {
      setProfileSaving(false);
    }
  }

  // Save localized AI Preferences
  function handleSavePreferences() {
    localStorage.setItem("pref_coach_persona", coachPersona);
    localStorage.setItem("pref_target_domain", targetDomain);
    localStorage.setItem("pref_experience_level", experienceLevel);
    localStorage.setItem("pref_ai_model", aiModel);
    localStorage.setItem("pref_font_family", fontFamily);
    localStorage.setItem("pref_margin_size", marginSize);

    setPrefSuccess(true);
    setTimeout(() => setPrefSuccess(false), 3000);
  }

  // Reset sandbox data completely
  async function handleResetData() {
    setResetting(true);
    try {
      const res = await fetch("/api/settings", { method: "DELETE" });
      if (res.ok) {
        setResetSuccess(true);
        setShowConfirmReset(false);
        router.refresh(); // Refresh dashboard metrics to zero
        setTimeout(() => setResetSuccess(false), 4000);
      }
    } catch (e) {
      console.error("Failed to wipe data:", e);
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
      
      {/* Left settings section: Profile & AI parameters */}
      <div className="lg:col-span-8 space-y-6">
        
        {/* Profile Settings */}
        <Card className="p-6 border-ink/10 space-y-5">
          <div className="flex items-center gap-2.5 border-b border-ink/5 pb-3">
            <User className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="font-bold text-base text-ink">Personal Information</h3>
              <p className="text-xs text-ink/40">Modify your account identifier and contact details.</p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-ink/40 tracking-wider">
                  Full Name
                </label>
                <Input
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  placeholder="Your Name"
                  className="text-xs bg-white h-9"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-ink/40 tracking-wider">
                  Email Address
                </label>
                <Input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  placeholder="name@domain.com"
                  className="text-xs bg-white h-9"
                  required
                />
              </div>
            </div>

            {profileError && (
              <p className="text-xs text-red-600 font-medium">{profileError}</p>
            )}

            {profileSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg flex items-center gap-2 text-xs">
                <Check className="w-4 h-4" /> Profile updated successfully in backend database.
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={profileSaving} className="px-4.5 py-2 text-xs">
                {profileSaving ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </form>
        </Card>

        {/* AI Preferences Settings */}
        <Card className="p-6 border-ink/10 space-y-5">
          <div className="flex items-center gap-2.5 border-b border-ink/5 pb-3">
            <Sliders className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="font-bold text-base text-ink">AI Agent Personalization</h3>
              <p className="text-xs text-ink/40">Customize how your career advisor chat and coach evaluations behave.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Preferred Coach Persona */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-ink/40 tracking-wider block">
                Coaching Persona
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "structured", label: "Structured", desc: "Direct feedback" },
                  { value: "encouraging", label: "Supportive", desc: "Warm & positive" },
                  { value: "rigorous", label: "Tough", desc: "Stress drill" }
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setCoachPersona(item.value)}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between h-[75px] transition-all ${
                      coachPersona === item.value
                        ? "border-emerald-600 bg-emerald-50/10 ring-1 ring-emerald-600"
                        : "border-ink/10 hover:border-ink/20"
                    }`}
                  >
                    <span className="text-xs font-bold text-ink block">{item.label}</span>
                    <span className="text-[9px] text-ink/50 leading-tight block">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Target Job Field */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-ink/40 tracking-wider block">
                Primary Job Domain
              </label>
              <select
                value={targetDomain}
                onChange={(e) => setTargetDomain(e.target.value)}
                className="w-full h-9 rounded-lg border border-ink/10 bg-white px-3 text-xs text-ink outline-none focus:border-emerald-500"
              >
                <option value="software">Software Engineering & Tech</option>
                <option value="product">Product Management</option>
                <option value="data">Data Science & Analytics</option>
                <option value="design">UI/UX Product Design</option>
                <option value="marketing">Growth & Tech Marketing</option>
              </select>
              <p className="text-[10px] text-ink/50">Helps refine Gemini AI keyword matching.</p>
            </div>

            {/* Experience Selection */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-ink/40 tracking-wider block">
                Target Level
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { value: "entry", label: "Entry" },
                  { value: "mid", label: "Mid" },
                  { value: "senior", label: "Senior" },
                  { value: "lead", label: "Lead" }
                ].map((lvl) => (
                  <button
                    key={lvl.value}
                    type="button"
                    onClick={() => setExperienceLevel(lvl.value)}
                    className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-all ${
                      experienceLevel === lvl.value
                        ? "bg-emerald-500 border-emerald-500 text-zinc-950 font-bold"
                        : "bg-white border-ink/10 hover:border-ink/20"
                    }`}
                  >
                    {lvl.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Core Model & Multi-Provider */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-ink/40 tracking-wider block">
                Primary AI Provider & Model
              </label>
              <select
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value)}
                className="w-full h-9 rounded-lg border border-ink/10 bg-white px-3 text-xs text-ink outline-none focus:border-emerald-500"
              >
                <option value="gemini-flash">Gemini 2.5 Flash (Default, High Speed)</option>
                <option value="gemini-pro">Gemini 2.5 Pro (Precision & Reasoning)</option>
                <option value="groq-llama">Groq: Llama 3.3 70B (Ultra-low Latency, Precise)</option>
                <option value="groq-mixtral">Groq: Mixtral 8x7B (High-quality Open Model)</option>
                <option value="openrouter-llama">OpenRouter: Llama 3.3 70B (Reliable Orchestration)</option>
                <option value="openrouter-gemini">OpenRouter: Gemini 2.5 Flash</option>
                <option value="huggingface-llama">Hugging Face: Llama 3 8B (Serverless Inference)</option>
              </select>
              <p className="text-[10px] text-ink/50">
                Select your preferred active AI core. If the selected provider&apos;s key is not configured in secrets, the system automatically falls back to any available active key.
              </p>
            </div>
          </div>

          {prefSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg flex items-center gap-2 text-xs">
              <Check className="w-4 h-4" /> AI preferences updated and cached in browser storage.
            </div>
          )}

          <div className="flex justify-end pt-2 border-t border-ink/5">
            <Button onClick={handleSavePreferences} className="px-4.5 py-2 text-xs">
              Save AI Settings
            </Button>
          </div>
        </Card>
      </div>

      {/* Right settings section: formatting defaults and sandbox clear tools */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* Formatting Defaults */}
        <Card className="p-5 border-ink/10 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-ink/5">
            <BookOpen className="w-4.5 h-4.5 text-emerald-600" />
            <h4 className="font-bold text-sm">Resume Presets</h4>
          </div>

          <div className="space-y-3.5">
            <div className="space-y-1.5">
              <label className="text-[9px] uppercase font-bold text-ink/40 tracking-wide block">
                Swiss-A4 Typographic Family
              </label>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="w-full h-8 rounded-md border border-ink/10 bg-white px-2.5 text-xs text-ink outline-none focus:border-emerald-500"
              >
                <option value="sans">Inter (Modern Sans-serif)</option>
                <option value="serif">Playfair Display (Editorial Serif)</option>
                <option value="mono">JetBrains Mono (Technical Mono)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] uppercase font-bold text-ink/40 tracking-wide block">
                Default Layout Margins
              </label>
              <select
                value={marginSize}
                onChange={(e) => setMarginSize(e.target.value)}
                className="w-full h-8 rounded-md border border-ink/10 bg-white px-2.5 text-xs text-ink outline-none focus:border-emerald-500"
              >
                <option value="compact">Compact (Highly Packed)</option>
                <option value="normal">Standard Elegant (1-inch margins)</option>
                <option value="wide">Wide (Spacious Negative Space)</option>
              </select>
            </div>
          </div>

          <Button onClick={handleSavePreferences} variant="secondary" className="w-full py-1.5 h-8 text-[11px]">
            Save formatting presets
          </Button>
        </Card>

        {/* Account Session / Sign Out Section */}
        <Card className="p-5 border-ink/10 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-ink/5">
            <LogOut className="w-4.5 h-4.5 text-zinc-600" />
            <h4 className="font-bold text-sm text-ink">Account Session</h4>
          </div>
          <p className="text-[11px] text-ink/60 leading-normal">
            Sign out of your active session on this device. You will need to re-authenticate with your credentials to access the suite.
          </p>
          <Button
            variant="secondary"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full h-8 text-[11px] font-bold text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 flex items-center justify-center gap-1.5 border border-zinc-200"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </Button>
        </Card>

        {/* Danger Zone: Sandbox Wipe */}
        <Card className="p-5 border-rose-100 bg-rose-50/20 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-rose-100/60">
            <AlertTriangle className="w-4.5 h-4.5 text-rose-600" />
            <h4 className="font-bold text-sm text-rose-900">Danger Zone</h4>
          </div>

          <p className="text-[11px] text-rose-800/80 leading-normal">
            Resetting your account will permanently delete all created resumes, generated cover letters, coach logs, and interview score history. This action cannot be undone.
          </p>

          {resetSuccess && (
            <div className="p-2.5 bg-rose-100 text-rose-800 text-[10px] rounded-lg font-semibold">
              Wiped all sandbox data successfully. Reloading...
            </div>
          )}

          {!showConfirmReset ? (
            <Button
              variant="secondary"
              onClick={() => setShowConfirmReset(true)}
              className="w-full h-8 border-rose-200 text-rose-700 hover:bg-rose-100/50 hover:text-rose-800 text-[11px] font-bold"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Reset Sandbox Data
            </Button>
          ) : (
            <div className="space-y-2 p-3 bg-rose-100/40 rounded-xl border border-rose-100">
              <p className="text-[10px] font-bold text-rose-900">Are you absolutely sure?</p>
              <div className="flex gap-2">
                <Button
                  onClick={handleResetData}
                  disabled={resetting}
                  className="bg-rose-600 hover:bg-rose-700 text-white flex-1 h-8 text-[10px] font-bold"
                >
                  {resetting ? "Resetting..." : "Yes, wipe everything"}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowConfirmReset(false)}
                  className="bg-white border-zinc-200 flex-1 h-8 text-[10px] font-bold"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
