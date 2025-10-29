// Pledger wallet balance management
import { addPledgerActivity } from './pledger-activity';
import { getCreditsForUserState } from './credits';

interface LockedFund {
  creditId: string;
  amount: number;
  lockedAt: string;
}

interface WalletState {
  balance: number;
  lockedFunds: LockedFund[];
}

// In-memory wallet state
let walletState: WalletState = {
  balance: 0,
  lockedFunds: []
};

export function getWalletBalance(): number {
  return walletState.balance;
}

export function getAvailableBalance(): number {
  const totalLocked = walletState.lockedFunds.reduce((sum, locked) => sum + locked.amount, 0);
  return Math.max(0, walletState.balance - totalLocked);
}

export function getLockedBalance(): number {
  return walletState.lockedFunds.reduce((sum, locked) => sum + locked.amount, 0);
}

export function getLockedFunds(): LockedFund[] {
  return [...walletState.lockedFunds];
}

export function isFundsLocked(creditId: string): boolean {
  return walletState.lockedFunds.some(lock => lock.creditId === creditId);
}

export function topUpWallet(amount: number): { success: boolean; error?: string } {
  if (amount <= 0) {
    return { success: false, error: "Amount must be greater than 0" };
  }

  walletState.balance += amount;
  return { success: true };
}

export function withdrawFromWallet(amount: number): { success: boolean; error?: string } {
  if (amount <= 0) {
    return { success: false, error: "Amount must be greater than 0" };
  }

  const availableBalance = getAvailableBalance();
  if (amount > availableBalance) {
    return { success: false, error: "Insufficient available balance" };
  }

  walletState.balance -= amount;
  return { success: true };
}

export function lockFunds(creditId: string, amount: number, userState: 'fresh' | 'active' = 'active'): { success: boolean; error?: string } {
  if (amount <= 0) {
    return { success: false, error: "Amount must be greater than 0" };
  }

  const availableBalance = getAvailableBalance();
  if (amount > availableBalance) {
    return { success: false, error: "Insufficient available balance" };
  }

  // Check if funds are already locked for this credit
  const existingLock = walletState.lockedFunds.find(lock => lock.creditId === creditId);
  if (existingLock) {
    return { success: false, error: "Funds already locked for this credit" };
  }

  walletState.lockedFunds.push({
    creditId,
    amount,
    lockedAt: new Date().toISOString()
  });

  // Get credit details to create activity
  try {
    const credits = getCreditsForUserState(userState);
    const credit = credits.find(c => c.id === creditId);
    
    // Add pledger activity for collateral locked
    addPledgerActivity({
      type: 'collateral_locked',
      title: 'Collateral Locked',
      description: `Funds locked as collateral for ${credit?.purpose || 'loan'}`,
      amount: amount,
      date: new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }),
      time: new Date().toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      }),
      status: 'completed',
      borrowerName: 'Segun Adebayo',
      creditId: creditId
    }, userState);
  } catch (e) {
    // Graceful fallback if activity creation fails
    console.warn('Failed to create collateral locked activity:', e);
  }

  return { success: true };
}

export function unlockFunds(creditId: string): { success: boolean; error?: string } {
  const lockIndex = walletState.lockedFunds.findIndex(lock => lock.creditId === creditId);
  
  if (lockIndex === -1) {
    return { success: false, error: "No locked funds found for this credit" };
  }

  walletState.lockedFunds.splice(lockIndex, 1);
  return { success: true };
}

export function resetWallet(): void {
  walletState.balance = 0;
  walletState.lockedFunds = [];
}

export function initializeActiveWallet(): void {
  walletState.balance = 0;
  walletState.lockedFunds = [];
}

export function initializeFreshWallet(): void {
  walletState.balance = 0;
  walletState.lockedFunds = [];
}

export function setWalletBalance(balance: number): void {
  walletState.balance = Math.max(0, balance);
}

export const formatUSD = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};