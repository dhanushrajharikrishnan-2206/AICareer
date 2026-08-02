"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";
import { motion } from "motion/react";

type Stats = {
  userCount: number;
  resumeCount: number;
  analysisCount: number;
  coverLetterCount: number;
  jobCount: number;
  savedJobCount: number;
  interviewCount: number;
};

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshCount, setRefreshCount] = useState(0);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/analytics");
      if (!res.ok) throw new Error("Failed to fetch analytics");
      const data = await res.json();
      if (data && !data.error) {
        setStats(data);
        setRefreshCount((prev) => prev + 1);
      } else {
        setStats(null);
      }
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (!stats && loading) {
    return (
      <div className="max-w-lg flex items-center gap-2 p-6 text-sm text-ink/50">
        <RefreshCw className="w-4 h-4 animate-spin text-ink/70" />
        <span>Loading analytics...</span>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="max-w-lg p-6 border border-red-200/50 bg-red-50/50 text-red-700 rounded-xl">
        <p className="text-sm font-medium mb-2">Failed to load analytics</p>
        <button
          onClick={fetchStats}
          className="text-xs font-semibold underline hover:text-red-800 flex items-center gap-1"
        >
          <RefreshCw className="w-3 h-3" />
          Try again
        </button>
      </div>
    );
  }

  const rows: [string, number][] = [
    ["Users", stats.userCount],
    ["Resumes created", stats.resumeCount],
    ["Resume analyses run", stats.analysisCount],
    ["Cover letters generated", stats.coverLetterCount],
    ["Job listings", stats.jobCount],
    ["Jobs saved by users", stats.savedJobCount],
    ["Mock interviews taken", stats.interviewCount]
  ];

  return (
    <div className="max-w-lg">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-ink/80 bg-ink/5 hover:bg-ink/10 disabled:opacity-50 transition rounded-lg border border-ink/10"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>
      <p className="text-ink/60 mb-6">Product-wide usage counts.</p>

      <Card>
        <table className="w-full text-sm">
          <tbody>
            {rows.map(([label, value], idx) => (
              <motion.tr
                key={`${label}-${refreshCount}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.04, ease: "easeOut" }}
                className="border-b border-ink/5 last:border-0"
              >
                <td className="py-2 text-ink/70">{label}</td>
                <td className="py-2 text-right font-medium">{value}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
