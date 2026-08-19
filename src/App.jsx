import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import Modal from './components/Modal';
import DailyPlannerModal from './components/DailyPlannerModal';
import HomeTab from './tabs/HomeTab';
import HabitsTab from './tabs/HabitsTab';
import MissionsTab from './tabs/MissionsTab';
import NutritionTab from './tabs/NutritionTab';
import SettingsTab from './tabs/SettingsTab';

import { APP_VERSION } from './utils/constants';
import { getInitialState, sanitizeState } from './utils/state';
import { getGameDate, getGameDateObj, formatISO, calculateLevelFromXp, getXpForLevel, getCumulativeXpForLevel, getWeekIdentifier, getMonthIdentifier, forceUpdateApp } from './utils/helpers';
import { loadFileHandleOnStart, saveDataToFile, verifyPermission, linkDatabaseFile } from './utils/storage';
import { onUpdateAvailable } from './utils/pwaManager';

class TabErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Tab Render Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '70vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '30px 20px',
          textAlign: 'center',
          color: 'var(--text-primary)'
        }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>⚠️</div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 'bold' }}>
            Si è verificato un problema di caricamento
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '340px', marginBottom: '20px', lineHeight: '1.4' }}>
            {this.state.error?.message || this.state.error?.toString() || 'Errore imprevisto di rendering.'}
          </p>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 'bold',
              border: 'none',
              cursor: 'pointer',
              background: 'var(--accent-primary)',
              color: '#ffffff',
              display: 'inline-block',
              width: 'auto'
            }}
          >
            🔄 Ripristina Schermata
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

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
  const [showGlobalWorkoutsLog, setShowGlobalWorkoutsLog] = useState(false);
  const [showGlobalMealsLog, setShowGlobalMealsLog] = useState(false);

  const handleOpenWorkoutsLog = () => {
    setShowGlobalWorkoutsLog(true);
  };

  const handleOpenMealsLog = () => {
    setShowGlobalMealsLog(true);
  };

  // Version Auto-Check hook
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [latestVersion, setLatestVersion] = useState(APP_VERSION);

  useEffect(() => {
    onUpdateAvailable((newVersion) => {
      if (newVersion && newVersion !== APP_VERSION) {
        setLatestVersion(newVersion);
        setUpdateAvailable(true);
      } else {
        setUpdateAvailable(false);
      }
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

  // Prevent contextmenu callout popups on long-press (except in inputs & textareas)
  useEffect(() => {
    const handleContextMenu = (e) => {
      const tagName = (e.target?.tagName || '').toUpperCase();
      if (tagName !== 'INPUT' && tagName !== 'TEXTAREA') {
        e.preventDefault();
      }
    };
    window.addEventListener('contextmenu', handleContextMenu, { capture: true });
    return () => window.removeEventListener('contextmenu', handleContextMenu, { capture: true });
  }, []);

  // 6. Rollover check (Check if day rolled over)
  useEffect(() => {
    const todayStr = getGameDate(settings.dayStartTime);
    
    // Handle first login setup
    if (!player.lastAccessDate) {
      setPlayer(prev => ({ ...prev, lastAccessDate: todayStr }));
      if (settings.enableDailyPlanner !== false) {
        setShowPlannerModal(true);
      }
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

    // Update last access date smoothly (no habit streak resets or XP penalties)
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
  const handleRewardXp = (statId, amount, countsForMonthlyMedal = false, itemTitle = '', logDate = null) => {
    if (!amount || amount <= 0) return;
    const todayStr = getGameDate(settings.dayStartTime);
    const effectiveDate = logDate || todayStr;

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

    // Monthly challenge points (EXCLUDE habits, INCLUDE task singoli, milestones, e campagne)
    let monthlyPointsAdd = countsForMonthlyMedal ? 1 : 0;

    const titleToSave = (itemTitle && itemTitle.trim() !== '') ? itemTitle.trim() : '';

    // Log XP change with effectiveDate
    setXpLog(prev => [
      ...prev,
      { date: effectiveDate, statId, amount, timestamp: Date.now(), title: titleToSave, source: titleToSave }
    ]);

    setPlayer(prev => {
      const nextMonthlyPoints = (prev.monthlyChallenge?.points || 0) + monthlyPointsAdd;
      const target = prev.monthlyChallenge?.target || 50;
      const medals = [...(prev.monthlyChallenge?.medals || [])];

      // Check monthly medal milestone
      if (nextMonthlyPoints >= target && (prev.monthlyChallenge?.points || 0) < target) {
        const monthId = getMonthIdentifier(effectiveDate);
        const medalId = monthId;
        if (!medals.some(m => m.id === medalId)) {
          medals.push({
            id: medalId,
            name: `Medaglia di ${new Date().toLocaleString('it-IT', { month: 'long' })}`,
            icon: '🏅',
            earnedDate: effectiveDate
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

  // 7b. XP Deduction Handler (when an item is unchecked / canceled)
  const handleDeductXp = (statId, amount, countsForMonthlyMedal = false, itemTitle = '', logDate = null) => {
    if (!amount || amount <= 0) return;
    const todayStr = getGameDate(settings.dayStartTime);
    const effectiveDate = logDate || todayStr;

    // 1. Deduct Stat XP
    setStats(prevStats =>
      prevStats.map(s => {
        if (s.id !== statId) return s;
        let currentXp = s.xp;
        let currentLvl = s.level;

        let newXp = currentXp - amount;
        while (newXp < 0 && currentLvl > 1) {
          currentLvl -= 1;
          const prevNeeded = getXpForLevel(currentLvl + 1);
          newXp += prevNeeded;
        }
        if (currentLvl === 1 && newXp < 0) {
          newXp = 0;
        }
        return { ...s, xp: newXp, level: currentLvl };
      })
    );

    // 2. Deduct Player Total XP
    setPlayer(prev => {
      const newTotalXp = Math.max(0, prev.totalXp - amount);
      const newLvl = calculateLevelFromXp(newTotalXp);
      let monthlyPointsSub = countsForMonthlyMedal ? 1 : 0;
      const nextMonthlyPoints = Math.max(0, (prev.monthlyChallenge?.points || 0) - monthlyPointsSub);

      return {
        ...prev,
        totalXp: newTotalXp,
        level: newLvl,
        monthlyChallenge: {
          ...prev.monthlyChallenge,
          points: nextMonthlyPoints
        }
      };
    });

    // 3. Remove log entry from xpLog
    setXpLog(prev => {
      let targetIndex = -1;

      // First search for an entry matching effectiveDate AND statId AND title/source
      if (itemTitle && itemTitle.trim() !== '') {
        const cleanTitle = itemTitle.trim();
        for (let i = prev.length - 1; i >= 0; i--) {
          const l = prev[i];
          if (l.date === effectiveDate && l.statId === statId && (l.title === cleanTitle || l.source === cleanTitle)) {
            targetIndex = i;
            break;
          }
        }
      }

      // If not found by exact title, search for the last entry matching effectiveDate AND statId
      if (targetIndex === -1) {
        for (let i = prev.length - 1; i >= 0; i--) {
          const l = prev[i];
          if (l.date === effectiveDate && l.statId === statId) {
            targetIndex = i;
            break;
          }
        }
      }

      if (targetIndex !== -1) {
        const nextLog = [...prev];
        nextLog.splice(targetIndex, 1);
        return nextLog;
      }
      return prev;
    });
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
    const targetDate = dateStr || todayStr;
    const isCompleted = completionLog[targetDate]?.habits?.includes(habitId);

    // Update Completion Log
    setCompletionLog(prev => {
      const dayLog = { habits: [], oneshots: [], quests: [], ...(prev[targetDate] || {}) };
      const list = [...dayLog.habits];
      const idx = list.indexOf(habitId);
      
      if (idx === -1) {
        list.push(habitId);
      } else {
        list.splice(idx, 1);
      }
      return { ...prev, [targetDate]: { ...dayLog, habits: list } };
    });

    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    const primaryXp = habit.difficulty * 4; // 1->5 stars awards 4/8/12/16/20 XP
    const secondaryXp = Math.round(primaryXp * 0.33);

    if (!isCompleted) {
      // Complete habit: add streak, reward primary and secondary targets XP
      handleRewardXp(habit.primaryTarget, primaryXp, true, habit.name, targetDate);
      if (habit.secondaryTarget) {
        handleRewardXp(habit.secondaryTarget, secondaryXp, false, habit.name, targetDate);
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
      // Uncheck habit: deduct XP & decrement streak & remove xpLog entry
      handleDeductXp(habit.primaryTarget, primaryXp, true, habit.name, targetDate);
      if (habit.secondaryTarget) {
        handleDeductXp(habit.secondaryTarget, secondaryXp, false, habit.name, targetDate);
      }

      setHabits(prev =>
        prev.map(h => (h.id === habitId ? { ...h, streak: Math.max(0, h.streak - 1) } : h))
      );
    }
  };

  const handleToggleOneshot = (id, dateStr) => {
    const os = oneshots.find(o => o.id === id);
    if (!os) return;

    const todayStr = getGameDate(settings.dayStartTime);
    const targetDate = dateStr || todayStr;

    // Check if completed on targetDate
    const isCompletedOnTarget = (completionLog[targetDate]?.oneshots?.includes(id)) || (targetDate === todayStr && os.completed);
    const willBeCompleted = !isCompletedOnTarget;

    setOneshots(prev =>
      prev.map(o => (o.id === id ? { ...o, completed: targetDate === todayStr ? willBeCompleted : o.completed } : o))
    );

    setCompletionLog(prev => {
      const dayLog = { habits: [], oneshots: [], quests: [], ...(prev[targetDate] || {}) };
      const list = [...dayLog.oneshots];
      const idx = list.indexOf(id);
      if (willBeCompleted && idx === -1) {
        list.push(id);
      } else if (!willBeCompleted && idx !== -1) {
        list.splice(idx, 1);
      }
      return { ...prev, [targetDate]: { ...dayLog, oneshots: list } };
    });

    // Calculate XP (oneshot awards difficulty * 8 XP!)
    let xp = os.difficulty * 8;
    if (os.d10Roll) {
      const bonusMultiplier = 1 + (os.d10Roll * 10) / 100;
      xp = Math.round(xp * bonusMultiplier);
    }

    if (willBeCompleted) {
      handleRewardXp(os.primaryTarget, xp, true, os.name, targetDate);
      if (os.secondaryTarget) {
        handleRewardXp(os.secondaryTarget, Math.round(xp * 0.33), false, os.name, targetDate);
      }
    } else {
      // Unchecking task: deduct XP & remove xpLog entry!
      handleDeductXp(os.primaryTarget, xp, true, os.name, targetDate);
      if (os.secondaryTarget) {
        handleDeductXp(os.secondaryTarget, Math.round(xp * 0.33), false, os.name, targetDate);
      }
    }
  };

  const handleToggleSubquest = (questId, subId) => {
    setQuests(prevQuests =>
      prevQuests.map(q => {
        if (q.id !== questId) return q;

        const subItem = q.subquests.find(sq => sq.id === subId);
        const subWasDone = subItem?.completed;
        const subWillBeDone = !subWasDone;

        const updatedSubs = q.subquests.map(sq =>
          sq.id === subId ? { ...sq, completed: subWillBeDone } : sq
        );

        // Milestone reward/deduct: awards 10 XP + 1 monthly medal point
        if (subWillBeDone) {
          handleRewardXp(q.primaryTarget, 10, true, subItem?.name || 'Milestone');
        } else {
          handleDeductXp(q.primaryTarget, 10, true, subItem?.name || 'Milestone');
        }

        // Check if all subquests are completed now
        const allDone = updatedSubs.length > 0 && updatedSubs.every(sq => sq.completed);
        const wasDone = q.completed;

        if (allDone && !wasDone) {
          // Reward massive Campaign Completion XP! (difficulty * 35 XP) + 1 monthly medal point
          const xpReward = q.difficulty * 35;
          handleRewardXp(q.primaryTarget, xpReward, true, q.name);
          if (q.secondaryTarget) {
            handleRewardXp(q.secondaryTarget, Math.round(xpReward * 0.33), false, q.name);
          }
          alert(`🏆 CAMPAGNA COMPLETATA! "${q.name}" è finita! Hai guadagnato +${xpReward} XP!`);
        } else if (!allDone && wasDone) {
          // Deduct Campaign Completion XP if uncompleted
          const xpReward = q.difficulty * 35;
          handleDeductXp(q.primaryTarget, xpReward, true, q.name);
          if (q.secondaryTarget) {
            handleDeductXp(q.secondaryTarget, Math.round(xpReward * 0.33), false, q.name);
          }
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

    const updatedOneshotIds = new Set();

    Object.entries(slots).forEach(([key, slot]) => {
      const name = slot.name.trim();
      if (!name) return;

      const chosenEmoji = slot.emoji || slotIcons[key];

      if (slot.oneshotId) {
        updatedOneshotIds.add(slot.oneshotId);
        setOneshots(prev => prev.map(o => {
          if (o.id === slot.oneshotId) {
            return {
              ...o,
              name: name,
              emoji: chosenEmoji,
              slotType: key,
              difficulty: slot.stars || o.difficulty,
              stars: slot.stars || o.stars || o.difficulty,
              primaryTarget: slot.statId || o.primaryTarget,
              secondaryTarget: slot.secondaryStatId || o.secondaryTarget || null,
              scheduledCount: (o.scheduledCount || 0) + 1,
              fromDailyPlan: true,
              dailyPlanDate: todayStr,
              d10Roll: d10Roll,
              locked: false,
              completed: false
            };
          }
          return o;
        }));
      } else {
        newOneshots.push({
          id: 'dp-' + Date.now() + '-' + key,
          name: name,
          emoji: chosenEmoji,
          slotType: key,
          difficulty: slot.stars,
          stars: slot.stars,
          primaryTarget: slot.statId,
          secondaryTarget: slot.secondaryStatId || null,
          completed: false,
          locked: false,
          fromDailyPlan: true,
          dailyPlanDate: todayStr,
          d10Roll: d10Roll,
          scheduledCount: 1,
          createdAt: new Date().toISOString()
        });
      }
    });

    if (newOneshots.length > 0) {
      setOneshots(prev => [...newOneshots, ...prev]);
    }
  };

  // 9. Modal Add/Edit Handlers
  const handleSaveModal = (formData) => {
    const todayStr = getGameDate(settings.dayStartTime);
    const targetType = formData._targetType || formData.type || modalType;

    if (targetType === 'attribute' || targetType === 'ability') {
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
    } else if (targetType === 'habit') {
      const diff = formData.difficulty !== undefined ? formData.difficulty : (formData.stars !== undefined ? formData.stars : 3);
      const dataToSave = { ...formData, difficulty: diff, stars: diff };
      if (editData) {
        setHabits(prev => prev.map(h => (h.id === editData.id ? { ...h, ...dataToSave } : h)));
      } else {
        const newHabit = {
          ...dataToSave,
          id: 'habit_' + Date.now(),
          streak: 0,
          locked: false,
          createdAt: new Date().toISOString()
        };
        setHabits(prev => [...prev, newHabit]);
      }
    } else if (targetType === 'oneshot') {
      const diff = formData.difficulty !== undefined ? formData.difficulty : (formData.stars !== undefined ? formData.stars : 3);
      const dataToSave = { ...formData, difficulty: diff, stars: diff };
      if (editData) {
        setOneshots(prev => prev.map(o => (o.id === editData.id ? { ...o, ...dataToSave } : o)));
      } else {
        const newOneshot = {
          ...dataToSave,
          id: 'oneshot_' + Date.now(),
          locked: false,
          createdAt: new Date().toISOString()
        };
        setOneshots(prev => [...prev, newOneshot]);
      }
    } else if (targetType === 'quest') {
      const diff = formData.difficulty !== undefined ? formData.difficulty : (formData.stars !== undefined ? formData.stars : 3);
      const dataToSave = { ...formData, difficulty: diff, stars: diff };
      if (editData) {
        setQuests(prev => prev.map(q => (q.id === editData.id ? { ...q, ...dataToSave } : q)));
      } else {
        const newQuest = {
          ...dataToSave,
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
    } else if (modalType === 'food' || targetType === 'food') {
      const newFoodItem = {
        id: editData?.id || ('fd_' + Date.now()),
        emoji: formData.emoji || '🍏',
        name: formData.name || 'Cibo',
        baseGrams: formData.baseGrams !== undefined ? Number(formData.baseGrams) : 100,
        baseCalories: formData.baseCalories !== undefined ? Number(formData.baseCalories) : 0,
        baseProteins: formData.baseProteins !== undefined ? Number(formData.baseProteins) : 0,
        pieceCalories: formData.pieceCalories !== '' && formData.pieceCalories !== undefined ? Number(formData.pieceCalories) : null,
        pieceProteins: formData.pieceProteins !== '' && formData.pieceProteins !== undefined ? Number(formData.pieceProteins) : null,
        category: formData.category || 'snack'
      };

      setHealth(prev => {
        const existingDb = prev.foodDatabase || [];
        const isEdit = existingDb.some(f => f.id === newFoodItem.id);
        const updatedDb = isEdit
          ? existingDb.map(f => (f.id === newFoodItem.id ? newFoodItem : f))
          : [...existingDb, newFoodItem];
        return {
          ...prev,
          foodDatabase: updatedDb
        };
      });
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
      const curW = formData.current !== undefined ? Number(formData.current) : undefined;
      const fatP = formData.currentFat !== undefined ? Number(formData.currentFat) : undefined;
      const leanP = formData.currentLean !== undefined ? Number(formData.currentLean) : undefined;

      setHealth(prev => ({
        ...prev,
        weight: {
          ...prev.weight,
          current: curW !== undefined ? curW : prev.weight.current,
          currentFat: fatP !== undefined ? fatP : prev.weight.currentFat,
          currentLean: leanP !== undefined ? leanP : prev.weight.currentLean
        },
        calcFatPct: fatP !== undefined ? fatP : prev.calcFatPct
      }));
    } else if (modalType?.startsWith('health_')) {
      const field = modalType.split('_')[1];
      if (field === 'goal' || field === 'goals') {
        setHealth(prev => ({
          ...prev,
          calcGoalType: formData.calcGoalType || prev.calcGoalType || 'lose',
          calcGender: formData.calcGender || prev.calcGender || 'male',
          calcAge: formData.calcAge !== undefined ? Number(formData.calcAge) : (prev.calcAge || 28),
          calcHeight: formData.calcHeight !== undefined ? Number(formData.calcHeight) : (prev.calcHeight || 175),
          calcActivity: formData.calcActivity !== undefined ? Number(formData.calcActivity) : (prev.calcActivity || 1.375),
          calcFatPct: formData.calcFatPct !== undefined ? formData.calcFatPct : (prev.calcFatPct || ''),
          calories: { ...prev.calories, goal: Number(formData.calorieGoal !== undefined ? formData.calorieGoal : formData.value) || prev.calories.goal },
          proteins: { ...prev.proteins, goal: Number(formData.proteinGoal) || prev.proteins.goal },
          water: { ...prev.water, goal: Number(formData.waterGoal) || prev.water.goal },
          steps: { ...prev.steps, goal: Number(formData.stepGoal) || prev.steps.goal },
          weight: { ...prev.weight, target: Number(formData.targetWeight) || prev.weight.target }
        }));
      } else if (field === 'consumed') {
        setHealth(prev => ({ ...prev, calories: { ...prev.calories, consumed: (prev.calories.consumed || 0) + (Number(formData.value) || 0) } }));
      } else if (field === 'burned') {
        setHealth(prev => ({ ...prev, calories: { ...prev.calories, burned: (prev.calories.burned || 0) + (Number(formData.value) || 0) } }));
      } else if (field === 'steps') {
        setHealth(prev => ({ ...prev, steps: { ...prev.steps, current: formData.value } }));
      } else if (field === 'protein') {
        setHealth(prev => ({ ...prev, proteins: { ...prev.proteins, goal: formData.value } }));
      } else if (field === 'proteins') {
        setHealth(prev => ({ ...prev, proteins: { ...prev.proteins, consumed: formData.value } }));
      } else if (field === 'water' || field === 'water_goal') {
        setHealth(prev => ({ ...prev, water: { ...prev.water, consumed: Number(formData.value !== undefined ? formData.value : prev.water.consumed) } }));
      }
    }
  };

  const handleDeleteStat = (id) => {
    setStats(prev => prev.filter(s => s.id !== id));
  };

  const handleDeleteHabit = (id) => {
    setHabits(prev => prev.filter(h => h.id !== id));
    setDailyActions(prev => prev.filter(aId => aId !== id));
  };

  const handleDeleteOneshot = (id) => {
    setOneshots(prev => prev.filter(o => o.id !== id));
    setDailyActions(prev => prev.filter(aId => aId !== id));
  };

  const handleDeleteQuest = (id) => {
    setQuests(prev => prev.filter(q => q.id !== id));
    setDailyActions(prev => prev.filter(aId => aId !== id));
  };

  // Delete handler for global Edit Modal
  const handleDeleteModal = (idOrObj) => {
    const targetId = typeof idOrObj === 'object' ? idOrObj.id : idOrObj;
    const targetType = editData?.type || modalType;
    if (targetType === 'attribute' || targetType === 'ability') {
      handleDeleteStat(targetId);
    } else if (targetType === 'habit') {
      handleDeleteHabit(targetId);
    } else if (targetType === 'oneshot') {
      handleDeleteOneshot(targetId);
    } else if (targetType === 'quest') {
      handleDeleteQuest(targetId);
    } else if (targetType === 'food' || modalType === 'food') {
      if (targetId) {
        setHealth(prev => ({
          ...prev,
          foodDatabase: (prev.foodDatabase || []).filter(f => f.id !== targetId)
        }));
      }
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
  const handleExport = async () => {
    try {
      const fullStateObj = {
        player, stats, habits, oneshots, quests, completionLog, xpLog, pomodoro, inventory, health, settings
      };
      const jsonStr = JSON.stringify(fullStateObj, null, 2);
      const filename = `rpg-life-backup-${new Date().toISOString().split('T')[0]}.json`;
      const blob = new Blob([jsonStr], { type: 'application/json' });

      // iOS Web Share API support (opens native Share sheet to save directly to Files)
      if (navigator.canShare && navigator.canShare({ files: [new File([blob], filename, { type: 'application/json' })] })) {
        try {
          const file = new File([blob], filename, { type: 'application/json' });
          await navigator.share({
            files: [file],
            title: 'RPG Life Backup',
            text: 'Backup file di RPG Life'
          });
          return;
        } catch (shareErr) {
          if (shareErr.name === 'AbortError') return;
        }
      }

      // Standard Blob URL download
      const url = URL.createObjectURL(blob);
      const dlAnchorElem = document.createElement('a');
      dlAnchorElem.href = url;
      dlAnchorElem.download = filename;
      document.body.appendChild(dlAnchorElem);
      dlAnchorElem.click();
      setTimeout(() => {
        document.body.removeChild(dlAnchorElem);
        URL.revokeObjectURL(url);
      }, 1000);
    } catch (err) {
      alert(`⚠️ Errore durante l'esportazione: ${err.message}`);
    }
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

  const handleApplyPresetDay = (preset) => {
    if (!preset || !preset.slots) return;
    const todayStr = new Date().toISOString().split('T')[0];
    
    setHealth(prev => ({
      ...prev,
      dailyActions: {
        ...(prev.dailyActions || {}),
        [todayStr]: {
          ...(prev.dailyActions?.[todayStr] || {}),
          action: preset.slots.action?.name || '',
          bonus: preset.slots.bonus?.name || '',
          movement: preset.slots.movement?.name || '',
          reaction: preset.slots.reaction?.name || '',
          presetName: preset.name
        }
      }
    }));

    alert(`⚡ Routine "${preset.name || 'Giornata Tipo'}" applicata per oggi! 🎉`);
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
            setHealth={setHealth}
            pomodoro={pomodoro}
            oneshots={oneshots}
            onToggleOneshot={handleToggleOneshot}
            habits={habits}
            onToggleHabit={handleToggleHabit}
            dailyActions={dailyActions}
            onToggleDailyAction={handleToggleDailyAction}
            completionLog={completionLog}
            onOpenModal={handleOpenModal}
            onDeleteStat={handleDeleteStat}
            onEditStat={(data) => handleOpenModal(data.type, data)}
            onOpenPlanner={() => setShowPlannerModal(true)}
            onOpenPomodoro={() => handleOpenModal('pomodoro')}
            onOpenStatDetail={(stat) => handleOpenModal('stat_detail', stat)}
            onOpenWorkoutsLog={handleOpenWorkoutsLog}
            onOpenMealsLog={handleOpenMealsLog}
            settings={settings}
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
            onDeleteHabit={handleDeleteHabit}
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
            onDeleteOneshot={handleDeleteOneshot}
            onEditOneshot={(data) => handleOpenModal('oneshot', data)}
            quests={quests}
            onToggleSubquest={handleToggleSubquest}
            onDeleteQuest={handleDeleteQuest}
            onEditQuest={(data) => handleOpenModal('quest', data)}
            onOpenModal={handleOpenModal}
            completionLog={completionLog}
            stats={stats}
            settings={settings}
            onOpenDailyPlanner={() => setShowPlannerModal(true)}
            onActivateChallenge={handleActivateChallenge}
          />
        );
      case 'nutrition':
        return (
          <NutritionTab
            activeTab={activeTab}
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
            stats={stats}
            fileHandle={fileHandle}
            onLinkDatabase={handleLinkDatabase}
            onReconnectDatabase={handleReconnectDatabase}
            onExport={handleExport}
            onImport={handleImport}
            onFixData={handleFixData}
            onRepairStreaks={handleRepairStreaks}
            onReset={handleReset}
            onApplyPresetDay={handleApplyPresetDay}
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
          onClick={() => {
            setUpdateAvailable(false);
            forceUpdateApp(false);
          }}
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
          habits={habits}
          oneshots={oneshots}
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
          overflowY: activeTab === 'home' ? 'hidden' : 'auto',
          touchAction: activeTab === 'home' ? 'none' : 'pan-y',
          overscrollBehavior: 'none',
          padding: activeTab === 'home' ? '8px 16px 12px 16px' : '16px 16px 28px 16px',
          boxSizing: 'border-box',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <TabErrorBoundary key={activeTab}>
          {renderActiveTab()}
        </TabErrorBoundary>
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
        xpLog={xpLog}
        oneshots={oneshots}
        habits={habits}
        quests={quests}
        settings={settings}
        onEditStat={(statData) => {
          setModalOpen(false);
          setTimeout(() => {
            handleOpenModal(statData.type || 'attribute', statData);
          }, 50);
        }}
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
            <div className="px-5 py-4 border-b border-border-color/50 flex justify-center items-center text-center">
              <h3 className="font-bold text-text-main text-base font-cinzel">✍️ Modifica Motto</h3>
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

      {/* GLOBAL WORKOUTS LOG MODAL */}
      {showGlobalWorkoutsLog && health && (
        <NutritionTab
          activeTab={activeTab}
          health={health}
          setHealth={setHealth}
          inventory={inventory || {}}
          setInventory={setInventory}
          onOpenModal={handleOpenModal}
          stats={stats}
          onRewardXp={handleRewardXp}
          initialModal="workouts"
          onlyModal={true}
          onCloseOverlay={() => setShowGlobalWorkoutsLog(false)}
        />
      )}

      {/* GLOBAL MEALS LOG MODAL */}
      {showGlobalMealsLog && health && (
        <NutritionTab
          activeTab={activeTab}
          health={health}
          setHealth={setHealth}
          inventory={inventory || {}}
          setInventory={setInventory}
          onOpenModal={handleOpenModal}
          stats={stats}
          onRewardXp={handleRewardXp}
          initialModal="meals"
          onlyModal={true}
          onCloseOverlay={() => setShowGlobalMealsLog(false)}
        />
      )}

      {/* DAILY PLANNER (🎲 È il tuo turno!) MODAL */}
      <DailyPlannerModal
        isOpen={showPlannerModal}
        onClose={() => setShowPlannerModal(false)}
        onSave={handleSaveDailyPlan}
        stats={stats}
        oneshots={oneshots}
        quests={quests}
      />
    </div>
  );
}
