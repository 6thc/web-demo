import { ArrowLeft, CheckCircle, XCircle, Clock, ArrowUpRight, ArrowDownLeft, Shield, DollarSign, Users, Banknote } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { getPledgerActivitiesForUserState, formatCurrency, type PledgerActivity } from "../data/pledger-activity";

interface PledgerActivityDetailsScreenProps {
  activityId: string;
  onBack: () => void;
  onViewPledge?: (creditId: string) => void;
  userState: 'fresh' | 'active';
}

export function PledgerActivityDetailsScreen({
  activityId,
  onBack,
  onViewPledge,
  userState
}: PledgerActivityDetailsScreenProps) {
  const activities = getPledgerActivitiesForUserState(userState);
  const activity = activities.find(a => a.id === activityId);

  if (!activity) {
    return (
      <div className="flex flex-col h-full bg-background">
        <div className="flex items-center justify-between p-4 border-b">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Activity Details</h1>
          <div className="w-10" />
        </div>
        
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <p className="text-muted-foreground">Activity not found</p>
          </div>
        </div>
      </div>
    );
  }

  const getActivityIcon = (activity: PledgerActivity) => {
    switch (activity.type) {
      case 'wallet_topup':
        return <ArrowDownLeft className="h-5 w-5" />;
      case 'wallet_withdrawal':
        return <ArrowUpRight className="h-5 w-5" />;
      case 'collateral_locked':
        return <Shield className="h-5 w-5" />;
      case 'collateral_released':
        return <Shield className="h-5 w-5" />;
      case 'pledge_approved':
        return <CheckCircle className="h-5 w-5" />;
      case 'pledge_declined':
        return <XCircle className="h-5 w-5" />;
      case 'payment_received':
        return <DollarSign className="h-5 w-5" />;
      case 'loan_completed':
        return <CheckCircle className="h-5 w-5" />;
      case 'loan_disbursed':
        return <Banknote className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  const getActivityIconColor = (activity: PledgerActivity) => {
    switch (activity.type) {
      case 'wallet_topup':
      case 'payment_received':
      case 'collateral_released':
        return 'bg-green-100 text-green-600';
      case 'wallet_withdrawal':
      case 'pledge_declined':
        return 'bg-red-100 text-red-600';
      case 'collateral_locked':
        return 'bg-red-100 text-red-600';
      case 'pledge_approved':
      case 'loan_completed':
      case 'loan_disbursed':
        return 'bg-blue-100 text-blue-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">Completed</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
      case 'failed':
        return <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getAmountDisplay = (activity: PledgerActivity) => {
    if (!activity.amount) return null;
    
    const isPositive = ['wallet_topup', 'payment_received', 'collateral_released'].includes(activity.type);
    const isNegative = ['wallet_withdrawal', 'collateral_locked'].includes(activity.type);
    
    if (isPositive) {
      return (
        <p className="text-green-600 font-semibold text-lg">
          +{formatCurrency(activity.amount, activity.currency)}
        </p>
      );
    } else if (isNegative) {
      return (
        <p className="text-red-600 font-semibold text-lg">
          -{formatCurrency(activity.amount, activity.currency)}
        </p>
      );
    } else {
      return (
        <p className="text-blue-600 font-semibold text-lg">
          {formatCurrency(activity.amount, activity.currency)}
        </p>
      );
    }
  };

  const getActivityTypeDescription = (type: string) => {
    switch (type) {
      case 'wallet_topup':
        return 'Money added to your wallet';
      case 'wallet_withdrawal':
        return 'Money withdrawn from your wallet';
      case 'collateral_locked':
        return 'Funds locked as collateral for a loan';
      case 'collateral_released':
        return 'Collateral funds released back to wallet';
      case 'pledge_approved':
        return 'Loan request approved and collateral locked';
      case 'pledge_declined':
        return 'Loan request declined';
      case 'payment_received':
        return 'Loan payment received from borrower';
      case 'loan_completed':
        return 'Loan fully repaid and completed';
      case 'loan_disbursed':
        return 'Loan funds disbursed to borrower';
      default:
        return 'Activity details';
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">Activity Details</h1>
        <div className="w-10" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Main Activity Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getActivityIconColor(activity)}`}>
                {getActivityIcon(activity)}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-semibold text-lg">{activity.title}</h2>
                    <p className="text-muted-foreground text-sm mt-1">
                      {getActivityTypeDescription(activity.type)}
                    </p>
                  </div>
                  <div className="text-right">
                    {getAmountDisplay(activity)}
                    <div className="mt-2">
                      {getStatusBadge(activity.status)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Transaction Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date</span>
              <span>{activity.date}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Time</span>
              <span>{activity.time}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              {getStatusBadge(activity.status)}
            </div>
            {activity.amount && (
              <>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-semibold">{formatCurrency(activity.amount, activity.currency)}</span>
                </div>
              </>
            )}
            {activity.borrowerName && (
              <>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">From</span>
                  <span>{activity.borrowerName}</span>
                </div>
              </>
            )}
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Activity ID</span>
              <span className="font-mono text-sm">{activity.id}</span>
            </div>
          </CardContent>
        </Card>

        {/* Description Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{activity.description}</p>
          </CardContent>
        </Card>

        {/* Additional Context for Credit-Related Activities */}
        {activity.creditId && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Related Pledge</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Pledge ID: {activity.creditId}</span>
              </div>
              {activity.borrowerName && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Borrower: {activity.borrowerName}</span>
                </div>
              )}
              {onViewPledge && (
                <Button 
                  onClick={() => onViewPledge(activity.creditId!)}
                  className="w-full"
                  variant="outline"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  View Pledge Details
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}