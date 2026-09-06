import React, { useState } from 'react';

export default function AppleHealthModal({
  isOpen,
  onClose,
  onSyncFromClipboard,
  currentSteps = 0,
  currentBurned = 0,
  habits = []
}) {
  const [activeTab, setActiveTab] = useState('health'); // 'health' | 'duolingo' | 'test'
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [testSteps, setTestSteps] = useState('8500');
  const [testBurned, setTestBurned] = useState('420');
  const [testHabit, setTestHabit] = useState('Duolingo');
  const [syncStatus, setSyncStatus] = useState(null);

  if (!isOpen) return null;

  const baseUrl = typeof window !== 'undefined' 
    ? (window.location.origin + window.location.pathname).replace(/\/+$/, '') + '/'
    : 'https://geko990.github.io/quest-life/';

  const sampleHealthUrl = `${baseUrl}?steps=[SommaPassi]&burned=[SommaCalorie]`;
  const sampleHabitUrl = `${baseUrl}?habit=Duolingo`;

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleManualSyncClipboard = async () => {
    try {
      if (!navigator.clipboard?.readText) {
        setSyncStatus({ type: 'error', text: 'Lettura appunti non supportata dal browser.' });
        return;
      }
      const text = await navigator.clipboard.readText();
      if (!text || text.trim() === '') {
        setSyncStatus({ type: 'error', text: 'Gli appunti sono vuoti.' });
        return;
      }
      const res = onSyncFromClipboard(text);
      if (res && res.success) {
        setSyncStatus({ type: 'success', text: `Sincronizzato con successo: ${res.actions.join(', ')}` });
      } else {
        setSyncStatus({ type: 'error', text: 'Nessun dato di sync valido trovato negli appunti.' });
      }
    } catch (err) {
      setSyncStatus({ type: 'error', text: 'Permesso appunti negato o errore nella lettura.' });
    }
  };

  const handleExecuteTest = () => {
    const query = `?steps=${testSteps}&burned=${testBurned}&habit=${encodeURIComponent(testHabit)}`;
    const res = onSyncFromClipboard(query);
    if (res && res.success) {
      setSyncStatus({ type: 'success', text: `Test completato! ${res.actions.join(' | ')}` });
    } else {
      setSyncStatus({ type: 'error', text: 'Nessuna modifica applicata nel test.' });
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-primary, #12131e)',
          border: '1px solid var(--glass-border, rgba(255,255,255,0.1))',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '520px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 16px',
            borderBottom: '1px solid var(--glass-border, rgba(255,255,255,0.08))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-secondary, #1a1b2e)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>🍎</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: 'var(--text-primary, #fff)' }}>
                Apple Salute & Automazioni iOS
              </h3>
              <p style={{ margin: 0, fontSize: '10px', color: 'var(--text-secondary, #94a3b8)' }}>
                Sincronizza passi, calorie e spunta abitudini con Comandi Rapidi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary, #94a3b8)',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '4px 8px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Quick Sync Button */}
        <div style={{ padding: '12px 16px 0 16px' }}>
          <button
            onClick={handleManualSyncClipboard}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
              color: '#fff',
              border: 'none',
              fontWeight: 'bold',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(236, 72, 153, 0.3)'
            }}
          >
            <span>📋</span>
            <span>Incolla e Sincronizza ora dagli Appunti</span>
          </button>

          {syncStatus && (
            <div
              style={{
                marginTop: '8px',
                padding: '8px 10px',
                borderRadius: '8px',
                fontSize: '11px',
                lineHeight: '1.4',
                background: syncStatus.type === 'success' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                border: `1px solid ${syncStatus.type === 'success' ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                color: syncStatus.type === 'success' ? '#4ade80' : '#f87171'
              }}
            >
              {syncStatus.text}
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--glass-border, rgba(255,255,255,0.08))',
            margin: '12px 16px 0 16px',
            gap: '8px'
          }}
        >
          <button
            onClick={() => setActiveTab('health')}
            style={{
              flex: 1,
              padding: '8px 4px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'health' ? '2px solid #8b5cf6' : '2px solid transparent',
              color: activeTab === 'health' ? '#fff' : 'var(--text-secondary, #94a3b8)',
              fontWeight: activeTab === 'health' ? 'bold' : 'normal',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            👟 Passi & Calorie
          </button>
          <button
            onClick={() => setActiveTab('duolingo')}
            style={{
              flex: 1,
              padding: '8px 4px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'duolingo' ? '2px solid #22c55e' : '2px solid transparent',
              color: activeTab === 'duolingo' ? '#fff' : 'var(--text-secondary, #94a3b8)',
              fontWeight: activeTab === 'duolingo' ? 'bold' : 'normal',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            🦉 Automazione Duolingo
          </button>
          <button
            onClick={() => setActiveTab('test')}
            style={{
              flex: 0.8,
              padding: '8px 4px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'test' ? '2px solid #eab308' : '2px solid transparent',
              color: activeTab === 'test' ? '#fff' : 'var(--text-secondary, #94a3b8)',
              fontWeight: activeTab === 'test' ? 'bold' : 'normal',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            🧪 Test Link
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* TAB 1: PASSI E CALORIE */}
          {activeTab === 'health' && (
            <>
              <div style={{ background: 'var(--bg-secondary, #1a1b2e)', padding: '12px', borderRadius: '10px', fontSize: '11px', lineHeight: '1.5', color: 'var(--text-secondary, #cbd5e1)' }}>
                <p style={{ margin: '0 0 8px 0', color: 'var(--text-primary, #fff)', fontWeight: 'bold' }}>
                  🎯 Come creare il Comando Rapido su iPhone:
                </p>
                <ol style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <li>Apri l'app nativa <strong>Comandi Rapidi</strong> su iPhone e tocca il <strong>+</strong> in alto a destra.</li>
                  <li>
                    Aggiungi azione: <strong>"Trova campioni di salute"</strong>
                    <br />• Imposta tipo: <em>Passi</em> | Data di inizio: <em>è oggi</em>
                  </li>
                  <li>
                    Aggiungi azione: <strong>"Calcola statistica"</strong>
                    <br />• Funzione: <em>Somma</em> di <em>Campioni di salute</em>
                  </li>
                  <li>
                    Aggiungi seconda azione: <strong>"Trova campioni di salute"</strong>
                    <br />• Imposta tipo: <em>Energia attiva</em> | Data di inizio: <em>è oggi</em>
                  </li>
                  <li>
                    Aggiungi azione: <strong>"Calcola statistica"</strong>
                    <br />• Funzione: <em>Somma</em> dei nuovi campioni
                  </li>
                  <li>
                    Aggiungi azione: <strong>"Testo"</strong> e componi l'URL:
                    <div style={{ margin: '6px 0', background: 'rgba(0,0,0,0.4)', padding: '6px 8px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '10px', wordBreak: 'break-all', color: '#a78bfa' }}>
                      {sampleHealthUrl}
                    </div>
                    <em>(Sostituisci i campi [Somma...] con le variabili delle due statistiche calcolate)</em>
                  </li>
                  <li>
                    Aggiungi azione: <strong>"Apri URL"</strong> e seleziona il Testo sopra.
                  </li>
                </ol>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleCopy(baseUrl + '?steps=')}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'var(--bg-secondary, #1a1b2e)',
                    border: '1px solid var(--glass-border, rgba(255,255,255,0.1))',
                    color: 'var(--text-primary, #fff)',
                    fontSize: '11px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  {copiedUrl ? '✓ Copiato!' : '📋 Copia URL Base'}
                </button>
              </div>

              <div style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)', padding: '10px 12px', borderRadius: '8px', fontSize: '10px', color: '#c4b5fd' }}>
                💡 <strong>Suggerimento Pro:</strong> Nella scheda <em>Automazioni</em> di Comandi Rapidi, puoi creare un'automazione "Ora del giorno" (es. ogni sera alle 23:00) per eseguire questo comando in automatico senza toccare nulla!
              </div>
            </>
          )}

          {/* TAB 2: DUOLINGO AUTOMATION */}
          {activeTab === 'duolingo' && (
            <>
              <div style={{ background: 'var(--bg-secondary, #1a1b2e)', padding: '12px', borderRadius: '10px', fontSize: '11px', lineHeight: '1.5', color: 'var(--text-secondary, #cbd5e1)' }}>
                <p style={{ margin: '0 0 8px 0', color: '#4ade80', fontWeight: 'bold' }}>
                  🦉 Automazione per Duolingo (o altra app):
                </p>
                <ol style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <li>
                    Apri l'app <strong>Comandi Rapidi</strong> e vai nella scheda <strong>Automazioni</strong> (in basso al centro).
                  </li>
                  <li>
                    Tocca <strong>+</strong> in alto a destra (o <em>Crea automazione personale</em>).
                  </li>
                  <li>
                    Seleziona l'evento <strong>"App"</strong> dalla lista.
                  </li>
                  <li>
                    Accanto ad App tocca <em>Scegli</em> e seleziona <strong>Duolingo</strong>.
                  </li>
                  <li>
                    Scegli la condizione:
                    <br />
                    • <strong>"È chiusa"</strong> (scelta migliore: si attiva non appena finisci la tua lezione e chiudi Duolingo)
                    <br />
                    • Oppure <em>"È aperta"</em> (se preferisci che si spunti subito all'avvio).
                  </li>
                  <li>
                    Seleziona <strong>"Esegui immediatamente"</strong> e disattiva <em>"Chiedi prima di eseguire"</em>.
                  </li>
                  <li>
                    Premi <em>Avanti</em>, scegli <strong>Nuova azione rapida vuota</strong> e aggiungi:
                    <br />
                    • Azione: <strong>"Apri URL"</strong>
                    <br />
                    • Inserisci l'URL:
                    <div style={{ margin: '6px 0', background: 'rgba(0,0,0,0.4)', padding: '6px 8px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '10px', wordBreak: 'break-all', color: '#4ade80' }}>
                      {sampleHabitUrl}
                    </div>
                  </li>
                  <li>Tocca <strong>Fine</strong>. Fatto!</li>
                </ol>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleCopy(sampleHabitUrl)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: '#22c55e',
                    border: 'none',
                    color: '#fff',
                    fontSize: '11px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  {copiedUrl ? '✓ Link Duolingo Copiato!' : '📋 Copia Link Diretto per Duolingo'}
                </button>
              </div>

              <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', padding: '10px 12px', borderRadius: '8px', fontSize: '10px', color: '#86efac' }}>
                ✨ <strong>Come funziona la spunta:</strong> Quest Life cerca tra le tue abitudini un'abitudine che si chiama "Duolingo" (o che contiene "duolingo", non fa differenza maiuscole/minuscole). Se non l'hai ancora creata, creala nella scheda <strong>Abitudini</strong>!
              </div>
            </>
          )}

          {/* TAB 3: TEST LINK */}
          {activeTab === 'test' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary, #94a3b8)' }}>
                Verifica subito il comportamento simulando i dati ricevuti da iOS:
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '10px', color: 'var(--text-secondary, #94a3b8)', display: 'block', marginBottom: '4px' }}>
                    👟 Passi
                  </label>
                  <input
                    type="number"
                    value={testSteps}
                    onChange={e => setTestSteps(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      border: '1px solid var(--glass-border, rgba(255,255,255,0.15))',
                      background: 'var(--bg-secondary, #1a1b2e)',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '10px', color: 'var(--text-secondary, #94a3b8)', display: 'block', marginBottom: '4px' }}>
                    🔥 Calorie Bruciate
                  </label>
                  <input
                    type="number"
                    value={testBurned}
                    onChange={e => setTestBurned(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      border: '1px solid var(--glass-border, rgba(255,255,255,0.15))',
                      background: 'var(--bg-secondary, #1a1b2e)',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '10px', color: 'var(--text-secondary, #94a3b8)', display: 'block', marginBottom: '4px' }}>
                  🦉 Nome Abitudine da Completare
                </label>
                <input
                  type="text"
                  value={testHabit}
                  onChange={e => setTestHabit(e.target.value)}
                  placeholder="Es. Duolingo"
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    borderRadius: '6px',
                    border: '1px solid var(--glass-border, rgba(255,255,255,0.15))',
                    background: 'var(--bg-secondary, #1a1b2e)',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
              </div>

              <button
                onClick={handleExecuteTest}
                style={{
                  marginTop: '6px',
                  padding: '9px',
                  borderRadius: '8px',
                  background: 'var(--accent-primary, #8b5cf6)',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 'bold',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                🚀 Simula Sincronizzazione Adesso
              </button>

              <div style={{ marginTop: '4px', fontSize: '10px', color: 'var(--text-secondary, #94a3b8)' }}>
                Valori attuali nell'app: <strong>{currentSteps.toLocaleString()}</strong> passi | <strong>{currentBurned}</strong> kcal bruciate.
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div
          style={{
            padding: '10px 16px',
            borderTop: '1px solid var(--glass-border, rgba(255,255,255,0.08))',
            background: 'var(--bg-secondary, #1a1b2e)',
            display: 'flex',
            justifyContent: 'flex-end'
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              background: 'var(--bg-primary, #12131e)',
              border: '1px solid var(--glass-border, rgba(255,255,255,0.1))',
              color: 'var(--text-primary, #fff)',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}
