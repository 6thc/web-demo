import { useState, useMemo, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { getTransactionsForUserState, formatCurrency, getCurrentBalance } from "./data/transactions";
import { getPledgerActivitiesForUserState, formatCurrency as formatUSDCurrency, getActivityIconType } from "./data/pledger-activity";
import { getWalletBalance, getLockedBalance } from "./data/wallet";

interface BalanceChartProps {
  userState: 'fresh' | 'active';
  type: 'borrower' | 'pledger';
  className?: string;
  refreshKey?: number;
  disableAnimations?: boolean;
  defaultPeriod?: TimePeriod;
}

type TimePeriod = '1W' | '1M' | '3M' | 'YTD' | '1Y';

interface BorrowerChartDataPoint {
  date: string;
  balance: number;
  displayDate: string;
}

interface PledgerChartDataPoint {
  date: string;
  availableBalance: number;
  lockedBalance: number;
  displayDate: string;
}

export function BalanceChart({ userState, type, className, refreshKey, disableAnimations = false, defaultPeriod = '3M' }: BalanceChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>(defaultPeriod);

  // Update period when defaultPeriod changes
  useEffect(() => {
    if (defaultPeriod) {
      setSelectedPeriod(defaultPeriod);
    }
    // Note: When defaultPeriod becomes undefined, we keep the current selectedPeriod
    // This allows the chart to stay at the forced period (like 3M) after populate finishes
  }, [defaultPeriod]);

  const periods: TimePeriod[] = ['1W', '1M', '3M', 'YTD', '1Y'];

  const chartData = useMemo(() => {
    const now = new Date();
    let startDate: Date;

    // Calculate start date based on selected period
    switch (selectedPeriod) {
      case '1W':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '1M':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case '3M':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      case 'YTD':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case '1Y':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
    }

    if (type === 'borrower') {
      // Borrower logic - use fixed time scale and only track balance-affecting transactions
      const transactions = getTransactionsForUserState(userState);
      const currentBalance = getCurrentBalance(userState);
      
      // Filter to only transactions that affect account balance
      // All transactions in our system affect balance, but we could filter categories if needed
      const balanceTransactions = transactions.filter(transaction => {
        // Include all transaction categories that affect account balance:
        // cash (deposits/withdrawals), loan (disbursements/repayments), transfer
        return ['cash', 'loan', 'transfer', 'salary', 'bills', 'other'].includes(transaction.category);
      });
      
      // Sort all balance transactions by date (oldest first)
      const sortedTransactions = [...balanceTransactions].sort((a, b) => {
        const dateA = new Date(`${a.date} ${a.time}`);
        const dateB = new Date(`${b.date} ${b.time}`);
        return dateA.getTime() - dateB.getTime();
      });

      // Generate fixed time intervals for the chart
      const dataPoints: BorrowerChartDataPoint[] = [];
      let numberOfPoints: number;
      
      switch (selectedPeriod) {
        case '1W':
          numberOfPoints = 7; // Daily points
          break;
        case '1M':
          numberOfPoints = 10; // ~3-day intervals
          break;
        case '3M':
          numberOfPoints = 12; // Weekly intervals
          break;
        case 'YTD':
        case '1Y':
          numberOfPoints = 12; // Monthly intervals
          break;
      }
      
      // Create fixed time intervals
      const timeInterval = (now.getTime() - startDate.getTime()) / (numberOfPoints - 1);
      
      for (let i = 0; i < numberOfPoints; i++) {
        const pointDate = new Date(startDate.getTime() + (i * timeInterval));
        
        // Calculate balance at this point in time by processing all transactions up to this date
        let balance = 0;
        
        for (const transaction of sortedTransactions) {
          const transactionDate = new Date(`${transaction.date} ${transaction.time}`);
          
          // Only process transactions that occurred before or at this point
          if (transactionDate <= pointDate) {
            balance += transaction.amount; // amount is already signed (positive for credit, negative for debit)
          }
        }
        
        // Ensure balance doesn't go below zero (though it can in real scenarios)
        balance = Math.max(0, balance);
        
        dataPoints.push({
          date: pointDate.toISOString(),
          balance: balance,
          displayDate: formatDateForChart(pointDate, selectedPeriod)
        });
      }
      
      // Ensure the last point matches current actual balance
      if (dataPoints.length > 0) {
        dataPoints[dataPoints.length - 1] = {
          ...dataPoints[dataPoints.length - 1],
          balance: currentBalance,
          displayDate: formatDateForChart(now, selectedPeriod)
        };
      }

      return { type: 'borrower' as const, data: dataPoints, currentBalance: currentBalance };

    } else {
      // Pledger logic - use fixed time scale and only track wallet-impacting activities
      const activities = getPledgerActivitiesForUserState(userState);
      const currentWalletBalance = getWalletBalance();
      const currentLockedBalance = getLockedBalance();
      
      // Filter to only activities that impact pledger wallet balances
      const walletActivities = activities.filter(activity => {
        return ['wallet_topup', 'wallet_withdrawal', 'collateral_locked', 'collateral_released'].includes(activity.type);
      });
      
      // Sort all wallet activities by date (oldest first)
      const sortedActivities = [...walletActivities].sort((a, b) => {
        const dateA = new Date(`${a.date} ${a.time}`);
        const dateB = new Date(`${b.date} ${b.time}`);
        return dateA.getTime() - dateB.getTime();
      });

      // Generate fixed time intervals for the chart
      const dataPoints: PledgerChartDataPoint[] = [];
      let numberOfPoints: number;
      
      switch (selectedPeriod) {
        case '1W':
          numberOfPoints = 7; // Daily points
          break;
        case '1M':
          numberOfPoints = 10; // ~3-day intervals
          break;
        case '3M':
          numberOfPoints = 12; // Weekly intervals
          break;
        case 'YTD':
        case '1Y':
          numberOfPoints = 12; // Monthly intervals
          break;
      }
      
      // Create fixed time intervals
      const timeInterval = (now.getTime() - startDate.getTime()) / (numberOfPoints - 1);
      
      for (let i = 0; i < numberOfPoints; i++) {
        const pointDate = new Date(startDate.getTime() + (i * timeInterval));
        
        // Calculate balances at this point in time by processing all activities up to this date
        let totalBalance = 0;
        let lockedBalance = 0;
        
        for (const activity of sortedActivities) {
          const activityDate = new Date(`${activity.date} ${activity.time}`);
          
          // Only process activities that occurred before or at this point
          if (activityDate <= pointDate && activity.amount) {
            if (activity.type === 'wallet_topup') {
              totalBalance += activity.amount;
            } else if (activity.type === 'wallet_withdrawal') {
              totalBalance -= activity.amount;
            } else if (activity.type === 'collateral_locked') {
              // Move from available to locked (total stays same, locked increases)
              lockedBalance += activity.amount;
            } else if (activity.type === 'collateral_released') {
              // Move from locked to available (total stays same, locked decreases)
              lockedBalance -= activity.amount;
            }
          }
        }
        
        // Ensure locked balance doesn't exceed total balance
        lockedBalance = Math.min(lockedBalance, Math.max(0, totalBalance));
        lockedBalance = Math.max(0, lockedBalance);
        totalBalance = Math.max(0, totalBalance);
        
        dataPoints.push({
          date: pointDate.toISOString(),
          availableBalance: Math.max(0, totalBalance - lockedBalance),
          lockedBalance: lockedBalance,
          displayDate: formatDateForChart(pointDate, selectedPeriod)
        });
      }
      
      // Ensure the last point matches current actual balances
      if (dataPoints.length > 0) {
        dataPoints[dataPoints.length - 1] = {
          ...dataPoints[dataPoints.length - 1],
          availableBalance: Math.max(0, currentWalletBalance - currentLockedBalance),
          lockedBalance: currentLockedBalance,
          displayDate: formatDateForChart(now, selectedPeriod)
        };
      }

      return { 
        type: 'pledger' as const, 
        data: dataPoints, 
        currentWalletBalance,
        currentLockedBalance 
      };
    }
  }, [userState, type, selectedPeriod, refreshKey]);

  // Format currency based on type
  const formatAmount = type === 'borrower' ? formatCurrency : formatUSDCurrency;

  // Calculate reference lines for y-axis
  const referenceLines = useMemo(() => {
    if (chartData.data.length === 0) return [];
    
    if (chartData.type === 'borrower') {
      const balances = chartData.data.map(d => d.balance);
      const minValue = Math.min(...balances);
      const maxValue = Math.max(...balances);
      return calculateReferenceLines(minValue, maxValue);
    } else {
      const availableBalances = chartData.data.map(d => d.availableBalance);
      const lockedBalances = chartData.data.map(d => d.lockedBalance);
      const allValues = [...availableBalances, ...lockedBalances];
      const minValue = Math.min(...allValues);
      const maxValue = Math.max(...allValues);
      return calculateReferenceLines(minValue, maxValue);
    }
  }, [chartData]);

  // Helper function to format compact numbers for chart labels
  const formatCompactAmount = (num: number): string => {
    const currencySymbol = type === 'borrower' ? '₦' : '$';
    const absNum = Math.abs(num);
    
    if (absNum >= 1000000) {
      const millions = absNum / 1000000;
      const formattedMillions = millions >= 10 ? Math.round(millions) : Math.round(millions * 10) / 10;
      return currencySymbol + formattedMillions + 'M';
    } else if (absNum >= 1000) {
      const thousands = absNum / 1000;
      const formattedThousands = thousands >= 10 ? Math.round(thousands) : Math.round(thousands * 10) / 10;
      return currencySymbol + formattedThousands + 'k';
    } else {
      return currencySymbol + Math.round(absNum);
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <CardTitle>Balance Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        {chartData.type === 'borrower' ? (
          <div className="grid grid-cols-1 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <p className="text-sm text-muted-foreground">Current Balance</p>
              </div>
              <p className="font-semibold text-primary">{formatAmount(chartData.currentBalance)}</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <p className="text-sm text-muted-foreground">Available</p>
              </div>
              <p className="font-semibold text-primary">{formatAmount(Math.max(0, chartData.currentWalletBalance - chartData.currentLockedBalance))}</p>
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-accent rounded-full"></div>
                <p className="text-sm text-muted-foreground">Locked</p>
              </div>
              <p className="font-semibold text-accent">{formatAmount(chartData.currentLockedBalance)}</p>
            </div>
          </div>
        )}

        {/* Chart */}
        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData.data} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
              <XAxis 
                dataKey="displayDate" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
                interval={selectedPeriod === '3M' ? 2 : selectedPeriod === '1Y' || selectedPeriod === 'YTD' ? 2 : 'preserveStartEnd'}
                minTickGap={20}
              />
              <YAxis hide />
              
              {/* Reference lines for y-axis scale */}
              {referenceLines.map((value) => (
                <ReferenceLine 
                  key={value}
                  y={value} 
                  stroke="var(--color-muted-foreground)" 
                  strokeOpacity={0.2}
                  strokeWidth={1}
                  strokeDasharray="2 2"
                />
              ))}
              
              {chartData.type === 'borrower' ? (
                <Area 
                  type="monotone" 
                  dataKey="balance" 
                  stroke="var(--color-primary)" 
                  strokeWidth={3}
                  fill="var(--color-primary)"
                  fillOpacity={0.1}
                  dot={{ r: 4, fill: 'var(--color-primary)', strokeWidth: 0 }}
                  activeDot={{ 
                    r: 6, 
                    fill: 'var(--color-primary)',
                    stroke: 'var(--color-background)',
                    strokeWidth: 2
                  }}
                  animationDuration={disableAnimations ? 0 : 1500}
                  isAnimationActive={!disableAnimations}
                />
              ) : (
                <>
                  <Area 
                    type="monotone" 
                    dataKey="availableBalance" 
                    stroke="var(--color-primary)" 
                    strokeWidth={3}
                    fill="var(--color-primary)"
                    fillOpacity={0.1}
                    dot={{ r: 4, fill: 'var(--color-primary)', strokeWidth: 0 }}
                    activeDot={{ 
                      r: 6, 
                      fill: 'var(--color-primary)',
                      stroke: 'var(--color-background)',
                      strokeWidth: 2
                    }}
                    animationDuration={disableAnimations ? 0 : 1500}
                    isAnimationActive={!disableAnimations}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="lockedBalance" 
                    stroke="var(--color-accent)" 
                    strokeWidth={3}
                    fill="var(--color-accent)"
                    fillOpacity={0.1}
                    dot={{ r: 4, fill: 'var(--color-accent)', strokeWidth: 0 }}
                    activeDot={{ 
                      r: 6, 
                      fill: 'var(--color-accent)',
                      stroke: 'var(--color-background)',
                      strokeWidth: 2
                    }}
                    animationDuration={disableAnimations ? 0 : 1500}
                    isAnimationActive={!disableAnimations}
                  />
                </>
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Period Selection */}
        <div className="flex items-center justify-center gap-1">
          {periods.map((period) => (
            <Button
              key={period}
              variant={selectedPeriod === period ? "default" : "ghost"}
              size="sm"
              onClick={() => !disableAnimations && setSelectedPeriod(period)}
              disabled={disableAnimations}
              className={`text-xs px-3 py-1 h-8 ${
                selectedPeriod === period 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              } ${disableAnimations ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {period}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to format dates for chart display
function formatDateForChart(date: Date, period: TimePeriod): string {
  if (period === '1W') {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  } else if (period === '1M') {
    return date.toLocaleDateString('en-US', { day: 'numeric' });
  } else if (period === '3M') {
    // For 3M period, show month and day to avoid overlapping labels
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } else {
    // For YTD and 1Y periods, show month only
    return date.toLocaleDateString('en-US', { month: 'short' });
  }
}

// Helper function to calculate nice reference line values
function calculateReferenceLines(minValue: number, maxValue: number): number[] {
  if (minValue === maxValue) {
    return [minValue];
  }
  
  const range = maxValue - minValue;
  const targetLines = 3; // Usually 3-4 reference lines work well
  
  // Calculate a nice step size
  const roughStep = range / targetLines;
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const normalizedStep = roughStep / magnitude;
  
  let niceStep: number;
  if (normalizedStep <= 1) {
    niceStep = magnitude;
  } else if (normalizedStep <= 2) {
    niceStep = 2 * magnitude;
  } else if (normalizedStep <= 5) {
    niceStep = 5 * magnitude;
  } else {
    niceStep = 10 * magnitude;
  }
  
  // Find nice starting point
  const niceMin = Math.ceil(minValue / niceStep) * niceStep;
  
  // Generate reference lines
  const lines: number[] = [];
  let current = niceMin;
  while (current <= maxValue && lines.length < 5) { // Max 5 lines to avoid clutter
    if (current >= minValue) {
      lines.push(current);
    }
    current += niceStep;
  }
  
  return lines;
}