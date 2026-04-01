import { toast } from "sonner@2.0.3";
import { addPendingRequest, approvePendingRequest, verifyLoanCalculations, processCreditPayment, detectOverdue, applyPenaltyInterest, declareDefault } from "./credits";
import { addLoanDisbursementTransaction, addCashTransaction, addLoanRepaymentTransaction } from "./transactions";
import { addPledgerActivity } from "./pledger-activity";
import { resetAllToFresh } from "./reset";
import { topUpWallet, lockFunds } from "./wallet";
import { PLEDGER_NAME } from "./demo-config";

// Re-entrancy guard for populate function
let isPopulateRunning = false;

// Progressive function to populate with realistic activity - runs step by step with visual feedback
export async function buildActivityHistoryProgressively(onRefresh: () => void, notificationsEnabled: boolean = true) {
  if (isPopulateRunning) {
    console.warn('Populate already running, ignoring duplicate call');
    return;
  }
  isPopulateRunning = true;
  try {
    console.log('🚀 Starting progressive activity history build...');

    // Verify loan calculations first
    verifyLoanCalculations();

    // Reset everything to fresh first
    resetAllToFresh();
    onRefresh(); // Show clean slate

    if (notificationsEnabled) {
      toast.info("Building activity history...", {
        description: "Step 1/10: Resetting to fresh state"
      });
    }

    await new Promise(resolve => setTimeout(resolve, 750));

    // === STEP 1: Initial Account Setup ===
    console.log('📈 Step 1: Setting up initial account deposits...');

    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    // Add initial deposits to build up account balance
    addCashTransaction('deposit', 250000, 'fresh', threeMonthsAgo);
    addCashTransaction('deposit', 180000, 'fresh', twoMonthsAgo);
    addCashTransaction('deposit', 150000, 'fresh', oneMonthAgo);

    onRefresh(); // Update UI to show new deposits
    if (notificationsEnabled) {
      toast.success("Initial deposits added", {
        description: "Step 2/10: Account funded with ₦580,000"
      });
    }

    await new Promise(resolve => setTimeout(resolve, 1125));

    // === STEP 2: Pledger Wallet Setup ===
    console.log('💰 Step 2: Setting up pledger wallet...');

    topUpWallet(1500);
    addPledgerActivity({
      type: 'wallet_topup',
      title: 'Wallet Top-up',
      description: 'Initial wallet funding',
      amount: 1500,
      date: twoMonthsAgo.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      time: twoMonthsAgo.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      status: 'completed'
    }, 'fresh');

    onRefresh(); // Update UI to show pledger wallet
    if (notificationsEnabled) {
      toast.success("Pledger wallet funded", {
        description: "Step 3/10: $1,500 USD added to pledger wallet"
      });
    }

    await new Promise(resolve => setTimeout(resolve, 1125));

    // === STEP 3: Create and Complete Historical Loan ===
    console.log('🏦 Step 3: Creating completed loan history...');

    // Step 3a: Create pending request
    const completedLoan = addPendingRequest({
      pledgerName: PLEDGER_NAME,
      pledgerEmail: 'abimbola@email.com',
      pledgerCountry: 'United Kingdom',
      amount: 300000,
      term: '3 months',
      submittedDate: twoMonthsAgo.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      purpose: 'Business expansion',
      expectedInterestRate: 25.0,
      repaymentFrequency: 'Monthly'
    }, 'fresh');

    onRefresh(); // Show pending request in borrower app
    if (notificationsEnabled) {
      toast.info("Loan request submitted", {
        description: "Step 3a/10: ₦300,000 request awaiting pledger approval"
      });
    }

    await new Promise(resolve => setTimeout(resolve, 900));

    // Step 3b: Pledger locks funds
    lockFunds(completedLoan.id, 300, 'fresh');

    onRefresh(); // Show locked funds in pledger app
    if (notificationsEnabled) {
      toast.info("Pledger collateral locked", {
        description: "Step 3b/10: $300 USD collateral secured"
      });
    }

    await new Promise(resolve => setTimeout(resolve, 900));

    // Step 3c: Approve request
    approvePendingRequest(completedLoan.id, 'fresh');

    onRefresh(); // Show approved status
    if (notificationsEnabled) {
      toast.success("Loan approved", {
        description: "Step 3c/10: Request approved, preparing disbursement"
      });
    }

    await new Promise(resolve => setTimeout(resolve, 900));

    // Step 3d: Disburse funds
    addLoanDisbursementTransaction(completedLoan.id, 300000, 'fresh', twoMonthsAgo);

    // Use some loan funds
    addCashTransaction('withdraw', 200000, 'fresh', twoMonthsAgo);

    onRefresh(); // Update UI to show loan and transactions
    if (notificationsEnabled) {
      toast.success("Historical loan disbursed", {
        description: "Step 4/10: ₦300,000 transferred to borrower account"
      });
    }

    await new Promise(resolve => setTimeout(resolve, 1125));

    // Make loan payments progressively
    console.log('💳 Step 3b: Adding loan payment history...');
    const installmentAmount = completedLoan.installmentAmount;

    // First payment
    const firstPaymentDate = new Date(twoMonthsAgo);
    firstPaymentDate.setMonth(firstPaymentDate.getMonth() + 1);
    const firstTxn = addLoanRepaymentTransaction(completedLoan.id, installmentAmount, 'regular', 'fresh', firstPaymentDate);
    if (firstTxn.success) {
      processCreditPayment(completedLoan.id, installmentAmount, 'regular', firstTxn.transaction!.id, 'fresh');
    }

    onRefresh();
    await new Promise(resolve => setTimeout(resolve, 600));

    // Second payment
    const secondPaymentDate = new Date(firstPaymentDate);
    secondPaymentDate.setMonth(secondPaymentDate.getMonth() + 1);
    const secondTxn = addLoanRepaymentTransaction(completedLoan.id, installmentAmount, 'regular', 'fresh', secondPaymentDate);
    if (secondTxn.success) {
      processCreditPayment(completedLoan.id, installmentAmount, 'regular', secondTxn.transaction!.id, 'fresh');
    }

    onRefresh();
    await new Promise(resolve => setTimeout(resolve, 600));

    // Final payment - this will trigger collateral release
    const finalPaymentDate = new Date(secondPaymentDate);
    finalPaymentDate.setMonth(finalPaymentDate.getMonth() + 1);
    const finalTxn = addLoanRepaymentTransaction(completedLoan.id, installmentAmount, 'full', 'fresh', finalPaymentDate);
    if (finalTxn.success) {
      processCreditPayment(completedLoan.id, installmentAmount, 'full', finalTxn.transaction!.id, 'fresh');
    }

    onRefresh();
    if (notificationsEnabled) {
      toast.success("Loan payments completed", {
        description: "Historical loan fully repaid with 3 installments"
      });
    }

    await new Promise(resolve => setTimeout(resolve, 1125));

    // === STEP 4: Create Current Active Loan ===
    console.log('🔄 Step 4: Creating current active loan...');

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Step 4a: Create pending request
    const activeLoan = addPendingRequest({
      pledgerName: PLEDGER_NAME,
      pledgerEmail: 'abimbola@email.com',
      pledgerCountry: 'United Kingdom',
      amount: 400000,
      term: '6 months',
      submittedDate: oneWeekAgo.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      purpose: 'Working capital',
      expectedInterestRate: 25.0,
      repaymentFrequency: 'Monthly'
    }, 'fresh');

    onRefresh(); // Show pending request
    if (notificationsEnabled) {
      toast.info("Current loan request submitted", {
        description: "Step 4a/10: ₦400,000 request awaiting approval"
      });
    }

    await new Promise(resolve => setTimeout(resolve, 900));

    // Step 4b: Pledger locks funds
    lockFunds(activeLoan.id, 400, 'fresh');

    onRefresh(); // Show locked funds
    if (notificationsEnabled) {
      toast.info("Pledger collateral secured", {
        description: "Step 4b/10: $400 USD collateral locked"
      });
    }

    await new Promise(resolve => setTimeout(resolve, 900));

    // Step 4c: Approve request
    approvePendingRequest(activeLoan.id, 'fresh');

    onRefresh(); // Show approved status
    if (notificationsEnabled) {
      toast.success("Current loan approved", {
        description: "Step 4c/10: Active loan ready for disbursement"
      });
    }

    await new Promise(resolve => setTimeout(resolve, 900));

    // Step 4d: Disburse funds
    addLoanDisbursementTransaction(activeLoan.id, 400000, 'fresh', oneWeekAgo);

    // Use some of the active loan funds
    addCashTransaction('withdraw', 250000, 'fresh', oneWeekAgo);

    onRefresh(); // Update UI to show active loan
    if (notificationsEnabled) {
      toast.success("Active loan disbursed", {
        description: "Step 5/10: ₦400,000 working capital funded"
      });
    }

    await new Promise(resolve => setTimeout(resolve, 1125));

    // === STEP 5: Recent Regular Activity ===
    console.log('📊 Step 5: Adding recent banking activity...');

    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    // Add recent transactions one by one for visual effect
    addCashTransaction('deposit', 85000, 'fresh', twoWeeksAgo);
    onRefresh();
    await new Promise(resolve => setTimeout(resolve, 375));

    addCashTransaction('withdraw', 45000, 'fresh', oneWeekAgo);
    onRefresh();
    await new Promise(resolve => setTimeout(resolve, 375));

    addCashTransaction('deposit', 75000, 'fresh', yesterday);
    onRefresh();

    if (notificationsEnabled) {
      toast.success("Recent activity added", {
        description: "Step 6/10: Banking transactions completed"
      });
    }

    await new Promise(resolve => setTimeout(resolve, 1125));

    // === STEP 6: Add Partial Payment on Active Loan ===
    console.log('💳 Step 6: Adding partial payment on active loan...');

    const fourDaysAgo = new Date();
    fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);

    // Use the calculated installment amount from the active loan
    const activeLoanInstallmentAmount = activeLoan.installmentAmount;

    // Add one partial payment to show progress on the loan
    const partialTxn = addLoanRepaymentTransaction(activeLoan.id, activeLoanInstallmentAmount, 'regular', 'fresh', fourDaysAgo);
    if (partialTxn.success) {
      processCreditPayment(activeLoan.id, activeLoanInstallmentAmount, 'regular', partialTxn.transaction!.id, 'fresh');
    }

    onRefresh(); // Update UI to show the payment
    if (notificationsEnabled) {
      toast.success("Loan payment made", {
        description: `Step 7/10: First payment on active loan (₦${activeLoanInstallmentAmount.toLocaleString()})`
      });
    }

    await new Promise(resolve => setTimeout(resolve, 1125));

    // === STEP 8: Add Pending Request ===
    console.log('⏳ Step 8: Adding pending credit request...');

    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const pendingLoan = addPendingRequest({
      pledgerName: PLEDGER_NAME,
      pledgerEmail: 'abimbola@email.com',
      pledgerCountry: 'United Kingdom',
      amount: 250000,
      term: '4 months',
      submittedDate: threeDaysAgo.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      purpose: 'Equipment purchase',
      expectedInterestRate: 25.0,
      repaymentFrequency: 'Monthly'
    }, 'fresh');

    // Leave this request pending (don't approve it)
    onRefresh();

    if (notificationsEnabled) {
      toast.info("Pending credit request added", {
        description: "Step 8/10: Pending credit request added (awaiting approval)"
      });
    }

    await new Promise(resolve => setTimeout(resolve, 1125));

    // === STEP 9: Create Overdue Loan (Grace Period Demo) ===
    // Create a short-term loan where payment was missed
    console.log('⚠️ Step 9: Creating overdue loan (grace period)...');

    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

    const threeWeeksAgo = new Date();
    threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21);

    // Create and approve a loan dated 3 weeks ago
    const overdueLoan = addPendingRequest({
      pledgerName: PLEDGER_NAME,
      pledgerEmail: 'abimbola@email.com',
      pledgerCountry: 'United Kingdom',
      amount: 150000,  // ₦150K
      term: '4 weeks',
      submittedDate: threeWeeksAgo.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      purpose: 'Inventory restocking',
      expectedInterestRate: 25.0,
      repaymentFrequency: 'Weekly'
    }, 'fresh');

    lockFunds(overdueLoan.id, 150, 'fresh');  // $150 collateral
    approvePendingRequest(overdueLoan.id, 'fresh');
    addLoanDisbursementTransaction(overdueLoan.id, 150000, 'fresh', threeWeeksAgo);

    // Trigger overdue detection (first weekly payment was due ~14 days ago)
    detectOverdue(overdueLoan.id, 'fresh');
    applyPenaltyInterest(overdueLoan.id, 'fresh');

    onRefresh();

    if (notificationsEnabled) {
      toast.warning("Grace period triggered", {
        description: "Step 9/10: Grace period triggered — payment overdue"
      });
    }

    await new Promise(resolve => setTimeout(resolve, 1125));

    // === STEP 10: Defaulted Loan (Seizure Demo) ===
    console.log('🚨 Step 10: Creating defaulted loan (seizure)...');

    const twoMonthsAgoDefault = new Date();
    twoMonthsAgoDefault.setMonth(twoMonthsAgoDefault.getMonth() - 2);

    const defaultedLoan = addPendingRequest({
      pledgerName: PLEDGER_NAME,
      pledgerEmail: 'abimbola@email.com',
      pledgerCountry: 'United Kingdom',
      amount: 100000,  // ₦100K
      term: '4 weeks',
      submittedDate: twoMonthsAgoDefault.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      purpose: 'Emergency funds',
      expectedInterestRate: 25.0,
      repaymentFrequency: 'Daily'
    }, 'fresh');

    lockFunds(defaultedLoan.id, 100, 'fresh');  // $100 collateral
    approvePendingRequest(defaultedLoan.id, 'fresh');
    addLoanDisbursementTransaction(defaultedLoan.id, 100000, 'fresh', twoMonthsAgoDefault);

    // Make 2 payments then stop
    const firstDefaultPayDate = new Date(twoMonthsAgoDefault);
    firstDefaultPayDate.setDate(firstDefaultPayDate.getDate() + 1);
    const firstDefaultTxn = addLoanRepaymentTransaction(defaultedLoan.id, defaultedLoan.installmentAmount, 'regular', 'fresh', firstDefaultPayDate);
    if (firstDefaultTxn.success) {
      processCreditPayment(defaultedLoan.id, defaultedLoan.installmentAmount, 'regular', firstDefaultTxn.transaction!.id, 'fresh');
    }

    const secondDefaultPayDate = new Date(firstDefaultPayDate);
    secondDefaultPayDate.setDate(secondDefaultPayDate.getDate() + 1);
    const secondDefaultTxn = addLoanRepaymentTransaction(defaultedLoan.id, defaultedLoan.installmentAmount, 'regular', 'fresh', secondDefaultPayDate);
    if (secondDefaultTxn.success) {
      processCreditPayment(defaultedLoan.id, defaultedLoan.installmentAmount, 'regular', secondDefaultTxn.transaction!.id, 'fresh');
    }

    // Trigger overdue then default
    detectOverdue(defaultedLoan.id, 'fresh');
    declareDefault(defaultedLoan.id, 'fresh');

    onRefresh();

    if (notificationsEnabled) {
      toast.success("Activity history completed!", {
        description: "Step 10/10: Loan defaulted — collateral seized"
      });
    }

    console.log('✅ Progressive activity history build completed successfully!');

  } catch (error) {
    console.error('❌ Error building activity history:', error);
    if (notificationsEnabled) {
      toast.error("Failed to build activity history", {
        description: "Resetting to fresh state. Check console for details."
      });
    }

    // Reset to fresh state on error — leave app in clean state
    resetAllToFresh();
    onRefresh();
  } finally {
    isPopulateRunning = false;
  }
}
