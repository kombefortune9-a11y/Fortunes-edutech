import { isDeveloperEmail } from '../constants';

export function getDownloadAccessStatus(user: any, subscriptionDetails: any): {
  allowed: boolean;
  message: string;
  isTrial: boolean;
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
      };
    }
  } else {
    // Whitelisted Approved User (Paid Circle)
    // Even if subscription date has NOT yet reached but has depleted the downloads:
    const limit = subscriptionDetails?.circleDownloadsLimit ?? 90;
    const count = subscriptionDetails?.circleDownloadsCount ?? 0;
    const isExhausted = subscriptionDetails?.isQuotaExhausted || (limit < 999999 && count >= limit);
    const isExpired = subscriptionDetails?.isSubscriptionExpired;

    if (isExhausted || isExpired) {
      return {
        allowed: false,
        message: 'You have depleted your allocated downloads for this subscription circle. Please renew your subscription circle to continue downloading, even if your subscription end date has not yet been reached.',
        isTrial: false,
      };
    }
  }

  return { allowed: true, message: '', isTrial };
}
