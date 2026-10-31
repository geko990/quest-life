import React, { useEffect, useRef, useState } from 'react';
import { _t } from '../i18n';
import ProteinFood from './ProteinFood';
import { PROTEIN_GOAL_STEP, recommendedProtein, proteinStatus, fmtGrams } from '../utils/proteins';

// Contenuto della finestra "Apporto Proteico": cibo che si consuma a sinistra (secondo la dieta del profilo),
// numeri a destra (non si modificano a mano: seguono i pasti), obiettivo con il consiglio,
// stessa struttura e altezza delle finestre di acqua e passi. Un tocco sul cibo rivede i morsi di oggi.
// Stessa struttura e classi delle finestre di acqua e passi (.wp-*), colori delle proteine (.wp.is-protein).


export default function ProteinPanel({ grams, goal, profile = {}, meals = {}, onGoal }) {
  const g = Math.max(0, Math.round((Number(grams) || 0) * 10) / 10);
  const t = Math.max(PROTEIN_GOAL_STEP, Math.round(Number(goal) || 100));
  const diet = profile.diet || 'omnivore';
  const status = proteinStatus(g, t);
  const rec = recommendedProtein(profile);

  const prevRef = useRef(g);
  const [cheer, setCheer] = useState(0);
  useEffect(() => {
    if (prevRef.current < t && g >= t) setCheer(c => c + 1);
    prevRef.current = g;
  }, [g, t]);

  const doneText = diet === 'vegan' ? _t("Ciotola vuota! 🫘") : diet === 'vegetarian' ? _t("Uovo finito! 🥚") : _t("Osso pulito! 🍗");
  const statusText = status.kind === 'below'
    ? _t("Mancano {0} g", fmtGrams(status.missing))
    : status.kind === 'goal' ? doneText : _t("+{0} g extra ✨", fmtGrams(status.extra));

  // Cibi di oggi in ordine di pasto (colazione → sgarro): servono al tocco sul cibo per rivedere i morsi
  const foods = [];
  ['breakfast', 'lunch', 'main', 'dinner', 'snack', 'cheat', ...Object.keys(meals || {})].filter((c, i, a) => a.indexOf(c) === i).forEach(cat => {
    (Array.isArray(meals?.[cat]) ? meals[cat] : []).forEach(it => {
      if (Number(it.proteins) > 0) foods.push({ emoji: it.emoji, proteins: Number(it.proteins) });
    });
  });
  const goalLabel = profile.goalType === 'gain' ? _t("massa") : profile.goalType === 'lose' ? _t("dimagrimento") : _t("mantenimento");

  return (
    <div className="wp is-protein">
      <div className="wp-top">
        <ProteinFood grams={g} goal={t} diet={diet} foods={foods} />

        <div className="wp-side">
          <div className="wp-label">{_t("Proteine di oggi")}</div>
          <div className="wp-big">{fmtGrams(g)}<span> g</span></div>
          <div className="wp-of">{_t("di {0} g • {1}%", t, Math.round((g / t) * 100))}</div>
          <div key={cheer} className={`wp-status is-${status.kind}${cheer ? ' cheer' : ''}`}>{statusText}</div>

          <div className="wp-hint wp-hint-left">{_t("Si aggiorna da solo con i cibi di \"Mangiato oggi\"")}</div>
          {foods.length > 0 && <div className="wp-hint wp-hint-left wp-hint-tap">👆 {_t("Tocca il cibo per rivedere i morsi di oggi")}</div>}
        </div>
      </div>

      {/* Obiettivo giornaliero */}
      <div className="wp-goal">
        <div className="wp-goal-row">
          <div>
            <div className="wp-label">🎯 {_t("Obiettivo giornaliero")}</div>
            <div className="wp-goal-val">{t} g</div>
          </div>
          <div className="wp-stepper">
            <button type="button" disabled={t <= PROTEIN_GOAL_STEP} onClick={() => onGoal(Math.max(PROTEIN_GOAL_STEP, t - PROTEIN_GOAL_STEP))} aria-label={_t("Diminuisci obiettivo")}>−</button>
            <button type="button" onClick={() => onGoal(Math.min(400, t + PROTEIN_GOAL_STEP))} aria-label={_t("Aumenta obiettivo")}>+</button>
          </div>
        </div>
        <div className="wp-rec">
          <div style={{ minWidth: 0 }}>
            <div className="wp-rec-main">{_t("Consigliato per te: almeno {0} g", rec.grams)}</div>
            <div className="wp-rec-sub">
              {_t("{0} g per kg • {1} kg • obiettivo {2}", String(rec.perKg).replace('.', ','), fmtGrams(profile.weight || 75), goalLabel)} • {_t("indicazione di massima")}
            </div>
          </div>
          {rec.grams !== t && (
            <button type="button" className="wp-rec-use" onClick={() => onGoal(rec.grams)}>{_t("Usa")}</button>
          )}
        </div>
      </div>

    </div>
  );
}
