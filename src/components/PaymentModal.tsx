import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Card, CardContent } from "./ui/card";
import { Separator } from "./ui/separator";
import { DollarSign, CreditCard, Wallet } from "lucide-react";
import { formatCurrency, getInstallmentLabel } from "./data/credits";
import { getCurrentBalance } from "./data/transactions";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number, paymentType: 'regular' | 'full' | 'custom') => void;
  creditId: string;
  installmentAmount: number;
  remainingBalance: number;
  userState: 'fresh' | 'active';
  repaymentFrequency?: 'Daily' | 'Weekly' | 'Biweekly' | 'Monthly';
}

export function PaymentModal({
  isOpen,
  onClose,
  onConfirm,
  creditId,
  installmentAmount,
  remainingBalance,
  userState,
  repaymentFrequency
}: PaymentModalProps) {
  const [paymentType, setPaymentType] = useState<'regular' | 'full' | 'custom'>('regular');
  const [customAmount, setCustomAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const currentBalance = getCurrentBalance(userState);

  const getPaymentAmount = () => {
    switch (paymentType) {
      case 'regular':
        return Math.min(installmentAmount, remainingBalance);
      case 'full':
        return remainingBalance;
      case 'custom':
        return parseFloat(customAmount) || 0;
      default:
        return 0;
    }
  };

  const paymentAmount = getPaymentAmount();
  const hasInsufficientFunds = paymentAmount > currentBalance;

  const handleConfirm = async () => {
    if (paymentAmount <= 0 || hasInsufficientFunds) return;
    
    setIsProcessing(true);
    try {
      await onConfirm(paymentAmount, paymentType);
      onClose();
      setPaymentType('regular');
      setCustomAmount('');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    onClose();
    setPaymentType('regular');
    setCustomAmount('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Make Payment
          </DialogTitle>
          <DialogDescription>
            Choose your payment amount and complete your loan payment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Balance */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Available Balance</span>
                </div>
                <span className="font-semibold text-green-600">
                  {formatCurrency(currentBalance)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Options */}
          <div className="space-y-4">
            <Label>Select Payment Amount</Label>
            <RadioGroup value={paymentType} onValueChange={(value) => setPaymentType(value as 'regular' | 'full' | 'custom')}>
              {/* Regular Payment */}
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="regular" id="regular" />
                <Label htmlFor="regular" className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50">
                    <div>
                      <p className="font-medium">Next Payment</p>
                      <p className="text-sm text-muted-foreground">Regular {getInstallmentLabel(repaymentFrequency, 'noun')}</p>
                    </div>
                    <span className="font-semibold text-blue-600">
                      {formatCurrency(Math.min(installmentAmount, remainingBalance))}
                    </span>
                  </div>
                </Label>
              </div>

              {/* Full Payment */}
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="full" id="full" />
                <Label htmlFor="full" className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50">
                    <div>
                      <p className="font-medium">Pay Full Amount</p>
                      <p className="text-sm text-muted-foreground">Complete loan payoff</p>
                    </div>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(remainingBalance)}
                    </span>
                  </div>
                </Label>
              </div>

              {/* Custom Payment */}
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="custom" id="custom" />
                <Label htmlFor="custom" className="flex-1 cursor-pointer">
                  <div className="p-3 rounded-lg border hover:bg-muted/50">
                    <div className="mb-2">
                      <p className="font-medium">Custom Amount</p>
                      <p className="text-sm text-muted-foreground">Enter your preferred amount</p>
                    </div>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        className="pl-10"
                        min="0"
                        max={remainingBalance}
                        step="0.01"
                        disabled={paymentType !== 'custom'}
                      />
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Payment Summary */}
          {paymentAmount > 0 && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Payment Amount</span>
                  <span className="font-semibold">{formatCurrency(paymentAmount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Remaining After Payment</span>
                  <span className="font-semibold">
                    {formatCurrency(Math.max(0, remainingBalance - paymentAmount))}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">New Account Balance</span>
                  <span className={`font-semibold ${hasInsufficientFunds ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(currentBalance - paymentAmount)}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Message */}
          {hasInsufficientFunds && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-600 font-medium">Insufficient Funds</p>
              <p className="text-xs text-red-500 mt-1">
                You need {formatCurrency(paymentAmount - currentBalance)} more to make this payment.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              className="flex-1"
              disabled={paymentAmount <= 0 || hasInsufficientFunds || isProcessing}
            >
              {isProcessing ? 'Processing...' : `Pay ${formatCurrency(paymentAmount)}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}