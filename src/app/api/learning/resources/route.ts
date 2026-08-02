import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { askAI, cleanAndParseJson } from "@/lib/ai";

// Concise prompt — avoids token overflow that causes JSON truncation
const SYSTEM_PROMPT = `You are an expert career advisor. For the given skill, return ONLY a valid JSON object (no markdown, no prose):
{
  "resources": [
    { "name": "Resource name", "type": "course|doc|book|project", "note": "One sentence why it matters." }
  ],
  "studyNotes": "2-3 paragraph markdown summary of the skill: core concepts, key terms, one code example.",
  "aiSuggestions": ["Tip 1", "Tip 2", "Tip 3"],
  "recommendedBook": { "title": "Book title", "author": "Author name", "description": "One sentence why it is the gold standard." }
}
Return 3 resources. Keep each field concise. Output raw JSON only — no \`\`\`json fences.`;

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const skill = searchParams.get("skill");
  if (!skill) return NextResponse.json({ error: "skill query param is required" }, { status: 400 });

  const preferredModel = req.headers.get("x-ai-model") || "gemini-flash";

  try {
    const raw = await askAI(
      SYSTEM_PROMPT,
      `Skill: ${skill}`,
      2500,   // increased from old 3000 but prompt is shorter so full JSON fits
      preferredModel
    );

    // Strip any accidental markdown fences before parsing
    const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
    const parsed = cleanAndParseJson(cleaned);

    // Validate minimum shape so we never return empty data silently
    if (!parsed || typeof parsed !== "object") {
      throw new Error("AI returned non-object JSON.");
    }

    return NextResponse.json(parsed);
  } catch (err: any) {
    console.error("Error fetching learning resources from AI:", err.message || err);
    return NextResponse.json(
      { error: err.message || "Failed to generate learning guides." },
      { status: 500 }
    );
  }
}

