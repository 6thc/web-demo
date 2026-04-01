import { ArrowUpRight, ArrowDownLeft, TrendingUp, CreditCard, Banknote, ArrowUp, ArrowDown, User } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { WalletBalanceCard } from "../WalletBalanceCard";
import { RecentActivityCard } from "../RecentActivityCard";
import { CreditCarousel } from "../CreditCarousel";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";

import { getTransactionsForUserState, formatCurrency, getAccountBalances } from "../data/transactions";
import { hasActiveLoans, getCreditsForUserState, getPendingCreditsForUserState } from "../data/credits";
import { toast } from "sonner@2.0.3";

interface HomeScreenProps {
  userName: string;
  onViewAllTransactions: () => void;
  onTransactionClick: (transactionId: string) => void;
  onRequestCredit?: () => void;
  onReceiveMoney?: () => void;
  onCash?: () => void;
  onTransfer?: () => void;
  onCreditTabClick: (section: 'pending' | 'active') => void;
  onCreditClick: (creditId: string) => void;
  userState: 'fresh' | 'active';
}

export function HomeScreen({ userName, onViewAllTransactions, onTransactionClick, onRequestCredit, onReceiveMoney, onCash, onTransfer, onCreditTabClick, onCreditClick, userState }: HomeScreenProps) {

  // Get credit data
  const allCredits = getCreditsForUserState(userState);
  const pendingCredits = getPendingCreditsForUserState(userState);
  const activeCredits = allCredits.filter(credit => credit.status === 'active');



  const handleProfileClick = () => {
    // Profile functionality could be added here
  };

  const handleTransferClick = () => {
    onTransfer?.();
  };

  const handleReceiveClick = () => {
    onReceiveMoney?.();
  };

  const handleCashClick = () => {
    onCash?.();
  };

  const handleRequestCreditClick = () => {
    onRequestCredit?.();
  };

  return (
    <div className="bg-muted/30 h-full pt-2 relative">
      {/* Topos Red Background - cuts off behind balance card */}
      <div className="absolute top-0 left-0 right-0 h-52 z-0" style={{ backgroundColor: '#E52A5B' }}></div>
      
      {/* Header */}
      <div className="px-4 pt-8 pb-4 relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-white">Topos</h1>
            <p className="text-white/80">Welcome back, Segun</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleProfileClick}
            className="h-12 w-12 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/20"
          >
            <User className="h-6 w-6 text-white" />
          </Button>
        </div>

        {/* Balance Card */}
        <WalletBalanceCard 
          userState={userState}
          className="bg-white/95 backdrop-blur-sm border-0 text-foreground shadow-lg relative z-10"
          onCreditClick={onCreditClick}
        />

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          <Button 
            variant="outline" 
            className="h-16 flex-col gap-1 text-xs"
            onClick={handleTransferClick}
          >
            <ArrowUpRight className="h-4 w-4" />
            Transfer
          </Button>
          <Button 
            variant="outline" 
            className="h-16 flex-col gap-1 text-xs"
            onClick={handleReceiveClick}
          >
            <ArrowDownLeft className="h-4 w-4" />
            Receive
          </Button>
          <Button 
            variant="outline" 
            className="h-16 flex-col gap-1 text-xs"
            onClick={handleCashClick}
          >
            <Banknote className="h-4 w-4" />
            Cash
          </Button>
        </div>

        {/* Credit Carousel - show if user has any credit activity */}
        {(activeCredits.length > 0 || pendingCredits.length > 0) ? (
          <CreditCarousel 
            credits={[...pendingCredits, ...activeCredits]}
            onCreditClick={onCreditClick}
            onNavigateToCredit={() => {
              // Navigate to the most relevant section
              if (pendingCredits.length > 0) {
                onCreditTabClick('pending');
              } else {
                onCreditTabClick('active');
              }
            }}
          />
        ) : null}
      </div>

      {/* Recent Transactions */}
      <div className="px-4 relative z-10 pb-6">
        <RecentActivityCard 
          onViewAllTransactions={onViewAllTransactions}
          onTransactionClick={onTransactionClick}
          userState={userState}
        />
      </div>


    </div>
  );
}