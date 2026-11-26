import type { MetadataRoute } from "next";
import { isGithubPages, pagesSiteUrl } from "@/lib/hosting";

export const dynamic = "force-static";

const VERCEL_URL = "https://japan-pet-quarantine.vercel.app";
const SITE_URL = isGithubPages ? pagesSiteUrl(VERCEL_URL) : VERCEL_URL;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
