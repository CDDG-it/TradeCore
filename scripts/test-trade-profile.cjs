/* eslint-disable @typescript-eslint/no-require-imports -- Node's CJS loader is used to resolve Next's TypeScript path alias in this standalone calculation test. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

// Same harness as test-mind-score.cjs: load the pure My Trade Profile modules
// through TypeScript's compiler, with Next's @/ alias mapped to src/.
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

const lib = (p) => require(`../src/lib/trade-profile/${p}.ts`);
const { items } = lib('items');
const { keyedScore, scoreProfile, toPomp } = lib('scoring');
const { evaluate, needsSupportNote, placeInFocus, rankFocusAreas } = lib('focus');
const { focusRules } = lib('focus-rules');
const { buildProgram, dueRetests, exerciseForDay, programPosition } = lib('program');
const { completionRate, retestDiff, streak } = lib('progress');
const { addDays } = lib('dates');
const { answersFromFacetMeans, personas, personaState } = lib('personas');
const { exercises, exerciseById } = lib('content/exercises');
const { referenceById } = lib('content/references');
const { focusAreas } = lib('content/focus-areas');
const { FACETS, DOMAINS } = lib('types');

const all = (a) => Object.fromEntries(items.map((i) => [i.id, a]));
const profileOf = (means) => scoreProfile(items, answersFromFacetMeans(items, means));

// Per-facet [+ keyed, – keyed] counts, read off ipip.ori.org/IPIP-NEO-60ScoringKeys.htm.
const KEYING = {
  N1: [2, 0], N2: [2, 0], N3: [2, 0], N4: [2, 0], N5: [0, 2], N6: [0, 2],
  E1: [2, 0], E2: [1, 1], E3: [2, 0], E4: [2, 0], E5: [2, 0], E6: [2, 0],
  O1: [2, 0], O2: [1, 1], O3: [1, 1], O4: [0, 2], O5: [0, 2], O6: [1, 1],
  A1: [2, 0], A2: [0, 2], A3: [2, 0], A4: [0, 2], A5: [0, 2], A6: [2, 0],
  C1: [2, 0], C2: [1, 1], C3: [1, 1], C4: [2, 0], C5: [1, 1], C6: [0, 2],
};

test('IPIP-NEO-60: 60 items, 2 per facet, published keying, sourced', () => {
  assert.equal(items.length, 60);
  assert.deepEqual(new Set(items.map((i) => i.id)), new Set(Array.from({ length: 60 }, (_, i) => i + 201)));
  for (const f of FACETS) {
    const g = items.filter((i) => i.facet === f);
    assert.equal(g.length, 2, f);
    assert.deepEqual([g.filter((i) => i.keyed === '+').length, g.filter((i) => i.keyed === '-').length], KEYING[f], f);
  }
  for (const d of DOMAINS) assert.equal(items.filter((i) => i.domain === d).length, 12, d);
  assert.equal(items.filter((i) => i.keyed === '+').length, 37);
  for (const i of items) assert.match(i.source, /Maples-Keller et al\. \(2019\)/);
});

test('legacy IPIP-NEO-120 answers carry over only to identical items', () => {
  const { toAnswers, rowsToState } = lib('rows');
  const { LEGACY_120_TO_60 } = lib('legacy');
  assert.equal(Object.keys(LEGACY_120_TO_60).length, 51);
  // Old item 1 "Worry about things." is new item 201; old item 2 "Make friends easily." is 202.
  assert.deepEqual(toAnswers({ 1: 4, 2: 2, 999: 5, 201: 3 }), { 201: 3, 202: 2 });
  // A profile finished on the 120-item version reopens on the first page with a gap.
  const legacyAll = Object.fromEntries(Object.keys(LEGACY_120_TO_60).map((k) => [k, 3]));
  const row = { answers: legacyAll, page: 0, completed_on: '2026-10-01', goal_outcome: '', goal_obstacle: '', goal_if_cue: '', goal_then_action: '' };
  const s = rowsToState(row, [], [], []);
  assert.equal(s.completedOn, null);
  assert.equal(Object.keys(s.answers).length, 51);
  assert.ok(s.page >= 0 && s.page < 10);
});

test('scoring: reverse keys, POMP, neutral, extremes, partial domains', () => {
  const minus = items.find((i) => i.keyed === '-');
  assert.equal(keyedScore(minus, 1), 5);
  assert.equal(toPomp(1), 0);
  assert.equal(toPomp(3), 50);
  assert.equal(toPomp(5), 100);
  const neutral = scoreProfile(items, all(3));
  for (const f of FACETS) assert.equal(neutral.facets[f], 50);
  for (const d of DOMAINS) assert.equal(neutral.domains[d], 50);
  const fives = scoreProfile(items, all(5));
  assert.equal(fives.facets.C6, 0);
  assert.equal(fives.facets.N1, 100);
  assert.equal(fives.facets.N2, 100); // both + keyed
  assert.equal(fives.facets.E2, 50); // one + and one - keyed
  const partial = all(3);
  delete partial[items.find((i) => i.facet === 'E3').id];
  const p = scoreProfile(items, partial);
  assert.equal(p.facets.E3, undefined);
  assert.equal(p.domains.E, undefined);
  const retest = Object.fromEntries(items.filter((i) => i.domain === 'C').map((i) => [i.id, 3]));
  assert.deepEqual(Object.keys(scoreProfile(items, retest).domains), ['C']);
});

test('focus: personas land in their expected areas', () => {
  for (const persona of personas) {
    const { primary, secondary } = placeInFocus(profileOf(persona.facetMeans));
    assert.equal(primary.id, persona.expectedPrimary, persona.id);
    assert.equal(secondary && secondary.id, persona.expectedSecondary, persona.id);
  }
  assert.deepEqual(rankFocusAreas(profileOf({})), [{ id: 'maintain', hits: [], strength: 0 }]);
});

test('focus: thresholds, all/any, ranking and support note', () => {
  const t = { high: 65, low: 35 };
  const p = { domains: {}, facets: { N1: 65, C6: 35 } };
  assert.ok(evaluate({ trait: 'N1', op: '>=', value: 'high' }, p, t));
  assert.ok(evaluate({ trait: 'C6', op: '<=', value: 'low' }, p, t));
  assert.equal(evaluate({ trait: 'N1', op: '>=', value: 66 }, p, t), null);
  assert.deepEqual(rankFocusAreas(profileOf({ N5: 4.5 })).map((r) => r.id), ['maintain']);
  assert.equal(rankFocusAreas(profileOf({ N5: 4.5, C6: 1.5 }))[0].id, 'impulse');
  assert.ok(rankFocusAreas(profileOf({ O4: 4.5, C5: 1.5 })).some((r) => r.id === 'curiosity'));
  assert.deepEqual(rankFocusAreas(profileOf({ C5: 1.5, E5: 4 })).map((r) => r.id), ['followThrough', 'thrill']);
  const { primary } = placeInFocus(profileOf({ N1: 4, N6: 4.5 }));
  assert.deepEqual(primary.hits.map((h) => [h.trait, h.score]), [['N1', 75], ['N6', 87.5]]);
  assert.equal(needsSupportNote(profileOf({ N6: 4 })), true);
  assert.equal(needsSupportNote(profileOf({ N3: 3.5 })), false); // 62.5
  assert.equal(needsSupportNote(profileOf({ N1: 5 })), false);
});

test('exercise library: one easy, medium and hard per area, valid references', () => {
  assert.equal(exercises.length, 21);
  for (const r of focusRules) {
    const own = exercises.filter((e) => e.focusArea === r.id).map((e) => e.difficulty).sort();
    assert.deepEqual(own, [1, 2, 3], r.id);
  }
  assert.equal(new Set(exercises.map((e) => e.id)).size, exercises.length);
  for (const e of exercises) {
    assert.ok(e.referenceIds.length > 0, e.id);
    for (const id of e.referenceIds) assert.ok(referenceById[id], `${e.id} → ${id}`);
    assert.ok(focusAreas[e.focusArea], e.id);
  }
});

test('program: 12 weeks, 2 challenges a week, ramping, capped difficulty', () => {
  for (const r of focusRules) {
    const goal = r.suggestedGoal || { trait: 'C5', direction: 'increase' };
    const program = buildProgram(exercises, goal, r.id);
    assert.equal(program.length, 12);
    for (const w of program) {
      assert.equal(w.exerciseIds.length, 2);
      assert.equal(new Set(w.exerciseIds).size, w.exerciseIds.length);
      for (const id of w.exerciseIds) assert.ok(exerciseById[id].difficulty <= w.targetDifficulty + 1, `${r.id} w${w.week} ${id}`);
    }
    const avg = (ws) => { const d = ws.flatMap((w) => w.exerciseIds.map((id) => exerciseById[id].difficulty)); return d.reduce((a, b) => a + b, 0) / d.length; };
    assert.ok(avg(program.slice(0, 4)) < avg(program.slice(8)), r.id);
    assert.ok(program[0].exerciseIds.some((id) => exerciseById[id].focusArea === r.id), r.id);
  }
  const program = buildProgram(exercises, { trait: 'N', direction: 'decrease' }, 'calm');
  const start = '2026-01-05';
  assert.equal(exerciseForDay(program, start, start), program[0].exerciseIds[0]);
  assert.equal(exerciseForDay(program, start, addDays(start, 1)), program[0].exerciseIds[1]);
  assert.equal(exerciseForDay(program, start, addDays(start, 84)), undefined);
  assert.equal(programPosition(start, addDays(start, 41)).week, 6);
  assert.deepEqual(dueRetests(start, addDays(start, 34), []), []);
  assert.deepEqual(dueRetests(start, addDays(start, 35), []), [6]);
  assert.deepEqual(dueRetests(start, addDays(start, 80), [6]), [12]);
});

test('progress: completion, streak, retest diff', () => {
  const start = '2026-01-05';
  const c = (done) => ({ exerciseId: 'x', done, difficulty: 3, state: 4 });
  assert.ok(Math.abs(completionRate({ [start]: c('yes'), [addDays(start, 1)]: c('partly') }, start, addDays(start, 3)) - 0.5) < 1e-9);
  assert.equal(completionRate({}, start, start), 0);
  const run = { [start]: c('yes'), [addDays(start, 1)]: c('partly'), [addDays(start, 2)]: c('yes') };
  assert.equal(streak(run, addDays(start, 2)), 3);
  assert.equal(streak(run, addDays(start, 3)), 3);
  assert.equal(streak({ ...run, [addDays(start, 1)]: c('no') }, addDays(start, 2)), 1);
  const rows = retestDiff({ domains: { N: 70 }, facets: { N1: 80, N2: 60 } }, { domains: { N: 60 }, facets: { N1: 70, N2: 62.5 } }, 'N');
  assert.deepEqual(rows.map((r) => [r.trait, r.change]), [['N', -10], ['N1', -10], ['N2', 2.5]]);
});

test('personas: complete profiles with three weeks of data', () => {
  for (const p of personas) {
    const s = personaState(p, '2026-03-01');
    assert.equal(Object.keys(s.answers).length, 60);
    assert.ok(Object.keys(s.checkins).length > 14);
    assert.equal(Object.keys(s.reflections).length, 3);
    assert.equal(s.programStart, '2026-02-08');
  }
});

// ── Trader types ─────────────────────────────────────────────────────────
const { patternGroups, readTraderTypes } = lib('trader-types');

test('trader type patterns: all-groups split, any-groups stay together', () => {
  const curiosity = focusRules.find((r) => r.id === 'curiosity');
  const groups = patternGroups(curiosity.rule);
  assert.equal(groups.length, 2);
  assert.deepEqual(groups[0].map((c) => c.trait), ['O', 'O4']);
  assert.deepEqual(groups[1].map((c) => c.trait), ['C5']);
  const calm = focusRules.find((r) => r.id === 'calm');
  assert.deepEqual(patternGroups(calm.rule).map((g) => g.map((c) => c.trait)), [['N1', 'N2', 'N6']]);
});

test('trader types: matched types lead in focus order, the rest by closeness', () => {
  for (const persona of personas) {
    const profile = scoreProfile(items, answersFromFacetMeans(items, persona.facetMeans));
    const readings = readTraderTypes(profile);
    const ranked = rankFocusAreas(profile).map((r) => r.id);
    assert.deepEqual(readings.filter((r) => r.matched).map((r) => r.id), ranked);
    assert.equal(readings.length, focusRules.length);
    readings.filter((r) => r.matched).forEach((r) => assert.equal(r.closeness, 1));
    const rest = readings.filter((r) => !r.matched);
    for (let i = 1; i < rest.length; i++) assert.ok(rest[i - 1].closeness >= rest[i].closeness);
    rest.forEach((r) => assert.ok(r.closeness >= 0 && r.closeness < 1));
  }
});
