import React from 'react';
import { 
  ShieldCheck, 
  FileText, 
  AlertOctagon, 
  CheckCircle2, 
  Lock, 
  Scale, 
  BookOpen, 
  CreditCard, 
  AlertTriangle, 
  PhoneCall, 
  Building2,
  Mail,
  UserCheck,
  Award,
  Globe,
  Database,
  Trash2,
  Shield,
  HelpCircle,
  ExternalLink
} from 'lucide-react';

export const TermsAndConditionsView: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  return (
    <div className="space-y-6 text-left font-sans">
      {/* Official Document Header */}
      <div className="border-b border-slate-200/80 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-[#00A86B] flex items-center justify-center border border-emerald-500/25 shrink-0">
              <Scale size={22} />
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-black text-slate-900 uppercase tracking-tight">
                FORTUNES EDUTECH - TERMS OF SERVICE & PRIVACY POLICY
              </h2>
              <p className="text-[11px] font-extrabold text-[#00A86B] uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
                <span>Combined Legal Agreement</span>
                <span>•</span>
                <span>Zambian Law Compliant (PACRA & Data Protection Act)</span>
              </p>
            </div>
          </div>
          <span className="text-[10px] font-black uppercase px-3 py-1 bg-emerald-100 text-emerald-900 rounded-full border border-emerald-300 shrink-0">
            Last Updated: 08 October 2026
          </span>
        </div>
      </div>

      {/* PART A HEADER */}
      <div className="pt-2">
        <div className="bg-slate-900 text-white px-4 py-3 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-[#00A86B]" />
            <h3 className="font-black uppercase tracking-wider text-xs sm:text-sm text-white">
              PART A - TERMS AND CONDITIONS
            </h3>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-800 px-2.5 py-1 rounded-lg">
            Sections 1 - 12
          </span>
        </div>
      </div>

      {/* PART A SECTIONS (1 to 12) */}
      <div className="space-y-4 text-xs text-slate-700 leading-relaxed font-normal">
        
        {/* Section 1 */}
        <section className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/70 space-y-2">
          <div className="flex items-center gap-2 text-slate-900 font-black uppercase text-xs tracking-wider">
            <span className="w-5 h-5 rounded-md bg-[#00A86B] text-white flex items-center justify-center text-[10px] shrink-0">1</span>
            <h4>1. LEGALLY BINDING AGREEMENT</h4>
          </div>
          <div className="pl-7 space-y-1.5 text-slate-600 font-medium">
            <p className="text-slate-900 font-bold">Welcome to Fortunes Edutech! We are delighted to have you.</p>
            <p>
              Fortunes Edutech (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is a Zambian educational technology business, duly registered under the Patents and Companies Registration Agency (PACRA) with Business Registration Number (BN No.): 320261079581 and ZRA TPIN: 1005958991, owned and operated by Fortunes Edutech Team.
            </p>
            <p>
              By downloading, installing, creating an account, or using our mobile application and services (collectively, the &quot;App&quot;), you enter into a legally binding contract with Fortunes Edutech. If you do not agree with these Terms, you must discontinue use immediately.
            </p>
          </div>
        </section>

        {/* Section 2 */}
        <section className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/70 space-y-2">
          <div className="flex items-center gap-2 text-slate-900 font-black uppercase text-xs tracking-wider">
            <span className="w-5 h-5 rounded-md bg-[#00A86B] text-white flex items-center justify-center text-[10px] shrink-0">2</span>
            <h4>2. OUR MISSION AND SERVICES</h4>
          </div>
          <div className="pl-7 space-y-1.5 text-slate-600 font-medium">
            <p className="text-emerald-800 font-bold">
              Fortunes Edutech was built for the Zambian teacher. Our mission is to help teachers plan competently, so no teacher is left behind.
            </p>
            <p>
              We provide original, curriculum-aligned digital teaching resources, including but not limited to lesson plans, schemes of work, teaching notes, and assessment materials for Early Childhood, Primary and Secondary levels.
            </p>
            <p>
              We reserve the right to improve, modify, or discontinue any part of our services at any time to serve you better.
            </p>
          </div>
        </section>

        {/* Section 3 */}
        <section className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/70 space-y-2">
          <div className="flex items-center gap-2 text-slate-900 font-black uppercase text-xs tracking-wider">
            <span className="w-5 h-5 rounded-md bg-[#00A86B] text-white flex items-center justify-center text-[10px] shrink-0">3</span>
            <h4>3. USER ACCOUNTS AND ELIGIBILITY</h4>
          </div>
          <div className="pl-7 space-y-1.5 text-slate-600 font-medium">
            <p>
              To access our materials, you must register with accurate, current information. You are responsible for maintaining the confidentiality of your login details. Any activity under your account will be deemed yours. You must notify us immediately of any unauthorized access.
            </p>
            <p>
              Our services are intended for teachers, educators, and learners aged 18 and above. If you are under 18, you may use the App only under the supervision of a parent or guardian.
            </p>
          </div>
        </section>

        {/* Section 4 */}
        <section className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/70 space-y-2">
          <div className="flex items-center gap-2 text-slate-900 font-black uppercase text-xs tracking-wider">
            <span className="w-5 h-5 rounded-md bg-[#00A86B] text-white flex items-center justify-center text-[10px] shrink-0">4</span>
            <h4>4. LICENSE TO USE</h4>
          </div>
          <p className="text-slate-600 pl-7 font-medium">
            We grant you a limited, non-exclusive, non-transferable, revocable license to use the App and its content for your personal, non-commercial teaching preparation only. This license does not transfer ownership of any intellectual property to you.
          </p>
        </section>

        {/* Section 5 */}
        <section className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/70 space-y-2">
          <div className="flex items-center gap-2 text-slate-900 font-black uppercase text-xs tracking-wider">
            <span className="w-5 h-5 rounded-md bg-[#00A86B] text-white flex items-center justify-center text-[10px] shrink-0">5</span>
            <h4>5. INTELLECTUAL PROPERTY RIGHTS</h4>
          </div>
          <p className="text-slate-600 pl-7 font-medium">
            All content within the App, including lesson plans, schemes of work, text, graphics, logos, designs, software, and the &quot;Fortunes Edutech&quot; brand, is the original work and exclusive property of Fortunes Edutech and is protected under the <strong>Copyright and Performance Rights Act of Zambia</strong> and other applicable intellectual property laws.
          </p>
        </section>

        {/* Section 6 */}
        <section className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/70 space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-black uppercase text-xs tracking-wider">
            <span className="w-5 h-5 rounded-md bg-[#00A86B] text-white flex items-center justify-center text-[10px] shrink-0">6</span>
            <h4>6. PROHIBITED USES</h4>
          </div>
          <p className="text-slate-600 pl-7 font-medium">
            To protect the integrity of our work and sustain affordable access for all teachers, you agree not to:
          </p>
          <div className="ml-7 bg-rose-50/90 border border-rose-200 rounded-xl p-3.5 space-y-2 text-rose-900">
            <div className="flex items-center gap-1.5 font-black uppercase text-[11px] text-rose-700">
              <AlertOctagon size={15} />
              <span>Strictly Prohibited Violations:</span>
            </div>
            <ul className="space-y-1.5 text-rose-900 text-xs font-medium pl-1">
              <li className="flex items-start gap-2">
                <span className="font-bold text-rose-700 shrink-0">a)</span>
                <span>Reproduce, copy, photocopy, resell, sublicense, or redistribute our materials, whether for free or for profit, without prior written permission.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-rose-700 shrink-0">b)</span>
                <span>Share your account credentials or share purchased digital files with third parties, including colleagues, WhatsApp groups, Telegram channels, or other schools.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-rose-700 shrink-0">c)</span>
                <span>Upload, publish, or distribute our content on any other website, social media platform, or application.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-rose-700 shrink-0">d)</span>
                <span>Attempt to reverse-engineer, decompile, hack, or bypass the security features of the App.</span>
              </li>
            </ul>
          </div>
          <p className="text-rose-700 font-bold pl-7 text-[11px]">
            Violation may result in immediate termination of your account without refund and may attract legal action and claims for damages.
          </p>
        </section>

        {/* Section 7 */}
        <section className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/70 space-y-2">
          <div className="flex items-center gap-2 text-slate-900 font-black uppercase text-xs tracking-wider">
            <span className="w-5 h-5 rounded-md bg-[#00A86B] text-white flex items-center justify-center text-[10px] shrink-0">7</span>
            <h4>7. PAYMENTS, PRICING AND REFUNDS</h4>
          </div>
          <div className="pl-7 space-y-1.5 text-slate-600 font-medium">
            <p>
              All prices are quoted in Zambian Kwacha (ZMW) and are payable through our approved payment partners including MTN Mobile Money, Airtel Money, and Zamtel Kwacha through <strong>Lipila LTD</strong>. Access to paid materials is granted only after full payment is confirmed.
            </p>
            <p className="bg-amber-50 border border-amber-200 text-amber-900 p-2.5 rounded-xl text-[11.5px]">
              Due to the nature of digital products, all sales are final and non-refundable once a file has been accessed, downloaded, or viewed, except where required by law or where we are unable to deliver the product due to a proven technical fault on our end.
            </p>
          </div>
        </section>

        {/* Section 8 */}
        <section className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/70 space-y-2">
          <div className="flex items-center gap-2 text-slate-900 font-black uppercase text-xs tracking-wider">
            <span className="w-5 h-5 rounded-md bg-[#00A86B] text-white flex items-center justify-center text-[10px] shrink-0">8</span>
            <h4>8. USER CONDUCT AND CONTENT ACCURACY</h4>
          </div>
          <p className="text-slate-600 pl-7 font-medium">
            While we make every effort to ensure our materials are accurate and aligned with the Zambian curriculum, we do not warrant that they are error-free. The final professional discretion for classroom delivery remains with you, the teacher.
          </p>
        </section>

        {/* Section 9 */}
        <section className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/70 space-y-2">
          <div className="flex items-center gap-2 text-slate-900 font-black uppercase text-xs tracking-wider">
            <span className="w-5 h-5 rounded-md bg-[#00A86B] text-white flex items-center justify-center text-[10px] shrink-0">9</span>
            <h4>9. DISCLAIMER AND LIMITATION OF LIABILITY</h4>
          </div>
          <p className="text-slate-600 pl-7 font-medium">
            The App and its content are provided on an &quot;as is&quot; and &quot;as available&quot; basis. To the fullest extent permitted by law, Fortunes Edutech disclaims all warranties, express or implied. Our total liability shall not exceed the total amount you paid for the specific product in dispute.
          </p>
        </section>

        {/* Section 10 */}
        <section className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/70 space-y-2">
          <div className="flex items-center gap-2 text-slate-900 font-black uppercase text-xs tracking-wider">
            <span className="w-5 h-5 rounded-md bg-[#00A86B] text-white flex items-center justify-center text-[10px] shrink-0">10</span>
            <h4>10. TERMINATION</h4>
          </div>
          <p className="text-slate-600 pl-7 font-medium">
            We may suspend or terminate your account and access to the App immediately if we reasonably believe you have violated these Terms, engaged in fraudulent activity, or infringed our intellectual property rights.
          </p>
        </section>

        {/* Section 11 */}
        <section className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/70 space-y-2">
          <div className="flex items-center gap-2 text-slate-900 font-black uppercase text-xs tracking-wider">
            <span className="w-5 h-5 rounded-md bg-[#00A86B] text-white flex items-center justify-center text-[10px] shrink-0">11</span>
            <h4>11. GOVERNING LAW AND DISPUTES</h4>
          </div>
          <p className="text-slate-600 pl-7 font-medium">
            These Terms shall be governed by and construed in accordance with the Laws of the Republic of Zambia. Any dispute shall first be resolved amicably through mediation, failing which it shall be submitted to the competent courts of Zambia in Kitwe/Ndola.
          </p>
        </section>

        {/* Section 12 */}
        <section className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/70 space-y-2">
          <div className="flex items-center gap-2 text-slate-900 font-black uppercase text-xs tracking-wider">
            <span className="w-5 h-5 rounded-md bg-[#00A86B] text-white flex items-center justify-center text-[10px] shrink-0">12</span>
            <h4>12. CHANGES TO THESE TERMS</h4>
          </div>
          <p className="text-slate-600 pl-7 font-medium">
            We may update these Terms from time to time. We will notify you of any material changes by updating the &quot;Last Updated&quot; date and through an in-App notice.
          </p>
        </section>

      </div>

      {/* PART B HEADER */}
      <div className="pt-4">
        <div className="bg-emerald-900 text-white px-4 py-3 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-[#00A86B]" />
            <h3 className="font-black uppercase tracking-wider text-xs sm:text-sm text-white">
              PART B - PRIVACY POLICY
            </h3>
          </div>
          <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest bg-emerald-950/80 px-2.5 py-1 rounded-lg">
            Sections 13 - 23
          </span>
        </div>
      </div>

      {/* PART B SECTIONS (13 to 23) */}
      <div className="space-y-4 text-xs text-slate-700 leading-relaxed font-normal">

        {/* Section 13 */}
        <section className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/70 space-y-2">
          <div className="flex items-center gap-2 text-slate-900 font-black uppercase text-xs tracking-wider">
            <span className="w-5 h-5 rounded-md bg-emerald-700 text-white flex items-center justify-center text-[10px] shrink-0">13</span>
            <h4>13. INTRODUCTION</h4>
          </div>
          <div className="pl-7 space-y-1.5 text-slate-600 font-medium">
            <p>
              At Fortunes Edutech, we respect your privacy and are committed to protecting your personal data in accordance with the <strong>Data Protection Act No. 3 of 2021 of Zambia</strong>.
            </p>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-950 font-semibold space-y-1 text-[11.5px]">
              <p><strong>Fortunes Edutech is the Data Controller.</strong></p>
              <p>Email: <a href="mailto:fortunesedutech@gmail.com" className="underline text-emerald-800 font-mono">fortunesedutech@gmail.com</a> | Phone: <a href="tel:+260961622222" className="underline text-emerald-800 font-mono">+260961622222</a></p>
            </div>
          </div>
        </section>

        {/* Section 14 */}
        <section className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/70 space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-black uppercase text-xs tracking-wider">
            <span className="w-5 h-5 rounded-md bg-emerald-700 text-white flex items-center justify-center text-[10px] shrink-0">14</span>
            <h4>14. INFORMATION WE COLLECT</h4>
          </div>
          <div className="pl-7 space-y-2 text-slate-600 font-medium">
            <div>
              <p className="font-bold text-slate-900">a) Information you provide:</p>
              <p>Full Name, Phone Number, Email Address, School Name and District (optional), Teaching Level, Password (encrypted).</p>
            </div>
            <div>
              <p className="font-bold text-slate-900">b) Information collected automatically:</p>
              <p>Device model, Android version, App usage data, Log data and crash reports, IP Address and general location (district level).</p>
            </div>
            <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3 text-blue-950 space-y-1 text-[11.5px]">
              <p className="font-bold text-blue-900">c) Payment Information:</p>
              <p>We <strong>DO NOT</strong> store your Mobile Money PIN or wallet balance. All payments are processed securely through <strong>Lipila LTD</strong>. Lipila only shares Transaction ID, amount, phone number used, and payment status.</p>
            </div>
            <p className="text-emerald-900 font-bold text-[11px] pt-1">
              We do not collect sensitive data like NRC, religion, or biometrics.
            </p>
          </div>
        </section>

        {/* Section 15 */}
        <section className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/70 space-y-2">
          <div className="flex items-center gap-2 text-slate-900 font-black uppercase text-xs tracking-wider">
            <span className="w-5 h-5 rounded-md bg-emerald-700 text-white flex items-center justify-center text-[10px] shrink-0">15</span>
            <h4>15. HOW AND WHY WE USE YOUR INFORMATION</h4>
          </div>
          <div className="pl-7 space-y-1.5 text-slate-600 font-medium">
            <p>
              We use your information to create and manage your account, grant access to paid materials, process payments, send curriculum updates, provide customer support, improve our App, prevent fraud and piracy, and comply with Zambian law.
            </p>
            <p className="font-bold text-slate-800 text-[11px]">
              Legal Basis: Performance of contract, Legitimate interest, Legal obligation, and your Consent.
            </p>
          </div>
        </section>

        {/* Section 16 */}
        <section className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/70 space-y-2">
          <div className="flex items-center gap-2 text-slate-900 font-black uppercase text-xs tracking-wider">
            <span className="w-5 h-5 rounded-md bg-emerald-700 text-white flex items-center justify-center text-[10px] shrink-0">16</span>
            <h4>16. SHARING OF INFORMATION</h4>
          </div>
          <div className="pl-7 space-y-1.5 text-slate-600 font-medium">
            <p className="font-bold text-slate-900">We DO NOT sell your data. We only share with:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-700">
              <li><strong>Lipila LTD</strong> for payment processing</li>
              <li><strong>Google Services</strong> (Firebase Analytics &amp; Crashlytics) for app performance</li>
              <li><strong>Regulatory Authorities</strong> (PACRA, ZICTA, Data Protection Commission) when required by law.</li>
            </ul>
          </div>
        </section>

        {/* Section 17 */}
        <section className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/70 space-y-2">
          <div className="flex items-center gap-2 text-slate-900 font-black uppercase text-xs tracking-wider">
            <span className="w-5 h-5 rounded-md bg-emerald-700 text-white flex items-center justify-center text-[10px] shrink-0">17</span>
            <h4>17. DATA SECURITY</h4>
          </div>
          <p className="text-slate-600 pl-7 font-medium">
            We use encrypted password storage, secure HTTPS, restricted access, and secure cloud hosting. You are responsible for keeping your password confidential.
          </p>
        </section>

        {/* Section 18 */}
        <section className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/70 space-y-2">
          <div className="flex items-center gap-2 text-slate-900 font-black uppercase text-xs tracking-wider">
            <span className="w-5 h-5 rounded-md bg-emerald-700 text-white flex items-center justify-center text-[10px] shrink-0">18</span>
            <h4>18. DATA RETENTION</h4>
          </div>
          <p className="text-slate-600 pl-7 font-medium">
            We keep your data as long as your account is active. If you delete your account, we delete your data within 90 days, except payment records which we keep for 6 years for tax compliance.
          </p>
        </section>

        {/* Section 19 */}
        <section className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/70 space-y-2">
          <div className="flex items-center gap-2 text-slate-900 font-black uppercase text-xs tracking-wider">
            <span className="w-5 h-5 rounded-md bg-emerald-700 text-white flex items-center justify-center text-[10px] shrink-0">19</span>
            <h4>19. YOUR RIGHTS UNDER DATA PROTECTION ACT NO. 3 OF 2021</h4>
          </div>
          <div className="pl-7 space-y-1.5 text-slate-600 font-medium">
            <p>
              You have the right to be informed, to access your data, to correct inaccurate data, to request deletion, to object to marketing, to withdraw consent, and to lodge a complaint with the Data Protection Commissioner.
            </p>
            <p className="font-bold text-[#00A86B] text-[11px]">
              Contact us at <a href="mailto:fortunesedutech@gmail.com" className="underline font-mono">fortunesedutech@gmail.com</a> - we will respond within 21 days.
            </p>
          </div>
        </section>

        {/* Section 20 */}
        <section className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/70 space-y-2">
          <div className="flex items-center gap-2 text-slate-900 font-black uppercase text-xs tracking-wider">
            <span className="w-5 h-5 rounded-md bg-emerald-700 text-white flex items-center justify-center text-[10px] shrink-0">20</span>
            <h4>20. CHILDREN&apos;S PRIVACY</h4>
          </div>
          <p className="text-slate-600 pl-7 font-medium">
            Our App is for users aged 18+. We do not knowingly collect data from children under 18.
          </p>
        </section>

        {/* Section 21 */}
        <section className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/70 space-y-2">
          <div className="flex items-center gap-2 text-slate-900 font-black uppercase text-xs tracking-wider">
            <span className="w-5 h-5 rounded-md bg-emerald-700 text-white flex items-center justify-center text-[10px] shrink-0">21</span>
            <h4>21. DATA TRANSFER OUTSIDE ZAMBIA</h4>
          </div>
          <p className="text-slate-600 pl-7 font-medium">
            Your data is primarily stored in Zambia and secure cloud servers. Where transferred outside Zambia (e.g., Google servers), we ensure adequate protection.
          </p>
        </section>

        {/* Section 22 */}
        <section className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/70 space-y-2">
          <div className="flex items-center gap-2 text-slate-900 font-black uppercase text-xs tracking-wider">
            <span className="w-5 h-5 rounded-md bg-emerald-700 text-white flex items-center justify-center text-[10px] shrink-0">22</span>
            <h4>22. CHANGES TO THIS PRIVACY POLICY</h4>
          </div>
          <p className="text-slate-600 pl-7 font-medium">
            We may update this Policy. We will notify you via the &quot;Last Updated&quot; date and in-App notice.
          </p>
        </section>

        {/* Section 23 */}
        <section className="bg-emerald-50/90 border border-emerald-200/90 p-4 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-emerald-950 font-black uppercase text-xs tracking-wider">
            <span className="w-5 h-5 rounded-md bg-[#00A86B] text-white flex items-center justify-center text-[10px] shrink-0">23</span>
            <h4>23. CONTACT US</h4>
          </div>
          <div className="pl-7 space-y-2 text-xs font-medium text-emerald-950">
            <p className="font-bold text-slate-900 text-sm">Fortunes Edutech</p>
            <p className="flex items-center gap-2 font-mono text-slate-800">
              <Mail size={14} className="text-[#00A86B]" />
              <span>Email: <a href="mailto:fortunesedutech@gmail.com" className="underline font-bold text-emerald-800">fortunesedutech@gmail.com</a></span>
            </p>
            <p className="flex items-center gap-2 font-mono text-slate-800">
              <PhoneCall size={14} className="text-[#00A86B]" />
              <span>Phone: <a href="tel:+260961622222" className="underline font-bold text-emerald-800">+260961622222</a></span>
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <a
                href="https://wa.me/260961622222"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#25D366] hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-xs transition-all cursor-pointer"
              >
                <span>WhatsApp +260961622222</span>
              </a>
              <a
                href="mailto:fortunesedutech@gmail.com"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-xs transition-all cursor-pointer"
              >
                <Mail size={13} />
                <span>Send Email</span>
              </a>
            </div>
          </div>
        </section>

      </div>

      {/* Confirmation Affirmation */}
      <div className="bg-slate-900 text-white rounded-2xl p-4.5 text-center shadow-md space-y-1">
        <p className="text-xs font-bold text-slate-100">
          By tapping &quot;I Agree&quot;, you acknowledge that you have read, understood, and agree to be bound by BOTH Part A (Terms) and Part B (Privacy Policy).
        </p>
        <p className="text-[10px] font-medium text-emerald-400 uppercase tracking-widest pt-0.5">
          Fortunes Edutech • Plan Competently
        </p>
      </div>
    </div>
  );
};
