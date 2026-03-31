// Pure math functions and types for the credit/loan system.
// No side effects, no state mutations — fully testable in isolation.

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

// Utility function for formatting currency
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2
  }).format(amount);
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
  console.log('Verifying loan engine calculations...');
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
  console.log('  Principal: N300,000');
  console.log('  Interest Rate: 25% APR');
  console.log('  Term: 90 days (3 months)');
  console.log('  Daily Rate:', `${(manualCalculation.dailyRate * 100).toFixed(6)}% per day`);
  console.log('  Expected Interest:', `N${manualCalculation.expectedInterest.toLocaleString()}`);
  console.log('  Expected Total:', `N${manualCalculation.expectedTotal.toLocaleString()}`);

  console.log('\nLoan Engine Results:');
  console.log('  Interest Rate:', `${loan1.interestRate}% APR`);
  console.log('  Term Days:', loan1.termDays);
  console.log('  Results:', {
    principal: `N${loan1.totalAmount.toLocaleString()}`,
    interest: `N${loan1.totalInterest.toLocaleString()}`,
    total: `N${loan1.totalToRepay.toLocaleString()}`,
    installments: loan1.numberOfInstallments,
    installmentAmount: `N${loan1.installmentAmount.toLocaleString()}`,
    finalAmount: loan1.finalInstallmentAmount ? `N${loan1.finalInstallmentAmount.toLocaleString()}` : 'Same as regular'
  });

  console.log('\nManual vs Engine Comparison:');
  console.log('  Interest Match:', manualCalculation.expectedInterest === loan1.totalInterest);
  console.log('  Total Match:', manualCalculation.expectedTotal === loan1.totalToRepay);

  // Test case 2: 4-week daily loan (micro-finance use case)
  const loan2 = calculateLoanDetails(100000, '4 weeks', 25.0, 'Daily');
  console.log('Test 2 - N100,000 @ 25% for 4 weeks, daily payments:', {
    principal: `N${loan2.totalAmount.toLocaleString()}`,
    interest: `N${loan2.totalInterest.toLocaleString()}`,
    total: `N${loan2.totalToRepay.toLocaleString()}`,
    installments: loan2.numberOfInstallments,
    installmentAmount: `N${loan2.installmentAmount.toLocaleString()}`,
    finalAmount: loan2.finalInstallmentAmount ? `N${loan2.finalInstallmentAmount.toLocaleString()}` : 'Same as regular'
  });

  // Test case 3: 6-month biweekly loan (longer term use case)
  const loan3 = calculateLoanDetails(500000, '6 months', 25.0, 'Biweekly');
  console.log('Test 3 - N500,000 @ 25% for 6 months, biweekly payments:', {
    principal: `N${loan3.totalAmount.toLocaleString()}`,
    interest: `N${loan3.totalInterest.toLocaleString()}`,
    total: `N${loan3.totalToRepay.toLocaleString()}`,
    installments: loan3.numberOfInstallments,
    installmentAmount: `N${loan3.installmentAmount.toLocaleString()}`,
    finalAmount: loan3.finalInstallmentAmount ? `N${loan3.finalInstallmentAmount.toLocaleString()}` : 'Same as regular'
  });

  // Validate that installments add up correctly for all test cases
  const validateLoan = (loan: any, testName: string) => {
    const calculatedTotal = (loan.installmentAmount * (loan.numberOfInstallments - 1)) +
                           (loan.finalInstallmentAmount || loan.installmentAmount);
    const isValid = Math.abs(calculatedTotal - loan.totalToRepay) < 1;
    console.log(`${testName} validation: ${isValid ? 'pass' : 'fail'} (diff: N${Math.abs(calculatedTotal - loan.totalToRepay).toFixed(2)})`);
    return isValid;
  };

  const allValid = validateLoan(loan1, 'Monthly') &&
                   validateLoan(loan2, 'Daily') &&
                   validateLoan(loan3, 'Biweekly');

  console.log(`\nLoan engine verification ${allValid ? 'passed' : 'failed'} - all calculations are ${allValid ? 'accurate' : 'incorrect'}`);

  return allValid;
};

export const getUSDToLocalRate = (): number => {
  return 1 / NGN_TO_USD_RATE; // Convert USD to NGN rate
};
