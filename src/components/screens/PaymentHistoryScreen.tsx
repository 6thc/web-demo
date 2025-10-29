import { ArrowLeft, History, ArrowUpRight, CheckCircle, Clock, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { getCreditById, formatCurrency, getInstallmentLabel, type PaymentRecord } from "../data/credits";

interface PaymentHistoryScreenProps {
  creditId: string;
  onBack: () => void;
  onTransactionClick: (transactionId: string) => void;
  userState?: 'fresh' | 'active';
}

export function PaymentHistoryScreen({ creditId, onBack, onTransactionClick, userState = 'active' }: PaymentHistoryScreenProps) {
  const credit = getCreditById(creditId, userState);

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

  const getPaymentIcon = (payment: PaymentRecord) => {
    if (payment.status === "pending") return <Clock className="h-4 w-4" />;
    if (payment.status === "failed") return <XCircle className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  const getPaymentIconColor = (payment: PaymentRecord) => {
    if (payment.status === "pending") return "bg-orange-100 text-orange-700";
    if (payment.status === "failed") return "bg-red-100 text-red-700";
    return "bg-green-100 text-green-700";
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

  const getPaymentTypeName = (type: string) => {
    switch (type) {
      case "regular":
        return `${getInstallmentLabel(credit?.repaymentFrequency, 'adjective').charAt(0).toUpperCase() + getInstallmentLabel(credit?.repaymentFrequency, 'adjective').slice(1)} Payment`;
      case "early":
        return "Early Payment";
      case "partial":
        return "Partial Payment";
      case "late":
        return "Late Payment";
      default:
        return "Payment";
    }
  };

  const totalPaid = credit.paymentHistory
    .filter(p => p.status === "completed")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPrincipal = credit.paymentHistory
    .filter(p => p.status === "completed")
    .reduce((sum, p) => sum + p.principalAmount, 0);

  const totalInterest = credit.paymentHistory
    .filter(p => p.status === "completed")
    .reduce((sum, p) => sum + p.interestAmount, 0);

  return (
    <div className="bg-muted/30 min-h-screen">
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
            <h1 className="font-semibold">Payment History</h1>
            <p className="text-sm text-muted-foreground">{credit.loanId} • {credit.pledgerName}</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 pb-32">
        {/* Payment Summary */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Payment Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-muted-foreground text-sm">Total Paid</p>
                <p className="font-semibold text-green-600">{formatCurrency(Math.abs(totalPaid))}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Principal</p>
                <p className="font-semibold">{formatCurrency(totalPrincipal)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Interest</p>
                <p className="font-semibold text-orange-600">{formatCurrency(totalInterest)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payments List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              All Payments ({credit.paymentHistory.length})
            </CardTitle>
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
                {credit.paymentHistory.map((payment, index) => (
                  <div key={payment.id}>
                    <button
                      onClick={() => onTransactionClick(payment.transactionId)}
                      className="w-full text-left hover:bg-muted/50 rounded-lg p-2 -m-2 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getPaymentIconColor(payment)}`}>
                            {getPaymentIcon(payment)}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{getPaymentTypeName(payment.type)}</p>
                            <p className="text-xs text-muted-foreground">{payment.date} • {payment.time}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm text-red-600">
                            -{formatCurrency(payment.amount)}
                          </p>
                          {getStatusBadge(payment.status)}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground bg-muted/30 rounded-lg p-2">
                        <div>
                          <span>Principal: </span>
                          <span className="font-medium">{formatCurrency(payment.principalAmount)}</span>
                        </div>
                        <div>
                          <span>Interest: </span>
                          <span className="font-medium">{formatCurrency(payment.interestAmount)}</span>
                        </div>
                        <div className="col-span-2">
                          <span>Reference: </span>
                          <span className="font-mono text-xs">{payment.reference}</span>
                        </div>
                        {payment.lateFee && payment.lateFee > 0 && (
                          <div className="col-span-2">
                            <span>Late Fee: </span>
                            <span className="font-medium text-red-600">{formatCurrency(payment.lateFee)}</span>
                          </div>
                        )}
                      </div>
                    </button>
                    {index < credit.paymentHistory.length - 1 && <Separator className="mt-4" />}
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