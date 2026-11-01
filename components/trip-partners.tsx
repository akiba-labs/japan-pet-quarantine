/**
 * Optional "trip partners" affiliate block. Hidden by default: it renders nothing until at least one
 * AFF_*_URL environment variable is set in Vercel (then redeploy). Links are rel="sponsored", sit below
 * the tool, and never change any result.
 */
const PARTNERS = [
  { env: "AFF_ESIM_URL", label: "Japan eSIM", note: "data from the moment you land" },
  { env: "AFF_KLOOK_URL", label: "Klook Japan", note: "tickets, passes and airport transfers" },
  { env: "AFF_JRPASS_URL", label: "JR Pass", note: "check whether a rail pass pays off" },
  { env: "AFF_HOTELS_URL", label: "Japan hotels", note: "compare stays" },
] as const;

export function TripPartners() {
  const links = PARTNERS.map((p) => ({ ...p, url: (process.env[p.env] ?? "").trim() })).filter((p) =>
    p.url.startsWith("https://"),
  );
  if (links.length === 0) return null;
  return (
    <section id="trip-partners" className="mt-16 max-w-3xl">
      <h2 className="font-display text-2xl tracking-tight sm:text-3xl">Planning the trip?</h2>
      <ul className="mt-4 divide-y divide-line border-y border-line">
        {links.map((p) => (
          <li key={p.env} className="py-3 text-sm sm:text-base">
            <a className="font-medium text-foreground underline underline-offset-2" href={p.url} target="_blank" rel="sponsored nofollow noopener noreferrer">
              {p.label}
            </a>
            <span className="text-muted"> · {p.note}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-muted">
        Affiliate links: we may earn a commission at no extra cost to you. They don&apos;t affect this tool&apos;s results.
      </p>
    </section>
  );
}
