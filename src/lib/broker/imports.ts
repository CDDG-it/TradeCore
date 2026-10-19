import { z } from "zod";

export const ImportSource = z.enum(["tradovate", "topstepx", "rithmic", "csv"]);
const number = z.number().finite();
export const ImportTrade = z.object({
  source_id: z.string().trim().max(160).optional(),
  external_account: z.string().trim().min(1).max(120),
  instrument: z.string().trim().min(1).max(80),
  direction: z.enum(["long", "short"]).nullable().default(null),
  quantity: number.positive().nullable().default(null),
  entry_time: z.string().datetime({ offset: true }).nullable().default(null),
  exit_time: z.string().datetime({ offset: true }).nullable().default(null),
  entry_price: number.nullable().default(null),
  exit_price: number.nullable().default(null),
  fees: number.nullable().default(null),
  pnl: number.nullable().default(null),
  broker_account_id: z.string().uuid().nullable().optional(),
  funded_account_id: z.string().uuid().nullable().optional(),
});
export const ImportBatch = z.object({ source: ImportSource, trades: z.array(ImportTrade).min(1).max(500) });
export type ImportTradeInput = z.infer<typeof ImportTrade>;

export interface ImportedTrade extends ImportTradeInput {
  id: string;
  source: z.infer<typeof ImportSource>;
  source_key: string;
  status: "pending" | "linked" | "ignored";
  journal_trade_id: string | null;
  created_at: string;
}

export function isComplete(row: Pick<ImportedTrade, "direction" | "quantity" | "entry_time" | "exit_time" | "entry_price" | "exit_price" | "pnl">) {
  return row.direction !== null && row.quantity !== null && row.entry_time !== null && row.exit_time !== null
    && row.entry_price !== null && row.exit_price !== null && row.pnl !== null;
}
