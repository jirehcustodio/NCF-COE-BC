import fs from "fs";
import path from "path";

export type LedgerRecord = {
  id: string;
  blockNumber: number;
  blockHash: string;
  previousHash: string;
  payloadHash: string;
  subjectCode: string;
  period: string;
  instructor: string;
  count: number;
  createdAt: string;
};

const dataPath = path.join(process.cwd(), "data", "ledger.json");

function ensureStore() {
  const dir = path.dirname(dataPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, JSON.stringify([]));
  }
}

export function readLedger(): LedgerRecord[] {
  ensureStore();
  const raw = fs.readFileSync(dataPath, "utf-8");
  return JSON.parse(raw) as LedgerRecord[];
}

export function appendLedger(record: LedgerRecord) {
  const ledger = readLedger();
  ledger.unshift(record);
  fs.writeFileSync(dataPath, JSON.stringify(ledger, null, 2));
  return record;
}
