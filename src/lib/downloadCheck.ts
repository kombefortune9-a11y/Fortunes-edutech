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

  const isWhitelisted = user && subscriptionDetails && !subscriptionDetails.isTrialMode && subscriptionDetails.subscriptionType !== 'guest_trial' && subscriptionDetails.isWhitelisted !== false;
  const isTrial = !isWhitelisted || !subscriptionDetails || (subscriptionDetails && (subscriptionDetails.isTrialMode || subscriptionDetails.subscriptionType === 'guest_trial' || subscriptionDetails.isWhitelisted === false));

  if (isTrial) {
    return {
      allowed: false,
      message: 'Premium Upgrade Required: Free trial downloads are not available. You are free to generate, view on-screen previews, and test all features, but downloading Word/PDF/Excel files requires an active Subscription Circle.',
      isTrial: true,
      reason: 'trial_depleted'
    };
  } else {
    // Whitelisted Approved User (Paid Circle)
    const limit = subscriptionDetails?.circleDownloadsLimit ?? 90;
    const count = subscriptionDetails?.circleDownloadsCount ?? 0;
    const isExhausted = subscriptionDetails?.isQuotaExhausted || (limit < 999999 && count >= limit);
    const isExpired = subscriptionDetails?.isSubscriptionExpired || (subscriptionDetails?.daysRemaining !== undefined && subscriptionDetails.daysRemaining <= 0 && subscriptionDetails?.subscriptionType !== 'unlimited');

    if (isExhausted) {
      return {
        allowed: false,
        message: `You have depleted your allocated downloads for this subscription circle (${count}/${limit} docs used). Your account has been reverted to free trial access mode immediately. Please renew your subscription circle to continue downloading.`,
        isTrial: true,
        reason: 'quota_depleted'
      };
    }

    if (isExpired) {
      return {
        allowed: false,
        message: 'Your subscription circle period has expired. Your account has been reverted to free trial access mode immediately. Please renew your subscription circle to continue downloading.',
        isTrial: true,
        reason: 'time_expired'
      };
    }
  }

  return { allowed: true, message: '', isTrial };
}
