import React from 'react';
import { logAppError, formatErrorsForClipboard } from '../utils/errorLogger';
import { APP_VERSION } from '../utils/constants';

export default class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("[RootErrorBoundary] Uncaught Application Error:", error, errorInfo);
    logAppError(error, {
      type: 'react_root_error_boundary',
      componentStack: errorInfo?.componentStack || ''
    });
  }

  handleCopyDetails = () => {
    try {
      const details = formatErrorsForClipboard(APP_VERSION);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(details);
        this.setState({ copied: true });
        setTimeout(() => this.setState({ copied: false }), 3000);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = details;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        this.setState({ copied: true });
        setTimeout(() => this.setState({ copied: false }), 3000);
      }
    } catch (e) {
      alert("Impossibile copiare automaticamente. Seleziona il testo dell'errore.");
    }
  };

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const errMsg = this.state.error?.message || String(this.state.error || 'Errore imprevisto di esecuzione');
      const errStack = this.state.error?.stack || this.state.errorInfo?.componentStack || '';

      return (
        <div style={{
          minHeight: '100dvh',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 16px',
          background: '#0b0b14',
          color: '#f8fafc',
          boxSizing: 'border-box',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          textAlign: 'center'
        }}>
          <div style={{
            maxWidth: '440px',
            width: '100%',
            background: 'rgba(23, 23, 38, 0.95)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
            borderRadius: '24px',
            padding: '28px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '14px'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '2px solid rgba(239, 68, 68, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px'
            }}>
              ⚠️
            </div>

            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#ffffff' }}>
              Si è verificato un errore
            </h2>

            <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
              L'applicazione ha intercettato un problema per evitare la chiusura improvvisa.
              I tuoi dati sono al sicuro nel database locale.
            </p>

            <div style={{
              width: '100%',
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '12px',
              textAlign: 'left',
              maxHeight: '140px',
              overflowY: 'auto',
              boxSizing: 'border-box'
            }}>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#ef4444', wordBreak: 'break-word' }}>
                {errMsg}
              </div>
              {errStack && (
                <pre style={{ margin: '8px 0 0 0', fontSize: '9px', color: '#64748b', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'monospace' }}>
                  {errStack.split('\n').slice(0, 4).join('\n')}
                </pre>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', width: '100%', marginTop: '6px' }}>
              <button
                onClick={this.handleCopyDetails}
                style={{
                  flex: 1,
                  padding: '12px 10px',
                  borderRadius: '12px',
                  background: this.state.copied ? '#10b981' : 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {this.state.copied ? '✅ Copiato!' : '📋 Copia Errore'}
              </button>

              <button
                onClick={this.handleReload}
                style={{
                  flex: 1,
                  padding: '12px 10px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(124, 58, 237, 0.4)'
                }}
              >
                🔄 Ricarica App
              </button>
            </div>

            <span style={{ fontSize: '10px', color: '#64748b' }}>
              RPG Life v{APP_VERSION}
            </span>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
