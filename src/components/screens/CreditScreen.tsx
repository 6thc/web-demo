import React from "react";
import { Plus, Clock, CheckCircle, CheckCircle2, AlertCircle, User, Calendar, Settings, History, X, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { Progress } from "../ui/progress";
import { getPendingCreditsForUserState, getCreditsForUserState, formatCurrency } from "../data/credits";
import { toast } from "sonner@2.0.3";

interface CreditScreenProps {
  onCreateRequest: () => void;
  onCreditClick: (creditId: string) => void;
  userState: 'fresh' | 'active';
}

export function CreditScreen({ onCreateRequest, onCreditClick, userState }: CreditScreenProps) {

  // Get data based on user state
  const allCredits = getCreditsForUserState(userState);
  const pendingCredits = getPendingCreditsForUserState(userState);
  
  const activeLoans = allCredits.filter(credit => credit.status === 'active');
  const pastLoans = allCredits.filter(credit => 
    credit.status === 'completed' || credit.status === 'cancelled' || credit.status === 'defaulted'
  );

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
      case 'reviewing':
        return {
          className: 'bg-orange-100 text-orange-600 border-orange-200',
          label: 'Pending',
          icon: Clock
        };
      case 'active':
        return {
          className: 'bg-blue-100 text-blue-700 border-blue-200',
          label: 'Active',
          icon: Shield
        };
      case 'completed':
        return {
          className: 'bg-green-100 text-green-700 border-green-200',
          label: 'Paid',
          icon: CheckCircle2
        };
      case 'cancelled':
        return {
          className: 'bg-red-100 text-red-700 border-red-200',
          label: 'Cancelled',
          icon: X
        };
      case 'defaulted':
        return {
          className: 'bg-red-100 text-red-700 border-red-200',
          label: 'Defaulted',
          icon: AlertCircle
        };
      default:
        return {
          className: 'bg-muted text-muted-foreground border-muted',
          label: status,
          icon: Shield
        };
    }
  };

  return (
    <div className="bg-muted/30 h-full pt-2 relative">
      {/* Topos Red Background - cuts off behind content */}
      <div className="absolute top-0 left-0 right-0 h-52 z-0" style={{ backgroundColor: '#E52A5B' }}></div>
      
      {/* Header */}
      <div className="px-4 pt-8 pb-4 relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-white">Credit</h1>
            <p className="text-white/80">Manage your loans and credit requests</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            className="h-12 w-12 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/20"
          >
            <User className="h-6 w-6 text-white" />
          </Button>
        </div>

        {/* Pending Requests - Show for active users or fresh users with pending credits */}
        {(userState === 'active' || (userState === 'fresh' && pendingCredits.length > 0)) && (
          <Card className="mt-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Pending Requests
                </CardTitle>
                <Badge variant="secondary">{pendingCredits.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingCredits.map((credit, index) => (
                  <div key={credit.id}>
                    <button
                      onClick={() => onCreditClick(credit.id)}
                      className="w-full text-left hover:bg-muted/50 rounded-lg p-2 -m-2 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-orange-600" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{credit.pledgerName}</p>
                            <p className="text-xs text-muted-foreground">{credit.submittedDate}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(credit.totalAmount)}</p>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{credit.term}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                    {index < pendingCredits.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active Loans - Show when user has active loans */}
        {activeLoans.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-accent" />
                  Active Loans
                </CardTitle>
                <Badge variant="secondary">{activeLoans.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {activeLoans.map((loan, index) => (
                  <div key={loan.id}>
                    <button
                      onClick={() => onCreditClick(loan.id)}
                      className="w-full text-left hover:bg-muted/50 rounded-lg p-2 -m-2 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-accent" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{loan.pledgerName}</p>
                            <Badge variant="default" className="text-xs bg-blue-100 text-blue-700">
                              Active
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(loan.remaining)}</p>
                          <p className="text-xs text-muted-foreground">of {formatCurrency(loan.totalAmount)}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="text-muted-foreground">
                            {Math.round(((loan.totalAmount - loan.remaining) / loan.totalAmount) * 100)}% paid
                          </span>
                        </div>
                        <Progress 
                          value={((loan.totalAmount - loan.remaining) / loan.totalAmount) * 100} 
                          className="h-2"
                        />
                        <p className="text-xs text-muted-foreground">
                          Next payment: {loan.nextPayment}
                        </p>
                      </div>
                    </button>
                    
                    {index < activeLoans.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Past Credit - Show when user has completed or cancelled loans */}
        {pastLoans.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5 text-muted-foreground" />
                  Past Credit
                </CardTitle>
                <Badge variant="secondary">{pastLoans.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pastLoans.map((loan, index) => (
                  <div key={loan.id}>
                    <button
                      onClick={() => onCreditClick(loan.id)}
                      className="w-full text-left hover:bg-muted/50 rounded-lg p-2 -m-2 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getStatusConfig(loan.status).className}`}>
                            {React.createElement(getStatusConfig(loan.status).icon, { className: "h-5 w-5" })}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{loan.pledgerName}</p>
                            <Badge 
                              variant="outline" 
                              className={getStatusConfig(loan.status).className}
                            >
                              {getStatusConfig(loan.status).label}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(loan.totalAmount)}</p>
                          <p className="text-xs text-muted-foreground">{loan.completedDate || loan.submittedDate}</p>
                        </div>
                      </div>
                    </button>
                    
                    {index < pastLoans.length - 1 && <Separator className="mt-4" />}
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
                <User className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Pledger-Backed Credit</h3>
              <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                Access loans backed by trusted contacts abroad. Our unique system connects you with pledgers who provide USD collateral to secure your Naira loan, offering better rates and terms than traditional credit.
              </p>
              <Button
                onClick={onCreateRequest}
                className="w-full"
                size="lg"
              >
                <Plus className="h-5 w-5 mr-2" />
                Request Your First Loan
              </Button>
            </CardContent>
          </Card>

          {/* How It Works */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How Pledger-Backed Credit Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-primary font-semibold text-sm">1</span>
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-1">Submit Your Request</h4>
                  <p className="text-muted-foreground text-xs">
                    Specify your loan amount, term, and purpose. Invite a trusted contact abroad to be your pledger.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-primary font-semibold text-sm">2</span>
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-1">Pledger Provides Collateral</h4>
                  <p className="text-muted-foreground text-xs">
                    Your pledger locks USD collateral (120% of loan value) to secure your loan.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-primary font-semibold text-sm">3</span>
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-1">Receive Your Loan</h4>
                  <p className="text-muted-foreground text-xs">
                    Once approved, receive your Naira loan instantly in your wallet.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-accent font-semibold text-sm">4</span>
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-1">Repay & Release</h4>
                  <p className="text-muted-foreground text-xs">
                    Make scheduled payments. When fully repaid, your pledger's collateral is released.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Benefits */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Why Choose Pledger-Backed Credit?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm">Lower Interest Rates</h4>
                  <p className="text-muted-foreground text-xs">
                    USD collateral backing means competitive rates from 8-12% annually
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm">Flexible Terms</h4>
                  <p className="text-muted-foreground text-xs">
                    Choose repayment periods from 3 to 12 months that fit your needs
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm">No Traditional Credit Check</h4>
                  <p className="text-muted-foreground text-xs">
                    Approval based on pledger backing, not just your credit history
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm">Instant Disbursement</h4>
                  <p className="text-muted-foreground text-xs">
                    Receive funds immediately after approval and collateral confirmation
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Floating Action Button - Show for users with existing credits */}
      {(userState === 'active' || (userState === 'fresh' && allCredits.length > 0)) && (
        <div className="px-4 pb-6 relative z-10">
          <div className="flex justify-center">
            <Button
              onClick={onCreateRequest}
              size="lg"
              className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow"
            >
              <Plus className="h-6 w-6" />
              <span className="sr-only">Create new credit request</span>
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}