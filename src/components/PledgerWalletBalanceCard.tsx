import { Eye, EyeOff, Triangle } from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { getWalletBalance, getAvailableBalance, getLockedBalance, formatUSD } from "./data/wallet";
import { getPledgerActivitiesForUserState } from "./data/pledger-activity";

interface PledgerWalletBalanceCardProps {
  userState: 'fresh' | 'active';
  className?: string;
}

// Helper function to calculate balance from a week ago
const getWalletBalanceWeekAgo = (userState: 'fresh' | 'active'): number => {
  const activities = getPledgerActivitiesForUserState(userState);
  if (activities.length === 0) return 0;

  // Get current date and calculate one week ago
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  // Sort activities by date/time (most recent first)
  const sortedActivities = activities.sort((a, b) => {
    const dateA = new Date(`${a.date} ${a.time}`);
    const dateB = new Date(`${b.date} ${b.time}`);
    return dateB.getTime() - dateA.getTime();
  });

  // Find the balance a week ago by looking at wallet top-up activities
  // For simplicity, assume wallet started at 0 and track top-ups
  let balanceWeekAgo = 0;
  
  for (const activity of sortedActivities) {
    const activityDate = new Date(`${activity.date} ${activity.time}`);
    
    if (activityDate <= oneWeekAgo && activity.type === 'wallet_topup') {
      balanceWeekAgo += activity.amount;
    }
  }

  return balanceWeekAgo;
};

export function PledgerWalletBalanceCard({ userState, className }: PledgerWalletBalanceCardProps) {
  const [showBalance, setShowBalance] = useState(true);

  // Get wallet data
  const walletBalance = getWalletBalance();
  const lockedBalance = getLockedBalance();
  const availableBalance = getAvailableBalance();

  // Calculate balance change from last week
  const balanceWeekAgo = getWalletBalanceWeekAgo(userState);
  const balanceDelta = walletBalance - balanceWeekAgo;
  const hasIncrease = balanceDelta > 0;
  const hasDecrease = balanceDelta < 0;
  const noChange = balanceDelta === 0;

  return (
    <Card className={className}>
      <CardContent className={`pt-6 px-6 ${lockedBalance > 0 ? 'pb-6' : 'pb-4'}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-muted-foreground text-sm">Wallet Balance</p>
            <div className="flex items-center gap-2">
              <h2 className="text-3xl font-bold">
                {showBalance ? formatUSD(walletBalance) : "••••••"}
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

          </div>
        </div>
        
        {lockedBalance > 0 && showBalance && (
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div>
              <p className="text-muted-foreground text-sm">Available</p>
              <p className="text-lg font-semibold text-green-600">{formatUSD(availableBalance)}</p>
            </div>
            <div className="text-right">
              <p className="text-muted-foreground text-sm">Locked</p>
              <p className="text-lg font-semibold text-muted-foreground">{formatUSD(lockedBalance)}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}