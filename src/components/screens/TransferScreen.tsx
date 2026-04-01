import { useState } from "react";
import { ArrowLeft, Phone, Building2, ArrowUpRight, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { toast } from "sonner@2.0.3";
import { getAccountBalances, formatCurrency, addTransferTransaction } from "../data/transactions";

interface TransferScreenProps {
  onBack: () => void;
  onTransferSuccess: () => void;
  userState: 'fresh' | 'active';
  notificationsEnabled?: boolean;
}

export function TransferScreen({ onBack, onTransferSuccess, userState, notificationsEnabled = true }: TransferScreenProps) {
  const [step, setStep] = useState<'method' | 'details' | 'confirm' | 'success'>('method');
  const [transferType, setTransferType] = useState<'topos' | 'external'>('topos');
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [description, setDescription] = useState('');

  const balances = getAccountBalances(userState);
  const checkingBalance = balances.checking;

  const handleMethodSelect = (type: 'topos' | 'external') => {
    setTransferType(type);
    setStep('details');
  };

  const handleDetailsSubmit = () => {
    const transferAmount = parseFloat(amount);
    
    // Validation
    if (!amount || transferAmount <= 0) {
      if (notificationsEnabled) {
        toast.error("Invalid amount", {
          description: "Please enter a valid amount."
        });
      }
      return;
    }

    if (transferAmount > checkingBalance) {
      if (notificationsEnabled) {
        toast.error("Insufficient funds", {
          description: `Amount exceeds available balance of ${formatCurrency(checkingBalance)}.`
        });
      }
      return;
    }

    if (transferType === 'topos') {
      if (!recipient) {
        if (notificationsEnabled) {
          toast.error("Missing recipient", {
            description: "Please enter the recipient's phone number."
          });
        }
        return;
      }
      // Basic phone validation
      if (recipient.length < 10) {
        toast.error("Invalid phone number", {
          description: "Please enter a valid phone number."
        });
        return;
      }
    } else {
      if (!accountNumber || !bankName || !accountName) {
        toast.error("Missing details", {
          description: "Please fill in all required bank account details."
        });
        return;
      }
    }

    setStep('confirm');
  };

  const handleConfirmTransfer = () => {
    const transferAmount = parseFloat(amount);
    
    const result = addTransferTransaction(
      transferType,
      transferAmount,
      transferType === 'topos' ? recipient : `${accountName} - ${bankName}`,
      description,
      userState
    );
    
    if (result.success) {
      setStep('success');
      setTimeout(() => {
        onTransferSuccess();
      }, 2000);
    } else {
      toast.error("Transfer failed", {
        description: result.error || "Please try again."
      });
    }
  };

  const renderMethodSelection = () => (
    <div className="space-y-6">
      <Card 
        className={`cursor-pointer transition-all ${
          transferType === 'topos' ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
        }`}
        onClick={() => setTransferType('topos')}
      >
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Phone className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3>Topos Account</h3>
              <p className="text-muted-foreground">
                Send money to another Topos user using their phone number. Instant and free.
              </p>
            </div>
            <RadioGroup value={transferType} className="mt-1">
              <RadioGroupItem value="topos" />
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      <Card 
        className={`cursor-pointer transition-all ${
          transferType === 'external' ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
        }`}
        onClick={() => setTransferType('external')}
      >
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-accent" />
            </div>
            <div className="flex-1">
              <h3>Bank Account</h3>
              <p className="text-muted-foreground">
                Transfer to any bank account. May take 1-3 business days to process.
              </p>
            </div>
            <RadioGroup value={transferType} className="mt-1">
              <RadioGroupItem value="external" />
            </RadioGroup>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderDetailsForm = () => (
    <div className="space-y-6">
      {/* Amount Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpRight className="h-5 w-5 text-primary" />
            Transfer Amount
          </CardTitle>
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
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-8 h-12"
              />
            </div>
            <p className="text-muted-foreground mt-1">
              Available: {formatCurrency(checkingBalance)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Recipient Details Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {transferType === 'topos' ? (
              <Phone className="h-5 w-5 text-primary" />
            ) : (
              <Building2 className="h-5 w-5 text-accent" />
            )}
            {transferType === 'topos' ? 'Topos Recipient' : 'Bank Details'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {transferType === 'topos' ? (
            <div>
              <Label htmlFor="recipient">Recipient's Phone Number</Label>
              <Input
                id="recipient"
                type="tel"
                placeholder="+234 801 234 5678"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="h-12 mt-1"
              />
              <p className="text-muted-foreground mt-1">
                Enter the phone number associated with their Topos account
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="accountName">Account Holder Name</Label>
                <Input
                  id="accountName"
                  placeholder="John Smith"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="h-12 mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input
                  id="accountNumber"
                  placeholder="1234567890"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="h-12 mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="bankName">Bank Name</Label>
                <Input
                  id="bankName"
                  placeholder="First Bank of Nigeria"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="h-12 mt-1"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Description Card */}
      <Card>
        <CardContent className="p-4">
          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              placeholder="What's this for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-12 mt-1"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderConfirmation = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpRight className="h-5 w-5" />
            Transfer Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-semibold">{formatCurrency(parseFloat(amount))}</span>
          </div>
          
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-muted-foreground">To</span>
            <div className="text-right">
              <p className="font-medium">
                {transferType === 'topos' ? recipient : accountName}
              </p>
              {transferType === 'external' && (
                <p className="text-sm text-muted-foreground">{bankName}</p>
              )}
            </div>
          </div>
          
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-muted-foreground">Transfer Type</span>
            <span className="font-medium">
              {transferType === 'topos' ? 'Topos Account' : 'Bank Transfer'}
            </span>
          </div>
          
          {description && (
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Description</span>
              <span className="font-medium">{description}</span>
            </div>
          )}
          
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-muted-foreground">Fee</span>
            <span className="font-medium text-accent">
              {transferType === 'topos' ? 'Free' : formatCurrency(0)}
            </span>
          </div>
          
          <div className="flex justify-between items-center py-2 font-semibold">
            <span>Total</span>
            <span>{formatCurrency(parseFloat(amount))}</span>
          </div>
        </CardContent>
      </Card>

      <div className="bg-muted/50 p-4 rounded-lg">
        <p className="text-sm text-muted-foreground">
          {transferType === 'topos' 
            ? 'This transfer will be processed instantly and the recipient will be notified.'
            : 'This transfer may take 1-3 business days to complete. You will receive a notification when it\'s processed.'
          }
        </p>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setStep('details')} className="flex-1">
          Edit Details
        </Button>
        <Button onClick={handleConfirmTransfer} className="flex-1">
          Confirm Transfer
        </Button>
      </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="text-center space-y-6 py-8">
      <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle className="h-10 w-10 text-accent" />
      </div>
      
      <div>
        <h2>Transfer Successful!</h2>
        <p className="text-muted-foreground">
          Your transfer of {formatCurrency(parseFloat(amount))} has been {transferType === 'topos' ? 'sent' : 'initiated'}.
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Sent to</span>
            <span>
              {transferType === 'topos' ? recipient : `${accountName} - ${bankName}`}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="bg-muted/50 rounded-lg p-4">
        <p className="text-muted-foreground">
          {transferType === 'topos' 
            ? 'The recipient has been notified and the funds are available immediately.'
            : 'You will receive updates on the transfer status via notifications.'
          }
        </p>
      </div>
    </div>
  );

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
            <h1 className="text-white">
              {step === 'method' && 'Transfer Money'}
              {step === 'details' && `${transferType === 'topos' ? 'Topos' : 'Bank'} Transfer`}
              {step === 'confirm' && 'Confirm Transfer'}
              {step === 'success' && 'Transfer Complete'}
            </h1>
            <p className="text-white/80">
              {step === 'method' && 'Choose how you want to send money'}
              {step === 'details' && 'Enter transfer details'}
              {step === 'confirm' && 'Review your transfer details'}
              {step === 'success' && 'Your money is on its way'}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 relative z-10 space-y-6">
        {step === 'method' && renderMethodSelection()}
        {step === 'details' && renderDetailsForm()}
        {step === 'confirm' && renderConfirmation()}
        {step === 'success' && renderSuccess()}
      </div>

      {/* Bottom Button Area */}
      {step === 'method' && (
        <div className="px-4 pt-6 pb-6">
          <Button 
            onClick={() => handleMethodSelect(transferType)} 
            className="w-full h-12"
          >
            Continue
          </Button>
        </div>
      )}

      {step === 'details' && (
        <div className="px-4 pt-6 pb-6 space-y-3">
          <Button onClick={handleDetailsSubmit} className="w-full h-12">
            Review Transfer
          </Button>
          <Button variant="outline" onClick={() => setStep('method')} className="w-full h-12">
            Back
          </Button>
        </div>
      )}

      {step === 'confirm' && (
        <div className="px-4 pt-6 pb-6 space-y-3">
          <Button onClick={handleConfirmTransfer} className="w-full h-12">
            Confirm Transfer
          </Button>
          <Button variant="outline" onClick={() => setStep('details')} className="w-full h-12">
            Edit Details
          </Button>
        </div>
      )}
    </div>
  );
}