import { useState } from "react";
import { ArrowLeft, User, CreditCard, Check, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Progress } from "../ui/progress";
import { Badge } from "../ui/badge";
import { addPendingRequest, calculateLoanDetails, DEFAULT_ANNUAL_INTEREST_RATE } from "../data/credits";

interface CreateRequestScreenProps {
  onBack: () => void;
  onSubmit: (requestData: any) => void;
  userState?: 'fresh' | 'active';
}

// Helper component for loan summary
function LoanSummary({ formData }: { formData: any }) {
  if (!formData.amount || !formData.tenure || !formData.repaymentFrequency) {
    return null;
  }

  const loanDetails = calculateLoanDetails(
    Number(formData.amount),
    formData.tenure,
    DEFAULT_ANNUAL_INTEREST_RATE,
    formData.repaymentFrequency as 'Daily' | 'Weekly' | 'Biweekly' | 'Monthly'
  );

  return (
    <div className="bg-accent/10 p-4 rounded-lg border border-accent/30">
      <h4 className="font-medium text-accent mb-2">Loan Summary</h4>
      <div className="space-y-1 text-sm text-foreground">
        <div className="flex justify-between">
          <span>Principal Amount:</span>
          <span>₦{loanDetails.totalAmount.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Estimated Interest ({DEFAULT_ANNUAL_INTEREST_RATE}% APR):</span>
          <span>₦{loanDetails.totalInterest.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Duration:</span>
          <span>{formData.tenure}</span>
        </div>
        <div className="flex justify-between font-medium border-t border-accent/30 pt-1">
          <span>Total Repayment:</span>
          <span>₦{loanDetails.totalToRepay.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

export function CreateRequestScreen({ onBack, onSubmit, userState = 'fresh' }: CreateRequestScreenProps) {
  const [formData, setFormData] = useState({
    firstName: "Abimbola",
    lastName: "Adewale", 
    email: "bimbo.adewale@gmail.com",
    country: "Nigeria",
    phoneCountry: "+234",
    phoneNumber: "1251332131",
    amount: "50000",
    currency: "NGN",
    tenure: "4 weeks",
    repaymentFrequency: "Weekly"
  });

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 2;

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleContinue = () => {
    if (currentStep === 1) {
      setCurrentStep(2);
    } else {
      // Create the pending request data
      const requestData = {
        pledgerName: `${formData.firstName} ${formData.lastName}`,
        pledgerEmail: formData.email,
        pledgerCountry: formData.country,
        amount: Number(formData.amount),
        term: formData.tenure,
        submittedDate: new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        }),
        status: 'pending' as const,
        purpose: 'General purpose',
        expectedInterestRate: 25.0,
        repaymentFrequency: formData.repaymentFrequency as 'Daily' | 'Weekly' | 'Biweekly' | 'Monthly'
      };
      
      // Create the pending request
      addPendingRequest(requestData, userState);
      onSubmit(requestData);
    }
  };

  const isPaymentFrequencyValid = (): boolean => {
    if (!formData.tenure || !formData.repaymentFrequency) return true;
    
    const [amount, unit] = formData.tenure.split(' ');
    const numericAmount = parseInt(amount);
    
    // Convert tenure to days
    let tenureDays = 0;
    if (unit === 'week' || unit === 'weeks') {
      tenureDays = numericAmount * 7;
    } else if (unit === 'month' || unit === 'months') {
      tenureDays = numericAmount * 30;
    }
    
    // Convert payment frequency to days
    let frequencyDays = 0;
    switch (formData.repaymentFrequency) {
      case 'Daily':
        frequencyDays = 1;
        break;
      case 'Weekly':
        frequencyDays = 7;
        break;
      case 'Biweekly':
        frequencyDays = 14;
        break;
      case 'Monthly':
        frequencyDays = 30;
        break;
    }
    
    // Payment frequency should not be longer than the tenure
    return frequencyDays <= tenureDays;
  };

  const isStepValid = () => {
    if (currentStep === 1) {
      return formData.firstName && formData.lastName && formData.email && formData.phoneNumber;
    } else {
      return formData.amount && formData.currency && formData.tenure && formData.repaymentFrequency && isPaymentFrequencyValid();
    }
  };

  return (
    <div className="bg-muted/30 min-h-screen pt-2">
      {/* Header */}
      <div className="bg-background border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={currentStep === 1 ? onBack : () => setCurrentStep(1)}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-semibold">Create Loan Request</h1>
            <p className="text-sm text-muted-foreground">Step {currentStep} of {totalSteps}</p>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="px-4 py-4">
        <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
        <div className="flex justify-between mt-2">
          <span className="text-xs text-muted-foreground">Pledger Details</span>
          <span className="text-xs text-muted-foreground">Loan Terms</span>
        </div>
      </div>

      <div className="px-4 pb-32">
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                Pledger Information
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Enter details of the person who will provide collateral for your loan
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder="Enter first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="pledger@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country of Residence</Label>
                <Select value={formData.country} onValueChange={(value) => handleInputChange('country', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Nigeria">🇳🇬 Nigeria</SelectItem>
                    <SelectItem value="Ghana">🇬🇭 Ghana</SelectItem>
                    <SelectItem value="Kenya">🇰🇪 Kenya</SelectItem>
                    <SelectItem value="USA">🇺🇸 United States</SelectItem>
                    <SelectItem value="UK">🇬🇧 United Kingdom</SelectItem>
                    <SelectItem value="Canada">🇨🇦 Canada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="flex gap-2">
                  <Select value={formData.phoneCountry} onValueChange={(value) => handleInputChange('phoneCountry', value)}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="+234">+234</SelectItem>
                      <SelectItem value="+233">+233</SelectItem>
                      <SelectItem value="+254">+254</SelectItem>
                      <SelectItem value="+1">+1</SelectItem>
                      <SelectItem value="+44">+44</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    className="flex-1"
                    value={formData.phoneNumber}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-1">Important Note</h4>
                <p className="text-sm text-blue-700">
                  Your pledger will receive a notification to provide collateral once this request is approved. 
                  Make sure they are aware of this responsibility.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center">
                  <CreditCard className="h-4 w-4 text-accent" />
                </div>
                Loan Terms
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Specify the amount and repayment terms for your loan
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="amount">Loan Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={formData.amount}
                    onChange={(e) => handleInputChange('amount', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NGN">NGN</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tenure">Loan Duration</Label>
                <Select value={formData.tenure} onValueChange={(value) => handleInputChange('tenure', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1 week">1 week</SelectItem>
                    <SelectItem value="2 weeks">2 weeks</SelectItem>
                    <SelectItem value="4 weeks">4 weeks</SelectItem>
                    <SelectItem value="2 months">2 months</SelectItem>
                    <SelectItem value="3 months">3 months</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="frequency">Repayment Frequency</Label>
                <Select value={formData.repaymentFrequency} onValueChange={(value) => handleInputChange('repaymentFrequency', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Daily">Daily</SelectItem>
                    <SelectItem value="Weekly">Weekly</SelectItem>
                    <SelectItem value="Biweekly">Biweekly</SelectItem>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
                {formData.tenure && formData.repaymentFrequency && !isPaymentFrequencyValid() && (
                  <p className="text-sm text-red-600">
                    Payment frequency cannot be longer than the loan duration. Please select a shorter frequency.
                  </p>
                )}
              </div>

              <LoanSummary formData={formData} />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Fixed Bottom Actions */}
      <div className="absolute bottom-0 left-0 right-0 bg-background border-t border-border/50 p-4">
        <Button 
          onClick={handleContinue}
          disabled={!isStepValid()}
          className="w-full h-12"
        >
          {currentStep === 1 ? 'Continue to Loan Terms' : 'Submit Request'}
        </Button>
      </div>
    </div>
  );
}