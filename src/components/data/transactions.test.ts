import { describe, it, expect, beforeEach } from 'vitest';
import {
  resetTransactionsToFreshUser,
  getTransactionsForUserState,
  getCurrentBalance,
  addCashTransaction,
  addLoanDisbursementTransaction,
  addLoanRepaymentTransaction,
  getTransactionById,
  isLoanTransaction,
  getCreditIdFromTransaction,
  getAccountBalances,
  type Transaction,
} from './transactions';
import { resetToFreshUser, addPendingRequest, approvePendingRequest, getCreditById } from './credits';
import { resetPledgerActivitiesToFresh } from './pledger-activity';

beforeEach(() => {
  resetTransactionsToFreshUser();
  resetToFreshUser();
  resetPledgerActivitiesToFresh();
});

// ---------------------------------------------------------------------------
// resetTransactionsToFreshUser
// ---------------------------------------------------------------------------
describe('resetTransactionsToFreshUser', () => {
  it('clears all transactions', () => {
    addCashTransaction('deposit', 250000, 'fresh');
    resetTransactionsToFreshUser();
    expect(getTransactionsForUserState('fresh')).toEqual([]);
  });

  it('resets balance to 0', () => {
    addCashTransaction('deposit', 250000, 'fresh');
    resetTransactionsToFreshUser();
    expect(getCurrentBalance('fresh')).toBe(0);
  });

  it('resets ID counter — next transaction starts at TXN001', () => {
    addCashTransaction('deposit', 100000, 'fresh'); // TXN001
    addCashTransaction('deposit', 100000, 'fresh'); // TXN002
    resetTransactionsToFreshUser();
    // Also reset credit counter since resetToFreshUser is already called in beforeEach
    const result = addCashTransaction('deposit', 50000, 'fresh');
    expect(result.transaction!.id).toBe('TXN001');
  });
});

// ---------------------------------------------------------------------------
// addCashTransaction — deposit
// ---------------------------------------------------------------------------
describe('addCashTransaction (deposit)', () => {
  it('creates a credit transaction', () => {
    const result = addCashTransaction('deposit', 250000, 'fresh');
    expect(result.success).toBe(true);
    expect(result.transaction).toBeDefined();
    expect(result.transaction!.type).toBe('credit');
    expect(result.transaction!.category).toBe('cash');
    expect(result.transaction!.amount).toBe(250000);
  });

  it('balance increases after deposit', () => {
    addCashTransaction('deposit', 250000, 'fresh');
    expect(getCurrentBalance('fresh')).toBe(250000);
  });

  it('reports correct newBalance', () => {
    const result = addCashTransaction('deposit', 250000, 'fresh');
    expect(result.newBalance).toBe(250000);
  });

  it('transaction appears in list', () => {
    addCashTransaction('deposit', 250000, 'fresh');
    const txns = getTransactionsForUserState('fresh');
    expect(txns).toHaveLength(1);
    expect(txns[0].name).toBe('Cash Deposit');
  });

  it('accumulates multiple deposits', () => {
    addCashTransaction('deposit', 250000, 'fresh');
    addCashTransaction('deposit', 180000, 'fresh');
    expect(getCurrentBalance('fresh')).toBe(430000);
  });
});

// ---------------------------------------------------------------------------
// addCashTransaction — withdraw
// ---------------------------------------------------------------------------
describe('addCashTransaction (withdraw)', () => {
  it('creates a debit transaction', () => {
    addCashTransaction('deposit', 500000, 'fresh');
    const result = addCashTransaction('withdraw', 100000, 'fresh');
    expect(result.success).toBe(true);
    expect(result.transaction!.type).toBe('debit');
    expect(result.transaction!.amount).toBe(-100000);
  });

  it('balance decreases after withdrawal', () => {
    addCashTransaction('deposit', 500000, 'fresh');
    addCashTransaction('withdraw', 200000, 'fresh');
    expect(getCurrentBalance('fresh')).toBe(300000);
  });

  it('fails when insufficient funds', () => {
    addCashTransaction('deposit', 100000, 'fresh');
    const result = addCashTransaction('withdraw', 200000, 'fresh');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Insufficient');
    // Balance unchanged
    expect(getCurrentBalance('fresh')).toBe(100000);
  });

  it('fails on empty balance', () => {
    const result = addCashTransaction('withdraw', 1, 'fresh');
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// addLoanDisbursementTransaction
// ---------------------------------------------------------------------------
describe('addLoanDisbursementTransaction', () => {
  it('adds a credit (loan) transaction and increases balance', () => {
    const credit = addPendingRequest({
      pledgerName: 'Test',
      pledgerEmail: 'test@test.com',
      pledgerCountry: 'US',
      amount: 300000,
      term: '3 months',
      submittedDate: 'Jan 1, 2026',
    }, 'fresh');

    const result = addLoanDisbursementTransaction(credit.id, 300000, 'fresh');
    expect(result.success).toBe(true);
    expect(result.newBalance).toBe(300000);
    expect(result.transaction!.category).toBe('loan');
    expect(result.transaction!.type).toBe('credit');
  });
});

// ---------------------------------------------------------------------------
// addLoanRepaymentTransaction
// ---------------------------------------------------------------------------
describe('addLoanRepaymentTransaction', () => {
  it('deducts balance for a repayment', () => {
    // Seed balance first
    addCashTransaction('deposit', 500000, 'fresh');

    const credit = addPendingRequest({
      pledgerName: 'Test',
      pledgerEmail: 'test@test.com',
      pledgerCountry: 'US',
      amount: 300000,
      term: '3 months',
      submittedDate: 'Jan 1, 2026',
      repaymentFrequency: 'Monthly',
    }, 'fresh');
    approvePendingRequest(credit.id, 'fresh');

    const activeCredit = getCreditById(credit.id, 'fresh')!;
    const result = addLoanRepaymentTransaction(credit.id, activeCredit.installmentAmount, 'regular', 'fresh');

    expect(result.success).toBe(true);
    expect(result.transaction!.type).toBe('debit');
    expect(result.transaction!.category).toBe('loan');
    expect(result.newBalance).toBe(500000 - activeCredit.installmentAmount);
  });

  it('fails when balance is insufficient', () => {
    addCashTransaction('deposit', 1000, 'fresh');

    const credit = addPendingRequest({
      pledgerName: 'Test',
      pledgerEmail: 'test@test.com',
      pledgerCountry: 'US',
      amount: 300000,
      term: '3 months',
      submittedDate: 'Jan 1, 2026',
    }, 'fresh');
    approvePendingRequest(credit.id, 'fresh');

    const activeCredit = getCreditById(credit.id, 'fresh')!;
    const result = addLoanRepaymentTransaction(credit.id, activeCredit.installmentAmount, 'regular', 'fresh');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Insufficient');
  });
});

// ---------------------------------------------------------------------------
// getTransactionById
// ---------------------------------------------------------------------------
describe('getTransactionById', () => {
  it('finds a transaction by ID', () => {
    const { transaction } = addCashTransaction('deposit', 100000, 'fresh');
    const found = getTransactionById(transaction!.id, 'fresh');
    expect(found).toBeDefined();
    expect(found!.id).toBe(transaction!.id);
  });

  it('returns undefined for unknown ID', () => {
    expect(getTransactionById('TXN999', 'fresh')).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// isLoanTransaction / getCreditIdFromTransaction
// ---------------------------------------------------------------------------
describe('isLoanTransaction', () => {
  it('true for loan category', () => {
    const txn = { category: 'loan', description: 'test' } as Transaction;
    expect(isLoanTransaction(txn)).toBe(true);
  });

  it('true when description contains "loan installment"', () => {
    const txn = { category: 'other', description: 'Monthly loan installment - CR001' } as Transaction;
    expect(isLoanTransaction(txn)).toBe(true);
  });

  it('false for non-loan transactions', () => {
    const txn = { category: 'cash', description: 'Cash deposit' } as Transaction;
    expect(isLoanTransaction(txn)).toBe(false);
  });
});

describe('getCreditIdFromTransaction', () => {
  it('extracts credit ID from loan description', () => {
    const txn = { category: 'loan', description: 'Monthly loan installment - CR001' } as Transaction;
    expect(getCreditIdFromTransaction(txn)).toBe('CR001');
  });

  it('returns null for non-loan transactions', () => {
    const txn = { category: 'cash', description: 'Cash deposit' } as Transaction;
    expect(getCreditIdFromTransaction(txn)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getAccountBalances
// ---------------------------------------------------------------------------
describe('getAccountBalances', () => {
  it('checking = current balance, credit = 0 when no loans', () => {
    addCashTransaction('deposit', 250000, 'fresh');
    const balances = getAccountBalances('fresh');
    expect(balances.checking).toBe(250000);
    expect(balances.credit).toBe(0);
    expect(balances.net).toBe(250000);
  });
});

// ---------------------------------------------------------------------------
// Transaction ID sequencing
// ---------------------------------------------------------------------------
describe('transaction IDs', () => {
  it('assigns sequential IDs', () => {
    const r1 = addCashTransaction('deposit', 100000, 'fresh');
    const r2 = addCashTransaction('deposit', 100000, 'fresh');
    expect(r1.transaction!.id).toBe('TXN001');
    expect(r2.transaction!.id).toBe('TXN002');
  });
});
