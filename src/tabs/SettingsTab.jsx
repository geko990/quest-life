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
    <div className="space-y-5 pb-24 p-4 max-w-md mx-auto">
      {/* Tab Header */}
      <div className="flex justify-between items-center px-1">
        <h2 className="text-base font-bold text-text-main font-cinzel tracking-wide flex items-center gap-2">
          ⚙️ Impostazioni
        </h2>
      </div>

      {/* Group 1: Profile & Gameplay */}
      <div className="glass-panel overflow-hidden border border-border-color">
        <div
          onClick={() => toggleGroup('profile')}
          className="px-4 py-3 bg-slate-950/20 hover:bg-slate-950/40 cursor-pointer flex justify-between items-center select-none"
        >
          <h3 className="font-bold text-xs text-text-main flex items-center gap-1.5 uppercase tracking-wide">
            👤 Profilo & Gameplay
          </h3>
          <span className="text-xs text-text-secondary">
            {expandedGroup === 'profile' ? '▲' : '▼'}
          </span>
        </div>

        {expandedGroup === 'profile' && (
          <div className="p-4 space-y-4 text-xs animate-slide-down">
            {/* Name Input */}
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-text-secondary uppercase text-[10px]">Nome Giocatore</label>
              <input
                type="text"
                defaultValue={player.name}
                onBlur={(e) => updatePlayerName(e.target.value)}
                placeholder="Inserisci il tuo nome..."
                className="bg-slate-950/40 border border-border-color rounded px-3 py-2 text-sm text-text-main focus:border-accent-primary focus:outline-none"
              />
            </div>

            {/* Day Start Hour */}
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-text-secondary uppercase text-[10px]">Inizio nuovo giorno</label>
              <select
                value={settings.dayStartTime}
                onChange={(e) => updateSetting('dayStartTime', parseInt(e.target.value))}
                className="bg-slate-950/40 border border-border-color rounded px-3 py-2 text-xs text-text-main focus:outline-none"
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
            <div className="flex justify-between items-center pt-2">
              <span className="font-bold text-text-main">Inizio Settimana</span>
              <div className="flex bg-slate-950/30 p-0.5 rounded-lg border border-border-color/30">
                <button
                  onClick={() => updateSetting('weekStart', 'monday')}
                  className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
                    settings.weekStart === 'monday' ? 'bg-accent-primary text-white' : 'text-text-secondary'
                  }`}
                >
                  Lun
                </button>
                <button
                  onClick={() => updateSetting('weekStart', 'sunday')}
                  className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
                    settings.weekStart !== 'monday' ? 'bg-accent-primary text-white' : 'text-text-secondary'
                  }`}
                >
                  Dom
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Group 2: Personalizzazione (Visuals & Custom themes) */}
      <div className="glass-panel overflow-hidden border border-border-color">
        <div
          onClick={() => toggleGroup('visuals')}
          className="px-4 py-3 bg-slate-950/20 hover:bg-slate-950/40 cursor-pointer flex justify-between items-center select-none"
        >
          <h3 className="font-bold text-xs text-text-main flex items-center gap-1.5 uppercase tracking-wide">
            🎨 Personalizzazione
          </h3>
          <span className="text-xs text-text-secondary">
            {expandedGroup === 'visuals' ? '▲' : '▼'}
          </span>
        </div>

        {expandedGroup === 'visuals' && (
          <div className="p-4 space-y-4 text-xs animate-slide-down">
            {/* Theme presets */}
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-text-secondary uppercase text-[10px]">Stile del Gioco</label>
              <select
                value={settings.theme}
                onChange={(e) => updateSetting('theme', e.target.value)}
                className="bg-slate-950/40 border border-border-color rounded px-3 py-2 text-xs text-text-main focus:outline-none"
              >
                <option value="dark">Standard Sci-Fi</option>
                <option value="light">Standard Light ☀️</option>
                <option value="fantasy">High Fantasy 💍</option>
                <option value="dnd">Dungeons & Dragons 📜</option>
                <option value="futuristic">Grid Runner Neon 👾</option>
                <option value="pirate">Pirate Coast 🏴‍☠️</option>
              </select>
            </div>

            {/* Accent Color picker */}
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-text-secondary uppercase text-[10px]">Colore dell'Accento</label>
              <div className="flex gap-2 flex-wrap bg-slate-950/10 p-2.5 rounded-lg border border-border-color/20">
                {ACCENT_COLORS.map((color) => {
                  const colorsMap = {
                    violet: 'bg-violet-500',
                    blue: 'bg-blue-500',
                    indigo: 'bg-indigo-500',
                    cyan: 'bg-cyan-500',
                    teal: 'bg-teal-500',
                    emerald: 'bg-emerald-500',
                    gold: 'bg-yellow-500',
                    orange: 'bg-orange-500',
                    rose: 'bg-rose-500',
                    pink: 'bg-pink-500',
                    red: 'bg-red-500',
                    green: 'bg-green-500',
                    yellow: 'bg-yellow-400',
                    lime: 'bg-lime-500',
                    sky: 'bg-sky-500',
                  };
                  return (
                    <button
                      key={color}
                      onClick={() => updateSetting('accent', color)}
                      className={`w-6 h-6 rounded-full ${colorsMap[color] || 'bg-slate-500'} flex items-center justify-center transition-all ${
                        settings.accent === color ? 'ring-2 ring-white scale-110' : 'opacity-80 hover:opacity-100 hover:scale-105'
                      }`}
                      title={color}
                    />
                  );
                })}
              </div>
            </div>

            {/* Animated Background */}
            <div className="flex justify-between items-center">
              <span className="font-bold text-text-main">Sfondo Animato</span>
              <div className="flex bg-slate-950/30 p-0.5 rounded-lg border border-border-color/30">
                <button
                  onClick={() => updateSetting('animatedBackground', true)}
                  className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
                    settings.animatedBackground !== false ? 'bg-accent-primary text-white' : 'text-text-secondary'
                  }`}
                >
                  ON
                </button>
                <button
                  onClick={() => updateSetting('animatedBackground', false)}
                  className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
                    settings.animatedBackground === false ? 'bg-accent-primary text-white' : 'text-text-secondary'
                  }`}
                >
                  OFF
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Group 3: Funzionalità (Feature toggles) */}
      <div className="glass-panel overflow-hidden border border-border-color">
        <div
          onClick={() => toggleGroup('features')}
          className="px-4 py-3 bg-slate-950/20 hover:bg-slate-950/40 cursor-pointer flex justify-between items-center select-none"
        >
          <h3 className="font-bold text-xs text-text-main flex items-center gap-1.5 uppercase tracking-wide">
            ⚡ Funzionalità & Meccaniche
          </h3>
          <span className="text-xs text-text-secondary">
            {expandedGroup === 'features' ? '▲' : '▼'}
          </span>
        </div>

        {expandedGroup === 'features' && (
          <div className="p-4 space-y-3.5 text-xs animate-slide-down">
            {/* Daily Planner */}
            <div className="flex justify-between items-center">
              <span className="font-bold text-text-main">Nuovo Turno (Daily Planner)</span>
              <div className="flex bg-slate-950/30 p-0.5 rounded-lg border border-border-color/30">
                <button
                  onClick={() => updateSetting('enableDailyPlanner', true)}
                  className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
                    settings.enableDailyPlanner !== false ? 'bg-accent-primary text-white' : 'text-text-secondary'
                  }`}
                >
                  ON
                </button>
                <button
                  onClick={() => updateSetting('enableDailyPlanner', false)}
                  className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
                    settings.enableDailyPlanner === false ? 'bg-accent-primary text-white' : 'text-text-secondary'
                  }`}
                >
                  OFF
                </button>
              </div>
            </div>

            {/* Sound effects */}
            <div className="flex justify-between items-center">
              <span className="font-bold text-text-main">Effetti Sonori</span>
              <div className="flex bg-slate-950/30 p-0.5 rounded-lg border border-border-color/30">
                <button
                  onClick={() => updateSetting('soundEnabled', true)}
                  className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
                    settings.soundEnabled !== false ? 'bg-accent-primary text-white' : 'text-text-secondary'
                  }`}
                >
                  ON
                </button>
                <button
                  onClick={() => updateSetting('soundEnabled', false)}
                  className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
                    settings.soundEnabled === false ? 'bg-accent-primary text-white' : 'text-text-secondary'
                  }`}
                >
                  OFF
                </button>
              </div>
            </div>

            {/* Weekly Recap */}
            <div className="flex justify-between items-center">
              <span className="font-bold text-text-main">Recap Settimanale</span>
              <div className="flex bg-slate-950/30 p-0.5 rounded-lg border border-border-color/30">
                <button
                  onClick={() => updateSetting('enableWeeklyRecap', true)}
                  className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
                    settings.enableWeeklyRecap !== false ? 'bg-accent-primary text-white' : 'text-text-secondary'
                  }`}
                >
                  ON
                </button>
                <button
                  onClick={() => updateSetting('enableWeeklyRecap', false)}
                  className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
                    settings.enableWeeklyRecap === false ? 'bg-accent-primary text-white' : 'text-text-secondary'
                  }`}
                >
                  OFF
                </button>
              </div>
            </div>

            {/* Dice Button */}
            <div className="flex justify-between items-center">
              <span className="font-bold text-text-main">🎲 Bottone Dado</span>
              <div className="flex bg-slate-950/30 p-0.5 rounded-lg border border-border-color/30">
                <button
                  onClick={() => updateSetting('showDiceButton', true)}
                  className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
                    settings.showDiceButton !== false ? 'bg-accent-primary text-white' : 'text-text-secondary'
                  }`}
                >
                  ON
                </button>
                <button
                  onClick={() => updateSetting('showDiceButton', false)}
                  className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
                    settings.showDiceButton === false ? 'bg-accent-primary text-white' : 'text-text-secondary'
                  }`}
                >
                  OFF
                </button>
              </div>
            </div>

            {/* Daily Penalties */}
            <div className="flex justify-between items-center">
              <span className="font-bold text-text-main">⚠️ Penalità Giornaliere</span>
              <div className="flex bg-slate-950/30 p-0.5 rounded-lg border border-border-color/30">
                <button
                  onClick={() => updateSetting('enableDailyPenalties', true)}
                  className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
                    settings.enableDailyPenalties !== false ? 'bg-accent-primary text-white' : 'text-text-secondary'
                  }`}
                >
                  ON
                </button>
                <button
                  onClick={() => updateSetting('enableDailyPenalties', false)}
                  className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
                    settings.enableDailyPenalties === false ? 'bg-accent-primary text-white' : 'text-text-secondary'
                  }`}
                >
                  OFF
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Group 4: Dati & Cloud (Local DB, Import/Export, Reset) */}
      <div className="glass-panel overflow-hidden border border-border-color">
        <div
          onClick={() => toggleGroup('data')}
          className="px-4 py-3 bg-slate-950/20 hover:bg-slate-950/40 cursor-pointer flex justify-between items-center select-none"
        >
          <h3 className="font-bold text-xs text-text-main flex items-center gap-1.5 uppercase tracking-wide">
            💾 Dati & Backup
          </h3>
          <span className="text-xs text-text-secondary">
            {expandedGroup === 'data' ? '▲' : '▼'}
          </span>
        </div>

        {expandedGroup === 'data' && (
          <div className="p-4 space-y-4 text-xs animate-slide-down">
            {/* Database File Connector */}
            <div className="bg-slate-950/30 p-3.5 rounded-xl border border-border-color/40 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-[10px] uppercase text-text-secondary">File Database Locale</span>
                <span className="font-bold">
                  {fileHandle ? (
                    <span className="text-green-400">🟢 Collegato: {fileHandle.name}</span>
                  ) : (
                    <span className="text-text-secondary/70">Nessun file</span>
                  )}
                </span>
              </div>
              <button
                onClick={fileHandle ? onLinkDatabase : onReconnectDatabase}
                className="w-full bg-accent-primary hover:brightness-110 text-white font-bold py-2 rounded-lg transition-all active:scale-95 shadow flex items-center justify-center gap-1.5"
              >
                <span>🔗</span>
                <span>{fileHandle ? 'Cambia File Collegato' : 'Collega Database File'}</span>
              </button>
              <p className="text-[10px] text-text-secondary/80 leading-relaxed text-center">
                Salva automaticamente tutte le modifiche su un file locale sul tuo computer (solo Desktop Chrome/Safari/Edge).
              </p>
            </div>

            {/* Export / Import buttons */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={onExport}
                className="bg-slate-950/40 hover:bg-slate-950/60 border border-border-color rounded-lg py-2.5 font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 text-text-main"
              >
                <span>Esporta</span>
                <span>📤</span>
              </button>
              <button
                onClick={onImport}
                className="bg-slate-950/40 hover:bg-slate-950/60 border border-border-color rounded-lg py-2.5 font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 text-text-main"
              >
                <span>Importa</span>
                <span>📥</span>
              </button>
            </div>

            {/* Repair & Reset tools */}
            <div className="pt-2 border-t border-border-color/30 space-y-2.5">
              <label className="font-bold text-text-secondary uppercase text-[10px]">Manutenzione Dati</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={onFixData}
                  className="bg-slate-800/50 hover:bg-slate-800 border border-border-color/50 rounded py-2 font-semibold text-[10px] transition-colors"
                >
                  🔧 Ripara Database
                </button>
                <button
                  onClick={onRepairStreaks}
                  className="bg-slate-800/50 hover:bg-slate-800 border border-border-color/50 rounded py-2 font-semibold text-[10px] transition-colors"
                >
                  🔥 Ripara Streak
                </button>
              </div>
              <button
                onClick={onReset}
                className="w-full bg-red-500/10 hover:bg-red-500 border border-red-500/30 hover:border-red-500 text-red-500 hover:text-white font-bold py-2 rounded-lg transition-all active:scale-95"
              >
                ⚠️ Reset Completo dell'App
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Group 4: Info & System (Versione & Aggiornamenti) */}
      <div className="glass-panel overflow-hidden border border-border-color">
        <div
          onClick={() => toggleGroup('system')}
          className="px-4 py-3 bg-slate-950/20 hover:bg-slate-950/40 cursor-pointer flex justify-between items-center select-none"
        >
          <h3 className="font-bold text-xs text-text-main flex items-center gap-1.5 uppercase tracking-wide">
            ℹ️ Sistema & Aggiornamenti
          </h3>
          <span className="text-xs text-text-secondary">
            {expandedGroup === 'system' ? '▲' : '▼'}
          </span>
        </div>

        {expandedGroup === 'system' && (
          <div className="p-4 space-y-4 text-xs animate-slide-down">
            {/* Version Display (Clickable for Force Update) */}
            <div
              onClick={() => forceUpdateApp(true)}
              className="flex justify-between items-center bg-slate-950/40 p-3 rounded-xl border border-border-color/40 cursor-pointer hover:border-accent-primary/50 transition-all select-none"
              title="Tocca per forzare l'aggiornamento"
            >
              <div>
                <span className="font-bold text-text-main block">Versione Applicazione</span>
                <span className="text-[10px] text-text-secondary">Tocca qui per forzare il ricaricamento</span>
              </div>
              <span className="px-2.5 py-1 bg-accent-primary/20 border border-accent-primary/40 text-accent-primary font-bold rounded-full text-xs">
                v{APP_VERSION}
              </span>
            </div>

            {/* Update Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={checkAppUpdate}
                className="w-full bg-slate-800/60 hover:bg-slate-800 border border-border-color/50 text-text-main font-bold py-2.5 rounded-lg transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <span>🔄</span>
                <span>Controlla Aggiornamenti Normale</span>
              </button>

              <button
                onClick={() => forceUpdateApp(true)}
                className="w-full bg-gradient-to-r from-amber-500/20 to-orange-600/20 hover:from-amber-500/30 hover:to-orange-600/30 border border-amber-500/40 text-amber-300 font-bold py-2.5 rounded-lg transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <span>⚡</span>
                <span>Forza Aggiornamento (Svuota Cache & SW)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
