import { CreditCard, User } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { formatCurrency } from "./data/transactions";
import { Credit } from "./data/credits";

interface CreditCarouselProps {
  credits: Credit[];
  onCreditClick?: (creditId: string) => void;
  onNavigateToCredit?: () => void;
}

export function CreditCarousel({ credits, onCreditClick, onNavigateToCredit }: CreditCarouselProps) {

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
      case 'reviewing':
        return {
          badge: 'bg-orange-100 text-orange-600',
          avatar: 'bg-orange-100',
          avatarIcon: 'text-orange-600',
          label: 'Pending'
        };
      case 'active':
        return {
          badge: 'bg-blue-100 text-blue-700', 
          avatar: 'bg-accent/20',
          avatarIcon: 'text-accent',
          label: 'Active'
        };
      case 'completed':
        return {
          badge: 'bg-green-100 text-green-700',
          avatar: 'bg-green-100',
          avatarIcon: 'text-green-600',
          label: 'Completed'
        };
      default:
        return {
          badge: 'bg-muted text-muted-foreground',
          avatar: 'bg-muted',
          avatarIcon: 'text-muted-foreground',
          label: status
        };
    }
  };

  if (credits.length === 0) {
    return (
      <div className="mt-6">
        <div className="flex items-center justify-between mb-4 px-6">
          <h3 className="font-medium">Credit Overview</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onNavigateToCredit}
            className="text-sm text-primary"
          >
            View All
          </Button>
        </div>
        <div className="h-20 bg-muted/10 border border-dashed border-muted rounded-lg flex items-center justify-center">
          <div className="text-center">
            <CreditCard className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Your credits will appear here</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4 px-6">
        <h3 className="font-medium">Credit Overview</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onNavigateToCredit}
          className="text-sm text-primary"
        >
          View All
        </Button>
      </div>
      
      {/* Horizontal scrolling carousel */}
      <div className="relative">
        <div 
          className={`flex pb-1 scrollbar-hide snap-x snap-mandatory ${
            credits.length === 1 
              ? 'justify-center' // Center single card
              : 'gap-2 px-4 -mx-4 overflow-x-auto' // Multiple cards with smaller gap for preview
          }`}
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {credits.map((credit, index) => {
            // Calculate progress percentage
            const progressValue = credit.status === 'active' || credit.status === 'completed'
              ? ((credit.totalAmount - credit.remaining) / credit.totalAmount) * 100
              : 0;
            
            const statusConfig = getStatusConfig(credit.status);
            
            return (
              <div 
                key={credit.id} 
                className={`flex-shrink-0 snap-center ${
                  credits.length === 1 
                    ? 'w-full max-w-sm' // Single card: full width up to max-w-sm, centered
                    : 'w-[calc(100%-1rem)]' // All cards: same width as active card, with small margin
                }`}
              >
                <Card 
                  className="bg-card border cursor-pointer hover:shadow-sm transition-shadow h-full"
                  onClick={() => onCreditClick?.(credit.id)}
                >
                  <CardContent className="p-3 h-full">
                    <div className="space-y-2 h-full flex flex-col">
                      {/* Header with Avatar and Status Badge */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 ${statusConfig.avatar} rounded-full flex items-center justify-center`}>
                            <User className={`h-4 w-4 ${statusConfig.avatarIcon}`} />
                          </div>
                          <div>
                            <p className="font-medium text-sm truncate">
                              {credit.pledgerName}
                            </p>
                            <Badge variant="secondary" className={`${statusConfig.badge} text-xs border-0`}>
                              {statusConfig.label}
                            </Badge>
                          </div>
                        </div>
                        <p className="font-medium text-sm text-primary flex-shrink-0">
                          {formatCurrency(credit.totalAmount)}
                        </p>
                      </div>

                      {/* Remaining Amount */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Remaining</span>  
                        <span className="text-muted-foreground">
                          {formatCurrency(credit.remaining)}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="text-muted-foreground">
                            {Math.round(progressValue)}% paid
                          </span>
                        </div>
                        <Progress 
                          value={progressValue} 
                          className="h-2"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}