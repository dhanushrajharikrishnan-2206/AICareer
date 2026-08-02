import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Phase 4: Progress Tracking — update a skill's status or proficiency.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { status, proficiency } = body;

  const data: any = {};

  if (status !== undefined) {
    if (!["not_started", "in_progress", "done"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    data.status = status;
  }

  if (proficiency !== undefined) {
    if (!["Beginner", "Intermediate", "Advanced"].includes(proficiency)) {
      return NextResponse.json({ error: "Invalid proficiency" }, { status: 400 });
    }
    data.proficiency = proficiency;
  }

  const skill = await prisma.skillProgress.findUnique({ where: { id: params.id } });
  if (!skill || skill.userId !== (session.user as any).id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.skillProgress.update({
    where: { id: params.id },
    data
  });

  return NextResponse.json(updated);
}

// DELETE: Delete a specific skill from the roadmap.
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const skill = await prisma.skillProgress.findUnique({ where: { id: params.id } });
  if (!skill || skill.userId !== (session.user as any).id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.skillProgress.delete({
    where: { id: params.id }
  });

  return NextResponse.json({ success: true });
}
