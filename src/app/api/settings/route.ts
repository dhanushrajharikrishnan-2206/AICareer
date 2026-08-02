import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { name, email } = await req.json();
    const user = session.user as any;
    const userId = user?.id;

    if (!userId) {
      return NextResponse.json({ error: "User session identification missing" }, { status: 400 });
    }

    // Optional field validation
    if (name && name.trim().length < 2) {
      return NextResponse.json({ error: "Name must be at least 2 characters long." }, { status: 400 });
    }

    // Verify if email is changed and if it is unique
    let updateData: any = {};
    if (name) updateData.name = name.trim();

    if (email && email.trim().toLowerCase() !== user.email?.toLowerCase()) {
      const existingUser = await prisma.user.findUnique({
        where: { email: email.trim().toLowerCase() }
      });
      if (existingUser) {
        return NextResponse.json({ error: "Email address is already in use by another user." }, { status: 400 });
      }
      updateData.email = email.trim().toLowerCase();
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email
      }
    });
  } catch (error: any) {
    console.error("Settings update route failed:", error);
    return NextResponse.json({ error: error.message || "Failed to update settings" }, { status: 500 });
  }
}

// Support reset mock data or clearing user databases
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const user = session.user as any;
    const userId = user?.id;

    if (!userId) {
      return NextResponse.json({ error: "User identification missing" }, { status: 400 });
    }

    // Wipe specific mock histories for user-authored content if they wish to clear sandbox
    await Promise.all([
      prisma.resume.deleteMany({ where: { userId } }),
      prisma.resumeAnalysis.deleteMany({ where: { userId } }),
      prisma.coverLetter.deleteMany({ where: { userId } }),
      prisma.coachMessage.deleteMany({ where: { userId } }),
      prisma.savedJob.deleteMany({ where: { userId } }),
      prisma.skillProgress.deleteMany({ where: { userId } }),
      prisma.mockInterview.deleteMany({ where: { userId } })
    ]);

    return NextResponse.json({
      success: true,
      message: "Successfully reset sandbox data."
    });
  } catch (error: any) {
    console.error("Settings wipe route failed:", error);
    return NextResponse.json({ error: error.message || "Failed to reset database entries" }, { status: 500 });
  }
}
