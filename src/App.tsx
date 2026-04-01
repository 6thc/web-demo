import { useState, useEffect } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./components/ui/alert-dialog";
import { SmartphoneContainer } from "./components/SmartphoneContainer";
import { PledgerApp } from "./components/PledgerApp";
import { BorrowerApp } from "./components/BorrowerApp";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner@2.0.3";
import { Button } from "./components/ui/button";
import { RotateCcw, Database, Bell, BellOff, List, ListX } from "lucide-react";
import { AuditTrail } from "./components/AuditTrail";
import { DemoContext } from "./components/DemoContext";
import { resetAllToFresh } from "./components/data/reset";
import { buildActivityHistoryProgressively } from "./components/data/demo-data";
import toposLogo from 'figma:asset/4b031171cb67357b991e3d5c9c7dd0b75de1bf28.png';


// Audit trail types
interface AuditEvent {
  id: string;
  timestamp: Date;
  event: string;
  details?: string;
  type: 'action' | 'transaction' | 'system' | 'pledger';
}

export default function App() {
  // Shared state management for both apps
  const [userState, setUserState] = useState<'fresh' | 'active'>('fresh');
  const [refreshKey, setRefreshKey] = useState(0);
  const [isPopulating, setIsPopulating] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  
  // Audit trail state
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [showAuditTrail, setShowAuditTrail] = useState(false);

  // Audit trail logging function
  const logAuditEvent = (event: string, details?: string, type: AuditEvent['type'] = 'action') => {
    const newEvent: AuditEvent = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      event,
      details,
      type
    };
    setAuditEvents(prev => [newEvent, ...prev].slice(0, 100)); // Keep last 100 events
  };

  // Initialize audit trail with welcome message
  useEffect(() => {
    logAuditEvent("Demo initialized", "Topos dual-app demo ready for presentation", 'system');
  }, []);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleUserStateChange = (state: 'fresh' | 'active') => {
    setUserState(state);
  };

  const handleResetToFreshUser = () => {
    setUserState('fresh');
    resetAllToFresh();
    
    // Clear audit trail
    setAuditEvents([]);
    logAuditEvent("Demo reset to fresh user", "All data cleared, audit trail reset", 'system');
    
    handleRefresh();
    if (notificationsEnabled) {
      toast.success("Reset to fresh user", {
        description: "All transaction history and credit products cleared."
      });
    }
  };

  const handleToggleNotifications = () => {
    setNotificationsEnabled(prev => !prev);
    if (!notificationsEnabled) {
      // Show a notification when turning notifications back on
      setTimeout(() => {
        toast.success("Notifications enabled", {
          description: "You will now see popup notifications again."
        });
      }, 100);
    }
  };

  const handlePopulateWithActivity = async () => {
    try {
      console.log('Starting progressive populate with activity...');
      
      // Log the start of population
      logAuditEvent("Starting activity population", "Building comprehensive transaction and loan history", 'system');
      
      // Set populating state to enable special UI mode
      setIsPopulating(true);
      
      // Give the UI a moment to update before starting the populate process
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Start the progressive build process
      await buildActivityHistoryProgressively(handleRefresh, notificationsEnabled);
      
      // Stay in fresh state - don't switch to active since we just populated fresh with all the data
      // The fresh user now has a full activity history and should look like an experienced user
      
      // Final refresh to ensure everything is up to date
      handleRefresh();
      
      // Log completion
      logAuditEvent("Activity population completed", "Full transaction history and loan data populated", 'system');
      
      console.log('Progressive activity population completed successfully');
      
    } catch (error) {
      console.error('Failed to populate activity:', error);
      logAuditEvent("Activity population failed", "Error occurred during data population", 'system');
      // Error handling is already done in the progressive function
    } finally {
      // Always clear populating state
      setIsPopulating(false);
    }
  };

  return (
    <DemoContext.Provider value={{
      userState,
      setUserState,
      refreshKey,
      onRefresh: handleRefresh,
      onAuditLog: logAuditEvent,
      isPopulating,
      notificationsEnabled,
    }}>
    <div className="min-h-screen relative">


      {/* Left side - Pledger (Light background) */}
      <div className="absolute inset-y-0 left-0 right-1/2 bg-slate-200">
      </div>

      {/* Right side - Borrower (Dark background) */}
      <div className="absolute inset-y-0 left-1/2 right-0 hero-gradient-pledger">
      </div>

      {/* Pledger Label - positioned above left phone */}
      <div className="absolute flex items-center justify-center z-10" style={{ right: '50%', marginRight: '120px', top: 'calc(50% - 428px)' }}>
        <div className="text-slate-700 tracking-wider text-lg font-bold">ABIMBOLA, PLEDGER</div>
      </div>

      {/* Borrower Label - positioned above right phone */}
      <div className="absolute flex items-center justify-center z-10" style={{ left: '50%', marginLeft: '120px', top: 'calc(50% - 428px)' }}>
        <div className="text-white tracking-wider text-lg font-bold">SEGUN, BORROWER</div>
      </div>

      {/* Pledger App - positioned absolutely 100px left of center */}
      <div className="absolute inset-y-0 flex items-center justify-center z-10" style={{ right: '50%', marginRight: '100px', transform: 'scale(0.9)' }}>
        <SmartphoneContainer>
          <PledgerApp 
            userState={userState}
            refreshKey={refreshKey}
            onRefresh={handleRefresh}
            forceTab={isPopulating ? 'wallet' : undefined}
            forceChartPeriod={isPopulating ? '3M' : undefined}
            disableChartAnimations={isPopulating}
            notificationsEnabled={notificationsEnabled}
            onAuditLog={logAuditEvent}
          />
        </SmartphoneContainer>
      </div>

      {/* Borrower App - positioned absolutely 100px right of center */}
      <div className="absolute inset-y-0 flex items-center justify-center z-10" style={{ left: '50%', marginLeft: '100px', transform: 'scale(0.9)' }}>
        <SmartphoneContainer borderColor="white">
          <BorrowerApp 
            userState={userState}
            refreshKey={refreshKey}
            onRefresh={handleRefresh}
            onUserStateChange={handleUserStateChange}
            forceTab={isPopulating ? 'wallet' : undefined}
            forceChartPeriod={isPopulating ? '3M' : undefined}
            disableChartAnimations={isPopulating}
            onPopulateStateChange={setIsPopulating}
            notificationsEnabled={notificationsEnabled}
            onAuditLog={logAuditEvent}
          />
        </SmartphoneContainer>
      </div>

      {/* Connector that goes behind/to the edge of phones */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <div className="relative flex items-center">
          {/* Dotted Line that extends to the phone frames */}
          <div 
            className="border-t-4 border-dashed" 
            style={{ 
              borderColor: '#e52a5b', 
              width: '240px', 
              marginLeft: '-120px',
              marginRight: '-120px'
            }}
          ></div>
        </div>
      </div>



      {/* Topos Logo - absolutely centered */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20">
        {/* Dark circle background */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full" style={{ backgroundColor: '#3f3d56' }}></div>
        {/* Logo */}
        <div className="relative w-20 h-20 flex items-center justify-center">
          <img 
            src={toposLogo} 
            alt="Topos Logo" 
            className="w-16 h-16 object-contain"
          />
        </div>
      </div>

      {/* Floating Action Buttons - Center Height Right */}
      <div className="fixed top-1/2 right-6 transform -translate-y-1/2 flex flex-col gap-4 z-30">
        {/* Reset to Fresh User Button */}
        <div className="group relative">
          <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-white/90 text-gray-600 px-3 py-2 rounded-lg shadow-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            Reset to fresh user
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                disabled={isPopulating}
                className="w-12 h-12 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 shadow-lg transition-all duration-200 disabled:opacity-50"
                variant="ghost"
              >
                <RotateCcw className="w-5 h-5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset demo data?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will clear all transaction history, loan data, and wallet balances. The demo will return to a fresh state.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleResetToFreshUser}>Reset</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Populate Activity Button */}
        <div className="group relative">
          <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-white/90 text-gray-600 px-3 py-2 rounded-lg shadow-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            Populate with activity
          </div>
          <Button
            onClick={handlePopulateWithActivity}
            disabled={isPopulating}
            className="w-12 h-12 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 shadow-lg transition-all duration-200 disabled:opacity-50"
            variant="ghost"
          >
            <Database className="w-5 h-5" />
          </Button>
        </div>

        {/* Toggle Notifications Button */}
        <div className="group relative">
          <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-white/90 text-gray-600 px-3 py-2 rounded-lg shadow-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            {notificationsEnabled ? 'Hide notifications' : 'Show notifications'}
          </div>
          <Button
            onClick={handleToggleNotifications}
            disabled={isPopulating}
            className="w-12 h-12 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 shadow-lg transition-all duration-200 disabled:opacity-50"
            variant="ghost"
          >
            {notificationsEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
          </Button>
        </div>

        {/* Toggle Audit Trail Button */}
        <div className="group relative">
          <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-white/90 text-gray-600 px-3 py-2 rounded-lg shadow-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            {showAuditTrail ? 'Hide audit trail' : 'Show audit trail'}
          </div>
          <Button
            onClick={() => {
              setShowAuditTrail(prev => !prev);
              logAuditEvent(
                showAuditTrail ? "Audit trail hidden" : "Audit trail shown", 
                "Demo presentation tool toggled", 
                'system'
              );
            }}
            disabled={isPopulating}
            className="w-12 h-12 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 shadow-lg transition-all duration-200 disabled:opacity-50"
            variant="ghost"
          >
            {showAuditTrail ? <ListX className="w-5 h-5" /> : <List className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Title - positioned below pledger phone with 10px additional distance */}
      <div className="absolute flex items-center justify-center z-10" style={{ right: '50%', marginRight: '120px', bottom: 'calc(50% - 438px)' }}>
        <div 
          className="text-slate-600 text-right font-bold tracking-wide"
          style={{ 
            fontSize: '1.25rem', // 2x the original disclaimer font size (0.625rem * 2)
            lineHeight: '1.3',
            width: 'fit-content'
          }}
        >
          TOPOS OFFSHORE COLLATERAL UX DEMO
        </div>
      </div>

      {/* Disclaimer - positioned below borrower phone with 10px additional distance */}
      <div className="absolute flex items-center justify-center z-10" style={{ left: '50%', marginLeft: '120px', bottom: 'calc(50% - 438px)' }}>
        <div 
          className="text-slate-400 text-left overflow-hidden"
          style={{ 
            fontSize: '0.625rem',
            lineHeight: '1.2',
            maxHeight: '2.4rem', // Exactly 2 lines (2 * 1.2rem line-height)
            width: 'fit-content',
            maxWidth: '550px', // Increased by 50px more to fully accommodate text
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical'
          }}
        >
          <strong>Showcase Only:</strong> This is not the real Topos product, only a demonstration of user flows. 
          All content, fees, and amounts are fictional. Actual product specifications depend heavily on specific market conditions and regulatory requirements.
        </div>
      </div>

      {/* Audit Trail */}
      <AuditTrail
        events={auditEvents}
        isVisible={showAuditTrail}
      />
    </div>
    </DemoContext.Provider>
  );
}