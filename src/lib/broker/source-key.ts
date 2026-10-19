import { createHash } from "node:crypto";
import type { ImportTradeInput } from "./imports";

export function sourceKey(row: ImportTradeInput): string {
  const identity = row.source_id || JSON.stringify([
    row.instrument.toUpperCase(), row.direction, row.quantity, row.entry_time,
    row.exit_time, row.entry_price, row.exit_price,
  ]);
  return createHash("sha256").update(identity).digest("hex");
}
