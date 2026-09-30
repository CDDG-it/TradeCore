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

const { ruleAdherenceScore, redistributeWeights } = require('../src/lib/mind-score/rule-adherence.ts');
const { selectExercise } = require('../src/lib/pre-market/exercises.ts');
const { PLANS, decideLimit, resolveEffectivePlan } = require('../src/lib/plans.ts');
const { mostBrokenItem, persistentBrokenPatterns } = require('../src/lib/reviews/rule-patterns.ts');

test('rule adherence excludes N/A and returns null without applicable checks', () => {
  assert.equal(ruleAdherenceScore([{ status: 'not_applicable' }]), null);
  assert.equal(ruleAdherenceScore([{ status: 'kept' }, { status: 'broken' }, { status: 'not_applicable' }]), 50);
  assert.equal(ruleAdherenceScore([{ status: 'kept' }, { status: 'kept' }]), 100);
});

test('missing components redistribute their nominal weight', () => {
  const parts = redistributeWeights([{ value: null, weight: 35 }, { value: 80, weight: 20 }, { value: 100, weight: 45 }]);
  assert.equal(parts[0].effectiveWeight, 0);
  assert.equal(Math.round(parts[1].effectiveWeight + parts[2].effectiveWeight), 100);
  assert.equal(Math.round(parts.reduce((sum, part) => sum + part.contribution, 0)), 94);
});

test('exercise selector prioritises two losing sessions then rotates', () => {
  assert.equal(selectExercise([{ date: '2026-09-29', session: 'New York', netR: -1 }, { date: '2026-09-28', session: 'London', netR: -2 }], 'mental_contrasting'), 'post_loss_reset');
  assert.equal(selectExercise([{ date: '2026-09-29', session: 'New York', netR: 1 }], 'loss_win_review'), 'mental_contrasting');
  assert.equal(selectExercise([], 'mental_contrasting'), 'loss_win_review');
});

test('prices and entitlement limits match the launch matrix', () => {
  for (const plan of Object.values(PLANS)) assert.equal(plan.annualPrice, plan.monthlyPrice * 10);
  assert.deepEqual([PLANS.basic.monthlyPrice, PLANS.plus.monthlyPrice, PLANS.pro.monthlyPrice], [9, 19, 29]);
  assert.deepEqual(PLANS.basic.entitlements, { accounts: 1, journal: true, preMarketExercises: true, sessionReview: true, historyRetentionDays: 90, mindscore: 'score', habits: true, goals: false, standingRules: false, advancedAnalytics: false, screenshots: false, bestTrade: false, weeklyReviews: false, monthlyReviews: false, propRuleTracking: 1, monteCarlo: false, globalMarkets: 'calendar', prioritySupport: false });
  assert.deepEqual(PLANS.plus.entitlements, { accounts: 5, journal: true, preMarketExercises: true, sessionReview: true, historyRetentionDays: null, mindscore: 'full', habits: true, goals: true, standingRules: true, advancedAnalytics: true, screenshots: true, bestTrade: true, weeklyReviews: true, monthlyReviews: false, propRuleTracking: 5, monteCarlo: false, globalMarkets: 'markets', prioritySupport: false });
  assert.deepEqual(PLANS.pro.entitlements, { accounts: 'unlimited', journal: true, preMarketExercises: true, sessionReview: true, historyRetentionDays: null, mindscore: 'full', habits: true, goals: true, standingRules: true, advancedAnalytics: true, screenshots: true, bestTrade: true, weeklyReviews: true, monthlyReviews: true, propRuleTracking: 'unlimited', monteCarlo: true, globalMarkets: 'full', prioritySupport: true });
  assert.equal(decideLimit('basic', 'accounts', 1).allowed, false);
  assert.equal(decideLimit('basic', 'accounts', 1).requiredPlan, 'plus');
  assert.equal(decideLimit('pro', 'accounts', 500).allowed, true);
  assert.equal(resolveEffectivePlan('basic', { launchFreeEnabled: true, billingEffectiveAt: null }), 'pro');
  assert.equal(resolveEffectivePlan('basic', { launchFreeEnabled: false, billingEffectiveAt: null }), 'basic');
});

test('review insights use broken status and distinct ISO weeks', () => {
  const checks = [
    { source_text_snapshot: 'Max 3 trades', status: 'broken', date: '2026-09-01' },
    { source_text_snapshot: 'Max 3 trades', status: 'broken', date: '2026-09-08' },
    { source_text_snapshot: 'Max 3 trades', status: 'broken', date: '2026-09-15' },
    { source_text_snapshot: 'No revenge trade', status: 'broken', date: '2026-09-15' },
    { source_text_snapshot: 'No revenge trade', status: 'kept', date: '2026-09-16' },
  ];
  assert.deepEqual(mostBrokenItem(checks), { text: 'Max 3 trades', count: 3 });
  assert.deepEqual(persistentBrokenPatterns(checks), [{ text: 'Max 3 trades', weeks: 3 }]);
});

test('rule-check migration preserves snapshots and trade edge cases', () => {
  const sql = fs.readFileSync(path.join(root, 'sql/daily_commitments_and_rule_checks.sql'), 'utf8');
  assert.match(sql, /trade_id uuid not null references trades\(id\) on delete cascade/);
  assert.match(sql, /unique \(trade_id, source_type, source_id\)/);
  assert.match(sql, /new\.source_text_snapshot := old\.source_text_snapshot/);
  assert.match(sql, /e\.date = left\(new\.date_time, 10\)/);
  assert.match(sql, /from standing_rules r[\s\S]*r\.active_from <= left\(new\.date_time, 10\)/);
  assert.match(sql, /funded_account_id uuid references funded_accounts\(id\) on delete set null/);
});

test('entitlement migration contains server denials and owner-scoped RLS', () => {
  const sql = fs.readFileSync(path.join(root, 'sql/plan_entitlements.sql'), 'utf8');
  assert.match(sql, /create policy "Users insert within account limit"/);
  assert.match(sql, /create policy "Entitled users insert own standing rules"/);
  assert.match(sql, /create policy "Entitled users upload own screenshots"/);
  assert.match(sql, /create policy "Users read retained trades"/);
  assert.match(sql, /has_entitlement\('weeklyReviews'\)/);
  assert.match(sql, /launch_free_enabled and \(settings\.billing_effective_at is null or now\(\) < settings\.billing_effective_at\)/);
});
