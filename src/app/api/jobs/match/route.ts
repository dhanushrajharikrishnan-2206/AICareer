import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { askAI, cleanAndParseJson } from "@/lib/ai";

const SYSTEM_PROMPT = `You are a job-matching engine. Given a resume and a job description, score
how well they match from 0-100 and give a one-sentence reason. Respond ONLY with valid JSON, no
prose, no markdown fences: { "matchScore": 0-100, "reason": "..." }`;

// Phase 3: Job Matching
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { jobId, resumeText } = await req.json();
  if (!jobId || !resumeText) {
    return NextResponse.json({ error: "jobId and resumeText are required" }, { status: 400 });
  }

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  const raw = await askAI(
    SYSTEM_PROMPT,
    `Resume:\n${resumeText}\n\nJob: ${job.title} at ${job.company}\n\nDescription:\n${job.description}`,
    1500,
    "gemini-3.1-flash-lite"
  );

  let parsed;
  try {
    parsed = cleanAndParseJson(raw);
  } catch {
    return NextResponse.json({ error: "Could not parse AI response", raw }, { status: 502 });
  }

  return NextResponse.json({ jobId, matchScore: parsed.matchScore, reason: parsed.reason });
}

