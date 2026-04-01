import { describe, it, expect, beforeEach } from 'vitest';
import {
  resetToFreshUser,
  addPendingRequest,
  approvePendingRequest,
  declinePendingRequest,
  getCreditsForUserState,
  getCreditById,
  getPaymentsByCredituId,
  getCreditsByStatus,
  getTotalCreditBalance,
  hasActiveLoans,
  getPendingCreditsForUserState,
  processCreditPayment,
  addLoanRepayment,
  pledgerApproveLoan,
  pledgerDeclineLoan,
  approveAllPendingRequests,
  declineAllPendingRequests,
} from './credits';
import { resetPledgerActivitiesToFresh } from './pledger-activity';

const basePendingRequest = {
  pledgerName: 'Abimbola Adebayo',
  pledgerEmail: 'abimbola@example.com',
  pledgerCountry: 'US',
  amount: 300000,
  term: '3 months',
  submittedDate: 'Jan 15, 2026',
  purpose: 'Business expansion',
  expectedInterestRate: 25.0,
  repaymentFrequency: 'Monthly' as const,
};

// ---------------------------------------------------------------------------
// Lifecycle: pending → active → completed
// ---------------------------------------------------------------------------
describe('credit lifecycle', () => {
  beforeEach(() => {
    resetToFreshUser();
    resetPledgerActivitiesToFresh();
  });

  it('addPendingRequest creates a credit in pending status', () => {
    const credit = addPendingRequest(basePendingRequest, 'fresh');
    expect(credit.status).toBe('pending');
    expect(credit.id).toBe('CR001');
    expect(credit.totalAmount).toBe(300000);
    expect(credit.remaining).toBe(credit.totalToRepay);
    expect(credit.totalPaid).toBe(0);
    expect(credit.paymentHistory).toEqual([]);
  });

  it('approvePendingRequest transitions pending → active with dates', () => {
    const pending = addPendingRequest(basePendingRequest, 'fresh');
    const approved = approvePendingRequest(pending.id, 'fresh');

    expect(approved).not.toBeNull();
    expect(approved!.status).toBe('active');
    expect(approved!.startDate).toBeTruthy();
    expect(approved!.endDate).toBeTruthy();
    expect(approved!.nextPayment).toBeTruthy();
  });

  it('full lifecycle: pending → active → payment reduces remaining', () => {
    const pending = addPendingRequest(basePendingRequest, 'fresh');
    approvePendingRequest(pending.id, 'fresh');

    const credit = getCreditById(pending.id, 'fresh')!;
    expect(credit.status).toBe('active');

    // Make a regular payment
    const result = processCreditPayment(
      pending.id,
      credit.installmentAmount,
      'regular',
      'TXN001',
      'fresh'
    );

    expect(result.success).toBe(true);
    expect(result.updatedCredit!.remaining).toBeLessThan(credit.remaining);
    expect(result.updatedCredit!.totalPaid).toBe(credit.installmentAmount);
    expect(result.updatedCredit!.paymentHistory).toHaveLength(1);
  });

  it('full payment sets status to completed', () => {
    const pending = addPendingRequest(basePendingRequest, 'fresh');
    approvePendingRequest(pending.id, 'fresh');

    const credit = getCreditById(pending.id, 'fresh')!;

    // Pay everything at once
    const result = processCreditPayment(
      pending.id,
      credit.totalToRepay,
      'full',
      'TXN001',
      'fresh'
    );

    expect(result.success).toBe(true);
    expect(result.updatedCredit!.status).toBe('completed');
    expect(result.updatedCredit!.remaining).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// getCreditsForUserState
// ---------------------------------------------------------------------------
describe('getCreditsForUserState', () => {
  beforeEach(() => {
    resetToFreshUser();
    resetPledgerActivitiesToFresh();
  });

  it('returns empty array after reset', () => {
    expect(getCreditsForUserState('fresh')).toEqual([]);
  });

  it('returns credits added to the correct state', () => {
    addPendingRequest(basePendingRequest, 'fresh');
    expect(getCreditsForUserState('fresh')).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// getCreditById
// ---------------------------------------------------------------------------
describe('getCreditById', () => {
  beforeEach(() => {
    resetToFreshUser();
    resetPledgerActivitiesToFresh();
  });

  it('finds a credit by its ID', () => {
    const created = addPendingRequest(basePendingRequest, 'fresh');
    const found = getCreditById(created.id, 'fresh');
    expect(found).toBeDefined();
    expect(found!.id).toBe(created.id);
  });

  it('returns undefined for unknown ID', () => {
    expect(getCreditById('CR999', 'fresh')).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// getPaymentsByCredituId
// ---------------------------------------------------------------------------
describe('getPaymentsByCredituId', () => {
  beforeEach(() => {
    resetToFreshUser();
    resetPledgerActivitiesToFresh();
  });

  it('returns empty array when no payments made', () => {
    const credit = addPendingRequest(basePendingRequest, 'fresh');
    expect(getPaymentsByCredituId(credit.id, 'fresh')).toEqual([]);
  });

  it('returns payment records after payment', () => {
    const pending = addPendingRequest(basePendingRequest, 'fresh');
    approvePendingRequest(pending.id, 'fresh');
    const credit = getCreditById(pending.id, 'fresh')!;

    addLoanRepayment(pending.id, credit.installmentAmount, 'TXN001', 'regular', 'fresh');

    const payments = getPaymentsByCredituId(pending.id, 'fresh');
    expect(payments).toHaveLength(1);
    expect(payments[0].amount).toBe(credit.installmentAmount);
  });
});

// ---------------------------------------------------------------------------
// processCreditPayment
// ---------------------------------------------------------------------------
describe('processCreditPayment', () => {
  beforeEach(() => {
    resetToFreshUser();
    resetPledgerActivitiesToFresh();
  });

  it('fails on non-existent credit', () => {
    const result = processCreditPayment('CR999', 10000, 'regular', 'TXN001', 'fresh');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Credit not found');
  });

  it('fails on pending credit (not active)', () => {
    const pending = addPendingRequest(basePendingRequest, 'fresh');
    const result = processCreditPayment(pending.id, 10000, 'regular', 'TXN001', 'fresh');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Credit is not active');
  });

  it('reduces remaining correctly on partial payment', () => {
    const pending = addPendingRequest(basePendingRequest, 'fresh');
    approvePendingRequest(pending.id, 'fresh');
    const credit = getCreditById(pending.id, 'fresh')!;

    const paymentAmount = credit.installmentAmount;
    const result = processCreditPayment(pending.id, paymentAmount, 'regular', 'TXN001', 'fresh');

    expect(result.success).toBe(true);
    expect(result.updatedCredit!.remaining).toBe(credit.remaining - paymentAmount);
  });

  it('remaining never goes below 0', () => {
    const pending = addPendingRequest(basePendingRequest, 'fresh');
    approvePendingRequest(pending.id, 'fresh');
    const credit = getCreditById(pending.id, 'fresh')!;

    // Overpay
    const result = processCreditPayment(pending.id, credit.totalToRepay + 50000, 'full', 'TXN001', 'fresh');
    expect(result.success).toBe(true);
    expect(result.updatedCredit!.remaining).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// addLoanRepayment
// ---------------------------------------------------------------------------
describe('addLoanRepayment', () => {
  beforeEach(() => {
    resetToFreshUser();
    resetPledgerActivitiesToFresh();
  });

  it('creates a payment record with correct split', () => {
    const pending = addPendingRequest(basePendingRequest, 'fresh');
    approvePendingRequest(pending.id, 'fresh');

    const credit = getCreditById(pending.id, 'fresh')!;
    const result = addLoanRepayment(pending.id, credit.installmentAmount, 'TXN001', 'regular', 'fresh');

    expect(result.success).toBe(true);
    expect(result.paymentRecord).toBeDefined();
    expect(result.paymentRecord!.amount).toBe(credit.installmentAmount);
    // Principal + interest should equal total payment
    expect(result.paymentRecord!.principalAmount + result.paymentRecord!.interestAmount)
      .toBe(credit.installmentAmount);
  });
});

// ---------------------------------------------------------------------------
// declinePendingRequest
// ---------------------------------------------------------------------------
describe('declinePendingRequest', () => {
  beforeEach(() => {
    resetToFreshUser();
    resetPledgerActivitiesToFresh();
  });

  it('sets status to cancelled', () => {
    const pending = addPendingRequest(basePendingRequest, 'fresh');
    const declined = declinePendingRequest(pending.id, 'fresh');
    expect(declined).not.toBeNull();
    expect(declined!.status).toBe('cancelled');
  });

  it('returns null for already-active credit', () => {
    const pending = addPendingRequest(basePendingRequest, 'fresh');
    approvePendingRequest(pending.id, 'fresh');
    const declined = declinePendingRequest(pending.id, 'fresh');
    expect(declined).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// approveAllPendingRequests / declineAllPendingRequests
// ---------------------------------------------------------------------------
describe('bulk operations', () => {
  beforeEach(() => {
    resetToFreshUser();
    resetPledgerActivitiesToFresh();
  });

  it('approveAllPendingRequests approves every pending credit', () => {
    addPendingRequest({ ...basePendingRequest, amount: 100000 }, 'fresh');
    addPendingRequest({ ...basePendingRequest, amount: 200000 }, 'fresh');

    const approved = approveAllPendingRequests('fresh');
    expect(approved).toHaveLength(2);
    approved.forEach(c => expect(c.status).toBe('active'));
  });

  it('declineAllPendingRequests cancels every pending credit', () => {
    addPendingRequest({ ...basePendingRequest, amount: 100000 }, 'fresh');
    addPendingRequest({ ...basePendingRequest, amount: 200000 }, 'fresh');

    const declined = declineAllPendingRequests('fresh');
    expect(declined).toHaveLength(2);
    declined.forEach(c => expect(c.status).toBe('cancelled'));
  });
});

// ---------------------------------------------------------------------------
// pledgerApproveLoan / pledgerDeclineLoan wrappers
// ---------------------------------------------------------------------------
describe('pledger wrappers', () => {
  beforeEach(() => {
    resetToFreshUser();
    resetPledgerActivitiesToFresh();
  });

  it('pledgerApproveLoan returns success + credit', () => {
    const pending = addPendingRequest(basePendingRequest, 'fresh');
    const result = pledgerApproveLoan(pending.id, 'fresh');
    expect(result.success).toBe(true);
    expect(result.credit!.status).toBe('active');
  });

  it('pledgerDeclineLoan returns success + credit', () => {
    const pending = addPendingRequest(basePendingRequest, 'fresh');
    const result = pledgerDeclineLoan(pending.id, 'fresh');
    expect(result.success).toBe(true);
    expect(result.credit!.status).toBe('cancelled');
  });
});

// ---------------------------------------------------------------------------
// Reset & ID counter
// ---------------------------------------------------------------------------
describe('resetToFreshUser', () => {
  beforeEach(() => {
    resetPledgerActivitiesToFresh();
  });

  it('clears all fresh credits', () => {
    addPendingRequest(basePendingRequest, 'fresh');
    resetToFreshUser();
    expect(getCreditsForUserState('fresh')).toEqual([]);
  });

  it('resets ID counter so next credit starts at CR001', () => {
    addPendingRequest(basePendingRequest, 'fresh');
    // ID used: CR001, nextCreditId is now 2
    resetToFreshUser();
    const credit = addPendingRequest(basePendingRequest, 'fresh');
    expect(credit.id).toBe('CR001');
  });
});

// ---------------------------------------------------------------------------
// getTotalCreditBalance
// ---------------------------------------------------------------------------
describe('getTotalCreditBalance', () => {
  beforeEach(() => {
    resetToFreshUser();
    resetPledgerActivitiesToFresh();
  });

  it('returns 0 when no active credits', () => {
    expect(getTotalCreditBalance('fresh')).toBe(0);
  });

  it('sums remaining of active credits only', () => {
    const c1 = addPendingRequest({ ...basePendingRequest, amount: 100000 }, 'fresh');
    const c2 = addPendingRequest({ ...basePendingRequest, amount: 200000 }, 'fresh');
    approvePendingRequest(c1.id, 'fresh');
    // c2 stays pending — should not be counted

    const balance = getTotalCreditBalance('fresh');
    const activeCredit = getCreditById(c1.id, 'fresh')!;
    expect(balance).toBe(activeCredit.remaining);
  });
});

// ---------------------------------------------------------------------------
// hasActiveLoans / getPendingCreditsForUserState
// ---------------------------------------------------------------------------
describe('hasActiveLoans', () => {
  beforeEach(() => {
    resetToFreshUser();
    resetPledgerActivitiesToFresh();
  });

  it('false when no credits', () => {
    expect(hasActiveLoans('fresh')).toBe(false);
  });

  it('true after a credit is approved', () => {
    const c = addPendingRequest(basePendingRequest, 'fresh');
    approvePendingRequest(c.id, 'fresh');
    expect(hasActiveLoans('fresh')).toBe(true);
  });
});

describe('getPendingCreditsForUserState', () => {
  beforeEach(() => {
    resetToFreshUser();
    resetPledgerActivitiesToFresh();
  });

  it('returns only pending/reviewing credits', () => {
    const c1 = addPendingRequest({ ...basePendingRequest, amount: 100000 }, 'fresh');
    addPendingRequest({ ...basePendingRequest, amount: 200000 }, 'fresh');
    approvePendingRequest(c1.id, 'fresh');

    const pending = getPendingCreditsForUserState('fresh');
    expect(pending).toHaveLength(1);
    expect(pending[0].status).toBe('pending');
  });
});
