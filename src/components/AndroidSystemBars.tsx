import { Battery, Signal, Wifi } from "lucide-react";

export function AndroidStatusBar() {
  // Get current time
  const currentTime = new Date().toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: false 
  });

  return (
    <div className="bg-black text-white px-4 py-1 flex items-center justify-between text-sm font-medium h-7">
      <div className="flex items-center gap-1">
        <span className="text-xs">{currentTime}</span>
      </div>
      
      <div className="flex items-center gap-1">
        {/* Signal Strength */}
        <Signal className="h-3 w-3" />
        
        {/* WiFi */}
        <Wifi className="h-3 w-3" />
        
        {/* Battery */}
        <div className="flex items-center gap-1">
          <Battery className="h-3 w-3" />
          <span className="text-xs">85%</span>
        </div>
      </div>
    </div>
  );
}

export function AndroidSystemNav() {
  return (
    <div className="bg-black h-8 flex items-center justify-center">
      <div className="flex items-center justify-center gap-8">
        {/* Back Button */}
        <div className="w-4 h-4 flex items-center justify-center">
          <div className="w-3 h-3 border-l-2 border-b-2 border-white/70 transform rotate-45"></div>
        </div>
        
        {/* Home Button */}
        <div className="w-4 h-4 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full border-2 border-white/70"></div>
        </div>
        
        {/* Recent Apps Button */}
        <div className="w-4 h-4 flex items-center justify-center">
          <div className="w-3 h-2 border-2 border-white/70 rounded-sm"></div>
        </div>
      </div>
    </div>
  );
}