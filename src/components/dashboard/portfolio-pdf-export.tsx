"use client";

import { useState } from "react";
import { Download, FileText, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadElementAsPdf } from "@/lib/pdf-export";

interface PortfolioPdfExportProps {
  userName: string;
  userEmail: string;
  resumes: any[];
  skills: any[];
  interviews: any[];
}

export function PortfolioPdfExport({
  userName,
  userEmail,
  resumes,
  skills,
  interviews
}: PortfolioPdfExportProps) {
  const [printing, setPrinting] = useState(false);

  async function handleExport() {
    setPrinting(true);
    try {
      const el = document.getElementById("printable-portfolio-page");
      if (el) {
        // Temporarily reveal element for PDF capture
        el.classList.remove("hidden");
        el.classList.add("block");
        await downloadElementAsPdf("printable-portfolio-page", { filename: `Portfolio_${userName || "Candidate"}` });
        el.classList.remove("block");
        el.classList.add("hidden");
      } else {
        window.print();
      }
    } catch (e) {
      console.error(e);
      window.print();
    } finally {
      setPrinting(false);
    }
  }

  // Count skills statuses
  const completedSkills = skills.filter((s) => s.status === "done");
  const inProgressSkills = skills.filter((s) => s.status === "in_progress");

  return (
    <div>
      <Button
        onClick={handleExport}
        disabled={printing}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium shadow-sm transition-all cursor-pointer"
        id="btn-export-portfolio"
      >
        {printing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        {printing ? "Preparing PDF..." : "Export Career Portfolio PDF"}
      </Button>

      {/* Container styled for print & PDF generation */}
      <div id="printable-portfolio-page" className="hidden print:block fixed inset-0 bg-white text-black p-12 overflow-y-auto z-[999999]">
        {/* Document Header */}
        <div className="border-b-2 border-zinc-900 pb-6 mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 uppercase">
              AI Career Prep Portfolio
            </h1>
            <p className="text-sm text-zinc-600">Generated on {new Date().toLocaleDateString()}</p>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-semibold text-zinc-900">{userName || "Candidate Portfolio"}</h2>
            <p className="text-xs text-zinc-600">{userEmail}</p>
          </div>
        </div>

        {/* Section 1: Dashboard Overview */}
        <div className="mb-10">
          <h2 className="text-lg font-bold uppercase tracking-wider text-zinc-800 border-b border-zinc-300 pb-1 mb-4">
            I. Executive Preparation Summary
          </h2>
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="border border-zinc-200 p-4 rounded bg-zinc-50">
              <span className="text-xs text-zinc-500 uppercase font-bold tracking-wide">Resumes</span>
              <p className="text-2xl font-semibold text-zinc-900">{resumes.length}</p>
            </div>
            <div className="border border-zinc-200 p-4 rounded bg-zinc-50">
              <span className="text-xs text-zinc-500 uppercase font-bold tracking-wide">Skills Target</span>
              <p className="text-2xl font-semibold text-zinc-900">{skills.length}</p>
            </div>
            <div className="border border-zinc-200 p-4 rounded bg-zinc-50">
              <span className="text-xs text-zinc-500 uppercase font-bold tracking-wide">Completed</span>
              <p className="text-2xl font-semibold text-zinc-900 text-emerald-700">{completedSkills.length}</p>
            </div>
            <div className="border border-zinc-200 p-4 rounded bg-zinc-50">
              <span className="text-xs text-zinc-500 uppercase font-bold tracking-wide">Interviews</span>
              <p className="text-2xl font-semibold text-zinc-900">{interviews.length}</p>
            </div>
          </div>
        </div>

        {/* Section 2: Resume Content Summary */}
        <div className="mb-10 page-break-inside-avoid">
          <h2 className="text-lg font-bold uppercase tracking-wider text-zinc-800 border-b border-zinc-300 pb-1 mb-4">
            II. Primary Professional Resumes
          </h2>
          {resumes.length === 0 ? (
            <p className="text-sm text-zinc-500 italic">No resume data compiled in system yet.</p>
          ) : (
            <div className="space-y-6">
              {resumes.map((resume, idx) => (
                <div key={resume.id || idx} className="border border-zinc-200 p-5 rounded">
                  <h3 className="text-md font-bold text-zinc-900">{resume.title}</h3>
                  <p className="text-xs text-zinc-500 mb-2">Last Edited: {new Date(resume.updatedAt).toLocaleDateString()}</p>
                  {resume.content?.summary && (
                    <div className="mb-3">
                      <h4 className="text-xs font-bold uppercase text-zinc-600 mb-1">Executive Summary</h4>
                      <p className="text-sm text-zinc-700 leading-relaxed">{resume.content.summary}</p>
                    </div>
                  )}
                  {resume.content?.skills?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold uppercase text-zinc-600 mb-1">Indexed Skills</h4>
                      <div className="flex flex-wrap gap-1">
                        {resume.content.skills.map((skill: string, sIdx: number) => (
                          <span key={sIdx} className="text-xs bg-zinc-100 px-2.5 py-0.5 rounded border border-zinc-200 text-zinc-800">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 3: Skill Roadmap Progression */}
        <div className="mb-10 page-break-inside-avoid">
          <h2 className="text-lg font-bold uppercase tracking-wider text-zinc-800 border-b border-zinc-300 pb-1 mb-4">
            III. Skill Roadmap & Target Competencies
          </h2>
          {skills.length === 0 ? (
            <p className="text-sm text-zinc-500 italic">No technical roadmaps initialized.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-zinc-200 p-4 rounded">
                <h3 className="text-sm font-bold text-zinc-800 uppercase border-b border-zinc-100 pb-1 mb-3 text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Completed Competencies ({completedSkills.length})
                </h3>
                {completedSkills.length === 0 ? (
                  <p className="text-xs text-zinc-400 italic">None logged yet.</p>
                ) : (
                  <ul className="text-xs space-y-1.5 list-disc pl-4 text-zinc-700">
                    {completedSkills.map((s, idx) => (
                      <li key={idx} className="font-medium">{s.skillName}</li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="border border-zinc-200 p-4 rounded">
                <h3 className="text-sm font-bold text-zinc-800 uppercase border-b border-zinc-100 pb-1 mb-3 text-amber-700">
                  ⚡ In-Progress Growth Roadmaps ({inProgressSkills.length})
                </h3>
                {inProgressSkills.length === 0 ? (
                  <p className="text-xs text-zinc-400 italic">None logged yet.</p>
                ) : (
                  <ul className="text-xs space-y-1.5 list-disc pl-4 text-zinc-700">
                    {inProgressSkills.map((s, idx) => (
                      <li key={idx} className="font-medium">{s.skillName}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Section 4: Mock Interview Session History */}
        <div className="mb-10 page-break-inside-avoid">
          <h2 className="text-lg font-bold uppercase tracking-wider text-zinc-800 border-b border-zinc-300 pb-1 mb-4">
            IV. AI Mock Interview & Evaluation Metrics
          </h2>
          {interviews.length === 0 ? (
            <p className="text-sm text-zinc-500 italic">No mock interview sessions completed.</p>
          ) : (
            <div className="space-y-4">
              {interviews.map((interview, idx) => (
                <div key={interview.id || idx} className="border border-zinc-200 p-4 rounded bg-zinc-50/50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-sm font-bold text-zinc-950 uppercase">{interview.type} Interview prep</h3>
                      <p className="text-[11px] text-zinc-500">{new Date(interview.createdAt).toLocaleDateString()}</p>
                    </div>
                    {interview.feedback && (
                      <span className="text-xs font-bold uppercase px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded">
                        Evaluated
                      </span>
                    )}
                  </div>
                  {interview.feedback && (
                    <div className="border-t border-zinc-150 pt-2.5">
                      <h4 className="text-xs font-bold text-zinc-600 mb-1 uppercase">Coach Feedback summary</h4>
                      <p className="text-xs text-zinc-700 leading-relaxed whitespace-pre-wrap">
                        {interview.feedback.length > 300
                          ? interview.feedback.substring(0, 300) + "..."
                          : interview.feedback}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-300 pt-4 mt-12 text-center text-[10px] text-zinc-400 uppercase tracking-widest">
          End of Portfolio Dossier • Powered by AI Resume Coach Workspace
        </div>
      </div>
    </div>
  );
}
