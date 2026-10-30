import React, { useEffect, useRef, useState } from 'react';
import { _t } from '../i18n';
import { onCelebration, statProgress } from '../utils/celebrations';
import CampaignComplete from './CampaignComplete';

// Livello grafico delle celebrazioni, sopra tutta l'app:
// 1. barra XP: piccola tessera in alto che mostra per un attimo le abilità che crescono.
//    Non intercetta i tocchi e accumula le spunte fatte in fila (niente attese tra una e l'altra).
// 2. coriandoli: abitudini di oggi tutte fatte, Azioni del Giorno tutte fatte.
// 3. medaglia di livello: abilità o personaggio che sale di livello (tocco per chiudere).
// 4. campagna completata (#67): percorso, giorni, XP e premio (CampaignComplete.jsx). Se nello stesso momento
//    sale anche un livello, la medaglia aspetta che la campagna si chiuda.
//
// Tempi (utili anche per rifarle nell'app nativa):
// - barra XP: entra in 220 ms, la barra si riempie in 480 ms (con salto di livello: fino al 100% in 380 ms,
//   poi riparte da 0 fino al nuovo valore), resta 1,6 s dopo l'ultima spunta, esce in 220 ms.
// - coriandoli: 2,6 s, due "cannoni" dagli angoli in basso; scritta al centro per 2,2 s.
// - medaglia: compare 650 ms dopo l'XP (il tempo di vedere la barra piena), si chiude da sola dopo 4 s.

const XP_HOLD_MS = 1600;
const LEVELUP_DELAY_MS = 650;
const LEVELUP_AUTOCLOSE_MS = 4000;
const motionAllowed = () => {
  try {
    if (document.documentElement.getAttribute('data-animations') === 'off') return false;
    return !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  } catch (_) { return true; }
};

const buzz = (pattern) => { try { if (navigator.vibrate && motionAllowed()) navigator.vibrate(pattern); } catch (_) {} };

// ---------------- Coriandoli (canvas, nessuna libreria) ----------------
function launchConfetti(mode = 'cannons') {
  if (!motionAllowed()) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'confetti-canvas';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = window.innerWidth, H = window.innerHeight;
  canvas.width = W * dpr; canvas.height = H * dpr;
  ctx.scale(dpr, dpr);

  let accent = '#7c3aed';
  try { accent = getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim() || accent; } catch (_) {}
  const colors = [accent, '#f59e0b', '#22c55e', '#0ea5e9', '#ef4444', '#ec4899', '#facc15', '#a78bfa'];
  const parts = [];
  const add = (x, y, angle, speed) => parts.push({
    x, y,
    vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
    w: 6 + Math.random() * 5, h: 9 + Math.random() * 7,
    rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.35,
    tilt: Math.random() * Math.PI, vt: 0.08 + Math.random() * 0.12,
    color: colors[(Math.random() * colors.length) | 0],
    round: Math.random() < 0.25
  });
  const n = Math.min(160, Math.round(W / 2.6));
  if (mode === 'burst') {
    for (let i = 0; i < n; i++) add(W / 2, H * 0.4, Math.random() * Math.PI * 2, 4 + Math.random() * 9);
  } else {
    for (let i = 0; i < n; i++) {
      const left = i % 2 === 0;
      const base = left ? -Math.PI / 2 + 0.45 : -Math.PI / 2 - 0.45;
      add(left ? -10 : W + 10, H * 0.82, base + (Math.random() - 0.5) * 0.7, 11 + Math.random() * 9);
    }
  }

  const DURATION = 2600;
  const start = performance.now();
  let last = start;
  const frame = (now) => {
    const dt = Math.min(2.5, (now - last) / 16.67); // passo in "fotogrammi a 60 fps"
    last = now;
    const t = (now - start) / DURATION;
    ctx.clearRect(0, 0, W, H);
    const fade = t > 0.7 ? Math.max(0, 1 - (t - 0.7) / 0.3) : 1;
    parts.forEach(p => {
      p.vx *= Math.pow(0.985, dt);
      p.vy = p.vy * Math.pow(0.985, dt) + 0.32 * dt;
      p.x += p.vx * dt + Math.sin(p.tilt) * 0.6 * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt; p.tilt += p.vt * dt;
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.scale(1, Math.cos(p.tilt)); // effetto "giravolta"
      ctx.fillStyle = p.color;
      if (p.round) { ctx.beginPath(); ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2); ctx.fill(); }
      else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    if (t < 1) requestAnimationFrame(frame);
    else canvas.remove();
  };
  requestAnimationFrame(frame);
}

// ---------------- Barra di una abilità ----------------
// Anima dal valore precedente al nuovo; se c'è un salto di livello passa dal 100% e riparte da 0.
function XpBar({ fromPct, toPct, levelsGained, version }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const timers = [];
    const set = (pct, ms) => {
      el.style.transition = ms ? `width ${ms}ms cubic-bezier(0.22, 1, 0.36, 1)` : 'none';
      el.style.width = `${pct}%`;
    };
    if (!motionAllowed()) { set(toPct, 0); return; }
    set(fromPct, 0);
    void el.offsetWidth;
    timers.push(setTimeout(() => {
      if (levelsGained > 0) {
        set(100, 380);
        timers.push(setTimeout(() => {
          set(0, 0); void el.offsetWidth;
          set(toPct, 420);
        }, 430));
      } else set(toPct, 480);
    }, 120));
    return () => timers.forEach(clearTimeout);
  }, [version]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="xp-toast-track">
      <div ref={ref} className="xp-toast-fill" style={{ width: `${fromPct}%` }} />
    </div>
  );
}

export default function CelebrationLayer() {
  const [xpRows, setXpRows] = useState([]);         // [{ statId, icon, name, startPct, fromPct, toPct, level, levelsGained, amount, version }]
  const [xpLeaving, setXpLeaving] = useState(false);
  const [banner, setBanner] = useState(null);       // { message, key }
  const [levelUp, setLevelUp] = useState(null);     // { main, others: [] }
  const hideTimer = useRef(null);
  const leaveTimer = useRef(null);
  const levelQueue = useRef([]);
  const levelTimer = useRef(null);
  const closeTimer = useRef(null);
  const bannerTimer = useRef(null);
  const [campaign, setCampaign] = useState(null);   // riepilogo di campaignRecap.js
  const campaignOpen = useRef(false);
  const heldLevelUp = useRef(null);
  const campaignTimer = useRef(null);

  useEffect(() => onCelebration((type, p) => {
    if (type === 'xp') {
      const toPct = statProgress(p.toLevel, p.toXp);
      setXpLeaving(false);
      clearTimeout(leaveTimer.current);
      setXpRows(rows => {
        const i = rows.findIndex(r => r.statId === p.statId);
        if (i === -1) {
          const row = {
            statId: p.statId, icon: p.icon, name: p.name,
            fromPct: statProgress(p.fromLevel, p.fromXp), toPct, level: p.toLevel,
            levelsGained: p.toLevel - p.fromLevel, amount: p.amount, version: 1
          };
          return [...rows, row].slice(-3); // al massimo 3 righe
        }
        const r = rows[i];
        const next = {
          ...r, fromPct: r.toPct, toPct, level: p.toLevel,
          levelsGained: p.toLevel - r.level, amount: r.amount + p.amount, version: r.version + 1
        };
        return rows.map((x, k) => (k === i ? next : x));
      });
      clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => {
        setXpLeaving(true);
        leaveTimer.current = setTimeout(() => { setXpRows([]); setXpLeaving(false); }, 230);
      }, XP_HOLD_MS);
      buzz(12);
    } else if (type === 'levelup') {
      levelQueue.current.push(p);
      clearTimeout(levelTimer.current);
      levelTimer.current = setTimeout(() => {
        const q = levelQueue.current; levelQueue.current = [];
        // Una sola medaglia: il personaggio ha la precedenza, le abilità salite compaiono sotto
        const byKey = new Map();
        q.forEach(x => byKey.set(x.kind === 'player' ? 'player' : x.statId, x)); // tiene il livello più alto
        const list = [...byKey.values()];
        const main = list.find(x => x.kind === 'player') || list[0];
        const show = () => {
          setLevelUp({ main, others: list.filter(x => x !== main), key: Date.now() });
          launchConfetti('burst');
          buzz([30, 60, 30, 60, 80]);
          clearTimeout(closeTimer.current);
          // Con un'area appena aperta (#64) la medaglia resta finché non si tocca: c'è da leggere
          if (!(main.lands && main.lands.length)) closeTimer.current = setTimeout(() => setLevelUp(null), LEVELUP_AUTOCLOSE_MS);
        };
        if (campaignOpen.current) heldLevelUp.current = show; else show();
      }, LEVELUP_DELAY_MS);
    } else if (type === 'campaign') {
      // dopo la barra XP del passo appena spuntato, così si vede crescere l'abilità
      campaignOpen.current = true;
      clearTimeout(campaignTimer.current);
      campaignTimer.current = setTimeout(() => {
        setCampaign({ ...p, key: Date.now() });
        launchConfetti('cannons');
        buzz([25, 50, 25, 50, 90]);
      }, 520);
    } else if (type === 'confetti') {
      launchConfetti('cannons');
      buzz([20, 40, 20]);
      setBanner({ message: p.message, key: Date.now() });
      clearTimeout(bannerTimer.current);
      bannerTimer.current = setTimeout(() => setBanner(null), 2200);
    }
  }), []);

  useEffect(() => () => {
    [hideTimer, leaveTimer, levelTimer, closeTimer, bannerTimer, campaignTimer].forEach(t => clearTimeout(t.current));
  }, []);

  const closeLevelUp = () => { clearTimeout(closeTimer.current); setLevelUp(null); };
  const closeCampaign = () => {
    setCampaign(null);
    campaignOpen.current = false;
    const held = heldLevelUp.current; heldLevelUp.current = null;
    if (held) setTimeout(held, 250);
  };

  return (
    <>
      {xpRows.length > 0 && (
        <div className={`xp-toast ${xpLeaving ? 'leaving' : ''}`} aria-live="polite">
          {xpRows.map(r => (
            <div key={r.statId} className="xp-toast-row">
              <span className="xp-toast-icon">{r.icon}</span>
              <div className="xp-toast-main">
                <div className="xp-toast-head">
                  <span className="xp-toast-name">{_t(r.name)}</span>
                  <span className={`xp-toast-level ${r.levelsGained > 0 ? 'up' : ''}`} key={`l${r.level}`}>{_t("Liv. {0}", r.level)}</span>
                </div>
                <XpBar fromPct={r.fromPct} toPct={r.toPct} levelsGained={r.levelsGained} version={r.version} />
              </div>
              <span className="xp-toast-amount" key={`a${r.version}`}>+{r.amount}</span>
            </div>
          ))}
        </div>
      )}

      {banner && (
        <div className="celebration-banner" key={banner.key}>{banner.message}</div>
      )}

      {campaign && <CampaignComplete key={campaign.key} recap={campaign} onClose={closeCampaign} />}

      {levelUp && (
        <div className="levelup-overlay" key={levelUp.key} onClick={closeLevelUp} role="dialog" aria-label={_t("Livello superiore!")}>
          <div className="levelup-card">
            <div className="levelup-medal">
              <div className="levelup-rays" />
              {/* Medaglia (richiesta dell'utente, #64): per il personaggio solo "Liv. N", la sfera dorata basta;
                  per un'abilità resta la sua icona, che dice quale abilità è salita */}
              <div className={`levelup-disc${levelUp.main.kind === 'player' ? ' is-player' : ''}`}>
                {levelUp.main.kind !== 'player' && <span className="levelup-icon">{levelUp.main.icon}</span>}
                <span className="levelup-number"><span className="levelup-liv">{_t("Liv.")}</span>{levelUp.main.level}</span>
              </div>
            </div>
            {levelUp.main.kind === 'player' ? (
              <>
                <div className="levelup-title">{_t(levelUp.main.title || '')}</div>
                <div className="levelup-rank">{levelUp.main.newTitle ? _t("Nuovo titolo!") : levelUp.main.name}</div>
              </>
            ) : (
              <div className="levelup-title">{_t(levelUp.main.name)}</div>
            )}
            {levelUp.main.kind === 'player' && (levelUp.main.lands || []).map(l => (
              <div key={l.feature} className="levelup-land">
                <span className="levelup-land-emoji">{l.emoji}</span>
                <small>{_t("Hai sbloccato")}</small>
                <b>{_t(l.name)}</b>
                <span className="txt">{_t(l.text)}</span>
              </div>
            ))}
            {levelUp.others.length > 0 && (
              <div className="levelup-others">
                {levelUp.others.map(o => (
                  <span key={o.statId || 'player'} className="levelup-chip">{o.icon} {_t(o.name)} → {o.level}</span>
                ))}
              </div>
            )}
            {levelUp.main.kind === 'player' && (levelUp.main.lands || []).length > 0 ? (
              <button
                type="button"
                className="levelup-go"
                onClick={(e) => {
                  e.stopPropagation(); closeLevelUp();
                  const l = levelUp.main.lands[levelUp.main.lands.length - 1];
                  try { window.dispatchEvent(new CustomEvent('ql-land-go', { detail: { feature: l.feature } })); } catch (_) { /* niente */ }
                }}
              >{_t("Andiamo a vedere")}</button>
            ) : (
              <div className="levelup-hint">{_t("Tocca per continuare")}</div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
