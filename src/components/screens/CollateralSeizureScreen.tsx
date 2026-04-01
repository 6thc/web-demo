import { ArrowLeft, ShieldAlert, Wallet, User, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { type Credit, formatCurrency } from "../data/credit-calculations";
import { getCreditById } from "../data/credits";
import { formatUSD } from "../data/wallet";
import { BORROWER_NAME } from "../data/demo-config";

interface CollateralSeizureScreenProps {
  creditId: string;
  onBack: () => void;
  userState: 'fresh' | 'active';
}

export function CollateralSeizureScreen({ creditId, onBack, userState }: CollateralSeizureScreenProps) {
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

  const settlement = credit.settlement;

  return (
    <div className="bg-muted/30 min-h-screen page-enter">
      {/* Header */}
      <div className="bg-red-600 px-4 py-6">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-10 w-10 text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold text-white">Collateral Seizure</h1>
        </div>
        <div className="text-center pb-2">
          <div className="w-16 h-16 bg-white/20 rounded-full mx-auto mb-3 flex items-center justify-center">
            <ShieldAlert className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white mb-1">Collateral Seized</h2>
          <p className="text-white/80 text-sm">{credit.loanId}</p>
        </div>
      </div>

      <div className="px-4 pt-4 pb-6 space-y-4">
        {/* Settlement Breakdown */}
        {settlement && (
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <ShieldAlert className="h-5 w-5" />
                Settlement Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Seized</span>
                <span className="font-semibold text-red-600">{formatUSD(settlement.totalSeized)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Warranty Claim (Credit JV)</span>
                <span className="font-semibold">{formatUSD(settlement.creditJVShare)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Platform Fee (Topos)</span>
                <span className="font-semibold">{formatUSD(settlement.toposFeeShare)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Returned to You</span>
                <span className="font-semibold text-green-600">{formatUSD(settlement.pledgerRemainder)}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Wallet Impact */}
        {settlement && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Wallet Impact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-red-700">Collateral Seized</span>
                  <span className="font-semibold text-red-700">-{formatUSD(settlement.totalSeized)}</span>
                </div>
                {settlement.pledgerRemainder > 0 && (
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-green-700">Remainder Returned</span>
                    <span className="font-semibold text-green-700">+{formatUSD(settlement.pledgerRemainder)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Associated Credit */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Associated Credit
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="font-medium text-sm">{BORROWER_NAME}</p>
                <p className="text-xs text-muted-foreground">Borrower</p>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-muted-foreground text-sm">Original Loan</p>
                <p className="font-semibold">{formatCurrency(credit.totalAmount)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Term</p>
                <p className="font-semibold">{credit.term}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back Button */}
        <Button variant="outline" className="w-full" onClick={onBack}>
          Back to Pledges
        </Button>
      </div>
    </div>
  );
}
