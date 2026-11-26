import assert from "node:assert/strict";
import test from "node:test";
import { isGithubPages, withBasePath } from "./hosting";

test("Vercel build keeps root-relative links", () => {
  assert.equal(isGithubPages, false);
  assert.equal(withBasePath("/legal/disclaimer"), "/legal/disclaimer");
  assert.equal(withBasePath("/llms.txt"), "/llms.txt");
  assert.equal(withBasePath("/"), "/");
});
