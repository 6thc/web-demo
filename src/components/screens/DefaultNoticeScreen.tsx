import { ArrowLeft, ShieldAlert, Calendar, AlertTriangle, Ban } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { type Credit, formatCurrency } from "../data/credit-calculations";
import { getCreditById } from "../data/credits";

interface DefaultNoticeScreenProps {
  creditId: string;
  onBack: () => void;
  userState: 'fresh' | 'active';
}

export function DefaultNoticeScreen({ creditId, onBack, userState }: DefaultNoticeScreenProps) {
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
      {/* Red Header */}
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
          <h1 className="font-semibold text-white">Default Notice</h1>
        </div>
        <div className="text-center pb-2">
          <div className="w-16 h-16 bg-white/20 rounded-full mx-auto mb-3 flex items-center justify-center">
            <ShieldAlert className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white mb-1">Loan Defaulted</h2>
          <p className="text-white/80 text-sm">{credit.loanId}</p>
        </div>
      </div>

      <div className="px-4 pt-4 pb-6 space-y-4">
        {/* Settlement Summary */}
        {settlement && (
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <ShieldAlert className="h-5 w-5" />
                Settlement Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Owed</span>
                <span className="font-semibold">{formatCurrency(credit.remaining + (credit.penaltyInterest || 0))}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Collateral Seized</span>
                <span className="font-semibold text-red-600">{formatCurrency(settlement.totalSeized)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Outstanding Balance</span>
                <span className="font-semibold text-red-700">{formatCurrency(settlement.outstandingDebt)}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Event Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Overdue */}
              {credit.overdueDate && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Payment Overdue</p>
                    <p className="text-xs text-muted-foreground">{credit.overdueDate}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Missed installment triggered grace period</p>
                  </div>
                </div>
              )}

              {/* Grace Deadline */}
              {credit.graceDeadline && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Calendar className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Grace Period Expired</p>
                    <p className="text-xs text-muted-foreground">{credit.graceDeadline}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {credit.gracePeriodDays || 14}-day grace period ended without payment
                    </p>
                  </div>
                </div>
              )}

              {/* Default */}
              {credit.defaultDate && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-red-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ShieldAlert className="h-4 w-4 text-red-700" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Loan Declared in Default</p>
                    <p className="text-xs text-muted-foreground">{credit.defaultDate}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Collateral seized, credit access frozen</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Credit Access Frozen Badge */}
        <div className="flex justify-center">
          <Badge variant="destructive" className="px-4 py-2 text-sm gap-2">
            <Ban className="h-4 w-4" />
            Credit Access Frozen
          </Badge>
        </div>

        {/* Back Button */}
        <Button variant="outline" className="w-full" onClick={onBack}>
          Back to Credit
        </Button>
      </div>
    </div>
  );
}
