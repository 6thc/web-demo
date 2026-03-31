import { createContext, useContext } from 'react';

export interface DemoContextType {
  userState: 'fresh' | 'active';
  setUserState: (state: 'fresh' | 'active') => void;
  refreshKey: number;
  onRefresh: () => void;
  onAuditLog: (event: string, details?: string, type?: 'action' | 'transaction' | 'system' | 'pledger') => void;
  isPopulating: boolean;
  notificationsEnabled: boolean;
}

export const DemoContext = createContext<DemoContextType | null>(null);

export function useDemoContext(): DemoContextType {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemoContext must be used within a DemoContext.Provider');
  }
  return context;
}
