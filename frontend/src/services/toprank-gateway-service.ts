import type { TopRankGateway } from "@/types/toprank";

export function getTopRankGateways(): TopRankGateway[] {
  return [
    { id: "agniveer", title: "AGNIVEER", slug: "agniveer", badge: "Admissions Open", description: "A focused gateway for aspirants preparing for Agniveer selection.", status: "ADMISSIONS_OPEN", href: "/toprank/gateway/agniveer", symbol: "AG" },
    { id: "nda", title: "NDA", slug: "nda", badge: "Coming Soon", description: "National Defence Academy pathway, opening soon.", status: "COMING_SOON", href: "/toprank", symbol: "NDA" },
    { id: "cds", title: "CDS", slug: "cds", badge: "Coming Soon", description: "Combined Defence Services pathway, opening soon.", status: "COMING_SOON", href: "/toprank", symbol: "CDS" },
    { id: "afcat", title: "AFCAT", slug: "afcat", badge: "Coming Soon", description: "Air Force Common Admission Test pathway, opening soon.", status: "COMING_SOON", href: "/toprank", symbol: "AF" },
    { id: "capf", title: "CAPF", slug: "capf", badge: "Coming Soon", description: "Central Armed Police Forces pathway, opening soon.", status: "COMING_SOON", href: "/toprank", symbol: "CP" },
    { id: "indian-navy", title: "Indian Navy", slug: "indian-navy", badge: "Coming Soon", description: "Indian Navy preparation gateway, opening soon.", status: "COMING_SOON", href: "/toprank", symbol: "IN" },
    { id: "indian-air-force", title: "Indian Air Force", slug: "indian-air-force", badge: "Coming Soon", description: "Indian Air Force preparation gateway, opening soon.", status: "COMING_SOON", href: "/toprank", symbol: "IAF" },
  ];
}
