import { describe, it, expect } from 'vitest';
import {
  NGN_TO_USD_RATE,
  DEFAULT_ANNUAL_INTEREST_RATE,
  convertLocalToUSD,
  convertUSDToLocal,
  parseTerm,
  getRepaymentFrequencyDays,
  getInstallmentLabel,
  calculateLoanTerms,
  calculatePaymentProgress,
  getRemainingPayments,
  calculateLoanDetails,
  getUSDToLocalRate,
  type Credit,
} from './credit-calculations';

// ---------------------------------------------------------------------------
// convertLocalToUSD / convertUSDToLocal
// ---------------------------------------------------------------------------
describe('convertLocalToUSD', () => {
  it('converts NGN to USD at NGN_TO_USD_RATE (0.00067)', () => {
    // 300,000 NGN * 0.00067 = 201.00
    expect(convertLocalToUSD(300000)).toBe(201);
  });

  it('rounds to 2 decimal places', () => {
    // 123456 * 0.00067 = 82.71552 → 82.72
    expect(convertLocalToUSD(123456)).toBe(82.72);
  });

  it('returns 0 for 0 input', () => {
    expect(convertLocalToUSD(0)).toBe(0);
  });

  it('handles small amounts', () => {
    // 100 * 0.00067 = 0.067 → 0.07
    expect(convertLocalToUSD(100)).toBe(0.07);
  });
});

describe('convertUSDToLocal', () => {
  it('converts USD back to NGN (integer result)', () => {
    // 201 / 0.00067 = 300,000
    expect(convertUSDToLocal(201)).toBe(300000);
  });

  it('rounds to nearest integer', () => {
    // 1 / 0.00067 ≈ 1492.537… → Math.round → 1493
    expect(convertUSDToLocal(1)).toBe(1493);
  });

  it('returns 0 for 0 input', () => {
    expect(convertUSDToLocal(0)).toBe(0);
  });
});

describe('round-trip conversion', () => {
  it('NGN → USD → NGN is close to original', () => {
    const original = 300000;
    const usd = convertLocalToUSD(original);
    const backToNgn = convertUSDToLocal(usd);
    // Allow small rounding variance (< 1 NGN)
    expect(Math.abs(backToNgn - original)).toBeLessThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// parseTerm
// ---------------------------------------------------------------------------
describe('parseTerm', () => {
  it('"3 months" → 90 days', () => {
    expect(parseTerm('3 months')).toBe(90);
  });

  it('"4 weeks" → 28 days', () => {
    expect(parseTerm('4 weeks')).toBe(28);
  });

  it('"6 months" → 180 days', () => {
    expect(parseTerm('6 months')).toBe(180);
  });

  it('"1 year" → 365 days', () => {
    expect(parseTerm('1 year')).toBe(365);
  });

  it('"14 days" → 14', () => {
    expect(parseTerm('14 days')).toBe(14);
  });

  it('"1 month" → 30 (singular)', () => {
    expect(parseTerm('1 month')).toBe(30);
  });

  it('"2 weeks" → 14', () => {
    expect(parseTerm('2 weeks')).toBe(14);
  });

  it('"1 week" → 7 (singular)', () => {
    expect(parseTerm('1 week')).toBe(7);
  });
});

// ---------------------------------------------------------------------------
// getRepaymentFrequencyDays
// ---------------------------------------------------------------------------
describe('getRepaymentFrequencyDays', () => {
  it('Daily → 1', () => {
    expect(getRepaymentFrequencyDays('Daily')).toBe(1);
  });

  it('Weekly → 7', () => {
    expect(getRepaymentFrequencyDays('Weekly')).toBe(7);
  });

  it('Biweekly → 14', () => {
    expect(getRepaymentFrequencyDays('Biweekly')).toBe(14);
  });

  it('Monthly → 30', () => {
    expect(getRepaymentFrequencyDays('Monthly')).toBe(30);
  });
});

// ---------------------------------------------------------------------------
// getInstallmentLabel
// ---------------------------------------------------------------------------
describe('getInstallmentLabel', () => {
  it('Monthly noun → "monthly installment"', () => {
    expect(getInstallmentLabel('Monthly', 'noun')).toBe('monthly installment');
  });

  it('Weekly adjective → "weekly"', () => {
    expect(getInstallmentLabel('Weekly', 'adjective')).toBe('weekly');
  });

  it('undefined frequency → fallback noun/adjective', () => {
    expect(getInstallmentLabel(undefined, 'noun')).toBe('installment');
    expect(getInstallmentLabel(undefined, 'adjective')).toBe('regular');
  });

  it('Daily noun → "daily installment"', () => {
    expect(getInstallmentLabel('Daily', 'noun')).toBe('daily installment');
  });

  it('Biweekly adjective → "biweekly"', () => {
    expect(getInstallmentLabel('Biweekly', 'adjective')).toBe('biweekly');
  });
});

// ---------------------------------------------------------------------------
// calculateLoanTerms
// ---------------------------------------------------------------------------
describe('calculateLoanTerms', () => {
  it('N300K at 25% APR for 90 days Monthly', () => {
    const result = calculateLoanTerms(300000, 25.0, 90, 'Monthly');

    // Manual: dailyRate = 25/100/365 ≈ 0.00006849315
    // interest = round(300000 * dailyRate * 90) = round(18493.150…) = 18493
    const expectedInterest = Math.round(300000 * (25 / 100 / 365) * 90);
    const expectedTotal = 300000 + expectedInterest;

    expect(result.totalInterest).toBe(expectedInterest);
    expect(result.totalToRepay).toBe(expectedTotal);
    expect(result.numberOfInstallments).toBe(3); // 90 / 30
    expect(result.installmentAmount).toBe(Math.floor(expectedTotal / 3));

    // Validate installments add up to total
    const summedTotal =
      result.installmentAmount * (result.numberOfInstallments - 1) +
      (result.finalInstallmentAmount ?? result.installmentAmount);
    expect(Math.abs(summedTotal - result.totalToRepay)).toBeLessThan(1);
  });

  it('N100K at 25% APR for 28 days Daily', () => {
    const result = calculateLoanTerms(100000, 25.0, 28, 'Daily');

    const expectedInterest = Math.round(100000 * (25 / 100 / 365) * 28);
    expect(result.totalInterest).toBe(expectedInterest);
    expect(result.numberOfInstallments).toBe(28); // 28 / 1

    // Installments add up
    const summedTotal =
      result.installmentAmount * (result.numberOfInstallments - 1) +
      (result.finalInstallmentAmount ?? result.installmentAmount);
    expect(Math.abs(summedTotal - result.totalToRepay)).toBeLessThan(1);
  });

  it('N500K at 25% APR for 180 days Biweekly', () => {
    const result = calculateLoanTerms(500000, 25.0, 180, 'Biweekly');

    const expectedInterest = Math.round(500000 * (25 / 100 / 365) * 180);
    expect(result.totalInterest).toBe(expectedInterest);
    expect(result.numberOfInstallments).toBe(Math.ceil(180 / 14)); // 13

    const summedTotal =
      result.installmentAmount * (result.numberOfInstallments - 1) +
      (result.finalInstallmentAmount ?? result.installmentAmount);
    expect(Math.abs(summedTotal - result.totalToRepay)).toBeLessThan(1);
  });

  it('total = principal + interest', () => {
    const result = calculateLoanTerms(400000, 25.0, 120, 'Weekly');
    expect(result.totalToRepay).toBe(400000 + result.totalInterest);
  });
});

// ---------------------------------------------------------------------------
// calculatePaymentProgress
// ---------------------------------------------------------------------------
describe('calculatePaymentProgress', () => {
  const makeCredit = (overrides: Partial<Credit>): Credit =>
    ({
      totalAmount: 300000,
      totalToRepay: 318493,
      totalPaid: 0,
      ...overrides,
    } as Credit);

  it('0% when nothing paid', () => {
    const credit = makeCredit({ totalPaid: 0 });
    expect(calculatePaymentProgress(credit)).toBe(0);
  });

  it('partial progress', () => {
    const totalToRepay = 318493;
    const paid = 159246; // roughly half
    const credit = makeCredit({ totalToRepay, totalPaid: paid });
    const progress = calculatePaymentProgress(credit);
    expect(progress).toBeGreaterThan(0);
    expect(progress).toBeLessThan(100);
    // Approximately 50%
    expect(Math.abs(progress - 50)).toBeLessThan(1);
  });

  it('100% when fully paid', () => {
    const credit = makeCredit({ totalToRepay: 318493, totalPaid: 318493 });
    expect(calculatePaymentProgress(credit)).toBe(100);
  });

  it('caps at 100% even if overpaid', () => {
    const credit = makeCredit({ totalToRepay: 318493, totalPaid: 400000 });
    expect(calculatePaymentProgress(credit)).toBe(100);
  });

  it('returns 0 when totalToRepay is 0', () => {
    const credit = makeCredit({ totalToRepay: 0, totalAmount: 0 });
    expect(calculatePaymentProgress(credit)).toBe(0);
  });

  it('falls back to totalAmount when totalToRepay missing', () => {
    const credit = makeCredit({ totalToRepay: 0, totalAmount: 100000, totalPaid: 50000 });
    expect(calculatePaymentProgress(credit)).toBe(50);
  });
});

// ---------------------------------------------------------------------------
// getRemainingPayments
// ---------------------------------------------------------------------------
describe('getRemainingPayments', () => {
  const makeCredit = (overrides: Partial<Credit>): Credit =>
    ({
      status: 'active',
      numberOfInstallments: 3,
      installmentAmount: 106164,
      totalPaid: 0,
      monthlyPayment: 0,
      totalAmount: 300000,
      interestRate: 25,
      ...overrides,
    } as Credit);

  it('returns full count when nothing paid', () => {
    const credit = makeCredit({});
    expect(getRemainingPayments(credit)).toBe(3);
  });

  it('reduces by 1 after 1 installment paid', () => {
    const credit = makeCredit({ totalPaid: 106164 });
    expect(getRemainingPayments(credit)).toBe(2);
  });

  it('returns 0 when all installments paid', () => {
    const credit = makeCredit({ totalPaid: 106164 * 3 });
    expect(getRemainingPayments(credit)).toBe(0);
  });

  it('returns 0 for non-active credit', () => {
    const credit = makeCredit({ status: 'completed' });
    expect(getRemainingPayments(credit)).toBe(0);
  });

  it('returns 0 for pending credit', () => {
    const credit = makeCredit({ status: 'pending' });
    expect(getRemainingPayments(credit)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// calculateLoanDetails (convenience wrapper)
// ---------------------------------------------------------------------------
describe('calculateLoanDetails', () => {
  it('returns object with all loan fields', () => {
    const details = calculateLoanDetails(300000, '3 months', 25.0, 'Monthly');
    expect(details.totalAmount).toBe(300000);
    expect(details.termDays).toBe(90);
    expect(details.repaymentFrequency).toBe('Monthly');
    expect(details.interestRate).toBe(25.0);
    expect(details.totalToRepay).toBe(details.totalAmount + details.totalInterest);
    expect(details.numberOfInstallments).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// getUSDToLocalRate
// ---------------------------------------------------------------------------
describe('getUSDToLocalRate', () => {
  it('returns inverse of NGN_TO_USD_RATE', () => {
    expect(getUSDToLocalRate()).toBeCloseTo(1 / NGN_TO_USD_RATE, 2);
  });
});

// ---------------------------------------------------------------------------
// Exported constants
// ---------------------------------------------------------------------------
describe('exported constants', () => {
  it('NGN_TO_USD_RATE = 0.00067', () => {
    expect(NGN_TO_USD_RATE).toBe(0.00067);
  });

  it('DEFAULT_ANNUAL_INTEREST_RATE = 25.0', () => {
    expect(DEFAULT_ANNUAL_INTEREST_RATE).toBe(25.0);
  });
});
