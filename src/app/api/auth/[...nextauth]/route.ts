import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// Ensure a secret exists
if (!process.env.NEXTAUTH_SECRET) {
  process.env.NEXTAUTH_SECRET = "fallback-secret-for-next-auth-development-and-preview-123";
}

const authHandler = NextAuth(authOptions);

function handler(req: any, ctx: any) {
  if (!process.env.NEXTAUTH_URL && req?.headers) {
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
    process.env.NEXTAUTH_URL = `${protocol}://${host}`;
    console.log("Dynamically resolved NEXTAUTH_URL synchronously as:", process.env.NEXTAUTH_URL);
  }

  return authHandler(req, ctx);
}

export { handler as GET, handler as POST };
