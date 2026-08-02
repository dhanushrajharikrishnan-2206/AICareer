"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type User = { id: string; name: string | null; email: string; role: string; createdAt: string; _count: { resumes: number } };

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);

  async function load() {
    const res = await fetch("/api/admin/users");
    if (res.ok) {
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } else {
      setUsers([]);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleRole(user: User) {
    const nextRole = user.role === "ADMIN" ? "USER" : "ADMIN";
    await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: nextRole })
    });
    load();
  }

  async function removeUser(user: User) {
    if (!confirm(`Delete ${user.email}? This can't be undone.`)) return;
    await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">User management</h1>
      <p className="text-ink/60 mb-6">{users.length} users</p>

      <div className="flex flex-col gap-2">
        {users.map((u) => (
          <Card key={u.id} className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">{u.name || "(no name)"} <span className="text-ink/50">{u.email}</span></p>
              <p className="text-xs text-ink/50">{u.role} · {u._count.resumes} resumes</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => toggleRole(u)}>
                {u.role === "ADMIN" ? "Demote to user" : "Promote to admin"}
              </Button>
              <Button variant="secondary" onClick={() => removeUser(u)}>Delete</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
