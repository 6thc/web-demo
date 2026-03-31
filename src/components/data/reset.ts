import { resetToFreshUser, resetToActiveUser } from './credits';
import { resetTransactionsToFreshUser, resetTransactionsToActiveUser } from './transactions';
import { resetPledgerActivitiesToFresh, resetPledgerActivitiesToActive } from './pledger-activity';

/**
 * Coordinated reset — resets ALL data modules (credits, transactions, activity, wallet)
 * in one call. This prevents ID counter desync between modules.
 */
export const resetAllToFresh = (): void => {
  resetToFreshUser();
  resetTransactionsToFreshUser();
  resetPledgerActivitiesToFresh();
};

export const resetAllToActive = (): void => {
  resetToActiveUser();
  resetTransactionsToActiveUser();
  resetPledgerActivitiesToActive();
};
