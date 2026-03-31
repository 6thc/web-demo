import { addPledgerActivity } from './pledger-activity';
import { unlockFunds, resetWallet, initializeFreshWallet, initializeActiveWallet } from './wallet';
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

  if (userState === 'fresh') {
    freshCreditsState = [...freshCreditsState, newCredit];
  } else {
    activeCreditsState = [...activeCreditsState, newCredit];
  }

  return newCredit;
};

export const approvePendingRequest = (creditId: string, userState: 'fresh' | 'active' = 'active'): Credit | null => {
  const creditsState = userState === 'fresh' ? freshCreditsState : activeCreditsState;
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

  if (userState === 'fresh') {
    freshCreditsState[creditIndex] = updatedCredit;
  } else {
    activeCreditsState[creditIndex] = updatedCredit;
  }

  return updatedCredit;
};

export const declinePendingRequest = (creditId: string, userState: 'fresh' | 'active' = 'fresh'): Credit | null => {
  const creditsState = userState === 'fresh' ? freshCreditsState : activeCreditsState;
  const creditIndex = creditsState.findIndex(credit => credit.id === creditId);
  if (creditIndex === -1) return null;

  const credit = creditsState[creditIndex];
  if (credit.status !== 'pending' && credit.status !== 'reviewing') return null;

  const updatedCredit = {
    ...credit,
    status: 'cancelled' as const
  };

  if (userState === 'fresh') {
    freshCreditsState[creditIndex] = updatedCredit;
  } else {
    activeCreditsState[creditIndex] = updatedCredit;
  }

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
      borrowerName: 'Segun Adebayo',
      creditId: creditId
    }, userState);
  } catch (error) {
    console.warn('Failed to create pledger activity for decline:', error);
  }

  return updatedCredit;
};

export const approveAllPendingRequests = (userState: 'fresh' | 'active' = 'active'): Credit[] => {
  const approvedCredits: Credit[] = [];
  const creditsState = userState === 'fresh' ? freshCreditsState : activeCreditsState;
  const pendingCredits = creditsState.filter(credit =>
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
  const creditsState = userState === 'fresh' ? freshCreditsState : activeCreditsState;
  const pendingCredits = creditsState.filter(credit =>
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
  const creditsState = userState === 'fresh' ? freshCreditsState : activeCreditsState;
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
      borrowerName: 'Segun Adebayo',
      creditId: creditId
    }, userState);

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to lock funds' };
  }
};

export const addLoanRepayment = (
  creditId: string,
  amount: number,
  transactionId: string,
  paymentType: 'regular' | 'full' | 'partial' = 'regular',
  userState: 'fresh' | 'active' = 'active',
  customDate?: Date
): { success: boolean; error?: string; paymentRecord?: PaymentRecord } => {
  // Get the correct credits array and work with it directly
  const creditsState = userState === 'fresh' ? freshCreditsState : activeCreditsState;
  const creditIndex = creditsState.findIndex(credit => credit.id === creditId);

  if (creditIndex === -1) {
    return { success: false, error: 'Credit not found' };
  }

  const credit = creditsState[creditIndex];
  if (credit.status !== 'active') {
    return { success: false, error: 'Credit is not active' };
  }

  // For new loan structure, payments are applied directly to remaining balance
  // since totalToRepay already includes all interest calculated upfront
  const amountUSD = convertLocalToUSD(amount);

  // For payment record breakdown, we can estimate interest vs principal
  // based on the proportion of total interest to total loan amount
  const totalInterestProportion = credit.totalInterest ? credit.totalInterest / credit.totalToRepay : 0;
  const interestAmount = Math.round(amount * totalInterestProportion);
  const principalAmount = amount - interestAmount;
  const principalAmountUSD = convertLocalToUSD(principalAmount);
  const interestAmountUSD = convertLocalToUSD(interestAmount);

  // Use custom date if provided, otherwise current date
  const paymentDate = customDate || new Date();

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
    type: paymentType,
    principalAmount: principalAmount,
    principalAmountUSD: principalAmountUSD,
    interestAmount: interestAmount,
    interestAmountUSD: interestAmountUSD,
    reference: `LOAN${paymentDate.getFullYear()}${String(paymentDate.getMonth() + 1).padStart(2, '0')}${String(credit.paymentHistory.length + 1).padStart(3, '0')}`
  };

  // Update credit - with new loan structure, we reduce remaining by full payment amount
  const newRemaining = Math.max(0, credit.remaining - amount);
  const newRemainingUSD = convertLocalToUSD(newRemaining);
  const newTotalPaid = (credit.totalPaid || 0) + amount;
  const newTotalPaidUSD = convertLocalToUSD(newTotalPaid);

  const updatedCredit = {
    ...credit,
    remaining: newRemaining,
    remainingUSD: newRemainingUSD,
    totalPaid: newTotalPaid,
    totalPaidUSD: newTotalPaidUSD,
    paymentHistory: [...credit.paymentHistory, paymentRecord],
    status: newRemaining <= 0 ? 'completed' as const : credit.status,
    completedDate: newRemaining <= 0 ? paymentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : credit.completedDate
  };

  // Update the credit in the correct state array
  if (userState === 'fresh') {
    freshCreditsState[creditIndex] = updatedCredit;
  } else {
    activeCreditsState[creditIndex] = updatedCredit;
  }

  // If loan is completed, unlock collateral
  if (newRemaining <= 0) {
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
        borrowerName: 'Segun Adebayo',
        creditId: creditId
      }, userState);
    } catch (error) {
      console.warn('Failed to unlock funds or create activity:', error);
    }
  }

  return { success: true, paymentRecord };
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
  // Get the correct credits array
  const creditsState = userState === 'fresh' ? freshCreditsState : activeCreditsState;
  const creditIndex = creditsState.findIndex(credit => credit.id === creditId);

  if (creditIndex === -1) {
    return { success: false, error: 'Credit not found' };
  }

  const credit = creditsState[creditIndex];
  if (credit.status !== 'active') {
    return { success: false, error: 'Credit is not active' };
  }

  // For new loan structure, payments are applied directly to remaining balance
  const amountUSD = convertLocalToUSD(amount);

  // For payment record breakdown, estimate interest vs principal
  const totalInterestProportion = credit.totalInterest ? credit.totalInterest / credit.totalToRepay : 0;
  const interestAmount = Math.round(amount * totalInterestProportion);
  const principalAmount = amount - interestAmount;
  const principalAmountUSD = convertLocalToUSD(principalAmount);
  const interestAmountUSD = convertLocalToUSD(interestAmount);

  // Create payment record
  const paymentRecord: PaymentRecord = {
    id: `PAY${String(credit.paymentHistory.length + 1).padStart(3, '0')}`,
    creditId: creditId,
    transactionId: transactionId,
    amount: amount,
    amountUSD: amountUSD,
    date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
    time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
    status: 'completed',
    type: paymentType,
    principalAmount: principalAmount,
    principalAmountUSD: principalAmountUSD,
    interestAmount: interestAmount,
    interestAmountUSD: interestAmountUSD,
    reference: `LOAN${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(credit.paymentHistory.length + 1).padStart(3, '0')}`
  };

  // Update credit - with new loan structure, we reduce remaining by full payment amount
  const newRemaining = Math.max(0, credit.remaining - amount);
  const newRemainingUSD = convertLocalToUSD(newRemaining);
  const newTotalPaid = (credit.totalPaid || 0) + amount;
  const newTotalPaidUSD = convertLocalToUSD(newTotalPaid);

  // Determine if loan is fully paid
  const isFullyPaid = newRemaining <= 0;

  const updatedCredit: Credit = {
    ...credit,
    remaining: newRemaining,
    remainingUSD: newRemainingUSD,
    totalPaid: newTotalPaid,
    totalPaidUSD: newTotalPaidUSD,
    status: isFullyPaid ? 'completed' : 'active',
    paymentHistory: [...credit.paymentHistory, paymentRecord],
    lastPaymentDate: paymentRecord.date
  };

  // Update the credit in the array
  creditsState[creditIndex] = updatedCredit;

  // If loan is fully paid, release the collateral
  if (isFullyPaid) {
    try {
      const unlockResult = unlockFunds(creditId);
      if (unlockResult.success) {
        console.log(`Collateral released for loan ${creditId}`);

        // Add pledger activity for collateral release
        addPledgerActivity({
          type: 'collateral_released',
          title: 'Collateral Released',
          description: `Collateral released - loan fully repaid by ${credit.pledgerName.split(' ')[1] || 'borrower'}`,
          amount: credit.totalAmountUSD, // Amount that was locked (in USD)
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
      } else {
        console.warn(`Failed to release collateral for loan ${creditId}: ${unlockResult.error}`);
      }
    } catch (error) {
      console.error(`Error releasing collateral for loan ${creditId}:`, error);
    }
  }

  return { success: true, updatedCredit };
};
