import { useState } from "react";
import { ArrowLeft, Search, Filter, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { getTransactionsForUserState, formatCurrency, type Transaction } from "../data/transactions";

interface TransactionHistoryScreenProps {
  onBack: () => void;
  onTransactionClick: (transactionId: string) => void;
  userState: 'fresh' | 'active';
}

export function TransactionHistoryScreen({ onBack, onTransactionClick, userState }: TransactionHistoryScreenProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

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
    <div className="bg-muted/30 min-h-screen pt-2">
      {/* Header */}
      <div className="bg-background border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onBack}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-semibold">Transaction History</h1>
            <p className="text-sm text-muted-foreground">{filteredTransactions.length} transactions</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 pb-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <p className="text-sm text-muted-foreground">Total In</p>
              </div>
              <p className="font-semibold text-green-600">{formatCurrency(totalCredit)}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <p className="text-sm text-muted-foreground">Total Out</p>
              </div>
              <p className="font-semibold text-red-600">{formatCurrency(totalDebit)}</p>
            </CardContent>
          </Card>
        </div>

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
        <Card>
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