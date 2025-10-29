import { useState, useEffect } from "react";
import { SmartphoneContainer } from "./components/SmartphoneContainer";
import { BottomNav } from "./components/BottomNav";
import { HomeScreen } from "./components/screens/HomeScreen";
import { CreditScreen } from "./components/screens/CreditScreen";
import { CreateRequestScreen } from "./components/screens/CreateRequestScreen";
import { TransactionHistoryScreen } from "./components/screens/TransactionHistoryScreen";
import { TransactionDetailsScreen } from "./components/screens/TransactionDetailsScreen";
import { CreditDetailsScreen } from "./components/screens/CreditDetailsScreen";
import { PaymentHistoryScreen } from "./components/screens/PaymentHistoryScreen";

import { PlaceholderScreen } from "./components/screens/PlaceholderScreen";
import { ReceiveMoneyScreen } from "./components/screens/ReceiveMoneyScreen";
import { CashScreen } from "./components/screens/CashScreen";
import { WalletScreen } from "./components/screens/WalletScreen";
import { TransferScreen } from "./components/screens/TransferScreen";
import { PledgerApp } from "./components/PledgerApp";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner@2.0.3";
import { Button } from "./components/ui/button";
import { RotateCcw, Database, Bell, BellOff, List, ListX } from "lucide-react";
import { AuditTrail } from "./components/AuditTrail";
import { resetToFreshUser, resetToActiveUser, approveAllPendingRequests, declineAllPendingRequests, addPendingRequest, approvePendingRequest, verifyLoanCalculations, processCreditPayment } from "./components/data/credits";
import { resetTransactionsToFreshUser, resetTransactionsToActiveUser, addLoanDisbursementTransaction, addCashTransaction, addLoanRepaymentTransaction } from "./components/data/transactions";
import { addPledgerActivity, resetPledgerActivitiesToFresh, resetPledgerActivitiesToActive } from "./components/data/pledger-activity";
import { topUpWallet, lockFunds } from "./components/data/wallet";
import toposLogo from 'figma:asset/4b031171cb67357b991e3d5c9c7dd0b75de1bf28.png';

// Progressive function to populate with realistic activity - runs step by step with visual feedback
async function buildActivityHistoryProgressively(onRefresh: () => void, notificationsEnabled: boolean = true) {
  try {
    console.log('🚀 Starting progressive activity history build...');
    
    // Verify loan calculations first
    verifyLoanCalculations();
    
    // Reset everything to fresh first
    resetToFreshUser();
    resetTransactionsToFreshUser();
    resetPledgerActivitiesToFresh();
    onRefresh(); // Show clean slate
    
    if (notificationsEnabled) {
      toast.info("Building activity history...", {
        description: "Step 1/7: Resetting to fresh state"
      });
    }
    
    await new Promise(resolve => setTimeout(resolve, 750));
    
    // === STEP 1: Initial Account Setup ===
    console.log('📈 Step 1: Setting up initial account deposits...');
    
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    // Add initial deposits to build up account balance
    addCashTransaction('deposit', 250000, 'fresh', threeMonthsAgo);
    addCashTransaction('deposit', 180000, 'fresh', twoMonthsAgo);
    addCashTransaction('deposit', 150000, 'fresh', oneMonthAgo);
    
    onRefresh(); // Update UI to show new deposits
    if (notificationsEnabled) {
      toast.success("Initial deposits added", {
        description: "Step 2/7: Account funded with ₦580,000"
      });
    }
    
    await new Promise(resolve => setTimeout(resolve, 1125));
    
    // === STEP 2: Pledger Wallet Setup ===
    console.log('💰 Step 2: Setting up pledger wallet...');
    
    topUpWallet(1500);
    addPledgerActivity({
      type: 'wallet_topup',
      title: 'Wallet Top-up',
      description: 'Initial wallet funding',
      amount: 1500,
      date: twoMonthsAgo.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      time: twoMonthsAgo.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      status: 'completed'
    }, 'fresh');
    
    onRefresh(); // Update UI to show pledger wallet
    if (notificationsEnabled) {
      toast.success("Pledger wallet funded", {
        description: "Step 3/7: $1,500 USD added to pledger wallet"
      });
    }
    
    await new Promise(resolve => setTimeout(resolve, 1125));
    
    // === STEP 3: Create and Complete Historical Loan ===
    console.log('🏦 Step 3: Creating completed loan history...');
    
    // Step 3a: Create pending request
    const completedLoan = addPendingRequest({
      pledgerName: 'Abimbola Adebayo',
      pledgerEmail: 'abimbola@email.com',
      pledgerCountry: 'United Kingdom',
      amount: 300000,
      term: '3 months',
      submittedDate: twoMonthsAgo.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      purpose: 'Business expansion',
      expectedInterestRate: 25.0,
      repaymentFrequency: 'Monthly'
    }, 'fresh');
    
    onRefresh(); // Show pending request in borrower app
    if (notificationsEnabled) {
      toast.info("Loan request submitted", {
        description: "Step 3a/7: ₦300,000 request awaiting pledger approval"
      });
    }
    
    await new Promise(resolve => setTimeout(resolve, 900));
    
    // Step 3b: Pledger locks funds  
    lockFunds(completedLoan.id, 300, 'fresh');
    
    onRefresh(); // Show locked funds in pledger app
    if (notificationsEnabled) {
      toast.info("Pledger collateral locked", {
        description: "Step 3b/7: $300 USD collateral secured"
      });
    }
    
    await new Promise(resolve => setTimeout(resolve, 900));
    
    // Step 3c: Approve request
    approvePendingRequest(completedLoan.id, 'fresh');
    
    onRefresh(); // Show approved status
    if (notificationsEnabled) {
      toast.success("Loan approved", {
        description: "Step 3c/7: Request approved, preparing disbursement"
      });
    }
    
    await new Promise(resolve => setTimeout(resolve, 900));
    
    // Step 3d: Disburse funds
    addLoanDisbursementTransaction(completedLoan.id, 300000, 'fresh', twoMonthsAgo);
    
    // Use some loan funds
    addCashTransaction('withdraw', 200000, 'fresh', twoMonthsAgo);
    
    onRefresh(); // Update UI to show loan and transactions
    if (notificationsEnabled) {
      toast.success("Historical loan disbursed", {
        description: "Step 4/7: ₦300,000 transferred to borrower account"
      });
    }
    
    await new Promise(resolve => setTimeout(resolve, 1125));
    
    // Make loan payments progressively
    console.log('💳 Step 3b: Adding loan payment history...');
    const installmentAmount = completedLoan.installmentAmount;
    
    // First payment
    const firstPaymentDate = new Date(twoMonthsAgo);
    firstPaymentDate.setMonth(firstPaymentDate.getMonth() + 1);
    const firstTxn = addLoanRepaymentTransaction(completedLoan.id, installmentAmount, 'regular', 'fresh', firstPaymentDate);
    if (firstTxn.success) {
      processCreditPayment(completedLoan.id, installmentAmount, 'regular', firstTxn.transaction!.id, 'fresh');
    }
    
    onRefresh();
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Second payment
    const secondPaymentDate = new Date(firstPaymentDate);
    secondPaymentDate.setMonth(secondPaymentDate.getMonth() + 1);
    const secondTxn = addLoanRepaymentTransaction(completedLoan.id, installmentAmount, 'regular', 'fresh', secondPaymentDate);
    if (secondTxn.success) {
      processCreditPayment(completedLoan.id, installmentAmount, 'regular', secondTxn.transaction!.id, 'fresh');
    }
    
    onRefresh();
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Final payment - this will trigger collateral release
    const finalPaymentDate = new Date(secondPaymentDate);
    finalPaymentDate.setMonth(finalPaymentDate.getMonth() + 1);
    const finalTxn = addLoanRepaymentTransaction(completedLoan.id, installmentAmount, 'full', 'fresh', finalPaymentDate);
    if (finalTxn.success) {
      processCreditPayment(completedLoan.id, installmentAmount, 'full', finalTxn.transaction!.id, 'fresh');
    }
    
    onRefresh();
    if (notificationsEnabled) {
      toast.success("Loan payments completed", {
        description: "Historical loan fully repaid with 3 installments"
      });
    }
    
    await new Promise(resolve => setTimeout(resolve, 1125));
    
    // === STEP 4: Create Current Active Loan ===
    console.log('🔄 Step 4: Creating current active loan...');
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    // Step 4a: Create pending request
    const activeLoan = addPendingRequest({
      pledgerName: 'Abimbola Adebayo', 
      pledgerEmail: 'abimbola@email.com',
      pledgerCountry: 'United Kingdom',
      amount: 400000,
      term: '6 months',
      submittedDate: oneWeekAgo.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      purpose: 'Working capital',
      expectedInterestRate: 25.0,
      repaymentFrequency: 'Monthly'
    }, 'fresh');
    
    onRefresh(); // Show pending request
    if (notificationsEnabled) {
      toast.info("Current loan request submitted", {
        description: "Step 4a/7: ₦400,000 request awaiting approval"
      });
    }
    
    await new Promise(resolve => setTimeout(resolve, 900));
    
    // Step 4b: Pledger locks funds
    lockFunds(activeLoan.id, 400, 'fresh');
    
    onRefresh(); // Show locked funds
    if (notificationsEnabled) {
      toast.info("Pledger collateral secured", {
        description: "Step 4b/7: $400 USD collateral locked"
      });
    }
    
    await new Promise(resolve => setTimeout(resolve, 900));
    
    // Step 4c: Approve request
    approvePendingRequest(activeLoan.id, 'fresh');
    
    onRefresh(); // Show approved status
    if (notificationsEnabled) {
      toast.success("Current loan approved", {
        description: "Step 4c/7: Active loan ready for disbursement"
      });
    }
    
    await new Promise(resolve => setTimeout(resolve, 900));
    
    // Step 4d: Disburse funds
    addLoanDisbursementTransaction(activeLoan.id, 400000, 'fresh', oneWeekAgo);
    
    // Use some of the active loan funds
    addCashTransaction('withdraw', 250000, 'fresh', oneWeekAgo);
    
    onRefresh(); // Update UI to show active loan
    if (notificationsEnabled) {
      toast.success("Active loan disbursed", {
        description: "Step 5/7: ₦400,000 working capital funded"
      });
    }
    
    await new Promise(resolve => setTimeout(resolve, 1125));
    
    // === STEP 5: Recent Regular Activity ===
    console.log('📊 Step 5: Adding recent banking activity...');
    
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Add recent transactions one by one for visual effect
    addCashTransaction('deposit', 85000, 'fresh', twoWeeksAgo);
    onRefresh();
    await new Promise(resolve => setTimeout(resolve, 375));
    
    addCashTransaction('withdraw', 45000, 'fresh', oneWeekAgo);
    onRefresh();
    await new Promise(resolve => setTimeout(resolve, 375));
    
    addCashTransaction('deposit', 75000, 'fresh', yesterday);
    onRefresh();
    
    if (notificationsEnabled) {
      toast.success("Recent activity added", {
        description: "Step 6/7: Banking transactions completed"
      });
    }
    
    await new Promise(resolve => setTimeout(resolve, 1125));
    
    // === STEP 6: Add Partial Payment on Active Loan ===
    console.log('💳 Step 6: Adding partial payment on active loan...');
    
    const fourDaysAgo = new Date();
    fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);
    
    // Use the calculated installment amount from the active loan
    const activeLoanInstallmentAmount = activeLoan.installmentAmount;
    
    // Add one partial payment to show progress on the loan
    const partialTxn = addLoanRepaymentTransaction(activeLoan.id, activeLoanInstallmentAmount, 'regular', 'fresh', fourDaysAgo);
    if (partialTxn.success) {
      processCreditPayment(activeLoan.id, activeLoanInstallmentAmount, 'regular', partialTxn.transaction!.id, 'fresh');
    }
    
    onRefresh(); // Update UI to show the payment
    if (notificationsEnabled) {
      toast.success("Loan payment made", {
        description: `Step 6/8: First payment on active loan (₦${activeLoanInstallmentAmount.toLocaleString()})`
      });
    }
    
    await new Promise(resolve => setTimeout(resolve, 1125));
    
    // === STEP 8: Add Pending Request ===
    console.log('⏳ Step 8: Adding pending credit request...');
    
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    const pendingLoan = addPendingRequest({
      pledgerName: 'Abimbola Adebayo',
      pledgerEmail: 'abimbola@email.com',
      pledgerCountry: 'United Kingdom',
      amount: 250000,
      term: '4 months',
      submittedDate: threeDaysAgo.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      purpose: 'Equipment purchase',
      expectedInterestRate: 25.0,
      repaymentFrequency: 'Monthly'
    }, 'fresh');
    
    // Leave this request pending (don't approve it)
    onRefresh();
    
    if (notificationsEnabled) {
      toast.success("Activity history completed!", {
        description: "Step 8/8: Pending credit request added (awaiting approval)"
      });
    }
    
    console.log('✅ Progressive activity history build completed successfully!');
    
  } catch (error) {
    console.error('❌ Error building activity history:', error);
    if (notificationsEnabled) {
      toast.error("Failed to build activity history", {
        description: "Resetting to fresh state. Check console for details."
      });
    }
    
    // Reset to fresh state on error
    resetToFreshUser();
    resetTransactionsToFreshUser();
    resetPledgerActivitiesToFresh();
    onRefresh();
    throw error;
  }
}

interface BorrowerAppProps {
  userState: 'fresh' | 'active';
  refreshKey: number;
  onRefresh: () => void;
  onUserStateChange: (state: 'fresh' | 'active') => void;
  forceTab?: string;
  forceChartPeriod?: '1W' | '1M' | '3M' | 'YTD' | '1Y';
  disableChartAnimations?: boolean;
  onPopulateStateChange?: (isPopulating: boolean) => void;
  notificationsEnabled?: boolean;
  onAuditLog?: (event: string, details?: string, type?: 'action' | 'transaction' | 'system' | 'pledger') => void;
}

function BorrowerApp({ userState, refreshKey, onRefresh, onUserStateChange, forceTab, forceChartPeriod, disableChartAnimations, onPopulateStateChange, notificationsEnabled = true, onAuditLog }: BorrowerAppProps) {
  const [activeTab, setActiveTab] = useState('home');
  
  // Update active tab when forceTab changes
  useEffect(() => {
    if (forceTab) {
      setActiveTab(forceTab);
    }
  }, [forceTab]);
  const [showCreateRequest, setShowCreateRequest] = useState(false);
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [selectedCreditId, setSelectedCreditId] = useState<string | null>(null);
  const [creditDetailsTab, setCreditDetailsTab] = useState<'overview' | 'pledger' | 'payments'>('overview');
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [paymentHistoryCreditId, setPaymentHistoryCreditId] = useState<string | null>(null);
  const [showReceiveMoney, setShowReceiveMoney] = useState(false);
  const [showCash, setShowCash] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);

  const handleCreateRequest = () => {
    setShowCreateRequest(true);
  };

  const handleBackFromCreateRequest = () => {
    setShowCreateRequest(false);
    setActiveTab('credit');
  };

  const handleSubmitRequest = (requestData: any) => {
    setShowCreateRequest(false);
    setActiveTab('credit');
    // Force re-render to show the new request
    onRefresh();
    
    onAuditLog?.(
      "Loan request submitted", 
      `₦${requestData.amount?.toLocaleString()} for ${requestData.term} - ${requestData.purpose}`, 
      'action'
    );
    
    if (notificationsEnabled) {
      toast.success("Loan request submitted successfully!", {
        description: "Your pledger will be notified to provide collateral."
      });
    }
  };

  const handleViewAllTransactions = () => {
    setActiveTab('wallet');
    // Scroll to activity section after a short delay to allow tab change
    setTimeout(() => {
      const activityElement = document.querySelector('[data-activity-section]');
      if (activityElement) {
        activityElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleBackFromTransactionHistory = () => {
    setShowTransactionHistory(false);
  };

  const handleTransactionClick = (transactionId: string) => {
    setSelectedTransactionId(transactionId);
    // Clear credit selection when navigating to transaction details
    setSelectedCreditId(null);
  };

  const handleBackFromTransactionDetails = () => {
    setSelectedTransactionId(null);
  };

  const handleViewCreditFromTransaction = (creditId: string) => {
    setSelectedTransactionId(null);
    setSelectedCreditId(creditId);
  };

  const handleCreditClick = (creditId: string) => {
    setSelectedCreditId(creditId);
  };

  const handleBackFromCreditDetails = () => {
    setSelectedCreditId(null);
    setCreditDetailsTab('overview');
  };

  const handleCreditClickFromPaymentBanner = (creditId: string) => {
    setSelectedCreditId(creditId);
    setCreditDetailsTab('payments');
  };

  const handleViewAllPayments = () => {
    // Store the current credit ID and show payment history
    setPaymentHistoryCreditId(selectedCreditId);
    setShowPaymentHistory(true);
    setSelectedCreditId(null);
  };

  const handleBackFromPaymentHistory = () => {
    setShowPaymentHistory(false);
    setSelectedCreditId(paymentHistoryCreditId);
    setPaymentHistoryCreditId(null);
  };

  const handleReceiveMoney = () => {
    setShowReceiveMoney(true);
  };

  const handleBackFromReceiveMoney = () => {
    setShowReceiveMoney(false);
  };

  const handleCash = () => {
    setShowCash(true);
  };

  const handleBackFromCash = () => {
    setShowCash(false);
  };

  const handleTransfer = () => {
    setShowTransfer(true);
  };

  const handleBackFromTransfer = () => {
    setShowTransfer(false);
  };

  const handleCashTransaction = (type: 'withdraw' | 'deposit', amount: number) => {
    const result = addCashTransaction(type, amount, userState);
    
    if (result.success) {
      onRefresh();
      setShowCash(false);
      
      onAuditLog?.(
        `Cash ${type}`, 
        `₦${amount.toLocaleString()} ${type === 'withdraw' ? 'withdrawn from' : 'deposited to'} account`, 
        'transaction'
      );
    } else {
      onAuditLog?.(`Cash ${type} failed`, result.error || "Transaction failed", 'transaction');
      
      if (notificationsEnabled) {
        toast.error("Transaction failed", {
          description: result.error || "Please try again."
        });
      }
    }
  };

  const handleTransferSuccess = () => {
    onRefresh();
    setShowTransfer(false);
    onAuditLog?.("Money transfer completed", "Funds transferred to another account", 'transaction');
  };



  const handleCreditTabClick = (section: 'pending' | 'active') => {
    setActiveTab('credit');
    // Note: In a real app, we could pass the section to focus on
    // For now, just navigate to the credit tab
  };



  const handleApproveAllRequests = () => {
    const approvedCredits = approveAllPendingRequests(userState);
    
    // Create disbursement transactions for each approved credit
    approvedCredits.forEach(credit => {
      addLoanDisbursementTransaction(credit.id, credit.totalAmount, userState);
    });
    
    onRefresh();
    if (notificationsEnabled) {
      toast.success("All requests approved", {
        description: `${approvedCredits.length} pending requests have been approved and funds have been disbursed.`
      });
    }
  };

  const handleDeclineAllRequests = () => {
    const declinedCredits = declineAllPendingRequests(userState);
    onRefresh();
    if (notificationsEnabled) {
      toast.success("All requests declined", {
        description: `${declinedCredits.length} pending requests have been declined.`
      });
    }
  };

  const renderCurrentScreen = () => {

    // Show transfer screen if requested
    if (showTransfer) {
      return (
        <TransferScreen 
          onBack={handleBackFromTransfer}
          onTransferSuccess={handleTransferSuccess}
          userState={userState}
        />
      );
    }

    // Show cash screen if requested
    if (showCash) {
      return (
        <CashScreen 
          onBack={handleBackFromCash}
          onCashTransaction={handleCashTransaction}
          userState={userState}
          notificationsEnabled={notificationsEnabled}
        />
      );
    }

    // Show receive money screen if requested
    if (showReceiveMoney) {
      return (
        <ReceiveMoneyScreen 
          onBack={handleBackFromReceiveMoney}
        />
      );
    }

    // Show payment history if requested
    if (showPaymentHistory && paymentHistoryCreditId) {
      return (
        <PaymentHistoryScreen 
          creditId={paymentHistoryCreditId}
          onBack={handleBackFromPaymentHistory}
          onTransactionClick={handleTransactionClick}
          userState={userState}
        />
      );
    }

    // Show transaction details if a transaction is selected (prioritize over credit details)
    if (selectedTransactionId) {
      return (
        <TransactionDetailsScreen 
          transactionId={selectedTransactionId}
          onBack={handleBackFromTransactionDetails}
          onViewCredit={handleViewCreditFromTransaction}
          userState={userState}
        />
      );
    }

    // Show credit details if a credit is selected
    if (selectedCreditId) {
      return (
        <CreditDetailsScreen 
          creditId={selectedCreditId}
          onBack={handleBackFromCreditDetails}
          onViewTransaction={handleTransactionClick}
          onViewAllPayments={handleViewAllPayments}
          userState={userState}
          onPaymentSuccess={onRefresh}
          defaultTab={creditDetailsTab}
        />
      );
    }

    // Show transaction history if requested
    if (showTransactionHistory) {
      return (
        <TransactionHistoryScreen 
          onBack={handleBackFromTransactionHistory}
          onTransactionClick={handleTransactionClick}
          userState={userState}
        />
      );
    }

    // Show create request screen
    if (showCreateRequest) {
      return (
        <CreateRequestScreen 
          onBack={handleBackFromCreateRequest}
          onSubmit={handleSubmitRequest}
          userState={userState}
        />
      );
    }

    // Show main app screens
    switch (activeTab) {
      case 'home':
        return (
          <HomeScreen 
            key={refreshKey}
            userName="Segun" 
            onViewAllTransactions={handleViewAllTransactions}
            onTransactionClick={handleTransactionClick}
            onRequestCredit={handleCreateRequest}
            onReceiveMoney={handleReceiveMoney}
            onCash={handleCash}
            onTransfer={handleTransfer}
            onCreditTabClick={handleCreditTabClick}
            onCreditClick={handleCreditClickFromPaymentBanner}
            userState={userState}
          />
        );
      case 'credit':
        return (
          <CreditScreen 
            key={refreshKey}
            onCreateRequest={handleCreateRequest}
            onCreditClick={handleCreditClick}
            userState={userState}
          />
        );
      case 'wallet':
        return (
          <WalletScreen 
            key={refreshKey}
            onReceiveMoney={handleReceiveMoney}
            onCash={handleCash}
            onTransfer={handleTransfer}
            onViewAllTransactions={handleViewAllTransactions}
            onTransactionClick={handleTransactionClick}
            userState={userState}
            refreshKey={refreshKey}
            forceChartPeriod={forceChartPeriod}
            disableChartAnimations={disableChartAnimations}
          />
        );

      default:
        return (
          <HomeScreen 
            key={refreshKey}
            userName="Segun" 
            onViewAllTransactions={handleViewAllTransactions}
            onTransactionClick={handleTransactionClick}
            onRequestCredit={handleCreateRequest}
            onReceiveMoney={handleReceiveMoney}
            onCash={handleCash}
            onTransfer={handleTransfer}
            onCreditTabClick={handleCreditTabClick}
            onCreditClick={handleCreditClickFromPaymentBanner}
            userState={userState}
          />
        );
    }
  };

  return (
    <div className="bg-background w-full h-full relative flex flex-col">      
      <main className="flex-1 overflow-auto">
        {renderCurrentScreen()}
      </main>
      
      {!showCreateRequest && !showTransactionHistory && !selectedTransactionId && !selectedCreditId && !showPaymentHistory && !showReceiveMoney && !showCash && !showTransfer && (
        <BottomNav 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
        />
      )}
      
      <Toaster />
    </div>
  );
}

// Audit trail types
interface AuditEvent {
  id: string;
  timestamp: Date;
  event: string;
  details?: string;
  type: 'action' | 'transaction' | 'system' | 'pledger';
}

export default function App() {
  // Shared state management for both apps
  const [userState, setUserState] = useState<'fresh' | 'active'>('fresh');
  const [refreshKey, setRefreshKey] = useState(0);
  const [isPopulating, setIsPopulating] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  
  // Audit trail state
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [showAuditTrail, setShowAuditTrail] = useState(false);

  // Audit trail logging function
  const logAuditEvent = (event: string, details?: string, type: AuditEvent['type'] = 'action') => {
    const newEvent: AuditEvent = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      event,
      details,
      type
    };
    setAuditEvents(prev => [newEvent, ...prev].slice(0, 100)); // Keep last 100 events
  };

  // Initialize audit trail with welcome message
  useEffect(() => {
    logAuditEvent("Demo initialized", "Topos dual-app demo ready for presentation", 'system');
  }, []);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleUserStateChange = (state: 'fresh' | 'active') => {
    setUserState(state);
  };

  const handleResetToFreshUser = () => {
    setUserState('fresh');
    resetToFreshUser();
    resetTransactionsToFreshUser();
    resetPledgerActivitiesToFresh();
    
    // Clear audit trail
    setAuditEvents([]);
    logAuditEvent("Demo reset to fresh user", "All data cleared, audit trail reset", 'system');
    
    handleRefresh();
    if (notificationsEnabled) {
      toast.success("Reset to fresh user", {
        description: "All transaction history and credit products cleared."
      });
    }
  };

  const handleToggleNotifications = () => {
    setNotificationsEnabled(prev => !prev);
    if (!notificationsEnabled) {
      // Show a notification when turning notifications back on
      setTimeout(() => {
        toast.success("Notifications enabled", {
          description: "You will now see popup notifications again."
        });
      }, 100);
    }
  };

  const handlePopulateWithActivity = async () => {
    try {
      console.log('Starting progressive populate with activity...');
      
      // Log the start of population
      logAuditEvent("Starting activity population", "Building comprehensive transaction and loan history", 'system');
      
      // Set populating state to enable special UI mode
      setIsPopulating(true);
      
      // Give the UI a moment to update before starting the populate process
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Start the progressive build process
      await buildActivityHistoryProgressively(handleRefresh, notificationsEnabled);
      
      // Stay in fresh state - don't switch to active since we just populated fresh with all the data
      // The fresh user now has a full activity history and should look like an experienced user
      
      // Final refresh to ensure everything is up to date
      handleRefresh();
      
      // Log completion
      logAuditEvent("Activity population completed", "Full transaction history and loan data populated", 'system');
      
      console.log('Progressive activity population completed successfully');
      
    } catch (error) {
      console.error('Failed to populate activity:', error);
      logAuditEvent("Activity population failed", "Error occurred during data population", 'system');
      // Error handling is already done in the progressive function
    } finally {
      // Always clear populating state
      setIsPopulating(false);
    }
  };

  return (
    <div className="min-h-screen relative">


      {/* Left side - Pledger (Light background) */}
      <div className="absolute inset-y-0 left-0 right-1/2 bg-muted/20">
      </div>

      {/* Right side - Borrower (Dark background) */}
      <div className="absolute inset-y-0 left-1/2 right-0" style={{ backgroundColor: '#3f3d56' }}>
      </div>

      {/* Pledger Label - positioned above left phone */}
      <div className="absolute flex items-center justify-center z-10" style={{ right: '50%', marginRight: '120px', top: 'calc(50% - 428px)' }}>
        <div className="text-slate-600 tracking-wider text-lg font-bold">ABIMBOLA, PLEDGER</div>
      </div>

      {/* Borrower Label - positioned above right phone */}
      <div className="absolute flex items-center justify-center z-10" style={{ left: '50%', marginLeft: '120px', top: 'calc(50% - 428px)' }}>
        <div className="text-white tracking-wider text-lg font-bold">SEGUN, BORROWER</div>
      </div>

      {/* Pledger App - positioned absolutely 100px left of center */}
      <div className="absolute inset-y-0 flex items-center justify-center z-10" style={{ right: '50%', marginRight: '100px', transform: 'scale(0.9)' }}>
        <SmartphoneContainer>
          <PledgerApp 
            userState={userState}
            refreshKey={refreshKey}
            onRefresh={handleRefresh}
            forceTab={isPopulating ? 'wallet' : undefined}
            forceChartPeriod={isPopulating ? '3M' : undefined}
            disableChartAnimations={isPopulating}
            notificationsEnabled={notificationsEnabled}
            onAuditLog={logAuditEvent}
          />
        </SmartphoneContainer>
      </div>

      {/* Borrower App - positioned absolutely 100px right of center */}
      <div className="absolute inset-y-0 flex items-center justify-center z-10" style={{ left: '50%', marginLeft: '100px', transform: 'scale(0.9)' }}>
        <SmartphoneContainer borderColor="white">
          <BorrowerApp 
            userState={userState}
            refreshKey={refreshKey}
            onRefresh={handleRefresh}
            onUserStateChange={handleUserStateChange}
            forceTab={isPopulating ? 'wallet' : undefined}
            forceChartPeriod={isPopulating ? '3M' : undefined}
            disableChartAnimations={isPopulating}
            onPopulateStateChange={setIsPopulating}
            notificationsEnabled={notificationsEnabled}
            onAuditLog={logAuditEvent}
          />
        </SmartphoneContainer>
      </div>

      {/* Connector that goes behind/to the edge of phones */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <div className="relative flex items-center">
          {/* Dotted Line that extends to the phone frames */}
          <div 
            className="border-t-4 border-dashed" 
            style={{ 
              borderColor: '#e52a5b', 
              width: '240px', 
              marginLeft: '-120px',
              marginRight: '-120px'
            }}
          ></div>
        </div>
      </div>



      {/* Topos Logo - absolutely centered */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20">
        {/* Dark circle background */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full" style={{ backgroundColor: '#3f3d56' }}></div>
        {/* Logo */}
        <div className="relative w-20 h-20 flex items-center justify-center">
          <img 
            src={toposLogo} 
            alt="Topos Logo" 
            className="w-16 h-16 object-contain"
          />
        </div>
      </div>

      {/* Floating Action Buttons - Center Height Right */}
      <div className="fixed top-1/2 right-6 transform -translate-y-1/2 flex flex-col gap-4 z-30">
        {/* Reset to Fresh User Button */}
        <div className="group relative">
          <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-white/90 text-gray-600 px-3 py-2 rounded-lg shadow-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            Reset to fresh user
          </div>
          <Button
            onClick={handleResetToFreshUser}
            disabled={isPopulating}
            className="w-12 h-12 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 shadow-lg transition-all duration-200 disabled:opacity-50"
            variant="ghost"
          >
            <RotateCcw className="w-5 h-5" />
          </Button>
        </div>

        {/* Populate Activity Button */}
        <div className="group relative">
          <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-white/90 text-gray-600 px-3 py-2 rounded-lg shadow-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            Populate with activity
          </div>
          <Button
            onClick={handlePopulateWithActivity}
            disabled={isPopulating}
            className="w-12 h-12 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 shadow-lg transition-all duration-200 disabled:opacity-50"
            variant="ghost"
          >
            <Database className="w-5 h-5" />
          </Button>
        </div>

        {/* Toggle Notifications Button */}
        <div className="group relative">
          <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-white/90 text-gray-600 px-3 py-2 rounded-lg shadow-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            {notificationsEnabled ? 'Hide notifications' : 'Show notifications'}
          </div>
          <Button
            onClick={handleToggleNotifications}
            disabled={isPopulating}
            className="w-12 h-12 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 shadow-lg transition-all duration-200 disabled:opacity-50"
            variant="ghost"
          >
            {notificationsEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
          </Button>
        </div>

        {/* Toggle Audit Trail Button */}
        <div className="group relative">
          <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-white/90 text-gray-600 px-3 py-2 rounded-lg shadow-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            {showAuditTrail ? 'Hide audit trail' : 'Show audit trail'}
          </div>
          <Button
            onClick={() => {
              setShowAuditTrail(prev => !prev);
              logAuditEvent(
                showAuditTrail ? "Audit trail hidden" : "Audit trail shown", 
                "Demo presentation tool toggled", 
                'system'
              );
            }}
            disabled={isPopulating}
            className="w-12 h-12 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 shadow-lg transition-all duration-200 disabled:opacity-50"
            variant="ghost"
          >
            {showAuditTrail ? <ListX className="w-5 h-5" /> : <List className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Title - positioned below pledger phone with 10px additional distance */}
      <div className="absolute flex items-center justify-center z-10" style={{ right: '50%', marginRight: '120px', bottom: 'calc(50% - 438px)' }}>
        <div 
          className="text-slate-600 text-right font-bold tracking-wide"
          style={{ 
            fontSize: '1.25rem', // 2x the original disclaimer font size (0.625rem * 2)
            lineHeight: '1.3',
            width: 'fit-content'
          }}
        >
          TOPOS OFFSHORE COLLATERAL UX DEMO
        </div>
      </div>

      {/* Disclaimer - positioned below borrower phone with 10px additional distance */}
      <div className="absolute flex items-center justify-center z-10" style={{ left: '50%', marginLeft: '120px', bottom: 'calc(50% - 438px)' }}>
        <div 
          className="text-slate-400 text-left overflow-hidden"
          style={{ 
            fontSize: '0.625rem',
            lineHeight: '1.2',
            maxHeight: '2.4rem', // Exactly 2 lines (2 * 1.2rem line-height)
            width: 'fit-content',
            maxWidth: '550px', // Increased by 50px more to fully accommodate text
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical'
          }}
        >
          <strong>Showcase Only:</strong> This is not the real Topos product, only a demonstration of user flows. 
          All content, fees, and amounts are fictional. Actual product specifications depend heavily on specific market conditions and regulatory requirements.
        </div>
      </div>

      {/* Audit Trail */}
      <AuditTrail 
        events={auditEvents}
        isVisible={showAuditTrail}
      />
    </div>
  );
}