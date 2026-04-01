import { AlertTriangle } from "lucide-react";
import { Button } from "./ui/button";
import { type Credit, formatCurrency } from "./data/credits";

interface GraceAlertBannerProps {
  credit: Credit;
  onMakePayment: () => void;
}

export function GraceAlertBanner({ credit, onMakePayment }: GraceAlertBannerProps) {
  const daysRemaining = credit.graceDeadline
    ? Math.max(0, Math.ceil((new Date(credit.graceDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const isUrgent = daysRemaining <= 3;

  return (
    <div className={`rounded-xl p-4 border ${
      isUrgent
        ? 'bg-red-50 border-red-200'
        : 'bg-orange-50 border-orange-200'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUrgent ? 'bg-red-100' : 'bg-orange-100'
        }`}>
          <AlertTriangle className={`h-5 w-5 ${isUrgent ? 'text-red-600' : 'text-orange-600'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold text-sm ${isUrgent ? 'text-red-800' : 'text-orange-800'}`}>
            Payment Overdue
          </h3>
          <p className={`text-xs mt-1 ${isUrgent ? 'text-red-700' : 'text-orange-700'}`}>
            {daysRemaining > 0
              ? `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining before default`
              : 'Grace period expired — default imminent'}
          </p>
          {(credit.penaltyInterest ?? 0) > 0 && (
            <p className={`text-xs mt-1 font-medium ${isUrgent ? 'text-red-800' : 'text-orange-800'}`}>
              Penalty interest accrued: {formatCurrency(credit.penaltyInterest!)}
            </p>
          )}
        </div>
      </div>
      <Button
        className="w-full mt-3"
        variant={isUrgent ? 'destructive' : 'default'}
        onClick={onMakePayment}
      >
        Make Payment Now
      </Button>
    </div>
  );
}
