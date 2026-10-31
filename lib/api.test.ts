import assert from "node:assert/strict";
import test from "node:test";
import { apiHandler, openapiDoc, preflight } from "./agent-api";
import { API_DISCLAIMER, API_INFO, ENDPOINTS, EXAMPLE_GET, PUBLIC_URL } from "./api";

const e = ENDPOINTS.check;
const handler = apiHandler(e.compute, { disclaimer: API_DISCLAIMER, docs: `${PUBLIC_URL}/openapi.json`, example: `${PUBLIC_URL}${e.example}` });

test(`GET ${EXAMPLE_GET} → on_track, earliest 2027-02-01`, async () => {
  const res = await handler(new Request(`${PUBLIC_URL}${EXAMPLE_GET}&today=2026-10-31`));
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("access-control-allow-origin"), "*");
  const body = await res.json();
  assert.equal(body.disclaimer, API_DISCLAIMER);
  assert.equal(body.verdict, "on_track");
  assert.equal(body.dates.earliestArrival, "2027-02-01");
  assert.equal(body.dates.notifyAqsBy, "2027-05-06");
  assert.ok(body.sources.length);
});

test("POST JSON body matches GET", async () => {
  const url = new URL(`${PUBLIC_URL}${EXAMPLE_GET}&today=2026-10-31`);
  const post = await handler(new Request(`${PUBLIC_URL}${e.path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(url.searchParams)) }));
  const get = await handler(new Request(url));
  assert.equal(post.status, 200);
  assert.deepEqual(await post.json(), await get.json());
});

test("aliases", async () => {
  const b = await (await handler(new Request(`${PUBLIC_URL}${e.path}?direction=${encodeURIComponent("輸出")}&species=${encodeURIComponent("犬")}&exportDate=2027-01-10&today=2026-10-31`))).json();
  assert.equal(b.direction, "export");
  assert.equal(b.species, "dog");
  assert.equal(b.exportApplication.mandatory, true);
  const x = await (await handler(new Request(`${PUBLIC_URL}${e.path}?mode=to_japan&pet=kitten&from=NZ&residentSinceBirth=yes&arrival=2027-01-15&today=2026-10-31`))).json();
  assert.equal(x.origin, "designated");
  assert.equal(x.species, "cat");
  const r = await (await handler(new Request(`${PUBLIC_URL}${e.path}?direction=round_trip&species=dog&departure=2027-03-01&today=2026-10-31`))).json();
  assert.equal(r.direction, "return");
  assert.equal(r.verdict, "plan");
});

test("bad inputs → 400 with example", async () => {
  for (const q of ["species=dog&arrivalDate=2027-01-01", "direction=import&arrivalDate=2027-01-01", "direction=fly&species=dog", "direction=import&species=hamster", "direction=import&species=dog&arrivalDate=2027-13-01", "direction=export&species=dog", "direction=import&species=dog&bloodDrawDate=2026-08-05", "direction=import&species=dog&titer=lots&arrivalDate=2027-06-01"]) {
    const res = await handler(new Request(`${PUBLIC_URL}${e.path}?${q}`));
    assert.equal(res.status, 400, q);
    const body = await res.json();
    assert.equal(body.disclaimer, API_DISCLAIMER);
    assert.ok(body.example);
  }
});

test("malformed JSON body → 400", async () => {
  const res = await handler(new Request(`${PUBLIC_URL}${e.path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{nope" }));
  assert.equal(res.status, 400);
});

test("OPTIONS preflight is CORS open", () => {
  const res = preflight();
  assert.equal(res.status, 204);
  assert.equal(res.headers.get("access-control-allow-origin"), "*");
});

test("OpenAPI lists /api/check GET and POST", () => {
  const spec = openapiDoc(API_INFO, PUBLIC_URL, [e]) as { openapi: string; paths: Record<string, { get: { parameters: { name: string }[] }; post: unknown }> };
  assert.ok(spec.openapi.startsWith("3."));
  assert.ok(spec.paths["/api/check"]?.post);
  assert.ok(spec.paths["/api/check"].get.parameters.find((p) => p.name === "bloodDrawDate"));
});
