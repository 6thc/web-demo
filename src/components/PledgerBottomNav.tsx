import { Home, Shield, Wallet } from "lucide-react";

interface PledgerBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function PledgerBottomNav({ activeTab, onTabChange }: PledgerBottomNavProps) {
  const tabs = [
    {
      id: 'home',
      label: 'Home',
      icon: Home
    },
    {
      id: 'wallet',
      label: 'Wallet',
      icon: Wallet
    },
    {
      id: 'pledges',
      label: 'Pledges',
      icon: Shield
    }
  ];

  return (
    <div className="bg-background border-t border-border/50">
      <div className="flex">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex-1 flex flex-col items-center gap-1 py-3 px-2 transition-colors ${
                isActive
                  ? 'text-[#3f3d56]'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {isActive && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#3f3d56] rounded-full" />}
              <Icon className={`h-5 w-5 transition-transform ${isActive ? 'fill-current scale-110' : ''}`} />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}