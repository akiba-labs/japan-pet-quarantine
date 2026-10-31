import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Calculator, VERDICT_LABEL } from "@/components/calculator";
import { EXAMPLE_SHARED, PUBLIC_URL, isIndexable, ogPath, parseShared, resultPath, safeCheck } from "@/lib/share";
import { DISCLAIMER_SHORT, HONESTY } from "@/lib/site";

type SP = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const shared = parseShared(await searchParams);
  const r = shared ? safeCheck(shared) : null;
  if (!shared || !r) return { title: "Your result", robots: { index: false, follow: true } };
  const title = `${r.speciesLabel.split(" (")[0]} ${shared.direction === "import" ? "to Japan" : shared.direction === "export" ? "leaving Japan" : "leaving Japan and back"}: ${VERDICT_LABEL[r.verdict].toLowerCase()}`;
  const description = `${r.summary} Rules as of ${r.rulesAsOf}. Educational, not veterinary or legal advice.`;
  const url = `${PUBLIC_URL}${resultPath(shared)}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: isIndexable(shared) ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: { title, description, type: "website", url, images: [{ url: ogPath(shared), width: 1200, height: 630, alt: title }] },
    twitter: { card: "summary_large_image", title, description, images: [ogPath(shared)] },
  };
}

export default async function ResultPage({ searchParams }: { searchParams: SP }) {
  const shared = parseShared(await searchParams);
  if (!shared) redirect("/");
  const r = safeCheck(shared);
  if (!r) redirect("/");
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-10">
      <section className="max-w-3xl">
        <p className="font-mono text-[11px] tracking-[0.28em] text-amber uppercase">Shared result · Japan Pet Quarantine Check</p>
        <h1 className="mt-3 font-display text-4xl leading-[1.05] tracking-tight sm:text-5xl">{r.summary}</h1>
        <p className="mt-4 text-sm">
          <Link href="/" className="text-muted underline underline-offset-2 hover:text-foreground">
            ← Start over
          </Link>
          {resultPath(shared) === resultPath(EXAMPLE_SHARED) ? null : (
            <>
              {" · "}
              <Link href={resultPath(EXAMPLE_SHARED)} className="text-muted underline underline-offset-2 hover:text-foreground">
                Open the example
              </Link>
            </>
          )}
        </p>
      </section>
      <section className="mt-8">
        <Calculator initial={shared} />
      </section>
      <p className="mt-8 max-w-3xl text-xs leading-relaxed text-muted">
        {DISCLAIMER_SHORT} {HONESTY}
      </p>
    </div>
  );
}
