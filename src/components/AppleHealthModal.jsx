import React, { useState } from 'react';

export default function AppleHealthModal({
  isOpen,
  onClose,
  onSyncFromClipboard,
  currentSteps = 0,
  currentBurned = 0,
  habits = []
}) {
  const [activeTab, setActiveTab] = useState('duolingo'); // 'duolingo' | 'health' | 'test'
  const [copiedKey, setCopiedKey] = useState(null);
  const [testSteps, setTestSteps] = useState('8500');
  const [testBurned, setTestBurned] = useState('420');
  const [testHabit, setTestHabit] = useState('Duolingo');
  const [syncStatus, setSyncStatus] = useState(null);

  if (!isOpen) return null;

  const baseUrl = typeof window !== 'undefined' 
    ? (window.location.origin + window.location.pathname).replace(/\/+$/, '') + '/'
    : 'https://geko990.github.io/quest-life/';

  // Schema speciale webapp:// per aprire direttamente la Web App salvata sulla schermata Home invece di Safari
  const webappBaseUrl = baseUrl.replace(/^https?:\/\//, 'webapp://');
  
  const sampleWebappHabitUrl = `${webappBaseUrl}?habit=Duolingo`;
  const sampleHttpHabitUrl = `${baseUrl}?habit=Duolingo`;
  const sampleWebappHealthUrl = `${webappBaseUrl}?steps=[SommaPassi]&burned=[SommaCalorie]`;
  const sampleHttpHealthUrl = `${baseUrl}?steps=[SommaPassi]&burned=[SommaCalorie]`;

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleManualSyncClipboard = async () => {
    try {
      if (!navigator.clipboard?.readText) {
        setSyncStatus({ type: 'error', text: 'Lettura appunti non supportata dal browser.' });
        return;
      }
      const text = await navigator.clipboard.readText();
      if (!text || text.trim() === '') {
        setSyncStatus({ type: 'error', text: 'Gli appunti sono vuoti. Copia prima i dati dal comando rapido!' });
        return;
      }
      const res = onSyncFromClipboard(text);
      if (res && res.success) {
        setSyncStatus({ type: 'success', text: `✓ Sincronizzato con successo: ${res.actions.join(', ')}` });
      } else {
        setSyncStatus({ type: 'error', text: 'Nessun parametro valido trovato negli appunti (?habit=... o ?steps=...).' });
      }
    } catch (err) {
      setSyncStatus({ type: 'error', text: 'Permesso appunti negato o tocco non registrato da iOS.' });
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
        background: 'rgba(0,0,0,0.78)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
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
          border: '1px solid var(--glass-border, rgba(255,255,255,0.12))',
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
                Apri direttamente la PWA della Home Screen e sincronizza le attività
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
            onClick={() => setActiveTab('test')}
            style={{
              flex: 0.7,
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
          
          {/* TAB 1: DUOLINGO AUTOMATION */}
          {activeTab === 'duolingo' && (
            <>
              {/* Box Spiegazione iOS Home vs Browser */}
              <div style={{ background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)', padding: '10px 12px', borderRadius: '10px', fontSize: '10.5px', color: '#fef08a', lineHeight: '1.45' }}>
                ⚠️ <strong>Perché iOS ha aperto Safari invece della PWA salvata sulla Home?</strong>
                <br />
                I link standard che iniziano con <code>https://</code> vengono associati da Apple al browser Safari. Per aprire la tua <strong>PWA della Home Screen</strong> a schermo intero hai <strong>due metodi fantastici</strong>:
              </div>

              {/* METODO A: webapp:// */}
              <div style={{ background: 'var(--bg-secondary, #1a1b2e)', padding: '12px', borderRadius: '10px', fontSize: '11px', lineHeight: '1.5', color: 'var(--text-secondary, #cbd5e1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#4ade80', fontWeight: 'bold', fontSize: '12px' }}>
                    Metodo 1: Il trucco "webapp://" (Apertura Diretta)
                  </span>
                  <span style={{ fontSize: '9px', background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                    CONSIGLIATO
                  </span>
                </div>
                <p style={{ margin: '0 0 8px 0', fontSize: '10.5px' }}>
                  Sostituisci l'URL nella tua azione <strong>Apri URL</strong> con lo schema <code>webapp://</code>:
                </p>
                <div style={{ margin: '6px 0', background: 'rgba(0,0,0,0.5)', padding: '8px 10px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '10px', wordBreak: 'break-all', color: '#86efac', border: '1px solid rgba(74, 222, 128, 0.3)' }}>
                  {sampleWebappHabitUrl}
                </div>
                <button
                  onClick={() => handleCopy(sampleWebappHabitUrl, 'webapp_duo')}
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    marginTop: '4px',
                    borderRadius: '6px',
                    background: '#22c55e',
                    border: 'none',
                    color: '#fff',
                    fontSize: '11px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  {copiedKey === 'webapp_duo' ? '✓ Link webapp:// Copiato!' : '📋 Copia Link webapp:// per Duolingo'}
                </button>
                <p style={{ margin: '6px 0 0 0', fontSize: '9.5px', color: 'var(--text-muted, #94a3b8)' }}>
                  * Su iOS, <code>webapp://</code> dice al sistema di lanciare direttamente la Web App a schermo intero presente sulla schermata Home!
                </p>
              </div>

              {/* METODO B: Appunti + Apri App */}
              <div style={{ background: 'var(--bg-secondary, #1a1b2e)', padding: '12px', borderRadius: '10px', fontSize: '11px', lineHeight: '1.5', color: 'var(--text-secondary, #cbd5e1)' }}>
                <span style={{ color: '#c084fc', fontWeight: 'bold', fontSize: '12px' }}>
                  Metodo 2: Appunti + "Apri app" (Infallibile al 100%)
                </span>
                <p style={{ margin: '6px 0 8px 0', fontSize: '10.5px' }}>
                  Se preferisci non usare URL nel comando rapido:
                </p>
                <ol style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '10.5px' }}>
                  <li>Azione 1: <strong>Testo</strong> &rarr; scrivi <code>?habit=Duolingo</code></li>
                  <li>Azione 2: <strong>Copia negli appunti</strong> (il testo sopra).</li>
                  <li>Azione 3: <strong>Apri app</strong> &rarr; seleziona <strong>Quest Life</strong> (la tua app sulla Home).</li>
                  <li>Quando Quest Life si apre, tocca il pulsante <strong>🍎 Sync</strong> in basso a destra per confermare!</li>
                </ol>
              </div>
            </>
          )}

          {/* TAB 2: PASSI E CALORIE */}
          {activeTab === 'health' && (
            <>
              <div style={{ background: 'var(--bg-secondary, #1a1b2e)', padding: '12px', borderRadius: '10px', fontSize: '11px', lineHeight: '1.5', color: 'var(--text-secondary, #cbd5e1)' }}>
                <p style={{ margin: '0 0 8px 0', color: 'var(--text-primary, #fff)', fontWeight: 'bold' }}>
                  🎯 Creazione Comando Rapido per Passi & Calorie:
                </p>
                <ol style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '10.5px' }}>
                  <li>Apri l'app <strong>Comandi Rapidi</strong> su iPhone e tocca <strong>+</strong> in alto a destra.</li>
                  <li>
                    Aggiungi: <strong>"Trova campioni di salute"</strong> (Passi, oggi) &rarr; poi <strong>"Calcola statistica"</strong> (Somma).
                  </li>
                  <li>
                    Aggiungi: <strong>"Trova campioni di salute"</strong> (Energia attiva, oggi) &rarr; poi <strong>"Calcola statistica"</strong> (Somma).
                  </li>
                  <li>
                    Aggiungi: <strong>"Testo"</strong> e componi il link con <strong>webapp://</strong>:
                    <div style={{ margin: '6px 0', background: 'rgba(0,0,0,0.5)', padding: '6px 8px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '10px', wordBreak: 'break-all', color: '#c084fc', border: '1px solid rgba(192, 132, 252, 0.3)' }}>
                      {sampleWebappHealthUrl}
                    </div>
                    <em>(Tocca e sostituisci i campi con le due variabili Somma calcolate)</em>
                  </li>
                  <li>
                    Aggiungi azione: <strong>"Apri URL"</strong> e collega il Testo.
                  </li>
                </ol>

                <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleCopy(sampleWebappHealthUrl, 'health_webapp')}
                    style={{
                      flex: 1,
                      padding: '7px 10px',
                      borderRadius: '6px',
                      background: 'var(--accent-primary, #8b5cf6)',
                      border: 'none',
                      color: '#fff',
                      fontSize: '11px',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    {copiedKey === 'health_webapp' ? '✓ Copiato!' : '📋 Copia Modello webapp://'}
                  </button>
                  <button
                    onClick={() => handleCopy(sampleHttpHealthUrl, 'health_http')}
                    style={{
                      padding: '7px 10px',
                      borderRadius: '6px',
                      background: 'var(--bg-primary, #12131e)',
                      border: '1px solid var(--glass-border, rgba(255,255,255,0.1))',
                      color: 'var(--text-secondary, #94a3b8)',
                      fontSize: '11px',
                      cursor: 'pointer'
                    }}
                  >
                    {copiedKey === 'health_http' ? '✓ Copiato!' : 'Copia https://'}
                  </button>
                </div>
              </div>

              <div style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)', padding: '10px 12px', borderRadius: '8px', fontSize: '10px', color: '#c4b5fd' }}>
                💡 <strong>Sincronizzazione Giornaliera Automatica:</strong> Nella scheda <em>Automazioni</em> di Comandi Rapidi, puoi creare un'automazione "Ora del giorno" (es. ogni sera alle 23:00) per eseguire questo comando in automatico senza toccare nulla!
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
