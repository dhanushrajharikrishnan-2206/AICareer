import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import Link from "next/link";

// Phase 6: Admin Dashboard
export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") redirect("/dashboard");

  const [userCount, resumeCount, jobCount, interviewCount] = await Promise.all([
    prisma.user.count(),
    prisma.resume.count(),
    prisma.job.count(),
    prisma.mockInterview.count()
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Admin dashboard</h1>
      <p className="text-ink/60 mb-6">Overview of the whole product.</p>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <Card><p className="text-sm text-ink/60">Users</p><p className="text-2xl font-semibold">{userCount}</p></Card>
        <Card><p className="text-sm text-ink/60">Resumes</p><p className="text-2xl font-semibold">{resumeCount}</p></Card>
        <Card><p className="text-sm text-ink/60">Jobs</p><p className="text-2xl font-semibold">{jobCount}</p></Card>
        <Card><p className="text-sm text-ink/60">Mock interviews</p><p className="text-2xl font-semibold">{interviewCount}</p></Card>
      </div>

      <div className="flex gap-3 text-sm">
        <Link href="/admin/users" className="underline">User management</Link>
        <Link href="/admin/jobs" className="underline">Job management</Link>
        <Link href="/admin/analytics" className="underline">Analytics</Link>
      </div>
    </div>
  );
}
