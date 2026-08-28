# AGENTS.md — EMA Compression Scanner

## Overview

Multi-Timeframe EMA Expansion → Correction → Time Correction → EMA Compression Scanner for Indian Stocks (NSE).

## Commands

- **Dev server:** `npm run dev`
- **Build:** `npm run build`
- **Test:** `npm test`
- **Test (watch):** `npm run test:watch`
- **Lint:** `npm run lint`

## Architecture

```
src/
├── core/                    # Pure logic, no UI dependencies
│   ├── indicators/          # EMA, ATR calculations
│   ├── detection/           # Pattern detection (expansion, correction, compression)
│   ├── scoring/             # Score calculation (0-100)
│   ├── scanner/             # Stock scanner engine
│   ├── config/              # Default configuration
│   └── types/               # TypeScript type definitions
├── data/                    # Data provider layer
│   ├── providers/           # Yahoo Finance adapter
│   ├── MarketDataProvider.ts # Abstract interface
│   └── cache.ts             # In-memory data cache
├── ui/                      # React components
│   ├── components/          # Scanner, Analysis, Chart components
│   └── hooks/               # React hooks (useScanner, useStockAnalysis)
└── app/                     # Next.js app router
```

## Key Principles

1. **Core engine is pure TypeScript** — no React, no DOM, no UI dependencies
2. **Data provider is abstracted** — swap Yahoo Finance for Upstox/NSE later
3. **Explainable results** — every detection returns reason strings and metrics
4. **Config-driven** — every threshold, weight, and parameter is configurable
5. **No look-ahead bias** — all functions only use candles up to the current index

## Testing

- Framework: Vitest
- Tests in `tests/` directory mirror `src/core/` structure
- Run `npm test` before committing

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
