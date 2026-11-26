/**
 * Static export for GitHub Pages (`GITHUB_PAGES=1`).
 *
 * The Vercel build stays `next build` and keeps API routes, OpenAPI,
 * .well-known, dynamic /og, and /r share pages. This script moves those
 * files aside for one `next build`, then always puts them back.
 *
 * Sibling tool repos (same shape, different package name):
 * 1. Copy scripts/build-pages.mjs, scripts/check-static-links.mjs,
 *    lib/hosting.ts, and .github/workflows/pages.yml unchanged.
 * 2. package.json "name" must match the GitHub repo name. Add
 *    "build:pages": "node scripts/build-pages.mjs".
 * 3. In next.config.ts, when GITHUB_PAGES=1 set output:"export",
 *    images.unoptimized, trailingSlash:true, and basePath/assetPrefix
 *    from NEXT_PUBLIC_BASE_PATH (fallback: /${package name}).
 * 4. Add `export const dynamic = "force-static"` on opengraph-image,
 *    robots, and sitemap if the export reports those routes as dynamic.
 * 5. List pages that read searchParams (this repo: app/r) in EXTRA_STASH.
 *    Route handlers (route.ts/js) are stashed automatically.
 * 6. When NEXT_PUBLIC_GITHUB_PAGES=1, point /r links at the calculator
 *    and replace API/OpenAPI links with hosting.API_PAUSED_NOTE.
 *    Prefix raw <a href="/..."> with withBasePath (next/link already
 *    applies basePath). Keep sitemap/robots/metadataBase on
 *    NEXT_PUBLIC_SITE_URL for the Pages build only.
 * 7. npm run build:pages must pass the link check. In GitHub:
 *    Settings → Pages → Source: GitHub Actions.
 * 8. Do not delete the server routes. npm run build / Vercel stays as-is.
 */
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  rmdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const stashRoot = join(root, ".pages-export-stash");
const manifestPath = join(stashRoot, "manifest.json");

/** Pages that cannot be prerendered. Route handlers are discovered. */
const EXTRA_STASH = ["app/r"];

let restored = false;

function listRouteHandlers(appDir) {
  const found = [];
  if (!existsSync(appDir)) return found;
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const abs = join(dir, name);
      if (statSync(abs).isDirectory()) walk(abs);
      else if (/^route\.(tsx|ts|jsx|js)$/.test(name)) found.push(relative(root, abs));
    }
  };
  walk(appDir);
  return found;
}

function collapse(rels) {
  const sorted = [...new Set(rels)].sort();
  return sorted.filter((rel) => !sorted.some((other) => other !== rel && rel.startsWith(`${other}/`)));
}

function removeEmptyDirs(dir, top) {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    const abs = join(dir, name);
    if (statSync(abs).isDirectory()) removeEmptyDirs(abs, top);
  }
  if (dir !== top && readdirSync(dir).length === 0) rmdirSync(dir);
}

function restore() {
  if (restored) return;
  restored = true;
  if (!existsSync(manifestPath)) {
    if (existsSync(stashRoot)) rmSync(stashRoot, { recursive: true, force: true });
    return;
  }
  const rels = JSON.parse(readFileSync(manifestPath, "utf8"));
  for (const rel of [...rels].reverse()) {
    const from = join(stashRoot, rel);
    const to = join(root, rel);
    if (!existsSync(from)) continue;
    if (existsSync(to)) {
      console.error(`cannot restore ${rel}; ${to} already exists`);
      process.exitCode = 1;
      continue;
    }
    mkdirSync(dirname(to), { recursive: true });
    renameSync(from, to);
  }
  rmSync(stashRoot, { recursive: true, force: true });
}

function stash() {
  const rels = collapse([
    ...EXTRA_STASH.filter((rel) => existsSync(join(root, rel))),
    ...listRouteHandlers(join(root, "app")),
  ]);
  mkdirSync(stashRoot, { recursive: true });
  writeFileSync(manifestPath, JSON.stringify(rels, null, 2));
  for (const rel of rels) {
    const from = join(root, rel);
    const to = join(stashRoot, rel);
    mkdirSync(dirname(to), { recursive: true });
    renameSync(from, to);
  }
  removeEmptyDirs(join(root, "app"), join(root, "app"));
  console.log(rels.length ? `Stashed for static export:\n- ${rels.join("\n- ")}` : "Nothing to stash.");
  return rels;
}

function pagesEnv() {
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  const repoName = process.env.PAGES_REPOSITORY?.trim() || pkg.name;
  const owner = process.env.PAGES_OWNER?.trim() || "akiba-labs";
  const env = { ...process.env };
  env.GITHUB_PAGES = "1";
  env.NEXT_PUBLIC_GITHUB_PAGES = "1";
  if (!env.NEXT_PUBLIC_BASE_PATH?.trim()) env.NEXT_PUBLIC_BASE_PATH = `/${repoName}`;
  if (!env.NEXT_PUBLIC_SITE_URL?.trim()) {
    env.NEXT_PUBLIC_SITE_URL = `https://${owner}.github.io/${repoName}`;
  }
  const base = env.NEXT_PUBLIC_BASE_PATH.startsWith("/")
    ? env.NEXT_PUBLIC_BASE_PATH
    : `/${env.NEXT_PUBLIC_BASE_PATH}`;
  env.NEXT_PUBLIC_BASE_PATH = base.replace(/\/$/, "");
  env.NEXT_PUBLIC_SITE_URL = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  return env;
}

function writeNojekyll() {
  writeFileSync(join(root, "out", ".nojekyll"), "");
}

function annotateLlms() {
  const file = join(root, "out", "llms.txt");
  if (!existsSync(file)) return;
  const banner = [
    "> Static GitHub Pages copy. The calculator on this site works.",
    "> The agent API returns when hosting is back. The JSON API, OpenAPI, plugin manifest, share-result links, and preview images below are part of that API.",
    "",
    "",
  ].join("\n");
  writeFileSync(file, banner + readFileSync(file, "utf8"));
}

process.on("SIGINT", () => {
  restore();
  process.exit(130);
});
process.on("SIGTERM", () => {
  restore();
  process.exit(143);
});

restore();
restored = false;

const env = pagesEnv();
let code = 1;
try {
  stash();
  rmSync(join(root, ".next"), { recursive: true, force: true });
  rmSync(join(root, "out"), { recursive: true, force: true });
  const nextBin = join(root, "node_modules", ".bin", "next");
  const built = spawnSync(nextBin, ["build"], { cwd: root, env, stdio: "inherit" });
  if (built.error) throw built.error;
  code = built.status ?? 1;
  if (code === 0) {
    writeNojekyll();
    annotateLlms();
    const checked = spawnSync(
      process.execPath,
      [
        join(root, "scripts", "check-static-links.mjs"),
        join(root, "out"),
        "--base",
        env.NEXT_PUBLIC_BASE_PATH,
        "--site",
        env.NEXT_PUBLIC_SITE_URL,
      ],
      { cwd: root, stdio: "inherit" },
    );
    if (checked.error) throw checked.error;
    code = checked.status ?? 1;
  }
} finally {
  restore();
}

process.exit(code);
