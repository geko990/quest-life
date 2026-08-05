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
    <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none pb-[env(safe-area-inset-bottom)]">
      <nav className="pointer-events-auto max-w-md mx-auto h-16 bg-slate-950/85 backdrop-blur-2xl border-t border-white/10 flex items-center justify-around px-3 shadow-[0_-10px_35px_rgba(0,0,0,0.5)]">
        {navItems.map((item) => {
          if (item.isCenter) {
            const isCenterActive = activeTab === item.id;
            return (
              <div key={item.id} className="relative -top-5 flex flex-col items-center select-none">
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`w-14 h-14 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center border-4 border-slate-950 shadow-xl transform transition-all duration-300 active:scale-95 hover:scale-110 ${
                    isCenterActive
                      ? 'scale-110 ring-4 ring-accent-primary/50 shadow-[0_0_20px_rgba(168,85,247,0.5)]'
                      : 'hover:shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                  }`}
                  title="Scheda Eroe (Home)"
                >
                  {avatarType === 'image' && avatarImage ? (
                    <img
                      src={avatarImage}
                      alt="Avatar"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl drop-shadow">{avatarEmoji || '⚔️'}</span>
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
              className={`flex flex-col items-center justify-center flex-1 h-full relative transition-all duration-200 select-none ${
                isActive
                  ? 'text-accent-primary font-bold scale-105'
                  : 'text-text-secondary hover:text-text-main hover:scale-105'
              }`}
            >
              <span className={`text-lg mb-0.5 transition-transform ${isActive ? 'scale-110' : ''}`}>
                {item.icon}
              </span>
              <span className="text-[10px] font-semibold tracking-tight">{item.label}</span>

              {/* Active Tab Glowing Dot Indicator */}
              {isActive && (
                <div className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-accent-primary shadow-[0_0_8px_var(--accent-primary)] animate-pulse"></div>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
