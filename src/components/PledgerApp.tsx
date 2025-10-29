import { useState, useEffect } from "react";
import { PledgerHomeScreen } from "./screens/PledgerHomeScreen";
import { PledgesScreen } from "./screens/PledgesScreen";
import { PledgerWalletScreen } from "./screens/PledgerWalletScreen";
import { PledgerRequestDetailsScreen } from "./screens/PledgerRequestDetailsScreen";
import { PledgerTransactionHistoryScreen } from "./screens/PledgerTransactionHistoryScreen";
import { TopUpScreen } from "./screens/TopUpScreen";
import { WithdrawScreen } from "./screens/WithdrawScreen";
import { PledgerActivityDetailsScreen } from "./screens/PledgerActivityDetailsScreen";
import { PledgerBottomNav } from "./PledgerBottomNav";
import { Toaster } from "./ui/sonner";
import { toast } from "sonner@2.0.3";
import { initializeFreshWallet, initializeActiveWallet } from "./data/wallet";
import { resetPledgerActivitiesToFresh, resetPledgerActivitiesToActive } from "./data/pledger-activity";

interface PledgerAppProps {
  userState: 'fresh' | 'active';
  refreshKey: number;
  onRefresh: () => void;
  forceTab?: string;
  forceChartPeriod?: '1W' | '1M' | '3M' | 'YTD' | '1Y';
  disableChartAnimations?: boolean;
  notificationsEnabled?: boolean;
  onAuditLog?: (event: string, details?: string, type?: 'action' | 'transaction' | 'system' | 'pledger') => void;
}

export function PledgerApp({ userState, refreshKey, onRefresh, forceTab, forceChartPeriod, disableChartAnimations, notificationsEnabled = true, onAuditLog }: PledgerAppProps) {
  const [activeTab, setActiveTab] = useState('home');
  
  // Update active tab when forceTab changes
  useEffect(() => {
    if (forceTab) {
      setActiveTab(forceTab);
    }
  }, [forceTab]);
  const [showTopUp, setShowTopUp] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showActivityHistory, setShowActivityHistory] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [localRefreshKey, setLocalRefreshKey] = useState(0);

  // Initialize wallet state when userState changes
  useEffect(() => {
    if (userState === 'fresh') {
      initializeFreshWallet();
      resetPledgerActivitiesToFresh();
    } else {
      initializeActiveWallet();
      resetPledgerActivitiesToActive();
    }
    // Trigger a local refresh to update the UI with new wallet state
    setLocalRefreshKey(prev => prev + 1);
  }, [userState]);

  const handleTopUp = () => {
    setShowTopUp(true);
  };

  const handleBackFromTopUp = () => {
    setShowTopUp(false);
  };

  const handleTopUpSuccess = () => {
    setShowTopUp(false);
    setLocalRefreshKey(prev => prev + 1);
    // Refresh both apps to sync wallet state
    onRefresh();
    onAuditLog?.("Pledger wallet topped up", "USD funds added to pledger wallet", 'pledger');
  };

  const handleWithdraw = () => {
    setShowWithdraw(true);
  };

  const handleBackFromWithdraw = () => {
    setShowWithdraw(false);
  };

  const handleWithdrawSuccess = () => {
    setShowWithdraw(false);
    setLocalRefreshKey(prev => prev + 1);
    // Refresh both apps to sync wallet state
    onRefresh();
    onAuditLog?.("Pledger withdrawal completed", "USD funds withdrawn from pledger wallet", 'pledger');
  };

  const handleRequestClick = (creditId: string) => {
    setSelectedRequestId(creditId);
  };

  const handleBackFromRequestDetails = () => {
    setSelectedRequestId(null);
  };

  const handleRequestApproved = () => {
    setSelectedRequestId(null);
    setLocalRefreshKey(prev => prev + 1);
    // Refresh both apps so borrower sees immediate update
    onRefresh();
    onAuditLog?.("Pledger approved loan request", "Collateral locked, loan funds will be disbursed", 'pledger');
  };

  const handleRequestDeclined = () => {
    setSelectedRequestId(null);
    setLocalRefreshKey(prev => prev + 1);
    // Refresh both apps so borrower sees immediate update
    onRefresh();
    onAuditLog?.("Pledger declined loan request", "Request rejected, no collateral locked", 'pledger');
  };

  const handleActivityClick = (activityId: string) => {
    setSelectedActivityId(activityId);
  };

  const handleViewPledgeFromActivity = (creditId: string) => {
    setSelectedActivityId(null);
    setSelectedRequestId(creditId);
  };

  const handleBackFromActivityDetails = () => {
    setSelectedActivityId(null);
  };

  const handleViewAllActivities = () => {
    setActiveTab('wallet');
    // Scroll to activity section after a short delay to allow tab change
    setTimeout(() => {
      const activityElement = document.querySelector('[data-activity-section]');
      if (activityElement) {
        activityElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleBackFromActivityHistory = () => {
    setShowActivityHistory(false);
  };

  const handleSettings = () => {
    if (notificationsEnabled) {
      toast.info("Settings", {
        description: "Settings management coming soon."
      });
    }
  };

  const renderCurrentScreen = () => {
    // Show activity details if an activity is selected (prioritize over activity history)
    if (selectedActivityId) {
      return (
        <PledgerActivityDetailsScreen 
          activityId={selectedActivityId}
          onBack={handleBackFromActivityDetails}
          onViewPledge={handleViewPledgeFromActivity}
          userState={userState}
        />
      );
    }

    // Show activity history if requested
    if (showActivityHistory) {
      return (
        <PledgerTransactionHistoryScreen 
          onBack={handleBackFromActivityHistory}
          onActivityClick={handleActivityClick}
          userState={userState}
        />
      );
    }

    // Show request details if a request is selected
    if (selectedRequestId) {
      return (
        <PledgerRequestDetailsScreen 
          creditId={selectedRequestId}
          onBack={handleBackFromRequestDetails}
          onApproved={handleRequestApproved}
          onDeclined={handleRequestDeclined}
          onActivityClick={handleActivityClick}
          userState={userState}
          notificationsEnabled={notificationsEnabled}
        />
      );
    }

    // Show top up screen if requested
    if (showTopUp) {
      return (
        <TopUpScreen 
          onBack={handleBackFromTopUp}
          onSuccess={handleTopUpSuccess}
          userState={userState}
          notificationsEnabled={notificationsEnabled}
        />
      );
    }

    // Show withdraw screen if requested
    if (showWithdraw) {
      return (
        <WithdrawScreen 
          onBack={handleBackFromWithdraw}
          onSuccess={handleWithdrawSuccess}
          userState={userState}
          notificationsEnabled={notificationsEnabled}
        />
      );
    }

    switch (activeTab) {
      case 'home':
        return (
          <PledgerHomeScreen 
            key={`${refreshKey}-${localRefreshKey}`}
            userName="Abimbola" 
            userState={userState}
            refreshKey={refreshKey}
            onTopUp={handleTopUp}
            onWithdraw={handleWithdraw}
            onRequestClick={handleRequestClick}
            onActivityClick={handleActivityClick}
            onViewAllActivities={handleViewAllActivities}
            onNavigateToPledges={() => setActiveTab('pledges')}
          />
        );
      case 'wallet':
        return (
          <PledgerWalletScreen 
            key={`${refreshKey}-${localRefreshKey}`}
            onTopUp={handleTopUp}
            onWithdraw={handleWithdraw}
            onActivityClick={handleActivityClick}
            onViewAllActivities={handleViewAllActivities}
            userState={userState}
            refreshKey={refreshKey}
            forceChartPeriod={forceChartPeriod}
            disableChartAnimations={disableChartAnimations}
            notificationsEnabled={notificationsEnabled}
          />
        );
      case 'pledges':
        return (
          <PledgesScreen 
            key={refreshKey}
            userState={userState}
            refreshKey={refreshKey}
            onRequestClick={handleRequestClick}
            onSettings={handleSettings}
          />
        );
      default:
        return (
          <PledgerHomeScreen 
            key={`${refreshKey}-${localRefreshKey}`}
            userName="Abimbola" 
            userState={userState}
            refreshKey={refreshKey}
            onTopUp={handleTopUp}
            onWithdraw={handleWithdraw}
            onRequestClick={handleRequestClick}
            onActivityClick={handleActivityClick}
            onViewAllActivities={handleViewAllActivities}
            onNavigateToPledges={() => setActiveTab('pledges')}
          />
        );
    }
  };

  return (
    <div className="bg-background w-full h-full relative flex flex-col">      
      <main className="flex-1 overflow-auto">
        {renderCurrentScreen()}
      </main>
      
      {!showTopUp && !showWithdraw && !showActivityHistory && !selectedRequestId && !selectedActivityId && (
        <PledgerBottomNav 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
        />
      )}
      
      <Toaster />
    </div>
  );
}