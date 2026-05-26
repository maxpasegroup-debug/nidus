"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/providers/toast-provider";
import { getApiErrorMessage } from "@/services/api";
import {
  addSalesBoosterMetricSnapshot,
  createSalesBoosterCampaign,
  getSalesBoosterAnalytics,
  getSalesBoosterConnectors,
  getSalesBoosterCampaigns,
  getSalesBoosterCampaignReport,
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

export function useSalesBoosterAnalytics() {
  return useQuery({ queryKey: ["sales-booster", "analytics"], queryFn: getSalesBoosterAnalytics });
}

export function useSalesBoosterCampaignReport(id?: string) {
  return useQuery({
    queryKey: ["sales-booster", "campaign-report", id],
    queryFn: () => getSalesBoosterCampaignReport(id ?? ""),
    enabled: Boolean(id)
  });
}

export function useCreateSalesBoosterCampaign() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: createSalesBoosterCampaign,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["sales-booster", "campaigns"] }),
        queryClient.invalidateQueries({ queryKey: ["sales-booster", "summary"] }),
        queryClient.invalidateQueries({ queryKey: ["sales-booster", "analytics"] })
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
        queryClient.invalidateQueries({ queryKey: ["sales-booster", "summary"] }),
        queryClient.invalidateQueries({ queryKey: ["sales-booster", "analytics"] })
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
        queryClient.invalidateQueries({ queryKey: ["sales-booster", "summary"] }),
        queryClient.invalidateQueries({ queryKey: ["sales-booster", "analytics"] })
      ]);
      showToast("Sales Booster connector run completed.", "success");
    },
    onError: (error) => showToast(getApiErrorMessage(error), "error")
  });
}

export function useAddSalesBoosterMetricSnapshot() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: addSalesBoosterMetricSnapshot,
    onSuccess: async (_snapshot, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["sales-booster", "analytics"] }),
        queryClient.invalidateQueries({ queryKey: ["sales-booster", "campaign-report", variables.id] })
      ]);
      showToast("Campaign metrics saved.", "success");
    },
    onError: (error) => showToast(getApiErrorMessage(error), "error")
  });
}
