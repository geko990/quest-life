import { DEFAULT_ATTRIBUTES, DEFAULT_ABILITIES } from './constants.js';

export function getInitialState() {
  return {
    player: {
      name: 'Avventuriero',
      motto: '',
      level: 1,
      totalXp: 0,
      globalStreak: 0,
      lastAccessDate: null,
      lastActionDate: null,
      streakFreezes: 2,
      lastFreezeConsumedDate: null,
      lastFreezeReset: null,
      lastBackupDate: null,
      avatarType: 'emoji',
      avatarEmoji: '⚔️',
      avatarImage: null,
      monthlyChallenge: {
        currentMonth: null,
        points: 0,
        target: 50,
        medals: []
      }
    },
    stats: [
      ...DEFAULT_ATTRIBUTES.map(a => ({ ...a })),
      ...DEFAULT_ABILITIES.map(a => ({ ...a }))
    ],
    habits: [],
    oneshots: [],
    quests: [],
    toxicItems: [],
    completionLog: {},
    xpLog: [],
    pomodoro: {
      workDuration: 25,
      targetStatId: 'int',
      xpPerSession: 20,
      sessionsToday: 0,
      lastSessionDate: null,
      status: 'idle',
      targetTime: null,
      remainingTime: null
    },
    dailyPlan: {
      lastPlanDate: null
    },
    lastRecapWeek: null,
    recapHistory: [],
    penaltyLog: {},
    lastPenaltyCheck: null,
    inventory: {
      supplies: [],
      food: [],
      home: [],
      nutritionStreak: 0,
      lastNutritionDate: null
    },
    health: {
      calories: { goal: 1600, consumed: 0, burned: 0 },
      proteins: { goal: 100, consumed: 0 },
      steps: { goal: 10000, current: 0 },
      weight: {
        current: 75,
        target: 70,
        currentLean: 0,
        targetLean: 0,
        currentFat: 0,
        targetFat: 0
      },
      water: { goal: 8, consumed: 0 },
      meals: {
        breakfast: [],
        lunch: [],
        dinner: [],
        snack: [],
        cheat: []
      },
      history: [],
      foodDatabase: [
        { id: 'fd1', emoji: '🍚', name: 'Riso Basmati', baseGrams: 100, baseCalories: 350, baseProteins: 7, category: 'lunch' },
        { id: 'fd2', emoji: '🍗', name: 'Petto di Pollo', baseGrams: 100, baseCalories: 165, baseProteins: 31, category: 'dinner' },
        { id: 'fd3', emoji: '🥦', name: 'Verdure Miste', baseGrams: 100, baseCalories: 50, baseProteins: 3, category: 'lunch' },
        { id: 'fd4', emoji: '🍌', name: 'Banana', baseGrams: 100, baseCalories: 89, baseProteins: 1, category: 'snack' },
        { id: 'fd5', emoji: '☕', name: 'Caffè (Zuccherato)', baseGrams: 100, baseCalories: 40, baseProteins: 0, category: 'breakfast' }
      ],
      exerciseDatabase: [
        { id: 'ed1', emoji: '🏃', name: 'Camminata', baseCount: 20, baseCalories: 100, xpReward: 10, statId: 'vit' },
        { id: 'ed2', emoji: '💪', name: 'Flessioni', baseCount: 10, baseCalories: 50, xpReward: 15, statId: 'str' }
      ],
      lastUpdate: null
    },
    settings: {
      theme: 'dark',
      accent: 'violet',
      dayStartTime: 0,
      weekStart: 'sunday',
      enableDailyPenalties: true,
      animatedBackground: true,
      enableDailyPlanner: true,
      enableWeeklyRecap: true,
      showDiceButton: true,
      presetDays: [
        {
          id: 'preset_work',
          name: 'Giorno Lavorativo',
          emoji: '💼',
          description: 'Routine per giornate di lavoro concentrato',
          slots: {
            action: { name: 'Completare le task prioritarie', stars: 3, statId: 'int' },
            bonus: { name: 'Pianificare riunioni e scadenze', stars: 2, statId: 'wis' },
            movement: { name: 'Passeggiata rigenerante 20 min', stars: 2, statId: 'str' },
            reaction: { name: 'Rispondere a email e messaggi', stars: 1, statId: 'int' }
          }
        },
        {
          id: 'preset_fit',
          name: 'Giorno Allenamento',
          emoji: '🏋️',
          description: 'Routine focalizzata su fitness e recupero',
          slots: {
            action: { name: 'Sessione di Allenamento Completa', stars: 4, statId: 'str' },
            bonus: { name: 'Preparazione pasti bilanciati', stars: 2, statId: 'con' },
            movement: { name: '10.000 passi quotidiani', stars: 3, statId: 'str' },
            reaction: { name: 'Stretching e mobilizzazione', stars: 1, statId: 'dex' }
          }
        }
      ]
    }
  };
}

export function sanitizeState(parsed, defaults = getInitialState()) {
  const state = { ...defaults };
  if (!parsed) return state;

  state.player = { ...state.player, ...parsed.player };
  if (state.player.motto === undefined) state.player.motto = '';
  if (state.player.streakFreezes === undefined) state.player.streakFreezes = 2;
  if (state.player.lastActionDate === undefined) state.player.lastActionDate = null;
  if (state.player.lastFreezeReset === undefined) state.player.lastFreezeReset = null;
  if (state.player.lastFreezeConsumedDate === undefined) state.player.lastFreezeConsumedDate = null;
  
  if (!state.player.monthlyChallenge) {
    state.player.monthlyChallenge = { ...defaults.player.monthlyChallenge };
  }

  state.settings = { ...state.settings, ...parsed.settings };
  if (state.settings.animatedBackground === undefined) state.settings.animatedBackground = true;
  if (state.settings.dayStartTime === undefined) state.settings.dayStartTime = 0;
  if (state.settings.enableDailyPenalties === undefined) state.settings.enableDailyPenalties = true;

  state.habits = parsed.habits || [];
  state.oneshots = parsed.oneshots || [];
  state.quests = parsed.quests || [];
  state.completionLog = parsed.completionLog || {};
  state.xpLog = (parsed.xpLog || []).map(entry => {
    if (!entry.title && entry.source) {
      return { ...entry, title: entry.source };
    }
    return entry;
  });

  if (state.completionLog) {
    Object.keys(state.completionLog).forEach(key => {
      const entry = state.completionLog[key];
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
        state.completionLog[key] = { habits: [], oneshots: [], quests: [] };
      } else {
        if (!Array.isArray(entry.habits)) entry.habits = [];
        if (!Array.isArray(entry.oneshots)) entry.oneshots = [];
        if (!Array.isArray(entry.quests)) entry.quests = [];
      }
    });
  }

  state.penaltyLog = parsed.penaltyLog || {};
  state.lastPenaltyCheck = parsed.lastPenaltyCheck || null;

  if (parsed.inventory) {
    state.inventory = { ...state.inventory, ...parsed.inventory };
  }
  if (parsed.health) {
    state.health = { ...state.health, ...parsed.health };
  }

  if (!state.health.proteins) state.health.proteins = { goal: 100, consumed: 0 };
  if (!state.health.meals) {
    state.health.meals = { breakfast: [], lunch: [], dinner: [], snack: [], cheat: [] };
  } else {
    ['breakfast', 'lunch', 'dinner', 'snack', 'cheat'].forEach(k => {
      if (!state.health.meals[k]) state.health.meals[k] = [];
    });
  }

  if (!state.inventory.food) state.inventory.food = [];
  if (!state.inventory.home) state.inventory.home = [];

  // Migration: Supplies -> Food
  if (state.inventory.supplies && state.inventory.supplies.length > 0 && state.inventory.food.length === 0) {
    state.inventory.food = [...state.inventory.supplies];
    state.inventory.supplies = [];
  }

  // Migration: toxicItems -> Cheat meals
  if (parsed.toxicItems && parsed.toxicItems.length > 0) {
    parsed.toxicItems.forEach(item => {
      const cheatMeal = {
        id: item.id || Date.now() + Math.random().toString().slice(2),
        name: item.name,
        calories: 300,
        type: 'cheat'
      };
      state.health.meals.cheat.push(cheatMeal);
    });
  }

  if (state.health.weight && state.health.weight.currentLean === undefined) {
    state.health.weight.currentLean = 0;
    state.health.weight.targetLean = 0;
    state.health.weight.currentFat = 0;
    state.health.weight.targetFat = 0;
  }

  if (parsed.pomodoro) {
    state.pomodoro = { ...state.pomodoro, ...parsed.pomodoro };
  }
  if (parsed.dailyPlan) {
    state.dailyPlan = { ...state.dailyPlan, ...parsed.dailyPlan };
  }

  if (parsed.stats && Array.isArray(parsed.stats) && parsed.stats.length > 0) {
    state.stats = parsed.stats.map(stat => {
      if (!stat.type) {
        return { ...stat, type: 'attribute' };
      }
      return stat;
    });
  }

  // Fix legacy Daily Planner oneshots emojis
  if (state.oneshots && Array.isArray(state.oneshots)) {
    state.oneshots = state.oneshots.map(o => {
      if (o.fromDailyPlan && o.name) {
        let cleanName = o.name.trim();
        let extractedEmoji = null;
        const legacyIcons = ['🎯', '⚡', '🚶', '🛡️'];
        for (const icon of legacyIcons) {
          if (cleanName.startsWith(icon)) {
            extractedEmoji = icon;
            cleanName = cleanName.substring(icon.length).trim();
            break;
          }
        }
        if (extractedEmoji) {
          return { ...o, name: cleanName, emoji: o.emoji || extractedEmoji };
        }
      }
      return o;
    });
  }

  return state;
}
