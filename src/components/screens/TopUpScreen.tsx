import { useState } from "react";
import { ArrowLeft, Wallet, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { topUpWallet, formatUSD } from "../data/wallet";
import { addPledgerActivity } from "../data/pledger-activity";
import { toast } from "sonner@2.0.3";

interface TopUpScreenProps {
  onBack: () => void;
  onSuccess: () => void;
  userState?: 'fresh' | 'active';
  notificationsEnabled?: boolean;
}

export function TopUpScreen({ onBack, onSuccess, userState = 'active', notificationsEnabled = true }: TopUpScreenProps) {
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAmountChange = (value: string) => {
    // Only allow numbers and decimal points
    const sanitized = value.replace(/[^0-9.]/g, '');
    // Prevent multiple decimal points
    const parts = sanitized.split('.');
    if (parts.length > 2) {
      return;
    }
    // Limit to 2 decimal places
    if (parts[1] && parts[1].length > 2) {
      return;
    }
    setAmount(sanitized);
  };

  const handleTopUp = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      if (notificationsEnabled) {
        toast.error("Invalid amount", {
          description: "Please enter a valid amount greater than 0"
        });
      }
      return;
    }

    setIsLoading(true);
    
    try {
      const result = topUpWallet(parseFloat(amount));
      
      if (result.success) {
        // Add to pledger activity log
        addPledgerActivity({
          type: 'wallet_topup',
          title: 'Wallet Top-up',
          description: 'Bank transfer received',
          amount: parseFloat(amount),
          date: new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          }),
          time: new Date().toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          }),
          status: 'completed'
        }, userState);

        if (notificationsEnabled) {
          toast.success("Top up successful", {
            description: `${formatUSD(parseFloat(amount))} added to your wallet`
          });
        }
        onSuccess();
      } else {
        if (notificationsEnabled) {
          toast.error("Top up failed", {
            description: result.error || "Please try again"
          });
        }
      }
    } catch (error) {
      if (notificationsEnabled) {
        toast.error("Top up failed", {
          description: "An unexpected error occurred"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const quickAmounts = [50, 100, 250, 500];

  return (
    <div className="bg-muted/30 h-full pt-2 relative">
      {/* Dark Grey Background */}
      <div className="absolute top-0 left-0 right-0 h-32 z-0" style={{ backgroundColor: '#3f3d56' }}></div>
      
      {/* Header */}
      <div className="px-4 pt-8 pb-4 relative z-10">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-10 w-10 text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-white">Top Up Wallet</h1>
            <p className="text-white/80">Add money to your balance</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 relative z-10 space-y-6">
        {/* Top Up Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-accent" />
              Add Money
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="amount">Amount</Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="amount"
                  type="text"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="pl-8 h-12"
                />
              </div>
            </div>

            {/* Quick Amount Buttons */}
            <div>
              <Label>Quick amounts</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {quickAmounts.map((quickAmount) => (
                  <Button
                    key={quickAmount}
                    variant="outline"
                    onClick={() => setAmount(quickAmount.toString())}
                    className="h-10"
                  >
                    ${quickAmount}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Method Info */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p>Bank Account</p>
                <p className="text-muted-foreground">Instant transfer</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info */}
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-muted-foreground">
            Funds will be available immediately in your wallet. You can use these funds to back loans for borrowers.
          </p>
        </div>
      </div>

      {/* Bottom Button */}
      <div className="px-4 pt-6 pb-6">
        <Button 
          onClick={handleTopUp}
          disabled={!amount || parseFloat(amount) <= 0 || isLoading}
          className="w-full h-12"
        >
          {isLoading ? 'Processing...' : `Add ${formatUSD(parseFloat(amount) || 0)}`}
        </Button>
      </div>
    </div>
  );
}