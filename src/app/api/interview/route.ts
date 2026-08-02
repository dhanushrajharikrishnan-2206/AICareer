import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { askAI, cleanAndParseJson } from "@/lib/ai";

const PROMPTS: Record<string, string> = {
  technical: `You are a technical interviewer. Generate 5 technical interview questions for the given role tailored strictly to the specified difficulty level (beginner, intermediate, or advanced). Mix conceptual and applied questions. Respond ONLY with valid JSON: { "questions": ["..."] }`,
  hr: `You are an HR interviewer. Generate 5 behavioral/HR interview questions for the given role tailored strictly to the specified difficulty level (beginner, intermediate, or advanced) (e.g. teamwork, conflict, motivation). Respond ONLY with valid JSON: { "questions": ["..."] }`,
  aptitude: `You are an aptitude test writer. Generate 5 short logical/numerical reasoning questions suitable for a job aptitude test at the specified difficulty level (beginner, intermediate, or advanced). Respond ONLY with valid JSON: { "questions": ["..."] }`
};

// Phase 5: Mock Interviews, Technical Questions, HR Questions, Aptitude Tests
// — one endpoint, "type" selects the flavor of questions.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { type, jobTitle, difficulty } = await req.json();
  if (!type || !PROMPTS[type]) {
    return NextResponse.json({ error: "type must be one of technical, hr, aptitude" }, { status: 400 });
  }

  const validDifficulty = ["beginner", "intermediate", "advanced"].includes(difficulty?.toLowerCase())
    ? difficulty.toLowerCase()
    : "intermediate";

  const raw = await askAI(PROMPTS[type], `Role: ${jobTitle || "general"}, Difficulty Level: ${validDifficulty.toUpperCase()}`);

  let parsed;
  try {
    parsed = cleanAndParseJson(raw);
  } catch {
    return NextResponse.json({ error: "Could not parse AI response", raw }, { status: 502 });
  }

  const interview = await prisma.mockInterview.create({
    data: {
      userId: (session.user as any).id,
      type,
      difficulty: validDifficulty,
      questions: parsed.questions
    } as any
  });

  return NextResponse.json(interview);
}

// List past interviews and resume analyses for the current user.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;

  const [interviews, analyses] = await Promise.all([
    prisma.mockInterview.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20
    }),
    prisma.resumeAnalysis.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        atsScore: true,
        jobTitle: true,
        createdAt: true
      }
    })
  ]);

  return NextResponse.json({ interviews, analyses });
}

