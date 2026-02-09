/* ============================================
   QUEST LIFE - RPG Habit Tracker v2
   State Module
   ============================================ */
import { DEFAULT_ATTRIBUTES, DEFAULT_ABILITIES } from './constants.js';
import { getMonthIdentifier, getGameDate, ensureUniqueIds, getGameDateString } from './utils.js';
import { saveDataToFile } from './storage.js';

export let state = {
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
        lastBackupDate: null, // Last manual export date
        avatarType: 'emoji',
        avatarEmoji: '⚔️',
        avatarImage: null,
        monthlyChallenge: {
            currentMonth: null, // Will be set on init e.g. '2026-01'
            points: 0,
            target: 50,
            medals: [] // Array of {id, name, icon, earnedDate}
        }
    },
    stats: [...DEFAULT_ATTRIBUTES.map(a => ({ ...a })), ...DEFAULT_ABILITIES.map(a => ({ ...a }))],
    habits: [],
    oneshots: [],
    quests: [],
    toxicItems: [],
    completionLog: {},
    xpLog: [], // Log di XP guadagnato: [{date, statId, amount}]
    pomodoro: {
        workDuration: 25,
        targetStatId: 'int',
        xpPerSession: 20,
        sessionsToday: 0,
        lastSessionDate: null
    },
    dailyPlan: {
        lastPlanDate: null  // Date when last daily plan was shown
    },
    lastRecapWeek: null, // Week ID when last recap was shown
    recapHistory: [], // Array of past weekly recaps: [{weekId, weekLabel, totalXp, topStat, bestHabit, pomodoroCount}]
    penaltyLog: {}, // Log of penalties applied: {dateStr: [{habitId, habitName, xpLost, statId}]}
    lastPenaltyCheck: null, // Last date+time penalties were checked
    settings: { theme: 'light', accent: 'violet', dayStartTime: 0, weekStart: 'sunday' }
};

export function setState(newState) {
    state = newState;
}

export function updateState(updates) {
    Object.assign(state, updates);
}

export function loadState() {
    // Try to load from new key first
    let saved = localStorage.getItem('questlife_state_v2');

    // If not found, try to migrate from old key
    if (!saved) {
        const oldSaved = localStorage.getItem('questlife_state');
        if (oldSaved) {
            saved = oldSaved;
            localStorage.setItem('questlife_state_v2', oldSaved);
            localStorage.removeItem('questlife_state');
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

            // Initialization for Monthly Challenge
            if (!state.player.monthlyChallenge) {
                state.player.monthlyChallenge = {
                    currentMonth: getMonthIdentifier(getGameDate()),
                    points: 0,
                    target: 50,
                    medals: [] // Array of {id, name, icon, earnedDate}
                };
            }

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

            // Sanitize completionLog to ensure all values are Objects with array properties
            // Fixes regression where values were forced to Arrays
            if (state.completionLog) {
                Object.keys(state.completionLog).forEach(key => {
                    const entry = state.completionLog[key];
                    // If entry is not an object (e.g. array from bad fix) or null/undefined
                    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
                        state.completionLog[key] = { habits: [], oneshots: [], quests: [] };
                    } else {
                        // Ensure properties exist
                        if (!Array.isArray(entry.habits)) entry.habits = [];
                        if (!Array.isArray(entry.oneshots)) entry.oneshots = [];
                        if (!Array.isArray(entry.quests)) entry.quests = [];
                    }
                });
            }
            state.xpLog = parsed.xpLog || [];

            // Migration: Backfill missing dates in xpLog
            state.xpLog.forEach(entry => {
                if (!entry.date && entry.timestamp) {
                    const d = new Date(entry.timestamp);
                    const year = d.getFullYear();
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    entry.date = `${year}-${month}-${day}`;
                }
            });

            // Load penalty system data
            state.penaltyLog = parsed.penaltyLog || {};
            state.lastPenaltyCheck = parsed.lastPenaltyCheck || null;

            state.settings = { ...state.settings, ...parsed.settings };
            if (state.settings.animatedBackground === undefined) state.settings.animatedBackground = true;

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

            // Migrate dailyPlan
            if (parsed.dailyPlan) {
                state.dailyPlan = { ...state.dailyPlan, ...parsed.dailyPlan };
            }

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

    // Always ensure all default abilities exist
    DEFAULT_ABILITIES.forEach(defaultAbility => {
        if (!state.stats.find(s => s.id === defaultAbility.id)) {
            state.stats.push({ ...defaultAbility });
        }
    });
}

export function saveState() {
    console.log(`[State] Saving... LastAccess: ${state.player.lastAccessDate}`);
    try {
        localStorage.setItem('questlife_state_v2', JSON.stringify(state));
    } catch (e) {
        console.error("CRITICAL: LocalStorage Save Failed", e);
        alert("⚠️ ERRORE SALVATAGGIO: Memoria piena o errore del browser. I tuoi dati potrebbero non essere salvati!");
    }
    saveDataToFile(state);
}

export function resetAll() {
    if (confirm('Sei sicuro di voler resettare tutto? Tutti i progressi andranno persi.')) {
        localStorage.removeItem('questlife_state_v2');
        localStorage.removeItem('questlife_state');
        location.reload();
    }
}
