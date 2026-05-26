import { env } from "../../config/env.js";

type ConnectorCampaign = {
  id: string;
  title: string;
  track: string;
  goal: string;
  creativeName?: string | null;
  creativeType?: string | null;
  channels: unknown;
  aiDraft: unknown;
};

type ConnectorResult = {
  channel: string;
  status: "POSTED" | "QUEUED" | "SKIPPED" | "FAILED" | "NOT_CONFIGURED";
  message: string;
  externalId?: string;
  details?: Record<string, unknown>;
};

const graphBaseUrl = "https://graph.facebook.com/v21.0";

function draftObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function channelsFor(value: unknown) {
  return Array.isArray(value) ? value.map(String) : [];
}

function campaignMessage(campaign: ConnectorCampaign) {
  const draft = draftObject(campaign.aiDraft);
  return [
    String(draft.hook ?? campaign.title),
    "",
    String(draft.caption ?? campaign.goal),
    "",
    `CTA: ${String(draft.cta ?? "Start Free")}`
  ].join("\n").trim();
}

function hasMediaUrl(campaign: ConnectorCampaign) {
  const draft = draftObject(campaign.aiDraft);
  const mediaUrl = draft.mediaUrl ?? draft.creativeUrl;
  return typeof mediaUrl === "string" && /^https?:\/\//.test(mediaUrl);
}

function mediaUrl(campaign: ConnectorCampaign) {
  const draft = draftObject(campaign.aiDraft);
  const media = draft.mediaUrl ?? draft.creativeUrl;
  return typeof media === "string" ? media : "";
}

async function postForm(url: string, payload: Record<string, string>) {
  const body = new URLSearchParams(payload);
  const response = await fetch(url, { method: "POST", body });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof data?.error?.message === "string" ? data.error.message : `HTTP ${response.status}`);
  return data as { id?: string };
}

async function runFacebook(campaign: ConnectorCampaign): Promise<ConnectorResult> {
  if (!env.SALESBOOSTER_META_ACCESS_TOKEN || !env.SALESBOOSTER_META_PAGE_ID) {
    return { channel: "Facebook", status: "NOT_CONFIGURED", message: "Meta page id/access token not configured." };
  }
  const data = await postForm(`${graphBaseUrl}/${env.SALESBOOSTER_META_PAGE_ID}/feed`, {
    access_token: env.SALESBOOSTER_META_ACCESS_TOKEN,
    message: campaignMessage(campaign)
  });
  return { channel: "Facebook", status: "POSTED", message: "Facebook page post published.", externalId: data.id };
}

async function runInstagram(campaign: ConnectorCampaign): Promise<ConnectorResult> {
  if (!env.SALESBOOSTER_META_ACCESS_TOKEN || !env.SALESBOOSTER_INSTAGRAM_USER_ID) {
    return { channel: "Instagram", status: "NOT_CONFIGURED", message: "Instagram user id/access token not configured." };
  }
  if (!hasMediaUrl(campaign)) {
    return { channel: "Instagram", status: "SKIPPED", message: "Instagram publishing requires a public image/video URL. Current phase has only the creative filename." };
  }
  const draft = draftObject(campaign.aiDraft);
  const container = await postForm(`${graphBaseUrl}/${env.SALESBOOSTER_INSTAGRAM_USER_ID}/media`, {
    access_token: env.SALESBOOSTER_META_ACCESS_TOKEN,
    image_url: mediaUrl(campaign),
    caption: String(draft.caption ?? campaignMessage(campaign))
  });
  if (!container.id) throw new Error("Instagram media container id missing.");
  const publish = await postForm(`${graphBaseUrl}/${env.SALESBOOSTER_INSTAGRAM_USER_ID}/media_publish`, {
    access_token: env.SALESBOOSTER_META_ACCESS_TOKEN,
    creation_id: container.id
  });
  return { channel: "Instagram", status: "POSTED", message: "Instagram media published.", externalId: publish.id, details: { containerId: container.id } };
}

async function runThreads(campaign: ConnectorCampaign): Promise<ConnectorResult> {
  if (!env.SALESBOOSTER_THREADS_ACCESS_TOKEN || !env.SALESBOOSTER_THREADS_USER_ID) {
    return { channel: "Threads", status: "NOT_CONFIGURED", message: "Threads user id/access token not configured." };
  }
  const create = await postForm(`${graphBaseUrl}/${env.SALESBOOSTER_THREADS_USER_ID}/threads`, {
    access_token: env.SALESBOOSTER_THREADS_ACCESS_TOKEN,
    media_type: "TEXT",
    text: campaignMessage(campaign)
  });
  if (!create.id) throw new Error("Threads creation id missing.");
  const publish = await postForm(`${graphBaseUrl}/${env.SALESBOOSTER_THREADS_USER_ID}/threads_publish`, {
    access_token: env.SALESBOOSTER_THREADS_ACCESS_TOKEN,
    creation_id: create.id
  });
  return { channel: "Threads", status: "POSTED", message: "Threads post published.", externalId: publish.id, details: { containerId: create.id } };
}

async function runYouTube(campaign: ConnectorCampaign): Promise<ConnectorResult> {
  if (!env.SALESBOOSTER_YOUTUBE_ACCESS_TOKEN || !env.SALESBOOSTER_YOUTUBE_CHANNEL_ID) {
    return { channel: "YouTube", status: "NOT_CONFIGURED", message: "YouTube channel/access token not configured." };
  }
  if (!hasMediaUrl(campaign)) {
    return { channel: "YouTube", status: "SKIPPED", message: "YouTube upload requires a stored video asset URL or resumable upload stream." };
  }
  return { channel: "YouTube", status: "QUEUED", message: "YouTube credentials are configured; video upload is queued for resumable upload worker phase.", details: { channelId: env.SALESBOOSTER_YOUTUBE_CHANNEL_ID } };
}

async function runWhatsApp(campaign: ConnectorCampaign): Promise<ConnectorResult> {
  if (!env.SALESBOOSTER_WHATSAPP_ACCESS_TOKEN || !env.SALESBOOSTER_WHATSAPP_PHONE_NUMBER_ID) {
    return { channel: "WhatsApp", status: "NOT_CONFIGURED", message: "WhatsApp Cloud API token/phone number id not configured." };
  }
  const recipients = env.SALESBOOSTER_DEFAULT_WHATSAPP_RECIPIENTS.split(",").map((item) => item.trim()).filter(Boolean);
  if (!recipients.length) {
    return { channel: "WhatsApp", status: "SKIPPED", message: "No opted-in WhatsApp recipients configured. Add approved opt-in recipients or CRM segment in the next step." };
  }

  const results = [];
  for (const recipient of recipients.slice(0, 25)) {
    const response = await fetch(`${graphBaseUrl}/${env.SALESBOOSTER_WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.SALESBOOSTER_WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: recipient,
        type: "template",
        template: {
          name: env.SALESBOOSTER_WHATSAPP_TEMPLATE_NAME,
          language: { code: "en" }
        }
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(typeof data?.error?.message === "string" ? data.error.message : `WhatsApp HTTP ${response.status}`);
    results.push(data);
  }

  return { channel: "WhatsApp", status: "QUEUED", message: `WhatsApp template queued for ${results.length} opted-in recipient(s).`, details: { recipients: results.length } };
}

async function safeRun(channel: string, fn: () => Promise<ConnectorResult>): Promise<ConnectorResult> {
  try {
    return await fn();
  } catch (error) {
    return { channel, status: "FAILED", message: error instanceof Error ? error.message : "Connector failed." };
  }
}

export const salesBoosterConnectors = {
  status() {
    return {
      Facebook: Boolean(env.SALESBOOSTER_META_ACCESS_TOKEN && env.SALESBOOSTER_META_PAGE_ID),
      Instagram: Boolean(env.SALESBOOSTER_META_ACCESS_TOKEN && env.SALESBOOSTER_INSTAGRAM_USER_ID),
      Threads: Boolean(env.SALESBOOSTER_THREADS_ACCESS_TOKEN && env.SALESBOOSTER_THREADS_USER_ID),
      YouTube: Boolean(env.SALESBOOSTER_YOUTUBE_ACCESS_TOKEN && env.SALESBOOSTER_YOUTUBE_CHANNEL_ID),
      WhatsApp: Boolean(env.SALESBOOSTER_WHATSAPP_ACCESS_TOKEN && env.SALESBOOSTER_WHATSAPP_PHONE_NUMBER_ID)
    };
  },

  async run(campaign: ConnectorCampaign) {
    const selected = new Set(channelsFor(campaign.channels));
    const tasks: Array<Promise<ConnectorResult>> = [];
    if (selected.has("Facebook")) tasks.push(safeRun("Facebook", () => runFacebook(campaign)));
    if (selected.has("Instagram")) tasks.push(safeRun("Instagram", () => runInstagram(campaign)));
    if (selected.has("Threads")) tasks.push(safeRun("Threads", () => runThreads(campaign)));
    if (selected.has("YouTube")) tasks.push(safeRun("YouTube", () => runYouTube(campaign)));
    if (selected.has("WhatsApp")) tasks.push(safeRun("WhatsApp", () => runWhatsApp(campaign)));
    return Promise.all(tasks);
  }
};

export type { ConnectorResult };
