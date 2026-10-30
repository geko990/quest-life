import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { _t } from '../i18n';
import Emoji from './Emoji';
import { CHALLENGE_TEMPLATES } from '../utils/constants';

// Prima missione di un'area appena aperta (#62), come nel benvenuto: una domanda, una risposta che crea
// dati veri, un po' di XP. Salute: i bicchieri d'acqua di oggi. Tesoro: il saldo del conto base.
// Campagne: la prima sfida tra tre proposte. (Le Azioni del Giorno usano "È il tuo turno!" con la sua riga
// di spiegazione.) Stesso aspetto dei pannelli dal basso (classi .emoji-picker-*), tempi uguali.
export default function LandIntro({ kind, water = 0, onWater, onBalance, onChallenge, onDone, onClose }) {
  const [shown, setShown] = useState(false);
  const [glasses, setGlasses] = useState(water || 0);
  const [bal, setBal] = useState('');
  const [pick, setPick] = useState(null);
  useEffect(() => { const r = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true))); return () => cancelAnimationFrame(r); }, []);

  const close = (done) => { setShown(false); setTimeout(() => { done ? onDone && onDone() : onClose && onClose(); }, 280); };

  const challenges = [];
  const cats = new Set();
  for (const t of CHALLENGE_TEMPLATES) {
    if (t.unlockRequirement || cats.has(t.category)) continue;
    cats.add(t.category); challenges.push(t);
    if (challenges.length === 3) break;
  }

  let body = null;
  if (kind === 'nutrition') {
    body = (
      <>
        <small className="land-tag">{_t("Prima missione · Salute")}</small>
        <h2>{_t("Quanta acqua hai bevuto oggi?")}</h2>
        <p>{_t("Tocca un bicchiere per ognuno. Da domani lo segni qui o dalla Home.")}</p>
        <div className="land-glasses">
          {[...Array(8)].map((_, i) => (
            <button key={i} type="button" className={i < glasses ? 'on' : ''} onClick={() => setGlasses(i + 1 === glasses ? i : i + 1)} aria-label={_t("{0} bicchieri", i + 1)}><Emoji e="💧" big /></button>
          ))}
        </div>
        <button type="button" className="ob-cta" disabled={glasses < 1} onClick={() => { onWater && onWater(glasses); close(true); }}>{_t("Fatto")}</button>
      </>
    );
  } else if (kind === 'finances') {
    const v = parseFloat(String(bal).replace(',', '.'));
    body = (
      <>
        <small className="land-tag">{_t("Prima missione · Tesoro")}</small>
        <h2>{_t("Quanto hai nel conto principale?")}</h2>
        <p>{_t("Basta una cifra indicativa: la puoi cambiare quando vuoi. Resta solo sul tuo telefono.")}</p>
        <div className="land-money"><input type="text" inputMode="decimal" placeholder="0" value={bal} onChange={(e) => setBal(e.target.value)} aria-label={_t("Saldo del conto")} /> €</div>
        <button type="button" className="ob-cta" disabled={!isFinite(v)} onClick={() => { onBalance && onBalance(v); close(true); }}>{_t("Apri il Tesoro")}</button>
      </>
    );
  } else if (kind === 'quests') {
    body = (
      <>
        <small className="land-tag">{_t("Prima missione · Campagne")}</small>
        <h2>{_t("Scegli la tua prima sfida")}</h2>
        <p>{_t("Una campagna è un obiettivo lungo, diviso in passi piccoli.")}</p>
        <div className="land-picks">
          {challenges.map(t => (
            <button key={t.id} type="button" aria-pressed={pick === t.id} onClick={() => setPick(t.id)}>
              <span className="land-pick-emoji"><Emoji e={t.icon || '🏆'} big /></span>
              <span><b>{_t(t.name)}</b><small>{_t("{0} giorni · un passo al giorno", t.duration)}</small></span>
            </button>
          ))}
        </div>
        <button type="button" className="ob-cta" disabled={!pick} onClick={() => { onChallenge && onChallenge(challenges.find(t => t.id === pick)); close(true); }}>{_t("Inizia la campagna")}</button>
      </>
    );
  }

  return createPortal(
    <div className="emoji-picker-root" onClick={(e) => e.stopPropagation()}>
      <div className={`emoji-picker-veil ${shown ? 'show' : ''}`} onClick={() => close(false)} />
      <div className={`emoji-picker-sheet land-sheet ${shown ? 'show' : ''}`} role="dialog">
        <div className="emoji-picker-grab" />
        {body}
      </div>
    </div>,
    document.body
  );
}
