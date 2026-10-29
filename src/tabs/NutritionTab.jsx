import React, { useState, useEffect } from 'react';
import QuickMealModal from '../components/QuickMealModal';
import { SHOPPING_CATEGORIES, groupShoppingItems, normalizeShoppingName, categorizeShoppingItem } from '../utils/shoppingCategories';

import { _t, getLocale, dayShort } from '../i18n';
import EmojiField from '../components/EmojiField';
import { getGameDateObj, formatISO } from '../utils/helpers';
export default function NutritionTab({
  activeTab,
  health,
  setHealth,
  inventory = {},
  setInventory,
  onOpenModal,
  stats,
  onRewardXp,
  initialModal,
  setInitialModal,
  onlyModal = false,
  onCloseOverlay,
  settings = {},
  setSettings
}) {
  if (!health) return null;

  // Anelli della settimana: partono vuoti e si riempiono all'apertura della scheda
  const [weekRingsReady, setWeekRingsReady] = useState(false);
  useEffect(() => {
    if (activeTab !== 'nutrition') { setWeekRingsReady(false); return; }
    const t = setTimeout(() => setWeekRingsReady(true), 120);
    return () => clearTimeout(t);
  }, [activeTab]);

  const [activeMainTab, setActiveMainTab] = useState(() => (activeTab === 'shopping' ? 'shopping' : 'health')); // 'health' | 'shopping'

  // Update active main sub-tab whenever activeTab changes (single tap -> health, double tap -> shopping)
  useEffect(() => {
    if (activeTab === 'nutrition') {
      setActiveMainTab('health');
    } else if (activeTab === 'shopping') {
      setActiveMainTab('shopping');
    }
  }, [activeTab]);

  const [showMealsModal, setShowMealsModal] = useState(initialModal === 'meals');
  const [foodView, setFoodView] = useState(null); // 'favorites' | 'archive' (null = automatico)
  const [showExercisesModal, setShowExercisesModal] = useState(initialModal === 'workouts');
  const [showQuickMealModal, setShowQuickMealModal] = useState(false);
  const [quickMealSearch, setQuickMealSearch] = useState('');
  const [showFoodsModal, setShowFoodsModal] = useState(false);

  const handleCloseMealsModal = () => {
    setShowMealsModal(false);
    if (setInitialModal) setInitialModal(null);
    if (onCloseOverlay) onCloseOverlay();
  };

  const handleAddQuickMeal = ({
    name,
    emoji,
    category,
    calories,
    proteins,
    grams,
    saveToDb,
    baseGrams,
    baseCalories,
    baseProteins,
    brand,
    imageUrl
  }) => {
    const targetCat = category || 'main';
    const calNum = Number(calories) || 0;
    const protNum = Number(proteins) || 0;
    const foodDbId = 'fd_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

    const newLoggedFood = {
      id: 'meal_food_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      foodId: foodDbId,
      name: name,
      emoji: emoji || '🍽️',
      calories: calNum,
      proteins: protNum,
      grams: grams || '100g',
      category: targetCat
    };

    setHealth(prev => {
      const updatedMeals = {
        ...(prev.meals || {}),
        [targetCat]: [...((prev.meals && prev.meals[targetCat]) || []), newLoggedFood]
      };

      const allMealItems = Object.values(updatedMeals).flat();
      const newTotalCal = allMealItems.reduce((acc, item) => acc + (Number(item.calories) || 0), 0);
      const newTotalProt = Math.round(allMealItems.reduce((acc, item) => acc + (Number(item.proteins) || 0), 0) * 10) / 10;

      let newFoodDatabase = [...(prev.foodDatabase || [])];

      if (saveToDb) {
        const exists = newFoodDatabase.some(f => f.name && f.name.trim().toLowerCase() === name.trim().toLowerCase());
        if (!exists) {
          const newDbItem = {
            id: foodDbId,
            name: name,
            emoji: emoji || '🍽️',
            baseGrams: baseGrams || 100,
            baseCalories: baseCalories !== undefined ? baseCalories : calNum,
            baseProteins: baseProteins !== undefined ? baseProteins : protNum,
            category: targetCat === 'breakfast' ? 'breakfast' : (targetCat === 'snack' ? 'snack' : 'lunch'),
            brand: brand || null,
            imageUrl: imageUrl || null
          };
          newFoodDatabase = [newDbItem, ...newFoodDatabase];
        }
      }

      return {
        ...prev,
        calories: {
          ...prev.calories,
          consumed: newTotalCal
        },
        proteins: {
          ...prev.proteins,
          consumed: newTotalProt
        },
        meals: updatedMeals,
        foodDatabase: newFoodDatabase
      };
    });
  };

  const handleCloseExercisesModal = () => {
    setShowExercisesModal(false);
    if (setInitialModal) setInitialModal(null);
    if (onCloseOverlay) onCloseOverlay();
  };

  useEffect(() => {
    if (initialModal === 'workouts') {
      setShowExercisesModal(true);
      if (setInitialModal) setInitialModal(null);
    } else if (initialModal === 'meals') {
      setShowMealsModal(true);
      if (setInitialModal) setInitialModal(null);
    }
  }, [initialModal]);

  const [activeInventoryTab, setActiveInventoryTab] = useState('food'); // 'food' | 'home'
  const [editingShopItemId, setEditingShopItemId] = useState(null);
  const [editingShopItemName, setEditingShopItemName] = useState('');
  const [editingShopItemEmoji, setEditingShopItemEmoji] = useState('');
  const [editingShopItemTab, setEditingShopItemTab] = useState('food');
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Edit History Entry States
  const [editingHistoryDay, setEditingHistoryDay] = useState(null); // { idx, date }
  const [editHistConsumed, setEditHistConsumed] = useState('');
  const [editHistBurned, setEditHistBurned] = useState('');
  const [editHistSteps, setEditHistSteps] = useState('');
  const [editHistProteins, setEditHistProteins] = useState('');
  const [editHistWater, setEditHistWater] = useState('');
  const [editHistWeight, setEditHistWeight] = useState('');

  const handleOpenEditHistory = (h, idx) => {
    setEditingHistoryDay({ idx, date: h.date });
    setEditHistConsumed(String(h.consumed || 0));
    setEditHistBurned(String(h.burned || 0));
    setEditHistSteps(String(h.steps || 0));
    setEditHistProteins(String(h.proteins || 0));
    setEditHistWater(String(h.water || 0));
    setEditHistWeight(h.weight !== null && h.weight !== undefined ? String(h.weight) : '');
  };

  const handleSaveEditHistorySubmit = (e) => {
    e.preventDefault();
    if (!editingHistoryDay) return;
    const { idx } = editingHistoryDay;

    setHealth(prev => {
      const historyCopy = [...(prev.history || [])];
      if (idx < 0 || idx >= historyCopy.length) return prev;

      historyCopy[idx] = {
        ...historyCopy[idx],
        consumed: Number(editHistConsumed) || 0,
        burned: Number(editHistBurned) || 0,
        steps: Number(editHistSteps) || 0,
        proteins: Number(editHistProteins) || 0,
        water: Number(editHistWater) || 0,
        weight: editHistWeight.trim() !== '' ? Number(editHistWeight.replace(',', '.')) || null : null
      };

      return {
        ...prev,
        history: historyCopy
      };
    });

    setEditingHistoryDay(null);
  };

  const [activeMealCategory, setActiveMealCategory] = useState('all');
  const [newShopItemName, setNewShopItemName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Calorie calculations
  const calorieGoal = health?.calories?.goal || 1600;
  const caloriesConsumed = health?.calories?.consumed || 0;
  const caloriesBurned = health?.calories?.burned || 0;
  const caloriesRemaining = Math.max(0, calorieGoal - caloriesConsumed + caloriesBurned);

  const allMealItems = Object.values(health?.meals || {}).flat();
  const totalMealCal = allMealItems.reduce((acc, item) => acc + (Number(item.calories) || 0), 0);
  const totalMealProt = Math.round(allMealItems.reduce((acc, item) => acc + (Number(item.proteins) || 0), 0) * 10) / 10;
  const extraConsumed = Math.max(0, (health?.calories?.consumed || 0) - totalMealCal);

  const totalWorkoutCal = (health?.workouts || []).reduce((sum, w) => sum + (Number(w.baseCalories) || 0), 0);
  const extraBurned = Math.max(0, (health?.calories?.burned || 0) - totalWorkoutCal);

  const clearExtraConsumed = () => {
    setHealth(prev => ({
      ...prev,
      calories: {
        ...prev.calories,
        consumed: totalMealCal
      },
      proteins: {
        ...prev.proteins,
        consumed: totalMealProt
      }
    }));
  };

  const clearExtraBurned = () => {
    setHealth(prev => ({
      ...prev,
      calories: {
        ...prev.calories,
        burned: totalWorkoutCal
      }
    }));
  };

  // Calorie SVG progress percent
  const caloriePct = Math.min(1.0, caloriesConsumed / (calorieGoal + caloriesBurned || 1));
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const dashoffset = circumference * (1 - caloriePct);

  // Steps progress
  const stepsGoal = health?.steps?.goal || 10000;
  const stepsCurrent = health?.steps?.current || 0;
  const stepsPct = Math.min(100, (stepsCurrent / stepsGoal) * 100);

  // Proteins progress
  const proteinsGoal = health?.proteins?.goal || 100;
  const proteinsCurrent = health?.proteins?.consumed || 0;
  const proteinsPct = Math.min(100, (proteinsCurrent / proteinsGoal) * 100);

  // Water progress
  const waterGoal = health?.water?.goal || 8;
  const waterCurrent = health?.water?.consumed || 0;
  const waterPct = Math.min(100, (waterCurrent / waterGoal) * 100);

  // Weight mass calculations
  const weightCurrent = health?.weight?.current || 75;
  const targetWeight = health?.weight?.target || 70;
  const leanPct = health?.weight?.currentLean || 0;
  const fatPct = health?.weight?.currentFat || 0;

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
  const pressTimerRef = React.useRef(null);
  const isLongPressRef = React.useRef(false);

  // Edit Logged Meal Item State
  const [editingLoggedItem, setEditingLoggedItem] = useState(null);
  const [editLoggedItemGrams, setEditLoggedItemGrams] = useState('');
  const [editLoggedItemCal, setEditLoggedItemCal] = useState('');
  const [editLoggedItemProt, setEditLoggedItemProt] = useState('');
  const [editLoggedItemCat, setEditLoggedItemCat] = useState('main');

  const handleOpenEditLoggedItem = (item) => {
    setEditingLoggedItem(item);
    setEditLoggedItemGrams(item.grams || '');
    setEditLoggedItemCal(item.calories !== undefined ? String(item.calories) : '');
    setEditLoggedItemProt(item.proteins !== undefined ? String(item.proteins) : '');
    setEditLoggedItemCat(item.catKey || item.category || 'main');
  };

  const handleSaveEditLoggedItem = (e) => {
    if (e) e.preventDefault();
    if (!editingLoggedItem) return;

    const newCal = Math.max(0, parseInt(editLoggedItemCal) || 0);
    const newProt = Math.max(0, parseFloat(editLoggedItemProt) || 0);
    const newCat = editLoggedItemCat;
    const oldCat = editingLoggedItem.catKey || editingLoggedItem.category;

    const updatedMeals = { ...health.meals };

    // Remove from old category
    if (oldCat && updatedMeals[oldCat]) {
      updatedMeals[oldCat] = updatedMeals[oldCat].filter(i => i.id !== editingLoggedItem.id);
    } else {
      ['breakfast', 'main', 'lunch', 'dinner', 'snack', 'cheat'].forEach(cat => {
        if (updatedMeals[cat]) {
          updatedMeals[cat] = updatedMeals[cat].filter(i => i.id !== editingLoggedItem.id);
        }
      });
    }

    // Add updated item to target category
    const updatedItem = {
      ...editingLoggedItem,
      grams: editLoggedItemGrams || editingLoggedItem.grams,
      calories: newCal,
      proteins: newProt,
      category: newCat
    };

    updatedMeals[newCat] = [...(updatedMeals[newCat] || []), updatedItem];

    // Recalculate totals
    const allMealItems = Object.values(updatedMeals).flat();
    const newTotalCal = allMealItems.reduce((acc, item) => acc + (Number(item.calories) || 0), 0);
    const newTotalProt = Math.round(allMealItems.reduce((acc, item) => acc + (Number(item.proteins) || 0), 0) * 10) / 10;

    setHealth(prev => ({
      ...prev,
      calories: { ...prev.calories, consumed: newTotalCal },
      proteins: { ...prev.proteins, consumed: newTotalProt },
      meals: updatedMeals
    }));

    setEditingLoggedItem(null);
  };

  const handleDeleteFoodFromDatabase = (food) => {
    if (!food) return;
    if (confirm(_t("Sei sicuro di voler eliminare \"{0}\" dal database alimenti?", food.name))) {
      setHealth(prev => ({
        ...prev,
        foodDatabase: (prev.foodDatabase || []).filter(f => f.id !== food.id)
      }));
    }
  };

  const handlePointerDown = (food) => {
    isLongPressRef.current = false;
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);

    pressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      // Long press: edit food in database
      onOpenModal('food', food);
    }, 500);
  };

  const handlePointerUp = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  };

  const handleFoodClick = (food) => {
    if (isLongPressRef.current) {
      isLongPressRef.current = false;
      return;
    }
    // Single tap/click: open portion prompt modal pre-filled with last remembered quantity
    handleOpenPortionModal(food);
  };

  const handleQuickLogFood = (food) => {
    const memory = (health.foodMemory && health.foodMemory[food.id]) || {};
    const unit = memory.unit || (food.pieceCalories ? 'piece' : 'gram');
    const qty = memory.qty !== undefined ? memory.qty : (unit === 'piece' ? 1 : (food.baseGrams || 100));

    let calculatedCal = 0;
    let calculatedProt = 0;
    let portionLabel = '';

    if (unit === 'piece') {
      const pieceCal = food.pieceCalories || food.baseCalories;
      const pieceProt = food.pieceProteins || food.baseProteins;
      calculatedCal = Math.round(qty * pieceCal);
      calculatedProt = Math.round(qty * pieceProt * 10) / 10;
      portionLabel = `${qty} pz`;
    } else {
      const baseG = food.baseGrams || 100;
      calculatedCal = Math.round((qty / baseG) * food.baseCalories);
      calculatedProt = Math.round(((qty / baseG) * food.baseProteins) * 10) / 10;
      portionLabel = `${qty}g`;
    }

    const targetCat = (activeMealCategory && activeMealCategory !== 'all')
      ? activeMealCategory
      : (food.category === 'lunch' || food.category === 'dinner' ? 'main' : (food.category || 'snack'));

    const newLoggedFood = {
      id: 'meal_food_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      foodId: food.id,
      name: food.name,
      emoji: food.emoji,
      calories: calculatedCal,
      proteins: calculatedProt,
      grams: portionLabel,
      category: targetCat
    };

    const updatedMeals = {
      ...health.meals,
      [targetCat]: [...(health.meals[targetCat] || []), newLoggedFood]
    };

    const allMealItems = Object.values(updatedMeals).flat();
    const newTotalCal = allMealItems.reduce((acc, item) => acc + (Number(item.calories) || 0), 0);
    const newTotalProt = Math.round(allMealItems.reduce((acc, item) => acc + (Number(item.proteins) || 0), 0) * 10) / 10;

    setHealth(prev => ({
      ...prev,
      calories: {
        ...prev.calories,
        consumed: newTotalCal
      },
      proteins: {
        ...prev.proteins,
        consumed: newTotalProt
      },
      meals: updatedMeals
    }));
  };

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

    const targetCat = (activeMealCategory && activeMealCategory !== 'all')
      ? activeMealCategory
      : (selectedFoodForPortion.category || 'snack');

    const newLoggedFood = {
      id: 'meal_food_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      foodId: selectedFoodForPortion.id,
      name: selectedFoodForPortion.name,
      emoji: selectedFoodForPortion.emoji,
      calories: calculatedCal,
      proteins: calculatedProt,
      grams: portionLabel,
      category: targetCat
    };

    const updatedMeals = {
      ...health.meals,
      [targetCat]: [...(health.meals[targetCat] || []), newLoggedFood]
    };

    const allMealItems = Object.values(updatedMeals).flat();
    const newTotalCal = allMealItems.reduce((acc, item) => acc + (Number(item.calories) || 0), 0);
    const newTotalProt = Math.round(allMealItems.reduce((acc, item) => acc + (Number(item.proteins) || 0), 0) * 10) / 10;

    setHealth(prev => ({
      ...prev,
      calories: {
        ...prev.calories,
        consumed: newTotalCal
      },
      proteins: {
        ...prev.proteins,
        consumed: newTotalProt
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

  const removeLoggedFood = (category, itemId) => {
    const updatedMeals = { ...health.meals };

    if (category && updatedMeals[category]) {
      updatedMeals[category] = updatedMeals[category].filter(item => item.id !== itemId);
    } else {
      ['breakfast', 'lunch', 'dinner', 'snack', 'cheat'].forEach(cat => {
        if (updatedMeals[cat]) {
          updatedMeals[cat] = updatedMeals[cat].filter(item => item.id !== itemId);
        }
      });
    }

    const allMealItems = Object.values(updatedMeals).flat();
    const newTotalCal = allMealItems.reduce((acc, item) => acc + (Number(item.calories) || 0), 0);
    const newTotalProt = Math.round(allMealItems.reduce((acc, item) => acc + (Number(item.proteins) || 0), 0) * 10) / 10;

    setHealth(prev => ({
      ...prev,
      calories: {
        ...prev.calories,
        consumed: newTotalCal
      },
      proteins: {
        ...prev.proteins,
        consumed: newTotalProt
      },
      meals: updatedMeals
    }));
  };

  // Add exercise directly
  const handleLogExercise = (exItem) => {
    const stepsToAdd = Number(exItem.baseSteps) || 0;
    const caloriesToAdd = Number(exItem.baseCalories) || 0;
    const newWorkout = {
      id: Date.now().toString(),
      name: exItem.name,
      emoji: exItem.emoji,
      baseCalories: caloriesToAdd,
      baseSteps: stepsToAdd,
      statId: exItem.statId,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setHealth(prev => ({
      ...prev,
      calories: {
        ...prev.calories,
        burned: (prev.calories?.burned || 0) + caloriesToAdd
      },
      steps: {
        ...prev.steps,
        current: (prev.steps?.current || 0) + stepsToAdd
      },
      workouts: [...(prev.workouts || []), newWorkout]
    }));
    onRewardXp(exItem.statId, exItem.xpReward, false, exItem.name);
  };

  const removeLoggedExercise = (workoutId, baseCalories, baseSteps = 0) => {
    setHealth(prev => ({
      ...prev,
      calories: {
        ...prev.calories,
        burned: Math.max(0, (prev.calories?.burned || 0) - (Number(baseCalories) || 0))
      },
      steps: {
        ...prev.steps,
        current: Math.max(0, (prev.steps?.current || 0) - (Number(baseSteps) || 0))
      },
      workouts: (prev.workouts || []).filter(w => w.id !== workoutId)
    }));
  };

  const handleDeleteExerciseFromDatabase = (ex) => {
    if (!ex) return;
    if (confirm(_t("Sei sicuro di voler eliminare \"{0}\" dal database allenamenti?", ex.name))) {
      setHealth(prev => ({
        ...prev,
        exerciseDatabase: (prev.exerciseDatabase || []).filter(e => e.id !== ex.id)
      }));
    }
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
    if (window.confirm(_t("Vuoi davvero svuotare tutti gli elementi in questa lista?"))) {
      setInventory(prev => ({ ...prev, [tab]: [] }));
    }
  };

  // Spesa per reparto: pressione prolungata su un prodotto per spostarlo in un altro reparto
  const [shopCategoryPickerItem, setShopCategoryPickerItem] = useState(null);
  const shopLongPressRef = React.useRef({ timer: null, fired: false });
  const shopOverrides = settings?.shoppingCategoryOverrides || {};
  const startShopLongPress = (item) => {
    shopLongPressRef.current.fired = false;
    clearTimeout(shopLongPressRef.current.timer);
    shopLongPressRef.current.timer = setTimeout(() => {
      shopLongPressRef.current.fired = true;
      if (navigator.vibrate) navigator.vibrate(12);
      setShopCategoryPickerItem(item);
    }, 480);
  };
  const cancelShopLongPress = () => clearTimeout(shopLongPressRef.current.timer);
  const assignShopCategory = (item, catId) => {
    const key = `${activeInventoryTab}:${normalizeShoppingName(item.name)}`;
    if (setSettings) {
      setSettings(prev => ({
        ...prev,
        shoppingCategoryOverrides: { ...(prev.shoppingCategoryOverrides || {}), [key]: catId }
      }));
    }
    setShopCategoryPickerItem(null);
  };

  const handleQuickAddShopItem = (e) => {
    e.preventDefault();
    if (!newShopItemName.trim()) return;
    const autoCat = categorizeShoppingItem(newShopItemName, activeInventoryTab, shopOverrides);
    const autoEmoji = (SHOPPING_CATEGORIES[activeInventoryTab] || []).find(c => c.id === autoCat && c.id !== 'altro')?.emoji;
    const newItem = {
      id: 'shop_' + Date.now(),
      emoji: autoEmoji || (activeInventoryTab === 'food' ? '🍏' : '🏠'),
      name: newShopItemName.trim(),
      completed: false
    };
    setInventory(prev => ({
      ...prev,
      [activeInventoryTab]: [...(prev[activeInventoryTab] || []), newItem]
    }));
    setNewShopItemName('');
  };

  const handleStartEditShopItem = (item) => {
    setEditingShopItemId(item.id);
    setEditingShopItemName(item.name || '');
    setEditingShopItemEmoji(item.emoji || (activeInventoryTab === 'food' ? '🍏' : '🏠'));
    setEditingShopItemTab(activeInventoryTab);
  };

  const handleSaveEditShopItem = (itemId) => {
    if (!editingShopItemName.trim()) return;
    const targetTab = editingShopItemTab || activeInventoryTab;
    setInventory(prev => {
      const currentItem = (prev[activeInventoryTab] || []).find(item => item.id === itemId);
      if (!currentItem) return prev;

      const updatedItem = {
        ...currentItem,
        name: editingShopItemName.trim(),
        emoji: editingShopItemEmoji.trim() || currentItem.emoji || (targetTab === 'food' ? '🍏' : '🏠')
      };

      if (targetTab === activeInventoryTab) {
        return {
          ...prev,
          [activeInventoryTab]: (prev[activeInventoryTab] || []).map(item =>
            item.id === itemId ? updatedItem : item
          )
        };
      } else {
        return {
          ...prev,
          [activeInventoryTab]: (prev[activeInventoryTab] || []).filter(item => item.id !== itemId),
          [targetTab]: [...(prev[targetTab] || []), updatedItem]
        };
      }
    });
    setEditingShopItemId(null);
    setEditingShopItemName('');
    setEditingShopItemEmoji('');
  };

  const handleCancelEditShopItem = () => {
    setEditingShopItemId(null);
    setEditingShopItemName('');
    setEditingShopItemEmoji('');
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

  const activeInventory = (inventory && inventory[activeInventoryTab]) || [];
  const completedShopCount = activeInventory.filter(i => i.completed).length;

  // Preferiti e archivio cibi
  const toggleFoodFavorite = (foodId) => {
    setHealth(prev => ({
      ...prev,
      foodDatabase: (prev.foodDatabase || []).map(f => (f.id === foodId ? { ...f, favorite: !f.favorite } : f))
    }));
  };
  const favoriteFoodsCount = (health.foodDatabase || []).filter(f => f.favorite).length;
  const effectiveFoodView = foodView || (favoriteFoodsCount > 0 ? 'favorites' : 'archive');

  // Filtered Database Items (respects searchQuery and category tabs like 'main')
  const filteredFoodDatabase = (health.foodDatabase || []).filter(f => {
    const matchesSearch = !searchQuery || f.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (!activeMealCategory || activeMealCategory === 'all') return true;
    if (activeMealCategory === 'main') {
      return !f.category || f.category === 'main' || f.category === 'lunch' || f.category === 'dinner';
    }
    return f.category === activeMealCategory;
  });

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

  if (onlyModal) {
    return (
      <>
        {/* 1) REGISTRO PASTI MODAL */}
        {showMealsModal && (
          <div
            onClick={handleCloseMealsModal}
            style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
          >
            <div
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: '400px', width: '92%', maxHeight: 'min(640px, calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 170px))', display: 'flex', flexDirection: 'column', background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '24px', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)', overflow: 'hidden' }}
            >
              <div className="modal-header" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--glass-border)', background: 'var(--bg-card)' }}>
                <h3 className="modal-title" style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '20px' }}>🍴</span> {" "}{_t("Registro Pasti e Nutrizione")}</h3>
              </div>

              <div style={{ padding: '16px 16px 24px 16px', flex: '1 1 auto', minHeight: 0, overflowY: 'auto' }}>
                {/* Category tabs */}
                <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '12px', borderBottom: '1px solid var(--glass-border)' }}>
                  {[
                    { id: 'all', label: _t("🌟 Tutti") },
                    { id: 'breakfast', label: _t("☕ Colazione") },
                    { id: 'main', label: _t("🍽️ Pasti Principali") },
                    { id: 'snack', label: _t("🍌 Spuntino") },
                    { id: 'cheat', label: _t("🍕 Sgarro") }
                  ].map((cat) => {
                    const count = cat.id === 'all'
                      ? Object.values(health.meals || {}).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0)
                      : (cat.id === 'main'
                          ? ((health.meals?.main?.length || 0) + (health.meals?.lunch?.length || 0) + (health.meals?.dinner?.length || 0))
                          : ((health.meals && health.meals[cat.id]) ? health.meals[cat.id].length : 0));

                    return (
                      <button
                        key={cat.id}
                        onClick={() => setActiveMealCategory(cat.id)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          border: 'none',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          background: activeMealCategory === cat.id ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                          color: activeMealCategory === cat.id ? '#fff' : 'var(--text-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <span>{_t(cat.label)}</span>
                        <span style={{
                          background: activeMealCategory === cat.id ? 'rgba(255, 255, 255, 0.25)' : 'var(--glass-border)',
                          padding: '1px 5px',
                          borderRadius: '10px',
                          fontSize: '9px'
                        }}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Logged Items for Active Category / All */}
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', margin: '0 0 8px 0' }}>
                    {activeMealCategory === 'all' ? _t("Alimenti consumati oggi (Tutti)") : _t("Loggati oggi in questo pasto")}
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {(() => {
                      const catLabels = { breakfast: 'Colazione', main: 'Pasto Principale', lunch: 'Pasto Principale', dinner: 'Pasto Principale', snack: 'Spuntino', cheat: 'Sgarro' };
                      let itemsToDisplay = [];
                      if (activeMealCategory === 'all') {
                        Object.entries(health.meals || {}).forEach(([catKey, items]) => {
                          if (Array.isArray(items)) {
                            items.forEach(item => {
                              itemsToDisplay.push({ ...item, catKey, catLabel: catLabels[catKey] || catKey });
                            });
                          }
                        });
                      } else if (activeMealCategory === 'main') {
                        ['main', 'lunch', 'dinner'].forEach(catKey => {
                          const items = (health.meals && health.meals[catKey]) || [];
                          items.forEach(item => {
                            itemsToDisplay.push({ ...item, catKey, catLabel: catLabels[catKey] || catKey });
                          });
                        });
                      } else {
                        const items = (health.meals && health.meals[activeMealCategory]) || [];
                        itemsToDisplay = items.map(item => ({ ...item, catKey: activeMealCategory }));
                      }

                      if (itemsToDisplay.length === 0 && extraConsumed === 0) {
                        return (
                          <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0, textAlign: 'center' }}>
                            {_t("Nessun cibo inserito in questa sezione.")}</p>
                        );
                      }

                      return (
                        <>
                          {itemsToDisplay.map((item) => (
                            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'var(--bg-secondary)', borderRadius: '8px', fontSize: '12px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{item.emoji} {item.name} ({item.grams})</span>
                                {activeMealCategory === 'all' && item.catLabel && (
                                  <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{_t("Pasto: {0}", item.catLabel)}</span>
                                )}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{_t("{0} kcal / {1}g P", item.calories, item.proteins)}</span>
                                {settings?.allowPastEdits && (
                                  <button
                                    onClick={() => handleOpenEditLoggedItem(item)}
                                    style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', padding: '2px 4px' }}
                                    title={_t("Modifica porzione loggata")}
                                  >
                                    ✏️
                                  </button>
                                )}
                                <button
                                  onClick={() => removeLoggedFood(item.catKey, item.id)}
                                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', padding: '2px 4px' }}
                                  title={_t("Rimuovi alimento")}
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          ))}
                          {extraConsumed > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'rgba(239, 68, 68, 0.1)', border: '1px dashed #ef4444', borderRadius: '8px', fontSize: '12px', marginTop: '4px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>{_t("🍎 Calorie Consumate Manuali")}</span>
                                <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{_t("Aggiunte a mano senza alimento")}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 'bold' }}>{_t("+{0} kcal", extraConsumed)}</span>
                                <button
                                  onClick={clearExtraConsumed}
                                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', padding: '2px 6px' }}
                                  title={_t("Rimuovi calorie manuali")}
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2) REGISTRO ALLENAMENTI MODAL */}
        {showExercisesModal && (
          <div
            onClick={handleCloseExercisesModal}
            style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
          >
            <div
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: '400px', width: '92%', maxHeight: 'min(640px, calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 170px))', display: 'flex', flexDirection: 'column', background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '24px', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)', overflow: 'hidden' }}
            >
              <div className="modal-header" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--glass-border)', background: 'var(--bg-card)' }}>
                <h3 className="modal-title" style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '20px' }}>🏋️</span> {" "}{_t("Registro Allenamenti")}</h3>
              </div>

              <div style={{ padding: '16px 16px 24px 16px', flex: '1 1 auto', minHeight: 0, overflowY: 'auto' }}>
                {/* Logged Workouts Today Section */}
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', margin: '0 0 8px 0' }}>
                    {_t("Allenamenti Registrati Oggi")}</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {(!health.workouts || health.workouts.length === 0) && extraBurned === 0 && extraConsumed === 0 ? (
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0, textAlign: 'center' }}>
                        {_t("Nessun allenamento o valore registrato oggi.")}</p>
                    ) : (
                      <>
                        {health.workouts && health.workouts.map((w) => (
                          <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'var(--bg-secondary)', borderRadius: '8px', fontSize: '12px' }}>
                            <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
                              {w.emoji || '🏋️'} {w.name} ({w.time || _t("oggi")})
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '11px', color: '#f97316', fontWeight: 'bold' }}>
                                {_t("+{0} kcal", w.baseCalories)}{w.baseSteps > 0 && (
                                  <span style={{ marginLeft: '6px', color: '#38bdf8' }}>👟 +{w.baseSteps.toLocaleString()}</span>
                                )}
                              </span>
                              <button
                                onClick={() => removeLoggedExercise(w.id, w.baseCalories, w.baseSteps || 0)}
                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
                                title={_t("Rimuovi allenamento")}
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ))}
                        {extraBurned > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'rgba(249, 115, 22, 0.1)', border: '1px dashed #f97316', borderRadius: '8px', fontSize: '12px', marginTop: '4px' }}>
                            <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>{_t("⚡ Calorie Bruciate Manuali")}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '11px', color: '#f97316', fontWeight: 'bold' }}>{_t("+{0} kcal", extraBurned)}</span>
                              <button
                                onClick={clearExtraBurned}
                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
                                title={_t("Rimuovi calorie bruciate manuali")}
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        )}
                        {extraConsumed > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'rgba(239, 68, 68, 0.1)', border: '1px dashed #ef4444', borderRadius: '8px', fontSize: '12px', marginTop: '4px' }}>
                            <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>{_t("🍎 Calorie Consumate Manuali")}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 'bold' }}>{_t("+{0} kcal", extraConsumed)}</span>
                              <button
                                onClick={clearExtraConsumed}
                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
                                title={_t("Rimuovi calorie consumate manuali")}
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Workout Database Section */}
                <div style={{ paddingTop: '12px', borderTop: '1px solid var(--glass-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h4 style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', margin: 0 }}>
                      {_t("Seleziona dal Database Allenamenti")}</h4>
                    <button
                      onClick={() => {
                        if (onCloseOverlay) onCloseOverlay();
                        setShowExercisesModal(false);
                        onOpenModal('exercise');
                      }}
                      style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--accent-primary)', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      {_t("➕ Nuovo Esercizio")}</button>
                  </div>

                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={_t("🔎 Cerca allenamento per nome...")}
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
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0, textAlign: 'center' }}>{_t("Nessun esercizio trovato.")}</p>
                    ) : (
                      filteredExerciseDatabase.map((ex) => (
                        <div key={ex.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'var(--bg-secondary)', borderRadius: '8px', fontSize: '12px' }}>
                          <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                            <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{ex.emoji}</span>
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ex.name}</span>
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                              {_t("Rep/Min: {0} • Brucia: {1} kcal", ex.baseCount, ex.baseCalories)}{ex.baseSteps > 0 && <span style={{ color: '#38bdf8', marginLeft: '4px' }}>{_t("• 👟 {0} passi", ex.baseSteps.toLocaleString())}</span>}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              onClick={() => {
                                if (onCloseOverlay) onCloseOverlay();
                                setShowExercisesModal(false);
                                onOpenModal('exercise', ex);
                              }}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', padding: '4px' }}
                              title={_t("Modifica allenamento nel database")}
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDeleteExerciseFromDatabase(ex)}
                              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12px', padding: '4px' }}
                              title={_t("Elimina dal database")}
                            >
                              🗑️
                            </button>
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
                              title={_t("Registra esercizio oggi")}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* QUICK MEAL & ONLINE SEARCH MODAL */}
        <QuickMealModal
          isOpen={showQuickMealModal}
          onClose={() => {
            setShowQuickMealModal(false);
            setQuickMealSearch('');
          }}
          onAddMeal={handleAddQuickMeal}
          defaultCategory={activeMealCategory !== 'all' ? activeMealCategory : 'main'}
          existingFoodDatabase={health.foodDatabase || []}
          onToggleFavorite={toggleFoodFavorite}
          initialSearch={quickMealSearch}
        />
      </>
    );
  }

  return (
    <section id="section-nutrition" className={`section active${activeMainTab === 'health' ? ' health-main' : ''}`}>
      {/* Tab Header with Circle Switcher (🛒 in Health / 🍎 in Shopping) */}
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h2 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          {activeMainTab === 'health' ? _t("🍎 Diario della salute") : _t("🛒 Lista della Spesa")}
        </h2>

        {/* Top-Right Circular Switcher Button */}
        <button
          onClick={() => setActiveMainTab(activeMainTab === 'health' ? 'shopping' : 'health')}
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--glass-border)',
            color: 'var(--text-primary)',
            fontSize: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            transition: 'all 0.2s ease',
            flexShrink: 0
          }}
          title={activeMainTab === 'health' ? _t("Apri Lista della Spesa") : _t("Torna al Diario della salute")}
        >
          {activeMainTab === 'health' ? '🛒' : '🍎'}
        </button>
      </div>

      {/* TAB 1: DIARIO DELLA SALUTE */}
      {activeMainTab === 'health' && (
        <div key="health" className="health-grid">
          {/* Main Calorie Dashboard */}
          <div className="glass-panel health-cal" style={{ padding: '14px 16px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{_t("Bilancio Calorico")}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{_t("Obiettivo - Cibo + Allenamento = Rimaste")}</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', gap: '16px', flexWrap: 'wrap' }}>
              {/* Calorie Progress Ring (Tap to open Quick Meal & Online Search Modal) */}
              <div
                onClick={() => setShowQuickMealModal(true)}
                style={{ position: 'relative', width: '118px', height: '118px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                title={_t("Tocca per inserire pasto rapido o cercare online")}
              >
                <svg width="118" height="118" viewBox="0 0 140 140">
                  <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="transparent"
                    stroke="var(--track, var(--bg-secondary))"
                    strokeWidth="9"
                  />
                  <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="transparent"
                    stroke="#3b82f6"
                    strokeWidth="9"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashoffset}
                    style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                  />
                </svg>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '22px', fontWeight: 'bold', fontFamily: 'Orbitron, sans-serif', color: 'var(--text-primary)' }}>{caloriesRemaining}</span>
                  <span style={{ fontSize: '9px', textTransform: 'uppercase', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                    {_t("Rimaste")}</span>
                  <span style={{ fontSize: '8.5px', color: '#38bdf8', marginTop: '2px', fontWeight: 'bold', letterSpacing: '0.2px' }}>
                    {_t("+ Inserisci")}</span>
                </div>
              </div>

              {/* Calorie Stats Info & Goal Launcher */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: '150px' }}>
                {/* 1) Obiettivo Card (Clean layout, no extra configure text) */}
                <div
                  onClick={handleOpenGoalsModal}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: 'var(--bg-secondary)', padding: '8px 10px', gap: '6px', borderRadius: '10px', border: '1px solid var(--glass-border)' }}
                  title={_t("Configura obiettivi e calcola fabbisogno TDEE")}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '15px' }}>🚩</span>
                    <div style={{ fontSize: '9px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{_t("Obiettivo")}</div>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{_t("{0} kcal", calorieGoal)}</div>
                </div>

                {/* 2) Cibo Consumato Card (Opens meals registry to log or pick from memory) */}
                <div
                  onClick={() => setShowMealsModal(true)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: 'var(--bg-secondary)', padding: '8px 10px', gap: '6px', borderRadius: '10px', border: '1px solid var(--glass-border)' }}
                  title={_t("Apri registro pasti per inserire o scegliere cibi dalla memoria")}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '15px' }}>🍴</span>
                    <div style={{ fontSize: '9px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', lineHeight: 1.15 }}>{_t("Cibo Consumato")}</div>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#3b82f6', whiteSpace: 'nowrap' }}>{_t("{0} kcal", caloriesConsumed)}</div>
                </div>

                {/* 3) Bruciate Card (Clicking 🔥 adds +100 kcal, clicking row opens exercise registry) */}
                {/* 3) Bruciate Card (Clean layout, no +100🔥 legend, clicking 🔥 adds +100 kcal, clicking row opens exercise registry) */}
                <div
                  onClick={() => setShowExercisesModal(true)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: 'var(--bg-secondary)', padding: '8px 10px', gap: '6px', borderRadius: '10px', border: '1px solid var(--glass-border)' }}
                  title={_t("Apri registro allenamenti")}
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
                      title={_t("Tocca la fiamma per aggiungere +100 kcal bruciate")}
                    >
                      🔥
                    </button>
                    <div style={{ fontSize: '9px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{_t("Bruciate")}</div>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#f97316', whiteSpace: 'nowrap' }}>{_t("{0} kcal", caloriesBurned)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Row: Steps + Protein + Water */}
          <div className="health-stats" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
            {/* Steps card */}
            <div
              onClick={() => onOpenModal('health_steps', { currentSteps: stepsCurrent, goalSteps: stepsGoal })}
              className="glass-panel"
              style={{ padding: '10px 12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            >
              <div>
                <div style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{_t("Passi")}</div>
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
                    title={_t("Tocca la scarpa per aggiungere +1.000 passi")}
                  >
                    👟
                  </button>
                  <span style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{stepsCurrent.toLocaleString()}</span>
                </div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginBottom: '6px' }}>{_t("Obiettivo: {0}", stepsGoal.toLocaleString())}</div>
              </div>

              <div>
                <div style={{ width: '100%', height: '4px', background: 'var(--track, var(--bg-secondary))', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${stepsPct}%`, background: '#4ade80', transition: 'width 0.3s' }}></div>
                </div>
              </div>
            </div>

            {/* Protein card */}
            <div
              onClick={() => onOpenModal('health_protein', { proteinsCurrent, proteinsGoal, meals: health.meals })}
              className="glass-panel"
              style={{ padding: '10px 12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            >
              <div>
                <div style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{_t("Proteine")}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px', margin: '6px 0 2px 0' }}>
                  <span style={{ fontSize: '16px' }}>🍗</span>
                  <span style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{proteinsCurrent}</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>g</span>
                </div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginBottom: '6px' }}>{_t("Obiettivo: {0}g", proteinsGoal)}</div>
              </div>

              <div>
                <div style={{ width: '100%', height: '4px', background: 'var(--track, var(--bg-secondary))', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${proteinsPct}%`, background: '#eab308', transition: 'width 0.3s' }}></div>
                </div>
              </div>
            </div>

            {/* Water card */}
            <div
              onClick={() => onOpenModal('health_water', { waterCurrent, waterGoal })}
              className="glass-panel"
              style={{ padding: '10px 12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            >
              <div>
                <div style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{_t("Acqua")}</div>
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
                    title={_t("Tocca il bicchiere per aggiungere 0.2L (+1 bicchiere)")}
                  >
                    🥛
                  </button>
                  <span style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{(waterCurrent * 0.2).toFixed(1)}</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>L</span>
                </div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginBottom: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {_t("{0}/{1} bicchieri (0.2L)", waterCurrent, waterGoal)}</div>
              </div>

              <div>
                <div style={{ width: '100%', height: '4px', background: 'var(--track, var(--bg-secondary))', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${waterPct}%`, background: '#06b6d4', transition: 'width 0.3s' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Peso corporeo + "La tua settimana": anelli giornalieri degli obiettivi (kcal, proteine, acqua, passi) */}
          {(() => {
            const weighed = (historyList || []).filter(h => Number(h.weight) > 0);
            const first = weighed.length > 0 ? Number(weighed[0].weight) : null;
            const trend = first !== null ? Math.round((Number(weightCurrent) - first) * 10) / 10 : 0;
            const diff = Math.round((Number(weightCurrent) - Number(targetWeight)) * 10) / 10;

            // Ultimi 7 giorni di gioco, oggi compreso (oggi si riempie dal vivo)
            const todayObj = getGameDateObj(settings?.dayStartTime);
            const byDate = {};
            (historyList || []).forEach(h => { if (h && h.date) byDate[h.date] = h; });
            const days = [];
            for (let i = 6; i >= 0; i--) {
              const d = new Date(todayObj.getFullYear(), todayObj.getMonth(), todayObj.getDate() - i);
              const iso = formatISO(d);
              const rec = i === 0
                ? { consumed: caloriesConsumed, burned: caloriesBurned, proteins: proteinsCurrent, water: waterCurrent, steps: stepsCurrent }
                : byDate[iso];
              const net = rec ? (Number(rec.consumed) || 0) - (Number(rec.burned) || 0) : 0;
              const kcalRatio = calorieGoal > 0 ? net / calorieGoal : 0;
              const goals = rec ? [
                { key: 'kcal', color: '#3b82f6', pct: Math.min(1, Math.max(0, kcalRatio)), met: kcalRatio >= 0.9 && kcalRatio <= 1.1, over: kcalRatio > 1.1 },
                { key: 'prot', color: '#eab308', pct: Math.min(1, (Number(rec.proteins) || 0) / Math.max(1, proteinsGoal)) },
                { key: 'water', color: '#06b6d4', pct: Math.min(1, (Number(rec.water) || 0) / Math.max(1, waterGoal)) },
                { key: 'steps', color: '#4ade80', pct: Math.min(1, (Number(rec.steps) || 0) / Math.max(1, stepsGoal)) }
              ].map(g => ({ ...g, met: g.met !== undefined ? g.met : g.pct >= 1 })) : null;
              days.push({ iso, d, isToday: i === 0, goals, metCount: goals ? goals.filter(g => g.met).length : 0 });
            }
            const perfectDays = days.filter(dd => dd.metCount === 4).length;

            // Anello a 4 spicchi (uno per obiettivo)
            const R = 15.5, C = 2 * Math.PI * R, GAP = 5.5, SEG = C / 4 - GAP;
            const ring = (dd) => (
              <svg width="40" height="40" viewBox="0 0 40 40" style={{ display: 'block', overflow: 'visible' }}>
                {[0, 1, 2, 3].map(q => (
                  <circle key={'t' + q} cx="20" cy="20" r={R} fill="none" stroke="var(--track, var(--bg-secondary))" strokeWidth="4.5" strokeLinecap="round"
                    strokeDasharray={`${SEG} ${C - SEG}`} strokeDashoffset={-(q * C / 4) - GAP / 2} transform="rotate(-90 20 20)" />
                ))}
                {dd.goals && dd.goals.map((g, q) => (
                  <circle key={g.key} cx="20" cy="20" r={R} fill="none" stroke={g.over ? '#ef4444' : g.color} strokeWidth="4.5" strokeLinecap="round"
                    strokeDasharray={`${weekRingsReady ? Math.max(0.01, SEG * g.pct) : 0.01} ${C}`} strokeDashoffset={-(q * C / 4) - GAP / 2}
                    transform="rotate(-90 20 20)" opacity={g.pct > 0 ? 1 : 0}
                    className="week-ring-arc" style={{ transitionDelay: `${days.indexOf(dd) * 60 + q * 40}ms`, filter: g.met ? `drop-shadow(0 0 3px ${g.color})` : 'none' }} />
                ))}
                {dd.metCount === 4 && <text x="20" y="24.5" textAnchor="middle" fontSize="13">⭐</text>}
                {dd.metCount > 0 && dd.metCount < 4 && (
                  <text x="20" y="24" textAnchor="middle" fontSize="11" fontWeight="800" fill="var(--text-secondary)">{dd.metCount}</text>
                )}
              </svg>
            );

            return (
              <div className="glass-panel weight-card health-weight" style={{ padding: '12px 14px', marginBottom: '10px' }}>
                <div
                  onClick={() => onOpenModal('weight', {
                    current: weightCurrent,
                    target: targetWeight,
                    currentFat: fatPct,
                    currentLean: leanPct,
                    calorieGoal,
                    proteinGoal: proteinsGoal
                  })}
                  style={{ cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{_t("Peso Corporeo")}</div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '2px' }}>
                        <span style={{ fontSize: '18px' }}>⚖️</span>
                        <span style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>{weightCurrent}</span>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{_t("kg")}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>{_t("Target: {0} kg", targetWeight)}</div>
                      <div style={{ fontSize: '13px', fontWeight: 800, marginTop: '3px', color: diff === 0 ? '#4ade80' : 'var(--accent-primary)' }}>
                        {diff === 0 ? _t("Obiettivo raggiunto! 🎯") : _t("{0} kg al target", (diff > 0 ? '−' : '+') + Math.abs(diff).toLocaleString(getLocale()))}
                      </div>
                      {weighed.length > 0 && (
                        <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', marginTop: '1px' }}>
                          {_t("{0} kg in {1} giorni", (trend > 0 ? '+' : trend < 0 ? '−' : '') + Math.abs(trend).toLocaleString(getLocale()), weighed.length)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '6px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: 'var(--text-muted)', marginBottom: '3px' }}>
                        <span>{_t("Magra:")}</span><b style={{ color: 'var(--text-primary)' }}>{leanPct > 0 ? `${leanPct}%` : '--'}</b>
                      </div>
                      <div style={{ height: '4px', background: 'var(--track, var(--bg-secondary))', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min(100, leanPct)}%`, background: '#38bdf8' }} />
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: 'var(--text-muted)', marginBottom: '3px' }}>
                        <span>{_t("Grassa:")}</span><b style={{ color: 'var(--text-primary)' }}>{fatPct > 0 ? `${fatPct}%` : '--'}</b>
                      </div>
                      <div style={{ height: '4px', background: 'var(--track, var(--bg-secondary))', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min(100, fatPct)}%`, background: '#f59e0b' }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* La tua settimana */}
                <div onClick={() => setShowHistoryModal(true)} style={{ cursor: 'pointer', marginTop: '8px', paddingTop: '9px', borderTop: '1px solid var(--glass-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', gap: '6px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                      {_t("La tua settimana")}
                      {perfectDays > 0 && <span className="week-perfect-count" title={_t("Giornate perfette: tutti e 4 gli obiettivi")}>⭐ {perfectDays}</span>}
                    </div>
                    <div className="week-legend">
                      <span><i style={{ background: '#3b82f6' }} />{_t("kcal")}</span>
                      <span><i style={{ background: '#eab308' }} />{_t("prot.")}</span>
                      <span><i style={{ background: '#06b6d4' }} />{_t("acqua")}</span>
                      <span><i style={{ background: '#4ade80' }} />{_t("passi")}</span>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', justifyItems: 'center' }}>
                    {days.map(dd => (
                      <div key={dd.iso} className={`week-day${dd.isToday ? ' is-today' : ''}${dd.metCount === 4 ? ' is-perfect' : ''}`}>
                        {ring(dd)}
                        <span className="week-day-label">{dd.isToday ? _t("Oggi") : dayShort(dd.d.getDay())}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Archivi: dei giorni (Storico Dati) e dei cibi (I miei cibi) */}
          <div className="health-arch" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: 0 }}>
            <div
              onClick={() => setShowHistoryModal(true)}
              className="glass-panel"
              style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
            >
              <span style={{ fontSize: '24px' }}>📊</span>
              <div style={{ minWidth: 0 }}>
                <h4 style={{ margin: 0, fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{_t("Storico Dati")}</h4>
                <p style={{ margin: '2px 0 0 0', fontSize: '9px', color: 'var(--text-muted)' }}>{_t("{0} giorni registrati", historyList.length)}</p>
              </div>
            </div>
            <div
              onClick={() => { setSearchQuery(''); setShowFoodsModal(true); }}
              className="glass-panel"
              style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
            >
              <span style={{ fontSize: '24px' }}>🍽️</span>
              <div style={{ minWidth: 0 }}>
                <h4 style={{ margin: 0, fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{_t("I miei cibi")}</h4>
                <p style={{ margin: '2px 0 0 0', fontSize: '9px', color: 'var(--text-muted)' }}>
                  {_t("{0} cibi • {1} preferiti", (health.foodDatabase || []).length, favoriteFoodsCount)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LISTA DELLA SPESA (DEDICATED FULL VIEW) */}
      {activeMainTab === 'shopping' && (
        <div key="shopping" className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', marginBottom: '12px', borderBottom: '1px solid var(--glass-border)' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{_t("🛒 Lista della Spesa")}</h3>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                <span>{_t("{0} su {1} acquistati", completedShopCount, activeInventory.length)}</span>
                {completedShopCount > 0 && (
                  <button
                    onClick={() => clearCompletedInventory(activeInventoryTab)}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}
                  >
                    {_t("• Rimuovi completati")}</button>
                )}
              </div>
            </div>

            {/* Category subtabs */}
            <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-secondary)', padding: '3px', borderRadius: '8px' }}>
              <button
                onClick={() => {
                  setActiveInventoryTab('food');
                  setEditingShopItemId(null);
                }}
                style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', border: 'none', cursor: 'pointer', background: activeInventoryTab === 'food' ? 'var(--accent-primary)' : 'transparent', color: activeInventoryTab === 'food' ? '#fff' : 'var(--text-secondary)' }}
              >
                {_t("🍏 Cibo")}</button>
              <button
                onClick={() => {
                  setActiveInventoryTab('home');
                  setEditingShopItemId(null);
                }}
                style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', border: 'none', cursor: 'pointer', background: activeInventoryTab === 'home' ? 'var(--accent-primary)' : 'transparent', color: activeInventoryTab === 'home' ? '#fff' : 'var(--text-secondary)' }}
              >
                {_t("🏠 Casa")}</button>
            </div>
          </div>

          {/* Super User Banner */}
          {settings?.allowPastEdits && (
            <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#eab308', background: 'rgba(234, 179, 8, 0.12)', padding: '6px 10px', borderRadius: '8px', marginBottom: '12px', border: '1px dashed rgba(234, 179, 8, 0.4)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🔓</span>
              <span><strong>{_t("Super User Attivo:")}</strong> {" "}{_t("tocca ✏️ su qualsiasi elemento per modificarne nome, emoji o categoria.")}</span>
            </div>
          )}

          {/* Inline Add Input Form */}
          <form onSubmit={handleQuickAddShopItem} style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
            <input
              type="text"
              value={newShopItemName}
              onChange={(e) => setNewShopItemName(e.target.value)}
              placeholder={activeInventoryTab === 'food' ? _t("Es: Latte, Uova, Petto di pollo...") : _t("Es: Sapone, Carta igienica...")}
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
              {_t("➕ Aggiungi")}</button>
          </form>

          {/* Inventory Items List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
            {activeInventory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <span style={{ fontSize: '32px' }}>🛒</span>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', margin: '8px 0 0 0' }}>
                  {_t("Lista vuota. Digita un prodotto sopra per aggiungerlo subito!")}</p>
              </div>
            ) : (
              groupShoppingItems(activeInventory, activeInventoryTab, shopOverrides).map((group) => (
                <div key={group.id} className="shop-group">
                  <div className="shop-group-header">
                    <span>{group.emoji} {_t(group.label)}</span>
                    <span className="shop-group-count">{group.items.filter(i => !i.completed).length}/{group.items.length}</span>
                  </div>
              {[...group.items].sort((a, b) => Number(!!a.completed) - Number(!!b.completed)).map((item) => (
                <div
                  key={item.id}
                  onPointerDown={() => editingShopItemId !== item.id && startShopLongPress(item)}
                  onPointerUp={cancelShopLongPress}
                  onPointerLeave={cancelShopLongPress}
                  onPointerCancel={cancelShopLongPress}
                  onContextMenu={(e) => e.preventDefault()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    background: editingShopItemId === item.id ? 'var(--bg-card)' : 'var(--bg-secondary)',
                    borderRadius: '10px',
                    border: editingShopItemId === item.id ? '1px solid var(--accent-primary)' : '1px solid var(--glass-border)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {editingShopItemId === item.id ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSaveEditShopItem(item.id);
                      }}
                      style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%' }}>
                        <EmojiField
                          value={editingShopItemEmoji}
                          onChange={setEditingShopItemEmoji}
                          style={{
                            width: '38px',
                            height: '36px',
                            textAlign: 'center',
                            fontSize: '16px',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--accent-primary)',
                            borderRadius: '8px',
                            outline: 'none',
                            flexShrink: 0
                          }}
                          title={_t("Emoji elemento")}
                        />
                        <input
                          type="text"
                          value={editingShopItemName}
                          onChange={(e) => setEditingShopItemName(e.target.value)}
                          autoFocus
                          style={{
                            flex: 1,
                            height: '36px',
                            padding: '0 10px',
                            fontSize: '12px',
                            fontWeight: '500',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--accent-primary)',
                            borderRadius: '8px',
                            outline: 'none'
                          }}
                          placeholder={_t("Nome elemento...")}
                        />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => setEditingShopItemTab(prev => prev === 'food' ? 'home' : 'food')}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            border: '1px solid var(--glass-border)',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title={_t("Cambia categoria (Cibo o Casa)")}
                        >
                          <span>{_t("Categoria:")}</span>
                          <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>
                            {editingShopItemTab === 'food' ? _t("🍏 Cibo") : _t("🏠 Casa")}
                          </span>
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={handleCancelEditShopItem}
                            style={{
                              padding: '5px 10px',
                              borderRadius: '6px',
                              background: 'rgba(239, 68, 68, 0.12)',
                              color: '#ef4444',
                              border: '1px solid rgba(239, 68, 68, 0.25)',
                              cursor: 'pointer',
                              fontSize: '11px',
                              fontWeight: 'bold'
                            }}
                          >
                            {_t("Annulla")}</button>
                          <button
                            type="submit"
                            style={{
                              padding: '5px 12px',
                              borderRadius: '6px',
                              background: 'var(--accent-primary)',
                              color: '#fff',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '11px',
                              fontWeight: 'bold'
                            }}
                          >
                            {_t("✓ Salva")}</button>
                        </div>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div
                        onClick={() => {
                          if (shopLongPressRef.current.fired) { shopLongPressRef.current.fired = false; return; }
                          toggleInventoryItem(activeInventoryTab, item.id);
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flex: 1, minWidth: 0, paddingRight: '8px' }}
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
                            fontWeight: 'bold',
                            flexShrink: 0
                          }}
                        >
                          {item.completed && '✓'}
                        </div>
                        <span style={{ fontSize: '13px', color: 'var(--text-primary)', textDecoration: item.completed ? 'line-through' : 'none', opacity: item.completed ? 0.5 : 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.emoji} {item.name}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        {settings?.allowPastEdits && (
                          <button
                            type="button"
                            onClick={() => handleStartEditShopItem(item)}
                            style={{ background: 'none', border: 'none', color: '#eab308', cursor: 'pointer', fontSize: '13px', padding: '2px 4px' }}
                            title={_t("Modifica elemento (Super User)")}
                          >
                            ✏️
                          </button>
                        )}
                        <button
                          onClick={() => deleteInventoryItem(activeInventoryTab, item.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '13px', padding: '2px 4px' }}
                          title={_t("Elimina")}
                        >
                          🗑️
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
                </div>
              ))
            )}
            {activeInventory.length > 0 && (
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textAlign: 'center', fontStyle: 'italic' }}>
                {_t("💡 Tieni premuto un prodotto per spostarlo in un altro reparto: l'app se lo ricorderà.")}</div>
            )}
          </div>

          {/* Scelta reparto per un prodotto (dopo pressione prolungata) */}
          {shopCategoryPickerItem && (
            <div className="shop-picker-overlay" onClick={() => setShopCategoryPickerItem(null)}>
              <div className="shop-picker" onClick={(e) => e.stopPropagation()}>
                <div className="shop-picker-title">{_t("Sposta \"{0}\" in:", shopCategoryPickerItem.name)}</div>
                <div className="shop-picker-grid">
                  {(SHOPPING_CATEGORIES[activeInventoryTab] || []).map(cat => {
                    const current = categorizeShoppingItem(shopCategoryPickerItem.name, activeInventoryTab, shopOverrides) === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        className={`shop-picker-option ${current ? 'active' : ''}`}
                        onClick={() => assignShopCategory(shopCategoryPickerItem, cat.id)}
                      >
                        <span style={{ fontSize: '18px' }}>{cat.emoji}</span>
                        <span>{_t(cat.label)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 1) REGISTRO PASTI MODAL */}
      {showMealsModal && (
        <div
          onClick={handleCloseMealsModal}
          style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '400px', width: '92%', maxHeight: 'min(640px, calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 170px))', display: 'flex', flexDirection: 'column', background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '24px', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)', overflow: 'hidden' }}
          >
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--glass-border)', background: 'var(--bg-card)' }}>
              <h3 className="modal-title" style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>🍴</span> {" "}{_t("Mangiato oggi")}</h3>
            </div>

            <div style={{ padding: '16px 16px 24px 16px', flex: '1 1 auto', minHeight: 0, overflowY: 'auto' }}>
              {/* Category tabs */}
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '12px', borderBottom: '1px solid var(--glass-border)' }}>
                {[
                  { id: 'all', label: _t("🌟 Tutti") },
                  { id: 'breakfast', label: _t("☕ Colazione") },
                  { id: 'main', label: _t("🍽️ Pasti Principali") },
                  { id: 'snack', label: _t("🍌 Spuntino") },
                  { id: 'cheat', label: _t("🍕 Sgarro") }
                ].map((cat) => {
                  const count = cat.id === 'all'
                    ? Object.values(health.meals || {}).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0)
                    : (cat.id === 'main'
                        ? ((health.meals?.main?.length || 0) + (health.meals?.lunch?.length || 0) + (health.meals?.dinner?.length || 0))
                        : ((health.meals && health.meals[cat.id]) ? health.meals[cat.id].length : 0));

                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveMealCategory(cat.id)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        border: 'none',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        background: activeMealCategory === cat.id ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                        color: activeMealCategory === cat.id ? '#fff' : 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <span>{_t(cat.label)}</span>
                      <span style={{
                        background: activeMealCategory === cat.id ? 'rgba(255, 255, 255, 0.25)' : 'var(--glass-border)',
                        padding: '1px 5px',
                        borderRadius: '10px',
                        fontSize: '9px'
                      }}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Logged Items for Active Category / All */}
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', margin: '0 0 8px 0' }}>
                  {activeMealCategory === 'all' ? _t("Alimenti consumati oggi (Tutti)") : _t("Loggati oggi in questo pasto")}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {(() => {
                    const catLabels = { breakfast: 'Colazione', main: 'Pasto Principale', lunch: 'Pasto Principale', dinner: 'Pasto Principale', snack: 'Spuntino', cheat: 'Sgarro' };
                    let itemsToDisplay = [];
                    if (activeMealCategory === 'all') {
                      Object.entries(health.meals || {}).forEach(([catKey, items]) => {
                        if (Array.isArray(items)) {
                          items.forEach(item => {
                            itemsToDisplay.push({ ...item, catKey, catLabel: catLabels[catKey] || catKey });
                          });
                        }
                      });
                    } else if (activeMealCategory === 'main') {
                      ['main', 'lunch', 'dinner'].forEach(catKey => {
                        const items = (health.meals && health.meals[catKey]) || [];
                        items.forEach(item => {
                          itemsToDisplay.push({ ...item, catKey, catLabel: catLabels[catKey] || catKey });
                        });
                      });
                    } else {
                      const items = (health.meals && health.meals[activeMealCategory]) || [];
                      itemsToDisplay = items.map(item => ({ ...item, catKey: activeMealCategory }));
                    }

                    if (itemsToDisplay.length === 0) {
                      return (
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0, textAlign: 'center' }}>
                          {_t("Nessun cibo inserito in questa sezione.")}</p>
                      );
                    }

                    return itemsToDisplay.map((item) => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'var(--bg-secondary)', borderRadius: '8px', fontSize: '12px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{item.emoji} {item.name} ({item.grams})</span>
                          {activeMealCategory === 'all' && item.catLabel && (
                            <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{_t("Pasto: {0}", item.catLabel)}</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{_t("{0} kcal / {1}g P", item.calories, item.proteins)}</span>
                          {settings?.allowPastEdits && (
                            <button
                              onClick={() => handleOpenEditLoggedItem(item)}
                              style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', padding: '2px 4px' }}
                              title={_t("Modifica porzione loggata")}
                            >
                              ✏️
                            </button>
                          )}
                          <button
                            onClick={() => removeLoggedFood(item.catKey, item.id)}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', padding: '2px 4px' }}
                            title={_t("Rimuovi alimento")}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Preferiti da aggiungere con un tocco + ricerca */}
              <div style={{ paddingTop: '12px', borderTop: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', margin: 0 }}>
                    {_t("⭐ Aggiungi dai preferiti")}
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setQuickMealSearch('');
                      setShowMealsModal(false);
                      setShowQuickMealModal(true);
                    }}
                    className="health-add-btn"
                  >
                    {_t("+ Cerca o inserisci")}
                  </button>
                </div>
                {(health.foodDatabase || []).some(f => f.favorite) ? (
                  <div className="fav-food-row no-scrollbar">
                    {(health.foodDatabase || []).filter(f => f.favorite).map(food => (
                      <button key={food.id} type="button" className="fav-food-chip" onClick={() => handleFoodClick(food)}>
                        <span style={{ fontSize: '20px' }}>{food.emoji}</span>
                        <span className="fav-food-name">{food.name}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    {_t("Nessun preferito: aprili da 🍽️ I miei cibi e tocca ☆ sui cibi che mangi più spesso.")}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* I MIEI CIBI: archivio completo dei cibi (preferiti, ricerca, modifica) */}
      {showFoodsModal && (
        <div
          onClick={() => setShowFoodsModal(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '400px', width: '92%', maxHeight: 'min(640px, calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 170px))', display: 'flex', flexDirection: 'column', background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '24px', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)', overflow: 'hidden' }}
          >
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--glass-border)', background: 'var(--bg-card)', flexShrink: 0 }}>
              <h3 className="modal-title" style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>🍽️</span> {" "}{_t("I miei cibi")}</h3>
            </div>
            <div style={{ padding: '16px 16px 24px 16px', flex: '1 1 auto', minHeight: 0, overflowY: 'auto' }}>
              {/* Food Database Search & 3-Column Grid */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', margin: 0 }}>
                    {_t("Cibi")}</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => {
                        setQuickMealSearch(searchQuery || '');
                        setShowFoodsModal(false);
                        setShowQuickMealModal(true);
                      }}
                      style={{ fontSize: '10px', fontWeight: 'bold', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '6px', padding: '2px 7px', cursor: 'pointer' }}
                    >
                      {_t("🌐 Cerca Online")}</button>
                    <button
                      onClick={() => {
                        onOpenModal('food');
                      }}
                      style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--accent-primary)', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      {_t("➕ Nuovo Cibo")}</button>
                  </div>
                </div>

                {settings?.allowPastEdits ? (
                  <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.12)', padding: '6px 10px', borderRadius: '8px', marginBottom: '8px', border: '1px solid rgba(56, 189, 248, 0.3)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🔓</span>
                    <span><strong>{_t("Modalità Modifica Cibi Attiva:")}</strong> {" "}{_t("usa ✏️ (Modifica) o 🗑️ (Elimina) direttamente sui cibi in griglia.")}</span>
                  </div>
                ) : (
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '8px', fontStyle: 'italic' }}>
                    💡 <strong>{_t("Tocco singolo:")}</strong> {" "}{_t("Inserisci porzione (ricorda l'ultima) |")}{" "}<strong>{_t("Tieni premuto:")}</strong> {" "}{_t("Modifica nel database")}</div>
                )}

                <div className="food-view-switch">
                  <button type="button" className={effectiveFoodView === 'favorites' ? 'active' : ''} onClick={() => setFoodView('favorites')}>
                    {_t("⭐ Preferiti ({0})", favoriteFoodsCount)}</button>
                  <button type="button" className={effectiveFoodView === 'archive' ? 'active' : ''} onClick={() => setFoodView('archive')}>
                    {_t("📚 Archivio ({0})", (health.foodDatabase || []).length)}</button>
                </div>

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={_t("🔎 Cerca in tutto l'archivio...")}
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

                {(() => {
                  // Con la ricerca si cerca sempre in tutto l'archivio
                  const showingFavorites = !searchQuery && effectiveFoodView === 'favorites';
                  const gridFoods = showingFavorites
                    ? filteredFoodDatabase.filter(f => f.favorite)
                    : [...filteredFoodDatabase].sort((a, b) => Number(!!b.favorite) - Number(!!a.favorite));
                  return (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {gridFoods.length === 0 ? (
                    <p style={{ gridColumn: 'span 3', fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0, textAlign: 'center' }}>
                      {showingFavorites ? _t("Nessun preferito in questa categoria. Tocca ☆ su un cibo dell'archivio.") : _t("Nessun cibo trovato.")}
                    </p>
                  ) : (
                    gridFoods.map((food) => {
                      const isPiece = !!food.pieceCalories;
                      const kcalDisplay = isPiece ? food.pieceCalories : food.baseCalories;
                      const unitDisplay = isPiece ? '1 pz' : `${food.baseGrams || 100}g`;

                      return (
                        <div key={food.id} style={{ position: 'relative' }}>
                          <button
                            type="button"
                            onPointerDown={() => handlePointerDown(food)}
                            onPointerUp={handlePointerUp}
                            onPointerLeave={handlePointerUp}
                            onClick={() => handleFoodClick(food)}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '8px 4px',
                              background: 'var(--bg-secondary)',
                              border: '1px solid var(--glass-border)',
                              borderRadius: '12px',
                              cursor: 'pointer',
                              userSelect: 'none',
                              WebkitUserSelect: 'none',
                              transition: 'all 0.15s ease',
                              textAlign: 'center',
                              minHeight: '84px',
                              width: '100%',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                            }}
                            title={_t("Tocca per inserire porzione • Tieni premuto per modificare nel database")}
                          >
                            <span style={{ fontSize: '22px', marginBottom: '2px' }}>{food.emoji}</span>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 'bold',
                              color: 'var(--text-primary)',
                              lineHeight: '1.2',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              marginBottom: '4px',
                              maxHeight: '26px'
                            }}>
                              {food.name}
                            </span>
                            <span style={{ fontSize: '9px', fontWeight: 'bold', color: 'var(--accent-primary)', background: 'rgba(124, 58, 237, 0.12)', padding: '2px 5px', borderRadius: '6px' }}>
                              {_t("{0} kcal ({1})", kcalDisplay, unitDisplay)}</span>
                          </button>
                          {!showingFavorites && <button
                            type="button"
                            className={`food-fav-star ${food.favorite ? 'active' : ''}`}
                            onClick={(e) => { e.stopPropagation(); toggleFoodFavorite(food.id); }}
                            onPointerDown={(e) => e.stopPropagation()}
                            title={food.favorite ? _t("Togli dai preferiti") : _t("Aggiungi ai preferiti")}
                          >
                            {food.favorite ? '★' : '☆'}
                          </button>}
                          {settings?.allowPastEdits && (
                            <div style={{ position: 'absolute', top: '4px', right: '4px', display: 'flex', gap: '2px', zIndex: 5 }}>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenModal('food', food);
                                }}
                                style={{
                                  background: 'rgba(0, 0, 0, 0.75)',
                                  border: '1px solid rgba(255, 255, 255, 0.25)',
                                  borderRadius: '50%',
                                  width: '24px',
                                  height: '24px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#fff',
                                  fontSize: '11px',
                                  cursor: 'pointer'
                                }}
                                title={_t("Modifica nel database")}
                              >
                                ✏️
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteFoodFromDatabase(food);
                                }}
                                style={{
                                  background: 'rgba(239, 68, 68, 0.85)',
                                  border: '1px solid rgba(255, 255, 255, 0.25)',
                                  borderRadius: '50%',
                                  width: '24px',
                                  height: '24px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#fff',
                                  fontSize: '11px',
                                  cursor: 'pointer'
                                }}
                                title={_t("Elimina dal database")}
                              >
                                🗑️
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
                  );
                })()}

                {searchQuery && searchQuery.trim().length >= 2 && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuickMealSearch(searchQuery.trim());
                      setShowFoodsModal(false);
                      setShowQuickMealModal(true);
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      marginTop: '12px',
                      background: 'rgba(56, 189, 248, 0.12)',
                      border: '1px dashed rgba(56, 189, 248, 0.4)',
                      borderRadius: '12px',
                      color: '#38bdf8',
                      fontSize: '11.5px',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>🌐</span>
                    <span>{_t("Cerca \"{0}\" su Internet (Open Food Facts)", searchQuery.trim())}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2) REGISTRO ALLENAMENTI MODAL */}
      {showExercisesModal && (
        <div
          onClick={handleCloseExercisesModal}
          style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '400px', width: '92%', maxHeight: 'min(640px, calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 170px))', display: 'flex', flexDirection: 'column', background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '24px', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)', overflow: 'hidden' }}
          >
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--glass-border)', background: 'var(--bg-card)' }}>
              <h3 className="modal-title" style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>🏋️</span> {" "}{_t("Registro Allenamenti")}</h3>
            </div>

            <div style={{ padding: '16px 16px 24px 16px', flex: '1 1 auto', minHeight: 0, overflowY: 'auto' }}>
              {/* Logged Workouts Today Section */}
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', margin: '0 0 8px 0' }}>
                  {_t("Allenamenti Registrati Oggi")}</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {(!health.workouts || health.workouts.length === 0) && extraBurned === 0 && extraConsumed === 0 ? (
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0, textAlign: 'center' }}>
                      {_t("Nessun allenamento o valore registrato oggi.")}</p>
                  ) : (
                    <>
                      {health.workouts && health.workouts.map((w) => (
                        <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'var(--bg-secondary)', borderRadius: '8px', fontSize: '12px' }}>
                          <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
                            {w.emoji || '🏋️'} {w.name} ({w.time || _t("oggi")})
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '11px', color: '#f97316', fontWeight: 'bold' }}>
                              {_t("+{0} kcal", w.baseCalories)}{w.baseSteps > 0 && (
                                <span style={{ marginLeft: '6px', color: '#38bdf8' }}>👟 +{w.baseSteps.toLocaleString()}</span>
                              )}
                            </span>
                            <button
                              onClick={() => removeLoggedExercise(w.id, w.baseCalories, w.baseSteps || 0)}
                              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
                              title={_t("Rimuovi allenamento")}
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                      {extraBurned > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'rgba(249, 115, 22, 0.1)', border: '1px dashed #f97316', borderRadius: '8px', fontSize: '12px', marginTop: '4px' }}>
                          <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>{_t("⚡ Calorie Bruciate Manuali")}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '11px', color: '#f97316', fontWeight: 'bold' }}>{_t("+{0} kcal", extraBurned)}</span>
                            <button
                              onClick={clearExtraBurned}
                              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
                              title={_t("Rimuovi calorie bruciate manuali")}
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      )}
                      {extraConsumed > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'rgba(239, 68, 68, 0.1)', border: '1px dashed #ef4444', borderRadius: '8px', fontSize: '12px', marginTop: '4px' }}>
                          <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>{_t("🍎 Calorie Consumate Manuali")}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 'bold' }}>{_t("+{0} kcal", extraConsumed)}</span>
                            <button
                              onClick={clearExtraConsumed}
                              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
                              title={_t("Rimuovi calorie consumate manuali")}
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Workout Database Section */}
              <div style={{ paddingTop: '12px', borderTop: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', margin: 0 }}>
                    {_t("Seleziona dal Database Allenamenti")}</h4>
                  <button
                    onClick={() => {
                      setShowExercisesModal(false);
                      onOpenModal('exercise');
                    }}
                    style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--accent-primary)', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    {_t("➕ Nuovo Esercizio")}</button>
                </div>

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={_t("🔎 Cerca allenamento per nome...")}
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
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0, textAlign: 'center' }}>{_t("Nessun esercizio trovato.")}</p>
                  ) : (
                    filteredExerciseDatabase.map((ex) => (
                      <div key={ex.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'var(--bg-secondary)', borderRadius: '8px', fontSize: '12px' }}>
                        <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                          <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{ex.emoji}</span>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ex.name}</span>
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                            {_t("Rep/Min: {0} • Brucia: {1} kcal", ex.baseCount, ex.baseCalories)}{ex.baseSteps > 0 && <span style={{ color: '#38bdf8', marginLeft: '4px' }}>{_t("• 👟 {0} passi", ex.baseSteps.toLocaleString())}</span>}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            onClick={() => {
                              setShowExercisesModal(false);
                              onOpenModal('exercise', ex);
                            }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', padding: '4px' }}
                            title={_t("Modifica allenamento nel database")}
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteExerciseFromDatabase(ex)}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12px', padding: '4px' }}
                            title={_t("Elimina dal database")}
                          >
                            🗑️
                          </button>
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
                            title={_t("Registra esercizio oggi")}
                          >
                            +
                          </button>
                        </div>
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
            style={{ maxWidth: '500px', width: '92%', maxHeight: '82vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '24px', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)', overflow: 'hidden' }}
          >
            {/* Fixed Top Header */}
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--glass-border)', background: 'var(--bg-card)', flexShrink: 0 }}>
              <h3 className="modal-title" style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>📊</span> {" "}{_t("Storico Dati Salute (30 Giorni)")}</h3>
            </div>

            {/* Fixed Top Summary Average Cards */}
            <div style={{ flexShrink: 0, padding: '14px 16px 8px 16px', background: 'var(--bg-card)', borderBottom: '1px solid var(--glass-border)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={{ background: 'var(--bg-secondary)', padding: '8px 10px', borderRadius: '12px', border: '1px solid var(--glass-border)', textAlign: 'center' }}>
                  <div style={{ fontSize: '9px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{_t("Media Calorie")}</div>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#3b82f6' }}>{_t("{0} kcal/gg", avgCalories)}</div>
                </div>
                <div style={{ background: 'var(--bg-secondary)', padding: '8px 10px', borderRadius: '12px', border: '1px solid var(--glass-border)', textAlign: 'center' }}>
                  <div style={{ fontSize: '9px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{_t("Media Passi")}</div>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--accent-primary)' }}>{_t("{0} passi/gg", avgSteps.toLocaleString())}</div>
                </div>
                <div style={{ background: 'var(--bg-secondary)', padding: '8px 10px', borderRadius: '12px', border: '1px solid var(--glass-border)', textAlign: 'center' }}>
                  <div style={{ fontSize: '9px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{_t("Media Proteine")}</div>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#eab308' }}>{_t("{0} g/gg", avgProteins)}</div>
                </div>
                <div style={{ background: 'var(--bg-secondary)', padding: '8px 10px', borderRadius: '12px', border: '1px solid var(--glass-border)', textAlign: 'center' }}>
                  <div style={{ fontSize: '9px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{_t("Media Acqua")}</div>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#06b6d4' }}>{_t("{0} L/gg", avgWater)}</div>
                </div>
              </div>
            </div>

            {/* Scrollable Single Days Table Section */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 16px 16px', minHeight: 0 }}>
              {historyList.length === 0 ? (
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', margin: '24px 0' }}>
                  {_t("Nessun dato storico salvato nei giorni precedenti. I dati di ciascuna giornata si archiviano automaticamente al cambio del giorno!")}</p>
              ) : (
                <>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
                    <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 1 }}>
                      <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '8px 6px', background: 'var(--bg-card)' }}>{_t("Data")}</th>
                        <th style={{ padding: '8px 6px', background: 'var(--bg-card)' }}>{_t("Calorie")}</th>
                        <th style={{ padding: '8px 6px', background: 'var(--bg-card)' }}>{_t("Passi")}</th>
                        <th style={{ padding: '8px 6px', background: 'var(--bg-card)' }}>{_t("Proteine")}</th>
                        <th style={{ padding: '8px 6px', background: 'var(--bg-card)' }}>{_t("Acqua")}</th>
                        <th style={{ padding: '8px 6px', background: 'var(--bg-card)' }}>{_t("Peso")}</th>
                        {settings?.allowPastEdits && (
                          <th style={{ padding: '8px 6px', background: 'var(--bg-card)', textAlign: 'center' }}>✏️</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {historyList.map((h, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}>
                          <td style={{ padding: '8px 6px', fontWeight: 'bold' }}>{new Date(h.date).toLocaleDateString(getLocale(), { day: 'numeric', month: 'short' })}</td>
                          <td style={{ padding: '8px 6px', color: '#3b82f6' }}>{h.consumed}/{h.burned}</td>
                          <td style={{ padding: '8px 6px', color: 'var(--accent-primary)' }}>{(h.steps || 0).toLocaleString()}</td>
                          <td style={{ padding: '8px 6px', color: '#eab308' }}>{h.proteins || 0}g</td>
                          <td style={{ padding: '8px 6px', color: '#06b6d4' }}>{((h.water || 0) * 0.2).toFixed(1)}L</td>
                          <td style={{ padding: '8px 6px', fontWeight: 'bold' }}>{h.weight ? _t("{0} kg", h.weight) : '--'}</td>
                          {settings?.allowPastEdits && (
                            <td style={{ padding: '8px 6px', textAlign: 'center' }}>
                              <button
                                onClick={() => handleOpenEditHistory(h, idx)}
                                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', borderRadius: '6px', padding: '3px 7px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}
                                title={_t("Modifica dati di questa giornata")}
                              >
                                ✏️
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div style={{ fontSize: '9px', color: settings?.allowPastEdits ? '#4ade80' : 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', marginTop: '10px' }}>
                    {settings?.allowPastEdits ? _t("🔓 Modifica Dati Passati Attiva: usa l'icona ✏️ per correggere una giornata.") : _t("💡 Attiva \"Modifica Dati Passati\" nelle Impostazioni per abilitare la correzione delle singole giornate.")
                    }
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Modifica Giornata Storica */}
      {editingHistoryDay && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100001, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '20px', width: '100%', maxWidth: '340px', padding: '18px' }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {_t("✏️ Modifica Giornata:")}{" "}{new Date(editingHistoryDay.date).toLocaleDateString(getLocale(), { day: 'numeric', month: 'long', year: 'numeric' })}
            </h3>

            <form onSubmit={handleSaveEditHistorySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>{_t("Calorie Consumate")}</label>
                  <input
                    type="number"
                    value={editHistConsumed}
                    onChange={(e) => setEditHistConsumed(e.target.value)}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '12px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>{_t("Calorie Bruciate")}</label>
                  <input
                    type="number"
                    value={editHistBurned}
                    onChange={(e) => setEditHistBurned(e.target.value)}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '12px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>{_t("Passi")}</label>
                  <input
                    type="number"
                    value={editHistSteps}
                    onChange={(e) => setEditHistSteps(e.target.value)}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '12px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>{_t("Proteine (g)")}</label>
                  <input
                    type="number"
                    value={editHistProteins}
                    onChange={(e) => setEditHistProteins(e.target.value)}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '12px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>{_t("Acqua (Bicchieri)")}</label>
                  <input
                    type="number"
                    value={editHistWater}
                    onChange={(e) => setEditHistWater(e.target.value)}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '12px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>{_t("Peso (kg)")}</label>
                  <input
                    type="text"
                    value={editHistWeight}
                    onChange={(e) => setEditHistWeight(e.target.value)}
                    placeholder={_t("es. 74.5")}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '12px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setEditingHistoryDay(null)}
                  style={{ flex: 1, padding: '9px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text-primary)', fontSize: '11px', cursor: 'pointer' }}
                >
                  {_t("Annulla")}</button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '9px', borderRadius: '8px', border: 'none', background: 'var(--accent-primary)', color: '#fff', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  {_t("Salva Modifica")}</button>
              </div>
            </form>
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
                <span>{_t("Valori per {0}g:", selectedFoodForPortion.baseGrams || 100)}{" "}<b>{_t("{0} kcal", selectedFoodForPortion.baseCalories)}</b> • <b>{selectedFoodForPortion.baseProteins}g P</b></span>
                {selectedFoodForPortion.pieceCalories && (
                  <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>
                    {_t("Valori per pezzo:")}{" "}<b>{_t("{0} kcal", selectedFoodForPortion.pieceCalories)}</b> • <b>{selectedFoodForPortion.pieceProteins || 0}g P</b>
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
                  {_t("⚖️ Grammi (g)")}</button>
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
                  {_t("🧩 Pezzi (p)")}</button>
              </div>

              {/* Input quantity */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                    {_t("Quantità (")}{portionUnit === 'piece' ? _t("pezzi") : _t("grammi")}):
                  </label>
                  {(health.foodMemory && health.foodMemory[selectedFoodForPortion.id]) && (
                    <span style={{ fontSize: '9px', color: 'var(--accent-primary)', fontWeight: 'bold' }}>
                      {_t("⚡ Ricordato dall'ultima volta")}</span>
                  )}
                </div>
                <input
                  type="text"
                  value={portionInputValue}
                  onChange={(e) => setPortionInputValue(e.target.value)}
                  placeholder={portionUnit === 'piece' ? _t("Es: 1 oppure 2") : _t("Es: 100 oppure 150")}
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
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>{_t("Calorie Totali")}</span>
                      <b style={{ color: 'var(--text-primary)', fontSize: '13px' }}>{_t("🔥 {0} kcal", previewCal)}</b>
                    </div>
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>{_t("Proteine Totali")}</span>
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
                {_t("🍴 Aggiungi al Pasto")}</button>
            </form>
          </div>
        </div>
      )}

      {/* 4) EDIT LOGGED MEAL ITEM MODAL */}
      {editingLoggedItem && (
        <div
          onClick={() => setEditingLoggedItem(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 100000, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '380px', width: '90%', background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '20px', padding: '20px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
          >
            <h3 style={{ margin: '0 0 10px 0', fontSize: '15px', fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {_t("✏️ Modifica Porzione Loggata")}</h3>
            <p style={{ margin: '0 0 14px 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
              {editingLoggedItem.emoji} <strong>{editingLoggedItem.name}</strong>
            </p>

            <form onSubmit={handleSaveEditLoggedItem} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  {_t("Quantità / Etichetta (es: 150g oppure 2 pz)")}</label>
                <input
                  type="text"
                  value={editLoggedItemGrams}
                  onChange={(e) => setEditLoggedItemGrams(e.target.value)}
                  style={{ width: '100%', height: '36px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '0 10px', fontSize: '12px', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    {_t("Calorie (kcal)")}</label>
                  <input
                    type="number"
                    value={editLoggedItemCal}
                    onChange={(e) => setEditLoggedItemCal(e.target.value)}
                    style={{ width: '100%', height: '36px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '0 10px', fontSize: '12px', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    {_t("Proteine (g)")}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editLoggedItemProt}
                    onChange={(e) => setEditLoggedItemProt(e.target.value)}
                    style={{ width: '100%', height: '36px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '0 10px', fontSize: '12px', outline: 'none' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  {_t("Pasto / Categoria")}</label>
                <select
                  value={editLoggedItemCat}
                  onChange={(e) => setEditLoggedItemCat(e.target.value)}
                  style={{ width: '100%', height: '36px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '0 10px', fontSize: '12px', outline: 'none' }}
                >
                  <option value="breakfast">{_t("Colazione ☕")}</option>
                  <option value="main">{_t("Pasto Principale 🍽️")}</option>
                  <option value="snack">{_t("Spuntino 🍌")}</option>
                  <option value="cheat">{_t("Sgarro 🍕")}</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setEditingLoggedItem(null)}
                  style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer' }}
                >
                  {_t("Annulla")}</button>
                <button
                  type="submit"
                  style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'var(--accent-primary)', color: '#fff', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  {_t("Salva Modifica")}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK MEAL & ONLINE SEARCH MODAL */}
      <QuickMealModal
        isOpen={showQuickMealModal}
        onClose={() => {
          setShowQuickMealModal(false);
          setQuickMealSearch('');
        }}
        onAddMeal={handleAddQuickMeal}
        defaultCategory={activeMealCategory !== 'all' ? activeMealCategory : 'main'}
        existingFoodDatabase={health.foodDatabase || []}
        onToggleFavorite={toggleFoodFavorite}
        initialSearch={quickMealSearch}
      />
    </section>
  );
}
