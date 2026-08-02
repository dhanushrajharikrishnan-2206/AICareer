import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Phase 3: Saved Jobs
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const saved = await prisma.savedJob.findMany({
    where: { userId: (session.user as any).id },
    include: { job: true },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(saved);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { jobId, matchScore, jobDetails } = await req.json();
  if (!jobId) return NextResponse.json({ error: "jobId is required" }, { status: 400 });

  // If it's a dynamic AI suggestion, persist the job definition in the Job table first
  if (jobDetails) {
    try {
      await prisma.job.upsert({
        where: { id: jobId },
        update: {},
        create: {
          id: jobId,
          title: jobDetails.title,
          company: jobDetails.company,
          location: jobDetails.location || "Remote",
          description: jobDetails.description,
        }
      });
    } catch (err) {
      console.error("Failed to upsert dynamic job for bookmark:", err);
    }
  }

  const saved = await prisma.savedJob.upsert({
    where: { userId_jobId: { userId: (session.user as any).id, jobId } },
    update: { matchScore },
    create: { userId: (session.user as any).id, jobId, matchScore }
  });

  return NextResponse.json(saved, { status: 201 });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { jobId } = await req.json();
  if (!jobId) return NextResponse.json({ error: "jobId is required" }, { status: 400 });

  await prisma.savedJob.delete({
    where: { userId_jobId: { userId: (session.user as any).id, jobId } }
  });

  return NextResponse.json({ ok: true });
}
