/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
require.extensions['.ts'] = function (loaded, filename) {
  const source = fs.readFileSync(filename, 'utf8');
  const result = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } });
  loaded._compile(result.outputText, filename);
};

const { parseCsv, parseTimestamp, parseNumber, suggestColumns } = require('../src/lib/broker/csv.ts');
const { pairFills } = require('../src/lib/broker/tradovate.ts');
const { sourceKey } = require('../src/lib/broker/source-key.ts');

test('CSV parser handles multiline quotes, semicolons and decimal commas', () => {
  assert.deepEqual(parseCsv('Account,Notes,P&L\nA,"first\nsecond",12.50\n')[1], ['A', 'first\nsecond', '12.50']);
  assert.deepEqual(parseCsv('Account;P&L\nA;12,50\n')[1], ['A', '12,50']);
  assert.equal(parseNumber('(12,50)'), -12.5);
  assert.equal(parseNumber('1.234,50'), 1234.5);
  assert.equal(parseNumber('1,234.50'), 1234.5);
  assert.equal(suggestColumns(['Account', 'Symbol', 'Entry Time']).instrument, 'Symbol');
  assert.equal(parseTimestamp('10/19/2026 9:30 AM', '-04:00'), '2026-10-19T13:30:00.000Z');
});

test('Tradovate fill pairing separates accounts and handles partial exits', () => {
  const at = (minute) => `2026-10-19T14:${String(minute).padStart(2, '0')}:00Z`;
  const trades = pairFills([
    { id: 1, orderId: 10, contractId: 7, timestamp: at(0), action: 'Buy', qty: 2, price: 5000 },
    { id: 2, orderId: 11, contractId: 7, timestamp: at(1), action: 'Sell', qty: 1, price: 5001 },
    { id: 3, orderId: 20, contractId: 7, timestamp: at(2), action: 'Sell', qty: 1, price: 5002 },
    { id: 4, orderId: 12, contractId: 7, timestamp: at(3), action: 'Sell', qty: 1, price: 5003 },
  ], [
    { id: 10, accountId: 100 }, { id: 11, accountId: 100 }, { id: 12, accountId: 100 }, { id: 20, accountId: 200 },
  ], [{ id: 7, name: 'ESZ6' }]);
  assert.deepEqual(trades.map((t) => [t.source_id, t.account_id, t.quantity, t.pnl]), [
    ['1:2', 100, 1, null], ['1:4', 100, 1, null],
  ]);
});

test('fallback identity is stable across overlapping files', () => {
  const row = { external_account: 'A', instrument: 'ESZ6', direction: 'long', quantity: 1,
    entry_time: '2026-10-19T14:00:00Z', exit_time: '2026-10-19T14:01:00Z',
    entry_price: 5000, exit_price: 5001, pnl: 50, fees: 2 };
  assert.equal(sourceKey(row), sourceKey({ ...row }));
  assert.notEqual(sourceKey(row), sourceKey({ ...row, exit_price: 5002 }));
});

test('migration removes old secrets and revokes browser credential access', () => {
  const sql = fs.readFileSync(path.join(__dirname, '../sql/broker_trade_imports.sql'), 'utf8');
  assert.match(sql, /set secret = null, token = null/);
  assert.match(sql, /revoke all on table broker_credentials from anon, authenticated/);
  assert.match(sql, /unique \(user_id, source, external_account, source_key\)/);
  assert.match(sql, /where id = p_import_id and user_id = p_user_id for update/);
  assert.match(sql, /grant execute on function broker_accept_import\(uuid, uuid\) to service_role/);
});
