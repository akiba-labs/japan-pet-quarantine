import { InputError, type Endpoint, type Input } from "./agent-api";
import { DIRECTIONS, DISCLAIMER, ORIGINS, RuleInputError, SPECIES, checkPet, type Direction, type Origin, type Species } from "./pet";
import { SITE_NAME, SITE_TAGLINE } from "./site";

export const PUBLIC_URL = "https://japan-pet-quarantine.vercel.app";
export const API_DISCLAIMER = DISCLAIMER;
export const API_INFO = { title: `${SITE_NAME} API`, description: SITE_TAGLINE, version: "1.0.0" };

export const EXAMPLE_GET =
  "/api/check?direction=import&species=dog&country=US&birthDate=2026-03-01&microchipDate=2026-06-10&vaccine1Date=2026-06-10&vaccine2Date=2026-07-20&bloodDrawDate=2026-08-05&titer=2.1&arrivalDate=2027-06-15";

function first(v: unknown): unknown {
  return Array.isArray(v) ? v[0] : v;
}
function s(v: unknown): string | null {
  const f = first(v);
  return f === undefined || f === null || String(f).trim() === "" ? null : String(f).trim();
}
function b(v: unknown): boolean {
  const f = first(v);
  if (typeof f === "boolean") return f;
  return f !== undefined && f !== null && /^(1|true|yes|y|on)$/i.test(String(f).trim());
}
function n(v: unknown, name: string): number | null {
  const f = s(v);
  if (f === null) return null;
  const x = Number(f);
  if (!Number.isFinite(x)) throw new InputError(`${name} must be a number`);
  return x;
}

const DIRECTION_ALIASES: Record<string, Direction> = {
  to_japan: "import", into_japan: "import", bring: "import", entry: "import", inbound: "import", 輸入: "import", 入国: "import",
  from_japan: "export", leave: "export", leaving: "export", outbound: "export", exit: "export", 輸出: "export", 出国: "export",
  roundtrip: "return", round_trip: "return", reentry: "return", re_entry: "return", short_stay: "return", short_trip: "return", trip: "return", 一時帰国: "return", 短期滞在: "return", 再入国: "return",
};
const SPECIES_ALIASES: Record<string, Species> = { dogs: "dog", puppy: "dog", 犬: "dog", いぬ: "dog", cats: "cat", kitten: "cat", 猫: "cat", ねこ: "cat", rabbits: "rabbit", bunny: "rabbit", うさぎ: "rabbit", 兎: "rabbit" };
const ORIGIN_ALIASES: Record<string, Origin> = { non_designated: "other", nondesignated: "other", rabies: "other", 指定地域以外: "other", rabies_free: "designated", free: "designated", 指定地域: "designated" };

function pick<T extends string>(raw: string | null, allowed: readonly T[], aliases: Record<string, T>, name: string, fallback: T | null): T | null {
  if (!raw) return fallback;
  const k = raw.toLowerCase().replace(/[\s-]+/g, "_");
  const v = (aliases[k] ?? aliases[raw] ?? k) as T;
  if (!(allowed as readonly string[]).includes(v)) throw new InputError(`Invalid ${name} "${raw}". Allowed: ${allowed.join(", ")}`);
  return v;
}

export function computeCheck(input: Input) {
  try {
    const direction = pick(s(input.direction ?? input.mode ?? input.trip), DIRECTIONS, DIRECTION_ALIASES, "direction", null);
    if (!direction) throw new InputError(`Missing direction. Allowed: ${DIRECTIONS.join(", ")} (import = bring a pet into Japan, export = take it out, return = leave Japan and come back)`);
    const species = pick(s(input.species ?? input.pet ?? input.animal), SPECIES, SPECIES_ALIASES, "species", null);
    if (!species) throw new InputError(`Missing species. Allowed: ${SPECIES.join(", ")}`);
    return checkPet({
      direction,
      species,
      origin: pick(s(input.origin ?? input.region), ORIGINS, ORIGIN_ALIASES, "origin", null),
      country: s(input.country ?? input.from),
      birthDate: s(input.birthDate ?? input.dob ?? input.birthday),
      microchipDate: s(input.microchipDate ?? input.chipDate),
      microchipNumber: s(input.microchipNumber ?? input.chipNumber ?? input.microchip),
      vaccine1Date: s(input.vaccine1Date ?? input.rabies1 ?? input.vaccine1),
      vaccine1ValidUntil: s(input.vaccine1ValidUntil),
      vaccine2Date: s(input.vaccine2Date ?? input.rabies2 ?? input.vaccine2),
      vaccineValidUntil: s(input.vaccineValidUntil ?? input.vaccineExpiry),
      bloodDrawDate: s(input.bloodDrawDate ?? input.bloodDate ?? input.titerDate ?? input.bloodSampleDate),
      titer: n(input.titer ?? input.titre ?? input.antibody, "titer"),
      residentSince: s(input.residentSince),
      residentSinceBirth: b(input.residentSinceBirth),
      arrivalDate: s(input.arrivalDate ?? input.arrival ?? input.returnDate),
      departureDate: s(input.departureDate ?? input.departure ?? input.exportDate),
      today: s(input.today),
    });
  } catch (e) {
    if (e instanceof RuleInputError) throw new InputError(e.message);
    throw e;
  }
}

export const ENDPOINTS: Record<"check", Endpoint> = {
  check: {
    path: "/api/check",
    operationId: "japanPetQuarantineCheck",
    summary: "Bringing a dog or cat into Japan, taking it out, or leaving and coming back: which dates work and what is due when?",
    description:
      "Applies the MAFF Animal Quarantine Service (AQS, 動物検疫所) rules for dogs and cats (rules as of 2026-10-31). direction=import from a non-designated region (most countries incl. the US mainland, UK, EU, Canada, Asia): microchip (ISO, on or before the 1st shot), rabies shot #1 at 91+ days old, #2 30+ days later within #1's effective period, blood draw on/after #2 at a MAFF-designated lab (≥0.5 IU/ml, valid 2 years), earliest arrival = draw + 180 days (draw = day 0), early arrival = detention for the missing days, 40-day advance notice (NACCS), clinical inspection within 10 days before boarding, dogs only via 19 ports, register dogs with the city within 30 days. From a designated region (Iceland, Australia, New Zealand, Fiji, Hawaii, Guam): chip + residence (180 days / since birth) + notice + Form AB, no wait. direction=export: apply for export inspection 14+ days before (mandatory for dogs and rabbits exported from 2027-01-01), inspection within 10 days before departure. direction=return: prepare in Japan before leaving → no 180-day wait abroad, ≤12 h quarantine on return. Rabbits: only the 2027 dated deadlines. Returns verdict (on_track | plan | quarantine_risk | deadline_passed | redo_required), summary, steps[{step, date, status, rule}], dates {earliestArrival, antibodyValidUntil, notifyAqsBy, preDepartureInspectionFrom/To, exportApplyBy, exportInspectionFrom/To, registerDogBy}, exportApplication {mandatory, rule}, quarantine {expected, days, reason}, fastestPlan (if prep is incomplete), actions, warnings, ports (dogs), sources, disclaimer.",
    params: [
      { name: "direction", type: "string", required: true, enum: DIRECTIONS, description: "import (bring a pet into Japan) | export (take it out of Japan) | return (leave Japan short-term and come back; prep done in Japan). Aliases: to_japan, leaving, round_trip, 輸入, 輸出, 一時帰国…" },
      { name: "species", type: "string", required: true, enum: SPECIES, description: "dog | cat | rabbit (rabbit: only the 2027 dated deadlines). Aliases: 犬, 猫, うさぎ." },
      { name: "country", type: "string", description: "import: where the pet comes from (ISO code or name). IS, AU, NZ, FJ, Hawaii (US-HI), Guam (GU) → designated; anything else → other." },
      { name: "origin", type: "string", enum: ORIGINS, description: "import: other (default, non-designated) | designated. Overrides country." },
      { name: "birthDate", type: "string", description: "YYYY-MM-DD pet's date of birth." },
      { name: "microchipDate", type: "string", description: "YYYY-MM-DD the ISO microchip was implanted." },
      { name: "microchipNumber", type: "string", description: "Optional 15-digit chip number (checks the 900202 ban and 900-prefix duplicate warning). Not stored." },
      { name: "vaccine1Date", type: "string", description: "YYYY-MM-DD first rabies shot counted (after the chip)." },
      { name: "vaccine1ValidUntil", type: "string", description: "Optional YYYY-MM-DD end of shot #1's effective period (default: 1 year)." },
      { name: "vaccine2Date", type: "string", description: "YYYY-MM-DD second rabies shot." },
      { name: "vaccineValidUntil", type: "string", description: "Optional YYYY-MM-DD end of the latest shot's effective period (to check the arrival / booster)." },
      { name: "bloodDrawDate", type: "string", description: "YYYY-MM-DD blood draw for the rabies antibody test (MAFF-designated lab)." },
      { name: "titer", type: "number", description: "Optional antibody result in IU/ml (must be ≥0.5; default: assumed passing)." },
      { name: "residentSince", type: "string", description: "Designated region: YYYY-MM-DD since when the pet has lived there continuously." },
      { name: "residentSinceBirth", type: "boolean", default: false, description: "Designated region: lived there since birth (or since coming directly from Japan)." },
      { name: "arrivalDate", type: "string", description: "YYYY-MM-DD planned arrival in Japan (import: required; return: the day back)." },
      { name: "departureDate", type: "string", description: "export / return: YYYY-MM-DD the pet leaves Japan (required). import: optional boarding date abroad (default: arrivalDate)." },
      { name: "today", type: "string", description: "Override today's date (default: today in Japan)." },
    ],
    example: EXAMPLE_GET,
    compute: computeCheck,
  },
};

export const PLUGIN = {
  name: "Japan Pet Quarantine Check",
  nameForModel: "japan_pet_quarantine",
  descriptionForHuman: "Bring a dog or cat to Japan, take it abroad, or come back: earliest arrival, 40-day notice, 14-day export rule.",
  descriptionForModel:
    "Use when someone asks how to bring a dog or cat into Japan (rabies vaccines, antibody / titer test, 180-day wait, how early to notify, detention if early), how to take a pet out of Japan (export inspection 14 days ahead, mandatory for dogs and rabbits exported from 2027-01-01), or how to travel abroad with a pet and come back without a long quarantine. Computes the dates from MAFF Animal Quarantine Service rules instead of guessing; relay the disclaimer (educational; AQS decides; destination and airline rules also apply).",
  logo: "/icon.svg",
};
