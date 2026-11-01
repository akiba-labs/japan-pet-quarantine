import type { Metadata } from "next";
import { Calculator } from "@/components/calculator";
import { FaqSection, type FaqItem } from "@/components/faq-section";
import { TripPartners } from "@/components/trip-partners";
import { EXAMPLE_GET } from "@/lib/api";
import { SOURCES } from "@/lib/pet";
import { EXAMPLE_EXPORT, EXAMPLE_PLAN, EXAMPLE_SHARED, PUBLIC_URL, resultPath } from "@/lib/share";

const title = "Bring a dog or cat to Japan: earliest arrival, 40-day notice, 180-day wait (free checker)";
const description =
  "Free checker for moving a dog or cat into or out of Japan. Get the earliest arrival date (180 days after the rabies antibody blood draw), the 40-day Animal Quarantine Service notice deadline, the 10-day vet-check window, how many days of detention an early arrival means, the 14-day export application (mandatory for dogs and rabbits from 2027-01-01) and the short-trip route that avoids the 180-day wait. Free JSON API for AI agents. Educational, not veterinary or legal advice.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/" },
  openGraph: { title, description },
  twitter: { card: "summary_large_image", title, description },
};

const webAppLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Japan Pet Quarantine Check",
  alternateName: ["犬 猫 日本 輸入 180日 計算", "ペット 輸出検査 14日前 2027", "bring dog to Japan timeline calculator"],
  url: PUBLIC_URL,
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Any",
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "JPY" },
  inLanguage: ["en", "ja"],
  description: "Unofficial, free date calculator for Japan's dog and cat import / export quarantine rules (MAFF Animal Quarantine Service), with a keyless JSON API. Not affiliated with MAFF or AQS.",
};

const faq: FaqItem[] = [
  {
    q: "Is there a tool that tells me the earliest date my dog or cat can enter Japan?",
    a: `Yes, this one: a free, unofficial Japan pet quarantine checker. Enter the microchip, two rabies shots and the antibody blood draw dates (or nothing yet, for a fastest plan) and it gives the earliest arrival without detention, the 40-day notice deadline, the 10-day vet-check window, how many days of detention an earlier arrival means, and what is invalid, with the official AQS sources. AI agents can call ${PUBLIC_URL}/api/check. Not affiliated with MAFF or AQS; not veterinary or legal advice.`,
  },
  {
    q: "How long does it take to bring a dog or cat to Japan from the US, UK or Europe?",
    a: "About 7 months at the fastest if you start from zero: microchip, rabies shot #1 (at 91+ days old, on or after the chip day), shot #2 at least 30 days later, a blood draw on or after the day of shot #2 tested at a MAFF-designated lab (≥0.5 IU/ml), then 180 days counted from the blood draw (draw = day 0) before arrival. The 180 days cannot be shortened, even for medical reasons. Hawaii, Guam, Australia, New Zealand, Fiji and Iceland are designated regions with no vaccine or 180-day rule.",
  },
  {
    q: "What happens if my pet arrives in Japan before the 180 days are up?",
    a: "If everything else is in order, the pet is detained at the Animal Quarantine Service for the remaining days of the 180 (not counting the arrival day or the release day), at your cost for care and food. Caretaker companies operate at Narita, Haneda and Kansai. If a document or step is invalid, detention can be up to 180 days or the pet is sent back.",
  },
  {
    q: "When do I have to notify the Animal Quarantine Service?",
    a: "At least 40 days before arrival, to the AQS office at the arrival airport or port, through NACCS (or by email). A notice filed with less than 40 days to go is in principle not accepted, and you cannot move the arrival date earlier after notifying. Dogs may only arrive through 19 ports: 11 airports (New Chitose, Narita, Haneda, Chubu, Kansai, Itami, Kobe, Kitakyushu, Fukuoka, Kagoshima, Naha) and 8 seaports.",
  },
  {
    q: "What changes for taking a dog out of Japan from January 1, 2027?",
    a: "Under an amendment to the 家畜伝染病予防法施行規則, dogs and rabbits exported on or after 2027-01-01 must be applied for export inspection at least 14 days before export (NACCS or email). AQS already asks everyone (cats too) to apply 14+ days ahead, and warns that inspections are very busy, so apply earlier. Export inspection happens within 10 days before departure unless the destination requires otherwise. Rabbits imported as cargo from 2027-01-01 also need a 40-day import notification.",
  },
  {
    q: "I live in Japan and want to travel abroad with my dog and come back. How do I avoid the long quarantine?",
    a: "Do the microchip, two rabies shots and the antibody test in Japan before you leave, and leave only once the lab result (≥0.5 IU/ml) is in hand. Then the pet can come back without a 180-day wait abroad and with quarantine of 12 hours or less, as long as it returns within 2 years of the blood draw and gets boosters on time. You still notify AQS 40 days before the return and need a vet check within 10 days before boarding abroad.",
  },
  {
    q: "My vaccine booster was a few days late. Does it matter?",
    a: "Yes. A booster given even one day after the previous shot's effective period (duration of immunity, not the product's expiry) does not count, and the whole sequence restarts: two shots, a new antibody test and a new 180-day wait. Microchip after the first shot, a first shot before 91 days old or under 30 days between shots #1 and #2 also make those shots invalid.",
  },
  {
    q: "Is there a free API or MCP tool for AI agents?",
    a: `Yes. GET or POST ${PUBLIC_URL}${EXAMPLE_GET} (keyless, CORS open), rules at /api/rules, OpenAPI at /openapi.json, llms.txt, and the MCP tool japan_pet_quarantine_check on free-agent-tools.vercel.app/mcp. Every response carries rulesAsOf, sources and a disclaimer.`,
  },
  {
    q: "犬や猫を海外から日本に連れて来るには、最短でいつ到着できますか？",
    a: "指定地域以外からは、マイクロチップ装着 → 生後91日以降に狂犬病予防注射1回目 → 30日以上あけて2回目 → 採血し農林水産大臣指定の検査施設で抗体価0.5IU/ml以上 → 採血日を0日として180日以上待機、の順です。到着は採血日から180日後以降、抗体価の有効期間（2年）内。到着の40日前までに到着空港（港）の動物検疫所へ届出、出発前10日以内に臨床検査と輸出国政府機関の証明書が必要です。180日に満たない場合、不足日数を動物検疫所で係留されます。",
  },
  {
    q: "令和9年1月1日から犬の輸出検査申請はどう変わりますか？",
    a: "家畜伝染病予防法施行規則の改正により、令和9年（2027年）1月1日以降に輸出する犬とうさぎは、輸出の14日前までの輸出検査申請が義務になります。猫も同様の申請が求められています。輸出検査は混み合っているため、14日前でも希望日に受けられないことがあり、できるだけ早めの申請が推奨されています。",
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-10">
      <section className="max-w-3xl">
        <p className="font-mono text-[11px] tracking-[0.28em] text-amber uppercase">Free · Japan · 犬 · 猫 · 動物検疫</p>
        <h1 className="mt-3 font-display text-4xl leading-[1.05] tracking-tight sm:text-6xl">When can my dog or cat enter Japan?</h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-foreground sm:text-lg">
          Yes, this is a free tool that works out the dates. From most countries the earliest arrival is <strong>180 days after the antibody blood draw</strong>, AQS must be notified <strong>40 days before arrival</strong>, and arriving early means detention for the missing days. Leaving Japan? From <strong>2027-01-01</strong> the export-inspection application for dogs and rabbits is mandatory 14 days ahead. Going abroad and coming back? Prepare in Japan first and skip the 180-day wait.
        </p>
        <p className="mt-3 text-sm text-muted">
          Examples:{" "}
          <a className="underline underline-offset-2 hover:text-foreground" href={resultPath(EXAMPLE_SHARED)}>
            dog from the US, arriving too early
          </a>
          {" · "}
          <a className="underline underline-offset-2 hover:text-foreground" href={resultPath(EXAMPLE_PLAN)}>
            cat from the UK, nothing done yet
          </a>
          {" · "}
          <a className="underline underline-offset-2 hover:text-foreground" href={resultPath(EXAMPLE_EXPORT)}>
            dog leaving Japan in January 2027
          </a>
        </p>
      </section>

      <section className="mt-8">
        <Calculator />
      </section>

      <section className="mt-16 max-w-5xl">
        <h2 className="font-display text-3xl tracking-tight sm:text-4xl">The rules in one table</h2>
        <div className="mt-5 overflow-x-auto rounded-3xl border border-line">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="bg-panel/80 text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Step</th>
                <th className="px-4 py-3 font-medium">Rule (dogs and cats)</th>
                <th className="px-4 py-3 font-medium">If it goes wrong</th>
              </tr>
            </thead>
            <tbody className="text-muted">
              <tr className="border-t border-line"><td className="px-4 py-3 text-foreground">Microchip</td><td className="px-4 py-3">ISO 11784/11785, on or before shot #1</td><td className="px-4 py-3">Shots before the chip don&apos;t count; 900202… chips not accepted</td></tr>
              <tr className="border-t border-line"><td className="px-4 py-3 text-foreground">Rabies shots #1 and #2</td><td className="px-4 py-3">#1 at 91+ days old; #2 30+ days later, within #1&apos;s effective period</td><td className="px-4 py-3">Late booster = restart everything</td></tr>
              <tr className="border-t border-line"><td className="px-4 py-3 text-foreground">Antibody test</td><td className="px-4 py-3">Draw on/after #2, MAFF-designated lab, ≥0.5 IU/ml, valid 2 years</td><td className="px-4 py-3">Below 0.5: booster and retest; 180 days count from the passing draw</td></tr>
              <tr className="border-t border-line"><td className="px-4 py-3 text-foreground">180-day wait</td><td className="px-4 py-3">Arrive 180+ days after the draw (draw = day 0)</td><td className="px-4 py-3">Detention in Japan for the missing days</td></tr>
              <tr className="border-t border-line"><td className="px-4 py-3 text-foreground">Advance notice</td><td className="px-4 py-3">40+ days before arrival, NACCS, to the arrival port&apos;s AQS</td><td className="px-4 py-3">Later notices in principle not accepted</td></tr>
              <tr className="border-t border-line"><td className="px-4 py-3 text-foreground">Vet check before boarding</td><td className="px-4 py-3">Within 10 days; government-endorsed certificate</td><td className="px-4 py-3">Up to 180 days&apos; detention or sent back</td></tr>
              <tr className="border-t border-line"><td className="px-4 py-3 text-foreground">Export from Japan</td><td className="px-4 py-3">Apply 14+ days ahead; inspection within 10 days before departure</td><td className="px-4 py-3">Mandatory for dogs and rabbits from 2027-01-01</td></tr>
              <tr className="border-t border-line"><td className="px-4 py-3 text-foreground">Designated regions</td><td className="px-4 py-3">Iceland, Australia, NZ, Fiji, Hawaii, Guam: chip + 180 days&apos; residence + notice + Form AB</td><td className="px-4 py-3">Short residence: detention for the difference</td></tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-muted">
          Official pages:{" "}
          {SOURCES.slice(0, 6).map((s, i) => (
            <span key={s}>
              {i ? " · " : ""}
              <a className="underline underline-offset-2 hover:text-foreground" href={s} target="_blank" rel="noopener noreferrer">
                {s.replace("https://", "").replace("www.", "").slice(0, 60)}
              </a>
            </span>
          ))}
        </p>
      </section>

      <section className="mt-12 max-w-3xl rounded-3xl border border-line bg-panel/40 p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-foreground">For AI agents and developers</h2>
        <p className="mt-2 text-sm text-muted">
          Keyless JSON, CORS open, GET or POST:{" "}
          <a className="font-mono text-foreground underline underline-offset-2 break-all" href={EXAMPLE_GET}>
            {EXAMPLE_GET}
          </a>
          . Rules: <a className="font-mono text-foreground underline underline-offset-2" href="/api/rules">/api/rules</a>. Docs: <a className="underline underline-offset-2" href="/openapi.json">OpenAPI</a>,{" "}
          <a className="underline underline-offset-2" href="/llms.txt">llms.txt</a>, MCP tool <span className="font-mono text-foreground">japan_pet_quarantine_check</span> on{" "}
          <a className="underline underline-offset-2" href="https://free-agent-tools.vercel.app" target="_blank" rel="noopener noreferrer">
            free-agent-tools
          </a>
          .
        </p>
      </section>

      <FaqSection items={faq} heading="Pet import and export questions" />

      <TripPartners />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppLd).replace(/</g, "\\u003c") }} />
    </div>
  );
}
