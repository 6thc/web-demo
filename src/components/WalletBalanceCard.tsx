import { Eye, EyeOff, Triangle, Calendar, Clock } from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { formatCurrency, getTransactionsForUserState } from "./data/transactions";
import { hasActiveLoans, getCreditsForUserState, formatCurrency as formatCreditCurrency } from "./data/credits";

interface WalletBalanceCardProps {
  userState: 'fresh' | 'active';
  className?: string;
  onCreditClick?: (creditId: string) => void;
}

// Helper function to calculate balance from a week ago
const getBalanceWeekAgo = (userState: 'fresh' | 'active'): number => {
  const transactions = getTransactionsForUserState(userState);
  if (transactions.length === 0) return 0;

  // Get current date and calculate one week ago
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  // Sort transactions by date/time (most recent first)
  const sortedTransactions = transactions.sort((a, b) => {
    const dateA = new Date(`${a.date} ${a.time}`);
    const dateB = new Date(`${b.date} ${b.time}`);
    return dateB.getTime() - dateA.getTime();
  });

  // Find the first transaction that occurred after one week ago
  // The balance before that transaction would be the balance a week ago
  for (let i = 0; i < sortedTransactions.length; i++) {
    const transactionDate = new Date(`${sortedTransactions[i].date} ${sortedTransactions[i].time}`);
    
    if (transactionDate <= oneWeekAgo) {
      // If we have a next transaction (chronologically before this one)
      if (i < sortedTransactions.length - 1) {
        return sortedTransactions[i].balanceAfter || 0;
      } else {
        // This is the oldest transaction, use its balance after
        return sortedTransactions[i].balanceAfter || 0;
      }
    }
  }

  // If no transactions are older than a week, use the oldest transaction's balance
  if (sortedTransactions.length > 0) {
    return sortedTransactions[sortedTransactions.length - 1].balanceAfter || 0;
  }

  return 0;
};

export function WalletBalanceCard({ userState, className, onCreditClick }: WalletBalanceCardProps) {
  const [showBalance, setShowBalance] = useState(true);

  // Account balances and credit information
  const hasLoans = hasActiveLoans(userState);
  const allCredits = getCreditsForUserState(userState);
  const activeCredits = allCredits.filter(credit => credit.status === 'active');
  const firstActiveCredit = activeCredits.length > 0 ? activeCredits[0] : null;
  
  // Get checking balance from transactions (most recent transaction's balanceAfter)
  const transactions = getTransactionsForUserState(userState);
  const checkingBalance = transactions.length > 0 ? 
    transactions.sort((a, b) => {
      const dateA = new Date(`${a.date} ${a.time}`);
      const dateB = new Date(`${b.date} ${b.time}`);
      return dateB.getTime() - dateA.getTime();
    })[0].balanceAfter || 0 : 0;

  // Calculate balance change from last week
  const balanceWeekAgo = getBalanceWeekAgo(userState);
  const balanceDelta = checkingBalance - balanceWeekAgo;
  const hasIncrease = balanceDelta > 0;
  const hasDecrease = balanceDelta < 0;
  const noChange = balanceDelta === 0;

  return (
    <Card className={className}>
      <CardContent className={`pt-6 px-6 ${hasLoans ? 'pb-0' : 'pb-4'}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-muted-foreground text-sm">Checking Balance</p>
            <div className="flex items-center gap-2">
              <h2 className="text-3xl font-bold">
                {showBalance ? formatCurrency(checkingBalance) : "••••••"}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBalance(!showBalance)}
                className="text-muted-foreground hover:text-foreground hover:bg-muted/50 h-8 w-8 p-0"
              >
                {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            
            {/* Balance Delta Tracker */}
            <div className="flex items-center gap-1 mt-1">
              {hasIncrease && (
                <>
                  <Triangle className="h-3 w-3 text-accent fill-current" />
                  <span className="text-xs text-muted-foreground font-medium">
                    +{formatCurrency(Math.abs(balanceDelta))} since last week
                  </span>
                </>
              )}
              {hasDecrease && (
                <>
                  <Triangle className="h-3 w-3 text-destructive fill-current rotate-180" />
                  <span className="text-xs text-muted-foreground font-medium">
                    -{formatCurrency(Math.abs(balanceDelta))} since last week
                  </span>
                </>
              )}
              {noChange && (
                <>
                  <div className="h-3 w-3 flex items-center justify-center">
                    <div className="w-2 h-0.5 bg-muted-foreground rounded-full"></div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    No change since last week
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        
        {hasLoans && firstActiveCredit && (
          <div 
            className="pt-4 border-t border-border mt-4 -mx-6 -mb-6 px-4 py-4 cursor-pointer hover:bg-primary/5 transition-colors rounded-b-lg"
            style={{ backgroundColor: '#E52A5B' }}
            onClick={() => onCreditClick?.(firstActiveCredit.id)}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-white text-sm">Next Payment Due</p>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-white/80" />
                    <span className="text-xs text-white/80">{firstActiveCredit.nextPayment}</span>
                  </div>
                </div>
              </div>
              <div className="text-right flex flex-col justify-center">
                <p className="font-semibold text-white">{formatCreditCurrency(firstActiveCredit.monthlyPayment)}</p>
                <p className="text-xs text-white/80">Payment amount</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}