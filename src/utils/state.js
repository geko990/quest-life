import { DEFAULT_ATTRIBUTES, DEFAULT_ABILITIES } from './constants.js';
import { calculateLevelFromXp } from './helpers.js';

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
    finances: {
      baseAccountName: 'Conto Base',
      balance: 0,
      cashBalance: 0,
      monthlyBudget: 1000,
      hideBalances: false,
      transactions: [],
      savingGoals: [],
      secondaryAccounts: [],
      recurringTransactions: []
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
        { id: 'fd_pane_cafone', emoji: '🍞', name: 'Pane Cafone (Fetta)', baseGrams: 100, baseCalories: 270, baseProteins: 8.5, pieceCalories: 135, pieceProteins: 4.3, category: 'lunch' },
        { id: 'fd_pomodori', emoji: '🍅', name: 'Pomodori Freschi', baseGrams: 100, baseCalories: 18, baseProteins: 0.9, pieceCalories: 22, pieceProteins: 1.1, category: 'lunch' },
        { id: 'fd_verdure', emoji: '🥗', name: 'Verdure Miste / Insalata', baseGrams: 100, baseCalories: 25, baseProteins: 1.5, pieceCalories: 38, pieceProteins: 2.3, category: 'lunch' },
        { id: 'fd_mozzarella', emoji: '🧀', name: 'Mozzarella (Bufala/Fiordilatte)', baseGrams: 100, baseCalories: 280, baseProteins: 18, pieceCalories: 350, pieceProteins: 22.5, category: 'dinner' },
        { id: 'fd_patate_forno', emoji: '🥔', name: 'Patate al Forno', baseGrams: 100, baseCalories: 130, baseProteins: 2.5, pieceCalories: 195, pieceProteins: 3.8, category: 'dinner' },
        { id: 'fd_pasta_pomodoro', emoji: '🍝', name: 'Pasta al Pomodoro', baseGrams: 100, baseCalories: 160, baseProteins: 5, pieceCalories: 350, pieceProteins: 11, category: 'lunch' },
        { id: 'fd_pasta_bianco', emoji: '🍝', name: 'Pasta in Bianco (con Olio)', baseGrams: 100, baseCalories: 180, baseProteins: 5.5, pieceCalories: 395, pieceProteins: 12, category: 'lunch' },
        { id: 'fd_petto_pollo', emoji: '🍗', name: 'Petto di Pollo', baseGrams: 100, baseCalories: 165, baseProteins: 31, pieceCalories: 198, pieceProteins: 37.2, category: 'dinner' },
        { id: 'fd_uovo', emoji: '🥚', name: 'Uovo (Sodo / Occhio di Bue)', baseGrams: 100, baseCalories: 155, baseProteins: 13, pieceCalories: 78, pieceProteins: 6.5, category: 'dinner' },
        { id: 'fd_riso', emoji: '🍚', name: 'Riso Basmati', baseGrams: 100, baseCalories: 130, baseProteins: 2.7, pieceCalories: 260, pieceProteins: 5.4, category: 'lunch' },
        { id: 'fd_banana', emoji: '🍌', name: 'Banana', baseGrams: 100, baseCalories: 89, baseProteins: 1.1, pieceCalories: 107, pieceProteins: 1.3, category: 'snack' },
        { id: 'fd_mela', emoji: '🍎', name: 'Mela', baseGrams: 100, baseCalories: 52, baseProteins: 0.3, pieceCalories: 78, pieceProteins: 0.5, category: 'snack' },
        { id: 'fd_olio_oliva', emoji: '🫒', name: 'Olio EV d\'Oliva (Cucchiaio)', baseGrams: 100, baseCalories: 884, baseProteins: 0, pieceCalories: 88, pieceProteins: 0, category: 'lunch' },
        { id: 'fd_yogurt_greco', emoji: '🥣', name: 'Yogurt Greco 0%', baseGrams: 100, baseCalories: 59, baseProteins: 10, pieceCalories: 100, pieceProteins: 17, category: 'snack' },
        { id: 'fd_tonno', emoji: '🐟', name: 'Tonno in Scatola', baseGrams: 100, baseCalories: 130, baseProteins: 26, pieceCalories: 104, pieceProteins: 20.8, category: 'lunch' },
        { id: 'fd_caffe', emoji: '☕', name: 'Caffè (Zuccherato)', baseGrams: 100, baseCalories: 40, baseProteins: 0, pieceCalories: 20, pieceProteins: 0, category: 'breakfast' },
        { id: 'fd_cornetto', emoji: '🥐', name: 'Cornetto / Brioche', baseGrams: 100, baseCalories: 410, baseProteins: 8, pieceCalories: 260, pieceProteins: 5.1, category: 'breakfast' }
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
      allowPastEdits: false,
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
  state.player.totalXp = Number(state.player.totalXp) || 0;
  state.player.level = calculateLevelFromXp(state.player.totalXp);
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
  if (state.settings.allowPastEdits === undefined) state.settings.allowPastEdits = false;
  if (!Array.isArray(state.settings.presetDays)) {
    state.settings.presetDays = defaults.settings.presetDays;
  }

  state.habits = (parsed.habits || []).map(h => {
    const diff = h.difficulty !== undefined ? h.difficulty : (h.stars !== undefined ? h.stars : 3);
    return { ...h, difficulty: diff, stars: diff };
  });
  state.oneshots = (parsed.oneshots || []).map(o => {
    const diff = o.difficulty !== undefined ? o.difficulty : (o.stars !== undefined ? o.stars : 3);
    return { ...o, difficulty: diff, stars: diff };
  });
  state.quests = (parsed.quests || []).map(q => {
    const diff = q.difficulty !== undefined ? q.difficulty : (q.stars !== undefined ? q.stars : 3);
    return { ...q, difficulty: diff, stars: diff };
  });
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

  if (!state.health.calories) state.health.calories = { goal: 1600, consumed: 0, burned: 0 };
  if (!state.health.proteins) state.health.proteins = { goal: 100, consumed: 0 };
  if (!state.health.meals) {
    state.health.meals = { breakfast: [], lunch: [], dinner: [], snack: [], cheat: [] };
  } else {
    ['breakfast', 'lunch', 'dinner', 'snack', 'cheat'].forEach(k => {
      if (!state.health.meals[k]) state.health.meals[k] = [];
    });
  }

  // Ensure calories.consumed & proteins.consumed match logged meals to prevent phantom calories
  const hasLoggedMeals = Object.values(state.health.meals).some(arr => Array.isArray(arr) && arr.length > 0);
  if (!hasLoggedMeals) {
    state.health.calories.consumed = 0;
    state.health.proteins.consumed = 0;
  } else {
    const totalMealCal = Object.values(state.health.meals).reduce((acc, cat) => {
      return acc + (Array.isArray(cat) ? cat.reduce((sum, item) => sum + (Number(item.calories) || 0), 0) : 0);
    }, 0);
    const totalMealProt = Object.values(state.health.meals).reduce((acc, cat) => {
      return acc + (Array.isArray(cat) ? cat.reduce((sum, item) => sum + (Number(item.proteins) || 0), 0) : 0);
    }, 0);
    state.health.calories.consumed = totalMealCal;
    state.health.proteins.consumed = Math.round(totalMealProt * 10) / 10;
  }

  if (!state.health.workouts) state.health.workouts = [];
  if (Array.isArray(state.health.workouts) && state.health.workouts.length > 0) {
    const totalWorkoutCal = state.health.workouts.reduce((sum, w) => sum + (Number(w.baseCalories) || 0), 0);
    state.health.calories.burned = totalWorkoutCal;
  }

  if (!state.health.foodDatabase || state.health.foodDatabase.length === 0) {
    state.health.foodDatabase = [...defaults.health.foodDatabase];
  } else {
    defaults.health.foodDatabase.forEach(defItem => {
      if (!state.health.foodDatabase.some(f => f.id === defItem.id)) {
        state.health.foodDatabase.push(defItem);
      }
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

  if (parsed.finances) {
    const parseSafeNum = (val, def = 0) => {
      const n = Number(val);
      return isNaN(n) ? def : n;
    };

    state.finances = {
      baseAccountName: (parsed.finances.baseAccountName && typeof parsed.finances.baseAccountName === 'string')
        ? parsed.finances.baseAccountName.trim() || 'Conto Base'
        : 'Conto Base',
      balance: parseSafeNum(parsed.finances.balance, 0),
      cashBalance: parseSafeNum(parsed.finances.cashBalance, 0),
      monthlyBudget: parseSafeNum(parsed.finances.monthlyBudget, 1000),
      hideBalances: Boolean(parsed.finances.hideBalances),
      transactions: Array.isArray(parsed.finances.transactions) ? parsed.finances.transactions : [],
      savingGoals: Array.isArray(parsed.finances.savingGoals) ? parsed.finances.savingGoals : [],
      secondaryAccounts: Array.isArray(parsed.finances.secondaryAccounts)
        ? parsed.finances.secondaryAccounts.map(a => ({
            ...a,
            balance: parseSafeNum(a.balance, 0)
          }))
        : [],
      recurringTransactions: Array.isArray(parsed.finances.recurringTransactions) ? parsed.finances.recurringTransactions : []
    };
  } else {
    state.finances = {
      baseAccountName: 'Conto Base',
      balance: 0,
      cashBalance: 0,
      monthlyBudget: 1000,
      hideBalances: false,
      transactions: [],
      savingGoals: [],
      secondaryAccounts: [],
      recurringTransactions: []
    };
  }

  return state;
}
