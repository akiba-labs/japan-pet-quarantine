import { DIRECTIONS, SPECIES, checkPet, type CheckInput, type Direction, type Species } from "./pet";

export { PUBLIC_URL } from "./api";

type Params = URLSearchParams | Record<string, string | string[] | undefined>;
function one(p: Params, k: string): string | null {
  const v = p instanceof URLSearchParams ? p.get(k) : p[k];
  const f = Array.isArray(v) ? v[0] : v;
  return f === undefined || f === null || f === "" ? null : String(f);
}
const ISO = /^\d{4}-\d{2}-\d{2}$/;
function date(p: Params, k: string): string | null {
  const v = one(p, k);
  return v && ISO.test(v) ? v : null;
}

export type Shared = {
  direction: Direction;
  species: Species;
  country: string | null;
  birthDate: string | null;
  microchipDate: string | null;
  vaccine1Date: string | null;
  vaccine2Date: string | null;
  bloodDrawDate: string | null;
  residentSince: string | null;
  arrivalDate: string | null;
  departureDate: string | null;
  today: string | null;
};

// short query keys for share links
const KEYS: [keyof Shared, string][] = [
  ["direction", "d"], ["species", "s"], ["country", "c"], ["birthDate", "b"], ["microchipDate", "m"], ["vaccine1Date", "v1"], ["vaccine2Date", "v2"],
  ["bloodDrawDate", "x"], ["residentSince", "rs"], ["arrivalDate", "a"], ["departureDate", "l"], ["today", "t"],
];

export const EXAMPLE_SHARED: Shared = { direction: "import", species: "dog", country: "US", birthDate: "2026-03-01", microchipDate: "2026-06-10", vaccine1Date: "2026-06-10", vaccine2Date: "2026-07-20", bloodDrawDate: "2026-08-05", residentSince: null, arrivalDate: "2027-01-20", departureDate: null, today: "2026-10-31" };
export const EXAMPLE_PLAN: Shared = { direction: "import", species: "cat", country: "GB", birthDate: "2024-05-01", microchipDate: null, vaccine1Date: null, vaccine2Date: null, bloodDrawDate: null, residentSince: null, arrivalDate: null, departureDate: null, today: "2026-10-31" };
export const EXAMPLE_EXPORT: Shared = { direction: "export", species: "dog", country: null, birthDate: null, microchipDate: null, vaccine1Date: null, vaccine2Date: null, bloodDrawDate: null, residentSince: null, arrivalDate: null, departureDate: "2027-01-10", today: "2026-10-31" };
export const EXAMPLES = [EXAMPLE_SHARED, EXAMPLE_PLAN, EXAMPLE_EXPORT];

export function parseShared(p: Params): Shared | null {
  const d = one(p, "d");
  const s = one(p, "s");
  if (!d || !(DIRECTIONS as readonly string[]).includes(d) || !s || !(SPECIES as readonly string[]).includes(s)) return null;
  const c = one(p, "c");
  return {
    direction: d as Direction,
    species: s as Species,
    country: c && /^[A-Za-z_ -]{2,24}$/.test(c) ? c : null,
    birthDate: date(p, "b"),
    microchipDate: date(p, "m"),
    vaccine1Date: date(p, "v1"),
    vaccine2Date: date(p, "v2"),
    bloodDrawDate: date(p, "x"),
    residentSince: date(p, "rs"),
    arrivalDate: date(p, "a"),
    departureDate: date(p, "l"),
    today: date(p, "t"),
  };
}

export function sharedQuery(s: Shared): string {
  const q = new URLSearchParams();
  for (const [k, short] of KEYS) {
    const v = s[k];
    if (v) q.set(short, String(v));
  }
  return q.toString();
}

export function toCheckInput(s: Shared): CheckInput {
  return { ...s };
}
export function safeCheck(s: Shared) {
  try {
    return checkPet(toCheckInput(s));
  } catch {
    return null;
  }
}
export function resultPath(s: Shared): string {
  return `/r?${sharedQuery(s)}`;
}
export function ogPath(s: Shared): string {
  return `/og?${sharedQuery(s)}`;
}
export function isIndexable(s: Shared): boolean {
  return EXAMPLES.some((e) => resultPath(e) === resultPath(s));
}
