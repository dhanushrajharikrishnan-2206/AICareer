import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Phase 6: Analytics — top-line counts across the product.
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [userCount, resumeCount, analysisCount, coverLetterCount, jobCount, savedJobCount, interviewCount] =
    await Promise.all([
      prisma.user.count(),
      prisma.resume.count(),
      prisma.resumeAnalysis.count(),
      prisma.coverLetter.count(),
      prisma.job.count(),
      prisma.savedJob.count(),
      prisma.mockInterview.count()
    ]);

  return NextResponse.json({
    userCount,
    resumeCount,
    analysisCount,
    coverLetterCount,
    jobCount,
    savedJobCount,
    interviewCount
  });
}
