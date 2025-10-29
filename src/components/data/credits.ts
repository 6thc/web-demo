import { addPledgerActivity } from './pledger-activity';
import { unlockFunds, resetWallet, initializeFreshWallet, initializeActiveWallet } from './wallet';

export interface Credit {
  id: string;
  loanId: string;
  pledgerName: string;
  pledgerEmail?: string;
  pledgerPhone?: string;
  pledgerCountry?: string;
  pledgerRelationship?: string;
  collateralType?: string;
  collateralValue?: number;
  totalAmount: number; // Principal amount in NGN (borrower's currency)
  totalAmountUSD: number; // Principal amount in USD (pledger's currency)
  totalInterest: number; // Total interest in NGN
  totalInterestUSD: number; // Total interest in USD  
  totalToRepay: number; // Principal + Interest in NGN
  totalToRepayUSD: number; // Principal + Interest in USD
  remaining: number; // Amount remaining in NGN
  remainingUSD: number; // Amount remaining in USD
  interestRate: number; // Annual interest rate
  term: string; // e.g., "4 weeks", "3 months"
  termDays: number; // Duration in days
  repaymentFrequency: 'Daily' | 'Weekly' | 'Biweekly' | 'Monthly'; // Payment schedule
  installmentAmount: number; // Regular installment amount in NGN
  installmentAmountUSD: number; // Regular installment amount in USD
  numberOfInstallments: number; // Total number of payments
  finalInstallmentAmount?: number; // Last payment if different (for rounding)
  finalInstallmentAmountUSD?: number; // Last payment USD if different
  nextPayment: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'reviewing' | 'active' | 'completed' | 'defaulted' | 'cancelled';
  submittedDate?: string;
  approvedDate?: string;
  completedDate?: string;
  paymentHistory: PaymentRecord[];
  purpose?: string;
  riskLevel?: 'low' | 'medium' | 'high';
  creditScore?: number;
  disbursedAmount?: number; // Amount disbursed in NGN
  disbursedAmountUSD?: number; // Amount disbursed in USD
  totalPaid?: number; // Total paid in NGN
  totalPaidUSD?: number; // Total paid in USD
  lateFees?: number;
  earlyPaymentDiscount?: number;
  // Legacy fields for backward compatibility
  termMonths: number; // Deprecated, use termDays instead
  monthlyPayment: number; // Deprecated, use installmentAmount instead
  monthlyPaymentUSD: number; // Deprecated, use installmentAmountUSD instead
}

export interface PaymentRecord {
  id: string;
  creditId: string;
  transactionId: string;
  amount: number; // Amount in NGN
  amountUSD: number; // Amount in USD
  date: string;
  time: string;
  status: 'completed' | 'pending' | 'failed';
  type: 'regular' | 'early' | 'partial' | 'late';
  principalAmount: number; // Principal amount in NGN
  principalAmountUSD: number; // Principal amount in USD
  interestAmount: number; // Interest amount in NGN
  interestAmountUSD: number; // Interest amount in USD
  lateFee?: number;
  lateFeeUSD?: number;
  reference: string;
}

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

// Exchange rate for NGN to USD (hardcoded for simplicity)
export const NGN_TO_USD_RATE = 0.0022; // 1 NGN = $0.0022 USD (roughly 460 NGN to 1 USD)

// Default annual interest rate (25%)
export const DEFAULT_ANNUAL_INTEREST_RATE = 25.0;

export const convertLocalToUSD = (amountNGN: number): number => {
  return Math.round((amountNGN * NGN_TO_USD_RATE) * 100) / 100; // Round to 2 decimal places
};

export const convertUSDToLocal = (amountUSD: number): number => {
  return Math.round(amountUSD / NGN_TO_USD_RATE);
};

// Loan calculation utilities
export const parseTerm = (term: string): number => {
  const [amount, unit] = term.toLowerCase().split(' ');
  const numericAmount = parseInt(amount);
  
  if (unit.startsWith('day')) {
    return numericAmount;
  } else if (unit.startsWith('week')) {
    return numericAmount * 7;
  } else if (unit.startsWith('month')) {
    return numericAmount * 30; // Using 30 days per month for simplicity
  } else if (unit.startsWith('year')) {
    return numericAmount * 365;
  }
  
  // Default to days if unit is not recognized
  return numericAmount;
};

export const getRepaymentFrequencyDays = (frequency: 'Daily' | 'Weekly' | 'Biweekly' | 'Monthly'): number => {
  switch (frequency) {
    case 'Daily':
      return 1;
    case 'Weekly':
      return 7;
    case 'Biweekly':
      return 14;
    case 'Monthly':
      return 30;
    default:
      return 30; // Default to monthly
  }
};

export const getInstallmentLabel = (frequency: 'Daily' | 'Weekly' | 'Biweekly' | 'Monthly' | undefined, type: 'noun' | 'adjective' = 'noun'): string => {
  if (!frequency) return type === 'noun' ? 'installment' : 'regular';
  
  switch (frequency) {
    case 'Daily':
      return type === 'noun' ? 'daily installment' : 'daily';
    case 'Weekly':
      return type === 'noun' ? 'weekly installment' : 'weekly';
    case 'Biweekly':
      return type === 'noun' ? 'biweekly installment' : 'biweekly';
    case 'Monthly':
      return type === 'noun' ? 'monthly installment' : 'monthly';
    default:
      return type === 'noun' ? 'installment' : 'regular';
  }
};

export const calculateLoanTerms = (
  principalAmount: number,
  annualInterestRate: number,
  termDays: number,
  repaymentFrequency: 'Daily' | 'Weekly' | 'Biweekly' | 'Monthly'
): {
  totalInterest: number;
  totalToRepay: number;
  installmentAmount: number;
  numberOfInstallments: number;
  finalInstallmentAmount?: number;
} => {
  // Calculate interest for the actual loan duration
  const dailyInterestRate = annualInterestRate / 100 / 365;
  const totalInterest = Math.round(principalAmount * dailyInterestRate * termDays);
  const totalToRepay = principalAmount + totalInterest;
  
  // Calculate number of installments
  const frequencyDays = getRepaymentFrequencyDays(repaymentFrequency);
  const numberOfInstallments = Math.ceil(termDays / frequencyDays);
  
  // Calculate installment amounts
  const regularInstallmentAmount = Math.floor(totalToRepay / numberOfInstallments);
  const remainder = totalToRepay - (regularInstallmentAmount * numberOfInstallments);
  
  // If there's a remainder, add it to the final installment
  const finalInstallmentAmount = remainder > 0 ? regularInstallmentAmount + remainder : undefined;
  
  return {
    totalInterest,
    totalToRepay,
    installmentAmount: regularInstallmentAmount,
    numberOfInstallments,
    finalInstallmentAmount
  };
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
  console.log(`💰 Created loan ${creditId}:`, {
    amount: `₦${requestData.amount.toLocaleString()}`,
    interestRate: `${interestRate}% APR`,
    term: `${requestData.term} (${termDays} days)`,
    totalInterest: `₦${loanTerms.totalInterest.toLocaleString()}`,
    totalToRepay: `₦${loanTerms.totalToRepay.toLocaleString()}`,
    installmentAmount: `₦${loanTerms.installmentAmount.toLocaleString()}`,
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

// Utility function for formatting currency
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2
  }).format(amount);
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

export const calculatePaymentProgress = (credit: Credit): number => {
  if (!credit.totalToRepay || credit.totalToRepay === 0) {
    // Fallback to old calculation for backward compatibility
    if (!credit.totalAmount || credit.totalAmount === 0) return 0;
    const totalPaid = credit.totalPaid || 0;
    return Math.min(100, Math.max(0, (totalPaid / credit.totalAmount) * 100));
  }
  
  const totalPaid = credit.totalPaid || 0;
  return Math.min(100, Math.max(0, (totalPaid / credit.totalToRepay) * 100));
};

export const getRemainingPayments = (credit: Credit): number => {
  if (credit.status !== 'active') return 0;
  
  // Use new loan structure if available
  if (credit.numberOfInstallments && credit.installmentAmount) {
    const totalPaid = credit.totalPaid || 0;
    const averagePaymentAmount = credit.installmentAmount;
    const paymentsMade = Math.floor(totalPaid / averagePaymentAmount);
    return Math.max(0, credit.numberOfInstallments - paymentsMade);
  }
  
  // Fallback to old calculation for backward compatibility
  if (!credit.monthlyPayment || credit.monthlyPayment === 0) return 0;
  
  const totalWithInterest = credit.totalAmount * (1 + credit.interestRate / 100);
  const totalPaid = credit.totalPaid || 0;
  const remaining = totalWithInterest - totalPaid;
  
  return Math.max(0, Math.ceil(remaining / credit.monthlyPayment));
};

// Utility function to calculate loan details for testing and verification
export const calculateLoanDetails = (
  principalAmount: number, 
  termString: string, 
  annualInterestRate: number, 
  repaymentFrequency: 'Daily' | 'Weekly' | 'Biweekly' | 'Monthly'
) => {
  const termDays = parseTerm(termString);
  const loanTerms = calculateLoanTerms(principalAmount, annualInterestRate, termDays, repaymentFrequency);
  
  return {
    totalAmount: principalAmount,
    totalInterest: loanTerms.totalInterest,
    totalToRepay: loanTerms.totalToRepay,
    installmentAmount: loanTerms.installmentAmount,
    numberOfInstallments: loanTerms.numberOfInstallments,
    finalInstallmentAmount: loanTerms.finalInstallmentAmount,
    termDays: termDays,
    repaymentFrequency: repaymentFrequency,
    interestRate: annualInterestRate
  };
};

// Verification function to test loan calculations
export const verifyLoanCalculations = () => {
  console.log('🧮 Verifying loan engine calculations...');
  console.log('Using DEFAULT_ANNUAL_INTEREST_RATE:', DEFAULT_ANNUAL_INTEREST_RATE + '% APR');
  
  // Test case 1: 3-month monthly loan (typical use case)  
  const loan1 = calculateLoanDetails(300000, '3 months', 25.0, 'Monthly');
  const manualCalculation = {
    principal: 300000,
    interestRate: 25.0,
    termDays: 90, // 3 months * 30 days
    dailyRate: 25.0 / 100 / 365,
    expectedInterest: Math.round(300000 * (25.0 / 100 / 365) * 90),
    expectedTotal: 300000 + Math.round(300000 * (25.0 / 100 / 365) * 90)
  };
  
  console.log('Manual Calculation Check:');
  console.log('  Principal: ₦300,000');
  console.log('  Interest Rate: 25% APR');  
  console.log('  Term: 90 days (3 months)');
  console.log('  Daily Rate:', `${(manualCalculation.dailyRate * 100).toFixed(6)}% per day`);
  console.log('  Expected Interest:', `₦${manualCalculation.expectedInterest.toLocaleString()}`);
  console.log('  Expected Total:', `₦${manualCalculation.expectedTotal.toLocaleString()}`);
  
  console.log('\nLoan Engine Results:');
  console.log('  Interest Rate:', `${loan1.interestRate}% APR`);
  console.log('  Term Days:', loan1.termDays);
  console.log('  Results:', {
    principal: `₦${loan1.totalAmount.toLocaleString()}`,
    interest: `₦${loan1.totalInterest.toLocaleString()}`,
    total: `₦${loan1.totalToRepay.toLocaleString()}`,
    installments: loan1.numberOfInstallments,
    installmentAmount: `₦${loan1.installmentAmount.toLocaleString()}`,
    finalAmount: loan1.finalInstallmentAmount ? `₦${loan1.finalInstallmentAmount.toLocaleString()}` : 'Same as regular'
  });
  
  console.log('\n✅ Manual vs Engine Comparison:');
  console.log('  Interest Match:', manualCalculation.expectedInterest === loan1.totalInterest ? '✅' : '❌');
  console.log('  Total Match:', manualCalculation.expectedTotal === loan1.totalToRepay ? '✅' : '❌');
  
  // Test case 2: 4-week daily loan (micro-finance use case)
  const loan2 = calculateLoanDetails(100000, '4 weeks', 25.0, 'Daily');
  console.log('Test 2 - ₦100,000 @ 25% for 4 weeks, daily payments:', {
    principal: `₦${loan2.totalAmount.toLocaleString()}`,
    interest: `₦${loan2.totalInterest.toLocaleString()}`,
    total: `₦${loan2.totalToRepay.toLocaleString()}`,
    installments: loan2.numberOfInstallments,
    installmentAmount: `₦${loan2.installmentAmount.toLocaleString()}`,
    finalAmount: loan2.finalInstallmentAmount ? `₦${loan2.finalInstallmentAmount.toLocaleString()}` : 'Same as regular'
  });
  
  // Test case 3: 6-month biweekly loan (longer term use case)
  const loan3 = calculateLoanDetails(500000, '6 months', 25.0, 'Biweekly');
  console.log('Test 3 - ₦500,000 @ 25% for 6 months, biweekly payments:', {
    principal: `₦${loan3.totalAmount.toLocaleString()}`,
    interest: `₦${loan3.totalInterest.toLocaleString()}`,
    total: `₦${loan3.totalToRepay.toLocaleString()}`,
    installments: loan3.numberOfInstallments,
    installmentAmount: `₦${loan3.installmentAmount.toLocaleString()}`,
    finalAmount: loan3.finalInstallmentAmount ? `₦${loan3.finalInstallmentAmount.toLocaleString()}` : 'Same as regular'
  });
  
  // Validate that installments add up correctly for all test cases
  const validateLoan = (loan: any, testName: string) => {
    const calculatedTotal = (loan.installmentAmount * (loan.numberOfInstallments - 1)) + 
                           (loan.finalInstallmentAmount || loan.installmentAmount);
    const isValid = Math.abs(calculatedTotal - loan.totalToRepay) < 1;
    console.log(`${testName} validation: ${isValid ? '✅' : '❌'} (diff: ₦${Math.abs(calculatedTotal - loan.totalToRepay).toFixed(2)})`);
    return isValid;
  };
  
  const allValid = validateLoan(loan1, 'Monthly') && 
                   validateLoan(loan2, 'Daily') && 
                   validateLoan(loan3, 'Biweekly');
  
  console.log(`\n${allValid ? '✅' : '❌'} Loan engine verification ${allValid ? 'passed' : 'failed'} - all calculations are ${allValid ? 'accurate' : 'incorrect'}`);
  
  return allValid;
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

export const getUSDToLocalRate = (): number => {
  return 1 / NGN_TO_USD_RATE; // Convert USD to NGN rate
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
        console.log(`✅ Collateral released for loan ${creditId}`);
        
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
        console.warn(`⚠️ Failed to release collateral for loan ${creditId}: ${unlockResult.error}`);
      }
    } catch (error) {
      console.error(`❌ Error releasing collateral for loan ${creditId}:`, error);
    }
  }

  return { success: true, updatedCredit };
};