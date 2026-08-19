import React from 'react';

export default function MedalCelebrationModal({ medal, starCounts, onClose, onViewDetails }) {
  if (!medal) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(135deg, rgba(30, 30, 45, 0.98), rgba(15, 15, 25, 0.99))',
          border: '2px solid rgba(245, 158, 11, 0.6)',
          borderRadius: '24px',
          boxShadow: '0 0 40px rgba(245, 158, 11, 0.35)',
          padding: '28px 24px',
          maxWidth: '360px',
          width: '100%',
          textAlign: 'center',
          color: '#fff',
          animation: 'medalPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}
      >
        {/* Animated Glow Badge */}
        <div style={{ position: 'relative', width: '90px', height: '90px', margin: '0 auto 16px auto' }}>
          <div
            style={{
              position: 'absolute',
              inset: '-10px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(245,158,11,0.6) 0%, rgba(245,158,11,0) 70%)',
              animation: 'pulseGlow 2s infinite ease-in-out'
            }}
          />
          <div
            style={{
              width: '90px',
              height: '90px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              border: '3px solid #fbbf24',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '48px',
              boxShadow: '0 8px 20px rgba(245, 158, 11, 0.4)',
              position: 'relative',
              zIndex: 1
            }}
          >
            {medal.icon || '🏅'}
          </div>
        </div>

        <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
          🏆 MEDAGLIA MENSILE CONQUISTATA!
        </div>

        <h2 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 8px 0', color: '#ffffff' }}>
          {medal.name}
        </h2>

        <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.4', marginBottom: '20px' }}>
          Congratulazioni! Hai completato la sfida mensile superando la Piramide delle Difficoltà!
        </p>

        {/* Pyramid Achievement Summary Card */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '16px',
            padding: '12px 14px',
            marginBottom: '24px',
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#fbbf24', textTransform: 'uppercase', marginBottom: '2px' }}>
            📊 REQUISITI SODDISFATTI
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
            <span style={{ color: '#e2e8f0' }}>🎯 Task Totali (50 richiesti):</span>
            <span style={{ fontWeight: 'bold', color: '#22c55e' }}>{medal.totalCompleted || 50}/50 ✓</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
            <span style={{ color: '#e2e8f0' }}>⭐ 5x Task da 3 Stelle:</span>
            <span style={{ fontWeight: 'bold', color: '#22c55e' }}>{starCounts?.[3] || 5}/5 ✓</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
            <span style={{ color: '#e2e8f0' }}>⭐ 3x Task da 4 Stelle:</span>
            <span style={{ fontWeight: 'bold', color: '#22c55e' }}>{starCounts?.[4] || 3}/3 ✓</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
            <span style={{ color: '#e2e8f0' }}>⭐ 2x Task da 5 Stelle:</span>
            <span style={{ fontWeight: 'bold', color: '#22c55e' }}>{starCounts?.[5] || 2}/2 ✓</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          {onViewDetails && (
            <button
              onClick={() => {
                onClose();
                onViewDetails(medal);
              }}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#fff',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              📜 Dettagli
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              border: 'none',
              color: '#fff',
              fontWeight: 'bold',
              fontSize: '13px',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
              cursor: 'pointer'
            }}
          >
            Magnifico! 🎉
          </button>
        </div>
      </div>
    </div>
  );
}
