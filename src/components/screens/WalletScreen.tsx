import { useState } from "react";
import { ArrowUpRight, ArrowDownLeft, Banknote, User, Settings, Search, Filter, Clock, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { WalletBalanceCard } from "../WalletBalanceCard";
import { BalanceChart } from "../BalanceChart";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { getTransactionsForUserState, formatCurrency, getCurrentBalance, type Transaction } from "../data/transactions";
import { toast } from "sonner@2.0.3";


interface WalletScreenProps {
  onReceiveMoney?: () => void;
  onCash?: () => void;
  onTransfer?: () => void;
  onViewAllTransactions: () => void;
  onTransactionClick: (transactionId: string) => void;
  userState: 'fresh' | 'active';
  refreshKey?: number;
  forceChartPeriod?: '1W' | '1M' | '3M' | 'YTD' | '1Y';
  disableChartAnimations?: boolean;
}

export function WalletScreen({ 
  onReceiveMoney,
  onCash,
  onTransfer,
  onViewAllTransactions,
  onTransactionClick,
  userState,
  refreshKey,
  forceChartPeriod,
  disableChartAnimations
}: WalletScreenProps) {

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const handleTransferClick = () => {
    onTransfer?.();
  };

  const handleCashClick = () => {
    onCash?.();
  };

  const allTransactions = getTransactionsForUserState(userState);
  const filteredTransactions = allTransactions.filter(transaction => {
    const matchesSearch = transaction.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         transaction.reference?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === "all" || transaction.type === filterType;
    const matchesCategory = filterCategory === "all" || transaction.category === filterCategory;
    const matchesStatus = filterStatus === "all" || transaction.status === filterStatus;
    
    return matchesSearch && matchesType && matchesCategory && matchesStatus;
  });

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

  const totalCredit = filteredTransactions
    .filter(t => t.type === "credit" && t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDebit = filteredTransactions
    .filter(t => t.type === "debit" && t.status === "completed")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);



  return (
    <div className="bg-muted/30 h-full pt-2 relative">
      {/* Topos Red Background - cuts off behind balance card */}
      <div className="absolute top-0 left-0 right-0 h-52 z-0" style={{ backgroundColor: '#E52A5B' }}></div>
      
      {/* Header */}
      <div className="px-4 pt-8 pb-4 relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-white">Wallet</h1>
            <p className="text-white/80">Manage your payments and transactions</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            className="h-12 w-12 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/20"
          >
            <User className="h-6 w-6 text-white" />
          </Button>
        </div>

        {/* Balance Card */}
        <WalletBalanceCard 
          key={refreshKey}
          userState={userState}
          className="bg-white/95 backdrop-blur-sm border-0 text-foreground shadow-lg relative z-10"
        />


      </div>

      {/* Transaction History */}
      <div className="px-4 relative z-10 pb-6">
        {/* Balance Chart */}
        <BalanceChart 
          userState={userState}
          type="borrower"
          className="mb-4"
          refreshKey={refreshKey}
          defaultPeriod={forceChartPeriod}
          disableAnimations={disableChartAnimations}
        />

        {/* Search and Filters */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="space-y-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filters */}
              <div className="grid grid-cols-3 gap-2">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="credit">Credit</SelectItem>
                    <SelectItem value="debit">Debit</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="transfer">Transfer</SelectItem>
                    <SelectItem value="payment">Payment</SelectItem>
                    <SelectItem value="loan">Loan</SelectItem>
                    <SelectItem value="salary">Salary</SelectItem>
                    <SelectItem value="bills">Bills</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions List */}
        <Card data-activity-section>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span>Transactions</span>
              {filteredTransactions.length !== allTransactions.length && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setSearchQuery("");
                    setFilterType("all");
                    setFilterCategory("all");
                    setFilterStatus("all");
                  }}
                  className="text-sm text-primary"
                >
                  Clear Filters
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-medium mb-2">No transactions found</h3>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTransactions.map((transaction, index) => (
                  <div key={transaction.id}>
                    <button
                      onClick={() => onTransactionClick(transaction.id)}
                      className="w-full text-left hover:bg-muted/50 rounded-lg p-2 -m-2 transition-colors"
                    >
                      <div className="flex items-center justify-between">
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
                      </div>
                    </button>
                    {index < filteredTransactions.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}