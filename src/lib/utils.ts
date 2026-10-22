import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Extracts a polite, natural English first name from a user's display name or email.
 * E.g.:
 * - "Fortune Kombe" -> "Fortune"
 * - "kombefortune9@gmail.com" -> "Fortune" (or "Kombe")
 * - "joseph.banda@gmail.com" -> "Joseph"
 * - "mary_mwale2026@gmail.com" -> "Mary"
 */
export function extractFirstNameFromEmail(email: string): string {
  if (!email) return 'Educator';
  const prefix = email.split('@')[0] || '';
  // Split on periods, underscores, dashes
  const parts = prefix.split(/[._-]+/);
  
  for (const part of parts) {
    // Remove digits
    const cleaned = part.replace(/[0-9]+/g, '').trim();
    if (cleaned.length >= 2) {
      // Return capitalized first name
      return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
    }
  }
  return 'Educator';
}

export function extractUserFirstName(displayName?: string | null, email?: string | null): string {
  if (displayName && displayName.trim()) {
    const trimmed = displayName.trim();
    const firstWord = trimmed.split(/\s+/)[0];
    // Avoid generic labels like "Teacher", "Approved", "Developer" if we have an email
    const genericWords = ['teacher', 'educator', 'approved', 'developer', 'guest', 'admin', 'user'];
    if (!genericWords.includes(firstWord.toLowerCase()) && firstWord.length >= 2) {
      return firstWord.charAt(0).toUpperCase() + firstWord.slice(1);
    }
  }
  if (email) {
    return extractFirstNameFromEmail(email);
  }
  return 'Educator';
}
