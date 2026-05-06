"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/providers/toast-provider";
import { getApiErrorMessage } from "@/services/api";
import { createAdmission, createCounselling, createFollowup, createLead, createReferral, deleteLead, getAdmissions, getCounselling, getFollowups, getLeads, getReferrals, updateLead } from "@/services/crm";
import type { LeadStatus } from "@/types/crm";

function useToastMutation<TPayload, TResult>(mutationFn: (payload: TPayload) => Promise<TResult>, keys: unknown[][], message: string) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
      showToast(message, "success");
    },
    onError: (error) => showToast(getApiErrorMessage(error), "error")
  });
}

export function useLeads(filters?: { status?: LeadStatus; search?: string }) {
  return {
    ...useQuery({ queryKey: ["crm", "leads", filters], queryFn: () => getLeads(filters) }),
    create: useToastMutation(createLead, [["crm", "leads"]], "Lead created"),
    update: useToastMutation(updateLead, [["crm", "leads"]], "Lead updated"),
    remove: useToastMutation(deleteLead, [["crm", "leads"]], "Lead deleted")
  };
}

export function useFollowups() {
  return { ...useQuery({ queryKey: ["crm", "followups"], queryFn: getFollowups }), create: useToastMutation(createFollowup, [["crm", "followups"], ["crm", "leads"]], "Follow-up scheduled") };
}

export function useAdmissions() {
  return { ...useQuery({ queryKey: ["crm", "admissions"], queryFn: getAdmissions }), create: useToastMutation(createAdmission, [["crm", "admissions"]], "Admission recorded") };
}

export function useCounselling() {
  return { ...useQuery({ queryKey: ["crm", "counselling"], queryFn: getCounselling }), create: useToastMutation(createCounselling, [["crm", "counselling"]], "Counselling booked") };
}

export function useReferrals() {
  return { ...useQuery({ queryKey: ["crm", "referrals"], queryFn: getReferrals }), create: useToastMutation(createReferral, [["crm", "referrals"]], "Referral tracked") };
}
