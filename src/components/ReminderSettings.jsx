import React, { useState } from 'react';
import { _t } from '../i18n';
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

  const chip = (active) => ({
    padding: '5px 10px', borderRadius: '8px', fontSize: '10.5px', fontWeight: 'bold', cursor: 'pointer',
    border: active ? '1px solid var(--accent-primary)' : '1px solid var(--glass-border)',
    background: active ? 'color-mix(in srgb, var(--accent-primary) 15%, transparent)' : 'transparent',
    color: active ? 'var(--text-primary)' : 'var(--text-secondary)'
  });

  return (
    <div style={{ paddingTop: '8px', borderTop: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{_t("🔔 Promemoria Scadenze")}</div>
          <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
            {_t("Dal primo promemoria la missione diventa arancione e compare il pallino rosso; rossa dal giorno della scadenza")}
          </div>
        </div>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => toggleEnabled(e.target.checked)}
          title={_t("Notifiche")}
          style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--accent-primary)', flexShrink: 0 }}
        />
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {offsets.map((o) => (
          <span key={`${o.value}${o.unit}`} style={{ ...chip(true), display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'default' }}>
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
          <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontStyle: 'italic' }}>{_t("Nessun promemoria: le missioni si colorano solo dal giorno della scadenza")}</span>
        )}
      </div>

      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        <input
          type="number"
          min="1"
          inputMode="numeric"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          style={{ width: '56px', height: '32px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '0 8px', fontSize: '12px', fontWeight: 'bold' }}
        />
        <select
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          style={{ flex: 1, height: '32px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '0 8px', fontSize: '12px', fontWeight: 'bold' }}
        >
          {Object.keys(REMINDER_UNITS).map(u => (
            <option key={u} value={u}>{unitLabel(u, Number(value) || 1)}</option>
          ))}
        </select>
        <button type="button" onClick={addOffset} style={{ ...chip(false), height: '32px', color: 'var(--accent-primary)' }}>
          {_t("+ Aggiungi")}
        </button>
      </div>

      <button type="button" onClick={() => save({ badge: !badgeOn })} style={{ ...chip(badgeOn), alignSelf: 'flex-start' }}>
        {badgeOn ? '✓ ' : ''}{_t("Numero sull'icona")}
      </button>

      {enabled && notificationsSupported() && Notification.permission === 'granted' && (
        <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
          {_t("Da PWA i promemoria arrivano mentre l'app è aperta o in background da poco; il numero sull'icona si aggiorna a ogni apertura.")}
        </div>
      )}
    </div>
  );
}
