import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { askAI } from "@/lib/ai";

const SYSTEM_PROMPT = `You are an expert cover letter writer. Write a concise, specific, non-generic
cover letter (under 350 words) based on the candidate's resume and the target job. No placeholders like
[Company Name] — use the actual details given. Return ONLY the letter text.`;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { resumeId, resumeText, jobTitle, company, jobDescription } = await req.json();
  if (!resumeText || !jobTitle || !company) {
    return NextResponse.json({ error: "resumeText, jobTitle and company are required" }, { status: 400 });
  }

  const userPrompt = `Resume:\n${resumeText}\n\nTarget role: ${jobTitle} at ${company}\n\nJob description:\n${jobDescription || "N/A"}`;
  const content = await askAI(SYSTEM_PROMPT, userPrompt);

  const coverLetter = await prisma.coverLetter.create({
    data: {
      userId: (session.user as any).id,
      resumeId,
      jobTitle,
      company,
      content
    }
  });

  return NextResponse.json(coverLetter);
}

