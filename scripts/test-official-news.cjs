/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (loaded, filename) => loaded._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, filename);
const { parseOfficialFeed, OFFICIAL_FEEDS, assembleOfficialNews, plainText } = require('../src/lib/gmi/official-feeds.ts');
const { filterNews, marketsSection, publicationLabel } = require('../src/lib/gmi/news-view.ts');
const feed = OFFICIAL_FEEDS[0];
const date = '2026-10-01T18:00:00Z';
const now = Date.parse('2026-10-03T10:00:00Z');
const rss = (items) => `<rss version="2.0"><channel><title>Official feed</title>${items}</channel></rss>`;
const item = ({ title = 'Policy release', link = '/newsevents/release.htm', published = date, description = 'Official excerpt' } = {}) => `<item><title>${title}</title><link>${link}</link>${published ? `<pubDate>${published}</pubDate>` : ''}<description>${description}</description></item>`;
const article = parseOfficialFeed(rss(item()), feed)[0];

test('RSS normalizes relative links and preserves original publisher fields', () => {
  assert.equal(article.url, 'https://www.federalreserve.gov/newsevents/release.htm');
  assert.equal(article.source, 'Federal Reserve');
  assert.equal(article.title, 'Policy release');
  assert.equal(article.sentimentScore, null);
  assert.equal(article.publishedPrecision, 'time');
  assert.equal(article.publishedAt, '2026-10-01T18:00:00.000Z');
});

test('BLS Atom supports alternate links, CDATA, content and source timezone', () => {
  const xml = `<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>Employment &amp; wages</title><link rel="self" href="https://www.bls.gov/feed/cpi.rss"/><link href="https://www.bls.gov/news.release/archives/test.htm"/><published>2026-10-01T08:30:00-04:00</published><updated>2026-10-02T10:00:00Z</updated><content><![CDATA[<p>Payrolls <b>increased</b>. &amp; wages</p>]]></content></entry></feed>`;
  const result = parseOfficialFeed(xml, OFFICIAL_FEEDS[4])[0];
  assert.equal(result.title, 'Employment & wages');
  assert.equal(result.publishedAt, '2026-10-01T12:30:00.000Z');
  assert.equal(result.snippet, 'Payrolls increased . & wages');
  assert.match(result.url, /archives/);
});

test('missing dates, malformed dates, unsafe URLs and foreign hosts are discarded', () => {
  const xml = rss(item() + item({ published: '' }) + item({ published: '################ EST' }) + item({ link: 'javascript:alert(1)' }) + item({ link: 'https://example.com/story' }));
  assert.equal(parseOfficialFeed(xml, feed).length, 1);
  assert.throws(() => parseOfficialFeed(rss(item({ published: '' })), feed), /no usable/);
});

test('invalid XML, doctypes and non-feed error responses fail instead of replacing cached results', () => {
  for (const xml of ['<rss><channel>', '<html><body>Unavailable</body></html>', '<!DOCTYPE rss [<!ENTITY x "bad">]><rss><channel/></rss>']) assert.throws(() => parseOfficialFeed(xml, feed));
  assert.deepEqual(parseOfficialFeed(rss(''), feed), []);
});

test('date-only releases never acquire a timezone-shifted publication day', () => {
  const release = parseOfficialFeed(rss(item({ published: '2026-10-01' })), feed)[0];
  assert.equal(release.publishedPrecision, 'date');
  assert.equal(publicationLabel(release, 'America/Los_Angeles'), '1 Oct 2026');
  assert.match(publicationLabel(article, 'Europe/Amsterdam'), /20:00/);
});

test('plain excerpts remove markup and script content', () => {
  assert.equal(plainText('<script>alert(1)</script><p>Oil &amp; gas</p>'), 'Oil & gas');
});

const success = (articles = [article], checkedAt = new Date(now).toISOString()) => ({ status: 'fulfilled', value: { articles, checkedAt } });
const failed = { status: 'rejected', reason: new Error('upstream down') };

test('canonical links and agency/title/date collapse duplicated publications', () => {
  const duplicates = parseOfficialFeed(rss(item({ link: '/newsevents/release.htm?utm_source=feed#top' })), feed);
  const env = assembleOfficialNews([success([article, ...duplicates, { ...article, id: 'alternate', url: 'https://www.federalreserve.gov/another.htm' }])], [feed], now);
  assert.equal(env.data.length, 1);
});

test('one failed source preserves successful releases and exposes source health', () => {
  const env = assembleOfficialNews([success(), failed], OFFICIAL_FEEDS.slice(0, 2), now);
  assert.equal(env.status, 'stale');
  assert.equal(env.data.length, 1);
  assert.equal(env.sources[1].status, 'unavailable');
  assert.equal(env.sources[1].checkedAt, null);
});

test('last successful snapshot is explicitly stale after cache revalidation interval', () => {
  const env = assembleOfficialNews([success([article], new Date(now - 16 * 60000).toISOString())], [feed], now);
  assert.equal(env.status, 'stale');
  assert.equal(env.sources[0].status, 'stale');
  assert.equal(env.data[0].publishedAt, article.publishedAt);
  assert.notEqual(env.sources[0].checkedAt, env.fetchedAt);
});

test('old publications with a fresh source check are healthy; total outage is unavailable', () => {
  assert.equal(assembleOfficialNews([success()], [feed], now).status, 'ok');
  assert.equal(assembleOfficialNews([failed], [feed], now).data, null);
  assert.equal(assembleOfficialNews([failed], [feed], now).status, 'unavailable');
  assert.deepEqual(assembleOfficialNews([success([])], [feed], now).data, []);
});

test('search, topic, agency and range filters combine without upstream requests', () => {
  const options = { query: ' policy ', topic: 'Monetary Policy', agency: 'Federal Reserve', days: 7 };
  const old = { ...article, publishedAt: '2026-09-01T12:00:00Z' };
  const future = { ...article, publishedAt: '2026-12-01T12:00:00Z' };
  assert.deepEqual(filterNews([article, old, future], options, now), [article]);
  assert.equal(filterNews([article], { ...options, agency: 'BLS' }, now).length, 0);
  assert.equal(filterNews([article], { ...options, topic: 'Energy' }, now).length, 0);
  assert.equal(filterNews([old], { ...options, days: 90 }, now).length, 1);
});

test('navigation preserves old aliases and defaults calendar-only readers to calendar', () => {
  for (const key of ['briefing', 'overview', 'news']) assert.equal(marketsSection(key, false), 'news');
  for (const key of ['flow', 'option-flow', 'options']) assert.equal(marketsSection(key, false), 'positioning');
  assert.equal(marketsSection('futures', false), 'markets');
  assert.equal(marketsSection('calendar', false), 'calendar');
  assert.equal(marketsSection(null, true), 'calendar');
  assert.equal(marketsSection(null, false), 'news');
  assert.equal(marketsSection('invalid', true), 'calendar');
  // An explicit locked destination stays explicit so the page can show the gate.
  assert.equal(marketsSection('news', true), 'news');
});

test('upcoming releases span month and year boundaries without duplicates', () => {
  const { upcomingReleases } = require('../src/lib/gmi/news-view.ts');
  const events = [
    { id: 'jan', date: '2027-01-02', label: 'January release' },
    { id: 'dec', date: '2026-12-30', label: 'December release' },
    { id: 'jan', date: '2027-01-02', label: 'January release' },
    { id: 'later', date: '2027-01-05', label: 'Outside the next seven days' },
    { id: 'past', date: '2026-12-28', label: 'Previous release' },
  ];
  assert.deepEqual(upcomingReleases(events, '2026-12-29', '2027-01-05').map((event) => event.id), ['dec', 'jan']);
});

test('Next cache reuses feed snapshots and preserves them when background refresh fails', async () => {
  // Exercise the installed Next cache implementation with its storage boundary
  // in memory; no network or authenticated application context is needed.
  globalThis.AsyncLocalStorage ??= require('node:async_hooks').AsyncLocalStorage;
  const { workAsyncStorage } = require('next/dist/server/app-render/work-async-storage.external');
  const { fetchNews } = require('../src/lib/gmi/news.ts');
  const entries = new Map();
  let stale = false;
  let calls = 0;
  let fail = false;
  const originalFetch = global.fetch;
  const originalError = console.error;
  const errors = [];
  const incrementalCache = {
    generateSimpleCacheKey: async (key) => key,
    get: async (key) => entries.has(key) ? { value: entries.get(key), isStale: stale } : null,
    set: async (key, value) => { entries.set(key, value); },
  };
  const run = async () => {
    const store = { incrementalCache, isStaticGeneration: false, forceDynamic: true };
    const result = await workAsyncStorage.run(store, () => fetchNews());
    await Promise.all(Object.values(store.pendingRevalidates ?? {}));
    return result;
  };
  try {
    global.fetch = async () => { calls++; if (fail) throw new Error('Test upstream outage'); return new Response(rss(item())); };
    const first = await run();
    assert.equal(first.status, 'ok');
    assert.equal(calls, OFFICIAL_FEEDS.length);
    await run();
    assert.equal(calls, OFFICIAL_FEEDS.length);
    for (const entry of entries.values()) {
      const body = JSON.parse(entry.data.body);
      body.checkedAt = new Date(Date.now() - 16 * 60000).toISOString();
      entry.data.body = JSON.stringify(body);
    }
    fail = true; stale = true;
    console.error = (...args) => errors.push(args);
    const retained = await run();
    assert.equal(retained.status, 'stale');
    assert.deepEqual(retained.data, first.data);
    assert.ok(retained.sources.every((source) => source.status === 'stale'));
    assert.equal(errors.length, OFFICIAL_FEEDS.length);
    assert.equal(entries.size, OFFICIAL_FEEDS.length);
  } finally { global.fetch = originalFetch; console.error = originalError; }
});
