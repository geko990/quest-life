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

  // Add water directly (micro interaction)
  const quickAddWater = () => {
    setHealth(prev => ({
      ...prev,
      water: {
        ...prev.water,
        consumed: Math.min(prev.water.goal * 2, prev.water.consumed + 1) // adding 1 cup (250ml = 1 units, goal is typically 8 cups)
      }
    }));
  };

  // Log food items
  const handleAddMealFood = (foodItem) => {
    // Clone meals
    const updatedMeals = { ...health.meals };
    const newLoggedFood = {
      id: 'meal_food_' + Date.now(),
      name: foodItem.name,
      emoji: foodItem.emoji,
      calories: foodItem.baseCalories,
      proteins: foodItem.baseProteins,
      grams: foodItem.baseGrams
    };

    updatedMeals[activeMealCategory].push(newLoggedFood);

    // Update daily calories and proteins
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
    const updatedCategoryMeals = health.meals[category].filter(item => item.id !== itemId);
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
    // Reward XP in target stat
    onRewardXp(exItem.statId, exItem.xpReward);
    alert(`🏋️ Allenamento completato! Hai guadagnato +${exItem.xpReward} XP in ${stats.find(s => s.id === exItem.statId)?.name || 'Forza'}!`);
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

  const activeInventory = inventory[activeInventoryTab] || [];

  return (
    <div className="space-y-6 pb-20 p-4">
      {/* Tab Header */}
      <div className="flex justify-between items-center px-1">
        <h2 className="text-base font-bold text-text-main font-cinzel">🍎 Diario Salute</h2>
      </div>

      {/* Main Calorie Dashboard */}
      <div className="glass-panel p-5 bg-gradient-to-br from-accent-primary/5 to-transparent">
        <div className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">Calorie</div>
        <p className="text-[10px] text-text-secondary/70 mb-5">Obiettivo - Cibo + Esercizio = Rimanenti</p>

        <div className="flex flex-col sm:flex-row items-center justify-around gap-6">
          {/* Calorie Progress Ring */}
          <div
            onClick={() => onOpenModal('health_consumed')}
            className="relative w-36 h-36 flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
          >
            <svg width="140" height="140" viewBox="0 0 140 140" className="drop-shadow-md">
              <circle
                className="stroke-slate-800/30"
                cx="70"
                cy="70"
                r={radius}
                fill="transparent"
                strokeWidth="7.5"
              />
              <circle
                className="stroke-accent-primary progress-ring-circle"
                cx="70"
                cy="70"
                r={radius}
                fill="transparent"
                strokeWidth="7.5"
                strokeDasharray={circumference}
                strokeDashoffset={dashoffset}
              />
            </svg>
            <div className="absolute flex flex-col items-center select-none">
              <span className="text-2xl font-bold font-orbitron text-text-main">{caloriesRemaining}</span>
              <span className="text-[9px] uppercase font-bold text-text-secondary tracking-widest mt-0.5">
                Rimaste
              </span>
            </div>
          </div>

          {/* Calorie Stats Info */}
          <div className="space-y-3 w-full max-w-[160px]">
            <div
              onClick={() => onOpenModal('health_goal')}
              className="flex items-center gap-2.5 cursor-pointer bg-slate-950/20 hover:bg-slate-950/40 p-2 rounded-lg border border-border-color/30 transition-colors"
            >
              <span className="text-sm">🚩</span>
              <div>
                <div className="text-[9px] font-bold text-text-secondary uppercase">Obiettivo</div>
                <div className="text-xs font-bold text-text-main">{calorieGoal}</div>
              </div>
            </div>

            <div
              onClick={() => setShowMealsModal(true)}
              className="flex items-center gap-2.5 cursor-pointer bg-slate-950/20 hover:bg-slate-950/40 p-2 rounded-lg border border-border-color/30 transition-colors"
            >
              <span className="text-sm">🍴</span>
              <div>
                <div className="text-[9px] font-bold text-text-secondary uppercase">Cibo Consumato</div>
                <div className="text-xs font-bold text-text-main text-blue-400">{caloriesConsumed}</div>
              </div>
            </div>

            <div
              onClick={() => onOpenModal('health_burned')}
              className="flex items-center gap-2.5 cursor-pointer bg-slate-950/20 hover:bg-slate-950/40 p-2 rounded-lg border border-border-color/30 transition-colors"
            >
              <span className="text-sm">🔥</span>
              <div>
                <div className="text-[9px] font-bold text-text-secondary uppercase">Bruciate</div>
                <div className="text-xs font-bold text-text-main text-orange-400">{caloriesBurned}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row: Steps + Protein + Water */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Steps card */}
        <div
          onClick={() => onOpenModal('health_steps')}
          className="glass-panel p-4 cursor-pointer hover:border-accent-primary/40 active:scale-95 transition-all"
        >
          <div className="text-[10px] font-bold text-text-secondary uppercase">Passi</div>
          <div className="flex items-baseline gap-1 mt-2.5 mb-1.5">
            <span className="text-xl">👟</span>
            <span className="text-lg font-bold text-text-main">{stepsCurrent.toLocaleString()}</span>
          </div>
          <div className="text-[9px] text-text-secondary font-semibold mb-2">Obiettivo: {stepsGoal.toLocaleString()}</div>
          <div className="w-full h-1.5 bg-slate-950/35 rounded-full overflow-hidden border border-border-color/30">
            <div className="h-full bg-accent-primary transition-all" style={{ width: `${stepsPct}%` }}></div>
          </div>
        </div>

        {/* Protein card */}
        <div
          onClick={() => onOpenModal('health_protein')}
          className="glass-panel p-4 cursor-pointer hover:border-accent-primary/40 active:scale-95 transition-all"
        >
          <div className="text-[10px] font-bold text-text-secondary uppercase">Proteine</div>
          <div className="flex items-baseline gap-0.5 mt-2.5 mb-1.5">
            <span className="text-xl">🍗</span>
            <span className="text-lg font-bold text-text-main">{proteinsCurrent}</span>
            <span className="text-[10px] text-text-secondary font-bold ml-0.5">g</span>
          </div>
          <div className="text-[9px] text-text-secondary font-semibold mb-2">Obiettivo: {proteinsGoal}g</div>
          <div className="w-full h-1.5 bg-slate-950/35 rounded-full overflow-hidden border border-border-color/30">
            <div className="h-full bg-yellow-500 transition-all" style={{ width: `${proteinsPct}%` }}></div>
          </div>
        </div>

        {/* Water card */}
        <div
          onClick={() => onOpenModal('health_water_goal')}
          className="glass-panel p-4 cursor-pointer hover:border-accent-primary/40 active:scale-95 transition-all relative group"
        >
          <div className="text-[10px] font-bold text-text-secondary uppercase">Acqua</div>
          <div className="flex items-baseline gap-0.5 mt-2.5 mb-1.5">
            <span
              onClick={(e) => {
                e.stopPropagation();
                quickAddWater();
              }}
              className="text-xl cursor-pointer hover:scale-125 transition-transform"
              title="Aggiungi 1 Bicchiere (250ml)"
            >
              🥛
            </span>
            <span className="text-lg font-bold text-text-main">{waterCurrent * 0.25}</span>
            <span className="text-[10px] text-text-secondary font-bold ml-0.5">L</span>
          </div>
          <div className="text-[9px] text-text-secondary font-semibold mb-2">Obiettivo: {waterGoal * 0.25}L ({waterGoal} bicchieri)</div>
          <div className="w-full h-1.5 bg-slate-950/35 rounded-full overflow-hidden border border-border-color/30">
            <div className="h-full bg-cyan-500 transition-all" style={{ width: `${waterPct}%` }}></div>
          </div>
        </div>
      </div>

      {/* Row: Weight + History */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Weight card */}
        <div
          onClick={() => onOpenModal('weight')}
          className="glass-panel p-4 cursor-pointer hover:border-accent-primary/40 active:scale-95 transition-all"
        >
          <div className="text-[10px] font-bold text-text-secondary uppercase">Peso</div>
          <div className="flex items-baseline gap-1 mt-2.5 mb-1">
            <span className="text-xl">⚖️</span>
            <span className="text-lg font-bold text-text-main">{weightCurrent}</span>
            <span className="text-xs text-text-secondary">kg</span>
          </div>
          <div className="flex gap-3 text-[9px] text-text-secondary font-semibold mb-2.5">
            <span>Massa Magra: <b className="text-text-main">{leanPct > 0 ? `${leanPct}%` : '--'}</b></span>
            <span>Massa Grassa: <b className="text-text-main">{fatPct > 0 ? `${fatPct}%` : '--'}</b></span>
          </div>
          <div className="text-[9px] text-text-secondary mb-1">Obiettivo: {targetWeight} kg</div>
          <div className="w-full h-1.5 bg-slate-950/35 rounded-full overflow-hidden border border-border-color/30">
            <div
              className="h-full bg-pink-500 transition-all"
              style={{
                width: `${Math.min(
                  100,
                  (Math.min(weightCurrent, targetWeight) / Math.max(weightCurrent, targetWeight)) * 100
                )}%`
              }}
            ></div>
          </div>
        </div>

        {/* History & Stats button card */}
        <div
          onClick={() => setShowHistoryModal(true)}
          className="glass-panel p-4 flex items-center justify-between cursor-pointer hover:border-accent-primary/40 active:scale-95 transition-all"
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">📊</span>
            <div className="text-left">
              <h4 className="text-xs font-bold text-text-main">Storico Dati</h4>
              <p className="text-[9px] text-text-secondary mt-0.5">Vedi medie e storico degli ultimi 30 giorni</p>
            </div>
          </div>
          <span className="text-text-secondary text-sm">▶</span>
        </div>
      </div>

      {/* Shopping List Integration */}
      <div className="glass-panel p-4">
        <div className="flex justify-between items-center pb-2 mb-3 border-b border-border-color/50">
          <h3 className="text-xs font-bold text-text-main font-cinzel">🛒 Lista della Spesa</h3>
          <button
            onClick={() => onOpenModal(activeInventoryTab === 'food' ? 'food' : 'home')} // opens food database or general list addition
            className="w-6 h-6 rounded-full bg-accent-primary/10 hover:bg-accent-primary text-accent-primary hover:text-white font-bold text-sm flex items-center justify-center transition-all"
          >
            +
          </button>
        </div>

        {/* Subtabs for shopping */}
        <div className="flex gap-2 mb-3 bg-slate-950/25 p-1 rounded-lg border border-border-color/30 max-w-xs">
          <button
            onClick={() => setActiveInventoryTab('food')}
            className={`flex-1 text-center py-1 rounded text-[10px] font-semibold transition-all ${
              activeInventoryTab === 'food'
                ? 'bg-accent-primary text-white'
                : 'text-text-secondary hover:text-text-main'
            }`}
          >
            Cibo
          </button>
          <button
            onClick={() => setActiveInventoryTab('home')}
            className={`flex-1 text-center py-1 rounded text-[10px] font-semibold transition-all ${
              activeInventoryTab === 'home'
                ? 'bg-accent-primary text-white'
                : 'text-text-secondary hover:text-text-main'
            }`}
          >
            Casa
          </button>
        </div>

        {/* Inventory Items List */}
        <div className="space-y-2">
          {activeInventory.length === 0 ? (
            <p className="text-[10px] text-text-secondary italic text-center py-3">
              Lista vuota. Clicca "+" per aggiungere elementi!
            </p>
          ) : (
            activeInventory.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2.5 bg-slate-950/15 rounded-lg border border-border-color/20"
              >
                <div
                  onClick={() => toggleInventoryItem(activeInventoryTab, item.id)}
                  className="flex items-center gap-2.5 cursor-pointer select-none flex-1 min-w-0"
                >
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center text-[9px] font-bold ${
                      item.completed
                        ? 'border-green-500 bg-green-500 text-white'
                        : 'border-border-color bg-slate-950/20'
                    }`}
                  >
                    {item.completed && '✓'}
                  </div>
                  <span className={`text-xs truncate ${item.completed ? 'line-through text-text-secondary' : 'text-text-main'}`}>
                    {item.emoji} {item.name}
                  </span>
                </div>
                <button
                  onClick={() => deleteInventoryItem(activeInventoryTab, item.id)}
                  className="text-text-secondary hover:text-red-500 text-xs px-2"
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
        <div
          onClick={() => setShowMealsModal(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-bg-main border border-border-color rounded-2xl shadow-2xl animate-scale-up"
          >
            <div className="px-5 py-4 border-b border-border-color/50 flex justify-between items-center">
              <h3 className="font-bold text-text-main text-base font-cinzel">🍴 Registro Pasti e Allenamenti</h3>
              <button
                onClick={() => setShowMealsModal(false)}
                className="text-text-secondary hover:text-text-main font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-5 max-h-[70vh] overflow-y-auto no-scrollbar space-y-5">
              {/* Category tabs */}
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1 border-b border-border-color/30">
                {['breakfast', 'lunch', 'dinner', 'snack', 'cheat', 'exercises'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveMealCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize flex-shrink-0 transition-colors ${
                      activeMealCategory === cat
                        ? 'bg-accent-primary text-white'
                        : 'text-text-secondary hover:text-text-main hover:bg-slate-950/10'
                    }`}
                  >
                    {cat === 'breakfast'
                      ? '☕ Colazione'
                      : cat === 'lunch'
                      ? '🍚 Pranzo'
                      : cat === 'dinner'
                      ? '🍗 Cena'
                      : cat === 'snack'
                      ? '🍌 Spuntino'
                      : cat === 'cheat'
                      ? '🍕 Sgarro'
                      : '🏋️ Esercizi'}
                  </button>
                ))}
              </div>

              {/* Logged items list for category */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                  Loggati oggi
                </h4>
                {activeMealCategory === 'exercises' ? (
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-text-secondary italic">
                      Gli allenamenti vengono registrati direttamente consumando energia e donano XP!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(!health.meals[activeMealCategory] || health.meals[activeMealCategory].length === 0) ? (
                      <p className="text-xs text-text-secondary italic text-center py-2">Nessun cibo inserito.</p>
                    ) : (
                      health.meals[activeMealCategory].map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between items-center p-2.5 bg-slate-950/15 border border-border-color/20 rounded-lg text-xs"
                        >
                          <span className="font-semibold text-text-main">
                            {item.emoji} {item.name} ({item.grams}g)
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="text-text-secondary font-bold">{item.calories} kcal / {item.proteins}g Prot</span>
                            <button
                              onClick={() => removeLoggedFood(activeMealCategory, item.id, item.calories, item.proteins)}
                              className="text-red-500 font-bold hover:text-red-400 px-1"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Searchable Preset Databases */}
              <div className="pt-4 border-t border-border-color/40 space-y-3">
                <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                  Aggiungi dal Database
                </h4>
                {activeMealCategory === 'exercises' ? (
                  <div className="grid grid-cols-1 gap-2">
                    {health.exerciseDatabase?.map((ex) => (
                      <div
                        key={ex.id}
                        className="flex justify-between items-center p-3 bg-slate-950/20 border border-border-color/30 hover:border-accent-primary/30 rounded-xl text-xs"
                      >
                        <div>
                          <span className="font-bold text-text-main">{ex.emoji} {ex.name}</span>
                          <div className="text-[10px] text-text-secondary mt-0.5">
                            Ripetizioni/Min: {ex.baseCount} • Brucia: {ex.baseCalories} kcal
                          </div>
                        </div>
                        <button
                          onClick={() => handleLogExercise(ex)}
                          className="bg-accent-primary text-white font-bold px-3 py-1 rounded active:scale-95 transition-transform"
                        >
                          Esegui
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {health.foodDatabase?.map((food) => (
                      <div
                        key={food.id}
                        className="flex justify-between items-center p-3 bg-slate-950/20 border border-border-color/30 hover:border-accent-primary/30 rounded-xl text-xs"
                      >
                        <div>
                          <span className="font-bold text-text-main">{food.emoji} {food.name}</span>
                          <div className="text-[10px] text-text-secondary mt-0.5">
                            Dose: {food.baseGrams}g • Kcal: {food.baseCalories} • Proteine: {food.baseProteins}g
                          </div>
                        </div>
                        <button
                          onClick={() => handleAddMealFood(food)}
                          className="bg-accent-primary text-white font-bold px-3 py-1 rounded active:scale-95 transition-transform"
                        >
                          Aggiungi
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HISTORY STATS MODAL */}
      {showHistoryModal && (
        <div
          onClick={() => setShowHistoryModal(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-bg-main border border-border-color rounded-2xl shadow-2xl animate-scale-up"
          >
            <div className="px-5 py-4 border-b border-border-color/50 flex justify-between items-center">
              <h3 className="font-bold text-text-main text-base font-cinzel">📊 Storico Dati Salute</h3>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-text-secondary hover:text-text-main font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-5 max-h-[70vh] overflow-y-auto no-scrollbar">
              {health.history?.length === 0 ? (
                <p className="text-xs text-text-secondary italic text-center py-6">
                  Nessun dato storico registrato. I dati si salvano al cambio del giorno!
                </p>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border-color/50 text-text-secondary">
                      <th className="py-2">Data</th>
                      <th className="py-2">Calorie (C/B)</th>
                      <th className="py-2">Passi</th>
                      <th className="py-2">Proteine</th>
                      <th className="py-2">Acqua</th>
                      <th className="py-2">Peso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {health.history.map((h, idx) => (
                      <tr key={idx} className="border-b border-border-color/20 text-text-main">
                        <td className="py-2 font-semibold">
                          {new Date(h.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                        </td>
                        <td className="py-2 text-blue-400">
                          {h.consumed}/{h.burned}
                        </td>
                        <td className="py-2 text-accent-primary">{h.steps}</td>
                        <td className="py-2 text-yellow-500">{h.proteins}g</td>
                        <td className="py-2 text-cyan-400">{h.water * 0.25}L</td>
                        <td className="py-2 font-bold">{h.weight} kg</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
