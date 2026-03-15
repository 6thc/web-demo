# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install       # Install dependencies
npm run dev       # Start dev server at localhost:3000 (auto-opens browser)
npm run build     # Production build → build/
```

No test or lint scripts are configured.

## Architecture

This is a **fintech demo app** (Topos) showcasing a collateral-based lending platform. It renders two synchronized mobile banking apps side-by-side in 393×852px phone frames.

### Dual-App Design

`App.tsx` is the root orchestrator. It renders two phones:
- **Left:** `PledgerApp` — the collateral provider (locks funds, approves/declines loan requests)
- **Right:** `BorrowerApp` — the loan requester (requests credit, makes payments)

Both apps share state through `App.tsx` via a `refreshKey` counter and callback props. When either app mutates data, it calls a parent refresh handler, which increments `refreshKey` and causes both apps to re-render with fresh data.

### State & Data Layer

There are no external state libraries. All business logic lives in four files under `src/components/data/`:

- `credits.ts` — core loan lifecycle: create, approve, disburse, repay, calculate installments
- `transactions.ts` — transaction history ledger
- `wallet.ts` — pledger USD wallet (balance, locked/available funds)
- `pledger-activity.ts` — pledger activity log

These files export plain functions that read/write in-memory state. Components call these functions directly and then trigger the parent refresh.

### Navigation Pattern

Both apps use a **bottom tab nav** (3 tabs each) plus **modal overlays** for detail/action screens. There is no router — screen visibility is controlled by local `useState` flags and passed-in callbacks (`onBack`, `onNavigate`). Modal screens render on top of the tab content.

### Demo Features

`App.tsx` includes floating buttons to:
- **Reset** all state to a blank slate
- **Populate** data progressively (8-step sequence simulating a full loan lifecycle with toasts)
- Toggle a notification drawer and audit trail panel

The `userState` value (`'fresh'` | `'active'`) controls which empty/populated UI variants screens show.

### UI Components

`src/components/ui/` contains ~45 thin wrappers around Radix UI primitives styled with Tailwind. These are standard shadcn/ui-style components and follow that project's conventions.

## Known Issues & Audit

See `AUDIT.md` for a full code and demo quality audit. Key known issues:

- `App.tsx` is 1,065 lines — `BorrowerApp` component and `buildActivityHistoryProgressively()` should be extracted to their own files
- `credits.ts` is 841 lines — loan math and state mutations should be split
- No error handling in the populate function; a mid-run failure leaves app in inconsistent state
- Global ID counters (`nextCreditId`, etc.) don't reset when user state resets, causing ID collisions
- Double initialization bug in `PledgerApp.tsx` `useEffect` for `userState` changes
