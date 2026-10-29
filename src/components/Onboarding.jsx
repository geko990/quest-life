import React, { useEffect, useRef, useState } from 'react';
import { _t, setLanguage, playerDisplayName } from '../i18n';
import Emoji from './Emoji';
import AvatarSheet from './AvatarSheet';
import { fluentUrl } from '../utils/fluent';
import { celebrate, titleForLevel } from '../utils/celebrations';
import { getCumulativeXpForLevel } from '../utils/helpers';
import {
  AVATAR_CHOICES, AREAS, MIN_AREAS, MAX_AREAS, MAX_HABITS, areaById, suggestedHabits,
  buildStats, buildHabit, buildFirstMission, isStandalone, mobilePlatform, installSkipped, skipInstall,
} from '../utils/onboarding';

// Benvenuto per chi apre l'app la prima volta (#58). Una domanda per schermata, ogni risposta crea dati veri:
// 1. nome e icona, 2. abilità (le aree della vita scelte, nel radar), 3. prime abitudini, 4. prima missione
// da spuntare subito (XP vero, coriandoli). Prima, se l'app è aperta nel browser di un telefono, una schermata
// sola per aggiungerla alla Home (i dati di Safari e dell'icona sono separati: meglio cominciare dall'icona).
// Tono: un taccuino che accompagna, niente mostri né pressione; italiano che vale per chiunque.
// Tempi: scorrimento tra le schermate 0,45 s; dopo la spunta la tessera del profilo compare dopo 0,9 s;
// all'uscita il benvenuto svanisce in 0,35 s.
export default function Onboarding({ settings, setSettings, player, setPlayer, stats, setStats, setHabits, setOneshots, onToggleOneshot, todayStr }) {
  const platform = mobilePlatform();
  const [gate, setGate] = useState(() => !!platform && !isStandalone() && !installSkipped());
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState({ type: 'emoji', emoji: '🧙' });
  const [sheet, setSheet] = useState(false);
  const [areas, setAreas] = useState([]);
  const [picked, setPicked] = useState([]);
  const [missionId, setMissionId] = useState(null);
  const [done, setDone] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [, setLangTick] = useState(0);
  const nameRef = useRef(null);

  const lang = settings.language === 'en' ? 'en' : 'it';
  const setLang = (l) => { setLanguage(l); setSettings(prev => ({ ...prev, language: l })); setLangTick(t => t + 1); };

  // Chiusa dopo aver già creato i dati (ultima schermata): alla riapertura si va direttamente all'app
  useEffect(() => { if (settings.onboardingCommitted && !missionId) setSettings(prev => ({ ...prev, onboardingDone: true, onboardingDate: prev.onboardingDate || todayStr })); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!gate && step === 0) { const t = setTimeout(() => nameRef.current && nameRef.current.focus({ preventScroll: true }), 500); return () => clearTimeout(t); } }, [gate, step]);

  const savePlayer = () => setPlayer(prev => ({
    ...prev,
    name: name.trim() || prev.name,
    avatarType: avatar.type,
    avatarEmoji: avatar.type === 'emoji' ? avatar.emoji : prev.avatarEmoji,
    avatarImage: avatar.type === 'image' ? avatar.image : prev.avatarImage,
  }));

  const finish = (skipped) => {
    if (skipped) savePlayer();
    setLeaving(true);
    setTimeout(() => setSettings(prev => ({ ...prev, onboardingDone: true, onboardingDate: todayStr })), 350);
  };

  // Entrando nell'ultima schermata si salvano nome, icona, abilità, abitudini e la prima missione
  const toMission = () => {
    savePlayer();
    // Segno che i dati sono stati creati: se l'app si chiude qui, alla riapertura non si duplicano
    setSettings(prev => ({ ...prev, onboardingCommitted: true }));
    setStats(prev => buildStats(prev, areas));
    const list = suggestedHabits(areas).filter(h => picked.includes(h.key));
    setHabits(prev => [...prev, ...list.map(buildHabit)]);
    const m = buildFirstMission(areas);
    setOneshots(prev => [...prev, m]);
    setMissionId(m.id);
    setStep(3);
  };

  const complete = () => {
    if (done || !missionId) return;
    setDone(true);
    onToggleOneshot && onToggleOneshot(missionId);
    celebrate('confetti', { reason: 'welcome', message: _t("🎉 Prima missione completata!") });
  };

  const toggleArea = (id) => setAreas(prev => {
    if (prev.includes(id)) return prev.filter(x => x !== id);
    return prev.length >= MAX_AREAS ? prev : [...prev, id];
  });
  const habits = suggestedHabits(areas);
  useEffect(() => { setPicked(prev => prev.filter(k => habits.some(h => h.key === k))); }, [areas.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps
  const toggleHabit = (k) => setPicked(prev => (prev.includes(k) ? prev.filter(x => x !== k) : (prev.length >= MAX_HABITS ? prev : [...prev, k])));

  const nArea = areas.length;
  const areaCount = nArea < MIN_AREAS
    ? _t("Scegline ancora {0}", MIN_AREAS - nArea)
    : nArea === MAX_AREAS ? _t("Perfetto: {0} su {0}", MAX_AREAS) : _t("{0} su {1} · puoi sceglierne ancora {2}", nArea, MAX_AREAS, MAX_AREAS - nArea);

  const avatarNode = (a, big = true) => a.type === 'image' && a.image
    ? <img className="ob-photo" src={a.image} alt={_t("Foto")} />
    : <Emoji e={a.emoji} big={big} />;
  const custom = avatar.type === 'image' || !AVATAR_CHOICES.includes(avatar.emoji);

  // Profilo dopo la prima missione (dati veri: livello e XP del giocatore)
  const level = player.level || 1;
  const xpFrom = getCumulativeXpForLevel(level); const xpTo = getCumulativeXpForLevel(level + 1);
  const pct = Math.max(4, Math.min(100, ((player.totalXp || 0) - xpFrom) / Math.max(1, xpTo - xpFrom) * 100));

  if (gate) {
    return (
      <div className={`ob-root ${leaving ? 'leaving' : ''}`}>
        <InstallScreen platform={platform} onLater={() => { skipInstall(); setGate(false); }} />
      </div>
    );
  }

  return (
    <div className={`ob-root ${leaving ? 'leaving' : ''}`} role="dialog" aria-label={_t("Benvenuto in Quest Life")}>
      <div className="ob-top">
        <div className="ob-lang" style={{ visibility: step === 0 ? 'visible' : 'hidden' }}>
          <button type="button" aria-pressed={lang === 'it'} onClick={() => setLang('it')}>IT</button>
          <button type="button" aria-pressed={lang === 'en'} onClick={() => setLang('en')}>EN</button>
        </div>
        <div className="ob-progress">{[0, 1, 2, 3].map(i => <i key={i} className={i <= step ? 'on' : ''} />)}</div>
        <button type="button" className="ob-skip" style={{ visibility: step < 3 ? 'visible' : 'hidden' }} onClick={() => finish(true)}>{_t("Salta")}</button>
      </div>

      <div className="ob-track" style={{ transform: `translateX(${-100 * step}%)` }}>
        {/* 1 · nome e icona */}
        <section className="ob-step" aria-hidden={step !== 0}>
          <h2>{_t("Ciao! Come ti chiami?")}</h2>
          <div className="ob-talk">
            <div className="ob-buddy"><Emoji e="📔" big /><span className="ob-spark a"><Emoji e="✨" big /></span><span className="ob-spark b"><Emoji e="✨" /></span></div>
            <div className="ob-bubble">{_t("Sono il tuo taccuino di avventura: qui la vita vera vale punti esperienza. Niente mostri da sconfiggere, solo le tue giornate, un passo alla volta.")}</div>
          </div>
          <input
            ref={nameRef}
            className="ob-name"
            type="text"
            value={name}
            maxLength={20}
            autoComplete="given-name"
            enterKeyHint="next"
            placeholder={_t("Il tuo nome o un soprannome")}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
          />
          <div className="ob-label">{_t("Scegli come apparire")}</div>
          <div className="ob-avatars">
            {AVATAR_CHOICES.map(e => (
              <button key={e} type="button" aria-pressed={avatar.type === 'emoji' && avatar.emoji === e} onClick={() => setAvatar({ type: 'emoji', emoji: e })}><Emoji e={e} big /></button>
            ))}
            <button type="button" className="ob-more" aria-pressed={custom} onClick={() => setSheet(true)} aria-label={_t("Altre icone")}>
              {custom ? <>{avatarNode(avatar)}<span className="ob-badge">+</span></> : <><span className="ob-plus">+</span><small>{_t("altre")}</small></>}
            </button>
          </div>
          <div className="ob-grow" />
          <button type="button" className="ob-cta" onClick={() => setStep(1)}>{_t("Continua")}</button>
        </section>

        {/* 2 · abilità */}
        <section className="ob-step" aria-hidden={step !== 1}>
          <h2>{_t("Le tue abilità")}</h2>
          <p className="ob-sub">{_t("Come in un gioco di ruolo, ma sono le tue. Scegline da {0} a {1}: guadagnano esperienza da quello che fai ogni giorno.", MIN_AREAS, MAX_AREAS)}</p>
          <Radar areaIds={areas} />
          <div className="ob-areas">
            {AREAS.map(a => (
              <button key={a.id} type="button" className="ob-area" style={{ '--c': a.color }} aria-pressed={areas.includes(a.id)} onClick={() => toggleArea(a.id)}>
                <Emoji e={a.emoji} big /><span>{_t(a.name)}</span><span className="ob-tick">✓</span>
              </button>
            ))}
          </div>
          <div className="ob-count">{areaCount}</div>
          <div className="ob-grow" />
          <button type="button" className="ob-cta" disabled={nArea < MIN_AREAS} onClick={() => setStep(2)}>{_t("Continua")}</button>
        </section>

        {/* 3 · prime abitudini */}
        <section className="ob-step" aria-hidden={step !== 2}>
          <h2>{_t("Le tue prime abitudini")}</h2>
          <p className="ob-sub">{_t("Inizia con poco: ne bastano 1–3. Se un giorno salti, nessun problema: si riparte il giorno dopo.")}</p>
          <div className="ob-habits">
            {habits.map(h => {
              const a = areaById(h.areaId); const on = picked.includes(h.key);
              return (
                <button key={h.key} type="button" className="ob-habit" aria-pressed={on} onClick={() => toggleHabit(h.key)}>
                  <span className="ob-habit-emoji"><Emoji e={h.emoji} big /></span>
                  <span className="ob-habit-text">
                    <b>{_t(h.name)}</b>
                    <span>{a ? `${a.emoji} ${_t(a.name)} · ` : ''}{'⭐'.repeat(h.stars)}</span>
                  </span>
                  <span className="ob-habit-plus">{on ? '✓' : '+'}</span>
                </button>
              );
            })}
          </div>
          <div className="ob-grow" />
          <button type="button" className="ob-cta" disabled={picked.length < 1} onClick={toMission}>
            {picked.length < 1 ? _t("Scegline almeno una") : picked.length === 1 ? _t("Aggiungi 1 abitudine") : _t("Aggiungi {0} abitudini", picked.length)}
          </button>
        </section>

        {/* 4 · prima missione */}
        <section className="ob-step" aria-hidden={step !== 3}>
          <h2>{_t("La tua prima missione")}</h2>
          <p className="ob-sub">{_t("Una cosa piccola, da fare adesso. Guarda cosa succede.")}</p>
          <div className={`ob-quest ${done ? 'done' : ''}`}>
            <button type="button" className="ob-chk" onClick={complete} aria-label={_t("Completa la missione")}>{done ? '✓' : ''}</button>
            <span className="ob-quest-emoji"><Emoji e="💧" big /></span>
            <div className="ob-quest-text">
              <b>{_t("Bevi un bicchiere d'acqua")}</b>
              <span>⭐ · {areas.length ? `${areaById(areas.includes('fit') ? 'fit' : areas[0]).emoji} ${_t(areaById(areas.includes('fit') ? 'fit' : areas[0]).name)}` : ''}</span>
            </div>
          </div>
          <div className="ob-hint" style={{ visibility: done ? 'hidden' : 'visible' }}><span className="ob-arrow">☝️</span> {_t("Tocca il cerchio")}</div>
          <div className={`ob-hero ${done ? 'show' : ''}`}>
            <div className="ob-hero-av">{avatarNode(avatar)}</div>
            <div className="ob-hero-who">
              <b>{playerDisplayName(name.trim() || player.name)}</b>
              <small>{_t("Livello {0}", level)} · {_t(titleForLevel(level))}</small>
              <div className="ob-hero-bar"><i style={{ width: done ? `${pct}%` : 0 }} /></div>
            </div>
          </div>
          <div className={`ob-summary ${done ? 'show' : ''}`}>
            {areas.map(id => { const a = areaById(id); return <span key={id} className="ob-chip">{a.emoji} {_t(a.name)}</span>; })}
            {habits.filter(h => picked.includes(h.key)).map(h => <span key={h.key} className="ob-chip">{h.emoji} {_t(h.name)}</span>)}
          </div>
          <div className={`ob-cheer ${done ? 'show' : ''}`}>{_t("Ogni passo conta, anche quelli piccoli.")}<br />{_t("Ci vediamo domani!")}</div>
          <div className="ob-grow" />
          <button type="button" className="ob-cta" disabled={!done} onClick={() => finish(false)}>{_t("Entra nell'avventura")}</button>
        </section>
      </div>

      <AvatarSheet open={sheet} onPick={(v) => setAvatar(v.type === 'image' ? { type: 'image', image: v.image } : { type: 'emoji', emoji: v.emoji })} onClose={() => setSheet(false)} />
    </div>
  );
}

// Radar delle abilità scelte (si disegna mentre si scelgono)
function Radar({ areaIds }) {
  const n = Math.max(areaIds.length, 3); const R = 54;
  const pt = (k, r) => { const a = -Math.PI / 2 + k * 2 * Math.PI / n; return [Math.cos(a) * r, Math.sin(a) * r]; };
  const ring = (f) => [...Array(n)].map((_, k) => pt(k, R * f).join(',')).join(' ');
  return (
    <div className="ob-radar">
      <svg viewBox="-80 -80 160 160" aria-hidden="true">
        {[1, 0.66, 0.33].map(f => <polygon key={f} points={ring(f)} fill="none" stroke="var(--track, rgba(128,128,160,.2))" strokeWidth="1.5" />)}
        {[...Array(n)].map((_, k) => <line key={k} x1="0" y1="0" x2={pt(k, R)[0]} y2={pt(k, R)[1]} stroke="var(--track, rgba(128,128,160,.2))" strokeWidth="1" />)}
        {areaIds.length >= 3 && (
          <polygon points={areaIds.map((_, k) => pt(k, R * 0.42).join(',')).join(' ')} fill="color-mix(in srgb, var(--accent-primary) 28%, transparent)" stroke="var(--accent-primary)" strokeWidth="2.2" strokeLinejoin="round" />
        )}
        {areaIds.map((id, k) => {
          const a = areaById(id); const [x, y] = pt(k, R + 16); const url = fluentUrl(a.emoji, true);
          return url ? <image key={id} href={url} x={x - 13} y={y - 13} width="26" height="26" /> : <text key={id} x={x} y={y + 6} textAnchor="middle" fontSize="18">{a.emoji}</text>;
        })}
        {!areaIds.length && <text x="0" y="5" textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--text-muted)">{_t("la tua scheda")}</text>}
      </svg>
    </div>
  );
}

// Schermata unica quando l'app è aperta nel browser del telefono: aggiungerla alla Home
function InstallScreen({ platform, onLater }) {
  const [prompt, setPrompt] = useState(() => (typeof window !== 'undefined' ? window.__qlInstallPrompt || null : null));
  const [installed, setInstalled] = useState(false);
  useEffect(() => {
    const onReady = () => setPrompt(window.__qlInstallPrompt || null);
    const onInstalled = () => setInstalled(true);
    window.addEventListener('ql-installable', onReady);
    window.addEventListener('appinstalled', onInstalled);
    return () => { window.removeEventListener('ql-installable', onReady); window.removeEventListener('appinstalled', onInstalled); };
  }, []);

  const share = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12M7 8l5-5 5 5" /><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" /></svg>;
  const addSq = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="5" /><path d="M12 8v8M8 12h8" /></svg>;
  const steps = platform === 'ios' ? [
    <>{_t("Tocca")} <span className="ob-key">•••</span> {_t("in basso, accanto all'indirizzo")}</>,
    <>{_t("Tocca")} <span className="ob-key">{share} {_t("Condividi")}</span></>,
    <>{_t("Scegli")} <b>{_t("Aggiungi alla schermata Home")}</b> <span className="ob-key">{addSq}</span></>,
    <>{_t("Lascia attivo")} <b>{_t("Apri come app web")}</b> {_t("e tocca")} <b>{_t("Aggiungi")}</b></>,
  ] : [
    prompt ? <>{_t("Tocca")} <b>{_t("Installa Quest Life")}</b> {_t("qui sotto")}</> : <>{_t("Apri il menu del browser")} <span className="ob-key">⋮</span></>,
    <>{_t("Scegli")} <b>{_t("Aggiungi a schermata Home")}</b> {_t("o")} <b>{_t("Installa app")}</b></>,
  ];

  return (
    <div className="ob-install">
      <img className="ob-logo" src={`${import.meta.env.BASE_URL}icon.png`} alt="Quest Life" />
      <h2>{installed ? _t("Fatto! Ora aprimi dalla Home") : _t("Prima di partire, portami nella Home")}</h2>
      <p className="ob-sub">{_t("Così mi apri con un tocco, a tutto schermo, come un'app vera.")}</p>
      {!installed && <ol className="ob-steps">{steps.map((s, i) => <li key={i}><span className="ob-n">{i + 1}</span><span>{s}</span></li>)}</ol>}
      <div className="ob-grow" />
      {platform === 'android' && prompt && !installed && (
        <button type="button" className="ob-cta" onClick={async () => {
          try { prompt.prompt(); const r = await prompt.userChoice; if (r && r.outcome === 'accepted') setInstalled(true); } catch (_) { /* niente */ }
          window.__qlInstallPrompt = null; setPrompt(null);
        }}>{_t("Installa Quest Life")}</button>
      )}
      <div className="ob-why">{_t("Poi aprimi dall'icona nella Home: ti aspetto lì per cominciare.")}</div>
      <button type="button" className="ob-later" onClick={onLater}>{_t("Continua nel browser")}</button>
    </div>
  );
}
