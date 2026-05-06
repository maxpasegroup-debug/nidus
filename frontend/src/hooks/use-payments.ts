"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/providers/toast-provider";
import { getApiErrorMessage } from "@/services/api";
import { createFeeInstallment, createPaymentOrder, createSubscription, generateInvoice, getFees, getInvoices, getPaymentHistory, getSubscriptions, payFeeInstallment, verifyPayment } from "@/services/payments";

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

export function usePayments() {
  return {
    ...useQuery({ queryKey: ["finance", "payments"], queryFn: getPaymentHistory }),
    createOrder: useToastMutation(createPaymentOrder, [["finance", "payments"]], "Payment order created"),
    verify: useToastMutation(verifyPayment, [["finance", "payments"]], "Payment verified")
  };
}

export function useSubscriptions() {
  return { ...useQuery({ queryKey: ["finance", "subscriptions"], queryFn: getSubscriptions }), create: useToastMutation(createSubscription, [["finance", "subscriptions"]], "Subscription saved") };
}

export function useFees() {
  return {
    ...useQuery({ queryKey: ["finance", "fees"], queryFn: getFees }),
    create: useToastMutation(createFeeInstallment, [["finance", "fees"]], "Installment created"),
    pay: useToastMutation(payFeeInstallment, [["finance", "fees"]], "Installment marked paid")
  };
}

export function useInvoices() {
  return { ...useQuery({ queryKey: ["finance", "invoices"], queryFn: getInvoices }), generate: useToastMutation(generateInvoice, [["finance", "invoices"]], "Invoice generated") };
}
