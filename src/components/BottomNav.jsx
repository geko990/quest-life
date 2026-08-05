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
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-bg-card/90 backdrop-blur-xl border-t border-border-color flex items-center justify-around px-2 z-50 shadow-2xl pb-[env(safe-area-inset-bottom)]">
      {navItems.map((item) => {
        if (item.isCenter) {
          return (
            <div key={item.id} className="relative -top-5 flex flex-col items-center">
              <button
                onClick={() => setActiveTab(item.id)}
                className={`w-14 h-14 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center border-4 border-bg-main shadow-lg transform transition-all duration-300 active:scale-95 hover:scale-105 hover:shadow-accent-primary/20 hover:shadow-2xl ${
                  activeTab === item.id ? 'scale-110 rotate-3 ring-2 ring-accent-primary/50' : ''
                }`}
              >
                {avatarType === 'image' && avatarImage ? (
                  <img
                    src={avatarImage}
                    alt="Avatar"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-2xl">{avatarEmoji || '⚔️'}</span>
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
            className={`flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 ${
              isActive ? 'text-accent-primary scale-110' : 'text-text-secondary hover:text-text-main hover:scale-105'
            }`}
          >
            <span className="text-xl mb-0.5">{item.icon}</span>
            <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
