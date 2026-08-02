import { NextResponse } from "next/server";
import { askAI } from "@/lib/ai";

const SYSTEM_PROMPT = `You are an expert AI Learning & Career Coach. Your goal is to optimize the user's learning roadmap.

Given a list of skills, their status ("not_started", "in_progress", "done"), and proficiency ("Beginner", "Intermediate", "Advanced"), suggest actionable optimizations.

This could include:
1. Reordering skills for better logical flow (e.g., learn SQL before ORM).
2. Suggesting new essential skills for their target role.
3. Suggesting removing obsolete skills.

Respond ONLY with valid JSON:
{
  "optimizations": [
    {
      "type": "reorder" | "add" | "remove",
      "skillName": "name of the skill",
      "reason": "explanation of why",
      "suggestion": "what to do"
    }
  ]
}

Do not output any introductory prose, markdown fences (such as \`\`\`json), or conversational dialogue. Respond strictly with raw valid JSON.`;

export async function POST(req: Request) {
  const { skills } = await req.json();
  if (!skills) return NextResponse.json({ error: "Skills are required" }, { status: 400 });

  const prompt = `Current Skills Roadmap: ${JSON.stringify(skills)}`;

  try {
    const raw = await askAI(SYSTEM_PROMPT, prompt);
    const parsed = JSON.parse(raw);
    return NextResponse.json(parsed);
  } catch (err: any) {
    console.error("Error optimizing roadmap:", err);
    return NextResponse.json({ error: "Failed to optimize roadmap." }, { status: 500 });
  }
}

