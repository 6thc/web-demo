import { addPledgerActivity } from './pledger-activity';
import { unlockFunds, seizeFunds, topUpWallet, resetWallet, initializeFreshWallet, initializeActiveWallet } from './wallet';
import { BORROWER_NAME, GRACE_PERIOD_DAYS, PENALTY_ANNUAL_INTEREST_RATE, TOPOS_PLATFORM_FEE_RATE } from './demo-config';
import {
  type Credit,
  type PaymentRecord,
  NGN_TO_USD_RATE,
  DEFAULT_ANNUAL_INTEREST_RATE,
  convertLocalToUSD,
  convertUSDToLocal,
  parseTerm,
  getRepaymentFrequencyDays,
  getInstallmentLabel,
  calculateLoanTerms,
  formatCurrency,
  calculatePaymentProgress,
  getRemainingPayments,
  calculateLoanDetails,
  verifyLoanCalculations,
  getUSDToLocalRate,
} from './credit-calculations';

// Re-export everything from credit-calculations so existing imports don't break
export {
  type Credit,
  type PaymentRecord,
  NGN_TO_USD_RATE,
  DEFAULT_ANNUAL_INTEREST_RATE,
  convertLocalToUSD,
  convertUSDToLocal,
  parseTerm,
  getRepaymentFrequencyDays,
  getInstallmentLabel,
  calculateLoanTerms,
  formatCurrency,
  calculatePaymentProgress,
  getRemainingPayments,
  calculateLoanDetails,
  verifyLoanCalculations,
  getUSDToLocalRate,
} from './credit-calculations';

// Empty arrays - all data will be generated dynamically
const pendingCredits: Credit[] = [];
export const credits: Credit[] = [];

export const getCreditById = (id: string, userState: 'fresh' | 'active' = 'active'): Credit | undefined => {
  const allCredits = getCreditsForUserState(userState);
  return allCredits.find(credit => credit.id === id);
};

export const getPaymentsByCredituId = (creditId: string, userState: 'fresh' | 'active' = 'active'): PaymentRecord[] => {
  const credit = getCreditById(creditId, userState);
  return credit?.paymentHistory || [];
};

export const getCreditsByStatus = (status: string): Credit[] => {
  return credits.filter(credit => credit.status === status);
};

// State management for credits (including pending ones)
let freshCreditsState: Credit[] = []; // Fresh user credits
let activeCreditsState: Credit[] = []; // Active user credits
let nextCreditId = 1; // Starting from CR001

export const getCreditsForUserState = (userState: 'fresh' | 'active'): Credit[] => {
  return userState === 'fresh' ? freshCreditsState : activeCreditsState;
};

// Module-private setter for the dual-state array
const setCreditsState = (userState: 'fresh' | 'active', value: Credit[] | ((prev: Credit[]) => Credit[])): void => {
  const resolved = typeof value === 'function'
    ? value(userState === 'fresh' ? freshCreditsState : activeCreditsState)
    : value;
  if (userState === 'fresh') {
    freshCreditsState = resolved;
  } else {
    activeCreditsState = resolved;
  }
};

export const addPendingRequest = (requestData: {
  pledgerName: string;
  pledgerEmail: string;
  pledgerCountry: string;
  amount: number; // Amount in NGN
  term: string;
  submittedDate: string;
  purpose?: string;
  expectedInterestRate?: number;
  repaymentFrequency?: 'Daily' | 'Weekly' | 'Biweekly' | 'Monthly';
}, userState: 'fresh' | 'active' = 'fresh'): Credit => {
  const creditId = `CR${String(nextCreditId++).padStart(3, '0')}`;
  const loanId = `LOAN${String(nextCreditId - 1).padStart(3, '0')}`;
  const amountUSD = convertLocalToUSD(requestData.amount);
  const interestRate = requestData.expectedInterestRate || DEFAULT_ANNUAL_INTEREST_RATE;
  const termDays = parseTerm(requestData.term);
  const repaymentFrequency = requestData.repaymentFrequency || 'Monthly';

  // Calculate loan terms
  const loanTerms = calculateLoanTerms(
    requestData.amount,
    interestRate,
    termDays,
    repaymentFrequency
  );

  const newCredit: Credit = {
    id: creditId,
    loanId: loanId,
    pledgerName: requestData.pledgerName,
    pledgerEmail: requestData.pledgerEmail,
    pledgerCountry: requestData.pledgerCountry,
    totalAmount: requestData.amount,
    totalAmountUSD: amountUSD,
    totalInterest: loanTerms.totalInterest,
    totalInterestUSD: convertLocalToUSD(loanTerms.totalInterest),
    totalToRepay: loanTerms.totalToRepay,
    totalToRepayUSD: convertLocalToUSD(loanTerms.totalToRepay),
    remaining: loanTerms.totalToRepay, // Initially, the full amount to repay is remaining
    remainingUSD: convertLocalToUSD(loanTerms.totalToRepay),
    interestRate: interestRate,
    term: requestData.term,
    termDays: termDays,
    repaymentFrequency: repaymentFrequency,
    installmentAmount: loanTerms.installmentAmount,
    installmentAmountUSD: convertLocalToUSD(loanTerms.installmentAmount),
    numberOfInstallments: loanTerms.numberOfInstallments,
    finalInstallmentAmount: loanTerms.finalInstallmentAmount,
    finalInstallmentAmountUSD: loanTerms.finalInstallmentAmount ? convertLocalToUSD(loanTerms.finalInstallmentAmount) : undefined,
    nextPayment: '',
    startDate: '',
    endDate: '',
    status: 'pending',
    submittedDate: requestData.submittedDate,
    disbursedAmount: 0,
    disbursedAmountUSD: 0,
    totalPaid: 0,
    totalPaidUSD: 0,
    purpose: requestData.purpose,
    riskLevel: 'low',
    creditScore: 750,
    paymentHistory: [],
    // Legacy fields for backward compatibility
    termMonths: Math.ceil(termDays / 30),
    monthlyPayment: loanTerms.installmentAmount, // For backward compatibility
    monthlyPaymentUSD: convertLocalToUSD(loanTerms.installmentAmount)
  };

  // Debug log for loan creation
  console.log(`Created loan ${creditId}:`, {
    amount: `N${requestData.amount.toLocaleString()}`,
    interestRate: `${interestRate}% APR`,
    term: `${requestData.term} (${termDays} days)`,
    totalInterest: `N${loanTerms.totalInterest.toLocaleString()}`,
    totalToRepay: `N${loanTerms.totalToRepay.toLocaleString()}`,
    installmentAmount: `N${loanTerms.installmentAmount.toLocaleString()}`,
    numberOfInstallments: loanTerms.numberOfInstallments
  });

  setCreditsState(userState, prev => [...prev, newCredit]);

  return newCredit;
};

export const approvePendingRequest = (creditId: string, userState: 'fresh' | 'active' = 'active'): Credit | null => {
  const creditsState = getCreditsForUserState(userState);
  const creditIndex = creditsState.findIndex(credit => credit.id === creditId);
  if (creditIndex === -1) return null;

  const credit = creditsState[creditIndex];
  if (credit.status !== 'pending' && credit.status !== 'reviewing') return null;

  // Calculate dates
  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + credit.termDays);

  // Calculate next payment date based on repayment frequency
  const nextPaymentDate = new Date(startDate);
  const frequencyDays = getRepaymentFrequencyDays(credit.repaymentFrequency);
  nextPaymentDate.setDate(nextPaymentDate.getDate() + frequencyDays);

  // Update credit
  const updatedCredit = {
    ...credit,
    status: 'active' as const,
    approvedDate: startDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
    startDate: startDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
    endDate: endDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
    nextPayment: nextPaymentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
    // Update legacy fields for backward compatibility
    monthlyPayment: credit.installmentAmount,
    monthlyPaymentUSD: credit.installmentAmountUSD
  };

  setCreditsState(userState, prev => {
    const copy = [...prev];
    copy[creditIndex] = updatedCredit;
    return copy;
  });

  return updatedCredit;
};

export const declinePendingRequest = (creditId: string, userState: 'fresh' | 'active' = 'fresh'): Credit | null => {
  const creditsState = getCreditsForUserState(userState);
  const creditIndex = creditsState.findIndex(credit => credit.id === creditId);
  if (creditIndex === -1) return null;

  const credit = creditsState[creditIndex];
  if (credit.status !== 'pending' && credit.status !== 'reviewing') return null;

  const updatedCredit = {
    ...credit,
    status: 'cancelled' as const
  };

  setCreditsState(userState, prev => {
    const copy = [...prev];
    copy[creditIndex] = updatedCredit;
    return copy;
  });

  // Add pledger activity for the decline
  try {
    addPledgerActivity({
      type: 'pledge_declined',
      title: 'Pledge Declined',
      description: `Loan request declined - ${credit.purpose || 'loan application'}`,
      amount: credit.totalAmountUSD,
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      status: 'completed',
      borrowerName: BORROWER_NAME,
      creditId: creditId
    }, userState);
  } catch (error) {
    console.warn('Failed to create pledger activity for decline:', error);
  }

  return updatedCredit;
};

export const approveAllPendingRequests = (userState: 'fresh' | 'active' = 'active'): Credit[] => {
  const approvedCredits: Credit[] = [];
  const pendingCredits = getCreditsForUserState(userState).filter(credit =>
    credit.status === 'pending' || credit.status === 'reviewing'
  );

  pendingCredits.forEach(credit => {
    const approved = approvePendingRequest(credit.id, userState);
    if (approved) {
      approvedCredits.push(approved);
    }
  });

  return approvedCredits;
};

export const declineAllPendingRequests = (userState: 'fresh' | 'active' = 'fresh'): Credit[] => {
  const declinedCredits: Credit[] = [];
  const pendingCredits = getCreditsForUserState(userState).filter(credit =>
    credit.status === 'pending' || credit.status === 'reviewing'
  );

  pendingCredits.forEach(credit => {
    const declined = declinePendingRequest(credit.id, userState);
    if (declined) {
      declinedCredits.push(declined);
    }
  });

  return declinedCredits;
};

export const resetToFreshUser = (): void => {
  freshCreditsState = [];
  nextCreditId = 1;
  initializeFreshWallet();
};

export const resetToActiveUser = (): void => {
  activeCreditsState = [...credits];
  nextCreditId = 6;
  initializeActiveWallet();
};

export const getTotalCreditBalance = (userState: 'fresh' | 'active'): number => {
  const activeCredits = getCreditsForUserState(userState).filter(credit => credit.status === 'active');
  return activeCredits.reduce((total, credit) => total + credit.remaining, 0);
};

export const lockFunds = (creditId: string, amountUSD: number, userState: 'fresh' | 'active' = 'active'): { success: boolean; error?: string } => {
  const creditsState = getCreditsForUserState(userState);
  const creditIndex = creditsState.findIndex(credit => credit.id === creditId);

  if (creditIndex === -1) {
    return { success: false, error: 'Credit not found' };
  }

  const credit = creditsState[creditIndex];
  if (credit.status !== 'pending' && credit.status !== 'reviewing') {
    return { success: false, error: 'Credit is not in pending status' };
  }

  try {
    addPledgerActivity({
      type: 'funds_locked',
      title: 'Funds Locked',
      description: `Collateral locked for loan request - ${credit.purpose || 'loan'}`,
      amount: amountUSD,
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      status: 'completed',
      borrowerName: BORROWER_NAME,
      creditId: creditId
    }, userState);

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to lock funds' };
  }
};

// Private helper that contains the shared payment processing logic used by
// both addLoanRepayment (populate flow) and processCreditPayment (UI flow).
const _applyPayment = (
  creditId: string,
  amount: number,
  transactionId: string,
  paymentType: string,
  userState: 'fresh' | 'active',
  options?: {
    customDate?: Date;
    extraCreditFields?: Record<string, unknown>;
    onCompletion?: (credit: Credit, creditId: string, userState: 'fresh' | 'active') => void;
  }
): { success: boolean; error?: string; paymentRecord?: PaymentRecord; updatedCredit?: Credit } => {
  const creditsState = getCreditsForUserState(userState);
  const creditIndex = creditsState.findIndex(credit => credit.id === creditId);

  if (creditIndex === -1) {
    return { success: false, error: 'Credit not found' };
  }

  const credit = creditsState[creditIndex];
  if (credit.status !== 'active' && credit.status !== 'overdue') {
    return { success: false, error: 'Credit is not active' };
  }

  // Interest/principal split calculation
  const amountUSD = convertLocalToUSD(amount);
  const totalInterestProportion = credit.totalInterest ? credit.totalInterest / credit.totalToRepay : 0;
  const interestAmount = Math.round(amount * totalInterestProportion);
  const principalAmount = amount - interestAmount;
  const principalAmountUSD = convertLocalToUSD(principalAmount);
  const interestAmountUSD = convertLocalToUSD(interestAmount);

  const paymentDate = options?.customDate || new Date();

  // Create payment record
  const paymentRecord: PaymentRecord = {
    id: `PAY${String(credit.paymentHistory.length + 1).padStart(3, '0')}`,
    creditId: creditId,
    transactionId: transactionId,
    amount: amount,
    amountUSD: amountUSD,
    date: paymentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
    time: paymentDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
    status: 'completed',
    type: paymentType as PaymentRecord['type'],
    principalAmount: principalAmount,
    principalAmountUSD: principalAmountUSD,
    interestAmount: interestAmount,
    interestAmountUSD: interestAmountUSD,
    reference: `LOAN${paymentDate.getFullYear()}${String(paymentDate.getMonth() + 1).padStart(2, '0')}${String(credit.paymentHistory.length + 1).padStart(3, '0')}`
  };

  // Update credit remaining and totalPaid
  const newRemaining = Math.max(0, credit.remaining - amount);
  const newRemainingUSD = convertLocalToUSD(newRemaining);
  const newTotalPaid = (credit.totalPaid || 0) + amount;
  const newTotalPaidUSD = convertLocalToUSD(newTotalPaid);
  const isFullyPaid = newRemaining <= 0;

  const updatedCredit: Credit = {
    ...credit,
    remaining: newRemaining,
    remainingUSD: newRemainingUSD,
    totalPaid: newTotalPaid,
    totalPaidUSD: newTotalPaidUSD,
    paymentHistory: [...credit.paymentHistory, paymentRecord],
    status: isFullyPaid ? 'completed' : credit.status,
    ...(options?.extraCreditFields || {}),
  } as Credit;

  // Persist to the correct state array
  creditsState[creditIndex] = updatedCredit;

  // If credit was overdue and payment received (but not fully paid), resolve grace period
  if (credit.status === 'overdue' && !isFullyPaid) {
    resolveGracePeriod(creditId, userState);
  }

  // If loan is fully paid, release collateral
  if (isFullyPaid) {
    if (options?.onCompletion) {
      options.onCompletion(credit, creditId, userState);
    } else {
      // Default completion behaviour: unlock funds + pledger activity
      try {
        unlockFunds(creditId);
        addPledgerActivity({
          type: 'funds_unlocked',
          title: 'Funds Unlocked',
          description: 'Collateral released - loan fully repaid',
          amount: credit.totalAmountUSD,
          date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
          time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
          status: 'completed',
          borrowerName: BORROWER_NAME,
          creditId: creditId
        }, userState);
      } catch (error) {
        console.warn('Failed to unlock funds or create activity:', error);
      }
    }
  }

  return { success: true, paymentRecord, updatedCredit };
};

export const addLoanRepayment = (
  creditId: string,
  amount: number,
  transactionId: string,
  paymentType: 'regular' | 'full' | 'partial' = 'regular',
  userState: 'fresh' | 'active' = 'active',
  customDate?: Date
): { success: boolean; error?: string; paymentRecord?: PaymentRecord } => {
  const paymentDate = customDate || new Date();
  const isFullPayment = ((): boolean => {
    const credit = getCreditsForUserState(userState).find(c => c.id === creditId);
    return credit ? amount >= credit.remaining : false;
  })();

  const result = _applyPayment(creditId, amount, transactionId, paymentType, userState, {
    customDate,
    extraCreditFields: isFullPayment
      ? { completedDate: paymentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) }
      : {},
  });

  return { success: result.success, error: result.error, paymentRecord: result.paymentRecord };
};

// Additional utility functions needed by components
export const hasActiveLoans = (userState: 'fresh' | 'active' = 'active'): boolean => {
  const credits = getCreditsForUserState(userState);
  return credits.some(credit => credit.status === 'active');
};

export const getPendingCreditsForUserState = (userState: 'fresh' | 'active' = 'active'): Credit[] => {
  const credits = getCreditsForUserState(userState);
  return credits.filter(credit => credit.status === 'pending' || credit.status === 'reviewing');
};

// Pledger-specific functions
export const pledgerApproveLoan = (creditId: string, userState: 'fresh' | 'active' = 'active'): { success: boolean; error?: string; credit?: Credit } => {
  const result = approvePendingRequest(creditId, userState);
  if (result) {
    return { success: true, credit: result };
  } else {
    return { success: false, error: 'Failed to approve loan' };
  }
};

export const pledgerDeclineLoan = (creditId: string, userState: 'fresh' | 'active' = 'active'): { success: boolean; error?: string; credit?: Credit } => {
  const result = declinePendingRequest(creditId, userState);
  if (result) {
    return { success: true, credit: result };
  } else {
    return { success: false, error: 'Failed to decline loan' };
  }
};

// Process credit payment - updates credit after payment transaction is created
export const processCreditPayment = (
  creditId: string,
  amount: number,
  paymentType: 'regular' | 'full' | 'custom',
  transactionId: string,
  userState: 'fresh' | 'active' = 'active'
): { success: boolean; error?: string; updatedCredit?: Credit } => {
  const result = _applyPayment(creditId, amount, transactionId, paymentType, userState, {
    extraCreditFields: { lastPaymentDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) },
    onCompletion: (credit, cId, uState) => {
      try {
        const unlockResult = unlockFunds(cId);
        if (unlockResult.success) {
          console.log(`Collateral released for loan ${cId}`);
          addPledgerActivity({
            type: 'collateral_released',
            title: 'Collateral Released',
            description: `Collateral released - loan fully repaid by ${credit.pledgerName.split(' ')[1] || 'borrower'}`,
            amount: credit.totalAmountUSD,
            date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
            time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
            status: 'completed',
            borrowerName: BORROWER_NAME,
            creditId: cId
          }, uState);
        } else {
          console.warn(`Failed to release collateral for loan ${cId}: ${unlockResult.error}`);
        }
      } catch (error) {
        console.error(`Error releasing collateral for loan ${cId}:`, error);
      }
    },
  });

  return { success: result.success, error: result.error, updatedCredit: result.updatedCredit };
};

// --- Grace period & default flow ---

export const detectOverdue = (creditId: string, userState: 'fresh' | 'active' = 'active'): Credit | null => {
  const creditsState = getCreditsForUserState(userState);
  const creditIndex = creditsState.findIndex(c => c.id === creditId);
  if (creditIndex === -1) return null;

  const credit = creditsState[creditIndex];
  if (credit.status !== 'active') return null;

  const now = new Date();
  const overdueDate = now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const graceDeadlineDate = new Date(now);
  graceDeadlineDate.setDate(graceDeadlineDate.getDate() + GRACE_PERIOD_DAYS);
  const graceDeadline = graceDeadlineDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const updatedCredit: Credit = {
    ...credit,
    status: 'overdue',
    overdueDate,
    gracePeriodDays: GRACE_PERIOD_DAYS,
    graceDeadline,
    penaltyRate: PENALTY_ANNUAL_INTEREST_RATE,
    missedInstallments: 1,
    penaltyInterest: credit.penaltyInterest || 0,
    penaltyInterestUSD: credit.penaltyInterestUSD || 0,
  };

  creditsState[creditIndex] = updatedCredit;

  // Log grace warning activity
  try {
    addPledgerActivity({
      type: 'grace_warning',
      title: 'Payment Overdue',
      description: `Loan payment overdue — ${GRACE_PERIOD_DAYS}-day grace period started`,
      amount: credit.installmentAmountUSD,
      date: overdueDate,
      time: now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      status: 'pending',
      borrowerName: BORROWER_NAME,
      creditId,
    }, userState);
  } catch (e) {
    console.warn('Failed to create grace warning activity:', e);
  }

  return updatedCredit;
};

export const applyPenaltyInterest = (
  creditId: string,
  userState: 'fresh' | 'active' = 'active'
): { success: boolean; penaltyAmount?: number; error?: string } => {
  const creditsState = getCreditsForUserState(userState);
  const creditIndex = creditsState.findIndex(c => c.id === creditId);
  if (creditIndex === -1) return { success: false, error: 'Credit not found' };

  const credit = creditsState[creditIndex];
  if (credit.status !== 'overdue') return { success: false, error: 'Credit is not overdue' };

  // Calculate days overdue
  const overdueStart = credit.overdueDate ? new Date(credit.overdueDate) : new Date();
  const now = new Date();
  const overdueDays = Math.max(1, Math.floor((now.getTime() - overdueStart.getTime()) / (1000 * 60 * 60 * 24)));

  const penaltyRate = credit.penaltyRate || PENALTY_ANNUAL_INTEREST_RATE;
  const penaltyAmount = Math.round(credit.remaining * (penaltyRate / 100) * (overdueDays / 365));
  const penaltyAmountUSD = convertLocalToUSD(penaltyAmount);

  const newPenaltyInterest = (credit.penaltyInterest || 0) + penaltyAmount;
  const newPenaltyInterestUSD = (credit.penaltyInterestUSD || 0) + penaltyAmountUSD;

  const updatedCredit: Credit = {
    ...credit,
    penaltyInterest: newPenaltyInterest,
    penaltyInterestUSD: newPenaltyInterestUSD,
    remaining: credit.remaining + penaltyAmount,
    remainingUSD: convertLocalToUSD(credit.remaining + penaltyAmount),
    totalToRepay: credit.totalToRepay + penaltyAmount,
    totalToRepayUSD: convertLocalToUSD(credit.totalToRepay + penaltyAmount),
  };

  creditsState[creditIndex] = updatedCredit;

  return { success: true, penaltyAmount };
};

export const resolveGracePeriod = (creditId: string, userState: 'fresh' | 'active' = 'active'): Credit | null => {
  const creditsState = getCreditsForUserState(userState);
  const creditIndex = creditsState.findIndex(c => c.id === creditId);
  if (creditIndex === -1) return null;

  const credit = creditsState[creditIndex];
  if (credit.status !== 'overdue') return null;

  const updatedCredit: Credit = {
    ...credit,
    status: 'active',
    graceDeadline: undefined,
    lastPaymentDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
  };

  creditsState[creditIndex] = updatedCredit;

  return updatedCredit;
};

export const declareDefault = (
  creditId: string,
  userState: 'fresh' | 'active' = 'active'
): { success: boolean; settlement?: Credit['settlement']; error?: string } => {
  const creditsState = getCreditsForUserState(userState);
  const creditIndex = creditsState.findIndex(c => c.id === creditId);
  if (creditIndex === -1) return { success: false, error: 'Credit not found' };

  const credit = creditsState[creditIndex];
  if (credit.status !== 'overdue') return { success: false, error: 'Credit is not overdue' };

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  // Seize collateral
  const seizeResult = seizeFunds(creditId);
  if (!seizeResult.success || seizeResult.seizedAmount === undefined) {
    return { success: false, error: seizeResult.error || 'Failed to seize funds' };
  }

  const seizedAmount = seizeResult.seizedAmount;
  const outstandingDebt = credit.remaining;
  const outstandingDebtUSD = convertLocalToUSD(outstandingDebt);

  // Calculate settlement distribution
  const creditJVShare = Math.min(outstandingDebtUSD, seizedAmount);
  const toposFeeShare = Math.round(seizedAmount * TOPOS_PLATFORM_FEE_RATE * 100) / 100;
  const pledgerRemainder = Math.max(0, Math.round((seizedAmount - creditJVShare - toposFeeShare) * 100) / 100);

  const settlement: Credit['settlement'] = {
    totalSeized: seizedAmount,
    creditJVShare,
    toposFeeShare,
    pledgerRemainder,
    outstandingDebt,
    outstandingDebtUSD,
    settledDate: dateStr,
  };

  const updatedCredit: Credit = {
    ...credit,
    status: 'defaulted',
    defaultDate: dateStr,
    settlement,
  };

  creditsState[creditIndex] = updatedCredit;

  // Return remainder to pledger if any
  if (pledgerRemainder > 0) {
    topUpWallet(pledgerRemainder);
  }

  // Log pledger activities
  try {
    addPledgerActivity({
      type: 'collateral_seized',
      title: 'Collateral Seized',
      description: `Collateral seized due to loan default — $${seizedAmount.toFixed(2)} seized`,
      amount: seizedAmount,
      date: dateStr,
      time: timeStr,
      status: 'completed',
      borrowerName: BORROWER_NAME,
      creditId,
    }, userState);

    addPledgerActivity({
      type: 'settlement_completed',
      title: 'Settlement Completed',
      description: pledgerRemainder > 0
        ? `Default settlement completed — $${pledgerRemainder.toFixed(2)} returned to wallet`
        : 'Default settlement completed — no remainder to return',
      amount: pledgerRemainder,
      date: dateStr,
      time: timeStr,
      status: 'completed',
      borrowerName: BORROWER_NAME,
      creditId,
    }, userState);
  } catch (e) {
    console.warn('Failed to create default settlement activities:', e);
  }

  return { success: true, settlement };
};
