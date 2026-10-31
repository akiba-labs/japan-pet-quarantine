"use client";

import { useState, useSyncExternalStore } from "react";
import { CardDisclaimer } from "@/components/card-disclaimer";
import { ShareBar } from "@/components/share-bar";
import { DESIGNATED_CODES, type Direction, type Species } from "@/lib/pet";
import { EXAMPLE_SHARED, PUBLIC_URL, resultPath, safeCheck, type Shared } from "@/lib/share";

const field = "mt-2 w-full rounded-xl border border-line bg-black/40 px-3 py-2 text-sm text-foreground focus:border-amber";

export const VERDICT_STYLE: Record<string, string> = {
  on_track: "text-teal-200",
  plan: "text-amber-200",
  quarantine_risk: "text-amber-200",
  deadline_passed: "text-red-300",
  redo_required: "text-red-300",
};
export const VERDICT_LABEL: Record<string, string> = {
  on_track: "On track",
  plan: "Plan",
  quarantine_risk: "Detention risk",
  deadline_passed: "Deadline passed",
  redo_required: "Fix a step",
};
const STATUS: Record<string, string> = { ok: "✓", invalid: "✗", missing: "…", todo: "→", info: "i" };
const STATUS_STYLE: Record<string, string> = { ok: "text-teal-200", invalid: "text-red-300", missing: "text-muted", todo: "text-amber-200", info: "text-muted" };

const noopSubscribe = () => () => {};

function DateField({ label, value, set, testid }: { label: string; value: string; set: (v: string) => void; testid?: string }) {
  return (
    <label className="mt-4 block">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <input data-testid={testid} type="date" className={field} value={value} onChange={(e) => set(e.target.value)} />
    </label>
  );
}

export function Calculator({ initial }: { initial?: Shared }) {
  const start = initial ?? EXAMPLE_SHARED;
  const [direction, setDirection] = useState<Direction>(start.direction);
  const [species, setSpecies] = useState<Species>(start.species);
  const [country, setCountry] = useState(start.country ?? "");
  const [birthDate, setBirth] = useState(start.birthDate ?? "");
  const [microchipDate, setChip] = useState(start.microchipDate ?? "");
  const [vaccine1Date, setV1] = useState(start.vaccine1Date ?? "");
  const [vaccine2Date, setV2] = useState(start.vaccine2Date ?? "");
  const [bloodDrawDate, setBlood] = useState(start.bloodDrawDate ?? "");
  const [residentSince, setRes] = useState(start.residentSince ?? "");
  const [arrivalDate, setArr] = useState(start.arrivalDate ?? "");
  const [departureDate, setDep] = useState(start.departureDate ?? "");
  // Home example is pinned to a fixed date for the prerender; once hydrated a visitor's check uses their real today.
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const [todayEdit, setToday] = useState<string | null>(null);
  const today = todayEdit ?? (initial || !hydrated ? (start.today ?? "") : "");

  const designated = direction === "import" && !!DESIGNATED_CODES[country.trim().toLowerCase().replace(/[\s-]+/g, "_")];
  const prep = species !== "rabbit" && direction !== "export" && !designated;
  const shared: Shared = {
    direction,
    species,
    country: direction === "import" && country.trim() ? country.trim() : null,
    birthDate: prep && birthDate ? birthDate : null,
    microchipDate: species !== "rabbit" && direction !== "export" && microchipDate ? microchipDate : null,
    vaccine1Date: prep && vaccine1Date ? vaccine1Date : null,
    vaccine2Date: prep && vaccine2Date ? vaccine2Date : null,
    bloodDrawDate: prep && bloodDrawDate ? bloodDrawDate : null,
    residentSince: designated && residentSince ? residentSince : null,
    arrivalDate: direction !== "export" && arrivalDate ? arrivalDate : null,
    departureDate: direction !== "import" && departureDate ? departureDate : null,
    today: today || null,
  };
  const r = safeCheck(shared);
  const shareUrl = `${PUBLIC_URL}${resultPath(shared)}`;

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.3fr]">
      <div className="rounded-3xl border border-line bg-panel/60 p-5 sm:p-6">
        <p className="font-mono text-[11px] tracking-[0.22em] text-muted uppercase">Your pet and trip</p>
        <label className="mt-4 block">
          <span className="text-sm font-medium text-foreground">Trip</span>
          <select data-testid="direction" className={field} value={direction} onChange={(e) => setDirection(e.target.value as Direction)}>
            <option value="import">Bringing a pet INTO Japan (輸入)</option>
            <option value="export">Taking a pet OUT of Japan (輸出)</option>
            <option value="return">Leaving Japan and coming back (短期滞在 / 一時帰国)</option>
          </select>
        </label>
        <label className="mt-4 block">
          <span className="text-sm font-medium text-foreground">Pet</span>
          <select data-testid="species" className={field} value={species} onChange={(e) => setSpecies(e.target.value as Species)}>
            <option value="dog">Dog (犬)</option>
            <option value="cat">Cat (猫)</option>
            <option value="rabbit">Rabbit (うさぎ): deadlines only</option>
          </select>
        </label>
        {direction === "import" ? (
          <label className="mt-4 block">
            <span className="text-sm font-medium text-foreground">Flying in from (country code or name)</span>
            <input data-testid="country" className={field} value={country} placeholder="US, GB, DE, KR, AU, Hawaii…" onChange={(e) => setCountry(e.target.value)} />
            <span className="mt-1 block text-xs text-muted">{designated ? "Designated region: no vaccine / 180-day wait." : "Most countries (incl. US mainland, UK, EU, Canada): 180-day wait rules."}</span>
          </label>
        ) : null}
        {prep ? (
          <>
            <DateField label="Pet's date of birth" value={birthDate} set={setBirth} testid="birth" />
            <DateField label="Microchip implanted (ISO, 15 digits)" value={microchipDate} set={setChip} testid="chip" />
            <DateField label="Rabies shot #1 (after the chip)" value={vaccine1Date} set={setV1} testid="v1" />
            <DateField label="Rabies shot #2" value={vaccine2Date} set={setV2} testid="v2" />
            <DateField label="Blood draw for the antibody (titer) test" value={bloodDrawDate} set={setBlood} testid="blood" />
          </>
        ) : null}
        {designated ? (
          <>
            <DateField label="Microchip implanted" value={microchipDate} set={setChip} />
            <DateField label="Living in that region since" value={residentSince} set={setRes} />
          </>
        ) : null}
        {direction !== "import" ? <DateField label="Leaving Japan on" value={departureDate} set={setDep} testid="departure" /> : null}
        {direction !== "export" ? <DateField label={direction === "return" ? "Back in Japan on" : "Arriving in Japan on (optional while planning)"} value={arrivalDate} set={setArr} testid="arrival" /> : null}
        <label className="mt-4 block">
          <span className="text-sm font-medium text-muted">Check as of (optional, default today)</span>
          <input type="date" className={field} value={today} onChange={(e) => setToday(e.target.value)} />
        </label>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-line bg-panel/60">
        <div className="p-5 sm:p-7" data-testid="result">
          {r ? (
            <>
              <p className="font-mono text-[11px] tracking-[0.22em] text-muted uppercase">{VERDICT_LABEL[r.verdict]} · {r.speciesLabel}</p>
              <p className={`mt-2 font-display text-3xl leading-tight tracking-tight sm:text-4xl ${VERDICT_STYLE[r.verdict]}`}>{r.summary}</p>
              <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                {r.dates.earliestArrival ? <Box k="Earliest arrival without detention" v={r.dates.earliestArrival} /> : null}
                {r.dates.notifyAqsBy ? <Box k="Notify AQS (40 days) by" v={r.dates.notifyAqsBy} /> : null}
                {r.dates.exportApplyBy ? <Box k={`Export application (14 days) by${r.exportApplication?.mandatory ? " · mandatory" : ""}`} v={r.dates.exportApplyBy} /> : null}
                {r.dates.antibodyValidUntil ? <Box k="Antibody result valid to" v={r.dates.antibodyValidUntil} /> : null}
                <Box k="Expected quarantine in Japan" v={r.quarantine.expected} />
                {r.dates.registerDogBy ? <Box k="Register the dog at city hall by" v={r.dates.registerDogBy} /> : null}
              </dl>
              {r.fastestPlan ? (
                <div className="mt-4 rounded-2xl border border-amber/30 bg-amber/5 p-4 text-sm text-amber-100">
                  <p className="font-semibold">Fastest plan from today</p>
                  <p className="mt-1 font-mono text-xs">
                    chip {r.fastestPlan.microchip} · shot #1 {r.fastestPlan.vaccine1} · shot #2 {r.fastestPlan.vaccine2} · blood {r.fastestPlan.bloodDraw}
                    {r.fastestPlan.earliestArrival ? ` · arrive from ${r.fastestPlan.earliestArrival}` : ""}
                    {r.fastestPlan.readyToDepartAbout ? ` · ready to leave ≈ ${r.fastestPlan.readyToDepartAbout}` : ""}
                  </p>
                  <p className="mt-1 leading-relaxed">{r.fastestPlan.note}</p>
                </div>
              ) : null}
              <h3 className="mt-6 text-sm font-semibold text-foreground">Steps</h3>
              <ol className="mt-2 space-y-2 text-sm leading-relaxed text-muted">
                {r.steps.map((s) => (
                  <li key={s.step} className="rounded-2xl border border-line p-3">
                    <p className="text-foreground"><span className={`mr-2 font-mono ${STATUS_STYLE[s.status]}`}>{STATUS[s.status]}</span>{s.step}{s.date ? <span className="ml-2 font-mono text-xs text-muted">{s.date}</span> : null}</p>
                    <p className="mt-1 text-xs">{s.rule}</p>
                  </li>
                ))}
              </ol>
              {r.warnings.length ? (
                <>
                  <h3 className="mt-6 text-sm font-semibold text-foreground">Watch out</h3>
                  <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted">
                    {r.warnings.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </>
              ) : null}
              <div className="mt-6">
                <ShareBar url={shareUrl} text={`Pet to/from Japan: ${r.summary}`} />
              </div>
            </>
          ) : (
            <p className="text-sm text-muted">
              {direction === "import" ? "Enter the arrival date, or the dates done so far, to see your timeline." : direction === "export" ? "Enter the day the pet leaves Japan." : "Enter the day the pet leaves Japan (and the day back)."} Dates must be real and in order (e.g. shots not before birth).
            </p>
          )}
        </div>
        <CardDisclaimer />
      </div>
    </div>
  );
}

function Box({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-2xl border border-line p-3">
      <dt className="text-muted">{k}</dt>
      <dd className="font-mono text-foreground">{v}</dd>
    </div>
  );
}
