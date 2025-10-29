import { ArrowLeft, User, Calendar, DollarSign, Clock, CheckCircle, AlertTriangle, Shield, Phone, Mail, MapPin, Share, Download, Copy, CreditCard, TrendingUp, History, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { Progress } from "../ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { getCreditById, formatCurrency, calculatePaymentProgress, getRemainingPayments, processCreditPayment, type PaymentRecord } from "../data/credits";
import { addLoanRepaymentTransaction } from "../data/transactions";
import { PaymentModal } from "../PaymentModal";
import { toast } from "sonner@2.0.3";
import { useState } from "react";

interface CreditDetailsScreenProps {
  creditId: string;
  onBack: () => void;
  onViewTransaction: (transactionId: string) => void;
  onViewAllPayments: () => void;
  userState?: 'fresh' | 'active';
  onPaymentSuccess?: () => void;
  defaultTab?: 'overview' | 'pledger' | 'payments';
}

export function CreditDetailsScreen({ creditId, onBack, onViewTransaction, onViewAllPayments, userState = 'active', onPaymentSuccess, defaultTab = 'overview' }: CreditDetailsScreenProps) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [credit, setCredit] = useState(() => getCreditById(creditId, userState));

  if (!credit) {
    return (
      <div className="bg-muted/30 min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <h3 className="font-medium mb-2">Credit Not Found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              The requested credit could not be found.
            </p>
            <Button onClick={onBack}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusIcon = () => {
    switch (credit.status) {
      case "active":
        return <AlertTriangle className="h-5 w-5 text-blue-600" />;
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "pending":
        return <Clock className="h-5 w-5 text-orange-600" />;
      case "cancelled":
        return <X className="h-5 w-5 text-red-600" />;
      case "defaulted":
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  const getStatusBadge = () => {
    switch (credit.status) {
      case "active":
        return <Badge className="bg-blue-100 text-blue-700">Active</Badge>;
      case "completed":
        return <Badge className="bg-green-100 text-green-700">Completed</Badge>;
      case "pending":
        return <Badge variant="secondary" className="bg-orange-100 text-orange-700">Pending</Badge>;
      case "reviewing":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">Under Review</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      case "defaulted":
        return <Badge variant="destructive">Defaulted</Badge>;
      default:
        return <Badge variant="secondary">{credit.status}</Badge>;
    }
  };

  const getRiskLevelColor = (risk: string) => {
    switch (risk) {
      case "low":
        return "text-green-600 bg-green-100";
      case "medium":
        return "text-orange-600 bg-orange-100";
      case "high":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handlePayment = async (amount: number, paymentType: 'regular' | 'full' | 'custom') => {
    if (!credit) return;

    // First, attempt to create the transaction
    const transactionResult = addLoanRepaymentTransaction(
      credit.id,
      amount,
      paymentType,
      userState
    );

    if (!transactionResult.success) {
      toast.error("Payment Failed", {
        description: transactionResult.error
      });
      return;
    }

    // Then, process the credit payment
    const creditResult = processCreditPayment(
      credit.id,
      amount,
      paymentType,
      transactionResult.transaction!.id,
      userState
    );

    if (!creditResult.success) {
      toast.error("Payment Processing Failed", {
        description: creditResult.error
      });
      return;
    }

    // Update local credit state
    setCredit(creditResult.updatedCredit!);

    // Show success message
    const isFullPayoff = creditResult.updatedCredit!.status === 'completed';
    toast.success(
      isFullPayoff ? "Loan Paid Off!" : "Payment Successful",
      {
        description: isFullPayoff 
          ? `Congratulations! Your loan has been fully paid off.`
          : `Payment of ${formatCurrency(amount)} has been processed successfully.`
      }
    );

    // Notify parent component
    onPaymentSuccess?.();
  };

  const shareCredit = () => {
    if (navigator.share) {
      navigator.share({
        title: `Credit ${credit.loanId}`,
        text: `Credit of ${formatCurrency(credit.totalAmount)} from ${credit.pledgerName}`,
      });
    } else {
      copyToClipboard(
        `Credit: ${credit.loanId}\nAmount: ${formatCurrency(credit.totalAmount)}\nPledger: ${credit.pledgerName}\nStatus: ${credit.status}`,
        "Credit details"
      );
    }
  };

  const progress = calculatePaymentProgress(credit);
  const remainingPayments = getRemainingPayments(credit);

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
              <h1 className="font-semibold">Credit Details</h1>
              <p className="text-sm text-muted-foreground">{credit.loanId}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={shareCredit}>
              <Share className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => toast.info("Download feature coming soon")}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 pb-6">
        {/* Credit Summary */}
        <Card className="mb-4">
          <CardContent className="p-6">
            <div className="text-center">
              <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
                credit.status === 'active' 
                  ? 'bg-blue-100' 
                  : credit.status === 'completed'
                    ? 'bg-green-100'
                    : credit.status === 'cancelled'
                      ? 'bg-red-100'
                      : 'bg-orange-100'
              }`}>
                {getStatusIcon()}
              </div>
              
              <h2 className="text-3xl font-bold mb-2 text-foreground">
                {formatCurrency(credit.totalAmount)}
              </h2>
              
              <p className="text-muted-foreground mb-2">Pledged by {credit.pledgerName}</p>
              <p className="font-medium mb-4">{credit.purpose}</p>
              
              <div className="flex items-center justify-center gap-2 mb-4">
                {getStatusBadge()}
                {credit.riskLevel && (
                  <Badge variant="outline" className={`capitalize ${getRiskLevelColor(credit.riskLevel)}`}>
                    {credit.riskLevel} Risk
                  </Badge>
                )}
              </div>

              {credit.status === 'active' && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Payment Progress</span>
                    <span>{Math.round(progress)}% Complete</span>
                  </div>
                  <Progress value={progress} className="h-2 mb-2" />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Remaining</p>
                      <p className="font-semibold text-red-600">{formatCurrency(credit.remaining)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Next Payment</p>
                      <p className="font-semibold">{credit.nextPayment}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="pledger">Pledger</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {/* Loan Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Loan Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-muted-foreground text-sm">Loan ID</p>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{credit.loanId}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(credit.loanId, 'Loan ID')}
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
                    <p className="text-muted-foreground text-sm">Payment Amount</p>
                    <p className="font-semibold">{formatCurrency(credit.installmentAmount || credit.monthlyPayment)}</p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-muted-foreground text-sm">Start Date</p>
                    <p className="font-semibold">{credit.startDate}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">End Date</p>
                    <p className="font-semibold">{credit.endDate}</p>
                  </div>
                </div>

                {credit.creditScore && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-muted-foreground text-sm">Credit Score at Approval</p>
                      <p className="font-semibold text-blue-600">{credit.creditScore}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Repayment Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Repayment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-muted-foreground text-sm">Payment Schedule</p>
                    <p className="font-semibold">{credit.repaymentFrequency || 'Monthly'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Installment Amount</p>
                    <p className="font-semibold">{formatCurrency(credit.installmentAmount || credit.monthlyPayment)}</p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-muted-foreground text-sm">Number of Payments</p>
                    <p className="font-semibold">{credit.numberOfInstallments || Math.ceil((credit.termMonths || 1))}</p>
                  </div>
                  {credit.finalInstallmentAmount && credit.finalInstallmentAmount !== (credit.installmentAmount || credit.monthlyPayment) && (
                    <div>
                      <p className="text-muted-foreground text-sm">Final Payment</p>
                      <p className="font-semibold">{formatCurrency(credit.finalInstallmentAmount)}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Financial Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Financial Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-muted-foreground text-sm">Original Amount</p>
                    <p className="font-semibold">{formatCurrency(credit.totalAmount)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Disbursed</p>
                    <p className="font-semibold text-green-600">{formatCurrency(credit.disbursedAmount || credit.totalAmount)}</p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-muted-foreground text-sm">Total Paid</p>
                    <p className="font-semibold text-blue-600">{formatCurrency(credit.totalPaid || 0)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Remaining</p>
                    <p className="font-semibold text-red-600">{formatCurrency(credit.remaining)}</p>
                  </div>
                </div>

                {credit.status === 'active' && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-muted-foreground text-sm">Payments Left</p>
                        <p className="font-semibold">{remainingPayments} payments</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-sm">Next Payment</p>
                        <p className="font-semibold">{formatCurrency(credit.installmentAmount || credit.monthlyPayment)}</p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pledger Tab */}
          <TabsContent value="pledger" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Pledger Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{credit.pledgerName}</h3>
                    <p className="text-sm text-muted-foreground">{credit.pledgerRelationship}</p>
                  </div>
                </div>

                {credit.pledgerEmail && (
                  <>
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{credit.pledgerEmail}</p>
                        <p className="text-xs text-muted-foreground">Email</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => copyToClipboard(credit.pledgerEmail!, 'Email')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <Separator />
                  </>
                )}

                {credit.pledgerPhone && (
                  <>
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{credit.pledgerPhone}</p>
                        <p className="text-xs text-muted-foreground">Phone</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => copyToClipboard(credit.pledgerPhone!, 'Phone')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <Separator />
                  </>
                )}

                {credit.pledgerCountry && (
                  <>
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{credit.pledgerCountry}</p>
                        <p className="text-xs text-muted-foreground">Country</p>
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {credit.collateralType && (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-4 w-4 text-green-600" />
                      <p className="font-medium text-sm">Collateral</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Type</p>
                        <p className="font-medium">{credit.collateralType}</p>
                      </div>
                      {credit.collateralValue && (
                        <div>
                          <p className="text-muted-foreground">Value</p>
                          <p className="font-medium text-green-600">{formatCurrency(credit.collateralValue)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Payment History
                  </CardTitle>
                  {credit.paymentHistory.length > 3 && (
                    <Button variant="ghost" size="sm" onClick={onViewAllPayments}>
                      View All
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {credit.paymentHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
                      <History className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-medium mb-2">No payments yet</h3>
                    <p className="text-sm text-muted-foreground">
                      Payment history will appear here once payments are made.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {credit.paymentHistory.slice(0, 3).map((payment, index) => (
                      <div key={payment.id}>
                        <button
                          onClick={() => onViewTransaction(payment.transactionId)}
                          className="w-full text-left hover:bg-muted/50 rounded-lg p-2 -m-2 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                payment.status === 'completed' 
                                  ? 'bg-green-100 text-green-700' 
                                  : payment.status === 'pending'
                                    ? 'bg-orange-100 text-orange-700'
                                    : 'bg-red-100 text-red-700'
                              }`}>
                                {payment.status === 'completed' ? (
                                  <CheckCircle className="h-4 w-4" />
                                ) : payment.status === 'pending' ? (
                                  <Clock className="h-4 w-4" />
                                ) : (
                                  <AlertTriangle className="h-4 w-4" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-sm">
                                  {payment.type === 'regular' ? 'Regular Payment' : 
                                   payment.type === 'early' ? 'Early Payment' :
                                   payment.type === 'partial' ? 'Partial Payment' : 'Late Payment'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {payment.date} • {payment.time}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-sm text-red-600">
                                -{formatCurrency(payment.amount)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Principal: {formatCurrency(payment.principalAmount)}
                              </p>
                            </div>
                          </div>
                        </button>
                        {index < Math.min(credit.paymentHistory.length, 3) - 1 && <Separator className="mt-4" />}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            {credit.status === 'active' && (
              <div>
                <Button 
                  className="w-full" 
                  onClick={() => setShowPaymentModal(true)}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Make Payment
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Payment Modal */}
      {credit.status === 'active' && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onConfirm={handlePayment}
          creditId={credit.id}
          installmentAmount={credit.installmentAmount || credit.monthlyPayment}
          remainingBalance={credit.remaining}
          userState={userState}
          repaymentFrequency={credit.repaymentFrequency}
        />
      )}
    </div>
  );
}