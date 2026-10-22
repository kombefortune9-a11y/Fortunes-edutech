import { db } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  getDocs, 
  updateDoc, 
  serverTimestamp, 
  addDoc,
  Timestamp 
} from 'firebase/firestore';
import { safeLocalStorage } from './storage';
import { SchoolCircle, SchoolTeacherMember, sanitizeSchoolId, BASE_SCHOOL_TEACHERS, EXTRA_TEACHER_PRICE } from './schoolTypes';

const SCHOOLS_CACHE_KEY = 'eduplan_all_schools_cache';
const USER_SCHOOL_CACHE_PREFIX = 'eduplan_user_school_';

export async function fetchAllSchools(): Promise<SchoolCircle[]> {
  try {
    const snap = await getDocs(collection(db, 'schools'));
    const list: SchoolCircle[] = [];
    snap.forEach((d) => {
      const data = d.data();
      list.push({
        id: d.id,
        ...data,
      } as SchoolCircle);
    });

    if (list.length > 0) {
      safeLocalStorage.setItem(SCHOOLS_CACHE_KEY, JSON.stringify(list));
    }
    return list;
  } catch (err) {
    console.warn('Could not fetch schools from Firestore, using cache if available:', err);
    try {
      const cached = safeLocalStorage.getItem(SCHOOLS_CACHE_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  }
}

export async function findSchoolByTeacherEmail(email: string): Promise<SchoolCircle | null> {
  if (!email) return null;
  const cleanEmail = email.toLowerCase().trim().replace(/\s+/g, '');
  if (!cleanEmail) return null;

  // 1. Try local cache first for instant UI response
  try {
    const cached = safeLocalStorage.getItem(`${USER_SCHOOL_CACHE_PREFIX}${cleanEmail}`);
    if (cached) {
      const parsed = JSON.parse(cached) as SchoolCircle;
      // verify email still in teachers
      if (parsed.teachers?.some(t => t.email.toLowerCase().trim() === cleanEmail)) {
        return parsed;
      }
    }
  } catch (e) {}

  // 2. Fetch live schools from Firestore
  try {
    const schools = await fetchAllSchools();
    const matched = schools.find((s) => 
      s.teachers && Array.isArray(s.teachers) && 
      s.teachers.some((t) => t.email?.toLowerCase().trim() === cleanEmail)
    );

    if (matched) {
      safeLocalStorage.setItem(`${USER_SCHOOL_CACHE_PREFIX}${cleanEmail}`, JSON.stringify(matched));
      return matched;
    }
  } catch (err) {
    console.warn('Error finding school for email:', cleanEmail, err);
  }

  return null;
}

export async function registerSchoolCircle(params: {
  schoolName: string;
  representativeName: string;
  representativeEmail: string;
  representativePhone?: string;
  teachers: { name: string; email: string }[];
  amountPaid: number;
  paymentReference: string;
  paymentMethod: string;
  maxTeachers: number;
}): Promise<SchoolCircle> {
  const {
    schoolName,
    representativeName,
    representativeEmail,
    representativePhone,
    teachers: rawTeachers,
    amountPaid,
    paymentReference,
    paymentMethod,
    maxTeachers,
  } = params;

  const schoolId = sanitizeSchoolId(schoolName);
  const now = new Date();
  const expiryDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days for termly
  const cleanRepEmail = representativeEmail.toLowerCase().trim().replace(/\s+/g, '');

  // Normalize teachers list and ensure representative is included
  const teacherMembers: SchoolTeacherMember[] = [];

  // Add representative first if not present
  let hasRepInList = false;
  for (const t of rawTeachers) {
    const cleanMail = t.email.toLowerCase().trim().replace(/\s+/g, '');
    if (!cleanMail) continue;
    const isRep = cleanMail === cleanRepEmail;
    if (isRep) hasRepInList = true;

    teacherMembers.push({
      email: cleanMail,
      name: t.name.trim() || (isRep ? representativeName : 'Teacher'),
      role: isRep ? 'representative' : 'teacher',
      addedAt: now.toISOString(),
      downloadsCount: 0,
      lastActive: now.toISOString(),
      isOnline: true,
    });
  }

  if (!hasRepInList && cleanRepEmail) {
    teacherMembers.unshift({
      email: cleanRepEmail,
      name: representativeName.trim() || 'Representative',
      role: 'representative',
      addedAt: now.toISOString(),
      downloadsCount: 0,
      lastActive: now.toISOString(),
      isOnline: true,
    });
  }

  const schoolCircle: SchoolCircle = {
    id: schoolId,
    schoolName: schoolName.trim(),
    representativeName: representativeName.trim(),
    representativeEmail: cleanRepEmail,
    representativePhone: representativePhone?.trim() || '',
    maxTeachers: Math.max(maxTeachers || BASE_SCHOOL_TEACHERS, teacherMembers.length),
    teachers: teacherMembers,
    amountPaid,
    paymentReference,
    paymentMethod,
    subscriptionStartDate: now.toISOString(),
    subscriptionEndDate: expiryDate.toISOString(),
    status: 'active',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  // 1. Save school document to Firestore
  try {
    await setDoc(doc(db, 'schools', schoolId), {
      ...schoolCircle,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.error('Failed to save school document to Firestore:', err);
  }

  // 2. Authorize every teacher in authorized_guests
  for (const teacher of teacherMembers) {
    try {
      const guestPayload = {
        email: teacher.email,
        displayName: `${teacher.name} (${schoolCircle.schoolName})`,
        isWhitelisted: true,
        status: 'active',
        subscriptionType: 'termly',
        unlimitedDownloads: true,
        circleDownloadsLimit: 999999,
        circleDownloadsCount: 0,
        amountPaid: amountPaid,
        grade: 'all',
        assignedGrades: ['all'],
        subscriptionStartDate: now.toISOString(),
        subscriptionEndDate: expiryDate.toISOString(),
        expiresAt: Timestamp.fromDate(expiryDate),
        paymentMethod,
        paymentReference,
        schoolId,
        schoolName: schoolCircle.schoolName,
        schoolRole: teacher.role,
        teacherName: teacher.name,
        updatedAt: serverTimestamp(),
      };
      await setDoc(doc(db, 'authorized_guests', teacher.email), guestPayload, { merge: true });
      safeLocalStorage.setItem(`${USER_SCHOOL_CACHE_PREFIX}${teacher.email}`, JSON.stringify(schoolCircle));
    } catch (e) {
      console.warn('Failed to authorize guest for school teacher:', teacher.email, e);
    }
  }

  // 3. Create official School Receipt in the name of the school
  try {
    const teachersSummaryList = teacherMembers.map((t, idx) => `${idx + 1}. ${t.name} (${t.email})`).join(', ');
    const receiptData = {
      payerName: schoolCircle.schoolName,
      payerEmail: schoolCircle.representativeEmail,
      payerPhone: schoolCircle.representativePhone || 'N/A',
      amount: amountPaid,
      currency: 'ZMW',
      packageName: `Whole School Termly Circle (Unlimited Access - 90 Days)`,
      packageType: 'termly',
      paymentMethod,
      referenceNumber: paymentReference,
      receiptNumber: `SCH-${Date.now().toString().slice(-6)}`,
      notes: `Whole School Subscription for ${schoolCircle.schoolName}. Total Connected Teachers: ${teacherMembers.length} (${teachersSummaryList})`,
      description: `Whole School Termly Circle: ${teacherMembers.length} Teachers Connected (${teacherMembers.map(t => t.name).join(', ')})`,
      issuedBy: 'Fortunes Edutech Automated Billing',
      status: 'completed',
      createdAt: serverTimestamp(),
      date: new Date().toLocaleDateString('en-GB'),
      schoolId,
      totalUsersConnected: teacherMembers.length,
      teachersList: teacherMembers.map(t => ({ name: t.name, email: t.email })),
    };
    await addDoc(collection(db, 'receipts'), receiptData);
  } catch (e) {
    console.warn('Error creating school receipt:', e);
  }

  // 4. Send activation emails to all teachers
  sendSchoolActivationEmails(schoolCircle);

  // Update local cache
  safeLocalStorage.setItem(`${USER_SCHOOL_CACHE_PREFIX}${cleanRepEmail}`, JSON.stringify(schoolCircle));
  return schoolCircle;
}

export async function addTeacherToSchool(
  schoolId: string,
  repEmail: string,
  newTeacher: { name: string; email: string }
): Promise<SchoolCircle> {
  const cleanRep = repEmail.toLowerCase().trim().replace(/\s+/g, '');
  const cleanTeacherEmail = newTeacher.email.toLowerCase().trim().replace(/\s+/g, '');
  const cleanTeacherName = newTeacher.name.trim();

  if (!cleanTeacherEmail) {
    throw new Error('Please enter a valid teacher email address.');
  }
  if (!cleanTeacherName) {
    throw new Error('Please enter the teacher name (e.g. Mr. Mwansa).');
  }

  // 1. Fetch current school data
  const schoolDocRef = doc(db, 'schools', schoolId);
  const snap = await getDoc(schoolDocRef);
  if (!snap.exists()) {
    throw new Error('School Circle account not found.');
  }

  const school = { id: snap.id, ...snap.data() } as SchoolCircle;

  // 2. Strict authorization: Only the representative can add teachers
  if (school.representativeEmail.toLowerCase().trim() !== cleanRep) {
    throw new Error('Only the school teacher representative who registered the circle is authorized to add additional teachers.');
  }

  // 3. Check capacity limit
  const maxAllowed = school.maxTeachers || BASE_SCHOOL_TEACHERS;
  if (school.teachers.length >= maxAllowed) {
    throw new Error(
      `Capacity limit reached! This School Circle is limited to ${maxAllowed} teachers. Additional teachers over ${BASE_SCHOOL_TEACHERS} are charged at 5% (ZMK ${EXTRA_TEACHER_PRICE} per teacher). Please contact the developer or upgrade the circle capacity.`
    );
  }

  // 4. Check if teacher already exists
  if (school.teachers.some((t) => t.email.toLowerCase().trim() === cleanTeacherEmail)) {
    throw new Error(`Teacher with email ${cleanTeacherEmail} is already registered under ${school.schoolName}.`);
  }

  // 5. Append new teacher
  const newMember: SchoolTeacherMember = {
    email: cleanTeacherEmail,
    name: cleanTeacherName,
    role: 'teacher',
    addedAt: new Date().toISOString(),
    downloadsCount: 0,
    lastActive: new Date().toISOString(),
    isOnline: false,
  };

  const updatedTeachers = [...school.teachers, newMember];

  await updateDoc(schoolDocRef, {
    teachers: updatedTeachers,
    updatedAt: serverTimestamp(),
  });

  // 6. Authorize new teacher in authorized_guests
  const expiryDate = new Date(school.subscriptionEndDate);
  try {
    await setDoc(doc(db, 'authorized_guests', cleanTeacherEmail), {
      email: cleanTeacherEmail,
      displayName: `${cleanTeacherName} (${school.schoolName})`,
      isWhitelisted: true,
      status: 'active',
      subscriptionType: 'termly',
      unlimitedDownloads: true,
      circleDownloadsLimit: 999999,
      circleDownloadsCount: 0,
      amountPaid: school.amountPaid,
      grade: 'all',
      assignedGrades: ['all'],
      subscriptionStartDate: school.subscriptionStartDate,
      subscriptionEndDate: school.subscriptionEndDate,
      expiresAt: Timestamp.fromDate(expiryDate),
      paymentMethod: school.paymentMethod || 'Lipila',
      paymentReference: school.paymentReference || '',
      schoolId: school.id,
      schoolName: school.schoolName,
      schoolRole: 'teacher',
      teacherName: cleanTeacherName,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (e) {
    console.warn('Failed to authorize added teacher in authorized_guests:', e);
  }

  const updatedSchool: SchoolCircle = {
    ...school,
    teachers: updatedTeachers,
  };

  safeLocalStorage.setItem(`${USER_SCHOOL_CACHE_PREFIX}${cleanTeacherEmail}`, JSON.stringify(updatedSchool));
  safeLocalStorage.setItem(`${USER_SCHOOL_CACHE_PREFIX}${cleanRep}`, JSON.stringify(updatedSchool));

  // Send activation update email to the new teacher
  sendSingleTeacherActivationEmail(updatedSchool, newMember);

  return updatedSchool;
}

export async function recordSchoolTeacherDownload(
  schoolId: string,
  teacherEmail: string
): Promise<void> {
  if (!schoolId || !teacherEmail) return;
  const cleanMail = teacherEmail.toLowerCase().trim().replace(/\s+/g, '');

  try {
    const schoolDocRef = doc(db, 'schools', schoolId);
    const snap = await getDoc(schoolDocRef);
    if (!snap.exists()) return;

    const school = snap.data() as SchoolCircle;
    let modified = false;
    const nowIso = new Date().toISOString();

    const updatedTeachers = (school.teachers || []).map((t) => {
      if (t.email?.toLowerCase().trim() === cleanMail) {
        modified = true;
        return {
          ...t,
          downloadsCount: (t.downloadsCount || 0) + 1,
          lastActive: nowIso,
          isOnline: true,
        };
      }
      return t;
    });

    if (modified) {
      await updateDoc(schoolDocRef, {
        teachers: updatedTeachers,
        updatedAt: serverTimestamp(),
      });
      safeLocalStorage.setItem(`${USER_SCHOOL_CACHE_PREFIX}${cleanMail}`, JSON.stringify({
        ...school,
        id: snap.id,
        teachers: updatedTeachers,
      }));
    }
  } catch (err) {
    console.warn('Could not record school teacher download:', err);
  }
}

export async function updateSchoolTeacherHeartbeat(
  schoolId: string,
  teacherEmail: string
): Promise<void> {
  if (!schoolId || !teacherEmail) return;
  const cleanMail = teacherEmail.toLowerCase().trim().replace(/\s+/g, '');

  try {
    const schoolDocRef = doc(db, 'schools', schoolId);
    const snap = await getDoc(schoolDocRef);
    if (!snap.exists()) return;

    const school = snap.data() as SchoolCircle;
    const nowIso = new Date().toISOString();

    const updatedTeachers = (school.teachers || []).map((t) => {
      if (t.email?.toLowerCase().trim() === cleanMail) {
        return {
          ...t,
          lastActive: nowIso,
          isOnline: true,
        };
      }
      return t;
    });

    await updateDoc(schoolDocRef, {
      teachers: updatedTeachers,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    // transient heartbeat network errors can be safely ignored
  }
}

async function sendSchoolActivationEmails(school: SchoolCircle) {
  try {
    const recipients = school.teachers.map((t) => ({
      name: t.name,
      email: t.email,
    }));

    const subject = `🎉 Whole School Termly Circle Activated: ${school.schoolName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
        <h2 style="color: #00A86B; margin-bottom: 8px;">Whole School Termly Circle Activated!</h2>
        <p style="font-size: 15px; line-height: 1.5;">
          Congratulations! Your school <strong>${school.schoolName}</strong> has been successfully registered and fully activated for the <strong>Whole School Termly Circle</strong> on Fortunes Edutech.
        </p>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0;">
          <p style="margin: 4px 0;"><strong>🏫 School:</strong> ${school.schoolName}</p>
          <p style="margin: 4px 0;"><strong>👤 Registered By:</strong> ${school.representativeName} (${school.representativeEmail})</p>
          <p style="margin: 4px 0;"><strong>⚡ Access Tier:</strong> Unlimited Document Downloads &amp; Shared Records</p>
          <p style="margin: 4px 0;"><strong>👥 Connected Teachers:</strong> ${school.teachers.length} of ${school.maxTeachers}</p>
          <p style="margin: 4px 0;"><strong>📅 Term Validity:</strong> 90 Days (Expires: ${new Date(school.subscriptionEndDate).toLocaleDateString('en-GB')})</p>
        </div>
        <p style="font-size: 14px; line-height: 1.5;">
          You can now log into Fortunes Edutech using your registered email address to access full unlimited document generation, schemes of work, weekly forecasts, lesson plans, assessment sheets, and report cards.
        </p>
        <p style="font-size: 12px; color: #64748b; margin-top: 24px;">
          If you have questions, please coordinate with your school representative (${school.representativeName}) or contact Developer Support (+260961622222).
        </p>
      </div>
    `;

    await fetch('/api/system/email/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipients,
        subject,
        html,
        text: `Your school ${school.schoolName} has been activated for the Whole School Termly Circle on Fortunes Edutech!`,
      }),
    }).catch(() => {});
  } catch (err) {
    console.warn('Failed to broadcast school activation emails:', err);
  }
}

async function sendSingleTeacherActivationEmail(school: SchoolCircle, teacher: SchoolTeacherMember) {
  try {
    const subject = `🎉 Added to ${school.schoolName} School Circle - Fortunes Edutech`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
        <h2 style="color: #00A86B; margin-bottom: 8px;">Welcome to ${school.schoolName} App Account!</h2>
        <p style="font-size: 15px; line-height: 1.5;">
          Hello <strong>${teacher.name}</strong>, you have been added to the <strong>Whole School Termly Circle</strong> for <strong>${school.schoolName}</strong> by your school representative (${school.representativeName}).
        </p>
        <p style="font-size: 14px; line-height: 1.5;">
          You now have full unlimited access to teaching materials, weekly forecasts, lesson plans, and shared assessment records.
        </p>
      </div>
    `;

    await fetch('/api/system/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: teacher.email,
        recipientName: teacher.name,
        subject,
        html,
        text: `You have been added to ${school.schoolName} Whole School Termly Circle on Fortunes Edutech.`,
      }),
    }).catch(() => {});
  } catch (err) {
    console.warn('Failed to send single teacher activation email:', err);
  }
}
