import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import { appendLedger, readLedger } from "./store.js";

const app = express();
const port = Number(process.env.PORT ?? 4000);
const apiKey = process.env.HYPERLEDGER_API_KEY;

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.use((req: Request, res: Response, next: NextFunction) => {
  if (!apiKey) return next();
  const auth = req.headers.authorization;
  if (!auth || auth !== `Bearer ${apiKey}`) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
});

const recordSchema = z.object({
  blockNumber: z.number().int().min(1),
  blockHash: z.string().min(6),
  previousHash: z.string().min(4),
  payloadHash: z.string().min(6),
  subjectCode: z.string().min(2),
  period: z.string().min(4),
  instructor: z.string().min(2),
  count: z.number().int().min(1),
});

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.get("/records", (_req: Request, res: Response) => {
  res.json({ records: readLedger() });
});

app.post("/records", (req: Request, res: Response) => {
  const parsed = recordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
  }

  const record = appendLedger({
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...parsed.data,
  });

  res.status(201).json({ transactionHash: record.blockHash, record });
});

app.listen(port, () => {
  console.log(`Hyperledger REST gateway listening on ${port}`);
});
