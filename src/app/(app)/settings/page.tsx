import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "@/components/settings/settings-form";
import { Settings, Sparkles } from "lucide-react";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  const user = session.user as any;
  const userId = user?.id;

  // Fetch fresh user data from database to verify accuracy
  let dbUser = null;
  if (userId) {
    dbUser = await prisma.user.findUnique({
      where: { id: userId }
    });
  }

  const initialUser = {
    name: dbUser?.name || user?.name || "",
    email: dbUser?.email || user?.email || ""
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Settings Banner Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950 to-zinc-950 p-8 text-white border border-emerald-900/40 shadow-xl">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 opacity-10 blur-2xl w-96 h-96 bg-emerald-500 rounded-full" />
        <div className="relative z-10 max-w-2xl space-y-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full uppercase tracking-wider">
            <Settings className="w-3.5 h-3.5 animate-spin-slow" /> Preferences & Config
          </span>
          <h1 className="text-3xl font-bold tracking-tight">App Settings</h1>
          <p className="text-zinc-300 text-sm leading-relaxed">
            Personalize your career development suite, tweak the AI coach&apos;s personality traits, and configure your defaults.
          </p>
        </div>
      </div>

      {/* Main Settings Panel */}
      <SettingsForm initialUser={initialUser} />
    </div>
  );
}
