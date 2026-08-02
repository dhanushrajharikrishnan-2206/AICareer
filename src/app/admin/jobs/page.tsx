"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Job = { id: string; title: string; company: string; location: string | null; description: string };

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [form, setForm] = useState({ title: "", company: "", location: "", description: "", url: "" });
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/jobs");
    if (res.ok) {
      const data = await res.json();
      setJobs(Array.isArray(data) ? data : []);
    } else {
      setJobs([]);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate() {
    setSaving(true);
    await fetch("/api/admin/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    setForm({ title: "", company: "", location: "", description: "", url: "" });
    setSaving(false);
    load();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/admin/jobs/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold mb-1">Job management</h1>
      <p className="text-ink/60 mb-6">Add and remove job listings shown in the Jobs tab.</p>

      <Card className="mb-6">
        <p className="text-sm font-medium mb-2">New listing</p>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Input placeholder="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
        </div>
        <Input
          className="mb-2"
          placeholder="Location (optional)"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
        />
        <Textarea
          rows={4}
          className="mb-2"
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <Input
          className="mb-2"
          placeholder="URL (optional)"
          value={form.url}
          onChange={(e) => setForm({ ...form, url: e.target.value })}
        />
        <Button onClick={handleCreate} disabled={saving || !form.title || !form.company || !form.description}>
          {saving ? "Adding..." : "Add listing"}
        </Button>
      </Card>

      <div className="flex flex-col gap-2">
        {jobs.map((job) => (
          <Card key={job.id} className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">{job.title}</p>
              <p className="text-xs text-ink/50">{job.company} · {job.location || "Unspecified"}</p>
            </div>
            <Button variant="secondary" onClick={() => handleDelete(job.id)}>Delete</Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
