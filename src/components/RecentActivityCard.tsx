import { ArrowUpRight, ArrowDownLeft, Clock, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { getTransactionsForUserState, formatCurrency, type Transaction } from "./data/transactions";

interface RecentActivityCardProps {
  onViewAllTransactions: () => void;
  onTransactionClick: (transactionId: string) => void;
  userState: 'fresh' | 'active';
}

export function RecentActivityCard({ 
  onViewAllTransactions, 
  onTransactionClick, 
  userState 
}: RecentActivityCardProps) {
  // Get recent transactions based on user state (first 4)
  const allTransactions = getTransactionsForUserState(userState);
  const recentTransactions = allTransactions.slice(0, 4);

  const getTransactionIcon = (transaction: Transaction) => {
    if (transaction.status === "pending") return <Clock className="h-4 w-4" />;
    if (transaction.status === "failed") return <XCircle className="h-4 w-4" />;
    if (transaction.type === "credit") return <ArrowDownLeft className="h-4 w-4" />;
    return <ArrowUpRight className="h-4 w-4" />;
  };

  const getTransactionIconColor = (transaction: Transaction) => {
    if (transaction.status === "pending") return "bg-orange-100 text-orange-700";
    if (transaction.status === "failed") return "bg-red-100 text-red-700";
    if (transaction.type === "credit") return "bg-green-100 text-green-700";
    return "bg-red-100 text-red-700";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default" className="bg-green-100 text-green-700">Completed</Badge>;
      case "pending":
        return <Badge variant="secondary" className="bg-orange-100 text-orange-700">Pending</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Recent Activity</CardTitle>
          <Button variant="ghost" size="sm" className="text-sm text-primary" onClick={onViewAllTransactions}>
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {recentTransactions.map((transaction, index) => (
            <div key={transaction.id}>
              <button
                onClick={() => onTransactionClick(transaction.id)}
                className="w-full flex items-center justify-between py-2 text-left hover:bg-muted/50 rounded-lg px-2 -mx-2 transition-colors"
              >
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getTransactionIconColor(transaction)}`}>
                      {getTransactionIcon(transaction)}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{transaction.name}</p>
                      <p className="text-xs text-muted-foreground">{transaction.date} • {transaction.time}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold text-sm ${
                      transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                    </p>
                    {getStatusBadge(transaction.status)}
                  </div>
              </button>
              {index < recentTransactions.length - 1 && <Separator className="mt-4" />}
            </div>
          ))}

          {recentTransactions.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                <ArrowUpRight className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-2">No recent transactions</p>
              <p className="text-xs text-muted-foreground">Your transaction history will appear here</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}