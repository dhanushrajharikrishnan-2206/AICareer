import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateContentWithFallback } from "@/lib/ai";
import { headers } from "next/headers";

const PERSONAS: Record<string, string> = {
  general: "You are a warm, direct general career coach helping someone with their job search, resume development, and general interview preparation. Give highly actionable, practical, and constructive advice. Keep answers structured, positive, and focused on immediate next steps.",
  tech_recruiter: "You are Sarah, a veteran Tech Recruiter from top tech companies. You look at things from a hiring manager's perspective. Focus on technical skills, impact-driven resume bullet points, portfolio polish, GitHub presence, system design preparation, and coding assessment strategies.",
  career_strategist: "You are Marcus, an elite Career Strategist and Executive Coach. You help candidates target the hidden job market, build powerful networking systems, write high-conversion cold outreach messages, leverage LinkedIn, and design a structured weekly job search system.",
  salary_negotiator: "You are Elena, a world-class Salary Negotiation Expert. You specialize in helping candidates negotiate total compensation packages including base salary, sign-on bonuses, equity/options, performance bonuses, and remote benefits. Give candidates exact scripts, tactical email templates, and confidence-boosting frameworks to handle negotiation conversations with recruiters."
};

// GET: Load chat history for the current user
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;

  const messages = await prisma.coachMessage.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    take: 50
  });

  return NextResponse.json({ messages });
}

// DELETE: Clear chat history for the current user
export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;

  await prisma.coachMessage.deleteMany({
    where: { userId }
  });

  return NextResponse.json({ success: true });
}

// POST: Send a message to the AI coach
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const { message, persona = "general" } = await req.json();
  if (!message) return NextResponse.json({ error: "message is required" }, { status: 400 });

  // 1. Save user's message to backend database
  await prisma.coachMessage.create({
    data: { userId, role: "user", content: message }
  });

  // 2. Fetch recent conversation history
  const history = await prisma.coachMessage.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    take: 30
  });

  // 3. Fetch user workspace data to provide context
  let resumes: any[] = [];
  let skills: any[] = [];
  let savedJobs: any[] = [];
  let interviews: any[] = [];
  let coverLetters: any[] = [];

  try {
    [resumes, skills, savedJobs, interviews, coverLetters] = await Promise.all([
      prisma.resume.findMany({ where: { userId } }),
      prisma.skillProgress.findMany({ where: { userId } }),
      prisma.savedJob.findMany({ where: { userId }, include: { job: true } }),
      prisma.mockInterview.findMany({ where: { userId } }),
      prisma.coverLetter.findMany({ where: { userId } })
    ]);
  } catch (err) {
    console.error("Failed to query user workspace profile context:", err);
  }

  // Format context cleanly
  const resumeContext = resumes.map(r => {
    let contentStr = "";
    try {
      const parsed = typeof r.content === "string" ? JSON.parse(r.content) : r.content;
      contentStr = `Title: ${r.title}\n` +
        `Summary: ${parsed.summary || "Not specified"}\n` +
        `Experience: ${Array.isArray(parsed.experience) ? parsed.experience.map((exp: any) => `- ${exp.role} at ${exp.company} (${exp.duration || ""}): ${exp.description || ""}`).join("\n") : "Not specified"}\n` +
        `Skills: ${Array.isArray(parsed.skills) ? parsed.skills.join(", ") : "Not specified"}\n` +
        `Education: ${Array.isArray(parsed.education) ? parsed.education.map((edu: any) => `- ${edu.degree} from ${edu.school}`).join("\n") : "Not specified"}`;
    } catch (e) {
      contentStr = `Title: ${r.title}\nContent: ${JSON.stringify(r.content)}`;
    }
    return contentStr;
  }).join("\n\n---\n\n") || "No resumes created yet.";

  const skillsContext = skills.map(s => `- ${s.skillName} (Status: ${s.status})`).join("\n") || "No skills mapped yet.";

  const savedJobsContext = savedJobs.map(sj => `- ${sj.job.title} at ${sj.job.company} (${sj.job.location || 'Remote'}). Description:\n${sj.job.description}`).join("\n\n---\n\n") || "No jobs saved yet.";

  const interviewsContext = interviews.map(i => {
    return `- Type: ${i.type.toUpperCase()}\nFeedback Summary: ${i.feedback || "Awaiting evaluation."}`;
  }).join("\n\n") || "No interview sessions completed yet.";

  const coverLettersContext = coverLetters.map(cl => `- For ${cl.jobTitle} at ${cl.company}`).join("\n") || "No cover letters generated yet.";

  const workspaceContext = `
USER WORKSPACE PROFILE CONTEXT:
The user has the following live data loaded in their workspace database. You have direct read-access to this data to answer any questions, draft plans, recommend actions, analyze gaps, and write personalized scripts. Reference their resumes, skills, and saved jobs explicitly whenever relevant to show you have full synchronization of their database.

=== USER RESUMES ===
${resumeContext}

=== USER ACQUIRED & TARGET SKILLS ===
${skillsContext}

=== USER SAVED JOBS ===
${savedJobsContext}

=== USER MOCK INTERVIEW SESSIONS ===
${interviewsContext}

=== USER GENERATED COVER LETTERS ===
${coverLettersContext}
`;

  let reply = "";

  const systemPrompt = PERSONAS[persona] || PERSONAS.general;

  // Convert history messages format to standard role: "user" | "assistant"
  const standardMessages = history.map((m) => ({
    role: (m.role === "assistant" ? "assistant" : "user") as "user" | "assistant",
    content: m.content,
  }));

  let preferredModel: string | undefined = undefined;
  try {
    preferredModel = headers().get("x-ai-model") || undefined;
  } catch (e) {
    // safe fallback
  }

  try {
    reply = await generateContentWithFallback({
      systemInstruction: `${systemPrompt}\n\n${workspaceContext}\n\nUse your knowledge to answer current industry trends, salary benchmarks, company insights, or in-demand tech stacks to provide highly accurate, up-to-date information.`,
      messages: standardMessages,
      preferredModel,
    });
  } catch (err: any) {
    console.error("[Coach Chat] Orchestration call failed:", err);
    reply = "I'm experiencing connectivity issues right now. Let me try my best to answer you: " + (err.message || err);
  }

  // 4. Save assistant's reply to database
  await prisma.coachMessage.create({
    data: { userId, role: "assistant", content: reply }
  });

  return NextResponse.json({ reply });
}

