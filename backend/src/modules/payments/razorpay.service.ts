import crypto from "node:crypto";
import Razorpay from "razorpay";
import { env } from "../../config/env.js";

function assertConfigured() {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay keys are not configured");
  }
}

export const razorpayService = {
  keyId() {
    return env.RAZORPAY_KEY_ID;
  },
  client() {
    assertConfigured();
    return new Razorpay({ key_id: env.RAZORPAY_KEY_ID, key_secret: env.RAZORPAY_KEY_SECRET });
  },
  async createOrder(input: { amount: number; currency: string; receipt: string }) {
    const order = await this.client().orders.create({
      amount: Math.round(input.amount * 100),
      currency: input.currency,
      receipt: input.receipt,
      payment_capture: true
    });
    return order;
  },
  verifySignature(input: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) {
    assertConfigured();
    const expected = crypto
      .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
      .update(`${input.razorpayOrderId}|${input.razorpayPaymentId}`)
      .digest("hex");
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(input.razorpaySignature));
  },
  verifyWebhookSignature(rawBody: string | Buffer, signature: string | undefined) {
    if (!env.RAZORPAY_WEBHOOK_SECRET) throw new Error("Razorpay webhook secret is not configured");
    if (!signature) return false;
    const expected = crypto
      .createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest("hex");
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  }
};
