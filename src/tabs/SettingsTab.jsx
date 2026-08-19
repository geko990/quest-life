import React, { useState } from 'react';
import { ACCENT_COLORS, APP_VERSION, BUILD_TIME } from '../utils/constants';
import { forceUpdateApp } from '../utils/helpers';

export default function SettingsTab({
  settings = {},
  setSettings,
  player = {},
  setPlayer,
  xpLog = [],
  stats = [],
  habits = [],
  fileHandle,
  onLinkDatabase,
  onReconnectDatabase,
  onExport,
  onImport,
  onFixData,
  onRepairStreaks,
  onReset,
  onApplyPresetDay
}) {
  const [expandedGroup, setExpandedGroup] = useState(null);
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [editingPreset, setEditingPreset] = useState(null);

  const safeSettings = settings || {};
  const safePlayer = player || {};
  const safeXpLog = Array.isArray(xpLog) ? xpLog : [];
  const safeHabitNames = (habits || []).map(h => (h.name || '').trim().toLowerCase()).filter(Boolean);

  // Group raw XP log entries into single task completions (EXCLUDING HABITS - keeping only tasks & campaign milestones)
  const groupedXpLog = [];
  safeXpLog.forEach((entry) => {
    if (!entry) return;
    const title = (entry.title || entry.reason || entry.name || entry.source || 'Attività completata').trim();
    if (!title) return;

    // Filter out habits
    if (entry.itemType === 'habit') return;
    if (entry.isMonthlyTask === false) return;
    if (safeHabitNames.includes(title.toLowerCase())) return;

    const date = entry.date || '';
    const timestamp = entry.timestamp || 0;

    const lastGroup = groupedXpLog[groupedXpLog.length - 1];

    const isSameTask =
      lastGroup &&
      lastGroup.title === title &&
      lastGroup.date === date &&
      (
        (timestamp && lastGroup.maxTimestamp && Math.abs(timestamp - lastGroup.maxTimestamp) <= 5000) ||
        (!timestamp || !lastGroup.maxTimestamp)
      );

    if (isSameTask) {
      lastGroup.totalAmount += Number(entry.amount) || 0;
      if (entry.statId && !lastGroup.statIds.includes(entry.statId)) {
        lastGroup.statIds.push(entry.statId);
      }
      if (timestamp) {
        lastGroup.maxTimestamp = Math.max(lastGroup.maxTimestamp, timestamp);
      }
    } else {
      groupedXpLog.push({
        title,
        date,
        maxTimestamp: timestamp,
        totalAmount: Number(entry.amount) || 0,
        statIds: entry.statId ? [entry.statId] : []
      });
    }
  });

  // Default Routine Models for Day Routine Models
  const safePresetDays = Array.isArray(safeSettings.presetDays) && safeSettings.presetDays.length > 0 ? safeSettings.presetDays : [
    {
      id: 'preset_work',
      name: 'Giorno Lavorativo',
      emoji: '💼',
      description: 'Sequenza guidata per la giornata lavorativa',
      steps: [
        { id: '1', time: '07:00', title: '🌅 Sveglia, Idratazione & Stretching' },
        { id: '2', time: '08:30', title: '💻 Deep Work & Task Prioritarie' },
        { id: '3', time: '12:30', title: '🥗 Pranzo Leggero & Camminata 15m' },
        { id: '4', time: '14:00', title: '📧 Gestione Messaggi & Meeting' },
        { id: '5', time: '22:00', title: '📖 Lettura & Prep Routine Notturna' }
      ]
    },
    {
      id: 'preset_rest',
      name: 'Giorno di Riposo',
      emoji: '🌿',
      description: 'Routine per ricaricare le energie e rilassarsi',
      steps: [
        { id: '1', time: '08:30', title: '☕ Sveglia Calma & Colazione' },
        { id: '2', time: '10:30', title: '🚶 Camminata nella Natura o Hobby' },
        { id: '3', time: '13:00', title: '🍕 Pranzo Conviviale & Svago' },
        { id: '4', time: '16:00', title: '🎮 Tempo Libero & Relax Total' },
        { id: '5', time: '22:30', title: '🛋️ Routine Serale Decompressiva' }
      ]
    },
    {
      id: 'preset_fit',
      name: 'Giorno Allenamento',
      emoji: '🏋️',
      description: 'Routine incentrata su movimento, nutrizione e recupero',
      steps: [
        { id: '1', time: '07:00', title: '💧 Idratazione & Colazione Energetica' },
        { id: '2', time: '10:00', title: '🏋️ Sessione Allenamento Completa' },
        { id: '3', time: '13:00', title: '🍗 Pasto Post-Workout Bilanciato' },
        { id: '4', time: '17:00', title: '🚶 10.000 Passi & Stretching Mobility' },
        { id: '5', time: '22:00', title: '💤 Sonno Rigenerante' }
      ]
    }
  ];

  // Helper to safely extract steps list from preset
  const getPresetSteps = (preset) => {
    if (Array.isArray(preset.steps) && preset.steps.length > 0) {
      return preset.steps;
    }
    if (preset.slots) {
      const list = [];
      if (preset.slots.action?.name) list.push({ id: 's1', time: '08:00', title: preset.slots.action.name });
      if (preset.slots.bonus?.name) list.push({ id: 's2', time: '11:00', title: preset.slots.bonus.name });
      if (preset.slots.movement?.name) list.push({ id: 's3', time: '17:00', title: preset.slots.movement.name });
      if (preset.slots.reaction?.name) list.push({ id: 's4', time: '22:00', title: preset.slots.reaction.name });
      return list;
    }
    return [];
  };

  const toggleGroup = (groupName) => {
    setExpandedGroup(expandedGroup === groupName ? null : groupName);
  };

  const updateSetting = (key, value) => {
    if (setSettings) setSettings(prev => ({ ...(prev || {}), [key]: value }));
  };

  const updatePlayerName = (name) => {
    if (setPlayer) setPlayer(prev => ({ ...(prev || {}), name: (name || '').trim() || 'Avventuriero' }));
  };

  const handleOpenNewPreset = () => {
    setEditingPreset({
      id: '',
      name: '',
      emoji: '📅',
      description: '',
      steps: [
        { id: 'step_1', time: '07:00', title: '🌅 Sveglia & Idratazione' },
        { id: 'step_2', time: '08:30', title: '💻 Focus & Task Principali' },
        { id: 'step_3', time: '13:00', title: '🥗 Pranzo & Relax' },
        { id: 'step_4', time: '22:00', title: '📖 Routine Notturna' }
      ]
    });
    setShowPresetModal(true);
  };

  const handleEditPreset = (preset) => {
    const presetCopy = JSON.parse(JSON.stringify(preset));
    if (!Array.isArray(presetCopy.steps) || presetCopy.steps.length === 0) {
      presetCopy.steps = getPresetSteps(presetCopy);
    }
    setEditingPreset(presetCopy);
    setShowPresetModal(true);
  };

  const handleSavePreset = (presetData) => {
    if (!presetData || !presetData.name || !presetData.name.trim()) {
      alert('Inserisci un nome per la Giornata Tipo!');
      return;
    }
    const existing = safePresetDays;
    let updated = [];
    if (presetData.id) {
      updated = existing.map(p => p.id === presetData.id ? presetData : p);
    } else {
      updated = [...existing, { ...presetData, id: `preset_${Date.now()}` }];
    }
    if (setSettings) setSettings(prev => ({ ...(prev || {}), presetDays: updated }));
    setShowPresetModal(false);
    setEditingPreset(null);
  };

  const handleDeletePreset = (id) => {
    if (window.confirm('Vuoi davvero eliminare questo modello di giornata?')) {
      const updated = safePresetDays.filter(p => p && p.id !== id);
      if (setSettings) setSettings(prev => ({ ...(prev || {}), presetDays: updated }));
    }
  };

  return (
    <section id="section-settings" className="section active">
      {/* Centered Floating Profile Header (No Bounding Card) */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          margin: '8px 0 22px 0',
          textAlign: 'center'
        }}
      >
        {/* Avatar Frame (Bigger Size: 96px) */}
        <div
          style={{
            position: 'relative',
            width: '96px',
            height: '96px',
            borderRadius: '50%',
            background: 'var(--bg-card)',
            border: '3px solid var(--accent-gold, #f59e0b)',
            boxShadow: '0 0 22px rgba(245, 158, 11, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          }}
        >
          {safePlayer.avatarType === 'image' && safePlayer.avatarImage ? (
            <img
              src={safePlayer.avatarImage}
              alt="Avatar"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span style={{ fontSize: '48px' }}>
              {safePlayer.avatarEmoji || '⚔️'}
            </span>
          )}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              left: 0,
              background: 'rgba(0,0,0,0.75)',
              fontSize: '9px',
              color: '#fbbf24',
              padding: '2px 0',
              fontWeight: 'bold',
              letterSpacing: '0.5px'
            }}
          >
            Lvl {safePlayer.level || 1}
          </div>
        </div>

        {/* Clean Player Name (Tap to Rename) */}
        <h2
          onClick={() => {
            const newName = window.prompt("Modifica Nome Giocatore:", safePlayer.name || 'Avventuriero');
            if (newName !== null) updatePlayerName(newName);
          }}
          style={{
            margin: 0,
            fontSize: '22px',
            fontWeight: '800',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            textAlign: 'center',
            letterSpacing: '0.3px'
          }}
          title="Tocca per rinominare"
        >
          {safePlayer.name || 'Avventuriero'}
        </h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Group 1: Gameplay */}
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <div
            onClick={() => toggleGroup('gameplay')}
            style={{ padding: '14px 16px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--glass-border)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              🎮 Gameplay
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {expandedGroup === 'gameplay' ? '▲' : '▼'}
            </span>
          </div>

          {expandedGroup === 'gameplay' && (
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '12px' }}>
              {/* Day Start Hour */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Inizio nuovo giorno</label>
                <select
                  value={safeSettings.dayStartTime !== undefined ? safeSettings.dayStartTime : 0}
                  onChange={(e) => updateSetting('dayStartTime', parseInt(e.target.value))}
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '10px 12px', color: 'var(--text-primary)', fontSize: '12px' }}
                >
                  <option value="0">00:00 (Mezzanotte)</option>
                  <option value="1">01:00</option>
                  <option value="2">02:00</option>
                  <option value="3">03:00</option>
                  <option value="4">04:00</option>
                  <option value="5">05:00</option>
                  <option value="6">06:00</option>
                </select>
              </div>

              {/* Week Start Day */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px' }}>
                <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>Inizio Settimana</span>
                <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: '2px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                  <button
                    onClick={() => updateSetting('weekStart', 'monday')}
                    style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', border: 'none', cursor: 'pointer', background: safeSettings.weekStart === 'monday' ? 'var(--accent-primary)' : 'transparent', color: safeSettings.weekStart === 'monday' ? '#fff' : 'var(--text-secondary)' }}
                  >
                    Lun
                  </button>
                  <button
                    onClick={() => updateSetting('weekStart', 'sunday')}
                    style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', border: 'none', cursor: 'pointer', background: safeSettings.weekStart === 'sunday' ? 'var(--accent-primary)' : 'transparent', color: safeSettings.weekStart === 'sunday' ? '#fff' : 'var(--text-secondary)' }}
                  >
                    Dom
                  </button>
                </div>
              </div>

              {/* Daily Penalties Toggle */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--glass-border)' }}>
                <div>
                  <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>Penalità Giornaliere</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Sottrai XP per abitudini quotidiane saltate</div>
                </div>
                <input
                  type="checkbox"
                  checked={safeSettings.enablePenalties !== false}
                  onChange={(e) => updateSetting('enablePenalties', e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--accent-primary)' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Group 2: Giornate Tipo (Modelli di Routine) */}
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <div
            onClick={() => toggleGroup('presetDays')}
            style={{ padding: '14px 16px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--glass-border)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              🗓️ Giornate Tipo (Modelli di Routine)
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {expandedGroup === 'presetDays' ? '▲' : '▼'}
            </span>
          </div>

          {expandedGroup === 'presetDays' && (
            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                  Sequenze di riferimento (scorri a destra ↔️):
                </span>
                <button
                  onClick={handleOpenNewPreset}
                  style={{
                    fontSize: '11px',
                    fontWeight: 'bold',
                    color: 'var(--accent-primary)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  ➕ Nuova Routine
                </button>
              </div>

              {/* Horizontal Swipeable Cards ("Tessere Laterali") */}
              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  overflowX: 'auto',
                  scrollSnapType: 'x mandatory',
                  WebkitOverflowScrolling: 'touch',
                  padding: '4px 2px 12px 2px'
                }}
              >
                {safePresetDays.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', fontStyle: 'italic', width: '100%' }}>
                    Nessun modello salvato. Tocca ➕ Nuova Routine per aggiungere una sequenza!
                  </div>
                ) : (
                  safePresetDays.map((preset) => {
                    const steps = getPresetSteps(preset);

                    return (
                      <div
                        key={preset.id}
                        style={{
                          flexShrink: 0,
                          width: '260px',
                          scrollSnapAlign: 'start',
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--glass-border)',
                          borderRadius: '16px',
                          padding: '14px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: '10px'
                        }}
                      >
                        {/* Card Header & Description */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{preset.emoji || '📅'}</span> {preset.name}
                            </h4>
                          </div>
                          {preset.description && (
                            <p style={{ margin: '0 0 10px 0', fontSize: '10px', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: '1.3' }}>
                              {preset.description}
                            </p>
                          )}

                          {/* Sequential Timeline Steps */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {steps.map((st, i) => (
                              <div
                                key={st.id || i}
                                style={{
                                  background: 'var(--bg-card)',
                                  padding: '6px 8px',
                                  borderRadius: '8px',
                                  border: '1px solid var(--glass-border)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  fontSize: '10px'
                                }}
                              >
                                {st.time && (
                                  <span style={{ fontSize: '9px', fontWeight: 'bold', color: 'var(--accent-primary)', background: 'var(--bg-primary)', padding: '2px 5px', borderRadius: '4px', flexShrink: 0 }}>
                                    {st.time}
                                  </span>
                                )}
                                <span style={{ color: 'var(--text-primary)', fontWeight: 'bold', minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {st.title}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Card Actions */}
                        <div style={{ display: 'flex', gap: '6px', paddingTop: '8px', borderTop: '1px solid var(--glass-border)' }}>
                          <button
                            onClick={() => handleEditPreset(preset)}
                            style={{ flex: 1, padding: '7px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                            title="Modifica Routine"
                          >
                            ✏️ Modifica
                          </button>
                          <button
                            onClick={() => handleDeletePreset(preset.id)}
                            style={{ padding: '7px 10px', borderRadius: '8px', fontSize: '11px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', cursor: 'pointer' }}
                            title="Elimina"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Group 3: Aspect & Theme */}
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <div
            onClick={() => toggleGroup('theme')}
            style={{ padding: '14px 16px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--glass-border)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              🎨 Aspetto & Temi
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {expandedGroup === 'theme' ? '▲' : '▼'}
            </span>
          </div>

          {expandedGroup === 'theme' && (
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '12px' }}>
              {/* Theme selection */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Stile Tema</label>
                <select
                  value={safeSettings.theme || 'standard'}
                  onChange={(e) => updateSetting('theme', e.target.value)}
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '10px 12px', color: 'var(--text-primary)', fontSize: '12px' }}
                >
                  <option value="standard">Standard RPG</option>
                  <option value="fantasy">Fantasy (Pergamena / Legno)</option>
                  <option value="dnd">D&D Paper Map</option>
                  <option value="futuristic">Cyberpunk Neon</option>
                  <option value="pirate">7th Sea / Pirate</option>
                </select>
              </div>

              {/* Mode Selection */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px' }}>
                <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>Modalità</span>
                <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: '2px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                  {['dark', 'light', 'system'].map((m) => (
                    <button
                      key={m}
                      onClick={() => updateSetting('themeMode', m)}
                      style={{ padding: '6px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', border: 'none', cursor: 'pointer', textTransform: 'capitalize', background: (safeSettings.themeMode || 'dark') === m ? 'var(--accent-primary)' : 'transparent', color: (safeSettings.themeMode || 'dark') === m ? '#fff' : 'var(--text-secondary)' }}
                    >
                      {m === 'dark' ? 'Scuro' : m === 'light' ? 'Chiaro' : 'Auto'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Accent Color Selection (Colore Dettagli) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '8px', borderTop: '1px solid var(--glass-border)' }}>
                <label style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Colore Dettagli (Accent)</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                  {ACCENT_COLORS.map((c) => {
                    const activeColor = safeSettings.accent || safeSettings.accentColor || 'violet';
                    const isSelected = activeColor === c;
                    
                    const hexMap = {
                      violet: '#7c3aed',
                      blue: '#3b82f6',
                      indigo: '#6366f1',
                      cyan: '#06b6d4',
                      teal: '#14b8a6',
                      emerald: '#10b981',
                      gold: '#f59e0b',
                      orange: '#f97316',
                      rose: '#f43f5e',
                      pink: '#ec4899',
                      red: '#ef4444',
                      green: '#22c55e',
                      yellow: '#eab308',
                      lime: '#84cc16',
                      sky: '#0ea5e9'
                    };

                    return (
                      <button
                        key={c}
                        onClick={() => {
                          updateSetting('accent', c);
                          updateSetting('accentColor', c);
                        }}
                        title={c}
                        style={{
                          height: '32px',
                          borderRadius: '10px',
                          background: hexMap[c] || '#7c3aed',
                          border: isSelected ? '2px solid #ffffff' : '1px solid rgba(255,255,255,0.2)',
                          boxShadow: isSelected ? `0 0 10px ${hexMap[c] || '#7c3aed'}` : 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          transition: 'transform 0.15s ease'
                        }}
                      >
                        {isSelected ? '✓' : ''}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Unified Group: Sync & Backup Dati */}
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <div
            onClick={() => toggleGroup('data')}
            style={{ padding: '14px 16px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--glass-border)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              💾 Sync & Backup Dati
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {expandedGroup === 'data' ? '▲' : '▼'}
            </span>
          </div>

          {expandedGroup === 'data' && (
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Section 1: File Database Sync */}
              <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '10px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>📁 Sync File Locale (PC / Chrome)</span>
                </div>
                <p style={{ margin: 0, fontSize: '10px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  Collega un file `.json` locale per salvare le modifiche direttamente sul tuo disco rigido ad ogni azione.
                </p>
                {fileHandle ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', padding: '8px 10px', borderRadius: '8px' }}>
                    <div style={{ fontWeight: 'bold', color: '#22c55e', fontSize: '10px' }}>
                      ✓ File Collegato: {fileHandle.name}
                    </div>
                    <button
                      onClick={onReconnectDatabase}
                      style={{ padding: '5px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', border: 'none', background: '#22c55e', color: '#fff', cursor: 'pointer' }}
                    >
                      🔄 Riconnetti Autorizzazioni File
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={onLinkDatabase}
                    className="btn-primary"
                    style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
                  >
                    🔗 Collega File Database su Disco
                  </button>
                )}
              </div>

              {/* Section 2: Backup & Export/Import */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    onClick={onExport}
                    className="btn-primary"
                    style={{ padding: '9px 12px', fontSize: '11px', fontWeight: 'bold', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    📤 Esporta Backup
                  </button>
                  <button
                    onClick={onImport}
                    style={{ padding: '9px 12px', fontSize: '11px', fontWeight: 'bold', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    📥 Importa Backup
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    onClick={onFixData}
                    style={{ padding: '7px 10px', fontSize: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', cursor: 'pointer' }}
                  >
                    🔧 Ripara Integrità
                  </button>
                  <button
                    onClick={onRepairStreaks}
                    style={{ padding: '7px 10px', fontSize: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', cursor: 'pointer' }}
                  >
                    🔥 Ricalcola Serie
                  </button>
                </div>

                <button
                  onClick={onReset}
                  style={{ padding: '7px 10px', fontSize: '10px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.4)', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', cursor: 'pointer', marginTop: '4px' }}
                >
                  ⚠️ Azzera Tutti i Dati
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Group 5: Storico Imprese Recenti (Last 15 items) */}
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <div
            onClick={() => toggleGroup('history')}
            style={{ padding: '14px 16px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--glass-border)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              📜 Storico Imprese Recenti (Ultime 15)
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {expandedGroup === 'history' ? '▲' : '▼'}
            </span>
          </div>

          {expandedGroup === 'history' && (
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {groupedXpLog.length === 0 ? (
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', margin: 0 }}>
                  Nessuna impresa registrata di recente.
                </p>
              ) : (
                groupedXpLog.slice(-15).reverse().map((group, idx) => {
                  if (!group) return null;
                  const title = group.title;
                  let dateStr = '';
                  if (group.date) {
                    try {
                      const d = new Date(group.date);
                      if (!isNaN(d.getTime())) {
                        dateStr = d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
                      }
                    } catch (e) {
                      dateStr = '';
                    }
                  }

                  const statEmojis = (group.statIds || [])
                    .map(id => {
                      const s = (stats || []).find(st => st.id === id);
                      return s ? (s.icon || s.emoji) : null;
                    })
                    .filter(Boolean);

                  const emojiDisplay = statEmojis.length > 0 ? statEmojis.join(' ') : '✨';

                  return (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: '8px', fontSize: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                        <span style={{ fontSize: '14px', flexShrink: 0 }}>{emojiDisplay}</span>
                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                          <span style={{ color: 'var(--text-primary)', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</span>
                          {dateStr && <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{dateStr}</span>}
                        </div>
                      </div>
                      <span style={{ fontWeight: 'bold', color: 'var(--accent-gold, #f59e0b)', flexShrink: 0, marginLeft: '8px' }}>+{group.totalAmount} XP</span>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Version Badge & Force Update */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '20px 0 40px 0', width: '100%' }}>
          <button
            onClick={() => forceUpdateApp(true)}
            className="btn-primary"
            style={{
              padding: '10px 24px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 'bold',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              margin: '0 auto 10px auto'
            }}
          >
            🔄 Forza Aggiornamento PWA
          </button>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 'bold', textAlign: 'center' }}>
            RPG Life v{APP_VERSION} {BUILD_TIME ? `(${new Date(BUILD_TIME).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' })})` : ''}
          </div>
        </div>
      </div>

      {/* CREATE / EDIT DAY ROUTINE MODEL MODAL */}
      {showPresetModal && editingPreset && (
        <div
          onClick={() => { setShowPresetModal(false); setEditingPreset(null); }}
          style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '440px', width: '92%', maxHeight: '82vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '24px', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)', overflow: 'hidden' }}
          >
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--glass-border)', background: 'var(--bg-card)', flexShrink: 0 }}>
              <h3 className="modal-title" style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🗓️</span> {editingPreset.id ? 'Modifica Modello di Giornata' : 'Crea Modello di Giornata'}
              </h3>
            </div>

            <div style={{ padding: '16px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Preset Name & Emoji */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={editingPreset.emoji || '📅'}
                  onChange={(e) => setEditingPreset(prev => ({ ...prev, emoji: e.target.value }))}
                  style={{ width: '45px', textAlign: 'center', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '8px', fontSize: '16px' }}
                  maxLength={2}
                />
                <input
                  type="text"
                  placeholder="Nome Modello (es. 💼 Giorno Lavorativo)"
                  value={editingPreset.name}
                  onChange={(e) => setEditingPreset(prev => ({ ...prev, name: e.target.value }))}
                  style={{ flex: 1, background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '12px' }}
                />
              </div>

              {/* Description */}
              <input
                type="text"
                placeholder="Descrizione opzionale (es. Sequenza per i giorni di lavoro)"
                value={editingPreset.description || ''}
                onChange={(e) => setEditingPreset(prev => ({ ...prev, description: e.target.value }))}
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '11px' }}
              />

              {/* Sequential Steps List */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  Sequenza Oraria delle Azioni:
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const currentSteps = editingPreset.steps || [];
                    const newStep = { id: 'step_' + Date.now(), time: '12:00', title: '' };
                    setEditingPreset(prev => ({ ...prev, steps: [...currentSteps, newStep] }));
                  }}
                  style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--accent-primary)', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  ➕ Aggiungi Azione
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(editingPreset.steps || []).map((step, idx) => (
                  <div key={step.id || idx} style={{ background: 'var(--bg-secondary)', padding: '8px 10px', borderRadius: '10px', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="08:00"
                      value={step.time || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditingPreset(prev => ({
                          ...prev,
                          steps: prev.steps.map((s, i) => i === idx ? { ...s, time: val } : s)
                        }));
                      }}
                      style={{ width: '55px', background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '6px', padding: '6px', color: 'var(--text-primary)', fontSize: '11px', textAlign: 'center', fontWeight: 'bold' }}
                    />
                    <input
                      type="text"
                      placeholder="Descrizione azione (es. Sveglia & Idratazione)..."
                      value={step.title || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditingPreset(prev => ({
                          ...prev,
                          steps: prev.steps.map((s, i) => i === idx ? { ...s, title: val } : s)
                        }));
                      }}
                      style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '6px', padding: '6px 10px', color: 'var(--text-primary)', fontSize: '11px' }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPreset(prev => ({
                          ...prev,
                          steps: prev.steps.filter((_, i) => i !== idx)
                        }));
                      }}
                      style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '12px', cursor: 'pointer', padding: '2px' }}
                      title="Elimina azione"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleSavePreset(editingPreset)}
                className="btn-primary"
                style={{ marginTop: '8px', width: '100%', padding: '10px', borderRadius: '10px', fontWeight: 'bold', fontSize: '12px', border: 'none', cursor: 'pointer' }}
              >
                💾 Salva Modello di Giornata
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
