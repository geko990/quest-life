/* ============================================
   QUEST LIFE - RPG Habit Tracker v2
   State Module
   ============================================ */
import { DEFAULT_ATTRIBUTES, DEFAULT_ABILITIES } from './constants.js';
import { getMonthIdentifier, getGameDate, ensureUniqueIds, getGameDateString } from './utils.js';
import { saveDataToFile } from './storage.js';

export const APP_VERSION = '3.1.41';

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
        lastSessionDate: null,
        // Persistence
        status: 'idle', // 'idle', 'running', 'paused'
        targetTime: null, // ISO string of when timer ends
        remainingTime: null // Seconds left when paused
    },
    dailyPlan: {
        lastPlanDate: null  // Date when last daily plan was shown
    },
    lastRecapWeek: null, // Week ID when last recap was shown
    recapHistory: [], // Array of past weekly recaps: [{weekId, weekLabel, totalXp, topStat, bestHabit, pomodoroCount}]
    penaltyLog: {}, // Log of penalties applied: {dateStr: [{habitId, habitName, xpLost, statId}]}
    lastPenaltyCheck: null, // Last date+time penalties were checked
    inventory: {
        supplies: [], // DEPRECATED: Migrated to 'food'
        food: [],     // Main food inventory
        home: [],     // House items
        nutritionStreak: 0,
        lastNutritionDate: null
    },
    health: {
        calories: { goal: 1600, consumed: 0, burned: 0 },
        proteins: { goal: 100, consumed: 0 },
        steps: { goal: 10000, current: 0 },
        weight: {
            current: 75, target: 70,
            currentLean: 0, targetLean: 0,
            currentFat: 0, targetFat: 0
        },
        water: { goal: 8, consumed: 0 },
        meals: {
            breakfast: [],
            lunch: [],
            dinner: [],
            snack: []
        },
        history: [], // Array di {date, consumed, burned, steps, weight, water, proteins}
        foodDatabase: [], // Array di FoodItem: {id, emoji, name, baseGrams, baseCalories, baseProteins, primaryStatId, secondaryStatId}
        exerciseDatabase: [], // Array di ExerciseItem: {id, emoji, name, baseCount, baseCalories, xpReward, statId}
        lastUpdate: null
    },
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
            console.log(`QUEST LIFE SYSTEM BOOT - v${APP_VERSION}`);
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

            // Load settings first to ensure dayStartTime is available for date calculations
            state.settings = { ...state.settings, ...parsed.settings };
            if (state.settings.animatedBackground === undefined) state.settings.animatedBackground = true;
            // Ensure dayStartTime exists
            if (state.settings.dayStartTime === undefined) state.settings.dayStartTime = 0;

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

            // Load inventory data
            if (parsed.inventory) {
                state.inventory = { ...state.inventory, ...parsed.inventory };
            }

            // Load health data
            if (parsed.health) {
                state.health = { ...state.health, ...parsed.health };
            }

            const today = getGameDateString();
            // Check for daily reset of health metrics
            checkHealthRollover();

            // Ensure new structures exist
            if (!state.health.proteins) state.health.proteins = { goal: 100, consumed: 0 };
            if (!state.health.foodDatabase || state.health.foodDatabase.length === 0) {
                state.health.foodDatabase = [
                    { id: 'fd1', emoji: '🍚', name: 'Riso Basmati', baseGrams: 100, baseCalories: 350, baseProteins: 7, primaryStatId: 'str', secondaryStatId: 'vit' },
                    { id: 'fd2', emoji: '🍗', name: 'Petto di Pollo', baseGrams: 100, baseCalories: 165, baseProteins: 31, primaryStatId: 'str', secondaryStatId: 'vit' },
                    { id: 'fd3', emoji: '🥦', name: 'Verdure Miste', baseGrams: 100, baseCalories: 50, baseProteins: 3, primaryStatId: 'int', secondaryStatId: 'vit' }
                ];
            }
            if (!state.health.exerciseDatabase || state.health.exerciseDatabase.length === 0) {
                state.health.exerciseDatabase = [
                    { id: 'ed1', emoji: '🏃', name: 'Camminata', baseCount: 20, baseCalories: 100, xpReward: 10, statId: 'vit' },
                    { id: 'ed2', emoji: '💪', name: 'Flessioni', baseCount: 10, baseCalories: 50, xpReward: 15, statId: 'str' }
                ];
            }
            if (!state.health.history) state.health.history = [];
            if (!state.health.meals) {
                state.health.meals = { breakfast: [], lunch: [], dinner: [], snack: [], cheat: [] };
            } else if (!state.health.meals.cheat) {
                state.health.meals.cheat = [];
            }
            if (!state.inventory.food) state.inventory.food = [];
            if (!state.inventory.home) state.inventory.home = [];

            // MIGRATION v3.1.0: Supplies -> Food
            if (state.inventory.supplies && state.inventory.supplies.length > 0 && state.inventory.food.length === 0) {
                console.log("Migrating supplies to food...");
                state.inventory.food = [...state.inventory.supplies];
                state.inventory.supplies = [];
            }

            // MIGRATION v3.1.0: ToxicItems -> Meals.Cheat
            if (state.toxicItems && state.toxicItems.length > 0) {
                console.log("Migrating toxicItems to cheat meals...");
                state.toxicItems.forEach(item => {
                    // Convert toxic item to meal preset
                    const cheatMeal = {
                        id: item.id || Date.now() + Math.random().toString().slice(2),
                        name: item.name,
                        calories: 300, // Default for converted items
                        type: 'cheat'
                    };
                    state.health.meals.cheat.push(cheatMeal);
                });
                state.toxicItems = []; // Clear old toxic items
            }

            // Backfill lean/fat mass if missing
            if (state.health.weight && state.health.weight.currentLean === undefined) {
                state.health.weight.currentLean = 0;
                state.health.weight.targetLean = 0;
                state.health.weight.currentFat = 0;
                state.health.weight.targetFat = 0;
            }

            // Migrate pomodoro settings
            if (parsed.pomodoro) {
                state.pomodoro = { ...state.pomodoro, ...parsed.pomodoro };
            }
            // Reset session counter if new day
            if (state.pomodoro.lastSessionDate !== today) {
                state.pomodoro.sessionsToday = 0;
            }

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
    // console.log removed
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
export function checkHealthRollover() {
    if (!state.health) return;

    const today = getGameDateString();
    if (state.health.lastUpdate && state.health.lastUpdate !== today) {
        console.log(`[HealthRollover] Day changed from ${state.health.lastUpdate} to ${today}. Saving history.`);

        // Save to history before reset
        const historyEntry = {
            date: state.health.lastUpdate,
            consumed: state.health.calories.consumed || 0,
            burned: state.health.calories.burned || 0,
            proteins: state.health.proteins?.consumed || 0,
            steps: state.health.steps.current || 0,
            weight: state.health.weight.current || 0,
            water: state.health.water?.consumed || 0
        };

        if (!state.health.history) state.health.history = [];
        state.health.history.push(historyEntry);

        // Keep last 30 days
        if (state.health.history.length > 30) {
            state.health.history = state.health.history.slice(-30);
        }

        // Reset daily metrics
        state.health.calories.consumed = 0;
        state.health.calories.burned = 0;
        if (state.health.proteins) state.health.proteins.consumed = 0;
        state.health.steps.current = 0;
        if (state.health.water) state.health.water.consumed = 0;

        state.health.lastUpdate = today;
        saveState();
    } else if (!state.health.lastUpdate) {
        state.health.lastUpdate = today;
        saveState();
    }
}
