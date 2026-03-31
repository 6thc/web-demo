// Centralized demo configuration — single source of truth for all hardcoded values

// === Actor Names ===
export const PLEDGER_NAME = 'Abimbola Adebayo';
export const BORROWER_NAME = 'Segun Adebayo';

// === Account Numbers ===
export const BORROWER_ACCOUNT = '0987654321';
export const CREDIT_ACCOUNT = '4433221100';
export const BORROWER_ACCOUNT_LABEL = `Your Account - ${BORROWER_ACCOUNT}`;
export const CREDIT_ACCOUNT_LABEL = `TOPOS Credit - ${CREDIT_ACCOUNT}`;

// === Exchange Rates ===
export const NGN_TO_USD_RATE = 0.00067; // 1 NGN ≈ $0.00067 USD (~1,500 NGN per $1 USD)
export const USD_TO_NGN_RATE = 1 / NGN_TO_USD_RATE; // ~1,493 NGN per $1 USD

// === Interest Rates ===
export const DEFAULT_ANNUAL_INTEREST_RATE = 25.0; // 25% APR
export const PENALTY_ANNUAL_INTEREST_RATE = 35.0; // 35% APR for overdue loans

// === Grace Period ===
export const GRACE_PERIOD_DAYS = 14; // Days allowed before default declaration

// === Collateral ===
export const DEFAULT_COLLATERAL_RATIO = 1.5; // 150% collateral coverage

// === Pledger Wallet ===
export const INITIAL_WALLET_TOPUP = 1500; // $1,500 USD initial pledger wallet balance

// === Borrower Initial Deposits (NGN) ===
export const INITIAL_DEPOSITS = [
  { amount: 250000, label: '₦250,000', daysAgo: 90 },
  { amount: 180000, label: '₦180,000', daysAgo: 60 },
  { amount: 150000, label: '₦150,000', daysAgo: 30 },
] as const;

// === Demo Loan Amounts ===
export const DEMO_LOANS = {
  completed: { amountNGN: 300000, collateralUSD: 300 },
  active: { amountNGN: 400000, collateralUSD: 400 },
  pending: { amountNGN: 250000 },
  overdue: { amountNGN: 150000, collateralUSD: 150 },
  defaulted: { amountNGN: 100000, collateralUSD: 100 },
} as const;

// === Settlement Fee Structure ===
export const TOPOS_PLATFORM_FEE_RATE = 0.05; // 5% of seized collateral
