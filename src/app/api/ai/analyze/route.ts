import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { askAI, cleanAndParseJson } from "@/lib/ai";
import { headers } from "next/headers";

const SYSTEM_PROMPT = `You are a professional resume reviewer. Analyze the resume text you're given and
respond ONLY with valid JSON in this exact shape, no prose, no markdown fences:
{
  "strengths": ["..."],
  "weaknesses": ["..."],
  "suggestions": ["..."]
}
Keep each array to 3-5 concise, specific, actionable items.`;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { resumeId, resumeText, jobTitle } = await req.json();
  if (!resumeText) return NextResponse.json({ error: "resumeText is required" }, { status: 400 });

  const preferredModel = headers().get("x-ai-model") || "gemini-flash";
  const userPrompt = jobTitle
    ? `Target role: ${jobTitle}\n\nResume:\n${resumeText}`
    : `Resume:\n${resumeText}`;

  try {
    const raw = await askAI(SYSTEM_PROMPT, userPrompt, 2500, preferredModel);
    const parsed = cleanAndParseJson(raw);

    // If resumeId is not provided, we don't save to the DB but we still return the results!
    if (resumeId) {
      const analysis = await prisma.resumeAnalysis.create({
        data: {
          userId: (session.user as any).id,
          resumeId,
          jobTitle,
          strengths: parsed.strengths || [],
          weaknesses: parsed.weaknesses || [],
          suggestions: parsed.suggestions || [],
          rawResponse: raw
        }
      });
      return NextResponse.json(analysis);
    }

    return NextResponse.json({
      strengths: parsed.strengths || [],
      weaknesses: parsed.weaknesses || [],
      suggestions: parsed.suggestions || []
    });
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return NextResponse.json({ error: "Failed to perform AI analysis" }, { status: 502 });
  }
}

