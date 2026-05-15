# Hyperledger REST Gateway (Thesis Demo)

This lightweight service simulates a Hyperledger Fabric REST gateway for thesis/demo use. It accepts ledger commits from the main app and stores them locally in `data/ledger.json`.

## Environment Variables

```
PORT=4000
HYPERLEDGER_API_KEY=optional-shared-secret
```

## Endpoints

- `GET /health` — health check
- `GET /records` — list ledger records
- `POST /records` — commit a ledger record

## Run

```bash
npm install
npm run dev
```

The API will be available at `http://localhost:4000`.
