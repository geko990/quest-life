import React, { useState, useEffect, useRef } from 'react';
import { searchOnlineFood, guessFoodEmoji } from '../utils/nutritionSearch';

import { _t } from '../i18n';
import EmojiField from './EmojiField';
export default function QuickMealModal({
  isOpen,
  onClose,
  onAddMeal,
  defaultCategory = 'main',
  existingFoodDatabase = [],
  initialSearch = '',
  onToggleFavorite
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
  // Senza ricerca: i preferiti (o, se non ce ne sono, i primi 6 cibi). Con la ricerca: tutto l'archivio, preferiti in cima
  const favoriteFoods = (existingFoodDatabase || []).filter(f => f.favorite);
  const showingFavorites = cleanQ.length === 0 && favoriteFoods.length > 0;
  const localMatches = cleanQ.length >= 1
    ? (existingFoodDatabase || [])
        .filter(f => f.name && f.name.toLowerCase().includes(cleanQ))
        .sort((a, b) => Number(!!b.favorite) - Number(!!a.favorite))
    : (showingFavorites ? favoriteFoods : (existingFoodDatabase || []).slice(0, 6));

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
      setOnlineError(_t("Ricerca online momentaneamente non disponibile."));
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

  // Pasto libero: solo kcal e proteine, senza cercare un alimento né indicare i grammi
  const handleStartTotalsEntry = () => {
    const customName = searchQuery.trim() || 'Pasto libero';
    setSelectedFood({
      id: 'totals_' + Date.now(),
      name: customName,
      emoji: guessFoodEmoji(customName),
      isManual: true,
      isTotalsOnly: true
    });
    setMealName(customName);
    setMealEmoji(guessFoodEmoji(customName) || '🍽️');
    setPortionGrams('');
    setMealCalories('');
    setMealProteins('');
    setSaveToDb(false);
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

    if (selectedFood?.isTotalsOnly) {
      onAddMeal({
        name: cleanName,
        emoji: mealEmoji || '🍽️',
        category: mealCategory,
        calories: calNum,
        proteins: protNum,
        grams: '1 porzione',
        saveToDb: false,
        baseGrams: 100,
        baseCalories: calNum,
        baseProteins: protNum,
        brand: null,
        imageUrl: null
      });
      onClose();
      return;
    }

    const gVal = Number(portionGrams) || 100;

    let baseG = 100;
    let baseCal = calNum;
    let baseProt = protNum;

    if (gVal > 0) {
      baseG = 100;
      baseCal = Math.round((calNum / gVal) * 100);
      baseProt = Math.round(((protNum / gVal) * 100) * 10) / 10;
    } else if (selectedFood && selectedFood.baseCalories !== undefined) {
      baseG = selectedFood.baseGrams || 100;
      baseCal = selectedFood.baseCalories;
      baseProt = selectedFood.baseProteins;
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
                  {selectedFood ? _t("Scheda Porzione Pasto") : _t("Inserisci Pasto Rapido")}
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
                  {_t("MEMORIA & ONLINE")}</span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#94a3b8' }}>
                {selectedFood ? _t("Imposta i grammi assunti e decidi se salvarlo nel database") : _t("Cerca nei tuoi cibi o su internet per compilare al volo")}
              </p>
            </div>
          </div>

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
                  placeholder={_t("🔎 Cerca cibo nei tuoi alimenti o su internet...")}
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

              {/* PASTO LIBERO: solo kcal e proteine */}
              <button
                type="button"
                onClick={handleStartTotalsEntry}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px' }}>🔢</span>
                  <span style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '12px', color: '#6ee7b7', fontWeight: 'bold' }}>
                      {cleanQ ? _t("\"{0}\": inserisci solo kcal e proteine", searchQuery.trim()) : _t("Inserisci solo kcal e proteine")}
                    </span>
                    <span style={{ fontSize: '9.5px', color: '#94a3b8' }}>{_t("Per pasti fuori casa o già calcolati, senza grammi")}</span>
                  </span>
                </span>
                <span style={{ fontSize: '11px', color: '#6ee7b7' }}>→</span>
              </button>

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
                      {_t("Inserisci \"{0}\" come pasto personalizzato", searchQuery.trim())}</span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#a78bfa' }}>→</span>
                </div>
              )}

              {/* SEZIONE 1: CIBI IN MEMORIA (solo mentre si cerca: l'anello calorie apre ricerca e inserimento manuale) */}
              {cleanQ && <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span>{showingFavorites ? '⭐' : '💾'}</span> {cleanQ ? _t("Nel tuo archivio ({0})", localMatches.length) : (showingFavorites ? _t("Preferiti ({0})", favoriteFoods.length) : _t("Cibi in memoria"))}
                  </span>
                  {!cleanQ && (
                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>{showingFavorites ? _t("Scrivi per cercare in tutto l'archivio") : _t("Tocca ☆ in un cibo per i preferiti")}</span>
                  )}
                </div>

                {localMatches.length === 0 ? (
                  <div style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic', padding: '6px 2px' }}>
                    {_t("Nessun cibo corrispondente trovato in memoria.")}</div>
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
                            {_t("{0} kcal • {1}g P", food.baseCalories, food.baseProteins)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>}

              {/* SEZIONE 2: RISULTATI DA INTERNET (OPEN FOOD FACTS) */}
              {(onlineResults.length > 0 || isSearchingOnline || (cleanQ.length >= 2 && !isSearchingOnline)) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span>🌐</span> {" "}{_t("Da Internet (Open Food Facts)")}</span>
                    {isSearchingOnline && (
                      <span style={{ fontSize: '10px', color: '#a78bfa' }}>{_t("Ricerca in corso...")}</span>
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
                              {_t("{0} kcal", item.baseCalories)}</span>
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
                        {onlineError || _t("Nessun alimento trovato online. Puoi crearlo manualmente toccando sopra!")}
                      </div>
                    )
                  )}
                </div>
              )}
            </>
          )}

          {/* FASE 2: SCHEDA PORZIONE, GRAMMI E DECISIONE SALVATAGGIO */}
          {selectedFood && (() => {
            const isTotalsOnly = !!selectedFood.isTotalsOnly;
            const isSubmitDisabled = !mealName.trim() || mealCalories === '' || isNaN(Number(mealCalories)) || Number(mealCalories) < 0 ||
              (!isTotalsOnly && (!portionGrams || isNaN(Number(portionGrams)) || Number(portionGrams) <= 0));

            return (
              <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                {/* Box Cibo Selezionato con Nome Modificabile */}
                <div
                  style={{
                    background: 'rgba(30, 41, 59, 0.7)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    borderRadius: '16px',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {selectedFood.isLocal && onToggleFavorite && (
                      <button
                        type="button"
                        onClick={() => {
                          onToggleFavorite(selectedFood.id);
                          setSelectedFood(prev => ({ ...prev, favorite: !prev.favorite }));
                        }}
                        title={selectedFood.favorite ? _t("Togli dai preferiti") : _t("Aggiungi ai preferiti")}
                        style={{ background: 'none', border: 'none', padding: 0, fontSize: '16px', lineHeight: 1, cursor: 'pointer', color: selectedFood.favorite ? '#f59e0b' : '#64748b' }}
                      >
                        {selectedFood.favorite ? '★' : '☆'}
                      </button>
                    )}
                    <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#38bdf8', textTransform: 'uppercase' }}>
                      {isTotalsOnly ? _t("🔢 Pasto libero: solo kcal e proteine") : (selectedFood.isManual ? _t("✏️ Pasto personalizzato") : (selectedFood.isLocal ? _t("💾 Cibo da Memoria") : _t("🌐 Cibo da Internet")))}
                    </span>
                    </span>
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
                        cursor: 'pointer'
                      }}
                    >
                      {_t("← Cambia cibo")}</button>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase' }}>
                      {_t("Nome Alimento")}</label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <EmojiField
                        value={mealEmoji}
                        onChange={setMealEmoji}
                        style={{
                          width: '42px',
                          height: '38px',
                          textAlign: 'center',
                          fontSize: '20px',
                          background: 'rgba(15, 23, 42, 0.85)',
                          border: '1px solid rgba(56, 189, 248, 0.3)',
                          borderRadius: '10px',
                          color: '#f8fafc'
                        }}
                        title={_t("Icona / Emoji")}
                      />
                      <input
                        type="text"
                        value={mealName}
                        onChange={(e) => setMealName(e.target.value)}
                        placeholder={_t("Nome dell'alimento...")}
                        style={{
                          flex: 1,
                          height: '38px',
                          background: 'rgba(15, 23, 42, 0.85)',
                          border: '1px solid rgba(56, 189, 248, 0.3)',
                          borderRadius: '10px',
                          padding: '0 10px',
                          fontSize: '13px',
                          fontWeight: 'bold',
                          color: '#f8fafc',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>

                  {!isTotalsOnly && <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                    {_t("Valori base (100g):")}{" "}<b style={{ color: '#38bdf8' }}>{_t("{0} kcal", selectedFood.baseCalories ?? 0)}</b> • <b style={{ color: '#a78bfa' }}>{selectedFood.baseProteins ?? 0}g P</b>
                    {selectedFood.brand ? _t(" • Marca: {0}", selectedFood.brand) : ''}
                  </div>}
                </div>

                {/* Peso Assunto (Grammi) con Preset Rapidi */}
                {!isTotalsOnly && <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '12px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#f8fafc', textTransform: 'uppercase' }}>
                      {_t("⚖️ Peso Assunto (Grammi)")}</label>
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
                    step="any"
                    value={portionGrams}
                    onChange={(e) => handlePortionChange(e.target.value)}
                    placeholder={_t("Inserisci grammi...")}
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
                </div>}

                {/* Risultato Calorie e Proteine Calcolate (Editabili) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#38bdf8', marginBottom: '4px', textTransform: 'uppercase' }}>
                      {_t("🔥 Calorie Pasto (kcal)")}</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={mealCalories}
                      onChange={(e) => setMealCalories(e.target.value)}
                      autoFocus={isTotalsOnly}
                      inputMode="decimal"
                      placeholder={isTotalsOnly ? _t("es. 800") : undefined}
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
                      {_t("🥩 Proteine (g)")}</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={mealProteins}
                      onChange={(e) => setMealProteins(e.target.value)}
                      inputMode="decimal"
                      placeholder={isTotalsOnly ? _t("es. 40") : undefined}
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
                    {_t("Pasto di Destinazione")}</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                    {[
                      { id: 'breakfast', label: _t("Colazione"), icon: '☕' },
                      { id: 'main', label: _t("Principale"), icon: '🍽️' },
                      { id: 'snack', label: _t("Spuntino"), icon: '🍌' },
                      { id: 'cheat', label: _t("Sgarro"), icon: '🍕' }
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
                          <span>{_t(cat.label)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* SCELTA SALVATAGGIO NEL DATABASE */}
                {!isTotalsOnly && <label
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
                      {selectedFood.isLocal ? _t("✅ Già presente nel Database Alimenti") : (saveToDb ? _t("💾 Salva anche nel Database Alimenti") : _t("❌ Non salvare nel Database (solo oggi)"))}
                    </span>
                    <span style={{ fontSize: '9.5px', color: '#94a3b8' }}>
                      {selectedFood.isLocal ? _t("Questo alimento è già memorizzato e pronto all'uso.") : (saveToDb ? _t("Aggiungilo alla lista cibi per ritrovarlo al volo anche domani.") : _t("Verrà conteggiato solo nel diario di oggi senza occupare spazio nel database."))}
                    </span>
                  </div>
                </label>}

                {/* Bottone Aggiungi al Diario */}
                <button
                  type="submit"
                  disabled={isSubmitDisabled}
                  style={{
                    marginTop: '2px',
                    padding: '13px',
                    borderRadius: '12px',
                    background: isSubmitDisabled
                      ? 'rgba(255, 255, 255, 0.1)'
                      : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: '800',
                    letterSpacing: '0.3px',
                    cursor: isSubmitDisabled ? 'not-allowed' : 'pointer',
                    boxShadow: isSubmitDisabled ? 'none' : '0 4px 15px rgba(16, 185, 129, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>
                    {saveToDb && !selectedFood.isLocal && !isTotalsOnly ? _t("➕ Aggiungi al Diario & Salva nel Database") : _t("➕ Aggiungi al Diario di Oggi")}
                  </span>
                  {mealCalories !== '' && !isNaN(Number(mealCalories)) ? (
                    <span style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '2px 7px', borderRadius: '6px', fontSize: '11px' }}>
                      {_t("+{0} kcal", mealCalories)}{" "}{mealProteins ? `/ ${mealProteins}g P` : ''}
                    </span>
                  ) : null}
                </button>

              </form>
            );
          })()}

        </div>
      </div>
    </div>
  );
}
