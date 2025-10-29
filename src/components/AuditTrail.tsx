import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";

interface AuditEvent {
  id: string;
  timestamp: Date;
  event: string;
  details?: string;
  type: 'action' | 'transaction' | 'system' | 'pledger';
}

interface AuditTrailProps {
  events: AuditEvent[];
  isVisible: boolean;
}

export function AuditTrail({ events, isVisible }: AuditTrailProps) {
  if (!isVisible) return null;

  const getEventTypeColor = (type: AuditEvent['type']) => {
    switch (type) {
      case 'action':
        return 'bg-blue-100 text-blue-800';
      case 'transaction':
        return 'bg-green-100 text-green-800';
      case 'system':
        return 'bg-gray-100 text-gray-800';
      case 'pledger':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEventTypeLabel = (type: AuditEvent['type']) => {
    switch (type) {
      case 'action':
        return 'Action';
      case 'transaction':
        return 'Transaction';
      case 'system':
        return 'System';
      case 'pledger':
        return 'Pledger';
      default:
        return 'Event';
    }
  };

  return (
    <div 
      className="fixed left-4 top-0 bottom-0 w-80 bg-white rounded-lg shadow-xl border z-20 flex flex-col"
    >
      {/* Header */}
      <div className="p-4 border-b bg-slate-50 rounded-t-lg">
        <h3 className="font-semibold text-slate-800 text-sm">Demo Audit Trail</h3>
        <p className="text-xs text-slate-600 mt-1">
          {events.length} events logged
        </p>
      </div>

      {/* Events List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {events.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              No events yet. Start using the demo to see activity here.
            </div>
          ) : (
            events.map((event) => (
              <div 
                key={event.id} 
                className="bg-slate-50 rounded-lg p-3 border border-slate-200"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${getEventTypeColor(event.type)}`}
                  >
                    {getEventTypeLabel(event.type)}
                  </Badge>
                  <span className="text-xs text-slate-500 flex-shrink-0">
                    {event.timestamp.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </span>
                </div>
                
                <div className="text-sm text-slate-800 font-medium mb-1">
                  {event.event}
                </div>
                
                {event.details && (
                  <div className="text-xs text-slate-600">
                    {event.details}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}