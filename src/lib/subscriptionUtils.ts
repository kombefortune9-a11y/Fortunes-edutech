import { SUBSCRIPTION_PLANS, isDeveloperEmail } from '../constants';

export interface CalculatedSubscription {
  subscriptionType: string;
  label: string;
  subscriptionStart: Date;
  subscriptionEnd: Date | null;
  durationDays: number;
  daysRemaining: number;
  hoursRemaining: number;
  minutesRemaining: number;
  isSubscriptionExpired: boolean;
  isQuotaExhausted: boolean;
  circleDownloadsLimit: number;
  circleDownloadsCount: number;
  downloadsRemaining: number;
  warningMessage?: string;
  isTrialMode: boolean;
  allowedTools: string[];
  amountPaid: number;
  paymentMethod: string;
  subscriptionIndex: number;
  unlimitedDownloads: boolean;
  isWhitelisted: boolean;
}

export function parseToDate(val: any): Date | null {
  if (!val) return null;
  if (typeof val.toDate === 'function') {
    try { return val.toDate(); } catch {}
  }
  if (val instanceof Date) return val;
  if (typeof val.seconds === 'number') {
    return new Date(val.seconds * 1000 + (val.nanoseconds || 0) / 1000000);
  }
  const parsed = new Date(val);
  return isNaN(parsed.getTime()) ? null : parsed;
}

export function parseToMs(val: any): number {
  const d = parseToDate(val);
  return d ? d.getTime() : 0;
}

export function calculateUnifiedSubscription(
  snapData: any,
  downloadsCount: number = 0,
  userEmail?: string
): CalculatedSubscription {
  const cleanEmail = (userEmail || snapData?.email || '').toLowerCase().trim().replace(/\s+/g, '');
  const isDev = isDeveloperEmail(cleanEmail) || snapData?.userType === 'developer';

  // Target user override for ngosawilliam1995@gmail.com
  if (cleanEmail === 'ngosawilliam1995@gmail.com') {
    const plan = SUBSCRIPTION_PLANS['14days'] || { label: '14 Days Circle', price: 40, limit: 40, durationDays: 14 };
    const subStart = parseToDate(snapData?.subscriptionStart || snapData?.addedAt) || new Date("2026-09-13T12:59:00");
    const subEnd = new Date(subStart.getTime() + 14 * 86400000);
    const timeDiff = subEnd.getTime() - Date.now();
    const daysRemaining = Math.max(0, Math.ceil(timeDiff / 86400000));
    const hoursRemaining = Math.max(0, Math.floor(timeDiff / 3600000));
    const minutesRemaining = Math.max(0, Math.floor(timeDiff / 60000));
    const isSubscriptionExpired = timeDiff <= 0;
    const isQuotaExhausted = downloadsCount >= plan.limit;
    const downloadsRemaining = Math.max(0, plan.limit - downloadsCount);
    const isRevertedToTrial = isSubscriptionExpired || isQuotaExhausted;

    let warningMessage = '';
    if (isRevertedToTrial) {
      if (isQuotaExhausted) {
        warningMessage = `Circle Downloads Depleted: You have downloaded ${downloadsCount} of ${plan.limit} documents. Your account has been reverted to free trial access mode. Please renew your subscription circle to continue downloading.`;
      } else {
        warningMessage = `Circle Period Expired: Your 14 Days Circle validity has ended. Your account has been reverted to free trial access mode. Please renew your subscription circle to continue downloading.`;
      }
    } else if (downloadsRemaining <= 8) {
      warningMessage = `Real-Time Quota Warning: You have downloaded ${downloadsCount} of ${plan.limit} documents so far. You have only ${downloadsRemaining} download${downloadsRemaining === 1 ? '' : 's'} remaining before your subscription is reverted to free trial access mode.`;
    }

    return {
      subscriptionType: '14days',
      label: plan.label,
      subscriptionStart: subStart,
      subscriptionEnd: subEnd,
      durationDays: 14,
      daysRemaining,
      hoursRemaining,
      minutesRemaining,
      isSubscriptionExpired,
      isQuotaExhausted,
      circleDownloadsLimit: plan.limit,
      circleDownloadsCount: downloadsCount,
      downloadsRemaining,
      warningMessage,
      isTrialMode: isRevertedToTrial,
      allowedTools: ['all'],
      amountPaid: 40,
      paymentMethod: 'Zamtel',
      subscriptionIndex: 1,
      unlimitedDownloads: false,
      isWhitelisted: !isRevertedToTrial,
    };
  }

  if (isDev) {
    const devStart = parseToDate(snapData?.subscriptionStart || snapData?.addedAt) || new Date(2025, 0, 1);
    const devEnd = new Date(devStart.getTime() + 10 * 365 * 86400000);
    return {
      subscriptionType: 'unlimited',
      label: 'Developer Master Key (Unlimited)',
      subscriptionStart: devStart,
      subscriptionEnd: devEnd,
      durationDays: 3650,
      daysRemaining: 9999,
      hoursRemaining: 99999,
      minutesRemaining: 999999,
      isSubscriptionExpired: false,
      isQuotaExhausted: false,
      circleDownloadsLimit: 999999,
      circleDownloadsCount: downloadsCount,
      downloadsRemaining: 999999,
      warningMessage: undefined,
      isTrialMode: false,
      allowedTools: ['all'],
      amountPaid: snapData?.amountPaid ?? 0,
      paymentMethod: snapData?.paymentMethod || 'Developer Master Key',
      subscriptionIndex: 1,
      unlimitedDownloads: true,
      isWhitelisted: true,
    };
  }

  const isExplicitBlocked = snapData?.status === 'blocked';
  const isExplicitWhitelisted = snapData?.isWhitelisted === true || 
                                snapData?.is_whitelisted === true || 
                                snapData?.status === 'active' || 
                                snapData?.status === 'approved';

  const isWhitelistedUser = !!snapData && !isExplicitBlocked && (
    isExplicitWhitelisted || 
    (snapData.subscriptionType && snapData.subscriptionType !== 'guest_trial')
  );

  if (isExplicitBlocked || !isWhitelistedUser) {
    const plan = SUBSCRIPTION_PLANS.guest_trial;
    return {
      subscriptionType: 'guest_trial',
      label: plan.label,
      subscriptionStart: new Date(),
      subscriptionEnd: null,
      durationDays: 1,
      daysRemaining: 1,
      hoursRemaining: 24,
      minutesRemaining: 1440,
      isSubscriptionExpired: isExplicitBlocked,
      isQuotaExhausted: downloadsCount >= plan.limit,
      circleDownloadsLimit: plan.limit,
      circleDownloadsCount: downloadsCount,
      downloadsRemaining: Math.max(0, plan.limit - downloadsCount),
      warningMessage: 'Free Trial Access Mode: Word and PDF document downloads require an active subscription circle.',
      isTrialMode: true,
      allowedTools: ['all'],
      amountPaid: 0,
      paymentMethod: 'Free Trial',
      subscriptionIndex: 1,
      unlimitedDownloads: false,
      isWhitelisted: false,
    };
  }

  let rawSub = snapData.subscriptionType || snapData.originalSubscriptionType || snapData.subType || snapData.plan || snapData.circle;
  const amt = Number(snapData.amountPaid || snapData.amount || snapData.price || 0);

  if (rawSub === 'unlimited' || rawSub === 'termly_individual') rawSub = 'termly';
  if (rawSub === 'weekly') rawSub = '14days';
  if (!rawSub || rawSub === 'guest_trial' || !(rawSub in SUBSCRIPTION_PLANS)) {
    if (amt >= 180) rawSub = 'termly';
    else if (amt >= 70) rawSub = 'monthly';
    else if (amt >= 40) rawSub = '14days';
    else {
      rawSub = '14days';
    }
  }

  const subType = (rawSub in SUBSCRIPTION_PLANS && rawSub !== 'guest_trial') ? rawSub : '14days';
  const plan = SUBSCRIPTION_PLANS[subType] || SUBSCRIPTION_PLANS['14days'];

  let startMs = parseToMs(snapData.subscriptionStart || snapData.addedAt || snapData.createdAt || snapData.firstAccess || snapData.timestamp);
  if (!startMs || isNaN(startMs) || startMs <= 0) {
    startMs = Date.now();
  }

  const subscriptionStart = new Date(startMs);
  const unlimitedDownloads = !!snapData.unlimitedDownloads || subType === 'unlimited' || subType === 'termly';

  const durationDays = plan.durationDays;
  const durationMs = durationDays === Infinity ? 10 * 365 * 86400000 : durationDays * 86400000;
  const subscriptionEnd = new Date(subscriptionStart.getTime() + durationMs);

  const timeDiff = subscriptionEnd.getTime() - Date.now();
  const isTimeExpired = subType !== 'unlimited' && durationDays !== Infinity && timeDiff <= 0;
  const isQuotaExhausted = !unlimitedDownloads && downloadsCount >= plan.limit;
  const downloadsRemaining = unlimitedDownloads ? 999999 : Math.max(0, plan.limit - downloadsCount);

  // If the downloads are depleted revert the subscription circle to free trial access mode immediately
  // and if the days have finished, revert the subscription circle to free trial access mode immediately.
  const isRevertedToTrial = !isDev && subType !== 'unlimited' && (isTimeExpired || isQuotaExhausted);

  let warningMessage = '';
  if (isRevertedToTrial) {
    if (isQuotaExhausted) {
      warningMessage = `Circle Downloads Depleted: You have downloaded ${downloadsCount} of ${plan.limit} documents for this subscription circle. Your account has been reverted to free trial access mode immediately. Please renew your subscription circle to continue downloading.`;
    } else if (isTimeExpired) {
      warningMessage = `Circle Validity Expired: Your subscription circle period has concluded. Your account has been reverted to free trial access mode immediately. Please renew your subscription circle to continue downloading.`;
    }
  } else if (!isDev && !unlimitedDownloads && downloadsRemaining <= Math.max(5, Math.floor(plan.limit * 0.2))) {
    warningMessage = `Real-Time Quota Warning: You have downloaded ${downloadsCount} of ${plan.limit} documents so far. You have only ${downloadsRemaining} download${downloadsRemaining === 1 ? '' : 's'} left in real time before your subscription is reverted to free trial access mode.`;
  }

  const daysRemaining = subType === 'unlimited' ? 9999 : Math.max(0, Math.ceil(timeDiff / 86400000));
  const hoursRemaining = subType === 'unlimited' ? 99999 : Math.max(0, Math.floor(timeDiff / 3600000));
  const minutesRemaining = subType === 'unlimited' ? 999999 : Math.max(0, Math.floor(timeDiff / 60000));

  return {
    subscriptionType: subType,
    label: plan.label,
    subscriptionStart,
    subscriptionEnd: subType === 'unlimited' ? null : subscriptionEnd,
    durationDays,
    daysRemaining,
    hoursRemaining,
    minutesRemaining,
    isSubscriptionExpired: subType === 'unlimited' ? false : (isTimeExpired || isQuotaExhausted),
    isQuotaExhausted: subType === 'unlimited' ? false : isQuotaExhausted,
    circleDownloadsLimit: subType === 'unlimited' ? 999999 : plan.limit,
    circleDownloadsCount: downloadsCount,
    downloadsRemaining,
    warningMessage: warningMessage || undefined,
    isTrialMode: isRevertedToTrial,
    allowedTools: Array.isArray(snapData.allowed_tools) ? snapData.allowed_tools : ['all'],
    amountPaid: amt > 0 ? amt : plan.price,
    paymentMethod: snapData.paymentMethod || 'MTN Mobile Money',
    subscriptionIndex: snapData.subscriptionIndex !== undefined ? Number(snapData.subscriptionIndex) : 1,
    unlimitedDownloads,
    isWhitelisted: !isRevertedToTrial,
  };
}
