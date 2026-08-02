import { NextRequest, NextResponse } from "next/server";
import { askAI, cleanAndParseJson } from "@/lib/ai";
import { headers } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const { resumeContent } = await req.json();
    if (!resumeContent) {
      return NextResponse.json({ error: "No resume content provided" }, { status: 400 });
    }

    const preferredModel = headers().get("x-ai-model") || "gemini-flash";
    const systemPrompt = `You are an elite executive resume coach and hiring manager. Analyze the following resume content and provide highly detailed, actionable suggestions to make it stand out.

Provide the feedback strictly in the following JSON format:
{
  "summaryCritique": "Clear critique of the professional summary with a proposed rewrite.",
  "bulletImprovements": [
    {
      "original": "A specific bullet point from the resume that is weak or lacks metrics.",
      "improved": "The rewritten bullet point using the Google X-Y-Z formula: Accomplished [X] as measured by [Y], by doing [Z]."
    }
  ],
  "suggestedSkills": ["High-demand technical skills or credentials that would complement this resume."],
  "formatAdvice": "Key tactical advice to improve the formatting, structure, and professional tone."
}

Respond ONLY with valid JSON. Do not write any markdown brackets or conversational wrappers around the JSON.`;

    const userPrompt = `Resume Content:\n${JSON.stringify(resumeContent, null, 2)}`;

    try {
      const responseText = await askAI(systemPrompt, userPrompt, 2500, preferredModel);
      const data = cleanAndParseJson(responseText);
      return NextResponse.json({ success: true, data });
    } catch (e: any) {
      console.error("Failed parsing resume suggestions JSON:", e);
      return NextResponse.json({ error: "Failed to parse AI advice content" }, { status: 502 });
    }
  } catch (error: any) {
    console.error("Resume suggestions error:", error);
    return NextResponse.json({ error: error.message || "Failed to analyze resume" }, { status: 500 });
  }
}

