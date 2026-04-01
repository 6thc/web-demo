import { describe, it, expect, beforeEach } from 'vitest';
import {
  initializeFreshWallet,
  getWalletBalance,
  getAvailableBalance,
  getLockedBalance,
  getLockedFunds,
  isFundsLocked,
  topUpWallet,
  withdrawFromWallet,
  lockFunds,
  unlockFunds,
  resetWallet,
  setWalletBalance,
} from './wallet';
import { resetToFreshUser, addPendingRequest } from './credits';
import { resetPledgerActivitiesToFresh } from './pledger-activity';

beforeEach(() => {
  resetWallet();
  resetToFreshUser();
  resetPledgerActivitiesToFresh();
});

// ---------------------------------------------------------------------------
// initializeFreshWallet / getWalletBalance
// ---------------------------------------------------------------------------
describe('initializeFreshWallet', () => {
  it('sets balance to 0', () => {
    topUpWallet(500);
    initializeFreshWallet();
    expect(getWalletBalance()).toBe(0);
  });

  it('clears locked funds', () => {
    topUpWallet(1000);
    // Create a credit so we can lock against it
    const credit = addPendingRequest({
      pledgerName: 'Test',
      pledgerEmail: 'test@test.com',
      pledgerCountry: 'US',
      amount: 300000,
      term: '3 months',
      submittedDate: 'Jan 1, 2026',
    }, 'fresh');
    lockFunds(credit.id, 200, 'fresh');
    initializeFreshWallet();
    expect(getLockedBalance()).toBe(0);
    expect(getLockedFunds()).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// topUpWallet
// ---------------------------------------------------------------------------
describe('topUpWallet', () => {
  it('increases balance by the given amount', () => {
    topUpWallet(1500);
    expect(getWalletBalance()).toBe(1500);
  });

  it('accumulates multiple top-ups', () => {
    topUpWallet(500);
    topUpWallet(700);
    expect(getWalletBalance()).toBe(1200);
  });

  it('rejects 0 amount', () => {
    const result = topUpWallet(0);
    expect(result.success).toBe(false);
  });

  it('rejects negative amount', () => {
    const result = topUpWallet(-100);
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// withdrawFromWallet
// ---------------------------------------------------------------------------
describe('withdrawFromWallet', () => {
  it('decreases balance', () => {
    topUpWallet(1000);
    withdrawFromWallet(400);
    expect(getWalletBalance()).toBe(600);
  });

  it('fails if amount exceeds available balance', () => {
    topUpWallet(500);
    const result = withdrawFromWallet(600);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Insufficient');
    expect(getWalletBalance()).toBe(500); // unchanged
  });

  it('rejects 0 amount', () => {
    const result = withdrawFromWallet(0);
    expect(result.success).toBe(false);
  });

  it('rejects negative amount', () => {
    const result = withdrawFromWallet(-50);
    expect(result.success).toBe(false);
  });

  it('considers locked funds when checking availability', () => {
    topUpWallet(1000);
    const credit = addPendingRequest({
      pledgerName: 'Test',
      pledgerEmail: 'test@test.com',
      pledgerCountry: 'US',
      amount: 300000,
      term: '3 months',
      submittedDate: 'Jan 1, 2026',
    }, 'fresh');
    lockFunds(credit.id, 700, 'fresh');

    // Available = 1000 - 700 = 300
    const result = withdrawFromWallet(500);
    expect(result.success).toBe(false);
    expect(getWalletBalance()).toBe(1000); // unchanged
  });
});

// ---------------------------------------------------------------------------
// lockFunds / getAvailableBalance / getLockedBalance
// ---------------------------------------------------------------------------
describe('lockFunds', () => {
  it('available balance decreases, locked balance increases', () => {
    topUpWallet(1000);
    const credit = addPendingRequest({
      pledgerName: 'Test',
      pledgerEmail: 'test@test.com',
      pledgerCountry: 'US',
      amount: 300000,
      term: '3 months',
      submittedDate: 'Jan 1, 2026',
    }, 'fresh');

    lockFunds(credit.id, 400, 'fresh');

    expect(getAvailableBalance()).toBe(600);
    expect(getLockedBalance()).toBe(400);
    expect(getWalletBalance()).toBe(1000); // total unchanged
  });

  it('fails when locking more than available', () => {
    topUpWallet(500);
    const credit = addPendingRequest({
      pledgerName: 'Test',
      pledgerEmail: 'test@test.com',
      pledgerCountry: 'US',
      amount: 300000,
      term: '3 months',
      submittedDate: 'Jan 1, 2026',
    }, 'fresh');

    const result = lockFunds(credit.id, 600, 'fresh');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Insufficient');
  });

  it('prevents double-locking the same creditId', () => {
    topUpWallet(2000);
    const credit = addPendingRequest({
      pledgerName: 'Test',
      pledgerEmail: 'test@test.com',
      pledgerCountry: 'US',
      amount: 300000,
      term: '3 months',
      submittedDate: 'Jan 1, 2026',
    }, 'fresh');

    lockFunds(credit.id, 300, 'fresh');
    const second = lockFunds(credit.id, 300, 'fresh');
    expect(second.success).toBe(false);
    expect(second.error).toContain('already locked');
  });

  it('rejects 0 amount', () => {
    const result = lockFunds('CR001', 0, 'fresh');
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// unlockFunds
// ---------------------------------------------------------------------------
describe('unlockFunds', () => {
  it('available balance increases, locked balance decreases', () => {
    topUpWallet(1000);
    const credit = addPendingRequest({
      pledgerName: 'Test',
      pledgerEmail: 'test@test.com',
      pledgerCountry: 'US',
      amount: 300000,
      term: '3 months',
      submittedDate: 'Jan 1, 2026',
    }, 'fresh');

    lockFunds(credit.id, 400, 'fresh');
    expect(getAvailableBalance()).toBe(600);

    unlockFunds(credit.id);
    expect(getAvailableBalance()).toBe(1000);
    expect(getLockedBalance()).toBe(0);
  });

  it('fails for unknown creditId', () => {
    const result = unlockFunds('NONEXISTENT');
    expect(result.success).toBe(false);
    expect(result.error).toContain('No locked funds');
  });
});

// ---------------------------------------------------------------------------
// isFundsLocked
// ---------------------------------------------------------------------------
describe('isFundsLocked', () => {
  it('returns true when funds locked for a credit', () => {
    topUpWallet(1000);
    const credit = addPendingRequest({
      pledgerName: 'Test',
      pledgerEmail: 'test@test.com',
      pledgerCountry: 'US',
      amount: 300000,
      term: '3 months',
      submittedDate: 'Jan 1, 2026',
    }, 'fresh');
    lockFunds(credit.id, 200, 'fresh');
    expect(isFundsLocked(credit.id)).toBe(true);
  });

  it('returns false when no funds locked', () => {
    expect(isFundsLocked('CR999')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getAvailableBalance edge cases
// ---------------------------------------------------------------------------
describe('getAvailableBalance', () => {
  it('equals total balance when nothing locked', () => {
    topUpWallet(1500);
    expect(getAvailableBalance()).toBe(getWalletBalance());
  });

  it('never goes below 0', () => {
    // Edge case: empty wallet
    expect(getAvailableBalance()).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// setWalletBalance
// ---------------------------------------------------------------------------
describe('setWalletBalance', () => {
  it('sets balance to given value', () => {
    setWalletBalance(999);
    expect(getWalletBalance()).toBe(999);
  });

  it('clamps negative values to 0', () => {
    setWalletBalance(-100);
    expect(getWalletBalance()).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// resetWallet
// ---------------------------------------------------------------------------
describe('resetWallet', () => {
  it('zeroes balance and clears all locks', () => {
    topUpWallet(5000);
    const credit = addPendingRequest({
      pledgerName: 'Test',
      pledgerEmail: 'test@test.com',
      pledgerCountry: 'US',
      amount: 300000,
      term: '3 months',
      submittedDate: 'Jan 1, 2026',
    }, 'fresh');
    lockFunds(credit.id, 500, 'fresh');

    resetWallet();
    expect(getWalletBalance()).toBe(0);
    expect(getLockedBalance()).toBe(0);
    expect(getLockedFunds()).toEqual([]);
  });
});
