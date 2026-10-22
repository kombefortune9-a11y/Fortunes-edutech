export interface SchoolTeacherMember {
  email: string;
  name: string;
  role: 'representative' | 'teacher';
  addedAt: string;
  downloadsCount: number;
  lastActive?: string;
  isOnline?: boolean;
}

export interface SchoolCircle {
  id: string;
  schoolName: string;
  representativeName: string;
  representativeEmail: string;
  representativePhone?: string;
  maxTeachers: number;
  teachers: SchoolTeacherMember[];
  amountPaid: number;
  paymentReference?: string;
  paymentMethod?: string;
  subscriptionStartDate: string;
  subscriptionEndDate: string;
  status: 'active' | 'expired';
  createdAt: string;
  updatedAt: string;
}

export const BASE_SCHOOL_TEACHERS = 7;
export const BASE_SCHOOL_PRICE = 180;
export const EXTRA_TEACHER_RATE_PERCENT = 5; // 5%
export const EXTRA_TEACHER_PRICE = 10; // ZMK 10 per teacher

/**
 * Calculates pricing for Whole School Termly Circle based on teacher count.
 * Base 7 teachers: ZMK 180.
 * Above 7 teachers: +ZMK 10 per additional teacher.
 */
export function calculateSchoolPricing(teacherCount: number): {
  baseTeachers: number;
  extraTeachers: number;
  totalTeachers: number;
  basePrice: number;
  extraPrice: number;
  totalPrice: number;
  ratePercent: number;
} {
  const count = Math.max(1, Math.round(teacherCount || BASE_SCHOOL_TEACHERS));
  const baseTeachers = BASE_SCHOOL_TEACHERS;
  const extraTeachers = Math.max(0, count - baseTeachers);
  const basePrice = BASE_SCHOOL_PRICE;
  const extraPrice = extraTeachers * EXTRA_TEACHER_PRICE;
  const totalPrice = basePrice + extraPrice;

  return {
    baseTeachers,
    extraTeachers,
    totalTeachers: count,
    basePrice,
    extraPrice,
    totalPrice,
    ratePercent: EXTRA_TEACHER_RATE_PERCENT,
  };
}

export function sanitizeSchoolId(schoolName: string): string {
  return schoolName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || `school_${Date.now()}`;
}
