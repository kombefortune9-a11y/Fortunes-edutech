import { safeLocalStorage } from './storage';
import { isDeveloperEmail } from '../constants';

export const TRIAL_VIEW_LIMITS: Record<string, number> = {
  schemes_of_work: 1,
  weekly_forecast: 1,
  lesson_plan: 2,
};

export const TRIAL_DOC_NAMES: Record<string, string> = {
  schemes_of_work: 'Schemes of Work',
  weekly_forecast: 'Weekly Forecast',
  lesson_plan: 'Lesson Plans',
};

export interface TrialViewCounts {
  schemes_of_work: number;
  weekly_forecast: number;
  lesson_plan: number;
}

export interface TrialDocCheckResult {
  allowed: boolean;
  isTrial: boolean;
  count: number;
  limit: number;
  remaining: number;
  docTypeName: string;
  reason?: string;
}

const getStorageKey = (userEmailOrUid?: string | null): string => {
  const clean = (userEmailOrUid || 'guest_user').toLowerCase().trim().replace(/[^a-z0-9_@.-]/g, '_');
  return `eduplan_trial_views_${clean}`;
};

export function getTrialViewCounts(userEmailOrUid?: string | null): TrialViewCounts {
  const defaultCounts: TrialViewCounts = {
    schemes_of_work: 0,
    weekly_forecast: 0,
    lesson_plan: 0,
  };

  try {
    const key = getStorageKey(userEmailOrUid);
    const stored = safeLocalStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        schemes_of_work: Number(parsed.schemes_of_work) || 0,
        weekly_forecast: Number(parsed.weekly_forecast) || 0,
        lesson_plan: Number(parsed.lesson_plan) || 0,
      };
    }
  } catch (e) {
    console.error('Error reading trial view counts:', e);
  }

  return defaultCounts;
}

export function isUserInTrialMode(user: any, subscriptionDetails: any, isWhitelisted: boolean): boolean {
  const cleanEmail = user?.email?.toLowerCase().trim().replace(/\s+/g, '');
  if (cleanEmail && isDeveloperEmail(cleanEmail)) {
    return false;
  }
  if (!isWhitelisted) return true;
  if (!subscriptionDetails) return true;
  if (subscriptionDetails.isTrialMode || subscriptionDetails.subscriptionType === 'guest_trial') return true;
  return false;
}

export function checkTrialDocAccess(
  docType: string,
  user: any,
  subscriptionDetails: any,
  isWhitelisted: boolean
): TrialDocCheckResult {
  const isTrial = isUserInTrialMode(user, subscriptionDetails, isWhitelisted);
  const normalizedType = (docType || '').toLowerCase().trim();
  const docTypeName = TRIAL_DOC_NAMES[normalizedType] || normalizedType.replace(/_/g, ' ');

  if (!isTrial) {
    return {
      allowed: true,
      isTrial: false,
      count: 0,
      limit: Infinity,
      remaining: Infinity,
      docTypeName,
    };
  }

  const limit = TRIAL_VIEW_LIMITS[normalizedType];
  const userIdentifier = user?.email || user?.uid || 'guest_user';
  const counts = getTrialViewCounts(userIdentifier);

  // If this docType is NOT one of the 3 permitted trial types
  if (limit === undefined) {
    return {
      allowed: false,
      isTrial: true,
      count: 0,
      limit: 0,
      remaining: 0,
      docTypeName,
      reason: `Free Trial access only allows viewing 1 Schemes of Work, 1 Weekly Forecast, and 2 Lesson Plans. To view ${docTypeName} documents, please subscribe to an active Subscription Circle.`,
    };
  }

  const count = (counts as any)[normalizedType] || 0;
  const remaining = Math.max(0, limit - count);
  const allowed = remaining > 0;

  let reason = '';
  if (!allowed) {
    reason = `Free Trial view limit reached: You have already viewed ${count}/${limit} ${docTypeName}. Free trial users can only view 1 Schemes of Work, 1 Weekly Forecast, and 2 Lesson Plans. Please subscribe to an active Subscription Circle to unlock unlimited viewing and full downloads.`;
  }

  return {
    allowed,
    isTrial: true,
    count,
    limit,
    remaining,
    docTypeName,
    reason,
  };
}

export function recordTrialDocView(
  docType: string,
  user: any,
  subscriptionDetails: any,
  isWhitelisted: boolean,
  docSessionKey?: string
): { success: boolean; counts: TrialViewCounts; isTrial: boolean } {
  const isTrial = isUserInTrialMode(user, subscriptionDetails, isWhitelisted);
  const userIdentifier = user?.email || user?.uid || 'guest_user';
  const currentCounts = getTrialViewCounts(userIdentifier);

  if (!isTrial) {
    return { success: true, counts: currentCounts, isTrial: false };
  }

  const normalizedType = (docType || '').toLowerCase().trim();
  if (!(normalizedType in TRIAL_VIEW_LIMITS)) {
    return { success: false, counts: currentCounts, isTrial: true };
  }

  // Prevent double counting the same session view
  if (docSessionKey) {
    const sessionTrackerKey = `eduplan_trial_viewed_sessions_${userIdentifier}`;
    try {
      const storedSessions = safeLocalStorage.getItem(sessionTrackerKey);
      const sessionList: string[] = storedSessions ? JSON.parse(storedSessions) : [];
      if (sessionList.includes(docSessionKey)) {
        return { success: true, counts: currentCounts, isTrial: true };
      }
      sessionList.push(docSessionKey);
      safeLocalStorage.setItem(sessionTrackerKey, JSON.stringify(sessionList.slice(-50)));
    } catch (e) {}
  }

  const newCounts: TrialViewCounts = {
    ...currentCounts,
    [normalizedType]: ((currentCounts as any)[normalizedType] || 0) + 1,
  };

  try {
    const key = getStorageKey(userIdentifier);
    safeLocalStorage.setItem(key, JSON.stringify(newCounts));
  } catch (e) {
    console.error('Failed to save trial view count:', e);
  }

  return {
    success: true,
    counts: newCounts,
    isTrial: true,
  };
}

export function resetTrialDocViews(userEmailOrUid?: string | null): void {
  const key = getStorageKey(userEmailOrUid);
  safeLocalStorage.removeItem(key);
  const userIdentifier = userEmailOrUid || 'guest_user';
  safeLocalStorage.removeItem(`eduplan_trial_viewed_sessions_${userIdentifier}`);
}
