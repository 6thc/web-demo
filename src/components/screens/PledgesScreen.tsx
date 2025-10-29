import React from "react";
import { Shield, Banknote, CheckCircle2, Clock, AlertCircle, Calendar, Settings, User, History, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { Progress } from "../ui/progress";
import { getCreditsForUserState, formatCurrency, calculatePaymentProgress } from "../data/credits";
import { formatUSD, getLockedFunds } from "../data/wallet";

interface PledgesScreenProps {
  userState: 'fresh' | 'active';
  refreshKey: number;
  onRequestClick?: (creditId: string) => void;
  onSettings?: () => void;
}

export function PledgesScreen({ userState, refreshKey, onRequestClick, onSettings }: PledgesScreenProps) {
  // Get actual credits data and organize by status
  const allCredits = getCreditsForUserState(userState);
  const lockedFunds = getLockedFunds();
  
  const pendingRequests = allCredits.filter(credit => 
    credit.status === 'pending' || credit.status === 'reviewing'
  );
  
  const activeCollateral = allCredits.filter(credit => 
    credit.status === 'active'
  );
  
  const pastCollateral = allCredits.filter(credit => 
    credit.status === 'completed' || credit.status === 'cancelled' || credit.status === 'defaulted'
  );

  // Helper function to get locked amount for a credit
  const getLockedAmountForCredit = (creditId: string): number => {
    const lockedFund = lockedFunds.find(fund => fund.creditId === creditId);
    return lockedFund?.amount || 0;
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { 
          label: 'Pending Review', 
          color: 'bg-primary/10 text-primary border-primary/20',
          icon: Clock 
        };
      case 'reviewing':
        return { 
          label: 'Under Review', 
          color: 'bg-primary/10 text-primary border-primary/20',
          icon: AlertCircle 
        };
      case 'active':
        return { 
          label: 'Active', 
          color: 'bg-accent/10 text-accent border-accent/20',
          icon: Shield 
        };
      case 'completed':
        return { 
          label: 'Completed', 
          color: 'bg-muted/50 text-muted-foreground border-muted',
          icon: CheckCircle2 
        };
      case 'cancelled':
        return { 
          label: 'Cancelled', 
          color: 'bg-muted/50 text-muted-foreground border-muted',
          icon: AlertCircle 
        };
      case 'defaulted':
        return { 
          label: 'Defaulted', 
          color: 'bg-destructive/10 text-destructive border-destructive/20',
          icon: AlertCircle 
        };
      default:
        return { 
          label: status, 
          color: 'bg-muted/50 text-muted-foreground border-muted',
          icon: Shield 
        };
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
      case 'reviewing':
        return {
          color: 'bg-orange-100 text-orange-600 border-orange-200',
          label: 'Pending',
          icon: Clock
        };
      case 'active':
        return {
          color: 'bg-blue-100 text-blue-700 border-blue-200',
          label: 'Active',
          icon: Shield
        };
      case 'completed':
        return {
          color: 'bg-green-100 text-green-700 border-green-200',
          label: 'Released',
          icon: CheckCircle2
        };
      case 'cancelled':
        return {
          color: 'bg-red-100 text-red-700 border-red-200',
          label: 'Cancelled',
          icon: X
        };
      case 'defaulted':
        return {
          color: 'bg-red-100 text-red-700 border-red-200',
          label: 'Defaulted',
          icon: AlertCircle
        };
      default:
        return {
          color: 'bg-muted text-muted-foreground border-muted',
          label: status,
          icon: Shield
        };
    }
  };

  return (
    <div className="bg-muted/30 h-full pt-2 relative">
      {/* Dark Grey Background - cuts off behind content */}
      <div className="absolute top-0 left-0 right-0 h-52 z-0" style={{ backgroundColor: '#3f3d56' }}></div>
      
      {/* Header */}
      <div className="px-4 pt-8 pb-4 relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-white">Pledges</h1>
            <p className="text-white/80">Manage your collateral backing</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onSettings}
            className="h-12 w-12 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/20"
          >
            <User className="h-6 w-6 text-white" />
          </Button>
        </div>

        {/* Pending Requests - Show for active users or fresh users with pending credits */}
        {(userState === 'active' || (userState === 'fresh' && pendingRequests.length > 0)) && (
          <Card className="mt-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Pending Requests
                </CardTitle>
                <Badge variant="secondary">{pendingRequests.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingRequests.map((request, index) => (
                  <div key={request.id}>
                    <button
                      onClick={() => onRequestClick?.(request.id)}
                      className="w-full text-left hover:bg-muted/50 rounded-lg p-2 -m-2 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-orange-600" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">Segun Adebayo</p>
                            <p className="text-xs text-muted-foreground">{request.submittedDate}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatUSD(Math.round(request.totalAmountUSD * 1.2))}</p>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">collateral</span>
                          </div>
                        </div>
                      </div>
                    </button>
                    {index < pendingRequests.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active Collateral - Show when user has active loans */}
        {activeCollateral.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-accent" />
                  Active Collateral
                </CardTitle>
                <Badge variant="secondary">{activeCollateral.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {activeCollateral.map((collateral, index) => (
                  <div key={collateral.id}>
                    <button
                      onClick={() => onRequestClick?.(collateral.id)}
                      className="w-full text-left hover:bg-muted/50 rounded-lg p-2 -m-2 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center">
                            <Shield className="h-5 w-5 text-accent" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">Segun Adebayo</p>
                            <Badge variant="default" className="text-xs bg-blue-100 text-blue-700">
                              Active
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatUSD(getLockedAmountForCredit(collateral.id))}</p>
                          <p className="text-xs text-muted-foreground">locked</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="text-muted-foreground">
                            {Math.round(calculatePaymentProgress(collateral))}% paid
                          </span>
                        </div>
                        <Progress 
                          value={calculatePaymentProgress(collateral)} 
                          className="h-2"
                        />
                        <p className="text-xs text-muted-foreground">
                          Loan: {formatCurrency(collateral.totalAmount)} • {collateral.term}
                        </p>
                      </div>
                    </button>
                    
                    {index < activeCollateral.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Past Collateral - Show when user has past loans */}
        {pastCollateral.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5 text-muted-foreground" />
                  Past Collateral
                </CardTitle>
                <Badge variant="secondary">{pastCollateral.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pastCollateral.map((collateral, index) => (
                  <div key={collateral.id}>
                    <button
                      onClick={() => onRequestClick?.(collateral.id)}
                      className="w-full text-left hover:bg-muted/50 rounded-lg p-2 -m-2 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getStatusConfig(collateral.status).color}`}>
                            {React.createElement(getStatusConfig(collateral.status).icon, { className: "h-5 w-5" })}
                          </div>
                          <div>
                            <p className="font-medium text-sm">Segun Adebayo</p>
                            <Badge 
                              variant="outline" 
                              className={getStatusConfig(collateral.status).color}
                            >
                              {getStatusConfig(collateral.status).label}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatUSD(Math.round(collateral.totalAmountUSD * 1.2))}</p>
                          <p className="text-xs text-muted-foreground">{collateral.completedDate || collateral.submittedDate}</p>
                        </div>
                      </div>
                    </button>
                    
                    {index < pastCollateral.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>



      {/* Fresh User Product Introduction - Only show if no credits at all */}
      {userState === 'fresh' && allCredits.length === 0 && (
        <div className="px-4 pb-6 relative z-10 space-y-4">
          {/* Hero Card */}
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Become a Pledger</h3>
              <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                Support borrowers in developing markets by providing USD collateral backing for their Naira loans. Earn competitive returns while helping others access financial opportunities.
              </p>
              <div className="bg-accent/10 rounded-lg p-4 mb-6">
                <p className="text-accent font-medium text-sm">
                  You'll be notified when someone requests your backing
                </p>
              </div>
            </CardContent>
          </Card>

          {/* How Pledging Works */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How Pledging Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-primary font-semibold text-sm">1</span>
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-1">Receive Backing Request</h4>
                  <p className="text-muted-foreground text-xs">
                    A trusted borrower invites you to back their loan request with details of amount, term, and purpose.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-primary font-semibold text-sm">2</span>
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-1">Lock USD Collateral</h4>
                  <p className="text-muted-foreground text-xs">
                    Lock 120% of the loan value in USD as collateral. Your funds are held securely until loan completion.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-primary font-semibold text-sm">3</span>
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-1">Loan Gets Approved</h4>
                  <p className="text-muted-foreground text-xs">
                    With your backing, the borrower receives instant approval and loan disbursement.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-accent font-semibold text-sm">4</span>
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-1">Earn Returns</h4>
                  <p className="text-muted-foreground text-xs">
                    Receive your collateral back plus returns when the borrower completes repayment.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Benefits for Pledgers */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Why Become a Pledger?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <Banknote className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm">Competitive Returns</h4>
                  <p className="text-muted-foreground text-xs">
                    Earn 3-6% annually on your collateral while supporting borrowers
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm">Secured Investment</h4>
                  <p className="text-muted-foreground text-xs">
                    120% collateralization ratio protects your principal investment
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm">Support Financial Inclusion</h4>
                  <p className="text-muted-foreground text-xs">
                    Help borrowers in developing markets access fair credit and build their futures
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm">Personal Connection</h4>
                  <p className="text-muted-foreground text-xs">
                    Back people you know and trust, creating meaningful financial relationships
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Risk Information */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-primary" />
                Important Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-muted-foreground text-xs leading-relaxed">
                • Your collateral is held securely and only released when the loan is fully repaid or in case of default
              </p>
              <p className="text-muted-foreground text-xs leading-relaxed">
                • In case of default, you may lose part or all of your collateral depending on recovery
              </p>
              <p className="text-muted-foreground text-xs leading-relaxed">
                • Only back borrowers you know and trust with their repayment ability
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}