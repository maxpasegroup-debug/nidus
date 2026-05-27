"use client";

import { useQuery } from "@tanstack/react-query";
import { getAcademyBatches, type BatchFilters } from "@/services/academy";

export function useAcademyBatches(filters: BatchFilters = {}, enabled = true) {
  return useQuery({
    queryKey: ["academy", "batches", filters],
    queryFn: () => getAcademyBatches(filters),
    enabled
  });
}
