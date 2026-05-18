"use client";

import { useEffect, useState } from "react";
import { MonitorSmartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getSessions, logoutAll, revokeSession, type AuthSession } from "@/services/auth.v2";
import { getApiErrorMessage } from "@/services/api";
import { useToast } from "@/components/providers/toast-provider";

export default function SessionsPage() {
  const { showToast } = useToast();
  const [sessions, setSessions] = useState<AuthSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function load() {
    setIsLoading(true);
    try {
      setSessions(await getSessions());
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function revoke(id: string) {
    await revokeSession(id);
    await load();
    showToast("Session revoked", "success");
  }

  async function revokeAll() {
    await logoutAll();
    showToast("All sessions revoked", "success");
  }

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-ink">Active Sessions</h1>
            <p className="mt-2 text-sm text-muted">Review and revoke devices signed in to your NIDUS account.</p>
          </div>
          <Button onClick={revokeAll}>Logout All</Button>
        </div>
        <div className="grid gap-4">
          {isLoading ? <Card className="p-5 text-muted">Loading sessions...</Card> : sessions.map((session) => (
            <Card key={session.id} className="flex items-center justify-between gap-4 p-5">
              <div className="flex items-center gap-3">
                <MonitorSmartphone className="h-5 w-5 text-gold" />
                <div>
                  <p className="font-semibold text-white">{session.userAgent || "Unknown device"}</p>
                  <p className="text-sm text-muted">{session.ipAddress ?? "Unknown IP"} - Last active {new Date(session.updatedAt).toLocaleString()}</p>
                </div>
              </div>
              <Button size="sm" variant="secondary" onClick={() => revoke(session.id)}>Revoke</Button>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
