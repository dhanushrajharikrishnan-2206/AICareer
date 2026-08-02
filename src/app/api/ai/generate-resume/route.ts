import { NextRequest, NextResponse } from "next/server";
import { cleanAndParseJson, generateContentWithFallback } from "@/lib/ai";
import { headers } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const { jobDescription, userBackground } = await req.json();
    if (!jobDescription) {
      return NextResponse.json({ error: "Job description is required" }, { status: 400 });
    }

    const prompt = `You are an elite career agent and expert resume writer. Generate a complete, highly tailored professional resume that is perfectly optimized for this job description:
"""
${jobDescription}
"""

${
  userBackground
    ? `Use the following user background or current resume text as the foundation. Maintain their real experience details but optimize descriptions, achievements, and keywords to align precisely with the job description:\n"""\n${userBackground}\n"""`
    : "Since no user background is provided, generate an exceptionally professional, realistic resume from scratch that is perfectly suited for the job description. Create a strong profile with representative industry accomplishments."
}

You must return a valid JSON object matching the following structure, and absolutely nothing else. Return ONLY valid JSON:
{
  "summary": "A high-impact, persuasive, 2-3 sentence professional summary highlighting key relevant expertise.",
  "experience": [
    {
      "title": "Relevant Job Title",
      "company": "Representative Company Name",
      "startDate": "Start year/month",
      "endDate": "End year/month or 'Present'",
      "bullets": [
        "High-impact achievement using active verbs (e.g., Google X-Y-Z formula: Accomplished [X], measured by [Y], by doing [Z]).",
        "Strong bullet aligning with job description requirements and key technical skills."
      ]
    }
  ],
  "education": [
    {
      "school": "University or School Name",
      "degree": "Relevant Degree, e.g. B.S. in Computer Science or Business Administration",
      "year": "Graduation year"
    }
  ],
  "skills": ["Relevant Skill 1", "Relevant Skill 2", "Relevant Skill 3", "Relevant Skill 4"]
}

Ensure there are 2-3 experience blocks, each with 2-3 specific, quantified bullets.
Return ONLY this valid JSON. Do not include markdown brackets around JSON.`;

    let preferredModel: string | undefined = undefined;
    try {
      preferredModel = headers().get("x-ai-model") || undefined;
    } catch (e) {
      // ignore
    }

    const responseText = await generateContentWithFallback({
      systemInstruction: "You are an elite career agent and expert resume writer.",
      messages: [{ role: "user", content: prompt }],
      preferredModel
    });

    try {
      const parsed = cleanAndParseJson(responseText);
      return NextResponse.json({ success: true, data: parsed });
    } catch (e: any) {
      console.error("Failed to parse resume generator JSON:", responseText, e);
      return NextResponse.json({ error: "Failed to generate tailored resume JSON", raw: responseText }, { status: 502 });
    }
  } catch (error: any) {
    console.error("Resume generator error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate resume" }, { status: 500 });
  }
}

