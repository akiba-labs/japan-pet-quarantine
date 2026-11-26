import type { MetadataRoute } from "next";
import { isGithubPages, pagesSiteUrl } from "@/lib/hosting";
import { EXAMPLES, resultPath } from "@/lib/share";

export const dynamic = "force-static";

const VERCEL_URL = "https://japan-pet-quarantine.vercel.app";
const SITE_URL = isGithubPages ? pagesSiteUrl(VERCEL_URL) : VERCEL_URL;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  if (isGithubPages) {
    return [
      { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
      { url: `${SITE_URL}/legal/disclaimer/`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    ];
  }
  return [
    { url: `${SITE_URL}`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    ...EXAMPLES.map((e, i) => ({ url: `${SITE_URL}${resultPath(e).replace(/&/g, "&amp;")}`, lastModified: now, changeFrequency: "monthly" as const, priority: i ? 0.6 : 0.7 })),
    { url: `${SITE_URL}/legal/disclaimer`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];
}
