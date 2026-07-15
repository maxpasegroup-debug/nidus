"use client";

import { BarChart3, Camera, ClipboardCheck, Globe2, Megaphone, MessageCircle, PhoneCall, Users } from "lucide-react";
import { DirectorLauncher, type DirectorTile } from "@/components/dashboard/director-launcher";

const tiles: DirectorTile[] = [
  {
    label: "Telecallers",
    href: "/dashboard/business-development?tab=TODAY",
    icon: PhoneCall,
    note: "Open calling work, follow-ups and lead handoff.",
  },
  {
    label: "BDE Team",
    href: "/dashboard/business-development?tab=REPORTS",
    icon: Users,
    note: "Review business development work and team pipeline.",
  },
  {
    label: "Sales Booster",
    href: "/dashboard/sales-booster",
    icon: Megaphone,
    note: "Open sales support and booster workflows.",
  },
  {
    label: "Leads",
    href: "/dashboard/business-development?tab=LEADS",
    icon: ClipboardCheck,
    note: "View and manage active lead records.",
  },
  {
    label: "Follow-ups",
    href: "/dashboard/business-development?tab=FOLLOWUPS",
    icon: PhoneCall,
    note: "Check pending calls and next actions.",
  },
  {
    label: "Counselling",
    href: "/dashboard/business-development?tab=READY",
    icon: Users,
    note: "Open counselling pipeline and conversion notes.",
  },
  {
    label: "Campaign Reports",
    href: "/dashboard/business-development?tab=REPORTS",
    icon: BarChart3,
    note: "Review marketing and sales performance signals.",
  },
  {
    label: "Instagram",
    icon: Camera,
    muted: true,
    note: "Reserved for future API connection.",
  },
  {
    label: "Facebook",
    icon: Globe2,
    muted: true,
    note: "Reserved for future API connection.",
  },
  {
    label: "WhatsApp",
    icon: MessageCircle,
    muted: true,
    note: "Reserved for future API connection.",
  },
];

export default function DirectorMarketingSalesPage() {
  return (
    <DirectorLauncher
      eyebrow="Marketing And Sales"
      title="Leads, Calling And Campaigns"
      description="One-touch entry for sales team work, CRM pipeline and future social channel controls."
      tiles={tiles}
      backHref="/dashboard/director"
    />
  );
}
