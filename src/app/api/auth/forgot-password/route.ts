import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const checkSchema = z.object({
  email: z.string().email(),
});

const resetSchema = z.object({
  email: z.string().email(),
  newPassword: z.string().min(8),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // If newPassword is provided, we perform a reset
    if ("newPassword" in body) {
      const parsed = resetSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: "Password must be at least 8 characters long." }, { status: 400 });
      }

      const { email, newPassword } = parsed.data;
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return NextResponse.json({ error: "User not found." }, { status: 404 });
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { email },
        data: { passwordHash },
      });

      return NextResponse.json({ success: true, message: "Password updated successfully!" });
    } else {
      // Just checking if email exists
      const parsed = checkSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
      }

      const { email } = parsed.data;
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return NextResponse.json({ error: "No account found with this email address." }, { status: 404 });
      }

      return NextResponse.json({ success: true, email: user.email, name: user.name });
    }
  } catch (err) {
    console.error("Forgot password error:", err);
    return NextResponse.json({ error: "Internal server error. Please try again." }, { status: 500 });
  }
}
