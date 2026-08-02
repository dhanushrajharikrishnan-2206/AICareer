import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Sidebar } from "@/components/dashboard/sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="flex">
      <Sidebar isAdmin />
      <div className="flex-1 px-8 py-8">{children}</div>
    </div>
  );
}
