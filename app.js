console.log("APP.JS LOADED - v3.1.14");
/* ============================================
   QUEST LIFE - RPG Habit Tracker v2
   Main Application Script
   ============================================ */

export const APP_VERSION = '3.2.1';
import { DEFAULT_ATTRIBUTES, DEFAULT_ABILITIES, AVATAR_EMOJIS, ACCENT_COLORS, XP_CONFIG, TITLES, DAY_NAMES, CHALLENGE_TEMPLATES } from './js/modules/constants.js?v=3.1.14';
import { state, setState, updateState, loadState, saveState, resetAll, checkHealthRollover } from './js/modules/state.js?v=3.1.14';
import { getGameDateObj, formatISO, getGameDate, getGameDateString, getWeekIdentifier, getMonthIdentifier, getYearIdentifier, calculateXp, getXpForLevel, ensureUniqueIds, getCumulativeXpForLevel, calculateLevelFromXp, formatDate, generateId } from './js/modules/utils.js?v=3.1.14';
import { setFileHandle, getFileHandle, linkDatabaseFile as linkDBInit, loadFileHandleOnStart, updateDbStatusUI, saveDataToFile } from './js/modules/storage.js?v=3.1.14';

// Expose globals for HTML event handlers and legacy code
window.state = state;
window.saveState = saveState;
window.resetAll = resetAll;
window.APP_VERSION = APP_VERSION;
window.DEFAULT_ATTRIBUTES = DEFAULT_ATTRIBUTES;
window.DEFAULT_ABILITIES = DEFAULT_ABILITIES;
window.AVATAR_EMOJIS = AVATAR_EMOJIS;
window.ACCENT_COLORS = ACCENT_COLORS;
window.XP_CONFIG = XP_CONFIG;
window.TITLES = TITLES;
window.DAY_NAMES = DAY_NAMES;
window.CHALLENGE_TEMPLATES = CHALLENGE_TEMPLATES;

// Navigation & Modals
window.switchSection = switchSection;
window.openHealthInput = openHealthInput;
window.showDailyPlanner = showDailyPlanner;
window.openMealsModal = openMealsModal;
window.openExerciseLogModal = openExerciseLogModal;
window.openExerciseManager = openExerciseManager;
window.confirmManualIntake = confirmManualIntake;
window.confirmNewGoal = confirmNewGoal;
window.confirmManualBurn = confirmManualBurn;
window.submitHealthInput = submitHealthInput;
window.closeHealthInput = closeHealthInput;
window.openWeightModal = openWeightModal;
window.closeWeightModal = closeWeightModal;
window.showDailyPlanner = showDailyPlanner;
window.openTaskPicker = openTaskPicker;
window.closeTaskPicker = closeTaskPicker;
window.addNewPlannerSlot = addNewPlannerSlot;
window.rollD10AndSave = rollD10AndSave;
window.closeDailyPlanner = closeDailyPlanner;
window.showChallengeCatalog = showChallengeCatalog;

// Wrapper for linkDatabaseFile to pass state
window.linkDatabaseFile = async function () {
    await linkDBInit(state);
};

// Shift progressive habits that weren't completed yesterday to today
function shiftProgressiveHabits() {
    const today = getGameDate();
    let changed = false;

    state.habits.forEach(h => {
        if (h.locked) return;
        if (h.frequency !== 'times_week' && h.frequency !== 'times_month') return;

        const isWeekly = h.frequency === 'times_week';
        const periodId = isWeekly ? getWeekIdentifier(today) : getMonthIdentifier(today);
        const completionsThisPeriod = countCompletionsInPeriod(h.id, h.frequency, periodId);
        const targetCompletions = h.freqTimes || 1;

        // If target already met, no shifting needed
        if (completionsThisPeriod >= targetCompletions) {
            if (h.shiftedToDate) {
                h.shiftedToDate = null;
                changed = true;
            }
            return;
        }

        // If habit was scheduled for a past day (before today), shift it to today
        if (!h.shiftedToDate || h.shiftedToDate < today) {
            h.shiftedToDate = today;
            changed = true;
        }
    });

    if (changed) {
        saveState();
    }
}

// Check habit streaks and reset if yesterday was missed (after grace period)
function checkHabitStreaks() {
    const now = getGameDateObj();
    const currentHour = now.getHours();
    const today = getGameDate();
    const yesterday = getGameDateObj();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = formatISO(yesterday);

    // GRACE PERIOD: Don't reset streaks until after noon
    // This gives users time to mark yesterday's habits before losing the streak
    if (currentHour < 12) {
        console.log('Streak check: Still in grace period (before noon), skipping reset');
        return;
    }

    let changed = false;

    state.habits.forEach(habit => {
        if (habit.locked) return;
        if (!habit.streak || habit.streak === 0) return;

        // ONLY check DAILY habits - periodic habits have their own logic
        if (habit.frequency && habit.frequency !== 'daily') {
            return;
        }

        // Check if habit was created after yesterday (don't reset new habits)
        if (habit.createdAt) {
            const createdDate = formatISO(new Date(habit.createdAt));
            if (createdDate > yesterdayStr) return;
        }

        // Check if habit was completed yesterday
        const logYesterday = state.completionLog[yesterdayStr];
        let completedYesterday = false;

        if (logYesterday) {
            if (logYesterday.habits && Array.isArray(logYesterday.habits)) {
                completedYesterday = logYesterday.habits.includes(habit.id);
            } else if (Array.isArray(logYesterday)) {
                completedYesterday = logYesterday.includes(habit.id);
            }
        }

        // Reset if NOT completed yesterday (and we're past noon grace period)
        if (!completedYesterday) {
            console.log(`Resetting streak for daily habit: ${habit.name} (was ${habit.streak}) - past noon grace period`);
            habit.streak = 0;
            changed = true;
        }
    });

    if (changed) {
        saveState();
        renderAll();
    }
}

// Rebuild habit streaks from completion log (Robust Repair)
function rebuildStreaksFromLog() {
    const today = getGameDate();
    let fixed = 0;

    console.log("Starting Streak Repair...");

    // Helper to check if habit was completed on a date
    function wasCompletedOnDate(habitId, dateStr) {
        const log = state.completionLog[dateStr];
        if (!log) return false;

        // Handle { habits: [...] } format
        if (log.habits && Array.isArray(log.habits)) {
            return log.habits.includes(habitId);
        }
        // Handle old [...] format
        if (Array.isArray(log)) {
            return log.includes(habitId);
        }
        return false;
    }

    state.habits.forEach(habit => {
        // Skip non-daily habits only if frequency is explicitly set to something else
        if (habit.frequency && habit.frequency !== 'daily') return;

        let streak = 0;
        let checkDate = getGameDateObj(); // Start with real today object

        // 1. Check Today
        let dateStr = formatISO(checkDate);
        if (wasCompletedOnDate(habit.id, dateStr)) {
            streak++;
        }

        // 2. Scan backwards from Yesterday
        // We always check yesterday to continue the chain
        checkDate.setDate(checkDate.getDate() - 1);

        // Safety: Scan max 1000 days back
        for (let i = 0; i < 1000; i++) {
            dateStr = formatISO(checkDate);
            if (wasCompletedOnDate(habit.id, dateStr)) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                // Gap found!
                // If we haven't found ANY streak yet (today wasn't done),
                // and the gap is just today (which we handled) -> wait.
                // The loop checks YESTERDAY first. If yesterday is missing, streak is broken.
                // But wait! If today is missing, we shouldn't reset streak to 0 if yesterday was done?
                // Logic check: 
                // If Today Done: streak=1. Check Yesterday. Done? streak=2.
                // If Today NOT Done: streak=0. Check Yesterday. Done? streak=1.
                // This logic holds.
                break;
            }
        }

        // Apply fix if different
        // INTENTIONAL: Should not downgrade high streaks if the log seems empty (data loss protection)
        // BUT here we assume the log IS the source of truth after a Restore.
        // If streak calculated is 0 but current is > 0, we might be deleting valid frozen streaks.
        // COMPROMISE: Only update if calculated streak is > 0 OR if current streak matches a simple pattern?
        // No, trusted "Repair" means "make it match the log".

        if (habit.streak !== streak) {
            console.log(`Fixing streak for ${habit.name}: ${habit.streak} -> ${streak}`);
            habit.streak = streak;
            fixed++;
        }
    });

    // --- NEW: Global Streak Repair ---
    let repairGlobal = 0;
    let checkDateObj = getGameDateObj();
    const THRESHOLD = 70;
    let lastActionDateRepair = null;

    // Scan backwards max 1000 days
    for (let i = 0; i < 1000; i++) {
        const dateStr = formatISO(checkDateObj);
        const completion = getCompletionForDate(dateStr);

        if (completion >= THRESHOLD) {
            repairGlobal++;
            if (!lastActionDateRepair) lastActionDateRepair = dateStr;
            checkDateObj.setDate(checkDateObj.getDate() - 1);
        } else {
            // If i=0 (today), the streak is valid as of yesterday.
            // We just skip today's check and continue.
            if (i === 0) {
                checkDateObj.setDate(checkDateObj.getDate() - 1);
                continue;
            }
            // Gap found! Streak stops here.
            break;
        }
    }

    if (state.player.globalStreak !== repairGlobal) {
        console.log(`[StreakRepair] Global Streak Fixed: ${state.player.globalStreak} -> ${repairGlobal}`);
        state.player.globalStreak = repairGlobal;
        if (lastActionDateRepair) state.player.lastActionDate = lastActionDateRepair;
        fixed++;
    }

    if (fixed > 0) {
        saveState();
        renderAll();
        // Force refresh UI dependent on streaks
        if (typeof renderHabits === 'function') renderHabits();
    }

    return fixed;
}

window.rebuildStreaksFromLog = rebuildStreaksFromLog;

// UI wrapper for rebuildStreaksFromLog with user feedback
function rebuildStreaksUI() {
    const fixed = rebuildStreaksFromLog();
    if (fixed > 0) {
        alert(`✅ Riparate ${fixed} streak!\n\nLe streak (inclusa quella Generale: ${state.player.globalStreak}) sono state ricalcolate basandosi sullo storico.`);
    } else {
        alert('✅ Tutte le streak sono già corrette!\n\nNessuna modifica necessaria.');
    }
}

window.rebuildStreaksUI = rebuildStreaksUI;

// ============================================
// XP PENALTY SYSTEM
// ============================================
// Grace period: Complete yesterday's habits until noon today
// After noon: Double XP penalty for uncompleted habits

function checkPenalties() {
    const now = getGameDateObj();
    const currentHour = now.getHours();
    const today = getGameDate();

    // Only check after noon (12:00)
    if (currentHour < 12) return;

    // Get yesterday's date
    const yesterday = new Date(getGameDateObj());
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = formatISO(yesterday);

    // Create a unique check identifier for today's noon check
    const todayNoonCheck = `${today}-noon`;

    // If we already ran the penalty check today after noon, skip
    if (state.lastPenaltyCheck === todayNoonCheck) return;

    // Calculate penalties for yesterday's uncompleted daily habits
    const penalties = [];

    state.habits.forEach(habit => {
        if (habit.locked) return;

        // Handle DAILY habits
        if (!habit.frequency || habit.frequency === 'daily') {
            // Check if habit existed yesterday
            if (habit.createdAt) {
                const createdDate = formatISO(new Date(habit.createdAt));
                if (createdDate > yesterdayStr) return; // Habit didn't exist yesterday
            }

            // Check if completed yesterday
            const completedYesterday = state.completionLog[yesterdayStr]?.habits?.includes(habit.id);

            if (!completedYesterday) {
                const baseXp = calculateXp(habit.stars);
                const penaltyXp = baseXp * 2; // Double the penalty

                penalties.push({
                    habitId: habit.id,
                    habitName: habit.name,
                    xpLost: penaltyXp,
                    statId: habit.primaryStatId,
                    baseXp: baseXp
                });
            }
        }
    });

    // Check for periodic habits at end of period
    checkPeriodicPenalties(penalties);

    // Apply penalties
    if (penalties.length > 0) {
        applyPenalties(penalties, today);
    }

    // Mark check as done for today
    state.lastPenaltyCheck = todayNoonCheck;
    saveState();
}

function checkPeriodicPenalties(penalties) {
    const today = getGameDate();
    const currentWeekId = getWeekIdentifier(today);
    const currentMonthId = getMonthIdentifier(today);

    // Get previous week/month identifiers
    const yesterday = new Date(getGameDateObj());
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = formatISO(yesterday);
    const yesterdayWeekId = getWeekIdentifier(yesterdayStr);
    const yesterdayMonthId = getMonthIdentifier(yesterdayStr);

    state.habits.forEach(habit => {
        if (habit.locked) return;

        // WEEKLY habits (times_week) - check if week changed
        if (habit.frequency === 'times_week' && currentWeekId !== yesterdayWeekId) {
            const targetCompletions = habit.freqTimes || 1;
            const actualCompletions = countCompletionsInPeriod(habit.id, habit.frequency, yesterdayWeekId);
            const missedCompletions = Math.max(0, targetCompletions - actualCompletions);

            if (missedCompletions > 0) {
                const baseXp = calculateXp(habit.stars);
                const penaltyXp = baseXp * 2 * missedCompletions;

                penalties.push({
                    habitId: habit.id,
                    habitName: `${habit.name} (${missedCompletions}x mancate)`,
                    xpLost: penaltyXp,
                    statId: habit.primaryStatId,
                    baseXp: baseXp * missedCompletions,
                    isPeriodic: true
                });
            }
        }

        // MONTHLY habits (times_month) - check if month changed
        if (habit.frequency === 'times_month' && currentMonthId !== yesterdayMonthId) {
            const targetCompletions = habit.freqTimes || 1;
            const actualCompletions = countCompletionsInPeriod(habit.id, habit.frequency, yesterdayMonthId);
            const missedCompletions = Math.max(0, targetCompletions - actualCompletions);

            if (missedCompletions > 0) {
                const baseXp = calculateXp(habit.stars);
                const penaltyXp = baseXp * 2 * missedCompletions;

                penalties.push({
                    habitId: habit.id,
                    habitName: `${habit.name} (${missedCompletions}x mancate)`,
                    xpLost: penaltyXp,
                    statId: habit.primaryStatId,
                    baseXp: baseXp * missedCompletions,
                    isPeriodic: true
                });
            }
        }
    });
}

function applyPenalties(penalties, dateStr) {
    let totalXpLost = 0;

    penalties.forEach(penalty => {
        // Subtract XP from the stat
        addXp(-penalty.xpLost, penalty.statId, `Penalità: ${penalty.habitName}`);
        totalXpLost += penalty.xpLost;
    });

    // Log the penalties
    if (!state.penaltyLog[dateStr]) {
        state.penaltyLog[dateStr] = [];
    }
    state.penaltyLog[dateStr].push(...penalties);

    // Show penalty popup to user
    showPenaltyPopup(penalties, totalXpLost);

    saveState();
}

function showPenaltyPopup(penalties, totalXpLost) {
    // Create overlay if it doesn't exist
    let overlay = document.getElementById('penaltyOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'penaltyOverlay';
        overlay.className = 'modal-overlay penalty-overlay';
        overlay.innerHTML = `
            <div class="penalty-popup">
                <div class="penalty-icon">⚠️</div>
                <h2 class="penalty-title">Penalità XP</h2>
                <p class="penalty-subtitle">Non hai completato alcune abitudini</p>
                <div class="penalty-list" id="penaltyList"></div>
                <div class="penalty-total">
                    <span>Totale perso:</span>
                    <span class="penalty-total-xp" id="penaltyTotalXp">-0 XP</span>
                </div>
                <button class="settings-btn primary" onclick="closePenaltyPopup()">Ho capito</button>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    // Populate penalty list
    const listEl = document.getElementById('penaltyList');
    listEl.innerHTML = penalties.map(p => `
        <div class="penalty-item">
            <span class="penalty-name">${p.habitName}</span>
            <span class="penalty-xp">-${p.xpLost} XP</span>
        </div>
    `).join('');

    // Update total
    document.getElementById('penaltyTotalXp').textContent = `-${totalXpLost} XP`;

    // Show overlay
    overlay.classList.remove('hidden');
}

function closePenaltyPopup() {
    const overlay = document.getElementById('penaltyOverlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }
}
window.closePenaltyPopup = closePenaltyPopup;

let radarChart = null;
let contextTarget = null;
// longPressTimer removed
let lastPointerX = 0;
let lastPointerY = 0;
let swipeStartX = 0;
let currentSwipeCard = null;
let editingItem = null;
let viewedDate = getGameDate();
let profilePopupTimer = null; // reused or new logic for toggle
let currentNutritionInvTab = 'food';
let currentMealTab = 'breakfast';

// Pomodoro Timer
let pomodoroInterval = null;
let pomodoroTimeLeft = 25 * 60; // seconds
let pomodoroRunning = false;

// ============================================
// FILE SYSTEM ACCESS (Database File)
// ============================================

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    try {
        loadState();
        // Re-initialize viewedDate after loadState to respect dayStartTime setting
        viewedDate = getGameDate();
        loadSettingsGroupsState();
        applyTheme();
    } catch (err) {
        console.error("Critical Init Error:", err);
        alert("Errore di Inizializzazione: " + err.message + "\n\nSe il problema persiste, prova a cancellare la cache.");
    }

    shiftProgressiveHabits(); // Shift any habits that weren't completed yesterday
    sanitizeDailyCompletionLog(viewedDate); // Sanity Check on Boot (Phantom Checks)
    checkFrozenStreak();
    initNavigation();

    // Auto-update check on idle (10s)
    let idleTimer = setTimeout(() => {
        console.log("Idle for 10s at launch, checking for updates...");
        updateApp();
    }, 10000);

    // Clear timer on interaction
    const clearIdle = () => {
        if (idleTimer) {
            clearTimeout(idleTimer);
            idleTimer = null;
            ['click', 'touchstart', 'scroll', 'keydown'].forEach(evt =>
                document.removeEventListener(evt, clearIdle)
            );
        }
    };

    ['click', 'touchstart', 'scroll', 'keydown'].forEach(evt =>
        document.addEventListener(evt, clearIdle, { once: true, passive: true })
    );
    initSettings();
    initColorPicker();
    initSwipe();
    initVisibilityPopup();
    initNavSwipe();
    renderAll();

    // Check for first time setup wizard
    setTimeout(() => checkFirstTimeSetup(), 500);

    // Check for weekly recap (Sunday)
    setTimeout(() => checkWeeklyRecap(), 1000);

    // Check for daily D&D planner (after 6 AM)
    setTimeout(() => checkDailyPlan(), 1500);

    // Check and reset habit streaks for missed days
    setTimeout(() => checkHabitStreaks(), 2000);

    // Check for XP penalties (uncompleted habits after grace period)
    setTimeout(() => checkPenalties(), 2500);

    // Check Nutrition Rewards (Daily rollover)
    setTimeout(() => checkNutritionRewards(), 3000);

    // Initialize File System (Database File)
    loadFileHandleOnStart();

    // Initialize Backup System (Feature Detection + Mobile Logic)
    initBackupSystem();

    // Set version in UI and handle PWA update force
    const versionEl = document.getElementById('appVersion');
    if (versionEl) {
        versionEl.textContent = APP_VERSION;

        // Help PWA update: if stored version is different, attempt a hard reload
        // and update the stored version.
        const storedVersion = localStorage.getItem('questlife_app_version');
        if (storedVersion && storedVersion !== APP_VERSION) {
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
            checkHealthRollover(); // Ensure health saves on return
            const newDate = getGameDate();
            if (newDate !== viewedDate) {
                viewedDate = newDate;
                shiftProgressiveHabits(); // Shift habits to the new day
                sanitizeDailyCompletionLog(viewedDate); // Sanity Check on Rollover
                renderAll();
            }
        }
    });

    // Check for day rollover every minute (foreground only)
    setInterval(() => {
        checkHealthRollover();
        const newDate = getGameDate();
        if (newDate !== viewedDate) {
            console.log(`[RolloverCheck] Auto-rolling day while app is open: ${viewedDate} -> ${newDate}`);
            viewedDate = newDate;
            shiftProgressiveHabits();
            sanitizeDailyCompletionLog(viewedDate);
            renderAll();
            // Trigger nutrition check after rollover
            setTimeout(() => checkNutritionRewards(), 1000);
        }
    }, 60000);

    // Initialize Immersive Effects
    setTimeout(initImmersiveEffects, 500);

    // AUTO-REPAIR STREAKS on Startup (v2.7.87)
    // Ensures data integrity after restores or sync issues without user intervention
    setTimeout(() => {
        console.log("Auto-verifying streak integrity...");
        rebuildStreaksFromLog();
    }, 3000);
});

// SANITY CHECK (v2.8.01)
// Fixes "Phantom Checks" where habits appear done for the new day without user interaction.
function sanitizeDailyCompletionLog(dateStr) {
    if (!state.completionLog[dateStr]) return;

    let changed = false;
    const log = state.completionLog[dateStr];

    // Check habits (only 'daily' ones should be strictly tied to lastCompleted mismatch)
    if (log.habits && Array.isArray(log.habits)) {
        const validIds = [];
        log.habits.forEach(id => {
            const habit = state.habits.find(h => h.id === id);
            if (!habit) return; // Habit deleted?

            // Only strictly sanitize 'daily' habits
            if (!habit.frequency || habit.frequency === 'daily') {
                if (habit.lastCompleted === dateStr) {
                    // Consistent
                    validIds.push(id);
                } else {
                    // Inconsistent: Log says done today, Habit says done previously (or never)
                    console.warn(`[Sanity] WOULD REMOVE phantom completion for ${habit.name}. Log: ${dateStr}, LastCompleted: ${habit.lastCompleted}`);
                    // changed = true; // DISABLED for debugging: preventing data loss if logic is too aggressive
                    validIds.push(id); // Keep it for now
                }
            } else {
                // Progressive habits might be valid due to period logic, keep them
                validIds.push(id);
            }
        });

        if (changed) {
            log.habits = validIds;
            log.dailyTotalSnapshot = log.habits.length; // Approximate
        }
    }

    if (changed) {
        saveState();
        console.log(`[Sanity] Fixed corrupted log for ${dateStr}`);
        // Optional: Toast
        const toast = document.getElementById('xpToast');
        const toastText = document.getElementById('xpToastText');
        if (toast && toastText) {
            toastText.innerHTML = `<span style="font-size:12px">🧹 Pulizia automatica errori</span>`;
            toast.classList.remove('hidden');
            setTimeout(() => toast.classList.add('visible'), 10);
            setTimeout(() => {
                toast.classList.remove('visible');
                setTimeout(() => toast.classList.add('hidden'), 300);
            }, 2000);
        }
    }
}

function checkFrozenStreak() {
    const today = getGameDateObj();
    const todayStr = today.toDateString();

    // 1. Reset Freezes on 1st of month
    const currentMonth = today.getFullYear() + '-' + (today.getMonth() + 1);
    if (state.player.lastFreezeReset !== currentMonth) {
        state.player.streakFreezes = 2; // Restore to 2
        state.player.lastFreezeReset = currentMonth;
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
            // We pretend we did something yesterday to bridge the gap?
            // Ideally we just don't reset. But we need to update date?
            // No, getting back on track today will fix the gap.
            // We just notify user? Or visually indicate freeze usage?
        } else {
            state.player.globalStreak = 0;
            state.player.streakFreezes = 2; // Restore freezes on streak loss
        }
    } else {
        // Missed > 1 day: Streak broken regardless of freezes
        state.player.globalStreak = 0;
        state.player.streakFreezes = 2; // Restore freezes on streak loss
    }

    saveState();
}

function checkGlobalStreakProgress(dateStr) {
    // 75% THRESHOLD LOGIC (v2.8.0)
    // User must complete 75% of daily tasks to increment global streak.

    // 1. Calculate completion percentage for the specific date
    const completionPercent = getCompletionForDate(dateStr);
    const THRESHOLD = 70;

    console.log(`[StreakCheck] Date: ${dateStr}, Completion: ${completionPercent}%`);

    // 2. Logic
    if (completionPercent >= THRESHOLD) {
        // Threshold met!
        if (state.player.lastActionDate !== dateStr) {
            // INCREMENT STREAK (First time meeting threshold today)
            state.player.globalStreak++;
            state.player.lastActionDate = dateStr;

            saveState();
            renderHeader();

            // CELEBRATION! 🎉
            if (state.player.globalStreak > 0) {
                showStreakCelebration(state.player.globalStreak);
                playSound('streak'); // Play sound here explicitly
            }

            // Toast
            const toast = document.getElementById('xpToast');
            const toastText = document.getElementById('xpToastText');
            if (toast && toastText) {
                toastText.innerHTML = `<span style="font-size:14px">🔥 Streak Extended! (${completionPercent}%)</span>`;
                toast.classList.remove('hidden');
                setTimeout(() => toast.classList.add('visible'), 10);
                setTimeout(() => {
                    toast.classList.remove('visible');
                    setTimeout(() => toast.classList.add('hidden'), 300);
                }, 3000);
            }
        }
    } else {
        // Threshold NOT met (< 75%)
        if (state.player.lastActionDate === dateStr) {
            // DECREMENT STREAK (Rollback: user unchecked a task and dropped below 75%)
            if (state.player.globalStreak > 0) state.player.globalStreak--;

            // Revert lastActionDate to previous day to allow re-incrementing
            const d = new Date(dateStr);
            d.setDate(d.getDate() - 1);
            state.player.lastActionDate = formatISO(d);

            saveState();
            renderHeader();

            // Toast Warning
            const toast = document.getElementById('xpToast');
            const toastText = document.getElementById('xpToastText');
            if (toast && toastText) {
                toastText.innerHTML = `<span style="font-size:12px">📉 Streak persa (< 75%)</span>`;
                toast.classList.remove('hidden');
                setTimeout(() => toast.classList.add('visible'), 10);
                setTimeout(() => {
                    toast.classList.remove('visible');
                    setTimeout(() => toast.classList.add('hidden'), 300);
                }, 2000);
            }
        }
    }

    // Always update popup if open
    const popupCount = document.getElementById('popupStreakCount');
    if (popupCount) popupCount.textContent = state.player.globalStreak;
}



// ============================================
// MONTHLY CHALLENGE & MEDALS
// ============================================

function checkMonthlyChallengeInitialization() {
    const today = getGameDate();
    const currentMonthId = getMonthIdentifier(today);

    // If we moved to a new month, reset points but keep medals
    if (state.player.monthlyChallenge.currentMonth !== currentMonthId) {
        state.player.monthlyChallenge.currentMonth = currentMonthId;
        state.player.monthlyChallenge.points = 0;
        // Target could be dynamic or user set, for now fixed
        state.player.monthlyChallenge.target = 50;
        saveState();
    }
}

// Helper: Count stars for monthly pyramid
function getMonthlyStarCounts(monthId) {
    const counts = { 3: 0, 4: 0, 5: 0 };

    // Safety check for state
    if (!state.completionLog) return counts;

    const monthDates = Object.keys(state.completionLog).filter(d => d.startsWith(monthId));

    monthDates.forEach(date => {
        const log = state.completionLog[date];
        if (!log) return;

        // Check Quests
        if (log.quests && Array.isArray(log.quests)) {
            log.quests.forEach(id => {
                const quest = state.quests.find(q => q.id === id);
                if (quest && quest.stars) {
                    if (counts[quest.stars] !== undefined) counts[quest.stars]++;
                }
            });
        }

        // Check OneShots
        if (log.oneshots && Array.isArray(log.oneshots)) {
            log.oneshots.forEach(id => {
                const item = state.oneshots.find(o => o.id === id);
                if (item && item.stars) {
                    if (counts[item.stars] !== undefined) counts[item.stars]++;
                }
            });
        }

        // Check Habits (if they ever have stars, currently mostly 1-2 difficulty)
        if (log.habits && Array.isArray(log.habits)) {
            log.habits.forEach(id => {
                const habit = state.habits.find(h => h.id === id);
                if (habit && habit.stars) {
                    if (counts[habit.stars] !== undefined) counts[habit.stars]++;
                }
            });
        }
    });

    return counts;
}

function addMonthlyPoints(amount) {
    checkMonthlyChallengeInitialization();

    // Safety check
    if (!state.player.monthlyChallenge) return;

    // Prevent negative points from going below zero
    const newPoints = Math.max(0, state.player.monthlyChallenge.points + amount);

    const target = state.player.monthlyChallenge.target;
    // const oldPoints = state.player.monthlyChallenge.points; // logic changed to check condition continuously

    state.player.monthlyChallenge.points = newPoints;
    saveState();

    // Check for Medal Unlock
    // REQUIREMENT: 50 Points AND Pyramid (1x5*, 2x4*, 3x3*)
    if (newPoints >= target) {
        const currentMonth = state.player.monthlyChallenge.currentMonth;
        const starCounts = getMonthlyStarCounts(currentMonth);

        const pyramidMet = (starCounts[5] >= 1) && (starCounts[4] >= 2) && (starCounts[3] >= 3);

        if (pyramidMet) {
            unlockMonthlyMedal();
        }
    }
}

function unlockMonthlyMedal() {
    const monthId = state.player.monthlyChallenge.currentMonth;

    // Check if already earned
    if (state.player.monthlyChallenge.medals.some(m => m.id === monthId)) return;

    // Create Medal
    const monthNames = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
        "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
    const monthIndex = parseInt(monthId.split('-')[1]) - 1;
    const monthName = monthNames[monthIndex];
    const year = monthId.split('-')[0];

    // Calculate top stat for this month from xpLog
    const monthXpEntries = state.xpLog.filter(entry => {
        if (!entry.date) return false;
        const entryMonth = entry.date.substring(0, 7); // "2026-01"
        return entryMonth === monthId && entry.amount > 0;
    });

    const statXp = {};
    monthXpEntries.forEach(entry => {
        statXp[entry.statId] = (statXp[entry.statId] || 0) + entry.amount;
    });

    const topStatId = Object.entries(statXp).sort((a, b) => b[1] - a[1])[0]?.[0];
    const topStat = state.stats.find(s => s.id === topStatId);

    // Collect completed oneshots/quests this month
    const completedTasks = [];

    // Get all dates in this month from completionLog
    const monthDates = Object.keys(state.completionLog).filter(d => d.startsWith(monthId));

    monthDates.forEach(date => {
        const dayLog = state.completionLog[date];
        if (!dayLog) return;

        // Handle both legacy (array) and new (object) structure safely

        // OneShots
        const oneshotIds = Array.isArray(dayLog.oneshots) ? dayLog.oneshots : [];
        oneshotIds.forEach(id => {
            const oneshot = state.oneshots.find(o => o.id === id);
            if (oneshot) {
                completedTasks.push({
                    name: oneshot.name,
                    stars: oneshot.stars || 1,
                    type: 'oneshot',
                    date: date
                });
            }
        });

        // Quests
        const questIds = Array.isArray(dayLog.quests) ? dayLog.quests : [];
        questIds.forEach(id => {
            const quest = state.quests.find(q => q.id === id);
            if (quest) {
                completedTasks.push({
                    name: quest.name,
                    stars: quest.stars || 1,
                    type: 'quest',
                    date: date
                });
            }
        });
    });

    // Sort by stars (highest first) and take top 10
    const topTasks = [...completedTasks].sort((a, b) => b.stars - a.stars).slice(0, 10);

    const medal = {
        id: monthId,
        name: `${monthName} ${year}`,
        description: "Obiettivo mensile completato!",
        icon: topStat?.icon || "🏅",
        topStatName: topStat?.name || "Varie",
        topStatIcon: topStat?.icon || "🏆",
        earnedDate: getGameDate(),
        topTasks: topTasks,
        totalCompleted: completedTasks.length
    };

    state.player.monthlyChallenge.medals.push(medal);
    saveState();

    // Show Celebration
    showMedalCelebration(medal);
}

function showMedalCelebration(medal) {
    // Re-use streak celebration or create new one?
    // For now, let's trigger a custom alert or reuse the generic modal structure
    // We can create a dedicated 'Medal Popup' dynamically
    const overlay = document.createElement('div');
    overlay.className = 'medal-celebration-overlay';
    overlay.onclick = function (e) {
        if (e.target === this) this.remove();
    };
    overlay.innerHTML = `
        <div class="medal-celebration-content">
            <div class="medal-glow"></div>
            <div class="medal-icon">${medal.icon}</div>
        </div>
    `;
    document.body.appendChild(overlay);

    // Trigger confetti
    if (window.confetti) {
        window.confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#FFD700', '#FFA500', '#ffffff']
        });
    }
}

function showSealedAlert() {
    const overlay = document.createElement('div');
    overlay.className = 'medal-celebration-overlay sealed-overlay';
    // Fix: Remove spaces in tags
    overlay.innerHTML = `
        <div class="medal-celebration-content sealed-content">
            <div class="sealed-icon">🔒</div>
            <h2 style="color: #ef4444; margin-bottom: 8px;">Sigillato</h2>
            <p style="color: #aaa; margin-bottom: 20px; font-size: 14px; line-height: 1.5;">
                Questo antico tomo è chiuso magicamente.<br>
                Dimostra il tuo valore vincendo una <b>Medaglia Mensile</b> per spezzare il sigillo.
            </p>
            <button onclick="this.closest('.medal-celebration-overlay').remove()" style="background: #333; color: #fff; border: 1px solid #555;">Capito</button>
        </div>
    `;
    document.body.appendChild(overlay);

    // Play "locked" sound if available (or error tone)
    if (state.settings.soundEnabled !== false) {
        try { playTone(150, 'sawtooth', 0.3, 0); } catch (e) { }
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
    if (typeof window.switchSection !== 'function') window.switchSection = switchSection;
    document.querySelectorAll('.nav-item').forEach(item => {
        const isActive = item.dataset.section === sectionName;
        item.classList.toggle('active', isActive);
        if (isActive) updateBubblePosition(item);
    });

    document.querySelectorAll('.section').forEach(section => {
        section.classList.toggle('active', section.id === `section-${sectionName}`);
    });

    const container = document.querySelector('.content-area');
    if (container) container.scrollTop = 0;

    if (sectionName === 'home') {
        setTimeout(() => renderRadarChart(), 150);
    } else if (sectionName === 'habits') {
        const calendar = document.getElementById('calendarContainer');
        if (calendar) calendar.style.visibility = 'hidden';
        renderCalendar();

        setTimeout(() => {
            const habitsWrapper = document.querySelector('.habits-wrapper');
            if (container && calendar && habitsWrapper) {
                const calendarRect = calendar.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();
                const scrollAmount = calendarRect.bottom - containerRect.top + container.scrollTop - 7;
                container.scrollTop = scrollAmount;
                calendar.style.visibility = 'visible';
            }
        }, 150);
    } else if (sectionName === 'nutrition') {
        renderHealthDashboard();
        renderNutritionInventory();
    } else if (sectionName === 'activities') {
        renderOneshots();
        renderQuests();
    } else if (sectionName === 'settings') {
        const seen = localStorage.getItem('pwa_instructions_seen');
        if (!seen) {
            setTimeout(() => openInstallModal(), 500);
        }
    }
}

function switchActivityTab(tabId) {
    document.querySelectorAll('.activity-tab').forEach(tab => {
        tab.classList.toggle('active', tab.id === `tab-${tabId}`);
    });
    document.querySelectorAll('.activity-view').forEach(view => {
        view.classList.toggle('active', view.id === `view-activities-${tabId}`);
    });

    if (tabId === 'oneshot') renderOneshots();
    else renderQuests();
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
    renderHealthDashboard();
    renderNutritionInventory();
    initSortable(); // Initialize drag and drop after render
}

// ============================================
// SORTABLE DRAG AND DROP
// ============================================

let sortableInstances = [];

function initSortable() {
    // Destroy previous instances to avoid duplicates
    sortableInstances.forEach(instance => {
        if (instance && instance.destroy) instance.destroy();
    });
    sortableInstances = [];

    // Habits list
    const habitsList = document.getElementById('habitsList');
    if (habitsList && habitsList.children.length > 0 && !habitsList.querySelector('.empty-state')) {
        sortableInstances.push(new Sortable(habitsList, {
            animation: 150,
            easing: "cubic-bezier(0.25, 1, 0.5, 1)",
            handle: '.drag-handle',
            ghostClass: 'sortable-ghost',
            chosenClass: 'sortable-chosen',
            dragClass: 'sortable-drag',
            delay: 100,
            delayOnTouchOnly: true,
            touchStartThreshold: 5,
            forceFallback: false,
            onEnd: function (evt) {
                // Only reorder if position changed
                if (evt.oldIndex !== evt.newIndex) {
                    reorderItems('habits', evt.oldIndex, evt.newIndex);
                }
            }
        }));
    }

    // Oneshots list  
    const oneshotList = document.getElementById('oneshotList');
    if (oneshotList && oneshotList.children.length > 0 && !oneshotList.querySelector('.empty-state')) {
        sortableInstances.push(new Sortable(oneshotList, {
            animation: 150,
            easing: "cubic-bezier(0.25, 1, 0.5, 1)",
            handle: '.drag-handle',
            ghostClass: 'sortable-ghost',
            chosenClass: 'sortable-chosen',
            dragClass: 'sortable-drag',
            delay: 100,
            delayOnTouchOnly: true,
            touchStartThreshold: 5,
            forceFallback: false,
            onEnd: function (evt) {
                if (evt.oldIndex !== evt.newIndex) {
                    reorderItems('oneshots', evt.oldIndex, evt.newIndex);
                }
            }
        }));
    }

    // Quests list
    const questList = document.getElementById('questList');
    if (questList && questList.children.length > 0 && !questList.querySelector('.empty-state')) {
        sortableInstances.push(new Sortable(questList, {
            animation: 150,
            easing: "cubic-bezier(0.25, 1, 0.5, 1)",
            handle: '.drag-handle',
            ghostClass: 'sortable-ghost',
            chosenClass: 'sortable-chosen',
            dragClass: 'sortable-drag',
            delay: 100,
            delayOnTouchOnly: true,
            touchStartThreshold: 5,
            forceFallback: false,
            onEnd: function (evt) {
                if (evt.oldIndex !== evt.newIndex) {
                    reorderItems('quests', evt.oldIndex, evt.newIndex);
                }
            }
        }));
    }

    // Subtask lists (Dynamic)
    document.querySelectorAll('.quest-subtasks-list').forEach(list => {
        // Avoid duplicate initialization
        if (list.dataset.sortableInitialized) return;
        list.dataset.sortableInitialized = 'true';

        sortableInstances.push(new Sortable(list, {
            animation: 100,
            handle: '.subquest-drag-handle', // Specific handle
            ghostClass: 'sortable-ghost',
            chosenClass: 'sortable-chosen',
            dragClass: 'sortable-drag',
            delay: 50, // Faster response
            touchStartThreshold: 3,
            onEnd: function (evt) {
                if (evt.oldIndex !== evt.newIndex) {
                    // In detail view, we rely on currentOpenedQuestId global or find it from DOM
                    const questId = currentOpenedQuestId;
                    if (questId) {
                        reorderSubtasks(questId, evt.oldIndex, evt.newIndex);
                    }
                }
            }
        }));
    });
}

function reorderItems(type, oldIndex, newIndex) {
    let arr;
    if (type === 'habits') {
        // For habits, we need to map visual index to actual array index
        // because habits are filtered by date and sorted
        const viewedHabits = getHabitsForDate(viewedDate).map(h => ({
            original: h,
            isCompleted: isHabitCompletedOnDate(h, viewedDate)
        }));
        viewedHabits.sort((a, b) => a.isCompleted === b.isCompleted ? 0 : a.isCompleted ? 1 : -1);

        // Get the actual habit objects involved
        const movedHabit = viewedHabits[oldIndex]?.original;
        const targetHabit = viewedHabits[newIndex]?.original;

        if (movedHabit && targetHabit) {
            const actualOldIndex = state.habits.findIndex(h => h.id === movedHabit.id);
            const actualNewIndex = state.habits.findIndex(h => h.id === targetHabit.id);

            if (actualOldIndex !== -1 && actualNewIndex !== -1) {
                const [removed] = state.habits.splice(actualOldIndex, 1);
                state.habits.splice(actualNewIndex, 0, removed);
            }
        }
    } else if (type === 'oneshots') {
        // Filter to pending oneshots as displayed
        const pending = state.oneshots.filter(o => !o.completed && !o.locked);
        const movedItem = pending[oldIndex];
        const targetItem = pending[newIndex];

        if (movedItem && targetItem) {
            const actualOldIndex = state.oneshots.findIndex(o => o.id === movedItem.id);
            const actualNewIndex = state.oneshots.findIndex(o => o.id === targetItem.id);

            if (actualOldIndex !== -1 && actualNewIndex !== -1) {
                const [removed] = state.oneshots.splice(actualOldIndex, 1);
                state.oneshots.splice(actualNewIndex, 0, removed);
            }
        }
    } else if (type === 'quests') {
        // Filter to active quests as displayed
        const active = state.quests.filter(q => !q.completed);
        const movedItem = active[oldIndex];
        const targetItem = active[newIndex];

        if (movedItem && targetItem) {
            const actualOldIndex = state.quests.findIndex(q => q.id === movedItem.id);
            const actualNewIndex = state.quests.findIndex(q => q.id === targetItem.id);

            if (actualOldIndex !== -1 && actualNewIndex !== -1) {
                const [removed] = state.quests.splice(actualOldIndex, 1);
                state.quests.splice(actualNewIndex, 0, removed);
            }
        }
    } else if (type === 'subtasks') {
        // Reordering subtasks within a quest
        // We know questId is passed as custom context or we find it?
        // Actually, initSortable for subtasks needs to pass questId to this function
        // OR we parse it from the DOM element's ID if we set one.
        // Let's assume we pass questId in the reorder call which we will set up in initSortable.
        // Wait, reorderItems signature is (type, old, new).
        // I'll add a new function for subtasks or overload this one.
        // Let's keep it simple: define reorderSubtasks separately.
    }

    saveState();
    // Don't re-render to keep the smooth animation - state is already synced
}

function reorderSubtasks(questId, oldIndex, newIndex) {
    const quest = state.quests.find(q => q.id === questId);
    if (!quest || !quest.subquests) return;

    // Subtasks are simple arrays, no filtering usually
    // But be careful if we ever hide completed ones? Currently we show all.
    const moved = quest.subquests[oldIndex];
    if (!moved) return;

    quest.subquests.splice(oldIndex, 1);
    quest.subquests.splice(newIndex, 0, moved);

    saveState();
}

function renderHeader() {
    // 1. Streak
    const streakEl = document.getElementById('globalStreak');
    const streakIcon = document.getElementById('headerStreak');

    if (streakEl) streakEl.textContent = state.player.globalStreak;

    if (streakIcon) {
        const today = getGameDate();
        const isActive = state.player.lastActionDate === today;

        console.log(`[RenderHeader] Streak Icon. LastAction: ${state.player.lastActionDate}, Today: ${today}, Active: ${isActive}`);

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
    if (popup && !popup.contains(e.target) && !e.target.closest('.header-profile') && !e.target.closest('.modal') && !e.target.closest('.medal-celebration-overlay')) {
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

    // XP Bar (Cumulative Logic)
    const xpFill = document.getElementById('popupXpFill');
    const xpText = document.getElementById('popupXpText');

    const currentLevelTotal = getCumulativeXpForLevel(state.player.level);
    const nextLevelTotal = getCumulativeXpForLevel(state.player.level + 1);
    const xpInLevel = state.player.totalXp - currentLevelTotal;
    const xpNeededForLevel = nextLevelTotal - currentLevelTotal;

    const xpPercent = Math.min(100, Math.max(0, (xpInLevel / xpNeededForLevel) * 100));

    if (xpFill) xpFill.style.width = `${xpPercent}% `;
    if (xpText) xpText.textContent = `${Math.floor(xpInLevel)} / ${Math.floor(xpNeededForLevel)} XP`;

    // Medals Logic
    checkMonthlyChallengeInitialization(); // Ensure correct month logic
    const mLabel = document.getElementById('monthlyLabel');
    const mPoints = document.getElementById('monthlyPoints');
    const mFill = document.getElementById('monthlyProgressFill');
    const mGrid = document.getElementById('medalsGrid');

    if (mLabel && state.player.monthlyChallenge && state.player.monthlyChallenge.currentMonth) {
        // Format Month Name: "Gennaio 2026"
        const monthId = state.player.monthlyChallenge.currentMonth;
        const [year, month] = monthId.split('-');
        const monthNames = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
            "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
        mLabel.textContent = `${monthNames[parseInt(month) - 1]} ${year}`;
    }

    if (mPoints && state.player.monthlyChallenge) {
        mPoints.textContent = `${state.player.monthlyChallenge.points} / ${state.player.monthlyChallenge.target}`;
    }

    if (mFill && state.player.monthlyChallenge) {
        const pct = Math.min(100, (state.player.monthlyChallenge.points / state.player.monthlyChallenge.target) * 100);
        mFill.style.width = `${pct}%`;
    }

    // Render Pyramid Status
    const mPyramid = document.getElementById('monthlyPyramidStatus');
    if (mPyramid && state.player.monthlyChallenge) {
        const counts = getMonthlyStarCounts(state.player.monthlyChallenge.currentMonth);

        // Helper to color status
        const fmt = (req, curr, color) => {
            const done = curr >= req;
            const cStyle = done ? `color:${color}; opacity:1; font-weight:bold;` : `color:var(--text-muted); opacity:0.7;`;
            const check = done ? '✓' : '';
            return `<span style="${cStyle}">
                ${'⭐'.repeat(req)} <span style="font-size:9px">${curr}/${req}${check}</span>
             </span>`;
        };

        // We render: 5* (req 1), 4* (req 2), 3* (req 3)
        // Actually showing 5 stars is too long. Let's use "5★"
        const fmtCompact = (stars, req, curr) => {
            const done = curr >= req;
            const color = done ? 'var(--accent-gold)' : 'var(--text-muted)';
            const weight = done ? 'bold' : 'normal';
            return `<span style="color:${color}; font-weight:${weight}" title="${stars} Stelle (Richiesti: ${req})">
                ${stars}★ ${curr}/${req}
            </span>`;
        };

        mPyramid.innerHTML = `
            ${fmtCompact(5, 1, counts[5])}
            ${fmtCompact(4, 2, counts[4])}
            ${fmtCompact(3, 3, counts[3])}
        `;
    }

    if (mGrid && state.player.monthlyChallenge) {
        if (state.player.monthlyChallenge.medals.length === 0) {
            mGrid.innerHTML = '<div style="font-size:11px; color:var(--text-muted); width:100%; text-align:center;">Nessuna medaglia ancora...</div>';
        } else {
            // Show only last 5 reversed
            const recentMedals = [...state.player.monthlyChallenge.medals].reverse().slice(0, 5);
            mGrid.innerHTML = recentMedals.map(m => `
                <div class="medal-item" onclick="showMedalDetail('${m.id}')">
                    <div class="medal-golden-circle">
                        <span class="medal-stat-icon">${m.icon}</span>
                    </div>
                </div>
            `).join('');
        }
    }
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

window.confirmMottoEdit = confirmMottoEdit;

function getPlayerTitle() {
    let title = TITLES[0].title;
    for (const t of TITLES) {
        if (state.player.level >= t.level) title = t.title;
    }
    return title;
}

function getRollingXpByStats(days = 30) {
    const now = new Date();
    const cutoffDate = new Date();
    cutoffDate.setDate(now.getDate() - days);

    // Filtra i log degli ultimi 'days' giorni
    const recentLogs = state.xpLog.filter(log => {
        const logDate = new Date(log.date);
        return logDate >= cutoffDate && logDate <= now;
    });

    // Aggrega XP per statId
    const xpByStats = {};
    recentLogs.forEach(log => {
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

    // Calcola XP ultimi 30 giorni per stat
    const rollingXp = getRollingXpByStats(30);
    const rollingData = visibleStats.map(s => rollingXp[s.id] || 0);
    const maxRollingXp = Math.max(50, ...rollingData); // Minimo 50 per scala visibile

    const data = {
        labels: visibleStats.map(s => s.icon), // Emojis only for cleaner look
        datasets: [{
            label: 'XP 30 Giorni',
            data: rollingData,
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
                max: maxRollingXp + Math.round(maxRollingXp * 0.2), // Buffer
                ticks: { display: false }, // Hide numbers
                grid: { color: 'rgba(128, 128, 128, 0.15)' },
                angleLines: { color: 'rgba(128, 128, 128, 0.15)' },
                pointLabels: {
                    font: { size: 32, weight: '400' }, // Huge Emojis
                    padding: 4
                }
            }
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        return `${context.parsed.r} XP ultimi 30gg`;
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
    console.log(`[ShowPopup] Stat: ${gainedStatId}, Amount: ${gainedAmount}`);
    const toast = document.getElementById('xpToast');
    const toastText = document.getElementById('xpToastText');
    if (!toast || !toastText) return;

    // Find the stat info
    const stat = state.stats.find(s => s.id === gainedStatId);
    const statIcon = stat?.icon || '⚡';
    const statName = stat?.name || '';

    // Update toast content
    if (statName) {
        toastText.innerHTML = `+${gainedAmount} XP<span class="xp-toast-stat">${statIcon} ${statName}</span>`;
    } else {
        toastText.textContent = `+${gainedAmount} XP`;
    }

    // Show toast with animation
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('visible'), 10);

    // Auto hide after 2 seconds
    setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => toast.classList.add('hidden'), 300);
    }, 2000);
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
                    ${completion > 0 ? `<div class="completion-ring" style="--percent: ${completion}"></div>` : ''}
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

// Helper to get exactly which habits should exist for a specific date
function getHabitsForDate(dateStr) {
    const today = getGameDate();
    const isToday = dateStr === today;
    const isPast = dateStr < today;

    return state.habits.filter(h => {
        // 1. Exclude locked/deleted habits
        if (h.locked) return false;

        // 2. Filter by creation date
        if (h.createdAt) {
            const createdDate = formatISO(new Date(h.createdAt));
            if (createdDate > dateStr) return false;
        }

        // 3. Handle PROGRESSIVE habits (times_week/times_month) with shifting behavior
        if (h.frequency === 'times_week' || h.frequency === 'times_month') {
            const isWeekly = h.frequency === 'times_week';
            const periodId = isWeekly ? getWeekIdentifier(dateStr) : getMonthIdentifier(dateStr);
            const completionsThisPeriod = countCompletionsInPeriod(h.id, h.frequency, periodId);
            const targetCompletions = h.freqTimes || 1;

            // If target met, only show on days it was completed (for history)
            if (completionsThisPeriod >= targetCompletions) {
                return state.completionLog[dateStr]?.habits?.includes(h.id);
            }

            // For PAST days: only show if completed on that day (shifting behavior)
            if (isPast) {
                return state.completionLog[dateStr]?.habits?.includes(h.id);
            }

            // For TODAY: show if shiftedToDate is today or earlier (or not set)
            if (isToday) {
                // ALWAYS show if completed TODAY (even if shifted to tomorrow)
                if (state.completionLog[dateStr]?.habits?.includes(h.id)) return true;
                if (h.shiftedToDate && h.shiftedToDate > dateStr) return false;
                return true;
            }

            // For FUTURE: only show if shiftedToDate matches
            if (h.shiftedToDate === dateStr) return true;
            return false;
        }

        // 4. Handle simple periodic habits (weekly/monthly/yearly) - original logic
        if (h.frequency && h.frequency !== 'daily') {
            const isWeekly = h.frequency === 'weekly';
            const isMonthly = h.frequency === 'monthly';
            const periodId = isWeekly ? getWeekIdentifier(dateStr) :
                isMonthly ? getMonthIdentifier(dateStr) :
                    getYearIdentifier(dateStr);

            const completionsThisPeriod = countCompletionsInPeriod(h.id, h.frequency, periodId);
            const targetCompletions = h.freqTimes || 1;

            if (completionsThisPeriod >= targetCompletions) {
                const wasCompletedToday = state.completionLog[dateStr]?.habits?.includes(h.id);
                if (!wasCompletedToday) return false;
            }
        }

        return true;
    });
}

// Helper to count how many times a habit was completed in a given period
function countCompletionsInPeriod(habitId, frequency, periodId) {
    let count = 0;
    for (const dateStr in state.completionLog) {
        const log = state.completionLog[dateStr];
        if (!log?.habits?.includes(habitId)) continue;

        const isWeekly = frequency === 'weekly' || frequency === 'times_week';
        const isMonthly = frequency === 'monthly' || frequency === 'times_month';
        const logPeriodId = isWeekly ? getWeekIdentifier(dateStr) :
            isMonthly ? getMonthIdentifier(dateStr) :
                getYearIdentifier(dateStr);
        if (logPeriodId === periodId) {
            count++;
        }
    }
    return count;
}

function getCompletionForDate(dateStr) {
    // 1. Get habits that visibly exist for this date
    const visibleHabits = getHabitsForDate(dateStr);
    const totalHabits = visibleHabits.length;

    // 2. If no visible habits, check if all periodic habits met their targets
    if (totalHabits === 0) {
        // Check if there are ANY habits that existed on this date (not locked, created before)
        const allPossibleHabits = state.habits.filter(h => {
            if (h.locked) return false;
            if (h.createdAt) {
                const createdDate = formatISO(new Date(h.createdAt));
                if (createdDate > dateStr) return false;
            }
            return true;
        });
        // If habits exist but are all hidden (targets met), that's 100% completion
        return allPossibleHabits.length > 0 ? 100 : 0;
    }

    // 3. Count how many visible habits are completed ON THIS DATE
    let completedCount = 0;
    visibleHabits.forEach(habit => {
        if (isHabitCompletedOnDate(habit, dateStr)) {
            completedCount++;
        }
    });

    // 4. Math
    if (completedCount === totalHabits) return 100;
    return Math.floor((completedCount / totalHabits) * 100);
}

function logCompletion(type, itemId, customDate = null) {
    const dateStr = customDate || getGameDate();

    if (!state.completionLog[dateStr]) {
        state.completionLog[dateStr] = { habits: [], oneshots: [], quests: [] };
    }
    console.log(`[LogCompletion] Type: ${type}, ID: ${itemId}, Date: ${dateStr}`);

    // Always update the total count snapshot for TODAY when modifying
    if (dateStr === getGameDate() && type === 'habits') {
        const activeHabits = state.habits.filter(h => !h.locked);
        state.completionLog[dateStr].activeHabitsSnapshot = activeHabits.map(h => h.id);
        state.completionLog[dateStr].dailyTotalSnapshot = activeHabits.length;
    }

    const index = state.completionLog[dateStr][type].indexOf(itemId);
    if (index === -1) {
        state.completionLog[dateStr][type].push(itemId);
    } else if (customDate) {
        // Toggle off if it's a custom date (allowing removal from history)
        state.completionLog[dateStr][type].splice(index, 1);
    } else if (index !== -1 && !customDate) {
        // Default behavior: toggle off for today
        state.completionLog[dateStr][type].splice(index, 1);
    }

    // If we're removing completion from today (toggle off), ensure the total count is still updated
    // (In case the total changed since the completion was logged)
    if (dateStr === getGameDate() && type === 'habits') {
        state.completionLog[dateStr].dailyTotalSnapshot = state.habits.filter(h => !h.locked).length;
    }

    saveState();
}

// ============================================
// HABITS
// ============================================

function renderHabits() {
    const container = document.getElementById('habitsList');
    const isToday = viewedDate === getGameDate();
    // Use shared logic for base list, then map to include completion status permanently for this render cycle
    let habitsToShow = getHabitsForDate(viewedDate).map(h => ({
        original: h,
        isCompleted: isHabitCompletedOnDate(h, viewedDate)
    }));

    // Sort: uncompleted habits first, completed habits at the bottom
    habitsToShow.sort((a, b) => {
        if (a.isCompleted === b.isCompleted) return 0;
        return a.isCompleted ? 1 : -1;
    });

    if (habitsToShow.length === 0) {
        // Show onboarding guide for first-time users, otherwise show simple empty state
        if (shouldShowOnboarding('habits')) {
            container.innerHTML = getOnboardingHTML('habits');
        } else {
            container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📜</div><div class="empty-state-text">Nessuna abitudine</div><div class="empty-state-hint">Clicca "+" per iniziare</div></div>`;
        }
        return;
    }

    // Mark onboarding as complete when user has habits
    if (shouldShowOnboarding('habits')) {
        markOnboardingComplete('habits');
    }

    container.innerHTML = habitsToShow.map(item => {
        const habit = item.original;
        const isCompleted = item.isCompleted;
        // NOTE: Removed inconsistent filter. All habits from getHabitsForDate should be displayed.

        const primaryStat = state.stats.find(s => s.id === habit.primaryStatId);
        const secondaryStat = habit.secondaryStatId ? state.stats.find(s => s.id === habit.secondaryStatId) : null;

        // Progress badge for periodic habits
        let progressBadge = '';
        if (habit.frequency && habit.frequency !== 'daily' && habit.freqTimes > 1) {
            const isWeekly = habit.frequency === 'weekly' || habit.frequency === 'times_week';
            const isMonthly = habit.frequency === 'monthly' || habit.frequency === 'times_month';
            const periodId = isWeekly ? getWeekIdentifier(viewedDate) :
                isMonthly ? getMonthIdentifier(viewedDate) :
                    getYearIdentifier(viewedDate);
            const completions = countCompletionsInPeriod(habit.id, habit.frequency, periodId);
            const periodLabel = isWeekly ? 'sett.' : isMonthly ? 'mese' : 'anno';
            progressBadge = `<span class="card-progress">${completions}/${habit.freqTimes} ${periodLabel}</span>`;
        }

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
                            ${progressBadge}
                            ${primaryStat ? `<span class="card-stat">${primaryStat.icon}</span>` : ''}
                            ${secondaryStat ? `<span class="card-stat" style="opacity:0.6">${secondaryStat.icon}</span>` : ''}
                            ${habit.dueDate ? `<span class="card-due">📅 ${formatDate(habit.dueDate)}</span>` : ''}
                        </div>
                    </div>
                    <div class="drag-handle" title="Trascina per riordinare">⋮⋮</div>
                </div>
            </div>
            `;
    }).join('');
}

function isHabitCompletedOnDate(habit, dateStr) {
    const log = state.completionLog[dateStr];
    const isInLogOnThisDay = log?.habits?.includes(habit.id);

    // SIMPLE RULE: Different frequencies have different "completion" meanings
    switch (habit.frequency) {
        case 'daily':
        case undefined:
        case null:
            // Daily: completed if in log for THIS specific day
            return isInLogOnThisDay;

        case 'times_week':
        case 'times_month':
            // Progressive (X times per period): completed if in log for THIS day
            // Each day's completion is independent - the checkmark is for TODAY only
            return isInLogOnThisDay;

        case 'weekly':
            // Once per week: completed if ANY completion exists this week
            return countCompletionsInPeriod(habit.id, habit.frequency, getWeekIdentifier(dateStr)) > 0;

        case 'monthly':
            // Once per month: completed if ANY completion exists this month
            return countCompletionsInPeriod(habit.id, habit.frequency, getMonthIdentifier(dateStr)) > 0;

        case 'yearly':
            // Once per year: completed if ANY completion exists this year
            return countCompletionsInPeriod(habit.id, habit.frequency, getYearIdentifier(dateStr)) > 0;

        default:
            return isInLogOnThisDay;
    }
}

function isHabitCompletedToday(habit) {
    const today = getGameDateObj().toDateString();
    return habit.lastCompleted === today;
}

function toggleHabit(habitId, targetDate = null) {
    const habit = state.habits.find(h => h.id === habitId);
    if (!habit || habit.locked) return;

    const todayISO = getGameDate();
    const dateStr = targetDate || todayISO;

    // GRACE PERIOD LOGIC: Allow completing yesterday's habits until noon with full rewards
    const now = new Date();
    const currentHour = now.getHours();
    const yesterday = new Date(getGameDateObj());
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayISO = formatISO(yesterday);

    // Check if we're in grace period: targeting yesterday AND it's before noon
    const isYesterdayGracePeriod = dateStr === yesterdayISO && currentHour < 12;

    // Treat as "today" for XP/streak purposes if targeting today OR in grace period
    const isTargetingToday = (!targetDate || targetDate === todayISO) || isYesterdayGracePeriod;

    console.log(`[ToggleHabit] ID: ${habit.name}, Target: ${dateStr}, GameToday: ${todayISO}, Grace: ${isYesterdayGracePeriod}, IsTargetToday: ${isTargetingToday}`);

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
            addMonthlyPoints(-1); // Remove monthly point
            checkGlobalStreakProgress(dateStr); // check if we dropped below 75%
        } else {
            // RETROACTIVE UN-COMPLETE
            // If we uncheck a past task, we must clear the lastCompleted date
            // otherwise it will still look completed due to frequency logic
            habit.lastCompleted = null;
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

            habit.lastCompleted = dateStr; // Store in ISO format to match logs
            const xp = calculateXp(habit.stars);
            addXp(xp, habit.primaryStatId, habit.name);
            if (habit.secondaryStatId) {
                addXp(Math.round(xp * XP_CONFIG.secondaryRatio), habit.secondaryStatId, habit.name);
            }
            addMonthlyPoints(1); // Add monthly point
            // recordActivity(); // OLD
            checkGlobalStreakProgress(dateStr); // NEW 75% Logic
            const xpGained = calculateXp(habit.stars);
            showProgressPopup(habit.primaryStatId, xpGained);
        } else {
            // RETROACTIVE COMPLETION: Completing a past date
            console.log(`[ToggleHabit] Retroactive/Future completion. No XP awarded.`);

            // OPTIONAL: Alert user why no XP
            const toast = document.getElementById('xpToast');
            const toastText = document.getElementById('xpToastText');
            if (toast && toastText) {
                toastText.innerHTML = `<span style="font-size:12px">📅 Nessun XP per azioni passate</span>`;
                toast.classList.remove('hidden');
                setTimeout(() => toast.classList.add('visible'), 10);
                setTimeout(() => {
                    toast.classList.remove('visible');
                    setTimeout(() => toast.classList.add('hidden'), 300);
                }, 2000);
            }

            // IMPORTANT: Parse YYYY-MM-DD to local date safely. 
            // We use noon (12:00) to avoid timezone rollover issues when converting to string.
            if (dateStr && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                const [y, m, d] = dateStr.split('-').map(Number);
                const targetDateObj = new Date(y, m - 1, d, 12, 0, 0);
                habit.lastCompleted = targetDateObj.toDateString();

                // STREAK RESTORATION: If marking yesterday before noon, rebuild streak
                const now = new Date();
                const yesterday = getGameDateObj();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = formatISO(yesterday);

                if (dateStr === yesterdayStr && now.getHours() < 12) {
                    // User is completing yesterday's habit during grace period
                    // Rebuild the streak from completion log
                    const allDates = Object.keys(state.completionLog)
                        .filter(dt => {
                            const log = state.completionLog[dt];
                            if (!log) return false;
                            if (log.habits && Array.isArray(log.habits)) return log.habits.includes(habit.id);
                            if (Array.isArray(log)) return log.includes(habit.id);
                            return false;
                        })
                        .sort((a, b) => b.localeCompare(a)); // Most recent first

                    // Count consecutive days starting from yesterday
                    let streak = 0;
                    let checkDate = new Date(yesterday);

                    while (true) {
                        const checkStr = formatISO(checkDate);
                        const log = state.completionLog[checkStr];

                        let isCompleted = false;
                        if (log) {
                            if (log.habits && Array.isArray(log.habits)) isCompleted = log.habits.includes(habit.id);
                            else if (Array.isArray(log)) isCompleted = log.includes(habit.id);
                        }

                        // Include today's completion we're about to add (if checkStr matches dateStr)
                        if (isCompleted || checkStr === dateStr) {
                            streak++;
                            checkDate.setDate(checkDate.getDate() - 1);
                        } else {
                            break;
                        }
                        if (streak > 365) break;
                    }

                    if (streak > habit.streak) {
                        console.log(`Restoring streak for ${habit.name}: ${habit.streak} -> ${streak} (grace period completion)`);
                        habit.streak = streak;
                    }
                }
            } else {
                habit.lastCompleted = formatISO(new Date()); // Fallback to ISO
            }
        }

        logCompletion('habits', habit.id, dateStr);
        if (habit.streak > 1 && habit.lastCompleted === todayISO) {
            playSound('streak');
        } else {
            playSound('success');
        }

        // For progressive habits, shift to tomorrow for the next completion slot
        if ((habit.frequency === 'times_week' || habit.frequency === 'times_month') && isTargetingToday) {
            const tomorrow = new Date(getGameDateObj());
            tomorrow.setDate(tomorrow.getDate() + 1);
            habit.shiftedToDate = formatISO(tomorrow);
        }
    }

    habit.completed = isHabitCompletedOnDate(habit, dateStr);
    saveState();

    // Update UI immediately (removed setTimeout to fix perceived lag)
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
        // Show onboarding guide for first-time users, otherwise show simple empty state
        if (shouldShowOnboarding('oneshots')) {
            container.innerHTML = getOnboardingHTML('oneshots');
        } else {
            container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">💥</div><div class="empty-state-text">Nessun task</div><div class="empty-state-hint">Clicca "+" per iniziare</div></div>`;
        }
        return;
    }

    // Mark onboarding as complete when user has oneshots
    if (shouldShowOnboarding('oneshots')) {
        markOnboardingComplete('oneshots');
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
                            <span class="card-stats-col">${primaryStat ? primaryStat.icon : ''}${secondaryStat ? secondaryStat.icon : ''}</span>
                            ${oneshot.d10Roll && oneshot.dailyPlanDate === getGameDateString() ? `<span class="card-bonus">Oggi +${oneshot.d10Roll * 10}%</span>` : ''}
                            ${oneshot.dueDate ? `<span class="card-due">📅 ${formatDate(oneshot.dueDate)}</span>` : ''}
                        </div>
                    </div>
                    <div class="drag-handle" title="Trascina per riordinare">⋮⋮</div>
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

    // Calculate XP with bonus from D10 roll (same-day only)
    let xp = calculateXp(oneshot.stars);
    const today = getGameDateString();
    if (oneshot.fromDailyPlan && oneshot.dailyPlanDate === today && oneshot.d10Roll) {
        const bonusMultiplier = 1 + (oneshot.d10Roll / 10); // 1-10 → 1.1-2.0
        xp = Math.round(xp * bonusMultiplier);
    }

    addXp(xp, oneshot.primaryStatId, oneshot.name);
    if (oneshot.secondaryStatId) {
        addXp(Math.round(xp * XP_CONFIG.secondaryRatio), oneshot.secondaryStatId, oneshot.name);
    }
    addMonthlyPoints(2); // OneShots give 2 points
    logCompletion('oneshots', oneshot.id);

    // LINKED TASK COMPLETION
    if (oneshot.sourceTaskId && oneshot.sourceTaskType === 'quest' && oneshot.sourceQuestId) {
        // Find quest and mark subtask as done
        toggleSubquest(oneshot.sourceQuestId, oneshot.sourceTaskId, true);
    }

    // Show the actual XP gained (including bonuses) in the popup
    const popupXp = xp;
    showProgressPopup(oneshot.primaryStatId, popupXp);
    playCelebration('minor');

    // Grant freeze for 5-star task completion
    if (oneshot.stars === 5 && state.player.streakFreezes < 2) {
        state.player.streakFreezes++;
    }

    saveState();
    renderOneshots();
    renderQuests(); // Update quest progress if linked
    renderCalendar();
}

// ============================================
// QUESTS
// ============================================

// ============================================
// CHALLENGE CATALOG (Preset Quest Templates)
// ============================================

function showChallengeCatalog() {
    // Create or reuse overlay
    let overlay = document.getElementById('challengeCatalogOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'challengeCatalogOverlay';
        overlay.className = 'modal-overlay challenge-catalog-overlay';
        overlay.innerHTML = `
            <div class="challenge-catalog-modal" onclick="event.stopPropagation()">
                <div class="challenge-catalog-header">
                    <h2>⚔️ Sfide Disponibili</h2>
                    <p class="challenge-catalog-subtitle">Scegli una sfida da iniziare</p>
                </div>
                <div class="challenge-catalog-grid" id="challengeGrid"></div>
            </div>
        `;
        overlay.onclick = (e) => {
            if (e.target === overlay) closeChallengeCatalog();
        };
        document.body.appendChild(overlay);
    }

    // Populate grid with unlock logic
    const grid = document.getElementById('challengeGrid');
    grid.innerHTML = CHALLENGE_TEMPLATES.map(template => {
        const isUnlocked = isChallengeUnlocked(template.id);
        const lockedClass = isUnlocked ? '' : 'locked';
        const lockIcon = isUnlocked ? '' : '<span class="lock-icon">🔒</span>';
        const levelBadge = template.level ? `<span class="level-badge">Liv.${template.level}</span>` : '';

        return `
            <div class="challenge-card ${lockedClass}" 
                 onclick="${isUnlocked ? `showChallengePreview('${template.id}')` : 'void(0)'}" 
                 style="--card-color: ${template.color}"
                 title="${isUnlocked ? '' : 'Completa il livello precedente per sbloccare'}">
                ${lockIcon}
                <div class="challenge-card-icon">${template.icon}</div>
                <div class="challenge-card-info">
                    <div class="challenge-card-name">${template.name.replace(/^.*? /, '')} ${levelBadge}</div>
                    <div class="challenge-card-duration">${template.duration} giorni</div>
                </div>
                <div class="challenge-card-stars">${'⭐'.repeat(template.stars)}</div>
            </div>
        `;
    }).join('');

    overlay.classList.remove('hidden');
    overlay.classList.add('active');
}

// Check if a challenge is unlocked (parent completed or no requirement)
function isChallengeUnlocked(templateId) {
    const template = CHALLENGE_TEMPLATES.find(t => t.id === templateId);
    if (!template || !template.unlockRequirement) return true;

    // Check if the required parent challenge was completed
    return state.quests.some(q =>
        q.templateId === template.unlockRequirement &&
        q.subquests &&
        q.subquests.every(s => s.completed)
    );
}

function closeChallengeCatalog() {
    const overlay = document.getElementById('challengeCatalogOverlay');
    if (overlay) {
        overlay.classList.add('hidden');
        overlay.classList.remove('active');
    }
}

function showChallengePreview(templateId) {
    const template = CHALLENGE_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;

    const stat = state.stats.find(s => s.id === template.primaryStatId);

    // Create preview modal
    let preview = document.getElementById('challengePreviewOverlay');
    if (!preview) {
        preview = document.createElement('div');
        preview.id = 'challengePreviewOverlay';
        preview.className = 'modal-overlay challenge-preview-overlay';
        document.body.appendChild(preview);
    }

    // Check if template supports tracking modes
    let trackingOptionsHtml = '';
    if (template.trackingMode) {
        trackingOptionsHtml = `
            <div class="tracking-mode-selector">
                <p class="tracking-mode-label">Modalità di Tracciamento:</p>
                <div class="tracking-toggle-container">
                    <input type="radio" id="mode_simple" name="tracking_mode" value="checkbox" checked>
                    <label for="mode_simple" class="tracking-option">
                        <span class="option-icon">✅</span>
                        <div class="option-text">
                            <span class="option-title">Semplice</span>
                            <span class="option-desc">Checkbox giornaliera</span>
                        </div>
                    </label>
                    
                    <input type="radio" id="mode_detailed" name="tracking_mode" value="detailed">
                    <label for="mode_detailed" class="tracking-option">
                        <span class="option-icon">📊</span>
                        <div class="option-text">
                            <span class="option-title">Dettagliato</span>
                            <span class="option-desc">Inserisci dati (kcal, ecc)</span>
                        </div>
                    </label>
                </div>
            </div>
        `;
    }

    preview.innerHTML = `
        <div class="challenge-preview-modal" style="--preview-color: ${template.color}">
            <div class="challenge-preview-header">
                <div class="challenge-preview-icon">${template.icon}</div>
                <h2>${template.name}</h2>
            </div>
            <p class="challenge-preview-desc">${template.description}</p>
            <div class="challenge-preview-stats">
                <div class="challenge-preview-stat">
                    <span class="stat-label">Durata</span>
                    <span class="stat-value">${template.duration} giorni</span>
                </div>
                <div class="challenge-preview-stat">
                    <span class="stat-label">Difficoltà</span>
                    <span class="stat-value">${'⭐'.repeat(template.stars)}</span>
                </div>
                <div class="challenge-preview-stat">
                    <span class="stat-label">Stat</span>
                    <span class="stat-value">${stat ? stat.icon + ' ' + stat.name : 'N/A'}</span>
                </div>
            </div>
            
            ${trackingOptionsHtml}

            <div class="challenge-preview-actions">
                <button class="settings-btn" onclick="closeChallengePreview()">Indietro</button>
                <button class="settings-btn primary" onclick="importChallenge('${template.id}')">🚀 Inizia Sfida</button>
            </div>
        </div>
    `;

    preview.onclick = (e) => {
        if (e.target === preview) closeChallengePreview();
    };

    preview.classList.remove('hidden');
    preview.classList.add('active');
}

function closeChallengePreview() {
    const preview = document.getElementById('challengePreviewOverlay');
    if (preview) {
        preview.classList.add('hidden');
        preview.classList.remove('active');
    }
}

// Import a challenge template as a new quest
function importChallenge(templateId) {
    const template = CHALLENGE_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;

    // Check for tracking mode selection
    let selectedMode = template.trackingMode; // Default to template default
    const modeInput = document.querySelector('input[name="tracking_mode"]:checked');
    if (modeInput) {
        selectedMode = modeInput.value;
    }

    // Generate subquests (daily tasks) for the challenge
    const subquests = template.generateSubquests();

    // Create the quest object
    const quest = {
        id: 'quest_' + Date.now(),
        name: template.name,
        description: template.description,
        icon: template.icon,
        category: template.category,
        stars: template.stars,
        primaryStatId: template.primaryStatId,
        color: template.color || '#ff9800',
        createdAt: getGameDateString(),
        dueDate: null, // Open-ended or managed by subquests
        subquests: subquests,
        isChallengeTemplate: true,
        templateId: template.id,
        trackingMode: selectedMode, // Save the selected tracking mode
        level: template.level // Save level
    };

    // Add to quests list
    // Add to quests list (unshift to show at top)
    state.quests.unshift(quest);
    saveState();

    // Close modals
    closeChallengePreview();
    closeChallengeCatalog();

    // Play sound and show notification
    playSound('questComplete'); // Reuse complete sound or add new one
    showToast(`Sfida "${template.name}" iniziata!`, 'success');

    // Switch to quests tab and refresh
    switchSection('quest');

    // Force a slight delay to ensure DOM is ready if switching sections
    setTimeout(() => {
        renderQuests();
        // Open the new quest detail
        openQuestDetail(quest.id);
    }, 100);
}

function renderQuests() {
    const container = document.getElementById('questList');
    const active = state.quests.filter(q => !q.completed);

    if (active.length === 0) {
        // Show onboarding guide for first-time users, otherwise show simple empty state
        if (shouldShowOnboarding('quests')) {
            container.innerHTML = getOnboardingHTML('quests');
        } else {
            container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🎯</div><div class="empty-state-text">Nessuna campagna</div><div class="empty-state-hint">Clicca "+" per iniziare</div></div>`;
        }
        return;
    }

    // Mark onboarding as complete when user has quests
    if (shouldShowOnboarding('quests')) {
        markOnboardingComplete('quests');
    }

    container.innerHTML = active.map(quest => {
        const completedSubs = quest.subquests.filter(s => s.completed).length;
        const totalSubs = quest.subquests.length;
        const progress = totalSubs > 0 ? (completedSubs / totalSubs) * 100 : 0;
        const primaryStat = state.stats.find(s => s.id === quest.primaryStatId);

        return `
            <div class="task-card quest-card ${quest.locked ? 'locked' : ''}" data-type="quest" data-id="${quest.id}" >
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
                                <span class="card-xp">+${calculateXp(quest.stars) * 3} XP</span>
                                ${primaryStat ? `<span class="card-stat">${primaryStat.icon}</span>` : ''}
                                ${quest.dueDate ? `<span class="card-due">📅 ${formatDate(quest.dueDate)}</span>` : ''}
                            </div>
                        </div>
                        <div class="drag-handle" title="Trascina per riordinare">⋮⋮</div>
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

    // Check if this is a challenge quest
    if (quest.isChallengeTemplate) {
        renderChallengeView(quest, content);
    } else {
        renderNormalQuestView(quest, content);
    }

    document.getElementById('questDetailModal').classList.add('active');
}

// Normal quest view with subtask list
function renderNormalQuestView(quest, container) {
    container.innerHTML = `
            <div class="modal-header" style = "border:none; padding-bottom:0; flex-shrink: 0;" >
                <h3 class="modal-title" style="font-family:'Cinzel', serif; font-size: 24px; width:100%; text-align:center; color:var(--accent-primary); text-shadow: 0 2px 4px rgba(0,0,0,0.5);">${quest.name}</h3>
        </div>

            <div class="quest-scroll-area">
                <div class="quest-description" style="text-align:center; color:var(--text-secondary); margin-bottom:24px; font-size:15px; font-style:italic;">
                    ${quest.description || 'Nessuna descrizione.'}
                </div>

                <div class="quest-subtasks-list" id="questDetailSubtasks">
                    ${(quest.subquests || []).map(sub => `
                    <div class="subtask-item-detail ${sub.completed ? 'completed' : ''}" data-id="${sub.id}">
                        <div class="subtask-checkbox" onclick="toggleSubquest('${quest.id}', '${sub.id}')"></div>
                        <span style="flex-grow:1; padding-left:8px;">${sub.name}</span>
                        <span class="subquest-drag-handle drag-handle" style="margin-left:auto; cursor:grab; opacity:0.5; padding: 0 8px;">☰</span>
                    </div>
                `).join('')}
                </div>

                <div class="quest-reward-area">
                    ${quest.customReward ? `<div style="font-size:18px; font-weight:bold; color:var(--accent-primary); margin-bottom:8px; text-shadow: 0 0 10px rgba(255,215,0,0.3);">🎁 ${quest.customReward}</div>` : ''}
                    <div style="display:flex; justify-content:center; gap:12px; font-size:14px; color:var(--text-muted);">
                        <span>${'⭐'.repeat(quest.stars)}</span>
                        <span>✨ ${calculateXp(quest.stars) * 3} XP</span>
                        ${quest.dueDate ? `<span>📅 ${formatDate(quest.dueDate)}</span>` : ''}
                    </div>
                </div>
            </div>
        `;

    // Re-initialize Sortable for this specific list
    const subtaskList = document.getElementById('questDetailSubtasks');
    if (subtaskList) {
        new Sortable(subtaskList, {
            animation: 100,
            handle: '.subquest-drag-handle',
            ghostClass: 'sortable-ghost',
            chosenClass: 'sortable-chosen',
            dragClass: 'sortable-drag',
            delay: 50,
            touchStartThreshold: 3,
            onEnd: function (evt) {
                if (evt.oldIndex !== evt.newIndex) {
                    reorderSubtasks(quest.id, evt.oldIndex, evt.newIndex);
                }
            }
        });
    }
}

// Challenge quest view with tally marks
function renderChallengeView(quest, container) {
    const subquests = quest.subquests || [];
    const completedCount = subquests.filter(s => s.completed).length;
    const totalDays = subquests.length;
    const nextDayIndex = completedCount; // 0-indexed
    const canComplete = nextDayIndex < totalDays;

    // Generate tally marks HTML - groups of 5 with strikethrough
    // Every 5th mark shows as a horizontal line crossing the previous 4
    let tallyHtml = '';

    for (let i = 0; i < totalDays; i++) {
        const isCompleted = subquests[i]?.completed;
        const isNextDay = i === nextDayIndex;
        const positionInGroup = i % 5; // 0-4
        const groupStart = Math.floor(i / 5) * 5;

        // Determine status class
        const statusClass = isCompleted ? 'completed' : (isNextDay ? 'next' : 'pending');

        // Check if this is the 5th mark (index 4 in group = position 4)
        if (positionInGroup === 4) {
            // This is the 5th mark - it's the strikethrough bar
            // Create a complete group of 5 with the horizontal line
            let groupMarks = '';
            for (let j = 0; j < 4; j++) {
                const markIdx = groupStart + j;
                const markCompleted = subquests[markIdx]?.completed;
                const markNext = markIdx === nextDayIndex;
                const markClass = markCompleted ? 'completed' : (markNext ? 'next' : 'pending');
                groupMarks += `<span class="tally-bar ${markClass}">│</span>`;
            }
            // Add the strikethrough line overlaid
            tallyHtml += `<div class="tally-group-5 ${statusClass}" title="Giorni ${groupStart + 1}-${groupStart + 5}">
                <div class="tally-bars">${groupMarks}</div>
                <div class="tally-strike-line ${statusClass}"></div>
            </div>`;
        } else if (positionInGroup === 0) {
            // First of a potential new group
            // Check if this group will be incomplete (less than 5 remaining)
            const remainingInGroup = Math.min(5, totalDays - groupStart);
            if (remainingInGroup < 5) {
                // Incomplete final group - just show individual bars
                for (let k = groupStart; k < totalDays; k++) {
                    const markCompleted = subquests[k]?.completed;
                    const markNext = k === nextDayIndex;
                    const markClass = markCompleted ? 'completed' : (markNext ? 'next' : 'pending');
                    tallyHtml += `<span class="tally-bar single ${markClass}" title="Giorno ${k + 1}">│</span>`;
                }
                break; // Exit the loop as we handled remaining marks
            }
            // Otherwise continue - the group will be completed at i % 5 === 4
        }
        // Marks 1-3 (positions 1,2,3) are handled when the group is completed at position 4
    }

    // Generate daily tracking UI for the current active day
    let trackingHtml = '';
    const currentSubquest = subquests[nextDayIndex];

    if (canComplete && currentSubquest) {
        if (quest.trackingMode === 'checkbox' && currentSubquest.goals) {
            trackingHtml = `
                <div class="daily-goals-container">
                    <p class="daily-goals-title">🎯 Obiettivi di oggi:</p>
                    <div class="daily-goals-list">
                        ${currentSubquest.goals.map((goal, idx) => `
                            <div class="goal-item" onclick="toggleGoalCheckbox(this)">
                                <div class="custom-checkbox"></div>
                                <span class="goal-text">${goal}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        } else if (quest.trackingMode === 'detailed') {
            trackingHtml = `
                <div class="daily-tracking-container">
                    <p class="daily-goals-title">📊 Diario Nutrizionale:</p>
                    <div class="tracking-inputs-row">
                        <div class="tracking-input-group">
                            <label>Calorie (kcal)</label>
                            <input type="number" id="daily_kcal" class="tracking-input" placeholder="0">
                        </div>
                        <div class="tracking-input-group">
                            <label>Proteine (g)</label>
                            <input type="number" id="daily_protein" class="tracking-input" placeholder="0">
                        </div>
                    </div>
                    <div class="tracking-input-group">
                        <label>Note (opzionale)</label>
                        <input type="text" id="daily_notes" class="tracking-input" placeholder="Come è andata?">
                    </div>
                </div>
            `;
        } else if (currentSubquest.targetReps) {
            // For push-ups or other rep-based challenges
            trackingHtml = `
                <div class="daily-target-display">
                    <span class="target-icon">🎯</span>
                    <span class="target-text">Obiettivo: <strong>${currentSubquest.targetReps}</strong> ripetizioni</span>
                </div>
            `;
        }
    }

    container.innerHTML = `
        <div class="modal-header" style="border:none; padding-bottom:0; flex-shrink: 0;">
            <h3 class="modal-title" style="font-family:'Cinzel', serif; font-size: 24px; width:100%; text-align:center; color:var(--accent-primary); text-shadow: 0 2px 4px rgba(0,0,0,0.5);">${quest.name}</h3>
        </div>

        <div class="quest-scroll-area challenge-view">
            <div class="quest-description" style="text-align:center; color:var(--text-secondary); margin-bottom:16px; font-size:14px; font-style:italic;">
                ${quest.description || 'Una sfida da completare!'}
            </div>

            <div class="challenge-progress-text">
                <span class="challenge-day-count">${completedCount}</span>
                <span class="challenge-day-label">/ ${totalDays} giorni</span>
            </div>

            <div class="tally-container">
                ${tallyHtml}
            </div>

            ${trackingHtml}

            ${canComplete ? `
            <button class="challenge-highfive-btn" onclick="completeChallengeDayAndRefresh('${quest.id}')">
                <span class="highfive-emoji">🙌</span>
                <span class="highfive-text">Giorno ${nextDayIndex + 1} completato!</span>
            </button>
            ` : `
            <div class="challenge-complete-banner">
                <span>🏆</span>
                <span>Sfida Completata!</span>
            </div>
            `}

            <div class="quest-reward-area" style="margin-top:16px;">
                <div style="display:flex; justify-content:center; gap:12px; font-size:14px; color:var(--text-muted);">
                    <span>${'⭐'.repeat(quest.stars)}</span>
                    <span>✨ ${calculateXp(quest.stars) * 3} XP</span>
                </div>
            </div>
        </div>
    `;
}

// Helper to toggle custom checkbox
function toggleGoalCheckbox(element) {
    element.classList.toggle('checked');
}

// Complete the next day in a challenge and refresh the view
function completeChallengeDayAndRefresh(questId) {
    const quest = state.quests.find(q => q.id === questId);
    if (!quest || !quest.subquests) return;

    // Find the next incomplete subquest
    const nextSub = quest.subquests.find(s => !s.completed);
    if (!nextSub) return;

    // Capture tracking data if detailed mode
    if (quest.trackingMode === 'detailed') {
        const kcal = document.getElementById('daily_kcal')?.value;
        const protein = document.getElementById('daily_protein')?.value;
        const notes = document.getElementById('daily_notes')?.value;

        if (kcal || protein || notes) {
            nextSub.data = {
                kcal: kcal || 0,
                protein: protein || 0,
                notes: notes || ''
            };
        }
    }

    // Force Complete (true) to prevent toggle-back on double click
    toggleSubquest(questId, nextSub.id, true);

    // Refresh view
    const overlay = document.querySelector('.quest-detail-overlay');
    if (overlay && !overlay.classList.contains('hidden')) {
        const contentContainer = overlay.querySelector('.quest-detail-modal');
        if (contentContainer) {
            renderChallengeView(quest, contentContainer);
        }
    }
}

function closeQuestDetailModal() {
    document.getElementById('questDetailModal').classList.remove('active');
    currentOpenedQuestId = null;
}

function openStatDetail(statId) {
    // ... (unchanged)
    const stat = state.stats.find(s => s.id === statId);
    if (!stat) return;

    const xpForNext = getXpForLevel(stat.level + 1);
    const xpNeeded = xpForNext - stat.xp;
    const progress = (stat.xp / xpForNext) * 100;

    // Complex Content Area
    const content = document.getElementById('statDetailContent');
    const momentum = getWeeklyMomentum(statId);

    // DYNAMIC SCALE: Scale based on the highest XP in the week, but keep a minimum floor.
    // If the best day is 30 XP, we scale to 50 XP so it looks substantial but not misleadingly full.
    // If the best day is 200 XP, we scale to 200 XP so it fits.
    const maxDayXp = Math.max(...momentum.map(m => m.xp));
    const maxMomentum = Math.max(maxDayXp, 50);

    // Filter history for "Last Activity"
    const history = state.xpLog
        .filter(entry => entry.statId === statId)
        .reverse();
    const lastEntry = history[0];

    content.innerHTML = `
            <div style = "text-align: center; margin-bottom: 5px;" >
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
                    <div class="momentum-bar-container" onclick="showMomentumTooltip(event, '${m.xp}')">
                        <div class="momentum-bar" data-xp="${m.xp}" style="height: ${Math.min((m.xp / maxMomentum) * 60, 60)}px; opacity: ${m.xp > 0 ? 1 : 0.3}"></div>
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

function toggleSubquest(questId, subquestId, forceState = null) {
    const quest = state.quests.find(q => q.id === questId);
    if (!quest || quest.locked) return;

    const subquest = quest.subquests.find(s => s.id === subquestId);
    if (!subquest) return;

    // If forceState is boolean, use it. Otherwise toggle.
    const newState = (typeof forceState === 'boolean') ? forceState : !subquest.completed;

    // If state isn't changing, do nothing (prevents duplicate XP/logs)
    if (subquest.completed === newState) return;

    subquest.completed = newState;

    if (subquest.completed) {
        // XP for subquest (uses parent quest's stars and stats)
        const xp = calculateXp(quest.stars);
        addXp(xp, quest.primaryStatId, `${quest.name} > ${subquest.name}`);
        if (quest.secondaryStatId) {
            addXp(Math.round(xp * XP_CONFIG.secondaryRatio), quest.secondaryStatId, `${quest.name} > ${subquest.name}`);
        }
        // Visual feedback
        showProgressPopup(quest.primaryStatId, xp);
        playSound('success');
        addMonthlyPoints(2); // Subquest Points
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

    const xp = calculateXp(quest.stars) * 3;
    addXp(xp, quest.primaryStatId, quest.name);
    if (quest.secondaryStatId) {
        addXp(Math.round(xp * XP_CONFIG.secondaryRatio), quest.secondaryStatId, quest.name);
    }
    addMonthlyPoints(2); // Quest Completion Points
    logCompletion('quests', quest.id);
    // recordActivity removed - undefined
    showProgressPopup(quest.primaryStatId, xp);
    playCelebration('major', quest.customReward);

    // Grant freeze for quest completion (quests are major achievements)
    if (state.player.streakFreezes < 2) {
        state.player.streakFreezes++;
    }

    saveState();
    renderQuests();
    renderCalendar();
}

// ============================================
// XP SYSTEM
// ============================================

function addXp(amount, statId, sourceName = null) {
    state.player.totalXp += amount;

    // Level Up Player (Cumulative Logic)
    while (state.player.totalXp >= getCumulativeXpForLevel(state.player.level + 1)) {
        state.player.level++;
    }
    // Level Down Player
    while (state.player.level > 1 && state.player.totalXp < getCumulativeXpForLevel(state.player.level)) {
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
    const now = getGameDateObj(); // Current Game Date (shifted)

    // Create a map for fast lookup: "YYYY-MM-DD" -> totalXP
    const xpMap = {};

    // Optimize: Filter once, then map
    // Use last 1000 entries (already sliced in addXp, but good to be safe)
    state.xpLog.forEach(entry => {
        if (entry.statId === statId) {
            // Ensure date exists, fallback to timestamp if needed
            let dateKey = entry.date;
            if (!dateKey && entry.timestamp) {
                dateKey = formatISO(new Date(entry.timestamp));
            }

            if (dateKey) {
                xpMap[dateKey] = (xpMap[dateKey] || 0) + Number(entry.amount);
            }
        }
    });

    for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateStr = formatISO(d);

        momentum.push({
            day: DAY_NAMES[d.getDay()],
            xp: xpMap[dateStr] || 0
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

    // Sync popup toggle settings (button style)
    syncPopupToggleButtons('enableDailyPlanner', 'dailyPlannerOn', 'dailyPlannerOff');
    syncPopupToggleButtons('enableWeeklyRecap', 'weeklyRecapOn', 'weeklyRecapOff');
    syncPopupToggleButtons('soundEnabled', 'soundOn', 'soundOff');
    syncPopupToggleButtons('showDiceButton', 'diceButtonOn', 'diceButtonOff');
    updateDiceButtonVisibility();

    // Sync week start buttons
    const weekStart = state.settings.weekStart || 'sunday';
    const monBtn = document.getElementById('weekStartMon');
    const sunBtn = document.getElementById('weekStartSun');
    if (monBtn) monBtn.classList.toggle('active', weekStart === 'monday');
    if (sunBtn) sunBtn.classList.toggle('active', weekStart === 'sunday');
}

function syncPopupToggleButtons(setting, onBtnId, offBtnId) {
    const onBtn = document.getElementById(onBtnId);
    const offBtn = document.getElementById(offBtnId);
    // Explicitly check boolean true/false to avoid undefined issues
    const isEnabled = state.settings[setting] === true || state.settings[setting] === undefined;

    if (onBtn && offBtn) {
        // CLEANUP: Remove any inline styles caused by previous fix attempt
        onBtn.style.background = '';
        onBtn.style.color = '';
        offBtn.style.background = '';
        offBtn.style.color = '';

        // Use standard classes which now work correctly with !important fix
        if (isEnabled) {
            onBtn.classList.add('active');
            offBtn.classList.remove('active');
        } else {
            onBtn.classList.remove('active');
            offBtn.classList.add('active');
        }
    }
}

function setPopupSetting(setting, value) {
    state.settings[setting] = value;

    // Update visual immediately before save
    let onBtnId, offBtnId;

    if (setting === 'enableDailyPlanner') { onBtnId = 'dailyPlannerOn'; offBtnId = 'dailyPlannerOff'; }
    else if (setting === 'enableWeeklyRecap') { onBtnId = 'weeklyRecapOn'; offBtnId = 'weeklyRecapOff'; }
    else if (setting === 'animatedBackground') { onBtnId = 'animBgOn'; offBtnId = 'animBgOff'; }
    else if (setting === 'showDiceButton') { onBtnId = 'diceButtonOn'; offBtnId = 'diceButtonOff'; }
    else { onBtnId = 'soundOn'; offBtnId = 'soundOff'; } // Sound

    syncPopupToggleButtons(setting, onBtnId, offBtnId);

    saveState();

    if (setting === 'animatedBackground') {
        updateImmersiveBackground(state.settings.theme);
    }

    if (setting === 'showDiceButton') {
        updateDiceButtonVisibility();
    }
}

function setWeekStart(value) {
    state.settings.weekStart = value;

    // Update UI buttons
    const monBtn = document.getElementById('weekStartMon');
    const sunBtn = document.getElementById('weekStartSun');
    if (monBtn) monBtn.classList.toggle('active', value === 'monday');
    if (sunBtn) sunBtn.classList.toggle('active', value === 'sunday');

    saveState();

    // Refresh calendar to reflect new week start
    renderCalendar();
}

// Show/hide dice button based on setting
function updateDiceButtonVisibility() {
    const diceBtn = document.getElementById('diceButtonTrigger');
    if (diceBtn) {
        const showDice = state.settings.showDiceButton !== false; // Default true
        diceBtn.style.display = showDice ? '' : 'none';
    }
}


function initColorPicker() {
    const dropdown = document.getElementById('colorDropdown');
    if (!dropdown) return;
    dropdown.innerHTML = ACCENT_COLORS.map(color =>
        `<div class="color-swatch ${state.settings.accent === color ? 'active' : ''}" data-color="${color}" onclick= "setAccent('${color}')" ></div> `
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

// Theme Selection Dropdown Toggle
function toggleThemeDropdown() {
    const dropdown = document.getElementById('themeDropdown');
    if (dropdown) dropdown.classList.toggle('hidden');
}

function applyTheme() {
    // Migration for v2 Deep Theming
    if (!state.settings.mode) {
        state.settings.mode = 'light'; // Default
        // If coming from old "Futuristic" tracking which was dark-only
        if (state.settings.theme === 'futuristic') state.settings.mode = 'dark';
    }

    const theme = state.settings.theme;
    const mode = state.settings.mode;

    document.body.dataset.theme = theme;
    document.body.dataset.mode = mode; // New data-mode attribute
    document.body.dataset.accent = state.settings.accent;

    // Update Theme Trigger UI
    const themeParams = {
        'standard': { icon: '📱', name: 'Standard' },
        'fantasy': { icon: '💍', name: 'Fantasy' },
        'dnd': { icon: '📜', name: 'D&D' },
        'futuristic': { icon: '👾', name: 'Tron' },
        'pirate': { icon: '🏴‍☠️', name: 'Pirate' }
    };

    const currentThemeData = themeParams[theme] || themeParams['standard'];
    const triggerIcon = document.getElementById('themeTriggerIcon');
    const triggerText = document.getElementById('themeTriggerText');

    if (triggerIcon) triggerIcon.textContent = currentThemeData.icon;
    if (triggerText) triggerText.textContent = currentThemeData.name;

    // Update Mode Buttons (Large)
    document.querySelectorAll('.mode-btn-large').forEach(btn => btn.classList.remove('active'));
    const activeModeBtn = document.getElementById(mode === 'light' ? 'modeLight' : 'modeDark');
    if (activeModeBtn) activeModeBtn.classList.add('active');
}

function setTheme(theme) {
    state.settings.theme = theme;
    applyTheme();
    saveState();
    updateImmersiveBackground(theme);

    // Close dropdown
    const dropdown = document.getElementById('themeDropdown');
    if (dropdown) dropdown.classList.add('hidden');
}

function setMode(mode) {
    state.settings.mode = mode;
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

function updateSettingToggle(setting, value) {
    state.settings[setting] = value;
    saveState();
}

function renderSettingsStats() {
    const attributes = state.stats.filter(s => s.type === 'attribute');
    const abilities = state.stats.filter(s => s.type === 'ability');

    const attrList = document.getElementById('attributesManageList');
    const abilList = document.getElementById('abilitiesManageList');

    if (attrList) {
        attrList.innerHTML = attributes.map(stat => `
            <div class="stat-manage-item" >
                <div class="stat-manage-info">
                    <input type="checkbox" ${stat.visible ? 'checked' : ''} onchange="toggleStatVisibility('${stat.id}')">
                    <span>${stat.icon} ${stat.name}</span>
                </div>
                <div class="stat-manage-actions">
                    <button onclick="editStat('${stat.id}')">✏️</button>
                    <button onclick="deleteStat('${stat.id}')">🗑️</button>
                </div>
            </div>
            `).join('');
    }

    if (abilList) {
        abilList.innerHTML = abilities.map(stat => `
            <div class="stat-manage-item" >
                <div class="stat-manage-info">
                    <input type="checkbox" ${stat.visible ? 'checked' : ''} onchange="toggleStatVisibility('${stat.id}')">
                    <span>${stat.icon} ${stat.name}</span>
                </div>
                <div class="stat-manage-actions">
                    <button onclick="editStat('${stat.id}')">✏️</button>
                    <button onclick="deleteStat('${stat.id}')">🗑️</button>
                </div>
            </div>
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



// ============================================
// MODAL SYSTEM
// ============================================

let currentModalType = null;

function openModal(type, editData = null) {
    currentModalType = type;
    editingItem = editData;

    // Layering: If opening inventory-related form, hide inventory modal temporarily
    if (type === 'toxic' || type === 'supply') {
        const invModal = document.getElementById('inventoryModal');
        const invOverlay = document.getElementById('inventoryOverlay');
        if (invModal) invModal.classList.add('hidden');
        if (invOverlay) invOverlay.classList.remove('active');
    }

    const title = document.getElementById('modalTitle');
    const body = document.getElementById('modalBody');

    const statOptions = state.stats.map(s => `<option value= "${s.id}" > ${s.icon} ${s.name}</option> `).join('');
    const statOptionsOptional = `<option value= "" > --Nessuna --</option> ` + statOptions;

    const frequencyOptions = `
            <option value= "daily" >📅 Giornaliera</option>
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
            <div class="form-group" >
                    <label>Nome</label>
                    <input type="text" id="inputName" value="${editData?.name || ''}" placeholder="es. Meditazione mattutina">
                </div>
                <div class="form-group">
                    <label>Descrizione (opzionale)</label>
                    <textarea id="inputDesc" placeholder="Aggiungi dettagli...">${editData?.description || ''}</textarea>
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
            title.textContent = editData ? 'Modifica Missione' : 'Nuova Missione';
            body.innerHTML = `
            <div class="form-group" >
                    <label>Nome</label>
                    <input type="text" id="inputName" value="${editData?.name || ''}" placeholder="es. Chiamare il dentista">
                </div>
                <div class="form-group">
                    <label>Descrizione (opzionale)</label>
                    <textarea id="inputDesc" placeholder="Aggiungi dettagli...">${editData?.description || ''}</textarea>
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
            title.textContent = editData ? 'Modifica Campagna' : 'Nuova Campagna';
            body.innerHTML = `
            <div class="form-group" >
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
            <div class="form-group" >
                    <label>Nome</label>
                    <input type="text" id="inputName" value="${editData?.name || ''}" placeholder="es. Creatività">
                </div>
                <div class="form-row">
                    <div class="form-group" style="flex: 1;">
                        <label>Emoji</label>
                        <input type="text" id="inputIcon" value="${editData?.icon || ''}" placeholder="🎨" maxlength="2" style="text-align: center; font-size: 20px;">
                    </div>
                    <div class="form-group" style="flex: 1;">
                        <label>Liv. Iniziale</label>
                        <input type="number" id="inputLevel" value="${editData?.level || 1}" min="1" max="50" placeholder="1">
                    </div>
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
                document.getElementById('inputPrimaryStat').value = editData.statId || '';
            }
            break;

        case 'supply':
            title.textContent = 'Nuovo Rifornimento';
            body.innerHTML = `
                <div class="form-group">
                    <label>Nome Elemento</label>
                    <input type="text" id="inputName" placeholder="es. Banane, Latte, Uova">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Tipo</label>
                        <select id="inputSupplyType">
                            <option value="healthy">🥝 Sano (Sostentamento)</option>
                            <option value="neutral">📦 Neutro / Base</option>
                        </select>
                    </div>
                </div>
                <div class="form-actions">
                    <button class="btn-secondary" onclick="closeModal()">Annulla</button>
                    <button class="btn-primary" onclick="submitModal()">Aggiungi</button>
                </div>
            `;
            break;
    }

    const overlay = document.getElementById('modalOverlay');
    const modal = document.getElementById('modal');
    overlay.classList.add('active');
    modal.classList.add('active');

    if (type === 'habit' || type === 'oneshot' || type === 'quest' || type === 'toxic') {
        initStarRating();
    }
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('active');
    document.getElementById('modal').classList.remove('active'); // Ensure modal itself is hidden

    // Layering: If we were in toxic or supply form, re-open inventory
    if (currentModalType === 'toxic' || currentModalType === 'supply') {
        openInventory();
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
            const descHabit = document.getElementById('inputDesc')?.value || '';

            if (editingItem) {
                Object.assign(editingItem, { name, frequency, freqTimes, stars, primaryStatId, secondaryStatId, dueDate, description: descHabit });
            } else {
                state.habits.push({
                    id: 'habit_' + Date.now(),
                    name, frequency, freqTimes, stars, primaryStatId, secondaryStatId, dueDate, description: descHabit,
                    streak: 0, lastCompleted: null, locked: false, createdAt: getGameDateObj().toISOString()
                });
            }
            break;

        case 'oneshot':
            const descOneshot = document.getElementById('inputDesc')?.value || '';
            if (editingItem) {
                Object.assign(editingItem, { name, stars, primaryStatId, secondaryStatId, dueDate, description: descOneshot });
            } else {
                state.oneshots.push({
                    id: 'oneshot_' + Date.now(),
                    name, stars, primaryStatId, secondaryStatId, dueDate, description: descOneshot,
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
            const level = Math.max(1, Math.min(50, parseInt(document.getElementById('inputLevel')?.value) || 1));
            const isAbility = currentModalType === 'ability';

            if (editingItem) {
                Object.assign(editingItem, { name, icon, description, level });
            } else {
                state.stats.push({
                    id: (isAbility ? 'abil_' : 'attr_') + Date.now(),
                    name, icon, description,
                    type: isAbility ? 'ability' : 'attribute',
                    visible: true, level: level, xp: 0
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
            renderToxicItems();
            break;

        case 'supply':
            const supplyType = document.getElementById('inputSupplyType')?.value || 'healthy';
            state.inventory.supplies.push({
                id: 'supply_' + Date.now(),
                name,
                type: supplyType,
                status: 'needed',
                createdAt: getGameDateObj().toISOString()
            });
            renderSupplies();
            break;
    }

    saveState();
    renderAll();
    closeModal();
}



// ============================================
// SWIPE ACTIONS
// ============================================

function initSwipe() {
    let currentX = 0;
    let isSwiping = false;
    let swipeWasTriggered = false;
    const ACTION_THRESHOLD = 70;  // Reduced for easier swipe trigger
    const MAX_SWIPE = 120;

    document.addEventListener('pointerdown', (e) => {
        // Don't start swipe if touching drag handle (handled by SortableJS)
        if (e.target.closest('.drag-handle')) return;

        const content = e.target.closest('.swipe-content');
        if (!content) return;

        swipeWasTriggered = false;

        currentSwipeCard = content;
        const taskCard = content.closest('.task-card');
        if (taskCard) taskCard.classList.add('swiping');
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
        // Visual feedback
        const taskCard = currentSwipeCard.closest('.task-card');
        if (!taskCard) return;

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
        if (!taskCard) {
            isSwiping = false;
            currentSwipeCard = null;
            return;
        }

        taskCard.classList.remove('swiping');
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

    // Handle pointer cancel (e.g., scroll started on mobile)
    document.addEventListener('pointercancel', () => {
        if (currentSwipeCard) {
            const taskCard = currentSwipeCard.closest('.task-card');
            if (taskCard) {
                taskCard.classList.remove('swiping', 'swipe-edit-hint', 'swipe-delete-hint');
            }
            currentSwipeCard.style.transition = 'transform 0.3s ease';
            currentSwipeCard.style.transform = 'translateX(0)';
            currentSwipeCard = null;
        }
        isSwiping = false;
    });

    // Reset all swiped cards when scrolling
    document.querySelectorAll('.habits-list, .oneshot-list, .quest-list').forEach(container => {
        container.addEventListener('scroll', resetAllSwipeCards);
    });

    window.checkSwipeTrigger = () => {
        const was = swipeWasTriggered;
        swipeWasTriggered = false;
        return was;
    };
}

// Reset all cards that might be stuck in swiped position
function resetAllSwipeCards() {
    document.querySelectorAll('.swipe-content').forEach(content => {
        content.style.transition = 'transform 0.2s ease';
        content.style.transform = 'translateX(0)';
    });
    document.querySelectorAll('.task-card').forEach(card => {
        card.classList.remove('swiping', 'swipe-edit-hint', 'swipe-delete-hint');
    });
}

// Delete confirmation modal
function showDeleteConfirm(type, id) {
    let list;
    if (type === 'habit') list = state.habits;
    else if (type === 'oneshot') list = state.oneshots;
    else if (type === 'quest') list = state.quests;
    else if (type === 'attribute' || type === 'ability') list = state.stats;
    else if (type === 'food') list = state.inventory.food;
    else if (type === 'home') list = state.inventory.home;

    const item = list.find(i => i.id === id);
    if (!item) return;

    // Determine label
    let label = "task";
    if (type === 'habit') label = "abitudine";
    else if (type === 'oneshot') label = "one shot";
    else if (type === 'quest') label = "quest";
    else if (type === 'attribute') label = "attributo";
    else if (type === 'ability') label = "abilità";
    else if (type === 'food') label = "cibo";
    else if (type === 'home') label = "oggetto casa";

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'delete-confirm-overlay';
    overlay.innerHTML = `
            <div class="delete-confirm-modal" >
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
    } else if (type === 'food' || type === 'home') {
        const list = state.inventory[type];
        if (list) {
            const itemIndex = list.findIndex(i => i.id === id);
            if (itemIndex > -1) {
                list.splice(itemIndex, 1);
                saveState();
                renderNutritionInventory();
            }
        }
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
    else if (type === 'food') list = state.inventory.food;
    else if (type === 'home') list = state.inventory.home;

    const item = list.find(i => i.id === id);
    if (item) {
        if (type === 'food' || type === 'home') {
            openAddItemModal(item);
        } else {
            openModal(type, item);
        }
    }
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



function handleTaskClick(e, type, id) {
    if (e.target.closest('.card-checkbox')) return;

    // Prevent click if a swipe action was just triggered
    if (window.checkSwipeTrigger && window.checkSwipeTrigger()) return;

    // Only open detail views for quests and stats
    // Habits/oneshots now also open detail view on click
    if (type === 'quest') {
        const quest = state.quests.find(q => q.id === id);
        if (quest) openQuestDetail(id);
    } else if (type === 'attribute' || type === 'ability') {
        openStatDetail(id);
    } else if (type === 'habit' || type === 'oneshot') {
        openTaskDetail(type, id);
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
    document.querySelector(`[onclick= "switchAvatarTab('${tab}')"]`).classList.add('active');

    document.getElementById('emojiTab').classList.toggle('hidden', tab !== 'emoji');
    document.getElementById('uploadTab').classList.toggle('hidden', tab !== 'upload');
}

function renderEmojiGrid() {
    document.getElementById('emojiGrid').innerHTML = AVATAR_EMOJIS.map(emoji =>
        `<button class="emoji-option ${state.player.avatarEmoji === emoji ? 'selected' : ''}" onclick="selectEmoji('${emoji}')">${emoji}</button>`
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



// ============================================
// UTILITIES
// ============================================

// Demo data removed
/*
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
*/

// Master Repair Function (Clean, Streamline, Correct)
function fixData() {
    if (confirm('Eseguire una riparazione completa del database? \n\n- Corregge attributi corrotti\n- Ripara stringhe JSON\n- Ricalcola i punti mensili\n- Ricostruisce le streak\n\nAttenzione: La pagina si ricaricherà.')) {

        // 1. Fix Attributes (Legacy Logic)
        const currentLevels = {};
        state.stats.forEach(s => currentLevels[s.id] = s);
        state.stats = [...DEFAULT_ATTRIBUTES.map(a => ({ ...a })), ...DEFAULT_ABILITIES.map(a => ({ ...a }))];
        state.stats.forEach(s => {
            if (currentLevels[s.id]) {
                s.level = currentLevels[s.id].level;
                s.xp = currentLevels[s.id].xp;
                s.visible = currentLevels[s.id].visible;
            }
        });

        // 2. Fix Completion Log Structure (Sanitization)
        Object.keys(state.completionLog).forEach(key => {
            let entry = state.completionLog[key];
            if (!entry || (typeof entry !== 'object')) {
                // Fix invalid entries
                state.completionLog[key] = { habits: [], oneshots: [], quests: [] };
            } else if (Array.isArray(entry)) {
                // Convert old array format to object
                state.completionLog[key] = { habits: [...entry], oneshots: [], quests: [] };
            } else {
                // Ensure internal arrays exist
                if (!entry.habits) entry.habits = [];
                if (!entry.oneshots) entry.oneshots = [];
                if (!entry.quests) entry.quests = [];
            }
        });

        // 3. Rebuild Streaks
        rebuildStreaksFromLog();

        // 4. Recalculate Monthly Points
        if (state.player.monthlyChallenge && state.player.monthlyChallenge.currentMonth) {
            const currentMonth = state.player.monthlyChallenge.currentMonth;
            let totalPoints = 0;

            Object.keys(state.completionLog).forEach(date => {
                if (!date.startsWith(currentMonth)) return;
                const log = state.completionLog[date];

                // Habits (1 pt each)
                if (log.habits) totalPoints += log.habits.length;
                // OneShots (1 pt each - assumed)
                if (log.oneshots) totalPoints += log.oneshots.length;
                // Quests (2 pts each)
                if (log.quests) totalPoints += (log.quests.length * 2);
            });

            state.player.monthlyChallenge.points = totalPoints;

            // Check medal unlock logic with new points
            addMonthlyPoints(0);
        }

        saveState();
        renderAll();
        alert('✅ Riparazione Completa Eseguita!\n\nTutti i dati sono stati verificati e corretti.');
        location.reload();
    }
}



// ============================================
// DATA MANAGEMENT (Export/Import/Backup)
// ============================================

function initBackupSystem() {
    const dbSection = document.getElementById('dbConnectionSection');
    const backupSection = document.getElementById('backupStatusSection');

    // Check for File System Access API support
    if ('showSaveFilePicker' in window) {
        // Desktop / Supported
        if (dbSection) dbSection.style.display = 'block';
        if (backupSection) backupSection.style.display = 'none'; // Hide manual backup reminder if auto-sync is available
    } else {
        // Mobile / Unsupported
        if (dbSection) dbSection.style.display = 'none';
        if (backupSection) backupSection.style.display = 'block';

        checkBackupStatus();
    }
}

function checkBackupStatus() {
    const lastBackup = state.player.lastBackupDate;
    const label = document.getElementById('lastBackupLabel');
    const warning = document.getElementById('backupWarning');

    if (!label || !warning) return;

    if (!lastBackup) {
        label.textContent = "Mai";
        warning.style.display = 'block';
        warning.textContent = "⚠️ Backup mai eseguito!";
    } else {
        const date = new Date(lastBackup);
        label.textContent = date.toLocaleDateString();

        // Check age
        const diff = new Date() - date;
        const days = diff / (1000 * 60 * 60 * 24);

        if (days > 7) {
            warning.style.display = 'block';
            warning.textContent = "⚠️ Backup vecchio (> 7 giorni)";
        } else {
            warning.style.display = 'none';
        }
    }
}

function exportData() {
    // Update backup timestamp
    state.player.lastBackupDate = new Date().toISOString();
    saveState();

    // Update UI immediately
    checkBackupStatus();

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);

    // Smart Export Name: Fixed name for easy replacement
    // We can append date if needed, but for "Quick Save" replacement flow, fixed name is better.
    // However, users might want history.
    // Let's compromise: "quest-life-backup.json" (Browser usually handles duplicates by numbering if not replacing)
    // The user asked for "overwrite same file". On iOS "Save to Files", if filename is same, it asks "Replace?".
    downloadAnchorNode.setAttribute("download", "quest-life-backup.json");

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
        });
    }

    // Force clear all caches
    if ('caches' in window) {
        caches.keys().then(names => {
            Promise.all(names.map(name => caches.delete(name))).then(() => {
                window.location.reload(true);
            });
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
            <div class="visibility-item" >
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

// LEGACY INVENTORY CODE REMOVED (v3.1.0)

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

    // Check current state and resume if needed
    if (state.pomodoro.status === 'running') {
        const now = new Date();
        const target = new Date(state.pomodoro.targetTime);
        if (target > now) {
            pomodoroRunning = true;
            // Resume interval
            if (pomodoroInterval) clearInterval(pomodoroInterval);
            pomodoroInterval = setInterval(tickPomodoro, 1000);
        } else {
            // Timer finished while away
            completePomodoro();
            return;
        }
    } else if (state.pomodoro.status === 'paused') {
        pomodoroRunning = false;
        pomodoroTimeLeft = state.pomodoro.remainingTime;
    } else {
        // Idle
        pomodoroRunning = false;
        pomodoroTimeLeft = state.pomodoro.workDuration * 60;
    }

    updatePomodoroDisplay();
    updatePomodoroControls();
}

function closePomodoroTimer() {
    const modal = document.getElementById('pomodoroModal');
    const overlay = document.getElementById('pomodoroOverlay');
    if (modal) modal.classList.add('hidden');
    if (overlay) overlay.classList.remove('active');

    // If running, we keep it running in background (interval might slow down but state is safe)
    // If we wanted to stop UI updates we could clear interval here, but we need it for tick logic.
    // The tick logic relies on Date.now() so it's robust against throttling.
}

function savePomodoroSettings() {
    const statSelect = document.getElementById('pomodoroStat');
    const durationInput = document.getElementById('pomodoroDuration');

    if (statSelect) state.pomodoro.targetStatId = statSelect.value;
    if (durationInput) {
        const newDuration = Math.max(1, Math.min(60, parseInt(durationInput.value) || 25));

        // Only allow changing duration if IDLE. 
        // If running or paused, changing duration would reset progress which might be annoying.
        if (state.pomodoro.status === 'idle') {
            state.pomodoro.workDuration = newDuration;
            pomodoroTimeLeft = state.pomodoro.workDuration * 60;
            updatePomodoroDisplay();
        } else {
            // Just update preference for next time
            state.pomodoro.workDuration = newDuration;
        }
    }
    saveState();
}

function updatePomodoroControls() {
    const btn = document.getElementById('pomodoroStartBtn');
    const statusEl = document.getElementById('pomodoroStatus');

    if (!btn || !statusEl) return;

    if (state.pomodoro.status === 'running') {
        btn.textContent = '⏸️ Pausa';
        btn.classList.add('running');
        statusEl.textContent = '🔥 Focus in corso...';
    } else if (state.pomodoro.status === 'paused') {
        btn.textContent = '▶️ Riprendi';
        btn.classList.remove('running');
        statusEl.textContent = '⏸️ In pausa';
    } else {
        btn.textContent = '▶️ Avvia';
        btn.classList.remove('running');
        statusEl.textContent = 'Pronto';
    }
}

function togglePomodoro() {
    if (state.pomodoro.status === 'running') {
        pausePomodoro();
    } else {
        startPomodoro();
    }
}

function startPomodoro() {
    pomodoroRunning = true;
    state.pomodoro.status = 'running';

    // Calculate target time
    const now = new Date();
    // If resuming from pause, use remainingTime. If new start, use workDuration.
    const durationSeconds = (state.pomodoro.remainingTime > 0) ? state.pomodoro.remainingTime : (state.pomodoro.workDuration * 60);

    const target = new Date(now.getTime() + durationSeconds * 1000);
    state.pomodoro.targetTime = target.toISOString();
    state.pomodoro.remainingTime = null; // Clear remaining since we have a target

    saveState();
    updatePomodoroControls();

    if (pomodoroInterval) clearInterval(pomodoroInterval);
    pomodoroInterval = setInterval(tickPomodoro, 1000);
    tickPomodoro(); // Update immediately
}

function pausePomodoro() {
    pomodoroRunning = false;
    state.pomodoro.status = 'paused';

    if (pomodoroInterval) clearInterval(pomodoroInterval);

    // Calculate remaining time
    const now = new Date();
    const target = new Date(state.pomodoro.targetTime);
    const remainingSeconds = Math.max(0, Math.ceil((target - now) / 1000));

    state.pomodoro.remainingTime = remainingSeconds;
    state.pomodoro.targetTime = null; // Clear target since we are paused

    saveState();
    updatePomodoroControls();
    updatePomodoroDisplay(); // Show exact remaining
}

function resetPomodoro() {
    pomodoroRunning = false;
    state.pomodoro.status = 'idle';
    state.pomodoro.targetTime = null;
    state.pomodoro.remainingTime = null;

    if (pomodoroInterval) clearInterval(pomodoroInterval);

    pomodoroTimeLeft = state.pomodoro.workDuration * 60;

    saveState();
    updatePomodoroControls();
    updatePomodoroDisplay();
}

function tickPomodoro() {
    if (state.pomodoro.status !== 'running') return;

    const now = new Date();
    const target = new Date(state.pomodoro.targetTime);
    const diff = Math.ceil((target - now) / 1000);

    if (diff > 0) {
        pomodoroTimeLeft = diff;
        updatePomodoroDisplay();
    } else {
        completePomodoro();
    }
}

function updatePomodoroDisplay() {
    // If running, timeLeft is updated by tick. 
    // If paused, use state.remainingTime. 
    // If idle, use state.workDuration.

    let secondsLeft = 0;
    if (state.pomodoro.status === 'running') {
        const now = new Date();
        const target = new Date(state.pomodoro.targetTime);
        secondsLeft = Math.max(0, Math.ceil((target - now) / 1000));
    } else if (state.pomodoro.status === 'paused') {
        secondsLeft = state.pomodoro.remainingTime || 0;
    } else {
        secondsLeft = state.pomodoro.workDuration * 60;
    }

    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;
    const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    const timeEl = document.getElementById('pomodoroTime');
    if (timeEl) timeEl.textContent = timeStr;

    // Update Browser Tab Title safely? Maybe too distraction.
    // document.title = `${timeStr} - Focus`;

    const countEl = document.getElementById('pomodoroCount');
    if (countEl) countEl.textContent = state.pomodoro.sessionsToday;

    const xpEl = document.getElementById('pomodoroXp');
    if (xpEl) xpEl.textContent = state.pomodoro.xpPerSession;
}

function completePomodoro() {
    clearInterval(pomodoroInterval);
    pomodoroRunning = false;
    state.pomodoro.status = 'idle';
    state.pomodoro.targetTime = null;
    state.pomodoro.remainingTime = null;

    // Add XP
    const statName = state.stats.find(s => s.id === state.pomodoro.targetStatId)?.name || 'Stat';
    addXp(state.pomodoro.xpPerSession, state.pomodoro.targetStatId, '🍅 Pomodoro');

    // Update session count
    state.pomodoro.sessionsToday++;
    state.pomodoro.lastSessionDate = getGameDateString();
    addMonthlyPoints(1); // Pomodoro Point
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

    // Reset timer display
    pomodoroTimeLeft = state.pomodoro.workDuration * 60;
    updatePomodoroControls();
    updatePomodoroDisplay();

    const statusEl = document.getElementById('pomodoroStatus');
    if (statusEl) statusEl.textContent = `✅ +${state.pomodoro.xpPerSession} XP ${statName} !`;
}

// ============================================
// POPUP MANAGER (Prevent Overlaps)
// ============================================

function isAnyModalOpen() {
    // Check all major overlays
    // Updated IDs to match index.html
    const overlays = [
        'setupWizardOverlay',
        'dailyPlannerOverlay',
        'weeklyRecapOverlay',
        'streakCelebration',
        'questDetailModal',
        'archiveModal',
        'avatarModalOverlay',
        'mottoEditModal',
        'toxicInventoryModal',
        'pomodoroModal',
        'installOverlay'
    ];

    for (const id of overlays) {
        const el = document.getElementById(id);
        if (el) {
            // Robust visibility check using computed style
            // This handles both .hidden class and CSS-based display:none logic
            const style = window.getComputedStyle(el);
            if (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0') {
                return true;
            }
        }
    }

    // Check profile popups specifically (iterate all of them)
    const profilePopups = document.querySelectorAll('.profile-popup');
    for (const popup of profilePopups) {
        if (!popup.classList.contains('hidden')) {
            const style = window.getComputedStyle(popup);
            if (style.display !== 'none' && style.visibility !== 'hidden') return true;
        }
    }

    return false;
}

// ============================================
// DAILY D&D PLANNER
// ============================================

function checkDailyPlan() {
    // Check if disabled in settings
    if (state.settings.enableDailyPlanner === false) return;

    // Safety check for other open modals
    if (isAnyModalOpen()) return;

    // Skip if first-time setup wizard is visible (avoid overlapping popups)
    const setupWizardOverlay = document.getElementById('setupWizardOverlay');
    if (setupWizardOverlay && !setupWizardOverlay.classList.contains('hidden')) return;

    // Also skip if setup was never completed (first launch)
    const hasCompletedSetup = localStorage.getItem('questlife_setup_completed');
    if (!hasCompletedSetup) return;

    const now = new Date();
    const today = getGameDateString();

    // Only trigger after 6 AM
    if (now.getHours() < 6) return;

    // Check if already shown today
    if (state.dailyPlan.lastPlanDate === today) return;

    // Show planner
    showDailyPlanner();
}

function showDailyPlanner() {
    // Populate stat dropdowns
    const selects = document.querySelectorAll('.slot-stat');
    selects.forEach(select => {
        select.innerHTML = state.stats.map(stat =>
            `<option value="${stat.id}">${stat.icon} ${stat.name}</option>`
        ).join('');
    });

    // Clear previous inputs
    document.querySelectorAll('.slot-name').forEach(input => input.value = '');

    // --- QUICK PICK POPULATION REMOVED (Now using picker buttons) ---

    // Initialize star selectors (only in Daily Planner modal)
    const plannerModal = document.getElementById('dailyPlannerModal');
    if (plannerModal) {
        // Reset to standard slots only? No, maybe keep them if user added them? 
        // Better: reset to default 4 slots if it's a fresh show.
        const container = document.getElementById('dailyPlannerSlots');
        const defaultSlots = ['action', 'bonus', 'movement', 'reaction'];
        const slots = container.querySelectorAll('.daily-slot');
        slots.forEach(slot => {
            if (!defaultSlots.includes(slot.dataset.slot)) {
                slot.remove();
            }
        });

        plannerModal.querySelectorAll('.star-selector').forEach(selector => {
            const stars = parseInt(selector.dataset.stars) || 3;
            updateStarDisplay(selector, stars);

            selector.querySelectorAll('.star').forEach(star => {
                // Remove old listeners and add new ones
                star.style.cursor = 'pointer';
                star.style.pointerEvents = 'auto';
                star.addEventListener('click', function (e) {
                    e.stopPropagation();
                    const value = parseInt(this.dataset.value);
                    selector.dataset.stars = value;
                    updateStarDisplay(selector, value);
                });
            });
        });
    }

    document.getElementById('dailyPlannerModal')?.classList.remove('hidden');
    document.getElementById('dailyPlannerOverlay')?.classList.remove('hidden');
}

let currentTargetSlot = null;

function openTaskPicker(slotIndex) {
    currentTargetSlot = slotIndex;
    const pickerOverlay = document.getElementById('taskPickerOverlay');
    const pickerModal = document.getElementById('taskPickerModal');
    const list = document.getElementById('taskPickerList');

    if (!list || !pickerModal) return;

    // Build exclusion list from already selected tasks in the planner
    const selectedIds = Array.from(document.querySelectorAll('.slot-name'))
        .map(input => input.dataset.sourceId)
        .filter(id => id);

    let items = [];
    // Active Missions (OneShots)
    if (state.oneshots) {
        state.oneshots.forEach(os => {
            if (!os.completed && !selectedIds.includes(os.id)) {
                items.push({ name: os.name, icon: '💥', id: os.id, type: 'oneshot', typeLabel: 'Missione' });
            }
        });
    }
    // Campagne (Quest subtasks)
    if (state.quests) {
        state.quests.forEach(q => {
            if (!q.completed && q.subquests) {
                // Find only the FIRST uncompleted subtask (the "current" daily challenge)
                const nextSub = q.subquests.find(sub => !sub.completed);
                if (nextSub && !selectedIds.includes(nextSub.id)) {
                    items.push({
                        name: nextSub.name,
                        icon: '🏆',
                        id: nextSub.id,
                        type: 'quest',
                        questId: q.id,
                        typeLabel: `Campagna: ${q.name}`
                    });
                }
            }
        });
    }

    if (items.length === 0) {
        list.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text-muted);">Tutte le missioni disponibili sono già state caricate o non ce ne sono di attive.</div>`;
    } else {
        list.innerHTML = items.map(item => `
            <div class="picker-item" onclick="useQuickPick('${item.name.replace(/'/g, "\\'")}', '${item.id}', '${item.type}', '${item.questId || ''}')">
                <div class="picker-item-icon">${item.icon}</div>
                <div class="picker-item-info">
                    <div class="picker-item-name">${item.name}</div>
                    <div class="picker-item-type">${item.typeLabel}</div>
                </div>
            </div>
        `).join('');
    }

    pickerOverlay?.classList.remove('hidden');
    pickerModal?.classList.remove('hidden');
    pickerModal.classList.add('active'); // Ensure slide up
}

function closeTaskPicker() {
    document.getElementById('taskPickerOverlay')?.classList.add('hidden');
    document.getElementById('taskPickerModal')?.classList.add('hidden');
    document.getElementById('taskPickerModal')?.classList.remove('active');
}

function useQuickPick(name, id, type, questId) {
    const inputs = document.querySelectorAll('.slot-name');
    const targetInput = inputs[currentTargetSlot];

    if (targetInput) {
        targetInput.value = name;
        targetInput.dataset.sourceName = name;
        targetInput.dataset.sourceId = id;
        targetInput.dataset.sourceType = type;
        if (questId) targetInput.dataset.sourceQuestId = questId;

        targetInput.focus();
        targetInput.style.backgroundColor = 'var(--bg-secondary)';
        setTimeout(() => targetInput.style.backgroundColor = '', 500);
    }

    closeTaskPicker();
}

function addNewPlannerSlot() {
    const container = document.getElementById('dailyPlannerSlots');
    if (!container) return;

    const slotCount = container.querySelectorAll('.daily-slot').length;
    const newSlot = document.createElement('div');
    newSlot.className = 'daily-slot';
    newSlot.dataset.slot = 'extra';
    newSlot.innerHTML = `
        <div class="slot-header">⚔️ Slot Extra ${slotCount - 3}</div>
        <div class="slot-input-wrapper">
            <input type="text" class="slot-name" placeholder="Es: Nuova impresa..." style="flex:1;">
            <button class="pick-task-btn" onclick="openTaskPicker(${slotCount})" title="Scegli dalle Missioni/Campagne">💥</button>
        </div>
        <div class="slot-options">
            <div class="star-selector" data-stars="1">
                <span class="star" data-value="1">⭐</span>
                <span class="star dim" data-value="2">⭐</span>
                <span class="star dim" data-value="3">⭐</span>
                <span class="star dim" data-value="4">⭐</span>
                <span class="star dim" data-value="5">⭐</span>
            </div>
            <select class="slot-stat">
                ${state.stats.map(stat => `<option value="${stat.id}">${stat.icon} ${stat.name}</option>`).join('')}
            </select>
        </div>
    `;

    container.appendChild(newSlot);

    // Initialize stars for the new slot
    const selector = newSlot.querySelector('.star-selector');
    selector.querySelectorAll('.star').forEach(star => {
        star.style.cursor = 'pointer';
        star.style.pointerEvents = 'auto';
        star.addEventListener('click', function (e) {
            e.stopPropagation();
            const value = parseInt(this.dataset.value);
            selector.dataset.stars = value;
            updateStarDisplay(selector, value);
        });
    });
}

function updateStarDisplay(selector, activeCount) {
    selector.querySelectorAll('.star').forEach(star => {
        const val = parseInt(star.dataset.value);
        star.classList.toggle('dim', val > activeCount);
    });
}

function closeDailyPlanner() {
    document.getElementById('dailyPlannerModal')?.classList.add('hidden');
    document.getElementById('dailyPlannerOverlay')?.classList.add('hidden');

    // Mark as shown today
    state.dailyPlan.lastPlanDate = getGameDateString();
    saveState();
}

function saveDailyPlan() {
    const slots = document.querySelectorAll('.daily-slot');
    const today = getGameDateString();
    let createdCount = 0;

    const slotIcons = {
        action: '🎯',
        bonus: '⚡',
        movement: '🚶',
        reaction: '🛡️'
    };

    slots.forEach((slot, index) => {
        const input = slot.querySelector('.slot-name');
        const name = input?.value.trim();
        if (!name) return; // Skip empty slots

        const slotType = slot.dataset.slot;
        const stars = parseInt(slot.querySelector('.star-selector')?.dataset.stars) || 3;
        const statId = slot.querySelector('.slot-stat')?.value || 'int';
        const icon = slotIcons[slotType] || '⚔️';

        const sourceId = input.dataset.sourceId;
        const sourceType = input.dataset.sourceType;
        const sourceQuestId = input.dataset.sourceQuestId;
        const sourceName = input.dataset.sourceName;

        // Verify that the user haven't changed the text manually after quick-pick
        const isLinked = sourceId && sourceType && (name === sourceName);

        // If it's an existing OneShot, we don't create a new one, we just mark it as fromDailyPlan
        if (isLinked && sourceType === 'oneshot') {
            const existingOs = state.oneshots.find(o => o.id === sourceId);
            if (existingOs) {
                existingOs.fromDailyPlan = true;
                existingOs.dailyPlanDate = today;
                // Maybe give it the stars from the planner?
                existingOs.stars = stars;
                existingOs.primaryStatId = statId;
                return;
            }
        }

        // Create One Shot with daily plan flag
        const oneshot = {
            id: 'dp-' + Date.now() + '-' + index,
            name: `${icon} ${name} `,
            stars: stars,
            primaryStatId: statId,
            secondaryStatId: null,
            dueDate: null,
            completed: false,
            locked: false,
            fromDailyPlan: true,
            dailyPlanDate: today,
            sourceTaskId: isLinked ? sourceId : null,
            sourceTaskType: isLinked ? sourceType : null,
            sourceQuestId: isLinked ? sourceQuestId : null
        };

        state.oneshots.unshift(oneshot);
        createdCount++;
    });

    // Mark as shown today
    state.dailyPlan.lastPlanDate = today;
    saveState();
    renderOneshots();
    closeDailyPlanner();

    if (createdCount > 0) {
    }
}

function rollD10AndSave() {
    const diceResultDiv = document.getElementById('diceRollResult');
    const d10Dice = document.getElementById('d10Dice');
    const diceBonus = document.getElementById('diceBonus');
    const rollBtn = document.getElementById('rollDiceBtn');

    // Check if any slots are filled
    const slots = document.querySelectorAll('.daily-slot');
    let hasContent = false;
    slots.forEach(slot => {
        if (slot.querySelector('.slot-name')?.value.trim()) hasContent = true;
    });

    if (!hasContent) {
        // No tasks entered, just close
        closeDailyPlanner();
        return;
    }

    // Show dice area and hide button
    diceResultDiv?.classList.remove('hidden');
    playSound('dice');
    if (rollBtn) rollBtn.style.display = 'none';

    // Animate dice rolling - cycle through numbers
    let rollCount = 0;
    const maxRolls = 15;
    const rollInterval = setInterval(() => {
        d10Dice.textContent = Math.floor(Math.random() * 10) + 1;
        d10Dice.classList.add('rolling');
        rollCount++;

        if (rollCount >= maxRolls) {
            clearInterval(rollInterval);

            // Final roll result
            const finalRoll = Math.floor(Math.random() * 10) + 1;
            d10Dice.textContent = finalRoll;
            d10Dice.classList.remove('rolling');

            // Calculate bonus: 1-10 -> 10%-100% (so multiplier is 1.1 to 2.0)
            const bonusPercent = finalRoll * 10;
            diceBonus.textContent = `+ ${bonusPercent}% XP Bonus! 🎉`;

            // Haptic feedback
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

            // Save after 1.5 seconds
            setTimeout(() => {
                saveDailyPlanWithBonus(finalRoll);
            }, 1500);
        }
    }, 100);
}

function saveDailyPlanWithBonus(d10Roll) {
    const slots = document.querySelectorAll('.daily-slot');
    const today = getGameDateString();
    let createdCount = 0;

    const slotIcons = {
        action: '🎯',
        bonus: '⚡',
        movement: '🚶',
        reaction: '🛡️'
    };

    slots.forEach(slot => {
        const name = slot.querySelector('.slot-name')?.value.trim();
        if (!name) return;

        const slotType = slot.dataset.slot;
        const stars = parseInt(slot.querySelector('.star-selector')?.dataset.stars) || 3;
        const statId = slot.querySelector('.slot-stat')?.value || 'int';

        const oneshot = {
            id: 'dp-' + Date.now() + '-' + slotType,
            name: `${slotIcons[slotType]} ${name} `,
            stars: stars,
            primaryStatId: statId,
            secondaryStatId: null,
            dueDate: null,
            completed: false,
            locked: false,
            fromDailyPlan: true,
            dailyPlanDate: today,
            d10Roll: d10Roll  // Store the dice roll for bonus calculation
        };

        state.oneshots.unshift(oneshot);
        createdCount++;
    });

    state.dailyPlan.lastPlanDate = today;
    saveState();
    renderOneshots();
    closeDailyPlanner();

    // Reset dice UI
    document.getElementById('diceRollResult')?.classList.add('hidden');
    const rollBtn = document.getElementById('rollDiceBtn');
    if (rollBtn) rollBtn.style.display = '';

}

// ============================================
// WEEKLY RECAP
// ============================================

function checkWeeklyRecap() {
    // Check if disabled in settings
    if (state.settings.enableWeeklyRecap === false) return;

    // Safety check
    if (isAnyModalOpen()) return;

    const currentWeek = getWeekIdentifier(getGameDateString());

    // Initialization check: determine if this is a first run or migration
    if (!state.lastRecapWeek) {
        // If it's a new installation, we assume we shouldn't show a recap immediately.
        // We set the current week as "seen" so it will trigger next week.
        state.lastRecapWeek = currentWeek;
        saveState();
        return;
    }

    // Only show if we are in a NEW week compared to the last recap
    if (state.lastRecapWeek === currentWeek) return;

    // Show recap
    showWeeklyRecap();
}

function showWeeklyRecap() {
    const recap = calculateWeeklyRecap();

    const weekLabel = document.getElementById('recapWeekLabel');
    if (weekLabel) {
        // Use the end date from calculations or derive it
        // The recap object doesn't carry dates currently, but we know it's "Last Week"
        // Let's rely on what calculateWeeklyRecap used implicitly or recalc dates for label

        // Improve label logic: show range of *previous* week
        const today = getGameDateObj();
        let targetEndDate = new Date(today);
        const currentWeekId = getWeekIdentifier(getGameDateString());

        // Seek back to finding previous week's end
        let lookback = 0;
        while (getWeekIdentifier(formatISO(targetEndDate)) === currentWeekId && lookback < 10) {
            targetEndDate.setDate(targetEndDate.getDate() - 1);
            lookback++;
        }

        const weekStart = new Date(targetEndDate);
        weekStart.setDate(targetEndDate.getDate() - 6);

        weekLabel.textContent = `${weekStart.getDate()}/${weekStart.getMonth() + 1} - ${targetEndDate.getDate()}/${targetEndDate.getMonth() + 1}`;
    }

    const cardsEl = document.getElementById('recapCards');
    if (cardsEl) {
        cardsEl.innerHTML = `
            <div class="recap-card" >
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

    // Calculate and save recap to history
    const weekId = getWeekIdentifier(getGameDateString());
    const recap = calculateWeeklyRecap();

    // Get week label
    const today = getGameDateObj();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 6);
    const weekLabel = `${weekStart.getDate()}/${weekStart.getMonth() + 1} - ${today.getDate()}/${today.getMonth() + 1}`;

    // Check if this week already exists in history
    if (!state.recapHistory) state.recapHistory = [];
    const existingIndex = state.recapHistory.findIndex(r => r.weekId === weekId);

    const recapEntry = {
        weekId: weekId,
        weekLabel: weekLabel,
        totalXp: recap.totalXp,
        topStatName: recap.topStat?.name || '-',
        topStatIcon: recap.topStat?.icon || '🏆',
        bestHabitName: recap.bestHabit?.name || '-',
        pomodoroCount: recap.pomodoroCount,
        savedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
        state.recapHistory[existingIndex] = recapEntry;
    } else {
        state.recapHistory.unshift(recapEntry);
        // Keep only last 12 weeks (3 months)
        if (state.recapHistory.length > 12) {
            state.recapHistory = state.recapHistory.slice(0, 12);
        }
    }

    // Mark as shown for this week
    state.lastRecapWeek = weekId;
    saveState();
}

function calculateWeeklyRecap() {
    // Determine the relevant review period (Previous Week)
    const today = getGameDateObj();
    const currentWeekId = getWeekIdentifier(getGameDateString());
    let targetEndDate = new Date(today);

    // If we are calculating recap, we usually mean for the *previous* week relative to now.
    // Shift back until we leave the current week ID.
    let lookback = 0;
    while (getWeekIdentifier(formatISO(targetEndDate)) === currentWeekId && lookback < 14) {
        targetEndDate.setDate(targetEndDate.getDate() - 1);
        lookback++;
    }

    const weekDates = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(targetEndDate);
        d.setDate(targetEndDate.getDate() - i);
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

// Expose Daily Planner functions
window.showDailyPlanner = showDailyPlanner;
window.closeDailyPlanner = closeDailyPlanner;
window.saveDailyPlan = saveDailyPlan;
window.rollD10AndSave = rollD10AndSave;

// Expose Weekly Recap functions
window.closeWeeklyRecap = closeWeeklyRecap;
window.showWeeklyRecap = showWeeklyRecap;

// Recap History Feature
function showRecapHistory() {
    const modal = document.getElementById('recapHistoryModal');
    const overlay = document.getElementById('recapHistoryOverlay');
    const list = document.getElementById('recapHistoryList');

    if (!modal || !overlay || !list) return;

    // Auto-rebuild if no recaps exist
    if (!state.recapHistory || state.recapHistory.length === 0) {
        rebuildRecapHistory();
    }

    if (!state.recapHistory || state.recapHistory.length === 0) {
        list.innerHTML = '<div style="text-align:center; color:var(--text-muted); padding:20px;">Nessun recap salvato ancora. I recap vengono salvati quando chiudi la finestra del Recap Settimanale.</div>';
    } else {
        list.innerHTML = state.recapHistory.map(r => `
            <div class="recap-history-item">
                <div class="recap-history-week">📅 ${r.weekLabel}</div>
                <div class="recap-history-stats">
                    <span>⚡ ${r.totalXp} XP</span>
                    <span>${r.topStatIcon} ${r.topStatName}</span>
                    <span>✅ ${r.bestHabitName}</span>
                    <span>🍅 ${r.pomodoroCount}</span>
                </div>
            </div>
        `).join('');
    }

    modal.classList.remove('hidden');
    overlay.classList.remove('hidden');
}

function closeRecapHistory() {
    document.getElementById('recapHistoryModal')?.classList.add('hidden');
    document.getElementById('recapHistoryOverlay')?.classList.add('hidden');
}

// Rebuild recap history from xpLog data for past weeks
function rebuildRecapHistory() {
    if (!state.xpLog || state.xpLog.length === 0) {
        return 0;
    }

    // Get all unique dates from xpLog
    const allDates = [...new Set(state.xpLog.map(e => e.date))].sort();
    if (allDates.length === 0) return 0;

    // Group dates by week
    const weekGroups = {};
    allDates.forEach(dateStr => {
        const weekId = getWeekIdentifier(dateStr);
        if (!weekGroups[weekId]) weekGroups[weekId] = [];
        weekGroups[weekId].push(dateStr);
    });

    // Current week should not be included (it's not complete yet)
    const currentWeekId = getWeekIdentifier(getGameDateString());
    delete weekGroups[currentWeekId];

    if (!state.recapHistory) state.recapHistory = [];
    let addedCount = 0;

    // Process each week
    Object.entries(weekGroups).forEach(([weekId, dates]) => {
        // Skip if already in history
        if (state.recapHistory.find(r => r.weekId === weekId)) return;

        // Calculate recap for this week
        const weekDates = dates;

        // Total XP this week
        const weekXpEntries = state.xpLog.filter(entry => weekDates.includes(entry.date) && entry.amount > 0);
        const totalXp = weekXpEntries.reduce((sum, e) => sum + e.amount, 0);

        // Skip weeks with 0 XP
        if (totalXp === 0) return;

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
                const log = state.completionLog[date];
                if (Array.isArray(log) && log.includes(habit.id)) count++;
            });
            habitCompletions[habit.id] = count;
        });
        const bestHabitId = Object.entries(habitCompletions).sort((a, b) => b[1] - a[1])[0]?.[0];
        const bestHabit = state.habits.find(h => h.id === bestHabitId);

        // Pomodoro count
        const pomodoroCount = weekXpEntries.filter(e => e.sourceName?.includes('Pomodoro')).length;

        // Create week label from actual dates
        const sortedDates = weekDates.sort();
        const startDate = new Date(sortedDates[0]);
        const endDate = new Date(sortedDates[sortedDates.length - 1]);
        const weekLabel = `${startDate.getDate()}/${startDate.getMonth() + 1} - ${endDate.getDate()}/${endDate.getMonth() + 1}`;

        const recapEntry = {
            weekId: weekId,
            weekLabel: weekLabel,
            totalXp: totalXp,
            topStatName: topStat?.name || '-',
            topStatIcon: topStat?.icon || '🏆',
            bestHabitName: bestHabit?.name || '-',
            pomodoroCount: pomodoroCount,
            savedAt: new Date().toISOString(),
            reconstructed: true // Flag to indicate this was rebuilt
        };

        state.recapHistory.push(recapEntry);
        addedCount++;
    });

    // Sort by weekId (most recent first)
    state.recapHistory.sort((a, b) => b.weekId.localeCompare(a.weekId));

    // Keep only last 12 weeks
    if (state.recapHistory.length > 12) {
        state.recapHistory = state.recapHistory.slice(0, 12);
    }

    if (addedCount > 0) {
        saveState();
    }

    return addedCount;
}

window.showRecapHistory = showRecapHistory;
window.closeRecapHistory = closeRecapHistory;
window.rebuildRecapHistory = rebuildRecapHistory;

// Medal Detail Popup
function showMedalDetail(medalId) {
    const medal = state.player.monthlyChallenge?.medals.find(m => m.id === medalId);
    if (!medal) return;

    const modal = document.getElementById('medalDetailModal');
    const overlay = document.getElementById('medalDetailOverlay');
    if (!modal || !overlay) return;

    // Build top tasks HTML
    let topTasksHtml = '';
    if (medal.topTasks && medal.topTasks.length > 0) {
        topTasksHtml = medal.topTasks.map(t => `
            <div class="medal-task-item">
                <span class="medal-task-type">${t.type === 'quest' ? '🏆' : '💥'}</span>
                <span class="medal-task-name">${t.name}</span>
                <span class="medal-task-stars">${'⭐'.repeat(t.stars)}</span>
            </div>
        `).join('');
    } else {
        topTasksHtml = '<div style="text-align:center; color:var(--text-muted); padding:10px;">Nessun dato disponibile per questa medaglia.</div>';
    }

    modal.innerHTML = `
        <div class="medal-detail-header">
            <div class="medal-detail-golden-circle">
                <span class="medal-detail-icon">${medal.icon}</span>
            </div>
            <h2 class="medal-detail-title">${medal.name}</h2>
            <p class="medal-detail-sub">Ottenuta il ${medal.earnedDate}</p>
        </div>
        <div class="medal-detail-stats">
            <div class="medal-stat-card">
                <div class="medal-stat-value">${medal.topStatIcon || '🏆'}</div>
                <div class="medal-stat-label">Stat Dominante</div>
                <div class="medal-stat-name">${medal.topStatName || 'Varie'}</div>
            </div>
            <div class="medal-stat-card">
                <div class="medal-stat-value">${medal.totalCompleted || 0}</div>
                <div class="medal-stat-label">Task Completati</div>
            </div>
        </div>
        <div class="medal-detail-section">
            <h3>🌟 Top Imprese</h3>
            <div class="medal-tasks-list">
                ${topTasksHtml}
            </div>
        </div>
        <button class="recap-close-btn" onclick="closeMedalDetail()">Chiudi</button>
    `;

    modal.classList.remove('hidden');
    overlay.classList.remove('hidden');
}

function closeMedalDetail() {
    document.getElementById('medalDetailModal')?.classList.add('hidden');
    document.getElementById('medalDetailOverlay')?.classList.add('hidden');
}



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

// ============================================
// SOUND MANAGER (Web Audio API)
// ============================================
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playTone(freq, type, duration, startTime = 0) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime + startTime);

    gain.gain.setValueAtTime(0.1, audioCtx.currentTime + startTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + startTime + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(audioCtx.currentTime + startTime);
    osc.stop(audioCtx.currentTime + startTime + duration);
}

function playSuccessSound() {
    playTone(880, 'sine', 0.1, 0);       // A5
    playTone(1108, 'sine', 0.3, 0.1);    // C#6
}

function playStreakSound() {
    playTone(523.25, 'triangle', 0.1, 0);   // C5
    playTone(659.25, 'triangle', 0.1, 0.1); // E5
    playTone(783.99, 'triangle', 0.1, 0.2); // G5
    playTone(1046.50, 'triangle', 0.4, 0.3); // C6
}

function playDiceSound() {
    // Simulate rattling
    for (let i = 0; i < 5; i++) {
        playTone(200 + Math.random() * 100, 'square', 0.05, i * 0.05);
    }
    // Final thud
    playTone(150, 'square', 0.2, 0.3);
}

function playToxicSound() {
    playTone(100, 'sawtooth', 0.1, 0);
    playTone(80, 'sawtooth', 0.2, 0.1);
}

function playSound(type) {
    if (state.settings.soundEnabled === false) return;

    try {
        initAudio(); // Lazy init
        switch (type) {
            case 'success': playSuccessSound(); break;
            case 'streak': playStreakSound(); break;
            case 'dice': playDiceSound(); break;
            case 'toxic': playToxicSound(); break;
        }
    } catch (e) {
        console.warn('Audio failed:', e);
    }
}



// ============================================
// ARCHIVE FEATURE
// ============================================

function openArchive() {
    // LOCK: Only accessible if at least one medal has been won
    if (!state.player.monthlyChallenge || state.player.monthlyChallenge.medals.length === 0) {
        showSealedAlert();
        return;
    }
    // No need to close settings section, the modal will overlay it
    const modal = document.getElementById('archiveModal');
    const list = document.getElementById('archiveList');

    // Correct class is 'active', not 'visible'
    modal.classList.add('active');

    // Filter completed tasks
    const completedOneshots = state.oneshots.filter(o => o.completed).map(o => ({
        ...o,
        type: 'oneshot',
        date: o.completedAt || new Date().toISOString() // Fallback if missing
    }));

    const completedQuests = state.quests.filter(q => q.completed).map(q => ({
        ...q,
        type: 'quest',
        date: q.completedAt || new Date().toISOString()
    }));

    // Merge and sort by date descending
    const allItems = [...completedOneshots, ...completedQuests].sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
    });

    if (allItems.length === 0) {
        list.innerHTML = `
            <div class="archive-empty">
                <div class="archive-empty-icon">📜</div>
                <div>Nessuna impresa negli annali... ancora!</div>
            </div>
        `;
        return;
    }

    list.innerHTML = allItems.map(item => {
        const isQuest = item.type === 'quest';
        const icon = isQuest ? '🎯' : '💥';

        let dateStr = 'Data sconosciuta';
        try {
            dateStr = new Date(item.date).toLocaleDateString('it-IT', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        } catch (e) { }

        const stars = item.stars || 1;
        // Recalculate basic XP (approximate since we don't store exact gained XP)
        const xp = isQuest ? calculateXp(stars) * 2 : calculateXp(stars);

        return `
            <div class="archive-item ${item.type}">
                <div class="archive-icon">${icon}</div>
                <div class="archive-content">
                    <div class="archive-title">${item.name}</div>
                    <div class="archive-meta">
                        <span class="archive-date">Concluso il ${dateStr}</span>
                        <span class="archive-xp">+${xp} XP</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function closeArchive() {
    const modal = document.getElementById('archiveModal');
    modal.classList.remove('active');

    // Since settings is a section (page), closing the overlay simply reveals it again.
    // No need to call navigation functions.
}


// ============================================
// IMMERSIVE EFFECTS (PARTICLES & CELEBRATIONS)
// ============================================

let particleReqId = null;
let particles = [];
let currentResizeHandler = null; // Store resize handler for cleanup

function initImmersiveEffects() {
    const canvas = document.getElementById('bgCanvas');
    if (!canvas) return;

    // Start effect based on current theme
    if (state.settings && state.settings.theme) {
        // Delay slightly to ensure layout is done
        setTimeout(() => updateImmersiveBackground(state.settings.theme), 100);
    }
}

function updateImmersiveBackground(theme) {
    const canvas = document.getElementById('bgCanvas');
    if (!canvas) return;

    const animEnabled = state.settings.animatedBackground !== false;

    if (!animEnabled) {
        canvas.style.opacity = '0';
        setTimeout(() => stopParticles(), 500); // Shorter fade out
        return;
    }

    // Stop previous first
    stopParticles();

    canvas.style.opacity = '1';

    // Slight delay to allow canvas to be clear
    if (theme === 'pirate') {
        startOceanBubbles(canvas);
    } else if (theme === 'fantasy') {
        startFireflies(canvas);
    } else if (theme === 'futuristic') {
        startStars(canvas);
    } else if (theme === 'dnd') {
        startEmbers(canvas);
    } else {
        // Default or Standard: No particles or maybe subtle dust?
        // Let's stop for now to save battery
        canvas.style.opacity = '0';
    }
}

function stopParticles() {
    if (particleReqId) {
        cancelAnimationFrame(particleReqId);
        particleReqId = null;
    }

    if (currentResizeHandler) {
        window.removeEventListener('resize', currentResizeHandler);
        currentResizeHandler = null;
    }

    particles = [];

    // Clear canvas
    const canvas = document.getElementById('bgCanvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}

// Helper to set up canvas
function setupCanvas(canvas) {
    const resize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    };
    currentResizeHandler = resize;
    window.addEventListener('resize', resize);
    resize();
    return canvas.getContext('2d');
}

function startFireflies(canvas) {
    const ctx = setupCanvas(canvas);

    for (let i = 0; i < 40; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r: Math.random() * 2 + 0.5,
            dx: (Math.random() - 0.5) * 0.5,
            dy: (Math.random() - 0.5) * 0.5,
            alpha: Math.random(),
            pulse: Math.random() * 0.02 + 0.005
        });
    }

    function animate() {
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Check Mode
        const isLight = document.body.getAttribute('data-mode') === 'light' ||
            (!document.body.getAttribute('data-mode') && document.documentElement.getAttribute('data-mode') === 'light');

        particles.forEach(p => {
            p.x += p.dx;
            p.y += p.dy;
            p.alpha += p.pulse;

            if (p.alpha > 0.8 || p.alpha < 0.1) p.pulse *= -1;

            // Wrap around
            if (p.x < 0) p.x = canvas.width;
            if (p.x > canvas.width) p.x = 0;
            if (p.y < 0) p.y = canvas.height;
            if (p.y > canvas.height) p.y = 0;

            const alpha = Math.max(0, Math.min(1, p.alpha));

            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);

            if (isLight) {
                // Darker gold/orange for visibility on white
                ctx.fillStyle = '#D4AF37';
                ctx.shadowBlur = 2;
                ctx.shadowColor = 'rgba(212, 175, 55, 0.5)';
            } else {
                // Bright gold for dark mode
                ctx.fillStyle = '#FFD700';
                ctx.shadowBlur = 0;
            }

            ctx.fill();
        });

        ctx.shadowBlur = 0; // Reset
        ctx.globalAlpha = 1; // Reset
        particleReqId = requestAnimationFrame(animate);
    }
    animate();
}

function startStars(canvas) {
    const ctx = setupCanvas(canvas);

    // Layers: 0 = background (slow, small), 1 = foreground (twinkling)
    for (let i = 0; i < 80; i++) {
        const isFore = Math.random() < 0.4; // 40% foreground
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: isFore ? Math.random() * 2 + 1 : Math.random() * 1.5,
            speed: isFore ? 0 : Math.random() * 0.2 + 0.05,
            alpha: Math.random(),
            twinkleSpeed: isFore ? Math.random() * 0.04 + 0.01 : 0,
            layer: isFore ? 1 : 0
        });
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach(p => {
            if (p.layer === 0) {
                // Background star moving slowly
                p.y += p.speed;
                if (p.y > canvas.height) { p.y = 0; p.x = Math.random() * canvas.width; }
                ctx.fillStyle = `rgba(0, 229, 255, ${p.alpha * 0.4})`; // Cyan tint
            } else {
                // Foreground twinkling
                p.alpha += p.twinkleSpeed;
                if (p.alpha > 1 || p.alpha < 0.2) p.twinkleSpeed *= -1;
                ctx.shadowBlur = 4;
                ctx.shadowColor = "#00e5ff";
                ctx.fillStyle = `rgba(200, 255, 255, ${p.alpha})`; // Bright Cyan
            }
            ctx.beginPath();
            ctx.fillRect(p.x, p.y, p.size, p.size);
            ctx.shadowBlur = 0;
        });
        particleReqId = requestAnimationFrame(animate);
    }
    animate();
}

function startOceanBubbles(canvas) {
    const ctx = setupCanvas(canvas);

    for (let i = 0; i < 50; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: canvas.height + Math.random() * 200,
            r: Math.random() * 3 + 1,
            speed: Math.random() * 0.5 + 0.2,
            oscillation: Math.random() * 2,
            phase: Math.random() * Math.PI * 2
        });
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Dark Mode check: Prefer data-mode on body or html
        const isDark = document.body.getAttribute('data-mode') === 'dark' ||
            document.documentElement.getAttribute('data-mode') === 'dark';

        // Determine colors - ensure reliable visibility
        if (isDark) {
            // Dark Mode: Cyan/White bubbles
            ctx.strokeStyle = 'rgba(200, 240, 255, 0.6)';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        } else {
            // Light Mode: Darker Blue/Grey bubbles
            ctx.strokeStyle = 'rgba(0, 60, 100, 0.4)';
            ctx.fillStyle = 'rgba(0, 60, 100, 0.05)';
        }

        ctx.lineWidth = 1.5;

        particles.forEach(p => {
            p.y -= p.speed;
            p.x += Math.sin(p.y * 0.01 + p.phase) * 0.5;

            // Reset
            if (p.y < -10) {
                p.y = canvas.height + 10;
                p.x = Math.random() * canvas.width;
            }

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fill();
        });

        particleReqId = requestAnimationFrame(animate);
    }
    animate();
}

function startEmbers(canvas) {
    const ctx = setupCanvas(canvas);

    for (let i = 0; i < 60; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: canvas.height + Math.random() * 50,
            size: Math.random() < 0.8 ? Math.random() * 1.5 + 0.5 : Math.random() * 2 + 1,
            speed: Math.random() * 2.5 + 1.0,
            wiggle: Math.random() * 0.3,
            alpha: Math.random(),
            decay: Math.random() * 0.01 + 0.005
        });
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach(p => {
            p.y -= p.speed;
            p.x += Math.sin(Date.now() * 0.005 + p.y * 0.02) * p.wiggle;
            p.alpha -= p.decay;

            if (p.alpha <= 0) {
                p.y = canvas.height + 10;
                p.x = Math.random() * canvas.width;
                p.alpha = 1;
                p.speed = Math.random() * 2.5 + 1.0;
            }

            // Fire colors: Red -> Orange -> Yellow
            const r = 255;
            const g = Math.floor(p.alpha * 100); // 0-100

            // D&D Dark/Light check for visibility
            const isDark = document.body.getAttribute('data-mode') === 'dark';
            const baseAlpha = isDark ? p.alpha : p.alpha * 0.6; // Slightly more transparent in light mode

            ctx.fillStyle = `rgba(${r}, ${g}, 0, ${baseAlpha})`;

            if (isDark) {
                ctx.shadowBlur = 4;
                ctx.shadowColor = `rgba(255, 50, 0, ${baseAlpha})`;
            }

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        });
        particleReqId = requestAnimationFrame(animate);
    }
    animate();
}

// Celebration System
function playCelebration(type, rewardText = null) {
    // Check if confetti is loaded
    if (typeof confetti === 'undefined') return;

    if (type === 'major') {
        // Quest Completion: Major Explosion
        const colors = state.settings.theme === 'pirate'
            ? ['#FFD700', '#C5A059', '#ffffff'] // Gold
            : ['#7c3aed', '#a78bfa', '#ffffff']; // Default Violet

        confetti({
            particleCount: 150,
            spread: 100,
            origin: { y: 0.6 },
            colors: colors,
            disableForReducedMotion: true
        });
    } else if (type === 'minor') {
        // OneShot Completion
        confetti({
            particleCount: 60,
            spread: 60,
            origin: { y: 0.7 },
            gravity: 1.2,
            decay: 0.9,
            scalar: 0.8,
            ticks: 100
        });
    }

    if (rewardText) {
        showRewardPopup(rewardText);
    }
}

// ============================================
// PWA INSTALL INSTRUCTIONS
// ============================================

function openInstallModal() {
    document.getElementById('installModal')?.classList.remove('hidden');
    document.getElementById('installOverlay')?.classList.remove('hidden');
    // Ensure scrolling is disabled on body if needed, but overlay covers it.
}

function closeInstallModal() {
    document.getElementById('installModal')?.classList.add('hidden');
    document.getElementById('installOverlay')?.classList.add('hidden');
}

function toggleDontShowInstall(checked) {
    if (checked) {
        localStorage.setItem('pwa_instructions_seen', 'true');
    } else {
        localStorage.removeItem('pwa_instructions_seen');
    }
}

function toggleSettingsGroup(header) {
    const group = header.parentElement;
    const content = group.querySelector('.settings-content');
    const isCollapsing = !group.classList.contains('collapsed');

    if (isCollapsing) {
        // Collapsing: Hide overflow immediately so animation works
        if (content) content.style.overflow = 'hidden';
        // Small delay to ensure style applies before class change triggers transition
        requestAnimationFrame(() => {
            group.classList.add('collapsed');
        });
    } else {
        // Expanding: Remove class to start animation
        group.classList.remove('collapsed');
        // Wait for transition (0.4s) then allow overflow for dropdowns
        setTimeout(() => {
            if (!group.classList.contains('collapsed') && content) {
                content.style.overflow = 'visible';
            }
        }, 400);
    }

    // Save state
    saveSettingsGroupsState();
}

function saveSettingsGroupsState() {
    const groups = document.querySelectorAll('.settings-group');
    const state = {};
    groups.forEach(group => {
        if (group.id) {
            state[group.id] = group.classList.contains('collapsed') ? 'collapsed' : 'open';
        }
    });
    localStorage.setItem('settings_groups_state', JSON.stringify(state));
}

function loadSettingsGroupsState() {
    try {
        const saved = localStorage.getItem('settings_groups_state');
        if (saved) {
            const state = JSON.parse(saved);
            for (const [id, value] of Object.entries(state)) {
                const group = document.getElementById(id);
                if (group) {
                    const content = group.querySelector('.settings-content');
                    if (value === 'open') {
                        group.classList.remove('collapsed');
                        if (content) content.style.overflow = 'visible';
                    } else {
                        group.classList.add('collapsed');
                        if (content) content.style.overflow = 'hidden';
                    }
                }
            }
        } else {
            // Default: All open
            const groups = document.querySelectorAll('.settings-group');
            groups.forEach(group => {
                group.classList.remove('collapsed');
                const content = group.querySelector('.settings-content');
                if (content) content.style.overflow = 'visible';
            });
        }
    } catch (e) {
        console.error('Error loading settings groups:', e);
    }
}



// Expose PWA functions
window.openInstallModal = openInstallModal;
window.closeInstallModal = closeInstallModal;
window.toggleDontShowInstall = toggleDontShowInstall;
window.toggleSettingsGroup = toggleSettingsGroup;
window.loadSettingsGroupsState = loadSettingsGroupsState;

function openTaskDetail(type, id) {
    const list = type === 'habit' ? state.habits : state.oneshots;
    const task = list.find(t => t.id === id);
    if (!task) return;

    // Reuse Quest Popup Structure but simplify content
    const overlay = document.getElementById('questDetailModal');
    const title = document.getElementById('questDetailTitle');
    const meta = document.getElementById('questDetailMeta');
    const desc = document.getElementById('questDetailDesc');
    const subtasks = document.getElementById('questDetailSubtasks');
    const subTitle = document.getElementById('questSubtasksTitle'); // Added this line

    if (overlay && title && meta && desc) {
        title.textContent = task.name;
        desc.className = 'task-detail-desc'; // Use the new CSS class
        desc.style.textAlign = 'center'; // Center text for tasks
        desc.textContent = task.description ? task.description : (type === 'habit' ? "Nessuna descrizione per questa abitudine." : "Nessuna descrizione per questo one-shot.");

        // Hide subtasks container
        if (subtasks) subtasks.style.display = 'none'; // Explicitly hide the container
        if (subTitle) subTitle.style.display = 'none'; // Explicitly hide the title

        // Calculate XP Reward
        const baseXP = task.stars * 10;
        const xpText = `+${baseXP} XP`;

        let metaHtml = `
            <div class="task-detail-stats" style="width:100%">
                <div class="detail-stat-box">
                    <div class="detail-stat-label">Ricompensa</div>
                    <div class="detail-stat-value">${xpText}</div>
                </div>
                ${type === 'habit' ? `
                <div class="detail-stat-box">
                    <div class="detail-stat-label">Streak</div>
                    <div class="detail-stat-value">🔥 ${task.streak || 0}</div>
                </div>
                ` : `
                <div class="detail-stat-box">
                    <div class="detail-stat-label">Stato</div>
                    <div class="detail-stat-value">${task.completed ? '✅ Fatto' : '⏳ In corso'}</div>
                </div>
                `}
            </div>
            <div style="font-size: 13px; color: var(--text-muted); text-align: center; width: 100%; margin-top: 5px;">
                ${'⭐'.repeat(task.stars)} • <span style="color:var(--accent-primary); text-transform:uppercase; font-weight:600;">${type === 'habit' ? 'Abitudine' : 'Missione'}</span>
            </div>
        `;

        meta.innerHTML = metaHtml;
        meta.style.flexDirection = 'column';

        overlay.classList.add('active');
    }
}

function showMomentumTooltip(event, xp) {
    const tooltip = document.getElementById('tooltip');
    if (!tooltip) return;

    tooltip.textContent = `+${xp} XP`;

    // Get the bar's position to place tooltip directly above it
    const rect = event.target.closest('.momentum-bar-container').getBoundingClientRect();
    const x = rect.left + rect.width / 2; // Center of the bar
    const y = rect.top - 10; // 10px above the bar container top

    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y}px`;
    // CSS handles translateX(-50%) for centering

    tooltip.classList.add('visible');

    // Hide after 1 second
    if (window.tooltipTimeout) clearTimeout(window.tooltipTimeout);
    window.tooltipTimeout = setTimeout(() => {
        tooltip.classList.remove('visible');
    }, 1000);

    // Also hide on any touch/click anywhere
    const hideTooltip = () => {
        tooltip.classList.remove('visible');
        if (window.tooltipTimeout) clearTimeout(window.tooltipTimeout);
        document.removeEventListener('touchstart', hideTooltip);
        document.removeEventListener('click', hideTooltip);
    };
    // Use setTimeout to avoid immediate trigger from the same click
    setTimeout(() => {
        document.addEventListener('touchstart', hideTooltip, { once: true });
        document.addEventListener('click', hideTooltip, { once: true });
    }, 50);
}
window.showMomentumTooltip = showMomentumTooltip;

// ============================================
// INITIAL SETUP WIZARD
// ============================================

function checkFirstTimeSetup() {
    const hasCompletedSetup = localStorage.getItem('questlife_setup_completed');
    if (!hasCompletedSetup) {
        showSetupWizard();
    }
}

function showSetupWizard() {
    const overlay = document.getElementById('setupWizardOverlay');
    const modal = document.getElementById('setupWizardModal');
    const list = document.getElementById('setupStatsList');

    if (!overlay || !modal || !list) return;

    // Render stats list for editing levels
    list.innerHTML = state.stats.map(stat => `
        <div class="settings-row" style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px; padding: 8px; background: var(--bg-primary); border-radius: 8px;">
            <span style="font-size: 24px;">${stat.icon}</span>
            <div style="flex: 1;">
                <div style="font-weight: 500;">${stat.name}</div>
                <div style="font-size: 11px; color: var(--text-muted);">${stat.type === 'attribute' ? 'Attributo' : 'Abilità'}</div>
            </div>
            <div style="display: flex; align-items: center; gap: 5px;">
                <label style="font-size: 12px; color: var(--text-secondary);">Lv.</label>
                <input type="number" class="setup-level-input" data-stat-id="${stat.id}" 
                    value="${stat.level}" min="1" max="50" 
                    style="width: 50px; text-align: center; padding: 6px; border-radius: 8px; border: 1px solid var(--glass-border); background: var(--bg-secondary); color: var(--text-primary); font-size: 14px; font-weight: 500;">
            </div>
        </div>
    `).join('');

    overlay.classList.remove('hidden');
    modal.classList.remove('hidden');
}

function completeSetupWizard() {
    // Read and save all level values
    const inputs = document.querySelectorAll('.setup-level-input');
    inputs.forEach(input => {
        const statId = input.dataset.statId;
        const level = parseInt(input.value) || 1;
        const stat = state.stats.find(s => s.id === statId);
        if (stat) {
            stat.level = Math.max(1, Math.min(50, level));
        }
    });

    // Mark setup as completed
    localStorage.setItem('questlife_setup_completed', 'true');

    // Save and close
    saveState();
    closeSetupWizard();
    renderAll();
}

function closeSetupWizard() {
    document.getElementById('setupWizardOverlay')?.classList.add('hidden');
    document.getElementById('setupWizardModal')?.classList.add('hidden');
}

// Expose to global
window.checkFirstTimeSetup = checkFirstTimeSetup;
window.completeSetupWizard = completeSetupWizard;
window.closeSetupWizard = closeSetupWizard;

// ============================================
// NUTRITION GAMIFICATION
// ============================================

function checkNutritionRewards() {
    // Check if there is a history entry that needs processing
    if (!state.health || !state.health.history || state.health.history.length === 0) return;

    // We process the latest entry if it hasn't been processed yet
    // The history entry is added by state.js checkHealthRollover when day changes
    const lastEntry = state.health.history[state.health.history.length - 1];

    if (lastEntry.processed) return;

    console.log("[NutritionRewards] Processing entry:", lastEntry);

    // Calculate results
    const results = calculateNutritionResults(lastEntry);

    // Apply rewards/penalties
    applyNutritionRewards(results, lastEntry.date);

    // Mark as processed
    lastEntry.processed = true;
    saveState();
}

function calculateNutritionResults(entry) {
    const goal = state.health.calories.goal || 1600;
    const waterGoal = state.health.water?.goal || 2;
    const proteinGoal = state.health.proteins?.goal || 0; // If 0, ignore or default

    const consumed = entry.consumed || 0;
    const burned = entry.burned || 0;
    const netCalories = consumed - burned;

    const diff = netCalories - goal;
    const percentDiff = diff / goal; // +0.10 means 10% over

    // Logic:
    // Good: +/- 10% of goal
    // Bad (Excess): > +15% of goal ("Sgarro")
    // Undereat: < -15% (Warning, no reward?)

    const results = {
        calories: 'neutral',
        water: false,
        protein: false,
        xpRewards: [],
        penalties: []
    };

    // 1. Calories
    if (percentDiff > 0.15) {
        results.calories = 'excess';
        // Penalty logic
    } else if (percentDiff < -0.15) {
        results.calories = 'deficit';
    } else {
        results.calories = 'perfect';
    }

    // 2. Water
    if (entry.water >= waterGoal) {
        results.water = true;
    }

    // 3. Protein
    if (proteinGoal > 0 && entry.proteins >= proteinGoal) {
        results.protein = true;
    }

    return results;
}

function applyNutritionRewards(results, dateStr) {
    const rewards = [];
    const penalties = [];

    // Calorie Rewards/Penalties
    // USER FEEDBACK: Progression slower than regression.
    // Success: +30 XP (Harder to level up)
    // Sgarro: -60 XP (Easier to lose level)

    if (results.calories === 'perfect') {
        const xp = 30;
        addXp(xp, 'str', 'Nutrizione Equilibrata');
        rewards.push({ label: 'Calorie Obiettivo', xp: xp, stat: 'Forza' });
    } else if (results.calories === 'excess') {
        const xp = 60;
        addXp(-xp, 'con', 'Eccesso Calorico');
        penalties.push({ label: 'Sgarro Calorico', xp: xp, stat: 'Costituzione' });
    }

    // Water
    if (results.water) {
        const xp = 15; // Reduced from 20
        addXp(xp, 'con', 'Idratazione');
        rewards.push({ label: 'Obiettivo Acqua', xp: xp, stat: 'Costituzione' });
    }

    // Protein
    if (results.protein) {
        const xp = 20; // Reduced from 25
        addXp(xp, 'str', 'Proteine');
        rewards.push({ label: 'Obiettivo Proteine', xp: xp, stat: 'Forza' });
    }

    // Show Popup/Notification
    if (rewards.length > 0 || penalties.length > 0) {
        showNutritionRecapPopup(dateStr, results, rewards, penalties);
    }
}

function showNutritionRecapPopup(date, results, rewards, penalties) {
    // Check if modal exists
    let modal = document.getElementById('nutritionRecapModal');
    let overlay = document.getElementById('nutritionRecapOverlay');

    if (!modal) {
        // Create it dynamically if missing
        createNutritionRecapModal();
        modal = document.getElementById('nutritionRecapModal');
        overlay = document.getElementById('nutritionRecapOverlay');
    }

    const content = document.getElementById('nutritionRecapContent');

    let html = `<div style="text-align:center; margin-bottom:15px; font-size:13px; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px;">Report del ${date}</div>`;

    if (rewards.length > 0) {
        html += `<h4 style="color:var(--success); margin:15px 0 10px 0; display:flex; align-items:center; gap:8px; font-size:16px;">
            <span>🎉</span> Successi
        </h4>`;
        rewards.forEach(r => {
            html += `<div class="recap-item" style="display:flex; justify-content:space-between; align-items:center; padding:12px; margin-bottom:8px; background:var(--bg-secondary); border-radius:12px; border:1px solid var(--glass-border);">
                <span style="font-weight:600; font-size:14px; color:var(--text-secondary);">${r.label}</span>
                <div style="text-align:right;">
                    <div style="font-weight:800; color:var(--success); font-size:15px;">+${r.xp} XP</div>
                    <div style="font-size:10px; color:var(--text-muted); text-transform:uppercase;">${r.stat}</div>
                </div>
            </div>`;
        });
    }

    if (penalties.length > 0) {
        html += `<h4 style="color:var(--danger); margin:15px 0 10px 0; display:flex; align-items:center; gap:8px; font-size:16px;">
            <span>⚠️</span> Penalità
        </h4>`;
        penalties.forEach(p => {
            html += `<div class="recap-item" style="display:flex; justify-content:space-between; align-items:center; padding:12px; margin-bottom:8px; background:rgba(239, 68, 68, 0.05); border-radius:12px; border:1px solid rgba(239, 68, 68, 0.2);">
                <span style="font-weight:600; font-size:14px; color:var(--text-secondary);">${p.label}</span>
                <div style="text-align:right;">
                    <div style="font-weight:800; color:var(--danger); font-size:15px;">-${p.xp} XP</div>
                    <div style="font-size:10px; color:var(--text-muted); text-transform:uppercase;">${p.stat}</div>
                </div>
            </div>`;
        });
    }

    if (rewards.length === 0 && penalties.length === 0) {
        html += `<p style="text-align:center; color:var(--text-muted); padding:20px;">Nessun impatto significativo sulle statistiche.</p>`;
    }

    content.innerHTML = html;

    overlay.classList.remove('hidden');
    // Force reflow/activation class
    setTimeout(() => {
        overlay.classList.add('active');
    }, 10);
}

function createNutritionRecapModal() {
    const overlay = document.createElement('div');
    overlay.id = 'nutritionRecapOverlay';
    overlay.className = 'modal-overlay hidden';

    // Clicking overlay closes it
    overlay.onclick = (e) => {
        if (e.target === overlay) closeNutritionRecap();
    };

    const modal = document.createElement('div');
    modal.id = 'nutritionRecapModal';
    modal.className = 'modal'; // Uses standard centered modal class
    // Modal click stops propagation so it doesn't close overlay
    modal.onclick = (e) => e.stopPropagation();

    modal.innerHTML = `
        <div class="modal-header">
            <h3>🍎 Report Nutrizione</h3>
        </div>
        <div class="modal-body" id="nutritionRecapContent"></div>
        <div class="modal-actions" style="margin-top:20px;">
            <button class="btn-primary" onclick="closeNutritionRecap()" style="width:100%; padding:14px; font-size:16px;">OK</button>
        </div>
    `;

    // Append modal INSIDE overlay for flex centering
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
}

function closeNutritionRecap() {
    const overlay = document.getElementById('nutritionRecapOverlay');
    if (overlay) {
        overlay.classList.remove('active');
        setTimeout(() => {
            overlay.classList.add('hidden');
        }, 300); // Wait for transition
    }
}

window.checkNutritionRewards = checkNutritionRewards;
window.closeNutritionRecap = closeNutritionRecap;

// ============================================
// HEALTH DASHBOARD LOGIC
// ============================================

function renderHealthDashboard() {
    const health = state.health;
    if (!health) return;

    // Calorie Calculation
    const remaining = health.calories.goal - health.calories.consumed + health.calories.burned;

    // Update labels
    const caloriesRemainingEl = document.getElementById('caloriesRemaining');
    if (caloriesRemainingEl) {
        caloriesRemainingEl.textContent = Math.round(Math.max(0, remaining));
        caloriesRemainingEl.style.color = remaining < 0 ? '#f43f5e' : 'var(--text-primary)';
    }

    const goalEl = document.getElementById('calorieGoal');
    if (goalEl) goalEl.textContent = state.health.calories.goal;

    const consumedEl = document.getElementById('caloriesConsumed');
    if (consumedEl) consumedEl.textContent = Math.round(state.health.calories.consumed);

    const burnedEl = document.getElementById('caloriesBurned');
    if (burnedEl) burnedEl.textContent = Math.round(state.health.calories.burned);

    const proteinsEl = document.getElementById('proteinsConsumed');
    if (proteinsEl) proteinsEl.textContent = Math.round(state.health.proteins?.consumed || 0);

    // Update Calorie Ring
    updateCalorieRing(health.calories.consumed, health.calories.goal, health.calories.burned);

    // Update Steps
    const stepsCurrentEl = document.getElementById('stepsCurrent');
    if (stepsCurrentEl) stepsCurrentEl.textContent = health.steps.current.toLocaleString();

    const stepsGoalEl = document.getElementById('stepsGoalText');
    if (stepsGoalEl) stepsGoalEl.textContent = health.steps.goal.toLocaleString();

    const stepsBar = document.getElementById('stepsProgressBar');
    if (stepsBar) {
        const percent = Math.min(100, (health.steps.current / health.steps.goal) * 100);
        stepsBar.style.width = `${percent}%`;
    }

    // Update Proteins (New v3.1.29)
    if (!state.health.proteins) state.health.proteins = { goal: 0, consumed: 0 };
    // Auto-calculate goal if not manually set
    if (!state.health.proteins.goal || state.health.proteins.goal === 0) {
        state.health.proteins.goal = Math.round((state.health.weight?.current || 75) * 1.5);
    }

    const protCurrentValueEl = document.getElementById('proteinsCurrentValue');
    if (protCurrentValueEl) protCurrentValueEl.textContent = Math.round(state.health.proteins.consumed);

    const protGoalTextEl = document.getElementById('proteinsGoalText');
    if (protGoalTextEl) protGoalTextEl.textContent = state.health.proteins.goal;

    const protBar = document.getElementById('proteinsProgressBar');
    if (protBar) {
        const percent = Math.min(100, (state.health.proteins.consumed / state.health.proteins.goal) * 100);
        protBar.style.width = `${percent}%`;
    }

    // Update Weight
    const weightCurrentEl = document.getElementById('weightCurrent');
    if (weightCurrentEl) weightCurrentEl.textContent = health.weight.current;

    const weightBar = document.getElementById('weightProgressBar');
    if (weightBar) {
        const diff = Math.abs(health.weight.current - health.weight.target);
        const percent = Math.max(10, Math.min(100, 100 - (diff / 20) * 100));
        weightBar.style.width = `${percent}%`;
    }

    // Render Water (Modified v3.1.30 for unified look)
    if (!state.health.water) state.health.water = { goal: 2, consumed: 0 };

    const waterCurrentEl = document.getElementById('waterCurrentValue');
    if (waterCurrentEl) waterCurrentEl.textContent = state.health.water.consumed.toFixed(2).replace('.00', '');

    const waterGoalEl = document.getElementById('waterGoalText');
    if (waterGoalEl) waterGoalEl.textContent = state.health.water.goal;

    const waterBar = document.getElementById('waterProgressBar');
    if (waterBar) {
        const percent = Math.min(100, (state.health.water.consumed / state.health.water.goal) * 100);
        waterBar.style.width = `${percent}%`;
    }

    // v3.0.0 Weight Details
    renderWeightMiniDetails();
}

function updateCalorieRing(consumed, goal, burned) {
    const ring = document.getElementById('calorieRing');
    if (!ring) return;

    const radius = 60; // Fixed radius for SVG
    const circumference = 2 * Math.PI * radius;

    const net = Math.max(0, consumed - burned);
    let percent = (net / goal);

    if (percent > 1) percent = 1;

    const offset = circumference - (percent * circumference);
    ring.style.strokeDasharray = `${circumference} ${circumference}`;
    ring.style.strokeDashoffset = offset;

    if (consumed - burned > goal) {
        ring.style.stroke = '#f43f5e';
    } else {
        ring.style.stroke = 'var(--accent-primary)';
    }
}

let currentHealthEditType = null;

function openHealthInput(type) {
    currentHealthEditType = type;
    const overlay = document.getElementById('healthInputOverlay');
    const title = document.getElementById('healthModalTitle');
    const content = document.getElementById('healthInputContent');

    if (!overlay || !title || !content) return;

    let html = '';

    // Manual intake
    if (type === 'consumed_manual') {
        currentMealTab = determineMealTabFromTime(); // Auto-select meal based on time
        title.textContent = `Aggiungi (${getDayPartName(currentMealTab)})`;
        html = `
            <div class="meals-input-group" style="flex-direction:column; gap:12px;">
                <input type="text" id="manualMealName" placeholder="Nome (es. Cena Fuori)">
                <input type="number" id="manualMealCalories" placeholder="Calorie Totali">
                <input type="number" id="manualMealProteins" placeholder="Proteine (opzionale)">
                
                <div style="display:flex; gap:10px; margin-top:5px;">
                    <button class="btn-secondary" onclick="closeHealthInput()" style="flex:1;">Annulla</button>
                    <button class="btn-primary" onclick="confirmManualIntake()" style="flex:2;">Aggiungi</button>
                </div>
            </div>
        `;
    } else if (type === 'goal') {
        title.textContent = 'Obiettivo Calorie';
        html = `
            <div class="meals-input-group" style="flex-direction:column; gap:12px;">
                <label style="font-size:12px; color:var(--text-muted); text-align:center;">Nuovo Obiettivo Giornaliero:</label>
                <input type="number" id="newCalorieGoal" value="${state.health.calories.goal}" style="text-align:center; font-size:20px; font-weight:bold;">
                
                <div style="display:flex; gap:10px; margin-top:5px;">
                    <button class="btn-secondary" onclick="closeHealthInput()" style="flex:1;">Annulla</button>
                    <button class="btn-primary" onclick="confirmNewGoal('calories')" style="flex:2;">Salva</button>
                </div>
            </div>
        `;
    } else if (type === 'burned') {
        title.textContent = 'Log Esercizio/Attività';
        const db = state.health.exerciseDatabase || [];
        html = `
            <div class="preset-title" style="font-size:12px; font-weight:bold; margin-bottom:10px; color:var(--text-muted);">Esercizi Salvati:</div>
            <div class="preset-grid" style="margin-bottom:20px; max-height:150px; overflow-y:auto; display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                ${db.map(ex => `
                    <button class="quick-pick-item" onclick="openExerciseLogModal('${ex.id}')" style="font-size:11px; padding:10px;">
                        <span>${ex.emoji}</span> ${ex.name}
                        <div style="font-size:9px; opacity:0.7;">${ex.baseCalories}c / ${ex.baseCount}u</div>
                    </button>
                `).join('')}
            </div>
            <button class="btn-secondary" onclick="openExerciseManager()" style="width:100%; margin-bottom:15px; font-size:11px; padding:12px;">📂 Database Esercizi</button>
            <div class="divider-text" style="text-align:center; position:relative; margin-bottom:15px; font-size:10px; color:var(--text-muted);">OPPURE MANUALE</div>
            <div class="meals-input-group" style="gap:10px;">
                <input type="number" id="manualBurnedCalories" placeholder="Calorie bruciate" style="flex:2;">
                <button class="btn-primary" onclick="confirmManualBurn()" style="flex:1;">🔥 Log</button>
            </div>
            <button class="btn-text" onclick="closeHealthInput()" style="width:100%; margin-top:15px; color:var(--text-muted); border:none; background:none; cursor:pointer;">Annulla</button>
        `;
    } else if (type === 'steps') {
        title.textContent = 'Aggiorna Passi';
        html = `
            <div class="health-input-group" style="flex-direction:column; gap:15px;">
                <div class="health-input-row">
                    <label style="font-size:12px; color:var(--text-muted);">Passi Totali Oggi:</label>
                    <input type="number" id="healthInValue" value="${state.health.steps.current}" onfocus="this.select()" style="font-size:18px; text-align:center;">
                </div>
                <div class="health-input-row">
                    <label style="font-size:12px; color:var(--text-muted);">Obiettivo:</label>
                    <input type="number" id="healthInGoal" value="${state.health.steps.goal}" onfocus="this.select()" style="font-size:18px; text-align:center;">
                </div>
                <div style="display:flex; gap:10px; margin-top:10px;">
                    <button class="btn-secondary" onclick="closeHealthInput()" style="flex:1;">Annulla</button>
                    <button class="btn-primary" onclick="submitHealthInput()" style="flex:2;">Aggiorna</button>
                </div>
            </div>
        `;
    } else if (type === 'protein_goal') {
        title.textContent = 'Obiettivo Proteine';
        const currentGoal = state.health.proteins?.goal || Math.round(state.health.weight.current * 1.5);
        html = `
            <div class="meals-input-group" style="flex-direction:column; gap:12px;">
                <label style="font-size:12px; color:var(--text-muted); text-align:center;">Obiettivo Giornaliero (g):</label>
                <input type="number" id="newProteinGoal" value="${currentGoal}" style="text-align:center; font-size:20px; font-weight:bold;">
                <p style="font-size:10px; color:var(--text-muted); text-align:center;">Consigliato: 1.5g per kg di peso (${Math.round(state.health.weight.current * 1.5)}g)</p>
                
                <div style="display:flex; gap:10px; margin-top:5px;">
                    <button class="btn-secondary" onclick="closeHealthInput()" style="flex:1;">Annulla</button>
                    <button class="btn-primary" onclick="confirmNewGoal('proteins')" style="flex:2;">Salva</button>
                </div>
            </div>
        `;
    } else if (type === 'water_goal') {
        title.textContent = 'Obiettivo Acqua';
        const weight = state.health.weight?.current || 75;
        const recommended = (weight * 0.032).toFixed(1);
        const currentGoal = state.health.water?.goal || recommended;

        html = `
            <div class="meals-input-group" style="flex-direction:column; gap:12px;">
                <label style="font-size:12px; color:var(--text-muted); text-align:center;">Obiettivo Giornaliero (Litri):</label>
                <input type="number" id="newWaterGoal" step="0.25" value="${currentGoal}" style="text-align:center; font-size:20px; font-weight:bold;">
                <p style="font-size:10px; color:var(--text-muted); text-align:center;">Consigliato: ${recommended}L al giorno (32ml per kg)</p>
                
                <div style="display:flex; gap:10px; margin-top:5px;">
                    <button class="btn-secondary" onclick="closeHealthInput()" style="flex:1;">Annulla</button>
                    <button class="btn-primary" onclick="confirmNewGoal('water')" style="flex:2;">Salva</button>
                </div>
            </div>
        `;
    } else if (type === 'weight') {
        title.textContent = 'Aggiorna Peso';
        html = `
            <div class="health-input-group" style="flex-direction:column; gap:15px;">
                <div class="health-input-row">
                    <label style="font-size:12px; color:var(--text-muted);">Peso Attuale (kg):</label>
                    <input type="number" id="healthInValue" value="${state.health.weight.current}" step="0.1" onfocus="this.select()" style="font-size:18px; text-align:center;">
                </div>
                <div style="display:flex; gap:10px; margin-top:10px;">
                    <button class="btn-secondary" onclick="closeHealthInput()" style="flex:1;">Annulla</button>
                    <button class="btn-primary" onclick="submitHealthInput()" style="flex:2;">Aggiorna</button>
                </div>
            </div>
        `;
    }

    content.innerHTML = html;
    overlay.classList.remove('hidden');
    overlay.classList.add('active');
}

function closeHealthInput() {
    const overlay = document.getElementById('healthInputOverlay');
    if (overlay) {
        overlay.classList.add('hidden');
        overlay.classList.remove('active');
    }
}

function submitHealthInput() {
    const valInput = document.getElementById('healthInValue');
    const goalInput = document.getElementById('healthInGoal');
    const value = parseFloat(valInput ? valInput.value : 0) || 0;
    const goal = parseFloat(goalInput ? goalInput.value : 0) || 0;

    switch (currentHealthEditType) {
        case 'steps':
            state.health.steps.current = value;
            if (goal > 0) state.health.steps.goal = goal;
            break;
        case 'weight':
            state.health.weight.current = value;
            if (goal > 0) state.health.weight.target = goal;
            break;
    }

    saveState();
    closeHealthInput();
    renderHealthDashboard();
}

// Handlers for manual entry and goal from Nutrition section
function confirmManualIntake() {
    const name = document.getElementById('manualMealName').value || 'Pasto Manuale';
    const cals = parseFloat(document.getElementById('manualMealCalories').value);
    const prots = parseFloat(document.getElementById('manualMealProteins').value) || 0;
    if (isNaN(cals)) return alert("Inserisci calorie!");
    const newMeal = { id: generateId('meal'), name, calories: cals, proteins: prots };
    if (!state.health.meals[currentMealTab]) state.health.meals[currentMealTab] = [];
    state.health.meals[currentMealTab].push(newMeal);
    state.health.calories.consumed += cals;
    if (!state.health.proteins) state.health.proteins = { goal: 100, consumed: 0 };
    state.health.proteins.consumed += prots;
    saveState();
    closeHealthInput();
    renderMealsList();
    renderHealthDashboard();
    showXpToast('Pasto aggiunto!', '🍴');
}

function confirmNewGoal(type) {
    if (type === 'calories') {
        const goal = parseFloat(document.getElementById('newCalorieGoal').value);
        if (!isNaN(goal)) state.health.calories.goal = goal;
    } else if (type === 'proteins') {
        const goal = parseFloat(document.getElementById('newProteinGoal').value);
        if (!isNaN(goal)) {
            if (!state.health.proteins) state.health.proteins = { goal: 0, consumed: 0 };
            state.health.proteins.goal = goal;
        }
    } else if (type === 'water') {
        const val = document.getElementById('newWaterGoal').value;
        const goal = parseFloat(val.replace(',', '.')); // Handle comma locale
        if (!isNaN(goal)) {
            if (!state.health.water) state.health.water = { goal: 2, consumed: 0 };
            state.health.water.goal = goal;
        }
    }
    saveState();
    closeHealthInput();
    renderHealthDashboard();
}

function confirmManualBurn() {
    const cals = parseFloat(document.getElementById('manualBurnedCalories').value);
    if (!isNaN(cals)) {
        state.health.calories.burned += cals;
        saveState();
        closeHealthInput();
        renderHealthDashboard();
        showXpToast(`- ${cals} Calorie!`, '🔥');
    }
}

// EXERCISE MANAGER LOGIC
function openExerciseManager() {
    document.getElementById('exerciseManagerModal').classList.add('active');
    populateExStatSelector();
    renderExerciseDatabaseList();
}

function closeExerciseManager() {
    document.getElementById('exerciseManagerModal').classList.remove('active');
}

function populateExStatSelector() {
    const el = document.getElementById('exStat');
    if (!el) return;
    let options = '<option value="">Nessuno Stat</option>';
    state.stats.forEach(attr => {
        options += `<option value="${attr.id}">${attr.icon} ${attr.name}</option>`;
    });
    el.innerHTML = options;
}

function saveExerciseToDatabase() {
    const emoji = document.getElementById('exEmoji').value || '🏋️';
    const name = document.getElementById('exName').value;
    const baseCount = parseFloat(document.getElementById('exBaseCount').value);
    const baseCalories = parseFloat(document.getElementById('exBaseCalories').value);
    const xpReward = parseInt(document.getElementById('exXpReward').value) || 0;
    const statId = document.getElementById('exStat').value;
    if (!name || isNaN(baseCount) || isNaN(baseCalories)) return alert("Inserisci nome, unità e calorie!");
    const newEx = { id: generateId('ex'), emoji, name, baseCount, baseCalories, xpReward, statId };
    if (!state.health.exerciseDatabase) state.health.exerciseDatabase = [];
    state.health.exerciseDatabase.push(newEx);
    saveState();
    renderExerciseDatabaseList();
    document.getElementById('exName').value = '';
    document.getElementById('exBaseCount').value = '';
    document.getElementById('exBaseCalories').value = '';
}

function renderExerciseDatabaseList() {
    const listEl = document.getElementById('exerciseDatabaseList');
    if (!listEl) return;
    const db = state.health.exerciseDatabase || [];
    listEl.innerHTML = db.map(ex => `
        <div class="meal-item" style="display:flex; justify-content:space-between; align-items:center; padding:5px; font-size:12px;">
            <span>${ex.emoji} ${ex.name} <small>(${ex.baseCalories}cal/${ex.baseCount}u)</small></span>
            <button onclick="deleteExerciseFromDatabase('${ex.id}')" style="background:none; border:none; color:#ef4444; cursor:pointer;">✕</button>
        </div>
        `).join('');
}

function deleteExerciseFromDatabase(id) {
    state.health.exerciseDatabase = state.health.exerciseDatabase.filter(e => e.id !== id);
    saveState();
    renderExerciseDatabaseList();
}

function openExerciseLogModal(id) {
    const ex = state.health.exerciseDatabase.find(e => e.id === id);
    if (!ex) return;
    const count = prompt(`Quante unità di "${ex.name}" hai fatto ? (Base: ${ex.baseCount})`, ex.baseCount || 10);
    if (count === null) return;
    const countVal = parseFloat(count);
    if (isNaN(countVal)) return;
    const ratio = countVal / (ex.baseCount || 1);
    const calories = ex.baseCalories * ratio;
    const xp = Math.round(ex.xpReward * ratio);
    state.health.calories.burned += calories;
    if (ex.statId && xp > 0) addXp(xp, ex.statId, `Esercizio: ${ex.name} `);
    saveState();
    closeHealthInput();
    renderHealthDashboard();
    showXpToast(`Loggato! + ${Math.round(calories)} Cal`, '💪');
}

// ============================================
// GLOBAL EXPOSITIONS (for HTML onclick handlers)
// ============================================

// Utility Exports
window.exportData = function () {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `quest-life-backup-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
};
window.EsportData = window.exportData;

window.fixData = function () {
    ensureUniqueIds(state.habits, 'habit');
    ensureUniqueIds(state.oneshots, 'oneshot');
    ensureUniqueIds(state.quests, 'quest');
    saveState();
    alert('Dati riparati e salvati correttamente.');
};

window.updateApp = function () {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(function (registrations) {
            for (let registration of registrations) {
                registration.update();
            }
        });
    }
    location.reload(true);
};
window.UpdateApp = window.updateApp;

window.switchSection = switchSection;
window.switchActivityTab = switchActivityTab;

// Modals & Popups
window.openModal = openModal;
window.closeModal = closeModal;
window.submitModal = submitModal;
window.updatePlayerName = updatePlayerName;
window.toggleProfilePopup = toggleProfilePopup;
window.toggleStreakPopup = toggleStreakPopup;
window.openAvatarModal = openAvatarModal;
window.closeAvatarModal = closeAvatarModal;
window.switchAvatarTab = switchAvatarTab;
window.selectEmoji = selectEmoji;
window.handleAvatarUpload = handleAvatarUpload;
// Toast Logic (Global)
window.showXpToast = showXpToast;
window.openMottoEdit = openMottoEdit;
window.closeMottoEdit = closeMottoEdit;
window.saveMotto = saveMotto;

// Health & Nutrition
window.openHealthInput = openHealthInput;
window.closeHealthInput = closeHealthInput;
window.submitHealthInput = submitHealthInput;
window.addWater = addWater;
window.addPresetHealth = addPresetHealth;
window.switchNutritionTab = switchNutritionTab;
window.toggleNutritionItem = toggleNutritionItem;
window.showHealthHistory = showHealthHistory;
window.openMealsModal = openMealsModal;
window.closeMealsModal = closeMealsModal;
window.switchMealTab = switchMealTab;
window.deleteMeal = deleteMeal;
window.openWeightModal = openWeightModal;
window.closeWeightModal = closeWeightModal;
window.saveWeightDetails = saveWeightDetails;
window.setWaterGoal = setWaterGoal;

// Food Manager
window.openFoodManager = openFoodManager;
window.closeFoodManager = closeFoodManager;
window.saveFoodToDatabase = saveFoodToDatabase;
window.deleteFoodFromDatabase = deleteFoodFromDatabase;
window.openGramInput = openGramInput;
window.closeGramInput = closeGramInput;
window.confirmGramInput = confirmGramInput;

// Exercise Manager
window.openExerciseManager = openExerciseManager;
window.closeExerciseManager = closeExerciseManager;
window.saveExerciseToDatabase = saveExerciseToDatabase;
window.deleteExerciseFromDatabase = deleteExerciseFromDatabase;
window.openExerciseLogModal = openExerciseLogModal;

// Tasks & Progress
window.toggleHabit = toggleHabit;
window.completeOneshot = completeOneshot;
window.completeQuest = completeQuest;
window.toggleSubquest = toggleSubquest;
window.handleTaskClick = handleTaskClick;
window.editTask = editTask;
window.confirmDelete = confirmDelete;
window.closeDeleteConfirm = closeDeleteConfirm;
window.showStreakCelebration = showStreakCelebration;
window.useQuickPick = useQuickPick;
window.addNewPlannerSlot = addNewPlannerSlot;
window.closeStreakCelebration = closeStreakCelebration;
window.hideStatTooltip = hideStatTooltip;
window.showMomentumTooltip = showMomentumTooltip;

// Detail Modals
window.openQuestDetail = openQuestDetail;
window.closeQuestDetailModal = closeQuestDetailModal;
window.openStatDetail = openStatDetail;
window.closeStatDetailModal = closeStatDetailModal;
window.editCurrentQuestInModal = editCurrentQuestInModal;
window.deleteCurrentQuestInModal = deleteCurrentQuestInModal;

// Stats & Accordions
window.toggleAccordion = toggleAccordion;
window.toggleStatVisibility = toggleStatVisibility;
window.toggleStatVisibilityFromPopup = toggleStatVisibilityFromPopup;

// Inventory & Toxic Items (Legacy exports removed)
window.renderHealthDashboard = renderHealthDashboard;
window.openMealsModal = openMealsModal;
window.closeMealsModal = closeMealsModal;
window.switchMealTab = switchMealTab;
window.openWeightModal = openWeightModal;
window.closeWeightModal = closeWeightModal;
window.saveWeightDetails = saveWeightDetails;
window.setWaterGoal = setWaterGoal;
// window.deleteToxicItem removed
// window.useToxicItemDirect removed
// window.startLongPress removed
// window.stopLongPress removed

// Tools & Utilities
window.openPomodoroTimer = openPomodoroTimer;
window.closePomodoroTimer = closePomodoroTimer;
window.togglePomodoro = togglePomodoro;
window.resetPomodoro = resetPomodoro;
window.savePomodoroSettings = savePomodoroSettings;
window.showDailyPlanner = showDailyPlanner;
window.closeDailyPlanner = closeDailyPlanner;
window.rollD10AndSave = rollD10AndSave;
window.saveDailyPlan = saveDailyPlan;
window.showChallengeCatalog = showChallengeCatalog;
window.importChallenge = importChallenge;
window.closeChallengePreview = closeChallengePreview;
window.completeChallengeDayAndRefresh = completeChallengeDayAndRefresh;
window.setViewedDate = setViewedDate;
window.toggleGoalCheckbox = toggleGoalCheckbox;

// Settings & Themes
window.toggleThemeDropdown = toggleThemeDropdown;
window.toggleColorDropdown = toggleColorDropdown;
window.setTheme = setTheme;
window.setMode = setMode;
window.setPopupSetting = setPopupSetting;
window.updateSettingToggle = updateSettingToggle;
window.setWeekStart = setWeekStart;
window.toggleSettingsGroup = toggleSettingsGroup;
window.loadSettingsGroupsState = loadSettingsGroupsState;

// Data & Archive
window.openArchive = openArchive;
window.closeArchive = closeArchive;
window.showRecapHistory = showRecapHistory;
window.closeRecapHistory = closeRecapHistory;
window.rebuildRecapHistory = rebuildRecapHistory;
window.showMedalDetail = showMedalDetail;
window.closeMedalDetail = closeMedalDetail;
window.showWeeklyRecap = showWeeklyRecap;
window.closeWeeklyRecap = closeWeeklyRecap;
window.exportData = exportData;
window.importData = importData;
window.fixData = fixData;
window.resetAll = resetAll;
window.updateApp = updateApp;
window.linkDatabaseFile = linkDatabaseFile;

// Setup Wizard
window.checkFirstTimeSetup = checkFirstTimeSetup;
window.completeSetupWizard = completeSetupWizard;
window.closeSetupWizard = closeSetupWizard;

// ============================================
// HOME TABS & SOSTENTAMENTO (v2.9.0)
// ============================================

function openInventory() {
    const overlay = document.getElementById('inventoryOverlay');
    const modal = document.getElementById('inventoryModal');
    if (overlay) overlay.classList.add('active');
    if (modal) modal.classList.remove('hidden');
    renderNutritionInventory();
}
function closeInventory() {
    const overlay = document.getElementById('inventoryOverlay');
    const modal = document.getElementById('inventoryModal');
    if (overlay) overlay.classList.remove('active');
    if (modal) modal.classList.add('hidden');
}
window.openInventory = openInventory;
window.closeInventory = closeInventory;
window.openAddItemModal = openAddItemModal;
window.closeAddItemModal = closeAddItemModal;

// switchHomeTab logic removed in v3.1.12


function setWaterGoal() {
    const current = state.health.water.goal || 8;
    const newGoal = parseInt(prompt("Imposta obiettivo acqua giornaliero (bicchieri da 250ml):", current));
    if (!isNaN(newGoal) && newGoal > 0) {
        state.health.water.goal = newGoal;
        saveState();
        renderWaterTracker();
        showXpToast(`Obiettivo acqua: ${newGoal} bicchieri`, '💧');
    }
}

function addWater(amount = 0.25) {
    if (!state.health.water) state.health.water = { goal: 2, consumed: 0 };
    state.health.water.consumed = Math.max(0, state.health.water.consumed + amount);
    saveState();
    renderHealthDashboard();
    if (amount > 0) showXpToast(`+${amount}L Acqua!`, '🥛');
}

function addPresetHealth(presetId) {
    const preset = state.health.presets.find(p => p.id === presetId);
    if (preset) {
        if (preset.type === 'consumed') {
            state.health.calories.consumed += preset.calories;
        } else {
            state.health.calories.burned += preset.calories;
        }
        saveState();
        renderHealthDashboard();
        closeHealthInput();

        // Feedback visivo
        if (typeof showXpToast === 'function') {
            showXpToast(`${preset.calories > 0 ? '+' : ''}${preset.calories} Calorie`, '🍎');
        }
    }
}

function switchNutritionTab(tab) {
    currentNutritionInvTab = tab;
    document.querySelectorAll('.inv-tab').forEach(btn => {
        const isTarget = (tab === 'food' && btn.id === 'nutrition-food-btn') ||
            (tab === 'home' && btn.id === 'nutrition-home-btn');
        btn.classList.toggle('active', isTarget);
    });
    renderNutritionInventory();
}

function renderNutritionInventory() {
    const list = document.getElementById('nutritionList');
    if (!list) return;

    let items = [];
    if (currentNutritionInvTab === 'food') {
        items = state.inventory.food || [];
    } else if (currentNutritionInvTab === 'home') {
        items = state.inventory.home || [];
    }

    if (items.length === 0) {
        list.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:20px; color:var(--text-muted); font-size:12px;">Nessun elemento nella lista.</div>`;
        return;
    }

    list.innerHTML = items.map(item => {
        const isHome = currentNutritionInvTab === 'home';
        const clickAction = `toggleNutritionItem('${item.id}', '${isHome ? 'home' : 'food'}')`;
        const btnIcon = item.status === 'needed' ? '🛒' : '✅';
        const statusText = item.status === 'needed' ? 'Da comprare' : 'In dispensa';
        const displayEmoji = item.emoji || (isHome ? '🏠' : '🍎');

        return `
        <div class="stat-card nutrition-item-card swipe-item task-card"
    data-id="${item.id}"
    data-type="${currentNutritionInvTab}"
    style="padding:0; display:flex; position:relative; overflow:hidden; min-height:46px; margin-bottom:8px;">
                
                <div class="swipe-actions">
                     <div class="swipe-action edit">✏️</div>
                     <div class="swipe-action delete">🗑️</div>
                </div>

                <div class="swipe-content" style="display:flex; flex-direction:row; align-items:center; justify-content:space-between; width:100%; height:100%; background:var(--bg-card); z-index:2; padding:6px 12px; transition: transform 0.2s ease;">
                    <div style="display:flex; align-items:center; gap:12px; flex:1; overflow:hidden;">
                         <span style="font-size:18px;">${displayEmoji}</span>
                        <div style="text-align:left; overflow:hidden; white-space:nowrap; text-overflow:ellipsis;">
                            <div style="font-size:14px; font-weight:600; color:var(--text-primary); overflow:hidden; text-overflow:ellipsis;">${item.name}</div>
                            <div style="font-size:10px; color:var(--text-muted);">${statusText}</div>
                        </div>
                    </div>
                    <button class="btn-icon" onclick="${clickAction}" style="font-size:14px; background:transparent; border-radius:50%; width:32px; height:32px; flex-shrink:0; display:flex; align-items:center; justify-content:center; border:1px solid var(--glass-border); cursor:pointer; z-index:3; position:relative; margin-left:8px;">
                        ${btnIcon}
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function toggleNutritionItem(id, listKey) {
    const list = state.inventory[listKey];
    if (!list) return;
    const item = list.find(i => i.id === id);
    if (item) {
        item.status = item.status === 'needed' ? 'in_stock' : 'needed';
        saveState();
        renderNutritionInventory();
    }
}

// ADD ITEM MODAL LOGIC (v3.1.0)
let currentAddItemType = 'food';
let editingItemId = null;

function openAddItemModal(itemToEdit = null) {
    const modal = document.getElementById('addItemModal');
    const title = document.getElementById('addItemTitle');
    const nameInput = document.getElementById('newItemName');
    const emojiInput = document.getElementById('newItemEmoji');

    modal.classList.add('active');

    if (itemToEdit) {
        editingItemId = itemToEdit.id;
        title.textContent = "Modifica Oggetto";
        nameInput.value = itemToEdit.name;
        emojiInput.value = itemToEdit.emoji || '';
        // Determine type from state search to set toggle? 
        // Or assume we know the type from context? 
        // For simplicity, we respect current tab or passed item type if checking state
        const isHome = state.inventory.home.find(i => i.id === itemToEdit.id);
        setAddItemType(isHome ? 'home' : 'food');
    } else {
        editingItemId = null;
        title.textContent = "Aggiungi Oggetto";
        nameInput.value = '';
        emojiInput.value = '';
        setAddItemType(currentNutritionInvTab === 'home' ? 'home' : 'food');
    }
}

function closeAddItemModal() {
    document.getElementById('addItemModal').classList.remove('active');
    editingItemId = null;
}

function setAddItemType(type) {
    currentAddItemType = type;
    document.getElementById('type-food').classList.toggle('active', type === 'food');
    document.getElementById('type-home').classList.toggle('active', type === 'home');
}

function saveInventoryItem() {
    const name = document.getElementById('newItemName').value.trim();
    const emoji = document.getElementById('newItemEmoji').value.trim();

    if (!name) {
        alert("Inserisci un nome!");
        return;
    }

    const list = state.inventory[currentAddItemType];

    if (editingItemId) {
        // Find in original list (might have changed type, so check both or remove from old?)
        // Complex case: if type changed.
        // Simplified: check if id exists in current list. If not, maybe it was in the other list.
        // For now, assume type switch logic:

        // Remove from both lists first to handle type change
        let oldItem = state.inventory.food.find(i => i.id === editingItemId);
        if (!oldItem) {
            oldItem = state.inventory.home.find(i => i.id === editingItemId);
        }

        if (oldItem) {
            state.inventory.food = state.inventory.food.filter(i => i.id !== editingItemId);
            state.inventory.home = state.inventory.home.filter(i => i.id !== editingItemId);
        }

        // Create updated item
        const newItem = {
            id: editingItemId,
            name: name,
            emoji: emoji || null,
            status: oldItem ? oldItem.status : 'needed',
            type: currentAddItemType
        };

        // Push to the CORRECT (potentially new) list
        state.inventory[currentAddItemType].push(newItem);

    } else {
        // New Item
        state.inventory[currentAddItemType].push({
            id: generateId(currentAddItemType),
            name: name,
            emoji: emoji || null,
            status: 'needed',
            type: currentAddItemType
        });
    }

    saveState();
    renderNutritionInventory();
    closeAddItemModal();
}

window.openAddItemModal = openAddItemModal;
window.closeAddItemModal = closeAddItemModal;
window.setAddItemType = setAddItemType;
window.saveInventoryItem = saveInventoryItem;

// MEALS MODAL LOGIC
let selectedFoodForGramInput = null;

function determineMealTabFromTime() {
    const now = getGameDateObj();
    const hour = now.getHours();

    if (hour >= 5 && hour < 11) return 'breakfast';
    if (hour >= 11 && hour < 16) return 'meal'; // Combined Lunch
    if (hour >= 16 && hour < 19) return 'snack';
    return 'meal'; // Combined Dinner
}

function openMealsModal() {
    // Smart auto-select tab based on time
    currentMealTab = determineMealTabFromTime();

    // Update tab UI
    document.querySelectorAll('.meal-tab').forEach(t => {
        t.classList.toggle('active', t.id === `meal-tab-${currentMealTab}`);
    });

    document.getElementById('mealsModal').classList.add('active');
    renderMealsList();
}

function closeMealsModal() {
    document.getElementById('mealsModal').classList.remove('active');
}

function switchMealTab(tab) {
    currentMealTab = tab;
    document.querySelectorAll('.meal-tab').forEach(t => {
        t.classList.toggle('active', t.id === `meal-tab-${tab}`);
    });
    renderMealsList();
}

function renderMealsList() {
    const listEl = document.getElementById('mealsList');
    if (!listEl) return;

    // 1. Show Today's Log for this category
    const currentMeals = state.health.meals[currentMealTab] || [];
    let html = `<div style="font-size:11px; font-weight:bold; color:var(--text-muted); margin-bottom:8px; text-transform:uppercase; padding-left:5px;">${getDayPartName(currentMealTab)} di Oggi</div>`;

    if (currentMeals.length === 0) {
        html += `<div style="padding:15px; color:var(--text-muted); font-size:13px; text-align:center; background:rgba(0,0,0,0.03); border-radius:12px; margin-bottom:20px;">
            Nessun alimento inserito.
        </div>`;
    } else {
        html += `<div style="margin-bottom:20px;">`;
        currentMeals.forEach((meal, idx) => {
            html += `
        <div class="meal-item" style="display:flex; justify-content:space-between; align-items:center; padding:12px; background:var(--bg-secondary); border-radius:12px; margin-bottom:8px; border:1px solid var(--glass-border);">
                    <div>
                        <div style="font-size:14px; font-weight:500;">${meal.name}</div>
                        <div style="font-size:11px; color:var(--text-muted);">${meal.grams ? meal.grams + 'g' : 'Porzione'}</div>
                    </div>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <span style="font-weight:bold; color:var(--accent-primary); font-size:14px;">${Math.round(meal.calories)} cal</span>
                        <button onclick="deleteMeal(${idx})" style="background:none; border:none; color:var(--text-muted); cursor:pointer; padding:5px;">✕</button>
                    </div>
                </div>
        `;
        });
        html += `</div>`;
    }

    // 2. Show Database Items for this category
    html += `<div style="font-size:11px; font-weight:bold; color:var(--text-muted); margin:0 0 8px 0; text-transform:uppercase; padding-left:5px;">I Miei Alimenti</div>`;

    // Filter DB by current tab category
    const db = state.health.foodDatabase || [];
    const filteredDb = db.filter(f => f.category === currentMealTab || (!f.category && currentMealTab === 'cheat')); // Fallback for old/cheat items

    // Sort: Favorites first
    filteredDb.sort((a, b) => {
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;
        return a.name.localeCompare(b.name);
    });

    if (filteredDb.length === 0) {
        html += `<div style="text-align:center; padding:20px; color:var(--text-muted); font-size:12px;">
            Nessun alimento salvato per questa categoria.<br>
            <button onclick="openFoodManager()" style="margin-top:10px; background:var(--accent-primary); color:white; border:none; padding:8px 16px; border-radius:20px; font-size:12px;">Gestisci Alimenti</button>
         </div>`;
    } else {
        html += `<div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:8px;">`;
        filteredDb.forEach(food => {
            // Calculate per 100g or serving hint
            let subtext = `${food.baseCalories}kcal / 100g`;
            const star = food.isFavorite ? '⭐' : '';

            html += `
                <button class="quick-pick-item" onclick="selectFoodFromDb('${food.id}')" style="text-align:left; font-size:12px; padding:12px; border-radius:16px; background:var(--bg-card); border:1px solid var(--glass-border); display:flex; flex-direction:column; gap:4px; transition:transform 0.1s; position:relative;">
                    <div style="position:absolute; top:5px; right:5px; font-size:10px;">${star}</div>
                    <div style="font-size:24px; margin-bottom:4px;">${food.emoji}</div>
                    <div style="font-weight:600; font-size:13px; color:var(--text-primary);">${food.name}</div>
                    <div style="font-size:10px; color:var(--text-muted);">${subtext}</div>
                </button>
            `;
        });
        html += `</div>`;
    }

    // Link to Manager
    html += `<div style="margin-top:20px; text-align:center;">
        <button onclick="openFoodManager()" style="background:none; border:none; color:var(--accent-primary); font-size:12px; text-decoration:underline; cursor:pointer;">Gestisci Database Alimenti</button>
    </div>`;

    listEl.innerHTML = html;
}

function getDayPartName(code) {
    const names = { breakfast: 'Colazione', meal: 'Pasto', lunch: 'Pranzo', dinner: 'Cena', snack: 'Spuntino', cheat: 'Sgarro' };
    return names[code] || code;
}

// Replaces the old selectFoodFromDb which used prompt
function selectFoodFromDb(foodId) {
    if (typeof openGramInput === 'function') {
        openGramInput(foodId);
    } else {
        console.error("openGramInput is not defined");
    }
}
window.selectFoodFromDb = selectFoodFromDb;

function deleteMeal(index) {
    const meal = state.health.meals[currentMealTab][index];
    if (meal) {
        state.health.calories.consumed = Math.max(0, state.health.calories.consumed - meal.calories);
        if (meal.proteins) {
            state.health.proteins.consumed = Math.max(0, state.health.proteins.consumed - meal.proteins);
        }
        state.health.meals[currentMealTab].splice(index, 1);
        saveState();
        renderMealsList();
        renderHealthDashboard();
    }
}

// FOOD DATABASE MANAGER
// FOOD DATABASE MANAGER
function openFoodManager() {
    document.getElementById('foodManagerModal').classList.add('active');
    renderFoodDatabaseList();
}

function closeFoodManager() {
    document.getElementById('foodManagerModal').classList.remove('active');
}

function openFoodForm(editId = null) {
    document.getElementById('foodFormModal').classList.add('active');

    // Reset or Fill
    if (editId) {
        const food = state.health.foodDatabase.find(f => f.id === editId);
        if (food) {
            document.getElementById('foodEditingId').value = food.id;
            document.getElementById('foodEmoji').value = food.emoji;
            document.getElementById('foodName').value = food.name;
            document.getElementById('foodCalories').value = food.baseCalories;
            document.getElementById('foodProteins').value = food.baseProteins || '';
            document.getElementById('foodCategory').value = food.category || 'meal';
            document.getElementById('foodUnitGrams').value = food.unitGrams || '';
        }
    } else {
        document.getElementById('foodEditingId').value = '';
        document.getElementById('foodEmoji').value = '';
        document.getElementById('foodName').value = '';
        document.getElementById('foodCalories').value = '';
        document.getElementById('foodProteins').value = '';
        document.getElementById('foodCategory').value = 'meal';
        document.getElementById('foodUnitGrams').value = '';
    }
}
window.openFoodForm = openFoodForm;

function closeFoodForm() {
    document.getElementById('foodFormModal').classList.remove('active');
}
window.closeFoodForm = closeFoodForm;

// Helper: Toggle Favorite
function toggleFoodFavorite(id) {
    const food = state.health.foodDatabase.find(f => f.id === id);
    if (food) {
        food.isFavorite = !food.isFavorite;
        saveState();
        renderFoodDatabaseList();
    }
}
window.toggleFoodFavorite = toggleFoodFavorite;

// Helper to switch category (Move)
function moveFoodCategory(id, newCat) {
    const food = state.health.foodDatabase.find(f => f.id === id);
    if (food) {
        food.category = newCat;
        saveState();
        renderFoodDatabaseList();
    }
}
window.moveFoodCategory = moveFoodCategory;

function saveFoodToDatabase() {
    const emoji = document.getElementById('foodEmoji').value || '🍎';
    const name = document.getElementById('foodName').value;
    const calories = parseFloat(document.getElementById('foodCalories').value);
    const proteins = parseFloat(document.getElementById('foodProteins').value) || 0;
    const category = document.getElementById('foodCategory').value;
    const unitGrams = parseFloat(document.getElementById('foodUnitGrams').value) || 0;

    if (!name || isNaN(calories)) return alert("Inserisci almeno nome e calorie!");

    // Check availability
    if (!state.health.foodDatabase) state.health.foodDatabase = [];

    // Check if editing
    const editingId = document.getElementById('foodEditingId')?.value;

    if (editingId) {
        const idx = state.health.foodDatabase.findIndex(f => f.id === editingId);
        if (idx >= 0) {
            state.health.foodDatabase[idx] = {
                ...state.health.foodDatabase[idx],
                emoji, name, baseCalories: calories, baseProteins: proteins, category, unitGrams,
                baseGrams: 100 // Enforce 100g standard
            };
        }
    } else {
        const newFood = {
            id: generateId('fd'),
            emoji,
            name,
            baseGrams: 100, // Always per 100g now
            baseCalories: calories,
            baseProteins: proteins,
            category,
            unitGrams,
            isFavorite: false
        };
        state.health.foodDatabase.push(newFood);
    }

    saveState();
    renderFoodDatabaseList();
    closeFoodForm();
}

function renderFoodDatabaseList() {
    const listEl = document.getElementById('foodDatabaseList');
    if (!listEl) return;

    const db = state.health.foodDatabase || [];

    // Sort: Favorites first, then alphabetical
    db.sort((a, b) => {
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;
        return a.name.localeCompare(b.name);
    });

    // Categories to show
    const categories = [
        { id: 'breakfast', name: 'Colazione' },
        { id: 'meal', name: 'Pasto' },
        { id: 'snack', name: 'Spuntino' },
        { id: 'cheat', name: 'Sgarro' }
    ];

    let html = '';

    categories.forEach(cat => {
        // Filter items for this category (include lunch/dinner in 'meal')
        const items = db.filter(f => {
            if (cat.id === 'meal') return ['meal', 'lunch', 'dinner'].includes(f.category);
            return f.category === cat.id;
        });

        // Section Header
        html += `<div style="margin-top:15px; margin-bottom:5px; font-size:12px; font-weight:bold; color:var(--text-muted); text-transform:uppercase; border-bottom:1px solid var(--glass-border); padding-bottom:2px;">${cat.name}</div>`;

        if (items.length === 0) {
            html += `<div style="font-size:11px; color:var(--text-muted); padding:5px; font-style:italic;">Nessun alimento.</div>`;
        } else {
            items.forEach(food => {
                const starColor = food.isFavorite ? '#fbbf24' : 'var(--text-muted)';
                const starIcon = food.isFavorite ? '⭐' : '☆';

                html += `
                <div class="meal-item" style="display:flex; justify-content:space-between; align-items:center; padding:10px; background:var(--bg-secondary); border-radius:12px; margin-bottom:6px; border:1px solid var(--glass-border);">
                    <div style="margin-right:8px;">
                        <button onclick="toggleFoodFavorite('${food.id}')" style="background:none; border:none; cursor:pointer; font-size:16px; color:${starColor}; padding:0;">${starIcon}</button>
                    </div>
                    <div style="flex:1; cursor:pointer;" onclick="openFoodForm('${food.id}')">
                        <div style="font-weight:600; font-size:13px;">${food.emoji} ${food.name}</div>
                        <div style="font-size:10px; color:var(--text-secondary);">
                            ${food.baseCalories}kcal • ${food.baseProteins || 0}g prot ${food.unitGrams ? '• ' + food.unitGrams + 'g/pz' : ''}
                        </div>
                    </div>
                    <div style="display:flex; flex-direction:column; align-items:flex-end; gap:2px;">
                         <button onclick="deleteFoodFromDatabase('${food.id}')" style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:14px; opacity:0.7;">✕</button>
                    </div>
                </div>
                `;
            });
        }
    });

    listEl.innerHTML = html;
}

function deleteFoodFromDatabase(id) {
    if (!confirm("Sicuro di voler eliminare questo alimento?")) return;
    state.health.foodDatabase = state.health.foodDatabase.filter(e => e.id !== id);
    saveState();
    renderFoodDatabaseList();
}

// GRAM INPUT LOGIC
// selectedFoodForGramInput is already declared above
let currentGramInputType = 'grams'; // 'grams' or 'units'

function openGramInput(foodId) {
    selectedFoodForGramInput = state.health.foodDatabase.find(f => f.id === foodId);
    if (!selectedFoodForGramInput) return;

    document.getElementById('gramInputTitle').textContent = `${selectedFoodForGramInput.emoji} ${selectedFoodForGramInput.name}`;

    // Check if unit grams are defined
    const hasUnit = selectedFoodForGramInput.unitGrams && selectedFoodForGramInput.unitGrams > 0;
    const toggle = document.getElementById('gramInputTypeToggle');

    if (hasUnit) {
        toggle.style.display = 'flex';
        document.getElementById('unitWeightValue').textContent = selectedFoodForGramInput.unitGrams;
        // Default to units if available? No, stick to grams as primary to avoid confusion, user can switch.
        setGramInputType('grams');
    } else {
        toggle.style.display = 'none';
        setGramInputType('grams');
    }

    document.getElementById('enteredGrams').value = ''; // Auto-clear for fresh entry? Or default to 100? Let's clear to encourage typing.
    // actually default to 100g or 1 unit is better UX
    if (hasUnit) {
        document.getElementById('enteredGrams').value = '';
        document.getElementById('enteredGrams').placeholder = "0";
    } else {
        document.getElementById('enteredGrams').value = selectedFoodForGramInput.baseGrams || 100;
    }

    document.getElementById('gramInputModal').classList.add('active');
    setTimeout(() => document.getElementById('enteredGrams').focus(), 100); // Auto focus
    updateGramCalculation();
}

function setGramInputType(type) {
    currentGramInputType = type;
    const btnGrams = document.getElementById('gramInputType-grams');
    const btnUnits = document.getElementById('gramInputType-units');
    const input = document.getElementById('enteredGrams');
    const helper = document.getElementById('unitWeightHelper');

    if (type === 'grams') {
        btnGrams.style.background = 'var(--accent-primary)';
        btnGrams.style.color = 'white';
        btnUnits.style.background = 'transparent';
        btnUnits.style.color = 'var(--text-secondary)';
        input.placeholder = "Grammi";
        helper.style.display = 'none';
    } else {
        btnUnits.style.background = 'var(--accent-primary)';
        btnUnits.style.color = 'white';
        btnGrams.style.background = 'transparent';
        btnGrams.style.color = 'var(--text-secondary)';
        input.placeholder = "Numero Pezzi";
        helper.style.display = 'block';
    }
    updateGramCalculation();
}
window.setGramInputType = setGramInputType;

function closeGramInput() {
    document.getElementById('gramInputModal').classList.remove('active');
}

function updateGramCalculation() {
    const entered = parseFloat(document.getElementById('enteredGrams').value);
    const display = document.getElementById('gramInputCalculation');

    if (isNaN(entered) || !selectedFoodForGramInput) {
        display.textContent = '-';
        return;
    }

    let grams = entered;
    if (currentGramInputType === 'units') {
        grams = entered * (selectedFoodForGramInput.unitGrams || 0);
    }

    const ratio = grams / selectedFoodForGramInput.baseGrams;
    const cals = Math.round(selectedFoodForGramInput.baseCalories * ratio);
    const prots = Math.round(selectedFoodForGramInput.baseProteins * ratio);

    // Add grams info in display if using units
    const extraInfo = currentGramInputType === 'units' ? `(${Math.round(grams)}g) ` : '';
    display.textContent = `${extraInfo}${cals} Cal | ${prots}g Proteine`;
}

// Update calculation live
document.addEventListener('input', (e) => {
    if (e.target.id === 'enteredGrams') updateGramCalculation();
});

function confirmGramInput() {
    const entered = parseFloat(document.getElementById('enteredGrams').value);
    if (isNaN(entered) || !selectedFoodForGramInput) return;

    let grams = entered;
    let nameSuffix = `(${grams}g)`;

    if (currentGramInputType === 'units') {
        grams = entered * (selectedFoodForGramInput.unitGrams || 0);
        nameSuffix = `(${entered} pz)`;
    }

    const ratio = grams / selectedFoodForGramInput.baseGrams;
    const calories = selectedFoodForGramInput.baseCalories * ratio;
    const proteins = (selectedFoodForGramInput.baseProteins || 0) * ratio;

    const newMeal = {
        id: generateId('meal'),
        name: `${selectedFoodForGramInput.name} ${nameSuffix}`,
        calories,
        proteins
    };

    if (!state.health.meals[currentMealTab]) state.health.meals[currentMealTab] = [];
    state.health.meals[currentMealTab].push(newMeal);

    state.health.calories.consumed += calories;
    if (!state.health.proteins) state.health.proteins = { goal: 100, consumed: 0 };
    state.health.proteins.consumed += proteins;

    // XP REWARDS
    if (currentMealTab !== 'cheat') {
        const xpAmount = Math.max(1, Math.round(calories / 50));
        if (selectedFoodForGramInput.primaryStatId) {
            addXpToAttribute(selectedFoodForGramInput.primaryStatId, xpAmount);
            showXpToast(`+ ${xpAmount} XP ${selectedFoodForGramInput.primaryStatId.toUpperCase()}`, '⭐');
        }
    } else {
        // PENALTY for cheat
        const penalty = Math.max(1, Math.round(calories / 100));
        state.player.xp = Math.max(0, state.player.xp - penalty);
        showXpToast(`Sgarro! - ${penalty} XP Totali`, '👿');
    }

    saveState();
    closeGramInput();
    renderMealsList();
    renderHealthDashboard();
}

// WEIGHT MODAL LOGIC (v3.0.0)
function openWeightModal() {
    document.getElementById('weightModal').classList.add('active');

    const w = state.health.weight;
    document.getElementById('weightInputVal').value = w.current;
    document.getElementById('weightTargetInputVal').value = w.target;
    document.getElementById('leanInputVal').value = w.currentLean;
    document.getElementById('leanTargetInputVal').value = w.targetLean;
    document.getElementById('fatInputVal').value = w.currentFat;
    document.getElementById('fatTargetInputVal').value = w.targetFat;
}

function closeWeightModal() {
    document.getElementById('weightModal').classList.remove('active');
}

function saveWeightDetails() {
    const w = state.health.weight;
    w.current = parseFloat(document.getElementById('weightInputVal').value) || 0;
    w.target = parseFloat(document.getElementById('weightTargetInputVal').value) || 0;
    w.currentLean = parseFloat(document.getElementById('leanInputVal').value) || 0;
    w.targetLean = parseFloat(document.getElementById('leanTargetInputVal').value) || 0;
    w.currentFat = parseFloat(document.getElementById('fatInputVal').value) || 0;
    w.targetFat = parseFloat(document.getElementById('fatTargetInputVal').value) || 0;

    saveState();
    renderHealthDashboard();
    renderWeightMiniDetails();
    closeWeightModal();
    showXpToast("Dati peso aggiornati!", '⚖️');
}

function renderWeightMiniDetails() {
    const lean = document.getElementById('leanCurrent');
    const fat = document.getElementById('fatCurrent');
    if (lean) lean.textContent = state.health.weight.currentLean + ' kg';
    if (fat) fat.textContent = state.health.weight.currentFat + ' %';
}


// Nutrition Trends Logic
let nutritionChartInstance = null;
let currentChartMetric = 'calories';
let currentEditingDate = null;

function showHealthHistory() {
    const overlay = document.getElementById('nutritionTrendsOverlay');
    const modal = document.getElementById('nutritionTrendsModal');
    if (overlay && modal) {
        overlay.classList.remove('hidden');
        modal.classList.remove('hidden');

        // Reset view to chart
        toggleNutritionHistoryView('chart');
    }
}
window.showHealthHistory = showHealthHistory;

function closeNutritionTrends() {
    const overlay = document.getElementById('nutritionTrendsOverlay');
    const modal = document.getElementById('nutritionTrendsModal');
    if (overlay) overlay.classList.add('hidden');
    if (modal) modal.classList.add('hidden');
}
window.closeNutritionTrends = closeNutritionTrends;

function toggleNutritionHistoryView(view) {
    const chartView = document.getElementById('nutrition-chart-view');
    const listView = document.getElementById('nutrition-list-view');
    const btnChart = document.getElementById('btn-view-chart');
    const btnList = document.getElementById('btn-view-list');

    if (view === 'chart') {
        chartView.classList.remove('hidden');
        listView.classList.add('hidden');
        btnChart.classList.add('active');
        btnList.classList.remove('active');
        setTimeout(() => renderNutritionChart(currentChartMetric), 50);
    } else {
        chartView.classList.add('hidden');
        listView.classList.remove('hidden');
        btnChart.classList.remove('active');
        btnList.classList.add('active');
        renderNutritionHistoryList();
    }
}
window.toggleNutritionHistoryView = toggleNutritionHistoryView;


function renderNutritionHistoryList() {
    const listEl = document.getElementById('nutritionHistoryList');
    if (!listEl) return;

    const history = state.health.history || [];
    // Sort descending (newest first)
    const sortedHistory = [...history].sort((a, b) => new Date(b.date) - new Date(a.date));

    listEl.innerHTML = sortedHistory.map(entry => `
        <div class="history-item" onclick="openHistoryEditor('${entry.date}')">
            <div>
                <div class="history-date">${formatDate(entry.date)}</div>
                <div class="history-summary">
                    🔥 ${Math.round(entry.consumed)} / 💧 ${entry.water?.toFixed(1) || 0}L / ⚖️ ${entry.weight}kg
                </div>
            </div>
            <div class="history-edit-icon">✏️</div>
        </div>
    `).join('');

    if (sortedHistory.length === 0) {
        listEl.innerHTML = '<div style="text-align:center; padding:20px; color:var(--text-muted);">Nessun dato storico disponibile.</div>';
    }
}

function openHistoryEditor(dateStr) {
    const entry = state.health.history.find(h => h.date === dateStr);
    if (!entry) return;

    currentEditingDate = dateStr;

    document.getElementById('editHistoryDate').textContent = formatDate(dateStr);
    document.getElementById('editHistCalories').value = Math.round(entry.consumed || 0);
    document.getElementById('editHistBurned').value = Math.round(entry.burned || 0);
    document.getElementById('editHistProteins').value = Math.round(entry.proteins || 0);
    // Handle protein legacy structure if needed, but history usually stores 'proteins' or 'protein'
    // check saved structure: usually {consumed, burned, steps, weight, water, proteins}

    document.getElementById('editHistWater').value = entry.water || 0;
    document.getElementById('editHistSteps').value = entry.steps || 0;
    document.getElementById('editHistWeight').value = entry.weight || 0;

    const overlay = document.getElementById('editHistoryOverlay');
    const modal = document.getElementById('editHistoryModal');

    // Z-index handling: ensure it's above the trends modal
    overlay.style.zIndex = '105';
    modal.style.zIndex = '106';

    overlay.classList.remove('hidden');
    modal.classList.remove('hidden');
}
window.openHistoryEditor = openHistoryEditor;

function closeHistoryEditor() {
    document.getElementById('editHistoryOverlay').classList.add('hidden');
    document.getElementById('editHistoryModal').classList.add('hidden');
    currentEditingDate = null;
}
window.closeHistoryEditor = closeHistoryEditor;

function saveHistoryEntry() {
    if (!currentEditingDate) return;

    const entryIndex = state.health.history.findIndex(h => h.date === currentEditingDate);
    if (entryIndex === -1) return;

    const updatedEntry = { ...state.health.history[entryIndex] };

    updatedEntry.consumed = parseFloat(document.getElementById('editHistCalories').value) || 0;
    updatedEntry.burned = parseFloat(document.getElementById('editHistBurned').value) || 0;
    updatedEntry.proteins = parseFloat(document.getElementById('editHistProteins').value) || 0;
    updatedEntry.water = parseFloat(document.getElementById('editHistWater').value) || 0;
    updatedEntry.steps = parseInt(document.getElementById('editHistSteps').value) || 0;
    updatedEntry.weight = parseFloat(document.getElementById('editHistWeight').value) || 0;

    state.health.history[entryIndex] = updatedEntry;
    saveState();

    closeHistoryEditor();

    // Refresh list
    renderNutritionHistoryList();

    // Trigger update if we edited something that might be currently viewed? 
    // History is usually strictly past, but good to keep UI in sync.
}
window.saveHistoryEntry = saveHistoryEntry;


function switchNutritionChart(metric) {
    currentChartMetric = metric;
    // Update tab styles
    document.querySelectorAll('.chart-tab').forEach(btn => {
        if (btn.textContent.toLowerCase().includes(metric === 'calories' ? 'calorie' : (metric === 'weight' ? 'peso' : 'acqua'))) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    renderNutritionChart(metric);
}
window.switchNutritionChart = switchNutritionChart;

function renderNutritionChart(metric) {
    const ctx = document.getElementById('nutritionTrendChart');
    if (!ctx) return;

    if (nutritionChartInstance) {
        nutritionChartInstance.destroy();
    }

    // Prepare data from history
    const history = state.health.history || [];
    // Sort by date just in case
    const sortedHistory = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Take last 7 days for visibility if on mobile, or up to 30
    const relevantData = sortedHistory.slice(-14);

    const labels = relevantData.map(entry => {
        const d = new Date(entry.date);
        return d.getDate() + '/' + (d.getMonth() + 1);
    });

    let datasets = [];
    let yAxisLabel = '';

    if (metric === 'calories') {
        const consumedData = relevantData.map(e => e.consumed);
        datasets.push({
            label: 'Consumate',
            data: consumedData,
            borderColor: '#f43f5e',
            backgroundColor: 'rgba(244, 63, 94, 0.1)',
            borderWidth: 2,
            tension: 0.3,
            fill: true
        });
        yAxisLabel = 'kcal';
    } else if (metric === 'weight') {
        const weightData = relevantData.map(e => e.weight);
        datasets.push({
            label: 'Peso (kg)',
            data: weightData,
            borderColor: '#8b5cf6',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            borderWidth: 2,
            tension: 0.3,
            fill: true
        });
        yAxisLabel = 'kg';
    } else if (metric === 'water') {
        const waterData = relevantData.map(e => e.water || 0); // Handle missing water data
        datasets.push({
            label: 'Acqua (L)',
            data: waterData,
            borderColor: '#0ea5e9',
            backgroundColor: 'rgba(14, 165, 233, 0.1)',
            borderWidth: 2,
            tension: 0.3,
            fill: true
        });
        yAxisLabel = 'L';
    }

    nutritionChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(15, 15, 26, 0.9)',
                    titleColor: '#fff',
                    bodyColor: '#cbd5e1',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: '#64748b',
                        font: { size: 10 }
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: '#64748b',
                        font: { size: 10 }
                    },
                    title: {
                        display: true,
                        text: yAxisLabel,
                        color: '#475569',
                        font: { size: 10 }
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
}

// PWA & Onboarding
window.openInstallModal = openInstallModal;
window.closeInstallModal = closeInstallModal;
window.toggleDontShowInstall = toggleDontShowInstall;

// Onboarding functions (private to module unless exposed)
function shouldShowOnboarding(tabType) {
    // Check if user has ever created a task of this type
    const onboardingKey = `questlife_onboarding_${tabType}`;
    return !localStorage.getItem(onboardingKey);
}

function markOnboardingComplete(tabType) {
    localStorage.setItem(`questlife_onboarding_${tabType}`, 'true');
}

function getOnboardingHTML(tabType) {
    const guides = {
        habits: {
            icon: '📜',
            title: 'Abitudini',
            subtitle: 'Attività ricorrenti che vuoi costruire',
            features: [
                { icon: '+', label: 'Crea una nuova abitudine', arrow: '↗️' },
                { icon: '🍅', label: 'Timer Pomodoro per focus', arrow: '↗️' },
                { icon: '📅', label: 'Scorri il calendario in alto', arrow: '↑' },
                { icon: '←→', label: 'Swipe su un task per modificare/eliminare', arrow: '' },
                { icon: '☰', label: 'Tieni premuto per riordinare', arrow: '' },
                { icon: '○', label: 'Tocca il cerchio per completare', arrow: '' }
            ]
        },
        oneshots: {
            icon: '💥',
            title: 'Missioni',
            subtitle: 'Task singoli da completare una volta',
            features: [
                { icon: '+', label: 'Crea un nuovo task', arrow: '↗️' },
                { icon: '🎒', label: 'Zaino per cattive abitudini e spesa', arrow: '↗️' },
                { icon: '←→', label: 'Swipe per modificare/eliminare', arrow: '' },
                { icon: '☰', label: 'Tieni premuto per riordinare', arrow: '' },
                { icon: '○', label: 'Tocca per completare', arrow: '' }
            ]
        },
        quests: {
            icon: '🎯',
            title: 'Campagne',
            subtitle: 'Grandi obiettivi con sotto-obiettivi',
            features: [
                { icon: '+', label: 'Crea una nuova quest', arrow: '↗️' },
                { icon: '👆', label: 'Tocca una quest per i dettagli', arrow: '' },
                { icon: '←→', label: 'Swipe per modificare/eliminare', arrow: '' },
                { icon: '☰', label: 'Tieni premuto per riordinare', arrow: '' },
                { icon: '▓░', label: 'Completa i sotto-obiettivi per progresso', arrow: '' }
            ]
        }
    };

    const guide = guides[tabType];
    if (!guide) return '';

    return `
        <div class="onboarding-guide">
            <div class="onboarding-header">
                <div class="onboarding-icon">${guide.icon}</div>
                <h3 class="onboarding-title">${guide.title}</h3>
                <p class="onboarding-subtitle">${guide.subtitle}</p>
            </div>
            <div class="onboarding-features">
                ${guide.features.map(f => `
                    <div class="onboarding-feature ${f.arrow ? 'has-arrow' : ''}">
                        <span class="feature-icon">${f.icon}</span>
                        <span class="feature-label">${f.label}</span>
                        ${f.arrow ? `<span class="feature-arrow">${f.arrow}</span>` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
        `;
}

// Exposure to window
window.shouldShowOnboarding = shouldShowOnboarding;
window.markOnboardingComplete = markOnboardingComplete;
window.getOnboardingHTML = getOnboardingHTML;


// Toast Logic
function showXpToast(message, icon = '✨') {
    const toast = document.createElement('div');
    toast.style.cssText = `
    position: fixed; bottom: 90px; left: 50%; transform: translateX(-50%);
    background: rgba(20, 20, 30, 0.9); color: white; padding: 12px 24px;
    border-radius: 50px; display: flex; align-items: center; gap: 12px;
    z-index: 10000; font-size: 14px; backdrop-filter: blur(10px);
    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.4); border: 1px solid rgba(255, 255, 255, 0.1);
    opacity: 0; transition: opacity 0.3s, transform 0.3s;
    `;
    toast.innerHTML = `<span style="font-size:18px;">${icon}</span>
 <span style="font-weight:500;">${message}</span>`;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(-5px)';
    });

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(0)';
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}
window.showDailyPlanner = showDailyPlanner;
window.openTaskPicker = openTaskPicker;
window.closeTaskPicker = closeTaskPicker;
window.addNewPlannerSlot = addNewPlannerSlot;
window.showChallengeCatalog = showChallengeCatalog;
