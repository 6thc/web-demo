import { useState } from "react";
import { ArrowLeft, User, AlertCircle, Shield, Banknote, Calendar, MapPin, Phone, Mail, Heart, Copy, Share, Download, History, CheckCircle, Clock, ArrowUpRight, ArrowDownLeft, Plus, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { getCreditsForUserState, pledgerApproveLoan, pledgerDeclineLoan, getUSDToLocalRate, getInstallmentLabel } from "../data/credits";
import { getAvailableBalance, lockFunds, isFundsLocked } from "../data/wallet";
import { addLoanDisbursementTransaction } from "../data/transactions";
import { getPledgerActivitiesByCredit, getActivityIconType, getActivityDisplayAmount, formatCurrency as formatUSDCurrency, type PledgerActivity } from "../data/pledger-activity";
import { toast } from "sonner@2.0.3";

interface PledgerRequestDetailsScreenProps {
  creditId: string;
  onBack: () => void;
  onApproved: () => void;
  onDeclined: () => void;
  onActivityClick?: (activityId: string) => void;
  userState: 'fresh' | 'active';
  notificationsEnabled?: boolean;
}

export function PledgerRequestDetailsScreen({ creditId, onBack, onApproved, onDeclined, onActivityClick, userState, notificationsEnabled = true }: PledgerRequestDetailsScreenProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Get the credit data
  const allCredits = getCreditsForUserState(userState);
  const credit = allCredits.find(c => c.id === creditId);

  // Get activities related to this credit
  const creditActivities = getPledgerActivitiesByCredit(creditId, userState);
  
  if (!credit) {
    return (
      <div className="bg-muted/30 min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Request not found</p>
            <Button onClick={onBack} className="mt-4">Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const availableBalance = getAvailableBalance();
  const fxRate = getUSDToLocalRate();
  const collateralRequired = Math.round(credit.totalAmountUSD * 1.2); // 120% collateral in USD
  const canAfford = collateralRequired <= availableBalance;

  // Helper functions
  const formatCurrency = (amount: number) => {
    return "$" + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    if (notificationsEnabled) {
      toast.success(`${label} copied to clipboard`);
    }
  };

  const shareCredit = () => {
    if (navigator.share) {
      navigator.share({
        title: `Pledge ${credit.loanId}`,
        text: `Pledge of ${credit.totalAmountUSD.toLocaleString()} for ${credit.pledgerName}`,
      });
    } else {
      copyToClipboard(
        `Pledge: ${credit.loanId}\\nAmount: ${credit.totalAmountUSD.toLocaleString()}\\nBorrower: Segun Adebayo\\nStatus: ${credit.status}`,
        "Pledge details"
      );
    }
  };

  const getStatusIcon = () => {
    switch (credit.status) {
      case "active":
        return <Shield className="h-5 w-5 text-accent" />;
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "pending":
      case "reviewing":
        return <Clock className="h-5 w-5 text-primary" />;
      case "cancelled":
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  const getStatusBadge = () => {
    switch (credit.status) {
      case "active":
        return <Badge className="bg-accent/10 text-accent border-accent/20">Active</Badge>;
      case "completed":
        return <Badge className="bg-green-100 text-green-700">Completed</Badge>;
      case "pending":
        return <Badge variant="secondary" className="bg-primary/10 text-primary">Pending</Badge>;
      case "reviewing":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">Under Review</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{credit.status}</Badge>;
    }
  };

  const getActivityIcon = (activity: PledgerActivity) => {
    if (activity.status === "pending") return <Clock className="h-4 w-4" />;
    if (activity.status === "failed") return <AlertCircle className="h-4 w-4" />;
    
    switch (activity.type) {
      case 'collateral_locked':
        return <Shield className="h-4 w-4" />;
      case 'collateral_released':
        return <Shield className="h-4 w-4" />;
      case 'loan_disbursed':
        return <Banknote className="h-4 w-4" />;
      case 'payment_received':
        return <DollarSign className="h-4 w-4" />;
      default:
        const iconType = getActivityIconType(activity.type);
        if (iconType === "credit") return <ArrowDownLeft className="h-4 w-4" />;
        if (iconType === "debit") return <ArrowUpRight className="h-4 w-4" />;
        return <Plus className="h-4 w-4" />;
    }
  };

  const getActivityIconColor = (activity: PledgerActivity) => {
    if (activity.status === "pending") return "bg-orange-100 text-orange-700";
    if (activity.status === "failed") return "bg-red-100 text-red-700";
    
    switch (activity.type) {
      case 'collateral_locked':
        return "bg-red-100 text-red-700";
      case 'collateral_released':
        return "bg-green-100 text-green-700";
      case 'loan_disbursed':
        return "bg-blue-100 text-blue-700";
      case 'payment_received':
        return "bg-green-100 text-green-700";
      default:
        const iconType = getActivityIconType(activity.type);
        if (iconType === "credit") return "bg-green-100 text-green-700";
        if (iconType === "debit") return "bg-red-100 text-red-700";
        return "bg-blue-100 text-blue-700";
    }
  };

  const getActivityStatusBadge = (status: string) => {
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

  const handleApprove = async () => {
    if (!canAfford) {
      if (notificationsEnabled) {
        toast.error("Insufficient funds", {
          description: `You need ${formatCurrency(collateralRequired)} but only have ${formatCurrency(availableBalance)} available.`
        });
      }
      return;
    }

    setIsProcessing(true);

    try {
      // Check if funds are already locked, if not, lock them first
      const alreadyLocked = isFundsLocked(creditId);
      if (!alreadyLocked) {
        const lockResult = lockFunds(creditId, collateralRequired, userState);
        if (!lockResult.success) {
          if (notificationsEnabled) {
            toast.error("Failed to lock funds", {
              description: lockResult.error
            });
          }
          return;
        }
      }

      // Approve the loan
      const result = pledgerApproveLoan(creditId, userState);
      if (result.success && result.credit) {
        // Create loan disbursement transaction for the borrower (in NGN)
        addLoanDisbursementTransaction(creditId, credit.totalAmount, userState);
        
        if (notificationsEnabled) {
          toast.success("Loan approved successfully", {
            description: `${formatCurrency(collateralRequired)} has been locked as collateral.`
          });
        }
        onApproved();
      } else {
        // Unlock funds if approval failed
        // In a real app, this would be handled in a transaction
        if (notificationsEnabled) {
          toast.error("Approval failed", {
            description: result.error || "Please try again"
          });
        }
      }
    } catch (error) {
      if (notificationsEnabled) {
        toast.error("Approval failed", {
          description: "An unexpected error occurred"
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = async () => {
    setIsProcessing(true);

    try {
      const result = pledgerDeclineLoan(creditId, userState);
      if (result.success) {
        if (notificationsEnabled) {
          toast.success("Loan declined", {
            description: "The borrower has been notified of your decision."
          });
        }
        onDeclined();
      } else {
        if (notificationsEnabled) {
          toast.error("Decline failed", {
            description: result.error || "Please try again"
          });
        }
      }
    } catch (error) {
      if (notificationsEnabled) {
        toast.error("Decline failed", {
          description: "An unexpected error occurred"
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-muted/30 min-h-screen">
      {/* Header */}
      <div className="bg-background border-b border-border/50 px-4 py-3">
        <div className="flex items-center justify-between">
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
              <h1 className="font-semibold">
                {credit.status === 'pending' || credit.status === 'reviewing' ? 'Pledge Request' : 
                 credit.status === 'active' ? 'Active Pledge' : 'Pledge Details'}
              </h1>
              <p className="text-sm text-muted-foreground">{credit.loanId}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={shareCredit}>
              <Share className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => notificationsEnabled && toast.info("Download feature coming soon")}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 pb-6">
        {/* Pledge Summary */}
        <Card className="mb-4">
          <CardContent className="p-6">
            <div className="text-center">
              <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${ 
                credit.status === 'active' 
                  ? 'bg-accent/10' 
                  : credit.status === 'completed'
                    ? 'bg-green-100'
                    : credit.status === 'cancelled'
                      ? 'bg-red-100'
                    : credit.status === 'pending' || credit.status === 'reviewing'
                      ? 'bg-primary/10'
                      : 'bg-muted'
              }`}>
                {getStatusIcon()}
              </div>
              
              <h2 className="text-3xl font-bold mb-2 text-foreground">
                ${credit.totalAmountUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
              
              <p className="text-muted-foreground mb-2">
                ≈ ₦{credit.totalAmount.toLocaleString()}
              </p>
              <p className="font-medium mb-4">
                {credit.status === 'pending' || credit.status === 'reviewing' 
                 ? `Backing request for ${credit.purpose?.toLowerCase() || 'loan'}` 
                 : `Pledged for ${credit.purpose?.toLowerCase() || 'loan'}`}
              </p>
              
              <div className="flex items-center justify-center gap-2 mb-4">
                {getStatusBadge()}
              </div>

              {/* Status Banner */}
              {(credit.status === 'pending' || credit.status === 'reviewing') ? (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="h-4 w-4 text-primary" />
                    <span className="text-sm text-primary font-medium">Action Required</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Segun Adebayo is requesting your backing for this loan
                  </p>
                </div>
              ) : credit.status === 'active' ? (
                <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="h-4 w-4 text-accent" />
                    <span className="text-sm text-accent font-medium">Active Pledge</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    You are currently backing this loan with {formatCurrency(collateralRequired)} in collateral
                  </p>
                </div>
              ) : (
                <div className="bg-muted/5 border border-muted rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground font-medium">
                      {credit.status === 'completed' ? 'Completed Pledge' : 
                       credit.status === 'cancelled' ? 'Cancelled Pledge' : 
                       credit.status === 'defaulted' ? 'Defaulted Pledge' : 'Past Pledge'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {credit.status === 'completed' ? 'This loan has been fully repaid and your collateral has been released' :
                     credit.status === 'cancelled' ? 'This pledge request was cancelled' :
                     credit.status === 'defaulted' ? 'This loan defaulted and collateral was applied' : 
                     'This pledge is no longer active'}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="borrower">Borrower</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {/* Pledge Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Pledge Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-muted-foreground text-sm">Pledge ID</p>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{credit.loanId}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(credit.loanId, 'Pledge ID')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Interest Rate</p>
                    <p className="font-semibold">{credit.interestRate}% APR</p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-muted-foreground text-sm">Term</p>
                    <p className="font-semibold">{credit.term}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">{getInstallmentLabel(credit.repaymentFrequency, 'adjective').charAt(0).toUpperCase() + getInstallmentLabel(credit.repaymentFrequency, 'adjective').slice(1)} Payment (Expected)</p>
                    <p className="font-semibold">{credit.monthlyPaymentUSD ? formatCurrency(credit.monthlyPaymentUSD) : 'TBD'}</p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-muted-foreground text-sm">Start Date</p>
                    <p className="font-semibold">{credit.startDate || 'Upon approval'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">End Date</p>
                    <p className="font-semibold">{credit.endDate || 'TBD'}</p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Submitted</p>
                    <p className="text-sm text-muted-foreground">
                      {credit.submittedDate || 'Today'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Collateral Requirements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Collateral Requirements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Required Collateral (120%)</span>
                    <Badge variant={canAfford ? "default" : "destructive"}>
                      {canAfford ? "✓ Available" : "Insufficient Funds"}
                    </Badge>
                  </div>
                  <p className="text-2xl font-semibold">${formatCurrency(collateralRequired).replace("$", "")}</p>
                  <p className="text-sm text-muted-foreground">
                    ≈ ₦{(collateralRequired * fxRate).toLocaleString()}
                  </p>
                </div>
                
                <div className="text-center py-2">
                  <p className="text-sm text-muted-foreground">
                    Your available balance: <span className="font-medium">{formatCurrency(availableBalance)}</span>
                  </p>
                </div>
                
                <div className="bg-accent/10 rounded-lg p-4">
                  <p className="text-sm text-foreground">
                    <strong>Collateral Protection:</strong> Your funds will be securely held until the loan is fully repaid. 
                    If the borrower defaults, you may claim up to the loan amount from your collateral.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Financial Summary for Active/Completed Pledges */}
            {(credit.status === 'active' || credit.status === 'completed') && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Financial Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-muted-foreground text-sm">Original Amount</p>
                      <p className="font-semibold">{formatCurrency(credit.totalAmountUSD)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm">Disbursed</p>
                      <p className="font-semibold text-green-600">{formatCurrency(credit.disbursedAmountUSD || credit.totalAmountUSD)}</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-muted-foreground text-sm">Total Received</p>
                      <p className="font-semibold text-blue-600">{formatCurrency(credit.totalPaidUSD || 0)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm">Remaining</p>
                      <p className="font-semibold text-red-600">{formatCurrency(credit.remainingUSD || credit.totalAmountUSD)}</p>
                    </div>
                  </div>

                  {credit.status === 'active' && (
                    <>
                      <Separator />
                      <div className="bg-accent/10 rounded-lg p-4">
                        <p className="text-sm text-accent-foreground">
                          <strong>Your Collateral:</strong> {formatCurrency(collateralRequired)} is currently locked and securing this loan. 
                          It will be released once the loan is fully repaid.
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Exchange Rate Info */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Exchange Rate</span>
                  <span className="text-sm font-medium">1 USD = ₦{fxRate.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Borrower Tab */}
          <TabsContent value="borrower" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Borrower Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Segun Adebayo</h3>
                    <p className="text-sm text-muted-foreground">Primary Account Holder</p>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <Heart className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-muted-foreground">Trusted Family</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">segun.adebayo@email.com</p>
                    <p className="text-xs text-muted-foreground">Email</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => copyToClipboard('segun.adebayo@email.com', 'Email')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <Separator />

                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">+234-801-234-5678</p>
                    <p className="text-xs text-muted-foreground">Phone</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => copyToClipboard('+234-801-234-5678', 'Phone')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <Separator />

                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Lagos, Nigeria</p>
                    <p className="text-xs text-muted-foreground">Location</p>
                  </div>
                </div>
                <Separator />

                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-green-600" />
                    <p className="font-medium text-sm">Credit Information</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Credit Score</p>
                      <p className="font-medium text-green-600">{credit.creditScore || 750}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Risk Level</p>
                      <p className="font-medium text-green-600">{credit.riskLevel || 'Low'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Related Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {creditActivities.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
                      <History className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-medium mb-2">No activity yet</h3>
                    <p className="text-sm text-muted-foreground">
                      Activity related to this pledge will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {creditActivities.map((activity, index) => {
                      const displayAmount = getActivityDisplayAmount(activity);
                      
                      return (
                        <div key={activity.id}>
                          <button
                            onClick={() => onActivityClick?.(activity.id)}
                            className="w-full text-left hover:bg-muted/50 rounded-lg p-2 -m-2 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getActivityIconColor(activity)}`}>
                                  {getActivityIcon(activity)}
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{activity.title}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {activity.date} ��� {activity.time}
                                    {activity.borrowerName && ` • ${activity.borrowerName}`}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                {displayAmount !== null && (
                                  <p className={`font-semibold text-sm ${
                                    displayAmount > 0 ? 'text-green-600' : displayAmount < 0 ? 'text-red-600' : 'text-blue-600'
                                  }`}>
                                    {displayAmount > 0 ? '+' : ''}
                                    {formatUSDCurrency(Math.abs(displayAmount))}
                                  </p>
                                )}
                                {getActivityStatusBadge(activity.status)}
                              </div>
                            </div>
                          </button>
                          {index < creditActivities.length - 1 && <Separator className="mt-4" />}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom Action Buttons - Only show for pending requests */}
      {(credit.status === 'pending' || credit.status === 'reviewing') && (
        <div className="sticky bottom-0 bg-background border-t border-border/50 p-4 space-y-3">
          <Button 
            onClick={handleApprove}
            disabled={!canAfford || isProcessing}
            className="w-full h-12 bg-accent hover:bg-accent/90"
          >
            {isProcessing ? 'Processing...' : `Approve & Pledge ${formatCurrency(collateralRequired)}`}
          </Button>
          
          <Button 
            onClick={handleDecline}
            disabled={isProcessing}
            className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isProcessing ? 'Processing...' : 'Decline Request'}
          </Button>
        </div>
      )}
    </div>
  );
}