import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

// Phase 6: Job Management
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const jobs = await prisma.job.findMany({ orderBy: { postedAt: "desc" } });
  return NextResponse.json(jobs);
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { title, company, location, description, url } = await req.json();
  if (!title || !company || !description) {
    return NextResponse.json({ error: "title, company and description are required" }, { status: 400 });
  }

  const job = await prisma.job.create({ data: { title, company, location, description, url } });
  return NextResponse.json(job, { status: 201 });
}
