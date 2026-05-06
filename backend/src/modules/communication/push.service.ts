export const pushService = {
  async sendFirebasePlaceholder(input: { title: string; body: string; targetAudience: string }) {
    console.log("[FIREBASE_PUSH_PLACEHOLDER]", input);
    return { provider: "FIREBASE_PLACEHOLDER", status: "QUEUED_PLACEHOLDER" };
  },
  async sendMobilePushPlaceholder(input: { title: string; body: string; targetAudience: string }) {
    console.log("[MOBILE_PUSH_PLACEHOLDER]", input);
    return { provider: "MOBILE_PUSH_PLACEHOLDER", status: "QUEUED_PLACEHOLDER" };
  }
};
