import { Menu, Bell, User } from "lucide-react";
import { Button } from "./ui/button";

interface HeaderProps {
  onMenuClick?: () => void;
  userName?: string;
}

export function Header({ onMenuClick, userName = "Segun" }: HeaderProps) {
  return (
    <div className="bg-background border-b border-border/50 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Logo and User Greeting */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-semibold text-sm">T</span>
            </div>
            <span className="font-semibold text-foreground">TOPOS</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            className="h-9 w-9 rounded-full"
          >
            <Bell className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onMenuClick}
            className="h-9 w-9 rounded-full"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}