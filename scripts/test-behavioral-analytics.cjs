/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const resolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) {
  return resolve.call(this, request.startsWith('@/') ? path.join(root, 'src', request.slice(2)) : request, parent, ...rest);
};
require.extensions['.ts'] = function (loaded, filename) {
  const source = fs.readFileSync(filename, 'utf8');
  const result = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } });
  loaded._compile(result.outputText, filename);
};

const { buildTradingSessions, contextSummary, summarizeAdherence } = require('../src/lib/journal/behavioral-analytics.ts');
const trade = (id, start, end, result, account = 'a') => ({
  id, user_id: 'u', date_time: '2026-10-16', funded_account_id: account,
  instrument: 'NQ', market: 'futures', session: 'New York', timeframe: '5m',
  direction: 'long', confluences: [], rr: 2, result, screenshot_groups: [],
  execution_notes: '', psychology_notes: '', mistakes: '', lessons: '',
  execution_time: start, execution_end_time: end, created_at: id, updated_at: id,
});
const check = (id, status) => ({ trade_id: id, source_type: 'standing_rule', source_text_snapshot: 'Wait for confirmation', status });

test('fingerprint uses a closed prior trade, assessed rules and an honest denominator', () => {
  const trades = [trade('a3', '11:00', '11:20', 'win'), trade('a1', '09:30', '09:50', 'loss'), trade('a2', '10:00', '10:15', 'loss'), trade('a4', '12:00', '12:20', 'win')];
  const checks = [check('a1', 'kept'), check('a2', 'broken'), check('a3', 'not_applicable'), check('a4', 'kept')];
  const [session] = buildTradingSessions(trades, checks);
  assert.deepEqual(session.trades.map((row) => row.context), ['other', 'after-loss', 'after-loss', 'after-win']);
  assert.equal(session.firstBreachIndex, 1);
  const loss = contextSummary(session.trades, 'after-loss');
  assert.deepEqual(loss.matching, { assessed: 1, kept: 0, broken: 1, unassessed: 1, rate: 0 });
  assert.deepEqual(loss.comparison, { assessed: 2, kept: 2, broken: 0, unassessed: 0, rate: 100 });
});

test('unknown timestamps and overlapping trades never become an after-loss claim', () => {
  const missing = buildTradingSessions([trade('b1', '09:30', '09:50', 'loss'), trade('b2', undefined, '10:15', 'win')], [check('b2', 'broken')])[0];
  assert.equal(missing.orderReliable, false);
  assert.deepEqual(missing.trades.map((row) => row.context), ['unknown', 'unknown']);
  assert.equal(missing.firstBreachIndex, null);
  const overlap = buildTradingSessions([trade('c1', '09:30', '10:20', 'loss'), trade('c2', '10:00', '10:30', 'win')])[0];
  assert.equal(overlap.trades[1].context, 'unknown');
});

test('sessions remain separate by account and unassessed trades are never clean', () => {
  const sessions = buildTradingSessions([trade('d1', '09:30', '09:50', 'loss', 'a'), trade('d2', '10:00', '10:20', 'win', 'b')]);
  assert.equal(sessions.length, 2);
  assert.equal(sessions.every((session) => session.trades[0].context === 'other'), true);
  assert.deepEqual(summarizeAdherence(sessions.flatMap((session) => session.trades)), { assessed: 0, kept: 0, broken: 0, unassessed: 2, rate: null });
});
