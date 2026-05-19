import assert from "node:assert/strict";
import crypto from "node:crypto";
import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env.js";
import { assertCloudinaryReady, cloudinaryConfig, signedMediaUrl } from "../config/cloudinary.js";
import { razorpayService } from "../modules/payments/razorpay.service.js";

const executeNetworkChecks = process.argv.includes("--network");

function configured(...values: string[]) {
  return values.every((value) => value.trim().length > 0);
}

const readiness = {
  cloudinary: {
    configured: configured(env.CLOUDINARY_CLOUD_NAME, env.CLOUDINARY_API_KEY, env.CLOUDINARY_API_SECRET),
    networkVerified: false
  },
  resend: {
    configured: configured(env.RESEND_API_KEY, env.RESEND_FROM_EMAIL)
  },
  razorpay: {
    configured: configured(env.RAZORPAY_KEY_ID, env.RAZORPAY_KEY_SECRET, env.RAZORPAY_WEBHOOK_SECRET),
    signatureVerified: false,
    webhookSignatureVerified: false
  },
  openai: {
    configured: configured(env.OPENAI_API_KEY)
  }
};

if (env.NODE_ENV === "production") {
  assert.equal(readiness.cloudinary.configured, true, "Cloudinary credentials are required in production");
  assert.equal(readiness.resend.configured, true, "Resend credentials are required in production");
  assert.equal(readiness.razorpay.configured, true, "Razorpay keys and webhook secret are required in production");
  assert.equal(readiness.openai.configured, true, "OpenAI API key is required in production");
}

if (readiness.cloudinary.configured) {
  assert.equal(assertCloudinaryReady(), true, "Cloudinary config should be ready");
  const signed = signedMediaUrl("nidus/readiness-check", "image/png");
  assert.ok(signed.includes(cloudinaryConfig.cloudName), "signed media URL should include the configured Cloudinary cloud");

  if (executeNetworkChecks) {
    await cloudinary.api.ping();
    readiness.cloudinary.networkVerified = true;
  }
}

if (readiness.razorpay.configured) {
  const orderId = "order_readiness";
  const paymentId = "pay_readiness";
  const signature = crypto.createHmac("sha256", env.RAZORPAY_KEY_SECRET).update(`${orderId}|${paymentId}`).digest("hex");
  readiness.razorpay.signatureVerified = razorpayService.verifySignature({
    razorpayOrderId: orderId,
    razorpayPaymentId: paymentId,
    razorpaySignature: signature
  });

  const webhookBody = JSON.stringify({ event: "payment.captured", payload: { readiness: true } });
  const webhookSignature = crypto.createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET).update(webhookBody).digest("hex");
  readiness.razorpay.webhookSignatureVerified = razorpayService.verifyWebhookSignature(webhookBody, webhookSignature);
  assert.equal(readiness.razorpay.signatureVerified, true, "Razorpay payment signature verification failed");
  assert.equal(readiness.razorpay.webhookSignatureVerified, true, "Razorpay webhook signature verification failed");
}

console.log(JSON.stringify({ executeNetworkChecks, ...readiness }));
