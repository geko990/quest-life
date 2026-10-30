import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CLOUDFLARE_WORKER_CODE } from '../utils/constants';
import { AREAS } from '../utils/onboarding';
import { LANDS } from '../utils/unlocks';
import { _t } from '../i18n';

// Grimorio di Quest Life (guida). Si apre in primo piano, in un portale sopra a tutto
// (barra superiore e nav bar comprese), con l'app oscurata dietro. Si chiude toccando fuori
// o con "Torna all'avventura" in fondo. Stili nelle classi .gm-* di src/index.css.

// --- Mattoncini grafici della guida (stesso stile in tutti i capitoli) ---
const Hero = ({ icon, color, title, quote }) => (
  <div className="gm-hero" style={{ '--gm-c': color }}>
    <div className="gm-hero-title"><span>{icon}</span><h3>{title}</h3></div>
    <div className="gm-quote">{quote}</div>
  </div>
);

const Card = ({ title, color = '#38bdf8', children, highlight }) => (
  <div className={`gm-card${highlight ? ' gm-card--hl' : ''}`} style={{ '--gm-c': color }}>
    <b className="gm-card-title">{title}</b>
    <div className="gm-card-body">{children}</div>
  </div>
);

const Tip = ({ color, children }) => (
  <div className="gm-tip" style={{ '--gm-c': color }}>
    💡 <b>{_t("Consiglio dell'Eroe:")}</b>{' '}{children}
  </div>
);

const Pair = ({ children }) => <div className="gm-pair">{children}</div>;

const Mini = ({ title, color, children }) => (
  <div className="gm-mini" style={{ '--gm-c': color }}>
    <b>{title}</b>
    <div>{children}</div>
  </div>
);

const Attr = ({ label, color, children }) => (
  <div className="gm-mini"><b style={{ color }}>{label}</b>{' '}{children}</div>
);

export default function UserManualModal({ isOpen, onClose, initialChapter = 'rpg' }) {
  const [activeChapter, setActiveChapter] = useState(initialChapter);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (initialChapter) setActiveChapter(initialChapter);
  }, [initialChapter, isOpen]);

  // Contenuto in cima a ogni cambio di capitolo
  const bodyRef = React.useRef(null);
  useEffect(() => { if (bodyRef.current) bodyRef.current.scrollTop = 0; }, [activeChapter]);

  if (!isOpen) return null;

  const handleCopyWorkerCode = async () => {
    try {
      await navigator.clipboard.writeText(CLOUDFLARE_WORKER_CODE);
    } catch (err) {
      const textArea = document.createElement('textarea');
      textArea.value = CLOUDFLARE_WORKER_CODE;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const chapters = [
    { id: 'rpg', label: _t("RPG & Meccaniche"), icon: '⚔️' },
    { id: 'hero', label: _t("Eroe & Azioni del Giorno"), icon: '🎲' },
    { id: 'habits', label: _t("Abitudini & Routine"), icon: '🎯' },
    { id: 'quests', label: _t("Missioni & Campagne"), icon: '🗺️' },
    { id: 'nutrition', label: _t("Nutrizione & Salute"), icon: '🥗' },
    { id: 'tricks', label: _t("Gesti & Scorciatoie"), icon: '👆' },
    { id: 'data', label: _t("Backup & PWA"), icon: '💾' },
    { id: 'finances', label: _t("Finanze & ETF"), icon: '💰' }
  ];

  return createPortal(
    <div className="gm-overlay" onClick={onClose}>
      <div className="gm-sheet" role="dialog" aria-label={_t("Grimorio di Quest Life")} onClick={(e) => e.stopPropagation()}>
        {/* Intestazione */}
        <div className="gm-head">
          <span className="gm-head-icon">📖</span>
          <h2>{_t("Grimorio di Quest Life")}</h2>
          <span className="gm-badge">{_t("Guida Ufficiale")}</span>
        </div>

        {/* Capitoli */}
        <div className="gm-tabs no-scrollbar">
          {chapters.map((ch) => (
            <button
              key={ch.id}
              type="button"
              className={`gm-tab${activeChapter === ch.id ? ' is-on' : ''}`}
              onClick={() => setActiveChapter(ch.id)}
            >
              <span className="gm-tab-icon">{ch.icon}</span>
              <span>{ch.label}</span>
            </button>
          ))}
        </div>

        {/* Contenuto del capitolo */}
        <div className="gm-body no-scrollbar" ref={bodyRef}>

          {/* ===== CAPITOLO: RPG & MECCANICHE ===== */}
          {activeChapter === 'rpg' && (
            <>
              <Hero
                icon="⚔️" color="#38bdf8"
                title={_t("La Tua Vita è il Gioco di Ruolo Definitivo")}
                quote={_t("\"Non sei uno spettatore passivo della tua esistenza: ogni singola azione reale si converte in Esperienza tangibile per potenziare il tuo eroe.\"")}
              />

              <div className="gm-section">
                <h4 className="gm-h4">🧭 {_t("Le Tue Abilità")}</h4>
                <div className="gm-text">{_t("Sono le aree della tua vita che vuoi far crescere: le scegli nel benvenuto, da 3 a 5. Ogni impresa dà XP all'abilità che allena e il radar dell'Eroe ne disegna la forma:")}</div>
                <Pair>
                  {AREAS.map(a => (
                    <Attr key={a.id} label={`${a.emoji} ${_t(a.name)}:`} color={a.color}>{_t(a.desc)}</Attr>
                  ))}
                </Pair>
                <div className="gm-text">{_t("Giochi da prima del benvenuto? I tuoi attributi classici (Forza, Destrezza, Costituzione, Intelligenza, Saggezza, Carisma) funzionano allo stesso modo. Dalla schermata Eroe scegli quali mostrare nel radar.")}</div>
              </div>

              <Card title={_t("🗺️ Un Mondo che si Apre con Te")} color="#22c55e" highlight>
                {_t("Quest Life cresce insieme a te: all'inizio trovi Eroe, Abitudini e Opzioni, poi ogni livello apre una nuova terra, festeggiata dalla medaglia «Hai sbloccato».")}
                <ul className="gm-list">
                  {LANDS.map(l => (
                    <li key={l.feature}><b>{_t("Livello {0}:", l.level)}</b>{' '}{l.emoji} {_t(l.name)}</li>
                  ))}
                </ul>
                {_t("Vuoi vedere tutto subito? In Opzioni → 🎮 Gioco accendi «Sblocca tutto».")}
              </Card>

              <Card title={_t("⭐ Quanto Vale un'Impresa")} color="#fbbf24">
                {_t("Ogni abitudine, missione e azione ha da 1 a 5 stelle: più è impegnativa, più ti premia. Un'abitudine vale 4 XP per stella (da 4 a 20 XP) per la caratteristica principale, e un terzo in più va alla secondaria. Sii onesto con le stelle: è il tuo eroe a guadagnarci.")}
              </Card>

              <Pair>
                <Mini title={_t("📈 Livelli & Rango")} color="#38bdf8">
                  {_t("Dal livello 1 al 20, ogni traguardo ti dà un nuovo rango: Esordiente, Apprendista (2), Viandante (5), Guida (10) e infine Leggenda (20).")}
                </Mini>
                <Mini title={_t("🔥 La Tua Serie")} color="#f59e0b">
                  {_t("La fiamma sulla tessera conta i giorni in cui hai completato l'abitudine. È la prova visibile della tua costanza: non interrompere la catena!")}
                </Mini>
              </Pair>

              <Card title={_t("🏅 La Medaglia del Mese")} color="#fbbf24">
                {_t("Ogni mese puoi conquistare una medaglia: completa 50 imprese tra missioni, tappe delle campagne e Azioni del Giorno (le abitudini non contano), con una piramide di difficoltà di almeno 5 da ⭐⭐⭐, 3 da ⭐⭐⭐⭐ e 2 da ⭐⭐⭐⭐⭐. La trovi poi nella bacheca in alto, con il riepilogo del mese.")}
              </Card>

              <Card title={_t("🎉 Ogni Vittoria si Festeggia")} color="#a78bfa">
                {_t("A ogni spunta compare la barra degli XP guadagnati; quando sali di livello arriva la medaglia dorata. Completa tutte le abitudini di oggi o tutte le Azioni del Giorno e piovono coriandoli: se le chiudi entrambe è una Giornata perfetta!")}
              </Card>

              <Tip color="#f59e0b">{_t("La costanza batte l'intensità. Tre piccole abitudini completate ogni singolo giorno per un mese generano un impatto dieci volte superiore rispetto a uno sforzo colossale isolato.")}</Tip>
            </>
          )}

          {/* ===== CAPITOLO: EROE & AZIONI DEL GIORNO ===== */}
          {activeChapter === 'hero' && (
            <>
              <Hero
                icon="🎲" color="#f59e0b"
                title={_t("Ogni Giorno è il Tuo Turno")}
                quote={_t("\"Come in una partita, ogni mattina hai le tue mosse: scegli con cura, lancia il dado e trasforma il piano in vittoria.\"")}
              />

              <Card title={_t("🎯 Le 4 Azioni del Giorno")} color="#ef4444">
                {_t("Dal livello 4, nella finestra «È il tuo turno!» scegli le quattro mosse della giornata, come nel turno di un gioco di ruolo:")}
                <ul className="gm-list">
                  <li><b>{_t("🎯 Azione:")}</b>{' '}{_t("l'impresa principale, quella che conta di più.")}</li>
                  <li><b>{_t("⚡ Azione bonus:")}</b>{' '}{_t("un passo in più, piccolo ma prezioso.")}</li>
                  <li><b>{_t("🚶 Movimento:")}</b>{' '}{_t("qualcosa per il corpo.")}</li>
                  <li><b>{_t("🛡️ Reazione:")}</b>{' '}{_t("qualcosa per la mente e il recupero.")}</li>
                </ul>
                {_t("Per ognuna scegli stelle e caratteristiche, oppure pesca con 📋 una missione che hai già in lista.")}
              </Card>

              <Card title={_t("🎲 Il Dado del Destino")} color="#f59e0b" highlight>
                {_t("Quando confermi il piano lanci un dado da 10: il risultato diventa un bonus dal 10% al 100% sugli XP delle Azioni del Giorno. La fortuna aiuta gli audaci… ma solo se poi le completi!")}
              </Card>

              <Pair>
                <Mini title={_t("🍅 Timer Pomodoro")} color="#ef4444">
                  {_t("Dal livello 2 avvii una sessione di concentrazione (25 minuti, ma puoi cambiarla): ogni sessione completata ti fa guadagnare XP.")}
                </Mini>
                <Mini title={_t("🕸️ Il Radar dell'Eroe")} color="#38bdf8">
                  {_t("Mostra a colpo d'occhio dove sei forte e dove puoi crescere: guardalo allargarsi giorno dopo giorno.")}
                </Mini>
              </Pair>

              <Card title={_t("🔋 Sostentamento")} color="#22c55e">
                {_t("Sotto le azioni trovi il riepilogo di calorie bruciate, acqua e passi della giornata, gli stessi della scheda Salute: un promemoria gentile per prenderti cura del tuo corpo.")}
              </Card>

              <Tip color="#f59e0b">{_t("Quando hai completato le 4 azioni, l'app ti invita a pianificare domani: fallo la sera, a mente fresca. Svegliarti con il piano già pronto è metà della vittoria.")}</Tip>
            </>
          )}

          {/* ===== CAPITOLO: ABITUDINI & ROUTINE ===== */}
          {activeChapter === 'habits' && (
            <>
              <Hero
                icon="🎯" color="#22c55e"
                title={_t("L'Arte della Costanza Automatica")}
                quote={_t("\"I veri campioni non dipendono dalla motivazione temporanea: creano sistemi e routine inattaccabili.\"")}
              />

              <Card title={_t("⚡ Gestione Semplice & Rapida")} color="#4ade80">
                <ul className="gm-list">
                  <li><b>{_t("Spunta al volo:")}</b>{' '}{_t("tocca il cerchio a sinistra della tessera per completare l'abitudine e incassare subito i tuoi XP.")}</li>
                  <li><b>{_t("Stelle e caratteristiche:")}</b>{' '}{_t("ogni abitudine ha la sua difficoltà e allena una caratteristica principale (e se vuoi una secondaria).")}</li>
                  <li><b>{_t("Dettagli:")}</b>{' '}{_t("tocca la tessera per vedere i dettagli e modificarla con la matita.")}</li>
                  <li><b>{_t("Il tuo ordine:")}</b>{' '}{_t("tieni premuta una tessera e trascinala dove preferisci.")}</li>
                </ul>
              </Card>

              <Card title={_t("🗓️ Giornate Tipo: il Tuo Copilota Quotidiano")} color="#38bdf8" highlight>
                {_t("Dal livello 4, in Opzioni → 🗓️ Giornate tipo puoi creare i tuoi modelli di giornata (es. «Giorno lavorativo» o «Domenica di ricarica»): una scaletta oraria che azzera la stanchezza decisionale e ti tiene sulla rotta. Le azioni si mettono da sole in ordine di orario: aggiungi pure un'attività più mattutina, finirà al suo posto.")}
              </Card>

              <Tip color="#22c55e">{_t("Associa sempre una nuova abitudine a un'azione che fai già in automatico (es.")}{' '}<i>{_t("\"Subito dopo il caffè del mattino, berrò un bicchiere d'acqua ed eseguirò 2 minuti di stretching\"")}</i>{_t("). È il principio del concatenamento delle abitudini atomiche.")}</Tip>
            </>
          )}

          {/* ===== CAPITOLO: MISSIONI & CAMPAGNE ===== */}
          {activeChapter === 'quests' && (
            <>
              <Hero
                icon="🗺️" color="#f59e0b"
                title={_t("Dalle Azioni ai Grandi Traguardi")}
                quote={_t("\"Le abitudini mantengono solida la tua fortezza; le missioni ti spingono a esplorare e conquistare territori sconosciuti.\"")}
              />

              <Card title={_t("⚖️ Abitudini vs Missioni: La Differenza Chiave")} color="#fbbf24">
                {_t("Un dubbio comune: cosa inserire come abitudine e cosa come missione?")}
                <ul className="gm-list">
                  <li><b>{_t("Abitudini (Habits):")}</b>{' '}{_t("Riti ciclici infiniti che ripeti ogni giorno (es. bere 2L d'acqua, camminare 8.000 passi, meditare 10 min).")}</li>
                  <li><b>{_t("Missioni (Quests):")}</b>{' '}{_t("Obiettivi specifici con un inizio e una conclusione definita (es.")}{' '}<i>{_t("\"Rinnovare il passaporto\"")}</i>, <i>{_t("\"Riparare la bici\"")}</i>, <i>{_t("\"Consegnare il report\"")}</i>).</li>
                </ul>
              </Card>

              <Card title={_t("🏠 Dove Trovi le Missioni")} color="#a78bfa">
                {_t("All'inizio le missioni vivono nella schermata Eroe, sotto il radar. Dal livello 2 hanno una scheda tutta loro nella nav bar, e dal livello 5 arrivano le Campagne.")}
              </Card>

              <Card title={_t("⏰ Scadenze e Promemoria")} color="#f97316">
                {_t("Dai una scadenza alle missioni importanti (l'ora è facoltativa) e scegli in Opzioni → 🎮 Gioco quanti promemoria vuoi e quanto prima. Dal primo promemoria la tessera diventa arancione e sulla nav bar compare il pallino rosso; dal giorno della scadenza la tessera diventa rossa. Nessuna sorpresa, nessuna scadenza dimenticata.")}
              </Card>

              <Card title={_t("🏔️ Campagne a Tappe (Sfide di Lungo Periodo)")} color="#38bdf8">
                {_t("Le campagne scompongono una sfida imponente in tappe sequenziali. Le trovi con un doppio tocco su Missioni nella nav bar:")}
                <ul className="gm-list">
                  <li><b>{_t("Campagna Docce Fredde (30 gg):")}</b>{' '}{_t("Allena forza di volontà e resistenza mentale.")}</li>
                  <li><b>{_t("Campagna Digital Detox (7 gg):")}</b>{' '}{_t("Ripristina la concentrazione e riduce la dipendenza da smartphone.")}</li>
                  <li><b>{_t("Campagne Personalizzate:")}</b>{' '}{_t("Crea la tua avventura per qualsiasi tuo grande progetto di vita!")}</li>
                </ul>
              </Card>

              <Card title={_t("➕ Creazione Lampo")} color="#a78bfa">
                {_t("Hai un'idea al volo? Tieni premuto il pulsante Eroe al centro della nav bar e la nuova missione è già aperta. Nella creazione trovi anche le missioni degli ultimi 15 giorni, da ripetere con un tocco.")}
              </Card>

              <Tip color="#f59e0b">{_t("Suddividi i grandi progetti in sotto-missioni da massimo 25-30 minuti. Il cervello adora spuntare vittorie frequenti: l'inerzia positiva generata ti renderà inarrestabile.")}</Tip>
            </>
          )}

          {/* ===== CAPITOLO: NUTRIZIONE & SALUTE ===== */}
          {activeChapter === 'nutrition' && (
            <>
              <Hero
                icon="🥗" color="#ef4444"
                title={_t("Il Carburante del Tuo Avatar")}
                quote={_t("\"Il tuo corpo fisico è l'armatura con cui affronti il mondo reale: un guerriero d'élite non può combattere con carburante scadente.\"")}
              />

              <Card title={_t("🥩 I 3 Macro: I Mattoni della Tua Energia")} color="#f87171">
                {_t("Imposta i tuoi obiettivi nella scheda Salute e tienili d'occhio durante la giornata:")}
                <div className="gm-stack">
                  <div className="gm-chip-row" style={{ '--gm-c': '#ef4444' }}><b>{_t("🔴 Proteine (4 kcal/g):")}</b>{' '}{_t("Fondamentali per rigenerare la massa muscolare, accelerare il metabolismo e garantire sazietà prolungata.")}</div>
                  <div className="gm-chip-row" style={{ '--gm-c': '#eab308' }}><b>{_t("🟡 Carboidrati (4 kcal/g):")}</b>{' '}{_t("Il carburante primario per la concentrazione cerebrale e la potenza durante gli allenamenti.")}</div>
                  <div className="gm-chip-row" style={{ '--gm-c': '#38bdf8' }}><b>{_t("🔵 Grassi Buoni (9 kcal/g):")}</b>{' '}{_t("Il pilastro indispensabile per l'equilibrio ormonale, il cervello e la salute cellulare.")}</div>
                </div>
              </Card>

              <Card title={_t("🍽️ Mangiato Oggi & I Miei Cibi")} color="#38bdf8">
                {_t("Tocca l'anello delle calorie per aggiungere un pasto al volo o cercare un alimento online su Open Food Facts. In «Mangiato oggi» i tuoi ⭐ preferiti si aggiungono con un solo tocco; in «🍽️ I miei cibi» gestisci preferiti e archivio, e il tuo database cresce con te.")}
              </Card>

              <Pair>
                <Mini title={_t("⚡ Tocchi Rapidi")} color="#4ade80">
                  {_t("Fiamma: +100 kcal bruciate. Scarpa: +1.000 passi. Bicchiere: +0,2 L d'acqua.")}
                </Mini>
                <Mini title={_t("📷 Scanner delle Etichette")} color="#a78bfa">
                  {_t("Creando un nuovo cibo, inquadra la tabella nutrizionale: l'app legge calorie e macro al posto tuo.")}
                </Mini>
              </Pair>

              <Card title={_t("💍 La Tua Settimana")} color="#06b6d4" highlight>
                {_t("Sette anelli, uno per giorno, divisi in 4 spicchi: kcal in blu, proteine in giallo, acqua in azzurro e passi in verde. Ogni spicchio si illumina quando raggiungi l'obiettivo; con tutti e quattro arriva la ⭐ della giornata perfetta.")}
              </Card>

              <Card title={_t("🛒 Lista della Spesa")} color="#f59e0b">
                {_t("Doppio tocco su Salute nella nav bar: le voci si dividono da sole per reparto, così fai il giro del supermercato una volta sola. Tieni premuta una voce per spostarla in un altro reparto.")}
              </Card>

              <Tip color="#ef4444">{_t("Pesati sempre al mattino a digiuno, dopo essere andato in bagno. La costanza della misurazione batte l'ansia del singolo giorno: guarda la tendenza delle settimane, non il numero di oggi.")}</Tip>
            </>
          )}

          {/* ===== CAPITOLO: GESTI & SCORCIATOIE ===== */}
          {activeChapter === 'tricks' && (
            <>
              <Hero
                icon="👆" color="#a78bfa"
                title={_t("I Segreti dei Giocatori Esperti")}
                quote={_t("\"Ogni gioco che si rispetti ha i suoi passaggi segreti. Eccoli, avventuriero: ora sono tuoi.\"")}
              />

              <Card title={_t("👆👆 Doppio Tocco sulla Nav Bar")} color="#a78bfa">
                <ul className="gm-list">
                  <li><b>{_t("Missioni →")}</b>{' '}{_t("le tue Campagne.")}</li>
                  <li><b>{_t("Salute →")}</b>{' '}{_t("la Lista della spesa.")}</li>
                  <li><b>{_t("Opzioni →")}</b>{' '}{_t("il Tesoro, al riparo da occhi indiscreti.")}</li>
                </ul>
                {_t("Un tocco singolo ti riporta alla scheda principale.")}
              </Card>

              <Card title={_t("✋ Tieni Premuto")} color="#38bdf8">
                <ul className="gm-list">
                  <li><b>{_t("Pulsante Eroe:")}</b>{' '}{_t("crea subito una nuova missione.")}</li>
                  <li><b>{_t("Abitudini e missioni:")}</b>{' '}{_t("trascinale per cambiarne l'ordine.")}</li>
                  <li><b>{_t("Voci della spesa:")}</b>{' '}{_t("spostale in un altro reparto.")}</li>
                </ul>
              </Card>

              <Card title={_t("🎭 Il Tuo Eroe, a Modo Tuo")} color="#f59e0b">
                {_t("In Opzioni tocca la tua icona per cambiarla (anche con una foto) e il tuo nome per rinominare l'eroe; in 🎨 Aspetto scegli tema, modalità chiara o scura e colore dei dettagli. Ovunque vedi un'emoji, toccala per sceglierne un'altra.")}
              </Card>

              <Tip color="#a78bfa">{_t("Preferisci un'app più quieta? In Opzioni → 🎨 Aspetto puoi spegnere le animazioni: XP e medaglie restano, senza movimento.")}</Tip>
            </>
          )}

          {/* ===== CAPITOLO: DATI, BACKUP & PWA ===== */}
          {activeChapter === 'data' && (
            <>
              <Hero
                icon="💾" color="#8b5cf6"
                title={_t("Il Tuo Santuario Digitale Privato")}
                quote={_t("\"I tuoi progressi, i tuoi pensieri e i tuoi dati patrimoniali appartengono esclusivamente a te. Zero tracker, zero server terzi.\"")}
              />

              <Card title={_t("🔒 Sovranità Assoluta dei Tuoi Dati")} color="#a78bfa">
                {_t("Quest Life è concepita con filosofia")}{' '}<b>{_t("Local-First")}</b>:
                <ul className="gm-list">
                  <li><b>{_t("100% Offline:")}</b>{' '}{_t("L'applicazione risiede nella memoria del tuo browser (IndexedDB) e funziona ovunque, anche in modalità aereo.")}</li>
                  <li><b>{_t("Backup in un tocco:")}</b>{' '}{_t("In Opzioni → 💾 Dati e backup esporti il file completo dei tuoi dati, da custodire nel cloud, inviarti per mail o importare su un altro dispositivo.")}</li>
                  <li><b>{_t("Collegamento Database Locale (PC/Mac):")}</b>{' '}{_t("Tramite File System Access API puoi salvare un file direttamente nella cartella del computer: ogni modifica si salverà in tempo reale su disco.")}</li>
                </ul>
              </Card>

              <Card title={_t("🛡️ Due Regole d'Oro su iPhone")} color="#f59e0b" highlight>
                <ul className="gm-list">
                  <li><b>{_t("Usa sempre l'icona sulla Home:")}</b>{' '}{_t("Safari e l'app installata hanno memorie separate, quindi i progressi fatti in uno non si vedono nell'altro.")}</li>
                  <li><b>{_t("Non eliminare l'icona di Quest Life:")}</b>{' '}{_t("iOS cancellerebbe anche i tuoi dati. Se devi reinstallarla, esporta prima un backup e importalo nella nuova.")}</li>
                </ul>
              </Card>

              <Pair>
                <Mini title={_t("🔓 Modifica Avanzata")} color="#fbbf24">
                  {_t("Tocca «🔒 Avanzata» accanto al tuo nome in Opzioni per correggere a mano saldi, spesa, cibi e storico. Spegnila quando hai finito.")}
                </Mini>
                <Mini title={_t("🚀 Aggiornamenti")} color="#38bdf8">
                  {_t("Quando esce una nuova versione compare «Aggiorna App» in Opzioni → 📖 Guida e info: i tuoi dati restano al sicuro.")}
                </Mini>
              </Pair>

              <Card title={_t("📱 Installazione come App Nativa (PWA)")} color="#38bdf8">
                {_t("Puoi installare Quest Life senza passare dagli store:")}
                <ul className="gm-list">
                  <li><b>{_t("Su iPhone / iPad (Safari):")}</b>{' '}{_t("tocca il pulsante Condividi (quadrato con freccia in alto) e scegli «Aggiungi alla schermata Home».")}</li>
                  <li><b>{_t("Su Android (Chrome):")}</b>{' '}{_t("tocca i tre puntini in alto a destra e scegli «Installa applicazione» (o «Aggiungi a schermata Home»).")}</li>
                </ul>
              </Card>

              <Tip color="#8b5cf6">{_t("Prendi la sana abitudine di esportare un file di backup ogni domenica sera durante il tuo review settimanale. Pochi secondi per custodire anni di crescita personale.")}</Tip>
            </>
          )}

          {/* ===== CAPITOLO: FINANZE & ETF ===== */}
          {activeChapter === 'finances' && (
            <>
              <Hero
                icon="💰" color="#f59e0b"
                title={_t("Costruisci la Tua Fortezza Economica")}
                quote={_t("\"Nessun avventuriero è davvero libero se è schiavo del disordine economico. La disciplina finanziaria è la tua armatura più solida.\"")}
              />

              <Card title={_t("🗝️ Come Accedere: La Finestra Nascosta del Tesoro")} color="#fbbf24" highlight>
                {_t("Perché la scheda Finanze non è visibile tra le normali linguette in basso? Perché quando usi l'app in pubblico, sui mezzi o in ufficio, nessuno deve sbirciare il tuo saldo o i tuoi investimenti.")}
                <ul className="gm-list">
                  <li>👉 <b>{_t("Doppio tocco rapido su \"Opzioni\" (⚙️):")}</b>{' '}{_t("Nella barra di navigazione in basso a destra, fai due tocchi rapidi su Opzioni: si aprirà istantaneamente la schermata segreta")}{' '}<b>{_t("Tesoro & Finanze (💰)")}</b>.</li>
                  <li>👉 <b>{_t("Un tocco singolo:")}</b>{' '}{_t("Ti riporta immediatamente alle Opzioni normali.")}</li>
                </ul>
              </Card>

              <Card title={_t("🏛️ I 4 Pilastri del Patrimonio")} color="#f59e0b">
                <ul className="gm-list">
                  <li><b>{_t("💳 Conto Base:")}</b>{' '}{_t("Il conto per la vita di tutti i giorni.")}</li>
                  <li><b>{_t("💵 Contanti:")}</b>{' '}{_t("La liquidità fisica nel portafoglio.")}</li>
                  <li><b>{_t("🏦 Conti Secondari & Deposito:")}</b>{' '}{_t("Conti vincolati o svincolati con tasso di interesse annuo calcolato in tempo reale!")}</li>
                  <li><b>{_t("📈 Investimenti & PAC:")}</b>{' '}{_t("Valore totale calcolato dal prezzo delle quote moltiplicato per i titoli posseduti.")}</li>
                </ul>
                {_t("Tocca un conto per aprire la sua carta: movimenti del mese raggruppati per giorno, ricorrenti, budget e trasferimenti.")}
              </Card>

              {/* Cloudflare Workers */}
              <div className="gm-card gm-card--hl" style={{ '--gm-c': '#38bdf8' }}>
                <div className="gm-row-between">
                  <b className="gm-card-title">⚡ {_t("Guida Cloudflare Workers per Aggiornamento ETF")}</b>
                  <button type="button" className={`gm-copy${copiedCode ? ' is-done' : ''}`} onClick={handleCopyWorkerCode}>
                    <span>{copiedCode ? '✓' : '📋'}</span>
                    <span>{copiedCode ? _t("Codice Copiato!") : _t("Copia Codice Worker")}</span>
                  </button>
                </div>
                <div className="gm-card-body">
                  <b>{_t("Perché serve?")}</b>{' '}{_t("I browser mobili impediscono per sicurezza di contattare direttamente Yahoo Finance (blocco CORS). Con un tuo Worker personale gratuito su Cloudflare (100.000 richieste al giorno gratis!), ottieni quotazioni aggiornate al millesimo in totale autonomia.")}
                </div>
                <div className="gm-steps">
                  <b>{_t("📝 I 4 Passaggi Semplici su Cloudflare:")}</b>
                  <div><b>{_t("1. Crea il Worker:")}</b>{' '}{_t("Vai su")}{' '}<a href="https://dash.cloudflare.com" target="_blank" rel="noreferrer">{_t("dash.cloudflare.com")}</a> &gt; <i>{_t("Workers & Pages")}</i> &gt; <i>{_t("Create Application")}</i> &gt; <b>{_t("Hello World")}</b> &gt; <b>{_t("Deploy")}</b>.</div>
                  <div><b>{_t("2. Modifica il codice:")}</b>{' '}{_t("Clicca sul pulsante")}{' '}<b>{_t("\"Edit code\"")}</b>{' '}{_t("in alto a destra.")}</div>
                  <div><b>{_t("3. Incolla il codice:")}</b>{' '}{_t("Nel file")}{' '}<code>worker.js</code>{' '}{_t("a sinistra, cancella tutto e premi il tasto sopra")}{' '}<b>{_t("\"Copia Codice Worker\"")}</b>{_t(", quindi incollalo nell'editor. Clicca")}{' '}<b>{_t("Deploy")}</b>.</div>
                  <div><b>{_t("4. Collega a Quest Life:")}</b>{' '}{_t("Copia l'indirizzo del tuo Worker (es.")}{' '}<code>https://nome-worker.tuonome.workers.dev</code>{_t("), entra nel Tesoro di Quest Life, tocca il fulmine")}{' '}<b>⚡</b>{' '}{_t("accanto ad")}{' '}<i>{_t("Aggiorna Prezzi")}</i>{' '}{_t("e incollalo nel campo")}{' '}<b>{_t("Proxy Personale")}</b>{_t(". Fatto!")}</div>
                </div>
                <div>
                  <div className="gm-row-between" style={{ marginBottom: '4px' }}>
                    <span className="gm-code-label">{_t("Codice Completo per worker.js:")}</span>
                    <button type="button" className="gm-link" onClick={handleCopyWorkerCode}>{copiedCode ? _t("Copiato!") : _t("Copia codice")}</button>
                  </div>
                  <pre className="gm-code">{CLOUDFLARE_WORKER_CODE}</pre>
                </div>
                <div className="gm-chip-row" style={{ '--gm-c': '#eab308' }}>
                  <b style={{ color: '#fbbf24' }}>{_t("💡 Suffissi Borse per Yahoo Finance:")}</b>
                  <div style={{ marginTop: '4px' }}>
                    {_t("Yahoo richiede il suffisso della borsa su cui è quotato lo strumento:")}
                    <ul className="gm-list">
                      <li><b>{_t("Borsa Italiana (Milano):")}</b>{' '}{_t("aggiungi")}{' '}<code>.MI</code>{' '}{_t("(es.")}{' '}<code>SWDA.MI</code>, <code>CSSPX.MI</code>, <code>LCWD.MI</code>, <code>SMEA.MI</code>)</li>
                      <li><b>{_t("Xetra (Germania):")}</b>{' '}{_t("aggiungi")}{' '}<code>.DE</code>{' '}{_t("(es.")}{' '}<code>VWCE.DE</code>, <code>EUNL.DE</code>, <code>IS3N.DE</code>)</li>
                      <li><b>{_t("Azioni USA:")}</b>{' '}{_t("senza suffisso (es.")}{' '}<code>AAPL</code>, <code>MSFT</code>, <code>NVDA</code>)</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Tip color="#f59e0b">{_t("Il segreto della ricchezza non è prevedere il mercato, ma la costanza dell'accumulo. Tratta i tuoi investimenti come una missione a lungo termine: lascia che il tempo e l'interesse composto combattano al tuo fianco.")}</Tip>
            </>
          )}
        </div>

        {/* Chiusura: barra in fondo, come nelle altre finestre */}
        <div className="gm-foot">
          <button type="button" className="gm-close" onClick={onClose}>{_t("Torna all'avventura")}</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
