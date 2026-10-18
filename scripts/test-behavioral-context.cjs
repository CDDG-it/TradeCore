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

const { buildResponseDays, adherence } = require('../src/lib/journal/behavioral-context.ts');
const trade = (date, result) => ({
  id: date, user_id: 'u', date_time: date, funded_account_id: 'a',
  result, execution_time: undefined, created_at: date, updated_at: date,
});
const check = (date, status) => ({ trade_id: date, source_type: 'standing_rule', source_text_snapshot: 'Plan', status });

test('one-trade days keep loss streaks and distinguish completed preparation from unknowns', () => {
  const days = ['2026-10-12', '2026-10-13', '2026-10-14'];
  const rows = buildResponseDays({
    trades: [trade(days[0], 'loss'), trade(days[1], 'loss'), trade(days[2], 'win')],
    ruleChecks: [check(days[0], 'kept'), check(days[1], 'broken'), check(days[2], 'kept')],
    habits: [{ id: 'h', frequency: 'weekdays', created_at: '2026-10-01T00:00:00' }],
    habitCompletions: [{ habit_id: 'h', date: days[2], completed: true }],
    weeklyReviews: [{ week_start: '2026-10-05', mistakes: 'One', lessons: '', prevention_plan: '', updated_at: '2026-10-11T18:00:00' }],
    exercises: [{ date: days[2], completed_at: '2026-10-14T07:00:00' }],
    recaps: [{ date: days[1], review_step: 'complete', taken_was_best: false, notes: '', post_market_analysis: '', updated_at: '2026-10-13T19:00:00' }],
  });
  assert.equal(rows[0].previousResult, 'loss');
  assert.equal(rows[0].previousStreak, 2);
  assert.deepEqual([rows[0].rules, rows[0].habits, rows[0].weeklyReview, rows[0].preMarket, rows[0].yesterdayRecap], ['yes', 'yes', 'yes', 'yes', 'yes']);
  assert.equal(rows[1].rules, 'no');
  assert.equal(rows[2].yesterdayRecap, 'unknown');
  assert.deepEqual(adherence(rows), { kept: 2, assessed: 3, rate: 67 });
});

test('missing checks and habits remain unknown instead of clean or missed', () => {
  const rows = buildResponseDays({ trades: [trade('2026-10-14', 'loss')], ruleChecks: [], habits: [], habitCompletions: [], weeklyReviews: [], exercises: [], recaps: [] });
  assert.equal(rows[0].rules, 'unknown');
  assert.equal(rows[0].habits, 'unknown');
  assert.equal(adherence(rows).rate, null);
});
