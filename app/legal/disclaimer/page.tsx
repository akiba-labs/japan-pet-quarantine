import type { Metadata } from "next";
import { RULES_AS_OF, SOURCES } from "@/lib/pet";
import { DISCLAIMER_SHORT, HONESTY } from "@/lib/site";

export const metadata: Metadata = { title: "Disclaimer", description: DISCLAIMER_SHORT };

export default function DisclaimerPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-10">
      <p className="font-mono text-[11px] tracking-[0.28em] text-amber uppercase">Read this</p>
      <h1 className="mt-3 font-display text-4xl leading-[1.05] tracking-tight sm:text-6xl">Disclaimer</h1>
      <p className="mt-4 text-lg text-foreground">{DISCLAIMER_SHORT}</p>
      <p className="mt-2 text-muted">{HONESTY}</p>
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="text-base font-semibold text-foreground">What this is</h2>
          <p className="mt-2">
            A free educational date calculator. It applies a dated reading (as of {RULES_AS_OF}) of the MAFF Animal Quarantine Service (AQS, 動物検疫所) pages for importing dogs and cats from non-designated and designated regions, exporting from Japan, short stays abroad (短期滞在編), the AQS notices on the 2027-01-01 rule changes (家畜伝染病予防法施行規則 amendment) and 犬等の輸出入検疫規則 to the dates you enter.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">What it is not</h2>
          <p className="mt-2">
            It is not veterinary or legal advice and is not affiliated with the Ministry of Agriculture, Forestry and Fisheries (MAFF), the Animal Quarantine Service or any airline. It cannot see your certificates, your lab result, the vaccine&apos;s actual duration of immunity or whether a detention room is free. AQS decides on your documents; the destination country (for exports) and your airline have their own rules. Rabbits: only the dated 2027 deadlines are covered. Always confirm with the AQS office at your port before booking.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">How dates are counted</h2>
          <p className="mt-2">
            As AQS counts them: birth = day 0 (first rabies shot from day 91), shot #1 = day 0 (shot #2 from day 30), blood draw = day 0 (arrival from day 180). The 40-day notice date is the arrival date minus 40 days; the 14-day export application date is the departure minus 14 days; the 10-day windows run from the travel date minus 10 days to the travel date. Shot #1&apos;s effective period is assumed to be 1 year unless you give it. The antibody result is treated as valid to the same date 2 years after the draw. Detention days for an early arrival = 180 minus the days since the draw (AQS does not count the arrival or release day). Treat every date as the latest safe day, not a target.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">Sources</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {SOURCES.map((s) => (
              <li key={s}>
                <a href={s} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">
                  {s}
                </a>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">Your data</h2>
          <p className="mt-2">The dates you enter stay in your browser (or in a share link you create). No login, no names, no database. A microchip number, if you enter one in the API, is only checked for format and never stored.</p>
        </section>
      </div>
    </div>
  );
}
