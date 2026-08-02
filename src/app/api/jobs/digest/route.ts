import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { askAI } from "@/lib/ai";

const SYSTEM_PROMPT = `You write a short, friendly weekly job digest email body (plain text, under
200 words) summarizing the jobs listed below for the candidate. Mention 3-5 of the strongest matches
by title and company, and why they're worth a look, based on the candidate's saved/skills context if
given. No subject line, no sign-off.`;

// Phase 3: Weekly Digest — generated on demand from jobs posted in the last 7 days.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentJobs = await prisma.job.findMany({
    where: { postedAt: { gte: since } },
    orderBy: { postedAt: "desc" },
    take: 20
  });

  if (recentJobs.length === 0) {
    return NextResponse.json({ digest: "No new jobs posted in the last 7 days." });
  }

  const jobList = recentJobs.map((j) => `${j.title} at ${j.company} (${j.location || "remote/unspecified"})`).join("\n");
  const digest = await askAI(SYSTEM_PROMPT, `This week's new jobs:\n${jobList}`);

  return NextResponse.json({ digest, jobCount: recentJobs.length });
}

