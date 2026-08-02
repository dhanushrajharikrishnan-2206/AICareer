import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { askAI, cleanAndParseJson } from "@/lib/ai";
import { headers } from "next/headers";

const SYSTEM_PROMPT = `You are an automated career matching engine and alert system. Given a list of the candidate's saved skill roadmaps and a list of new job postings, perform a high-quality compatibility check.
Identify which jobs match which of their active skills or learning timeline items, and why.
Generate an encouraging, professional Daily Alert Email (formatted in clean HTML suitable for an inbox).

You MUST respond ONLY with valid JSON in this exact shape, no prose, no markdown fences:
{
  "matchesCount": 0,
  "matches": [
    {
      "jobId": "string",
      "jobTitle": "string",
      "company": "string",
      "location": "string",
      "matchingSkills": ["skill1", "skill2"],
      "whyMatch": "A 1-sentence description linking their saved skill to the job's core stack/duties."
    }
  ],
  "emailSubject": "Daily Skill Alert: [X] new roles found for your roadmap!",
  "emailBodyHtml": "A beautifully styled HTML body with modern inline styling, starting with 'Hi [Name or Candidate],' highlighting the matches and recommending next steps."
}`;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const userName = (session.user as any).name || "dharsandeva2007";

  // 1. Fetch user's saved skills (roadmaps)
  const savedSkills = await prisma.skillProgress.findMany({
    where: { userId }
  });

  if (savedSkills.length === 0) {
    return NextResponse.json({
      success: true,
      message: "No saved skill roadmaps found. Build a career roadmap first to enable daily matches!",
      matchesCount: 0,
      matches: [],
      emailSubject: "Daily Skill Alert: No roadmaps saved yet",
      emailBodyHtml: `<p>Hi ${userName},</p><p>We wanted to send you your daily job matching digest, but it looks like you haven't saved any skill roadmaps yet!</p><p>Head over to the <strong>Skill Roadmaps</strong> page to build your timeline, and we will automatically scour the active listings for jobs matching your competencies daily.</p>`
    });
  }

  // 2. Fetch recent jobs.
  const recentJobs = await prisma.job.findMany({
    orderBy: { postedAt: "desc" },
    take: 10
  });

  if (recentJobs.length === 0) {
    return NextResponse.json({
      success: true,
      message: "No active job postings found in the system database.",
      matchesCount: 0,
      matches: [],
      emailSubject: "Daily Skill Alert: No new postings today",
      emailBodyHtml: `<p>Hi ${userName},</p><p>There are no new job listings in our system today. We'll alert you the moment new roles matching your roadmaps are posted!</p>`
    });
  }

  // 3. Format context for Gemini
  const skillsContext = savedSkills.map(s => `- ${s.skillName} (Status: ${s.status}, Proficiency: ${s.proficiency})`).join("\n");
  const jobsContext = recentJobs.map(j => `- ID: ${j.id}\n  Title: ${j.title}\n  Company: ${j.company}\n  Location: ${j.location || "Remote"}\n  Description: ${j.description.substring(0, 300)}...`).join("\n\n");

  const preferredModel = headers().get("x-ai-model") || "gemini-flash";
  const userPrompt = `Candidate Name: ${userName}

My Saved Skill Roadmaps:
${skillsContext}

Active Job Postings:
${jobsContext}`;

  try {
    const raw = await askAI(SYSTEM_PROMPT, userPrompt, 2500, preferredModel);
    const parsed = cleanAndParseJson(raw);

    return NextResponse.json({
      success: true,
      ...parsed,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Daily Digest AI Error:", error);
    return NextResponse.json({ error: "Failed to generate daily digest" }, { status: 502 });
  }
}

