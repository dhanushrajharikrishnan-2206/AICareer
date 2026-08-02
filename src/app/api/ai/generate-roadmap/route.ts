import { NextResponse } from "next/server";
import { askAI } from "@/lib/ai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const SYSTEM_PROMPT = `You are an expert AI Career Planner. Your goal is to generate a learning roadmap for a specific job role.

Given a targeted role (e.g., Data Scientist), return a list of essential skills for that role.

Respond ONLY with valid JSON:
{
  "skills": [
    {
      "skillName": "name of the skill",
      "status": "not_started"
    }
  ]
}

Do not output any introductory prose, markdown fences (such as \`\`\`json), or conversational dialogue. Respond strictly with raw valid JSON.`;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { role, level, proficiency } = await req.json();
  if (!role) return NextResponse.json({ error: "Role is required" }, { status: 400 });

  const targetLevel = proficiency || level || "Beginner";
  const prompt = `Generate a learning roadmap for the following role: ${role} at the ${targetLevel} proficiency level. Focus on skills appropriate for this exact level.`;

  try {
    const raw = await askAI(SYSTEM_PROMPT, prompt, 2000, typeof window !== "undefined" ? localStorage.getItem("pref_ai_model") || undefined : undefined);
    const parsed = JSON.parse(raw);
    
    if (parsed && Array.isArray(parsed.skills)) {
      const userId = (session.user as any).id;
      
      // Clear existing skills for this user
      await prisma.skillProgress.deleteMany({
        where: { userId }
      });

      // Save each skill to the database to assign real IDs
      const createdSkills = [];
      for (const skill of parsed.skills) {
        if (!skill.skillName) continue;
        const created = await prisma.skillProgress.create({
          data: {
            userId,
            skillName: skill.skillName,
            status: skill.status || "not_started",
            proficiency: targetLevel
          }
        });
        createdSkills.push(created);
      }
      
      return NextResponse.json({ skills: createdSkills });
    }
    
    return NextResponse.json(parsed);
  } catch (err: any) {
    console.error("Error generating roadmap:", err);
    return NextResponse.json({ error: "Failed to generate roadmap." }, { status: 500 });
  }
}


