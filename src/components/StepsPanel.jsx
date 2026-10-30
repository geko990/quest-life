import React, { useEffect, useRef, useState } from 'react';
import { _t, getLocale } from '../i18n';
import StepsTrail from './StepsTrail';
import { QUICK_STEPS, GOAL_STEP, fmtSteps, recommendedSteps, stepsToKm, stepsToKcal, stepsStatus } from '../utils/steps';

// Contenuto della finestra "Registro Passi": sentiero di montagna a sinistra, numeri e pulsanti a destra,
// obiettivo giornaliero modificabile con il consiglio (età e obiettivo dai dati degli Obiettivi di Salute).
// Stessa struttura e classi della finestra dell'acqua (.wp-*), con i colori dei passi (.wp.is-steps).

const fmt = (n) => fmtSteps(n);

export default function StepsPanel({ steps, goal, profile = {}, onSteps, onGoal }) {
  const s = Math.max(0, Math.round(Number(steps) || 0));
  const g = Math.max(GOAL_STEP, Math.round(Number(goal) || 8000));
  const status = stepsStatus(s, g);
  const rec = recommendedSteps(profile);
  const km = stepsToKm(s, profile.height);
  const kcal = stepsToKcal(s, profile.weight);

  const prevRef = useRef(s);
  const [cheer, setCheer] = useState(0);
  useEffect(() => {
    if (prevRef.current < g && s >= g) setCheer(c => c + 1);
    prevRef.current = s;
  }, [s, g]);

  // Il numero grande si tocca per scrivere i passi esatti (es. quelli dell'app Salute)
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const commit = () => {
    const v = parseInt(String(draft).replace(/\D/g, ''), 10);
    if (Number.isFinite(v)) onSteps(Math.min(200000, v));
    setEditing(false);
  };

  const statusText = status.kind === 'below'
    ? _t("Mancano {0} passi", fmt(status.missing))
    : status.kind === 'goal'
      ? _t("Vetta raggiunta 🚩")
      : _t("+{0} passi extra ✨", fmt(status.extra));

  return (
    <div className="wp is-steps">
      <div className="wp-top">
        <StepsTrail steps={s} goal={g} onChange={onSteps} />

        <div className="wp-side">
          <div className="wp-label">{_t("Passi di oggi")}</div>
          {editing ? (
            <input
              className="wp-big-input"
              type="text"
              inputMode="numeric"
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
            />
          ) : (
            <button type="button" className="wp-big wp-big-btn" onClick={() => { setDraft(String(s)); setEditing(true); }} title={_t("Tocca per scrivere i passi esatti")}>
              {fmt(s)}
            </button>
          )}
          <div className="wp-of">{_t("di {0} • ≈ {1} km • ≈ {2} kcal", fmt(g), km.toLocaleString(getLocale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 }), fmt(kcal))}</div>
          <div key={cheer} className={`wp-status is-${status.kind}${cheer ? ' cheer' : ''}`}>{statusText}</div>

          <button type="button" className="wp-add" onClick={() => onSteps(s + QUICK_STEPS)}>
            <span className="wp-add-main">{_t("+ {0} passi", fmt(QUICK_STEPS))}</span>
          </button>
          <button type="button" className="wp-remove" disabled={s === 0} onClick={() => onSteps(Math.max(0, s - QUICK_STEPS))}>
            {_t("− {0}", fmt(QUICK_STEPS))}
          </button>
          <div className="wp-hint">{_t("Trascina sul sentiero o tocca il numero per scriverlo")}</div>
        </div>
      </div>

      {/* Obiettivo giornaliero */}
      <div className="wp-goal">
        <div className="wp-goal-row">
          <div>
            <div className="wp-label">🚩 {_t("Obiettivo giornaliero")}</div>
            <div className="wp-goal-val">{_t("{0} passi", fmt(g))}</div>
          </div>
          <div className="wp-stepper">
            <button type="button" disabled={g <= GOAL_STEP} onClick={() => onGoal(Math.max(GOAL_STEP, g - GOAL_STEP))} aria-label={_t("Diminuisci obiettivo")}>−</button>
            <button type="button" onClick={() => onGoal(Math.min(50000, g + GOAL_STEP))} aria-label={_t("Aumenta obiettivo")}>+</button>
          </div>
        </div>
        <div className="wp-rec">
          <div style={{ minWidth: 0 }}>
            <div className="wp-rec-main">{_t("Consigliato per te: almeno {0} passi", fmt(rec))}</div>
            <div className="wp-rec-sub">
              {profile.age ? _t("Per {0} anni", fmt(profile.age)) : _t("L'età si imposta negli Obiettivi di Salute")}
              {profile.goalType === 'lose' ? ` • ${_t("obiettivo dimagrimento")}` : ''} • {_t("indicazione di massima")}
            </div>
          </div>
          {rec !== g && (
            <button type="button" className="wp-rec-use" onClick={() => onGoal(rec)}>{_t("Usa")}</button>
          )}
        </div>
      </div>
    </div>
  );
}
