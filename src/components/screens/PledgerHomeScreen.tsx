import { User, Shield, Banknote, AlertCircle, Plus, Minus, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { PledgerWalletBalanceCard } from "../PledgerWalletBalanceCard";
import { PledgerRecentActivityCard } from "../PledgerRecentActivityCard";
import { PledgeCarousel } from "../PledgeCarousel";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { getCreditsForUserState } from "../data/credits";
import { getWalletBalance, getLockedBalance, getAvailableBalance, formatUSD } from "../data/wallet";
import { getRecentPledgerActivities, getActivityIconType, getActivityDisplayAmount } from "../data/pledger-activity";

interface PledgerHomeScreenProps {
  userName?: string;
  userState: 'fresh' | 'active';
  refreshKey: number;
  onTopUp?: () => void;
  onWithdraw?: () => void;
  onRequestClick?: (creditId: string) => void;
  onActivityClick?: (activityId: string) => void;
  onViewAllActivities?: () => void;
  onNavigateToPledges?: () => void;
}

export function PledgerHomeScreen({ userName = "Abimbola", userState, refreshKey, onTopUp, onWithdraw, onRequestClick, onActivityClick, onViewAllActivities, onNavigateToPledges }: PledgerHomeScreenProps) {
  // Get actual credits data - filter for pending requests and active loans
  const allCredits = getCreditsForUserState(userState);
  
  const pendingRequests = allCredits.filter(credit => credit.status === 'pending' || credit.status === 'reviewing').map(credit => ({
    id: credit.id,
    borrowerName: "Segun Adebayo", // In real app, this would come from borrower profile
    amount: credit.totalAmountUSD || credit.totalAmount,
    currency: "USD",
    purpose: credit.purpose,
    requestDate: credit.submittedDate || "Today",
    status: credit.status,
    term: credit.term
  }));

  const activeLoans = allCredits.filter(credit => credit.status === 'active').map(credit => ({
    id: credit.id,
    borrowerName: "Segun Adebayo", // In real app, this would come from borrower profile  
    amount: credit.totalAmountUSD || credit.totalAmount,
    currency: "USD",
    collateralAmount: Math.round((credit.totalAmountUSD || credit.totalAmount) * 1.2), // 120% collateral
    status: credit.status,
    nextPayment: credit.nextPayment || "2024-02-01",
    purpose: credit.purpose,
    term: credit.term,
    remainingAmount: credit.remainingUSD || credit.remaining,
    totalAmount: credit.totalAmountUSD || credit.totalAmount
  }));

  // Combine all pledges for the carousel
  const allPledges = [
    ...pendingRequests,
    ...activeLoans
  ].sort((a, b) => {
    // Sort pending first, then active
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (b.status === 'pending' && a.status !== 'pending') return 1;
    return 0;
  });

  // Calculate totals
  const totalCollateralLocked = getLockedBalance(); // Use actual locked balance
  const walletBalance = getWalletBalance(userState);



  return (
    <div className="bg-muted/30 h-full pt-2 relative">
      {/* Dark Grey Background - cuts off behind wallet card */}
      <div className="absolute top-0 left-0 right-0 h-52 z-0" style={{ backgroundColor: '#3f3d56' }}></div>
      
      {/* Header */}
      <div className="px-4 pt-8 pb-4 relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-white">Topos</h1>
            <p className="text-white/80">Welcome back, {userName}</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            className="h-12 w-12 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/20"
          >
            <User className="h-6 w-6 text-white" />
          </Button>
        </div>

        {/* Wallet Balance Card */}
        <PledgerWalletBalanceCard 
          userState={userState}
          className="bg-white/95 backdrop-blur-sm border-0 text-foreground shadow-lg relative z-10"
        />

        {/* Wallet Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          <Button
            variant="outline"
            className="h-16 flex-col gap-1 text-xs"
            onClick={onTopUp}
          >
            <ArrowDownLeft className="h-4 w-4" />
            Top Up
          </Button>
          <Button
            variant="outline"
            className="h-16 flex-col gap-1 text-xs"
            onClick={onWithdraw}
            disabled={walletBalance === 0}
          >
            <ArrowUpRight className="h-4 w-4" />
            Withdraw
          </Button>
        </div>

        {/* Pledges Carousel */}
        <PledgeCarousel 
          pledges={allPledges}
          onPledgeClick={onRequestClick}
          onNavigateToPledges={onNavigateToPledges}
        />
      </div>

      {/* Recent Activity */}
      <div className="px-4 relative z-10 pb-6">
        <PledgerRecentActivityCard 
          onViewAllActivities={onViewAllActivities}
          onActivityClick={onActivityClick}
          userState={userState}
          maxItems={5}
        />
      </div>
    </div>
  );
}