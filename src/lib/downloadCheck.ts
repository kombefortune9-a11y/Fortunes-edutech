import { isDeveloperEmail } from '../constants';

export function getDownloadAccessStatus(user: any, subscriptionDetails: any): {
  allowed: boolean;
  message: string;
  isTrial: boolean;
  reason?: 'quota_depleted' | 'time_expired' | 'trial_depleted';
} {
  const cleanEmail = user?.email?.toLowerCase().trim().replace(/\s+/g, '');
  if (cleanEmail && isDeveloperEmail(cleanEmail)) {
    return { allowed: true, message: '', isTrial: false };
  }

  const isWhitelisted = user && subscriptionDetails && !subscriptionDetails.isTrialMode;
  const isTrial = !isWhitelisted || (subscriptionDetails && subscriptionDetails.isTrialMode);

  if (isTrial) {
    const limit = subscriptionDetails?.circleDownloadsLimit ?? 4;
    const count = subscriptionDetails?.circleDownloadsCount ?? 0;
    const isExhausted = subscriptionDetails?.isQuotaExhausted || (limit < 999999 && count >= limit);
    const isExpired = subscriptionDetails?.isSubscriptionExpired;

    if (isExhausted || isExpired) {
      return {
        allowed: false,
        message: 'You have depleted your Free Trial access downloads. Please upgrade to a Subscription Circle to continue downloading.',
        isTrial: true,
        reason: 'trial_depleted'
      };
    }
  } else {
    // Whitelisted Approved User (Paid Circle)
    const limit = subscriptionDetails?.circleDownloadsLimit ?? 90;
    const count = subscriptionDetails?.circleDownloadsCount ?? 0;
    const isExhausted = subscriptionDetails?.isQuotaExhausted || (limit < 999999 && count >= limit);
    const isExpired = subscriptionDetails?.isSubscriptionExpired || (subscriptionDetails?.daysRemaining !== undefined && subscriptionDetails.daysRemaining <= 0 && subscriptionDetails?.subscriptionType !== 'unlimited');

    if (isExhausted) {
      return {
        allowed: false,
        message: 'You have depleted your allocated downloads for this subscription circle. Please renew your subscription circle to continue downloading, even if your subscription end date has not yet been reached.',
        isTrial: false,
        reason: 'quota_depleted'
      };
    }

    if (isExpired) {
      return {
        allowed: false,
        message: 'Your subscription circle period has expired as the subscription date has passed. Your subscription is considered over despite having remaining downloads. Please renew your subscription circle to continue downloading.',
        isTrial: false,
        reason: 'time_expired'
      };
    }
  }

  return { allowed: true, message: '', isTrial };
}
