import { useState, useEffect } from "react";
import { BottomNav } from "./BottomNav";
import { HomeScreen } from "./screens/HomeScreen";
import { CreditScreen } from "./screens/CreditScreen";
import { CreateRequestScreen } from "./screens/CreateRequestScreen";
import { TransactionHistoryScreen } from "./screens/TransactionHistoryScreen";
import { TransactionDetailsScreen } from "./screens/TransactionDetailsScreen";
import { CreditDetailsScreen } from "./screens/CreditDetailsScreen";
import { PaymentHistoryScreen } from "./screens/PaymentHistoryScreen";
import { ReceiveMoneyScreen } from "./screens/ReceiveMoneyScreen";
import { CashScreen } from "./screens/CashScreen";
import { WalletScreen } from "./screens/WalletScreen";
import { TransferScreen } from "./screens/TransferScreen";
import { DefaultNoticeScreen } from "./screens/DefaultNoticeScreen";
import { Toaster } from "./ui/sonner";
import { toast } from "sonner@2.0.3";
import { approveAllPendingRequests, declineAllPendingRequests } from "./data/credits";
import { addLoanDisbursementTransaction, addCashTransaction } from "./data/transactions";

export interface BorrowerAppProps {
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

export function BorrowerApp({ userState, refreshKey, onRefresh, onUserStateChange, forceTab, forceChartPeriod, disableChartAnimations, onPopulateStateChange, notificationsEnabled = true, onAuditLog }: BorrowerAppProps) {
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
  const [showDefaultNotice, setShowDefaultNotice] = useState(false);
  const [defaultNoticeCreditId, setDefaultNoticeCreditId] = useState<string | null>(null);

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

  const handleDefaultNotice = (creditId: string) => {
    setDefaultNoticeCreditId(creditId);
    setShowDefaultNotice(true);
    setSelectedCreditId(null);
  };

  const handleBackFromDefaultNotice = () => {
    setShowDefaultNotice(false);
    setSelectedCreditId(defaultNoticeCreditId);
    setDefaultNoticeCreditId(null);
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
  };

  const handleApproveAllRequests = () => {
    const approvedCredits = approveAllPendingRequests(userState);

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
    if (showTransfer) {
      return (
        <TransferScreen
          onBack={handleBackFromTransfer}
          onTransferSuccess={handleTransferSuccess}
          userState={userState}
        />
      );
    }

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

    if (showReceiveMoney) {
      return (
        <ReceiveMoneyScreen
          onBack={handleBackFromReceiveMoney}
        />
      );
    }

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

    if (showDefaultNotice && defaultNoticeCreditId) {
      return (
        <DefaultNoticeScreen
          creditId={defaultNoticeCreditId}
          onBack={handleBackFromDefaultNotice}
          userState={userState}
        />
      );
    }

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
          onDefaultNotice={handleDefaultNotice}
        />
      );
    }

    if (showTransactionHistory) {
      return (
        <TransactionHistoryScreen
          onBack={handleBackFromTransactionHistory}
          onTransactionClick={handleTransactionClick}
          userState={userState}
        />
      );
    }

    if (showCreateRequest) {
      return (
        <CreateRequestScreen
          onBack={handleBackFromCreateRequest}
          onSubmit={handleSubmitRequest}
          userState={userState}
        />
      );
    }

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

      {!showCreateRequest && !showTransactionHistory && !selectedTransactionId && !selectedCreditId && !showPaymentHistory && !showReceiveMoney && !showCash && !showTransfer && !showDefaultNotice && (
        <BottomNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      )}

      <Toaster />
    </div>
  );
}
