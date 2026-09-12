/* =========================================================
   CELESTIA: RETRO GAMES EDITION - INTERACTION SCRIPT
   - Web Audio API 8-Bit Synthesized Sound Effects
   - SPA Hash Router (#home, #register, #leaderboard)
   - Real-time Leaderboard Search & Empty State
   - Participant Login & Team Registration
   - CRT Scanline & Audio Settings
   ========================================================= */

// --- 1. RETRO 8-BIT SOUND SYNTHESIZER (WEB AUDIO API) ---
class RetroAudioEngine {
  constructor() {
    this.ctx = null;
    this.soundEnabled = true;
  }

  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    return this.soundEnabled;
  }

  // Classic 8-bit button blip
  playBlip() {
    if (!this.soundEnabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(480, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(240, this.ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch (e) {
      console.warn("Audio unavailable", e);
    }
  }

  // Iconic Mario-style coin chime (B-Ding!)
  playCoin() {
    if (!this.soundEnabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, now); // B5
      osc.frequency.setValueAtTime(1318.51, now + 0.09); // E6
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.setValueAtTime(0.15, now + 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    } catch (e) {
      console.warn(e);
    }
  }

  // Power Up / Start Realm Fanfare
  playGameStart() {
    if (!this.soundEnabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.09);
        gain.gain.setValueAtTime(0.12, this.ctx.currentTime + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.09 + 0.18);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + idx * 0.09);
        osc.stop(this.ctx.currentTime + idx * 0.09 + 0.19);
      });
    } catch (e) {
      console.warn(e);
    }
  }

  // Error Buzz
  playError() {
    if (!this.soundEnabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch (e) {
      console.warn(e);
    }
  }
}

const sfx = new RetroAudioEngine();

// --- 2. LEADERBOARD DATA (DEFAULT TEAMS) ---
const INITIAL_LEADERBOARD_TEAMS = [
  { rank: 1, teamName: "PIXEL PALADINS", members: "Alex, Sam, Ray", pointsBet: 2500, score: 98450 },
  { rank: 2, teamName: "BYTE BANDITS", members: "Neo, Trinity, Cipher", pointsBet: 1800, score: 87200 },
  { rank: 3, teamName: "CYBER NINJAS", members: "Ryu, Hayabusa, Joe", pointsBet: 1500, score: 76900 },
  { rank: 4, teamName: "1-UP LEGENDS", members: "Mario, Luigi, Peach", pointsBet: 1200, score: 65400 },
  { rank: 5, teamName: "VOXEL VANGUARD", members: "Steve, Alex, Kai", pointsBet: 950, score: 54100 },
  { rank: 6, teamName: "GLITCH WIZARDS", members: "Zero, Mega, Proto", pointsBet: 800, score: 43800 },
  { rank: 7, teamName: "NEON RIDERS", members: "Dash, Sonic, Tails", pointsBet: 650, score: 38250 },
  { rank: 8, teamName: "ARCADE ASSASSINS", members: "Ken, Guile, Chun-Li", pointsBet: 500, score: 31100 }
];

let currentTeams = [...INITIAL_LEADERBOARD_TEAMS];

// --- 3. DOM ELEMENTS & APPLICATION STATE ---
document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const views = {
    home: document.getElementById("view-home"),
    register: document.getElementById("view-register"),
    leaderboard: document.getElementById("view-leaderboard")
  };

  const navLinks = document.querySelectorAll("[data-nav-target]");
  const searchInput = document.getElementById("leaderboard-search");
  const leaderboardTbody = document.getElementById("leaderboard-tbody");
  const loginForm = document.getElementById("loginForm");
  const formFeedback = document.getElementById("formFeedback");
  const toggleFormModeBtn = document.getElementById("toggleFormMode");
  const participantCardTitle = document.getElementById("participantCardTitle");
  const submitLoginBtn = document.getElementById("submitLoginBtn");
  
  // HUD controls
  const toggleAudioBtn = document.getElementById("toggleAudioBtn");
  const toggleCrtBtn = document.getElementById("toggleCrtBtn");
  const crtOverlay = document.getElementById("crtOverlay");
  
  // Drawer
  const hamburgerBtn = document.getElementById("hamburgerBtn");
  const arcadeDrawer = document.getElementById("arcadeDrawer");
  const drawerOverlay = document.getElementById("drawerOverlay");
  const closeDrawerBtn = document.getElementById("closeDrawerBtn");

  // Mascots
  const heroMascot = document.getElementById("heroMascot");
  const heroBubble = document.getElementById("heroBubble");
  const ghostMascot = document.getElementById("ghostMascot");

  // State
  let isRegisterMode = false;
  let loggedInTeam = null;

  // --- 4. ROUTER ENGINE ---
  function navigateTo(route) {
    sfx.playBlip();
    const targetRoute = route ? route.replace("#", "") : "home";
    const activeRoute = views[targetRoute] ? targetRoute : "home";

    // Hide all views
    Object.keys(views).forEach(v => {
      if (views[v]) {
        views[v].classList.remove("active");
      }
    });

    // Show target view
    if (views[activeRoute]) {
      views[activeRoute].classList.add("active");
    }

    // Update active nav links
    navLinks.forEach(link => {
      const linkRoute = link.getAttribute("data-nav-target");
      if (linkRoute === activeRoute) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });

    // Close drawer if open
    closeDrawer();

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Update URL hash without reload
    if (window.location.hash !== `#${activeRoute}`) {
      window.location.hash = activeRoute;
    }
  }

  // Handle URL hash changes
  window.addEventListener("hashchange", () => {
    navigateTo(window.location.hash);
  });

  // Handle click on all route buttons
  document.querySelectorAll("[data-route]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const target = btn.getAttribute("data-route");
      if (target === "home" || target === "register" || target === "leaderboard") {
        navigateTo(target);
      }
    });
  });

  // Top Nav Click Handlers
  navLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const target = link.getAttribute("data-nav-target");
      navigateTo(target);
    });
  });

  // "ENTER THE REALM" Button Special Handler
  const enterRealmBtn = document.getElementById("btnEnterRealm");
  if (enterRealmBtn) {
    enterRealmBtn.addEventListener("click", (e) => {
      e.preventDefault();
      sfx.playGameStart();
      setTimeout(() => {
        navigateTo("leaderboard");
      }, 200);
    });
  }

  // --- 5. LEADERBOARD RENDERING & SEARCH ---
  function renderLeaderboard(filterText = "") {
    if (!leaderboardTbody) return;

    const term = filterText.trim().toLowerCase();
    const filtered = currentTeams.filter(t => 
      t.teamName.toLowerCase().includes(term) ||
      t.members.toLowerCase().includes(term)
    );

    if (filtered.length === 0) {
      // Authentic empty state matching screenshot 3
      leaderboardTbody.innerHTML = `
        <tr>
          <td colspan="5" class="empty-state-row">
            <div class="no-teams-message">
              <span>✦</span> NO TEAMS TO DISPLAY <span>✦</span>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    leaderboardTbody.innerHTML = filtered.map(t => {
      let rankClass = "rank-other";
      let rankIcon = `#${t.rank}`;
      if (t.rank === 1) {
        rankClass = "rank-1";
        rankIcon = `👑 1`;
      } else if (t.rank === 2) {
        rankClass = "rank-2";
        rankIcon = `🥈 2`;
      } else if (t.rank === 3) {
        rankClass = "rank-3";
        rankIcon = `🥉 3`;
      }

      return `
        <tr>
          <td><span class="rank-badge ${rankClass}">${rankIcon}</span></td>
          <td style="font-weight: bold; color: #fff;">${escapeHtml(t.teamName)}</td>
          <td>${escapeHtml(t.members)}</td>
          <td class="points-bet-cell">${t.pointsBet.toLocaleString()}</td>
          <td class="score-cell">${t.score.toLocaleString()} PTS</td>
        </tr>
      `;
    }).join("");
  }

  // Live search input
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      renderLeaderboard(e.target.value);
    });
  }

  // --- 6. PARTICIPANT LOGIN & REGISTRATION ---
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const teamNameInput = document.getElementById("teamNameInput");
      const teamIdInput = document.getElementById("teamIdInput");
      const teamMembersInput = document.getElementById("teamMembersInput");

      const name = teamNameInput ? teamNameInput.value.trim() : "";
      const id = teamIdInput ? teamIdInput.value.trim() : "";
      const members = teamMembersInput ? teamMembersInput.value.trim() : "";

      if (!name || !id) {
        sfx.playError();
        showFeedback("ERROR: TEAM NAME & ID REQUIRED!", "error");
        return;
      }

      if (isRegisterMode) {
        // Register new team
        const newTeam = {
          rank: currentTeams.length + 1,
          teamName: name.toUpperCase(),
          members: members || "Player 1, Player 2",
          pointsBet: 1000,
          score: 10000
        };
        currentTeams.push(newTeam);
        sfx.playCoin();
        showFeedback(`REGISTRATION COMPLETE! WELCOME ${name.toUpperCase()}!`, "success");
        if (heroBubble) heroBubble.innerText = `READY ${name.toUpperCase()}!`;
        renderLeaderboard();
        setTimeout(() => {
          navigateTo("leaderboard");
        }, 1200);
      } else {
        // Participant Login
        sfx.playCoin();
        loggedInTeam = name.toUpperCase();
        showFeedback(`LOGGED IN AS [${loggedInTeam}]! ACCESS GRANTED`, "success");
        if (heroBubble) heroBubble.innerText = `LEVEL UP ${loggedInTeam}!`;
        setTimeout(() => {
          navigateTo("leaderboard");
        }, 1200);
      }
    });
  }

  function showFeedback(msg, type) {
    if (!formFeedback) return;
    formFeedback.innerText = msg;
    formFeedback.className = `form-feedback ${type}`;
    setTimeout(() => {
      formFeedback.className = "form-feedback";
    }, 4000);
  }

  // Switch between Login and Register Mode
  if (toggleFormModeBtn) {
    toggleFormModeBtn.addEventListener("click", () => {
      sfx.playBlip();
      isRegisterMode = !isRegisterMode;
      const membersGroup = document.getElementById("membersFormGroup");
      if (isRegisterMode) {
        participantCardTitle.innerText = "REGISTER NEW TEAM";
        submitLoginBtn.innerHTML = `<span>🪙</span> REGISTER NOW`;
        toggleFormModeBtn.innerText = "Already registered? Login here";
        if (membersGroup) membersGroup.style.display = "flex";
      } else {
        participantCardTitle.innerText = "PARTICIPANT LOGIN";
        submitLoginBtn.innerHTML = `<span>🪙</span> LOGIN`;
        toggleFormModeBtn.innerText = "New team? Register here";
        if (membersGroup) membersGroup.style.display = "none";
      }
    });
  }

  // --- 7. MASCOT INTERACTION EASTER EGGS ---
  const heroQuotes = [
    "READY PLAYER ONE!",
    "INSERT COIN TO CONTINUE!",
    "LEVEL 99 RETRO HERO!",
    "IT'S DANGEROUS TO GO ALONE!",
    "HIGH SCORE INCOMING!"
  ];
  let heroQuoteIdx = 0;

  if (heroMascot && heroBubble) {
    heroMascot.addEventListener("click", () => {
      sfx.playCoin();
      heroQuoteIdx = (heroQuoteIdx + 1) % heroQuotes.length;
      heroBubble.innerText = heroQuotes[heroQuoteIdx];
    });
  }

  if (ghostMascot) {
    ghostMascot.addEventListener("click", () => {
      sfx.playCoin();
      ghostMascot.style.transform = "scale(1.15) rotate(15deg)";
      setTimeout(() => {
        ghostMascot.style.transform = "";
      }, 300);
    });
  }

  // --- 8. CRT SCANLINES & AUDIO TOGGLES ---
  if (toggleAudioBtn) {
    toggleAudioBtn.addEventListener("click", () => {
      const enabled = sfx.toggleSound();
      toggleAudioBtn.innerText = enabled ? "🔊 SFX: ON" : "🔇 SFX: OFF";
      if (enabled) sfx.playCoin();
    });
  }

  if (toggleCrtBtn && crtOverlay) {
    toggleCrtBtn.addEventListener("click", () => {
      sfx.playBlip();
      crtOverlay.classList.toggle("disabled");
      toggleCrtBtn.innerText = crtOverlay.classList.contains("disabled") 
        ? "📺 CRT: OFF" 
        : "📺 CRT: ON";
    });
  }

  // --- 9. HAMBURGER SLIDE DRAWER ---
  function openDrawer() {
    sfx.playBlip();
    if (arcadeDrawer) arcadeDrawer.classList.add("open");
    if (drawerOverlay) drawerOverlay.classList.add("open");
  }

  function closeDrawer() {
    if (arcadeDrawer) arcadeDrawer.classList.remove("open");
    if (drawerOverlay) drawerOverlay.classList.remove("open");
  }

  if (hamburgerBtn) hamburgerBtn.addEventListener("click", openDrawer);
  if (closeDrawerBtn) closeDrawerBtn.addEventListener("click", () => {
    sfx.playBlip();
    closeDrawer();
  });
  if (drawerOverlay) drawerOverlay.addEventListener("click", closeDrawer);

  document.querySelectorAll(".drawer-nav-link").forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const target = link.getAttribute("data-nav-target");
      if (target) {
        navigateTo(target);
      }
    });
  });

  // Helpers
  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, m => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    })[m]);
  }

  // --- 10. INITIAL SETUP ---
  renderLeaderboard();
  
  // Set initial route based on hash, or default to home
  const initialHash = window.location.hash || "#home";
  navigateTo(initialHash);
});
