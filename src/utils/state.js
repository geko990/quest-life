import { DEFAULT_ATTRIBUTES, DEFAULT_ABILITIES } from './constants.js';
import { calculateLevelFromXp, getXpForLevel } from './helpers.js';

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
      recurringTransactions: [],
      investments: [],
      customQuotesProxy: ''
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
        { id: 'ed1', emoji: '🏃', name: 'Camminata', baseCount: 20, baseCalories: 100, baseSteps: 2000, xpReward: 10, statId: 'vit' },
        { id: 'ed2', emoji: '💪', name: 'Flessioni', baseCount: 10, baseCalories: 50, baseSteps: 0, xpReward: 15, statId: 'str' }
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

  // 1. Clean and deduplicate oneshots
  const seenOneshotIds = new Set();
  const seenDailyPlanSlots = new Set();
  const cleanOneshots = [];

  (parsed.oneshots || []).forEach(o => {
    if (!o || !o.id) return;
    if (seenOneshotIds.has(o.id)) return;

    if (o.fromDailyPlan && o.dailyPlanDate && o.slotType) {
      const slotKey = `${o.dailyPlanDate}_${o.slotType}`;
      if (seenDailyPlanSlots.has(slotKey)) return;
      seenDailyPlanSlots.add(slotKey);
    }

    seenOneshotIds.add(o.id);
    const diff = o.difficulty !== undefined ? o.difficulty : (o.stars !== undefined ? o.stars : 3);
    cleanOneshots.push({ ...o, difficulty: diff, stars: diff });
  });
  state.oneshots = cleanOneshots;

  state.quests = (parsed.quests || []).map(q => {
    const diff = q.difficulty !== undefined ? q.difficulty : (q.stars !== undefined ? q.stars : 3);
    return { ...q, difficulty: diff, stars: diff };
  });

  // 2. Clean and deduplicate completionLog
  state.completionLog = parsed.completionLog || {};
  if (state.completionLog) {
    Object.keys(state.completionLog).forEach(key => {
      const entry = state.completionLog[key];
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
        state.completionLog[key] = { habits: [], oneshots: [], quests: [], subquests: [] };
      } else {
        entry.habits = Array.isArray(entry.habits) ? [...new Set(entry.habits)] : [];
        entry.oneshots = Array.isArray(entry.oneshots)
          ? [...new Set(entry.oneshots)].filter(id => seenOneshotIds.has(id))
          : [];
        entry.quests = Array.isArray(entry.quests) ? [...new Set(entry.quests)] : [];
        entry.subquests = Array.isArray(entry.subquests) ? [...new Set(entry.subquests)] : [];
      }
    });
  }

  // 3. Clean and deduplicate xpLog, calculating excess XP to revert
  const excessXpByStat = {};
  let totalExcessXp = 0;
  const seenXpSignatures = new Set();
  const cleanXpLog = [];

  (parsed.xpLog || []).forEach(entry => {
    if (!entry) return;
    const cleanTitle = (entry.title || entry.source || '').trim();
    const cleanEntry = { ...entry, title: cleanTitle, source: cleanTitle };

    // Discard identical duplicate entries on the same date for the same stat & amount
    if (cleanTitle && cleanEntry.date && cleanEntry.statId && cleanEntry.amount > 0) {
      const sig = `${cleanEntry.date}|${cleanEntry.statId}|${cleanTitle.toLowerCase()}|${cleanEntry.amount}|${cleanEntry.isMonthlyTask ? 'm' : 'nm'}`;
      if (seenXpSignatures.has(sig)) {
        const amt = Number(cleanEntry.amount) || 0;
        excessXpByStat[cleanEntry.statId] = (excessXpByStat[cleanEntry.statId] || 0) + amt;
        totalExcessXp += amt;
        return; // Drop duplicate entry
      }
      seenXpSignatures.add(sig);
    }

    cleanXpLog.push(cleanEntry);
  });
  state.xpLog = cleanXpLog;

  // 4. Adjust player totalXp and stat XP if duplicates were removed
  if (totalExcessXp > 0) {
    state.player.totalXp = Math.max(0, (Number(state.player.totalXp) || 0) - totalExcessXp);
    state.player.level = calculateLevelFromXp(state.player.totalXp);

    if (state.stats && Array.isArray(state.stats)) {
      state.stats = state.stats.map(s => {
        const excess = excessXpByStat[s.id];
        if (!excess) return s;
        let newXp = (Number(s.xp) || 0) - excess;
        let currentLvl = Number(s.level) || 1;
        while (newXp < 0 && currentLvl > 1) {
          currentLvl -= 1;
          const prevNeeded = getXpForLevel(currentLvl + 1);
          newXp += prevNeeded;
        }
        if (currentLvl === 1 && newXp < 0) newXp = 0;
        return { ...s, xp: newXp, level: currentLvl };
      });
    }
  }

  // 5. Re-sync monthly challenge points
  if (state.player.monthlyChallenge && state.player.monthlyChallenge.currentMonth) {
    const currentMonth = state.player.monthlyChallenge.currentMonth;
    state.player.monthlyChallenge.points = state.xpLog.filter(
      l => l.date && l.date.startsWith(currentMonth) && l.isMonthlyTask
    ).length;
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

  // Calculate sums from logged meals and workouts
  const totalMealCal = Object.values(state.health.meals).reduce((acc, cat) => {
    return acc + (Array.isArray(cat) ? cat.reduce((sum, item) => sum + (Number(item.calories) || 0), 0) : 0);
  }, 0);
  const totalMealProt = Object.values(state.health.meals).reduce((acc, cat) => {
    return acc + (Array.isArray(cat) ? cat.reduce((sum, item) => sum + (Number(item.proteins) || 0), 0) : 0);
  }, 0);

  // Preserve directly logged consumed calories & proteins without wiping them to 0 on reopen
  const parsedConsumed = Number(parsed?.health?.calories?.consumed);
  state.health.calories.consumed = !isNaN(parsedConsumed)
    ? Math.max(parsedConsumed, totalMealCal)
    : totalMealCal;

  const parsedProt = Number(parsed?.health?.proteins?.consumed);
  state.health.proteins.consumed = !isNaN(parsedProt)
    ? Math.max(parsedProt, Math.round(totalMealProt * 10) / 10)
    : Math.round(totalMealProt * 10) / 10;

  if (!state.health.workouts) state.health.workouts = [];
  const totalWorkoutCal = (state.health.workouts || []).reduce((sum, w) => sum + (Number(w.baseCalories) || 0), 0);
  const parsedBurned = Number(parsed?.health?.calories?.burned);
  state.health.calories.burned = !isNaN(parsedBurned)
    ? Math.max(parsedBurned, totalWorkoutCal)
    : totalWorkoutCal;


  if (!state.health.foodDatabase || state.health.foodDatabase.length === 0) {
    state.health.foodDatabase = [...defaults.health.foodDatabase];
  } else {
    defaults.health.foodDatabase.forEach(defItem => {
      if (!state.health.foodDatabase.some(f => f.id === defItem.id)) {
        state.health.foodDatabase.push(defItem);
      }
    });
  }

  if (!state.health.exerciseDatabase || state.health.exerciseDatabase.length === 0) {
    state.health.exerciseDatabase = [...defaults.health.exerciseDatabase];
  } else {
    defaults.health.exerciseDatabase.forEach(defItem => {
      if (!state.health.exerciseDatabase.some(e => e.id === defItem.id)) {
        state.health.exerciseDatabase.push(defItem);
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

    let proxyVal = '';
    if (parsed.finances.customQuotesProxy && typeof parsed.finances.customQuotesProxy === 'string') {
      proxyVal = parsed.finances.customQuotesProxy.trim();
    } else {
      try {
        proxyVal = (localStorage.getItem('questlife_custom_quotes_proxy') || '').trim();
      } catch (e) {}
    }

    if (proxyVal) {
      try {
        localStorage.setItem('questlife_custom_quotes_proxy', proxyVal);
      } catch (e) {}
    }

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
            balance: parseSafeNum(a.balance, 0),
            interestFrequency: a.interestFrequency || 'monthly'
          }))
        : [],
      recurringTransactions: Array.isArray(parsed.finances.recurringTransactions) ? parsed.finances.recurringTransactions : [],
      investments: Array.isArray(parsed.finances.investments)
        ? parsed.finances.investments.map(inv => ({
            id: inv.id || ('inv_' + Date.now() + '_' + Math.floor(Math.random() * 1000)),
            name: inv.name || 'Investimento',
            ticker: (inv.ticker || '').trim().toUpperCase(),
            shares: parseSafeNum(inv.shares, 0),
            buyPrice: parseSafeNum(inv.buyPrice, 0),
            currentPrice: parseSafeNum(inv.currentPrice, parseSafeNum(inv.buyPrice, 0)),
            lastUpdated: inv.lastUpdated || null,
            notes: inv.notes || ''
          }))
        : [],
      customQuotesProxy: proxyVal
    };
  } else {
    let fallbackProxy = '';
    try {
      fallbackProxy = (localStorage.getItem('questlife_custom_quotes_proxy') || '').trim();
    } catch (e) {}

    state.finances = {
      baseAccountName: 'Conto Base',
      balance: 0,
      cashBalance: 0,
      monthlyBudget: 1000,
      hideBalances: false,
      transactions: [],
      savingGoals: [],
      secondaryAccounts: [],
      recurringTransactions: [],
      investments: [],
      customQuotesProxy: fallbackProxy
    };
  }

  return state;
}
