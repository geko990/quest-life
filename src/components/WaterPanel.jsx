import React, { useEffect, useRef, useState } from 'react';
import { _t, getLocale } from '../i18n';
import WaterCarafe from './WaterCarafe';
import { recommendedWater, glassesToLiters, waterStatus } from '../utils/hydration';

// Contenuto della finestra "Registro Acqua": caraffa a sinistra, numeri e pulsanti a destra,
// obiettivo giornaliero modificabile con il consiglio calcolato da peso, altezza, età (dati degli Obiettivi).

const fmtL = (l) => l.toLocaleString(getLocale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export default function WaterPanel({ glasses, goal, profile = {}, onGlasses, onGoal }) {
  const g = Math.max(0, Number(glasses) || 0);
  const t = Math.max(1, Number(goal) || 8);
  const status = waterStatus(g, t);
  const rec = recommendedWater(profile);

  // Piccola festa quando si raggiunge l'obiettivo (non all'apertura se era già raggiunto)
  const prevRef = useRef(g);
  const [cheer, setCheer] = useState(0);
  useEffect(() => {
    if (prevRef.current < t && g >= t) setCheer(c => c + 1);
    prevRef.current = g;
  }, [g, t]);

  const statusText = status.kind === 'below'
    ? (status.missing === 1 ? _t("Ancora 1 bicchiere") : _t("Ancora {0} bicchieri", status.missing))
    : status.kind === 'goal'
      ? _t("Obiettivo raggiunto! 🎯")
      : _t("+{0} L oltre l'obiettivo 💧", fmtL(glassesToLiters(status.extra)));

  const hasProfile = profile && (profile.age || profile.height);
  const profileLine = _t("Per {0} kg, {1} anni, {2} cm", fmtNum(profile.weight || 75), fmtNum(profile.age || 28), fmtNum(profile.height || 175));

  return (
    <div className="wp">
      <div className="wp-top">
        <WaterCarafe glasses={g} goal={t} onChange={onGlasses} />

        <div className="wp-side">
          <div className="wp-label">{_t("Idratazione di oggi")}</div>
          <div className="wp-big">{fmtL(glassesToLiters(g))}<span> L</span></div>
          <div className="wp-of">{_t("di {0} L • {1}/{2} bicchieri", fmtL(glassesToLiters(t)), g, t)}</div>
          <div key={cheer} className={`wp-status is-${status.kind}${cheer ? ' cheer' : ''}`}>{statusText}</div>

          <button type="button" className="wp-add" onClick={() => onGlasses(g + 1)}>
            <span className="wp-add-main">{_t("+ 1 bicchiere")}</span>
            <span className="wp-add-sub">0,2 L</span>
          </button>
          <button type="button" className="wp-remove" disabled={g === 0} onClick={() => onGlasses(Math.max(0, g - 1))}>
            {_t("− 1 bicchiere")}
          </button>
          <div className="wp-hint">{_t("Oppure trascina il dito sulla caraffa")}</div>
        </div>
      </div>

      {/* Obiettivo giornaliero */}
      <div className="wp-goal">
        <div className="wp-goal-row">
          <div>
            <div className="wp-label">🎯 {_t("Obiettivo giornaliero")}</div>
            <div className="wp-goal-val">{_t("{0} bicchieri", t)} <span>• {fmtL(glassesToLiters(t))} L</span></div>
          </div>
          <div className="wp-stepper">
            <button type="button" disabled={t <= 1} onClick={() => onGoal(Math.max(1, t - 1))} aria-label={_t("Diminuisci obiettivo")}>−</button>
            <button type="button" onClick={() => onGoal(Math.min(40, t + 1))} aria-label={_t("Aumenta obiettivo")}>+</button>
          </div>
        </div>
        <div className="wp-rec">
          <div style={{ minWidth: 0 }}>
            <div className="wp-rec-main">{_t("Consigliato per te: almeno {0} bicchieri ({1} L)", rec.glasses, fmtL(rec.liters))}</div>
            <div className="wp-rec-sub">
              {hasProfile ? profileLine : _t("Età e altezza si impostano negli Obiettivi di Salute")} • {_t("indicazione di massima")}
            </div>
          </div>
          {rec.glasses !== t && (
            <button type="button" className="wp-rec-use" onClick={() => onGoal(rec.glasses)}>{_t("Usa")}</button>
          )}
        </div>
      </div>
    </div>
  );
}

function fmtNum(n) {
  return Number(n).toLocaleString(getLocale(), { maximumFractionDigits: 1 });
}
