"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ShieldCheck } from "lucide-react";

async function acceptParentLink(token: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const response = await fetch(`${baseUrl}/api/auth/parent-link/accept`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof data.message === "string" ? data.message : "Could not accept parent link");
  return data as { message?: string };
}

export default function ParentLinkPage() {
  return (
    <Suspense fallback={<ParentLinkShell message="Loading parent invitation..." />}>
      <ParentLinkContent />
    </Suspense>
  );
}

function ParentLinkContent() {
  const searchParams = useSearchParams();
  const token = searchParams?.get("token") ?? "";
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <ParentLinkShell>
        <ShieldCheck className="h-9 w-9 text-[var(--gold)]" />
        <p className="mt-5 text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">Parent Link</p>
        <h1 className="mt-3 text-4xl font-black">Connect parent access</h1>
        <p className="mt-4 text-sm leading-7 text-[var(--muted-blue)]">
          Login with the parent account, then accept this invitation. Parent access is read-only and limited to the linked student.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={!token || loading}
            onClick={async () => {
              setLoading(true);
              setMessage("Accepting parent link...");
              try {
                const result = await acceptParentLink(token);
                setMessage(result.message ?? "Parent account linked.");
              } catch (error) {
                setMessage(error instanceof Error ? error.message : "Could not link parent account.");
              } finally {
                setLoading(false);
              }
            }}
            className="rounded-xl bg-[var(--gold-gradient)] px-4 py-3 text-sm font-black"
          >
            {loading ? "Linking..." : "Accept Parent Link"}
          </button>
          <Link href="/login" className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-black">Login as Parent</Link>
          <Link href="/dashboard/parent" className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-black">Open Parent Dashboard</Link>
        </div>
        {!token ? <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-800">Invitation token is missing.</p> : null}
        {message ? <p className="mt-4 rounded-xl border border-[var(--gold-border)] bg-[var(--gold-soft)] p-3 text-sm font-bold">{message}</p> : null}
    </ParentLinkShell>
  );
}

function ParentLinkShell({ children, message }: { children?: React.ReactNode; message?: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--page-bg)] px-5 py-10 text-[var(--navy)]">
      <section className="w-full max-w-xl rounded-3xl border border-[var(--border)] bg-white p-6 shadow-xl">
        {children ?? <p className="text-sm font-bold text-[var(--muted-blue)]">{message}</p>}
      </section>
    </main>
  );
}
