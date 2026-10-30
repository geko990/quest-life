import React, { useEffect, useState } from 'react';
import { _t, getLocale } from '../i18n';
import { visibleSteps } from '../utils/campaignRecap';

// Campagna completata (#69): al posto dell'avviso del telefono, una tessera nello stile dell'app (colori del
// tema, emoji Fluent) che racconta il percorso e mette in risalto il premio scelto dall'utente.
// Tempi: la tessera entra in 0,45 s; i passi si accendono uno dopo l'altro (90 ms l'uno, da 0,45 s);
// il traguardo e poi il premio arrivano subito dopo l'ultimo passo. Con Animazioni spente tutto fermo.
// Si chiude con "Continua" o toccando fuori; non si chiude da sola (c'è da leggere, come la medaglia con un'area nuova).

const STEP_MS = 90;
const FIRST_STEP_MS = 450;

const dayLabel = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
  if (!m) return '';
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  try { return d.toLocaleDateString(getLocale(), { day: 'numeric', month: 'short' }); } catch (_) { return iso; }
};

export default function CampaignComplete({ recap, onClose }) {
  const rows = visibleSteps(recap.steps);
  const finishAt = FIRST_STEP_MS + (rows.length + 1) * STEP_MS;
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const close = () => { setLeaving(true); setTimeout(() => onClose && onClose(), 220); };
  const newQuest = (e) => {
    e.stopPropagation();
    close();
    setTimeout(() => { try { window.dispatchEvent(new CustomEvent('ql-new-quest')); } catch (_) { /* niente */ } }, 240);
  };

  const n = recap.steps.length;
  return (
    <div className={`cc-overlay${leaving ? ' leaving' : ''}`} onClick={close} role="dialog" aria-label={_t("Campagna completata")}>
      <div className="cc-card" onClick={(e) => e.stopPropagation()} style={{ '--cc-finish': `${finishAt}ms` }}>
        <div className="cc-head">
          <div className="cc-seal">
            <span className="cc-seal-ring" />
            <span className="cc-seal-emoji">{recap.emoji}</span>
            <span className="cc-spark s1">✨</span>
            <span className="cc-spark s2">✨</span>
          </div>
          <div className="cc-kicker">{_t("Campagna completata")}</div>
          <h2 className="cc-name">{recap.name}</h2>
          <div className="cc-stats">
            <span>{n === 1 ? _t("1 passo") : _t("{0} passi", n)}</span>
            {recap.totalDays ? <span>{recap.totalDays === 1 ? _t("in un giorno") : _t("in {0} giorni", recap.totalDays)}</span> : null}
            <span className="cc-xp">+{recap.xp} XP</span>
          </div>
        </div>

        <div className="cc-path-title">{_t("Il tuo percorso")}</div>
        <ol className="cc-path">
          {rows.map((r, i) => r.gap ? (
            <li key="gap" className="cc-step cc-gap" style={{ '--d': `${FIRST_STEP_MS + i * STEP_MS}ms` }}>
              <span className="cc-dot" />
              <span className="cc-step-name">{r.gap === 1 ? _t("+ 1 passo") : _t("+ {0} passi", r.gap)}</span>
            </li>
          ) : (
            <li key={r.index} className="cc-step" style={{ '--d': `${FIRST_STEP_MS + i * STEP_MS}ms` }}>
              <span className="cc-dot">✓</span>
              <span className="cc-step-name">{r.name}</span>
              {r.day ? <span className="cc-step-day">{dayLabel(r.day)}</span> : null}
            </li>
          ))}
          <li className="cc-step cc-goal" style={{ '--d': `${FIRST_STEP_MS + rows.length * STEP_MS}ms` }}>
            <span className="cc-dot">🏁</span>
            <span className="cc-step-name">{_t("Traguardo")}</span>
            <span className="cc-step-day">{_t("oggi")}</span>
          </li>
        </ol>

        {recap.reward ? (
          <div className="cc-reward">
            <span className="cc-reward-gift">🎁</span>
            <div className="cc-reward-body">
              <small>{_t("Il tuo premio")}</small>
              <b>{recap.reward}</b>
              <span>{_t("Te lo sei guadagnato: ora goditelo.")}</span>
            </div>
          </div>
        ) : (
          <div className="cc-noreward">
            <p>{_t("Non avevi scelto un premio, ma te ne sei guadagnato uno: concediti qualcosa che ti fa piacere.")}</p>
            <button type="button" onClick={newQuest}>{_t("Prepara la prossima campagna con un premio ›")}</button>
          </div>
        )}

        <button type="button" className="cc-go" onClick={(e) => { e.stopPropagation(); close(); }}>{_t("Continua")}</button>
      </div>
    </div>
  );
}
