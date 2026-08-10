import React, { useState } from 'react';
import { ACCENT_COLORS, APP_VERSION, BUILD_TIME } from '../utils/constants';
import { forceUpdateApp, checkAppUpdate } from '../utils/helpers';

export default function SettingsTab({
  settings,
  setSettings,
  player,
  setPlayer,
  xpLog = [],
  fileHandle,
  onLinkDatabase,
  onReconnectDatabase,
  onExport,
  onImport,
  onFixData,
  onRepairStreaks,
  onReset
}) {
  const [expandedGroup, setExpandedGroup] = useState('profile');

  const toggleGroup = (groupName) => {
    setExpandedGroup(expandedGroup === groupName ? null : groupName);
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const updatePlayerName = (name) => {
    setPlayer(prev => ({ ...prev, name: name.trim() || 'Avventuriero' }));
  };

  return (
    <section id="section-settings" className="section active">
      {/* Tab Header */}
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h2 style={{ margin: 0 }}>⚙️ Impostazioni</h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Group 1: Profile & Gameplay */}
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <div
            onClick={() => toggleGroup('profile')}
            style={{ padding: '14px 16px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--glass-border)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              👤 Profilo & Gameplay
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {expandedGroup === 'profile' ? '▲' : '▼'}
            </span>
          </div>

          {expandedGroup === 'profile' && (
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '12px' }}>
              {/* Name Input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Nome Giocatore</label>
                <input
                  type="text"
                  defaultValue={player.name}
                  onBlur={(e) => updatePlayerName(e.target.value)}
                  placeholder="Inserisci il tuo nome..."
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '10px 12px', color: 'var(--text-primary)', fontSize: '13px' }}
                />
              </div>

              {/* Day Start Hour */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Inizio nuovo giorno</label>
                <select
                  value={settings.dayStartTime}
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
                    style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', border: 'none', cursor: 'pointer', background: settings.weekStart === 'monday' ? 'var(--accent-primary)' : 'transparent', color: settings.weekStart === 'monday' ? '#fff' : 'var(--text-secondary)' }}
                  >
                    Lun
                  </button>
                  <button
                    onClick={() => updateSetting('weekStart', 'sunday')}
                    style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', border: 'none', cursor: 'pointer', background: settings.weekStart === 'sunday' ? 'var(--accent-primary)' : 'transparent', color: settings.weekStart === 'sunday' ? '#fff' : 'var(--text-secondary)' }}
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
                  checked={settings.enablePenalties !== false}
                  onChange={(e) => updateSetting('enablePenalties', e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--accent-primary)' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Group 2: Aspect & Theme */}
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
                  value={settings.theme || 'standard'}
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
                      style={{ padding: '6px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', border: 'none', cursor: 'pointer', textTransform: 'capitalize', background: (settings.themeMode || 'dark') === m ? 'var(--accent-primary)' : 'transparent', color: (settings.themeMode || 'dark') === m ? '#fff' : 'var(--text-secondary)' }}
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
                    const activeColor = settings.accent || settings.accentColor || 'violet';
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

        {/* Group 3: File Database Local */}
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

        {/* Group 4: Data Management & Backup */}
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

        {/* Group 5: Storico Imprese Recenti */}
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <div
            onClick={() => toggleGroup('history')}
            style={{ padding: '14px 16px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--glass-border)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              📜 Storico Imprese Recenti
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {expandedGroup === 'history' ? '▲' : '▼'}
            </span>
          </div>

          {expandedGroup === 'history' && (
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(xpLog || []).length === 0 ? (
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', margin: 0 }}>
                  Nessuna impresa registrata di recente.
                </p>
              ) : (
                (xpLog || []).slice(-10).reverse().map((log, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: '8px', fontSize: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>✨</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{log.reason || 'Attività completata'}</span>
                    </div>
                    <span style={{ fontWeight: 'bold', color: 'var(--accent-gold, #f59e0b)' }}>+{log.amount} XP</span>
                  </div>
                ))
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
    </section>
  );
}
