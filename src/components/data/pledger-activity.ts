export interface PledgerActivity {
  id: string;
  type: 'wallet_topup' | 'funds_locked' | 'funds_unlocked' | 'loan_disbursed' | 'loan_repayment' | 'pledge_approved' | 'pledge_declined' | 'collateral_locked' | 'collateral_released';
  title: string;
  description: string;
  amount: number;
  date: string;
  time: string;
  status: 'completed' | 'pending' | 'failed';
  borrowerName?: string;
  creditId?: string;
  currency?: 'USD' | 'NGN'; // Add currency field to specify which currency the amount is in
}

// Empty arrays - all activities will be generated dynamically
const freshPledgerActivities: PledgerActivity[] = [];
const activePledgerActivities: PledgerActivity[] = [];

// State management
let freshActivitiesState: PledgerActivity[] = [];
let activeActivitiesState: PledgerActivity[] = [];
let nextActivityId = 1;

export const getPledgerActivitiesForUserState = (userState: 'fresh' | 'active'): PledgerActivity[] => {
  return userState === 'fresh' ? freshActivitiesState : activeActivitiesState;
};

export const getRecentPledgerActivities = (userState: 'fresh' | 'active', limit: number = 5): PledgerActivity[] => {
  const activities = getPledgerActivitiesForUserState(userState);
  return activities.slice(0, limit);
};

export const addPledgerActivity = (activity: Omit<PledgerActivity, 'id'>, userState: 'fresh' | 'active' = 'active'): PledgerActivity => {
  const newActivity: PledgerActivity = {
    ...activity,
    id: `PA${String(nextActivityId++).padStart(3, '0')}`
  };

  if (userState === 'fresh') {
    freshActivitiesState = [newActivity, ...freshActivitiesState];
  } else {
    activeActivitiesState = [newActivity, ...activeActivitiesState];
  }

  return newActivity;
};

export const resetPledgerActivitiesToFresh = (): void => {
  freshActivitiesState = [];
  nextActivityId = 1;
};

export const resetPledgerActivitiesToActive = (): void => {
  activeActivitiesState = [];
  nextActivityId = 1;
};

// Utility functions for UI components
export const formatCurrency = (amount: number, currency: 'USD' | 'NGN' = 'USD') => {
  if (currency === 'NGN') {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2
    }).format(amount);
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
};

export const getActivityIconType = (type: PledgerActivity['type']): string => {
  switch (type) {
    case 'wallet_topup':
      return 'plus';
    case 'funds_locked':
    case 'collateral_locked':
      return 'lock';
    case 'funds_unlocked':
    case 'collateral_released':
      return 'unlock';
    case 'loan_disbursed':
      return 'arrow-up-right';
    case 'loan_repayment':
      return 'arrow-down-left';
    case 'pledge_approved':
      return 'check';
    case 'pledge_declined':
      return 'x';
    default:
      return 'activity';
  }
};

export const getActivityDisplayAmount = (activity: PledgerActivity): number => {
  const isNegative = ['funds_locked', 'collateral_locked', 'loan_disbursed'].includes(activity.type);
  const amount = isNegative ? -Math.abs(activity.amount) : Math.abs(activity.amount);
  
  return amount;
};

export const getPledgerActivitiesByCredit = (creditId: string, userState: 'fresh' | 'active' = 'active'): PledgerActivity[] => {
  const activities = getPledgerActivitiesForUserState(userState);
  return activities.filter(activity => activity.creditId === creditId);
};