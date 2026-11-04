import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Long unbroken URLs (the API example in the FAQ, official source links) widened the page
// past a 390 px phone viewport. The app root must let them wrap.
test("app root wraps long URLs on narrow screens", () => {
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  const block = css.match(/#app-root\s*\{([^}]*)\}/);
  assert.ok(block, "#app-root rule exists");
  assert.match(block[1], /overflow-wrap:\s*anywhere/);
});
