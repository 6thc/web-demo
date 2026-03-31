# PRD: Topos Web Demo Refactor & Visual Overhaul

> **Branch:** `refactor/audit-cleanup` | **Commit strategy:** One commit per logical unit, build must pass after each | **Deploy:** Vercel via `6thc/web-demo` on GitHub

---

## Problem Statement

The Topos web-demo is a fintech prototype used to demo a collateral-backed lending platform to investors, partners, and institutions. While the 22-screen dual-phone UI is functionally complete, the codebase has accumulated technical debt that threatens demo reliability and developer velocity:

- **Bugs:** Global ID counter desync on reset, double initialization in PledgerApp, no error recovery in the populate function, no confirmation on destructive actions (Reset, Decline)
- **Code organization:** App.tsx is 1,065 lines with BorrowerApp (381 lines) and buildActivityHistoryProgressively (341 lines) inlined; credits.ts is 841 lines mixing pure math with state mutations
- **Architecture:** 8+ props drilled 5 levels deep, duplicated dual-state array patterns, near-identical payment processing in two functions
- **Visual polish:** Flat card shadows, no micro-interactions, inconsistent heading hierarchy — reads as early-stage prototype rather than polished product
- **Journey coverage:** Demo covers ~35% of canonical Topos journeys. Missing the default/grace period flow that investors care most about (risk management story)
- **Data accuracy:** NGN/USD rate is ~3.3x off reality (0.0022 vs ~0.00067), hardcoded names scattered across 10+ files with no single source of truth

## Solution

A comprehensive single-branch refactor that addresses all 10 AUDIT.md items, adds visual polish + layout redesigns to all 22 screens, introduces the grace period + default flow (highest-impact missing journey), sets up testing infrastructure, and fixes data accuracy — all while preserving the existing demo narrative and adding to it.

---

## User Stories

### Demo Stability (P1 Bugs)
1. As a **demo presenter**, I want the Reset button to fully reset all state including transaction and activity ID counters, so that the populate function produces consistent IDs every time
2. As a **demo presenter**, I want PledgerApp to initialize cleanly without redundant re-renders, so that the UI doesn't flicker when switching user states
3. As a **demo presenter**, I want the populate function to recover gracefully from mid-run errors, so that a failed populate leaves the app in a clean fresh state rather than a half-populated inconsistent state
4. As a **demo presenter**, I want confirmation dialogs on the Reset and Decline buttons, so that I don't accidentally destroy demo state during a live presentation
5. As a **demo presenter**, I want the populate function to be re-entrancy safe, so that double-tapping the populate button doesn't run two concurrent sequences

### Code Organization (P2)
6. As a **developer**, I want BorrowerApp extracted to its own file, so that App.tsx is navigable and BorrowerApp is independently testable
7. As a **developer**, I want buildActivityHistoryProgressively extracted to a demo-data module, so that procedural setup logic is separate from UI components
8. As a **developer**, I want credits.ts split into pure calculation functions and state mutation functions, so that loan math can be unit tested without side effects

### Architecture (P3)
9. As a **developer**, I want shared state (userState, refreshKey, onRefresh, onAuditLog) provided via React Context, so that I don't need to drill 8+ props through 5 component levels
10. As a **developer**, I want the dual-state array pattern (fresh/active) consolidated into getCurrentState/setCurrentState helpers, so that the 15+ if/else branches across data files are replaced with a single pattern
11. As a **developer**, I want the duplicated payment processing logic (addLoanRepayment + processCreditPayment) unified into a single function, so that payment logic changes only need to happen in one place

### Data Accuracy
12. As a **demo viewer**, I want the NGN/USD conversion rate to reflect reality (~1,500 NGN/$), so that collateral amounts make business sense (e.g., $300 collateral = ₦450K = 150% coverage of ₦300K loan)
13. As a **demo viewer**, I want financial calculations to produce coherent numbers at realistic rates, so that the demo is credible to financial professionals
14. As a **developer**, I want all hardcoded names (Abimbola Adebayo, Segun Adebayo) and account numbers extracted to a shared demo-config module, so that they can be changed in one place

### Visual Overhaul
15. As a **demo viewer**, I want cards to have depth through shadows and elevation, so that the UI feels layered and modern like Revolut or Kuda
16. As a **demo viewer**, I want hero sections to use gradient backgrounds instead of flat solid colors, so that the app looks more polished
17. As a **demo viewer**, I want buttons and interactive elements to have press feedback (scale animation), so that the app feels responsive
18. As a **demo viewer**, I want a clear typography hierarchy (distinct h1/h2/h3 sizes and weights), so that information hierarchy is immediately scannable
19. As a **demo viewer**, I want status badges to include semantic icons (checkmark for success, clock for pending, alert for error), so that status is communicated through both color and shape
20. As a **demo viewer**, I want transaction lists and cards to have staggered entrance animations, so that content feels dynamic rather than static
21. As a **demo viewer**, I want the bottom navigation to use a top-bar active indicator and icon scaling, so that the active tab is more visually distinct
22. As a **demo viewer**, I want all 22 screens to have redesigned layouts with modern fintech patterns, so that the entire app feels cohesive and production-grade
23. As a **demo viewer**, I want balance amounts to use tabular-nums and tighter tracking, so that numbers don't cause layout shifts
24. As a **demo viewer**, I want form screens to have blurred bottom CTAs and refined input styling, so that action areas feel distinct from content

### Grace Period + Default Flow
25. As a **demo presenter**, I want to show a loan going overdue with a grace period countdown, so that I can demonstrate Topos's risk management capabilities to investors
26. As a **demo presenter**, I want to show a defaulted loan with collateral seizure and settlement breakdown, so that I can demonstrate the full unhappy-path lifecycle
27. As a **borrower app user**, I want to see an overdue alert banner on my credit details with penalty interest accrued, so that the urgency of the situation is clear
28. As a **borrower app user**, I want to see a default notice screen showing settlement summary and frozen credit access, so that I understand the consequences of default
29. As a **pledger app user**, I want to see a collateral seizure notification with settlement breakdown (Credit JV share, Topos fee, my remainder), so that I understand where my locked funds went
30. As a **demo presenter**, I want the populate sequence extended with 2 new steps showing overdue → default, so that the demo narrative covers the full risk story
31. As a **borrower app user**, I want to be able to make a payment during the grace period to resolve the overdue status, so that the grace resolution path is demonstrable

### Testing & CI
32. As a **developer**, I want Vitest configured with unit tests for the data layer (credit calculations, wallet operations, transaction ledger), so that refactoring is safe
33. As a **developer**, I want a GitHub Actions CI workflow that runs build + tests on push and PRs, so that regressions are caught before Vercel deploys to demo.topos.network

---

## Implementation Decisions

### Module Architecture

**New modules to create:**

| Module | Type | Purpose |
|--------|------|---------|
| `demo-config` | Data | Centralized constants: actor names, account numbers, NGN_TO_USD_RATE, DEFAULT_ANNUAL_INTEREST_RATE, PENALTY_RATE, GRACE_PERIOD_DAYS |
| `credit-calculations` | Data (pure) | Extracted from credits.ts: convertLocalToUSD, convertUSDToLocal, parseTerm, calculateLoanTerms, calculatePaymentProgress, getRemainingPayments, getInstallmentLabel, formatCurrency. Zero side effects, fully testable |
| `demo-data` | Data | Extracted buildActivityHistoryProgressively from App.tsx. Extended with steps 9-10 (overdue + default narrative) |
| `DemoContext` | React Context | Single context providing: userState, refreshKey, onRefresh, onAuditLog, isPopulating. Replaces 8+ drilled props |
| `BorrowerApp` | Component | Extracted from App.tsx lines 373-753. Same interface, own file |
| `status-config` | Utility | Centralized getStatusBadgeVariant, getTransactionIconConfig, getCreditStatusConfig. Replaces 9+ local copies |
| `DefaultNoticeScreen` | Screen | Borrower-side default notice: settlement summary, timeline, frozen access notice |
| `CollateralSeizureScreen` | Screen | Pledger-side seizure view: settlement breakdown, wallet impact, credit details |
| `GraceAlertBanner` | Component | Inline overdue alert for CreditDetailsScreen: countdown, penalty, pay-now CTA |

**Modules to modify:**

| Module | Changes |
|--------|---------|
| `credits.ts` | Remove pure calc functions (moved to credit-calculations). Add: detectOverdue, applyPenaltyInterest, resolveGracePeriod, declareDefault. Add 'overdue' status. Unify addLoanRepayment + processCreditPayment. Import from demo-config |
| `transactions.ts` | Fix counter reset. Add 'penalty' and 'settlement' categories. Replace dynamic require() with static import. Import from demo-config |
| `wallet.ts` | Add seizeFunds function for collateral seizure. Import from demo-config |
| `pledger-activity.ts` | Fix counter reset. Add collateral_seized, settlement_completed, grace_warning activity types |
| `App.tsx` | Remove inlined BorrowerApp and buildActivityHistoryProgressively. Add DemoContext provider. Reduce from ~1065 to ~300 lines |
| `PledgerApp.tsx` | Fix double initialization useEffect. Consume DemoContext. Add seizure screen navigation |
| `globals.css` | Add shadow elevation system, gradient tokens, surface colors, transition tokens, page-enter animation, typography weight refinements, status color tokens |
| All 22 screens | Visual overhaul: shadows, gradients, micro-interactions, layout redesigns, heading hierarchy, badge consolidation via status-config |
| 7 UI components | card.tsx (shadow), button.tsx (active:scale), badge.tsx (semantic variants), input.tsx (shadow+height), progress.tsx (thicker+animated), skeleton.tsx (fix bg-accent bug), tabs.tsx (active shadow) |

### Data Model Changes for Grace/Default

Credit interface additions:
- `gracePeriodDays?: number` (default 14)
- `graceDeadline?: string` (ISO date)
- `overdueDate?: string`
- `defaultDate?: string`
- `penaltyInterest?: number` (accrued NGN)
- `penaltyInterestUSD?: number`
- `penaltyRate?: number` (annual, default 35%)
- `missedInstallments?: number`
- `settlement?: { totalSeized, creditJVShare, toposFeeShare, pledgerRemainder, outstandingDebt, outstandingDebtUSD, settledDate }`

New Credit status: `'overdue'` (between active and defaulted)

PaymentRecord type addition: `'penalty'`

### Financial Constants Fix

- `NGN_TO_USD_RATE`: 0.0022 → ~0.00067 (1,500 NGN/$)
- At corrected rate: $300 collateral = ₦450K = 150% coverage of ₦300K loan (makes business sense)
- All existing demo amounts (₦300K, ₦400K, $1500 wallet) remain presentation-friendly at realistic rates
- `PENALTY_RATE`: 35% APR (new, for grace period)
- `GRACE_PERIOD_DAYS`: 14 (new)

### Populate Sequence Extension

Current 8 steps remain unchanged. Add:

**Step 9 — Overdue loan (grace period demo):**
Create a 4-week weekly ₦150K loan with first payment due 10 days ago. Call detectOverdue + applyPenaltyInterest. Result: visible overdue credit with grace countdown (4 days remaining).

**Step 10 — Defaulted loan (seizure demo):**
Create a 4-week daily ₦100K loan dated 2 months ago. Make 2 payments then stop. Call detectOverdue + declareDefault. Result: defaulted credit with full settlement data showing collateral seizure breakdown.

### Visual Design System

Use `/frontend-design` skill for implementation of screen layouts. Design direction:

**Elevation system:** `--shadow-card` (sm), `--shadow-card-hover` (md), `--shadow-hero` (lg), `--shadow-modal` (xl)

**Gradient tokens:** `--gradient-borrower` (135deg, #E52A5B → #C41E4A → #A31640), `--gradient-pledger` (135deg, #4A4865 → #3f3d56 → #2E2C42)

**Color refinements:** `--background` shifts from #f9f9f9 to #fafbfc (cooler), `--muted` from #f9f9f9 to #f1f5f9 (distinct from background), add explicit status color tokens

**Typography:** Headings bump from weight 500 to 600, add letter-spacing: -0.02em on h1/h2, line-height tightened

**Interactions:** All buttons get `active:scale-[0.97]`, cards get `hover:shadow-md transition-shadow`, page-enter fade-slide animation on screen mounts, list stagger delays (50ms per item)

**Badge consolidation:** Add semantic variants (success, warning, info, pending) to Badge CVA, eliminating 30+ inline color class instances

**Bottom nav:** Replace active dot with top-bar indicator (w-8 h-0.5), add scale-110 on active icon

**Screen categories:**
- Hero screens: gradient backgrounds (replacing inline style backgroundColor), balance card at bg-white/97 + backdrop-blur-md + shadow-lg
- Detail screens: sticky header with shadow-xs, status icon with ring treatment, stat grids in muted/30 cards
- Form screens: blurred bottom CTA (bg-background/95 backdrop-blur-sm), tighter label-input spacing
- List screens: colored left accent borders on stat cards, date grouping headers

### DemoContext API

```
DemoContext {
  userState: 'fresh' | 'active'
  setUserState: (state) => void
  refreshKey: number
  onRefresh: () => void
  onAuditLog: (event) => void
  isPopulating: boolean
}
```

Provider wraps both phone components in App.tsx. Both PledgerApp and BorrowerApp consume via useContext instead of props.

### State Consolidation Pattern

Replace the dual-array pattern in wallet.ts, transactions.ts, pledger-activity.ts:

```
// Before (repeated 15+ times):
if (userState === 'fresh') { freshState = [...] } else { activeState = [...] }

// After:
function getState(userState) { return userState === 'fresh' ? freshState : activeState }
function setState(userState, value) { ... }
```

Each data module exports getCurrentState/setCurrentState. All mutation functions use these internally.

---

## Testing Decisions

### Framework
- **Vitest** (natural fit for Vite, zero-config with existing setup)
- Unit tests only for data layer (no DOM/component tests)

### What makes a good test here
- Test external behavior through the module's public API, not internal state
- Each test should set up its own state via reset functions, then verify outcomes through getter functions
- No mocking of other data modules — they're small enough to use directly
- Test financial calculations with known inputs/outputs (deterministic math)

### Modules to test

| Module | Test focus |
|--------|-----------|
| `credit-calculations` | convertLocalToUSD/convertUSDToLocal at realistic rate, calculateLoanTerms with various amounts/terms/rates, calculatePaymentProgress edge cases (0%, 100%, over-payment), parseTerm for all frequency types |
| `credits` (state) | Full lifecycle: addPendingRequest → approve → disburse → payments → completion. Reset + re-populate produces consistent state. detectOverdue transitions correctly. declareDefault generates valid settlement. Payment on overdue credit resolves grace period |
| `wallet` | topUp → lock → available balance correct. seizeFunds removes from locked AND balance. Multiple concurrent locks. Reset returns to clean state |
| `transactions` | addLoanDisbursementTransaction creates correct ledger entry. Balance tracking through deposits/withdrawals. Counter resets properly |
| `demo-data` | Full 10-step populate sequence completes without throwing. State after populate has expected number of credits, transactions, activities |

### No tests for
- React components (visual verification only, no component test infrastructure)
- UI utility functions (trivial formatting)
- CSS/styling changes

---

## Out of Scope

- **New journeys beyond grace/default:** KYC onboarding, credit scoring, pledger marketplace, offer generation — these are multi-sprint features
- **Dark mode:** next-themes is installed but dark mode activation is not in scope
- **Backend/API integration:** This remains a pure frontend demo with in-memory state
- **Mobile responsiveness:** The app renders in fixed 393x852 phone frames; responsive design is not applicable
- **ESLint setup:** Not requested
- **Accessibility remediation:** Noted issues (missing aria-labels, semantic HTML) are tracked but not in scope for this pass
- **Performance optimization:** The refreshKey remount pattern works for a demo; no need to optimize re-renders

---

## Further Notes

### Execution Order (commit sequence)

**Phase 1: Infrastructure** (2 commits)
1. Set up Vitest config, test runner scripts, CI workflow
2. Create demo-config.ts with extracted constants (names, rates, accounts)

**Phase 2: Bug Fixes — P1** (4 commits)
3. Fix global ID counter desync (reset nextTransactionId + nextActivityId in reset functions)
4. Fix double initialization in PledgerApp.tsx useEffect
5. Add error handling + recovery + re-entrancy guard to buildActivityHistoryProgressively
6. Add AlertDialog confirmations for Reset and Decline actions

**Phase 3: Code Organization — P2** (3 commits)
7. Extract BorrowerApp to src/components/BorrowerApp.tsx
8. Extract buildActivityHistoryProgressively to src/components/data/demo-data.ts
9. Split credits.ts → credit-calculations.ts (pure math) + credits.ts (state)

**Phase 4: Architecture — P3** (3 commits)
10. Add DemoContext, wire into App.tsx, PledgerApp, BorrowerApp
11. Consolidate dual-state array pattern with getCurrentState/setCurrentState
12. Unify addLoanRepayment + processCreditPayment into single function

**Phase 5: Data Accuracy** (1 commit)
13. Fix NGN_TO_USD_RATE to ~0.00067, adjust all demo amounts for coherent math

**Phase 6: Unit Tests** (1 commit)
14. Write unit tests for credit-calculations, credits, wallet, transactions, demo-data

**Phase 7: Visual Overhaul** (4 commits) — use `/frontend-design` skill
15. Global foundation: globals.css tokens (shadows, gradients, surfaces, typography, animations, status colors)
16. UI component upgrades: card, button, badge, input, progress, skeleton, tabs
17. Shared component redesigns: SmartphoneContainer, BottomNav, Header, BalanceCards, ActivityCards, Carousels
18. All 22 screen layouts: hero gradients, detail headers, form CTAs, list styling, status consolidation via status-config.ts, page-enter animations

**Phase 8: Grace Period + Default Flow** (3 commits)
19. Data model: Credit interface additions, wallet.seizeFunds, new credit functions (detectOverdue, applyPenaltyInterest, resolveGracePeriod, declareDefault)
20. New screens: GraceAlertBanner, DefaultNoticeScreen, CollateralSeizureScreen + existing screen updates
21. Populate extension: Steps 9-10 (overdue + defaulted loans), audit trail events

**Phase 9: Final Verification** (1 commit)
22. Run full build + test suite. Fix any issues. Update AUDIT.md with completed items.

### Key Files Reference

| File | Lines | Role |
|------|-------|------|
| `src/App.tsx` | 1065 | Root orchestrator — will shrink to ~300 after extractions |
| `src/components/PledgerApp.tsx` | ~350 | Pledger phone — double init bug here |
| `src/components/data/credits.ts` | 841 | Core loan lifecycle — will be split |
| `src/components/data/transactions.ts` | 438 | Transaction ledger |
| `src/components/data/wallet.ts` | 158 | Pledger USD wallet |
| `src/components/data/pledger-activity.ts` | 108 | Activity log |
| `src/styles/globals.css` | 249 | Design tokens + base styles |
| `src/components/ui/card.tsx` | 93 | Highest-leverage visual change |
| `src/components/ui/badge.tsx` | 47 | Status variant consolidation |
| `src/components/ui/button.tsx` | 58 | Press interaction |

### Topos Domain Alignment

Terminology is already correct (Pledger, Borrower match canonical Topos definitions). The grace period + default flow aligns with these canonical journeys from the SWAG vault:
- **TJ BACKED CREDIT SETTLEMENT** (happy path — already demoed)
- **TJ BACKED CREDIT DEFAULT** (unhappy path — being added)
- **TJ BACKED CREDIT GRACE RESOLUTION** (grace recovery — being added)

Settlement breakdown follows Topos spec: seized collateral split between Credit JV (warranty claim), Topos (platform fee), and Pledger (remainder).

### Verification

After all implementation:
1. `npm run build` — zero errors
2. `npm run test` — all unit tests pass
3. Manual: click Populate, verify 10-step sequence completes with toasts
4. Manual: click Reset, verify clean state, click Populate again — same result (ID counter fix)
5. Manual: verify overdue credit shows grace countdown in borrower app
6. Manual: verify defaulted credit shows seizure breakdown in pledger app
7. Manual: verify all 22 screens render without visual regression
8. `git log --oneline` — ~22 clean incremental commits on refactor/audit-cleanup branch
