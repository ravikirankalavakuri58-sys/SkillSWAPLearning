// --- APPLICATION STATE ---
let freeSkillUnlocked = false;
let examActive = false;
let integrityScore = 100;
let authMode = 'signup';

// --- REAL CALENDAR-DATE CONTINUOUS STREAK ENGINE ---
// - Uses real calendar dates (YYYY-MM-DD).
// - Logging in on the exact current calendar date awards the streak for that date.
// - If the user misses even ONE calendar day (gap > 1 day between logins), the streak immediately resets to 0/1!
const STREAK_STORAGE_KEY = 'skillswap_continuous_streak_v1';

function getLocalDateKey(dateObj = new Date()) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getYesterdayDateKey(todayObj = new Date()) {
  const yest = new Date(todayObj);
  yest.setDate(todayObj.getDate() - 1);
  return getLocalDateKey(yest);
}

function formatReadableDate(dateKey) {
  if (!dateKey) return 'Not Logged In';
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

let streakState = {
  streakCount: 0,
  lastLoginDate: null,
  loggedDates: [],
  wasBrokenRecently: false,
  missedDaysCount: 0
};

function loadAndEvaluateStreakOnLogin(autoRecordToday = true) {
  const todayKey = getLocalDateKey(new Date());
  const yesterdayKey = getYesterdayDateKey(new Date());

  try {
    const saved = JSON.parse(localStorage.getItem(STREAK_STORAGE_KEY) || 'null');
    if (saved && saved.lastLoginDate) {
      streakState = saved;
    }
  } catch (e) {}

  if (streakState.lastLoginDate === todayKey) {
    streakState.wasBrokenRecently = false;
    streakState.missedDaysCount = 0;
  } else if (streakState.lastLoginDate === yesterdayKey) {
    streakState.wasBrokenRecently = false;
    streakState.missedDaysCount = 0;
    if (autoRecordToday) {
      streakState.streakCount += 1;
      streakState.lastLoginDate = todayKey;
      if (!streakState.loggedDates.includes(todayKey)) {
        streakState.loggedDates.push(todayKey);
      }
    }
  } else if (streakState.lastLoginDate !== null) {
    const [ly, lm, ld] = streakState.lastLoginDate.split('-').map(Number);
    const [ty, tm, td] = todayKey.split('-').map(Number);
    const diffDays = Math.round((new Date(ty, tm - 1, td) - new Date(ly, lm - 1, ld)) / (1000 * 60 * 60 * 24));
    streakState.wasBrokenRecently = true;
    streakState.missedDaysCount = Math.max(1, diffDays - 1);
    streakState.streakCount = autoRecordToday ? 1 : 0;
    streakState.lastLoginDate = autoRecordToday ? todayKey : null;
    streakState.loggedDates = autoRecordToday ? [todayKey] : [];
  } else {
    streakState.wasBrokenRecently = false;
    streakState.missedDaysCount = 0;
    if (autoRecordToday) {
      streakState.streakCount = 1;
      streakState.lastLoginDate = todayKey;
      streakState.loggedDates = [todayKey];
    }
  }

  saveStreakState();
}

function saveStreakState() {
  try {
    localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(streakState));
  } catch (e) {}
}

// --- SMART WALLET & PERSONHOOD STATE ---
let walletState = {
  connected: false,
  address: null,
  shortAddress: "Not Connected",
  network: "Base L2 (Gasless Paymaster)",
  accountType: "ERC-4337 Smart Wallet (Social Recovery)",
  personhoodVerified: false,
  verifiedIdentityLabel: "Unverified Guest"
};

let liveSessionHeartbeats = 0;
const COINS_PER_HOUR = 39;
const COIN_MULTIPLIER = 50;

let creditCoins = 0;
let totalLiveHoursCompleted = 0;
let partialLiveMinutes = 0;

const RAZORPAY_TEST_KEY = "rzp_test_SkillSwapDemo2026";
let activePaymentOrder = null;
let selectedPaymentMethod = "upi";

// --- LIVE 1-ON-1 TRAINING SESSIONS ---
let activeCourseId = 1;
let liveCallConnected = false;
let micMuted = false;
let camOff = false;
let screenSharing = false;
let selectedSlotDate = getLocalDateKey(new Date());
let selectedSlotTime = "06:00 PM IST";

let enrolledCourses = [
  {
    id: 1,
    title: "Python Automation & Web Scraping",
    category: "Tech & AI",
    mentor: "Aarav S. (AI-Verified Mentor)",
    mentorRole: "Senior Automation Engineer",
    durationMins: 60,
    completedMins: 0,
    sessionCompleted: false,
    scheduledSlot: `${formatReadableDate(getLocalDateKey(new Date()))} • 06:00 PM IST`,
    roomCode: "SS-LIVE-101",
    badgeId: "badge-skill-1",
    badgeTitle: "Python Automation Specialist",
    badgeIcon: "🐍"
  }
];

let paymentLedger = [
  {
    txnId: "pay_SS2026Trial01",
    item: "10-Day Free Trial (Live 1-on-1 Access)",
    method: "Regulated INR Zero-Charge Trial",
    amount: "₹0",
    gasFee: "₹0 (Paymaster)",
    status: "Authorized",
    date: formatReadableDate(getLocalDateKey(new Date()))
  }
];

let userAssets = {
  badges: [
    { id: 'b-early', title: 'Early Pioneer SBT', desc: 'Joined SkillSwap Live 1-on-1 Platform', icon: '🚀', category: 'Milestone SBT', tokenId: 'SBT-#001', zkHash: '0x9a4f...3c1e', unlocked: true },
    { id: 'badge-skill-1', title: 'Python Automation Specialist', desc: 'Complete 100% of Live 1-on-1 Python Training', icon: '🐍', category: 'Skill SBT (ERC-5192)', tokenId: 'SBT-#101', zkHash: '0x7b2d...8f4a', unlocked: false },
    { id: 'badge-skill-2', title: 'Figma Systems Architect', desc: 'Complete 100% of Live 1-on-1 Figma Training', icon: '🎨', category: 'Skill SBT (ERC-5192)', tokenId: 'SBT-#102', zkHash: '0x4e1c...9d0b', unlocked: false },
    { id: 'badge-skill-3', title: 'SQL Data Analyst', desc: 'Complete 100% of Live 1-on-1 SQL Training', icon: '🗄️', category: 'Skill SBT (ERC-5192)', tokenId: 'SBT-#103', zkHash: '0x2f8a...6b7c', unlocked: false },
    { id: 'badge-skill-4', title: 'Fluency Communicator', desc: 'Complete 100% of Live 1-on-1 Spoken English', icon: '🗣️', category: 'Skill SBT (ERC-5192)', tokenId: 'SBT-#104', zkHash: '0x5c3e...1a9f', unlocked: false },
    { id: 'badge-skill-5', title: 'Excel Financial Modeler', desc: 'Complete 100% of Live 1-on-1 Excel Modeling', icon: '📊', category: 'Skill SBT (ERC-5192)', tokenId: 'SBT-#105', zkHash: '0x8d6b...4e2d', unlocked: false },
    { id: 'badge-skill-6', title: 'AI Prompt Engineer', desc: 'Complete 100% of Live 1-on-1 Prompt Engineering', icon: '🤖', category: 'Skill SBT (ERC-5192)', tokenId: 'SBT-#106', zkHash: '0x1a9f...7c3e', unlocked: false },
    { id: 'b-trainer', title: 'AI-Verified Mentor SBT', desc: 'Pass Proctored Live Teacher Certification', icon: '🛡️', category: 'Attestation SBT', tokenId: 'SBT-#201', zkHash: '0x6e4a...2b8f', unlocked: false },
    { id: 'b-streak', title: '30-Day Continuous Streak SBT', desc: 'Log in every single day for 30 days without missing 1 day', icon: '🔥', category: 'Milestone SBT', tokenId: 'SBT-#301', zkHash: '0x3d7c...5a1b', unlocked: false },
    { id: 'b-hoarder', title: 'Live Learner (390+ Coins)', desc: 'Complete 10+ Full Live 1-on-1 Hours (390+ Coins)', icon: '🪙', category: 'Milestone SBT', tokenId: 'SBT-#401', zkHash: '0x9f2e...8d4c', unlocked: false }
  ],
  certificates: [
    {
      id: 'CERT-2026-101',
      type: 'Live 1-on-1 Learner SBT Certificate (ERC-5192)',
      skill: 'Python Automation & Web Scraping',
      holder: 'Aarav Sharma',
      date: formatReadableDate(getLocalDateKey(new Date())),
      zkCommitHash: '0x8f3a91c4d72e50b6a19f48c2d3e7b105a94c6f21',
      status: 'Co-Signed by Live Mentor & Gasless Minted'
    }
  ]
};

const courses = [
  { id: 1, title: "Python Automation & Web Scraping", category: "Tech & AI", mentor: "Aarav S.", mentorRole: "Senior Automation Eng.", rating: "4.9", hours: 1.0, nextSlot: "Today, 6:00 PM", aiPrice: 299, marketAvg: "₹2,499", badgeId: "badge-skill-1", badgeTitle: "Python Automation Specialist", badgeIcon: "🐍" },
  { id: 2, title: "Figma Auto-Layout & Design Systems", category: "Design", mentor: "Ananya M.", mentorRole: "Lead Product Designer", rating: "5.0", hours: 2.0, nextSlot: "Today, 7:30 PM", aiPrice: 249, marketAvg: "₹1,999", badgeId: "badge-skill-2", badgeTitle: "Figma Systems Architect", badgeIcon: "🎨" },
  { id: 3, title: "SQL Queries for Data Analytics", category: "Tech & AI", mentor: "Rohan K.", mentorRole: "Data Architect", rating: "4.8", hours: 2.0, nextSlot: "Tomorrow, 11:00 AM", aiPrice: 349, marketAvg: "₹2,999", badgeId: "badge-skill-3", badgeTitle: "SQL Data Analyst", badgeIcon: "🗄️" },
  { id: 4, title: "Spoken English & Interview Fluency", category: "Language", mentor: "Sneha R.", mentorRole: "Communication Coach", rating: "4.9", hours: 1.0, nextSlot: "Today, 5:00 PM", aiPrice: 199, marketAvg: "₹1,499", badgeId: "badge-skill-4", badgeTitle: "Fluency Communicator", badgeIcon: "🗣️" },
  { id: 5, title: "Financial Modeling in Excel", category: "Business", mentor: "Vikram T.", mentorRole: "IB Valuation Analyst", rating: "4.9", hours: 3.0, nextSlot: "Tomorrow, 4:00 PM", aiPrice: 399, marketAvg: "₹3,499", badgeId: "badge-skill-5", badgeTitle: "Excel Financial Modeler", badgeIcon: "📊" },
  { id: 6, title: "Prompt Engineering for Workflows", category: "Tech & AI", mentor: "Priya N.", mentorRole: "GenAI Specialist", rating: "5.0", hours: 2.0, nextSlot: "Today, 8:30 PM", aiPrice: 249, marketAvg: "₹1,899", badgeId: "badge-skill-6", badgeTitle: "AI Prompt Engineer", badgeIcon: "🤖" }
];

function generatePrivacyHash(seedText) {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < seedText.length; i++) {
    const ch = seedText.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  const part1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const part2 = (h2 >>> 0).toString(16).padStart(8, '0');
  const part3 = Math.abs(h1 ^ h2).toString(16).padStart(8, '0');
  return `0x${part1}${part2}${part3}9c4e`;
}

// --- NAVIGATION ---
function switchView(viewName) {
  if (viewName === 'architecture') viewName = 'marketplace';
  document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
  const targetView = document.getElementById('view-' + viewName);
  if (targetView) targetView.classList.remove('hidden');

  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('nav-active');
    btn.classList.add('text-slate-600');
  });
  const activeNav = document.getElementById('nav-' + viewName);
  if (activeNav) {
    activeNav.classList.add('nav-active');
    activeNav.classList.remove('text-slate-600');
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 6000);
}

// --- SMART WALLET & PROOF-OF-PERSONHOOD ---
async function connectSmartWallet(mode = 'social') {
  if (mode === 'metamask' && typeof window.ethereum !== 'undefined') {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts && accounts.length > 0) {
        walletState.connected = true;
        walletState.address = accounts[0];
        walletState.shortAddress = accounts[0].slice(0, 6) + '...' + accounts[0].slice(-4);
        walletState.accountType = "External EOA + Base L2 Paymaster";
        updateWalletUI();
        showToast(`🔗 Connected MetaMask (${walletState.shortAddress}) with ₹0 Gasless Paymaster!`);
        return;
      }
    } catch (err) {}
  }

  const generatedAddr = "0x71C9" + Math.random().toString(16).substring(2, 10).toUpperCase() + "89A4";
  walletState.connected = true;
  walletState.address = generatedAddr;
  walletState.shortAddress = generatedAddr.slice(0, 6) + '...' + generatedAddr.slice(-4);
  walletState.accountType = "ERC-4337 Smart Wallet (Email/Google Social Recovery)";
  updateWalletUI();
  showToast(`🛡️ ERC-4337 Smart Wallet Activated (${walletState.shortAddress}) — No Seed Phrase Needed & ₹0 Gas!`);
}

function triggerSocialRecoveryDemo() {
  if (!walletState.connected) connectSmartWallet('social');
  showToast(`🔑 Social Recovery Verified via Guardian Email + OTP! All Soulbound Badges remain safely bound to ${walletState.shortAddress}.`);
}

function verifyProofOfPersonhood() {
  const otpInput = document.getElementById('pop-otp-input')?.value.trim() || '202609';
  const idInput = document.getElementById('pop-id-input')?.value.trim() || 'aarav.sharma@iitb.ac.in';
  if (otpInput.length < 4) {
    showToast('⚠️ Enter the 6-digit OTP to complete Sybil-resistant Proof-of-Personhood.');
    return;
  }
  walletState.personhoodVerified = true;
  walletState.verifiedIdentityLabel = `Verified Human (${idInput})`;
  updateWalletUI();
  showToast(`✅ Sybil-Resistant Proof-of-Personhood Verified! Continuous Daily Streak & Live 1-on-1 Access Active.`);
}

function updateWalletUI() {
  const headerWalletBtn = document.getElementById('header-wallet-btn');
  const walletStatusText = document.getElementById('web3-wallet-address');
  const walletTypeText = document.getElementById('web3-wallet-type');
  const popBadge = document.getElementById('pop-status-badge');

  if (headerWalletBtn) {
    headerWalletBtn.textContent = walletState.connected ? `🛡️ ${walletState.shortAddress}` : `⚡ Smart Wallet`;
    headerWalletBtn.className = walletState.connected
      ? 'px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-extrabold transition'
      : 'px-3 py-1.5 rounded-full bg-slate-100 hover:bg-indigo-50 border border-slate-200 text-slate-700 text-xs font-bold transition';
  }
  if (walletStatusText) walletStatusText.textContent = walletState.connected ? walletState.address : 'Not Activated (Click to Provision Smart Wallet)';
  if (walletTypeText) walletTypeText.textContent = walletState.accountType;
  if (popBadge) {
    popBadge.textContent = walletState.personhoodVerified ? `✓ ${walletState.verifiedIdentityLabel}` : '⚠ Unverified (Sybil Guard Active)';
    popBadge.className = walletState.personhoodVerified
      ? 'px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200'
      : 'px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-50 text-amber-800 border border-amber-200';
  }
}

function updateCoinDisplays() {
  const headerCoins = document.getElementById('header-coins');
  const walletCoins = document.getElementById('wallet-coins-display');
  const hoursDisplay = document.getElementById('hours-watched-display');
  const partialDisplay = document.getElementById('partial-mins-display');
  const partialBar = document.getElementById('partial-mins-bar');

  if (headerCoins) headerCoins.textContent = creditCoins.toLocaleString('en-IN');
  if (walletCoins) walletCoins.textContent = creditCoins.toLocaleString('en-IN');
  if (hoursDisplay) hoursDisplay.textContent = totalLiveHoursCompleted;
  if (partialDisplay) partialDisplay.textContent = `${partialLiveMinutes} / 60 mins`;
  if (partialBar) partialBar.style.width = `${(partialLiveMinutes / 60) * 100}%`;

  if (creditCoins >= 390) {
    unlockBadge('b-hoarder', false);
  }
}

function unlockBadge(badgeId, notify = true) {
  const badge = userAssets.badges.find(b => b.id === badgeId);
  if (badge && !badge.unlocked) {
    badge.unlocked = true;
    badge.zkHash = generatePrivacyHash(`${badgeId}-${Date.now()}-${walletState.address || 'guest'}`);
    renderAssetsVault();
    if (notify) {
      showToast(`🏅 Gasless SBT Minted (${badge.tokenId}): "${badge.icon} ${badge.title}"!`);
    }
    return badge;
  }
  return badge;
}

// --- LIVE 1-ON-1 TRAINING CLASSROOM STUDIO ---
function openLiveClassroom(courseId, customSlotLabel = null) {
  const course = courses.find(c => c.id === courseId);
  if (!course) return;

  let enrolled = enrolledCourses.find(e => e.id === courseId);
  if (!enrolled) {
    enrolled = {
      id: course.id,
      title: course.title,
      category: course.category,
      mentor: `${course.mentor} (AI-Verified Mentor)`,
      mentorRole: course.mentorRole,
      durationMins: Math.round(course.hours * 60),
      completedMins: 0,
      sessionCompleted: false,
      scheduledSlot: customSlotLabel || `${formatReadableDate(getLocalDateKey(new Date()))} • ${course.nextSlot.split(', ')[1] || '06:00 PM IST'}`,
      roomCode: `SS-LIVE-10${course.id}`,
      badgeId: course.badgeId,
      badgeTitle: course.badgeTitle,
      badgeIcon: course.badgeIcon
    };
    enrolledCourses.unshift(enrolled);
  } else if (customSlotLabel) {
    enrolled.scheduledSlot = customSlotLabel;
  }

  activeCourseId = courseId;
  renderLiveClassroom();
  switchView('learn');
}

async function joinLiveOneOnOneRoom() {
  const session = enrolledCourses.find(e => e.id === activeCourseId);
  if (!session) return;

  if (!walletState.connected) connectSmartWallet('social');

  liveCallConnected = true;
  document.getElementById('live-call-banner').textContent = `🔴 LIVE 1-ON-1 IN PROGRESS • Room ${session.roomCode}`;
  document.getElementById('live-call-banner').className = 'px-3 py-1 rounded-full text-xs font-extrabold bg-rose-600 text-white animate-pulse';
  document.getElementById('join-live-btn').textContent = '✓ Connected in 1-on-1 Room';
  document.getElementById('join-live-btn').className = 'px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-extrabold shadow-xs';

  appendLiveChatMessage('System', `Connected to private 1-on-1 WebRTC room (${session.roomCode}) with ${session.mentor}. Dual-party EIP-712 attendance oracle active.`);
  appendLiveChatMessage(session.mentor.split(' ')[0], `Welcome! Share your screen whenever you're ready so we can build your ${session.title} project hands-on.`);

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    const learnerVid = document.getElementById('learner-live-video');
    if (learnerVid) {
      learnerVid.srcObject = stream;
      learnerVid.classList.remove('hidden');
      document.getElementById('learner-cam-placeholder').classList.add('hidden');
    }
  } catch (e) {
    // Graceful fallback avatar if camera permissions aren't granted in browser
  }

  showToast(`🎥 Joined Live 1-on-1 Training Room (${session.roomCode}) with ${session.mentor}!`);
}

function toggleLiveControl(controlType) {
  if (controlType === 'mic') {
    micMuted = !micMuted;
    const btn = document.getElementById('ctrl-mic-btn');
    btn.textContent = micMuted ? '🔇 Unmute Mic' : '🎙️ Mic On';
    btn.className = micMuted
      ? 'px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold'
      : 'px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold';
  } else if (controlType === 'cam') {
    camOff = !camOff;
    const btn = document.getElementById('ctrl-cam-btn');
    btn.textContent = camOff ? '📷 Camera Off' : '📹 Camera On';
    btn.className = camOff
      ? 'px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold'
      : 'px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold';
  } else if (controlType === 'screen') {
    screenSharing = !screenSharing;
    const btn = document.getElementById('ctrl-screen-btn');
    btn.textContent = screenSharing ? '🖥️ Sharing Screen ✓' : '🖥️ Share Screen';
    btn.className = screenSharing
      ? 'px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold'
      : 'px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold';
    if (screenSharing) {
      appendLiveChatMessage('You', 'Started live screen sharing for 1-on-1 code/workflow walkthrough.');
      showToast('🖥️ Live Screen Share active in your 1-on-1 session!');
    }
  }
}

function sendLiveChatMessage(e) {
  e.preventDefault();
  const input = document.getElementById('live-chat-input');
  const text = input.value.trim();
  if (!text) return;
  appendLiveChatMessage('You', text);
  input.value = '';

  const session = enrolledCourses.find(e => e.id === activeCourseId);
  const mentorShort = session ? session.mentor.split(' ')[0] : 'Mentor';
  setTimeout(() => {
    appendLiveChatMessage(mentorShort, `Great question! Let's walk through that step-by-step live on your screen right now.`);
  }, 650);
}

function appendLiveChatMessage(sender, message) {
  const box = document.getElementById('live-chat-messages');
  if (!box) return;
  const isMe = sender === 'You';
  const isSystem = sender === 'System';
  const div = document.createElement('div');
  div.className = isSystem
    ? 'text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg px-2.5 py-1.5 font-medium'
    : `text-xs p-2.5 rounded-xl ${isMe ? 'bg-indigo-600 text-white ml-6' : 'bg-slate-100 text-slate-800 mr-6'}`;
  div.innerHTML = isSystem ? message : `<span class="font-extrabold block text-[10px] opacity-80 mb-0.5">${sender}</span>${message}`;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

function updateLiveSlotBooking() {
  const session = enrolledCourses.find(e => e.id === activeCourseId);
  if (!session) return;
  const dateInput = document.getElementById('slot-date-picker')?.value || getLocalDateKey(new Date());
  const timeInput = document.getElementById('slot-time-picker')?.value || '06:00 PM IST';
  selectedSlotDate = dateInput;
  selectedSlotTime = timeInput;
  session.scheduledSlot = `${formatReadableDate(dateInput)} • ${timeInput}`;
  renderLiveClassroom();
  showToast(`📅 Live 1-on-1 Session booked with ${session.mentor} for ${session.scheduledSlot}!`);
}

function advanceLiveSession(minutesToAdd) {
  const session = enrolledCourses.find(e => e.id === activeCourseId);
  if (!session) return;

  if (session.sessionCompleted) {
    showToast(`✅ Live 1-on-1 training for "${session.title}" already completed & "${session.badgeTitle}" SBT minted!`);
    return;
  }

  if (!liveCallConnected) {
    joinLiveOneOnOneRoom();
  }

  const remaining = session.durationMins - session.completedMins;
  const actualTrained = Math.min(minutesToAdd, remaining);
  session.completedMins += actualTrained;

  const heartbeatsAdded = Math.max(1, Math.round(actualTrained / 15));
  liveSessionHeartbeats += heartbeatsAdded;
  const voucherSig = generatePrivacyHash(`EIP712-1ON1-LIVE-${session.id}-${session.completedMins}-${liveSessionHeartbeats}`);
  const oracleBox = document.getElementById('oracle-voucher-hash');
  if (oracleBox) {
    oracleBox.textContent = `Dual-Signed 1-on-1 Attendance Proof: ${voucherSig} (${liveSessionHeartbeats} live heartbeats)`;
  }

  let coinsEarnedNow = 0;
  partialLiveMinutes += actualTrained;
  if (partialLiveMinutes >= 60) {
    const fullHours = Math.floor(partialLiveMinutes / 60);
    partialLiveMinutes = partialLiveMinutes % 60;
    coinsEarnedNow = fullHours * COINS_PER_HOUR;
    creditCoins += coinsEarnedNow;
    totalLiveHoursCompleted += fullHours;
  }
  updateCoinDisplays();

  if (session.completedMins >= session.durationMins) {
    session.sessionCompleted = true;
    const earnedBadge = unlockBadge(session.badgeId, false);

    const certId = 'CERT-1ON1-' + Math.floor(100 + Math.random() * 900);
    const holderName = document.getElementById('auth-name')?.value || 'Aarav Sharma';
    const zkHash = generatePrivacyHash(`${certId}-${holderName}-${session.title}`);

    const alreadyHasCert = userAssets.certificates.some(c => c.skill === session.title && c.type.includes('Learner'));
    if (!alreadyHasCert) {
      userAssets.certificates.unshift({
        id: certId,
        type: 'Live 1-on-1 Learner SBT Certificate (ERC-5192)',
        skill: session.title,
        holder: holderName,
        date: formatReadableDate(getLocalDateKey(new Date())),
        zkCommitHash: zkHash,
        status: 'Co-Signed by Live Mentor & Gasless Minted'
      });
    }

    renderAssetsVault();
    renderLiveClassroom();
    renderCourses();
    openBadgeCelebrationModal(session, earnedBadge, coinsEarnedNow, voucherSig);
  } else {
    renderLiveClassroom();
    const pct = Math.round((session.completedMins / session.durationMins) * 100);
    showToast(`🎥 Verified +${actualTrained}m of Live 1-on-1 Training (${pct}%). Reach 100% to mint "${session.badgeTitle}" SBT!`);
  }
}

function completeLiveSession100() {
  const session = enrolledCourses.find(e => e.id === activeCourseId);
  if (!session) return;
  const remaining = Math.max(0, session.durationMins - session.completedMins);
  advanceLiveSession(remaining > 0 ? remaining : session.durationMins);
}

function openBadgeCelebrationModal(session, badge, coinsEarned, voucherSig) {
  document.getElementById('celebrate-badge-icon').textContent = badge ? badge.icon : session.badgeIcon;
  document.getElementById('celebrate-badge-title').textContent = badge ? badge.title : session.badgeTitle;
  document.getElementById('celebrate-skill-name').textContent = `${session.title} (Live 1-on-1 with ${session.mentor})`;
  document.getElementById('celebrate-zk-hash').textContent = `Dual-Signed 1-on-1 Proof: ${voucherSig.slice(0, 18)}... • Gas Paid: ₹0`;
  document.getElementById('celebrate-coins-note').textContent = coinsEarned > 0
    ? `+${coinsEarned} Utility Coins (${COINS_PER_HOUR}/full live hr) & Mentor Co-Signed SBT minted!`
    : `Mentor Co-Signed Soulbound Certificate added to your Assets Vault!`;
  document.getElementById('badge-celebration-modal').classList.remove('hidden');
}

function closeBadgeCelebrationModal() {
  document.getElementById('badge-celebration-modal').classList.add('hidden');
}

function renderLiveClassroom() {
  const session = enrolledCourses.find(e => e.id === activeCourseId) || enrolledCourses[0];
  if (!session) return;

  const pct = Math.min(100, Math.round((session.completedMins / session.durationMins) * 100));

  document.getElementById('player-course-title').textContent = `${session.title} — Live 1-on-1 Session`;
  document.getElementById('player-course-meta').textContent = `1-on-1 Mentor: ${session.mentor} • Scheduled: ${session.scheduledSlot} • Duration: ${session.durationMins} mins`;
  document.getElementById('player-progress-pct').textContent = `${pct}% (${session.completedMins}/${session.durationMins} live mins)`;
  document.getElementById('player-progress-bar').style.width = `${pct}%`;

  const mentorNameEl = document.getElementById('live-mentor-name');
  if (mentorNameEl) mentorNameEl.textContent = session.mentor;
  const mentorRoleEl = document.getElementById('live-mentor-role');
  if (mentorRoleEl) mentorRoleEl.textContent = `${session.mentorRole} • 1-on-1 Private Mentor`;

  const badgePreview = document.getElementById('player-target-badge');
  badgePreview.innerHTML = `
    <span class="text-2xl">${session.badgeIcon}</span>
    <div>
      <div class="text-xs font-extrabold text-slate-900">${session.badgeTitle} <span class="text-[10px] text-indigo-600 font-bold">(Mentor Co-Signed ERC-5192 SBT)</span></div>
      <div class="text-[11px] ${session.sessionCompleted ? 'text-emerald-700 font-bold' : 'text-slate-500'}">
        ${session.sessionCompleted ? '✓ Co-Signed by Mentor & Gaslessly Minted!' : 'Unlocks at 100% live 1-on-1 session completion'}
      </div>
    </div>
  `;

  const statusPill = document.getElementById('player-status-pill');
  if (session.sessionCompleted) {
    statusPill.textContent = '✓ Live 1-on-1 Completed & SBT Minted';
    statusPill.className = 'px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200';
  } else {
    statusPill.textContent = `1-on-1 Scheduled: ${session.scheduledSlot}`;
    statusPill.className = 'px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-50 text-indigo-800 border border-indigo-200';
  }

  const listEl = document.getElementById('enrolled-courses-list');
  if (listEl) {
    listEl.innerHTML = enrolledCourses.map(item => {
      const itemPct = Math.min(100, Math.round((item.completedMins / item.durationMins) * 100));
      const isSelected = item.id === session.id;
      return `
        <div onclick="openLiveClassroom(${item.id})" class="p-3.5 rounded-xl border cursor-pointer transition ${isSelected ? 'border-indigo-600 bg-indigo-50/60' : 'border-slate-200 bg-white hover:bg-slate-50'}">
          <div class="flex items-center justify-between gap-2">
            <span class="text-xs font-extrabold text-slate-900">${item.badgeIcon} ${item.title}</span>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${item.sessionCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'}">
              ${item.sessionCompleted ? 'SBT Minted ✓' : '1-on-1 Live'}
            </span>
          </div>
          <p class="text-[11px] text-slate-600 mt-1">Mentor: <strong>${item.mentor}</strong></p>
          <p class="text-[10px] font-semibold text-indigo-700 mt-0.5">📅 ${item.scheduledSlot}</p>
          <div class="w-full h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
            <div class="h-full ${item.sessionCompleted ? 'bg-emerald-500' : 'bg-indigo-600'}" style="width: ${itemPct}%"></div>
          </div>
        </div>
      `;
    }).join('');
  }
}

// --- PAYMENT GATEWAY (BOOKS LIVE 1-ON-1 TRAINING SESSION) ---
function initiateCourseCheckout(courseId) {
  const course = courses.find(c => c.id === courseId);
  if (!course) return;

  if (freeSkillUnlocked) {
    completeCourseFulfillment(course, 0, "30-Day Continuous Streak Free Voucher", "VOUCHER_FREE_00");
    return;
  }

  const orderId = "order_SS" + Math.floor(100000 + Math.random() * 900000);
  const gstAmount = Math.round(course.aiPrice * 0.18);
  const totalPayable = course.aiPrice + gstAmount;

  activePaymentOrder = {
    orderId,
    course,
    basePrice: course.aiPrice,
    gstAmount,
    totalPayable
  };

  document.getElementById('pg-course-title').textContent = `${course.title} (Live 1-on-1 with ${course.mentor})`;
  document.getElementById('pg-order-id').textContent = orderId;
  document.getElementById('pg-base-price').textContent = `₹${course.aiPrice}`;
  document.getElementById('pg-gst-price').textContent = `₹${gstAmount}`;
  document.getElementById('pg-total-price').textContent = `₹${totalPayable}`;
  document.getElementById('pg-pay-btn-amount').textContent = `₹${totalPayable}`;
  document.getElementById('pg-status-banner').classList.add('hidden');

  selectPaymentMethod('upi');
  document.getElementById('payment-gateway-modal').classList.remove('hidden');
}

function closePaymentModal() {
  document.getElementById('payment-gateway-modal').classList.add('hidden');
}

function selectPaymentMethod(method) {
  selectedPaymentMethod = method;
  ['upi', 'card', 'netbanking'].forEach(m => {
    const tab = document.getElementById('pg-tab-' + m);
    const panel = document.getElementById('pg-panel-' + m);
    if (m === method) {
      tab.className = 'py-2.5 px-3 rounded-xl border-2 border-indigo-600 bg-indigo-50/70 text-indigo-900 text-xs font-extrabold transition flex items-center justify-center gap-1.5';
      panel.classList.remove('hidden');
    } else {
      tab.className = 'py-2.5 px-3 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-xs font-bold transition flex items-center justify-center gap-1.5';
      panel.classList.add('hidden');
    }
  });
}

function processGatewayPayment() {
  if (!activePaymentOrder) return;
  const payBtn = document.getElementById('pg-submit-btn');
  const statusBanner = document.getElementById('pg-status-banner');

  if (selectedPaymentMethod === 'upi') {
    const upiId = document.getElementById('pg-upi-id').value.trim();
    if (!upiId || !upiId.includes('@')) {
      showToast('⚠️ Please enter a valid UPI ID (e.g. aarav@okicici)');
      return;
    }
  } else if (selectedPaymentMethod === 'card') {
    const cardNum = document.getElementById('pg-card-num').value.replace(/\s+/g, '');
    if (cardNum.length < 12) {
      showToast('⚠️ Please enter a valid 16-digit Debit/Credit Card number');
      return;
    }
  }

  payBtn.disabled = true;
  payBtn.innerHTML = `<span class="animate-pulse">🔒 Booking Live 1-on-1 Slot & Escrow Protection...</span>`;
  statusBanner.classList.remove('hidden');
  statusBanner.className = 'mt-4 p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-semibold';
  statusBanner.textContent = `Processing RBI-Compliant INR Payment (${selectedPaymentMethod.toUpperCase()}) • Locking Private 1-on-1 Room...`;

  setTimeout(() => {
    const paymentId = "pay_" + Math.random().toString(36).substring(2, 12).toUpperCase();
    const methodLabel = selectedPaymentMethod === 'upi'
      ? `UPI (${document.getElementById('pg-upi-id').value.trim()})`
      : selectedPaymentMethod === 'card'
        ? `Card •••• ${document.getElementById('pg-card-num').value.slice(-4) || '4242'}`
        : `NetBanking (${document.getElementById('pg-bank-select').value})`;

    payBtn.disabled = false;
    payBtn.innerHTML = `Pay <span id="pg-pay-btn-amount">₹${activePaymentOrder.totalPayable}</span> & Book 1-on-1`;
    closePaymentModal();

    completeCourseFulfillment(
      activePaymentOrder.course,
      activePaymentOrder.totalPayable,
      methodLabel,
      paymentId
    );
  }, 1100);
}

function launchRazorpayStandardSDK() {
  if (!activePaymentOrder) return;
  if (typeof window.Razorpay === 'undefined') {
    processGatewayPayment();
    return;
  }

  const options = {
    key: RAZORPAY_TEST_KEY,
    amount: activePaymentOrder.totalPayable * 100,
    currency: "INR",
    name: "SkillSwap Live 1-on-1",
    description: `${activePaymentOrder.course.title} (Live 1-on-1)`,
    handler: function (response) {
      closePaymentModal();
      completeCourseFulfillment(
        activePaymentOrder.course,
        activePaymentOrder.totalPayable,
        "Razorpay Checkout (INR)",
        response.razorpay_payment_id || "pay_RZP_LIVE"
      );
    },
    prefill: {
      name: document.getElementById('auth-name')?.value || "Aarav Sharma",
      email: document.getElementById('auth-email')?.value || "aarav@example.in",
      contact: "9876543210"
    },
    theme: { color: "#4f46e5" }
  };

  try {
    const rzp = new window.Razorpay(options);
    rzp.open();
  } catch (e) {
    processGatewayPayment();
  }
}

function completeCourseFulfillment(course, amountPaidINR, methodLabel, txnId) {
  paymentLedger.unshift({
    txnId,
    item: `${course.title} (Live 1-on-1)`,
    method: methodLabel,
    amount: `₹${amountPaidINR}`,
    gasFee: "₹0 (Paymaster)",
    status: "1-on-1 Booked ✓",
    date: formatReadableDate(getLocalDateKey(new Date()))
  });
  renderPaymentLedger();

  openLiveClassroom(course.id);
  showToast(`🎥 Live 1-on-1 Training booked with ${course.mentor} (${txnId})! Join the live room to earn your "${course.badgeTitle}" SBT.`);
}

function renderPaymentLedger() {
  const tbody = document.getElementById('payment-ledger-body');
  if (!tbody) return;

  tbody.innerHTML = paymentLedger.map(txn => `
    <tr class="border-b border-slate-100 hover:bg-slate-50/70">
      <td class="py-3 px-4 font-mono text-xs font-bold text-slate-700">${txn.txnId}</td>
      <td class="py-3 px-4 text-xs font-semibold text-slate-900">${txn.item}</td>
      <td class="py-3 px-4 text-xs text-slate-600">${txn.method}</td>
      <td class="py-3 px-4 text-xs font-extrabold text-slate-900">${txn.amount}</td>
      <td class="py-3 px-4 text-xs font-bold text-indigo-600">${txn.gasFee}</td>
      <td class="py-3 px-4">
        <span class="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">${txn.status}</span>
      </td>
      <td class="py-3 px-4 text-xs text-slate-500">${txn.date}</td>
    </tr>
  `).join('');
}

// --- MARKETPLACE (LIVE 1-ON-1 MENTORSHIP COURSES) ---
function renderCourses() {
  const filterEl = document.getElementById('categoryFilter');
  const grid = document.getElementById('courses-grid');
  if (!filterEl || !grid) return;

  const filter = filterEl.value;
  const filtered = filter === 'all' ? courses : courses.filter(c => c.category === filter);

  grid.innerHTML = filtered.map(c => {
    const coinPrice = c.aiPrice * COIN_MULTIPLIER;
    const badgeObj = userAssets.badges.find(b => b.id === c.badgeId);
    const isBadgeEarned = badgeObj && badgeObj.unlocked;

    return `
      <div class="glass-card rounded-2xl p-5 flex flex-col justify-between hover:border-indigo-300 transition">
        <div>
          <div class="flex items-center justify-between gap-2 mb-3">
            <div class="flex items-center gap-1.5">
              <span class="px-2.5 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-extrabold uppercase">🔴 Live 1-on-1</span>
              <span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-bold">${c.category}</span>
            </div>
            <span class="inline-flex items-center gap-1 text-[11px] font-bold ${isBadgeEarned ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-indigo-700 bg-indigo-50 border-indigo-200'} px-2 py-0.5 rounded-full border">
              ${c.badgeIcon} ${isBadgeEarned ? 'SBT Minted ✓' : c.badgeTitle}
            </span>
          </div>
          <h3 class="text-base font-extrabold text-slate-900 mb-1">${c.title}</h3>
          <p class="text-xs text-slate-500 mb-2">1-on-1 Mentor: <strong class="text-slate-800">${c.mentor}</strong> (${c.mentorRole}) • ⭐ ${c.rating}</p>
          <div class="flex flex-wrap items-center gap-2 text-[11px] text-slate-600 mb-3">
            <span class="px-2 py-0.5 rounded bg-slate-100 font-semibold">⏱ ${c.hours} hr Private Live</span>
            <span class="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold">📅 Next: ${c.nextSlot}</span>
          </div>
          <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold mb-4">
            <span>🎥 Live 1-on-1 → Mentor Co-Signed "${c.badgeTitle}" SBT + ${Math.floor(c.hours) * COINS_PER_HOUR} Coins</span>
          </div>
        </div>

        <div class="pt-4 border-t border-slate-100">
          <div class="flex items-baseline justify-between mb-3">
            <div>
              <span class="text-[10px] uppercase font-bold text-indigo-600 block">1-on-1 Live Fee vs 50X Coins</span>
              <div class="flex flex-wrap items-center gap-2 mt-0.5">
                <span class="text-2xl font-extrabold text-slate-900">${freeSkillUnlocked ? '₹0' : '₹' + c.aiPrice}</span>
                <span class="text-xs text-slate-400 line-through">${c.marketAvg}</span>
                <span class="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">or 🪙 ${coinPrice.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
          <div class="grid grid-cols-3 gap-1.5">
            <button onclick="initiateCourseCheckout(${c.id})" class="py-2.5 px-2 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-[11px] font-bold transition">
              ${freeSkillUnlocked ? 'Book Free (₹0)' : 'Book ₹' + c.aiPrice}
            </button>
            <button onclick="redeemCourseWithCoins(${c.id})" class="py-2.5 px-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold transition">
              🪙 ${coinPrice.toLocaleString('en-IN')}
            </button>
            <button onclick="openLiveClassroom(${c.id})" class="py-2.5 px-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-bold transition">
              🎥 Join 1-on-1
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function redeemCourseWithCoins(courseId) {
  const course = courses.find(c => c.id === courseId);
  if (!course) return;
  const coinCost = course.aiPrice * COIN_MULTIPLIER;

  if (creditCoins < coinCost) {
    showToast(`⚠️ Need ${coinCost.toLocaleString('en-IN')} Credit Coins (50X price). You have ${creditCoins.toLocaleString('en-IN')} Coins — complete 1-hr Live 1-on-1 sessions (+${COINS_PER_HOUR} Coins/hr) or pay ₹${course.aiPrice}!`);
    return;
  }
  creditCoins -= coinCost;
  updateCoinDisplays();

  paymentLedger.unshift({
    txnId: "COIN_" + Math.floor(100000 + Math.random() * 900000),
    item: `${course.title} (Live 1-on-1)`,
    method: `Closed-Loop Utility Coins (${coinCost.toLocaleString('en-IN')} Coins)`,
    amount: "₹0 (50X Coins)",
    gasFee: "₹0 (Paymaster)",
    status: "1-on-1 Booked ✓",
    date: formatReadableDate(getLocalDateKey(new Date()))
  });
  renderPaymentLedger();
  openLiveClassroom(course.id);
  showToast(`🪙 Booked Live 1-on-1 "${course.title}" with ${coinCost.toLocaleString('en-IN')} Coins! Join the room to mint your "${course.badgeTitle}" SBT.`);
}

function redeemRewardItem(itemName, cost) {
  if (creditCoins < cost) {
    showToast(`⚠️ Insufficient Credit Coins! Need ${cost.toLocaleString('en-IN')} Coins (Current: ${creditCoins.toLocaleString('en-IN')}). Complete 1-hr Live 1-on-1 sessions (+${COINS_PER_HOUR} Coins/hr).`);
    return;
  }
  creditCoins -= cost;
  updateCoinDisplays();
  showToast(`🎁 Redeemed "${itemName}" for ${cost.toLocaleString('en-IN')} Credit Coins!`);
}

// --- AI RATE CALCULATOR MODAL ---
function openRateModal() {
  document.getElementById('rate-modal').classList.remove('hidden');
  calculateAiRate();
}

function closeRateModal() {
  document.getElementById('rate-modal').classList.add('hidden');
}

function calculateAiRate() {
  const level = parseFloat(document.getElementById('calc-level').value);
  const hours = parseInt(document.getElementById('calc-hours').value);
  document.getElementById('calc-hours-val').textContent = hours + (hours === 1 ? ' hr' : ' hrs');
  const rawRate = (149 * level) + (hours * 75);
  const roundedRate = Math.round(rawRate / 10) * 10 - 1;
  const coinEquivalent = roundedRate * COIN_MULTIPLIER;
  document.getElementById('calc-price').textContent = '₹' + roundedRate;
  const calcCoinsEl = document.getElementById('calc-coins-price');
  if (calcCoinsEl) calcCoinsEl.textContent = 'or 🪙 ' + coinEquivalent.toLocaleString('en-IN') + ' Coins (50X)';
}

// --- AI-PROCTORED TRAINER EXAM ---
async function startProctoredExam() {
  examActive = true;
  integrityScore = 100;
  updateIntegrityUI();
  document.getElementById('exam-questions').classList.remove('opacity-50', 'pointer-events-none');
  const startBtn = document.getElementById('start-exam-btn');
  startBtn.textContent = 'Proctoring Active ●';
  startBtn.classList.replace('bg-indigo-600', 'bg-emerald-600');
  document.getElementById('ai-overlay').classList.remove('hidden');

  const logList = document.getElementById('proctor-logs');
  logList.innerHTML = '';
  addProctorLog('AI Vision & Anti-Cheating Engine initialized for Live 1-on-1 Mentor Verification.', 'ok');

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    const video = document.getElementById('webcam-video');
    video.srcObject = stream;
    video.classList.remove('hidden');
    document.getElementById('webcam-placeholder').classList.add('hidden');
    addProctorLog('Live webcam stream verified. Face landmark tracking active.', 'ok');
  } catch (err) {
    addProctorLog('Webcam permission unavailable — running simulated AI gaze & face-turn monitor.', 'warn');
  }
}

function addProctorLog(message, type = 'ok') {
  const logList = document.getElementById('proctor-logs');
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const color = type === 'danger' ? 'text-rose-600 font-bold' : type === 'warn' ? 'text-amber-700 font-semibold' : 'text-slate-600';
  const li = document.createElement('li');
  li.className = color;
  li.textContent = `[${time}] ${message}`;
  logList.prepend(li);
}

function triggerViolation(reason, penalty) {
  if (!examActive) {
    showToast('Click "Start Proctored Exam" first to test anti-cheating.');
    return;
  }
  integrityScore = Math.max(0, integrityScore - penalty);
  updateIntegrityUI();
  addProctorLog(`FLAG: ${reason} (-${penalty}%)`, 'danger');

  const badge = document.getElementById('face-status-badge');
  badge.textContent = '⚠ Anomaly Flagged';
  badge.className = 'px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200';
  setTimeout(() => {
    badge.textContent = 'Face Centered ✓';
    badge.className = 'px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200';
  }, 2500);
}

function handlePasteAttempt(e) {
  e.preventDefault();
  triggerViolation('Clipboard Paste Blocked (Suspected AI Answer)', 20);
  showToast('🚫 Pasting is blocked during live mentor verification!');
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden && examActive) {
    triggerViolation('Browser Tab Switched Away During Exam', 20);
  }
});

function updateIntegrityUI() {
  const bar = document.getElementById('integrity-bar');
  const text = document.getElementById('integrity-score-text');
  bar.style.width = integrityScore + '%';
  text.textContent = integrityScore + '%';

  if (integrityScore >= 70) {
    bar.className = 'h-full bg-emerald-500 transition-all duration-300';
    text.className = 'text-emerald-600';
  } else {
    bar.className = 'h-full bg-rose-500 transition-all duration-300';
    text.className = 'text-rose-600';
  }
}

function submitTeacherExam() {
  const resultBox = document.getElementById('exam-result');
  resultBox.classList.remove('hidden');

  if (integrityScore < 70) {
    resultBox.className = 'mt-6 p-5 rounded-xl border border-rose-200 bg-rose-50 text-rose-900';
    resultBox.innerHTML = `
      <h4 class="font-extrabold text-sm">❌ Certification Rejected — Integrity Score Too Low (${integrityScore}%)</h4>
      <p class="text-xs mt-1">Our AI proctor detected multiple head turns, tab switches, or AI-assisted pasting. Please retake the exam honestly to host Live 1-on-1 classes.</p>
    `;
  } else {
    const skillInput = document.getElementById('teacher-skill-select')?.value || 'Python & API Automation';
    const certId = 'TRN-1ON1-' + Math.floor(100 + Math.random() * 900);
    const holderName = document.getElementById('auth-name')?.value || 'Aarav Sharma';
    const zkHash = generatePrivacyHash(`${certId}-${holderName}-${skillInput}-${integrityScore}`);

    userAssets.certificates.unshift({
      id: certId,
      type: 'Live 1-on-1 Mentor Attestation (ERC-5192)',
      skill: skillInput,
      holder: holderName,
      date: formatReadableDate(getLocalDateKey(new Date())),
      zkCommitHash: zkHash,
      status: 'Privacy-Hashed & Gasless Minted'
    });
    unlockBadge('b-trainer', false);
    renderAssetsVault();

    resultBox.className = 'mt-6 p-5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900';
    resultBox.innerHTML = `
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 class="font-extrabold text-sm">🎉 Live 1-on-1 Mentor SBT Minted for "${skillInput}"! (Integrity: ${integrityScore}%)</h4>
          <p class="text-xs mt-1">You are now cleared to teach live 1-on-1 sessions. Privacy Hash <span class="font-mono">${zkHash.slice(0, 16)}...</span> on Base L2 (₹0 Gas).</p>
        </div>
        <button onclick="switchView('assets')" class="px-4 py-2 rounded-lg bg-emerald-700 text-white text-xs font-bold shrink-0">
          View in My Assets →
        </button>
      </div>
    `;
  }
}

// --- ASSETS, SOULBOUND BADGES, COINS & VAULT ---
function renderAssetsVault() {
  const badgesGrid = document.getElementById('badges-grid');
  const certsGrid = document.getElementById('certificates-grid');
  if (!badgesGrid || !certsGrid) return;

  badgesGrid.innerHTML = userAssets.badges.map(b => `
    <div class="p-4 rounded-2xl border ${b.unlocked ? 'bg-white border-indigo-200 shadow-xs' : 'bg-slate-50/70 border-slate-200 opacity-65'} flex items-start gap-3">
      <div class="w-11 h-11 rounded-xl ${b.unlocked ? 'bg-indigo-50 text-2xl' : 'bg-slate-200 text-xl grayscale'} flex items-center justify-center shrink-0">
        ${b.icon}
      </div>
      <div>
        <div class="flex flex-wrap items-center gap-1.5">
          <h4 class="text-xs font-extrabold text-slate-900">${b.title}</h4>
          ${b.unlocked ? '<span class="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded">Minted ✓</span>' : '<span class="text-[10px] font-semibold text-slate-400">Locked</span>'}
        </div>
        <span class="inline-block text-[10px] font-bold uppercase tracking-wider text-indigo-600 mt-0.5">${b.category} • ${b.tokenId}</span>
        <p class="text-[11px] text-slate-500 mt-0.5">${b.desc}</p>
        <p class="text-[10px] font-mono text-slate-400 mt-1">ZK Hash: ${b.zkHash}</p>
      </div>
    </div>
  `).join('');

  certsGrid.innerHTML = userAssets.certificates.map(cert => {
    const isTrainer = cert.type.includes('Mentor') || cert.type.includes('Trainer');
    return `
      <div class="cert-frame rounded-2xl p-5 flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between gap-2 mb-3">
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${isTrainer ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-indigo-100 text-indigo-800 border border-indigo-200'}">
              ${isTrainer ? '🏅 ' + cert.type : '🎓 ' + cert.type}
            </span>
            <span class="text-[11px] font-mono font-bold text-slate-500">${cert.id}</span>
          </div>
          <h3 class="text-lg font-extrabold text-slate-900">${cert.skill}</h3>
          <p class="text-xs text-slate-600 mt-1">Awarded to: <strong>${cert.holder}</strong> • Issued: ${cert.date}</p>
          <p class="text-[11px] font-mono text-indigo-700 bg-white/80 px-2.5 py-1 rounded border border-indigo-100 mt-2 truncate">
            Privacy Hash (DPDP Safe): ${cert.zkCommitHash}
          </p>
        </div>
        <div class="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between">
          <span class="text-[11px] font-bold text-emerald-700">✓ ${cert.status}</span>
          <button onclick="openCertificateModal('${cert.id}', '${cert.type}', '${cert.skill}', '${cert.holder}', '${cert.date}', '${cert.zkCommitHash}')" class="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold transition">
            Inspect ZK Proof
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function openCertificateModal(id, type, skill, holder, date, zkHash) {
  document.getElementById('modal-cert-id').textContent = id;
  document.getElementById('modal-cert-type').textContent = type;
  document.getElementById('modal-cert-skill').textContent = skill;
  document.getElementById('modal-cert-holder').textContent = holder;
  document.getElementById('modal-cert-date').textContent = date;
  document.getElementById('modal-cert-zk').textContent = zkHash || '0x8f3a91c4d72e50b6';
  document.getElementById('cert-modal').classList.remove('hidden');
}

function closeCertificateModal() {
  document.getElementById('cert-modal').classList.add('hidden');
}

// --- 30-DAY CONTINUOUS CALENDAR STREAK (AWARD ON CURRENT DATE • BREAK IF 1 DAY MISSED) ---
function renderStreakGrid() {
  const grid = document.getElementById('streak-grid');
  if (!grid) return;

  const todayObj = new Date();
  const todayKey = getLocalDateKey(todayObj);
  const currentStreak = streakState.streakCount;

  const startDateObj = new Date(todayObj);
  const offsetFromStart = currentStreak > 0 ? (currentStreak - 1) : 0;
  startDateObj.setDate(todayObj.getDate() - offsetFromStart);

  let html = '';
  for (let slot = 1; slot <= 30; slot++) {
    const slotDate = new Date(startDateObj);
    slotDate.setDate(startDateObj.getDate() + (slot - 1));
    const slotKey = getLocalDateKey(slotDate);
    const shortDateLabel = slotDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

    const isTodaySlot = (slotKey === todayKey);
    const completed = slot <= currentStreak;
    const isTrial = slot <= 10;
    const isFinal = slot === 30;

    let classes = 'p-2.5 rounded-xl border text-center transition relative ';
    if (completed && isTodaySlot) {
      classes += 'bg-indigo-600 border-indigo-700 text-white font-extrabold shadow-sm ring-2 ring-indigo-300';
    } else if (completed) {
      classes += 'bg-emerald-500 border-emerald-600 text-white font-bold shadow-xs';
    } else if (isFinal) {
      classes += 'bg-amber-50 border-amber-300 text-amber-900 font-bold';
    } else if (isTrial) {
      classes += 'bg-indigo-50/60 border-indigo-200 text-indigo-900';
    } else {
      classes += 'bg-white border-slate-200 text-slate-600';
    }

    html += `
      <div class="${classes}">
        <div class="text-[10px] uppercase font-bold opacity-90">Day ${slot}</div>
        <div class="text-[10px] font-mono opacity-85 mt-0.5">${shortDateLabel}</div>
        <div class="text-sm font-extrabold mt-0.5">${completed ? (isTodaySlot ? '🔥 Today' : '🔥') : isFinal ? '🎁' : isTrial ? 'Free' : '•'}</div>
      </div>
    `;
  }
  grid.innerHTML = html;

  document.getElementById('streak-count-display').textContent = currentStreak;
  document.getElementById('header-streak').textContent = currentStreak;
  document.getElementById('streak-progress-bar').style.width = ((currentStreak / 30) * 100) + '%';

  const todayDisplay = document.getElementById('today-date-display');
  if (todayDisplay) todayDisplay.textContent = formatReadableDate(todayKey);

  const lastLoginDisplay = document.getElementById('last-login-date-display');
  if (lastLoginDisplay) {
    lastLoginDisplay.textContent = streakState.lastLoginDate
      ? `Awarded on ${formatReadableDate(streakState.lastLoginDate)} ✓`
      : 'Not checked in today';
  }

  const brokenBanner = document.getElementById('streak-broken-banner');
  if (brokenBanner) {
    if (streakState.wasBrokenRecently) {
      brokenBanner.classList.remove('hidden');
      document.getElementById('streak-broken-text').textContent =
        `You missed ${streakState.missedDaysCount} day(s) of continuous login! Your previous streak was reset to 0 and restarted at Day ${currentStreak} on ${formatReadableDate(todayKey)}.`;
    } else {
      brokenBanner.classList.add('hidden');
    }
  }

  const voucherEl = document.getElementById('voucher-status');
  if (currentStreak >= 30) {
    freeSkillUnlocked = true;
    unlockBadge('b-streak', false);
    voucherEl.textContent = '🎉 1 FREE LIVE 1-ON-1 CLASS!';
    voucherEl.className = 'text-xl font-extrabold text-emerald-600 mt-1';
    renderCourses();
  } else {
    freeSkillUnlocked = false;
    const left = 30 - currentStreak;
    voucherEl.textContent = `🔒 Locked (${left} day${left === 1 ? '' : 's'} left)`;
    voucherEl.className = 'text-xl font-extrabold text-amber-600 mt-1';
    renderCourses();
  }
}

function checkInToday() {
  if (!walletState.personhoodVerified) {
    verifyProofOfPersonhood();
  }
  const todayKey = getLocalDateKey(new Date());
  if (streakState.lastLoginDate === todayKey && streakState.streakCount > 0) {
    showToast(`🔥 Streak already awarded for today (${formatReadableDate(todayKey)})! Log in tomorrow without missing a day to reach Day ${streakState.streakCount + 1}.`);
    renderStreakGrid();
    return;
  }

  loadAndEvaluateStreakOnLogin(true);
  renderStreakGrid();
  showToast(`🔥 Continuous Login Verified for ${formatReadableDate(todayKey)}! Streak is now Day ${streakState.streakCount}/30.`);
}

function simulateNextDayLogin(missedOneDay = false) {
  const todayObj = new Date();
  const todayKey = getLocalDateKey(todayObj);

  if (missedOneDay) {
    const twoDaysAgo = new Date(todayObj);
    twoDaysAgo.setDate(todayObj.getDate() - 2);
    streakState.lastLoginDate = getLocalDateKey(twoDaysAgo);
    streakState.streakCount = Math.max(5, streakState.streakCount);
    saveStreakState();

    loadAndEvaluateStreakOnLogin(true);
    renderStreakGrid();
    showToast(`💔 You stopped logging in for 1 day! Previous streak broke and reset to Day 1 on ${formatReadableDate(todayKey)}.`);
  } else {
    const yesterday = new Date(todayObj);
    yesterday.setDate(todayObj.getDate() - 1);
    const prevCount = streakState.streakCount > 0 ? streakState.streakCount : 1;
    streakState.streakCount = Math.min(29, prevCount);
    streakState.lastLoginDate = getLocalDateKey(yesterday);
    streakState.wasBrokenRecently = false;
    saveStreakState();

    loadAndEvaluateStreakOnLogin(true);
    renderStreakGrid();
    showToast(`🔥 Continuous Daily Login! Streak advanced to Day ${streakState.streakCount}/30 on ${formatReadableDate(todayKey)}.`);
  }
}

function simulateFullMonthStreak() {
  if (!walletState.personhoodVerified) {
    verifyProofOfPersonhood();
  }
  const todayObj = new Date();
  const todayKey = getLocalDateKey(todayObj);
  const dates = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(todayObj);
    d.setDate(todayObj.getDate() - i);
    dates.push(getLocalDateKey(d));
  }
  streakState = {
    streakCount: 30,
    lastLoginDate: todayKey,
    loggedDates: dates,
    wasBrokenRecently: false,
    missedDaysCount: 0
  };
  saveStreakState();
  renderStreakGrid();
  showToast(`🎉 30 Continuous Days Logged (ending ${formatReadableDate(todayKey)})! 1 Free Live 1-on-1 Class (₹0) & Consistency SBT unlocked!`);
}

// --- AUTHENTICATION ---
function toggleAuthTab(mode) {
  authMode = mode;
  const tabSignup = document.getElementById('tab-signup');
  const tabLogin = document.getElementById('tab-login');
  const nameField = document.getElementById('name-field');
  const roleField = document.getElementById('role-field');
  const submitBtn = document.getElementById('auth-submit-btn');

  if (mode === 'signup') {
    tabSignup.className = 'py-2 rounded-lg text-xs font-bold bg-white text-slate-900 shadow-xs transition';
    tabLogin.className = 'py-2 rounded-lg text-xs font-bold text-slate-600 transition';
    nameField.classList.remove('hidden');
    roleField.classList.remove('hidden');
    submitBtn.textContent = 'Create Account + Award Today’s Streak';
  } else {
    tabLogin.className = 'py-2 rounded-lg text-xs font-bold bg-white text-slate-900 shadow-xs transition';
    tabSignup.className = 'py-2 rounded-lg text-xs font-bold text-slate-600 transition';
    nameField.classList.add('hidden');
    roleField.classList.add('hidden');
    submitBtn.textContent = 'Log In & Verify Continuous Streak';
  }
}

function handleAuthSubmit(e) {
  e.preventDefault();
  connectSmartWallet('social');
  verifyProofOfPersonhood();
  loadAndEvaluateStreakOnLogin(true);
  renderStreakGrid();
  document.getElementById('user-badge').classList.remove('hidden');
  document.getElementById('nav-auth').textContent = 'Smart Wallet Active ✓';
  switchView('streak');
  showToast(`🔥 Logged in on ${formatReadableDate(getLocalDateKey(new Date()))}! Continuous Streak: Day ${streakState.streakCount}/30.`);
}

function quickDemoLogin() {
  connectSmartWallet('social');
  verifyProofOfPersonhood();
  loadAndEvaluateStreakOnLogin(true);
  renderStreakGrid();
  document.getElementById('user-badge').classList.remove('hidden');
  document.getElementById('nav-auth').textContent = 'Aarav (Smart Wallet) ✓';
  switchView('streak');
  showToast(`🔥 Logged in on ${formatReadableDate(getLocalDateKey(new Date()))}! Continuous Streak: Day ${streakState.streakCount}/30.`);
}

// --- INITIALIZE ---
document.addEventListener('DOMContentLoaded', () => {
  loadAndEvaluateStreakOnLogin(true);
  const slotDateEl = document.getElementById('slot-date-picker');
  if (slotDateEl) slotDateEl.value = getLocalDateKey(new Date());
  updateWalletUI();
  updateCoinDisplays();
  renderCourses();
  renderLiveClassroom();
  renderStreakGrid();
  renderAssetsVault();
  renderPaymentLedger();
});
