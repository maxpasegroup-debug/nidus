"use client";

import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/services/api";

export function DashboardError({
  error,
  onRefresh
}: {
  error: unknown;
  onRefresh: () => void;
}) {
  return (
    <div className="rounded-lg border border-red-400/25 bg-red-400/10 p-6">
      <p className="font-semibold text-red-100">Unable to load dashboard</p>
      <p className="mt-2 text-sm leading-6 text-red-100/80">{getApiErrorMessage(error)}</p>
      <Button type="button" onClick={onRefresh} variant="secondary" className="mt-5">
        Refresh
      </Button>
    </div>
  );
}
