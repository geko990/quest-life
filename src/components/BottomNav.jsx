import React from 'react';

export default function BottomNav({ activeTab, setActiveTab, avatarEmoji, avatarImage, avatarType }) {
  const navItems = [
    { id: 'habits', icon: '📜', label: 'Abitudini' },
    { id: 'missions', icon: '⚔️', label: 'Missioni' },
    { id: 'home', icon: 'avatar', label: 'Eroe', isCenter: true },
    { id: 'nutrition', icon: '🍎', label: 'Salute' },
    { id: 'settings', icon: '⚙️', label: 'Opzioni' },
  ];

  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
      <nav
        style={{
          pointerEvents: 'auto',
          width: '100%',
          maxWidth: '480px',
          height: '60px',
          background: 'var(--bg-secondary)',
          borderTop: '1px solid var(--glass-border)',
          display: 'flex',
          justify: 'space-around',
          alignItems: 'center',
          boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.1)',
          position: 'relative'
        }}
      >
        {navItems.map((item) => {
          if (item.isCenter) {
            const isCenterActive = activeTab === item.id;
            return (
              <div key={item.id} style={{ position: 'relative', top: '-18px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    background: 'var(--accent-gradient, linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '3px solid var(--bg-secondary)',
                    boxShadow: '0 4px 12px rgba(124, 58, 237, 0.4)',
                    cursor: 'pointer',
                    transform: isCenterActive ? 'scale(1.1)' : 'scale(1)',
                    transition: 'transform 0.2s'
                  }}
                  title="Scheda Eroe (Home)"
                >
                  {avatarType === 'image' && avatarImage ? (
                    <img
                      src={avatarImage}
                      alt="Avatar"
                      style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span style={{ fontSize: '22px' }}>{avatarEmoji || '⚔️'}</span>
                  )}
                </button>
              </div>
            );
          }

          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                height: '100%',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                fontWeight: isActive ? 'bold' : 'normal',
                transition: 'color 0.2s'
              }}
            >
              <span style={{ fontSize: '18px', marginBottom: '2px' }}>{item.icon}</span>
              <span style={{ fontSize: '10px' }}>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
