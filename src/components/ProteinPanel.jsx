import React, { useEffect, useRef, useState } from 'react';
import { _t } from '../i18n';
import ProteinFood from './ProteinFood';
import { PROTEIN_GOAL_STEP, recommendedProtein, proteinStatus, fmtGrams } from '../utils/proteins';

// Contenuto della finestra "Apporto Proteico": cibo che si consuma a sinistra (secondo la dieta del profilo),
// numeri a destra (non si modificano a mano: seguono i pasti), obiettivo con il consiglio,
// cibi di oggi in una sotto-tessera scorrevole. Stessa altezza delle finestre di acqua e passi.
// Stessa struttura e classi delle finestre di acqua e passi (.wp-*), colori delle proteine (.wp.is-protein).

const MEAL_NAMES = {
  breakfast: 'Colazione', main: 'Pasti principali', lunch: 'Pasti principali', dinner: 'Pasti principali',
  snack: 'Spuntino', cheat: 'Sgarro'
};

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

  const foods = [];
  Object.entries(meals || {}).forEach(([cat, items]) => {
    (Array.isArray(items) ? items : []).forEach(it => {
      if (Number(it.proteins) > 0) foods.push({ ...it, cat });
    });
  });
  foods.sort((a, b) => (Number(b.proteins) || 0) - (Number(a.proteins) || 0));
  const goalLabel = profile.goalType === 'gain' ? _t("massa") : profile.goalType === 'lose' ? _t("dimagrimento") : _t("mantenimento");

  return (
    <div className="wp is-protein">
      <div className="wp-top">
        <ProteinFood grams={g} goal={t} diet={diet} />

        <div className="wp-side">
          <div className="wp-label">{_t("Proteine di oggi")}</div>
          <div className="wp-big">{fmtGrams(g)}<span> g</span></div>
          <div className="wp-of">{_t("di {0} g • {1}%", t, Math.round((g / t) * 100))}</div>
          <div key={cheer} className={`wp-status is-${status.kind}${cheer ? ' cheer' : ''}`}>{statusText}</div>

          <div className="wp-hint wp-hint-left">{_t("Si aggiorna da solo con i cibi di \"Mangiato oggi\"")}</div>
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

      {/* Da dove arrivano le proteine di oggi */}
      <div className="wp-foods">
        <div className="wp-label">{_t("Dai cibi di oggi")}{foods.length > 0 ? ` • ${foods.length}` : ''}</div>
        <div className="wp-foods-list">
        {foods.length === 0 ? (
          <div className="wp-foods-empty">{_t("Nessun cibo con proteine registrato oggi: i cibi aggiunti in \"Mangiato oggi\" compaiono qui.")}</div>
        ) : foods.map((f, i) => (
          <div key={f.id || i} className="wp-food">
            <span className="wp-food-emoji">{f.emoji || '🍽️'}</span>
            <div className="wp-food-text">
              <div className="wp-food-name">{f.name}</div>
              <div className="wp-food-sub">{_t(MEAL_NAMES[f.cat] || f.cat)}{f.grams ? ` • ${f.grams}` : ''}</div>
            </div>
            <span className="wp-food-prot">+{fmtGrams(f.proteins)} g</span>
          </div>
        ))}
        </div>
      </div>
    </div>
  );
}
