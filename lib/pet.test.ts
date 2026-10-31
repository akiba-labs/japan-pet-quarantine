import assert from "node:assert/strict";
import test from "node:test";
import { EXPORT_14DAY_MANDATORY_FROM, RULES, checkPet, microchipWarnings } from "./pet";

const T = "2026-10-31";
const base = { direction: "import" as const, species: "dog" as const, country: "US", birthDate: "2026-03-01", microchipDate: "2026-06-10", vaccine1Date: "2026-06-10", vaccine2Date: "2026-07-20", bloodDrawDate: "2026-08-05", titer: 2.1, today: T };

test("on track: arrival 180+ days after the draw", () => {
  const r = checkPet({ ...base, arrivalDate: "2027-06-15" });
  assert.equal(r.verdict, "on_track");
  assert.equal(r.origin, "other");
  assert.equal(r.dates.earliestArrival, "2027-02-01");
  assert.equal(r.dates.notifyAqsBy, "2027-05-06");
  assert.equal(r.dates.preDepartureInspectionFrom, "2027-06-05");
  assert.equal(r.dates.antibodyValidUntil, "2028-08-05");
  assert.equal(r.dates.registerDogBy, "2027-07-15");
  assert.equal(r.quarantine.days, 0);
  assert.ok(r.ports);
});

test("arrival on day 180 exactly is fine, day 179 = 1 day detention", () => {
  assert.equal(checkPet({ ...base, arrivalDate: "2027-02-01" }).verdict, "on_track");
  const r = checkPet({ ...base, arrivalDate: "2027-01-31" });
  assert.equal(r.verdict, "quarantine_risk");
  assert.equal(r.quarantine.days, 1);
});

test("early arrival → detention days", () => {
  const r = checkPet({ ...base, arrivalDate: "2027-01-20" });
  assert.equal(r.verdict, "quarantine_risk");
  assert.equal(r.quarantine.days, 12);
  assert.match(r.summary, /12 days/);
});

test("40-day notice passed", () => {
  const r = checkPet({ ...base, arrivalDate: "2027-02-10", today: "2027-01-05" });
  assert.equal(r.dates.notifyAqsBy, "2027-01-01");
  assert.equal(r.verdict, "deadline_passed");
  assert.match(r.warnings[0], /2027-02-14/);
});

test("invalid steps → redo_required", () => {
  assert.equal(checkPet({ ...base, microchipDate: "2026-06-11", arrivalDate: "2027-06-15" }).verdict, "redo_required"); // chip after shot
  assert.equal(checkPet({ ...base, vaccine1Date: "2026-05-30", microchipDate: "2026-05-30", arrivalDate: "2027-06-15" }).verdict, "redo_required"); // day 90
  assert.equal(checkPet({ ...base, vaccine1Date: "2026-05-31", microchipDate: "2026-05-31", arrivalDate: "2027-06-15" }).verdict, "on_track"); // day 91
  assert.equal(checkPet({ ...base, vaccine2Date: "2026-07-09", arrivalDate: "2027-06-15" }).verdict, "redo_required"); // 29 days
  assert.equal(checkPet({ ...base, vaccine2Date: "2026-07-10", bloodDrawDate: "2026-07-10", arrivalDate: "2027-06-15" }).verdict, "on_track"); // 30 days, same-day draw
  assert.equal(checkPet({ ...base, bloodDrawDate: "2026-07-19", arrivalDate: "2027-06-15" }).verdict, "redo_required"); // draw before #2
  assert.equal(checkPet({ ...base, titer: 0.4, arrivalDate: "2027-06-15" }).verdict, "redo_required");
  assert.equal(checkPet({ ...base, vaccine1ValidUntil: "2026-07-15", arrivalDate: "2027-06-15" }).verdict, "redo_required"); // #2 after #1 lapsed
  assert.equal(checkPet({ ...base, arrivalDate: "2028-08-06" }).verdict, "redo_required"); // antibody expired
});

test("no prep yet → fastest plan", () => {
  const r = checkPet({ direction: "import", species: "cat", country: "GB", birthDate: "2024-05-01", today: T });
  assert.equal(r.verdict, "plan");
  assert.ok(r.fastestPlan);
  assert.equal(r.fastestPlan!.vaccine1, T);
  assert.equal(r.fastestPlan!.vaccine2, "2026-11-30");
  assert.equal(r.fastestPlan!.earliestArrival, "2027-05-29");
  assert.equal(r.dates.notifyAqsBy, "2027-04-19");
  assert.equal(r.ports, null);
  // kitten: first shot waits until day 91
  const k = checkPet({ direction: "import", species: "cat", birthDate: "2026-10-01", today: T });
  assert.equal(k.fastestPlan!.vaccine1, "2026-12-31");
});

test("designated region: residence rule", () => {
  const ok = checkPet({ direction: "import", species: "dog", country: "Hawaii", residentSinceBirth: true, microchipDate: "2026-01-01", arrivalDate: "2027-01-15", today: T });
  assert.equal(ok.origin, "designated");
  assert.equal(ok.region, "Hawaii");
  assert.equal(ok.verdict, "on_track");
  assert.equal(ok.dates.earliestArrival, null);
  const short = checkPet({ direction: "import", species: "cat", country: "AU", residentSince: "2026-09-01", arrivalDate: "2027-01-15", today: T });
  assert.equal(short.verdict, "quarantine_risk");
  assert.equal(short.quarantine.days, 180 - 136);
});

test("export: 14-day rule mandatory for dogs from 2027-01-01, not for cats", () => {
  const d = checkPet({ direction: "export", species: "dog", departureDate: "2027-01-10", today: T });
  assert.equal(d.dates.exportApplyBy, "2026-12-27");
  assert.equal(d.dates.exportInspectionFrom, "2026-12-31");
  assert.equal(d.exportApplication!.mandatory, true);
  assert.equal(checkPet({ direction: "export", species: "dog", departureDate: "2026-12-31", today: T }).exportApplication!.mandatory, false);
  assert.equal(checkPet({ direction: "export", species: "cat", departureDate: "2027-03-01", today: T }).exportApplication!.mandatory, false);
  assert.equal(checkPet({ direction: "export", species: "rabbit", departureDate: EXPORT_14DAY_MANDATORY_FROM, today: T }).exportApplication!.mandatory, true);
  assert.equal(checkPet({ direction: "export", species: "dog", departureDate: "2027-01-10", today: "2026-12-28" }).verdict, "deadline_passed");
});

test("return: short-stay route", () => {
  const r = checkPet({ direction: "return", species: "dog", birthDate: "2024-01-01", microchipDate: "2026-06-01", vaccine1Date: "2026-06-01", vaccine2Date: "2026-07-05", bloodDrawDate: "2026-07-05", departureDate: "2026-12-20", arrivalDate: "2027-01-10", today: T });
  assert.equal(r.verdict, "on_track");
  assert.equal(r.quarantine.expected, "12 hours or less");
  assert.equal(r.dates.exportApplyBy, "2026-12-06");
  assert.equal(r.dates.notifyAqsBy, "2026-12-01");
  assert.equal(r.exportApplication!.mandatory, false);
  const late = checkPet({ direction: "return", species: "dog", birthDate: "2024-01-01", microchipDate: "2026-06-01", vaccine1Date: "2026-06-01", vaccine2Date: "2026-07-05", bloodDrawDate: "2026-12-25", departureDate: "2026-12-20", arrivalDate: "2027-01-10", today: T });
  assert.equal(late.verdict, "redo_required");
  const plan = checkPet({ direction: "return", species: "cat", birthDate: "2024-01-01", departureDate: "2026-11-20", today: T });
  assert.equal(plan.verdict, "plan");
  assert.ok(plan.warnings.some((w) => /not enough time/i.test(w)));
});

test("rabbit import: 40-day notice only", () => {
  const r = checkPet({ direction: "import", species: "rabbit", arrivalDate: "2027-02-20", today: T });
  assert.equal(r.dates.notifyAqsBy, "2027-01-11");
  assert.equal(r.verdict, "on_track");
});

test("microchip number checks", () => {
  assert.equal(microchipWarnings("392141000123456").warnings.length, 0);
  assert.equal(microchipWarnings("900202000123456").ok, false);
  assert.equal(microchipWarnings("900113000123456").ok, true);
  assert.equal(microchipWarnings("900113000123456").warnings.length, 1);
  assert.equal(microchipWarnings("12345").ok, false);
});

test("bad input throws", () => {
  assert.throws(() => checkPet({ ...base, birthDate: "2026-02-30", arrivalDate: "2027-06-15" }));
  assert.throws(() => checkPet({ ...base, vaccine1Date: "2026-01-01", arrivalDate: "2027-06-15" })); // before birth
  assert.throws(() => checkPet({ ...base })); // blood done, no arrival
  assert.throws(() => checkPet({ direction: "export", species: "dog", today: T }));
  assert.throws(() => checkPet({ direction: "import", species: "dog", country: "JP", today: T }));
});

test("RULES carry sources and disclaimer", () => {
  assert.equal(RULES.rulesAsOf, "2026-10-31");
  assert.ok(RULES.sources.length >= 6);
  assert.match(RULES.disclaimer, /not affiliated with MAFF/);
  assert.equal(RULES.dogPorts.airports.length + RULES.dogPorts.seaports.length, 19);
});
