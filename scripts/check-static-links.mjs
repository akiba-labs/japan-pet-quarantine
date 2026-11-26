/**
 * Fail if the static export links to a missing page or asset,
 * or if an internal URL is missing the GitHub Pages basePath.
 *
 *   node scripts/check-static-links.mjs out --base /japan-visa-fee --site https://akiba-labs.github.io/japan-visa-fee
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { isAbsolute, join, relative, sep } from "node:path";

const args = process.argv.slice(2);
const outDir = args.find((arg) => !arg.startsWith("--"));
function flag(name) {
  const i = args.indexOf(name);
  return i === -1 ? "" : args[i + 1] || "";
}
const base = flag("--base").replace(/\/$/, "");
const site = flag("--site").replace(/\/$/, "");

if (!outDir || !base || !site) {
  console.error("usage: check-static-links.mjs <out-dir> --base /repo --site https://owner.github.io/repo");
  process.exit(2);
}
if (!existsSync(outDir)) {
  console.error(`missing export directory: ${outDir}`);
  process.exit(2);
}

const siteUrl = new URL(site);
const failures = [];
let links = 0;

function walk(dir, accept, acc = []) {
  for (const name of readdirSync(dir)) {
    const abs = join(dir, name);
    if (statSync(abs).isDirectory()) walk(abs, accept, acc);
    else if (accept(name)) acc.push(abs);
  }
  return acc;
}

function decode(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

const OMITTED = /^\/(?:api(?:\/|$)|openapi\.json$|r(?:\/|$)|og(?:\/|$)|\.well-known(?:\/|$))/;

function pageUrl(file) {
  let rel = relative(outDir, file).split(sep).join("/");
  if (rel === "index.html") return `${base}/`;
  if (rel.endsWith("/index.html")) return `${base}/${rel.slice(0, -"index.html".length)}`;
  return `${base}/${rel}`;
}

function attrs(tag) {
  const out = {};
  const re = /([^\s=<>/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  for (const match of tag.matchAll(re)) {
    const key = match[1].toLowerCase();
    if (key.startsWith("<") || key.startsWith("/")) continue;
    out[key] = match[2] ?? match[3] ?? match[4] ?? "";
  }
  return out;
}

function classify(raw, fromPath) {
  const value = decode(raw.trim());
  if (
    !value ||
    value.startsWith("#") ||
    value.startsWith("mailto:") ||
    value.startsWith("tel:") ||
    value.startsWith("javascript:") ||
    value.startsWith("data:")
  ) {
    return null;
  }
  let url;
  try {
    if (value.startsWith("//")) url = new URL(`https:${value}`);
    else if (/^[a-z][a-z0-9+.-]*:/i.test(value)) url = new URL(value);
    else if (value.startsWith("/")) url = new URL(value, "https://pages.local");
    else url = new URL(value, `https://pages.local${fromPath}`);
  } catch {
    return { error: `unparseable URL ${raw}` };
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  const internal = url.host === "pages.local" || url.host === siteUrl.host;
  if (!internal) return null;
  if (url.host === siteUrl.host && url.pathname !== base && !url.pathname.startsWith(`${base}/`)) {
    return { error: `same-host link outside project path: ${value}` };
  }
  return { pathname: url.pathname };
}

function resolvePath(pathname) {
  if (pathname !== base && !pathname.startsWith(`${base}/`)) {
    return { error: `missing basePath: ${pathname}` };
  }
  const relPath = pathname === base ? "/" : pathname.slice(base.length);
  if (OMITTED.test(relPath)) return { error: `link to omitted route: ${pathname}` };
  const rel = relPath.replace(/^\/+/, "");
  if (rel === "" || rel.endsWith("/")) {
    const file = join(outDir, rel, "index.html");
    return safeFile(file) ? { file } : { error: `missing ${pathname}` };
  }
  const asFile = join(outDir, rel);
  if (safeFile(asFile) && statSync(asFile).isFile()) return { file: asFile };
  const asIndex = join(outDir, rel, "index.html");
  if (safeFile(asIndex)) return { file: asIndex };
  return { error: `missing ${pathname}` };
}

function safeFile(file) {
  if (!existsSync(file)) return false;
  const rel = relative(outDir, file);
  return rel !== "" && !rel.startsWith(`..${sep}`) && !rel.startsWith("..") && !isAbsolute(rel);
}

function checkUrl(raw, fromFile, fromPath) {
  const classified = classify(raw, fromPath);
  if (!classified) return;
  links += 1;
  if (classified.error) {
    failures.push(`${relative(outDir, fromFile)}: ${classified.error}`);
    return;
  }
  const resolved = resolvePath(classified.pathname);
  if (resolved.error) failures.push(`${relative(outDir, fromFile)}: ${resolved.error} (from ${raw})`);
}

function checkHtml(file) {
  const html = readFileSync(file, "utf8");
  const fromPath = pageUrl(file);
  const doubled = `${base}${base}`;
  if (html.includes(doubled)) failures.push(`${relative(outDir, file)}: doubled basePath ${doubled}`);
  const tags = html.match(/<[^>]+>/g) || [];
  for (const tag of tags) {
    const a = attrs(tag);
    const name = /^<\/?([a-z0-9:-]+)/i.exec(tag)?.[1]?.toLowerCase() ?? "";
    if (a.href) checkUrl(a.href, file, fromPath);
    if (a.src) checkUrl(a.src, file, fromPath);
    if (a.srcset) {
      for (const part of a.srcset.split(",")) {
        const url = part.trim().split(/\s+/)[0];
        if (url) checkUrl(url, file, fromPath);
      }
    }
    if (name === "meta" && a.content && /image|url/i.test(`${a.property || ""} ${a.name || ""}`)) {
      if (/^(https?:|\/|\.\.?\/)/.test(a.content)) checkUrl(a.content, file, fromPath);
    }
  }
  return html;
}

function checkCss(file) {
  const css = readFileSync(file, "utf8");
  const fromPath = pageUrl(file).replace(/[^/]+$/, "");
  for (const match of css.matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g)) {
    if (match[2].startsWith("data:")) continue;
    checkUrl(match[2], file, fromPath);
  }
}

const htmlFiles = walk(outDir, (name) => name.endsWith(".html"));
const cssFiles = walk(outDir, (name) => name.endsWith(".css"));
let home = "";
for (const file of htmlFiles) {
  const html = checkHtml(file);
  if (relative(outDir, file) === "index.html") home = html;
}
for (const file of cssFiles) checkCss(file);

if (!existsSync(join(outDir, ".nojekyll"))) failures.push("missing out/.nojekyll");

const canonical = /<link[^>]*rel=["']canonical["'][^>]*>/i.exec(home)?.[0] || "";
const canonicalHref = attrs(canonical).href || "";
if (!canonicalHref.startsWith(`${site}/`) && canonicalHref !== site) {
  failures.push(`homepage canonical is ${canonicalHref || "missing"}; expected ${site}/`);
}
if (home.includes("vercel.app") && /href=["'][^"']*vercel\.app/.test(home)) {
  // Sibling tools and external docs may link to vercel.app. Only this app's API paths are dead.
}
if (!home.includes(`${base}/_next/`)) failures.push(`homepage assets are not prefixed with ${base}/_next/`);

const sitemapPath = join(outDir, "sitemap.xml");
const robotsPath = join(outDir, "robots.txt");
if (!existsSync(sitemapPath)) failures.push("missing sitemap.xml");
else {
  const xml = readFileSync(sitemapPath, "utf8");
  if (xml.includes("vercel.app")) failures.push("sitemap still points at vercel.app");
  if (xml.includes("/r?") || xml.includes("/r&") || xml.includes("/og?")) failures.push("sitemap lists an omitted share or og URL");
  const locs = [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((match) => decode(match[1]));
  if (locs.length === 0) failures.push("sitemap has no <loc>");
  for (const loc of locs) {
    if (!loc.startsWith(`${site}/`) && loc !== site) failures.push(`sitemap loc outside site: ${loc}`);
    else checkUrl(loc, sitemapPath, `${base}/`);
  }
}
if (!existsSync(robotsPath)) failures.push("missing robots.txt");
else {
  const robots = readFileSync(robotsPath, "utf8");
  if (!robots.includes(`${site}/sitemap.xml`)) failures.push(`robots.txt sitemap is not ${site}/sitemap.xml`);
  if (robots.includes("vercel.app")) failures.push("robots.txt still points at vercel.app");
}

const unique = [...new Set(failures)];
if (unique.length) {
  console.error(`Link check failed (${unique.length}):`);
  for (const failure of unique) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `Link check OK: ${htmlFiles.length} HTML, ${cssFiles.length} CSS, ${links} internal URLs, canonical ${canonicalHref}, base ${base}`,
);
