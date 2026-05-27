import { callOpenAIJson } from "../ai-engine/openai.service.js";

type GenerateInput = {
  track: string;
  goal: string;
  audience?: string;
  budget?: string;
  creativeName?: string;
  creativeType?: string;
  channels?: string[];
};

type ChannelCopy = {
  channel: string;
  headline: string;
  caption: string;
  hashtags: string[];
  cta: string;
  notes: string;
};

export type SalesBoosterAIDraft = {
  hook: string;
  caption: string;
  audience: string;
  cta: string;
  whatsapp: string;
  hashtags: string[];
  budgetSuggestion: string;
  targeting: string[];
  postingPlan: string[];
  channelCopies: ChannelCopy[];
  safetyNotes: string[];
};

const defaultChannels = ["Facebook", "Instagram", "Threads", "YouTube", "WhatsApp"];

function cleanChannels(channels?: string[]) {
  const selected = channels?.map(String).filter(Boolean) ?? [];
  return selected.length ? selected : defaultChannels;
}

function trackIntent(track: string) {
  if (/toprank/i.test(track)) return "AI-powered defence exam coaching with Rs 2,999 + GST monthly 24x7 AI trainer access";
  if (/guru/i.test(track)) return "active learning transformation quests for focus, discipline and personal growth";
  if (/assessment/i.test(track)) return "free psychometric and defence readiness assessments for lead generation";
  return "academy admissions, counselling, physical campus training and defence preparation";
}

function fallbackDraft(input: GenerateInput): SalesBoosterAIDraft {
  const channels = cleanChannels(input.channels);
  const intent = trackIntent(input.track);
  const audience = input.audience?.trim() || "Kerala defence aspirants, parents, and students preparing for NDA, CDS, AFCAT, AISSEE, SSB or Agniveer";
  const baseCaption = `${input.goal.trim() || `Promote ${input.track}`} Keep the message simple for parents, build trust, and guide users to Start Free before counselling.`;
  return {
    hook: /toprank/i.test(input.track) ? "Train for rank, not just marks." : "Your uniform journey can start with one clear step.",
    caption: `${baseCaption} NIDUS Academy supports ${intent}.`,
    audience,
    cta: /assessment/i.test(input.track) ? "Start Free Assessment" : /academy/i.test(input.track) ? "Apply for Counselling" : "Start Free",
    whatsapp: `Hello NIDUS Academy, I am interested in ${input.track}. Please guide me with the next step.`,
    hashtags: ["#NIDUSAcademy", "#DefenceAspirants", "#NDA", "#KeralaStudents", "#OfficerJourney"],
    budgetSuggestion: input.budget?.trim() || "Start with a focused daily budget, test one reel and one poster, then increase budget on the better CPL.",
    targeting: [
      "Kerala students and parents",
      "NDA, CDS, AFCAT, AISSEE, Agniveer and SSB interests",
      "Age 15-24 for students, 35-55 for parents",
      "Retarget Start Free visitors and assessment starters"
    ],
    postingPlan: [
      "Day 1: publish poster with parent-friendly caption",
      "Day 2: publish short reel/video with direct CTA",
      "Day 3: WhatsApp follow-up to opted-in leads",
      "Day 4: retarget engaged users with counselling CTA"
    ],
    channelCopies: channels.map((channel) => ({
      channel,
      headline: channel === "WhatsApp" ? `NIDUS ${input.track} enquiry` : `NIDUS ${input.track}`,
      caption: channel === "WhatsApp" ? `Hello, NIDUS Academy can guide you on ${input.track}. Reply YES for counselling support.` : baseCaption,
      hashtags: channel === "WhatsApp" ? [] : ["#NIDUSAcademy", "#DefenceCareer", "#StartFree"],
      cta: channel === "WhatsApp" ? "Reply YES" : "Start Free",
      notes: channel === "YouTube" ? "Use this as title/description direction for Shorts or long-form video." : "Review tone and local details before approval."
    })),
    safetyNotes: [
      "Use only approved WhatsApp templates for bulk messages.",
      "Avoid guaranteed selection claims.",
      "Keep pricing and offer details accurate before publishing.",
      "Human approval is required before running campaigns."
    ]
  };
}

const instructions = `
You are NIDUS Academy's Sales Booster AI for a premium Indian defence academy.
Generate a concise, parent-friendly campaign draft for Academy admissions, TOPRANK AI coaching, NIDUS Guru, or free assessments.
Do not sound like a generic SaaS tool. Do not promise guaranteed selection.
Keep English simple and trustworthy for Indian parents and students.
Return ONLY valid JSON matching:
{
  "hook": string,
  "caption": string,
  "audience": string,
  "cta": string,
  "whatsapp": string,
  "hashtags": string[],
  "budgetSuggestion": string,
  "targeting": string[],
  "postingPlan": string[],
  "channelCopies": [{"channel": string, "headline": string, "caption": string, "hashtags": string[], "cta": string, "notes": string}],
  "safetyNotes": string[]
}
`;

export const salesBoosterAIService = {
  async generateCampaign(input: GenerateInput) {
    const fallback = fallbackDraft(input);
    return callOpenAIJson<SalesBoosterAIDraft>(instructions, JSON.stringify({
      ...input,
      channels: cleanChannels(input.channels),
      brand: "NIDUS Academy",
      positioning: "AI-powered defence career and performance ecosystem",
      rule: "simple, precise, human-approved, no guaranteed results"
    }), fallback);
  }
};
