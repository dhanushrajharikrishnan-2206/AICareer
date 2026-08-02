import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resumes = await prisma.resume.findMany({
    where: { userId: (session.user as any).id },
    orderBy: { updatedAt: "desc" }
  });

  return NextResponse.json(resumes);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const resume = await prisma.resume.create({
    data: {
      userId: (session.user as any).id,
      title: body.title || "Untitled resume",
      content: body.content
    }
  });

  return NextResponse.json(resume, { status: 201 });
}
