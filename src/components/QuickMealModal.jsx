import React, { useState, useEffect, useRef } from 'react';
import { searchOnlineFood, guessFoodEmoji } from '../utils/nutritionSearch';

export default function QuickMealModal({
  isOpen,
  onClose,
  onAddMeal,
  defaultCategory = 'main',
  existingFoodDatabase = [],
  initialSearch = ''
}) {
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [onlineResults, setOnlineResults] = useState([]);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [onlineError, setOnlineError] = useState(null);

  // Selected food state (null = showing search list, object = showing portion/data card)
  const [selectedFood, setSelectedFood] = useState(null);

  // Form / Portion state
  const [portionGrams, setPortionGrams] = useState(100);
  const [mealCalories, setMealCalories] = useState('');
  const [mealProteins, setMealProteins] = useState('');
  const [mealCategory, setMealCategory] = useState(defaultCategory);
  const [mealName, setMealName] = useState('');
  const [mealEmoji, setMealEmoji] = useState('🍽️');
  const [saveToDb, setSaveToDb] = useState(true);

  const debounceTimerRef = useRef(null);

  // Handle initialSearch and smart category when opening
  useEffect(() => {
    if (isOpen) {
      if (initialSearch) {
        setSearchQuery(initialSearch);
        triggerOnlineSearch(initialSearch);
      }

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
  }, [isOpen, defaultCategory, initialSearch]);

  // Reset when closing
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setOnlineResults([]);
      setIsSearchingOnline(false);
      setOnlineError(null);
      setSelectedFood(null);
      setPortionGrams(100);
      setMealCalories('');
      setMealProteins('');
      setMealName('');
      setMealEmoji('🍽️');
      setSaveToDb(true);
    }
  }, [isOpen]);

  // Filter local database in memory instantly
  const cleanQ = (searchQuery || '').trim().toLowerCase();
  const localMatches = cleanQ.length >= 1
    ? (existingFoodDatabase || []).filter(f => f.name && f.name.toLowerCase().includes(cleanQ))
    : (existingFoodDatabase || []).slice(0, 6); // show first 6 frequent foods when search query is empty

  // Debounced online search
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!val || val.trim().length < 2) {
      setOnlineResults([]);
      setIsSearchingOnline(false);
      setOnlineError(null);
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      triggerOnlineSearch(val.trim());
    }, 450);
  };

  const triggerOnlineSearch = async (queryText) => {
    const query = (queryText || searchQuery).trim();
    if (!query || query.length < 2) return;

    setIsSearchingOnline(true);
    setOnlineError(null);

    try {
      const results = await searchOnlineFood(query, 8);
      // Filter out online results that might already be in existingFoodDatabase by name
      const localNames = new Set((existingFoodDatabase || []).map(f => (f.name || '').toLowerCase().trim()));
      const filteredResults = results.map(item => ({
        ...item,
        alreadyInLocal: localNames.has(item.name.toLowerCase().trim())
      }));
      setOnlineResults(filteredResults);
    } catch (err) {
      console.error('Online food search failed:', err);
      setOnlineError('Ricerca online momentaneamente non disponibile.');
    } finally {
      setIsSearchingOnline(false);
    }
  };

  // When touching any food (from memory, internet, or manual)
  const handleSelectFood = (food, isFromLocal = false) => {
    setSelectedFood({
      ...food,
      isLocal: isFromLocal
    });

    const foodName = food.name || '';
    setMealName(foodName);
    setMealEmoji(food.emoji || guessFoodEmoji(foodName));

    // Determine initial grams
    let initialGrams = 100;
    if (food.baseGrams && !isNaN(food.baseGrams)) {
      initialGrams = food.baseGrams;
    } else if (food.servingSize) {
      const match = food.servingSize.match(/(\d+)\s*g/i);
      if (match) initialGrams = parseInt(match[1], 10) || 100;
    }
    setPortionGrams(initialGrams);

    // Calculate base calories and proteins
    const baseG = food.baseGrams || 100;
    const factor = initialGrams / baseG;
    const calcCal = Math.round((food.baseCalories || 0) * factor);
    const calcProt = Math.round(((food.baseProteins || 0) * factor) * 10) / 10;

    setMealCalories(calcCal);
    setMealProteins(calcProt);

    // If it's already in the local database, default saveToDb to false (or true if updating)
    // If it's from the web, default saveToDb to true so the user can keep it!
    setSaveToDb(!isFromLocal);
  };

  // Enter purely manual custom dish
  const handleStartManualEntry = () => {
    const customName = searchQuery.trim() || 'Piatto personalizzato';
    handleSelectFood({
      id: 'manual_' + Date.now(),
      name: customName,
      emoji: guessFoodEmoji(customName),
      baseGrams: 100,
      baseCalories: 150,
      baseProteins: 10,
      isManual: true
    }, false);
  };

  // Change portion grams
  const handlePortionChange = (newGrams) => {
    const g = Number(newGrams) || 0;
    setPortionGrams(newGrams);

    if (selectedFood && selectedFood.baseCalories !== undefined && g > 0) {
      const baseG = selectedFood.baseGrams || 100;
      const factor = g / baseG;
      setMealCalories(Math.round(selectedFood.baseCalories * factor));
      setMealProteins(Math.round(selectedFood.baseProteins * factor * 10) / 10);
    }
  };

  // Submit and log to diary
  const handleSubmit = (e) => {
    if (e) e.preventDefault();

    const cleanName = (mealName || selectedFood?.name || '').trim();
    if (!cleanName) return;

    const calNum = Number(mealCalories) || 0;
    const protNum = Number(mealProteins) || 0;
    const gVal = Number(portionGrams) || 100;

    let baseG = 100;
    let baseCal = calNum;
    let baseProt = protNum;

    if (selectedFood && selectedFood.baseCalories !== undefined) {
      baseG = selectedFood.baseGrams || 100;
      baseCal = selectedFood.baseCalories;
      baseProt = selectedFood.baseProteins;
    } else if (gVal > 0) {
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
      grams: `${gVal}g`,
      saveToDb: saveToDb && !selectedFood?.isLocal,
      baseGrams: baseG,
      baseCalories: baseCal,
      baseProteins: baseProt,
      brand: selectedFood?.brand || null,
      imageUrl: selectedFood?.imageUrl || null
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
                  {selectedFood ? 'Scheda Porzione Pasto' : 'Inserisci Pasto Rapido'}
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
                  MEMORIA & ONLINE
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#94a3b8' }}>
                {selectedFood
                  ? 'Imposta i grammi assunti e decidi se salvarlo nel database'
                  : 'Cerca nei tuoi cibi o su internet per compilare al volo'}
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
          
          {/* FASE 1: RICERCA UNIFICATA (MEMORIA PRIMA, POI INTERNET) */}
          {!selectedFood && (
            <>
              {/* Barra di Ricerca Unificata */}
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onKeyDown={(e) => e.key === 'Enter' && triggerOnlineSearch()}
                  placeholder="🔎 Cerca cibo nei tuoi alimenti o su internet..."
                  autoFocus
                  style={{
                    width: '100%',
                    height: '42px',
                    background: 'rgba(15, 23, 42, 0.85)',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    borderRadius: '12px',
                    padding: '0 40px 0 14px',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#f8fafc',
                    boxSizing: 'border-box',
                    outline: 'none',
                    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)'
                  }}
                />
                {isSearchingOnline ? (
                  <span
                    style={{
                      position: 'absolute',
                      right: '14px',
                      top: '12px',
                      fontSize: '14px',
                      animation: 'spin 1s linear infinite'
                    }}
                  >
                    ⏳
                  </span>
                ) : (
                  searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setOnlineResults([]);
                      }}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '11px',
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        fontSize: '14px',
                        cursor: 'pointer'
                      }}
                    >
                      ✕
                    </button>
                  )
                )}
              </div>

              {/* OPZIONE INSERIMENTO LIBERO / MANUALE */}
              {cleanQ.length >= 2 && (
                <div
                  onClick={handleStartManualEntry}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'rgba(139, 92, 246, 0.12)',
                    border: '1px dashed rgba(139, 92, 246, 0.4)',
                    borderRadius: '12px',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>✏️</span>
                    <span style={{ fontSize: '12px', color: '#c4b5fd', fontWeight: 'bold' }}>
                      Inserisci "{searchQuery.trim()}" come pasto personalizzato
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#a78bfa' }}>→</span>
                </div>
              )}

              {/* SEZIONE 1: CIBI IN MEMORIA */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span>💾</span> {cleanQ ? `In Memoria (${localMatches.length})` : 'Cibi Frequenti in Memoria'}
                  </span>
                  {!cleanQ && (
                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>Database Personale</span>
                  )}
                </div>

                {localMatches.length === 0 ? (
                  <div style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic', padding: '6px 2px' }}>
                    Nessun cibo corrispondente trovato in memoria.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                    {localMatches.map((food) => (
                      <div
                        key={food.id}
                        onClick={() => handleSelectFood(food, true)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 10px',
                          background: 'rgba(30, 41, 59, 0.65)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span style={{ fontSize: '20px', flexShrink: 0 }}>{food.emoji || '🍽️'}</span>
                        <div style={{ minWidth: 0, overflow: 'hidden', flex: 1 }}>
                          <div style={{ fontSize: '11.5px', fontWeight: 'bold', color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {food.name}
                          </div>
                          <div style={{ fontSize: '9.5px', color: '#38bdf8', marginTop: '1px' }}>
                            {food.baseCalories} kcal • {food.baseProteins}g P
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SEZIONE 2: RISULTATI DA INTERNET (OPEN FOOD FACTS) */}
              {(onlineResults.length > 0 || isSearchingOnline || (cleanQ.length >= 2 && !isSearchingOnline)) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span>🌐</span> Da Internet (Open Food Facts)
                    </span>
                    {isSearchingOnline && (
                      <span style={{ fontSize: '10px', color: '#a78bfa' }}>Ricerca in corso...</span>
                    )}
                  </div>

                  {onlineResults.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto', paddingRight: '2px' }}>
                      {onlineResults.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleSelectFood(item, false)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 10px',
                            background: 'rgba(15, 23, 42, 0.7)',
                            border: '1px solid rgba(167, 139, 250, 0.25)',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                            <span style={{ fontSize: '20px', flexShrink: 0 }}>{item.emoji}</span>
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
                      ))}
                    </div>
                  ) : (
                    !isSearchingOnline && cleanQ.length >= 2 && (
                      <div style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic', padding: '6px 2px' }}>
                        {onlineError || 'Nessun alimento trovato online. Puoi crearlo manualmente toccando sopra!'}
                      </div>
                    )
                  )}
                </div>
              )}
            </>
          )}

          {/* FASE 2: SCHEDA PORZIONE, GRAMMI E DECISIONE SALVATAGGIO */}
          {selectedFood && (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Box Cibo Selezionato */}
              <div
                style={{
                  background: 'rgba(30, 41, 59, 0.7)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  borderRadius: '16px',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                  <span style={{ fontSize: '26px', flexShrink: 0 }}>{mealEmoji}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {mealName}
                    </div>
                    <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                      Valori base (100g): <b style={{ color: '#38bdf8' }}>{selectedFood.baseCalories} kcal</b> • <b style={{ color: '#a78bfa' }}>{selectedFood.baseProteins}g P</b>
                      {selectedFood.isLocal ? ' • 💾 Salvato in memoria' : ' • 🌐 Dal Web'}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedFood(null)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '4px 8px',
                    color: '#38bdf8',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    flexShrink: 0,
                    marginLeft: '8px'
                  }}
                >
                  Cambia cibo
                </button>
              </div>

              {/* Peso Assunto (Grammi) con Preset Rapidi */}
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '12px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#f8fafc', textTransform: 'uppercase' }}>
                    ⚖️ Peso Assunto (Grammi)
                  </label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[50, 100, 150, 200, 250, 300].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => handlePortionChange(g)}
                        style={{
                          padding: '3px 6px',
                          fontSize: '10px',
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
                  required
                  value={portionGrams}
                  onChange={(e) => handlePortionChange(e.target.value)}
                  placeholder="Inserisci grammi..."
                  style={{
                    width: '100%',
                    height: '40px',
                    background: 'rgba(15, 23, 42, 0.85)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    borderRadius: '10px',
                    padding: '0 12px',
                    fontSize: '15px',
                    fontWeight: '800',
                    color: '#f8fafc',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Risultato Calorie e Proteine Calcolate (Editabili) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#38bdf8', marginBottom: '4px', textTransform: 'uppercase' }}>
                    🔥 Calorie Pasto (kcal)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={mealCalories}
                    onChange={(e) => setMealCalories(e.target.value)}
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
                    🥩 Proteine (g)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={mealProteins}
                    onChange={(e) => setMealProteins(e.target.value)}
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

              {/* Pasto di Destinazione */}
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

              {/* SCELTA SALVATAGGIO NEL DATABASE */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: selectedFood.isLocal ? 'rgba(16, 185, 129, 0.08)' : 'rgba(56, 189, 248, 0.08)',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  border: selectedFood.isLocal ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(56, 189, 248, 0.25)',
                  cursor: selectedFood.isLocal ? 'default' : 'pointer',
                  userSelect: 'none'
                }}
              >
                <input
                  type="checkbox"
                  disabled={selectedFood.isLocal}
                  checked={selectedFood.isLocal || saveToDb}
                  onChange={(e) => setSaveToDb(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: '#38bdf8' }}
                />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11.5px', fontWeight: 'bold', color: '#f8fafc' }}>
                    {selectedFood.isLocal
                      ? '✅ Già presente nel Database Alimenti'
                      : '💾 Salva nel Database Alimenti'}
                  </span>
                  <span style={{ fontSize: '9.5px', color: '#94a3b8' }}>
                    {selectedFood.isLocal
                      ? 'Questo alimento è già memorizzato e pronto all\'uso.'
                      : 'Aggiungilo alla lista cibi per ritrovarlo al volo anche domani.'}
                  </span>
                </div>
              </label>

              {/* Bottone Aggiungi al Diario */}
              <button
                type="submit"
                disabled={!mealName.trim() || !mealCalories}
                style={{
                  marginTop: '2px',
                  padding: '13px',
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
                <span>➕ Aggiungi al Diario</span>
                {mealCalories ? (
                  <span style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '2px 7px', borderRadius: '6px', fontSize: '11px' }}>
                    +{mealCalories} kcal {mealProteins ? `/ ${mealProteins}g P` : ''}
                  </span>
                ) : null}
              </button>

            </form>
          )}

        </div>
      </div>
    </div>
  );
}
