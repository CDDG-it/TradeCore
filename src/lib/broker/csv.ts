export function parseCsv(text: string): string[][] {
  // Detect the separator from the header. Semicolon exports often use decimal
  // commas, which must remain inside a field.
  const header = text.split(/\r?\n/, 1)[0];
  const delimiter = (header.match(/;/g)?.length ?? 0) > (header.match(/,/g)?.length ?? 0) ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') { field += '"'; i++; }
      else quoted = !quoted;
    } else if (!quoted && c === delimiter) {
      row.push(field.trim()); field = "";
    } else if (!quoted && (c === "\n" || c === "\r")) {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field.trim()); field = "";
      if (row.some(Boolean)) rows.push(row);
      row = [];
    } else field += c;
  }
  if (quoted) throw new Error("CSV has an unclosed quote");
  row.push(field.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

export const IMPORT_FIELDS = [
  "external_account", "instrument", "direction", "quantity", "entry_date", "entry_time", "exit_date", "exit_time",
  "entry_price", "exit_price", "pnl", "fees", "source_id",
] as const;
export type ImportField = typeof IMPORT_FIELDS[number];

const ALIASES: Record<ImportField, string[]> = {
  external_account: ["account", "account name", "account id", "trading account", "acct"],
  instrument: ["symbol", "instrument", "contract", "product"],
  direction: ["direction", "side", "position", "trade type"],
  quantity: ["quantity", "qty", "size", "contracts"],
  entry_date: ["entry date", "open date", "date opened"],
  entry_time: ["entry time", "open time", "opened at", "entry datetime", "entry date/time"],
  exit_date: ["exit date", "close date", "date closed"],
  exit_time: ["exit time", "close time", "closed at", "exit datetime", "exit date/time"],
  entry_price: ["entry price", "open price", "buy price"],
  exit_price: ["exit price", "close price", "sell price"],
  pnl: ["p&l", "pnl", "net pnl", "net p&l", "profit", "profit/loss"],
  fees: ["fees", "commission", "commissions", "total fees"],
  source_id: ["trade id", "id", "execution id", "order id"],
};

export function suggestColumns(headers: string[]): Record<ImportField, string> {
  return Object.fromEntries(IMPORT_FIELDS.map((field) => [field,
    headers.find((h) => ALIASES[field].includes(h.trim().toLowerCase())) ?? "",
  ])) as Record<ImportField, string>;
}

export function parseNumber(value: string): number | null {
  const cleaned = value.trim().replace(/[€$\s]/g, "").replace(/^\((.*)\)$/, "-$1");
  if (!cleaned) return null;
  const comma = cleaned.lastIndexOf(",");
  const dot = cleaned.lastIndexOf(".");
  const normalized = comma >= 0 && dot >= 0
    ? comma > dot ? cleaned.replace(/\./g, "").replace(",", ".") : cleaned.replace(/,/g, "")
    : comma >= 0
      ? cleaned.length - comma - 1 === 3 ? cleaned.replace(/,/g, "") : cleaned.replace(",", ".")
      : cleaned;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

export function parseTimestamp(value: string, offset: string): string | null {
  const raw = value.trim();
  if (!raw) return null;
  let iso = raw.replace(" ", "T");
  const us = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (us) {
    let hour = Number(us[4]);
    if (us[7]) hour = hour % 12 + (us[7].toUpperCase() === "PM" ? 12 : 0);
    iso = `${us[3]}-${us[1].padStart(2, "0")}-${us[2].padStart(2, "0")}T${String(hour).padStart(2, "0")}:${us[5]}:${us[6] ?? "00"}`;
  }
  const zoned = /(?:Z|[+-]\d{2}:\d{2})$/i.test(iso) ? iso : `${iso}${offset}`;
  const time = new Date(zoned);
  return Number.isNaN(time.getTime()) ? null : time.toISOString();
}

export function parseDirection(value: string): "long" | "short" | null {
  const v = value.trim().toLowerCase();
  if (["long", "buy", "bought", "b"].includes(v)) return "long";
  if (["short", "sell", "sold", "s"].includes(v)) return "short";
  return null;
}
