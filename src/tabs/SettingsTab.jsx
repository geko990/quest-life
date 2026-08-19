import React, { useState } from 'react';
import { ACCENT_COLORS, APP_VERSION, BUILD_TIME } from '../utils/constants';
import { forceUpdateApp, checkAppUpdate } from '../utils/helpers';

export default function SettingsTab({
  settings = {},
  setSettings,
  player = {},
  setPlayer,
  xpLog = [],
  stats = [],
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

  // Group raw XP log entries into single task completions
  const groupedXpLog = [];
  safeXpLog.forEach((entry) => {
    if (!entry) return;
    const title = (entry.title || entry.reason || entry.name || entry.source || 'Attività completata').trim();
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
  const safePresetDays = Array.isArray(safeSettings.presetDays) ? safeSettings.presetDays : [
    {
      id: 'preset_work',
      name: 'Giorno Lavorativo',
      emoji: '💼',
      description: 'Routine per giornate di lavoro concentrato',
      slots: {
        action: { name: 'Completare le task prioritarie', stars: 3, statId: 'int' },
        bonus: { name: 'Pianificare riunioni e scadenze', stars: 2, statId: 'wis' },
        movement: { name: 'Passeggiata rigenerante 20 min', stars: 2, statId: 'str' },
        reaction: { name: 'Rispondere a email e messaggi', stars: 1, statId: 'int' }
      }
    },
    {
      id: 'preset_fit',
      name: 'Giorno Allenamento',
      emoji: '🏋️',
      description: 'Routine focalizzata su fitness e recupero',
      slots: {
        action: { name: 'Sessione di Allenamento Completa', stars: 4, statId: 'str' },
        bonus: { name: 'Preparazione pasti bilanciati', stars: 2, statId: 'con' },
        movement: { name: '10.000 passi quotidiani', stars: 3, statId: 'str' },
        reaction: { name: 'Stretching e mobilizzazione', stars: 1, statId: 'dex' }
      }
    }
  ];

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
      slots: {
        action: { name: '', stars: 3, statId: 'int' },
        bonus: { name: '', stars: 2, statId: 'wis' },
        movement: { name: '', stars: 2, statId: 'str' },
        reaction: { name: '', stars: 1, statId: 'dex' }
      }
    });
    setShowPresetModal(true);
  };

  const handleEditPreset = (preset) => {
    setEditingPreset(JSON.parse(JSON.stringify(preset)));
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
    if (window.confirm('Vuoi davvero eliminare questa Giornata Tipo?')) {
      const updated = safePresetDays.filter(p => p && p.id !== id);
      if (setSettings) setSettings(prev => ({ ...(prev || {}), presetDays: updated }));
    }
  };

  return (
    <section id="section-settings" className="section active">
      {/* Centered Top Profile & Hero Card */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '18px 14px',
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95))',
          borderRadius: '20px',
          border: '1px solid var(--glass-border)',
          marginBottom: '16px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.22)',
          textAlign: 'center'
        }}
      >
        {/* Avatar Frame */}
        <div
          style={{
            position: 'relative',
            width: '76px',
            height: '76px',
            borderRadius: '50%',
            background: 'var(--bg-card)',
            border: '2px solid var(--accent-gold, #f59e0b)',
            boxShadow: '0 0 18px rgba(245, 158, 11, 0.35)',
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
            <span style={{ fontSize: '38px' }}>
              {safePlayer.avatarEmoji || '⚔️'}
            </span>
          )}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              left: 0,
              background: 'rgba(0,0,0,0.7)',
              fontSize: '8px',
              color: '#fbbf24',
              padding: '1px 0',
              fontWeight: 'bold',
              letterSpacing: '0.5px'
            }}
          >
            Lvl {safePlayer.level || 1}
          </div>
        </div>

        {/* Player Name Editable Input */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '2px' }}>
          <input
            type="text"
            defaultValue={safePlayer.name || 'Avventuriero'}
            onBlur={(e) => updatePlayerName(e.target.value)}
            placeholder="Inserisci il tuo nome..."
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: '1px dashed rgba(255, 255, 255, 0.3)',
              color: 'var(--text-primary)',
              fontSize: '18px',
              fontWeight: '800',
              textAlign: 'center',
              padding: '2px 6px',
              outline: 'none',
              width: 'auto',
              maxWidth: '220px'
            }}
          />
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>✏️</span>
        </div>

        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '500' }}>
          ⚙️ Impostazioni del Giocatore
        </div>
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

        {/* Group 2: Giornate Tipo (Routine Preimpostate) */}
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <div
            onClick={() => toggleGroup('presetDays')}
            style={{ padding: '14px 16px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--glass-border)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              🗓️ Giornate Tipo (Routine Preimpostate)
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {expandedGroup === 'presetDays' ? '▲' : '▼'}
            </span>
          </div>

          {expandedGroup === 'presetDays' && (
            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                  Scorri a destra ↔️ per esplorare le tue routine:
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

              {/* Horizontal Swipeable Carousel Container */}
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
                    Nessuna Giornata Tipo creata. Tocca ➕ Nuova Routine per aggiungere la tua prima routine!
                  </div>
                ) : (
                  safePresetDays.map((preset) => (
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
                      {/* Card Content */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{preset.emoji || '📅'}</span> {preset.name}
                          </h4>
                        </div>
                        {preset.description && (
                          <p style={{ margin: '0 0 8px 0', fontSize: '10px', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: '1.3' }}>
                            {preset.description}
                          </p>
                        )}

                        {/* Routine Slots List */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '6px' }}>
                          {['action', 'bonus', 'movement', 'reaction'].map((slotKey) => {
                            const slot = preset.slots?.[slotKey];
                            const labels = { action: '🎯 Azione', bonus: '⚡ Bonus', movement: '🚶 Movimento', reaction: '🛡️ Reazione' };
                            if (!slot || !slot.name) return null;
                            return (
                              <div key={slotKey} style={{ background: 'var(--bg-card)', padding: '5px 8px', borderRadius: '8px', border: '1px solid var(--glass-border)', fontSize: '10px' }}>
                                <div style={{ color: 'var(--text-secondary)', fontWeight: 'bold', fontSize: '8px' }}>{labels[slotKey]}</div>
                                <div style={{ color: 'var(--text-primary)', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {slot.name}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div style={{ display: 'flex', gap: '6px', paddingTop: '8px', borderTop: '1px solid var(--glass-border)' }}>
                        <button
                          onClick={() => onApplyPresetDay && onApplyPresetDay(preset)}
                          style={{
                            flex: 1,
                            padding: '8px',
                            borderRadius: '8px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            background: 'var(--accent-primary)',
                            color: '#ffffff',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px'
                          }}
                          title="Applica questa routine a oggi"
                        >
                          ⚡ Applica Oggi
                        </button>
                        <button
                          onClick={() => handleEditPreset(preset)}
                          style={{ padding: '8px 10px', borderRadius: '8px', fontSize: '11px', background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)', cursor: 'pointer' }}
                          title="Modifica"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeletePreset(preset.id)}
                          style={{ padding: '8px 10px', borderRadius: '8px', fontSize: '11px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', cursor: 'pointer' }}
                          title="Elimina"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))
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

        {/* Group 4: File Database Local */}
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <div
            onClick={() => toggleGroup('storage')}
            style={{ padding: '14px 16px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--glass-border)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              📁 Sync File Locale (PC / Chrome)
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {expandedGroup === 'storage' ? '▲' : '▼'}
            </span>
          </div>

          {expandedGroup === 'storage' && (
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
              <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                Collega un file `.json` locale per salvare le modifiche direttamente sul tuo disco rigido ad ogni azione.
              </p>
              {fileHandle ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', padding: '10px 12px', borderRadius: '8px' }}>
                  <div style={{ fontWeight: 'bold', color: '#22c55e', fontSize: '11px' }}>
                    ✓ File Locale Collegato: {fileHandle.name}
                  </div>
                  <button
                    onClick={onReconnectDatabase}
                    style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', border: 'none', background: '#22c55e', color: '#fff', cursor: 'pointer' }}
                  >
                    🔄 Riconnetti Autorizzazioni File
                  </button>
                </div>
              ) : (
                <button
                  onClick={onLinkDatabase}
                  className="btn-primary"
                  style={{ padding: '10px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
                >
                  🔗 Collega File Database su Disco
                </button>
              )}
            </div>
          )}
        </div>

        {/* Group 5: Data Management & Backup */}
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <div
            onClick={() => toggleGroup('data')}
            style={{ padding: '14px 16px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--glass-border)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              💾 Gestione Dati & Backup
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {expandedGroup === 'data' ? '▲' : '▼'}
            </span>
          </div>

          {expandedGroup === 'data' && (
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={onExport}
                className="btn-primary"
                style={{ padding: '10px 16px', fontSize: '12px', fontWeight: 'bold', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                📤 Esporta Backup JSON
              </button>
              <button
                onClick={onImport}
                style={{ padding: '10px 16px', fontSize: '12px', fontWeight: 'bold', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                📥 Importa Backup JSON
              </button>
              <button
                onClick={onFixData}
                style={{ padding: '8px 12px', fontSize: '11px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                🔧 Ripara Integrità Database
              </button>
              <button
                onClick={onRepairStreaks}
                style={{ padding: '8px 12px', fontSize: '11px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                🔥 Ricalcola Serie Attive
              </button>
              <button
                onClick={onReset}
                style={{ padding: '8px 12px', fontSize: '11px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.4)', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', cursor: 'pointer', marginTop: '6px' }}
              >
                ⚠️ Azzera Tutti i Dati
              </button>
            </div>
          )}
        </div>

        {/* Group 6: Storico Imprese Recenti (Last 15 items) */}
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

      {/* CREATE / EDIT PRESET DAY MODAL */}
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
                <span>🗓️</span> {editingPreset.id ? 'Modifica Giornata Tipo' : 'Crea Giornata Tipo'}
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
                  placeholder="Nome Giornata Tipo (es. 🏋️ Giorno Allenamento)"
                  value={editingPreset.name}
                  onChange={(e) => setEditingPreset(prev => ({ ...prev, name: e.target.value }))}
                  style={{ flex: 1, background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '12px' }}
                />
              </div>

              {/* Description */}
              <input
                type="text"
                placeholder="Descrizione opzionale (es. Routine per i giorni di palestra)"
                value={editingPreset.description || ''}
                onChange={(e) => setEditingPreset(prev => ({ ...prev, description: e.target.value }))}
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '11px' }}
              />

              {/* 4 Action Slots */}
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: '4px' }}>
                Routine delle 4 Attività del Giorno:
              </div>

              {[
                { key: 'action', label: '🎯 Azione (Principale)' },
                { key: 'bonus', label: '⚡ Bonus (Strategico)' },
                { key: 'movement', label: '🚶 Movimento (Fisico)' },
                { key: 'reaction', label: '🛡️ Reazione (Abitudine / Manutenzione)' }
              ].map(({ key, label }) => {
                const slot = editingPreset.slots?.[key] || { name: '', stars: 2, statId: 'int' };
                return (
                  <div key={key} style={{ background: 'var(--bg-secondary)', padding: '10px', borderRadius: '12px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--accent-primary)' }}>{label}</div>
                    <input
                      type="text"
                      placeholder={`Nome ${label.split(' ')[1]}...`}
                      value={slot.name || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditingPreset(prev => ({
                          ...prev,
                          slots: {
                            ...prev.slots,
                            [key]: { ...prev.slots[key], name: val }
                          }
                        }));
                      }}
                      style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '6px', padding: '6px 10px', color: 'var(--text-primary)', fontSize: '11px' }}
                    />
                  </div>
                );
              })}

              <button
                onClick={() => handleSavePreset(editingPreset)}
                className="btn-primary"
                style={{ marginTop: '8px', width: '100%', padding: '10px', borderRadius: '10px', fontWeight: 'bold', fontSize: '12px', border: 'none', cursor: 'pointer' }}
              >
                💾 Salva Giornata Tipo
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
