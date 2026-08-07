import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import Modal from './components/Modal';
import DailyPlannerModal from './components/DailyPlannerModal';
import HomeTab from './tabs/HomeTab';
import HabitsTab from './tabs/HabitsTab';
import MissionsTab from './tabs/MissionsTab';
import OneShotTab from './tabs/OneShotTab';
import QuestsTab from './tabs/QuestsTab';
import NutritionTab from './tabs/NutritionTab';
import SettingsTab from './tabs/SettingsTab';

import { APP_VERSION } from './utils/constants';
import { getInitialState, sanitizeState } from './utils/state';
import { getGameDate, getGameDateObj, formatISO, calculateLevelFromXp, getXpForLevel, getCumulativeXpForLevel, getWeekIdentifier, getMonthIdentifier, forceUpdateApp } from './utils/helpers';
import { loadFileHandleOnStart, saveDataToFile, verifyPermission, linkDatabaseFile } from './utils/storage';
import { onUpdateAvailable } from './utils/pwaManager';

export default function App() {
  // 1. Initial State Loading
  const getLoadedState = () => {
    const saved = localStorage.getItem('questlife_state_v2');
    if (saved) {
      try {
        return sanitizeState(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse local storage state", e);
      }
    }
    return getInitialState();
  };

  const initialFullState = getLoadedState();

  // 2. React state hook declarations
  const [player, setPlayer] = useState(initialFullState.player);
  const [stats, setStats] = useState(initialFullState.stats);
  const [habits, setHabits] = useState(initialFullState.habits);
  const [oneshots, setOneshots] = useState(initialFullState.oneshots);
  const [quests, setQuests] = useState(initialFullState.quests);
  const [completionLog, setCompletionLog] = useState(initialFullState.completionLog);
  const [xpLog, setXpLog] = useState(initialFullState.xpLog);
  const [pomodoro, setPomodoro] = useState(initialFullState.pomodoro);
  const [inventory, setInventory] = useState(initialFullState.inventory);
  const [health, setHealth] = useState(initialFullState.health);
  const [settings, setSettings] = useState(initialFullState.settings);
  const [dailyActions, setDailyActions] = useState(initialFullState.dailyActions || []);

  const handleToggleDailyAction = (actionId) => {
    setDailyActions(prev => (
      prev.includes(actionId) ? prev.filter(id => id !== actionId) : [...prev, actionId]
    ));
  };

  const [activeTab, setActiveTab] = useState('home');
  const [fileHandle, setFileHandle] = useState(null);

  // Modal control states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editData, setEditData] = useState(null);

  // Custom modals
  const [showMottoModal, setShowMottoModal] = useState(false);
  const [mottoText, setMottoText] = useState(player.motto || '');
  const [showPlannerModal, setShowPlannerModal] = useState(false);

  // Version Auto-Check hook
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [latestVersion, setLatestVersion] = useState(APP_VERSION);

  useEffect(() => {
    onUpdateAvailable((newVersion) => {
      if (newVersion) setLatestVersion(newVersion);
      setUpdateAvailable(true);
    });
  }, []);

  // 3. Load FileHandle on Start
  useEffect(() => {
    async function loadHandle() {
      const handle = await loadFileHandleOnStart();
      if (handle) {
        setFileHandle(handle);
        // Request/Verify permission
        const granted = await verifyPermission(handle, true);
        if (!granted) {
          console.warn("Local file database permission not granted by user.");
        }
      }
    }
    loadHandle();
  }, []);

  // 4. State Persistence (LocalStorage + FileSystem File)
  useEffect(() => {
    const stateObj = {
      player,
      stats,
      habits,
      oneshots,
      quests,
      completionLog,
      xpLog,
      pomodoro,
      inventory,
      health,
      settings
    };

    // Save to LocalStorage
    localStorage.setItem('questlife_state_v2', JSON.stringify(stateObj));

    // Save to File if connected
    if (fileHandle) {
      saveDataToFile(stateObj, fileHandle);
    }
  }, [player, stats, habits, oneshots, quests, completionLog, xpLog, pomodoro, inventory, health, settings, fileHandle]);

  // 5. Apply Theme & Accent attributes to root HTML element
  useEffect(() => {
    const root = document.documentElement;
    const themeName = settings.theme || 'standard';
    const activeAccent = settings.accent || settings.accentColor || 'violet';

    let isLightMode = false;
    if (settings.themeMode === 'light') {
      isLightMode = true;
    } else if (settings.themeMode === 'system') {
      isLightMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    } else if (settings.themeMode === 'dark') {
      isLightMode = false;
    } else if (settings.mode === 'light' || settings.theme === 'light') {
      isLightMode = true;
    }

    const modeName = isLightMode ? 'light' : 'dark';
    root.className = `theme-${themeName} accent-${activeAccent}`;
    root.setAttribute('data-theme', themeName);
    root.setAttribute('data-mode', modeName);
    root.setAttribute('data-accent', activeAccent);
    
    // Set theme color metadata
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', modeName === 'light' ? '#f1f5f9' : '#0b0b14');
    }
  }, [settings.theme, settings.accent, settings.accentColor, settings.mode, settings.themeMode]);

  // 6. Rollover check (Check if day rolled over)
  useEffect(() => {
    const todayStr = getGameDate(settings.dayStartTime);
    
    // Handle first login setup
    if (!player.lastAccessDate) {
      setPlayer(prev => ({ ...prev, lastAccessDate: todayStr }));
      return;
    }

    if (player.lastAccessDate !== todayStr) {
      handleDayRollover(player.lastAccessDate, todayStr);
    }
  }, [settings.dayStartTime]);

  const handleDayRollover = (lastDate, todayStr) => {
    console.log(`[Rollover] Rollover triggered from ${lastDate} to ${todayStr}`);

    // Save health history
    const historyEntry = {
      date: lastDate,
      consumed: health.calories.consumed || 0,
      burned: health.calories.burned || 0,
      proteins: health.proteins?.consumed || 0,
      steps: health.steps.current || 0,
      weight: health.weight.current || 75,
      water: health.water?.consumed || 0
    };

    // Reset daily health stats & meals
    setHealth(prev => {
      const updatedHistory = [...(prev.history || [])];
      // Keep last 30 days
      updatedHistory.push(historyEntry);
      if (updatedHistory.length > 30) {
        updatedHistory.shift();
      }
      return {
        ...prev,
        history: updatedHistory,
        lastUpdate: todayStr,
        calories: { ...prev.calories, consumed: 0, burned: 0 },
        proteins: { ...prev.proteins, consumed: 0 },
        steps: { ...prev.steps, current: 0 },
        water: { ...prev.water, consumed: 0 },
        meals: { breakfast: [], lunch: [], dinner: [], snack: [], cheat: [] }
      };
    });

    // Apply Penalties and reset streaks for missed daily habits
    if (settings.enableDailyPenalties) {
      let xpLost = 0;
      const yesterdayLog = completionLog[lastDate]?.habits || [];

      const updatedHabits = habits.map(h => {
        if (h.locked) return h;
        
        // Check if daily habit was missed yesterday
        if (h.frequency === 'daily') {
          const completed = yesterdayLog.includes(h.id);
          if (!completed) {
            // Apply streak reset & penalty
            xpLost += h.difficulty * 2;
            return { ...h, streak: 0 };
          }
        }
        return h;
      });

      if (xpLost > 0) {
        // Deduct player XP
        setPlayer(prev => ({
          ...prev,
          totalXp: Math.max(0, prev.totalXp - xpLost),
          level: calculateLevelFromXp(Math.max(0, prev.totalXp - xpLost))
        }));
        alert(`⚠️ NUOVO GIORNO: Hai saltato delle abitudini quotidiane ieri. Hai perso -${xpLost} XP e le relative serie si sono azzerate!`);
      }

      setHabits(updatedHabits);
    }

    // Update last access date
    setPlayer(prev => ({ ...prev, lastAccessDate: todayStr }));

    // Reset pomodoro session count
    if (pomodoro.lastSessionDate !== todayStr) {
      setPomodoro(prev => ({ ...prev, sessionsToday: 0 }));
    }

    // Trigger daily planner on new day if enabled
    if (settings.enableDailyPlanner) {
      setShowPlannerModal(true);
    }
  };

  // 7. XP Reward Handler
  const handleRewardXp = (statId, amount, isHabitCompletion = false) => {
    // 1. Reward Stat XP
    setStats(prevStats =>
      prevStats.map(s => {
        if (s.id !== statId) return s;
        let newXp = s.xp + amount;
        let currentLvl = s.level;
        let needed = getXpForLevel(currentLvl + 1);

        // Handle level up for stat
        while (newXp >= needed) {
          newXp -= needed;
          currentLvl += 1;
          needed = getXpForLevel(currentLvl + 1);
          if (settings.soundEnabled) playLevelUpSound();
        }
        return { ...s, xp: newXp, level: currentLvl };
      })
    );

    // 2. Reward Player XP
    const newTotalXp = player.totalXp + amount;
    const newLvl = calculateLevelFromXp(newTotalXp);
    const leveledUp = newLvl > player.level;

    // Monthly challenge points
    let monthlyPointsAdd = 0;
    if (isHabitCompletion) {
      // 1 point per star difficulty completed
      monthlyPointsAdd = 1;
    }

    const todayStr = getGameDate(settings.dayStartTime);

    // Log XP change
    setXpLog(prev => [
      ...prev,
      { date: todayStr, statId, amount, timestamp: Date.now() }
    ]);

    setPlayer(prev => {
      const nextMonthlyPoints = (prev.monthlyChallenge?.points || 0) + monthlyPointsAdd;
      const target = prev.monthlyChallenge?.target || 50;
      const medals = [...(prev.monthlyChallenge?.medals || [])];

      // Check monthly medal milestone
      if (nextMonthlyPoints >= target && (prev.monthlyChallenge?.points || 0) < target) {
        const monthId = getMonthIdentifier(todayStr);
        const medalId = monthId;
        if (!medals.some(m => m.id === medalId)) {
          medals.push({
            id: medalId,
            name: `Medaglia di ${new Date().toLocaleString('it-IT', { month: 'long' })}`,
            icon: '🏅',
            earnedDate: todayStr
          });
          alert(`🏆 MEDAGLIA GUADAGNATA! Hai completato la sfida mensile!`);
        }
      }

      return {
        ...prev,
        totalXp: newTotalXp,
        level: newLvl,
        lastActionDate: todayStr,
        monthlyChallenge: {
          ...prev.monthlyChallenge,
          points: nextMonthlyPoints,
          medals
        }
      };
    });

    if (leveledUp) {
      if (settings.soundEnabled) playLevelUpSound();
      alert(`🎉 LEVEL UP! Sei salito al Livello ${newLvl}! Continua così, eroe!`);
    }
  };

  const playLevelUpSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(261.63, audioCtx.currentTime); // C4
      osc.frequency.setValueAtTime(329.63, audioCtx.currentTime + 0.1); // E4
      osc.frequency.setValueAtTime(392.00, audioCtx.currentTime + 0.2); // G4
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime + 0.3); // C5
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.error(e);
    }
  };

  // 8. Toggling Item Completions
  const handleToggleHabit = (habitId, dateStr) => {
    const todayStr = getGameDate(settings.dayStartTime);
    const isCompleted = completionLog[dateStr]?.habits?.includes(habitId);

    // Update Completion Log
    setCompletionLog(prev => {
      const dayLog = { habits: [], oneshots: [], quests: [], ...(prev[dateStr] || {}) };
      const list = [...dayLog.habits];
      const idx = list.indexOf(habitId);
      
      if (idx === -1) {
        list.push(habitId);
      } else {
        list.splice(idx, 1);
      }
      return { ...prev, [dateStr]: { ...dayLog, habits: list } };
    });

    // Reward XP & update streaks if completed today
    if (dateStr === todayStr) {
      const habit = habits.find(h => h.id === habitId);
      if (!habit) return;

      if (!isCompleted) {
        // Complete habit: add streak, reward primary and secondary targets XP
        const primaryXp = habit.difficulty * 4; // 1->5 stars awards 4/8/12/16/20 XP
        const secondaryXp = Math.round(primaryXp * 0.33);

        handleRewardXp(habit.primaryTarget, primaryXp, true);
        if (habit.secondaryTarget) {
          handleRewardXp(habit.secondaryTarget, secondaryXp);
        }

        // Increment Streak
        setHabits(prev =>
          prev.map(h => (h.id === habitId ? { ...h, streak: h.streak + 1 } : h))
        );

        // Update player active streak
        setPlayer(prev => {
          const lastAction = prev.lastActionDate;
          const yesterdayStr = formatISO(new Date(Date.now() - 86400000));
          let nextStreak = prev.globalStreak;
          if (lastAction !== todayStr) {
            if (lastAction === yesterdayStr || prev.globalStreak === 0) {
              nextStreak += 1;
            }
          }
          return { ...prev, globalStreak: nextStreak, lastActionDate: todayStr };
        });

        // Small success audio beep
        if (settings.soundEnabled) {
          try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
            osc.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.08);
          } catch(e){}
        }
      } else {
        // Remove completion: decrement streak
        setHabits(prev =>
          prev.map(h => (h.id === habitId ? { ...h, streak: Math.max(0, h.streak - 1) } : h))
        );
      }
    }
  };

  const handleToggleOneshot = (id) => {
    const os = oneshots.find(o => o.id === id);
    if (!os) return;

    setOneshots(prev =>
      prev.map(o => (o.id === id ? { ...o, completed: !o.completed } : o))
    );

    if (!os.completed) {
      // Reward XP (oneshot awards difficulty * 8 XP!)
      let xp = os.difficulty * 8;
      
      // Apply D10 Roll Bonus if created from Daily Planner
      if (os.d10Roll) {
        const bonusMultiplier = 1 + (os.d10Roll * 10) / 100;
        xp = Math.round(xp * bonusMultiplier);
      }
      
      handleRewardXp(os.primaryTarget, xp);
      if (os.secondaryTarget) {
        handleRewardXp(os.secondaryTarget, Math.round(xp * 0.33));
      }
    }
  };

  const handleToggleSubquest = (questId, subId) => {
    setQuests(prevQuests =>
      prevQuests.map(q => {
        if (q.id !== questId) return q;

        const updatedSubs = q.subquests.map(sq =>
          sq.id === subId ? { ...sq, completed: !sq.completed } : sq
        );

        // Check if all subquests are completed now
        const allDone = updatedSubs.length > 0 && updatedSubs.every(sq => sq.completed);

        if (allDone && !q.completed) {
          // Reward massive Campaign Completion XP! (difficulty * 35 XP)
          const xpReward = q.difficulty * 35;
          handleRewardXp(q.primaryTarget, xpReward);
          alert(`🏆 CAMPAGNA COMPLETATA! "${q.name}" è finita! Hai guadagnato +${xpReward} XP in ${stats.find(s => s.id === q.primaryTarget)?.name}!`);
        }

        return { ...q, subquests: updatedSubs, completed: allDone };
      })
    );
  };

  const handleSaveDailyPlan = (slots, d10Roll) => {
    const todayStr = getGameDate(settings.dayStartTime);
    const newOneshots = [];
    
    const slotIcons = {
      action: '🎯',
      bonus: '⚡',
      movement: '🚶',
      reaction: '🛡️'
    };

    Object.entries(slots).forEach(([key, slot]) => {
      const name = slot.name.trim();
      if (!name) return;

      newOneshots.push({
        id: 'dp-' + Date.now() + '-' + key,
        name: name,
        emoji: slotIcons[key],
        difficulty: slot.stars,
        primaryTarget: slot.statId,
        secondaryTarget: null,
        completed: false,
        locked: false,
        fromDailyPlan: true,
        dailyPlanDate: todayStr,
        d10Roll: d10Roll,
        createdAt: new Date().toISOString()
      });
    });

    if (newOneshots.length > 0) {
      setOneshots(prev => [...newOneshots, ...prev]);
    }
  };

  // 9. Modal Add/Edit Handlers
  const handleSaveModal = (formData) => {
    const todayStr = getGameDate(settings.dayStartTime);

    if (modalType === 'attribute' || modalType === 'ability') {
      if (editData) {
        setStats(prev => prev.map(s => (s.id === editData.id ? { ...s, ...formData } : s)));
      } else {
        const newStat = {
          ...formData,
          id: 'stat_' + Date.now(),
          level: 1,
          xp: 0
        };
        setStats(prev => [...prev, newStat]);
      }
    } else if (modalType === 'habit') {
      if (editData) {
        setHabits(prev => prev.map(h => (h.id === editData.id ? { ...h, ...formData } : h)));
      } else {
        const newHabit = {
          ...formData,
          id: 'habit_' + Date.now(),
          streak: 0,
          locked: false,
          createdAt: new Date().toISOString()
        };
        setHabits(prev => [...prev, newHabit]);
      }
    } else if (modalType === 'oneshot') {
      if (editData) {
        setOneshots(prev => prev.map(o => (o.id === editData.id ? { ...o, ...formData } : o)));
      } else {
        const newOneshot = {
          ...formData,
          id: 'oneshot_' + Date.now(),
          locked: false,
          createdAt: new Date().toISOString()
        };
        setOneshots(prev => [...prev, newOneshot]);
      }
    } else if (modalType === 'quest') {
      if (editData) {
        setQuests(prev => prev.map(q => (q.id === editData.id ? { ...q, ...formData } : q)));
      } else {
        const newQuest = {
          ...formData,
          id: 'quest_' + Date.now(),
          completed: false,
          createdAt: new Date().toISOString()
        };
        setQuests(prev => [...prev, newQuest]);
      }
    } else if (modalType === 'pomodoro') {
      setPomodoro(prev => ({
        ...prev,
        targetStatId: formData.targetStatId || prev.targetStatId,
        workDuration: formData.workDuration || prev.workDuration,
        xpPerSession: formData.xpPerSession || prev.xpPerSession
      }));
    } else if (modalType === 'food') {
      // Add shopping list food item
      const newItem = {
        id: 'shop_' + Date.now(),
        emoji: formData.emoji || '🍚',
        name: formData.name,
        completed: false
      };
      setInventory(prev => ({ ...prev, food: [...prev.food, newItem] }));
    } else if (modalType === 'home') {
      // Add shopping list house item
      const newItem = {
        id: 'shop_' + Date.now(),
        emoji: formData.emoji || '🏠',
        name: formData.name,
        completed: false
      };
      setInventory(prev => ({ ...prev, home: [...prev.home, newItem] }));
    } else if (modalType === 'weight') {
      setHealth(prev => ({
        ...prev,
        weight: { ...prev.weight, ...formData }
      }));
    } else if (modalType?.startsWith('health_')) {
      const field = modalType.split('_')[1];
      if (field === 'goal') {
        setHealth(prev => ({ ...prev, calories: { ...prev.calories, goal: formData.value } }));
      } else if (field === 'consumed') {
        setHealth(prev => ({ ...prev, calories: { ...prev.calories, consumed: prev.calories.consumed + formData.value } }));
      } else if (field === 'burned') {
        setHealth(prev => ({ ...prev, calories: { ...prev.calories, burned: prev.calories.burned + formData.value } }));
      } else if (field === 'steps') {
        setHealth(prev => ({ ...prev, steps: { ...prev.steps, current: formData.value } }));
      } else if (field === 'protein') {
        setHealth(prev => ({ ...prev, proteins: { ...prev.proteins, goal: formData.value } }));
      } else if (field === 'water') {
        // value is goal in cups
        setHealth(prev => ({ ...prev, water: { ...prev.water, goal: formData.value } }));
      }
    }
  };

  // Delete handler for global Edit Modal
  const handleDeleteModal = (id) => {
    if (modalType === 'attribute' || modalType === 'ability') {
      handleDeleteStat(id);
    } else if (modalType === 'habit') {
      handleDeleteHabit(id);
    } else if (modalType === 'oneshot') {
      handleDeleteOneshot(id);
    } else if (modalType === 'quest') {
      handleDeleteQuest(id);
    }
  };

  // 10. Preset Challenge Activation
  const handleActivateChallenge = (tmpl) => {
    const subquests = tmpl.generateSubquests();
    const newQuest = {
      id: 'quest_challenge_' + Date.now(),
      name: tmpl.name,
      description: tmpl.description,
      emoji: tmpl.icon || '🏆',
      difficulty: tmpl.stars || 3,
      primaryTarget: tmpl.primaryStatId,
      secondaryTarget: 'con',
      completed: false,
      createdAt: new Date().toISOString(),
      subquests
    };
    setQuests(prev => [...prev, newQuest]);
    alert(`⚔️ CAMPAGNA SFIDA ATTIVATA! "${tmpl.name}" è stata aggiunta alla scheda Campagne.`);
  };

  // 11. Database Actions (FileSystem API bindings)
  const handleLinkDatabase = async () => {
    const fullStateObj = {
      player, stats, habits, oneshots, quests, completionLog, xpLog, pomodoro, inventory, health, settings
    };
    const handle = await linkDatabaseFile(fullStateObj);
    if (handle) {
      setFileHandle(handle);
      alert(`🟢 Database file collegato correttamente: ${handle.name}`);
    }
  };

  const handleReconnectDatabase = async () => {
    const handle = await loadFileHandleOnStart();
    if (handle) {
      const granted = await verifyPermission(handle, true);
      if (granted) {
        setFileHandle(handle);
        alert(`🔌 Connesso a: ${handle.name}`);
      } else {
        alert(`❌ Permessi non accordati.`);
      }
    } else {
      alert(`⚠️ Nessun file da riconnettere.`);
    }
  };

  // Import / Export
  const handleExport = () => {
    const fullStateObj = {
      player, stats, habits, oneshots, quests, completionLog, xpLog, pomodoro, inventory, health, settings
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullStateObj, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `rpg-life-backup-${new Date().toISOString().split('T')[0]}.json`);
    dlAnchorElem.click();
  };

  const handleImport = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const parsed = JSON.parse(evt.target.result);
          const sanitized = sanitizeState(parsed);
          
          setPlayer(sanitized.player);
          setStats(sanitized.stats);
          setHabits(sanitized.habits);
          setOneshots(sanitized.oneshots);
          setQuests(sanitized.quests);
          setCompletionLog(sanitized.completionLog);
          setXpLog(sanitized.xpLog);
          setPomodoro(sanitized.pomodoro);
          setInventory(sanitized.inventory);
          setHealth(sanitized.health);
          setSettings(sanitized.settings);

          alert("📥 Dati importati correttamente!");
        } catch (err) {
          alert("❌ Errore nel caricamento del file JSON.");
        }
      };
      reader.readAsText(file);
    };
    fileInput.click();
  };

  // Maintenance Handlers
  const handleFixData = () => {
    // Repair completionLog entries
    setCompletionLog(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(key => {
        if (!next[key] || typeof next[key] !== 'object' || Array.isArray(next[key])) {
          next[key] = { habits: [], oneshots: [], quests: [] };
        }
      });
      return next;
    });
    alert("🔧 Database sanificato e riparato con successo.");
  };

  const handleRepairStreaks = () => {
    // Basic streak recount algorithm
    let count = 0;
    const todayStr = getGameDate(settings.dayStartTime);
    
    // Sort completions chronologically
    const completedDates = Object.keys(completionLog).sort();
    
    // Recount habit streaks
    const updatedHabits = habits.map(h => {
      let streak = 0;
      // Loop backwards from today
      const testDate = getGameDateObj(settings.dayStartTime);
      while (true) {
        const dateStr = formatISO(testDate);
        if (completionLog[dateStr]?.habits?.includes(h.id)) {
          streak++;
          testDate.setDate(testDate.getDate() - 1);
        } else {
          // If missed today, we check yesterday
          if (dateStr === todayStr) {
            testDate.setDate(testDate.getDate() - 1);
            continue;
          }
          break;
        }
      }
      return { ...h, streak };
    });

    setHabits(updatedHabits);
    alert("🔥 Serie delle abitudini ricalcolate correttamente.");
  };

  const handleReset = () => {
    if (window.confirm("Sei sicuro di voler cancellare tutto? I tuoi dati andranno persi permanente!")) {
      localStorage.removeItem('questlife_state_v2');
      window.location.reload();
    }
  };

  // Form open helpers
  const handleOpenModal = (type, data = null) => {
    setModalType(type);
    setEditData(data);
    setModalOpen(true);
  };

  // Render currently active tab view
  const renderActiveTab = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomeTab
            stats={stats}
            setStats={setStats}
            xpLog={xpLog}
            player={player}
            health={health}
            pomodoro={pomodoro}
            dailyActions={dailyActions}
            onToggleDailyAction={handleToggleDailyAction}
            onOpenModal={handleOpenModal}
            onDeleteStat={(id) => setStats(prev => prev.filter(s => s.id !== id))}
            onEditStat={(data) => handleOpenModal(data.type, data)}
            onOpenPlanner={() => setShowPlannerModal(true)}
            onOpenPomodoro={() => handleOpenModal('pomodoro')}
            onOpenStatDetail={(stat) => handleOpenModal('stat_detail', stat)}
          />
        );
      case 'habits':
        return (
          <HabitsTab
            habits={habits}
            completionLog={completionLog}
            setCompletionLog={setCompletionLog}
            onToggleHabit={handleToggleHabit}
            onOpenModal={handleOpenModal}
            onDeleteHabit={(id) => setHabits(prev => prev.filter(h => h.id !== id))}
            onEditHabit={(data) => handleOpenModal('habit', data)}
            pomodoro={pomodoro}
            setPomodoro={setPomodoro}
            stats={stats}
            onRewardXp={handleRewardXp}
            settings={settings}
          />
        );
      case 'missions':
      case 'oneshots':
      case 'quests':
        return (
          <MissionsTab
            oneshots={oneshots}
            onToggleOneshot={handleToggleOneshot}
            onDeleteOneshot={(id) => setOneshots(prev => prev.filter(o => o.id !== id))}
            onEditOneshot={(data) => handleOpenModal('oneshot', data)}
            quests={quests}
            onToggleSubquest={handleToggleSubquest}
            onDeleteQuest={(id) => setQuests(prev => prev.filter(q => q.id !== id))}
            onEditQuest={(data) => handleOpenModal('quest', data)}
            onOpenModal={handleOpenModal}
            stats={stats}
            settings={settings}
            onOpenDailyPlanner={() => setShowPlannerModal(true)}
            onActivateChallenge={handleActivateChallenge}
          />
        );
      case 'nutrition':
        return (
          <NutritionTab
            health={health}
            setHealth={setHealth}
            inventory={inventory}
            setInventory={setInventory}
            onOpenModal={handleOpenModal}
            stats={stats}
            onRewardXp={handleRewardXp}
          />
        );
      case 'settings':
        return (
          <SettingsTab
            settings={settings}
            setSettings={setSettings}
            player={player}
            setPlayer={setPlayer}
            xpLog={xpLog}
            fileHandle={fileHandle}
            onLinkDatabase={handleLinkDatabase}
            onReconnectDatabase={handleReconnectDatabase}
            onExport={handleExport}
            onImport={handleImport}
            onFixData={handleFixData}
            onRepairStreaks={handleRepairStreaks}
            onReset={handleReset}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="app-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        maxWidth: '480px',
        margin: '0 auto',
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)'
      }}
    >
      {/* PWA Update Floating Banner */}
      {updateAvailable && (
        <div
          onClick={() => forceUpdateApp(false)}
          style={{
            position: 'fixed',
            top: '12px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 99999,
            width: 'calc(100% - 32px)',
            maxWidth: '440px',
            background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
            color: 'white',
            padding: '10px 14px',
            borderRadius: '16px',
            boxShadow: '0 10px 30px rgba(124, 58, 237, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold',
            boxSizing: 'border-box'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>🚀</span>
            <span>Nuova versione v{latestVersion} pronta!</span>
          </div>
          <span style={{ background: 'rgba(255,255,255,0.25)', padding: '4px 10px', borderRadius: '10px', fontSize: '11px' }}>
            Aggiorna Ora 🔄
          </span>
        </div>
      )}

      {/* Upper header */}
      <div style={{ flexShrink: 0, width: '100%', zIndex: 40 }}>
        <Header
          player={player}
          setPlayer={setPlayer}
          stats={stats}
          completionLog={completionLog}
          xpLog={xpLog}
          settings={settings}
          onOpenMottoEdit={() => setShowMottoModal(true)}
        />
      </div>

      {/* Primary content area (Bounded strictly between Header and BottomNav) */}
      <main
        className="content-area"
        style={{
          flex: 1,
          minHeight: 0,
          width: '100%',
          overflowY: 'auto',
          padding: '16px 16px 28px 16px',
          boxSizing: 'border-box',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {renderActiveTab()}
      </main>

      {/* Lower bottom navigation */}
      <div style={{ flexShrink: 0, width: '100%', zIndex: 40 }}>
        <BottomNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          avatarEmoji={player.avatarEmoji}
          avatarImage={player.avatarImage}
          avatarType={player.avatarType}
        />
      </div>

      {/* Global generic Modal creator */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        type={modalType}
        editData={editData}
        onSave={handleSaveModal}
        onDelete={handleDeleteModal}
        stats={stats}
      />

      {/* PERSONAL MOTTO MODAL EDIT */}
      {showMottoModal && (
        <div
          onClick={() => setShowMottoModal(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-bg-main border border-border-color rounded-2xl shadow-2xl animate-scale-up"
          >
            <div className="px-5 py-4 border-b border-border-color/50 flex justify-between items-center">
              <h3 className="font-bold text-text-main text-base font-cinzel">✍️ Modifica Motto</h3>
              <button onClick={() => setShowMottoModal(false)} className="text-text-secondary">✕</button>
            </div>
            <div className="p-5">
              <input
                type="text"
                value={mottoText}
                onChange={(e) => setMottoText(e.target.value)}
                placeholder="Digita il tuo motto personale..."
                className="w-full bg-slate-950/40 border border-border-color rounded px-3 py-2 text-sm text-text-main focus:outline-none"
                maxLength="50"
              />
              <div className="flex justify-end gap-2.5 mt-5">
                <button
                  onClick={() => setShowMottoModal(false)}
                  className="px-4 py-2 border border-border-color rounded text-xs text-text-secondary"
                >
                  Annulla
                </button>
                <button
                  onClick={() => {
                    setPlayer(prev => ({ ...prev, motto: mottoText }));
                    setShowMottoModal(false);
                  }}
                  className="px-5 py-2 bg-accent-primary hover:brightness-110 text-white rounded text-xs font-bold"
                >
                  Salva
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DAILY PLANNER (🎲 È il tuo turno!) MODAL */}
      <DailyPlannerModal
        isOpen={showPlannerModal}
        onClose={() => setShowPlannerModal(false)}
        onSave={handleSaveDailyPlan}
        stats={stats}
      />
    </div>
  );
}
