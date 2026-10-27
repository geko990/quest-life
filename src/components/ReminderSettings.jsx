import React, { useState } from 'react';
import { _t } from '../i18n';
import { SettingRow, Toggle, OptButton } from './settings/SettingsUI';
import {
  REMINDER_UNITS,
  getReminderOffsets,
  offsetMs,
  formatReminder,
  unitLabel,
  requestNotificationPermission,
  notificationsSupported
} from '../utils/deadlines';

// Promemoria scadenze: elenco libero (es. 1 settimana, 1 giorno, 3 ore prima).
// Il primo promemoria fa diventare arancione la tessera e accende il pallino rosso su Missioni;
// le notifiche vere partono solo se attivate e permesse.
export default function ReminderSettings({ prefs = {}, onChange }) {
  const offsets = getReminderOffsets(prefs);
  const [value, setValue] = useState('1');
  const [unit, setUnit] = useState('days');
  const badgeOn = prefs.badge !== false;
  const enabled = !!prefs.enabled;

  const save = (patch) => onChange({ enabled, badge: badgeOn, ...prefs, offsets, ...patch });

  const addOffset = () => {
    const n = Math.round(Number(value));
    if (!n || n <= 0) return;
    const next = [...offsets.filter(o => !(Number(o.value) === n && o.unit === unit)), { value: n, unit }]
      .sort((a, b) => offsetMs(b) - offsetMs(a));
    save({ offsets: next });
  };
  const removeOffset = (o) => save({ offsets: offsets.filter(x => x !== o) });

  const toggleEnabled = async (on) => {
    if (on) {
      const res = await requestNotificationPermission();
      if (res === 'unsupported') {
        alert(_t("Le notifiche non sono disponibili qui. Su iPhone funzionano solo con l'app aggiunta alla schermata Home (iOS 16.4 o successivo)."));
        return;
      }
      if (res !== 'granted') {
        alert(_t("Permesso negato. Puoi riattivarlo in Impostazioni iPhone → Notifiche → Quest Life."));
        return;
      }
    }
    save({ enabled: on });
  };

  return (
    <>
      <SettingRow
        title={_t("Promemoria scadenze")}
        desc={_t("Dal primo la missione diventa arancione")}
        below={
          <>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {offsets.map((o) => (
                <span key={`${o.value}${o.unit}`} className="opt-chip" style={{ cursor: 'default' }}>
                  {formatReminder(o)}
                  <button
                    type="button"
                    onClick={() => removeOffset(o)}
                    aria-label={_t("Rimuovi")}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--text-muted)', fontSize: '11px' }}
                  >
                    ✕
                  </button>
                </span>
              ))}
              {offsets.length === 0 && (
                <span className="opt-row-desc" style={{ marginTop: 0 }}>{_t("Nessun promemoria: le missioni si colorano solo dal giorno della scadenza")}</span>
              )}
            </div>
            <div className="opt-inline-form">
              <input
                type="number"
                min="1"
                inputMode="numeric"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="opt-input"
                style={{ width: '56px' }}
                aria-label={_t("Quanto prima")}
              />
              <select value={unit} onChange={(e) => setUnit(e.target.value)} className="opt-input" style={{ flex: 1 }}>
                {Object.keys(REMINDER_UNITS).map(u => (
                  <option key={u} value={u}>{unitLabel(u, Number(value) || 1)}</option>
                ))}
              </select>
              <OptButton small onClick={addOffset}>{_t("+ Aggiungi")}</OptButton>
            </div>
          </>
        }
      />
      <SettingRow
        title={_t("Notifiche")}
        desc={enabled && notificationsSupported() && Notification.permission === 'granted'
          ? _t("Arrivano con l'app aperta o in background da poco")
          : _t("Avvisi sul telefono ai promemoria")}
      >
        <Toggle checked={enabled} onChange={toggleEnabled} label={_t("Notifiche")} />
      </SettingRow>
      <SettingRow title={_t("Numero sull'icona")} desc={_t("Missioni in scadenza, aggiornato a ogni apertura")}>
        <Toggle checked={badgeOn} onChange={(on) => save({ badge: on })} label={_t("Numero sull'icona")} />
      </SettingRow>
    </>
  );
}
