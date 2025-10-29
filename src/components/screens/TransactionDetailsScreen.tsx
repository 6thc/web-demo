import { ArrowLeft, Copy, Share, Download, CheckCircle, Clock, XCircle, MapPin, CreditCard, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { getTransactionById, formatCurrency, isLoanTransaction, getCreditIdFromTransaction } from "../data/transactions";
import { getPledgerActivitiesForUserState } from "../data/pledger-activity";
import { toast } from "sonner@2.0.3";

interface TransactionDetailsScreenProps {
  transactionId: string;
  onBack: () => void;
  onViewCredit?: (creditId: string) => void;
  userState?: 'fresh' | 'active';
}

export function TransactionDetailsScreen({ transactionId, onBack, onViewCredit, userState = 'active' }: TransactionDetailsScreenProps) {
  // Try to get as regular transaction first
  let transaction = getTransactionById(transactionId, userState);
  
  // If not found, try to get as pledger activity and convert to transaction format
  if (!transaction) {
    const activities = getPledgerActivitiesForUserState(userState);
    const activity = activities.find(a => a.id === transactionId);
    
    if (activity) {
      // Convert pledger activity to transaction format
      transaction = {
        id: activity.id,
        name: activity.title,
        description: activity.description,
        amount: activity.amount || 0,
        type: activity.amount && activity.amount > 0 ? 'credit' : 'debit',
        category: 'other',
        date: activity.date,
        time: activity.time,
        status: activity.status,
        reference: `PLEDGER-${activity.type.toUpperCase()}-${activity.id}`,
        fromAccount: activity.type === 'wallet_topup' ? 'Bank Account' : 'Your Wallet',
        toAccount: activity.type === 'wallet_topup' ? 'Your Wallet' : 'External',
        balanceAfter: 0 // Pledger activities don't track running balance
      };
    }
  }

  if (!transaction) {
    return (
      <div className="bg-muted/30 min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <h3 className="font-medium mb-2">Transaction Not Found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              The requested transaction could not be found.
            </p>
            <Button onClick={onBack}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusIcon = () => {
    switch (transaction.status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "pending":
        return <Clock className="h-5 w-5 text-orange-600" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  const getStatusBadge = () => {
    switch (transaction.status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-700">Completed</Badge>;
      case "pending":
        return <Badge variant="secondary" className="bg-orange-100 text-orange-700">Pending</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">{transaction.status}</Badge>;
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const shareTransaction = () => {
    if (navigator.share) {
      navigator.share({
        title: `Transaction ${transaction.reference}`,
        text: `${transaction.type === 'credit' ? 'Received' : 'Sent'} ${formatCurrency(transaction.amount)} ${transaction.type === 'credit' ? 'from' : 'to'} ${transaction.name}`,
      });
    } else {
      copyToClipboard(
        `Transaction: ${transaction.reference}\n${transaction.type === 'credit' ? 'Received' : 'Sent'} ${formatCurrency(transaction.amount)} ${transaction.type === 'credit' ? 'from' : 'to'} ${transaction.name}\nDate: ${transaction.date} at ${transaction.time}`,
        "Transaction details"
      );
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
              <h1 className="font-semibold">Transaction Details</h1>
              <p className="text-sm text-muted-foreground">{transaction.reference}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={shareTransaction}>
              <Share className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => toast.info("Download feature coming soon")}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 pb-32">
        {/* Transaction Summary */}
        <Card className="mb-4">
          <CardContent className="p-6">
            <div className="text-center">
              <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
                transaction.type === 'credit' 
                  ? 'bg-green-100' 
                  : transaction.status === 'failed' 
                    ? 'bg-red-100' 
                    : 'bg-red-100'
              }`}>
                {getStatusIcon()}
              </div>
              
              <h2 className={`text-3xl font-bold mb-2 ${
                transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
              </h2>
              
              <p className="text-muted-foreground mb-2">{transaction.description}</p>
              <p className="font-medium">{transaction.name}</p>
              
              <div className="flex items-center justify-center gap-2 mt-4">
                {getStatusBadge()}
                <Badge variant="outline" className="capitalize">
                  {transaction.category}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transaction Details */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Transaction Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date & Time</span>
              <span className="font-medium">{transaction.date} at {transaction.time}</span>
            </div>
            
            <Separator />
            
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Reference</span>
              <div className="flex items-center gap-2">
                <span className="font-medium font-mono text-sm">{transaction.reference}</span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6"
                  onClick={() => copyToClipboard(transaction.reference || '', 'Reference')}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              <span className="font-medium capitalize">{transaction.type}</span>
            </div>
            
            <Separator />
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Category</span>
              <span className="font-medium capitalize">{transaction.category}</span>
            </div>

            {transaction.location && (
              <>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Location</span>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium text-sm">{transaction.location}</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Loan Information - Show only for loan-related transactions */}
        {isLoanTransaction(transaction) && getCreditIdFromTransaction(transaction) && onViewCredit && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Related Loan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Loan ID</p>
                  <p className="font-mono text-sm font-medium">{getCreditIdFromTransaction(transaction)}</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onViewCredit && onViewCredit(getCreditIdFromTransaction(transaction)!)}
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Loan Details
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                This payment is part of your loan repayment schedule.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Account Information */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {transaction.fromAccount && (
              <>
                <div>
                  <p className="text-muted-foreground text-sm mb-1">From Account</p>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{transaction.fromAccount}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(transaction.fromAccount || '', 'From Account')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <Separator />
              </>
            )}
            
            {transaction.toAccount && (
              <>
                <div>
                  <p className="text-muted-foreground text-sm mb-1">To Account</p>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{transaction.toAccount}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(transaction.toAccount || '', 'To Account')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <Separator />
              </>
            )}
            
            {transaction.balanceAfter !== undefined && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Balance After</span>
                <span className={`font-medium ${transaction.balanceAfter >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(transaction.balanceAfter)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fees and Charges */}
        {transaction.fee && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Fees & Charges</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Transaction Fee</span>
                <span className="font-medium text-red-600">{formatCurrency(transaction.fee)}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {transaction.status === "failed" && (
            <Button 
              className="w-full" 
              onClick={() => toast.info("Retry functionality coming soon")}
            >
              Retry Transaction
            </Button>
          )}
          
          {transaction.status === "completed" && transaction.type === "debit" && (
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => toast.info("Repeat transaction functionality coming soon")}
            >
              Repeat Transaction
            </Button>
          )}
          
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => toast.info("Dispute functionality coming soon")}
          >
            Report an Issue
          </Button>
        </div>
      </div>
    </div>
  );
}