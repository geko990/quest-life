import React, { useState } from 'react';
import { CLOUDFLARE_WORKER_CODE } from '../utils/constants';

export default function UserManualModal({ isOpen, onClose, initialChapter = 'finances' }) {
  const [activeChapter, setActiveChapter] = useState(initialChapter);
  const [copiedCode, setCopiedCode] = useState(false);

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
    { id: 'finances', label: '💰 Finanze & ETF', icon: '💰' },
    { id: 'rpg', label: '⚔️ RPG & Meccaniche', icon: '⚔️' },
    { id: 'habits', label: '🎯 Abitudini & Routine', icon: '🎯' },
    { id: 'quests', label: '🗺️ Missioni & Campagne', icon: '🗺️' },
    { id: 'nutrition', label: '🥗 Nutrizione & Salute', icon: '🥗' },
    { id: 'data', label: '💾 Backup & PWA', icon: '💾' }
  ];

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'rgba(0, 0, 0, 0.72)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 14px'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-card, #1e293b)',
          border: '1px solid var(--glass-border, rgba(255,255,255,0.12))',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '650px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 45px rgba(0, 0, 0, 0.6)',
          overflow: 'hidden'
        }}
      >
        {/* Header del Manuale */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--glass-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-secondary)',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>📖</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>
                Manuale di Utilizzo Quest Life
              </h2>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Guida interattiva a tutte le funzioni e integrazioni dell'app
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-secondary)',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: 'bold',
              lineHeight: 1
            }}
            title="Chiudi manuale"
          >
            ✕
          </button>
        </div>

        {/* Barra di Navigazione Capitoli (Pillole orizzontali scorrevoli) */}
        <div
          className="no-scrollbar"
          style={{
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            padding: '10px 16px',
            background: 'var(--bg-primary)',
            borderBottom: '1px solid var(--glass-border)',
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
                  background: isSel ? 'var(--accent-primary, #38bdf8)' : 'var(--bg-secondary)',
                  color: isSel ? '#ffffff' : 'var(--text-secondary)',
                  border: isSel ? '1px solid var(--accent-primary, #38bdf8)' : '1px solid var(--glass-border)',
                  boxShadow: isSel ? '0 2px 8px rgba(56, 189, 248, 0.35)' : 'none',
                  borderRadius: '10px',
                  padding: '6px 12px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{ch.icon}</span>
                <span>{ch.label}</span>
              </button>
            );
          })}
        </div>

        {/* Area di Contenuto del Capitolo (Scrollabile) */}
        <div
          style={{
            padding: '20px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            color: 'var(--text-primary)',
            fontSize: '13px',
            lineHeight: '1.55'
          }}
        >

          {/* ========================================================== */}
          {/* CAPITOLO 1: FINANZE & ETF (CON GUIDA CLOUDFLARE WORKER)    */}
          {/* ========================================================== */}
          {activeChapter === 'finances' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>
                <span style={{ fontSize: '26px' }}>💰</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                    Finanze, Tesoro & Portafoglio ETF
                  </h3>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Gestione conti correnti, budget mensile, spese ricorrenti e sincronizzazione mercati
                  </div>
                </div>
              </div>

              {/* Sezione Cloudflare Workers in Evidenza */}
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.12), rgba(30, 41, 59, 0.6))',
                  border: '1.5px solid var(--accent-primary, #38bdf8)',
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
                    <b style={{ fontSize: '14px', color: 'var(--accent-primary, #38bdf8)' }}>
                      Guida Cloudflare Workers per Aggiornamento ETF
                    </b>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyWorkerCode}
                    style={{
                      background: copiedCode ? '#22c55e' : 'var(--accent-primary, #38bdf8)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '6px 14px',
                      borderRadius: '8px',
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

                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Perché serve? <b>Yahoo Finance</b> e i browser mobili bloccano le richieste dirette per motivi di sicurezza (blocco CORS). Creando un tuo Cloudflare Worker personale gratuito (100.000 richieste al giorno gratis!), aggiri questo blocco istantaneamente senza limiti.
                </div>

                {/* Passaggi passo passo */}
                <div style={{ background: 'var(--bg-primary)', padding: '12px', borderRadius: '10px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                  <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '2px' }}>
                    📝 Procedura passo-passo da seguire su Cloudflare:
                  </div>
                  <div>
                    <b>1. Crea il Worker:</b> Entra su <a href="https://dash.cloudflare.com" target="_blank" rel="noreferrer" style={{ color: '#38bdf8', textDecoration: 'underline' }}>dash.cloudflare.com</a>, vai su <i>Workers & Pages</i> &gt; <i>Create Application</i> &gt; scegli <b>Hello World</b> &gt; clicca <b>Deploy</b>.
                  </div>
                  <div>
                    <b>2. Modifica il codice:</b> Clicca sul pulsante <b>"Edit code"</b> (o "Quick edit") in alto a destra.
                  </div>
                  <div>
                    <b>3. Incolla il codice:</b> Nell'editor a sinistra (file <code>worker.js</code>), <u>cancella tutto il testo presente</u> e clicca il tasto qui sopra <b>"Copia Codice Worker"</b>, quindi incollalo nell'editor.
                  </div>
                  <div>
                    <b>4. Pubblica:</b> Clicca su <b>"Deploy"</b> (o "Save and deploy") in alto a destra.
                  </div>
                  <div>
                    <b>5. Copia il link del Worker:</b> Torna alla pagina principale del tuo Worker. Vedrai l'indirizzo pubblico assegnato, ad esempio:
                    <div style={{ background: 'var(--bg-secondary)', padding: '4px 8px', borderRadius: '6px', fontFamily: 'monospace', color: '#38bdf8', marginTop: '3px', fontSize: '11px', display: 'inline-block' }}>
                      https://mio-proxy.tuonome.workers.dev
                    </div>
                  </div>
                  <div>
                    <b>6. Incolla in Quest Life:</b> Vai nella scheda <b>Finanze</b> di quest'app, nella sezione <b>Investimenti</b> tocca il fulmine <b>⚡</b> accanto ad "Aggiorna Prezzi", incolla l'URL del tuo Worker e tocca <b>Salva Configurazione</b>. Fatto!
                  </div>
                </div>

                {/* Blocco Codice */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Codice Completo per worker.js:</span>
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
                      maxHeight: '180px',
                      margin: 0,
                      fontFamily: 'monospace'
                    }}
                  >
                    {CLOUDFLARE_WORKER_CODE}
                  </pre>
                </div>

                {/* Guida Ticker ETF */}
                <div style={{ background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.25)', borderRadius: '10px', padding: '10px', fontSize: '11px', lineHeight: '1.4' }}>
                  <b style={{ color: '#fbbf24' }}>💡 Come scrivere i Ticker degli ETF per Yahoo Finance:</b>
                  <div style={{ marginTop: '4px', color: 'var(--text-secondary)' }}>
                    Yahoo Finance richiede il suffisso della borsa su cui è quotato lo strumento:
                    <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                      <li><b>Borsa Italiana (Milano):</b> aggiungi <code>.MI</code> (es. <code>SWDA.MI</code>, <code>CSSPX.MI</code>, <code>LCWD.MI</code>, <code>SMEA.MI</code>)</li>
                      <li><b>Xetra (Germania):</b> aggiungi <code>.DE</code> (es. <code>VWCE.DE</code>, <code>EUNL.DE</code>, <code>IS3N.DE</code>)</li>
                      <li><b>Azioni USA:</b> usa il ticker pulito (es. <code>AAPL</code>, <code>MSFT</code>, <code>NVDA</code>)</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Spiegazione generale Gestione Finanze */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  🏛️ Gestione dei Conti & Patrimonio
                </h4>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Il tuo patrimonio totale è la somma di:
                  <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>
                    <li><b>💳 Conto Base:</b> Il tuo conto corrente principale per entrate e spese di tutti i giorni.</li>
                    <li><b>💵 Contanti:</b> Il denaro liquido che porti nel portafoglio.</li>
                    <li><b>🏦 Conti Secondari:</b> Puoi creare conti deposito, conti risparmio o investimenti, scegliendo se sono vincolati a tempo o svincolati, e specificando un eventuale tasso di interesse attivo annuo per calcolare la rendita passiva!</li>
                    <li><b>📈 Investimenti & PAC:</b> Il controvalore totale calcolato dal prezzo attuale delle quote dei tuoi ETF moltiplicato per il numero di quote possedute.</li>
                  </ul>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  📊 Budget Mensile & Categorie
                </h4>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  All'inizio di ogni mese, Quest Life confronta le entrate totali con le uscite. Ciascuna spesa viene assegnata a una categoria (Alimentari, Svago, Casa, Trasporti, Salute, ecc.). Puoi impostare un budget massimo mensile per tenere sotto controllo il tasso di risparmio e ricevere badge RPG in base alla tua disciplina finanziaria.
                </div>
              </div>
            </>
          )}

          {/* ========================================================== */}
          {/* CAPITOLO 2: RPG & MECCANICHE DI GIOCO                     */}
          {/* ========================================================== */}
          {activeChapter === 'rpg' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>
                <span style={{ fontSize: '26px' }}>⚔️</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                    Meccaniche RPG: Livelli, XP & Statistiche
                  </h3>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Come trasformare la tua vita reale in un gioco di ruolo coinvolgente
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  🛡️ I 6 Attributi Primari del Giocatore
                </h4>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Ogni azione, abitudine o missione completata assegna punti esperienza (XP) che sviluppano attributi specifici del tuo personaggio:
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                    <b>💪 Forza (STR):</b> Allenamento fisico, resistenza, pesistica, disciplina e sforzi intensi.
                  </div>
                  <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                    <b>⚡ Destrezza (DEX):</b> Velocità, rapidità mentale, produttività, agilità e multitasking efficace.
                  </div>
                  <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                    <b>🛡️ Costituzione (CON):</b> Idratazione, sonno ristoratore, alimentazione sana e recupero.
                  </div>
                  <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                    <b>🧠 Intelligenza (INT):</b> Studio, lettura, corsi formativi, coding e problem solving.
                  </div>
                  <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                    <b>✨ Saggezza (WIS):</b> Meditazione, mindfulness, riflessione serale, gratitudine e benessere emotivo.
                  </div>
                  <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                    <b>👑 Carisma (CHA):</b> Relazioni sociali, public speaking, leadership, comunicazione ed empatia.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  📈 Livelli, Titoli & Curva di Esperienza
                </h4>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Il tuo livello generale sale accumulando XP complessivi. Man mano che sali di livello sblocchi nuovi titoli onorifici (da <i>Novizio</i> a <i>Leggenda Vivente</i>).
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  🔥 Streak (Serie Consecutive) & Moltiplicatore
                </h4>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Mantenere una serie attiva completando le tue abitudini giorno dopo giorno aumenta il tuo moltiplicatore di XP. Se salti un giorno, la serie si azzera, ma puoi usare uno scudo protettivo o un giorno di riposo per preservarla!
                </div>
              </div>
            </>
          )}

          {/* ========================================================== */}
          {/* CAPITOLO 3: ABITUDINI & ROUTINE                          */}
          {/* ========================================================== */}
          {activeChapter === 'habits' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>
                <span style={{ fontSize: '26px' }}>🎯</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                    Abitudini (Habits) & Giornate Tipo
                  </h3>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Costruire costanza quotidiana attraverso abitudini atomic e routine del mattino e della sera
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  ✅ Come tracciare le Abitudini Quotidiane
                </h4>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Le abitudini sono azioni ricorrenti che ripeti ogni giorno (o in specifici giorni della settimana).
                  <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>
                    <li>Tocca il cerchio a destra per contrassegnare l'abitudine come completata per la data odierna.</li>
                    <li>Tieni premuto o tocca per visualizzare i dettagli, le note, la serie storica e le statistiche di completamento.</li>
                    <li>Puoi assegnare ad ogni abitudine un orario ideale della giornata (Mattina, Pomeriggio, Sera, Notte) per visualizzarle ordinate nella tua timeline.</li>
                  </ul>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  💼 Giornate Tipo (Modelli di Routine)
                </h4>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  In <b>Impostazioni &gt; Giornate Tipo</b> puoi configurare modelli predefiniti (ad es. <i>"Giorno Lavorativo"</i>, <i>"Giorno di Riposo"</i>, <i>"Sessione di Studio"</i>). Ciascun modello contiene una sequenza oraria di passi guidati che ti permettono di affrontare la giornata con la massima chiarezza e zero fatica decisionale.
                </div>
              </div>
            </>
          )}

          {/* ========================================================== */}
          {/* CAPITOLO 4: MISSIONI & CAMPAGNE                          */}
          {/* ========================================================== */}
          {activeChapter === 'quests' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>
                <span style={{ fontSize: '26px' }}>🗺️</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                    Missioni (Quests) & Campagne Epiche
                  </h3>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Distinguere i compiti giornalieri dai grandi progetti a tappe
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  📜 Differenza tra Abitudini e Missioni
                </h4>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Mentre le <b>Abitudini</b> sono comportamenti che si ripetono per sempre (es. bere 2L d'acqua), le <b>Missioni</b> sono task concreti con un obiettivo e una fine (es. "Riparare la bicicletta", "Consegnare il report trimestrale").
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  🏔️ Campagne Epiche a Tappe (Milestones)
                </h4>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Le Campagne sono sfide di lunga durata (es. 30 giorni o più) suddivise in sotto-missioni giornaliere sequenziali:
                  <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>
                    <li><b>Campagna Docce Fredde (30 giorni):</b> per allenare forza di volontà e resistenza.</li>
                    <li><b>Campagna Digital Detox (7 giorni):</b> per riconquistare la concentrazione e limitare l'uso passivo dello smartphone.</li>
                    <li>Puoi creare campagne personalizzate per qualsiasi tuo grande progetto di vita!</li>
                  </ul>
                </div>
              </div>
            </>
          )}

          {/* ========================================================== */}
          {/* CAPITOLO 5: NUTRIZIONE & SALUTE                           */}
          {/* ========================================================== */}
          {activeChapter === 'nutrition' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>
                <span style={{ fontSize: '26px' }}>🥗</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                    Nutrizione, Macro & Scanner Etichette OCR
                  </h3>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Diario pasti, bilancio calorico, pesate e scanner per etichette nutrizionali
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  🥩 Calorie e Macronutrienti (I 3 Macro)
                </h4>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Nella scheda <b>Nutrizione</b> puoi impostare il tuo fabbisogno calorico giornaliero (TDEE) e gli obiettivi dei 3 macro:
                  <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>
                    <li><b>🔴 Proteine (4 kcal/g):</b> Fondamentali per massa magra, muscoli e sazietà.</li>
                    <li><b>🟡 Carboidrati (4 kcal/g):</b> La fonte energetica primaria per cervello e allenamento.</li>
                    <li><b>🔵 Grassi (9 kcal/g):</b> Essenziali per equilibrio ormonale e salute cellulare.</li>
                  </ul>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  📷 Scanner OCR per Etichette Alimentari
                </h4>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Puoi aggiungere alimenti in 3 secondi usando la fotocamera del tuo cellulare:
                  <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>
                    <li>Tocca il pulsante <b>"📷 Scansiona Etichetta"</b> quando inserisci un nuovo cibo.</li>
                    <li>Inquadra la tabella nutrizionale sul retro della confezione: il motore OCR riconosce automaticamente calorie, proteine, carboidrati e grassi per 100g e compila la scheda per te!</li>
                  </ul>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  ⚖️ Registro Pesate & Trend del Peso
                </h4>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Registra il tuo peso al mattino a digiuno. L'app calcola la media mobile a 7 giorni per eliminare le normali fluttuazioni di liquidi e mostrarti la reale direzione del tuo trend corporeo.
                </div>
              </div>
            </>
          )}

          {/* ========================================================== */}
          {/* CAPITOLO 6: DATI, BACKUP & PWA OFFLINE                    */}
          {/* ========================================================== */}
          {activeChapter === 'data' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>
                <span style={{ fontSize: '26px' }}>💾</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                    Salvataggio Dati, Backup & Installazione PWA
                  </h3>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Massima privacy: 100% offline, salvataggio su file e installazione su smartphone
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  🔒 Privacy Totale & Salvataggio Locale
                </h4>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Quest Life non invia i tuoi dati sensibili a nessun server esterno. Tutto viene memorizzato direttamente nel database del tuo browser (IndexedDB / LocalStorage).
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  📦 Esporta & Importa Backup JSON
                </h4>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  In <b>Impostazioni &gt; Dati & Database</b>:
                  <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>
                    <li><b>Esporta Dati:</b> Scarica in 1 secondo un file <code>quest_life_backup_....json</code> contenente tutte le tue statistiche, abitudini, finanze e pasti. Si consiglia di effettuare un backup settimanale.</li>
                    <li><b>Importa Dati:</b> Ripristina il tuo intero profilo su qualsiasi dispositivo caricando il file JSON.</li>
                    <li><b>Collega Database Locale (PC/Mac):</b> Tramite File System Access API puoi scegliere un file sul tuo computer: ogni modifica si salverà in tempo reale su disco!</li>
                  </ul>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  📱 Come Installare Quest Life come App (PWA)
                </h4>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Quest Life è una Progressive Web App (PWA) funzionante anche senza connessione internet:
                  <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>
                    <li><b>Su iPhone / iPad (Safari):</b> Tocca il pulsante Condividi (icona quadrato con freccia in su) &gt; seleziona <b>"Aggiungi alla schermata Home"</b>.</li>
                    <li><b>Su Android (Chrome):</b> Tocca i 3 puntini in alto a destra &gt; seleziona <b>"Installa applicazione"</b> (o "Aggiungi a schermata Home").</li>
                  </ul>
                </div>
              </div>
            </>
          )}

        </div>

        {/* Footer con pulsante di chiusura rapida */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--glass-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--bg-secondary)',
            flexShrink: 0
          }}
        >
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Quest Life v5.9 • Manuale Ufficiale
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 20px',
              borderRadius: '10px',
              border: 'none',
              background: 'var(--accent-primary, #38bdf8)',
              color: '#ffffff',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
            }}
          >
            Chiudi Manuale
          </button>
        </div>

      </div>
    </div>
  );
}
