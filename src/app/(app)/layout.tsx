import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/dashboard/sidebar";
import { HeaderTopBar } from "@/components/header-top-bar";
import { AnimatedCoach } from "@/components/dashboard/animated-coach";
import { ScrollToTop } from "@/components/dashboard/scroll-to-top";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  const isAdmin = (session?.user as any)?.role === "ADMIN";

  return (
    <div className="flex min-h-screen relative bg-zinc-50/50 dark:bg-zinc-950">
      <ScrollToTop />
      <Sidebar isAdmin={isAdmin} />

      <div className="flex-1 flex flex-col min-w-0">
        <HeaderTopBar />
        <main className="flex-1 px-6 md:px-8 py-8 overflow-y-auto">
          {children}
        </main>
      </div>

      <AnimatedCoach />
    </div>
  );
}
