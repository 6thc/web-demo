import { ArrowUpRight, ArrowDownLeft, Plus, Shield, Clock, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { getRecentPledgerActivities, getActivityIconType, getActivityDisplayAmount, formatCurrency, type PledgerActivity } from "./data/pledger-activity";
import { formatUSD } from "./data/wallet";

interface PledgerRecentActivityCardProps {
  onViewAllActivities?: () => void;
  onActivityClick?: (activityId: string) => void;
  userState: 'fresh' | 'active';
  maxItems?: number;
}

export function PledgerRecentActivityCard({ 
  onViewAllActivities, 
  onActivityClick, 
  userState,
  maxItems = 4
}: PledgerRecentActivityCardProps) {
  const recentActivities = getRecentPledgerActivities(userState, maxItems);

  const getActivityIcon = (activity: PledgerActivity) => {
    if (activity.status === "pending") return <Clock className="h-4 w-4" />;
    if (activity.status === "failed") return <XCircle className="h-4 w-4" />;
    
    const iconType = getActivityIconType(activity.type);
    if (iconType === "credit") return <ArrowDownLeft className="h-4 w-4" />;
    if (iconType === "debit") return <ArrowUpRight className="h-4 w-4" />;
    return <Plus className="h-4 w-4" />;
  };

  const getActivityIconColor = (activity: PledgerActivity) => {
    if (activity.status === "pending") return "bg-orange-100 text-orange-700";
    if (activity.status === "failed") return "bg-red-100 text-red-700";
    
    const iconType = getActivityIconType(activity.type);
    if (iconType === "credit") return "bg-green-100 text-green-700";
    if (iconType === "debit") return "bg-red-100 text-red-700";
    return "bg-blue-100 text-blue-700";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default" className="bg-green-100 text-green-700">Completed</Badge>;
      case "pending":
        return <Badge variant="secondary" className="bg-orange-100 text-orange-700">Pending</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Recent Activity</CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onViewAllActivities}
            className="text-sm text-primary"
          >
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {recentActivities.map((activity, index) => {
            const displayAmount = getActivityDisplayAmount(activity);
            
            return (
              <div key={activity.id}>
                <button
                  onClick={() => onActivityClick?.(activity.id)}
                  className="w-full flex items-center justify-between py-2 text-left hover:bg-muted/50 rounded-lg px-2 -mx-2 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getActivityIconColor(activity)}`}>
                      {getActivityIcon(activity)}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.date} • {activity.time}
                        {activity.borrowerName && ` • ${activity.borrowerName}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {displayAmount !== null && (
                      <p className={`font-semibold text-sm ${
                        displayAmount > 0 ? 'text-green-600' : displayAmount < 0 ? 'text-red-600' : 'text-blue-600'
                      }`}>
                        {displayAmount > 0 ? '+' : ''}
                        {formatCurrency(Math.abs(displayAmount), activity.currency)}
                      </p>
                    )}
                    {getStatusBadge(activity.status)}
                  </div>
                </button>
                {index < recentActivities.length - 1 && <Separator className="my-2" />}
              </div>
            );
          })}

          {recentActivities.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                <ArrowUpRight className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-2">No recent activity</p>
              <p className="text-xs text-muted-foreground">Your wallet activity will appear here</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}