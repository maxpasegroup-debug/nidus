"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/providers/toast-provider";
import { getApiErrorMessage } from "@/services/api";
import {
  createSalesBoosterCampaign,
  getSalesBoosterConnectors,
  getSalesBoosterCampaigns,
  getSalesBoosterSummary,
  runSalesBoosterCampaign,
  updateSalesBoosterStatus
} from "@/services/sales-booster";

export function useSalesBoosterCampaigns() {
  return useQuery({ queryKey: ["sales-booster", "campaigns"], queryFn: getSalesBoosterCampaigns });
}

export function useSalesBoosterSummary() {
  return useQuery({ queryKey: ["sales-booster", "summary"], queryFn: getSalesBoosterSummary });
}

export function useSalesBoosterConnectors() {
  return useQuery({ queryKey: ["sales-booster", "connectors"], queryFn: getSalesBoosterConnectors });
}

export function useCreateSalesBoosterCampaign() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: createSalesBoosterCampaign,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["sales-booster", "campaigns"] }),
        queryClient.invalidateQueries({ queryKey: ["sales-booster", "summary"] })
      ]);
      showToast("Sales Booster campaign saved.", "success");
    },
    onError: (error) => showToast(getApiErrorMessage(error), "error")
  });
}

export function useUpdateSalesBoosterStatus() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: updateSalesBoosterStatus,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["sales-booster", "campaigns"] }),
        queryClient.invalidateQueries({ queryKey: ["sales-booster", "summary"] })
      ]);
      showToast("Campaign status updated.", "success");
    },
    onError: (error) => showToast(getApiErrorMessage(error), "error")
  });
}

export function useRunSalesBoosterCampaign() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: runSalesBoosterCampaign,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["sales-booster", "campaigns"] }),
        queryClient.invalidateQueries({ queryKey: ["sales-booster", "summary"] })
      ]);
      showToast("Sales Booster connector run completed.", "success");
    },
    onError: (error) => showToast(getApiErrorMessage(error), "error")
  });
}
