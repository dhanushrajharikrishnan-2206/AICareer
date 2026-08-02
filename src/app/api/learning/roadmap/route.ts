import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { askAI, cleanAndParseJson } from "@/lib/ai";

const SYSTEM_PROMPT = `You are a career skills advisor. Given a target job title, list the 6-10 most
important skills someone should learn or strengthen to be competitive for that role, ordered from
most foundational to most advanced. Respond ONLY with valid JSON, no prose, no markdown fences:
{ "skills": ["skill one", "skill two", ...] }`;

// Phase 4: Skill Roadmap — generates a skill list for a target role and stores it as SkillProgress rows.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { targetRole } = await req.json();
  if (!targetRole) return NextResponse.json({ error: "targetRole is required" }, { status: 400 });

  const raw = await askAI(SYSTEM_PROMPT, `Target role: ${targetRole}`);

  let parsed;
  try {
    parsed = cleanAndParseJson(raw);
  } catch {
    return NextResponse.json({ error: "Could not parse AI response", raw }, { status: 502 });
  }

  const userId = (session.user as any).id;
  const skills = (parsed.skills as string[]) || [];

  // Skip skills the user already has tracked, so re-running the roadmap doesn't duplicate rows.
  const existing = await prisma.skillProgress.findMany({ where: { userId }, select: { skillName: true } });
  const existingNames = new Set(existing.map((s) => s.skillName));
  const newSkills = skills.filter((s) => !existingNames.has(s));

  if (newSkills.length > 0) {
    await prisma.skillProgress.createMany({
      data: newSkills.map((skillName) => ({ userId, skillName, proficiency: "Beginner" }))
    });
  }

  return NextResponse.json({ skills });
}
