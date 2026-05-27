"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/providers/toast-provider";
import { getApiErrorMessage } from "@/services/api";
import {
  addSalesBoosterMetricSnapshot,
  addSalesBoosterAudienceContact,
  attachSalesBoosterCreative,
  broadcastSalesBoosterWhatsApp,
  createSalesBoosterCampaign,
  getSalesBoosterAudience,
  getSalesBoosterAnalytics,
  getSalesBoosterConnectors,
  getSalesBoosterCampaigns,
  getSalesBoosterCampaignReport,
  getSalesBoosterSummary,
  getScheduledSalesBoosterCampaigns,
  importSalesBoosterLeadsToAudience,
  runSalesBoosterCampaign,
  runDueSalesBoosterCampaigns,
  scheduleSalesBoosterCampaign,
  updateSalesBoosterStatus,
  uploadSalesBoosterCreative
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

export function useScheduledSalesBoosterCampaigns() {
  return useQuery({ queryKey: ["sales-booster", "scheduled"], queryFn: getScheduledSalesBoosterCampaigns });
}

export function useSalesBoosterAudience() {
  return useQuery({ queryKey: ["sales-booster", "audience"], queryFn: getSalesBoosterAudience });
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

export function useUploadSalesBoosterCreative() {
  const { showToast } = useToast();
  return useMutation({
    mutationFn: uploadSalesBoosterCreative,
    onSuccess: () => showToast("Creative uploaded and ready for campaign review.", "success"),
    onError: (error) => showToast(getApiErrorMessage(error), "error")
  });
}

export function useAttachSalesBoosterCreative() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: attachSalesBoosterCreative,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["sales-booster", "campaigns"] }),
        queryClient.invalidateQueries({ queryKey: ["sales-booster", "summary"] })
      ]);
      showToast("Campaign creative updated.", "success");
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

export function useScheduleSalesBoosterCampaign() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: scheduleSalesBoosterCampaign,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["sales-booster", "campaigns"] }),
        queryClient.invalidateQueries({ queryKey: ["sales-booster", "scheduled"] }),
        queryClient.invalidateQueries({ queryKey: ["sales-booster", "summary"] })
      ]);
      showToast("Campaign scheduled.", "success");
    },
    onError: (error) => showToast(getApiErrorMessage(error), "error")
  });
}

export function useRunDueSalesBoosterCampaigns() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: runDueSalesBoosterCampaigns,
    onSuccess: async (result) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["sales-booster", "campaigns"] }),
        queryClient.invalidateQueries({ queryKey: ["sales-booster", "scheduled"] }),
        queryClient.invalidateQueries({ queryKey: ["sales-booster", "analytics"] })
      ]);
      showToast(`Due campaigns processed: ${result.executed} executed, ${result.failed} failed.`, result.failed ? "error" : "success");
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

export function useAddSalesBoosterAudienceContact() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: addSalesBoosterAudienceContact,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["sales-booster", "audience"] });
      showToast("Audience contact saved.", "success");
    },
    onError: (error) => showToast(getApiErrorMessage(error), "error")
  });
}

export function useImportSalesBoosterLeadsToAudience() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: importSalesBoosterLeadsToAudience,
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["sales-booster", "audience"] });
      showToast(`${result.imported} CRM leads imported to ${result.segment}.`, "success");
    },
    onError: (error) => showToast(getApiErrorMessage(error), "error")
  });
}

export function useBroadcastSalesBoosterWhatsApp() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: broadcastSalesBoosterWhatsApp,
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["sales-booster", "audience"] });
      showToast(`${result.result.status}: ${result.result.message}`, result.result.status === "FAILED" ? "error" : "success");
    },
    onError: (error) => showToast(getApiErrorMessage(error), "error")
  });
}
