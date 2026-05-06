import type { RazorpayOrderResponse } from "@/types/payments";

type RazorpayHandlerResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayConstructor = new (options: Record<string, unknown>) => { open: () => void; on: (event: string, cb: (response: unknown) => void) => void };

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

export async function loadRazorpayScript() {
  if (typeof window === "undefined") return false;
  if (window.Razorpay) return true;
  return new Promise<boolean>((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export async function openRazorpayCheckout(orderResponse: RazorpayOrderResponse, user: { name?: string; email?: string; mobile?: string }, onSuccess: (response: RazorpayHandlerResponse) => void, onFailure: () => void) {
  const loaded = await loadRazorpayScript();
  if (!loaded || !window.Razorpay) throw new Error("Unable to load Razorpay checkout");
  const checkout = new window.Razorpay({
    key: orderResponse.keyId,
    amount: orderResponse.order.amount,
    currency: orderResponse.order.currency,
    name: "NIDUS Defence Training",
    description: orderResponse.payment.course?.title ?? "NIDUS payment",
    order_id: orderResponse.order.id,
    prefill: { name: user.name, email: user.email, contact: user.mobile },
    theme: { color: "#0b1f3a" },
    handler: onSuccess,
    modal: { ondismiss: onFailure }
  });
  checkout.open();
}
