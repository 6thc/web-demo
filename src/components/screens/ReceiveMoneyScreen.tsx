import { ArrowLeft, Copy, QrCode, Phone, Share, Check, Banknote } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { toast } from "sonner@2.0.3";

interface ReceiveMoneyScreenProps {
  onBack: () => void;
}

export function ReceiveMoneyScreen({ onBack }: ReceiveMoneyScreenProps) {
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Mock user data - in real app this would come from user context/props
  const userAccount = {
    name: "Segun Adebayo",
    phone: "+234 801 234 5678",
    accountNumber: "1234567890",
    bankCode: "058", // Mock bank code
    paymeId: "segun.adebayo.payme"
  };

  // Generate USSD code for receiving money
  const ussdCode = `*737*2*${userAccount.accountNumber}#`;
  
  // Mock QR code data (in real app this would be a proper QR code generator)
  const qrCodeData = `payme://pay?account=${userAccount.accountNumber}&name=${encodeURIComponent(userAccount.name)}&phone=${encodeURIComponent(userAccount.phone)}`;

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(label);
      toast.success(`${label} copied to clipboard`);
      setTimeout(() => setCopiedText(null), 2000);
    } catch (err) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleShare = async () => {
    const shareText = `Send money to me easily!\n\nPayMe ID: ${userAccount.paymeId}\nUSSD: ${ussdCode}\nAccount: ${userAccount.accountNumber}\n\nUse any of these methods to send money instantly.`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My PayMe Details',
          text: shareText,
        });
      } catch (err) {
        // User cancelled sharing
      }
    } else {
      await handleCopy(shareText, "Payment details");
    }
  };

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
            <h1 className="text-white">Receive Money</h1>
            <p className="text-white/80">Your payment details</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 relative z-10 space-y-6">
        {/* QR Code Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" />
              Scan to Pay
            </CardTitle>
            <p className="text-muted-foreground">
              Show this QR code to merchants for instant payments
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <div className="bg-white p-6 rounded-lg border-2 border-dashed border-border">
                <div className="w-48 h-48 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <QrCode className="h-16 w-16 mx-auto mb-2 text-slate-400" />
                    <p className="text-xs text-slate-500">QR Code</p>
                    <p className="text-xs text-slate-400 mt-1">{userAccount.paymeId}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <Badge variant="secondary" className="text-xs">
                Valid for all payments
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* USSD Code Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-accent" />
              USSD Payment
            </CardTitle>
            <p className="text-muted-foreground">
              Share this code for direct bank transfers
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground mb-1">Dial this code:</p>
                  <p className="text-xl font-mono">{ussdCode}</p>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleCopy(ussdCode, "USSD code")}
                >
                  {copiedText === "USSD code" ? (
                    <Check className="h-4 w-4 text-accent" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="space-y-1">
                <p className="text-muted-foreground">• Works with any Nigerian bank</p>
                <p className="text-muted-foreground">• Instant transfer notification</p>
                <p className="text-muted-foreground">• Available 24/7</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Details Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5 text-primary" />
              Account Information
            </CardTitle>
            <p className="text-muted-foreground">
              For bank transfers and direct deposits
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-muted-foreground">Account Name</p>
                  <p>{userAccount.name}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(userAccount.name, "Account name")}
                >
                  {copiedText === "Account name" ? (
                    <Check className="h-4 w-4 text-accent" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-muted-foreground">Account Number</p>
                  <p className="font-mono">{userAccount.accountNumber}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(userAccount.accountNumber, "Account number")}
                >
                  {copiedText === "Account number" ? (
                    <Check className="h-4 w-4 text-accent" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-muted-foreground">Topos ID</p>
                  <p>{userAccount.paymeId}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(userAccount.paymeId, "Topos ID")}
                >
                  {copiedText === "Topos ID" ? (
                    <Check className="h-4 w-4 text-accent" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Tips */}
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-muted-foreground">
            💡 <strong>Tip:</strong> Share your Topos ID for the fastest way to receive money from friends and family.
          </p>
        </div>

        {/* Safety Note */}
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-muted-foreground">
            🔒 <strong>Security Reminder:</strong> Only share these details with trusted sources. Never share your PIN, password, or OTP with anyone.
          </p>
        </div>
      </div>

      {/* Bottom Button Area */}
      <div className="px-4 pt-6 pb-6">
        <Button 
          onClick={handleShare}
          className="w-full h-12"
        >
          <Share className="h-4 w-4 mr-2" />
          Share Details
        </Button>
      </div>
    </div>
  );
}