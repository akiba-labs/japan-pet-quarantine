// Japan pet (dog / cat) import, export and round-trip date rules. Pure functions, no I/O.
// Sources: MAFF Animal Quarantine Service (AQS) pages for non-designated regions, designated regions, export,
// short stays abroad (短期滞在編, updated 2026-08-04) and the 2027-01-01 notices (家畜伝染病予防法施行規則 amendment);
// 犬等の輸出入検疫規則 (e-Gov 411M50000200068) art. 1 (40-day notice).

export const RULES_AS_OF = "2026-10-31";
export const EXPORT_14DAY_MANDATORY_FROM = "2027-01-01";

export const DIRECTIONS = ["import", "export", "return"] as const;
export type Direction = (typeof DIRECTIONS)[number];
export const SPECIES = ["dog", "cat", "rabbit"] as const;
export type Species = (typeof SPECIES)[number];
export const ORIGINS = ["other", "designated"] as const;
export type Origin = (typeof ORIGINS)[number];

export const DESIGNATED_REGIONS = ["Iceland", "Australia", "New Zealand", "Fiji Islands", "Hawaii", "Guam"] as const;
/** ISO-ish codes accepted for `country` that map to a designated region. */
export const DESIGNATED_CODES: Record<string, string> = {
  is: "Iceland", isl: "Iceland", iceland: "Iceland",
  au: "Australia", aus: "Australia", australia: "Australia",
  nz: "New Zealand", nzl: "New Zealand", new_zealand: "New Zealand",
  fj: "Fiji Islands", fji: "Fiji Islands", fiji: "Fiji Islands", fiji_islands: "Fiji Islands",
  us_hi: "Hawaii", hi: "Hawaii", hawaii: "Hawaii",
  gu: "Guam", gum: "Guam", guam: "Guam", us_gu: "Guam",
};

export const DOG_PORTS = {
  airports: ["New Chitose", "Narita", "Haneda (Tokyo Intl.)", "Chubu", "Kansai", "Itami (Osaka Intl.)", "Kobe", "Kitakyushu", "Fukuoka", "Kagoshima", "Naha"],
  seaports: ["Tomakomai", "Keihin (Tokyo, Kawasaki, Yokohama)", "Nagoya", "Hanshin (Osaka, Kobe)", "Kanmon", "Hakata", "Kagoshima", "Naha"],
} as const;

export const SPECIES_LABEL: Record<Species, { en: string; ja: string }> = {
  dog: { en: "Dog", ja: "犬" },
  cat: { en: "Cat", ja: "猫" },
  rabbit: { en: "Rabbit", ja: "うさぎ" },
};

export const SOURCES = [
  "https://www.maff.go.jp/aqs/english/animal/dog/import-other.html",
  "https://www.maff.go.jp/aqs/english/animal/dog/import-free.html",
  "https://www.maff.go.jp/aqs/english/animal/dog/export.html",
  "https://www.maff.go.jp/aqs/animal/dog/shortstay.html",
  "https://www.maff.go.jp/aqs/animal/index.html",
  "https://www.maff.go.jp/aqs/english/qanda/dogcata.html",
  "https://www.maff.go.jp/aqs/animal/dog/lab.html",
  "https://laws.e-gov.go.jp/law/411M50000200068",
] as const;

export const DISCLAIMER =
  "Educational date calculator, not veterinary or legal advice, not affiliated with MAFF or the Animal Quarantine Service (AQS, 動物検疫所). It applies AQS guidance (rules as of 2026-10-31) to the dates you enter. AQS decides on your documents; airlines and the destination country add their own rules. Confirm with the AQS office at your port before booking.";

export class RuleInputError extends Error {}

const ISO = /^\d{4}-\d{2}-\d{2}$/;
export function validDate(s: string): boolean {
  if (!ISO.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}
const toDate = (s: string) => new Date(`${s}T00:00:00Z`);
const fmt = (d: Date) => d.toISOString().slice(0, 10);
export function addDays(s: string, n: number): string {
  const d = toDate(s);
  d.setUTCDate(d.getUTCDate() + n);
  return fmt(d);
}
export function daysBetween(a: string, b: string): number {
  return Math.round((toDate(b).getTime() - toDate(a).getTime()) / 86_400_000);
}
export function todayJst(now: Date = new Date()): string {
  return fmt(new Date(now.getTime() + 9 * 3_600_000));
}
const lastDayOf = (y: number, m0: number) => new Date(Date.UTC(y, m0 + 1, 0)).getUTCDate();
/** Same day n months later, clamped to the month's last day. */
export function addMonths(s: string, n: number): string {
  const d = toDate(s);
  const m = d.getUTCMonth() + n;
  const y = d.getUTCFullYear() + Math.floor(m / 12);
  const m0 = ((m % 12) + 12) % 12;
  return fmt(new Date(Date.UTC(y, m0, Math.min(d.getUTCDate(), lastDayOf(y, m0)))));
}
const maxDate = (...xs: string[]) => xs.reduce((a, b) => (a > b ? a : b));

export type CheckInput = {
  direction: Direction;
  species: Species;
  origin?: Origin | null;
  country?: string | null;
  birthDate?: string | null;
  microchipDate?: string | null;
  microchipNumber?: string | null;
  vaccine1Date?: string | null;
  vaccine1ValidUntil?: string | null;
  vaccine2Date?: string | null;
  vaccineValidUntil?: string | null;
  bloodDrawDate?: string | null;
  titer?: number | null;
  residentSince?: string | null;
  residentSinceBirth?: boolean | null;
  arrivalDate?: string | null;
  departureDate?: string | null;
  today?: string | null;
};

export type Verdict = "on_track" | "plan" | "quarantine_risk" | "deadline_passed" | "redo_required";
export type Status = "ok" | "invalid" | "missing" | "todo" | "info";
export type Step = { step: string; date: string | null; status: Status; rule: string };
export type Action = { what: string; by: string | null; from: string | null; where: string };

export type CheckResult = {
  verdict: Verdict;
  summary: string;
  direction: Direction;
  species: Species;
  speciesLabel: string;
  origin: Origin | null;
  region: string | null;
  steps: Step[];
  dates: {
    earliestArrival: string | null;
    earliestArrivalBasis: string | null;
    antibodyValidUntil: string | null;
    notifyAqsBy: string | null;
    preDepartureInspectionFrom: string | null;
    preDepartureInspectionTo: string | null;
    exportApplyBy: string | null;
    exportInspectionFrom: string | null;
    exportInspectionTo: string | null;
    registerDogBy: string | null;
  };
  exportApplication: { mandatory: boolean; rule: string } | null;
  quarantine: { expected: string; days: number | null; reason: string };
  fastestPlan: { microchip: string; vaccine1: string; vaccine2: string; bloodDraw: string; readyToDepartAbout: string | null; earliestArrival: string | null; notifyAqsBy: string | null; note: string } | null;
  actions: Action[];
  warnings: string[];
  ports: typeof DOG_PORTS | null;
  rulesAsOf: string;
  today: string;
  sources: readonly string[];
};

function req(v: string | null | undefined, name: string): string | null {
  if (v === null || v === undefined || v === "") return null;
  if (!validDate(v)) throw new RuleInputError(`${name} must be a real date in YYYY-MM-DD format (got "${v}")`);
  return v;
}

/** Microchip number check (ISO 11784/11785: 15 digits). */
export function microchipWarnings(num: string | null | undefined): { ok: boolean; warnings: string[] } {
  if (!num) return { ok: true, warnings: [] };
  const n = num.replace(/[\s-]/g, "");
  const w: string[] = [];
  let ok = true;
  if (!/^\d{15}$/.test(n)) {
    ok = false;
    w.push(`Microchip "${num}" is not a 15-digit numeric ISO 11784/11785 code. Non-ISO chips: contact AQS at the port of entry and bring a reader that can read it.`);
  } else if (n.startsWith("900202")) {
    ok = false;
    w.push("Microchips starting with 900202 are currently not accepted by AQS as identification (notice of 2023-04-07). Ask your vet about implanting a new ISO chip; procedures done under the old chip may have to be redone.");
  } else if (n.startsWith("900")) {
    w.push(`Chip starts with 900${["900113", "900115", "900128", "900201", "900215", "900217", "900263"].some((p) => n.startsWith(p)) ? ` (${n.slice(0, 6)}, one of the prefixes AQS names)` : ""}: AQS warns that some 900-prefix numbers were implanted in more than one animal, which can force a new chip and redoing the steps. Notify AQS as soon as your timing is fixed so they can check it (notice of 2025-12-19).`);
  }
  return { ok, warnings: w };
}

export function checkPet(input: CheckInput): CheckResult {
  const today = req(input.today, "today") ?? todayJst();
  const { direction, species } = input;
  if (!(DIRECTIONS as readonly string[]).includes(direction)) throw new RuleInputError(`direction must be one of ${DIRECTIONS.join(", ")}`);
  if (!(SPECIES as readonly string[]).includes(species)) throw new RuleInputError(`species must be one of ${SPECIES.join(", ")}`);
  const birth = req(input.birthDate, "birthDate");
  const chip = req(input.microchipDate, "microchipDate");
  const v1 = req(input.vaccine1Date, "vaccine1Date");
  const v1Until = req(input.vaccine1ValidUntil, "vaccine1ValidUntil");
  const v2 = req(input.vaccine2Date, "vaccine2Date");
  const vUntil = req(input.vaccineValidUntil, "vaccineValidUntil");
  const blood = req(input.bloodDrawDate, "bloodDrawDate");
  const resSince = req(input.residentSince, "residentSince");
  const arrival = req(input.arrivalDate, "arrivalDate");
  const departure = req(input.departureDate, "departureDate");
  if (input.titer !== null && input.titer !== undefined && (!Number.isFinite(input.titer) || input.titer < 0)) throw new RuleInputError("titer must be a number ≥ 0 (IU/ml)");
  if (birth && birth > today) throw new RuleInputError("birthDate is in the future");
  for (const [n, d] of [["microchipDate", chip], ["vaccine1Date", v1], ["vaccine2Date", v2], ["bloodDrawDate", blood]] as const) {
    if (d && birth && d < birth) throw new RuleInputError(`${n} is before birthDate`);
  }

  // Region
  let origin: Origin | null = input.origin ?? null;
  let region: string | null = null;
  if (input.country) {
    const k = input.country.trim().toLowerCase().replace(/[\s-]+/g, "_");
    region = DESIGNATED_CODES[k] ?? null;
    if (!origin) origin = region ? "designated" : "other";
    if (origin === "other" && region) {
      // explicit override wins, keep region null to avoid confusion
      region = null;
    }
    if (k === "jp" || k === "japan") throw new RuleInputError('country is where the pet comes from; for a pet leaving Japan use direction "export" or "return"');
  }
  if (direction === "import" && !origin) origin = "other";
  if (direction !== "import") origin = direction === "return" ? "other" : null;

  const steps: Step[] = [];
  const warnings: string[] = [];
  const actions: Action[] = [];
  let redo = false;
  let late = false;
  let shortfall: number | null = null;
  let plan: CheckResult["fastestPlan"] = null;
  const dates: CheckResult["dates"] = {
    earliestArrival: null, earliestArrivalBasis: null, antibodyValidUntil: null, notifyAqsBy: null,
    preDepartureInspectionFrom: null, preDepartureInspectionTo: null, exportApplyBy: null, exportInspectionFrom: null, exportInspectionTo: null, registerDogBy: null,
  };
  let exportApplication: CheckResult["exportApplication"] = null;
  let quarantine: CheckResult["quarantine"] = { expected: "unknown", days: null, reason: "" };

  const mc = microchipWarnings(input.microchipNumber);
  warnings.push(...mc.warnings);
  if (!mc.ok) redo = true;

  // ---- rabbits: only the dated notification / application rules are modelled ----
  if (species === "rabbit") {
    if (direction === "export" || direction === "return") {
      const dep = departure;
      if (!dep) throw new RuleInputError("departureDate (YYYY-MM-DD) is required for a rabbit export check");
      Object.assign(dates, exportDates(dep));
      exportApplication = exportRule("rabbit", dep);
      if (today > dates.exportApplyBy!) late = true;
      actions.push({ what: "Apply for export inspection to AQS (NACCS or email) with the destination's required certificates", by: dates.exportApplyBy, from: null, where: "AQS office at the departure airport / port" });
    } else {
      if (!arrival) throw new RuleInputError("arrivalDate (YYYY-MM-DD) is required for a rabbit import check");
      dates.notifyAqsBy = addDays(arrival, -40);
      if (today > dates.notifyAqsBy) late = true;
      actions.push({ what: `Notify AQS of the rabbit import (${arrival >= EXPORT_14DAY_MANDATORY_FROM ? "mandatory for cargo shipments arriving from 2027-01-01; requested for carry-on" : "becomes mandatory for cargo shipments from 2027-01-01; AQS asks for it for carry-on too"})`, by: dates.notifyAqsBy, from: null, where: "AQS office at the arrival airport / port" });
    }
    warnings.push("Rabbits: only the dated AQS deadlines are checked here (40-day import notification, 14-day export application from 2027-01-01). Health-certificate and inspection requirements for rabbits: ask AQS.");
    quarantine = { expected: "ask AQS", days: null, reason: "Rabbit inspection requirements are not modelled by this tool." };
    return finish();
  }

  // ---- export only (leaving Japan) ----
  if (direction === "export") {
    if (!departure) throw new RuleInputError("departureDate (YYYY-MM-DD) is required for direction=export");
    Object.assign(dates, exportDates(departure));
    exportApplication = exportRule(species, departure);
    if (today > dates.exportApplyBy!) late = true;
    steps.push({ step: "Check the destination country's entry rules", date: null, status: "todo", rule: "Ask the destination's embassy in Japan or its animal-quarantine authority (EU, Australia etc. need an AQS veterinary officer's signature; book early)." });
    steps.push({ step: "Apply for export inspection (NACCS or email)", date: dates.exportApplyBy, status: late ? "invalid" : "todo", rule: `At least 14 days before export, with the certificates the destination requires and up to 3 preferred inspection times in the remarks. ${exportApplication.rule}` });
    steps.push({ step: "Export inspection + export quarantine certificate", date: `${dates.exportInspectionFrom} → ${dates.exportInspectionTo}`, status: "todo", rule: "Within 10 days before departure unless the destination sets another window; bring photo ID, the pet and all original certificates (30-60 min at Narita / Haneda / Kansai, 8:30-16:30)." });
    actions.push({ what: "Apply for the export inspection and request a time slot", by: dates.exportApplyBy, from: null, where: "AQS office at the departure airport / port (NACCS)" });
    actions.push({ what: "Export inspection with the pet and original certificates", by: departure, from: dates.exportInspectionFrom, where: "AQS office at the departure airport / port" });
    warnings.push('Coming back to Japan later? Do microchip, 2 rabies shots and the antibody test in Japan before you leave (use direction "return"): then the pet can come back with ≤12 h quarantine and no 180-day wait abroad. Otherwise it needs the full import procedure from abroad (180-day wait).');
    quarantine = { expected: "not applicable (leaving Japan)", days: null, reason: "Export only." };
    if (late) warnings.push(`The 14-day point (${dates.exportApplyBy}) has passed for a ${departure} departure. ${exportApplication.mandatory ? "For this departure it is mandatory: the inspection may not be possible in time. Contact AQS now or move the departure." : "Contact AQS now; inspections are very busy and a slot is not guaranteed."}`);
    return finish();
  }

  // ---- designated-region import ----
  if (direction === "import" && origin === "designated") {
    if (!arrival) throw new RuleInputError("arrivalDate (YYYY-MM-DD) is required for an import check");
    const boarding = departure ?? arrival;
    dates.notifyAqsBy = addDays(arrival, -40);
    dates.preDepartureInspectionFrom = addDays(boarding, -10);
    dates.preDepartureInspectionTo = boarding;
    if (species === "dog") dates.registerDogBy = addDays(arrival, 30);
    if (today > dates.notifyAqsBy) late = true;
    steps.push(chipStep(chip, null));
    let days = 0;
    if (input.residentSinceBirth) {
      steps.push({ step: "Residence in the designated region", date: null, status: "ok", rule: "Continuously resident since birth (condition 1)." });
    } else if (resSince) {
      const resident = daysBetween(resSince, boarding);
      if (resident < 0) throw new RuleInputError("residentSince is after the departure / arrival date");
      days = Math.max(0, 180 - resident);
      steps.push({ step: "Residence in the designated region", date: resSince, status: days ? "invalid" : "ok", rule: `${resident} days resident before export to Japan; needs 180 (or since birth, or since coming directly from Japan).${days ? ` Short by ${days} days → detention in Japan for the difference.` : ""}` });
    } else {
      steps.push({ step: "Residence in the designated region", date: null, status: "missing", rule: "Give residentSince (or residentSinceBirth=true): resident since birth, 180+ days immediately before export, or since coming directly from Japan. Otherwise detention for 180 minus the days resident." });
    }
    steps.push(noticeStep(dates.notifyAqsBy, late));
    steps.push({ step: "Clinical inspection before departure + government certificate (Form AB)", date: `${dates.preDepartureInspectionFrom} → ${dates.preDepartureInspectionTo}`, status: "todo", rule: `Within 10 days before boarding: free of rabies signs${species === "dog" ? " and leptospirosis" : ""}; the exporting country's government endorses Form AB (no pencil, no correction fluid).` });
    steps.push({ step: "Transport", date: null, status: "info", rule: "Direct flight / ship, or an official seal on the crate / ANNEX transport certificate when transiting a non-designated region; otherwise 180 days' detention." });
    shortfall = days || null;
    quarantine = days ? { expected: `${days} days`, days, reason: "Residence in the designated region is short of 180 days." } : { expected: "none expected if documents are complete", days: 0, reason: "Designated region: no rabies vaccination, antibody test or 180-day wait." };
    importActions(arrival, species, boarding);
    return finish();
  }

  // ---- non-designated import, or return to Japan with preparation done in Japan ----
  const isReturn = direction === "return";
  const target = arrival;
  if (isReturn && !departure) throw new RuleInputError("departureDate (the day the pet leaves Japan) is required for direction=return");

  // microchip
  steps.push(chipStep(chip, v1));
  if (chip && v1 && chip > v1) redo = true;
  // vaccine 1
  if (v1) {
    let bad = "";
    if (birth && daysBetween(birth, v1) < 91) bad = `given on day ${daysBetween(birth, v1)} of life; must be day 91 or later (birth = day 0)`;
    if (chip && v1 < chip) bad = bad || "given before the microchip; shots before the chip do not count";
    if (!chip) warnings.push("Microchip date not given: the first counted rabies shot must be on or after the day the chip was implanted.");
    if (!birth) warnings.push("Birth date not given: the first counted rabies shot must be at 91 days old or later (birth = day 0).");
    if (bad) redo = true;
    steps.push({ step: "Rabies vaccine #1 (inactivated or recombinant; no live / RNA vaccines)", date: v1, status: bad ? "invalid" : "ok", rule: bad ? `Not valid: ${bad}.` : "On or after the microchip, at 91+ days old." });
  } else {
    steps.push({ step: "Rabies vaccine #1 (inactivated or recombinant; no live / RNA vaccines)", date: null, status: "missing", rule: "On or after the microchip day, at 91+ days old (birth = day 0)." });
  }
  // vaccine 2
  const v1End = v1Until ?? (v1 ? addMonths(v1, 12) : null);
  if (v2) {
    let bad = "";
    if (!v1) bad = "first vaccine date missing";
    else if (daysBetween(v1, v2) < 30) bad = `only ${daysBetween(v1, v2)} days after #1; needs 30+ (vaccine #1 = day 0)`;
    else if (v1End && v2 > v1End) bad = `after vaccine #1's effective period (${v1End}${v1Until ? "" : ", assumed 1 year"}); the chain is broken: start again from vaccine #1`;
    if (bad && v1) redo = true;
    steps.push({ step: "Rabies vaccine #2", date: v2, status: bad ? "invalid" : "ok", rule: bad ? `Not valid: ${bad}.` : `30+ days after #1 and within its effective period (${v1End}${v1Until ? "" : ", assumed 1 year; use the period on the vaccine certificate"}).` });
  } else {
    steps.push({ step: "Rabies vaccine #2", date: null, status: "missing", rule: "30+ days after #1 (#1 = day 0) and within #1's effective period (duration of immunity, not the product's expiry)." });
  }
  // blood
  if (blood) {
    let bad = "";
    if (!v2) bad = "second vaccine date missing";
    else if (blood < v2) bad = "drawn before vaccine #2; draw on or after the day of the 2nd shot";
    if (vUntil && blood > vUntil) bad = bad || `after the vaccine's effective period (${vUntil})`;
    if (input.titer !== null && input.titer !== undefined && input.titer < 0.5) bad = bad || `titer ${input.titer} IU/ml is below 0.5; ask your vet about a booster and a new test (the 180 days restart from the passing draw)`;
    if (bad && v2) redo = true;
    if (input.titer !== null && input.titer !== undefined && input.titer < 0.5) redo = true;
    dates.antibodyValidUntil = addMonths(blood, 24);
    steps.push({ step: "Blood draw → rabies antibody test at a MAFF-designated lab (≥0.5 IU/ml)", date: blood, status: bad ? "invalid" : "ok", rule: bad ? `Not valid: ${bad}.` : `Result valid 2 years from the draw (to ${dates.antibodyValidUntil}).${input.titer === null || input.titer === undefined ? " Titer not given: assumed ≥0.5 IU/ml." : ""}` });
  } else {
    steps.push({ step: "Blood draw → rabies antibody test at a MAFF-designated lab (≥0.5 IU/ml)", date: null, status: "missing", rule: "On or after the day of vaccine #2, within the vaccine's effective period; only MAFF-designated labs count. Valid 2 years." });
  }

  // fastest plan when prep is incomplete
  if (!blood) {
    const start = today;
    const pChip = chip ?? start;
    let pV1 = v1 ?? maxDate(pChip, start, birth ? addDays(birth, 91) : start);
    if (v1 && steps[1].status === "invalid") pV1 = maxDate(pChip, start, birth ? addDays(birth, 91) : start);
    const pV2 = v2 && steps[1].status === "ok" && steps[2].status === "ok" ? v2 : maxDate(addDays(pV1, 30), start);
    const pBlood = maxDate(pV2, start);
    const pArr = isReturn ? null : maxDate(addDays(pBlood, 180), addDays(start, 40));
    plan = {
      microchip: pChip, vaccine1: pV1, vaccine2: pV2, bloodDraw: pBlood, readyToDepartAbout: isReturn ? maxDate(addDays(pBlood, 21), addDays(start, 14)) : null, earliestArrival: pArr, notifyAqsBy: pArr ? addDays(pArr, -40) : null,
      note: isReturn
        ? "Fastest order if you start now: all of this in Japan before departure, then leave once the lab result (≥0.5 IU/ml) is in hand (readyToDepartAbout assumes about 3 weeks for the lab; ask your vet). No 180-day wait abroad; return within 2 years of the draw."
        : "Fastest legal timeline if you start now: arrival 180 days after a passing blood draw (draw = day 0). Lab turnaround and vet availability add time; the 180 days cannot be shortened, even for medical reasons.",
    };
  }

  if (isReturn) {
    const dep = departure!;
    Object.assign(dates, exportDates(dep));
    exportApplication = exportRule(species, dep);
    if (today > dates.exportApplyBy!) late = true;
    if (blood && blood > dep) { redo = true; warnings.push(`The blood draw (${blood}) is after the departure (${dep}). For the short-stay route, the antibody result must be in hand before the pet leaves Japan.`); }
    if (!blood && plan && plan.readyToDepartAbout && plan.readyToDepartAbout > dep) warnings.push(`Probably not enough time: with a blood draw on ${plan.bloodDraw} the lab result would arrive around ${plan.readyToDepartAbout}, after the planned departure ${dep}. Move the departure, or the pet will need the full 180-day procedure abroad before coming back.`);
    steps.push({ step: "Apply for the export inspection in Japan", date: dates.exportApplyBy, status: today > dates.exportApplyBy! ? "invalid" : "todo", rule: `14+ days before leaving; attach chip, 2 vaccine and antibody certificates. ${exportApplication.rule}` });
    steps.push({ step: "Export inspection in Japan (export quarantine certificate, keep a copy)", date: `${dates.exportInspectionFrom} → ${dates.exportInspectionTo}`, status: "todo", rule: "Within 10 days before departure." });
    if (target) {
      dates.notifyAqsBy = addDays(target, -40);
      dates.preDepartureInspectionFrom = addDays(target, -10);
      dates.preDepartureInspectionTo = target;
      if (target <= dep) throw new RuleInputError("arrivalDate (back in Japan) must be after departureDate");
      if (today > dates.notifyAqsBy) late = true;
      if (dates.antibodyValidUntil && target > dates.antibodyValidUntil) { redo = true; warnings.push(`Arrival ${target} is after the antibody result expires (${dates.antibodyValidUntil}): get a new draw abroad at a MAFF-designated lab before then (no new 180-day wait if the vaccine chain is unbroken).`); }
      if (vUntil && target > vUntil) warnings.push(`The vaccine's effective period ends ${vUntil}, before arrival: a booster abroad is needed before that date (1 day late breaks the chain and means 180 days' wait / detention).`);
      steps.push(noticeStep(dates.notifyAqsBy, today > dates.notifyAqsBy));
      steps.push({ step: "Clinical inspection abroad + government health certificate", date: `${dates.preDepartureInspectionFrom} → ${dates.preDepartureInspectionTo}`, status: "todo", rule: `Within 10 days before boarding for Japan: free of rabies${species === "dog" ? " and leptospirosis" : ""}, issued / endorsed by the exporting country's government.` });
      importActions(target, species, target);
    } else {
      warnings.push("Give arrivalDate (back in Japan) to get the 40-day notice deadline and the pre-departure inspection window abroad.");
    }
    dates.earliestArrival = null;
    quarantine = redo ? { expected: "up to 180 days", days: null, reason: "A step is invalid or missing." } : { expected: "12 hours or less", days: 0, reason: "Short-stay route: all steps done in Japan before departure, documents complete." };
    actions.unshift({ what: "Apply for the export inspection (NACCS) with the chip, 2 vaccine and antibody certificates", by: dates.exportApplyBy, from: null, where: "AQS office at the departure airport / port" });
    if (!blood) quarantine = { expected: "≤12 h if prepared before departure", days: null, reason: "Antibody test not done yet." };
    return finish();
  }

  // non-designated import
  if (!target && !plan) throw new RuleInputError("arrivalDate (YYYY-MM-DD) is required once the blood draw is done (or leave out bloodDrawDate to get the fastest plan)");
  const arr = target ?? plan!.earliestArrival!;
  if (!target) warnings.push(`No arrivalDate given: dates below assume the fastest arrival, ${arr}.`);
  const boarding = departure ?? arr;
  dates.notifyAqsBy = addDays(arr, -40);
  dates.preDepartureInspectionFrom = addDays(boarding, -10);
  dates.preDepartureInspectionTo = boarding;
  if (today > dates.notifyAqsBy) late = true;
  if (blood) {
    dates.earliestArrival = addDays(blood, 180);
    dates.earliestArrivalBasis = `Blood draw ${blood} + 180 days (draw = day 0).`;
    const waited = daysBetween(blood, arr);
    if (waited < 180) shortfall = 180 - Math.max(0, waited);
    if (dates.antibodyValidUntil && arr > dates.antibodyValidUntil) { redo = true; warnings.push(`Arrival ${arr} is after the antibody result expires (${dates.antibodyValidUntil}): draw again at a MAFF-designated lab before arrival. If the vaccine chain is unbroken and the new draw is 180+ days after the first, there is no new waiting period.`); }
  } else if (plan) {
    dates.earliestArrival = plan.earliestArrival;
    dates.earliestArrivalBasis = "Fastest plan from today (no blood draw yet).";
    const gap = Math.min(180, daysBetween(arr, addDays(plan.bloodDraw, 180)));
    if (gap > 0) shortfall = gap;
  }
  if (vUntil && arr > vUntil) warnings.push(`The vaccine's effective period ends ${vUntil}, before arrival ${arr}: give a booster before that date (a booster after it does not count and everything restarts).`);
  if (!vUntil && (v2 || v1)) warnings.push("Keep giving boosters before each vaccine's effective period ends until arrival; a booster even 1 day late breaks the chain and restarts everything, including the 180 days.");
  steps.push({ step: "180-day waiting period in the exporting country", date: dates.earliestArrival, status: shortfall ? "invalid" : blood ? "ok" : "todo", rule: shortfall ? `Arriving ${arr} is ${shortfall} days short: detention at AQS for the missing days at your cost (not counting the arrival day or the release day).` : "Arrive no earlier than 180 days after the passing blood draw, within the antibody result's 2-year validity and the vaccine's effective period." });
  steps.push(noticeStep(dates.notifyAqsBy, late));
  steps.push({ step: "Clinical inspection before departure + government certificate (Form AC)", date: `${dates.preDepartureInspectionFrom} → ${dates.preDepartureInspectionTo}`, status: "todo", rule: `Within 10 days before boarding: free of rabies${species === "dog" ? " and leptospirosis" : ""}; the exporting country's government endorses the certificate (no pencil, no correction fluid).` });
  quarantine = redo
    ? { expected: "up to 180 days (or sent back)", days: null, reason: "A step is invalid; fix it before travelling." }
    : shortfall
      ? { expected: `${shortfall} days`, days: shortfall, reason: "Arriving before the 180-day wait is over: the missing days are served at AQS (care, food and costs paid by the importer; caretaker companies at Narita, Haneda, Kansai)." }
      : blood
        ? { expected: "12 hours or less", days: 0, reason: "All steps done and 180 days met." }
        : { expected: "depends on the plan", days: null, reason: "Antibody test not done yet." };
  importActions(arr, species, boarding);
  return finish();

  // ---- helpers bound to this call ----
  function importActions(arrivalDay: string, sp: Species, boardingDay: string) {
    actions.push({ what: "Advance notification of import (NACCS or email form); keep the approval it returns", by: addDays(arrivalDay, -40), from: null, where: "AQS office at the arrival airport / port" });
    actions.push({ what: "Clinical inspection by a vet + government-endorsed health certificate", by: boardingDay, from: addDays(boardingDay, -10), where: "Country the pet flies to Japan from" });
    if (sp === "dog") {
      dates.registerDogBy = addDays(arrivalDay, 30);
      actions.push({ what: "Register the dog with the city with the import quarantine certificate; yearly rabies shot after that", by: dates.registerDogBy, from: arrivalDay, where: "City / ward office where the dog lives" });
      warnings.push(`Dogs may only enter Japan through 19 ports (11 airports, 8 seaports). Cats or assistance dogs at other ports: contact AQS first.`);
    }
    warnings.push("Keep the import quarantine certificate: it cannot be reissued and you need it to export the pet later.");
  }

  function finish(): CheckResult {
    let verdict: Verdict = "on_track";
    if (redo) verdict = "redo_required";
    else if (late) verdict = "deadline_passed";
    else if (shortfall) verdict = "quarantine_risk";
    else if (plan || steps.some((s) => s.status === "missing")) verdict = "plan";
    if (late) {
      const lateNote = direction === "import" || (direction === "return" && dates.notifyAqsBy && today > dates.notifyAqsBy)
        ? `The 40-day notice point (${dates.notifyAqsBy}) has passed: a notice filed later is in principle not accepted, and the arrival date cannot be moved earlier. Pick an arrival on or after ${addDays(today, 40)}.`
        : null;
      if (lateNote) warnings.unshift(lateNote);
    }
    const sp = SPECIES_LABEL[species].en.toLowerCase();
    const summary = makeSummary(verdict, sp);
    return {
      verdict, summary, direction, species, speciesLabel: `${SPECIES_LABEL[species].en} (${SPECIES_LABEL[species].ja})`, origin, region, steps, dates, exportApplication, quarantine,
      fastestPlan: plan, actions, warnings: [...new Set(warnings)], ports: species === "dog" && direction !== "export" ? DOG_PORTS : null, rulesAsOf: RULES_AS_OF, today, sources: SOURCES,
    };
  }

  function makeSummary(v: Verdict, sp: string): string {
    if (direction === "export") {
      return v === "deadline_passed"
        ? `Late: the export-inspection application for a ${departure} departure was due by ${dates.exportApplyBy}. Contact AQS now.`
        : `Apply for the export inspection by ${dates.exportApplyBy} (${exportApplication!.mandatory ? "mandatory" : "requested now, mandatory for dogs and rabbits from 2027-01-01"}); inspection ${dates.exportInspectionFrom} to ${dates.exportInspectionTo}.`;
    }
    if (species === "rabbit") return direction === "import" ? `Notify AQS by ${dates.notifyAqsBy} for a ${arrival} arrival.` : `Apply for the export inspection by ${dates.exportApplyBy}.`;
    if (v === "redo_required") return `A step does not meet the AQS rules: fix it before travelling, or the ${sp} faces up to 180 days' detention.${plan ? ` Fastest redo: arrival from ${plan.earliestArrival}.` : ""}`;
    if (v === "deadline_passed") return `Too late for this date: ${dates.notifyAqsBy && today > dates.notifyAqsBy ? `the 40-day AQS notice was due by ${dates.notifyAqsBy}. Choose an arrival on or after ${addDays(today, 40)}.` : `the export-inspection application was due by ${dates.exportApplyBy}.`}`;
    if (v === "quarantine_risk") return `Arriving ${arrival} means about ${shortfall} days of detention in Japan${dates.earliestArrival ? `; arrive from ${dates.earliestArrival} to avoid it` : ""}.`;
    if (direction === "return") return v === "plan"
      ? `Do chip, 2 rabies shots and the antibody test in Japan before ${departure}${plan ? ` (fastest: draw ${plan.bloodDraw}, result around ${plan.readyToDepartAbout})` : ""}; then ≤12 h quarantine on return. Export application by ${dates.exportApplyBy}.`
      : `Short-stay route on track: export application by ${dates.exportApplyBy}${dates.notifyAqsBy ? `, AQS notice by ${dates.notifyAqsBy} for the ${arrival} return` : ""}; ≤12 h quarantine if documents are complete.`;
    if (origin === "designated") return `Designated region: notify AQS by ${dates.notifyAqsBy}, vet check and Form AB ${dates.preDepartureInspectionFrom} to ${dates.preDepartureInspectionTo}.`;
    if (v === "plan") return `Not ready yet. Fastest legal arrival is ${plan?.earliestArrival ?? dates.earliestArrival} (180 days after a passing blood draw).`;
    return `On track: earliest arrival ${dates.earliestArrival}; notify AQS by ${dates.notifyAqsBy}; vet check ${dates.preDepartureInspectionFrom} to ${dates.preDepartureInspectionTo}.`;
  }
}

function chipStep(chip: string | null, v1: string | null): Step {
  if (!chip) return { step: "Microchip (ISO 11784/11785, 15 digits)", date: null, status: "missing", rule: "Implant first: on or before the day of the first counted rabies shot." };
  const bad = v1 && chip > v1;
  return { step: "Microchip (ISO 11784/11785, 15 digits)", date: chip, status: bad ? "invalid" : "ok", rule: bad ? "Implanted after vaccine #1: that shot does not count. Give 2 new shots after the chip." : "Implanted on or before the first rabies shot." };
}
function noticeStep(by: string, late: boolean): Step {
  return { step: "Advance notification to AQS (NACCS)", date: by, status: late ? "invalid" : "todo", rule: late ? "40-day point passed: in principle not accepted; choose a later arrival." : "At least 40 days before arrival, to the AQS office at the arrival port. Arrival cannot be moved earlier after notifying." };
}
function exportDates(dep: string) {
  return { exportApplyBy: addDays(dep, -14), exportInspectionFrom: addDays(dep, -10), exportInspectionTo: dep };
}
function exportRule(species: Species, dep: string): { mandatory: boolean; rule: string } {
  const mandatory = species !== "cat" && dep >= EXPORT_14DAY_MANDATORY_FROM;
  return {
    mandatory,
    rule: mandatory
      ? `Mandatory: dogs and rabbits exported on or after ${EXPORT_14DAY_MANDATORY_FROM} must be applied for at least 14 days before export (家畜伝染病予防法施行規則 amendment).`
      : species === "cat"
        ? "AQS asks for cats to be applied for 14+ days ahead too (the legal 14-day rule from 2027-01-01 covers dogs and rabbits)."
        : `Requested now; mandatory for dogs and rabbits exported on or after ${EXPORT_14DAY_MANDATORY_FROM}. AQS is very busy: apply earlier than 14 days if you can.`,
  };
}

export const RULES = {
  rulesAsOf: RULES_AS_OF,
  importFromNonDesignatedRegions: {
    steps: [
      "Microchip ISO 11784/11785 (15 digits), on or before the first rabies shot. 900202… chips not accepted; some 900-prefix chips duplicated: notify AQS early.",
      "Rabies vaccine #1 at 91+ days old (birth = day 0), after the chip; inactivated or recombinant only (no live / RNA).",
      "Vaccine #2: 30+ days after #1 (#1 = day 0) and within #1's effective period (duration of immunity).",
      "Blood draw on or after the #2 day, within the vaccine's effective period; MAFF-designated lab; ≥0.5 IU/ml; valid 2 years from the draw.",
      "Wait 180 days from the draw (draw = day 0) in the exporting country. Arrival also within the antibody validity and vaccine effective period (boosters on time).",
      "Advance notification to AQS at the arrival port 40+ days before arrival (NACCS / email). Later notices in principle not accepted; arrival cannot be moved earlier.",
      "Clinical inspection within 10 days before boarding (rabies; dogs also leptospirosis); government-endorsed certificate (Form AC).",
      "Import inspection on arrival: ≤12 h if all is in order; otherwise detention up to 180 days (or shipped back), importer pays.",
    ],
    earlyArrival: "Arriving before the 180 days are up: detention for the remaining days (not counting arrival and release days). No medical exceptions.",
    antibodyExpired: "New draw at a designated lab before the 2-year validity ends; no new waiting period if the vaccine chain is unbroken.",
  },
  importFromDesignatedRegions: {
    regions: DESIGNATED_REGIONS,
    rule: "Microchip, residence (since birth / 180+ days immediately before export / since coming directly from Japan; otherwise detention for 180 minus days resident), 40-day notice, clinical inspection within 10 days before boarding, Form AB, direct transport or seal / ANNEX. No vaccine, antibody test or 180-day wait.",
  },
  exportFromJapan: {
    rule: "Apply for export inspection to AQS at least 14 days before export (NACCS or email; up to 3 preferred times in remarks); inspection within 10 days before departure unless the destination says otherwise. Check the destination's entry rules with its embassy.",
    from2027: "Dogs and rabbits exported on or after 2027-01-01: the 14-day application is mandatory (家畜伝染病予防法施行規則 amendment). Rabbits imported as cargo from 2027-01-01: 40-day import notification mandatory.",
  },
  shortStayAbroad: {
    rule: "Leaving Japan and coming back: do microchip, 2 rabies shots and the antibody test (≥0.5 IU/ml) in Japan before departure → no 180-day wait abroad, ≤12 h quarantine on return within 2 years of the draw (boosters abroad on time; redraw abroad if the 2 years run out). 40-day notice before return and a vet check within 10 days before boarding abroad still apply.",
  },
  dogPorts: DOG_PORTS,
  afterImport: "Dogs: register with the city within 30 days of import with the import quarantine certificate; yearly rabies shot. Keep the certificate (no reissue; needed to export).",
  sources: SOURCES,
  disclaimer: DISCLAIMER,
};
