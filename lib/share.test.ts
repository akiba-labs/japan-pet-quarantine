import assert from "node:assert/strict";
import test from "node:test";
import { EXAMPLES, EXAMPLE_SHARED, isIndexable, parseShared, resultPath, safeCheck, sharedQuery } from "./share";

test("share links round-trip and compute", () => {
  for (const ex of EXAMPLES) {
    const back = parseShared(new URLSearchParams(sharedQuery(ex)));
    assert.deepEqual(back, ex);
    assert.ok(isIndexable(ex));
    assert.ok(safeCheck(ex), JSON.stringify(ex));
  }
  assert.equal(resultPath(EXAMPLE_SHARED), "/r?d=import&s=dog&c=US&b=2026-03-01&m=2026-06-10&v1=2026-06-10&v2=2026-07-20&x=2026-08-05&a=2027-01-20&t=2026-10-31");
  assert.equal(safeCheck(EXAMPLES[1])!.verdict, "plan");
  assert.equal(safeCheck(EXAMPLES[2])!.exportApplication!.mandatory, true);
});

test("bad share params → null", () => {
  assert.equal(parseShared(new URLSearchParams("d=fly&s=dog")), null);
  assert.equal(parseShared(new URLSearchParams("d=import&s=hamster")), null);
});
