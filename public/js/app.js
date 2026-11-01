/* ==========================================================================
   DROPSTASH - FRONTEND CLIENT APPLICATION
   State Management, Live Polling, Auth, and Giveaway Entry System
   ========================================================================== */

(function () {
  'use strict';

  // Application State
  const state = {
    loggedIn: false,
    user: null,
    hasEntered: false,
    totalEntries: 29,
    targetEndDate: null,
    pollingInterval: null
  };

  // DOM Elements
  const elements = {
    // Nav & Auth
    navAuthLoggedOut: document.getElementById('navAuthLoggedOut'),
    navAuthLoggedIn: document.getElementById('navAuthLoggedIn'),
    navUserName: document.getElementById('navUserName'),
    navUserAvatar: document.getElementById('navUserAvatar'),
    navLogoutBtn: document.getElementById('navLogoutBtn'),
    btnOpenRegister: document.getElementById('btnOpenRegister'),
    btnOpenLogin: document.getElementById('btnOpenLogin'),

    // Hero & Giveaway CTA
    btnEnterGiveaway: document.getElementById('btnEnterGiveaway'),
    btnEnterText: document.getElementById('btnEnterText'),
    userStatusCard: document.getElementById('userStatusCard'),
    userStatusText: document.getElementById('userStatusText'),

    // Counters
    totalEntriesCounter: document.getElementById('totalEntriesCounter'),
    recentEntriesList: document.getElementById('recentEntriesList'),

    // Countdown Timer
    timerDays: document.getElementById('timerDays'),
    timerHours: document.getElementById('timerHours'),
    timerMinutes: document.getElementById('timerMinutes'),
    timerSeconds: document.getElementById('timerSeconds'),

    // Auth Modal
    authModal: document.getElementById('authModal'),
    modalCloseBtn: document.getElementById('modalCloseBtn'),
    tabRegister: document.getElementById('tabRegister'),
    tabLogin: document.getElementById('tabLogin'),
    registerForm: document.getElementById('registerForm'),
    loginForm: document.getElementById('loginForm'),
    switchToLoginLink: document.getElementById('switchToLoginLink'),
    switchToRegisterLink: document.getElementById('switchToRegisterLink'),
    registerError: document.getElementById('registerError'),
    loginError: document.getElementById('loginError'),

    // Toasts
    toastContainer: document.getElementById('toastContainer'),

    // Past Winners Modal
    pastWinnersModal: document.getElementById('pastWinnersModal'),
    pastWinnersModalCloseBtn: document.getElementById('pastWinnersModalCloseBtn'),
    pastModalBadge: document.getElementById('pastModalBadge'),
    pastModalTitle: document.getElementById('pastModalTitle'),
    pastModalSubtitle: document.getElementById('pastModalSubtitle'),
    pastWinnersListContainer: document.getElementById('pastWinnersListContainer')
  };

  // Initialize
  function init() {
    initCountdown();
    setupEventListeners();
    checkAuthStatus();
    fetchEntries();
    checkPublicWinners();

    // Start real-time entries polling every 6 seconds
    state.pollingInterval = setInterval(fetchEntries, 6000);

    // Check URL parameters or hash for auth tab opening
    const path = window.location.pathname;
    const hash = window.location.hash;
    if (path === '/register' || hash === '#register') {
      openAuthModal('register');
    } else if (path === '/login' || hash === '#login') {
      openAuthModal('login');
    }
  }

  /* ==========================================================================
     COUNTDOWN TIMER (3 Days from first visit, persisted in localStorage)
     ========================================================================== */
  function initCountdown() {
    const STORAGE_KEY = 'dropstash_giveaway_deadline_v1';
    let deadline = localStorage.getItem(STORAGE_KEY);

    if (!deadline) {
      // 3 days from now (72 hours)
      const now = new Date();
      now.setTime(now.getTime() + (3 * 24 * 60 * 60 * 1000));
      deadline = now.toISOString();
      localStorage.setItem(STORAGE_KEY, deadline);
    }

    state.targetEndDate = new Date(deadline);

    function updateTimer() {
      const now = new Date().getTime();
      const distance = state.targetEndDate.getTime() - now;

      if (distance <= 0) {
        if (elements.timerDays) elements.timerDays.textContent = '00';
        if (elements.timerHours) elements.timerHours.textContent = '00';
        if (elements.timerMinutes) elements.timerMinutes.textContent = '00';
        if (elements.timerSeconds) elements.timerSeconds.textContent = '00';
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      if (elements.timerDays) elements.timerDays.textContent = String(days).padStart(2, '0');
      if (elements.timerHours) elements.timerHours.textContent = String(hours).padStart(2, '0');
      if (elements.timerMinutes) elements.timerMinutes.textContent = String(minutes).padStart(2, '0');
      if (elements.timerSeconds) elements.timerSeconds.textContent = String(seconds).padStart(2, '0');
    }

    updateTimer();
    setInterval(updateTimer, 1000);
  }

  /* ==========================================================================
     EVENT LISTENERS
     ========================================================================== */
  function setupEventListeners() {
    // Nav Auth buttons
    if (elements.btnOpenRegister) {
      elements.btnOpenRegister.addEventListener('click', () => openAuthModal('register'));
    }
    if (elements.btnOpenLogin) {
      elements.btnOpenLogin.addEventListener('click', () => openAuthModal('login'));
    }

    // Modal Close
    if (elements.modalCloseBtn) {
      elements.modalCloseBtn.addEventListener('click', closeAuthModal);
    }
    if (elements.authModal) {
      elements.authModal.addEventListener('click', (e) => {
        if (e.target === elements.authModal) closeAuthModal();
      });
    }

    // Tab Switching
    if (elements.tabRegister) {
      elements.tabRegister.addEventListener('click', () => switchTab('register'));
    }
    if (elements.tabLogin) {
      elements.tabLogin.addEventListener('click', () => switchTab('login'));
    }
    if (elements.switchToLoginLink) {
      elements.switchToLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        switchTab('login');
      });
    }
    if (elements.switchToRegisterLink) {
      elements.switchToRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        switchTab('register');
      });
    }

    // Forms
    if (elements.registerForm) {
      elements.registerForm.addEventListener('submit', handleRegisterSubmit);
    }
    if (elements.loginForm) {
      elements.loginForm.addEventListener('submit', handleLoginSubmit);
    }

    // Logout
    if (elements.navLogoutBtn) {
      elements.navLogoutBtn.addEventListener('click', handleLogout);
    }

    // Enter Giveaway CTA Button
    if (elements.btnEnterGiveaway) {
      elements.btnEnterGiveaway.addEventListener('click', handleEnterGiveaway);
    }

    // Past Winners Modal Listeners
    if (elements.pastWinnersModalCloseBtn) {
      elements.pastWinnersModalCloseBtn.addEventListener('click', closePastWinnersModal);
    }
    if (elements.pastWinnersModal) {
      elements.pastWinnersModal.addEventListener('click', (e) => {
        if (e.target === elements.pastWinnersModal) closePastWinnersModal();
      });
    }

    document.querySelectorAll('.btn-view-past-winners').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const giveawayId = e.currentTarget.getAttribute('data-giveaway');
        openPastWinnersModal(giveawayId);
      });
    });
  }

  /* ==========================================================================
     PAST WINNERS MODAL LOGIC
     ========================================================================== */
  let pastHistoryCache = null;

  async function openPastWinnersModal(giveawayId) {
    try {
      if (!pastHistoryCache) {
        const res = await fetch('/api/history');
        const data = await res.json();
        if (data.success && data.history) {
          pastHistoryCache = data.history;
        }
      }

      const item = (pastHistoryCache || []).find(h => h.id === giveawayId);
      if (!item) return;

      if (elements.pastModalBadge) elements.pastModalBadge.textContent = item.festival;
      if (elements.pastModalTitle) elements.pastModalTitle.textContent = item.title;
      if (elements.pastModalSubtitle) {
        elements.pastModalSubtitle.textContent = `Total ${item.winnersCount} Lucky Winners • Drawn on ${item.date} • ${item.status}`;
      }

      if (elements.pastWinnersListContainer) {
        elements.pastWinnersListContainer.innerHTML = item.winners.map((w, idx) => `
          <div class="winner-row-card">
            <div class="winner-avatar-name">
              <div class="winner-num-badge">#${idx + 1}</div>
              <div>
                <div class="winner-name-txt">${escapeHtml(w.name)}</div>
                <div class="winner-city-txt">📍 ${escapeHtml(w.city)}</div>
              </div>
            </div>
            <div class="winner-courier-tag">
              <span class="courier-status">Delivered ✅</span>
              <span class="courier-tracking">${escapeHtml(w.courier)} • ${escapeHtml(w.deliveredAt)}</span>
            </div>
          </div>
        `).join('');
      }

      if (elements.pastWinnersModal) {
        elements.pastWinnersModal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    } catch (err) {
      console.error('Error loading past winners:', err);
    }
  }

  function closePastWinnersModal() {
    if (elements.pastWinnersModal) {
      elements.pastWinnersModal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  /* ==========================================================================
     MODAL CONTROLS
     ========================================================================== */
  function openAuthModal(defaultTab = 'register') {
    switchTab(defaultTab);
    clearErrors();
    if (elements.authModal) {
      elements.authModal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeAuthModal() {
    if (elements.authModal) {
      elements.authModal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  function switchTab(tab) {
    clearErrors();
    if (tab === 'register') {
      elements.tabRegister.classList.add('active');
      elements.tabLogin.classList.remove('active');
      elements.registerForm.style.display = 'flex';
      elements.loginForm.style.display = 'none';
      history.replaceState(null, '', '#register');
    } else {
      elements.tabLogin.classList.add('active');
      elements.tabRegister.classList.remove('active');
      elements.loginForm.style.display = 'flex';
      elements.registerForm.style.display = 'none';
      history.replaceState(null, '', '#login');
    }
  }

  function clearErrors() {
    if (elements.registerError) {
      elements.registerError.textContent = '';
      elements.registerError.classList.remove('visible');
    }
    if (elements.loginError) {
      elements.loginError.textContent = '';
      elements.loginError.classList.remove('visible');
    }
  }

  /* ==========================================================================
     AUTH OPERATIONS (REGISTER, LOGIN, LOGOUT, ME)
     ========================================================================== */

  // Check Auth Status on load
  async function checkAuthStatus() {
    try {
      const res = await fetch('/api/me');
      const data = await res.json();

      if (data.loggedIn && data.user) {
        state.loggedIn = true;
        state.user = data.user;
        state.hasEntered = !!data.hasEntered;
      } else {
        state.loggedIn = false;
        state.user = null;
        state.hasEntered = false;
      }

      if (data.totalEntries !== undefined) {
        updateEntriesCountDisplay(data.totalEntries);
      }

      renderUI();
    } catch (err) {
      console.warn('Error checking auth status:', err);
    }
  }

  // Handle Register
  async function handleRegisterSubmit(e) {
    e.preventDefault();
    clearErrors();

    const fullName = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const phone = document.getElementById('regPhone').value.trim();
    const password = document.getElementById('regPassword').value;

    // Frontend Validations
    if (!fullName || fullName.length < 2) {
      showError(elements.registerError, 'Kripya apna poora naam daalein.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      showError(elements.registerError, 'Kripya ek valid email address enter karein.');
      return;
    }

    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      showError(elements.registerError, 'Kripya kam se kam 10-digit phone number enter karein.');
      return;
    }

    if (!password || password.length < 6) {
      showError(elements.registerError, 'Password kam se kam 6 characters ka hona chahiye.');
      return;
    }

    const submitBtn = elements.registerForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Registering...';

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, phone, password })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        showError(elements.registerError, data.error || 'Registration failed.');
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        return;
      }

      // Auto-login successful
      state.loggedIn = true;
      state.user = data.user;
      state.hasEntered = false;

      if (data.totalEntries !== undefined) {
        updateEntriesCountDisplay(data.totalEntries);
      }

      elements.registerForm.reset();
      closeAuthModal();
      renderUI();

      showToast(`Welcome ${data.user.name.split(' ')[0]}! You are logged in. Click "Enter Giveaway" below! 🎉`, 'success');

      // Scroll smoothly to Giveaway CTA
      elements.btnEnterGiveaway.scrollIntoView({ behavior: 'smooth', block: 'center' });
      elements.btnEnterGiveaway.classList.add('pulse-attention');
      setTimeout(() => elements.btnEnterGiveaway.classList.remove('pulse-attention'), 3000);

    } catch (err) {
      showError(elements.registerError, 'Network issue. Please try again.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  }

  // Handle Login
  async function handleLoginSubmit(e) {
    e.preventDefault();
    clearErrors();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
      showError(elements.loginError, 'Email aur password dono zaroori hain.');
      return;
    }

    const submitBtn = elements.loginForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in...';

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        showError(elements.loginError, data.error || 'Login failed.');
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        return;
      }

      // Success
      state.loggedIn = true;
      state.user = data.user;
      state.hasEntered = !!data.hasEntered;

      if (data.totalEntries !== undefined) {
        updateEntriesCountDisplay(data.totalEntries);
      }

      elements.loginForm.reset();
      closeAuthModal();
      renderUI();

      showToast(`Welcome back, ${data.user.name.split(' ')[0]}! ✨`, 'success');

    } catch (err) {
      showError(elements.loginError, 'Network issue. Please try again.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  }

  // Handle Logout
  async function handleLogout() {
    try {
      await fetch('/api/logout', { method: 'POST' });
      state.loggedIn = false;
      state.user = null;
      state.hasEntered = false;
      renderUI();
      showToast('Aap logout ho chuke hain.', 'info');
    } catch (err) {
      console.warn('Logout error:', err);
    }
  }

  /* ==========================================================================
     GIVEAWAY ENTRY LOGIC
     ========================================================================== */
  async function handleEnterGiveaway() {
    // If user is not logged in, prompt registration modal directly!
    if (!state.loggedIn) {
      showToast('Kripya pehle Register karein giveaway me participate karne ke liye.', 'error');
      openAuthModal('register');
      return;
    }

    // If already entered
    if (state.hasEntered) {
      showToast('Aap already is giveaway me enter kar chuke hain! Good luck! 🤞', 'info');
      return;
    }

    // Submit Entry
    const btn = elements.btnEnterGiveaway;
    const originalText = elements.btnEnterText.textContent;
    btn.disabled = true;
    elements.btnEnterText.innerHTML = '<span class="spinner"></span> Confirming Entry...';

    try {
      const res = await fetch('/api/enter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.alreadyEntered) {
          state.hasEntered = true;
          renderUI();
        }
        showToast(data.error || 'Entry confirm karne me samasya aayi.', 'error');
        elements.btnEnterText.textContent = originalText;
        btn.disabled = false;
        return;
      }

      // Success! Entry confirmed
      state.hasEntered = true;
      if (data.totalEntries !== undefined) {
        updateEntriesCountDisplay(data.totalEntries);
      }

      renderUI();

      // Launch Confetti Celebration!
      launchConfetti();

      showToast('🎉 Badhaai ho! Aapka giveaway entry confirm ho gaya hai!', 'success');

      // Refresh recent list
      fetchEntries();

    } catch (err) {
      showToast('Network error. Kripya dobara try karein.', 'error');
      elements.btnEnterText.textContent = originalText;
      btn.disabled = false;
    }
  }

  /* ==========================================================================
     ENTRIES FETCH & POLLING
     ========================================================================== */
  async function fetchEntries() {
    try {
      const res = await fetch('/api/entries');
      const data = await res.json();

      if (data.success && data.count !== undefined) {
        updateEntriesCountDisplay(data.count);

        if (data.recent && elements.recentEntriesList) {
          renderRecentEntries(data.recent);
        }
      }

      // Check announced winners
      checkPublicWinners();
    } catch (err) {
      // Quiet fail on polling network hiccup
    }
  }

  /* ==========================================================================
     PUBLIC WINNERS ANNOUNCEMENT
     ========================================================================== */
  let winnersAnnouncedState = false;

  async function checkPublicWinners() {
    try {
      const res = await fetch('/api/winners');
      const data = await res.json();
      if (data.success && data.announced && data.winners && data.winners.length > 0) {
        renderPublicWinners(data.winners);
        if (!winnersAnnouncedState) {
          winnersAnnouncedState = true;
          // Trigger confetti on announcement discovery
          launchConfetti();
        }
      } else {
        const section = document.getElementById('announcedWinnersSection');
        if (section) section.style.display = 'none';
        winnersAnnouncedState = false;
      }
    } catch (e) {}
  }

  function renderPublicWinners(winners) {
    const section = document.getElementById('announcedWinnersSection');
    const grid = document.getElementById('announcedWinnersGrid');
    if (!section || !grid) return;

    section.style.display = 'block';
    grid.innerHTML = winners.map((w, idx) => {
      const isSunil = (w.position === 1) || (w.user_name && w.user_name.toLowerCase().includes('sunil kumar'));
      return `
        <div class="winner-showcase-tile ${isSunil ? 'tile-sunil' : ''}">
          <div class="tile-rank-badge">
            ${isSunil ? '🥇 1st Prize Winner' : `🏅 Winner #${w.position || idx + 1}`}
          </div>
          <div class="tile-winner-name">
            ${escapeHtml(w.user_name)}
          </div>
          <div class="tile-winner-city">
            📍 ${escapeHtml(w.city || 'India')}
          </div>
          <div class="tile-prize-tag">
            Acer Aspire 7 (RTX 4050)
          </div>
          <div class="tile-verified-stamp">
            <span>✓ Verified Winner</span>
          </div>
        </div>
      `;
    }).join('');
  }

  function updateEntriesCountDisplay(newCount) {
    if (!elements.totalEntriesCounter) return;
    const current = state.totalEntries;
    state.totalEntries = newCount;

    if (current === newCount) {
      elements.totalEntriesCounter.textContent = newCount;
      return;
    }

    // Smooth count-up animation
    animateCounter(current, newCount, 600);
  }

  function animateCounter(start, end, duration) {
    const range = end - start;
    let current = start;
    const increment = end > start ? 1 : -1;
    const stepTime = Math.abs(Math.floor(duration / (range || 1)));
    
    // Scale bounce effect
    elements.totalEntriesCounter.style.transform = 'scale(1.15)';
    setTimeout(() => {
      elements.totalEntriesCounter.style.transform = 'scale(1)';
    }, 300);

    const timer = setInterval(() => {
      current += increment;
      elements.totalEntriesCounter.textContent = current;
      if (current === end) {
        clearInterval(timer);
      }
    }, Math.max(stepTime, 20));
  }

  function renderRecentEntries(recent) {
    elements.recentEntriesList.innerHTML = recent.map(item => `
      <li class="recent-item">
        <span>${escapeHtml(item.displayName)}</span>
        <span>Entered Just Now</span>
      </li>
    `).join('');
  }

  /* ==========================================================================
     RENDER UI STATES
     ========================================================================== */
  function renderUI() {
    // Nav User section
    if (state.loggedIn && state.user) {
      elements.navAuthLoggedOut.style.display = 'none';
      elements.navAuthLoggedIn.style.display = 'flex';
      elements.navUserName.textContent = state.user.name.split(' ')[0];
      elements.navUserAvatar.textContent = state.user.name.charAt(0).toUpperCase();

      if (elements.userStatusCard && elements.userStatusText) {
        elements.userStatusCard.style.display = 'block';
        if (state.hasEntered) {
          elements.userStatusText.innerHTML = `🟢 Logged in as <strong>${escapeHtml(state.user.name)}</strong>. You have <strong>1 Entry</strong> registered.`;
        } else {
          elements.userStatusText.innerHTML = `👋 Hello <strong>${escapeHtml(state.user.name)}</strong>! Click below to enter the Acer Aspire 7 giveaway.`;
        }
      }
    } else {
      elements.navAuthLoggedOut.style.display = 'flex';
      elements.navAuthLoggedIn.style.display = 'none';
      if (elements.userStatusCard) {
        elements.userStatusCard.style.display = 'none';
      }
    }

    // Big Enter CTA Button state
    if (state.hasEntered) {
      elements.btnEnterGiveaway.disabled = true;
      elements.btnEnterGiveaway.classList.add('btn-entered-state');
      elements.btnEnterText.innerHTML = 'Entered ✅';
    } else if (state.loggedIn) {
      elements.btnEnterGiveaway.disabled = false;
      elements.btnEnterGiveaway.classList.remove('btn-entered-state');
      elements.btnEnterText.innerHTML = '⚡ Enter Giveaway (Free)';
    } else {
      elements.btnEnterGiveaway.disabled = false;
      elements.btnEnterGiveaway.classList.remove('btn-entered-state');
      elements.btnEnterText.innerHTML = '⚡ Enter Giveaway';
    }
  }

  /* ==========================================================================
     FEEDBACK & NOTIFICATIONS (TOAST + CONFETTI)
     ========================================================================== */
  function showToast(message, type = 'info') {
    if (!elements.toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '🎉';
    if (type === 'error') icon = '⚠️';

    toast.innerHTML = `<span>${icon}</span> <div>${escapeHtml(message)}</div>`;
    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  }

  function showError(el, msg) {
    if (!el) return;
    el.textContent = msg;
    el.classList.add('visible');
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Lightweight Festive Confetti
  function launchConfetti() {
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#f59e0b', '#fbbf24', '#8b5cf6', '#6366f1', '#3b82f6', '#10b981', '#ffffff'];

    for (let i = 0; i < 120; i++) {
      particles.push({
        x: canvas.width / 2 + (Math.random() * 200 - 100),
        y: canvas.height * 0.45,
        w: Math.random() * 10 + 6,
        h: Math.random() * 6 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 16,
        vy: (Math.random() - 0.7) * 18,
        gravity: 0.35,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12,
        opacity: 1
      });
    }

    let frame = 0;
    function render() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frame++;

      let active = false;
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.vx *= 0.98;
        p.rotation += p.rotationSpeed;
        p.opacity -= 0.009;

        if (p.opacity > 0) {
          active = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.globalAlpha = Math.max(p.opacity, 0);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          ctx.restore();
        }
      });

      if (active && frame < 180) {
        requestAnimationFrame(render);
      } else {
        canvas.remove();
      }
    }

    requestAnimationFrame(render);
  }

  // Run init on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
