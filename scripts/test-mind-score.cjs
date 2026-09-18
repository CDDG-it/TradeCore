/* eslint-disable @typescript-eslint/no-require-imports -- Node's CJS loader is used to resolve Next's TypeScript path alias in this standalone calculation test. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

// The project uses Next's @/ alias and has no separate test runner. Load the
// pure calculation modules through TypeScript's installed compiler instead.
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

const { computeMindScore, MIND_WEIGHTS } = require('../src/lib/mind-score/mind-score.ts');
const { GOAL_METRICS, computeGoalProgress } = require('../src/lib/goals/goals.ts');
const now = new Date(2026, 8, 17, 12);
const stamp = '2026-09-17T12:00:00';
const trade = (id, day, result, quality = 'good') => ({
  id, user_id: 'test', date_time: day, instrument: 'ES', market: 'futures', session: 'New York', timeframe: '15m', direction: 'long',
  confluences: [], rr: 1.5, result, screenshot_groups: [], execution_notes: '', psychology_notes: '', mistakes: '', lessons: '',
  execution_quality: quality, discipline: { score: quality === 'good' ? 90 : 60 }, created_at: stamp, updated_at: stamp,
});
const trades = [trade('a', '2026-09-14', 'win'), trade('b', '2026-09-15', 'loss', 'bad'), trade('c', '2026-09-16', 'win')];
const habits = [{ id: 'plan', user_id: 'test', name: 'Write plan', category: 'routine', frequency: 'weekdays', target_days: 5, color: '#14b8a6', icon: '', created_at: '2026-09-01T12:00:00', updated_at: stamp }];
const completions = ['14', '15', '16'].map(day => ({ id: day, habit_id: 'plan', date: `2026-09-${day}`, completed: true }));
const input = (goals = [], overrides = {}) => ({ now, trades, habits, completions, goals, psychSessions: [], bestTrades: [], weeklyReviews: [], analyses: [], adherenceLogs: [], ...overrides });
const goal = (metric, overrides = {}) => ({ id: metric, user_id: 'test', title: metric, metric, target: metric === 'win_rate' ? 70 : metric === 'net_r' ? 8 : metric === 'habit_consistency' ? 80 : 10, baseline: 0, start_date: '2026-09-01', end_date: '2026-09-30', created_at: stamp, updated_at: stamp, ...overrides });
const part = score => score.components.find(c => c.key === 'goals');

test('weights sum to 100 and goals are excluded when none apply', () => {
  assert.equal(Object.values(MIND_WEIGHTS).reduce((a, b) => a + b, 0), 100);
  const score = computeMindScore(input(), 'week');
  assert.equal(part(score).value, null);
  assert.equal(part(score).effectiveWeight, 0);
  assert.equal(Math.round(score.components.reduce((a, c) => a + c.effectiveWeight, 0)), 100);
});

test('all seven goal metric types contribute when measurable', () => {
  for (const { key } of GOAL_METRICS) {
    const score = computeMindScore(input([goal(key)]), 'week');
    assert.notEqual(part(score).value, null, key);
    assert.equal(part(score).weight, 10, key);
    assert.equal(part(score).effectiveWeight, 10, key);
  }
});

test('multiple goals are averaged by progress against elapsed goal time', () => {
  const goals = [goal('trades_logged', { target: 10 }), goal('win_rate', { target: 80 })];
  const expected = Math.round(goals.reduce((sum, g) => {
    const p = computeGoalProgress(g, input(goals));
    return sum + Math.min(1, p.ratio / p.timeElapsed);
  }, 0) / goals.length * 100);
  assert.equal(part(computeMindScore(input(goals), 'month')).value, expected);
});

test('future, archived, expired and unmeasurable goals do not change the score', () => {
  const excluded = [
    goal('trades_logged', { start_date: '2026-10-01', end_date: '2026-10-31' }),
    goal('trades_logged', { archived_at: stamp }),
    goal('trades_logged', { start_date: '2026-08-01', end_date: '2026-08-31' }),
    goal('execution_rate'),
    goal('trades_logged'),
  ];
  const score = computeMindScore(input(excluded, { trades: [] }), 'week');
  assert.equal(part(score).value, null);
});

test('future trade data cannot advance a current goal', () => {
  const g = goal('trades_logged', { target: 10 });
  const future = trade('future', '2026-09-25', 'win');
  const p = computeGoalProgress(g, input([g], { trades: [...trades, future] }));
  assert.equal(p.current, trades.length);
});
