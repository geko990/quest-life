import React, { useState, useEffect } from 'react';
import { CLOUDFLARE_WORKER_CODE } from '../utils/constants';

import { _t } from '../i18n';
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
    { id: 'rpg', label: _t("RPG & Meccaniche"), icon: '⚔️' },
    { id: 'habits', label: _t("Abitudini & Routine"), icon: '🎯' },
    { id: 'quests', label: _t("Missioni & Campagne"), icon: '🗺️' },
    { id: 'nutrition', label: _t("Nutrizione & Salute"), icon: '🥗' },
    { id: 'data', label: _t("Backup & PWA"), icon: '💾' },
    { id: 'finances', label: _t("Finanze & ETF"), icon: '💰' }
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
                  {_t("Grimorio di Quest Life")}</h2>
                <span style={{ fontSize: '9px', fontWeight: '800', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', padding: '2px 7px', borderRadius: '10px', border: '1px solid rgba(56, 189, 248, 0.4)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                  {_t("Guida Ufficiale")}</span>
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
                <span>{_t(ch.label)}</span>
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
                    {_t("La Tua Vita è il Gioco di Ruolo Definitivo")}</h3>
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', lineHeight: '1.45' }}>
                  {_t("\"Non sei uno spettatore passivo della tua esistenza: ogni singola azione reale si converte in Esperienza tangibile per potenziare il tuo eroe.\"")}</div>
              </div>

              {/* I 6 Attributi Primari */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px' }}>🛡️</span>
                  <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: '#f1f5f9', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {_t("I 6 Attributi Primari del Personaggio")}</h4>
                </div>
                <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
                  {_t("Completando abitudini e missioni guadagni punti XP che sviluppano specifici tratti del tuo profilo:")}</div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div style={{ background: 'rgba(30, 41, 59, 0.55)', padding: '10px 12px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <b style={{ color: '#ef4444' }}>{_t("💪 STR (Forza):")}</b> {" "}{_t("Allenamento con i pesi, calisthenics, resistenza fisica e docce fredde.")}</div>
                  <div style={{ background: 'rgba(30, 41, 59, 0.55)', padding: '10px 12px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <b style={{ color: '#38bdf8' }}>{_t("⚡ DEX (Destrezza):")}</b> {" "}{_t("Zero procrastinazione, agilità, produttività chirurgica e velocità d'azione.")}</div>
                  <div style={{ background: 'rgba(30, 41, 59, 0.55)', padding: '10px 12px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <b style={{ color: '#22c55e' }}>{_t("🛡️ CON (Costituzione):")}</b> {" "}{_t("Sonno ristoratore, idratazione corretta, postura e recupero fisiologico.")}</div>
                  <div style={{ background: 'rgba(30, 41, 59, 0.55)', padding: '10px 12px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <b style={{ color: '#818cf8' }}>{_t("🧠 INT (Intelligenza):")}</b> {" "}{_t("Studio, lettura vorace di saggi, coding, corsi e apprendimento continuo.")}</div>
                  <div style={{ background: 'rgba(30, 41, 59, 0.55)', padding: '10px 12px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <b style={{ color: '#f59e0b' }}>{_t("✨ WIS (Saggezza):")}</b> {" "}{_t("Meditazione quotidiana, mindfulness, riflessione serale e gestione dello stress.")}</div>
                  <div style={{ background: 'rgba(30, 41, 59, 0.55)', padding: '10px 12px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <b style={{ color: '#ec4899' }}>{_t("👑 CHA (Carisma):")}</b> {" "}{_t("Relazioni autentiche, public speaking, gentilezza, networking ed empatia.")}</div>
                </div>
              </div>

              {/* Livelli, Titoli e Moltiplicatore */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ background: 'rgba(30, 41, 59, 0.55)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <b style={{ color: '#38bdf8', fontSize: '13px' }}>{_t("📈 Livelli & Rango")}</b>
                  <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: '1.4' }}>
                    {_t("Accumulando XP sblocchi nuovi livelli e titoli onorifici (da")}{" "}<i>{_t("Novizio")}</i> {" "}{_t("fino a")}{" "}<i>{_t("Paladino")}</i> e <i>{_t("Leggenda")}</i>{_t("). La barra XP misura la tua evoluzione nel tempo.")}</div>
                </div>
                <div style={{ background: 'rgba(30, 41, 59, 0.55)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <b style={{ color: '#f59e0b', fontSize: '13px' }}>{_t("🔥 Streak & Moltiplicatore")}</b>
                  <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: '1.4' }}>
                    {_t("La costanza è il tuo moltiplicatore: completare le abitudini ogni giorno aumenta gli XP guadagnati. Non interrompere la catena!")}</div>
                </div>
              </div>

              {/* Pro Tip Box */}
              <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '12px', padding: '12px 14px', fontSize: '11.5px', lineHeight: '1.45', color: '#fde68a' }}>
                💡 <b>{_t("Consiglio dell'Eroe:")}</b> {" "}{_t("La costanza batte l'intensità. Tre piccole abitudini completate ogni singolo giorno per un mese generano un impatto dieci volte superiore rispetto a uno sforzo colossale isolato.")}</div>
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
                    {_t("L'Arte della Costanza Automatica")}</h3>
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', lineHeight: '1.45' }}>
                  {_t("\"I veri campioni non dipendono dalla motivazione temporanea: creano sistemi e routine inattaccabili.\"")}</div>
              </div>

              {/* Come tracciare */}
              <div style={{ background: 'rgba(30, 41, 59, 0.55)', padding: '14px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <b style={{ color: '#4ade80', fontSize: '13px' }}>{_t("⚡ Gestione Semplice & Rapida")}</b>
                <ul style={{ margin: '4px 0 0 16px', padding: 0, fontSize: '12px', color: '#cbd5e1', lineHeight: '1.5' }}>
                  <li><b>{_t("Spunta al volo:")}</b> {" "}{_t("Tocca il cerchio a destra per completare l'azione e incassare immediatamente i tuoi XP.")}</li>
                  <li><b>{_t("Fasce Orarie:")}</b> {" "}{_t("Assegna a ogni abitudine un momento del giorno (")}<i>{_t("Mattina, Pomeriggio, Sera")}</i>{_t(") per dare un flusso armonico alla tua giornata.")}</li>
                  <li><b>{_t("Dettagli & Cronistoria:")}</b> {" "}{_t("Tocca l'abitudine per analizzare le tue serie passate e le percentuali di successo mensili.")}</li>
                </ul>
              </div>

              {/* Giornate Tipo */}
              <div style={{ background: 'rgba(30, 41, 59, 0.55)', padding: '14px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <b style={{ color: '#38bdf8', fontSize: '13px' }}>{_t("💼 Giornate Tipo (Il Tuo Copilota Quotidiano)")}</b>
                <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.45' }}>
                  {_t("In")}{" "}<b>Impostazioni &gt; Giornate Tipo</b> {" "}{_t("puoi configurare modelli completi (es.")}{" "}<i>{_t("\"Giorno di Lavoro Focalizzato\"")}</i> o <i>{_t("\"Domenica di Ricarica\"")}</i>{_t("). Ciascun modello contiene una sequenza oraria guidata che azzera la stanchezza decisionale: ti basta seguire la scaletta.")}</div>
              </div>

              {/* Pro Tip Box */}
              <div style={{ background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.25)', borderRadius: '12px', padding: '12px 14px', fontSize: '11.5px', lineHeight: '1.45', color: '#bbf7d0' }}>
                💡 <b>{_t("Consiglio dell'Eroe:")}</b> {" "}{_t("Associa sempre una nuova abitudine a un'azione che fai già in automatico (es.")}{" "}<i>{_t("\"Subito dopo il caffè del mattino, berrò un bicchiere d'acqua ed eseguirò 2 minuti di stretching\"")}</i>{_t("). È il principio del concatenamento delle abitudini atomiche.")}</div>
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
                    {_t("Dalle Azioni ai Grandi Traguardi")}</h3>
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', lineHeight: '1.45' }}>
                  {_t("\"Le abitudini mantengono solida la tua fortezza; le missioni ti spingono a esplorare e conquistare territori sconosciuti.\"")}</div>
              </div>

              {/* Differenza fondamentale chiarita */}
              <div style={{ background: 'rgba(30, 41, 59, 0.55)', padding: '14px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <b style={{ color: '#fbbf24', fontSize: '13px' }}>{_t("⚖️ Abitudini vs Missioni: La Differenza Chiave")}</b>
                <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.5' }}>
                  {_t("Un dubbio comune: cosa inserire come abitudine e cosa come missione?")}<ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                    <li><b>{_t("Abitudini (Habits):")}</b> {" "}{_t("Riti ciclici infiniti che ripeti ogni giorno (es. bere 2L d'acqua, camminare 8.000 passi, meditare 10 min).")}</li>
                    <li><b>{_t("Missioni (Quests):")}</b> {" "}{_t("Obiettivi specifici con un inizio e una conclusione definita (es.")}{" "}<i>{_t("\"Rinnovare il passaporto\"")}</i>, <i>{_t("\"Riparare la bici\"")}</i>, <i>{_t("\"Consegnare il report\"")}</i>).</li>
                  </ul>
                </div>
              </div>

              {/* Campagne Epiche */}
              <div style={{ background: 'rgba(30, 41, 59, 0.55)', padding: '14px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <b style={{ color: '#38bdf8', fontSize: '13px' }}>{_t("🏔️ Campagne a Tappe (Sfide di Lungo Periodo)")}</b>
                <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.45' }}>
                  {_t("Le")}{" "}<b>{_t("Campagne")}</b> {" "}{_t("scompongono una sfida imponente (es. 30 o più giorni) in tappe giornaliere sequenziali:")}<ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                    <li><b>{_t("Campagna Docce Fredde (30 gg):")}</b> {" "}{_t("Allena forza di volontà e resistenza mentale.")}</li>
                    <li><b>{_t("Campagna Digital Detox (7 gg):")}</b> {" "}{_t("Ripristina la concentrazione e riduce la dipendenza da smartphone.")}</li>
                    <li><b>{_t("Campagne Personalizzate:")}</b> {" "}{_t("Crea la tua avventura per qualsiasi tuo grande progetto di vita!")}</li>
                  </ul>
                </div>
              </div>

              {/* Pro Tip Box */}
              <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '12px', padding: '12px 14px', fontSize: '11.5px', lineHeight: '1.45', color: '#fde68a' }}>
                💡 <b>{_t("Consiglio dell'Eroe:")}</b> {" "}{_t("Suddividi i grandi progetti in sotto-missioni da massimo 25-30 minuti. Il cervello adora spuntare vittorie frequenti: l'inerzia positiva generata ti renderà inarrestabile.")}</div>
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
                    {_t("Il Carburante del Tuo Avatar")}</h3>
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', lineHeight: '1.45' }}>
                  {_t("\"Il tuo corpo fisico è l'armatura con cui affronti il mondo reale: un guerriero d'élite non può combattere con carburante scadente.\"")}</div>
              </div>

              {/* I 3 Macronutrienti */}
              <div style={{ background: 'rgba(30, 41, 59, 0.55)', padding: '14px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <b style={{ color: '#f87171', fontSize: '13px' }}>{_t("🥩 I 3 Macro: I Mattoni della Tua Energia")}</b>
                <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
                  {_t("Imposta il tuo fabbisogno calorico giornaliero (TDEE) nella scheda Nutrizione e monitora i tuoi obiettivi:")}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px' }}>
                  <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '8px 12px', borderRadius: '10px', fontSize: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    <b style={{ color: '#ef4444' }}>{_t("🔴 Proteine (4 kcal/g):")}</b> {" "}{_t("Fondamentali per rigenerare la massa muscolare, accelerare il metabolismo e garantire sazietà prolungata.")}</div>
                  <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '8px 12px', borderRadius: '10px', fontSize: '12px', border: '1px solid rgba(234, 179, 8, 0.2)' }}>
                    <b style={{ color: '#eab308' }}>{_t("🟡 Carboidrati (4 kcal/g):")}</b> {" "}{_t("Il carburante primario per la concentrazione cerebrale e la potenza durante gli allenamenti.")}</div>
                  <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '8px 12px', borderRadius: '10px', fontSize: '12px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                    <b style={{ color: '#38bdf8' }}>{_t("🔵 Grassi Buoni (9 kcal/g):")}</b> {" "}{_t("Il pilastro indispensabile per l'equilibrio ormonale, il cervello e la salute cellulare.")}</div>
                </div>
              </div>

              {/* Pasti Rapidi & Ricerca Online */}
              <div style={{ background: 'rgba(30, 41, 59, 0.55)', padding: '14px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <b style={{ color: '#38bdf8', fontSize: '13px' }}>{_t("🍽️ Inserimento Rapido & Ricerca Online")}</b>
                <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.45' }}>
                  {_t("Tocca direttamente il")}{" "}<b>{_t("grande cerchio delle Calorie Rimaste")}</b>{_t(": puoi inserire al volo un piatto manuale oppure")}{" "}<b>{_t("cercare qualsiasi alimento online")}</b> {" "}{_t("su Open Food Facts per estrarre istantaneamente calorie e proteine e salvarlo nel tuo database personale con un solo tocco!")}</div>
              </div>

              {/* Scanner OCR & Trend del Peso */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ background: 'rgba(30, 41, 59, 0.55)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <b style={{ color: '#a78bfa', fontSize: '13px' }}>{_t("📷 Scanner OCR Etichette")}</b>
                  <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: '1.4' }}>
                    {_t("Zero perdite di tempo: inquadra la tabella nutrizionale sulla confezione e l'OCR legge e compila calorie e macro in 2 secondi.")}</div>
                </div>
                <div style={{ background: 'rgba(30, 41, 59, 0.55)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <b style={{ color: '#4ade80', fontSize: '13px' }}>{_t("⚖️ Media Mobile a 7 Giorni")}</b>
                  <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: '1.4' }}>
                    {_t("Non farti ingannare dalle oscillazioni quotidiane di liquidi e sale. L'app calcola la media a 7 giorni per rivelare il tuo trend reale.")}</div>
                </div>
              </div>

              {/* Pro Tip Box */}
              <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '12px', padding: '12px 14px', fontSize: '11.5px', lineHeight: '1.45', color: '#fca5a5' }}>
                💡 <b>{_t("Consiglio dell'Eroe:")}</b> {" "}{_t("Pesati sempre al mattino a digiuno, dopo essere andato in bagno. La costanza della misurazione batte l'ansia del singolo giorno: guarda solo la linea della media settimanale.")}</div>
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
                    {_t("Il Tuo Santuario Digitale Privato")}</h3>
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', lineHeight: '1.45' }}>
                  {_t("\"I tuoi progressi, i tuoi pensieri e i tuoi dati patrimoniali appartengono esclusivamente a te. Zero tracker, zero server terzi.\"")}</div>
              </div>

              {/* Privacy & Backup */}
              <div style={{ background: 'rgba(30, 41, 59, 0.55)', padding: '14px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <b style={{ color: '#a78bfa', fontSize: '13px' }}>{_t("🔒 Sovranità Assoluta dei Tuoi Dati")}</b>
                <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.5' }}>
                  {_t("Quest Life è concepita con filosofia")}{" "}<b>{_t("Local-First")}</b>:
                  <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                    <li><b>{_t("100% Offline:")}</b> {" "}{_t("L'applicazione risiede nella memoria del tuo browser (IndexedDB) e funziona ovunque, anche in modalità aereo.")}</li>
                    <li><b>{_t("Esportazione JSON in 1 Secondo:")}</b> {" "}{_t("In")}{" "}<b>Impostazioni &gt; Dati</b> {" "}{_t("puoi scaricare con un tocco il file completo di backup per archiviarlo su drive, inviartelo via mail o importarlo su un altro dispositivo.")}</li>
                    <li><b>{_t("Collegamento Database Locale (PC/Mac):")}</b> {" "}{_t("Tramite File System Access API puoi salvare un file direttamente nella cartella del computer: ogni modifica si salverà in tempo reale su disco.")}</li>
                  </ul>
                </div>
              </div>

              {/* Installazione PWA */}
              <div style={{ background: 'rgba(30, 41, 59, 0.55)', padding: '14px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <b style={{ color: '#38bdf8', fontSize: '13px' }}>{_t("📱 Installazione come App Nativa (PWA)")}</b>
                <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.45' }}>
                  {_t("Puoi installare Quest Life senza passare dagli store:")}<ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                    <li><b>{_t("Su iPhone / iPad (Safari):")}</b> Tocca il pulsante Condividi (quadrato con freccia in alto) &gt; seleziona <b>{_t("\"Aggiungi alla schermata Home\"")}</b>.</li>
                    <li><b>{_t("Su Android (Chrome):")}</b> Tocca i tre puntini in alto a destra &gt; seleziona <b>{_t("\"Installa applicazione\"")}</b> {" "}{_t("(o \"Aggiungi a schermata Home\").")}</li>
                  </ul>
                </div>
              </div>

              {/* Pro Tip Box */}
              <div style={{ background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.25)', borderRadius: '12px', padding: '12px 14px', fontSize: '11.5px', lineHeight: '1.45', color: '#ddd6fe' }}>
                💡 <b>{_t("Consiglio dell'Eroe:")}</b> {" "}{_t("Prendi la sana abitudine di esportare un file di backup ogni domenica sera durante il tuo review settimanale. Pochi secondi per custodire anni di crescita personale.")}</div>
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
                    {_t("Costruisci la Tua Fortezza Economica")}</h3>
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', lineHeight: '1.45' }}>
                  {_t("\"Nessun avventuriero è davvero libero se è schiavo del disordine economico. La disciplina finanziaria è la tua armatura più solida.\"")}</div>
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
                    {_t("Come Accedere: La Finestra Nascosta del Tesoro")}</b>
                </div>
                <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.5' }}>
                  {_t("Perché la scheda Finanze non è visibile tra le normali linguette in basso? Perché quando usi l'app in pubblico, sui mezzi o in ufficio, nessuno deve sbirciare il tuo saldo o i tuoi investimenti.")}<br />
                  <ul style={{ margin: '8px 0 2px 16px', padding: 0 }}>
                    <li>👉 <b>{_t("Doppio tocco rapido su \"Opzioni\" (⚙️):")}</b> {" "}{_t("Nella barra di navigazione in basso a destra, fai due tocchi rapidi su Opzioni: si aprirà istantaneamente la schermata segreta")}{" "}<b>{_t("Tesoro & Finanze (💰)")}</b>.</li>
                    <li>👉 <b>{_t("Un tocco singolo:")}</b> {" "}{_t("Ti riporta immediatamente alle Opzioni normali.")}</li>
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
                      {_t("Guida Cloudflare Workers per Aggiornamento ETF")}</b>
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
                    <span>{copiedCode ? _t("Codice Copiato!") : _t("Copia Codice Worker")}</span>
                  </button>
                </div>

                <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
                  <b>{_t("Perché serve?")}</b> {" "}{_t("I browser mobili impediscono per sicurezza di contattare direttamente Yahoo Finance (blocco CORS). Con un tuo Worker personale gratuito su Cloudflare (100.000 richieste al giorno gratis!), ottieni quotazioni aggiornate al millesimo in totale autonomia.")}</div>

                {/* Passaggi passo passo */}
                <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                  <b style={{ color: '#f8fafc' }}>{_t("📝 I 4 Passaggi Semplici su Cloudflare:")}</b>
                  <div>
                    <b>{_t("1. Crea il Worker:")}</b> {" "}{_t("Vai su")}{" "}<a href="https://dash.cloudflare.com" target="_blank" rel="noreferrer" style={{ color: '#38bdf8', textDecoration: 'underline' }}>{_t("dash.cloudflare.com")}</a> &gt; <i>{_t("Workers & Pages")}</i> &gt; <i>{_t("Create Application")}</i> &gt; scegli <b>{_t("Hello World")}</b> &gt; clicca <b>{_t("Deploy")}</b>.
                  </div>
                  <div>
                    <b>{_t("2. Modifica il codice:")}</b> {" "}{_t("Clicca sul pulsante")}{" "}<b>{_t("\"Edit code\"")}</b> {" "}{_t("in alto a destra.")}</div>
                  <div>
                    <b>{_t("3. Incolla il codice:")}</b> {" "}{_t("Nel file")}{" "}<code>worker.js</code> {" "}{_t("a sinistra, cancella tutto e premi il tasto sopra")}{" "}<b>{_t("\"Copia Codice Worker\"")}</b>{_t(", quindi incollalo nell'editor. Clicca")}{" "}<b>{_t("Deploy")}</b>.
                  </div>
                  <div>
                    <b>{_t("4. Collega a Quest Life:")}</b> {" "}{_t("Copia l'indirizzo del tuo Worker (es.")}{" "}<code>https://nome-worker.tuonome.workers.dev</code>{_t("), entra nel Tesoro di Quest Life, tocca il fulmine")}{" "}<b>⚡</b> {" "}{_t("accanto ad")}{" "}<i>{_t("Aggiorna Prezzi")}</i> {" "}{_t("e incollalo nel campo")}{" "}<b>{_t("Proxy Personale")}</b>{_t(". Fatto!")}</div>
                </div>

                {/* Blocco Codice */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold' }}>{_t("Codice Completo per worker.js:")}</span>
                    <button
                      type="button"
                      onClick={handleCopyWorkerCode}
                      style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '10px', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                    >
                      {copiedCode ? _t("Copiato!") : _t("Copia codice")}
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
                  <b style={{ color: '#fbbf24' }}>{_t("💡 Suffissi Borse per Yahoo Finance:")}</b>
                  <div style={{ marginTop: '4px', color: '#cbd5e1' }}>
                    {_t("Yahoo richiede il suffisso della borsa su cui è quotato lo strumento:")}<ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                      <li><b>{_t("Borsa Italiana (Milano):")}</b> {" "}{_t("aggiungi")}{" "}<code>.MI</code> {" "}{_t("(es.")}{" "}<code>SWDA.MI</code>, <code>CSSPX.MI</code>, <code>LCWD.MI</code>, <code>SMEA.MI</code>)</li>
                      <li><b>{_t("Xetra (Germania):")}</b> {" "}{_t("aggiungi")}{" "}<code>.DE</code> {" "}{_t("(es.")}{" "}<code>VWCE.DE</code>, <code>EUNL.DE</code>, <code>IS3N.DE</code>)</li>
                      <li><b>{_t("Azioni USA:")}</b> {" "}{_t("senza suffisso (es.")}{" "}<code>AAPL</code>, <code>MSFT</code>, <code>NVDA</code>)</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Conti e Budget */}
              <div style={{ background: 'rgba(30, 41, 59, 0.55)', padding: '14px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <b style={{ color: '#f59e0b', fontSize: '13px' }}>{_t("🏛️ I 4 Pilastri del Patrimonio")}</b>
                <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
                  <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                    <li><b>{_t("💳 Conto Base:")}</b> {" "}{_t("Il conto per la vita di tutti i giorni.")}</li>
                    <li><b>{_t("💵 Contanti:")}</b> {" "}{_t("La liquidità fisica nel portafoglio.")}</li>
                    <li><b>{_t("🏦 Conti Secondari & Deposito:")}</b> {" "}{_t("Conti vincolati o svincolati con tasso di interesse annuo calcolato in tempo reale!")}</li>
                    <li><b>{_t("📈 Investimenti & PAC:")}</b> {" "}{_t("Valore totale calcolato dal prezzo delle quote moltiplicato per i titoli posseduti.")}</li>
                  </ul>
                </div>
              </div>

              {/* Pro Tip Box */}
              <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '12px', padding: '12px 14px', fontSize: '11.5px', lineHeight: '1.45', color: '#fde68a' }}>
                💡 <b>{_t("Consiglio dell'Eroe:")}</b> {" "}{_t("Il segreto della ricchezza non è prevedere il mercato, ma la costanza dell'accumulo. Tratta i tuoi investimenti come una missione a lungo termine: lascia che il tempo e l'interesse composto combattano al tuo fianco.")}</div>
            </>
          )}

        </div>

      </div>
    </div>
  );
}
