import React, { useState, useEffect } from 'react';
import { ACCENT_COLORS, APP_VERSION, BUILD_TIME } from '../utils/constants';
import { forceUpdateApp, checkForAppUpdate, onUpdateAvailable, isUpdateAvailable } from '../utils/helpers';
import { getAppErrors, clearAppErrors, removeAppError, formatErrorsForClipboard, buildGithubIssueUrl } from '../utils/errorLogger';
import UserManualModal from '../components/UserManualModal';
import ReminderSettings from '../components/ReminderSettings';
import { SettingsGroup, SettingRow, Toggle, Segmented, SelectValue, OptButton } from '../components/settings/SettingsUI';

import { _t, getLocale } from '../i18n';
import EmojiField from '../components/EmojiField';
import { normalizeTime, sortSteps, suggestNextTime, cleanPreset } from '../utils/dayTemplates';
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
  const [movedStepId, setMovedStepId] = useState(null);
  const [focusStepId, setFocusStepId] = useState(null);
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualChapter, setManualChapter] = useState('finances');

  // Error Log State
  const [errorsList, setErrorsList] = useState([]);
  const [isErrorsDismissed, setIsErrorsDismissed] = useState(false);
  const [copyStatus, setCopyStatus] = useState(false);

  useEffect(() => {
    setErrorsList(getAppErrors());
  }, []);

  const handleCopyErrorLog = () => {
    const text = formatErrorsForClipboard(APP_VERSION);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
      setCopyStatus(true);
      setTimeout(() => setCopyStatus(false), 2500);
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopyStatus(true);
      setTimeout(() => setCopyStatus(false), 2500);
    }
  };

  const handleClearErrorLog = () => {
    if (window.confirm(_t("Vuoi cancellare il registro errori dell'app?"))) {
      clearAppErrors();
      setErrorsList([]);
      setIsErrorsDismissed(true);
    }
  };

  const handleRemoveError = (id) => {
    const remaining = removeAppError(id);
    setErrorsList(remaining);
    if (remaining.length === 0) setIsErrorsDismissed(true);
  };

  const handleReportOnGithub = () => {
    window.open(buildGithubIssueUrl(APP_VERSION), '_blank', 'noopener');
  };

  const handleCloseErrorLog = () => {
    setIsErrorsDismissed(true);
  };


  // PWA Update State: active only when a new version is available
  const [hasUpdate, setHasUpdate] = useState(isUpdateAvailable());
  const [newVersionTag, setNewVersionTag] = useState(null);

  useEffect(() => {
    onUpdateAvailable((ver) => {
      setHasUpdate(true);
      setNewVersionTag(ver);
    });

    checkForAppUpdate().then((res) => {
      if (res && res.updateAvailable) {
        setHasUpdate(true);
        setNewVersionTag(res.newVersion);
      }
    });
  }, []);

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
      description: _t("Sequenza guidata per la giornata lavorativa"),
      steps: [
        { id: '1', time: '07:00', title: _t("🌅 Sveglia, Idratazione & Stretching") },
        { id: '2', time: '08:30', title: _t("💻 Deep Work & Task Prioritarie") },
        { id: '3', time: '12:30', title: _t("🥗 Pranzo Leggero & Camminata 15m") },
        { id: '4', time: '14:00', title: _t("📧 Gestione Messaggi & Meeting") },
        { id: '5', time: '22:00', title: _t("📖 Lettura & Prep Routine Notturna") }
      ]
    },
    {
      id: 'preset_rest',
      name: 'Giorno di Riposo',
      emoji: '🌿',
      description: _t("Routine per ricaricare le energie e rilassarsi"),
      steps: [
        { id: '1', time: '08:30', title: _t("☕ Sveglia Calma & Colazione") },
        { id: '2', time: '10:30', title: _t("🚶 Camminata nella Natura o Hobby") },
        { id: '3', time: '13:00', title: _t("🍕 Pranzo Conviviale & Svago") },
        { id: '4', time: '16:00', title: _t("🎮 Tempo Libero & Relax Total") },
        { id: '5', time: '22:30', title: _t("🛋️ Routine Serale Decompressiva") }
      ]
    },
    {
      id: 'preset_fit',
      name: 'Giorno Allenamento',
      emoji: '🏋️',
      description: _t("Routine incentrata su movimento, nutrizione e recupero"),
      steps: [
        { id: '1', time: '07:00', title: _t("💧 Idratazione & Colazione Energetica") },
        { id: '2', time: '10:00', title: _t("🏋️ Sessione Allenamento Completa") },
        { id: '3', time: '13:00', title: _t("🍗 Pasto Post-Workout Bilanciato") },
        { id: '4', time: '17:00', title: _t("🚶 10.000 Passi & Stretching Mobility") },
        { id: '5', time: '22:00', title: _t("💤 Sonno Rigenerante") }
      ]
    }
  ];

  // Helper to safely extract steps list from preset
  const getPresetSteps = (preset) => {
    if (Array.isArray(preset.steps) && preset.steps.length > 0) {
      return sortSteps(preset.steps);
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
      steps: [{ id: `step_${Date.now()}`, time: '08:00', title: '' }]
    });
    setFocusStepId(null);
    setShowPresetModal(true);
  };

  const handleEditPreset = (preset) => {
    const presetCopy = JSON.parse(JSON.stringify(preset));
    const steps = (Array.isArray(presetCopy.steps) && presetCopy.steps.length > 0) ? presetCopy.steps : getPresetSteps(presetCopy);
    // id sempre presente (servono per riordinare senza perdere la riga che si sta scrivendo)
    presetCopy.steps = sortSteps(steps.map((s, i) => ({ ...s, id: s.id ? String(s.id) : `step_${Date.now()}_${i}` })));
    setEditingPreset(presetCopy);
    setShowPresetModal(true);
  };

  const closePresetModal = () => {
    setShowPresetModal(false);
    setEditingPreset(null);
    setMovedStepId(null);
  };

  const updateStep = (stepId, patch) => {
    setEditingPreset(prev => ({ ...prev, steps: (prev.steps || []).map(s => s.id === stepId ? { ...s, ...patch } : s) }));
  };

  // Riordino per orario quando si lascia il campo dell'ora: la riga che si sposta lampeggia un attimo.
  const resortSteps = (stepId) => {
    if (!editingPreset) return;
    const steps = editingPreset.steps || [];
    const sorted = sortSteps(steps);
    if (sorted.findIndex(s => s.id === stepId) === steps.findIndex(s => s.id === stepId)) return;
    setEditingPreset(prev => ({ ...prev, steps: sortSteps(prev.steps || []) }));
    setMovedStepId(stepId);
    setTimeout(() => setMovedStepId(cur => (cur === stepId ? null : cur)), 900);
  };

  const addStep = () => {
    const id = `step_${Date.now()}`;
    setEditingPreset(prev => {
      const steps = sortSteps(prev.steps || []);
      return { ...prev, steps: [...steps, { id, time: suggestNextTime(steps), title: '' }] };
    });
    setFocusStepId(id);
  };

  const removeStep = (stepId) => {
    setEditingPreset(prev => ({ ...prev, steps: (prev.steps || []).filter(s => s.id !== stepId) }));
  };

  const handleSavePreset = (presetData) => {
    const clean = cleanPreset(presetData);
    if (!clean.name) {
      alert(_t("Inserisci un nome per la Giornata Tipo!"));
      return;
    }
    const existing = safePresetDays;
    const updated = clean.id
      ? existing.map(p => p.id === clean.id ? clean : p)
      : [...existing, { ...clean, id: `preset_${Date.now()}` }];
    if (setSettings) setSettings(prev => ({ ...(prev || {}), presetDays: updated }));
    closePresetModal();
  };

  const handleDeletePreset = (id) => {
    if (!window.confirm(_t("Vuoi davvero eliminare questo modello di giornata?"))) return false;
    const updated = safePresetDays.filter(p => p && p.id !== id);
    if (setSettings) setSettings(prev => ({ ...(prev || {}), presetDays: updated }));
    return true;
  };

  const accentHex = {
    violet: '#7c3aed', blue: '#3b82f6', indigo: '#6366f1', cyan: '#06b6d4', teal: '#14b8a6',
    emerald: '#10b981', gold: '#f59e0b', orange: '#f97316', rose: '#f43f5e', pink: '#ec4899',
    red: '#ef4444', green: '#22c55e', yellow: '#eab308', lime: '#84cc16', sky: '#0ea5e9'
  };
  const activeAccent = safeSettings.accent || safeSettings.accentColor || 'violet';
  const superUser = safeSettings.allowPastEdits === true;

  const renderXpLog = () => {
    if (groupedXpLog.length === 0) {
      return <div className="opt-empty">{_t("Nessuna impresa registrata di recente.")}</div>;
    }
    return groupedXpLog.slice(-15).reverse().map((group, idx) => {
      if (!group) return null;
      let dateStr = '';
      if (group.date) {
        try {
          const d = new Date(group.date);
          if (!isNaN(d.getTime())) {
            dateStr = d.toLocaleDateString(getLocale(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
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
      return (
        <SettingRow
          key={idx}
          title={`${statEmojis.length > 0 ? statEmojis.join(' ') : '✨'} ${group.title}`}
          desc={dateStr}
        >
          <span className="opt-log-xp">{_t("+{0} XP", group.totalAmount)}</span>
        </SettingRow>
      );
    });
  };

  return (
    <section id="section-settings" className="section active">
      {/* Profilo compatto: avatar, nome (tocca per rinominare) e Modifica avanzata discreta */}
      <div className="opt-profile">
        <div className="opt-avatar">
          {safePlayer.avatarType === 'image' && safePlayer.avatarImage ? (
            <img src={safePlayer.avatarImage} alt={_t("Avatar")} />
          ) : (
            <span className="opt-avatar-emoji">{safePlayer.avatarEmoji || '⚔️'}</span>
          )}
          <div className="opt-avatar-level">{_t("Lvl {0}", safePlayer.level || 1)}</div>
        </div>
        <button
          type="button"
          className="opt-profile-name"
          onClick={() => {
            const newName = window.prompt(_t("Modifica Nome Giocatore:"), safePlayer.name || 'Avventuriero');
            if (newName !== null) updatePlayerName(newName);
          }}
          title={_t("Tocca per rinominare")}
        >
          {safePlayer.name || _t("Avventuriero")}
        </button>
        <button
          type="button"
          role="switch"
          aria-checked={superUser}
          className={`opt-power${superUser ? ' is-on' : ''}`}
          onClick={() => updateSetting('allowPastEdits', !superUser)}
          title={_t("Modifica avanzata: saldi del Tesoro, lista della spesa, cibi e storico")}
        >
          {superUser ? '🔓' : '🔒'} {_t("Avanzata")}
        </button>
      </div>

      <div className="opt-stack">
        {/* Giornate tipo: in evidenza, con le routine visibili anche a tessera chiusa */}
        <SettingsGroup
          title={_t("🗓️ Giornate tipo")}
          highlight
          open={expandedGroup === 'presetDays'}
          onToggle={() => toggleGroup('presetDays')}
          summary={safePresetDays.length || ''}
          preview={
            <div className="opt-preview">
              {safePresetDays.map(preset => (
                <button key={preset.id} type="button" className="opt-chip" onClick={() => handleEditPreset(preset)}>
                  <span>{preset.emoji || '📅'}</span>{preset.name}
                </button>
              ))}
              <button type="button" className="opt-chip opt-chip--muted" onClick={handleOpenNewPreset}>
                {_t("+ Nuova")}
              </button>
            </div>
          }
        >
          <div className="opt-row" style={{ borderTop: 'none', paddingTop: 0 }}>
            <div className="opt-presets">
              {safePresetDays.map((preset) => (
                <div key={preset.id} className="opt-preset">
                  <div className="opt-preset-name">{preset.emoji || '📅'} {preset.name}</div>
                  {preset.description && <div className="opt-row-desc" style={{ marginTop: 0 }}>{_t(preset.description)}</div>}
                  <div className="opt-preset-steps">
                    {getPresetSteps(preset).map((st, i) => (
                      <div key={st.id || i} className="opt-preset-step">
                        <span className="opt-preset-time">{st.time}</span>
                        <span className="opt-preset-title">{_t(st.title)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="opt-preset-actions">
                    <OptButton small onClick={() => handleEditPreset(preset)} title={_t("Modifica Routine")}>{_t("Modifica")}</OptButton>
                    <OptButton small variant="danger" onClick={() => handleDeletePreset(preset.id)} title={_t("Elimina")} aria-label={_t("Elimina")}>🗑️</OptButton>
                  </div>
                </div>
              ))}
            </div>
            <OptButton variant="primary" onClick={handleOpenNewPreset}>{_t("+ Nuova giornata tipo")}</OptButton>
          </div>
        </SettingsGroup>

        {/* Aspetto */}
        <SettingsGroup title={_t("🎨 Aspetto")} open={expandedGroup === 'theme'} onToggle={() => toggleGroup('theme')}>
          <SettingRow title={_t("Tema")}>
            <SelectValue
              label={_t("Tema")}
              value={safeSettings.theme || 'standard'}
              onChange={(v) => updateSetting('theme', v)}
              options={[
                { value: 'standard', label: _t("Standard") },
                { value: 'fantasy', label: _t("Pergamena") },
                { value: 'futuristic', label: _t("Cyberpunk") }
              ]}
            />
          </SettingRow>
          <SettingRow title={_t("Modalità")}>
            <Segmented
              value={safeSettings.themeMode || (safeSettings.theme === 'light' || safeSettings.mode === 'light' ? 'light' : 'dark')}
              onChange={(v) => updateSetting('themeMode', v)}
              options={[
                { value: 'dark', label: _t("Scuro") },
                { value: 'light', label: _t("Chiaro") },
                { value: 'system', label: _t("Auto") }
              ]}
            />
          </SettingRow>
          <SettingRow
            title={_t("Colore dettagli")}
            below={
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                {ACCENT_COLORS.map((c) => {
                  const isSelected = activeAccent === c;
                  const hex = accentHex[c] || '#7c3aed';
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => { updateSetting('accent', c); updateSetting('accentColor', c); }}
                      title={c}
                      aria-label={c}
                      aria-pressed={isSelected}
                      style={{
                        height: '30px', borderRadius: '9px', background: hex, cursor: 'pointer', padding: 0,
                        border: isSelected ? '2px solid #ffffff' : '1px solid rgba(255,255,255,0.2)',
                        boxShadow: isSelected ? `0 0 0 2px ${hex}` : 'none',
                        color: '#ffffff', fontSize: '12px', fontWeight: 'bold'
                      }}
                    >
                      {isSelected ? '✓' : ''}
                    </button>
                  );
                })}
              </div>
            }
          />
          <SettingRow title={_t("Disposizione schermo")} desc={safeSettings.screenMode === 'landscape' ? _t("Barra di navigazione a sinistra") : undefined}>
            <SelectValue
              label={_t("Disposizione schermo")}
              value={safeSettings.screenMode || 'auto'}
              onChange={(v) => updateSetting('screenMode', v)}
              options={[
                { value: 'auto', label: _t("Automatica (in base all'orientamento)"), short: _t("Automatica") },
                { value: 'portrait', label: _t("Verticale fisso"), short: _t("Verticale") },
                { value: 'landscape', label: _t("Orizzontale (barra a sinistra)"), short: _t("Orizzontale") },
                { value: 'tablet', label: _t("Tablet (iPad, Android)"), short: _t("Tablet") }
              ]}
            />
          </SettingRow>
          <SettingRow title={_t("Animazioni")} desc={_t("Ingresso delle schede, nav bar e celebrazioni")}>
            <Toggle checked={safeSettings.animations !== false} onChange={(v) => updateSetting('animations', v)} label={_t("Animazioni")} />
          </SettingRow>
        </SettingsGroup>

        {/* Generali */}
        <SettingsGroup title={_t("⚙️ Generali")} open={expandedGroup === 'general'} onToggle={() => toggleGroup('general')}>
          <SettingRow title="Lingua / Language">
            <Segmented
              value={safeSettings.language || 'it'}
              onChange={(v) => updateSetting('language', v)}
              options={[{ value: 'it', label: '🇮🇹 IT' }, { value: 'en', label: '🇬🇧 EN' }]}
            />
          </SettingRow>
          <SettingRow title={_t("Inizio del giorno")} desc={_t("Dopo mezzanotte conta ancora come ieri")}>
            <SelectValue
              label={_t("Inizio del giorno")}
              value={safeSettings.dayStartTime !== undefined ? safeSettings.dayStartTime : 0}
              onChange={(v) => updateSetting('dayStartTime', parseInt(v))}
              options={[0, 1, 2, 3, 4, 5, 6].map(h => ({
                value: h,
                label: h === 0 ? _t("00:00 (Mezzanotte)") : `0${h}:00`,
                short: `0${h}:00`
              }))}
            />
          </SettingRow>
          <SettingRow title={_t("Inizio della settimana")}>
            <Segmented
              value={safeSettings.weekStart === 'sunday' ? 'sunday' : 'monday'}
              onChange={(v) => updateSetting('weekStart', v)}
              options={[{ value: 'monday', label: _t("Lun") }, { value: 'sunday', label: _t("Dom") }]}
            />
          </SettingRow>
        </SettingsGroup>

        {/* Gioco */}
        <SettingsGroup title={_t("🎮 Gioco")} open={expandedGroup === 'gameplay'} onToggle={() => toggleGroup('gameplay')}>
          <SettingRow title={_t("Penalità giornaliere")} desc={_t("Sottrai XP per abitudini quotidiane saltate")}>
            <Toggle checked={safeSettings.enablePenalties !== false} onChange={(v) => updateSetting('enablePenalties', v)} label={_t("Penalità giornaliere")} />
          </SettingRow>
          <SettingRow title={_t("Modifica avanzata")} desc={_t("Saldi del Tesoro, lista della spesa, cibi e storico")}>
            <Toggle checked={superUser} onChange={(v) => updateSetting('allowPastEdits', v)} label={_t("Modifica avanzata")} />
          </SettingRow>
          <SettingRow title={_t("Tesoro: totale con investimenti")} desc={_t("Se spento, il totale mostra solo i conti")}>
            <Toggle checked={safeSettings.financeTotalIncludesInvestments !== false} onChange={(v) => updateSetting('financeTotalIncludesInvestments', v)} label={_t("Tesoro: totale con investimenti")} />
          </SettingRow>
          <ReminderSettings
            prefs={safeSettings.deadlineReminders || {}}
            onChange={(next) => updateSetting('deadlineReminders', next)}
          />
        </SettingsGroup>

        {/* Dati e backup */}
        <SettingsGroup title={_t("💾 Dati e backup")} open={expandedGroup === 'data'} onToggle={() => toggleGroup('data')}>
          <SettingRow
            title={_t("Backup")}
            desc={_t("Salva o ripristina tutti i dati in un file")}
            below={
              <div className="opt-btn-row">
                <OptButton variant="primary" onClick={onExport}>{_t("Esporta")}</OptButton>
                <OptButton onClick={onImport}>{_t("Importa")}</OptButton>
              </div>
            }
          />
          <SettingRow
            title={_t("File sul computer")}
            desc={fileHandle ? _t("✓ File Collegato: {0}", fileHandle.name) : _t("Salva ogni modifica in un file .json (PC / Chrome)")}
          >
            {fileHandle
              ? <OptButton small onClick={onReconnectDatabase}>{_t("Riconnetti")}</OptButton>
              : <OptButton small onClick={onLinkDatabase}>{_t("Collega")}</OptButton>}
          </SettingRow>
          <SettingRow
            title={_t("Manutenzione")}
            desc={_t("Correggono dati incoerenti senza cancellare nulla")}
            below={
              <div className="opt-btn-row">
                <OptButton small onClick={onFixData}>{_t("Ripara integrità")}</OptButton>
                <OptButton small onClick={onRepairStreaks}>{_t("Ricalcola serie")}</OptButton>
              </div>
            }
          />
          <SettingRow title={_t("Azzera tutti i dati")} desc={_t("Cancella tutto in modo definitivo")} danger>
            <OptButton small variant="danger" onClick={onReset}>{_t("Azzera")}</OptButton>
          </SettingRow>
        </SettingsGroup>

        {/* Storico imprese */}
        <SettingsGroup title={_t("📜 Storico imprese")} open={expandedGroup === 'history'} onToggle={() => toggleGroup('history')}>
          {renderXpLog()}
        </SettingsGroup>

        {/* Guida e info */}
        <SettingsGroup
          title={_t("📖 Guida e info")}
          open={expandedGroup === 'info'}
          onToggle={() => toggleGroup('info')}
          summary={`v${APP_VERSION}`}
        >
          <SettingRow
            title={_t("Manuale e guide")}
            desc={_t("RPG, Finanze, Abitudini e Nutrizione")}
            onClick={() => { setManualChapter('rpg'); setShowManualModal(true); }}
          />
          <SettingRow
            title={_t("Versione")}
            desc={BUILD_TIME ? new Date(BUILD_TIME).toLocaleString(getLocale(), { dateStyle: 'short', timeStyle: 'short' }) : undefined}
          >
            <span className="opt-select">v{APP_VERSION}</span>
          </SettingRow>
        </SettingsGroup>

        {/* Aggiorna App: compare solo quando c'è davvero una nuova versione */}
        {hasUpdate && (
          <OptButton
            variant="primary"
            onClick={() => forceUpdateApp(false)}
            title={_t("Tocca per aggiornare alla versione {0}", newVersionTag || '')}
            style={{ alignSelf: 'center', marginTop: '6px', borderRadius: '999px', padding: '0 24px', boxShadow: '0 0 16px color-mix(in srgb, var(--accent-primary) 55%, transparent)' }}
          >
            🚀 {_t("Aggiorna App (v{0})", newVersionTag || '')}
          </OptButton>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 0 12px 0', width: '100%' }}>
          {/* Registro Errori & Diagnostica (Invisibile di default, visibile solo con errori finché non si tocca 'X') */}
          {errorsList.length > 0 && !isErrorsDismissed && (
            <div style={{
              marginTop: '16px',
              background: 'var(--bg-secondary)',
              border: '1px solid rgba(239, 68, 68, 0.45)',
              borderRadius: '16px',
              padding: '14px',
              textAlign: 'left',
              boxShadow: '0 4px 20px rgba(239, 68, 68, 0.15)',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444' }}>
                  <span>⚠️</span>
                  <span>{_t("Registro Errori & Diagnostica")}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 'bold',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    color: '#ef4444',
                    border: '1px solid rgba(239, 68, 68, 0.3)'
                  }}>
                    {errorsList.length} {errorsList.length === 1 ? _t("errore") : _t("errori")}
                  </span>
                  {/* Close button X */}
                  <button
                    type="button"
                    onClick={handleCloseErrorLog}
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-secondary)',
                      fontSize: '11px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      padding: 0
                    }}
                    title={_t("Chiudi avviso diagnostica")}
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', paddingRight: '2px' }}>
                  {errorsList.map((err, idx) => (
                    <div key={err.id || idx} style={{
                      background: 'rgba(0, 0, 0, 0.25)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '10px',
                      padding: '8px 10px',
                      fontSize: '11px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '9px', marginBottom: '2px' }}>
                        <span>
                          {err.readableTime || err.timestamp}
                          {err.versions && err.versions.length > 0 && ` · v${err.versions.join(', v')}`}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {err.count > 1 && (
                            <span style={{ fontWeight: 'bold', color: 'var(--text-secondary)' }}>{err.count}×</span>
                          )}
                          <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{err.name || _t("Error")}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveError(err.id)}
                            title={_t("Elimina questo errore (risolto)")}
                            aria-label={_t("Elimina questo errore (risolto)")}
                            style={{ background: 'none', border: 'none', padding: '0 0 0 2px', fontSize: '11px', cursor: 'pointer', opacity: 0.7, lineHeight: 1 }}
                          >🗑️</button>
                        </span>
                      </div>
                      <div style={{ color: 'var(--text-primary)', fontWeight: '500', wordBreak: 'break-word' }}>
                        {err.message}
                      </div>
                      {err.stack && (
                        <pre style={{ margin: '4px 0 0 0', fontSize: '9px', color: 'var(--text-muted)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          {err.stack.split('\n').slice(0, 3).join('\n')}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleReportOnGithub}
                  style={{
                    marginTop: '6px',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    background: '#24292f',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  {_t("🐙 Segnala su GitHub")}
                </button>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '-2px' }}>
                  {_t("Apre una segnalazione già compilata: i testi che hai inserito nell'app vengono esclusi.")}
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
                  <button
                    onClick={handleCopyErrorLog}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '10px',
                      background: copyStatus ? '#10b981' : 'var(--accent-primary)',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                  >
                    {copyStatus ? _t("✅ Copiato negli appunti!") : _t("📋 Copia Log Errori")}
                  </button>
                  <button
                    onClick={handleClearErrorLog}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '10px',
                      background: 'rgba(239, 68, 68, 0.12)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      color: '#ef4444',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    {_t("🗑️ Svuota")}</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Finestra Giornata tipo: crea / modifica. Le azioni si riordinano da sole per orario. */}
      {showPresetModal && editingPreset && (
        <div
          onClick={closePresetModal}
          style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
        >
          <div
            className="modal-content dt-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dt-modal-head">
              <h3 className="modal-title" style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                {editingPreset.id ? _t("Modifica giornata tipo") : _t("Nuova giornata tipo")}
              </h3>
            </div>

            <div className="dt-modal-body">
              <div className="dt-name-row">
                <EmojiField
                  value={editingPreset.emoji || '📅'}
                  onChange={(v) => setEditingPreset(prev => ({ ...prev, emoji: v }))}
                  className="dt-emoji"
                />
                <input
                  type="text"
                  className="opt-input dt-name"
                  placeholder={_t("Nome (es. Giorno lavorativo)")}
                  value={editingPreset.name}
                  onChange={(e) => setEditingPreset(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <input
                type="text"
                className="opt-input"
                placeholder={_t("Descrizione facoltativa")}
                value={editingPreset.description || ''}
                onChange={(e) => setEditingPreset(prev => ({ ...prev, description: e.target.value }))}
              />

              <div className="dt-steps-head">
                <span>{_t("Azioni della giornata")}</span>
                <span className="dt-steps-hint">{_t("in ordine di orario")}</span>
              </div>

              <div className="dt-steps">
                {(editingPreset.steps || []).length === 0 && (
                  <div className="opt-row-desc" style={{ textAlign: 'center', padding: '8px 0' }}>{_t("Nessuna azione: aggiungi la prima")}</div>
                )}
                {(editingPreset.steps || []).map((step) => (
                  <div key={step.id} className={`dt-step${movedStepId === step.id ? ' is-moved' : ''}`}>
                    <input
                      type="time"
                      className="opt-input dt-time"
                      value={normalizeTime(step.time)}
                      onChange={(e) => updateStep(step.id, { time: e.target.value })}
                      onBlur={() => resortSteps(step.id)}
                      aria-label={_t("Orario")}
                    />
                    <input
                      type="text"
                      className="opt-input dt-title"
                      placeholder={_t("Cosa fai (es. Sveglia e idratazione)")}
                      value={step.title || ''}
                      ref={el => { if (el && focusStepId === step.id) { el.focus(); setFocusStepId(null); } }}
                      onChange={(e) => updateStep(step.id, { title: e.target.value })}
                    />
                    <button
                      type="button"
                      className="dt-step-delete"
                      onClick={() => removeStep(step.id)}
                      title={_t("Elimina azione")}
                      aria-label={_t("Elimina azione")}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <OptButton onClick={addStep}>{_t("+ Aggiungi azione")}</OptButton>
            </div>

            {/* Footer standard: cestino piccolo solo in modifica + Salva a tutta larghezza */}
            <div className="modal-action-bar shrink-0">
              {editingPreset.id && (
                <button
                  type="button"
                  className="modal-action-delete"
                  onClick={() => { if (handleDeletePreset(editingPreset.id)) closePresetModal(); }}
                  title={_t("Elimina")}
                  aria-label={_t("Elimina")}
                >
                  🗑️
                </button>
              )}
              <button type="button" className="modal-action-save" onClick={() => handleSavePreset(editingPreset)}>
                {editingPreset.id ? _t("Salva modifiche") : _t("Salva")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Manuale di Utilizzo */}
      <UserManualModal
        isOpen={showManualModal}
        onClose={() => setShowManualModal(false)}
        initialChapter={manualChapter}
      />
    </section>
  );
}
