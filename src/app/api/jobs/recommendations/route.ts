import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { askAI, cleanAndParseJson } from "@/lib/ai";

const SYSTEM_PROMPT = `You are a personalized job matching AI. Analyze the candidate's resume summary, target skills, and experience.
Select or generate 3-4 ideal target job recommendations.
Each recommendation MUST contain:
1. "title": Official job title.
2. "company": Highly realistic or actual company name.
3. "location": City, State or "Remote (Worldwide)".
4. "matchScore": A realistic integer score between 75 and 99 reflecting how well their current resume matches this job.
5. "reason": A short 1-sentence explanation of why this matches their specific background.
6. "description": A highly realistic, high-quality, professional 3-paragraph job description detailing duties, required tools, and why it's a great fit for them.
7. "bridgingSkills": A list of 2-3 target skills they should learn to be a 100% perfect fit.

Respond ONLY with a valid JSON array of objects conforming to the above schema. Do not output any markdown code blocks, fences, or text outside of the JSON array.
Format:
[
  {
    "title": "...",
    "company": "...",
    "location": "...",
    "matchScore": 88,
    "reason": "...",
    "description": "...",
    "bridgingSkills": ["...", "..."]
  }
]`;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const { model = "gemini-3.1-flash-lite" } = await req.json().catch(() => ({}));

  try {
    // 1. Fetch user's latest resume and skills for personalization
    const [latestResume, skills] = await Promise.all([
      prisma.resume.findFirst({
        where: { userId },
        orderBy: { updatedAt: "desc" }
      }),
      prisma.skillProgress.findMany({
        where: { userId }
      })
    ]);

    // 2. Format profile data
    let profileContext = "No resume built yet.";
    if (latestResume) {
      let contentObj = latestResume.content;
      if (typeof contentObj === "string") {
        try {
          contentObj = JSON.parse(contentObj);
        } catch {
          // Keep as string
        }
      }
      profileContext = `Resume Title: ${latestResume.title}\n`;
      if (typeof contentObj === "object" && contentObj !== null) {
        const anyObj = contentObj as any;
        profileContext += `Summary: ${anyObj.summary || ""}\n`;
        profileContext += `Skills: ${Array.isArray(anyObj.skills) ? anyObj.skills.join(", ") : ""}\n`;
        if (Array.isArray(anyObj.experience)) {
          profileContext += `Experience:\n${anyObj.experience.map((e: any) => `- ${e.role} at ${e.company}: ${e.description || ""}`).join("\n")}\n`;
        }
      } else {
        profileContext += `Content: ${latestResume.content}\n`;
      }
    }

    const skillsContext = skills.map(s => `${s.skillName} (${s.status})`).join(", ") || "No roadmap skills yet.";

    const prompt = `Candidate Profile:\n${profileContext}\n\nRoadmap Skills:\n${skillsContext}\n\nBased on this profile, generate 3 highly targeted job suggestions with matching scores and requirements.`;

    console.log(`[Job Recommendations] Generating suggestions using model: ${model}`);
    const rawAiResponse = await askAI(SYSTEM_PROMPT, prompt, 2500, model);

    let parsedResult;
    try {
      parsedResult = cleanAndParseJson(rawAiResponse);
    } catch (err) {
      console.error("[Job Recommendations] Failed to parse JSON response:", rawAiResponse);
      return NextResponse.json({ error: "Could not parse AI recommendation results." }, { status: 502 });
    }

    if (!Array.isArray(parsedResult)) {
      return NextResponse.json({ error: "Invalid recommendations format from AI." }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      recommendations: parsedResult
    });

  } catch (err: any) {
    console.error("[Job Recommendations] Unexpected error:", err);
    return NextResponse.json({ error: err.message || "An unexpected error occurred while generating recommendations." }, { status: 500 });
  }
}

