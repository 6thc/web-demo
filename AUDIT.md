# Codebase Audit

## Demo Quality: Strong (9/10) — keep what's working

All 22 screens are complete and polished. No placeholders in the active flow. The dual-phone layout, audit trail, FABs, and populate feature are well-executed and presentation-ready. Key strengths:

- **User flows have no dead ends** — borrower and pledger flows are complete with proper back navigation everywhere
- **Real-time sync works well** — state refreshes correctly between both phones
- **Populate function tells a coherent story** — completed loan → active loan → pending request is the right narrative arc for a demo
- **Data is realistic** — 25% APR, 120% LTV, ₦250K–400K loan sizes are all credible for Nigerian SME lending
- **Presentation layer is excellent** — audit trail panel, per-phone labels, tooltips, disclaimer, toast notifications

**Minor demo improvements worth making (not blockers):**
1. Add a confirmation dialog before Decline (easy to mis-tap in a live demo)
2. Add a confirmation dialog before Reset (currently one-click, irreversible)
3. The NGN → USD rate (0.0022) is ~10× off from reality (real rate ≈ 1,500 NGN/$1). Not visible to most audiences but worth noting if demoing to fintech-savvy investors.

---

## Code Quality: Mixed — clear issues but not catastrophic

### Structural problems (hardest to live with)

**1. `App.tsx` is 1,065 lines doing three jobs:**
- `buildActivityHistoryProgressively()` is 341 lines of procedural setup living in the same file as UI components
- `BorrowerApp` component (381 lines) is defined inside `App.tsx` instead of its own file — makes it untestable and hard to navigate
- Root layout, demo controls, and business logic are all mixed

**2. Data layer has duplicated mutation logic:**
- `processCreditPayment()` and `addLoanRepayment()` in `credits.ts` (841 lines total) contain ~60 lines of near-identical logic
- The `if (userState === 'fresh') { ... } else { ... }` pattern for dual state arrays repeats 15+ times across all data files
- `credits.ts` mixes type definitions, loan math, state management, and payment processing — should be at least 2 files

**3. Prop drilling 5 levels deep:**
- `userState`, `refreshKey`, `onRefresh`, `onAuditLog` are drilled App → BorrowerApp → HomeScreen → card subcomponents
- No React Context or state management library

**4. Global mutable ID counters desync on reset:**
- `nextCreditId`, `nextTransactionId`, `nextActivityId` are module-level globals
- Resetting one user state doesn't reset the counters, leading to ID collisions after reset

### Bugs that could bite during a live demo

**5. Double initialization in `PledgerApp.tsx` (lines 44–54):**
- The `useEffect` for `userState` changes calls `initializeFreshWallet()` AND triggers `setLocalRefreshKey` — while the parent also calls `onRefresh()`. Causes redundant renders and potential flicker.

**6. No error handling in `buildActivityHistoryProgressively()`:**
- If any step throws (e.g., insufficient wallet balance), the function fails silently mid-way, leaving the app in a half-populated inconsistent state with no recovery UI.

**7. Infinite re-render risk in populate:**
- `onRefresh()` is called 20+ times during population. Each call increments `refreshKey`, which forces full remounts of both phone components. No guard against re-entrancy.

### Lower priority (polish, not blockers)

- 8 props passed to both BorrowerApp and PledgerApp — context would help
- The 200-character Tailwind tooltip class string is copy-pasted 4 times in `App.tsx`
- `handleSubmitRequest` has `requestData: any` — should have a proper type
- Hard-coded names ("Abimbola Adebayo", "Segun Adebayo") scattered across 5 files — if you change one you'll miss others

---

## Refactor vs. Start From Scratch

**Recommendation: Targeted refactor, not a rewrite.**

The 22 screens represent the bulk of the visual work and they're all complete and well-polished. A rewrite throws all of that away. The architectural problems are concentrated in `App.tsx`, `credits.ts`, and the data layer's dual-state pattern — fixable without touching screens. This is a demo app; the bar is "maintainable and demo-stable," not "scalable to 10 engineers."

A rewrite is only justified if: (a) you're evolving this into a real product, or (b) the codebase becomes so painful that new features take 3× as long. Neither is true yet.

---

## Refactor Plan (prioritized)

### Priority 1: Demo stability (fix before next presentation)

1. **Add error handling + recovery to `buildActivityHistoryProgressively()`**
   - Wrap in try/catch, reset to clean state on failure, show error toast
   - `src/App.tsx` lines 30–371

2. **Fix double initialization in `PledgerApp`**
   - Remove `setLocalRefreshKey` from the `userState` useEffect (let parent's `refreshKey` handle re-renders)
   - `src/components/PledgerApp.tsx` lines 44–54

3. **Fix global ID counter desync**
   - Reset `nextCreditId`, `nextTransactionId`, `nextActivityId` inside the existing reset functions
   - `src/components/data/credits.ts`, `transactions.ts`, `pledger-activity.ts`

4. **Add confirmation dialogs for Decline and Reset**
   - Use existing Radix `AlertDialog` from `src/components/ui/`
   - `src/App.tsx` (Reset FAB), `src/components/screens/PledgerRequestDetailsScreen.tsx` (Decline button)

### Priority 2: Code organization (before significant new feature work)

5. **Extract `BorrowerApp` to its own file**
   - Move `src/App.tsx` lines 373–753 → `src/components/BorrowerApp.tsx`
   - No logic changes, just file split

6. **Extract `buildActivityHistoryProgressively()` to its own module**
   - Move to `src/components/data/demo-data.ts`

7. **Split `credits.ts` into two files:**
   - `src/components/data/credit-calculations.ts` — pure math functions (no state)
   - `src/components/data/credits.ts` — state management + mutations (imports calculations)

### Priority 3: Architecture improvements (only if ongoing development)

8. **Add React Context for shared state** — eliminate 5-level prop drilling for `userState`, `onRefresh`, `onAuditLog`

9. **Consolidate dual-state array pattern** — replace 15+ `if (userState === 'fresh')` blocks with a `getCurrentState()` / `setCurrentState()` helper across all data files

10. **De-duplicate payment processing** — extract shared logic from `processCreditPayment()` and `addLoanRepayment()` into a private helper in `credits.ts`
