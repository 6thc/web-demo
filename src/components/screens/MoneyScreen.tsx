import { ArrowUpRight, ArrowDownLeft, Banknote, User, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { getTransactionsForUserState, formatCurrency } from "../data/transactions";
import { toast } from "sonner@2.0.3";

interface MoneyScreenProps {
  onReceiveMoney?: () => void;
  onCash?: () => void;
  onTransfer?: () => void;
  onViewAllTransactions: () => void;
  onTransactionClick: (transactionId: string) => void;
  userState: 'fresh' | 'active';
}

export function MoneyScreen({ 
  onReceiveMoney,
  onCash,
  onTransfer,
  onViewAllTransactions,
  onTransactionClick,
  userState 
}: MoneyScreenProps) {
  
  // Get recent transactions based on user state (first 4)
  const allTransactions = getTransactionsForUserState(userState);
  const recentTransactions = allTransactions.slice(0, 4);

  const handleTransferClick = () => {
    onTransfer?.();
  };

  const handleCashClick = () => {
    onCash?.();
  };

  const handleProfileClick = () => {
    toast.info("Profile", {
      description: "Profile management coming soon."
    });
  };

  return (
    <div className="bg-muted/30 min-h-screen pt-2 pb-20">
      {/* Header */}
      <div className="px-4 pt-8 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1>Money</h1>
            <p className="text-muted-foreground">Manage your payments and transactions</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleProfileClick}
            className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10"
          >
            <User className="h-6 w-6 text-primary" />
          </Button>
        </div>

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
            onClick={onReceiveMoney}
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
      </div>

      {/* Recent Transactions */}
      <div className="px-4">
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
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        transaction.type === 'credit' 
                          ? 'bg-green-100 text-green-600' 
                          : transaction.type === 'debit'
                          ? 'bg-red-100 text-red-600'
                          : 'bg-blue-100 text-blue-600'
                      }`}>
                        {transaction.type === 'credit' ? (
                          <ArrowDownLeft className="h-4 w-4" />
                        ) : transaction.type === 'debit' ? (
                          <ArrowUpRight className="h-4 w-4" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{transaction.description}</p>
                        <p className="text-xs text-muted-foreground">{transaction.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold text-sm ${
                        transaction.type === 'credit' 
                          ? 'text-green-600' 
                          : transaction.type === 'debit'
                          ? 'text-red-600'
                          : 'text-blue-600'
                      }`}>
                        {transaction.type === 'credit' ? '+' : transaction.type === 'debit' ? '-' : ''}
                        {formatCurrency(Math.abs(transaction.amount))}
                      </p>
                      {transaction.status && (
                        <Badge 
                          variant={transaction.status === 'completed' ? 'default' : 'secondary'}
                          className="text-xs mt-1"
                        >
                          {transaction.status}
                        </Badge>
                      )}
                    </div>
                  </button>
                  {index < recentTransactions.length - 1 && <Separator className="my-2" />}
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
      </div>
    </div>
  );
}