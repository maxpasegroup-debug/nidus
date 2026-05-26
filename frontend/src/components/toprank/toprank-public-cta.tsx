"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider-v2";

type ToprankPublicCtaProps = {
  examTitle: string;
  isLive: boolean;
};

const primaryClass = "inline-flex min-h-12 items-center justify-center gap-2 rounded border border-[#b58b35]/45 bg-[linear-gradient(135deg,#fff3bf_0%,#e7c873_34%,#b9913f_72%,#8a6426_100%)] px-5 py-3 text-sm font-semibold text-[#071d36] transition hover:-translate-y-0.5 hover:brightness-105";
const secondaryClass = "inline-flex min-h-12 items-center justify-center gap-2 rounded border border-[#071d36]/14 bg-white px-5 py-3 text-sm font-semibold text-[#071d36] transition hover:-translate-y-0.5";

export function ToprankPublicCta({ examTitle, isLive }: ToprankPublicCtaProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <span className={`${primaryClass} opacity-70`}>Checking access...</span>
      </div>
    );
  }

  if (!isLive) {
    return (
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="#enquire" className={primaryClass}>
          Join Guidance List <ArrowRight className="h-4 w-4" />
        </Link>
        <Link href="/start-free?intent=toprank" className={secondaryClass}>
          Start Free
        </Link>
      </div>
    );
  }

  if (user?.role === "STUDENT") {
    return (
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/dashboard/student" className={primaryClass}>
          Open Student Dashboard <ArrowRight className="h-4 w-4" />
        </Link>
        <Link href="/toprank" className={secondaryClass}>
          View TOPRANK Arenas
        </Link>
      </div>
    );
  }

  if (user?.role === "GUEST") {
    return (
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/join" className={primaryClass}>
          Apply for NDA Student Access <ArrowRight className="h-4 w-4" />
        </Link>
        <Link href="/dashboard/guest" className={secondaryClass}>
          Back to My Journey
        </Link>
      </div>
    );
  }

  if (user) {
    return (
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/dashboard" className={primaryClass}>
          Open Dashboard <ArrowRight className="h-4 w-4" />
        </Link>
        <Link href="/toprank" className={secondaryClass}>
          View TOPRANK Arenas
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
      <Link href={`/start-free?intent=toprank&program=${encodeURIComponent(`TOPRANK ${examTitle}`)}`} className={primaryClass}>
        Start Free for {examTitle} <ArrowRight className="h-4 w-4" />
      </Link>
      <Link href="/login" className={secondaryClass}>
        Already have account? Login
      </Link>
    </div>
  );
}
