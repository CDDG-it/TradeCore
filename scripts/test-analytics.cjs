/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const resolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) { return resolve.call(this, request.startsWith('@/') ? path.join(root, 'src', request.slice(2)) : request, parent, ...rest); };
require.extensions['.ts'] = function (loaded, filename) { const source = fs.readFileSync(filename, 'utf8'); const result = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }); loaded._compile(result.outputText, filename); };

const {
  inPeriod, applyDrill, drillChips, computeDirectionStats, computeQualityStats,
  computeInstrumentStats, computeEquityCurve, computeHeadline, pickSetups, sameKeys,
} = require('../src/lib/journal/analytics-filter.ts');
const { ruleVerdictsByTrade, computeRuleStats } = require('../src/lib/journal/rule-stats.ts');
const { sampleAnalyticsData } = require('../src/lib/journal/analytics-sample.ts');

let n = 0;
const trade = (over) => ({
  id: `t${++n}`, user_id: 'u', date_time: '2026-10-13', instrument: 'MNQ', market: 'futures', session: 'London',
  timeframe: '5m', direction: 'long', confluences: [], rr: 2, result: 'win', screenshot_groups: [],
  execution_notes: '', psychology_notes: '', mistakes: '', lessons: '', created_at: '', updated_at: '', ...over,
});
const check = (trade_id, text, status) => ({ trade_id, source_type: 'standing_rule', source_text_snapshot: text, status });

test('periods: month, trailing window and all', () => {
  const ts_ = [trade({ date_time: '2026-10-16' }), trade({ date_time: '2026-09-20' }), trade({ date_time: '2026-06-01' })];
  assert.equal(inPeriod(ts_, 'all', '2026-10-16').length, 3);
  assert.equal(inPeriod(ts_, '2026-09', '2026-10-16').length, 1);
  assert.equal(inPeriod(ts_, '30d', '2026-10-16').length, 2);
  assert.equal(inPeriod(ts_, '90d', '2026-10-16').length, 2);
});

test('drills combine and match the same trades the panes show', () => {
  const a = trade({ date_time: '2026-10-13', session: 'London', execution_time: '09:40', confluences: ['FVG ', 'HTF bias'], instrument: 'NQ' }); // Tue
  const b = trade({ date_time: '2026-10-13', session: 'New York', execution_time: '15:10', confluences: ['fvg'], direction: 'short' });
  const c = trade({ date_time: '2026-10-14', session: 'London', execution_time: '09:50', execution_quality: 'bad' }); // Wed
  const all = [a, b, c];
  const none = new Map();
  assert.deepEqual(applyDrill(all, { weekday: '2', session: 'London' }, none).map((t) => t.id), [a.id]);
  assert.deepEqual(applyDrill(all, { hourSlot: { start: 9 * 60 + 30, size: 30 } }, none).map((t) => t.id), [a.id, c.id]);
  assert.deepEqual(applyDrill(all, { hourSlot: { start: 9 * 60, size: 60 } }, none).map((t) => t.id), [a.id, c.id]);
  assert.equal(applyDrill(all, { confluence: ['fvg'] }, none).length, 2);
  assert.deepEqual(applyDrill(all, { confluence: ['fvg', 'htf bias'] }, none).map((t) => t.id), [a.id]);
  assert.deepEqual(applyDrill(all, { instrument: 'Nasdaq' }, none).length, 3); // NQ and MNQ are one market
  assert.deepEqual(applyDrill(all, { quality: 'unrated', direction: 'long' }, none).map((t) => t.id), [a.id]);
  assert.deepEqual(applyDrill(all, {}, none).length, 3);
});

test('rule drill uses the same verdicts as the rule stats', () => {
  const a = trade({ result: 'win' });
  const b = trade({ result: 'loss' });
  const c = trade({ result: 'loss' });
  const checks = [check(a.id, 'Wait for close', 'kept'), check(b.id, 'Wait for close', 'broken'), check(c.id, 'Wait for close', 'not_applicable')];
  const verdicts = ruleVerdictsByTrade([a, b, c], checks);
  assert.deepEqual(applyDrill([a, b, c], { rule: { key: 'wait for close', label: 'Wait for close', kept: false } }, verdicts).map((t) => t.id), [b.id]);
  assert.deepEqual(applyDrill([a, b, c], { rule: { key: 'wait for close', label: 'Wait for close', kept: true } }, verdicts).map((t) => t.id), [a.id]);
  const stat = computeRuleStats([a, b, c], checks)[0];
  assert.equal(stat.kept + stat.broken, 2);
});

test('chips read as plain labels', () => {
  const chips = drillChips({ weekday: '2', session: 'London', hourSlot: { start: 570, size: 30 }, rule: { key: 'x', label: 'X', kept: false }, quality: 'good' });
  assert.deepEqual(chips.map((c) => c.label), ['Tuesday', 'London', '09:30–10:00', 'Broke: X', 'Good execution']);
});

test('pair chips join both confluence names', () => {
  const chips = drillChips({ confluence: ['fvg', 'htf bias'] }, (k) => k.toUpperCase());
  assert.deepEqual(chips.map((c) => c.label), ['FVG + HTF BIAS']);
});

test('setups: best and worst across confluences and pairs, real samples only', () => {
  const conf = (name, trades, expectancy) => ({ name, trades, wins: 3, losses: 2, winRate: 60, totalR: expectancy * trades, expectancy, thin: trades < 5 });
  const pair = (a, b, trades, expectancy) => ({ key: `${a}|${b}`, label: `${a} + ${b}`, names: [a, b], trades, wins: 3, losses: 2, winRate: 60, totalR: expectancy * trades, expectancy, thin: trades < 5 });
  const { best, worst } = pickSetups(
    [conf('FVG', 10, 0.4), conf('News', 6, -0.5), conf('Lucky', 2, 3)],
    [pair('FVG', 'Sweep', 5, 0.9)],
    0.2
  );
  assert.equal(best.kind, 'pair');
  assert.deepEqual(best.keys, ['fvg', 'sweep']);
  assert.equal(worst.label, 'News');
  // A strong set has no "costs": its weakest member still beats the average.
  const strong = pickSetups([conf('A', 8, 0.6), conf('B', 8, 0.5)], [], 0.3);
  assert.equal(strong.best.label, 'A');
  assert.equal(strong.worst, null);
  assert.deepEqual(pickSetups([], [], 0), { best: null, worst: null, candidates: 0 });
  assert.ok(sameKeys(['b', 'a'], ['a', 'b']));
  assert.ok(!sameKeys(['a'], ['a', 'b']));
});

test('direction, quality and instrument breakdowns', () => {
  const ts_ = [
    trade({ direction: 'long', rr: 2, result: 'win', execution_quality: 'good', instrument: 'MNQ' }),
    trade({ direction: 'short', result: 'loss', execution_quality: 'bad', instrument: 'GC' }),
    trade({ direction: 'short', result: 'loss', instrument: 'NQ' }),
  ];
  const dir = computeDirectionStats(ts_);
  assert.deepEqual(dir.map((b) => [b.key, b.trades, b.expectancy]), [['long', 1, 2], ['short', 2, -1]]);
  assert.deepEqual(computeQualityStats(ts_).map((b) => b.trades), [1, 1, 1]);
  const inst = computeInstrumentStats(ts_);
  assert.equal(inst[0].label, 'Nasdaq');
  assert.equal(inst[0].trades, 2);
});

test('equity curve runs in the order taken and headline handles break-evens', () => {
  const ts_ = [
    trade({ date_time: '2026-10-14', execution_time: '09:00', result: 'loss' }),
    trade({ date_time: '2026-10-13', execution_time: '10:00', result: 'win', rr: 3 }),
    trade({ date_time: '2026-10-13', execution_time: '09:00', result: 'break-even' }),
  ];
  assert.deepEqual(computeEquityCurve(ts_).map((p) => p.cum), [0, 3, 2]);
  const h = computeHeadline(ts_);
  assert.equal(h.trades, 3);
  assert.equal(h.winRate, 50);
  assert.equal(h.netR, 2);
  assert.equal(h.profitFactor, 3);
  assert.equal(h.breakEven, 1);
  assert.equal(computeHeadline([trade({})]).profitFactor, null);
});

test('sample data is deterministic and fills every breakdown', () => {
  const a = sampleAnalyticsData(new Date('2026-10-16T12:00:00'));
  const b = sampleAnalyticsData(new Date('2026-10-16T12:00:00'));
  assert.equal(a.trades.length, b.trades.length);
  assert.ok(a.trades.length > 80);
  assert.ok(a.ruleChecks.length > 100);
  assert.equal(computeQualityStats(a.trades).filter((q) => q.trades > 0).length, 3);
});
