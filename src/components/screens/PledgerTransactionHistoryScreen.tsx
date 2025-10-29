import { useState } from "react";
import { ArrowLeft, Search, Filter, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, XCircle, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { getPledgerActivitiesForUserState, formatCurrency, getActivityIconType, getActivityDisplayAmount, type PledgerActivity } from "../data/pledger-activity";

interface PledgerTransactionHistoryScreenProps {
  onBack: () => void;
  onActivityClick: (activityId: string) => void;
  userState: 'fresh' | 'active';
}

export function PledgerTransactionHistoryScreen({ onBack, onActivityClick, userState }: PledgerTransactionHistoryScreenProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const allActivities = getPledgerActivitiesForUserState(userState);
  const filteredActivities = allActivities.filter(activity => {
    const matchesSearch = activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         activity.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         activity.borrowerName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const iconType = getActivityIconType(activity.type);
    const matchesType = filterType === "all" || 
                       (filterType === "credit" && iconType === "credit") ||
                       (filterType === "debit" && iconType === "debit") ||
                       (filterType === "neutral" && iconType === "neutral");
    
    const matchesCategory = filterCategory === "all" || activity.type === filterCategory;
    const matchesStatus = filterStatus === "all" || activity.status === filterStatus;
    
    return matchesSearch && matchesType && matchesCategory && matchesStatus;
  });

  const getActivityIcon = (activity: PledgerActivity) => {
    if (activity.status === "pending") return <Clock className="h-4 w-4" />;
    if (activity.status === "failed") return <XCircle className="h-4 w-4" />;
    
    const iconType = getActivityIconType(activity.type);
    if (iconType === "credit") return <ArrowDownLeft className="h-4 w-4" />;
    if (iconType === "debit") return <ArrowUpRight className="h-4 w-4" />;
    return <Plus className="h-4 w-4" />;
  };

  const getActivityIconColor = (activity: PledgerActivity) => {
    if (activity.status === "pending") return "bg-orange-100 text-orange-700";
    if (activity.status === "failed") return "bg-red-100 text-red-700";
    
    const iconType = getActivityIconType(activity.type);
    if (iconType === "credit") return "bg-green-100 text-green-700";
    if (iconType === "debit") return "bg-red-100 text-red-700";
    return "bg-blue-100 text-blue-700";
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

  // Calculate totals in USD - convert NGN to USD for consistency
  const totalCredit = filteredActivities
    .filter(a => getActivityIconType(a.type) === "credit" && a.status === "completed" && a.amount)
    .reduce((sum, a) => {
      const amount = a.amount || 0;
      // Convert NGN to USD (using 1000:1 conversion rate from the data)
      return sum + (a.currency === 'NGN' ? amount / 1000 : amount);
    }, 0);

  const totalDebit = filteredActivities
    .filter(a => getActivityIconType(a.type) === "debit" && a.status === "completed" && a.amount)
    .reduce((sum, a) => {
      const amount = a.amount || 0;
      // Convert NGN to USD (using 1000:1 conversion rate from the data)
      return sum + (a.currency === 'NGN' ? amount / 1000 : amount);
    }, 0);

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
            <h1 className="font-semibold">Activity History</h1>
            <p className="text-sm text-muted-foreground">{filteredActivities.length} activities</p>
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
              <p className="font-semibold text-green-600">{formatCurrency(totalCredit, 'USD')}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <p className="text-sm text-muted-foreground">Total Out</p>
              </div>
              <p className="font-semibold text-red-600">{formatCurrency(totalDebit, 'USD')}</p>
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
                  placeholder="Search activities..."
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
                    <SelectItem value="credit">Money In</SelectItem>
                    <SelectItem value="debit">Money Out</SelectItem>
                    <SelectItem value="neutral">Other</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="wallet_topup">Top Up</SelectItem>
                    <SelectItem value="wallet_withdrawal">Withdrawal</SelectItem>
                    <SelectItem value="collateral_locked">Collateral Locked</SelectItem>
                    <SelectItem value="collateral_released">Collateral Released</SelectItem>
                    <SelectItem value="pledge_approved">Pledge Approved</SelectItem>
                    <SelectItem value="pledge_declined">Pledge Declined</SelectItem>
                    <SelectItem value="loan_repayment">Loan Repayment</SelectItem>
                    <SelectItem value="loan_disbursed">Loan Disbursed</SelectItem>
                    <SelectItem value="loan_completed">Loan Completed</SelectItem>
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

        {/* Activities List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span>Activities</span>
              {filteredActivities.length !== allActivities.length && (
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
            {filteredActivities.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-medium mb-2">No activities found</h3>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredActivities.map((activity, index) => {
                  const displayAmount = getActivityDisplayAmount(activity);
                  
                  return (
                    <div key={activity.id}>
                      <button
                        onClick={() => onActivityClick(activity.id)}
                        className="w-full text-left hover:bg-muted/50 rounded-lg p-2 -m-2 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getActivityIconColor(activity)}`}>
                              {getActivityIcon(activity)}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{activity.title}</p>
                              <p className="text-xs text-muted-foreground">{activity.date} • {activity.time}</p>
                              {activity.borrowerName && (
                                <p className="text-xs text-muted-foreground">from {activity.borrowerName}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            {displayAmount !== null && (
                              <p className={`font-semibold text-sm ${
                                displayAmount > 0 ? 'text-green-600' : displayAmount < 0 ? 'text-red-600' : 'text-blue-600'
                              }`}>
                                {displayAmount > 0 ? '+' : ''}
                                {formatCurrency(Math.abs(displayAmount), activity.currency)}
                              </p>
                            )}
                            {getStatusBadge(activity.status)}
                          </div>
                        </div>
                      </button>
                      {index < filteredActivities.length - 1 && <Separator className="mt-4" />}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}