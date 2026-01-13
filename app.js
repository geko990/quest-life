/* ============================================
   QUEST LIFE - RPG Habit Tracker v2
   Complete Application Logic
   ============================================ */

const APP_VERSION = "0.8.0.0";

// ============================================
// DATA STRUCTURES
// ============================================

const DEFAULT_ATTRIBUTES = [
    { id: 'str', name: 'Forza', icon: '💪', description: 'Forza fisica e mentale. Esercizio, resistenza, disciplina e capacità di affrontare sfide difficili.', type: 'attribute', visible: true, level: 1, xp: 0 },
    { id: 'dex', name: 'Destrezza', icon: '⚡', description: 'Agilità e velocità. Produttività, adattamento e rapidità decisionale. Multitasking efficiente.', type: 'attribute', visible: true, level: 1, xp: 0 },
    { id: 'con', name: 'Costituzione', icon: '🛡️', description: 'Salute e resistenza. Alimentazione, sonno, gestione stress e cura del corpo.', type: 'attribute', visible: true, level: 1, xp: 0 },
    { id: 'int', name: 'Intelligenza', icon: '🧠', description: 'Apprendimento e problem solving. Studio, lettura, pensiero critico. Include l\'empatia cognitiva.', type: 'attribute', visible: true, level: 1, xp: 0 },
    { id: 'wis', name: 'Saggezza', icon: '✨', description: 'Intuizione e consapevolezza. Mindfulness, riflessione, decisioni allineate ai tuoi valori.', type: 'attribute', visible: true, level: 1, xp: 0 },
    { id: 'cha', name: 'Carisma', icon: '👑', description: 'Presenza e comunicazione. Leadership, networking, public speaking e capacità di ispirare.', type: 'attribute', visible: true, level: 1, xp: 0 }
];

const DEFAULT_ABILITIES = [
    { id: 'cre', name: 'Creatività', icon: '🎨', description: 'Immaginazione e creazione. Arte, musica, scrittura, design e innovazione.', type: 'ability', visible: false, level: 1, xp: 0 }
];

const AVATAR_EMOJIS = ['⚔️', '🗡️', '🏹', '🛡️', '👑', '🧙', '🧝', '🧚', '🦸', '🦹', '🥷', '🧑‍🚀', '👤', '🐉', '🦅', '🐺', '🦁', '🐻', '🌟', '💎', '🔥', '❄️', '⚡', '🌙'];

const ACCENT_COLORS = ['violet', 'blue', 'indigo', 'cyan', 'teal', 'emerald', 'gold', 'orange', 'rose', 'pink'];

const XP_CONFIG = {
    baseXpPerLevel: 100,
    levelMultiplier: 1.5,
    starsMultiplier: { 1: 0.5, 2: 0.75, 3: 1, 4: 1.5, 5: 2 },
    secondaryRatio: 0.33
};

const TITLES = [
    { level: 1, title: 'Novizio' }, { level: 5, title: 'Apprendista' }, { level: 10, title: 'Avventuriero' },
    { level: 15, title: 'Veterano' }, { level: 20, title: 'Esperto' }, { level: 25, title: 'Maestro' },
    { level: 30, title: 'Campione' }, { level: 40, title: 'Leggenda' }, { level: 50, title: 'Eroe' }
];

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

// ============================================
// APP STATE
// ============================================

let state = {
    player: {
        name: 'Avventuriero',
        motto: '', // New motto field
        level: 1,
        totalXp: 0,
        globalStreak: 0,
        lastAccessDate: null,
        lastActionDate: null, // Last task completion date
        streakFreezes: 2, // Default freezes
        lastFreezeReset: null, // Date of last freezes reset
        avatarType: 'emoji',
        avatarEmoji: '⚔️',
        avatarImage: null
    },
    stats: [...DEFAULT_ATTRIBUTES.map(a => ({ ...a })), ...DEFAULT_ABILITIES.map(a => ({ ...a }))],
    habits: [],
    oneshots: [],
    quests: [],
    toxicItems: [], // New for "Zaino Tossico"
    completionLog: {},
    xpLog: [], // Log di XP guadagnato: [{date, statId, amount}]
    pomodoro: {
        workDuration: 25,
        targetStatId: 'int',
        xpPerSession: 20,
        sessionsToday: 0,
        lastSessionDate: null
    },
    lastRecapWeek: null, // Week ID when last recap was shown
    settings: { theme: 'light', accent: 'violet', dayStartTime: 0 }
};

function getGameDateObj() {
    const now = new Date();
    const startHour = state && state.settings ? (parseInt(state.settings.dayStartTime) || 0) : 0;
    return new Date(now.getTime() - startHour * 60 * 60 * 1000);
}

function formatISO(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getGameDate() {
    return formatISO(getGameDateObj());
}

function getGameDateString() {
    return getGameDateObj().toDateString();
}

// Helpers for periodic habits
function getWeekIdentifier(dateStr) {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
}

function getMonthIdentifier(dateStr) {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
}

function getYearIdentifier(dateStr) {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return `${date.getFullYear()}`;
}

let radarChart = null;
let contextTarget = null;
let longPressTimer = null;
let lastPointerX = 0;
let lastPointerY = 0;
let swipeStartX = 0;
let currentSwipeCard = null;
let editingItem = null;
let viewedDate = getGameDate();
let profilePopupTimer = null; // reused or new logic for toggle

// Pomodoro Timer
let pomodoroInterval = null;
let pomodoroTimeLeft = 25 * 60; // seconds
let pomodoroRunning = false;

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    loadState();
    checkFrozenStreak(); // New freeze logic
    initNavigation();
    initSettings();
    initColorPicker();
    initSwipe();
    initVisibilityPopup();
    initNavSwipe(); // New Liquid Glass Nav
    renderAll();

    // Check for weekly recap (Sunday)
    setTimeout(() => checkWeeklyRecap(), 1000);

    // Set version in UI and handle PWA update force
    const versionEl = document.getElementById('appVersion');
    if (versionEl) {
        versionEl.textContent = APP_VERSION;

        // Help PWA update: if stored version is different, attempt a hard reload
        // and update the stored version.
        const storedVersion = localStorage.getItem('questlife_app_version');
        if (storedVersion && storedVersion !== APP_VERSION) {
            console.log("New version detected, updating PWA cache...");
            localStorage.setItem('questlife_app_version', APP_VERSION);

            // Unregister SW and reload to be extra aggressive for iOS PWA
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(registrations => {
                    for (let registration of registrations) registration.unregister();
                    setTimeout(() => location.reload(true), 100);
                });
            } else {
                location.reload(true);
            }
        } else if (!storedVersion) {
            localStorage.setItem('questlife_app_version', APP_VERSION);
        }
    }

    // Refresh when app comes back to foreground (handles day change while app was in background)
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            const newDate = getGameDate();
            if (newDate !== viewedDate) {
                viewedDate = newDate;
                renderAll();
            }
        }
    });
});

function loadState() {
    // Try to load from new key first
    let saved = localStorage.getItem('questlife_state_v2');

    // If not found, try to migrate from old key
    if (!saved) {
        const oldSaved = localStorage.getItem('questlife_state');
        if (oldSaved) {
            saved = oldSaved;
            localStorage.setItem('questlife_state_v2', oldSaved);
            localStorage.removeItem('questlife_state');
            console.log('✅ Dati migrati con successo!');
        }
    }

    if (saved) {
        try {
            const parsed = JSON.parse(saved);

            // Merge parsed data, but keep defaults for missing properties
            state.player = { ...state.player, ...parsed.player };
            // Ensure motto exists if not present in saved data
            if (state.player.motto === undefined) state.player.motto = '';
            // Ensure new fields exist
            if (state.player.streakFreezes === undefined) state.player.streakFreezes = 2;
            if (state.player.lastActionDate === undefined) state.player.lastActionDate = null;
            if (state.player.lastFreezeReset === undefined) state.player.lastFreezeReset = null;
            state.habits = parsed.habits || [];
            state.oneshots = parsed.oneshots || [];
            state.quests = parsed.quests || [];
            state.toxicItems = parsed.toxicItems || [];

            // Migration: Add createdAt to habits that don't have it
            const migrationDate = new Date().toISOString();
            state.habits.forEach(h => {
                if (!h.createdAt) h.createdAt = migrationDate;
            });
            state.oneshots.forEach(o => {
                if (!o.createdAt) o.createdAt = migrationDate;
            });
            state.quests.forEach(q => {
                if (!q.createdAt) q.createdAt = migrationDate;
            });
            state.toxicItems.forEach(t => {
                if (!t.createdAt) t.createdAt = migrationDate;
            });

            // Deduplicate IDs just in case
            ensureUniqueIds(state.habits, 'habit');
            ensureUniqueIds(state.oneshots, 'oneshot');
            ensureUniqueIds(state.quests, 'quest');

            state.completionLog = parsed.completionLog || {};
            state.xpLog = parsed.xpLog || []; // Log XP mensile
            state.settings = { ...state.settings, ...parsed.settings };

            // Migrate pomodoro settings
            if (parsed.pomodoro) {
                state.pomodoro = { ...state.pomodoro, ...parsed.pomodoro };
            }
            // Reset session counter if new day
            const today = getGameDateString();
            if (state.pomodoro.lastSessionDate !== today) {
                state.pomodoro.sessionsToday = 0;
            }

            // Ensure dayStartTime exists
            if (state.settings.dayStartTime === undefined) state.settings.dayStartTime = 0;

            // Update viewedDate based on loaded settings
            viewedDate = getGameDate();

            // Handle stats specially - only use saved if it exists and has items
            if (parsed.stats && Array.isArray(parsed.stats) && parsed.stats.length > 0) {
                // Ensure all stats have the 'type' property
                state.stats = parsed.stats.map(stat => {
                    if (!stat.type) {
                        return { ...stat, type: 'attribute' };
                    }
                    return stat;
                });
            }
            // If no saved stats, keep the initialized defaults

        } catch (e) {
            console.error('Errore nel caricamento dati:', e);
            // Keep default state
        }
    }

    // Always ensure all default attributes exist
    DEFAULT_ATTRIBUTES.forEach(defaultStat => {
        if (!state.stats.find(s => s.id === defaultStat.id)) {
            state.stats.push({ ...defaultStat });
        }
    });

    // Apply theme
    applyTheme();

    // Save to ensure clean state
    saveState();
}

function saveState() {
    localStorage.setItem('questlife_state_v2', JSON.stringify(state));
}

function checkFrozenStreak() {
    const today = getGameDateObj();
    const todayStr = today.toDateString();

    // 1. Reset Freezes on 1st of month
    const currentMonth = today.getFullYear() + '-' + (today.getMonth() + 1);
    if (state.player.lastFreezeReset !== currentMonth) {
        state.player.streakFreezes = 2; // Restore to 2
        state.player.lastFreezeReset = currentMonth;
        console.log('❄️ Congelamenti ripristinati per il nuovo mese!');
    }

    if (!state.player.lastActionDate) {
        saveState();
        return;
    }

    // Calculate days difference
    const lastDate = new Date(state.player.lastActionDate);
    // Reset time components for accurate day diff
    const d1 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const d2 = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
    const diffTime = Math.abs(d1 - d2);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) {
        // Did action today or yesterday: Streak Safe
        // Do nothing
    } else if (diffDays === 2) {
        // Missed exactly 1 day (yesterday)
        if (state.player.streakFreezes > 0) {
            state.player.streakFreezes--;
            console.log('❄️ Congelamento usato! Serie salvata.');
            // We pretend we did something yesterday to bridge the gap?
            // Ideally we just don't reset. But we need to update date?
            // No, getting back on track today will fix the gap.
            // We just notify user? Or visually indicate freeze usage?
        } else {
            console.log('💔 Serie persa! Nessun congelamento rimasto.');
            state.player.globalStreak = 0;
        }
    } else {
        // Missed > 1 day: Streak broken regardless of freezes
        console.log('💔 Serie persa! Troppi giorni saltati.');
        state.player.globalStreak = 0;
    }

    saveState();
}

function recordActivity() {
    const today = getGameDateString();

    // If we haven't done anything today yet
    if (state.player.lastActionDate !== today) {
        // Updates streak if logic allows
        const lastDate = state.player.lastActionDate ? new Date(state.player.lastActionDate) : null;

        // Logic for streak increment (checkFrozenStreak handles breaks elsewhere)
        state.player.globalStreak++;
        state.player.lastActionDate = today;

        saveState();
        renderHeader();

        // CELEBRATION! 🎉
        // Only show if streak > 0.
        if (state.player.globalStreak > 0) {
            showStreakCelebration(state.player.globalStreak);
        }

        // Also update popup if open
        const popupCount = document.getElementById('popupStreakCount');
        if (popupCount) popupCount.textContent = state.player.globalStreak;
    } else {
        // Even if we have done something today, we might need to force a render if this is a re-check
        // But toggleHabit now calls renderHeader explicitly.
    }
}

function checkUndoActivity() {
    const today = getGameDateString();

    // Check if ANY habit is still completed today
    const hasHabit = state.habits.some(h => h.lastCompleted === today);
    const hasOneShot = state.oneshots.some(o => o.completed && !o.locked); // Loose check for oneshots since we track valid ones

    // If we have active habits today, do nothing (streak stays valid)
    if (hasHabit) return;

    // If no habits done today, safe revert if the last action WAS today
    if (state.player.lastActionDate === today) {
        state.player.globalStreak = Math.max(0, state.player.globalStreak - 1);

        // Set date back to yesterday to allow "re-completing" to trigger streak++ again
        const yest = getGameDateObj();
        yest.setDate(yest.getDate() - 1);
        state.player.lastActionDate = yest.toDateString();

        saveState();
        renderHeader();
    }
}

// Streak Popup Logic
function toggleStreakPopup() {
    const popup = document.getElementById('streakPopup');
    if (!popup) return;

    if (popup.classList.contains('hidden')) {
        renderStreakPopup();
        popup.classList.remove('hidden');

        setTimeout(() => {
            document.addEventListener('click', closeStreakPopupOutside);
        }, 100);
    } else {
        popup.classList.add('hidden');
        document.removeEventListener('click', closeStreakPopupOutside);
    }
}

function closeStreakPopupOutside(e) {
    const popup = document.getElementById('streakPopup');
    if (popup && !popup.contains(e.target) && !e.target.closest('#headerStreak') && !e.target.closest('.modal')) {
        popup.classList.add('hidden');
        document.removeEventListener('click', closeStreakPopupOutside);
    }
}

function renderStreakPopup() {
    const pStreak = document.getElementById('popupStreakCount');
    const pFreeze = document.getElementById('popupFreezeCount');

    if (pStreak) pStreak.textContent = state.player.globalStreak;
    if (pFreeze) pFreeze.textContent = state.player.streakFreezes;
}

// ============================================
// NAVIGATION
// ============================================

let navSwipeStart = null;
let navTargetSection = null;

function initNavigation() {
    // Basic initialization for nav bubble
    setTimeout(() => {
        const activeItem = document.querySelector('.nav-item.active');
        if (activeItem) updateBubblePosition(activeItem);
    }, 500);
}

function initNavSwipe() {
    const nav = document.getElementById('bottomNav');
    const bubble = document.getElementById('navBubble');
    if (!nav || !bubble) return;

    let hasMoved = false;

    nav.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        navSwipeStart = { x: touch.clientX, time: Date.now() };
        hasMoved = false;
        // Don't add 'swiping' class yet - wait for movement
    }, { passive: true });

    nav.addEventListener('touchmove', (e) => {
        if (!navSwipeStart) return;
        const touch = e.touches[0];
        const rect = nav.getBoundingClientRect();

        // Only activate bubble after some movement
        if (!hasMoved && Math.abs(touch.clientX - navSwipeStart.x) > 10) {
            hasMoved = true;
            nav.classList.add('swiping');
        }

        if (!hasMoved) return;

        // Move bubble based on touch X
        let x = touch.clientX - rect.left;
        x = Math.max(25, Math.min(rect.width - 25, x));
        bubble.style.transform = `translateX(${x - 25}px)`;

        // Find nearest icon by position comparison
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('bubble-near');
            const itemRect = item.getBoundingClientRect();
            const itemCenterX = itemRect.left + itemRect.width / 2;
            const distance = Math.abs(touch.clientX - itemCenterX);

            if (distance < 35) {
                item.classList.add('bubble-near');
                const section = item.dataset.section;
                if (section) navTargetSection = section;
            }
        });
    }, { passive: true });

    nav.addEventListener('touchend', () => {
        // Clear all reactive states
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('bubble-near'));

        if (hasMoved && navTargetSection) {
            switchSection(navTargetSection);
        }

        // Just remove swiping class - bubble fades in place
        nav.classList.remove('swiping');
        navSwipeStart = null;
        navTargetSection = null;
        hasMoved = false;
    });
}

function updateBubblePosition(navItem) {
    const bubble = document.getElementById('navBubble');
    const nav = document.getElementById('bottomNav');
    if (!bubble || !nav || !navItem) return;

    const navRect = nav.getBoundingClientRect();
    const itemRect = navItem.getBoundingClientRect();
    const x = (itemRect.left - navRect.left) + (itemRect.width / 2);

    bubble.style.transform = `translate3d(${x - 25}px, -50%, 0)`;
}

function switchSection(sectionName) {
    document.querySelectorAll('.nav-item').forEach(item => {
        // Toggle active based on onclick attribute content or manually set active class logic
        // Easier: remove active from all, then add to the clicked one.
        // But since we pass sectionName, we need to find the link that calls this section.
        // Simpler approach: Just manage sections here, and let the click handler manage the nav item style if possible.
        // Or better: update based on the sectionName passed.

        // This logic is tricky if items don't have data-section anymore.
        // Let's rely on the fact that we can just update visual state.
    });

    // Actually, distinct active state for nav items is hard without unique IDs or data-attributes.
    // Let's re-add data-section to HTML for styling matching, OR just select by href/onclick content? Use data-section in HTML for style mapping.

    document.querySelectorAll('.nav-item').forEach(item => {
        const isActive = item.dataset.section === sectionName;
        item.classList.toggle('active', isActive);
        if (isActive) updateBubblePosition(item);
    });

    document.querySelectorAll('.section').forEach(section => {
        section.classList.toggle('active', section.id === `section-${sectionName}`);
    });

    if (sectionName === 'home') setTimeout(() => renderRadarChart(), 100);

    // Gestione scroll per sezione
    const container = document.querySelector('.content-area');
    if (sectionName === 'habits') {
        renderCalendar();
        // Scroll per nascondere il calendario - delay per garantire render completo
        setTimeout(() => {
            const calendar = document.getElementById('calendarContainer');
            const habitsWrapper = document.querySelector('.habits-wrapper');

            if (container && calendar && habitsWrapper) {
                // Calcola la distanza esatta usando getBoundingClientRect
                // Sottrai 7px per allineare l'header con le altre sezioni
                const calendarRect = calendar.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();
                const scrollAmount = calendarRect.bottom - containerRect.top + container.scrollTop - 7;
                container.scrollTop = scrollAmount;
            }
        }, 150);
    } else {
        // Reset scroll per tutte le altre sezioni
        if (container) {
            container.scrollTop = 0;
        }
    }
}

// ============================================
// RENDERING
// ============================================

function renderAll() {
    renderHeader(); // Handles header avatar + level + streak
    renderRadarChart();
    renderStatsGrid();
    renderHabits();
    renderOneshots();
    renderQuests();
    renderSettingsStats();
    renderCalendar();
}

function renderHeader() {
    // 1. Streak
    const streakEl = document.getElementById('globalStreak');
    const streakIcon = document.getElementById('headerStreak');

    if (streakEl) streakEl.textContent = state.player.globalStreak;

    if (streakIcon) {
        const today = getGameDateString();
        const isActive = state.player.lastActionDate === today;

        if (isActive) {
            streakIcon.classList.remove('grayscale');
        } else {
            streakIcon.classList.add('grayscale');
        }
    }

    // 2. Header Avatar & Level
    const headerEmoji = document.getElementById('headerEmoji');
    const headerImg = document.getElementById('headerImg');
    const headerLevel = document.getElementById('headerLevel');
    const navAvatar = document.getElementById('navAvatar');

    if (headerLevel) {
        headerLevel.textContent = state.player.level;

        if (state.player.avatarType === 'image' && state.player.avatarImage) {
            headerEmoji.classList.add('hidden');
            headerImg.classList.remove('hidden');
            headerImg.src = state.player.avatarImage;

            // Also update Nav Avatar
            if (navAvatar) navAvatar.innerHTML = `<img class="nav-avatar-img" src="${state.player.avatarImage}" alt="">`;
        } else {
            headerEmoji.classList.remove('hidden');
            headerImg.classList.add('hidden');
            headerEmoji.textContent = state.player.avatarEmoji || '⚔️';

            // Also update Nav Avatar
            if (navAvatar) navAvatar.textContent = state.player.avatarEmoji || '⚔️';
        }
    }
}

// Profile Popup Logic
function toggleProfilePopup() {
    const popup = document.getElementById('profilePopup');
    if (!popup) return;

    if (popup.classList.contains('hidden')) {
        renderProfilePopup();
        popup.classList.remove('hidden');

        // Add click outside listener
        setTimeout(() => {
            document.addEventListener('click', closeProfilePopupOutside);
        }, 100);
    } else {
        popup.classList.add('hidden');
        document.removeEventListener('click', closeProfilePopupOutside);
    }
}

function closeProfilePopupOutside(e) {
    const popup = document.getElementById('profilePopup');
    if (popup && !popup.contains(e.target) && !e.target.closest('.header-profile') && !e.target.closest('.modal')) {
        popup.classList.add('hidden');
        document.removeEventListener('click', closeProfilePopupOutside);
    }
}

function renderProfilePopup() {
    // Basic Info
    const pEmoji = document.getElementById('popupEmoji');
    const pImg = document.getElementById('popupImg');
    const pName = document.getElementById('popupName');
    const pLevel = document.getElementById('popupLevel');
    const pTitle = document.getElementById('popupTitle');
    const pMotto = document.getElementById('popupMottoDisplay');

    if (state.player.avatarType === 'image' && state.player.avatarImage) {
        pEmoji.classList.add('hidden');
        pImg.classList.remove('hidden');
        pImg.src = state.player.avatarImage;
    } else {
        pEmoji.classList.remove('hidden');
        pImg.classList.add('hidden');
        pEmoji.textContent = state.player.avatarEmoji || '⚔️';
    }

    if (pName) pName.textContent = state.player.name;
    if (pLevel) pLevel.textContent = state.player.level;
    if (pTitle) pTitle.textContent = getPlayerTitle();

    // Motto Logic
    if (pMotto) {
        const text = state.player.motto || '"Il tuo motto qui..."';
        pMotto.textContent = text;
        pMotto.style.opacity = state.player.motto ? '1' : '0.7';
    }

    // XP Bar
    const xpFill = document.getElementById('popupXpFill');
    const xpText = document.getElementById('popupXpText');
    const nextLevelXp = getXpForLevel(state.player.level + 1);
    const xpPercent = Math.min(100, (state.player.totalXp / nextLevelXp) * 100);

    if (xpFill) xpFill.style.width = `${xpPercent}%`;
    if (xpText) xpText.textContent = `${state.player.totalXp} / ${nextLevelXp} XP`;
}

function saveMotto(val) {
    state.player.motto = val;
    saveState();
}

// Motto Modal Functions
function openMottoEdit() {
    const modal = document.getElementById('mottoEditModal');
    const input = document.getElementById('mottoEditInput');
    if (modal && input) {
        input.value = state.player.motto || '';
        modal.classList.add('active');
        setTimeout(() => input.focus(), 50);
    }
}

function closeMottoEdit() {
    const modal = document.getElementById('mottoEditModal');
    if (modal) modal.classList.remove('active');
}

function confirmMottoEdit() {
    const input = document.getElementById('mottoEditInput');
    if (input) {
        saveMotto(input.value.trim());
        renderProfilePopup();
        closeMottoEdit();
    }
}

function getPlayerTitle() {
    let title = TITLES[0].title;
    for (const t of TITLES) {
        if (state.player.level >= t.level) title = t.title;
    }
    return title;
}

function getMonthlyXpByStats() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Filtra i log del mese corrente
    const monthlyLogs = state.xpLog.filter(log => {
        const logDate = new Date(log.date);
        return logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear;
    });

    // Aggrega XP per statId
    const xpByStats = {};
    monthlyLogs.forEach(log => {
        if (!xpByStats[log.statId]) {
            xpByStats[log.statId] = 0;
        }
        xpByStats[log.statId] += log.amount;
    });

    return xpByStats;
}

function renderRadarChart() {
    if (typeof Chart === 'undefined') return;
    const ctx = document.getElementById('statsRadar');
    if (!ctx) return;

    const visibleStats = state.stats.filter(s => s.visible);
    if (visibleStats.length === 0) return;

    // Calcola XP mensile per stat
    const monthlyXp = getMonthlyXpByStats();
    const monthlyData = visibleStats.map(s => monthlyXp[s.id] || 0);
    const maxMonthlyXp = Math.max(50, ...monthlyData); // Minimo 50 per scala visibile

    const data = {
        labels: visibleStats.map(s => `${s.icon} ${s.name}`),
        datasets: [{
            label: 'XP Mensile',
            data: monthlyData,
            backgroundColor: 'rgba(124, 58, 237, 0.2)',
            borderColor: 'rgba(124, 58, 237, 1)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(124, 58, 237, 1)',
            pointBorderColor: '#fff',
            pointRadius: 4
        }]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
            r: {
                beginAtZero: true,
                min: 0,
                max: maxMonthlyXp + Math.round(maxMonthlyXp * 0.2),
                ticks: { display: false },
                grid: { color: 'rgba(128, 128, 128, 0.15)' },
                angleLines: { color: 'rgba(128, 128, 128, 0.15)' },
                pointLabels: { font: { size: 11, weight: '600' }, padding: 12 }
            }
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        return `${context.parsed.r} XP questo mese`;
                    }
                }
            }
        }
    };

    if (radarChart) {
        radarChart.data = data;
        radarChart.options = options;
        radarChart.update();
    } else {
        radarChart = new Chart(ctx, { type: 'radar', data, options });
    }
}
// Popup Variables
let progressChart = null;

function showProgressPopup(gainedStatId = null, gainedAmount = 0) {
    const popup = document.getElementById('progressPopup');
    const ctx = document.getElementById('popupRadarCanvas');
    if (!popup || !ctx) return;

    // Reuse Radar Logic but on popup canvas
    const visibleStats = state.stats.filter(s => s.visible);
    if (visibleStats.length === 0) return;

    const monthlyXp = getMonthlyXpByStats();

    // Calculate "Old" data by subtracting the gained amount from the relevant stat
    const currentData = visibleStats.map(s => monthlyXp[s.id] || 0);
    const oldData = visibleStats.map(s => {
        let val = monthlyXp[s.id] || 0;
        if (s.id === gainedStatId) val = Math.max(0, val - gainedAmount);
        return val;
    });

    const maxMonthlyXp = Math.max(50, ...currentData);

    const data = {
        labels: visibleStats.map(s => `${s.icon} ${s.name}`),
        datasets: [
            {
                label: 'Precedente',
                data: oldData,
                backgroundColor: 'transparent',
                borderColor: 'rgba(150, 150, 150, 0.5)', // Ghost Grey
                borderWidth: 2,
                borderDash: [5, 5],
                pointBackgroundColor: 'transparent',
                pointBorderColor: 'transparent',
                pointRadius: 0
            },
            {
                label: 'Attuale',
                data: currentData,
                backgroundColor: 'rgba(124, 58, 237, 0.4)',
                borderColor: 'rgba(124, 58, 237, 1)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(124, 58, 237, 1)',
                pointBorderColor: '#fff',
                pointRadius: 4
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            r: {
                beginAtZero: true,
                min: 0,
                max: maxMonthlyXp + Math.round(maxMonthlyXp * 0.2), // Dynamic scaling
                ticks: { display: false },
                pointLabels: { font: { size: 10, weight: '600' } }
            }
        },
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        animation: { duration: 1500, easing: 'easeOutQuart' } // Slow nice animation
    };

    if (progressChart) {
        progressChart.data = data;
        progressChart.options = options;
        progressChart.update();
        progressChart.reset(); // Reset animation
        progressChart.update();
    } else {
        progressChart = new Chart(ctx, { type: 'radar', data, options });
    }

    // Show Popup
    popup.classList.remove('hidden');

    // Auto hide
    setTimeout(() => {
        popup.classList.add('hidden');
    }, 3500); // 3.5s duration
}

function renderStatsGrid() {
    const attributes = state.stats.filter(s => s.type === 'attribute');
    const abilities = state.stats.filter(s => s.type === 'ability');

    const attrList = document.getElementById('attributesList');
    const abilList = document.getElementById('abilitiesList');

    if (attrList) {
        attrList.innerHTML = attributes.map(stat => renderStatCard(stat)).join('');
    }
    if (abilList) {
        abilList.innerHTML = abilities.length > 0
            ? abilities.map(stat => renderStatCard(stat)).join('')
            : '<div class="empty-state"><div class="empty-state-text">Nessuna abilità</div></div>';
    }
}

function renderStatCard(stat) {
    const xpForNext = getXpForLevel(stat.level + 1);
    const xpProgress = Math.min(100, (stat.xp / xpForNext) * 100);
    const hiddenClass = stat.visible ? '' : 'stat-hidden';
    return `
        <div class="stat-card ${hiddenClass} task-card" data-type="${stat.type}" data-id="${stat.id}">
            <div class="swipe-actions">
                <div class="swipe-action edit">✏️</div>
                <div class="swipe-action delete">🗑️</div>
            </div>
            <div class="swipe-content" onclick="handleTaskClick(event, '${stat.type}', '${stat.id}')">
                <div class="stat-card-header">
                    <span class="stat-card-icon">${stat.icon}</span>
                    <span class="stat-card-name">${stat.name}</span>
                    <span class="stat-card-level">LV${stat.level}</span>
                </div>
                <div class="xp-bar-container">
                    <div class="xp-bar" style="width: ${xpProgress}%"></div>
                </div>
            </div>
        </div>
    `;
}

function showStatTooltip(statId, event) {
    const stat = state.stats.find(s => s.id === statId);
    if (!stat) return;

    const tooltip = document.getElementById('tooltip');

    // Determine type label
    const typeLabel = stat.type === 'attribute' ? 'Attributo' : 'Abilità';
    const xpForNext = getXpForLevel(stat.level + 1);

    tooltip.innerHTML = `
        <div class="tooltip-header">
            <span>${stat.icon} ${stat.name}</span>
            <span class="tooltip-level">LV${stat.level}</span>
        </div>
        <div class="tooltip-desc">${stat.description || ''}</div>
        <div class="tooltip-xp">XP: ${stat.xp} / ${xpForNext}</div>
        <div class="tooltip-type">${typeLabel}</div>
    `;

    tooltip.classList.add('visible');

    // Position tooltip
    // Use fixed positioning relative to viewport to avoid overflow
    const rect = event.target.closest('.stat-card').getBoundingClientRect();

    // Default position: bottom-left aligned with card
    let left = rect.left;
    let top = rect.bottom + 10;

    // Prevent going off-screen right
    if (left + 250 > window.innerWidth) { // Assuming tooltip width ~250px
        left = window.innerWidth - 260;
    }

    // Prevent going off-screen bottom
    if (top + 100 > window.innerHeight) { // Assuming tooltip height ~100px
        top = rect.top - 110; // Show above if no space below
    }

    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
}

function hideStatTooltip() {
    const tooltip = document.getElementById('tooltip');
    if (tooltip) {
        tooltip.classList.remove('visible');
    }
}

function toggleAccordion(type) {
    const content = document.getElementById(`content-${type}`);
    const arrow = document.getElementById(`arrow-${type}`);
    content.classList.toggle('expanded');
    arrow.style.transform = content.classList.contains('expanded') ? 'rotate(180deg)' : '';
}

// ============================================
// CALENDAR VIEW
// ============================================

function renderCalendar() {
    const container = document.getElementById('calendarScroll');
    if (!container) return;

    const today = getGameDateObj();
    const days = [];

    // Generate last 30 days + today
    for (let i = 30; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        days.push(date);
    }

    container.innerHTML = days.map(date => {
        const dateStr = formatISO(date);
        const isToday = date.toDateString() === today.toDateString();
        const isActive = dateStr === viewedDate;
        const completion = getCompletionForDate(dateStr);

        return `
            <div class="calendar-day ${isToday ? 'today' : ''} ${isActive ? 'active' : ''}" 
                 data-date="${dateStr}" 
                 onclick="setViewedDate('${dateStr}')">
                <div class="calendar-day-name">${DAY_NAMES[date.getDay()]}</div>
                <div class="calendar-day-number">
                    ${date.getDate()}
                    ${completion > 0 ? `<div class="completion-ring" style="--percent: ${completion}%"></div>` : ''}
                </div>
            </div>
        `;
    }).join('');

    // Scroll to active or today
    setTimeout(() => {
        const targetEl = container.querySelector('.active') || container.querySelector('.today');
        if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth', inline: 'center' });
    }, 100);
}

function setViewedDate(dateStr) {
    viewedDate = dateStr;
    renderCalendar();
    renderHabits();
    // We could also filter oneshots/quests if they had a completion date or if the user wants to see history
}

function getCompletionForDate(dateStr) {
    const log = state.completionLog[dateStr];
    if (!log) return 0;

    const completedHabits = log.habits?.length || 0;

    // Usa lo snapshot delle abitudini attive di quel giorno se disponibile
    // Altrimenti fallback alle abitudini correnti (per retrocompatibilità)
    const totalHabitsForDay = log.activeHabitsSnapshot?.length ?? state.habits.filter(h => !h.locked).length;

    if (totalHabitsForDay === 0) return completedHabits > 0 ? 100 : 0;
    return Math.round((completedHabits / totalHabitsForDay) * 100);
}

function logCompletion(type, itemId, customDate = null) {
    const dateStr = customDate || getGameDate();
    const today = getGameDate();

    if (!state.completionLog[dateStr]) {
        state.completionLog[dateStr] = { habits: [], oneshots: [], quests: [] };
    }

    // Salva lo snapshot delle abitudini attive solo per oggi (quando si crea o aggiorna)
    // Questo preserva lo storico: le abitudini di un giorno passato non cambiano
    if (dateStr === getGameDate() && type === 'habits') {
        const activeHabitIds = state.habits.filter(h => !h.locked).map(h => h.id);
        state.completionLog[dateStr].activeHabitsSnapshot = activeHabitIds;
    }

    const index = state.completionLog[dateStr][type].indexOf(itemId);
    if (index === -1) {
        state.completionLog[dateStr][type].push(itemId);
    } else if (customDate) {
        // Toggle off if it's a custom date (allowing removal from history)
        state.completionLog[dateStr][type].splice(index, 1);
    }
    saveState();
}

// ============================================
// HABITS
// ============================================

function renderHabits() {
    const container = document.getElementById('habitsList');
    const isToday = viewedDate === getGameDate();

    // If it's today, show only active habits
    // If it's a past date, show habits that were completed on that day OR are active
    // Always filter: only show habits created on or before the viewed date
    let habitsToShow = state.habits.filter(h => {
        // Filter by creation date - if habit was created after the viewed date, don't show it
        if (h.createdAt) {
            // Compare using YYYY-MM-DD format
            const createdDate = formatISO(new Date(h.createdAt));
            if (createdDate > viewedDate) return false;
        }
        // If it's today, also filter out completed habits
        if (isToday) return !h.completed;
        return true;
    });

    // Sort: uncompleted habits first, completed habits at the bottom
    habitsToShow = habitsToShow.slice().sort((a, b) => {
        const aCompleted = isHabitCompletedOnDate(a, viewedDate);
        const bCompleted = isHabitCompletedOnDate(b, viewedDate);
        if (aCompleted === bCompleted) return 0;
        return aCompleted ? 1 : -1;
    });

    if (habitsToShow.length === 0) {
        container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📜</div><div class="empty-state-text">Nessuna abitudine</div><div class="empty-state-hint">Clicca "+ Nuova" per iniziare</div></div>`;
        return;
    }

    container.innerHTML = habitsToShow.map(habit => {
        const isCompleted = isHabitCompletedOnDate(habit, viewedDate);
        if (!isToday && !isCompleted && habit.completed) return ''; // Hide tasks completed in the future when viewing history

        const primaryStat = state.stats.find(s => s.id === habit.primaryStatId);
        const secondaryStat = habit.secondaryStatId ? state.stats.find(s => s.id === habit.secondaryStatId) : null;

        return `
            <div class="task-card ${habit.locked ? 'locked' : ''}" data-type="habit" data-id="${habit.id}">
                <div class="swipe-actions">
                    <div class="swipe-action edit">✏️</div>
                    <div class="swipe-action delete">🗑️</div>
                </div>
                <div class="swipe-content" onclick="handleTaskClick(event, 'habit', '${habit.id}')">
                    <div class="card-checkbox ${isCompleted ? 'checked' : ''}" onclick="event.stopPropagation(); toggleHabit('${habit.id}', '${viewedDate}')"></div>
                    <div class="card-content">
                        <div class="card-title">${habit.name}</div>
                        <div class="card-meta">
                            <span class="card-stars">${'⭐'.repeat(habit.stars)}</span>
                            <span class="card-streak">🔥 ${habit.streak}</span>
                            <span class="card-xp">+${calculateXp(habit.stars)} XP</span>
                            ${primaryStat ? `<span class="card-stat">${primaryStat.icon}</span>` : ''}
                            ${secondaryStat ? `<span class="card-stat" style="opacity:0.6">${secondaryStat.icon}</span>` : ''}
                            ${habit.dueDate ? `<span class="card-due">📅 ${formatDate(habit.dueDate)}</span>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function isHabitCompletedOnDate(habit, dateStr) {
    if (!habit.lastCompleted) return false;

    if (habit.frequency === 'weekly') {
        return getWeekIdentifier(habit.lastCompleted) === getWeekIdentifier(dateStr);
    } else if (habit.frequency === 'monthly') {
        return getMonthIdentifier(habit.lastCompleted) === getMonthIdentifier(dateStr);
    } else if (habit.frequency === 'yearly') {
        return getYearIdentifier(habit.lastCompleted) === getYearIdentifier(dateStr);
    }

    const log = state.completionLog[dateStr];
    return log?.habits?.includes(habit.id);
}

function isHabitCompletedToday(habit) {
    const today = getGameDateObj().toDateString();
    return habit.lastCompleted === today;
}

function toggleHabit(habitId, targetDate = null) {
    const habit = state.habits.find(h => h.id === habitId);
    if (!habit || habit.locked) return;

    const today = getGameDateObj().toDateString();
    const dateStr = targetDate || getGameDate();
    const isTargetingToday = !targetDate || targetDate === getGameDate();

    if (isHabitCompletedOnDate(habit, dateStr)) {
        // Un-complete
        if (isTargetingToday) {
            habit.lastCompleted = null;
            checkUndoActivity();

            // Subtract XP (Rollback)
            const xp = calculateXp(habit.stars);
            addXp(-xp, habit.primaryStatId, habit.name);
            if (habit.secondaryStatId) {
                addXp(-Math.round(xp * XP_CONFIG.secondaryRatio), habit.secondaryStatId, habit.name);
            }
        }
        logCompletion('habits', habit.id, dateStr);
    } else {
        // Complete
        if (isTargetingToday) {
            const yesterday = getGameDateObj();
            yesterday.setDate(yesterday.getDate() - 1);

            if (habit.lastCompleted === yesterday.toDateString()) {
                habit.streak++;
            } else {
                habit.streak = Math.max(1, Math.floor(habit.streak * 0.3) + 1);
            }

            habit.lastCompleted = today;
            const xp = calculateXp(habit.stars);
            addXp(xp, habit.primaryStatId, habit.name);
            if (habit.secondaryStatId) {
                addXp(Math.round(xp * XP_CONFIG.secondaryRatio), habit.secondaryStatId, habit.name);
            }
            recordActivity();
        }
        logCompletion('habits', habit.id, dateStr);
        // Calculate XP gained to pass to popup
        const xp = calculateXp(habit.stars);
        showProgressPopup(habit.primaryStatId, xp);
    }

    saveState();
    renderHeader();
    renderHabits();
    renderCalendar();
}

// ============================================
// ONE-SHOTS
// ============================================

function renderOneshots() {
    const container = document.getElementById('oneshotList');
    const pending = state.oneshots.filter(o => !o.completed && !o.locked);

    if (pending.length === 0) {
        container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">💥</div><div class="empty-state-text">Nessun task</div><div class="empty-state-hint">Perfetto per azioni singole!</div></div>`;
        return;
    }

    container.innerHTML = pending.map(oneshot => {
        const primaryStat = state.stats.find(s => s.id === oneshot.primaryStatId);
        const secondaryStat = oneshot.secondaryStatId ? state.stats.find(s => s.id === oneshot.secondaryStatId) : null;

        return `
            <div class="task-card ${oneshot.locked ? 'locked' : ''}" data-type="oneshot" data-id="${oneshot.id}">
                <div class="swipe-actions">
                    <div class="swipe-action edit">✏️</div>
                    <div class="swipe-action delete">🗑️</div>
                </div>
                <div class="swipe-content" onclick="handleTaskClick(event, 'oneshot', '${oneshot.id}')">
                    <div class="card-checkbox" onclick="event.stopPropagation(); completeOneshot('${oneshot.id}')"></div>
                    <div class="card-content">
                        <div class="card-title">${oneshot.name}</div>
                        <div class="card-meta">
                            <span class="card-stars">${'⭐'.repeat(oneshot.stars)}</span>
                            <span class="card-xp">+${calculateXp(oneshot.stars)} XP</span>
                            ${primaryStat ? `<span class="card-stat">${primaryStat.icon}</span>` : ''}
                            ${secondaryStat ? `<span class="card-stat" style="opacity:0.6">${secondaryStat.icon}</span>` : ''}
                            ${oneshot.dueDate ? `<span class="card-due">📅 ${formatDate(oneshot.dueDate)}</span>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function completeOneshot(oneshotId) {
    const oneshot = state.oneshots.find(o => o.id === oneshotId);
    if (!oneshot || oneshot.completed || oneshot.locked) return;

    oneshot.completed = true;
    oneshot.completedAt = new Date().toISOString();

    const xp = calculateXp(oneshot.stars);
    addXp(xp, oneshot.primaryStatId, oneshot.name);
    if (oneshot.secondaryStatId) {
        addXp(Math.round(xp * XP_CONFIG.secondaryRatio), oneshot.secondaryStatId, oneshot.name);
    }
    logCompletion('oneshots', oneshot.id);
    recordActivity();
    // Calculate XP
    const diffMultiplier = 1 + (['easy', 'medium', 'hard', 'epic'].indexOf(oneshot.difficulty) * 0.5);
    const popupXp = Math.round(15 * diffMultiplier);
    showProgressPopup(oneshot.primaryStatId, popupXp);

    saveState();
    renderOneshots();
    renderCalendar();
}

// ============================================
// QUESTS
// ============================================

function renderQuests() {
    const container = document.getElementById('questList');
    const active = state.quests.filter(q => !q.completed);

    if (active.length === 0) {
        container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🎯</div><div class="empty-state-text">Nessuna quest</div><div class="empty-state-hint">Le grandi avventure iniziano qui!</div></div>`;
        return;
    }

    container.innerHTML = active.map(quest => {
        const completedSubs = quest.subquests.filter(s => s.completed).length;
        const totalSubs = quest.subquests.length;
        const progress = totalSubs > 0 ? (completedSubs / totalSubs) * 100 : 0;
        const primaryStat = state.stats.find(s => s.id === quest.primaryStatId);

        return `
            <div class="task-card quest-card ${quest.locked ? 'locked' : ''}" data-type="quest" data-id="${quest.id}">
                <div class="swipe-actions">
                    <div class="swipe-action edit">✏️</div>
                    <div class="swipe-action delete">🗑️</div>
                </div>
                <div class="swipe-content" onclick="handleTaskClick(event, 'quest', '${quest.id}')">
                    <div class="card-row">
                        <div class="card-checkbox ${quest.completed ? 'checked' : ''}" onclick="event.stopPropagation(); completeQuest('${quest.id}')"></div>
                        <div class="card-content">
                            <div class="card-title">${quest.name}</div>
                            <div class="card-meta">
                                <span class="card-stars">${'⭐'.repeat(quest.stars)}</span>
                                <span>📜 ${completedSubs}/${totalSubs}</span>
                                <span class="card-xp">+${calculateXp(quest.stars) * 2} XP</span>
                                ${primaryStat ? `<span class="card-stat">${primaryStat.icon}</span>` : ''}
                                ${quest.dueDate ? `<span class="card-due">📅 ${formatDate(quest.dueDate)}</span>` : ''}
                            </div>
                        </div>
                    </div>
                    ${totalSubs > 0 ? `
                        <div class="quest-progress">
                            <div class="quest-progress-bar">
                                <div class="quest-progress-fill" style="width: ${progress}%"></div>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
            `;
    }).join('');
}

// Detail view logic
let currentOpenedQuestId = null;

function openQuestDetail(questId) {
    const quest = state.quests.find(q => q.id === questId);
    if (!quest) return;

    currentOpenedQuestId = questId;

    const content = document.querySelector('#questDetailModal .quest-detail-content');
    content.innerHTML = `
            <div class="modal-header" style="border:none; padding-bottom:0; flex-shrink: 0;">
                <h3 class="modal-title" style="font-family:'Cinzel', serif; font-size: 24px; width:100%; text-align:center; color:var(--accent-primary); text-shadow: 0 2px 4px rgba(0,0,0,0.5);">${quest.name}</h3>
                <button class="close-btn" onclick="closeQuestDetailModal()" style="position:absolute; right:20px; top:20px;">×</button>
        </div>

            <div class="quest-scroll-area">
                <div class="quest-description" style="text-align:center; color:var(--text-secondary); margin-bottom:24px; font-size:15px; font-style:italic;">
                    ${quest.description || 'Nessuna descrizione.'}
                </div>

                <div class="quest-subtasks-list" id="questDetailSubtasks">
                    ${(quest.subquests || []).map(sub => `
                    <div class="subtask-item-detail ${sub.completed ? 'completed' : ''}" onclick="toggleSubquest('${quest.id}', '${sub.id}')">
                        <div class="subtask-checkbox"></div>
                        <span>${sub.name}</span>
                    </div>
                `).join('')}
                </div>

                <div class="quest-reward-area">
                    ${quest.customReward ? `<div style="font-size:18px; font-weight:bold; color:var(--accent-primary); margin-bottom:8px; text-shadow: 0 0 10px rgba(255,215,0,0.3);">🎁 ${quest.customReward}</div>` : ''}
                    <div style="display:flex; justify-content:center; gap:12px; font-size:14px; color:var(--text-muted);">
                        <span>${'⭐'.repeat(quest.stars)}</span>
                        <span>✨ ${calculateXp(quest.stars) * 2} XP</span>
                        ${quest.dueDate ? `<span>📅 ${formatDate(quest.dueDate)}</span>` : ''}
                    </div>
                </div>
            </div>
        `;

    document.getElementById('questDetailModal').classList.add('active');
}

function closeQuestDetailModal() {
    document.getElementById('questDetailModal').classList.remove('active');
    currentOpenedQuestId = null;
}

function openStatDetail(statId) {
    const stat = state.stats.find(s => s.id === statId);
    if (!stat) return;

    const xpForNext = getXpForLevel(stat.level + 1);
    const xpNeeded = xpForNext - stat.xp;
    const progress = (stat.xp / xpForNext) * 100;

    // Complex Content Area
    const content = document.getElementById('statDetailContent');
    const momentum = getWeeklyMomentum(statId);
    const maxMomentum = Math.max(...momentum.map(m => m.xp), 1);

    // Filter history for "Last Activity"
    const history = state.xpLog
        .filter(entry => entry.statId === statId)
        .reverse();
    const lastEntry = history[0];

    content.innerHTML = `
        <div style="text-align: center; margin-bottom: 5px;">
            <div style="font-size: 32px; margin-bottom: 5px;">${stat.icon}</div>
            <h2 style="font-size: 22px; margin: 0; color: var(--text-primary); text-align: center; width: 100%;">${stat.name}</h2>
            <div style="font-size: 13px; color: var(--text-secondary); font-style: italic; margin-top: 8px; padding: 0 10px; line-height: 1.4;">
                ${stat.description || 'Nessuna descrizione.'}
            </div>
            <div style="font-size: 16px; font-weight: 700; color: var(--accent-primary); margin-top: 15px;">Livello ${stat.level}</div>
        </div>

        <div class="popup-xp-bar" style="height: 12px; margin: 15px 0 10px 0;">
            <div class="popup-xp-fill" style="width: ${progress}%"></div>
        </div>
        <div class="xp-needed" style="font-size: 13px; text-align: center; margin-bottom: 20px;">Mancano <b>${xpNeeded} XP</b> al LV ${stat.level + 1}</div>

        <div class="momentum-section" style="padding: 12px; margin-bottom: 20px; background: rgba(255,255,255,0.05); border-radius: 12px;">
            <div class="momentum-title" style="font-size: 12px; margin-bottom: 12px; display: flex; justify-content: space-between;">
                <span>Momentum Settimanale</span>
                <span style="color:var(--accent-primary)">+${momentum.reduce((s, m) => s + m.xp, 0)} XP</span>
            </div>
            <div class="momentum-chart" style="height: 80px;">
                ${momentum.map(m => `
                    <div class="momentum-bar-container">
                        <div class="momentum-bar" data-xp="${m.xp}" style="height: ${(m.xp / maxMomentum) * 100}%"></div>
                        <div class="momentum-day" style="font-size: 10px;">${m.day[0]}</div>
                    </div>
                `).join('')}
            </div>
        </div>

        <h3 class="subsection-title" style="font-size: 14px; margin: 0 0 10px 0; text-align: center;">Ultima Attività</h3>
        <div id="statLastActivity">
            ${lastEntry ? `
                <div class="last-activity-box" style="padding: 10px 15px;">
                    <div class="last-activity-info">
                        <span class="last-activity-name" style="font-size: 13px;">${lastEntry.source || 'Bonus Manuale'}</span>
                        <span class="last-activity-date" style="font-size: 11px;">${lastEntry.date}</span>
                    </div>
                    <div class="last-activity-xp" style="font-size: 13px;">+${lastEntry.amount}</div>
                </div>
            ` : `<div class="history-empty" style="font-size:12px; padding:10px; text-align:center;">Nessuna attività registrata.</div>`}
        </div>
    `;

    document.getElementById('statDetailOverlay').classList.add('active');
    document.getElementById('statDetailModal').classList.remove('hidden');
}

function closeStatDetailModal() {
    document.getElementById('statDetailOverlay').classList.remove('active');
    document.getElementById('statDetailModal').classList.add('hidden');
}

function deleteCurrentQuestInModal() {
    if (currentOpenedQuestId) {
        deleteTask('quest', currentOpenedQuestId);
        closeQuestDetailModal();
    }
}

function editCurrentQuestInModal() {
    if (currentOpenedQuestId) {
        const quest = state.quests.find(q => q.id === currentOpenedQuestId);
        if (quest) {
            closeQuestDetailModal();
            openModal('quest', quest);
        }
    }
}


function toggleSubquest(questId, subquestId) {
    const quest = state.quests.find(q => q.id === questId);
    if (!quest || quest.locked) return;

    const subquest = quest.subquests.find(s => s.id === subquestId);
    if (!subquest) return;

    subquest.completed = !subquest.completed;

    if (subquest.completed) {
        // Double XP for subquest (Full habitual XP)
        addXp(calculateXp(quest.stars), quest.primaryStatId, `${quest.name} > ${subquest.name}`);
        if (quest.secondaryStatId) {
            addXp(Math.round(calculateXp(quest.stars) * XP_CONFIG.secondaryRatio), quest.secondaryStatId, `${quest.name} > ${subquest.name}`);
        }
    }

    // Auto-complete quest if all subquests done
    if (quest.subquests.every(s => s.completed) && quest.subquests.length > 0) {
        completeQuest(questId);
        if (currentOpenedQuestId === questId) closeQuestDetailModal(); // Close detail if completed
        return;
    }

    saveState();
    renderQuests();

    // If detail is open, refresh it
    if (currentOpenedQuestId === questId) {
        openQuestDetail(questId);
    }
}

function completeQuest(questId) {
    const quest = state.quests.find(q => q.id === questId);
    if (!quest || quest.completed || quest.locked) return;

    quest.completed = true;
    quest.completedAt = new Date().toISOString();

    const xp = calculateXp(quest.stars) * 2;
    addXp(xp, quest.primaryStatId, quest.name);
    if (quest.secondaryStatId) {
        addXp(Math.round(xp * XP_CONFIG.secondaryRatio), quest.secondaryStatId, quest.name);
    }
    logCompletion('quests', quest.id);
    recordActivity();
    showProgressPopup(quest.primaryStatId, xp);

    saveState();
    renderQuests();
    renderCalendar();
}

// ============================================
// XP SYSTEM
// ============================================

function calculateXp(stars) {
    const baseXp = 20;
    return Math.round(baseXp * XP_CONFIG.starsMultiplier[stars]);
}

function getXpForLevel(level) {
    return Math.floor(XP_CONFIG.baseXpPerLevel * Math.pow(XP_CONFIG.levelMultiplier, level - 1));
}

function addXp(amount, statId, sourceName = null) {
    state.player.totalXp += amount;

    // Level Up Player
    while (state.player.totalXp >= getXpForLevel(state.player.level + 1)) {
        state.player.level++;
    }
    // Level Down Player
    while (state.player.level > 1 && state.player.totalXp < getXpForLevel(state.player.level)) {
        state.player.level--;
    }

    if (statId) {
        const stat = state.stats.find(s => s.id === statId);
        if (stat) {
            stat.xp += amount;

            // Level Up Stat
            while (stat.xp >= getXpForLevel(stat.level + 1)) {
                stat.xp -= getXpForLevel(stat.level + 1);
                stat.level++;
            }

            // Level Down Stat
            while (stat.xp < 0) {
                if (stat.level > 1) {
                    stat.level--;
                    stat.xp += getXpForLevel(stat.level + 1);
                } else {
                    stat.xp = 0; // Cap at 0 for level 1
                    break;
                }
            }
        }

        // Log XP
        state.xpLog.push({
            date: getGameDate(),
            timestamp: Date.now(), // New timestamp for better sorting/filtering
            statId: statId,
            amount: amount,
            source: sourceName
        });

        // Limit log size (keep last 1000 entries to ensure 7-day momentum coverage)
        if (state.xpLog.length > 1000) {
            state.xpLog = state.xpLog.slice(-1000);
        }
    }

    saveState();
    renderAll();
}

function getStatRank(level) {
    if (level >= 50) return "Leggenda";
    if (level >= 40) return "Gran Maestro";
    if (level >= 30) return "Maestro";
    if (level >= 20) return "Esperto";
    if (level >= 15) return "Veterano";
    if (level >= 10) return "Abile";
    if (level >= 5) return "Apprendista";
    return "Novizio";
}

function getWeeklyMomentum(statId) {
    const momentum = [];
    const now = getGameDateObj();

    for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateStr = formatISO(d);

        const dailyXp = state.xpLog
            .filter(entry => entry.statId === statId && entry.date === dateStr)
            .reduce((sum, entry) => sum + entry.amount, 0);

        momentum.push({
            day: DAY_NAMES[d.getDay()],
            xp: dailyXp
        });
    }
    return momentum;
}

// ============================================
// SETTINGS
// ============================================

function initSettings() {
    const nameInput = document.getElementById('settingName');
    if (nameInput) {
        nameInput.value = state.player.name;
    }

    // Updated init for dayStartTime
    const dayStartSelect = document.getElementById('dayStartTime');
    if (dayStartSelect) {
        dayStartSelect.value = state.settings.dayStartTime || 0;
    }
}



function initColorPicker() {
    const dropdown = document.getElementById('colorDropdown');
    if (!dropdown) return;
    dropdown.innerHTML = ACCENT_COLORS.map(color =>
        `<div class="color-swatch ${state.settings.accent === color ? 'active' : ''}" data-color="${color}" onclick="setAccent('${color}')"></div>`
    ).join('');
}

function toggleColorDropdown() {
    const dropdown = document.getElementById('colorDropdown');
    if (dropdown) dropdown.classList.toggle('hidden');
}

function setAccent(color) {
    state.settings.accent = color;
    applyTheme();
    saveState();
    document.querySelectorAll('.color-swatch').forEach(s => {
        s.classList.toggle('active', s.dataset.color === color);
    });

    // Close dropdown on selection
    const dropdown = document.getElementById('colorDropdown');
    if (dropdown) dropdown.classList.add('hidden');
}

function applyTheme() {
    document.body.dataset.theme = state.settings.theme;
    document.body.dataset.accent = state.settings.accent;

    // Update setting buttons
    const btnLight = document.getElementById('themeLight');
    const btnDark = document.getElementById('themeDark');
    if (btnLight && btnDark) {
        btnLight.classList.toggle('active', state.settings.theme === 'light');
        btnDark.classList.toggle('active', state.settings.theme === 'dark');
    }
}

function setTheme(theme) {
    state.settings.theme = theme;
    applyTheme();
    saveState();
}

function updatePlayerName(name) {
    state.player.name = name.trim();
    saveState();
    renderHeader();
}

function updateDayStartTime(hour) {
    const oldDate = getGameDate();
    state.settings.dayStartTime = parseInt(hour);
    saveState();

    // If changing the start time changes the "current game date", we should refresh
    const newDate = getGameDate();
    if (oldDate !== newDate) {
        viewedDate = newDate;
        renderHeader();
        renderAll();
    }
}

function renderSettingsStats() {
    const attributes = state.stats.filter(s => s.type === 'attribute');
    const abilities = state.stats.filter(s => s.type === 'ability');

    const attrList = document.getElementById('attributesManageList');
    const abilList = document.getElementById('abilitiesManageList');

    if (attrList) {
        attrList.innerHTML = attributes.map(stat => `
            <div class="stat-manage-item">
                <div class="stat-manage-info">
                    <input type="checkbox" ${stat.visible ? 'checked' : ''} onchange="toggleStatVisibility('${stat.id}')">
                    <span>${stat.icon} ${stat.name}</span>
                </div>
                <div class="stat-manage-actions">
                    <button onclick="editStat('${stat.id}')">✏️</button>
                    <button onclick="deleteStat('${stat.id}')">🗑️</button>
                </div>
            </div >
            `).join('');
    }

    if (abilList) {
        abilList.innerHTML = abilities.map(stat => `
            < div class="stat-manage-item" >
                <div class="stat-manage-info">
                    <input type="checkbox" ${stat.visible ? 'checked' : ''} onchange="toggleStatVisibility('${stat.id}')">
                    <span>${stat.icon} ${stat.name}</span>
                </div>
                <div class="stat-manage-actions">
                    <button onclick="editStat('${stat.id}')">✏️</button>
                    <button onclick="deleteStat('${stat.id}')">🗑️</button>
                </div>
            </div >
            `).join('');
    }
}

function toggleStatVisibility(statId) {
    const stat = state.stats.find(s => s.id === statId);
    if (stat) {
        stat.visible = !stat.visible;
        saveState();
        renderAll();
    }
}

// Stat cleanup handled by unified deleteTask/showDeleteConfirm

// ============================================
// MODAL SYSTEM
// ============================================

let currentModalType = null;

function openModal(type, editData = null) {
    currentModalType = type;
    editingItem = editData;

    // Layering: If opening toxic form, hide inventory backpack temporarily
    if (type === 'toxic') {
        const invModal = document.getElementById('toxicInventoryModal');
        const invOverlay = document.getElementById('toxicInventoryOverlay');
        if (invModal) invModal.classList.add('hidden');
        if (invOverlay) invOverlay.classList.remove('active');
    }

    const title = document.getElementById('modalTitle');
    const body = document.getElementById('modalBody');

    const statOptions = state.stats.map(s => `<option value="${s.id}">${s.icon} ${s.name}</option>`).join('');
    const statOptionsOptional = `<option value="">-- Nessuna --</option>` + statOptions;

    const frequencyOptions = `
            <option value="daily">📅 Giornaliera</option>
        <option value="weekly">📆 Settimanale</option>
        <option value="monthly">🗓️ Mensile</option>
        <option value="yearly">📅 Annuale</option>
        <option value="times_week">🔢 Volte a settimana</option>
        <option value="times_month">🔢 Volte al mese</option>
        `;

    switch (type) {
        case 'habit':
            title.textContent = editData ? 'Modifica Abitudine' : 'Nuova Abitudine';
            body.innerHTML = `
            <div class="form-group">
                    <label>Nome</label>
                    <input type="text" id="inputName" value="${editData?.name || ''}" placeholder="es. Meditazione mattutina">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Frequenza</label>
                        <select id="inputFreq">${frequencyOptions}</select>
                    </div>
                    <div class="form-group" id="freqTimesGroup" style="display:none">
                        <label>Quante volte</label>
                        <input type="number" id="inputFreqTimes" min="1" max="30" value="3">
                    </div>
                </div>
                <div class="form-group">
                    <label>Difficoltà</label>
                    <div class="star-rating" id="starRating">${renderStarRating(editData?.stars || 3)}</div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Attributo Principale</label>
                        <select id="inputPrimaryStat">${statOptions}</select>
                    </div>
                    <div class="form-group">
                        <label>Secondario (opz.)</label>
                        <select id="inputSecondaryStat">${statOptionsOptional}</select>
                    </div>
                </div>
                <div class="form-group">
                    <label>Scadenza (opzionale)</label>
                    <input type="date" id="inputDueDate" value="${editData?.dueDate || ''}">
                </div>
                <div class="form-actions">
                    <button class="btn-secondary" onclick="closeModal()">Annulla</button>
                    <button class="btn-primary" onclick="submitModal()">${editData ? 'Salva' : 'Aggiungi'}</button>
                </div>
        `;
            initFrequencyToggle();
            if (editData) {
                document.getElementById('inputFreq').value = editData.frequency;
                document.getElementById('inputPrimaryStat').value = editData.primaryStatId;
                document.getElementById('inputSecondaryStat').value = editData.secondaryStatId || '';
            }
            break;

        case 'oneshot':
            title.textContent = editData ? 'Modifica One Shot' : 'Nuovo One Shot';
            body.innerHTML = `
            <div class="form-group">
                    <label>Nome</label>
                    <input type="text" id="inputName" value="${editData?.name || ''}" placeholder="es. Chiamare il dentista">
                </div>
                <div class="form-group">
                    <label>Difficoltà</label>
                    <div class="star-rating" id="starRating">${renderStarRating(editData?.stars || 3)}</div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Attributo Principale</label>
                        <select id="inputPrimaryStat">${statOptions}</select>
                    </div>
                    <div class="form-group">
                        <label>Secondario (opz.)</label>
                        <select id="inputSecondaryStat">${statOptionsOptional}</select>
                    </div>
                </div>
                <div class="form-group">
                    <label>Scadenza (opzionale)</label>
                    <input type="date" id="inputDueDate" value="${editData?.dueDate || ''}">
                </div>
                <div class="form-actions">
                    <button class="btn-secondary" onclick="closeModal()">Annulla</button>
                    <button class="btn-primary" onclick="submitModal()">${editData ? 'Salva' : 'Aggiungi'}</button>
                </div>
        `;
            if (editData) {
                document.getElementById('inputPrimaryStat').value = editData.primaryStatId;
                document.getElementById('inputSecondaryStat').value = editData.secondaryStatId || '';
            }
            break;

        case 'quest':
            title.textContent = editData ? 'Modifica Quest' : 'Nuova Quest';
            body.innerHTML = `
            <div class="form-group">
                    <label>Nome Quest</label>
                    <input type="text" id="inputName" value="${editData?.name || ''}" placeholder="es. Imparare una nuova lingua">
                </div>
                <div class="form-group">
                    <label>Importanza</label>
                    <div class="star-rating" id="starRating">${renderStarRating(editData?.stars || 3)}</div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Attributo Principale</label>
                        <select id="inputPrimaryStat">${statOptions}</select>
                    </div>
                    <div class="form-group">
                        <label>Secondario (opz.)</label>
                        <select id="inputSecondaryStat">${statOptionsOptional}</select>
                    </div>
                </div>
                <div class="form-group">
                    <label>Descrizione</label>
                    <textarea id="inputDesc" placeholder="Descrivi la tua quest...">${editData?.description || ''}</textarea>
                </div>
                <div class="form-group">
                    <label>Sub-quest (una per riga)</label>
                    <textarea id="inputSubs" placeholder="es.&#10;Completare 10 lezioni&#10;Parlare con madrelingua">${editData?.subquests?.map(s => s.name).join('\n') || ''}</textarea>
                </div>
                <div class="form-group">
                    <label>Premio Finale (opzionale)</label>
                    <input type="text" id="inputCustomReward" value="${editData?.customReward || ''}" placeholder="es. Una cena fuori">
                </div>
                <div class="form-group">
                    <label>Scadenza (opzionale)</label>
                    <input type="date" id="inputDueDate" value="${editData?.dueDate || ''}">
                </div>
                <div class="form-actions">
                    <button class="btn-secondary" onclick="closeModal()">Annulla</button>
                    <button class="btn-primary" onclick="submitModal()">${editData ? 'Salva' : 'Aggiungi'}</button>
                </div>
        `;
            if (editData) {
                document.getElementById('inputPrimaryStat').value = editData.primaryStatId;
                document.getElementById('inputSecondaryStat').value = editData.secondaryStatId || '';
            }
            break;

        case 'attribute':
        case 'ability':
            const isAbility = type === 'ability';
            title.textContent = editData ? `Modifica ${isAbility ? 'Abilità' : 'Attributo'} ` : `Nuovo ${isAbility ? 'Abilità' : 'Attributo'} `;
            body.innerHTML = `
            <div class="form-group">
                    <label>Nome</label>
                    <input type="text" id="inputName" value="${editData?.name || ''}" placeholder="es. Creatività">
                </div>
                <div class="form-group">
                    <label>Emoji</label>
                    <input type="text" id="inputIcon" value="${editData?.icon || ''}" placeholder="🎨" maxlength="2">
                </div>
                <div class="form-group">
                    <label>Descrizione</label>
                    <textarea id="inputDesc" placeholder="Descrizione dell'attributo...">${editData?.description || ''}</textarea>
                </div>
                <div class="form-actions">
                    <button class="btn-secondary" onclick="closeModal()">Annulla</button>
                    <button class="btn-primary" onclick="submitModal()">${editData ? 'Salva' : 'Aggiungi'}</button>
                </div>
        `;
            break;

        case 'toxic':
            title.textContent = editData ? 'Modifica Oggetto Tossico' : 'Nuovo Oggetto Tossico';
            body.innerHTML = `
                <div class="form-row toxic-form-row">
                    <div class="form-group icon-group">
                        <label>Icona</label>
                        <input type="text" id="inputIcon" value="${editData?.icon || '💀'}" style="text-align:center; font-size: 24px;">
                    </div>
                    <div class="form-group name-group">
                        <label>Nome Oggetto</label>
                        <input type="text" id="inputName" value="${editData?.name || ''}" placeholder="es. Junk Food">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Danneggia Stat</label>
                        <select id="inputPrimaryStat" style="width: 100%;">${statOptions}</select>
                    </div>
                    <div class="form-group" style="flex: 0 0 100px;">
                        <label>Penalità XP</label>
                        <input type="number" id="inputPenalty" value="${editData?.penalty || 20}" min="1">
                    </div>
                </div>
                <div class="form-actions">
                    <button class="btn-secondary" onclick="closeModal()">Annulla</button>
                    <button class="btn-primary" onclick="submitModal()">${editData ? 'Salva' : 'Aggiungi'}</button>
                </div>
            `;
            if (editData) {
                document.getElementById('inputPrimaryStat').value = editData.statId;
            }
            break;
    }

    document.getElementById('modalOverlay').classList.add('active');
    initStarRating();
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('active');

    // Layering: If we were in toxic form, re-open inventory
    if (currentModalType === 'toxic') {
        openToxicInventory();
    }

    currentModalType = null;
    editingItem = null;
}

function renderStarRating(selected = 3) {
    return Array.from({ length: 5 }, (_, i) =>
        `<span class="star ${i < selected ? 'active' : ''}" data-value="${i + 1}">⭐</span>`
    ).join('');
}

function initStarRating() {
    const container = document.getElementById('starRating');
    if (!container) return;

    container.querySelectorAll('.star').forEach(star => {
        star.addEventListener('click', () => {
            const value = parseInt(star.dataset.value);
            container.querySelectorAll('.star').forEach((s, i) => {
                s.classList.toggle('active', i < value);
            });
        });
    });
}

function initFrequencyToggle() {
    const freqSelect = document.getElementById('inputFreq');
    const timesGroup = document.getElementById('freqTimesGroup');
    if (!freqSelect || !timesGroup) return;

    freqSelect.addEventListener('change', () => {
        const showTimes = ['times_week', 'times_month'].includes(freqSelect.value);
        timesGroup.style.display = showTimes ? 'block' : 'none';
    });
}

function getSelectedStars() {
    const container = document.getElementById('starRating');
    if (!container) return 3;
    return container.querySelectorAll('.star.active').length || 1;
}

function submitModal() {
    const name = document.getElementById('inputName')?.value.trim();
    if (!name) { alert('Inserisci un nome!'); return; }

    const stars = getSelectedStars();
    const primaryStatId = document.getElementById('inputPrimaryStat')?.value;
    const secondaryStatId = document.getElementById('inputSecondaryStat')?.value || null;
    const dueDate = document.getElementById('inputDueDate')?.value || null;

    switch (currentModalType) {
        case 'habit':
            const frequency = document.getElementById('inputFreq').value;
            const freqTimes = parseInt(document.getElementById('inputFreqTimes')?.value) || 3;

            if (editingItem) {
                Object.assign(editingItem, { name, frequency, freqTimes, stars, primaryStatId, secondaryStatId, dueDate });
            } else {
                state.habits.push({
                    id: 'habit_' + Date.now(),
                    name, frequency, freqTimes, stars, primaryStatId, secondaryStatId, dueDate,
                    streak: 0, lastCompleted: null, locked: false, createdAt: getGameDateObj().toISOString()
                });
            }
            break;

        case 'oneshot':
            if (editingItem) {
                Object.assign(editingItem, { name, stars, primaryStatId, secondaryStatId, dueDate });
            } else {
                state.oneshots.push({
                    id: 'oneshot_' + Date.now(),
                    name, stars, primaryStatId, secondaryStatId, dueDate,
                    completed: false, locked: false, createdAt: getGameDateObj().toISOString()
                });
            }
            break;

        case 'quest': {
            const subsText = document.getElementById('inputSubs')?.value || '';
            const description = document.getElementById('inputDesc')?.value || '';
            const subquests = subsText.split('\n').map(s => s.trim()).filter(s => s).map((s, i) => ({
                id: 'sub_' + Date.now() + '_' + i, name: s, completed: false
            }));

            if (editingItem) {
                editingItem.name = name;
                editingItem.stars = stars;
                editingItem.primaryStatId = primaryStatId;
                editingItem.secondaryStatId = secondaryStatId;
                editingItem.dueDate = dueDate;
                editingItem.description = description;
                editingItem.customReward = document.getElementById('inputCustomReward')?.value || '';
                // Preserve completed status for existing subquests
                const existingCompleted = {};
                editingItem.subquests.forEach(s => existingCompleted[s.name] = s.completed);
                editingItem.subquests = subquests.map(s => ({
                    ...s, completed: existingCompleted[s.name] || false
                }));
            } else {
                state.quests.push({
                    id: 'quest_' + Date.now(),
                    name, stars, primaryStatId, secondaryStatId, dueDate, subquests, description,
                    customReward: document.getElementById('inputCustomReward')?.value || '',
                    completed: false, locked: false, createdAt: getGameDateObj().toISOString()
                });
            }
            break;
        }

        case 'attribute':
        case 'ability':
            const icon = document.getElementById('inputIcon')?.value || '✨';
            const description = document.getElementById('inputDesc')?.value || '';
            const isAbility = currentModalType === 'ability';

            if (editingItem) {
                Object.assign(editingItem, { name, icon, description });
            } else {
                state.stats.push({
                    id: (isAbility ? 'abil_' : 'attr_') + Date.now(),
                    name, icon, description,
                    type: isAbility ? 'ability' : 'attribute',
                    visible: true, level: 1, xp: 0
                });
            }
            break;

        case 'toxic':
            const iconT = document.getElementById('inputIcon')?.value || '💀';
            const penalty = parseInt(document.getElementById('inputPenalty')?.value) || 20;
            const statId = document.getElementById('inputPrimaryStat')?.value;

            if (editingItem) {
                Object.assign(editingItem, { name, icon: iconT, penalty, statId });
            } else {
                state.toxicItems.push({
                    id: 'toxic_' + Date.now(),
                    name, icon: iconT, penalty, statId,
                    createdAt: getGameDateObj().toISOString()
                });
            }
            renderToxicInventory();
            break;
    }

    saveState();
    renderAll();
    closeModal();
}

// editStat replaced by unified editTask

// ============================================
// SWIPE ACTIONS
// ============================================

function initSwipe() {
    let currentX = 0;
    let isSwiping = false;
    let swipeWasTriggered = false;
    const ACTION_THRESHOLD = 100;
    const MAX_SWIPE = 120;

    document.addEventListener('pointerdown', (e) => {
        const content = e.target.closest('.swipe-content');
        if (!content) return;

        swipeWasTriggered = false;

        currentSwipeCard = content;
        swipeStartX = e.clientX;
        isSwiping = true;
        content.style.transition = 'none';

        const transform = new WebKitCSSMatrix(window.getComputedStyle(content).transform);
        currentX = transform.m41;
    });

    document.addEventListener('pointermove', (e) => {
        if (!isSwiping || !currentSwipeCard) return;

        const diff = e.clientX - swipeStartX + currentX;
        const limitedDiff = Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, diff));
        currentSwipeCard.style.transform = `translateX(${limitedDiff}px)`;

        // Visual feedback
        const taskCard = currentSwipeCard.closest('.task-card');
        if (limitedDiff > ACTION_THRESHOLD * 0.7) {
            taskCard.classList.add('swipe-edit-hint');
            taskCard.classList.remove('swipe-delete-hint');
        } else if (limitedDiff < -ACTION_THRESHOLD * 0.7) {
            taskCard.classList.add('swipe-delete-hint');
            taskCard.classList.remove('swipe-edit-hint');
        } else {
            taskCard.classList.remove('swipe-edit-hint', 'swipe-delete-hint');
        }
    });

    document.addEventListener('pointerup', (e) => {
        if (!isSwiping || !currentSwipeCard) return;
        isSwiping = false;

        const transform = new WebKitCSSMatrix(window.getComputedStyle(currentSwipeCard).transform);
        const finalX = transform.m41;
        const taskCard = currentSwipeCard.closest('.task-card');
        const type = taskCard.dataset.type;
        const id = taskCard.dataset.id;

        // Reset visual
        taskCard.classList.remove('swipe-edit-hint', 'swipe-delete-hint');
        currentSwipeCard.style.transition = 'transform 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28)';
        currentSwipeCard.style.transform = 'translateX(0)';

        // Trigger actions based on swipe distance
        if (finalX > ACTION_THRESHOLD) {
            // Swipe right → Edit
            swipeWasTriggered = true;
            editTask(type, id);
        } else if (finalX < -ACTION_THRESHOLD) {
            // Swipe left → Delete with confirmation
            swipeWasTriggered = true;
            showDeleteConfirm(type, id, taskCard);
        }
    });

    window.checkSwipeTrigger = () => {
        const was = swipeWasTriggered;
        swipeWasTriggered = false;
        return was;
    };
}

// Delete confirmation modal
function showDeleteConfirm(type, id) {
    let list;
    if (type === 'habit') list = state.habits;
    else if (type === 'oneshot') list = state.oneshots;
    else if (type === 'quest') list = state.quests;
    else if (type === 'attribute' || type === 'ability') list = state.stats;

    const item = list.find(i => i.id === id);
    if (!item) return;

    // Determine label
    let label = "task";
    if (type === 'habit') label = "abitudine";
    else if (type === 'oneshot') label = "one shot";
    else if (type === 'quest') label = "quest";
    else if (type === 'attribute') label = "attributo";
    else if (type === 'ability') label = "abilità";

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'delete-confirm-overlay';
    overlay.innerHTML = `
        <div class="delete-confirm-modal">
            <div class="delete-confirm-icon">🗑️</div>
            <div class="delete-confirm-text">Eliminare ${label} <strong>"${item.name}"</strong>?</div>
            <div class="delete-confirm-buttons">
                <button class="btn-cancel" onclick="closeDeleteConfirm()">Annulla</button>
                <button class="btn-danger" onclick="confirmDelete('${type}', '${id}')">Elimina</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    setTimeout(() => overlay.classList.add('active'), 10);
}

function closeDeleteConfirm() {
    const overlay = document.querySelector('.delete-confirm-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 300);
    }
}

function confirmDelete(type, id) {
    closeDeleteConfirm();
    let list;
    if (type === 'habit') list = state.habits;
    else if (type === 'oneshot') list = state.oneshots;
    else if (type === 'quest') list = state.quests;
    else if (type === 'attribute' || type === 'ability') {
        state.stats = state.stats.filter(i => i.id !== id);
        saveState();
        renderAll();
        return;
    }

    const idx = list.findIndex(i => i.id === id);
    if (idx > -1) {
        list.splice(idx, 1);
        saveState();
        renderAll();
    }
}



// Helper for Edit Task
function editTask(type, id) {
    let list;
    if (type === 'habit') list = state.habits;
    else if (type === 'oneshot') list = state.oneshots;
    else if (type === 'quest') list = state.quests;
    else if (type === 'attribute' || type === 'ability') list = state.stats;

    const item = list.find(i => i.id === id);
    if (item) openModal(type, item);
}

// Quest Detail Helpers
function closeQuestDetailModal() {
    document.getElementById('questDetailModal').classList.remove('active');
    currentOpenedQuestId = null;
}

function deleteCurrentQuestInModal() {
    if (currentOpenedQuestId) {
        if (confirm('Eliminare questa quest?')) {
            deleteTask('quest', currentOpenedQuestId);
            closeQuestDetailModal();
        }
    }
}

function editCurrentQuestInModal() {
    if (currentOpenedQuestId) {
        editTask('quest', currentOpenedQuestId);
        closeQuestDetailModal();
    }
}

window.editTask = editTask;
window.closeQuestDetailModal = closeQuestDetailModal;
window.closeStatDetailModal = closeStatDetailModal;
window.openStatDetail = openStatDetail;
window.deleteCurrentQuestInModal = deleteCurrentQuestInModal;
window.editCurrentQuestInModal = editCurrentQuestInModal;

// Obsolete - removed in cleanup

function handleTaskClick(e, type, id) {
    if (e.target.closest('.card-checkbox')) return;

    // Prevent click if a swipe action was just triggered
    if (window.checkSwipeTrigger && window.checkSwipeTrigger()) return;

    // Open edit modal or detail view
    let list;
    if (type === 'attribute' || type === 'ability') {
        list = state.stats;
    } else {
        list = type === 'habit' ? state.habits : (type === 'oneshot' ? state.oneshots : state.quests);
    }

    const item = list.find(i => i.id === id);
    if (item) {
        if (type === 'quest') {
            openQuestDetail(id);
        } else if (type === 'attribute' || type === 'ability') {
            openStatDetail(id);
        } else {
            openModal(type, item);
        }
    }
}

function deleteTask(type, id) {
    const list = type === 'habit' ? state.habits : (type === 'oneshot' ? state.oneshots : state.quests);
    const item = list.find(i => i.id === id);
    if (item && confirm(`Eliminare "${item.name}" ? `)) {
        const idx = list.indexOf(item);
        if (idx > -1) list.splice(idx, 1);
        saveState();
        renderAll();
    }
}

function duplicateTask(type, id) {
    const list = type === 'habit' ? state.habits : (type === 'oneshot' ? state.oneshots : state.quests);
    const item = list.find(i => i.id === id);
    if (item) {
        const clone = JSON.parse(JSON.stringify(item));
        clone.id = type + '_' + Date.now();
        clone.name = item.name + ' (copia)';
        clone.streak = 0;
        clone.lastCompleted = null;
        clone.completed = false;
        if (clone.subquests) clone.subquests.forEach(s => s.completed = false);
        list.push(clone);
        saveState();
        renderAll();
    }
}

// ============================================
// AVATAR MODAL
// ============================================

function openAvatarModal() {
    document.getElementById('avatarModalOverlay').classList.add('active');
    renderEmojiGrid();
}

function closeAvatarModal() {
    document.getElementById('avatarModalOverlay').classList.remove('active');
}

function switchAvatarTab(tab) {
    document.querySelectorAll('.avatar-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`[onclick = "switchAvatarTab('${tab}')"]`).classList.add('active');

    document.getElementById('emojiTab').classList.toggle('hidden', tab !== 'emoji');
    document.getElementById('uploadTab').classList.toggle('hidden', tab !== 'upload');
}

function renderEmojiGrid() {
    document.getElementById('emojiGrid').innerHTML = AVATAR_EMOJIS.map(emoji =>
        `< button class="emoji-option ${state.player.avatarEmoji === emoji ? 'selected' : ''}" onclick = "selectEmoji('${emoji}')" > ${emoji}</button > `
    ).join('');
}

function selectEmoji(emoji) {
    state.player.avatarType = 'emoji';
    state.player.avatarEmoji = emoji;
    state.player.avatarImage = null;
    saveState();
    renderHeader();
    renderProfilePopup();
    closeAvatarModal();
}

function handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        state.player.avatarType = 'image';
        state.player.avatarImage = e.target.result;
        state.player.avatarEmoji = null;
        saveState();
        renderHeader();
        renderProfilePopup();
        closeAvatarModal();
    };
    reader.readAsDataURL(file);
}

// ============================================
// TOOLTIP
// ============================================

function showStatTooltip(statId, event) {
    const stat = state.stats.find(s => s.id === statId);
    if (!stat) return;

    const tooltip = document.getElementById('tooltip');
    tooltip.innerHTML = `
            <div class="tooltip-title">${stat.icon} ${stat.name} - LV${stat.level}</div>
        <div>${stat.description}</div>
        <div style="margin-top:6px;font-size:11px;color:var(--text-muted)">XP: ${stat.xp}/${getXpForLevel(stat.level + 1)}</div>
        `;
    tooltip.classList.add('visible');

    const rect = event.target.getBoundingClientRect();
    tooltip.style.left = Math.min(rect.left, window.innerWidth - 270) + 'px';
    tooltip.style.top = (rect.bottom + 10) + 'px';

    setTimeout(() => tooltip.classList.remove('visible'), 3000);
}

// ============================================
// UTILITIES
// ============================================

function ensureUniqueIds(list, prefix) {
    if (!list) return;
    const seen = new Set();
    list.forEach(item => {
        if (seen.has(item.id)) {
            // Generate new ID
            const newId = prefix + '_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
            console.warn(`Duplicate ID found: ${item.id} -> replaced with ${newId} `);
            item.id = newId;
        }
        seen.add(item.id);
    });
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
}

// Demo data
function loadDemoData() {
    state.habits.push(
        { id: 'h1', name: 'Meditazione', frequency: 'daily', stars: 3, primaryStatId: 'wis', secondaryStatId: 'con', streak: 5, lastCompleted: null, locked: false, createdAt: new Date().toISOString() },
        { id: 'h2', name: 'Esercizio', frequency: 'daily', stars: 4, primaryStatId: 'str', secondaryStatId: 'con', streak: 12, lastCompleted: null, locked: false, createdAt: new Date().toISOString() }
    );
    state.oneshots.push(
        { id: 'o1', name: 'Chiamare dentista', stars: 2, primaryStatId: 'cha', completed: false, locked: false }
    );
    state.quests.push({
        id: 'q1', name: 'Imparare JavaScript', stars: 5, primaryStatId: 'int', secondaryStatId: 'cre',
        subquests: [
            { id: 's1', name: 'Completare tutorial', completed: true },
            { id: 's2', name: 'Fare 10 esercizi', completed: false },
            { id: 's3', name: 'Costruire progetto', completed: false }
        ],
        completed: false, locked: false
    });
    saveState();
    renderAll();
}

// Helper to fix corrupted data
function fixData() {
    if (confirm('Questo ripristinerà gli attributi predefiniti mantenendo i livelli attuali (ove possibile). Continuare?')) {
        // Backup levels
        const currentLevels = {};
        state.stats.forEach(s => currentLevels[s.id] = s);

        state.stats = [...DEFAULT_ATTRIBUTES.map(a => ({ ...a })), ...DEFAULT_ABILITIES.map(a => ({ ...a }))];

        // Restore progress if id matches
        state.stats.forEach(s => {
            if (currentLevels[s.id]) {
                s.level = currentLevels[s.id].level;
                s.xp = currentLevels[s.id].xp;
                s.visible = currentLevels[s.id].visible;
            }
        });

        saveState();
        renderAll();
        alert('✅ Attributi riparati con successo!');
    }
}

function resetAll() {
    if (confirm('⚠️ ATTENZIONE: Questo cancellerà TUTTI i tuoi progressi, abitudini e dati. \n\nSei sicuro di voler ricominciare da zero?')) {
        localStorage.clear(); // Clear EVERYTHING just to be safe
        window.location.href = window.location.pathname + '?reset=' + Date.now();
    }
}

function exportData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "questlife_backup_" + getGameDate() + ".json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function updateApp() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
            for (let registration of registrations) {
                registration.unregister();
            }
            setTimeout(() => {
                window.location.reload(true);
            }, 500);
        });
    } else {
        window.location.reload(true);
    }
}

function importData(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (data && data.player && data.stats) {
                // Basic validation passed
                localStorage.setItem('questlife_state_v2', JSON.stringify(data));
                alert('✅ Dati importati con successo! Ricarico...');
                location.reload();
            } else {
                alert('❌ Errore: Il file non sembra essere un backup valido di Quest Life.');
            }
        } catch (err) {
            console.error(err);
            alert('❌ Errore durante la lettura del file.');
        }
    };
    reader.readAsText(file);
    // Reset input so change event fires again if same file selected
    input.value = '';
}



// ============================================
// VISIBILITY POPUP (Long-press on radar chart)
// ============================================

let visibilityPopupTimer = null;
let ignoreNextClick = false;

function initVisibilityPopup() {
    const chartContainer = document.querySelector('.stats-chart-container');
    if (!chartContainer) return;

    chartContainer.addEventListener('mousedown', startVisibilityPopup);
    chartContainer.addEventListener('touchstart', startVisibilityPopup, { passive: true });
    chartContainer.addEventListener('mouseup', cancelVisibilityPopup);
    chartContainer.addEventListener('touchend', cancelVisibilityPopup);
    chartContainer.addEventListener('mouseleave', cancelVisibilityPopup);

    // Close popup when clicking outside
    document.addEventListener('click', (e) => {
        if (ignoreNextClick) {
            ignoreNextClick = false;
            return;
        }

        const popup = document.getElementById('visibilityPopup');
        if (popup && !popup.classList.contains('hidden') && !popup.contains(e.target)) {
            popup.classList.add('hidden');
        }
    });
}

function startVisibilityPopup(e) {
    cancelVisibilityPopup();
    visibilityPopupTimer = setTimeout(() => {
        showVisibilityPopup(e);
    }, 500); // 500ms long press
}

function cancelVisibilityPopup() {
    if (visibilityPopupTimer) {
        clearTimeout(visibilityPopupTimer);
        visibilityPopupTimer = null;
    }
}

function showVisibilityPopup(e) {
    const popup = document.getElementById('visibilityPopup');
    if (!popup) return;

    ignoreNextClick = true;
    // Reset ignore flag after a short delay to allow the 'click' from mouseup to pass
    setTimeout(() => { ignoreNextClick = false; }, 500);

    // Build list
    const list = document.getElementById('visibilityList');
    list.innerHTML = state.stats.map(stat => `
            <div class="visibility-item">
                <input type="checkbox" id="vis-${stat.id}" ${stat.visible ? 'checked' : ''}
                    onchange="toggleStatVisibilityFromPopup('${stat.id}')">
                    <label for="vis-${stat.id}">${stat.icon} ${stat.name}</label>
                </div>
        `).join('');

    // Position popup centered over chart
    const chartContainer = document.querySelector('.stats-chart-container');
    if (chartContainer) {
        // Show first to measure dimensions
        popup.classList.remove('hidden');

        const chartRect = chartContainer.getBoundingClientRect();
        const popupRect = popup.getBoundingClientRect();

        const centerX = chartRect.left + (chartRect.width / 2) - (popupRect.width / 2);
        const centerY = chartRect.top + (chartRect.height / 2) - (popupRect.height / 2);

        popup.style.left = centerX + 'px';
        popup.style.top = centerY + 'px';
    } else {
        // Fallback if container not found
        popup.classList.remove('hidden');
    }
}

function toggleStatVisibilityFromPopup(statId) {
    const stat = state.stats.find(s => s.id === statId);
    if (stat) {
        stat.visible = !stat.visible;
        saveState();
        renderRadarChart();
        renderStatsGrid();
    }
}

// ============================================
// TOXIC INVENTORY
// ============================================

function openToxicInventory() {
    document.getElementById('toxicInventoryOverlay').classList.add('active');
    document.getElementById('toxicInventoryModal').classList.remove('hidden');
    renderToxicInventory();
}

function closeToxicInventory() {
    document.getElementById('toxicInventoryOverlay').classList.remove('active');
    document.getElementById('toxicInventoryModal').classList.add('hidden');
}

function renderToxicInventory() {
    const list = document.getElementById('toxicItemList');
    if (!list) return;

    if (state.toxicItems.length === 0) {
        list.innerHTML = `
            <div style="text-align: center; padding: 30px 10px; color: var(--text-muted); font-size: 14px;">
                <div style="font-size: 40px; margin-bottom: 10px; opacity: 0.3;">🎒</div>
                Il tuo zaino è vuoto.<br>Crea oggetti tossici per tracciare le cattive abitudini.
            </div>
        `;
        return;
    }

    list.innerHTML = state.toxicItems.map(item => {
        const stat = state.stats.find(s => s.id === item.statId);
        return `
            <div class="toxic-item-card">
                <div class="toxic-item-info">
                    <div class="toxic-item-icon">${item.icon}</div>
                    <div class="toxic-item-details">
                        <h4>${item.name}</h4>
                        <div class="toxic-item-penalty">-${item.penalty} XP a ${stat ? stat.name : 'Attributo'}</div>
                    </div>
                </div>
                <div style="display: flex; gap: 8px; align-items: center;">
                    <span onclick="editToxicItem('${item.id}')" style="cursor:pointer; opacity: 0.6; font-size: 14px;">✏️</span>
                    <button class="btn-use-toxic" onclick="useToxicItem('${item.id}')">Usa</button>
                </div>
            </div>
        `;
    }).join('');
}

function useToxicItem(id) {
    const item = state.toxicItems.find(it => it.id === id);
    if (!item) return;

    // Deduct XP
    addXp(-item.penalty, item.statId, item.name);

    // Feedback
    const btn = event.target;
    const originalText = btn.textContent;
    btn.textContent = 'Fatto! 💀';
    btn.style.background = '#ff4d4d';
    btn.style.color = 'white';

    setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
        btn.style.color = '';
        renderAll();
    }, 1000);
}

function editToxicItem(id) {
    const item = state.toxicItems.find(it => it.id === id);
    if (item) {
        openModal('toxic', item);
    }
}

// ============================================
// POMODORO TIMER
// ============================================

function openPomodoroTimer() {
    const modal = document.getElementById('pomodoroModal');
    const overlay = document.getElementById('pomodoroOverlay');
    if (modal) modal.classList.remove('hidden');
    if (overlay) overlay.classList.add('active');

    // Populate stat selector
    const statSelect = document.getElementById('pomodoroStat');
    if (statSelect) {
        statSelect.innerHTML = state.stats.map(s =>
            `<option value="${s.id}" ${s.id === state.pomodoro.targetStatId ? 'selected' : ''}>${s.icon} ${s.name}</option>`
        ).join('');
    }

    // Set duration input
    const durationInput = document.getElementById('pomodoroDuration');
    if (durationInput) durationInput.value = state.pomodoro.workDuration;

    updatePomodoroDisplay();
}

function closePomodoroTimer() {
    const modal = document.getElementById('pomodoroModal');
    const overlay = document.getElementById('pomodoroOverlay');
    if (modal) modal.classList.add('hidden');
    if (overlay) overlay.classList.remove('active');
}

function savePomodoroSettings() {
    const statSelect = document.getElementById('pomodoroStat');
    const durationInput = document.getElementById('pomodoroDuration');

    if (statSelect) state.pomodoro.targetStatId = statSelect.value;
    if (durationInput) {
        state.pomodoro.workDuration = Math.max(1, Math.min(60, parseInt(durationInput.value) || 25));
        if (!pomodoroRunning) {
            pomodoroTimeLeft = state.pomodoro.workDuration * 60;
            updatePomodoroDisplay();
        }
    }
    saveState();
}

function togglePomodoro() {
    if (pomodoroRunning) {
        pausePomodoro();
    } else {
        startPomodoro();
    }
}

function startPomodoro() {
    pomodoroRunning = true;
    const btn = document.getElementById('pomodoroStartBtn');
    if (btn) {
        btn.textContent = '⏸️ Pausa';
        btn.classList.add('running');
    }
    document.getElementById('pomodoroStatus').textContent = 'In corso...';

    pomodoroInterval = setInterval(tickPomodoro, 1000);
}

function pausePomodoro() {
    pomodoroRunning = false;
    clearInterval(pomodoroInterval);
    const btn = document.getElementById('pomodoroStartBtn');
    if (btn) {
        btn.textContent = '▶️ Riprendi';
        btn.classList.remove('running');
    }
    document.getElementById('pomodoroStatus').textContent = 'In pausa';
}

function resetPomodoro() {
    pomodoroRunning = false;
    clearInterval(pomodoroInterval);
    pomodoroTimeLeft = state.pomodoro.workDuration * 60;
    updatePomodoroDisplay();
    const btn = document.getElementById('pomodoroStartBtn');
    if (btn) {
        btn.textContent = '▶️ Avvia';
        btn.classList.remove('running');
    }
    document.getElementById('pomodoroStatus').textContent = 'Pronto';
}

function tickPomodoro() {
    if (pomodoroTimeLeft > 0) {
        pomodoroTimeLeft--;
        updatePomodoroDisplay();
    } else {
        completePomodoro();
    }
}

function updatePomodoroDisplay() {
    const minutes = Math.floor(pomodoroTimeLeft / 60);
    const seconds = pomodoroTimeLeft % 60;
    const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    const timeEl = document.getElementById('pomodoroTime');
    if (timeEl) timeEl.textContent = timeStr;

    const countEl = document.getElementById('pomodoroCount');
    if (countEl) countEl.textContent = state.pomodoro.sessionsToday;

    const xpEl = document.getElementById('pomodoroXp');
    if (xpEl) xpEl.textContent = state.pomodoro.xpPerSession;
}

function completePomodoro() {
    clearInterval(pomodoroInterval);
    pomodoroRunning = false;

    // Add XP
    const statName = state.stats.find(s => s.id === state.pomodoro.targetStatId)?.name || 'Stat';
    addXp(state.pomodoro.xpPerSession, state.pomodoro.targetStatId, '🍅 Pomodoro');

    // Update session count
    state.pomodoro.sessionsToday++;
    state.pomodoro.lastSessionDate = getGameDateString();
    saveState();

    // Play sound (simple beep)
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 800;
        gain.gain.value = 0.3;
        osc.start();
        setTimeout(() => osc.stop(), 200);
    } catch (e) { /* Audio not supported */ }

    // Vibrate on mobile
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);

    // Reset timer
    pomodoroTimeLeft = state.pomodoro.workDuration * 60;
    updatePomodoroDisplay();

    const btn = document.getElementById('pomodoroStartBtn');
    if (btn) {
        btn.textContent = '▶️ Avvia';
        btn.classList.remove('running');
    }
    document.getElementById('pomodoroStatus').textContent = `✅ +${state.pomodoro.xpPerSession} XP ${statName}!`;
}

// ============================================
// WEEKLY RECAP
// ============================================

function checkWeeklyRecap() {
    const today = getGameDateObj();
    const dayOfWeek = today.getDay(); // 0 = Sunday

    // Only show on Sunday
    if (dayOfWeek !== 0) return;

    // Check if already shown this week
    const currentWeek = getWeekIdentifier(getGameDateString());
    if (state.lastRecapWeek === currentWeek) return;

    // Show recap
    showWeeklyRecap();
}

function showWeeklyRecap() {
    const recap = calculateWeeklyRecap();

    const weekLabel = document.getElementById('recapWeekLabel');
    if (weekLabel) {
        const today = getGameDateObj();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - 6);
        weekLabel.textContent = `${weekStart.getDate()}/${weekStart.getMonth() + 1} - ${today.getDate()}/${today.getMonth() + 1}`;
    }

    const cardsEl = document.getElementById('recapCards');
    if (cardsEl) {
        cardsEl.innerHTML = `
            <div class="recap-card">
                <div class="recap-card-icon">⚡</div>
                <div class="recap-card-value">${recap.totalXp}</div>
                <div class="recap-card-label">XP Guadagnati</div>
            </div>
            <div class="recap-card">
                <div class="recap-card-icon">${recap.topStat?.icon || '🏆'}</div>
                <div class="recap-card-value">${recap.topStat?.name || '-'}</div>
                <div class="recap-card-label">Stat Top</div>
            </div>
            <div class="recap-card">
                <div class="recap-card-icon">✅</div>
                <div class="recap-card-value">${recap.bestHabit?.name || '-'}</div>
                <div class="recap-card-label">Abitudine Top</div>
            </div>
            <div class="recap-card">
                <div class="recap-card-icon">🍅</div>
                <div class="recap-card-value">${recap.pomodoroCount}</div>
                <div class="recap-card-label">Pomodori</div>
            </div>
        `;
    }

    document.getElementById('weeklyRecapModal')?.classList.remove('hidden');
    document.getElementById('weeklyRecapOverlay')?.classList.remove('hidden');
}

function closeWeeklyRecap() {
    document.getElementById('weeklyRecapModal')?.classList.add('hidden');
    document.getElementById('weeklyRecapOverlay')?.classList.add('hidden');

    // Mark as shown for this week
    state.lastRecapWeek = getWeekIdentifier(getGameDateString());
    saveState();
}

function calculateWeeklyRecap() {
    const today = getGameDateObj();
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        weekDates.push(formatISO(d));
    }

    // Total XP this week
    const weekXpEntries = state.xpLog.filter(entry => weekDates.includes(entry.date) && entry.amount > 0);
    const totalXp = weekXpEntries.reduce((sum, e) => sum + e.amount, 0);

    // Top stat (most XP gained)
    const statXp = {};
    weekXpEntries.forEach(entry => {
        statXp[entry.statId] = (statXp[entry.statId] || 0) + entry.amount;
    });
    const topStatId = Object.entries(statXp).sort((a, b) => b[1] - a[1])[0]?.[0];
    const topStat = state.stats.find(s => s.id === topStatId);

    // Best habit (most completions)
    const habitCompletions = {};
    state.habits.forEach(habit => {
        let count = 0;
        weekDates.forEach(date => {
            if (state.completionLog[date]?.includes(habit.id)) count++;
        });
        habitCompletions[habit.id] = count;
    });
    const bestHabitId = Object.entries(habitCompletions).sort((a, b) => b[1] - a[1])[0]?.[0];
    const bestHabit = state.habits.find(h => h.id === bestHabitId);

    // Pomodoro count (approximate from xpLog)
    const pomodoroCount = weekXpEntries.filter(e => e.sourceName?.includes('Pomodoro')).length;

    return { totalXp, topStat, bestHabit, pomodoroCount };
}

// Expose Weekly Recap functions
window.closeWeeklyRecap = closeWeeklyRecap;

// Expose Pomodoro functions to window
window.openPomodoroTimer = openPomodoroTimer;
window.closePomodoroTimer = closePomodoroTimer;
window.togglePomodoro = togglePomodoro;
window.resetPomodoro = resetPomodoro;
window.savePomodoroSettings = savePomodoroSettings;

// Expose functions to window
window.openToxicInventory = openToxicInventory;
window.closeToxicInventory = closeToxicInventory;
window.useToxicItem = useToxicItem;
window.editToxicItem = editToxicItem;

// Expose to console
window.loadDemoData = loadDemoData;
window.fixData = fixData;
window.resetAll = resetAll;
window.exportData = exportData;
window.importData = importData;
window.updateApp = updateApp;

// Expose all functions called from HTML onclick handlers
window.toggleAccordion = toggleAccordion;
window.openModal = openModal;
window.updatePlayerName = updatePlayerName;
window.closeModal = closeModal;
window.submitModal = submitModal;
window.toggleHabit = toggleHabit;
window.completeOneshot = completeOneshot;
window.completeQuest = completeQuest;
window.toggleSubquest = toggleSubquest;
window.toggleStatVisibility = toggleStatVisibility;
window.toggleStatVisibilityFromPopup = toggleStatVisibilityFromPopup;
window.toggleProfilePopup = toggleProfilePopup;
window.toggleStreakPopup = toggleStreakPopup; // New
window.switchSection = switchSection; // New
window.saveMotto = saveMotto; // New
window.editStat = editStat;
window.deleteStat = deleteStat;
window.setAccent = setAccent;
window.toggleColorDropdown = toggleColorDropdown;
window.openMottoEdit = openMottoEdit;
window.closeMottoEdit = closeMottoEdit;
window.confirmMottoEdit = confirmMottoEdit;
window.showStatTooltip = showStatTooltip;
window.hideStatTooltip = hideStatTooltip;
window.contextAction = contextAction;
window.openAvatarModal = openAvatarModal;
window.closeAvatarModal = closeAvatarModal;
window.switchAvatarTab = switchAvatarTab;
window.selectEmoji = selectEmoji;
window.handleAvatarUpload = handleAvatarUpload;
window.showStreakCelebration = showStreakCelebration;
window.closeStreakCelebration = closeStreakCelebration;
window.closeDeleteConfirm = closeDeleteConfirm;
window.confirmDelete = confirmDelete;

// Quest Detail
window.openQuestDetail = openQuestDetail;
window.closeQuestDetailModal = closeQuestDetailModal;
window.openStatDetail = openStatDetail;
window.closeStatDetailModal = closeStatDetailModal;
window.toggleSubquest = toggleSubquest;
window.editCurrentQuestInModal = editCurrentQuestInModal;
window.deleteCurrentQuestInModal = deleteCurrentQuestInModal;

function showStreakCelebration(streak) {
    const overlay = document.getElementById('streakCelebration');
    const countEl = document.getElementById('celebrationCount');

    if (overlay && countEl) {
        countEl.textContent = streak;
        overlay.classList.remove('hidden');
        // Small delay to allow display:block to apply before adding active class for transition
        setTimeout(() => {
            overlay.classList.add('active');
        }, 10);

        // Optional: Play sound here
    }
}

function closeStreakCelebration() {
    const overlay = document.getElementById('streakCelebration');
    if (overlay) {
        overlay.classList.remove('active');
        setTimeout(() => {
            overlay.classList.add('hidden');
        }, 300); // Wait for transition
    }
}

// Global click listener for dropdowns
window.addEventListener('click', (e) => {
    const dropdown = document.getElementById('colorDropdown');
    const trigger = document.getElementById('colorTrigger');
    if (!dropdown || !trigger || dropdown.classList.contains('hidden')) return;

    if (!trigger.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.add('hidden');
    }
});

// window.navigateTo removed
