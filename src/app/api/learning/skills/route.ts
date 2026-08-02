import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

// GET: List the current user's tracked skills.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const skills = await prisma.skillProgress.findMany({
    where: { userId: (session.user as any).id },
    orderBy: { id: "asc" }
  });

  return NextResponse.json(skills);
}

// DELETE: Clear all tracked skills for the current user to reset the roadmap.
export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.skillProgress.deleteMany({
    where: { userId: (session.user as any).id }
  });

  return NextResponse.json({ success: true });
}
