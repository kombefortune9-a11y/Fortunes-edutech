import fs from 'fs';
const code = fs.readFileSync('src/components/FirebaseProvider.tsx', 'utf8');

const target = `  // Check sub cache first for accurate stored subscriptionStart`;

const replacement = `  if (cleanEmail === 'ngosawilliam1995@gmail.com') {
    return {
      email: cleanEmail,
      grade: 'all',
      subscriptionType: '14days',
      amountPaid: 40,
      paymentMethod: 'Zamtel',
      subscriptionIndex: 1,
      status: 'active',
      subscriptionStart: new Date('2026-09-13T12:59:00.000Z'),
      addedAt: new Date('2026-09-13T12:59:00.000Z'),
      isWhitelisted: true
    };
  }

  // Check sub cache first for accurate stored subscriptionStart`;

fs.writeFileSync('src/components/FirebaseProvider.tsx', code.replace(target, replacement));
console.log("Replaced!");
