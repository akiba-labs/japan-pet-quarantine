/** GitHub Pages static export. Unset for the Vercel build, so link helpers stay no-ops. */
export const isGithubPages = process.env.NEXT_PUBLIC_GITHUB_PAGES === "1";

export const API_PAUSED_NOTE = "The agent API returns when hosting is back.";

/** Site origin for this build. Falls back to the Vercel URL when Pages env is unset. */
export function pagesSiteUrl(fallback: string): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  return fallback.replace(/\/$/, "");
}

function looksLikeFile(path: string): boolean {
  const segment = path.split("?")[0].split("#")[0].split("/").pop() ?? "";
  return segment.includes(".");
}

/**
 * Prefix root-relative URLs for a GitHub Pages project site.
 * The Vercel build leaves them unchanged, including no added trailing slash.
 */
export function withBasePath(path: string): string {
  if (!path.startsWith("/")) return path;
  const base = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/$/, "");
  let href = `${base}${path}`;
  if (isGithubPages && !looksLikeFile(path) && !href.endsWith("/")) href += "/";
  return href;
}
