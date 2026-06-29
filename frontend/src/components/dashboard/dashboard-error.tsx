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
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
      <p className="font-black text-red-900">Unable to load dashboard</p>
      <p className="mt-2 text-sm font-medium leading-6 text-red-800">{getApiErrorMessage(error)}</p>
      <Button type="button" onClick={onRefresh} variant="secondary" className="mt-5">
        Refresh
      </Button>
    </div>
  );
}
