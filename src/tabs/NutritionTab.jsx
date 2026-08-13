import React, { useState } from 'react';

export default function NutritionTab({
  health,
  setHealth,
  inventory,
  setInventory,
  onOpenModal,
  stats,
  onRewardXp
}) {
  const [activeMainTab, setActiveMainTab] = useState('health'); // 'health' | 'shopping'
  const [activeInventoryTab, setActiveInventoryTab] = useState('food'); // 'food' | 'home'
  const [showMealsModal, setShowMealsModal] = useState(false);
  const [showExercisesModal, setShowExercisesModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [activeMealCategory, setActiveMealCategory] = useState('lunch');
  const [newShopItemName, setNewShopItemName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Calorie calculations
  const calorieGoal = health.calories.goal || 1600;
  const caloriesConsumed = health.calories.consumed || 0;
  const caloriesBurned = health.calories.burned || 0;
  const caloriesRemaining = Math.max(0, calorieGoal - caloriesConsumed + caloriesBurned);

  // Calorie SVG progress percent
  const caloriePct = Math.min(1.0, caloriesConsumed / (calorieGoal + caloriesBurned || 1));
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const dashoffset = circumference * (1 - caloriePct);

  // Steps progress
  const stepsGoal = health.steps.goal || 10000;
  const stepsCurrent = health.steps.current || 0;
  const stepsPct = Math.min(100, (stepsCurrent / stepsGoal) * 100);

  // Proteins progress
  const proteinsGoal = health.proteins.goal || 100;
  const proteinsCurrent = health.proteins.consumed || 0;
  const proteinsPct = Math.min(100, (proteinsCurrent / proteinsGoal) * 100);

  // Water progress
  const waterGoal = health.water.goal || 8;
  const waterCurrent = health.water.consumed || 0;
  const waterPct = Math.min(100, (waterCurrent / waterGoal) * 100);

  // Weight mass calculations
  const weightCurrent = health.weight.current || 75;
  const targetWeight = health.weight.target || 70;
  const leanPct = health.weight.currentLean || 0;
  const fatPct = health.weight.currentFat || 0;

  // Quick Action Helpers
  const quickAddWater = (delta = 1) => {
    setHealth(prev => ({
      ...prev,
      water: {
        ...prev.water,
        consumed: Math.max(0, Math.min(prev.water.goal * 3, (prev.water.consumed || 0) + delta))
      }
    }));
  };

  const quickAddSteps = (amount) => {
    setHealth(prev => ({
      ...prev,
      steps: {
        ...prev.steps,
        current: Math.max(0, (prev.steps.current || 0) + amount)
      }
    }));
  };

  const quickAddProteins = (amount) => {
    setHealth(prev => ({
      ...prev,
      proteins: {
        ...prev.proteins,
        consumed: Math.max(0, (prev.proteins.consumed || 0) + amount)
      }
    }));
  };

  const quickAddCalories = (amount) => {
    setHealth(prev => ({
      ...prev,
      calories: {
        ...prev.calories,
        consumed: Math.max(0, (prev.calories.consumed || 0) + amount)
      }
    }));
  };
  const [selectedFoodForPortion, setSelectedFoodForPortion] = useState(null);
  const [portionInputValue, setPortionInputValue] = useState('');
  const [portionUnit, setPortionUnit] = useState('gram'); // 'gram' | 'piece'

  // Open portion prompt modal (pre-filled with last used quantity & unit)
  const handleOpenPortionModal = (food) => {
    const memory = (health.foodMemory && health.foodMemory[food.id]) || {};
    const defaultUnit = memory.unit || (food.pieceCalories ? 'piece' : 'gram');
    const defaultQty = memory.qty !== undefined ? memory.qty : (defaultUnit === 'piece' ? 1 : (food.baseGrams || 100));

    setSelectedFoodForPortion(food);
    setPortionUnit(defaultUnit);
    setPortionInputValue(String(defaultQty));
  };

  // Confirm portion and log food item
  const handleConfirmAddMealFood = (e) => {
    if (e) e.preventDefault();
    if (!selectedFoodForPortion) return;

    let rawVal = (portionInputValue || '').trim().toLowerCase();
    let unit = portionUnit;
    let numVal = parseFloat(rawVal);

    if (rawVal.endsWith('p') || rawVal.endsWith('pz') || rawVal.includes('pez')) {
      unit = 'piece';
      numVal = parseFloat(rawVal) || 1;
    } else if (rawVal.endsWith('g') || rawVal.endsWith('gr')) {
      unit = 'gram';
      numVal = parseFloat(rawVal) || 100;
    }

    if (isNaN(numVal) || numVal <= 0) {
      numVal = unit === 'piece' ? 1 : (selectedFoodForPortion.baseGrams || 100);
    }

    let calculatedCal = 0;
    let calculatedProt = 0;
    let portionLabel = '';

    if (unit === 'piece') {
      const pieceCal = selectedFoodForPortion.pieceCalories || selectedFoodForPortion.baseCalories;
      const pieceProt = selectedFoodForPortion.pieceProteins || selectedFoodForPortion.baseProteins;
      calculatedCal = Math.round(numVal * pieceCal);
      calculatedProt = Math.round(numVal * pieceProt * 10) / 10;
      portionLabel = `${numVal} pz`;
    } else {
      const baseG = selectedFoodForPortion.baseGrams || 100;
      calculatedCal = Math.round((numVal / baseG) * selectedFoodForPortion.baseCalories);
      calculatedProt = Math.round(((numVal / baseG) * selectedFoodForPortion.baseProteins) * 10) / 10;
      portionLabel = `${numVal}g`;
    }

    const updatedMeals = { ...health.meals };
    const newLoggedFood = {
      id: 'meal_food_' + Date.now(),
      foodId: selectedFoodForPortion.id,
      name: selectedFoodForPortion.name,
      emoji: selectedFoodForPortion.emoji,
      calories: calculatedCal,
      proteins: calculatedProt,
      grams: portionLabel
    };

    if (!updatedMeals[activeMealCategory]) {
      updatedMeals[activeMealCategory] = [];
    }
    updatedMeals[activeMealCategory].push(newLoggedFood);

    setHealth(prev => ({
      ...prev,
      calories: {
        ...prev.calories,
        consumed: (prev.calories.consumed || 0) + calculatedCal
      },
      proteins: {
        ...prev.proteins,
        consumed: (prev.proteins.consumed || 0) + calculatedProt
      },
      meals: updatedMeals,
      foodMemory: {
        ...(prev.foodMemory || {}),
        [selectedFoodForPortion.id]: {
          qty: numVal,
          unit: unit
        }
      }
    }));

    setSelectedFoodForPortion(null);
  };

  const removeLoggedFood = (category, itemId, calories, proteins) => {
    const updatedCategoryMeals = (health.meals[category] || []).filter(item => item.id !== itemId);
    setHealth(prev => ({
      ...prev,
      calories: {
        ...prev.calories,
        consumed: Math.max(0, prev.calories.consumed - calories)
      },
      proteins: {
        ...prev.proteins,
        consumed: Math.max(0, prev.proteins.consumed - proteins)
      },
      meals: {
        ...prev.meals,
        [category]: updatedCategoryMeals
      }
    }));
  };

  // Add exercise directly
  const handleLogExercise = (exItem) => {
    const newWorkout = {
      id: Date.now().toString(),
      name: exItem.name,
      emoji: exItem.emoji,
      baseCalories: exItem.baseCalories,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setHealth(prev => ({
      ...prev,
      calories: {
        ...prev.calories,
        burned: (prev.calories.burned || 0) + exItem.baseCalories
      },
      workouts: [...(prev.workouts || []), newWorkout]
    }));
    onRewardXp(exItem.statId, exItem.xpReward, false, exItem.name);
  };

  const removeLoggedExercise = (workoutId, baseCalories) => {
    setHealth(prev => ({
      ...prev,
      calories: {
        ...prev.calories,
        burned: Math.max(0, (prev.calories.burned || 0) - baseCalories)
      },
      workouts: (prev.workouts || []).filter(w => w.id !== workoutId)
    }));
  };

  // Shopping list items toggling
  const toggleInventoryItem = (tab, itemId) => {
    setInventory(prev => {
      const updatedList = prev[tab].map(item =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      );
      return { ...prev, [tab]: updatedList };
    });
  };

  const deleteInventoryItem = (tab, itemId) => {
    setInventory(prev => ({
      ...prev,
      [tab]: prev[tab].filter(item => item.id !== itemId)
    }));
  };

  const clearCompletedInventory = (tab) => {
    setInventory(prev => ({
      ...prev,
      [tab]: (prev[tab] || []).filter(item => !item.completed)
    }));
  };

  const clearAllInventory = (tab) => {
    if (window.confirm("Vuoi davvero svuotare tutti gli elementi in questa lista?")) {
      setInventory(prev => ({ ...prev, [tab]: [] }));
    }
  };

  const handleQuickAddShopItem = (e) => {
    e.preventDefault();
    if (!newShopItemName.trim()) return;
    const newItem = {
      id: 'shop_' + Date.now(),
      emoji: activeInventoryTab === 'food' ? '🍏' : '🏠',
      name: newShopItemName.trim(),
      completed: false
    };
    setInventory(prev => ({
      ...prev,
      [activeInventoryTab]: [...(prev[activeInventoryTab] || []), newItem]
    }));
    setNewShopItemName('');
  };

  const handleOpenGoalsModal = () => {
    onOpenModal('health_goals', {
      calorieGoal,
      proteinGoal: proteinsGoal,
      waterGoal,
      stepGoal: stepsGoal,
      targetWeight,
      currentWeight: weightCurrent,
      currentFat: fatPct,
      currentLean: leanPct,
      calcGoalType: health.calcGoalType || 'lose',
      calcGender: health.calcGender || 'male',
      calcAge: health.calcAge !== undefined ? health.calcAge : 28,
      calcHeight: health.calcHeight !== undefined ? health.calcHeight : 175,
      calcActivity: health.calcActivity !== undefined ? health.calcActivity : 1.375,
      calcFatPct: health.calcFatPct !== undefined ? health.calcFatPct : (fatPct || '')
    });
  };

  const activeInventory = inventory[activeInventoryTab] || [];
  const completedShopCount = activeInventory.filter(i => i.completed).length;

  // Filtered Database Items
  const filteredFoodDatabase = (health.foodDatabase || []).filter(f =>
    !searchQuery || f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredExerciseDatabase = (health.exerciseDatabase || []).filter(ex =>
    !searchQuery || ex.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // History stats averages (excluding 0 / unlogged days)
  const historyList = health.history || [];

  const validStepDays = historyList.filter(h => Number(h.steps) > 0);
  const avgSteps = validStepDays.length > 0
    ? Math.round(validStepDays.reduce((acc, curr) => acc + Number(curr.steps), 0) / validStepDays.length)
    : (stepsCurrent > 0 ? stepsCurrent : 0);

  const validCalorieDays = historyList.filter(h => Number(h.consumed) > 0);
  const avgCalories = validCalorieDays.length > 0
    ? Math.round(validCalorieDays.reduce((acc, curr) => acc + Number(curr.consumed), 0) / validCalorieDays.length)
    : (caloriesConsumed > 0 ? caloriesConsumed : 0);

  const validProteinDays = historyList.filter(h => Number(h.proteins) > 0);
  const avgProteins = validProteinDays.length > 0
    ? Math.round(validProteinDays.reduce((acc, curr) => acc + Number(curr.proteins), 0) / validProteinDays.length)
    : (proteinsCurrent > 0 ? proteinsCurrent : 0);

  const validWaterDays = historyList.filter(h => Number(h.water) > 0);
  const avgWater = validWaterDays.length > 0
    ? ((validWaterDays.reduce((acc, curr) => acc + Number(curr.water), 0) * 0.2) / validWaterDays.length).toFixed(1)
    : ((waterCurrent * 0.2) || 0).toFixed(1);

  return (
    <section id="section-nutrition" className="section active">
      {/* Tab Header with Sub-Tab Navigation (Salute vs Lista Spesa) */}
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          {activeMainTab === 'health' ? '🍎 Diario Salute' : '🛒 Lista della Spesa'}
        </h2>

        {/* Sub-tab Navigation Pills */}
        <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-secondary)', padding: '3px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
          <button
            onClick={() => setActiveMainTab('health')}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 'bold',
              border: 'none',
              cursor: 'pointer',
              background: activeMainTab === 'health' ? 'var(--accent-primary)' : 'transparent',
              color: activeMainTab === 'health' ? '#ffffff' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.2s'
            }}
            title="Apri Diario Salute"
          >
            🍎 Salute
          </button>
          <button
            onClick={() => setActiveMainTab('shopping')}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 'bold',
              border: 'none',
              cursor: 'pointer',
              background: activeMainTab === 'shopping' ? 'var(--accent-primary)' : 'transparent',
              color: activeMainTab === 'shopping' ? '#ffffff' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.2s'
            }}
            title="Apri Lista della Spesa"
          >
            🛒 Spesa
          </button>
        </div>
      </div>

      {/* TAB 1: DIARIO SALUTE */}
      {activeMainTab === 'health' && (
        <>
          {/* Main Calorie Dashboard */}
          <div className="glass-panel" style={{ padding: '16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Bilancio Calorico</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Obiettivo - Cibo + Allenamento = Rimaste</div>
              </div>
              <button
                onClick={() => setShowMealsModal(true)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  background: 'var(--accent-gradient, #7c3aed)',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 2px 8px rgba(124, 58, 237, 0.3)'
                }}
              >
                🍴 Registro Pasti
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', gap: '16px', flexWrap: 'wrap' }}>
              {/* Calorie Progress Ring */}
              <div
                onClick={() => onOpenModal('health_consumed')}
                style={{ position: 'relative', width: '130px', height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                title="Clicca per aggiungere calorie cibo"
              >
                <svg width="130" height="130" viewBox="0 0 140 140">
                  <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="transparent"
                    stroke="var(--bg-secondary)"
                    strokeWidth="9"
                  />
                  <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="transparent"
                    stroke="var(--accent-primary)"
                    strokeWidth="9"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashoffset}
                    style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                  />
                </svg>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '22px', fontWeight: 'bold', fontFamily: 'Orbitron, sans-serif', color: 'var(--text-primary)' }}>{caloriesRemaining}</span>
                  <span style={{ fontSize: '9px', textTransform: 'uppercase', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                    Rimaste
                  </span>
                </div>
              </div>

              {/* Calorie Stats Info & Goal Launcher */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: '150px' }}>
                {/* 1) Obiettivo Card (Clean layout, no extra configure text) */}
                <div
                  onClick={handleOpenGoalsModal}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--glass-border)' }}
                  title="Configura obiettivi e calcola fabbisogno TDEE"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '15px' }}>🚩</span>
                    <div>
                      <div style={{ fontSize: '9px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Obiettivo</div>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{calorieGoal} kcal</div>
                    </div>
                  </div>
                </div>

                {/* 2) Cibo Consumato Card (Opens meals registry to log or pick from memory) */}
                <div
                  onClick={() => setShowMealsModal(true)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--glass-border)' }}
                  title="Apri registro pasti per inserire o scegliere cibi dalla memoria"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '15px' }}>🍴</span>
                    <div>
                      <div style={{ fontSize: '9px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Cibo Consumato</div>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#3b82f6' }}>{caloriesConsumed} kcal</div>
                    </div>
                  </div>
                </div>

                {/* 3) Bruciate Card (Clicking 🔥 adds +100 kcal, clicking row opens exercise registry) */}
                {/* 3) Bruciate Card (Clean layout, no +100🔥 legend, clicking 🔥 adds +100 kcal, clicking row opens exercise registry) */}
                <div
                  onClick={() => setShowExercisesModal(true)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--glass-border)' }}
                  title="Apri registro allenamenti"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setHealth(prev => ({
                          ...prev,
                          calories: { ...prev.calories, burned: (prev.calories.burned || 0) + 100 }
                        }));
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        fontSize: '16px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Tocca la fiamma per aggiungere +100 kcal bruciate"
                    >
                      🔥
                    </button>
                    <div>
                      <div style={{ fontSize: '9px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Bruciate</div>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#f97316' }}>{caloriesBurned} kcal</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Row: Steps + Protein + Water */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
            {/* Steps card */}
            <div
              onClick={() => onOpenModal('health_steps', { currentSteps: stepsCurrent, goalSteps: stepsGoal })}
              className="glass-panel"
              style={{ padding: '12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            >
              <div>
                <div style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Passi</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: '6px 0 2px 0' }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      quickAddSteps(1000);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      fontSize: '16px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Tocca la scarpa per aggiungere +1.000 passi"
                  >
                    👟
                  </button>
                  <span style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{stepsCurrent.toLocaleString()}</span>
                </div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginBottom: '6px' }}>Obiettivo: {stepsGoal.toLocaleString()}</div>
              </div>

              <div>
                <div style={{ width: '100%', height: '4px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${stepsPct}%`, background: 'var(--accent-primary)', transition: 'width 0.3s' }}></div>
                </div>
              </div>
            </div>

            {/* Protein card */}
            <div
              onClick={() => onOpenModal('health_protein', { proteinsCurrent, proteinsGoal, meals: health.meals })}
              className="glass-panel"
              style={{ padding: '12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            >
              <div>
                <div style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Proteine</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px', margin: '6px 0 2px 0' }}>
                  <span style={{ fontSize: '16px' }}>🍗</span>
                  <span style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{proteinsCurrent}</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>g</span>
                </div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginBottom: '6px' }}>Obiettivo: {proteinsGoal}g</div>
              </div>

              <div>
                <div style={{ width: '100%', height: '4px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${proteinsPct}%`, background: '#eab308', transition: 'width 0.3s' }}></div>
                </div>
              </div>
            </div>

            {/* Water card */}
            <div
              onClick={() => onOpenModal('health_water', { waterCurrent, waterGoal })}
              className="glass-panel"
              style={{ padding: '12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            >
              <div>
                <div style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Acqua</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: '6px 0 2px 0' }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      quickAddWater(1);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      fontSize: '16px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Tocca il bicchiere per aggiungere 0.2L (+1 bicchiere)"
                  >
                    🥛
                  </button>
                  <span style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{(waterCurrent * 0.2).toFixed(1)}</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>L</span>
                </div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginBottom: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {waterCurrent}/{waterGoal} bicchieri (0.2L)
                </div>
              </div>

              <div>
                <div style={{ width: '100%', height: '4px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${waterPct}%`, background: '#06b6d4', transition: 'width 0.3s' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Row: Weight + History */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
            {/* Weight card */}
            <div
              onClick={() => onOpenModal('weight', {
                current: weightCurrent,
                target: targetWeight,
                currentFat: fatPct,
                currentLean: leanPct,
                calorieGoal,
                proteinGoal: proteinsGoal
              })}
              className="glass-panel"
              style={{ padding: '12px', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Peso Corporeo</div>
                <span style={{ fontSize: '10px', color: 'var(--accent-primary)', fontWeight: 'bold' }}>Target: {targetWeight} kg</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '6px 0 4px 0' }}>
                <span style={{ fontSize: '16px' }}>⚖️</span>
                <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{weightCurrent}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>kg</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', fontSize: '9px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                <span>Magra: <b>{leanPct > 0 ? `${leanPct}%` : '--'}</b></span>
                <span>Grassa: <b>{fatPct > 0 ? `${fatPct}%` : '--'}</b></span>
              </div>
              <div style={{ width: '100%', height: '4px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(100, (Math.min(weightCurrent, targetWeight) / Math.max(weightCurrent, targetWeight)) * 100)}%`,
                    background: '#ec4899',
                    transition: 'width 0.3s'
                  }}
                ></div>
              </div>
            </div>

            {/* History button card */}
            <div
              onClick={() => setShowHistoryModal(true)}
              className="glass-panel"
              style={{ padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '24px' }}>📊</span>
                <div>
                  <h4 style={{ margin: 0, fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Storico Dati</h4>
                  <p style={{ margin: '2px 0 0 0', fontSize: '9px', color: 'var(--text-muted)' }}>{historyList.length} giorni registrati</p>
                </div>
              </div>
              <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>▶</span>
            </div>
          </div>
        </>
      )}

      {/* TAB 2: LISTA DELLA SPESA (DEDICATED FULL VIEW) */}
      {activeMainTab === 'shopping' && (
        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', marginBottom: '12px', borderBottom: '1px solid var(--glass-border)' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>🛒 Lista della Spesa</h3>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{completedShopCount} su {activeInventory.length} acquistati</div>
            </div>

            {/* Category subtabs */}
            <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-secondary)', padding: '3px', borderRadius: '8px' }}>
              <button
                onClick={() => setActiveInventoryTab('food')}
                style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', border: 'none', cursor: 'pointer', background: activeInventoryTab === 'food' ? 'var(--accent-primary)' : 'transparent', color: activeInventoryTab === 'food' ? '#fff' : 'var(--text-secondary)' }}
              >
                🍏 Cibo
              </button>
              <button
                onClick={() => setActiveInventoryTab('home')}
                style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', border: 'none', cursor: 'pointer', background: activeInventoryTab === 'home' ? 'var(--accent-primary)' : 'transparent', color: activeInventoryTab === 'home' ? '#fff' : 'var(--text-secondary)' }}
              >
                🏠 Casa
              </button>
            </div>
          </div>

          {/* Inline Add Input Form */}
          <form onSubmit={handleQuickAddShopItem} style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
            <input
              type="text"
              value={newShopItemName}
              onChange={(e) => setNewShopItemName(e.target.value)}
              placeholder={activeInventoryTab === 'food' ? 'Es: Latte, Uova, Petto di pollo...' : 'Es: Sapone, Carta igienica...'}
              style={{
                flex: 1,
                height: '38px',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--glass-border)',
                borderRadius: '10px',
                padding: '0 12px',
                fontSize: '12px',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              style={{
                height: '38px',
                padding: '0 14px',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: 'bold',
                background: 'var(--accent-primary)',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              ➕ Aggiungi
            </button>
          </form>

          {/* Inventory Items List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
            {activeInventory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <span style={{ fontSize: '32px' }}>🛒</span>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', margin: '8px 0 0 0' }}>
                  Lista vuota. Digita un prodotto sopra per aggiungerlo subito!
                </p>
              </div>
            ) : (
              activeInventory.map((item) => (
                <div
                  key={item.id}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: '10px', border: '1px solid var(--glass-border)' }}
                >
                  <div
                    onClick={() => toggleInventoryItem(activeInventoryTab, item.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flex: 1 }}
                  >
                    <div
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '6px',
                        border: '1px solid var(--glass-border)',
                        background: item.completed ? 'var(--accent-primary)' : 'transparent',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 'bold'
                      }}
                    >
                      {item.completed && '✓'}
                    </div>
                    <span style={{ fontSize: '13px', color: 'var(--text-primary)', textDecoration: item.completed ? 'line-through' : 'none', opacity: item.completed ? 0.5 : 1 }}>
                      {item.emoji} {item.name}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteInventoryItem(activeInventoryTab, item.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '13px' }}
                    title="Elimina"
                  >
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Action Footer Buttons */}
          {activeInventory.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', paddingTop: '10px', borderTop: '1px solid var(--glass-border)' }}>
              <button
                onClick={() => clearCompletedInventory(activeInventoryTab)}
                style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)', cursor: 'pointer' }}
              >
                🧹 Rimuovi Spuntati
              </button>
              <button
                onClick={() => clearAllInventory(activeInventoryTab)}
                style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', cursor: 'pointer' }}
              >
                🗑️ Svuota Lista
              </button>
            </div>
          )}
        </div>
      )}

      {/* 1) REGISTRO PASTI MODAL */}
      {showMealsModal && (
        <div
          onClick={() => setShowMealsModal(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '440px', width: '92%', background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '24px', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)', overflow: 'hidden' }}
          >
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--glass-border)', background: 'var(--bg-card)' }}>
              <h3 className="modal-title" style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>🍴</span> Registro Pasti e Nutrizione
              </h3>
            </div>

            <div style={{ padding: '16px', maxHeight: '70vh', overflowY: 'auto' }}>
              {/* Category tabs */}
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '12px', borderBottom: '1px solid var(--glass-border)' }}>
                {['breakfast', 'lunch', 'dinner', 'snack', 'cheat'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveMealCategory(cat)}
                    style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', background: activeMealCategory === cat ? 'var(--accent-primary)' : 'var(--bg-secondary)', color: activeMealCategory === cat ? '#fff' : 'var(--text-secondary)' }}
                  >
                    {cat === 'breakfast' ? '☕ Colazione' : cat === 'lunch' ? '🍚 Pranzo' : cat === 'dinner' ? '🍗 Cena' : cat === 'snack' ? '🍌 Spuntino' : '🍕 Sgarro'}
                  </button>
                ))}
              </div>

              {/* Logged Items for Active Category */}
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', margin: '0 0 8px 0' }}>Loggati oggi in questo pasto</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {(!health.meals[activeMealCategory] || health.meals[activeMealCategory].length === 0) ? (
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0, textAlign: 'center' }}>Nessun cibo inserito in questo pasto.</p>
                  ) : (
                    health.meals[activeMealCategory].map((item) => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'var(--bg-secondary)', borderRadius: '8px', fontSize: '12px' }}>
                        <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{item.emoji} {item.name} ({item.grams}g)</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{item.calories} kcal / {item.proteins}g P</span>
                          <button onClick={() => removeLoggedFood(activeMealCategory, item.id, item.calories, item.proteins)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Food Database Search & List */}
              <div style={{ paddingTop: '12px', borderTop: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', margin: 0 }}>
                    Seleziona dal Database Alimenti
                  </h4>
                  <button
                    onClick={() => {
                      setShowMealsModal(false);
                      onOpenModal('food');
                    }}
                    style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--accent-primary)', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    ➕ Nuovo Cibo
                  </button>
                </div>

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="🔎 Cerca cibo per nome..."
                  style={{
                    width: '100%',
                    height: '34px',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '8px',
                    padding: '0 10px',
                    fontSize: '11px',
                    marginBottom: '10px',
                    outline: 'none'
                  }}
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {filteredFoodDatabase.length === 0 ? (
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0, textAlign: 'center' }}>Nessun cibo trovato.</p>
                  ) : (
                    filteredFoodDatabase.map((food) => (
                      <div
                        key={food.id}
                        onClick={() => {
                          setShowMealsModal(false);
                          onOpenModal('food', food);
                        }}
                        style={{
                          display: 'flex',
                          justify: 'space-between',
                          alignItems: 'center',
                          padding: '8px 10px',
                          background: 'var(--bg-secondary)',
                          borderRadius: '8px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          transition: 'background 0.2s'
                        }}
                        title="Tocca per modificare le informazioni di questo cibo"
                      >
                        <div>
                          <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{food.emoji} {food.name}</div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                            Valori per {food.baseGrams || 100}g: {food.baseCalories} kcal, {food.baseProteins}g P
                            {food.pieceCalories && (
                              <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>
                                {' • '}Valori per pezzo: {food.pieceCalories} kcal, {food.pieceProteins || 0}g P
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenPortionModal(food);
                          }}
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: 'var(--accent-primary)',
                            color: '#ffffff',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            flexShrink: 0,
                            boxShadow: '0 2px 8px rgba(124, 58, 237, 0.3)'
                          }}
                          title="Aggiungi al pasto di oggi"
                        >
                          +
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2) REGISTRO ALLENAMENTI MODAL */}
      {showExercisesModal && (
        <div
          onClick={() => setShowExercisesModal(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '440px', width: '92%', background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '24px', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)', overflow: 'hidden' }}
          >
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--glass-border)', background: 'var(--bg-card)' }}>
              <h3 className="modal-title" style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>🏋️</span> Registro Allenamenti
              </h3>
            </div>

            <div style={{ padding: '16px', maxHeight: '70vh', overflowY: 'auto' }}>
              {/* Logged Workouts Today Section */}
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', margin: '0 0 8px 0' }}>
                  Allenamenti Registrati Oggi
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {(!health.workouts || health.workouts.length === 0) ? (
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0, textAlign: 'center' }}>
                      Nessun allenamento registrato oggi.
                    </p>
                  ) : (
                    health.workouts.map((w) => (
                      <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'var(--bg-secondary)', borderRadius: '8px', fontSize: '12px' }}>
                        <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
                          {w.emoji || '🏋️'} {w.name} ({w.time || 'oggi'})
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '11px', color: '#f97316', fontWeight: 'bold' }}>+{w.baseCalories} kcal</span>
                          <button
                            onClick={() => removeLoggedExercise(w.id, w.baseCalories)}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
                            title="Rimuovi allenamento"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Workout Database Section */}
              <div style={{ paddingTop: '12px', borderTop: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', margin: 0 }}>
                    Seleziona dal Database Allenamenti
                  </h4>
                  <button
                    onClick={() => {
                      setShowExercisesModal(false);
                      onOpenModal('exercise');
                    }}
                    style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--accent-primary)', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    ➕ Nuovo Esercizio
                  </button>
                </div>

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="🔎 Cerca allenamento per nome..."
                  style={{
                    width: '100%',
                    height: '34px',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '8px',
                    padding: '0 10px',
                    fontSize: '11px',
                    marginBottom: '10px',
                    outline: 'none'
                  }}
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {filteredExerciseDatabase.length === 0 ? (
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0, textAlign: 'center' }}>Nessun esercizio trovato.</p>
                  ) : (
                    filteredExerciseDatabase.map((ex) => (
                      <div key={ex.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'var(--bg-secondary)', borderRadius: '8px', fontSize: '12px' }}>
                        <div>
                          <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{ex.emoji} {ex.name}</div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Rep/Min: {ex.baseCount} • Brucia: {ex.baseCalories} kcal</div>
                        </div>
                        <button
                          onClick={() => handleLogExercise(ex)}
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: 'var(--accent-primary)',
                            color: '#ffffff',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            flexShrink: 0,
                            boxShadow: '0 2px 8px rgba(124, 58, 237, 0.3)'
                          }}
                          title="Registra esercizio oggi"
                        >
                          +
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HISTORY STATS MODAL (RICH ENHANCED VIEW) */}
      {showHistoryModal && (
        <div
          onClick={() => setShowHistoryModal(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '500px', width: '92%', background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '24px', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)', overflow: 'hidden' }}
          >
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--glass-border)', background: 'var(--bg-card)' }}>
              <h3 className="modal-title" style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>📊</span> Storico Dati Salute (30 Giorni)
              </h3>
            </div>

            <div style={{ padding: '16px', maxHeight: '70vh', overflowY: 'auto' }}>
              {/* Summary Stats Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
                <div style={{ background: 'var(--bg-secondary)', padding: '8px 10px', borderRadius: '12px', border: '1px solid var(--glass-border)', textAlign: 'center' }}>
                  <div style={{ fontSize: '9px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Media Calorie</div>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#3b82f6' }}>{avgCalories} kcal/gg</div>
                </div>
                <div style={{ background: 'var(--bg-secondary)', padding: '8px 10px', borderRadius: '12px', border: '1px solid var(--glass-border)', textAlign: 'center' }}>
                  <div style={{ fontSize: '9px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Media Passi</div>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--accent-primary)' }}>{avgSteps.toLocaleString()} passi/gg</div>
                </div>
                <div style={{ background: 'var(--bg-secondary)', padding: '8px 10px', borderRadius: '12px', border: '1px solid var(--glass-border)', textAlign: 'center' }}>
                  <div style={{ fontSize: '9px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Media Proteine</div>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#eab308' }}>{avgProteins} g/gg</div>
                </div>
                <div style={{ background: 'var(--bg-secondary)', padding: '8px 10px', borderRadius: '12px', border: '1px solid var(--glass-border)', textAlign: 'center' }}>
                  <div style={{ fontSize: '9px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Media Acqua</div>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#06b6d4' }}>{avgWater} L/gg</div>
                </div>
              </div>

              {historyList.length === 0 ? (
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', margin: '24px 0' }}>
                  Nessun dato storico salvato nei giorni precedenti. I dati di ciascuna giornata si archiviano automaticamente al cambio del giorno!
                </p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '8px 6px' }}>Data</th>
                      <th style={{ padding: '8px 6px' }}>Calorie</th>
                      <th style={{ padding: '8px 6px' }}>Passi</th>
                      <th style={{ padding: '8px 6px' }}>Proteine</th>
                      <th style={{ padding: '8px 6px' }}>Acqua</th>
                      <th style={{ padding: '8px 6px' }}>Peso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyList.map((h, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}>
                        <td style={{ padding: '8px 6px', fontWeight: 'bold' }}>{new Date(h.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}</td>
                        <td style={{ padding: '8px 6px', color: '#3b82f6' }}>{h.consumed}/{h.burned}</td>
                        <td style={{ padding: '8px 6px', color: 'var(--accent-primary)' }}>{(h.steps || 0).toLocaleString()}</td>
                        <td style={{ padding: '8px 6px', color: '#eab308' }}>{h.proteins || 0}g</td>
                        <td style={{ padding: '8px 6px', color: '#06b6d4' }}>{((h.water || 0) * 0.2).toFixed(1)}L</td>
                        <td style={{ padding: '8px 6px', fontWeight: 'bold' }}>{h.weight ? `${h.weight} kg` : '--'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PORTION PROMPT MODAL (WITH LAST-USED VALUE MEMORY) */}
      {selectedFoodForPortion && (
        <div
          onClick={() => setSelectedFoodForPortion(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100000,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '380px',
              width: '92%',
              background: 'var(--bg-card)',
              border: '1px solid var(--glass-border)',
              borderRadius: '24px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
              overflow: 'hidden'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--glass-border)', background: 'var(--bg-card)' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>{selectedFoodForPortion.emoji || '🍎'}</span> {selectedFoodForPortion.name}
              </h3>
            </div>

            <form onSubmit={handleConfirmAddMealFood} style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Reference Info Card */}
              <div style={{ background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--glass-border)', fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '3px', textAlign: 'center' }}>
                <span>Valori per {selectedFoodForPortion.baseGrams || 100}g: <b>{selectedFoodForPortion.baseCalories} kcal</b> • <b>{selectedFoodForPortion.baseProteins}g P</b></span>
                {selectedFoodForPortion.pieceCalories && (
                  <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>
                    Valori per pezzo: <b>{selectedFoodForPortion.pieceCalories} kcal</b> • <b>{selectedFoodForPortion.pieceProteins || 0}g P</b>
                  </span>
                )}
              </div>

              {/* Unit Selector Toggle */}
              <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '12px', border: '1px solid var(--glass-border)', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => setPortionUnit('gram')}
                  style={{
                    flex: 1,
                    padding: '7px 0',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    border: 'none',
                    cursor: 'pointer',
                    background: portionUnit === 'gram' ? 'var(--accent-primary)' : 'transparent',
                    color: portionUnit === 'gram' ? '#fff' : 'var(--text-secondary)',
                    transition: 'all 0.2s'
                  }}
                >
                  ⚖️ Grammi (g)
                </button>
                <button
                  type="button"
                  onClick={() => setPortionUnit('piece')}
                  style={{
                    flex: 1,
                    padding: '7px 0',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    border: 'none',
                    cursor: 'pointer',
                    background: portionUnit === 'piece' ? 'var(--accent-primary)' : 'transparent',
                    color: portionUnit === 'piece' ? '#fff' : 'var(--text-secondary)',
                    transition: 'all 0.2s'
                  }}
                >
                  🧩 Pezzi (p)
                </button>
              </div>

              {/* Input quantity */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                    Quantità ({portionUnit === 'piece' ? 'pezzi' : 'grammi'}):
                  </label>
                  {(health.foodMemory && health.foodMemory[selectedFoodForPortion.id]) && (
                    <span style={{ fontSize: '9px', color: 'var(--accent-primary)', fontWeight: 'bold' }}>
                      ⚡ Ricordato dall'ultima volta
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={portionInputValue}
                  onChange={(e) => setPortionInputValue(e.target.value)}
                  placeholder={portionUnit === 'piece' ? 'Es: 1 oppure 2' : 'Es: 100 oppure 150'}
                  autoFocus
                  style={{
                    width: '100%',
                    height: '42px',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '12px',
                    padding: '0 14px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Live Calculation Preview */}
              {(() => {
                let num = parseFloat(portionInputValue);
                if (isNaN(num) || num <= 0) num = 0;
                let previewCal = 0;
                let previewProt = 0;
                if (portionUnit === 'piece') {
                  const pCal = selectedFoodForPortion.pieceCalories || selectedFoodForPortion.baseCalories;
                  const pProt = selectedFoodForPortion.pieceProteins || selectedFoodForPortion.baseProteins;
                  previewCal = Math.round(num * pCal);
                  previewProt = Math.round(num * pProt * 10) / 10;
                } else {
                  const bG = selectedFoodForPortion.baseGrams || 100;
                  previewCal = Math.round((num / bG) * selectedFoodForPortion.baseCalories);
                  previewProt = Math.round(((num / bG) * selectedFoodForPortion.baseProteins) * 10) / 10;
                }

                return (
                  <div style={{ background: 'var(--bg-secondary)', padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-around', textAlign: 'center', fontSize: '12px' }}>
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>Calorie Totali</span>
                      <b style={{ color: 'var(--text-primary)', fontSize: '13px' }}>🔥 {previewCal} kcal</b>
                    </div>
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>Proteine Totali</span>
                      <b style={{ color: '#eab308', fontSize: '13px' }}>🍗 {previewProt}g</b>
                    </div>
                  </div>
                );
              })()}

              {/* Confirm Button */}
              <button
                type="submit"
                style={{
                  width: '100%',
                  height: '44px',
                  background: 'var(--accent-gradient, linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%))',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(124, 58, 237, 0.4)',
                  marginTop: '4px'
                }}
              >
                🍴 Aggiungi al Pasto
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
