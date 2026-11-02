export const SITE_NAME = "Japan Pet Quarantine Check";

export const SITE_TAGLINE =
  "Bringing a dog or cat to Japan, taking it abroad, or leaving and coming back? Get the earliest arrival date (180 days after the antibody blood draw), the 40-day AQS notice deadline, the 10-day vet-check window, the 14-day export application (mandatory for dogs and rabbits from 2027-01-01) and how many days of detention an early arrival means.";

export const DISCLAIMER_SHORT = "Educational date calculator, not veterinary or legal advice, not affiliated with MAFF or the Animal Quarantine Service. AQS decides on your documents; confirm with the AQS office at your port before booking.";

export const HONESTY =
  "Rules as of 2026-10-31 from the MAFF Animal Quarantine Service (import from designated / other regions, export, short stays abroad, the 2027-01-01 notices) and 犬等の輸出入検疫規則. It only uses the dates you enter; it can't see your certificates, your lab result or the destination country's rules.";

export const SIBLING_TOOLS = [
  { href: "https://japan-leaving-tax.vercel.app", label: "Japan Leaving Tax Check" },
  { href: "https://japan-customs-allowance.vercel.app", label: "Japan Customs Allowance" },
  { href: "https://japan-luggage.vercel.app", label: "Japan Luggage Check" },
  { href: "https://japan-reentry-check.vercel.app", label: "Japan Re-entry Deadline Check" },
  { href: "https://japan-mynumber-card-check.vercel.app", label: "Japan My Number Card Check" },
  { href: "https://japan-visa-fee.vercel.app", label: "Japan Visa Fee Calculator" },
  { href: "https://japan-driving-check.vercel.app", label: "Japan Driving Check" },
  { href: "https://japan-intl-postage.vercel.app", label: "Japan Postage Calculator" },
  { href: "https://japan-tax-free-refund.vercel.app", label: "Japan Tax-Free Refund" },
  { href: "https://japan-pr-check.vercel.app", label: "Japan PR Guideline Check" },
  { href: "https://japan-hsp-points.vercel.app", label: "Japan HSP Points Calculator" },
  { href: "https://japan-overseas-dependents.vercel.app", label: "Japan Overseas Dependents Check" },
  { href: "https://japan-parttime-check.vercel.app", label: "Japan Part-time Work Check" },
  { href: "https://japan-tb-screening.vercel.app", label: "Japan TB Screening Check" },
  { href: "https://japan-alert-decoder.vercel.app", label: "Japan Alert Decoder" },
  { href: "https://japan-dual-pricing.vercel.app", label: "Japan Dual Pricing Check" },
  { href: "https://kyushu-travel-discount.vercel.app", label: "Kyushu Travel Discount" },
  { href: "https://house-rules-check.vercel.app", label: "House Rules Check" },
  { href: "https://japan-trip-brain.vercel.app", label: "Japan Trip Brain" },
  { href: "https://free-agent-tools.vercel.app", label: "Free Agent Tools MCP" },
] as const;

export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (production) return `https://${production.replace(/^https?:\/\//, "")}`;
  return "https://japan-pet-quarantine.vercel.app";
}
