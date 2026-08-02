import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { askAI, cleanAndParseJson } from "@/lib/ai";

const SYSTEM_PROMPT = `You are an expert AI Trainer. Your goal is to train the user on a specific professional skill by asking them challenging questions and providing feedback on their answers.

Given a skill and the user's answer to your previous question (if provided), or just starting a new topic:
1. If no previous answer: Ask a specific, practical question that assesses the user's understanding of a core concept for the skill.
2. If previous answer provided: Evaluate their answer, provide constructive feedback, and then ask a follow-up or a new challenging question.

Respond ONLY with valid JSON:
{
  "question": "The next question to ask",
  "feedback": "Feedback on their last answer (or empty string if starting)"
}

Do not output any introductory prose, markdown fences (such as \`\`\`json), or conversational dialogue. Respond strictly with raw valid JSON.`;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const preferredModel = req.headers.get("x-ai-model") || "gemini-flash";
  const { skill, previousQuestion, userAnswer } = await req.json();
  if (!skill) return NextResponse.json({ error: "skill is required" }, { status: 400 });

  const prompt = `Skill: ${skill}\n\nPrevious Question: ${previousQuestion || "None"}\n\nUser Answer: ${userAnswer || "None"}`;

  try {
    const raw = await askAI(SYSTEM_PROMPT, prompt, 1500, preferredModel);
    const parsed = cleanAndParseJson(raw);
    return NextResponse.json(parsed);
  } catch (err: any) {
    console.error("Error in AI Trainer:", err);
    return NextResponse.json({ error: "Failed to generate training response." }, { status: 500 });
  }
}

