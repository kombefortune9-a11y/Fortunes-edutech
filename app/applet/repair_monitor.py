import re

with open('src/components/UserMonitor.tsx', 'r') as f:
    content = f.read()

# Let's find lines 280-305
pattern = r'\{\/\* Chips Grid \*\/\}.*?className="fixed inset-0 bg-slate-900\/65 backdrop-blur-md z-\[9999\]'

replacement = '''{/* Chips Grid */}
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 gap-2 max-h-[180px] overflow-y-auto p-1 custom-scrollbar">
              {filteredGrades.map((g) => {
                const isSelected = selectedList.includes(g);
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => toggleGrade(g)}
                    className={cn(
                      "px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer flex items-center justify-between gap-1",
                      isSelected
                        ? (isEmerald ? "bg-emerald-600 text-white border-emerald-600 shadow-xs" : "bg-blue-600 text-white border-blue-600 shadow-xs")
                        : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    <span>{g}</span>
                    {isSelected && <Check size={10} />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function UserMonitor({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.email === 'kombefortune9@gmail.com' || isDeveloperOverride(currentUser?.email);
  const isDev = isAdmin;

  const [rawUsers, setRawUsers] = useState<UserProfile[]>(() => {
    try {
      const userMap = new Map<string, UserProfile>();
      ['eduplan_all_seen_users_permanent', 'eduplan_monitor_raw_users', 'eduplan_trial_login_history'].forEach(key => {
        try {
          const raw = safeLocalStorage.getItem(key);
          if (raw) {
            const list = JSON.parse(raw);
            if (Array.isArray(list)) {
              list.forEach(u => {
                if (u && u.email) {
                  const cleanEmail = u.email.toLowerCase().trim().replace(/\\s+/g, '');
                  if (cleanEmail && !userMap.has(cleanEmail)) {
                    userMap.set(cleanEmail, {
                      uid: u.uid || `user_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
                      displayName: u.displayName || 'Trial Teacher (Guest)',
                      email: cleanEmail,
                      photoURL: u.photoURL || '',
                      lastLogin: u.lastLogin || u.timestamp || u.firstAccess || null,
                      lastHeartbeat: u.lastHeartbeat || u.lastLogin || u.timestamp || null,
                      isOnline: false,
                      isWhitelisted: u.isWhitelisted || false,
                      userType: u.userType || 'guest',
                      teaching_grade: u.teaching_grade || u.teachingGrade || 'Trial Access',
                      subscriptionType: u.subscriptionType || 'guest_trial',
                      addedAt: u.addedAt || u.timestamp || u.firstAccess || null,
                      status: u.status || 'active'
                    });
                  }
                }
              });
            }
          }
        } catch {}
      });
      return Array.from(userMap.values());
    } catch {
      return [];
    }
  });

  const [isRefreshing, setIsRefreshing] = useState(true);
  const [isCleaning, setIsCleaning] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [historyUser, setHistoryUser] = useState<any>(null);
  const [userHistory, setUserHistory] = useState<Record<string, any>>({});
  const [loadingHistory, setLoadingHistory] = useState<Record<string, boolean>>({});

  const [activeTab, setActiveTab] = useState<'traffic' | 'trial' | 'tracker' | 'activity' | 'feedback'>('traffic');

  const [feedbackList, setFeedbackList] = useState<any[]>(() => {
    try {
      const raw = safeLocalStorage.getItem('eduplan_monitor_feedback');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  const fetchFeedback = async () => {
    setFeedbackLoading(true);
    try {
      const q = query(collection(db, 'document_feedback'), orderBy('timestamp', 'desc'), limit(100));
      const snap = await getDocs(q);
      const list: any[] = [];
      snap.forEach(d => {
        list.push({ id: d.id, ...d.data() });
      });
      setFeedbackList(list);
      try {
        safeLocalStorage.setItem('eduplan_monitor_feedback', JSON.stringify(list));
      } catch {}
    } catch (e: any) {
      console.warn('Document feedback fetch notice:', e);
      try {
        const raw = safeLocalStorage.getItem('eduplan_monitor_feedback');
        if (raw) setFeedbackList(JSON.parse(raw));
      } catch {}
    } finally {
      setFeedbackLoading(false);
    }
  };

  const [whitelist, setWhitelist] = useState<any[]>(() => {
    try {
      const raw = safeLocalStorage.getItem('eduplan_monitor_whitelist');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [whitelistLoading, setWhitelistLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Add Guest Form State
  const [newGuestEmail, setNewGuestEmail] = useState('');
  const [newGuestGrade, setNewGuestGrade] = useState('all');
  const [newGuestSub, setNewGuestSub] = useState('monthly');
  const [newGuestSubIndex, setNewGuestSubIndex] = useState('1');
  const [newGuestPaymentMethod, setNewGuestPaymentMethod] = useState('MTN Mobile Money');
  const [newGuestAmount, setNewGuestAmount] = useState('90');
  const [newGuestStartDate, setNewGuestStartDate] = useState('');
  const [isAddingGuest, setIsAddingGuest] = useState(false);

  // Edit / Action States
  const [editingGuest, setEditingGuest] = useState<any>(null);
  const [isUpdatingGrade, setIsUpdatingGrade] = useState(false);
  const [pendingDeleteGuest, setPendingDeleteGuest] = useState<any>(null);

  // Activation Modal States
  const [activatingUser, setActivatingUser] = useState<any>(null);
  const [activationSub, setActivationSub] = useState('monthly');
  const [activationGrade, setActivationGrade] = useState('all');
  const [activationAmount, setActivationAmount] = useState('90');
  const [activationPaymentMethod, setActivationPaymentMethod] = useState('MTN Mobile Money');
  const [activationDate, setActivationDate] = useState(new Date().toISOString().split('T')[0]);
  const [activationSubIndex, setActivationSubIndex] = useState('1');
  const [isActivating, setIsActivating] = useState(false);
  const [isResettingTrials, setIsResettingTrials] = useState(false);

  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    let price = 90;
    if (newGuestSub === '14days') price = 40;
    else if (newGuestSub === 'monthly') price = 90;
    else if (newGuestSub === 'termly') price = 250;
    else if (newGuestSub === 'yearly') price = 750;
    else if (newGuestSub === 'unlimited') price = 1500;
    setNewGuestAmount(price.toString());
  }, [newGuestSub]);

  useEffect(() => {
    let price = 90;
    if (activationSub === '14days') price = 40;
    else if (activationSub === 'monthly') price = 90;
    else if (activationSub === 'termly') price = 250;
    else if (activationSub === 'yearly') price = 750;
    else if (activationSub === 'unlimited') price = 1500;
    setActivationAmount(price.toString());
  }, [activationSub]);

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const getUserSubscriptionInfo = (user: any) => {
    const cleanEmail = (user?.email || '').toLowerCase().trim().replace(/\\s+/g, '');
    const isDevUser = isDeveloperOverride(cleanEmail);
    if (!(isDevUser || (user.isWhitelisted && user.subscriptionType !== 'guest_trial')) && !isDevUser) {
      return {
        subType: 'guest_trial',
        circleLabel: 'Free Trial Access (4 Documents)',
        cost: 'Free Trial (K0)',
        subBadgeClass: 'text-amber-800 bg-amber-50 border-amber-200',
        startDate: null,
        endDate: null,
        isExpired: false,
        remainingText: 'Trial Access (1 Scheme / 1 Forecast / 2 Lessons)'
      };
    }

    const subType = isDevUser ? 'unlimited' : (user.subscriptionType && user.subscriptionType in SUBSCRIPTION_PACKAGES ? user.subscriptionType : 'monthly');
    const startMs = safeToMillis(user.subscriptionStart || user.addedAt || (isDevUser ? new Date(2025, 0, 1) : null));
    let durationMs = 30 * 24 * 60 * 60 * 1000;
    let circleLabel = 'Monthly Circle (30 Days)';
    let cost = 'K90';
    let subBadgeClass = 'text-purple-700 bg-purple-50 border-purple-200';

    if (subType === 'weekly') { durationMs = 7 * 24 * 60 * 60 * 1000; circleLabel = 'Weekly Circle (7 Days)'; cost = 'K20'; subBadgeClass = 'text-amber-700 bg-amber-50 border-amber-200'; }
    else if (subType === '14days') { durationMs = 14 * 24 * 60 * 60 * 1000; circleLabel = '14 Days Circle (14 Days)'; cost = 'K40'; subBadgeClass = 'text-cyan-700 bg-cyan-50 border-cyan-200'; }
    else if (subType === 'monthly') { durationMs = 30 * 24 * 60 * 60 * 1000; circleLabel = 'Monthly Circle (30 Days)'; cost = 'K90'; subBadgeClass = 'text-purple-700 bg-purple-50 border-purple-200'; }
    else if (subType === 'termly') { durationMs = 90 * 24 * 60 * 60 * 1000; circleLabel = 'Termly Circle (90 Days)'; cost = 'K250'; subBadgeClass = 'text-indigo-700 bg-indigo-50 border-indigo-200'; }
    else if (subType === 'yearly') { durationMs = 365 * 24 * 60 * 60 * 1000; circleLabel = 'Yearly Circle (365 Days)'; cost = 'K750'; subBadgeClass = 'text-blue-800 bg-blue-50 border-blue-200'; }
    else if (subType === 'unlimited') { durationMs = 10 * 365 * 24 * 60 * 60 * 1000; circleLabel = 'Unlimited Access (Lifetime)'; cost = 'Lifetime'; subBadgeClass = 'text-emerald-700 bg-emerald-50 border-emerald-200'; }

    const startDate = startMs > 0 ? new Date(startMs) : null;
    const endDate = isDevUser || subType === 'unlimited' ? null : (startDate ? new Date(startDate.getTime() + durationMs) : null);
    const isExpired = isDevUser || subType === 'unlimited' ? false : (endDate ? now > endDate.getTime() : false);

    let remainingText = '';
    if (isDevUser || subType === 'unlimited') remainingText = 'Lifetime Active';
    else if (endDate) {
      const diff = endDate.getTime() - now;
      if (diff <= 0) remainingText = 'Expired';
      else {
        const days = Math.floor(diff / 86400000);
        const hours = Math.floor((diff % 86400000) / 3600000);
        remainingText = days > 0 ? `${days}d ${hours}h left` : `${hours}h left`;
      }
    }

    return { subType, circleLabel, cost, subBadgeClass, startDate, endDate, isExpired, remainingText };
  };

  const allAvailableGrades = useMemo(() => [...new Set([...PRIMARY_GRADES, ...SECONDARY_GRADES])], []);

  const isUserOnline = (user: any) => {
    if (!user.lastHeartbeat) return false;
    const ms = safeToMillis(user.lastHeartbeat);
    return ms > 0 && (now - ms < 150000);
  };

  const formatRealityTime = (dateObj: any, fallback = 'Pending First Login') => {
    const d = safeToDate(dateObj);
    return d ? d.toLocaleString([], { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : fallback;
  };

  const getSessionDuration = (login: any, heartbeat: any) => {
    const start = safeToMillis(login);
    const end = safeToMillis(heartbeat);
    if (!start || !end || end <= start) return null;
    const diffMs = end - start;
    const mins = Math.floor(diffMs / 60000);
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (hrs > 0) return `${hrs}h ${remMins}m`;
    if (mins > 0) return `${mins}m`;
    return '1m';
  };

  const fetchWhitelist = async () => {
    if (!auth.currentUser) return;
    setWhitelistLoading(true);
    try {
      const q = query(collection(db, 'authorized_guests'), orderBy('addedAt', 'desc'));
      const snap = await getDocs(q);
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setWhitelist(list);
      try {
        safeLocalStorage.setItem('eduplan_monitor_whitelist', JSON.stringify(list));
      } catch {}
    } catch (e: any) {
      console.warn('Fetch whitelist notice:', e);
      try {
        const raw = safeLocalStorage.getItem('eduplan_monitor_whitelist');
        setWhitelist(raw ? JSON.parse(raw) : []);
      } catch {}
    } finally {
      setWhitelistLoading(false);
    }
  };

  const fetchUsers = async () => {
    setIsRefreshing(true);
    try {
      const q = query(collection(db, 'users'), orderBy('lastLogin', 'desc'), limit(300));
      const snap = await getDocs(q);
      const userMap = new Map<string, UserProfile>();
      snap.forEach(d => {
        const data = d.data();
        if (data && data.email) {
          const cleanEmail = data.email.toLowerCase().trim().replace(/\\s+/g, '');
          userMap.set(cleanEmail, {
            uid: d.id,
            displayName: data.displayName || 'Teacher',
            email: cleanEmail,
            photoURL: data.photoURL || '',
            lastLogin: data.lastLogin || data.timestamp || null,
            lastHeartbeat: data.lastHeartbeat || data.lastLogin || null,
            isOnline: false,
            isWhitelisted: data.isWhitelisted || data.is_whitelisted || false,
            userType: data.userType || 'guest',
            teaching_grade: data.teaching_grade || data.teachingGrade || 'Trial Access',
            subscriptionType: data.subscriptionType || 'guest_trial',
            addedAt: data.addedAt || data.subscriptionStart || null,
            status: data.status || 'active'
          });
        }
      });
      setRawUsers(Array.from(userMap.values()));
    } catch (e: any) {
      console.warn('Fetch users notice:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    fetchUsers();
    fetchWhitelist();
    fetchFeedback();
  }, [isOpen]);

  const approvedUsers = useMemo(() => {
    return whitelist.map(w => {
      const cleanEmail = (w.email || w.id || '').toLowerCase().trim().replace(/\\s+/g, '');
      const liveUser = rawUsers.find(u => u.email === cleanEmail);
      return {
        uid: liveUser?.uid || w.id || `whitelisted_${cleanEmail}`,
        email: cleanEmail,
        displayName: liveUser?.displayName || w.displayName || cleanEmail.split('@')[0],
        photoURL: liveUser?.photoURL || '',
        isWhitelisted: true,
        userType: 'registered',
        teaching_grade: w.grade || w.teaching_grade || 'all',
        subscriptionType: w.subscriptionType || 'monthly',
        subscriptionStart: w.subscriptionStart || w.addedAt || null,
        addedAt: w.addedAt || null,
        amountPaid: w.amountPaid || 90,
        paymentMethod: w.paymentMethod || 'MTN Mobile Money',
        subscriptionIndex: w.subscriptionIndex || 1,
        lastLogin: liveUser?.lastLogin || w.lastLogin || w.addedAt || null,
        lastHeartbeat: liveUser?.lastHeartbeat || w.lastHeartbeat || null,
        status: w.status || 'active'
      };
    });
  }, [whitelist, rawUsers]);

  const trialUsers = useMemo(() => {
    return rawUsers.filter(u => {
      const cleanEmail = u.email.toLowerCase().trim().replace(/\\s+/g, '');
      const isApproved = whitelist.some(w => (w.email || w.id || '').toLowerCase().trim().replace(/\\s+/g, '') === cleanEmail);
      return !isApproved;
    });
  }, [rawUsers, whitelist]);

  const openActivationModal = (user: any) => {
    setActivatingUser(user);
    setActivationGrade(user.teaching_grade || user.grade || 'all');
    setActivationSub('monthly');
    setActivationAmount('90');
    setActivationPaymentMethod('MTN Mobile Money');
    setActivationDate(new Date().toISOString().split('T')[0]);
    setActivationSubIndex('1');
  };

  const handleActivateUser = async (user: any) => {
    if (!user || !user.email) return;
    const cleanEmail = user.email.toLowerCase().trim().replace(/\\s+/g, '');
    setIsActivating(true);
    try {
      const pkg = SUBSCRIPTION_PACKAGES[activationSub] || SUBSCRIPTION_PACKAGES.monthly;
      const amt = Number(activationAmount) || pkg.price;
      const guestData = {
        id: cleanEmail,
        email: cleanEmail,
        displayName: user.displayName || 'Approved Teacher',
        grade: activationGrade || 'all',
        subscriptionType: activationSub,
        amountPaid: amt,
        paymentMethod: activationPaymentMethod,
        subscriptionIndex: Number(activationSubIndex) || 1,
        status: 'active',
        isWhitelisted: true,
        is_whitelisted: true,
        isTrialMode: false,
        subscriptionStart: new Date(activationDate),
        addedAt: new Date(),
        addedBy: currentUser?.email || 'kombefortune9@gmail.com'
      };

      await setDoc(doc(db, 'authorized_guests', cleanEmail), guestData, { merge: true });
      toast.success(`Activated ${cleanEmail} for ${activationSub} (${activationGrade})`);
      setActivatingUser(null);
      await fetchWhitelist();
      await fetchUsers();
    } catch (e: any) {
      toast.error(`Activation failed: ${e.message}`);
    } finally {
      setIsActivating(false);
    }
  };

  const handleToggleGuestStatus = async (guest: any) => {
    if (!guest || !guest.email) return;
    const cleanEmail = guest.email.toLowerCase().trim().replace(/\\s+/g, '');
    const newStatus = guest.status === 'active' ? 'suspended' : 'active';
    try {
      await setDoc(doc(db, 'authorized_guests', cleanEmail), { status: newStatus }, { merge: true });
      toast.success(`Updated status to ${newStatus}`);
      fetchWhitelist();
    } catch (e: any) {
      toast.error(`Failed to update status: ${e.message}`);
    }
  };

  const handleDeleteGuest = async (email: string, removeSessions: boolean) => {
    if (!email) return;
    const cleanEmail = email.toLowerCase().trim().replace(/\\s+/g, '');
    try {
      await deleteDoc(doc(db, 'authorized_guests', cleanEmail));
      if (removeSessions) {
        const userDocRef = doc(db, 'users', `guest_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`);
        await deleteDoc(userDocRef);
      }
      toast.success("Guest removed from whitelist");
      setPendingDeleteGuest(null);
      fetchWhitelist();
      fetchUsers();
    } catch (e: any) {
      toast.error(`Failed to delete guest: ${e.message}`);
    }
  };

  const handleUpdateGrade = async (guest: any) => {
    if (!guest || !guest.email) return;
    setIsUpdatingGrade(true);
    try {
      await setDoc(doc(db, 'authorized_guests', guest.email), { grade: guest.grade }, { merge: true });
      toast.success("Grade updated");
      setEditingGuest(null);
      fetchWhitelist();
    } catch (e: any) {
      toast.error(`Failed to update grade: ${e.message}`);
    } finally {
      setIsUpdatingGrade(false);
    }
  };

  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuestEmail) return;
    const cleanEmail = newGuestEmail.toLowerCase().trim().replace(/\\s+/g, '');
    setIsAddingGuest(true);
    try {
      const pkg = SUBSCRIPTION_PACKAGES[newGuestSub] || SUBSCRIPTION_PACKAGES.monthly;
      const amt = Number(newGuestAmount) || pkg.price;
      const guestData = {
        id: cleanEmail,
        email: cleanEmail,
        grade: newGuestGrade || 'all',
        subscriptionType: newGuestSub,
        subscriptionStart: new Date(),
        addedAt: new Date(),
        addedBy: currentUser?.email || 'kombefortune9@gmail.com',
        status: 'active',
        amountPaid: amt,
        paymentMethod: newGuestPaymentMethod,
        subscriptionIndex: Number(newGuestSubIndex) || 1,
        is_whitelisted: true,
        isWhitelisted: true
      };
      await setDoc(doc(db, 'authorized_guests', cleanEmail), guestData);
      toast.success(`Added ${cleanEmail} to whitelist`);
      setNewGuestEmail('');
      fetchWhitelist();
    } catch (e: any) {
      toast.error(`Failed to add guest: ${e.message}`);
    } finally {
      setIsAddingGuest(false);
    }
  };

  const cleanupInactiveUsers = async () => {
    setIsCleaning(true);
    try {
      toast.info("Cleaning up inactive users...");
      await fetchUsers();
      toast.success("Cleanup completed");
    } catch (e: any) {
      toast.error(`Cleanup error: ${e.message}`);
    } finally {
      setIsCleaning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 bg-slate-900/65 backdrop-blur-md z-[9999] overflow-y-auto flex justify-center items-start sm:items-center p-4 sm:p-8"'''

# Perform re search and replace
new_content, count = re.subn(pattern, replacement, content, flags=re.DOTALL)
print(f'Replaced {count} occurrences.')

# Fix ending div/motion.div on line 1872
ending_old = '''            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}'''

ending_new = '''            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}'''

new_content = new_content.replace(ending_old, ending_new)

with open('src/components/UserMonitor.tsx', 'w') as f:
    f.write(new_content)

print('Saved file successfully!')
