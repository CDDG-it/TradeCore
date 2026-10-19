/* eslint-disable @typescript-eslint/no-require-imports */
const test = require("node:test");
const assert = require("node:assert/strict");
const { pathToFileURL } = require("node:url");
const path = require("node:path");

const cacheModule = import(pathToFileURL(path.join(__dirname, "../src/lib/supabase/cache.ts")).href);

test("an old account response cannot refill the cache after sign-out", async () => {
  const { cachedRead, invalidateReads, peekRead } = await cacheModule;
  let finishOld;
  const old = cachedRead("trades:account-switch", () => new Promise((resolve) => { finishOld = resolve; }));
  invalidateReads();
  const current = cachedRead("trades:account-switch", async () => "current account");
  assert.equal(await current, "current account");
  finishOld("old account");
  assert.equal(await old, "old account");
  assert.equal(peekRead("trades:account-switch"), "current account");
  invalidateReads();
});

test("a mutation invalidates pending reads with the same prefix", async () => {
  const { cachedRead, invalidateReads, peekRead } = await cacheModule;
  let finish;
  const pending = cachedRead("trades:journal", () => new Promise((resolve) => { finish = resolve; }));
  invalidateReads("trades");
  finish(["stale"]);
  await pending;
  assert.equal(peekRead("trades:journal"), undefined);
});
