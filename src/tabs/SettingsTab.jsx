import React, { useState } from 'react';
import { ACCENT_COLORS, APP_VERSION } from '../utils/constants';
import { forceUpdateApp, checkAppUpdate } from '../utils/helpers';

export default function SettingsTab({
  settings,
  setSettings,
  player,
  setPlayer,
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
            </div>
          )}
        </div>

        {/* Group 3: Data Management & Backup */}
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

        {/* Version Badge & Force Update */}
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <button
            onClick={() => forceUpdateApp(true)}
            className="btn-primary"
            style={{ padding: '8px 20px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', border: 'none', cursor: 'pointer', marginBottom: '8px' }}
          >
            🔄 Forza Aggiornamento PWA
          </button>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
            RPG Life v{APP_VERSION}
          </div>
        </div>
      </div>
    </section>
  );
}
