import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  FileText,
  Briefcase,
  GraduationCap,
  Award,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  ListTodo
} from "lucide-react";
import { QuickCoachChat } from "@/components/dashboard/quick-coach-chat";
import { PortfolioPdfExport } from "@/components/dashboard/portfolio-pdf-export";
import { CareerRoadmap } from "@/components/dashboard/career-roadmap";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  const userId = user?.id;

  // Fetch real data from the persistent local database
  let resumes: any[] = [];
  let latestAnalysis: any = null;
  let savedJobsCount = 0;
  let skills: any[] = [];
  let interviews: any[] = [];

  if (userId) {
    [resumes, latestAnalysis, savedJobsCount, skills, interviews] = await Promise.all([
      prisma.resume.findMany({ where: { userId }, orderBy: { updatedAt: "desc" } }),
      prisma.resumeAnalysis.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } }),
      prisma.savedJob.count({ where: { userId } }),
      prisma.skillProgress.findMany({ where: { userId } }),
      prisma.mockInterview.findMany({ where: { userId }, orderBy: { createdAt: "desc" } })
    ]);
  }

  const resumeCount = resumes.length;
  const atsScore = latestAnalysis?.atsScore || null;
  const completedSkills = skills.filter((s) => s.status === "done").length;
  const totalSkills = skills.length;
  const interviewCount = interviews.length;

  // Welcome message based on progress
  const userName = user?.name || "there";
  let motivationalHeading = `Welcome back, ${userName}!`;
  let motivationalSub = "Ready to take your next career step? Here is where your resume and prep stand.";

  if (atsScore && atsScore >= 80) {
    motivationalHeading = `Looking sharp, ${userName}!`;
    motivationalSub = `Your latest resume scored an impressive ATS score of ${atsScore}%. You're in a great spot!`;
  } else if (completedSkills > 0 && completedSkills === totalSkills) {
    motivationalHeading = `Outstanding job, ${userName}!`;
    motivationalSub = `You have completed all ${totalSkills} target skills on your learning roadmap! Let's mock interview next.`;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950 to-zinc-950 p-8 text-white border border-emerald-900/40 shadow-xl">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 opacity-10 blur-2xl w-96 h-96 bg-emerald-500 rounded-full" />
        <div className="relative z-10 max-w-2xl space-y-3">
          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full uppercase tracking-wider">
            <Sparkles className="w-3 h-3" /> Career Dashboard
          </span>
          <h1 className="text-3xl font-bold tracking-tight">{motivationalHeading}</h1>
          <p className="text-zinc-300 text-sm leading-relaxed">{motivationalSub}</p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4" id="dashboard-metrics">
        <Card className="p-5 flex items-center justify-between border-ink/10 shadow-sm hover:border-ink/20 transition-all">
          <div className="space-y-1">
            <p className="text-xs text-ink/40 font-medium uppercase tracking-wider">Total Resumes</p>
            <p className="text-3xl font-bold text-ink">{resumeCount}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <FileText className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between border-ink/10 shadow-sm hover:border-ink/20 transition-all">
          <div className="space-y-1">
            <p className="text-xs text-ink/40 font-medium uppercase tracking-wider">Latest ATS Score</p>
            <p className="text-3xl font-bold text-ink">
              {atsScore !== null ? `${atsScore}%` : "—"}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <Award className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between border-ink/10 shadow-sm hover:border-ink/20 transition-all">
          <div className="space-y-1">
            <p className="text-xs text-ink/40 font-medium uppercase tracking-wider">Roadmap Skills</p>
            <p className="text-3xl font-bold text-ink">
              {totalSkills > 0 ? `${completedSkills}/${totalSkills}` : "—"}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <GraduationCap className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between border-ink/10 shadow-sm hover:border-ink/20 transition-all">
          <div className="space-y-1">
            <p className="text-xs text-ink/40 font-medium uppercase tracking-wider">Saved Jobs</p>
            <p className="text-3xl font-bold text-ink">{savedJobsCount}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
            <Briefcase className="w-6 h-6" />
          </div>
        </Card>
      </div>

      {/* Main Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Resume & Target Roadmaps */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Resume & ATS Analysis Card */}
          <Card className="p-6 border-ink/10 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="font-bold text-lg text-ink">Resume Performance</h3>
                <p className="text-xs text-ink/60">Analyze and match your resume against targeted jobs.</p>
              </div>
              <Link href="/resume-builder" className="border border-ink/20 hover:bg-ink/5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center">
                Resume builder <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>

            {resumeCount === 0 ? (
              <div className="border border-dashed border-ink/20 rounded-xl p-8 text-center space-y-3">
                <p className="text-sm text-ink/60">You haven&apos;t built a resume yet. Let&apos;s create your first layout!</p>
                <Link href="/resume-builder" className="bg-ink text-white hover:bg-ink/90 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors inline-flex items-center justify-center">
                  Create Resume
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-ink/5 rounded-xl border border-ink/5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white rounded-lg border border-ink/10">
                      <FileText className="w-5 h-5 text-zinc-700" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{resumes[0].title}</p>
                      <p className="text-xs text-ink/40">
                        Last edited {new Date(resumes[0].updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-ink/40 uppercase font-semibold">Latest ATS rating</p>
                    <p className={`font-bold text-lg ${atsScore && atsScore >= 80 ? "text-emerald-600" : "text-ink"}`}>
                      {atsScore ? `${atsScore}%` : "Not analyzed"}
                    </p>
                  </div>
                </div>

                {latestAnalysis && (
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="p-4.5 border border-emerald-100 bg-emerald-50/40 rounded-xl space-y-1.5">
                      <span className="font-bold uppercase text-[10px] text-emerald-800 tracking-wider">Top Strength</span>
                      <p className="font-medium text-emerald-950">
                        {Array.isArray(latestAnalysis.strengths) ? latestAnalysis.strengths[0] : JSON.parse(latestAnalysis.strengths || "[]")[0] || "Structured content presentation."}
                      </p>
                    </div>
                    <div className="p-4.5 border border-amber-100 bg-amber-50/40 rounded-xl space-y-1.5">
                      <span className="font-bold uppercase text-[10px] text-amber-800 tracking-wider">Key Area of Focus</span>
                      <p className="font-medium text-amber-950">
                        {Array.isArray(latestAnalysis.weaknesses) ? latestAnalysis.weaknesses[0] : JSON.parse(latestAnalysis.weaknesses || "[]")[0] || "Incorporate more impact-driven metrics."}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Skill Roadmaps Tracking */}
          <Card className="p-6 border-ink/10 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="font-bold text-lg text-ink">Skill Target Roadmaps</h3>
                <p className="text-xs text-ink/60">Track your learning roadmaps and technical competencies.</p>
              </div>
              <Link href="/learning" className="border border-ink/20 hover:bg-ink/5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center">
                View roadmap <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>

            {totalSkills === 0 ? (
              <div className="border border-dashed border-ink/20 rounded-xl p-8 text-center space-y-3">
                <p className="text-sm text-ink/60">Generate an AI-powered skill roadmap to track and fill skills gaps!</p>
                <Link href="/learning" className="bg-ink text-white hover:bg-ink/90 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors inline-flex items-center justify-center">
                  Get Roadmap
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>Overall Competency Progress</span>
                    <span>{Math.round((completedSkills / totalSkills) * 100)}%</span>
                  </div>
                  <div className="w-full bg-ink/5 rounded-full h-2 overflow-hidden border border-ink/5">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${(completedSkills / totalSkills) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {skills.slice(0, 6).map((skill, idx) => (
                    <div
                      key={skill.id || idx}
                      className="p-3 border border-ink/10 rounded-xl bg-card hover:shadow-sm transition-all flex items-center justify-between text-xs"
                    >
                      <span className="font-semibold text-ink truncate max-w-[70%]">
                        {skill.skillName}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          skill.status === "done"
                            ? "bg-emerald-100 text-emerald-800"
                            : skill.status === "in_progress"
                            ? "bg-amber-100 text-amber-800 animate-pulse"
                            : "bg-ink/5 text-ink/60"
                        }`}
                      >
                        {skill.status === "done"
                          ? "Done"
                          : skill.status === "in_progress"
                          ? "Learning"
                          : "Todo"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Right column: Export PDF & Quick Chat Widget */}
        <div className="space-y-6">
          
          {/* Portfolio Export card */}
          <Card className="p-6 border-ink/10 bg-gradient-to-br from-zinc-900 to-zinc-950 text-white shadow-md flex flex-col justify-between h-[180px]">
            <div className="space-y-1.5">
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded-full uppercase">
                Export Feature
              </span>
              <h3 className="font-bold text-md text-white">Career Preparation PDF</h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Compile your resumes, roadmap skills, and mock interview grades into a dossier PDF.
              </p>
            </div>
            <PortfolioPdfExport
              userName={user?.name || "Dharsan Deva"}
              userEmail={user?.email || "dharsandeva2007@gmail.com"}
              resumes={resumes}
              skills={skills}
              interviews={interviews}
            />
          </Card>

          {/* Quick Chat Assistant Widget */}
          <QuickCoachChat />

        </div>
      </div>

      {/* Mock Interviews Section */}
      <Card className="p-6 border-ink/10 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="font-bold text-lg text-ink">AI Mock Interviews</h3>
            <p className="text-xs text-ink/60">Review your past prep evaluations and practice responses.</p>
          </div>
          <Link href="/interview" className="border border-ink/20 hover:bg-ink/5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center">
            Mock interview <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        {interviewCount === 0 ? (
          <div className="border border-dashed border-ink/20 rounded-xl p-8 text-center space-y-3">
            <p className="text-sm text-ink/60">No interview sessions practiced yet. Put your skills to the test!</p>
            <Link href="/interview" className="bg-ink text-white hover:bg-ink/90 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors inline-flex items-center justify-center">
              Start Practice Session
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {interviews.slice(0, 2).map((interview, idx) => (
              <div
                key={interview.id || idx}
                className="p-4 border border-ink/10 rounded-xl bg-card hover:border-ink/20 transition-all space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-sm text-ink capitalize">
                      {interview.type} Practice Prep
                    </h4>
                    <p className="text-[10px] text-ink/40 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {new Date(interview.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {interview.feedback ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      Evaluated
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                      Pending review
                    </span>
                  )}
                </div>

                {interview.feedback && (
                  <p className="text-xs text-ink/70 leading-relaxed italic bg-ink/5 p-3 rounded-lg border border-ink/5">
                    &quot;{interview.feedback.length > 180 ? interview.feedback.substring(0, 180) + "..." : interview.feedback}&quot;
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Career Roadmap Timeline */}
      <Card className="p-6 md:p-8 border-ink/10 shadow-sm">
        <CareerRoadmap
          resumes={resumes}
          skills={skills}
          interviews={interviews}
          savedJobsCount={savedJobsCount}
        />
      </Card>
    </div>
  );
}
