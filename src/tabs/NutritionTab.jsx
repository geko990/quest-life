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
  const [activeInventoryTab, setActiveInventoryTab] = useState('food');
  const [showMealsModal, setShowMealsModal] = useState(false);
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

  // Log food items
  const handleAddMealFood = (foodItem) => {
    const updatedMeals = { ...health.meals };
    const newLoggedFood = {
      id: 'meal_food_' + Date.now(),
      name: foodItem.name,
      emoji: foodItem.emoji,
      calories: foodItem.baseCalories,
      proteins: foodItem.baseProteins,
      grams: foodItem.baseGrams
    };

    if (!updatedMeals[activeMealCategory]) {
      updatedMeals[activeMealCategory] = [];
    }
    updatedMeals[activeMealCategory].push(newLoggedFood);

    setHealth(prev => ({
      ...prev,
      calories: {
        ...prev.calories,
        consumed: prev.calories.consumed + foodItem.baseCalories
      },
      proteins: {
        ...prev.proteins,
        consumed: prev.proteins.consumed + foodItem.baseProteins
      },
      meals: updatedMeals
    }));
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
    setHealth(prev => ({
      ...prev,
      calories: {
        ...prev.calories,
        burned: prev.calories.burned + exItem.baseCalories
      }
    }));
    onRewardXp(exItem.statId, exItem.xpReward, false, exItem.name);
    alert(`🏋️ Allenamento completato! +${exItem.xpReward} XP guadagnati!`);
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

  const activeInventory = inventory[activeInventoryTab] || [];

  // Filtered Database Items
  const filteredFoodDatabase = (health.foodDatabase || []).filter(f =>
    !searchQuery || f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredExerciseDatabase = (health.exerciseDatabase || []).filter(ex =>
    !searchQuery || ex.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <section id="section-nutrition" className="section active">
      {/* Tab Header */}
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h2 style={{ margin: 0 }}>🍎 Diario Salute</h2>
      </div>

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

          {/* Calorie Stats Info & Fast Add Pills */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: '150px' }}>
            <div
              onClick={() => onOpenModal('health_goal')}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--glass-border)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '15px' }}>🚩</span>
                <div>
                  <div style={{ fontSize: '9px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Obiettivo</div>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{calorieGoal} kcal</div>
                </div>
              </div>
            </div>

            <div
              onClick={() => setShowMealsModal(true)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--glass-border)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '15px' }}>🍴</span>
                <div>
                  <div style={{ fontSize: '9px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Cibo Consumato</div>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#3b82f6' }}>{caloriesConsumed} kcal</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => quickAddCalories(100)}
                  style={{ background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#3b82f6', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', padding: '2px 6px', cursor: 'pointer' }}
                  title="Aggiungi 100 kcal"
                >
                  +100
                </button>
                <button
                  onClick={() => quickAddCalories(250)}
                  style={{ background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#3b82f6', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', padding: '2px 6px', cursor: 'pointer' }}
                  title="Aggiungi 250 kcal"
                >
                  +250
                </button>
              </div>
            </div>

            <div
              onClick={() => onOpenModal('health_burned')}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--glass-border)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '15px' }}>🔥</span>
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
          onClick={() => onOpenModal('health_steps')}
          className="glass-panel"
          style={{ padding: '12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
        >
          <div>
            <div style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Passi</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '6px 0 2px 0' }}>
              <span style={{ fontSize: '16px' }}>👟</span>
              <span style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{stepsCurrent.toLocaleString()}</span>
            </div>
            <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginBottom: '6px' }}>Obiettivo: {stepsGoal.toLocaleString()}</div>
          </div>

          <div>
            <div style={{ width: '100%', height: '4px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px' }}>
              <div style={{ height: '100%', width: `${stepsPct}%`, background: 'var(--accent-primary)', transition: 'width 0.3s' }}></div>
            </div>

            {/* Quick Fast Action Pills */}
            <div style={{ display: 'flex', gap: '4px', justifyContent: 'space-between' }} onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => quickAddSteps(1000)}
                style={{ flex: 1, background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', borderRadius: '6px', fontSize: '9px', fontWeight: 'bold', padding: '3px 0', cursor: 'pointer' }}
                title="Aggiungi 1.000 passi"
              >
                +1k
              </button>
              <button
                onClick={() => quickAddSteps(5000)}
                style={{ flex: 1, background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', borderRadius: '6px', fontSize: '9px', fontWeight: 'bold', padding: '3px 0', cursor: 'pointer' }}
                title="Aggiungi 5.000 passi"
              >
                +5k
              </button>
            </div>
          </div>
        </div>

        {/* Protein card */}
        <div
          onClick={() => onOpenModal('health_protein')}
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
            <div style={{ width: '100%', height: '4px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px' }}>
              <div style={{ height: '100%', width: `${proteinsPct}%`, background: '#eab308', transition: 'width 0.3s' }}></div>
            </div>

            {/* Quick Fast Action Pills */}
            <div style={{ display: 'flex', gap: '4px', justifyContent: 'space-between' }} onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => quickAddProteins(10)}
                style={{ flex: 1, background: 'rgba(234, 179, 8, 0.15)', border: '1px solid rgba(234, 179, 8, 0.3)', color: '#eab308', borderRadius: '6px', fontSize: '9px', fontWeight: 'bold', padding: '3px 0', cursor: 'pointer' }}
                title="Aggiungi 10g proteine"
              >
                +10g
              </button>
              <button
                onClick={() => quickAddProteins(25)}
                style={{ flex: 1, background: 'rgba(234, 179, 8, 0.15)', border: '1px solid rgba(234, 179, 8, 0.3)', color: '#eab308', borderRadius: '6px', fontSize: '9px', fontWeight: 'bold', padding: '3px 0', cursor: 'pointer' }}
                title="Aggiungi 25g proteine"
              >
                +25g
              </button>
            </div>
          </div>
        </div>

        {/* Water card */}
        <div
          onClick={() => onOpenModal('health_water_goal')}
          className="glass-panel"
          style={{ padding: '12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
        >
          <div>
            <div style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Acqua</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px', margin: '6px 0 2px 0' }}>
              <span style={{ fontSize: '16px' }}>🥛</span>
              <span style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{waterCurrent * 0.25}</span>
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>L</span>
            </div>
            <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginBottom: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{waterCurrent}/{waterGoal} bicchieri</div>
          </div>

          <div>
            <div style={{ width: '100%', height: '4px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px' }}>
              <div style={{ height: '100%', width: `${waterPct}%`, background: '#06b6d4', transition: 'width 0.3s' }}></div>
            </div>

            {/* Quick 1-Tap Water Controls */}
            <div style={{ display: 'flex', gap: '4px', justifyContent: 'space-between' }} onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => quickAddWater(-1)}
                style={{ flex: 1, background: 'rgba(6, 182, 212, 0.15)', border: '1px solid rgba(6, 182, 212, 0.3)', color: '#06b6d4', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', padding: '3px 0', cursor: 'pointer' }}
                title="Rimuovi 1 bicchiere"
              >
                -1
              </button>
              <button
                onClick={() => quickAddWater(1)}
                style={{ flex: 1, background: 'rgba(6, 182, 212, 0.15)', border: '1px solid rgba(6, 182, 212, 0.3)', color: '#06b6d4', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', padding: '3px 0', cursor: 'pointer' }}
                title="Aggiungi 1 bicchiere (250ml)"
              >
                +1
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Row: Weight + History */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
        {/* Weight card */}
        <div
          onClick={() => onOpenModal('weight')}
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
              <p style={{ margin: '2px 0 0 0', fontSize: '9px', color: 'var(--text-muted)' }}>Ultimi 30 giorni</p>
            </div>
          </div>
          <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>▶</span>
        </div>
      </div>

      {/* Shopping List Integration */}
      <div className="glass-panel" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px', marginBottom: '10px', borderBottom: '1px solid var(--glass-border)' }}>
          <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)' }}>🛒 Lista della Spesa</h3>
          
          {/* Subtabs for shopping */}
          <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-secondary)', padding: '2px', borderRadius: '8px' }}>
            <button
              onClick={() => setActiveInventoryTab('food')}
              style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', border: 'none', cursor: 'pointer', background: activeInventoryTab === 'food' ? 'var(--accent-primary)' : 'transparent', color: activeInventoryTab === 'food' ? '#fff' : 'var(--text-secondary)' }}
            >
              🍏 Cibo
            </button>
            <button
              onClick={() => setActiveInventoryTab('home')}
              style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', border: 'none', cursor: 'pointer', background: activeInventoryTab === 'home' ? 'var(--accent-primary)' : 'transparent', color: activeInventoryTab === 'home' ? '#fff' : 'var(--text-secondary)' }}
            >
              🏠 Casa
            </button>
          </div>
        </div>

        {/* Inline Quick Add Form */}
        <form onSubmit={handleQuickAddShopItem} style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
          <input
            type="text"
            value={newShopItemName}
            onChange={(e) => setNewShopItemName(e.target.value)}
            placeholder={activeInventoryTab === 'food' ? 'Es: Latte, Uova, Petto di pollo...' : 'Es: Sapone, Carta igienica...'}
            style={{
              flex: 1,
              height: '34px',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--glass-border)',
              borderRadius: '8px',
              padding: '0 10px',
              fontSize: '11px',
              outline: 'none'
            }}
          />
          <button
            type="submit"
            style={{
              height: '34px',
              padding: '0 12px',
              borderRadius: '8px',
              fontSize: '11px',
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {activeInventory.length === 0 ? (
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', margin: '8px 0' }}>
              Lista vuota. Digita sopra per aggiungere elementi al volo!
            </p>
          ) : (
            activeInventory.map((item) => (
              <div
                key={item.id}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}
              >
                <div
                  onClick={() => toggleInventoryItem(activeInventoryTab, item.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flex: 1 }}
                >
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '4px',
                      border: '1px solid var(--glass-border)',
                      background: item.completed ? 'var(--accent-primary)' : 'transparent',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      fontWeight: 'bold'
                    }}
                  >
                    {item.completed && '✓'}
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-primary)', textDecoration: item.completed ? 'line-through' : 'none', opacity: item.completed ? 0.6 : 1 }}>
                    {item.emoji} {item.name}
                  </span>
                </div>
                <button
                  onClick={() => deleteInventoryItem(activeInventoryTab, item.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px' }}
                  title="Elimina"
                >
                  🗑️
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MEALS AND EXERCISES LOGS POPUP MODAL */}
      {showMealsModal && (
        <div className="modal active" onClick={() => setShowMealsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="modal-title">🍴 Registro Pasti e Allenamenti</h3>
              <button onClick={() => setShowMealsModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '16px' }}>✕</button>
            </div>

            <div style={{ padding: '16px', maxHeight: '70vh', overflowY: 'auto' }}>
              {/* Category tabs */}
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '12px', borderBottom: '1px solid var(--glass-border)' }}>
                {['breakfast', 'lunch', 'dinner', 'snack', 'cheat', 'exercises'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveMealCategory(cat)}
                    style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', background: activeMealCategory === cat ? 'var(--accent-primary)' : 'var(--bg-secondary)', color: activeMealCategory === cat ? '#fff' : 'var(--text-secondary)' }}
                  >
                    {cat === 'breakfast' ? '☕ Colazione' : cat === 'lunch' ? '🍚 Pranzo' : cat === 'dinner' ? '🍗 Cena' : cat === 'snack' ? '🍌 Spuntino' : cat === 'cheat' ? '🍕 Sgarro' : '🏋️ Esercizi'}
                  </button>
                ))}
              </div>

              {/* Logged Items for Active Category */}
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', margin: '0 0 8px 0' }}>Loggati oggi</h4>
                {activeMealCategory === 'exercises' ? (
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>Gli allenamenti registrati bruciano calorie e donano XP al tuo personaggio!</p>
                ) : (
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
                )}
              </div>

              {/* Database Search Filter & List */}
              <div style={{ paddingTop: '12px', borderTop: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', margin: 0 }}>
                    Seleziona dal Database
                  </h4>
                  <button
                    onClick={() => {
                      setShowMealsModal(false);
                      onOpenModal(activeMealCategory === 'exercises' ? 'exercise' : 'food');
                    }}
                    style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--accent-primary)', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    ➕ Nuovo {activeMealCategory === 'exercises' ? 'Esercizio' : 'Cibo'}
                  </button>
                </div>

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="🔎 Cerca per nome..."
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

                {activeMealCategory === 'exercises' ? (
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
                          <button onClick={() => handleLogExercise(ex)} className="btn-primary" style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 'bold', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>Esegui</button>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {filteredFoodDatabase.length === 0 ? (
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0, textAlign: 'center' }}>Nessun cibo trovato.</p>
                    ) : (
                      filteredFoodDatabase.map((food) => (
                        <div key={food.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'var(--bg-secondary)', borderRadius: '8px', fontSize: '12px' }}>
                          <div>
                            <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{food.emoji} {food.name}</div>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Dose: {food.baseGrams}g • Kcal: {food.baseCalories} • P: {food.baseProteins}g</div>
                          </div>
                          <button onClick={() => handleAddMealFood(food)} className="btn-primary" style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 'bold', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>Aggiungi</button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HISTORY STATS MODAL */}
      {showHistoryModal && (
        <div className="modal active" onClick={() => setShowHistoryModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="modal-title">📊 Storico Dati Salute</h3>
              <button onClick={() => setShowHistoryModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '16px' }}>✕</button>
            </div>

            <div style={{ padding: '16px', maxHeight: '70vh', overflowY: 'auto' }}>
              {(!health.history || health.history.length === 0) ? (
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', margin: '16px 0' }}>
                  Nessun dato storico registrato. I dati si salvano al cambio del giorno!
                </p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '6px' }}>Data</th>
                      <th style={{ padding: '6px' }}>Calorie</th>
                      <th style={{ padding: '6px' }}>Passi</th>
                      <th style={{ padding: '6px' }}>Proteine</th>
                      <th style={{ padding: '6px' }}>Acqua</th>
                      <th style={{ padding: '6px' }}>Peso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {health.history.map((h, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}>
                        <td style={{ padding: '6px', fontWeight: 'bold' }}>{new Date(h.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}</td>
                        <td style={{ padding: '6px', color: '#3b82f6' }}>{h.consumed}/{h.burned}</td>
                        <td style={{ padding: '6px', color: 'var(--accent-primary)' }}>{h.steps}</td>
                        <td style={{ padding: '6px', color: '#eab308' }}>{h.proteins}g</td>
                        <td style={{ padding: '6px', color: '#06b6d4' }}>{h.water * 0.25}L</td>
                        <td style={{ padding: '6px', fontWeight: 'bold' }}>{h.weight} kg</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
