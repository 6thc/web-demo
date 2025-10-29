import { Plus, Shield } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { hasActiveLoans } from "./data/credits";

interface RequestCreditCardProps {
  userState: 'fresh' | 'active';
  onRequestCredit?: () => void;
  className?: string;
}

export function RequestCreditCard({ userState, onRequestCredit, className }: RequestCreditCardProps) {
  const hasLoans = hasActiveLoans(userState);

  // Don't show this card if user already has active loans
  if (hasLoans) {
    return null;
  }

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Credit Available</h3>
            <p className="text-muted-foreground text-sm">
              Backed by overseas pledgers
            </p>
          </div>
        </div>
        <Button
          onClick={onRequestCredit}
          className="w-full"
          variant="default"
        >
          <Plus className="h-4 w-4 mr-2" />
          Request Credit
        </Button>
      </CardContent>
    </Card>
  );
}