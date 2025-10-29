import { addPledgerActivity } from './pledger-activity';
import { getCreditsForUserState, convertLocalToUSD, getTotalCreditBalance, getInstallmentLabel } from './credits';

export interface Transaction {
  id: string;
  name: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  category: 'transfer' | 'payment' | 'loan' | 'salary' | 'bills' | 'cash' | 'other';
  date: string;
  time: string;
  status: 'completed' | 'pending' | 'failed';
  reference?: string;
  location?: string;
  fromAccount?: string;
  toAccount?: string;
  fee?: number;
  balanceAfter?: number;
}

// Empty array - all transactions will be generated dynamically
export const transactions: Transaction[] = [];

export const getTransactionsByType = (type?: 'credit' | 'debit') => {
  if (!type) return transactions;
  return transactions.filter(t => t.type === type);
};

export const getTransactionsByCategory = (category?: string) => {
  if (!category) return transactions;
  return transactions.filter(t => t.category === category);
};

export const getTransactionById = (id: string, userState: 'fresh' | 'active' = 'active') => {
  const allTransactions = getTransactionsForUserState(userState);
  return allTransactions.find(t => t.id === id);
};

// Empty array - fresh user starts with no transactions
export const freshUserTransactions: Transaction[] = [];

// State management for transactions
let transactionsState: Transaction[] = [];
let freshTransactionsState: Transaction[] = [];
let nextTransactionId = 1; // Starting from TXN001

export const getTransactionsForUserState = (userState: 'fresh' | 'active') => {
  return userState === 'fresh' ? freshTransactionsState : transactionsState;
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2
  }).format(amount);
};

// Utility function to check if a transaction is loan-related
export const isLoanTransaction = (transaction: Transaction): boolean => {
  return transaction.category === 'loan' || transaction.description.includes('loan installment') || transaction.description.includes('Final payment');
};

// Utility function to extract credit ID from loan transaction description
export const getCreditIdFromTransaction = (transaction: Transaction): string | null => {
  if (!isLoanTransaction(transaction)) {
    return null;
  }
  
  // Extract credit ID from descriptions like "Monthly loan installment - CR001" or "Final payment - CR003"
  const match = transaction.description.match(/- (CR\d+)/);
  return match ? match[1] : null;
};

export const getCurrentBalance = (userState: 'fresh' | 'active'): number => {
  const allTransactions = getTransactionsForUserState(userState);
  if (allTransactions.length === 0) return 0;
  
  // Sort by date and time to get the most recent transaction
  const sortedTransactions = allTransactions.sort((a, b) => {
    const dateA = new Date(`${a.date} ${a.time}`);
    const dateB = new Date(`${b.date} ${b.time}`);
    return dateB.getTime() - dateA.getTime();
  });
  
  return sortedTransactions[0].balanceAfter || 0;
};

export const addLoanDisbursementTransaction = (
  creditId: string,
  amount: number,
  userState: 'fresh' | 'active',
  customDate?: Date
): { success: boolean; transaction?: Transaction; newBalance?: number; error?: string } => {
  const currentBalance = getCurrentBalance(userState);
  const newBalance = currentBalance + amount;
  const transactionId = `TXN${String(nextTransactionId++).padStart(3, '0')}`;
  
  const transactionDate = customDate || new Date();
  
  const newTransaction: Transaction = {
    id: transactionId,
    name: "Loan Disbursement",
    description: `Loan funds received - ${creditId}`,
    amount: amount,
    type: "credit",
    category: "loan",
    date: transactionDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }),
    time: transactionDate.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    }),
    status: "completed",
    reference: `LOAN${transactionDate.getFullYear()}${String(transactionDate.getMonth() + 1).padStart(2, '0')}${String(nextTransactionId - 1).padStart(3, '0')}`,
    fromAccount: "TOPOS Credit - 4433221100",
    toAccount: "Your Account - 0987654321",
    balanceAfter: newBalance
  };
  
  // Add to appropriate state
  if (userState === 'fresh') {
    freshTransactionsState = [newTransaction, ...freshTransactionsState];
  } else {
    transactionsState = [newTransaction, ...transactionsState];
  }

  // Add pledger activity for loan disbursement
  try {
    const { addPledgerActivity } = require('./pledger-activity');
    const { getCreditsForUserState, convertLocalToUSD } = require('./credits');
    
    const credits = getCreditsForUserState(userState);
    const credit = credits.find(c => c.id === creditId);
    
    if (credit) {
      // Convert NGN amount to USD for pledger activity
      const amountUSD = convertLocalToUSD(amount);
      
      addPledgerActivity({
        type: 'loan_disbursed',
        title: 'Loan Disbursed',
        description: `Loan funds disbursed to borrower for ${credit.purpose || 'loan'}`,
        amount: amountUSD,
        date: transactionDate.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        }),
        time: transactionDate.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        }),
        status: 'completed',
        borrowerName: 'Segun Adebayo',
        creditId: creditId
      }, userState);
    }
  } catch (e) {
    // Graceful fallback if activity creation fails
    console.warn('Failed to create loan disbursement activity:', e);
  }
  
  return {
    success: true,
    transaction: newTransaction,
    newBalance
  };
};

export const addLoanRepaymentTransaction = (
  creditId: string,
  amount: number,
  paymentType: 'regular' | 'full' | 'custom',
  userState: 'fresh' | 'active',
  customDate?: Date
): { success: boolean; transaction?: Transaction; newBalance?: number; error?: string } => {
  const currentBalance = getCurrentBalance(userState);
  
  if (currentBalance < amount) {
    return {
      success: false,
      error: `Insufficient funds. Available balance: ${formatCurrency(currentBalance)}, Required: ${formatCurrency(amount)}`
    };
  }
  
  const newBalance = currentBalance - amount;
  const transactionId = `TXN${String(nextTransactionId++).padStart(3, '0')}`;
  
  const transactionDate = customDate || new Date();
  
  // Get credit info for dynamic installment labeling
  const credits = getCreditsForUserState(userState);
  const credit = credits.find(c => c.id === creditId);
  
  const paymentDescription = paymentType === 'regular' 
    ? `${getInstallmentLabel(credit?.repaymentFrequency, 'adjective').charAt(0).toUpperCase() + getInstallmentLabel(credit?.repaymentFrequency, 'adjective').slice(1)} loan installment - ${creditId}`
    : paymentType === 'full'
    ? `Full loan payoff - ${creditId}`
    : `Loan payment - ${creditId}`;
  
  const newTransaction: Transaction = {
    id: transactionId,
    name: "Loan Repayment",
    description: paymentDescription,
    amount: -amount,
    type: "debit",
    category: "loan",
    date: transactionDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }),
    time: transactionDate.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    }),
    status: "completed",
    reference: `LOAN${transactionDate.getFullYear()}${String(transactionDate.getMonth() + 1).padStart(2, '0')}${String(nextTransactionId - 1).padStart(3, '0')}`,
    fromAccount: "Your Account - 0987654321",
    toAccount: "TOPOS Credit - 4433221100",
    balanceAfter: newBalance
  };
  
  // Add to appropriate state
  if (userState === 'fresh') {
    freshTransactionsState = [newTransaction, ...freshTransactionsState];
  } else {
    transactionsState = [newTransaction, ...transactionsState];
  }

  // Note: Credit payment processing is handled separately by the calling code
  // to avoid duplicate payment records and maintain proper error handling

  // Add pledger activity for loan repayment
  try {
    const credits = getCreditsForUserState(userState);
    const credit = credits.find(c => c.id === creditId);
    
    if (credit) {
      // Keep NGN amount for pledger activity (no conversion needed)
      
      const paymentTitle = paymentType === 'full' ? 'Final Loan Repayment' : 'Loan Repayment';
      const paymentDescriptionPledger = paymentType === 'full' 
        ? 'Final loan payment from borrower'
        : paymentType === 'regular'
        ? `${getInstallmentLabel(credit.repaymentFrequency, 'adjective').charAt(0).toUpperCase() + getInstallmentLabel(credit.repaymentFrequency, 'adjective').slice(1)} loan payment from borrower`
        : 'Loan payment from borrower';
      
      addPledgerActivity({
        type: 'loan_repayment',
        title: paymentTitle,
        description: paymentDescriptionPledger,
        amount: amount, // Keep in NGN
        currency: 'NGN',
        date: transactionDate.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        }),
        time: transactionDate.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        }),
        status: 'completed',
        borrowerName: 'Segun Adebayo',
        creditId: creditId
      }, userState);
    }
  } catch (e) {
    // Graceful fallback if activity creation fails
    console.warn('Failed to create loan repayment activity:', e);
  }
  
  return {
    success: true,
    transaction: newTransaction,
    newBalance
  };
};

export const resetTransactionsToFreshUser = (): void => {
  freshTransactionsState = [];
  nextTransactionId = 1; // Start from TXN001
};

export const resetTransactionsToActiveUser = (): void => {
  transactionsState = [];
  nextTransactionId = 1; // Start from TXN001
};

export const getAccountBalances = (userState: 'fresh' | 'active') => {
  const checkingBalance = getCurrentBalance(userState);
  const creditBalance = getTotalCreditBalance(userState);
  
  // Net balance can be negative if credit exceeds checking balance
  const netBalance = checkingBalance - creditBalance;
  
  return {
    checking: checkingBalance,
    credit: creditBalance,
    net: netBalance // This will be negative if credit > checking
  };
};

export const addCashTransaction = (
  type: 'withdraw' | 'deposit',
  amount: number,
  userState: 'fresh' | 'active',
  customDate?: Date
): { success: boolean; transaction?: Transaction; newBalance?: number; error?: string } => {
  const currentBalance = getCurrentBalance(userState);
  
  // Validate withdrawal amount
  if (type === 'withdraw' && currentBalance < amount) {
    return {
      success: false,
      error: `Insufficient funds. Available balance: ${formatCurrency(currentBalance)}, Requested: ${formatCurrency(amount)}`
    };
  }
  
  const newBalance = type === 'withdraw' 
    ? currentBalance - amount 
    : currentBalance + amount;
  const transactionId = `TXN${String(nextTransactionId++).padStart(3, '0')}`;
  
  const transactionDate = customDate || new Date();
  
  const newTransaction: Transaction = {
    id: transactionId,
    name: type === 'withdraw' ? 'Cash Withdrawal' : 'Cash Deposit',
    description: type === 'withdraw' 
      ? 'Cash withdrawn from account' 
      : 'Cash deposited to account',
    amount: type === 'withdraw' ? -amount : amount,
    type: type === 'withdraw' ? 'debit' : 'credit',
    category: 'cash',
    date: transactionDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }),
    time: transactionDate.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    }),
    status: 'completed',
    reference: `CASH${transactionDate.getFullYear()}${String(transactionDate.getMonth() + 1).padStart(2, '0')}${String(nextTransactionId - 1).padStart(3, '0')}`,
    fromAccount: type === 'withdraw' 
      ? 'Your Account - 0987654321' 
      : 'Cash Deposit',
    toAccount: type === 'withdraw' 
      ? 'Cash Withdrawal' 
      : 'Your Account - 0987654321',
    balanceAfter: newBalance
  };
  
  // Add to appropriate state
  if (userState === 'fresh') {
    freshTransactionsState = [newTransaction, ...freshTransactionsState];
  } else {
    transactionsState = [newTransaction, ...transactionsState];
  }
  
  return {
    success: true,
    transaction: newTransaction,
    newBalance
  };
};

export const addTransferTransaction = (
  transferType: 'topos' | 'external',
  amount: number,
  recipient: string,
  description?: string,
  userState: 'fresh' | 'active' = 'active'
): { success: boolean; transaction?: Transaction; newBalance?: number; error?: string } => {
  const currentBalance = getCurrentBalance(userState);
  
  // Validate transfer amount
  if (currentBalance < amount) {
    return {
      success: false,
      error: `Insufficient funds. Available balance: ${formatCurrency(currentBalance)}, Transfer amount: ${formatCurrency(amount)}`
    };
  }
  
  const newBalance = currentBalance - amount;
  const transactionId = `TXN${String(nextTransactionId++).padStart(3, '0')}`;
  
  const newTransaction: Transaction = {
    id: transactionId,
    name: recipient,
    description: description || `Money transfer ${transferType === 'topos' ? 'to Topos account' : 'to bank account'}`,
    amount: -amount,
    type: 'debit',
    category: 'transfer',
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
    status: transferType === 'topos' ? 'completed' : 'pending',
    reference: `TXN${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(nextTransactionId - 1).padStart(3, '0')}`,
    fromAccount: 'Your Account - 0987654321',
    toAccount: recipient,
    fee: transferType === 'topos' ? 0 : 0, // Free for now
    balanceAfter: newBalance
  };
  
  // Add to appropriate state
  if (userState === 'fresh') {
    freshTransactionsState = [newTransaction, ...freshTransactionsState];
  } else {
    transactionsState = [newTransaction, ...transactionsState];
  }
  
  return {
    success: true,
    transaction: newTransaction,
    newBalance
  };
};