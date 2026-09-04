import React, { useState, useEffect, useRef } from 'react';
import { searchOnlineFood, guessFoodEmoji } from '../utils/nutritionSearch';

export default function QuickMealModal({
  isOpen,
  onClose,
  onAddMeal,
  defaultCategory = 'main',
  existingFoodDatabase = []
}) {
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [selectedOnlineFood, setSelectedOnlineFood] = useState(null);

  // Form state
  const [mealName, setMealName] = useState('');
  const [mealEmoji, setMealEmoji] = useState('🍽️');
  const [mealCategory, setMealCategory] = useState(defaultCategory);
  const [portionGrams, setPortionGrams] = useState(100);
  const [mealCalories, setMealCalories] = useState('');
  const [mealProteins, setMealProteins] = useState('');
  const [mealCarbs, setMealCarbs] = useState('');
  const [mealFat, setMealFat] = useState('');
  const [saveToDb, setSaveToDb] = useState(true);

  const debounceTimerRef = useRef(null);

  // Determine smart default category based on current hour if not specified
  useEffect(() => {
    if (isOpen) {
      if (defaultCategory && defaultCategory !== 'all') {
        const mapped = (defaultCategory === 'lunch' || defaultCategory === 'dinner') ? 'main' : defaultCategory;
        setMealCategory(mapped);
      } else {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 11) {
          setMealCategory('breakfast');
        } else if ((hour >= 11 && hour < 15) || (hour >= 18 && hour < 22)) {
          setMealCategory('main');
        } else {
          setMealCategory('snack');
        }
      }
    }
  }, [isOpen, defaultCategory]);

  // Reset or clear fields on close/open
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setIsSearching(false);
      setHasSearched(false);
      setSearchError(null);
      setSelectedOnlineFood(null);
      setMealName('');
      setMealEmoji('🍽️');
      setPortionGrams(100);
      setMealCalories('');
      setMealProteins('');
      setMealCarbs('');
      setMealFat('');
      setSaveToDb(true);
    }
  }, [isOpen]);

  // Debounced auto-search when user types in search box
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!val || val.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      setHasSearched(false);
      setSearchError(null);
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      triggerSearch(val.trim());
    }, 450);
  };

  const triggerSearch = async (queryText) => {
    const query = (queryText || searchQuery).trim();
    if (!query || query.length < 2) return;

    setIsSearching(true);
    setSearchError(null);
    setHasSearched(true);

    try {
      const results = await searchOnlineFood(query, 8);
      setSearchResults(results);
      if (results.length === 0) {
        setSearchError('Nessun alimento trovato online. Puoi comunque inserire i dati manualmente qui sotto!');
      }
    } catch (err) {
      console.error('Food search failed:', err);
      setSearchError('Impossibile contattare il database online. Inserisci i dati manualmente.');
    } finally {
      setIsSearching(false);
    }
  };

  // When a search result item is clicked, populate fields
  const handleSelectResult = (item) => {
    setSelectedOnlineFood(item);
    setMealName(item.name);
    setMealEmoji(item.emoji || guessFoodEmoji(item.name));

    // If item has a specific serving, default grams to that or 100
    let grams = 100;
    if (item.servingSize) {
      const match = item.servingSize.match(/(\d+)\s*g/i);
      if (match) {
        grams = parseInt(match[1], 10) || 100;
      }
    }
    setPortionGrams(grams);

    // Calculate calories & proteins for the chosen grams
    const baseG = item.baseGrams || 100;
    const factor = grams / baseG;
    setMealCalories(Math.round(item.baseCalories * factor));
    setMealProteins(Math.round(item.baseProteins * factor * 10) / 10);
    setMealCarbs(item.carbs !== null ? Math.round(item.carbs * factor * 10) / 10 : '');
    setMealFat(item.fat !== null ? Math.round(item.fat * factor * 10) / 10 : '');
  };

  // Recalculate when portion grams change
  const handlePortionChange = (newGrams) => {
    const g = Number(newGrams) || 0;
    setPortionGrams(newGrams);

    if (selectedOnlineFood && selectedOnlineFood.baseCalories !== undefined && g > 0) {
      const baseG = selectedOnlineFood.baseGrams || 100;
      const factor = g / baseG;
      setMealCalories(Math.round(selectedOnlineFood.baseCalories * factor));
      setMealProteins(Math.round(selectedOnlineFood.baseProteins * factor * 10) / 10);
      if (selectedOnlineFood.carbs !== null) {
        setMealCarbs(Math.round(selectedOnlineFood.carbs * factor * 10) / 10);
      }
      if (selectedOnlineFood.fat !== null) {
        setMealFat(Math.round(selectedOnlineFood.fat * factor * 10) / 10);
      }
    }
  };

  // Quick preset grams buttons
  const applyPresetGrams = (g) => {
    handlePortionChange(g);
  };

  // Name manual edit
  const handleNameChange = (e) => {
    const newName = e.target.value;
    setMealName(newName);
    // If not selected from search, update emoji suggestion
    if (!selectedOnlineFood) {
      setMealEmoji(guessFoodEmoji(newName));
    }
  };

  // Submit
  const handleSubmit = (e) => {
    if (e) e.preventDefault();

    const cleanName = (mealName || '').trim();
    if (!cleanName) return;

    const calNum = Number(mealCalories) || 0;
    const protNum = Number(mealProteins) || 0;
    const carbsNum = mealCarbs !== '' && mealCarbs !== null ? Number(mealCarbs) : null;
    const fatNum = mealFat !== '' && mealFat !== null ? Number(mealFat) : null;
    const gVal = Number(portionGrams) || 100;

    // Determine base values for database saving
    let baseG = 100;
    let baseCal = calNum;
    let baseProt = protNum;

    if (selectedOnlineFood) {
      baseG = selectedOnlineFood.baseGrams || 100;
      baseCal = selectedOnlineFood.baseCalories;
      baseProt = selectedOnlineFood.baseProteins;
    } else if (gVal > 0) {
      // Scale back to 100g if entered custom
      baseG = 100;
      baseCal = Math.round((calNum / gVal) * 100);
      baseProt = Math.round(((protNum / gVal) * 100) * 10) / 10;
    }

    onAddMeal({
      name: cleanName,
      emoji: mealEmoji || '🍽️',
      category: mealCategory,
      calories: calNum,
      proteins: protNum,
      carbs: carbsNum,
      fat: fatNum,
      grams: `${gVal}g`,
      saveToDb,
      baseGrams: baseG,
      baseCalories: baseCal,
      baseProteins: baseProt,
      brand: selectedOnlineFood?.brand || null,
      imageUrl: selectedOnlineFood?.imageUrl || null
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100000,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        boxSizing: 'border-box'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(180deg, #161f30 0%, #0f172a 100%)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '520px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.75), 0 0 25px rgba(56, 189, 248, 0.1)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(15, 23, 42, 0.75)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>🍽️</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#f8fafc' }}>
                  Inserisci Pasto Rapido
                </h3>
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: '800',
                    background: 'rgba(56, 189, 248, 0.15)',
                    color: '#38bdf8',
                    padding: '2px 7px',
                    borderRadius: '8px',
                    border: '1px solid rgba(56, 189, 248, 0.3)'
                  }}
                >
                  ONLINE & MANUALE
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#94a3b8' }}>
                Registra calorie e macro nel diario giornaliero
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: 'none',
              borderRadius: '50%',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              fontSize: '15px',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* 1. SEZIONE RICERCA ONLINE */}
          <div style={{ background: 'rgba(30, 41, 59, 0.55)', padding: '12px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span>🌐</span> Ricerca Database Online
              </label>
              <span style={{ fontSize: '10px', color: '#94a3b8' }}>Open Food Facts</span>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onKeyDown={(e) => e.key === 'Enter' && triggerSearch()}
                  placeholder="Es: Carbonara, Pizza, Petto di pollo, Yogurt..."
                  style={{
                    width: '100%',
                    height: '38px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    borderRadius: '10px',
                    padding: '0 12px',
                    fontSize: '12px',
                    color: '#f8fafc',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                />
                {isSearching && (
                  <span
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '10px',
                      fontSize: '12px',
                      animation: 'spin 1s linear infinite'
                    }}
                  >
                    ⏳
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => triggerSearch()}
                disabled={isSearching || !searchQuery.trim()}
                style={{
                  padding: '0 14px',
                  height: '38px',
                  background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: isSearching ? 'wait' : 'pointer',
                  opacity: isSearching || !searchQuery.trim() ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  flexShrink: 0
                }}
              >
                🔎 Cerca
              </button>
            </div>

            {/* Risultati della Ricerca */}
            {searchResults.length > 0 && (
              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '170px', overflowY: 'auto', paddingRight: '4px' }}>
                <div style={{ fontSize: '10px', color: '#94a3b8', fontStyle: 'italic', marginBottom: '2px' }}>
                  Tocca un alimento per compilare automaticamente i valori:
                </div>
                {searchResults.map((item) => {
                  const isSelected = selectedOnlineFood?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectResult(item)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '7px 10px',
                        background: isSelected ? 'rgba(56, 189, 248, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                        border: isSelected ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.05)',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                        <span style={{ fontSize: '18px', flexShrink: 0 }}>{item.emoji}</span>
                        <div style={{ minWidth: 0, overflow: 'hidden' }}>
                          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.name}
                          </div>
                          {item.brand && (
                            <div style={{ fontSize: '9.5px', color: '#94a3b8' }}>
                              {item.brand}
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, marginLeft: '8px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#38bdf8' }}>
                          {item.baseCalories} kcal
                        </span>
                        <span style={{ fontSize: '10px', color: '#a78bfa', background: 'rgba(167, 139, 250, 0.15)', padding: '1px 5px', borderRadius: '6px' }}>
                          {item.baseProteins}g P
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {hasSearched && !isSearching && searchResults.length === 0 && searchError && (
              <div style={{ marginTop: '8px', fontSize: '11px', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)', padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                {searchError}
              </div>
            )}
          </div>

          {/* 2. DETTAGLI DEL PASTO DA INSERIRE */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            {/* Nome e Emoji */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ width: '56px' }}>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase' }}>
                  Icona
                </label>
                <input
                  type="text"
                  value={mealEmoji}
                  onChange={(e) => setMealEmoji(e.target.value)}
                  style={{
                    width: '100%',
                    height: '38px',
                    textAlign: 'center',
                    fontSize: '18px',
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '10px',
                    color: '#f8fafc',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase' }}>
                  Nome Portata / Alimento *
                </label>
                <input
                  type="text"
                  required
                  value={mealName}
                  onChange={handleNameChange}
                  placeholder="Es: Pasta al pomodoro, Tonno..."
                  style={{
                    width: '100%',
                    height: '38px',
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '10px',
                    padding: '0 12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#f8fafc',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Categoria Pasto */}
            <div>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase' }}>
                Pasto di Destinazione
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                {[
                  { id: 'breakfast', label: 'Colazione', icon: '☕' },
                  { id: 'main', label: 'Principale', icon: '🍽️' },
                  { id: 'snack', label: 'Spuntino', icon: '🍌' },
                  { id: 'cheat', label: 'Sgarro', icon: '🍕' }
                ].map((cat) => {
                  const isSel = mealCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setMealCategory(cat.id)}
                      style={{
                        padding: '6px 4px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        border: isSel ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                        background: isSel ? 'rgba(56, 189, 248, 0.25)' : 'rgba(15, 23, 42, 0.6)',
                        color: isSel ? '#ffffff' : '#94a3b8',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span style={{ fontSize: '14px' }}>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Grammi / Porzione Rapida */}
            <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '10px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>
                  Quantità (Grammi)
                </span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[50, 100, 150, 200, 250].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => applyPresetGrams(g)}
                      style={{
                        padding: '2px 6px',
                        fontSize: '9.5px',
                        fontWeight: 'bold',
                        background: Number(portionGrams) === g ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.06)',
                        color: Number(portionGrams) === g ? '#38bdf8' : '#cbd5e1',
                        border: Number(portionGrams) === g ? '1px solid #38bdf8' : '1px solid transparent',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      {g}g
                    </button>
                  ))}
                </div>
              </div>

              <input
                type="number"
                min="1"
                step="5"
                value={portionGrams}
                onChange={(e) => handlePortionChange(e.target.value)}
                placeholder="Grammi porzione..."
                style={{
                  width: '100%',
                  height: '34px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  padding: '0 10px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: '#f8fafc',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Calorie e Proteine Form */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#38bdf8', marginBottom: '4px', textTransform: 'uppercase' }}>
                  🔥 Calorie Totali (kcal) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={mealCalories}
                  onChange={(e) => setMealCalories(e.target.value)}
                  placeholder="Es: 350"
                  style={{
                    width: '100%',
                    height: '38px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    borderRadius: '10px',
                    padding: '0 12px',
                    fontSize: '14px',
                    fontWeight: '800',
                    color: '#38bdf8',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#a78bfa', marginBottom: '4px', textTransform: 'uppercase' }}>
                  🥩 Proteine Totali (g)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={mealProteins}
                  onChange={(e) => setMealProteins(e.target.value)}
                  placeholder="Es: 25"
                  style={{
                    width: '100%',
                    height: '38px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(167, 139, 250, 0.4)',
                    borderRadius: '10px',
                    padding: '0 12px',
                    fontSize: '14px',
                    fontWeight: '800',
                    color: '#a78bfa',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Checkbox Salvataggio Database */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(56, 189, 248, 0.08)',
                padding: '8px 10px',
                borderRadius: '10px',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                cursor: 'pointer',
                userSelect: 'none'
              }}
            >
              <input
                type="checkbox"
                checked={saveToDb}
                onChange={(e) => setSaveToDb(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: '#38bdf8' }}
              />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#f8fafc' }}>
                  💾 Salva anche nel Database Alimenti
                </span>
                <span style={{ fontSize: '9px', color: '#94a3b8' }}>
                  Lo troverai nella lista cibi frequenti per riutilizzarlo con 1 click
                </span>
              </div>
            </label>

            {/* Pulsante di Conferma */}
            <button
              type="submit"
              disabled={!mealName.trim() || !mealCalories}
              style={{
                marginTop: '4px',
                padding: '12px',
                borderRadius: '12px',
                background: (!mealName.trim() || !mealCalories)
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                border: 'none',
                fontSize: '13px',
                fontWeight: '800',
                letterSpacing: '0.3px',
                cursor: (!mealName.trim() || !mealCalories) ? 'not-allowed' : 'pointer',
                boxShadow: (!mealName.trim() || !mealCalories) ? 'none' : '0 4px 15px rgba(16, 185, 129, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <span>➕ Registra nel Diario</span>
              {mealCalories ? (
                <span style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '2px 6px', borderRadius: '6px', fontSize: '11px' }}>
                  +{mealCalories} kcal {mealProteins ? `/ ${mealProteins}g P` : ''}
                </span>
              ) : null}
            </button>

          </form>

        </div>
      </div>
    </div>
  );
}
