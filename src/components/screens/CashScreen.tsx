import { ArrowLeft, Banknote, ArrowUpRight, ArrowDownLeft, DollarSign } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import { getAccountBalances, formatCurrency } from "../data/transactions";
import { toast } from "sonner@2.0.3";

interface CashScreenProps {
  onBack: () => void;
  onCashTransaction: (type: 'withdraw' | 'deposit', amount: number) => void;
  userState: 'fresh' | 'active';
  notificationsEnabled?: boolean;
}

export function CashScreen({ onBack, onCashTransaction, userState, notificationsEnabled = true }: CashScreenProps) {
  const [selectedAction, setSelectedAction] = useState<'withdraw' | 'deposit' | null>(null);
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const balances = getAccountBalances(userState);
  const checkingBalance = balances.checking;

  const handleAmountChange = (value: string) => {
    // Only allow numbers and decimal point
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

  const getAmountValue = (): number => {
    const value = parseFloat(amount);
    return isNaN(value) ? 0 : value;
  };

  const canProceed = (): boolean => {
    const amountValue = getAmountValue();
    if (amountValue <= 0) return false;
    
    if (selectedAction === 'withdraw') {
      return amountValue <= checkingBalance;
    }
    
    return true; // No limit for deposits
  };

  const getValidationMessage = (): string | null => {
    const amountValue = getAmountValue();
    
    if (amountValue <= 0) {
      return "Please enter a valid amount";
    }
    
    if (selectedAction === 'withdraw' && amountValue > checkingBalance) {
      return `Amount exceeds available balance (${formatCurrency(checkingBalance)})`;
    }
    
    return null;
  };

  const handleConfirm = async () => {
    if (!selectedAction || !canProceed()) return;
    
    setIsProcessing(true);
    
    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      onCashTransaction(selectedAction, getAmountValue());
      
      const actionText = selectedAction === 'withdraw' ? 'Withdrawal' : 'Deposit';
      const actionPastTense = selectedAction === 'withdraw' ? 'withdrawn from' : 'deposited to';
      
      if (notificationsEnabled) {
        toast.success(`${actionText} successful!`, {
          description: `${formatCurrency(getAmountValue())} has been ${actionPastTense} your account.`
        });
      }
      
      onBack();
    } catch (error) {
      if (notificationsEnabled) {
        toast.error("Transaction failed", {
          description: "Please try again or contact support."
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    if (selectedAction && amount) {
      // Reset to action selection if user has entered details
      setSelectedAction(null);
      setAmount('');
    } else {
      // Go back to previous screen
      onBack();
    }
  };

  const validationMessage = getValidationMessage();

  return (
    <div className="bg-muted/30 h-full pt-2 relative">
      {/* Topos Red Background */}
      <div className="absolute top-0 left-0 right-0 h-32 z-0" style={{ backgroundColor: '#E52A5B' }}></div>
      
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
            <h1 className="text-white">Cash Services</h1>
            <p className="text-white/80">Withdraw or deposit cash to your account</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 relative z-10 space-y-6">

        {/* Balance Display */}
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-muted-foreground mb-1">Available Balance</p>
              <h2>{formatCurrency(checkingBalance)}</h2>
            </div>
          </CardContent>
        </Card>

        {!selectedAction ? (
          /* Action Selection */
          <>
            <Card className="cursor-pointer" onClick={() => setSelectedAction('withdraw')}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <ArrowUpRight className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3>Withdraw Cash</h3>
                    <p className="text-muted-foreground">Take money out of your account</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer" onClick={() => setSelectedAction('deposit')}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center">
                    <ArrowDownLeft className="h-6 w-6 text-accent" />
                  </div>
                  <div className="flex-1">
                    <h3>Deposit Cash</h3>
                    <p className="text-muted-foreground">Add money to your account</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          /* Amount Entry */
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {selectedAction === 'withdraw' ? (
                  <ArrowUpRight className="h-5 w-5 text-primary" />
                ) : (
                  <ArrowDownLeft className="h-5 w-5 text-accent" />
                )}
                {selectedAction === 'withdraw' ? 'Withdraw Cash' : 'Deposit Cash'}
              </CardTitle>
              <p className="text-muted-foreground">
                {selectedAction === 'withdraw' 
                  ? 'Enter the amount to withdraw' 
                  : 'Enter the amount to deposit'
                }
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="amount">Amount</Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                    ₦
                  </span>
                  <Input
                    id="amount"
                    type="text"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    className="pl-8 h-12"
                    autoFocus
                  />
                </div>
                {selectedAction === 'withdraw' && (
                  <p className="text-muted-foreground mt-1">
                    Maximum: {formatCurrency(checkingBalance)}
                  </p>
                )}
                {validationMessage && (
                  <p className="text-destructive mt-1">{validationMessage}</p>
                )}
              </div>

              {getAmountValue() > 0 && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Transaction Amount</span>
                    <span>{formatCurrency(getAmountValue())}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      {selectedAction === 'withdraw' ? 'New Balance (after withdrawal)' : 'New Balance (after deposit)'}
                    </span>
                    <span>
                      {formatCurrency(
                        selectedAction === 'withdraw' 
                          ? checkingBalance - getAmountValue()
                          : checkingBalance + getAmountValue()
                      )}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Bottom Button Area */}
      {selectedAction && (
        <div className="px-4 pt-6 pb-6 space-y-3">
          <Button 
            onClick={handleConfirm}
            disabled={!canProceed() || isProcessing}
            className="w-full h-12"
          >
            {isProcessing ? 'Processing...' : `Confirm ${selectedAction === 'withdraw' ? 'Withdrawal' : 'Deposit'}`}
          </Button>
          <Button 
            variant="outline"
            onClick={handleCancel}
            disabled={isProcessing}
            className="w-full h-12"
          >
            {selectedAction && amount ? 'Back' : 'Cancel'}
          </Button>
        </div>
      )}
    </div>
  );
}