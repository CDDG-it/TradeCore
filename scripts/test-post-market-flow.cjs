const { test } = require("node:test");
const assert = require("node:assert/strict");

const flow = import("../src/lib/post-market/flow.ts");

test("the yes and no routes retain R analysis for winning trades", async () => {
  const { postMarketSteps } = await flow;
  assert.deepEqual(postMarketSteps(true, true, 2), ["verdict", "why", "market", "r", "complete"]);
  assert.deepEqual(postMarketSteps(true, false, 2), ["verdict", "why", "market", "screenshots", "r", "complete"]);
});

test("days without winners and lower-tier reviews skip irrelevant steps", async () => {
  const { postMarketSteps } = await flow;
  assert.deepEqual(postMarketSteps(true, false, 0), ["verdict", "why", "market", "screenshots", "complete"]);
  assert.deepEqual(postMarketSteps(false, false, 1), ["market", "r", "complete"]);
});

test("a saved step resumes and legacy recap-only rows still ask the verdict", async () => {
  const { initialPostMarketStep } = await flow;
  const legacy = { review_step: null, taken_was_best: false, notes: "", screenshot_groups: [] };
  assert.equal(initialPostMarketStep(legacy, true), "verdict");
  assert.equal(initialPostMarketStep({ ...legacy, notes: "A cleaner entry" }, true), "why");
  assert.equal(initialPostMarketStep({ ...legacy, review_step: "r" }, true), "r");
  assert.equal(initialPostMarketStep({ ...legacy, review_step: "complete" }, false), "complete");
});
