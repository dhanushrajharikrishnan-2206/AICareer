import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { askAI, cleanAndParseJson } from "@/lib/ai";
import { headers } from "next/headers";

const SYSTEM_PROMPT = `You are an expert resume writer. Given some resume text and an optional target role and improvement tone, rewrite the text to make it extremely high impact, and explain your changes.
Tones/Styles explained:
- "star": Use the STAR method (Situation, Task, Action, Result). Highlight metrics, quantify results, and start with punchy action verbs. Include blank placeholders like "[X%]" or "[Y amount]" if the input lacks exact numbers, prompting the user to fill them in.
- "executive": Use sophisticated, leadership-oriented vocabulary (e.g., "orchestrated", "championed", "pioneered") emphasizing strategic impact, scale, organizational growth, and cross-functional leadership.
- "technical": Focus on core systems, architectures, frameworks used, and engineering performance improvements. Detail the exact tooling or methodologies.
- "concise": Make the text as brief, tight, and dense as possible, eliminating filler words while retaining maximum impact.

You MUST respond ONLY with valid JSON in this exact shape, no prose, no markdown fences:
{
  "improved": "The fully rewritten resume bullet points or section text...",
  "rationale": "A concise explanation of the changes made (e.g. action verbs added, metrics highlighted, tone adjusted)."
}`;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { text, jobTitle, tone = "star" } = await req.json();
  if (!text) return NextResponse.json({ error: "text is required" }, { status: 400 });

  const preferredModel = headers().get("x-ai-model") || "gemini-flash";
  const userPrompt = `Target role: ${jobTitle || "Not specified"}
Selected Tone/Style: ${tone}

Original Text to improve:
${text}`;

  try {
    const raw = await askAI(SYSTEM_PROMPT, userPrompt, 2500, preferredModel);
    try {
      const parsed = cleanAndParseJson(raw);
      return NextResponse.json(parsed);
    } catch {
      // Fallback if AI responded with plain text instead of structured JSON
      return NextResponse.json({
        improved: raw.replace(/```json|```/g, "").trim(),
        rationale: "Successfully upgraded bullet points based on target role parameters."
      });
    }
  } catch (error: any) {
    console.error("AI Improvement Error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to improve resume",
      improved: null 
    }, { status: 500 });
  }
}


