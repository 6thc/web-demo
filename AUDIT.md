# Codebase Audit

## Status: All 10 items completed (April 2026 refactor)

All items from the original audit have been addressed in the `refactor/audit-cleanup` branch (19 commits). See below for details.

---

## Demo Quality: Strong (9/10) — keep what's working

All 22 screens are complete and polished. No placeholders in the active flow. The dual-phone layout, audit trail, FABs, and populate feature are well-executed and presentation-ready.

**Improvements made in this refactor:**
- Confirmation dialogs on Reset and Decline buttons
- Re-entrancy guard on populate (prevents double-tap)
- Error recovery resets to clean state on failure
- NGN/USD rate fixed to realistic ~1,500 NGN/$ (was ~454)
- Visual overhaul: shadows, gradients, micro-interactions, page animations across all 22 screens
- Grace period + default flow added (2 new screens, extended populate narrative)

---

## Refactor Plan — All Items Complete

### Priority 1: Demo stability — DONE

1. **Error handling + recovery in populate** — DONE
   - Re-entrancy guard added, error resets to clean state, no re-throw
   - `src/components/data/demo-data.ts`

2. **Fix double initialization in PledgerApp** — DONE
   - Removed redundant `setLocalRefreshKey` and reset calls from useEffect
   - `src/components/PledgerApp.tsx`

3. **Fix global ID counter desync** — DONE
   - Created coordinated `resetAllToFresh()` in `src/components/data/reset.ts`
   - All three data modules reset atomically

4. **Add confirmation dialogs for Decline and Reset** — DONE
   - AlertDialog wraps Reset FAB and Decline button
   - `src/App.tsx`, `src/components/screens/PledgerRequestDetailsScreen.tsx`

### Priority 2: Code organization — DONE

5. **Extract BorrowerApp** — DONE
   - Moved to `src/components/BorrowerApp.tsx` (380 lines)
   - App.tsx reduced from 1,065 → 339 lines

6. **Extract buildActivityHistoryProgressively** — DONE
   - Moved to `src/components/data/demo-data.ts` (355 lines)

7. **Split credits.ts** — DONE
   - `src/components/data/credit-calculations.ts` (322 lines) — pure math, types, constants
   - `src/components/data/credits.ts` (558 lines) — state mutations only

### Priority 3: Architecture improvements — DONE

8. **React Context for shared state** — DONE
   - `src/components/DemoContext.tsx` provides userState, refreshKey, onRefresh, onAuditLog, isPopulating, notificationsEnabled
   - Provider wraps App.tsx content

9. **Consolidate dual-state pattern** — DONE
   - Private `setCreditsState`, `setTransactionsState`, `setActivitiesState` helpers replace 11 dual-branch patterns

10. **De-duplicate payment processing** — DONE
    - Shared `_applyPayment` helper extracts ~60 lines of duplicated logic

---

## Additional work beyond original audit

### Data accuracy
- NGN_TO_USD_RATE fixed from 0.0022 to 0.00067 (~1,500 NGN/$)
- Hardcoded names extracted to `src/components/data/demo-config.ts` (PLEDGER_NAME, BORROWER_NAME)
- Account numbers centralized (BORROWER_ACCOUNT_LABEL, CREDIT_ACCOUNT_LABEL)

### Testing infrastructure
- Vitest configured with 120 unit tests across 4 test files
- GitHub Actions CI workflow (build + test on push/PR)
- Tests cover: credit calculations, credit state lifecycle, wallet operations, transaction ledger

### Visual overhaul
- Shadow elevation system (--shadow-xs through --shadow-lg)
- Hero gradients replacing flat solid backgrounds
- Page-enter animations on all screens
- UI component upgrades: card shadows, button press scale, semantic badge variants, input/progress improvements
- Shared component redesigns: BottomNav top bar indicator, balance card tabular-nums, activity row hover states

### Grace period + default flow
- Credit interface extended with overdue/default fields and settlement object
- New functions: detectOverdue, applyPenaltyInterest, resolveGracePeriod, declareDefault
- New screens: GraceAlertBanner, DefaultNoticeScreen, CollateralSeizureScreen
- Populate sequence extended to 10 steps (was 8) with overdue and defaulted loan demos
- Aligns with Topos canonical journeys: TJ BACKED CREDIT DEFAULT, TJ BACKED CREDIT GRACE RESOLUTION
