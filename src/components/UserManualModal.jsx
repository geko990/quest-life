import React, { useState, useEffect } from 'react';
import { CLOUDFLARE_WORKER_CODE } from '../utils/constants';

export default function UserManualModal({ isOpen, onClose, initialChapter = 'rpg' }) {
  const [activeChapter, setActiveChapter] = useState(initialChapter);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (initialChapter) {
      setActiveChapter(initialChapter);
    }
  }, [initialChapter, isOpen]);

  if (!isOpen) return null;

  const handleCopyWorkerCode = async () => {
    try {
      await navigator.clipboard.writeText(CLOUDFLARE_WORKER_CODE);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch (err) {
      const textArea = document.createElement("textarea");
      textArea.value = CLOUDFLARE_WORKER_CODE;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  const chapters = [
    { id: 'rpg', label: 'RPG & Meccaniche', icon: '⚔️' },
    { id: 'habits', label: 'Abitudini & Routine', icon: '🎯' },
    { id: 'quests', label: 'Missioni & Campagne', icon: '🗺️' },
    { id: 'nutrition', label: 'Nutrizione & Salute', icon: '🥗' },
    { id: 'data', label: 'Backup & PWA', icon: '💾' },
    { id: 'finances', label: 'Finanze & ETF', icon: '💰' }
  ];

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'rgba(0, 0, 0, 0.72)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '65px 14px 72px 14px',
        boxSizing: 'border-box'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(180deg, #161f30 0%, #0f172a 100%)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '660px',
          height: '100%',
          maxHeight: '100%',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.75), 0 0 30px rgba(56, 189, 248, 0.08)',
          overflow: 'hidden'
        }}
      >
        {/* Header del Manuale */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(10px)',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px', filter: 'drop-shadow(0 0 8px rgba(56, 189, 248, 0.6))' }}>📖</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '900', letterSpacing: '0.4px', color: '#f8fafc' }}>
                  Grimorio di Quest Life
                </h2>
                <span style={{ fontSize: '9px', fontWeight: '800', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', padding: '2px 7px', borderRadius: '10px', border: '1px solid rgba(56, 189, 248, 0.4)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                  Guida Ufficiale
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Barra di Navigazione Capitoli (Pillole runiche orizzontali scorrevoli) */}
        <div
          className="no-scrollbar"
          style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            padding: '10px 18px',
            background: 'rgba(15, 23, 42, 0.45)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            flexShrink: 0
          }}
        >
          {chapters.map((ch) => {
            const isSel = activeChapter === ch.id;
            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => setActiveChapter(ch.id)}
                style={{
                  background: isSel
                    ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)'
                    : 'rgba(30, 41, 59, 0.6)',
                  color: isSel ? '#ffffff' : '#94a3b8',
                  border: isSel
                    ? '1px solid #38bdf8'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: isSel
                    ? '0 0 16px rgba(56, 189, 248, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                    : 'none',
                  borderRadius: '12px',
                  padding: '7px 13px',
                  fontSize: '11px',
                  fontWeight: isSel ? '800' : '600',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: isSel ? 'scale(1.02)' : 'scale(1)'
                }}
              >
                <span style={{ fontSize: '14px', filter: isSel ? 'drop-shadow(0 0 4px rgba(255,255,255,0.6))' : 'none' }}>{ch.icon}</span>
                <span>{ch.label}</span>
              </button>
            );
          })}
        </div>

        {/* Area di Contenuto del Capitolo (Scrollabile a tutta altezza senza footer superfluo) */}
        <div
          className="no-scrollbar"
          style={{
            padding: '20px 22px 30px 22px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            color: '#e2e8f0',
            fontSize: '13px',
            lineHeight: '1.6',
            flex: 1
          }}
        >

          {/* ========================================================== */}
          {/* CAPITOLO 1: RPG & MECCANICHE DI GIOCO                     */}
          {/* ========================================================== */}
          {activeChapter === 'rpg' && (
            <>
              {/* Hero Banner Capitolo */}
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.15) 0%, rgba(30, 41, 59, 0.4) 100%)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  borderRadius: '16px',
                  padding: '16px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '24px' }}>⚔️</span>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#f8fafc' }}>
                    La Tua Vita è il Gioco di Ruolo Definitivo
                  </h3>
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', lineHeight: '1.45' }}>
                  "Non sei uno spettatore passivo della tua esistenza: ogni singola azione reale si converte in Esperienza tangibile per potenziare il tuo eroe."
                </div>
              </div>

              {/* I 6 Attributi Primari */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px' }}>🛡️</span>
                  <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: '#f1f5f9', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    I 6 Attributi Primari del Personaggio
                  </h4>
                </div>
                <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
                  Completando abitudini e missioni guadagni punti XP che sviluppano specifici tratti del tuo profilo:
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div style={{ background: 'rgba(30, 41, 59, 0.55)', padding: '10px 12px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <b style={{ color: '#ef4444' }}>💪 STR (Forza):</b> Allenamento con i pesi, calisthenics, resistenza fisica e docce fredde.
                  </div>
                  <div style={{ background: 'rgba(30, 41, 59, 0.55)', padding: '10px 12px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <b style={{ color: '#38bdf8' }}>⚡ DEX (Destrezza):</b> Zero procrastinazione, agilità, produttività chirurgica e velocità d'azione.
                  </div>
                  <div style={{ background: 'rgba(30, 41, 59, 0.55)', padding: '10px 12px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <b style={{ color: '#22c55e' }}>🛡️ CON (Costituzione):</b> Sonno ristoratore, idratazione corretta, postura e recupero fisiologico.
                  </div>
                  <div style={{ background: 'rgba(30, 41, 59, 0.55)', padding: '10px 12px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <b style={{ color: '#818cf8' }}>🧠 INT (Intelligenza):</b> Studio, lettura vorace di saggi, coding, corsi e apprendimento continuo.
                  </div>
                  <div style={{ background: 'rgba(30, 41, 59, 0.55)', padding: '10px 12px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <b style={{ color: '#f59e0b' }}>✨ WIS (Saggezza):</b> Meditazione quotidiana, mindfulness, riflessione serale e gestione dello stress.
                  </div>
                  <div style={{ background: 'rgba(30, 41, 59, 0.55)', padding: '10px 12px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <b style={{ color: '#ec4899' }}>👑 CHA (Carisma):</b> Relazioni autentiche, public speaking, gentilezza, networking ed empatia.
                  </div>
                </div>
              </div>

              {/* Livelli, Titoli e Moltiplicatore */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ background: 'rgba(30, 41, 59, 0.55)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <b style={{ color: '#38bdf8', fontSize: '13px' }}>📈 Livelli & Rango</b>
                  <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: '1.4' }}>
                    Accumulando XP sblocchi nuovi livelli e titoli onorifici (da <i>Novizio</i> fino a <i>Paladino</i> e <i>Leggenda</i>). La barra XP misura la tua evoluzione nel tempo.
                  </div>
                </div>
                <div style={{ background: 'rgba(30, 41, 59, 0.55)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <b style={{ color: '#f59e0b', fontSize: '13px' }}>🔥 Streak & Moltiplicatore</b>
                  <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: '1.4' }}>
                    La costanza è il tuo moltiplicatore: completare le abitudini ogni giorno aumenta gli XP guadagnati. Non interrompere la catena!
                  </div>
                </div>
              </div>

              {/* Pro Tip Box */}
              <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '12px', padding: '12px 14px', fontSize: '11.5px', lineHeight: '1.45', color: '#fde68a' }}>
                💡 <b>Consiglio dell'Eroe:</b> La costanza batte l'intensità. Tre piccole abitudini completate ogni singolo giorno per un mese generano un impatto dieci volte superiore rispetto a uno sforzo colossale isolato.
              </div>
            </>
          )}

          {/* ========================================================== */}
          {/* CAPITOLO 2: ABITUDINI & ROUTINE                          */}
          {/* ========================================================== */}
          {activeChapter === 'habits' && (
            <>
              {/* Hero Banner Capitolo */}
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(30, 41, 59, 0.4) 100%)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  borderRadius: '16px',
                  padding: '16px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '24px' }}>🎯</span>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#f8fafc' }}>
                    L'Arte della Costanza Automatica
                  </h3>
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', lineHeight: '1.45' }}>
                  "I veri campioni non dipendono dalla motivazione temporanea: creano sistemi e routine inattaccabili."
                </div>
              </div>

              {/* Come tracciare */}
              <div style={{ background: 'rgba(30, 41, 59, 0.55)', padding: '14px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <b style={{ color: '#4ade80', fontSize: '13px' }}>⚡ Gestione Semplice & Rapida</b>
                <ul style={{ margin: '4px 0 0 16px', padding: 0, fontSize: '12px', color: '#cbd5e1', lineHeight: '1.5' }}>
                  <li><b>Spunta al volo:</b> Tocca il cerchio a destra per completare l'azione e incassare immediatamente i tuoi XP.</li>
                  <li><b>Fasce Orarie:</b> Assegna a ogni abitudine un momento del giorno (<i>Mattina, Pomeriggio, Sera</i>) per dare un flusso armonico alla tua giornata.</li>
                  <li><b>Dettagli & Cronistoria:</b> Tocca l'abitudine per analizzare le tue serie passate e le percentuali di successo mensili.</li>
                </ul>
              </div>

              {/* Giornate Tipo */}
              <div style={{ background: 'rgba(30, 41, 59, 0.55)', padding: '14px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <b style={{ color: '#38bdf8', fontSize: '13px' }}>💼 Giornate Tipo (Il Tuo Copilota Quotidiano)</b>
                <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.45' }}>
                  In <b>Impostazioni &gt; Giornate Tipo</b> puoi configurare modelli completi (es. <i>"Giorno di Lavoro Focalizzato"</i> o <i>"Domenica di Ricarica"</i>). Ciascun modello contiene una sequenza oraria guidata che azzera la stanchezza decisionale: ti basta seguire la scaletta.
                </div>
              </div>

              {/* Pro Tip Box */}
              <div style={{ background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.25)', borderRadius: '12px', padding: '12px 14px', fontSize: '11.5px', lineHeight: '1.45', color: '#bbf7d0' }}>
                💡 <b>Consiglio dell'Eroe:</b> Associa sempre una nuova abitudine a un'azione che fai già in automatico (es. <i>"Subito dopo il caffè del mattino, berrò un bicchiere d'acqua ed eseguirò 2 minuti di stretching"</i>). È il principio del concatenamento delle abitudini atomiche.
              </div>
            </>
          )}

          {/* ========================================================== */}
          {/* CAPITOLO 3: MISSIONI & CAMPAGNE                          */}
          {/* ========================================================== */}
          {activeChapter === 'quests' && (
            <>
              {/* Hero Banner Capitolo */}
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(30, 41, 59, 0.4) 100%)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: '16px',
                  padding: '16px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '24px' }}>🗺️</span>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#f8fafc' }}>
                    Dalle Azioni ai Grandi Traguardi
                  </h3>
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', lineHeight: '1.45' }}>
                  "Le abitudini mantengono solida la tua fortezza; le missioni ti spingono a esplorare e conquistare territori sconosciuti."
                </div>
              </div>

              {/* Differenza fondamentale chiarita */}
              <div style={{ background: 'rgba(30, 41, 59, 0.55)', padding: '14px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <b style={{ color: '#fbbf24', fontSize: '13px' }}>⚖️ Abitudini vs Missioni: La Differenza Chiave</b>
                <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.5' }}>
                  Un dubbio comune: cosa inserire come abitudine e cosa come missione?
                  <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                    <li><b>Abitudini (Habits):</b> Riti ciclici infiniti che ripeti ogni giorno (es. bere 2L d'acqua, camminare 8.000 passi, meditare 10 min).</li>
                    <li><b>Missioni (Quests):</b> Obiettivi specifici con un inizio e una conclusione definita (es. <i>"Rinnovare il passaporto"</i>, <i>"Riparare la bici"</i>, <i>"Consegnare il report"</i>).</li>
                  </ul>
                </div>
              </div>

              {/* Campagne Epiche */}
              <div style={{ background: 'rgba(30, 41, 59, 0.55)', padding: '14px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <b style={{ color: '#38bdf8', fontSize: '13px' }}>🏔️ Campagne a Tappe (Sfide di Lungo Periodo)</b>
                <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.45' }}>
                  Le <b>Campagne</b> scompongono una sfida imponente (es. 30 o più giorni) in tappe giornaliere sequenziali:
                  <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                    <li><b>Campagna Docce Fredde (30 gg):</b> Allena forza di volontà e resistenza mentale.</li>
                    <li><b>Campagna Digital Detox (7 gg):</b> Ripristina la concentrazione e riduce la dipendenza da smartphone.</li>
                    <li><b>Campagne Personalizzate:</b> Crea la tua avventura per qualsiasi tuo grande progetto di vita!</li>
                  </ul>
                </div>
              </div>

              {/* Pro Tip Box */}
              <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '12px', padding: '12px 14px', fontSize: '11.5px', lineHeight: '1.45', color: '#fde68a' }}>
                💡 <b>Consiglio dell'Eroe:</b> Suddividi i grandi progetti in sotto-missioni da massimo 25-30 minuti. Il cervello adora spuntare vittorie frequenti: l'inerzia positiva generata ti renderà inarrestabile.
              </div>
            </>
          )}

          {/* ========================================================== */}
          {/* CAPITOLO 4: NUTRIZIONE & SALUTE                           */}
          {/* ========================================================== */}
          {activeChapter === 'nutrition' && (
            <>
              {/* Hero Banner Capitolo */}
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(30, 41, 59, 0.4) 100%)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '16px',
                  padding: '16px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '24px' }}>🥗</span>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#f8fafc' }}>
                    Il Carburante del Tuo Avatar
                  </h3>
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', lineHeight: '1.45' }}>
                  "Il tuo corpo fisico è l'armatura con cui affronti il mondo reale: un guerriero d'élite non può combattere con carburante scadente."
                </div>
              </div>

              {/* I 3 Macronutrienti */}
              <div style={{ background: 'rgba(30, 41, 59, 0.55)', padding: '14px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <b style={{ color: '#f87171', fontSize: '13px' }}>🥩 I 3 Macro: I Mattoni della Tua Energia</b>
                <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
                  Imposta il tuo fabbisogno calorico giornaliero (TDEE) nella scheda Nutrizione e monitora i tuoi obiettivi:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px' }}>
                  <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '8px 12px', borderRadius: '10px', fontSize: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    <b style={{ color: '#ef4444' }}>🔴 Proteine (4 kcal/g):</b> Fondamentali per rigenerare la massa muscolare, accelerare il metabolismo e garantire sazietà prolungata.
                  </div>
                  <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '8px 12px', borderRadius: '10px', fontSize: '12px', border: '1px solid rgba(234, 179, 8, 0.2)' }}>
                    <b style={{ color: '#eab308' }}>🟡 Carboidrati (4 kcal/g):</b> Il carburante primario per la concentrazione cerebrale e la potenza durante gli allenamenti.
                  </div>
                  <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '8px 12px', borderRadius: '10px', fontSize: '12px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                    <b style={{ color: '#38bdf8' }}>🔵 Grassi Buoni (9 kcal/g):</b> Il pilastro indispensabile per l'equilibrio ormonale, il cervello e la salute cellulare.
                  </div>
                </div>
              </div>

              {/* Scanner OCR & Trend del Peso */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ background: 'rgba(30, 41, 59, 0.55)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <b style={{ color: '#38bdf8', fontSize: '13px' }}>📷 Scanner OCR Etichette</b>
                  <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: '1.4' }}>
                    Zero perdite di tempo a digitare: tocca il tasto fotocamera, inquadra la tabella nutrizionale e l'OCR compila calorie e macro in 2 secondi.
                  </div>
                </div>
                <div style={{ background: 'rgba(30, 41, 59, 0.55)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <b style={{ color: '#4ade80', fontSize: '13px' }}>⚖️ Media Mobile a 7 Giorni</b>
                  <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: '1.4' }}>
                    Non farti ingannare dalle oscillazioni quotidiane di liquidi e sale. L'app calcola la media a 7 giorni per rivelare il tuo trend reale.
                  </div>
                </div>
              </div>

              {/* Pro Tip Box */}
              <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '12px', padding: '12px 14px', fontSize: '11.5px', lineHeight: '1.45', color: '#fca5a5' }}>
                💡 <b>Consiglio dell'Eroe:</b> Pesati sempre al mattino a digiuno, dopo essere andato in bagno. La costanza della misurazione batte l'ansia del singolo giorno: guarda solo la linea della media settimanale.
              </div>
            </>
          )}

          {/* ========================================================== */}
          {/* CAPITOLO 5: DATI, BACKUP & PWA OFFLINE                    */}
          {/* ========================================================== */}
          {activeChapter === 'data' && (
            <>
              {/* Hero Banner Capitolo */}
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(30, 41, 59, 0.4) 100%)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '16px',
                  padding: '16px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '24px' }}>💾</span>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#f8fafc' }}>
                    Il Tuo Santuario Digitale Privato
                  </h3>
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', lineHeight: '1.45' }}>
                  "I tuoi progressi, i tuoi pensieri e i tuoi dati patrimoniali appartengono esclusivamente a te. Zero tracker, zero server terzi."
                </div>
              </div>

              {/* Privacy & Backup */}
              <div style={{ background: 'rgba(30, 41, 59, 0.55)', padding: '14px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <b style={{ color: '#a78bfa', fontSize: '13px' }}>🔒 Sovranità Assoluta dei Tuoi Dati</b>
                <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.5' }}>
                  Quest Life è concepita con filosofia <b>Local-First</b>:
                  <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                    <li><b>100% Offline:</b> L'applicazione risiede nella memoria del tuo browser (IndexedDB) e funziona ovunque, anche in modalità aereo.</li>
                    <li><b>Esportazione JSON in 1 Secondo:</b> In <b>Impostazioni &gt; Dati</b> puoi scaricare con un tocco il file completo di backup per archiviarlo su drive, inviartelo via mail o importarlo su un altro dispositivo.</li>
                    <li><b>Collegamento Database Locale (PC/Mac):</b> Tramite File System Access API puoi salvare un file direttamente nella cartella del computer: ogni modifica si salverà in tempo reale su disco.</li>
                  </ul>
                </div>
              </div>

              {/* Installazione PWA */}
              <div style={{ background: 'rgba(30, 41, 59, 0.55)', padding: '14px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <b style={{ color: '#38bdf8', fontSize: '13px' }}>📱 Installazione come App Nativa (PWA)</b>
                <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.45' }}>
                  Puoi installare Quest Life senza passare dagli store:
                  <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                    <li><b>Su iPhone / iPad (Safari):</b> Tocca il pulsante Condividi (quadrato con freccia in alto) &gt; seleziona <b>"Aggiungi alla schermata Home"</b>.</li>
                    <li><b>Su Android (Chrome):</b> Tocca i tre puntini in alto a destra &gt; seleziona <b>"Installa applicazione"</b> (o "Aggiungi a schermata Home").</li>
                  </ul>
                </div>
              </div>

              {/* Pro Tip Box */}
              <div style={{ background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.25)', borderRadius: '12px', padding: '12px 14px', fontSize: '11.5px', lineHeight: '1.45', color: '#ddd6fe' }}>
                💡 <b>Consiglio dell'Eroe:</b> Prendi la sana abitudine di esportare un file di backup ogni domenica sera durante il tuo review settimanale. Pochi secondi per custodire anni di crescita personale.
              </div>
            </>
          )}

          {/* ========================================================== */}
          {/* CAPITOLO 6: FINANZE & ETF (CON GUIDA CLOUDFLARE E SEGRETO)  */}
          {/* ========================================================== */}
          {activeChapter === 'finances' && (
            <>
              {/* Hero Banner Capitolo */}
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(30, 41, 59, 0.4) 100%)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: '16px',
                  padding: '16px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '24px' }}>💰</span>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#f8fafc' }}>
                    Costruisci la Tua Fortezza Economica
                  </h3>
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', lineHeight: '1.45' }}>
                  "Nessun avventuriero è davvero libero se è schiavo del disordine economico. La disciplina finanziaria è la tua armatura più solida."
                </div>
              </div>

              {/* Box Finestra Segreta / Doppio Tocco */}
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.14), rgba(30, 41, 59, 0.6))',
                  border: '1.5px solid #f59e0b',
                  borderRadius: '14px',
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '20px' }}>🗝️</span>
                  <b style={{ fontSize: '13px', color: '#fbbf24' }}>
                    Come Accedere: La Finestra Nascosta del Tesoro
                  </b>
                </div>
                <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.5' }}>
                  Perché la scheda Finanze non è visibile tra le normali linguette in basso? Perché quando usi l'app in pubblico, sui mezzi o in ufficio, nessuno deve sbirciare il tuo saldo o i tuoi investimenti.
                  <br />
                  <ul style={{ margin: '8px 0 2px 16px', padding: 0 }}>
                    <li>👉 <b>Doppio tocco rapido su "Opzioni" (⚙️):</b> Nella barra di navigazione in basso a destra, fai due tocchi rapidi su Opzioni: si aprirà istantaneamente la schermata segreta <b>Tesoro & Finanze (💰)</b>.</li>
                    <li>👉 <b>Un tocco singolo:</b> Ti riporta immediatamente alle Opzioni normali.</li>
                  </ul>
                </div>
              </div>

              {/* Sezione Cloudflare Workers in Evidenza */}
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.12), rgba(30, 41, 59, 0.6))',
                  border: '1.5px solid #38bdf8',
                  borderRadius: '14px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '20px' }}>⚡</span>
                    <b style={{ fontSize: '13px', color: '#38bdf8' }}>
                      Guida Cloudflare Workers per Aggiornamento ETF
                    </b>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyWorkerCode}
                    style={{
                      background: copiedCode ? '#22c55e' : '#0284c7',
                      color: '#ffffff',
                      border: 'none',
                      padding: '7px 14px',
                      borderRadius: '10px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                    }}
                  >
                    <span>{copiedCode ? '✓' : '📋'}</span>
                    <span>{copiedCode ? 'Codice Copiato!' : 'Copia Codice Worker'}</span>
                  </button>
                </div>

                <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
                  <b>Perché serve?</b> I browser mobili impediscono per sicurezza di contattare direttamente Yahoo Finance (blocco CORS). Con un tuo Worker personale gratuito su Cloudflare (100.000 richieste al giorno gratis!), ottieni quotazioni aggiornate al millesimo in totale autonomia.
                </div>

                {/* Passaggi passo passo */}
                <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                  <b style={{ color: '#f8fafc' }}>📝 I 4 Passaggi Semplici su Cloudflare:</b>
                  <div>
                    <b>1. Crea il Worker:</b> Vai su <a href="https://dash.cloudflare.com" target="_blank" rel="noreferrer" style={{ color: '#38bdf8', textDecoration: 'underline' }}>dash.cloudflare.com</a> &gt; <i>Workers & Pages</i> &gt; <i>Create Application</i> &gt; scegli <b>Hello World</b> &gt; clicca <b>Deploy</b>.
                  </div>
                  <div>
                    <b>2. Modifica il codice:</b> Clicca sul pulsante <b>"Edit code"</b> in alto a destra.
                  </div>
                  <div>
                    <b>3. Incolla il codice:</b> Nel file <code>worker.js</code> a sinistra, cancella tutto e premi il tasto sopra <b>"Copia Codice Worker"</b>, quindi incollalo nell'editor. Clicca <b>Deploy</b>.
                  </div>
                  <div>
                    <b>4. Collega a Quest Life:</b> Copia l'indirizzo del tuo Worker (es. <code>https://nome-worker.tuonome.workers.dev</code>), entra nel Tesoro di Quest Life, tocca il fulmine <b>⚡</b> accanto ad <i>Aggiorna Prezzi</i> e incollalo nel campo <b>Proxy Personale</b>. Fatto!
                  </div>
                </div>

                {/* Blocco Codice */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold' }}>Codice Completo per worker.js:</span>
                    <button
                      type="button"
                      onClick={handleCopyWorkerCode}
                      style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '10px', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                    >
                      {copiedCode ? 'Copiato!' : 'Copia codice'}
                    </button>
                  </div>
                  <pre
                    style={{
                      background: '#090d16',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      padding: '10px',
                      fontSize: '11px',
                      color: '#a5f3fc',
                      overflowX: 'auto',
                      maxHeight: '160px',
                      margin: 0,
                      fontFamily: 'monospace'
                    }}
                  >
                    {CLOUDFLARE_WORKER_CODE}
                  </pre>
                </div>

                {/* Guida Ticker ETF */}
                <div style={{ background: 'rgba(234, 179, 8, 0.08)', border: '1px solid rgba(234, 179, 8, 0.2)', borderRadius: '10px', padding: '10px', fontSize: '11px', lineHeight: '1.45' }}>
                  <b style={{ color: '#fbbf24' }}>💡 Suffissi Borse per Yahoo Finance:</b>
                  <div style={{ marginTop: '4px', color: '#cbd5e1' }}>
                    Yahoo richiede il suffisso della borsa su cui è quotato lo strumento:
                    <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                      <li><b>Borsa Italiana (Milano):</b> aggiungi <code>.MI</code> (es. <code>SWDA.MI</code>, <code>CSSPX.MI</code>, <code>LCWD.MI</code>, <code>SMEA.MI</code>)</li>
                      <li><b>Xetra (Germania):</b> aggiungi <code>.DE</code> (es. <code>VWCE.DE</code>, <code>EUNL.DE</code>, <code>IS3N.DE</code>)</li>
                      <li><b>Azioni USA:</b> senza suffisso (es. <code>AAPL</code>, <code>MSFT</code>, <code>NVDA</code>)</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Conti e Budget */}
              <div style={{ background: 'rgba(30, 41, 59, 0.55)', padding: '14px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <b style={{ color: '#f59e0b', fontSize: '13px' }}>🏛️ I 4 Pilastri del Patrimonio</b>
                <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
                  <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                    <li><b>💳 Conto Base:</b> Il conto per la vita di tutti i giorni.</li>
                    <li><b>💵 Contanti:</b> La liquidità fisica nel portafoglio.</li>
                    <li><b>🏦 Conti Secondari & Deposito:</b> Conti vincolati o svincolati con tasso di interesse annuo calcolato in tempo reale!</li>
                    <li><b>📈 Investimenti & PAC:</b> Valore totale calcolato dal prezzo delle quote moltiplicato per i titoli posseduti.</li>
                  </ul>
                </div>
              </div>

              {/* Pro Tip Box */}
              <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '12px', padding: '12px 14px', fontSize: '11.5px', lineHeight: '1.45', color: '#fde68a' }}>
                💡 <b>Consiglio dell'Eroe:</b> Il segreto della ricchezza non è prevedere il mercato, ma la costanza dell'accumulo. Tratta i tuoi investimenti come una missione a lungo termine: lascia che il tempo e l'interesse composto combattano al tuo fianco.
              </div>
            </>
          )}

        </div>

      </div>
    </div>
  );
}
