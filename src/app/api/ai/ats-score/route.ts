import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { askAI, cleanAndParseJson } from "@/lib/ai";

const SYSTEM_PROMPT = `You are an ATS (applicant tracking system) simulator. Given a resume and a job
description, score how well the resume would pass an ATS keyword/relevance scan.
You must also provide detailed actionable learning paths, skill improvement tips, job opportunities, and interview preparation advice tailored to this specific job description.

Respond ONLY with valid JSON, no prose, no markdown fences:
{
  "atsScore": 75,
  "matchedKeywords": ["keyword1", "keyword2"],
  "missingKeywords": ["keyword3", "keyword4"],
  "suggestions": ["suggestion1", "suggestion2"],
  "howToLearn": ["concept or skill to master", "another concept"],
  "whereToLearn": [
    { "platform": "Coursera", "url": "https://www.coursera.org" },
    { "platform": "freeCodeCamp", "url": "https://www.freecodecamp.org" },
    { "platform": "Udemy", "url": "https://www.udemy.com" },
    { "platform": "Official Documentation", "url": "https://developer.mozilla.org" }
  ],
  "jobOpportunities": [
    { "role": "Specific Job Title", "demand": "High / Medium / Growing", "salaryRange": "$80,000 - $110,000 /yr" }
  ],
  "skillImprovementTips": [
    "Practical tip to improve skills based on missing keywords",
    "Another actionable skill improvement tip"
  ],
  "top5InterviewTips": [
    { "tip": "Interview Prep Tip Title 1", "description": "Tailored tactical advice on how to handle interview questions for this job description." },
    { "tip": "Interview Prep Tip Title 2", "description": "Tailored tactical advice on how to handle interview questions for this job description." },
    { "tip": "Interview Prep Tip Title 3", "description": "Tailored tactical advice on how to handle interview questions for this job description." },
    { "tip": "Interview Prep Tip Title 4", "description": "Tailored tactical advice on how to handle interview questions for this job description." },
    { "tip": "Interview Prep Tip Title 5", "description": "Tailored tactical advice on how to handle interview questions for this job description." }
  ]
}`;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { resumeId, resumeText, jobDescription } = await req.json();
  if (!resumeText || !jobDescription) {
    return NextResponse.json({ error: "resumeText and jobDescription are required" }, { status: 400 });
  }

  const preferredModel = req.headers.get("x-ai-model") || "gemini-flash";
  const userPrompt = `Resume:\n${resumeText}\n\nJob description:\n${jobDescription}`;

  try {
    const raw = await askAI(SYSTEM_PROMPT, userPrompt, 2500, preferredModel);
    
    // Strip markdown fences
    const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
    const parsed = cleanAndParseJson(cleaned);

    if (resumeId) {
      await prisma.resumeAnalysis.create({
        data: {
          userId: (session.user as any).id,
          resumeId,
          atsScore: parsed.atsScore || 0,
          suggestions: parsed.suggestions || [],
          rawResponse: raw
        }
      });
    }

    return NextResponse.json({ 
      atsScore: parsed.atsScore || 0,
      suggestions: parsed.suggestions || [],
      matchedKeywords: parsed.matchedKeywords || [], 
      missingKeywords: parsed.missingKeywords || [],
      howToLearn: parsed.howToLearn || [],
      whereToLearn: parsed.whereToLearn || [],
      jobOpportunities: parsed.jobOpportunities || [],
      skillImprovementTips: parsed.skillImprovementTips || [],
      top5InterviewTips: parsed.top5InterviewTips || []
    });
  } catch (error) {
    console.error("ATS Score Error:", error);
    return NextResponse.json({ error: "Failed to perform ATS analysis" }, { status: 502 });
  }
}

