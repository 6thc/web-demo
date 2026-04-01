import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { UserX, Users, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner@2.0.3";

interface SettingsScreenProps {
  onBack: () => void;
  onResetToFreshUser: () => void;
  onPopulateWithActivity: () => Promise<void>;
  onApproveAllRequests?: () => void;
  onDeclineAllRequests?: () => void;
}

export function SettingsScreen({ onBack, onResetToFreshUser, onPopulateWithActivity }: SettingsScreenProps) {
  const [isPopulating, setIsPopulating] = useState(false);

  const handlePopulateClick = async () => {
    setIsPopulating(true);
    try {
      await onPopulateWithActivity();
    } catch (error) {
      console.error('Error during populate:', error);
    } finally {
      setIsPopulating(false);
    }
  };

  return (
    <div className="bg-muted/30 min-h-screen pt-2 pb-20">
      {/* Settings Header */}
      <div className="px-4 pt-8 pb-4">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Settings</h1>
          <div className="w-10" />
        </div>
        <div className="text-center mb-4">
          <p className="text-muted-foreground">Manage your preferences and account</p>
        </div>
      </div>
      
      <div className="px-4 space-y-6">
        {/* Mock Data Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Developer Tools</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Card className="cursor-pointer hover:bg-muted/20 transition-colors" onClick={onResetToFreshUser}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-lg bg-destructive/10 flex items-center justify-center">
                    <UserX className="h-6 w-6 text-destructive" />
                  </div>
                  <div className="flex-1">
                    <h3>Reset to Fresh User</h3>
                    <p className="text-muted-foreground">Clear all transactions and credit products</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className={`transition-colors ${isPopulating ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-muted/20'}`} 
              onClick={isPopulating ? undefined : handlePopulateClick}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    {isPopulating ? (
                      <Loader2 className="h-6 w-6 text-primary animate-spin" />
                    ) : (
                      <Users className="h-6 w-6 text-primary" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3>{isPopulating ? 'Building Activity...' : 'Populate with Activity'}</h3>
                    <p className="text-muted-foreground">
                      {isPopulating 
                        ? 'Please wait while we create historical data...' 
                        : 'Add transaction history and active credit products'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}