import React, { useState } from 'react';
import { getGameDate } from '../utils/helpers';

const CATEGORIES = [
  { id: 'cibo', label: 'Cibo & Ristorante', emoji: '🍕' },
  { id: 'casa', label: 'Casa & Bollette', emoji: '🏠' },
  { id: 'trasporti', label: 'Trasporti & Auto', emoji: '🚗' },
  { id: 'svago', label: 'Svago & Tempo Libero', emoji: '🎮' },
  { id: 'salute', label: 'Salute & Benessere', emoji: '💊' },
  { id: 'tecnologia', label: 'Tecnologia & Lavoro', emoji: '💻' },
  { id: 'altro', label: 'Altre Spese', emoji: '📦' }
];

export default function FinancesTab({
  finances = { balance: 0, monthlyBudget: 1000, hideBalances: false, transactions: [], savingGoals: [] },
  setFinances,
  stats = [],
  onRewardXp,
  onOpenSettings
}) {
  const [filterType, setFilterType] = useState('all'); // 'all', 'expense', 'income'
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalMode, setModalMode] = useState('expense'); // 'expense' | 'income'
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(null); // goal object if depositing

  // Form states
  const [amountInput, setAmountInput] = useState('');
  const [categoryInput, setCategoryInput] = useState('cibo');
  const [noteInput, setNoteInput] = useState('');
  const [dateInput, setDateInput] = useState(getGameDate());

  // Goal Form states
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalEmoji, setGoalEmoji] = useState('🎯');
  const [goalStat, setGoalStat] = useState('str');
  const [depositAmount, setDepositAmount] = useState('');

  // Budget Form state
  const [budgetInput, setBudgetInput] = useState(finances.monthlyBudget || 1000);

  // Currency Formatter Helper
  const fmtCurrency = (val) => {
    if (finances.hideBalances) return '*** €';
    const num = Number(val) || 0;
    return num.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });
  };

  const currentMonthPrefix = getGameDate().substring(0, 7);

  // Month Statistics
  const monthTransactions = (finances.transactions || []).filter(t => t.date && t.date.startsWith(currentMonthPrefix));
  const monthExpenses = monthTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const monthIncome = monthTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const budgetPct = Math.min(100, Math.round((monthExpenses / (finances.monthlyBudget || 1)) * 100));

  // Category Expenses Breakdown
  const catExpensesMap = {};
  monthTransactions.filter(t => t.type === 'expense').forEach(t => {
    catExpensesMap[t.category] = (catExpensesMap[t.category] || 0) + t.amount;
  });

  // Handlers
  const handleTogglePrivacy = () => {
    setFinances(prev => ({ ...prev, hideBalances: !prev.hideBalances }));
  };

  const handleOpenAddModal = (mode) => {
    setModalMode(mode);
    setAmountInput('');
    setNoteInput('');
    setDateInput(getGameDate());
    setShowAddModal(true);
  };

  const handleSaveTransaction = (e) => {
    e.preventDefault();
    const val = parseFloat(amountInput.replace(',', '.'));
    if (isNaN(val) || val <= 0) return;

    const newTx = {
      id: 'tx_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      type: modalMode,
      amount: val,
      category: categoryInput,
      note: noteInput.trim(),
      date: dateInput,
      timestamp: Date.now()
    };

    setFinances(prev => {
      const newBalance = modalMode === 'income' ? prev.balance + val : prev.balance - val;
      return {
        ...prev,
        balance: newBalance,
        transactions: [newTx, ...(prev.transactions || [])]
      };
    });

    setShowAddModal(false);
  };

  const handleDeleteTransaction = (txId) => {
    const tx = (finances.transactions || []).find(t => t.id === txId);
    if (!tx) return;
    if (window.confirm(`Eliminare il movimento di ${tx.amount} €?`)) {
      setFinances(prev => {
        const restoredBalance = tx.type === 'income' ? prev.balance - tx.amount : prev.balance + tx.amount;
        return {
          ...prev,
          balance: restoredBalance,
          transactions: prev.transactions.filter(t => t.id !== txId)
        };
      });
    }
  };

  const handleSaveBudget = (e) => {
    e.preventDefault();
    const val = parseFloat(budgetInput);
    if (isNaN(val) || val <= 0) return;
    setFinances(prev => ({ ...prev, monthlyBudget: val }));
    setShowBudgetModal(false);
  };

  const handleSaveGoal = (e) => {
    e.preventDefault();
    const targetVal = parseFloat(goalTarget.replace(',', '.'));
    if (!goalName.trim() || isNaN(targetVal) || targetVal <= 0) return;

    const newGoal = {
      id: 'goal_' + Date.now(),
      name: goalName.trim(),
      targetAmount: targetVal,
      currentAmount: 0,
      emoji: goalEmoji || '🎯',
      statTarget: goalStat,
      completed: false
    };

    setFinances(prev => ({
      ...prev,
      savingGoals: [...(prev.savingGoals || []), newGoal]
    }));

    setGoalName('');
    setGoalTarget('');
    setShowGoalModal(false);
  };

  const handleDepositGoalSubmit = (e) => {
    e.preventDefault();
    if (!showDepositModal) return;
    const val = parseFloat(depositAmount.replace(',', '.'));
    if (isNaN(val) || val <= 0) return;

    const goalId = showDepositModal.id;
    setFinances(prev => {
      let isNewlyCompleted = false;
      let targetStatId = 'str';

      const updatedGoals = (prev.savingGoals || []).map(g => {
        if (g.id !== goalId) return g;
        const newAmt = Math.min(g.targetAmount, g.currentAmount + val);
        const newlyDone = newAmt >= g.targetAmount && !g.completed;
        if (newlyDone) {
          isNewlyCompleted = true;
          targetStatId = g.statTarget || 'str';
        }
        return { ...g, currentAmount: newAmt, completed: g.completed || newlyDone };
      });

      if (isNewlyCompleted && onRewardXp) {
        onRewardXp(targetStatId, 50, false, `Quest Risparmio: ${showDepositModal.name}`);
        alert(`🎉 QUEST FINANZIARIA COMPLETATA! Hai raggiunto l'obiettivo "${showDepositModal.name}" e guadagnato +50 XP!`);
      }

      return { ...prev, savingGoals: updatedGoals };
    });

    setDepositAmount('');
    setShowDepositModal(null);
  };

  const filteredTransactions = (finances.transactions || []).filter(t => {
    if (filterType === 'expense') return t.type === 'expense';
    if (filterType === 'income') return t.type === 'income';
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '30px' }}>
      
      {/* Top Bar Navigation & Privacy Toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            💰 Il Tesoro dell'Eroe
          </h2>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            Gestione Finanziaria Riservata & Locale
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleTogglePrivacy}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--glass-border)',
              borderRadius: '12px',
              padding: '8px 12px',
              fontSize: '14px',
              cursor: 'pointer',
              color: 'var(--text-primary)'
            }}
            title={finances.hideBalances ? 'Mostra saldi' : 'Nascondi saldi'}
          >
            {finances.hideBalances ? '🙈' : '👁️'}
          </button>

          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--glass-border)',
                borderRadius: '12px',
                padding: '8px 12px',
                fontSize: '14px',
                cursor: 'pointer',
                color: 'var(--text-primary)'
              }}
              title="Torna alle Opzioni"
            >
              ⚙️
            </button>
          )}
        </div>
      </div>

      {/* Main Balance & Monthly Budget Card */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95))',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '20px',
          padding: '20px',
          color: '#fff',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          💳 Saldo Netto Totale
        </div>
        <div style={{ fontSize: '32px', fontWeight: '900', color: finances.balance >= 0 ? '#38bdf8' : '#ef4444', margin: '4px 0 16px 0' }}>
          {fmtCurrency(finances.balance)}
        </div>

        {/* Monthly Summary Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.06)', padding: '10px 12px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>🟢 Entrate Mese</div>
            <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#4ade80' }}>
              +{fmtCurrency(monthIncome)}
            </div>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.06)', padding: '10px 12px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>🔴 Uscite Mese</div>
            <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#f87171' }}>
              -{fmtCurrency(monthExpenses)}
            </div>
          </div>
        </div>

        {/* Monthly Budget Progress Bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', marginBottom: '4px' }}>
            <span style={{ color: '#cbd5e1' }}>🎯 Budget Spesa Mensile</span>
            <span
              onClick={() => { setBudgetInput(finances.monthlyBudget || 1000); setShowBudgetModal(true); }}
              style={{ color: '#fbbf24', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Lim: {fmtCurrency(finances.monthlyBudget || 1000)} ✏️
            </span>
          </div>
          <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.15)', borderRadius: '4px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${budgetPct}%`,
                height: '100%',
                background: budgetPct > 90 ? '#ef4444' : budgetPct > 70 ? '#f59e0b' : '#3b82f6',
                borderRadius: '4px',
                transition: 'width 0.3s'
              }}
            />
          </div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
        <button
          onClick={() => handleOpenAddModal('expense')}
          style={{
            padding: '12px 8px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            border: 'none',
            color: '#fff',
            fontWeight: 'bold',
            fontSize: '12px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
          }}
        >
          🔴 - Uscita
        </button>

        <button
          onClick={() => handleOpenAddModal('income')}
          style={{
            padding: '12px 8px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            border: 'none',
            color: '#fff',
            fontWeight: 'bold',
            fontSize: '12px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)'
          }}
        >
          🟢 + Entrata
        </button>

        <button
          onClick={() => setShowGoalModal(true)}
          style={{
            padding: '12px 8px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            border: 'none',
            color: '#fff',
            fontWeight: 'bold',
            fontSize: '12px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
          }}
        >
          🎯 + Quest
        </button>
      </div>

      {/* Quest di Risparmio (Saving Goals) Section */}
      <div style={{ background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--glass-border)', padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)', textTransform: 'uppercase' }}>
            🎯 Quest di Risparmio (Scrigni)
          </h3>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
            +50 XP a completamento
          </span>
        </div>

        {(!finances.savingGoals || finances.savingGoals.length === 0) ? (
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '12px 0' }}>
            Nessun obiettivo di risparmio attivo. Clicca su "+ Quest" per crearne uno!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {finances.savingGoals.map(goal => {
              const goalPct = Math.min(100, Math.round((goal.currentAmount / (goal.targetAmount || 1)) * 100));
              const targetStat = (stats || []).find(s => s.id === goal.statTarget);

              return (
                <div
                  key={goal.id}
                  style={{
                    background: 'var(--bg-primary)',
                    borderRadius: '12px',
                    padding: '10px 12px',
                    border: '1px solid var(--glass-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '18px' }}>{goal.emoji || '🎯'}</span>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                          {goal.name} {goal.completed ? '🏆' : ''}
                        </div>
                        <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                          Stat: {targetStat?.icon || '💪'} {targetStat?.name || 'Forza'}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '12px', fontWeight: 'bold', color: goal.completed ? '#22c55e' : 'var(--text-primary)' }}>
                        {fmtCurrency(goal.currentAmount)} / {fmtCurrency(goal.targetAmount)}
                      </div>
                      <button
                        onClick={() => { setDepositAmount(''); setShowDepositModal(goal); }}
                        style={{
                          background: 'var(--accent-primary)',
                          border: 'none',
                          color: '#fff',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          marginTop: '2px'
                        }}
                      >
                        + Deposita
                      </button>
                    </div>
                  </div>

                  <div style={{ width: '100%', height: '6px', background: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${goalPct}%`,
                        height: '100%',
                        background: goal.completed ? '#22c55e' : 'var(--accent-gold, #f59e0b)',
                        borderRadius: '3px',
                        transition: 'width 0.3s'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Ripartizione Spese del Mese per Categoria */}
      <div style={{ background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--glass-border)', padding: '16px' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)', textTransform: 'uppercase' }}>
          📊 Spese del Mese per Categoria
        </h3>

        {monthExpenses === 0 ? (
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '10px 0' }}>
            Nessuna spesa registrata per questo mese.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {CATEGORIES.map(cat => {
              const catSpent = catExpensesMap[cat.id] || 0;
              if (catSpent === 0) return null;
              const catPct = Math.round((catSpent / monthExpenses) * 100);

              return (
                <div key={cat.id} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                    <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
                      {cat.emoji} {cat.label}
                    </span>
                    <span style={{ fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                      {fmtCurrency(catSpent)} ({catPct}%)
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '5px', background: 'var(--bg-primary)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${catPct}%`, height: '100%', background: 'var(--accent-primary)', borderRadius: '3px' }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Storico Movimenti Section */}
      <div style={{ background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--glass-border)', padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)', textTransform: 'uppercase' }}>
            📜 Registro Movimenti
          </h3>

          <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-primary)', padding: '2px', borderRadius: '8px' }}>
            <button
              onClick={() => setFilterType('all')}
              style={{
                background: filterType === 'all' ? 'var(--bg-card)' : 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '10px',
                padding: '3px 7px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: filterType === 'all' ? 'bold' : 'normal'
              }}
            >
              Tutti
            </button>
            <button
              onClick={() => setFilterType('expense')}
              style={{
                background: filterType === 'expense' ? 'var(--bg-card)' : 'transparent',
                border: 'none',
                color: '#ef4444',
                fontSize: '10px',
                padding: '3px 7px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: filterType === 'expense' ? 'bold' : 'normal'
              }}
            >
              Uscite
            </button>
            <button
              onClick={() => setFilterType('income')}
              style={{
                background: filterType === 'income' ? 'var(--bg-card)' : 'transparent',
                border: 'none',
                color: '#22c55e',
                fontSize: '10px',
                padding: '3px 7px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: filterType === 'income' ? 'bold' : 'normal'
              }}
            >
              Entrate
            </button>
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '16px 0' }}>
            Nessun movimento registrato nel sistema.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto' }}>
            {filteredTransactions.map(t => {
              const catObj = CATEGORIES.find(c => c.id === t.category) || { emoji: '📦', label: 'Altro' };
              const isIncome = t.type === 'income';

              return (
                <div
                  key={t.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'var(--bg-primary)',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: '1px solid var(--glass-border)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '18px' }}>{catObj.emoji}</span>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                        {t.note || catObj.label}
                      </div>
                      <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                        {t.date}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: isIncome ? '#22c55e' : '#ef4444' }}>
                      {isIncome ? '+' : '-'}{fmtCurrency(t.amount)}
                    </span>
                    <button
                      onClick={() => handleDeleteTransaction(t.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer', padding: '2px' }}
                      title="Elimina movimento"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: Nuova Uscita / Entrata */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '20px', width: '100%', maxWidth: '340px', padding: '20px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 'bold', color: modalMode === 'expense' ? '#ef4444' : '#22c55e' }}>
              {modalMode === 'expense' ? '🔴 Registra Uscita' : '🟢 Registra Entrata'}
            </h3>

            <form onSubmit={handleSaveTransaction} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Importo (€)*</label>
                <input
                  type="text"
                  placeholder="0.00"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  autoFocus
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '16px', fontWeight: 'bold', marginTop: '4px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Categoria</label>
                <select
                  value={categoryInput}
                  onChange={(e) => setCategoryInput(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '13px', marginTop: '4px', boxSizing: 'border-box' }}
                >
                  {CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Nota / Descrizione</label>
                <input
                  type="text"
                  placeholder="Es. Spesa Conad, Stipendio..."
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '13px', marginTop: '4px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Data</label>
                <input
                  type="date"
                  value={dateInput}
                  onChange={(e) => setDateInput(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '13px', marginTop: '4px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text-primary)', fontSize: '12px', cursor: 'pointer' }}
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: modalMode === 'expense' ? '#ef4444' : '#22c55e', color: '#fff', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Salva
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Nuovo Goal di Risparmio */}
      {showGoalModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '20px', width: '100%', maxWidth: '340px', padding: '20px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 'bold', color: 'var(--accent-gold, #f59e0b)' }}>
              🎯 Nuova Quest di Risparmio
            </h3>

            <form onSubmit={handleSaveGoal} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Nome Obiettivo*</label>
                <input
                  type="text"
                  placeholder="Es. Fondo Emergenza, Vacanze..."
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  autoFocus
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '13px', marginTop: '4px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Target (€)*</label>
                  <input
                    type="text"
                    placeholder="1000"
                    value={goalTarget}
                    onChange={(e) => setGoalTarget(e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '13px', marginTop: '4px', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ width: '80px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Emoji</label>
                  <input
                    type="text"
                    value={goalEmoji}
                    onChange={(e) => setGoalEmoji(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '16px', textAlign: 'center', marginTop: '4px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Statistica Premio (+50 XP)</label>
                <select
                  value={goalStat}
                  onChange={(e) => setGoalStat(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '13px', marginTop: '4px', boxSizing: 'border-box' }}
                >
                  {(stats || []).map(s => (
                    <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowGoalModal(false)}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text-primary)', fontSize: '12px', cursor: 'pointer' }}
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: 'var(--accent-gold, #f59e0b)', color: '#fff', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Crea Quest
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Deposita in Goal */}
      {showDepositModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '20px', width: '100%', maxWidth: '340px', padding: '20px' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              {showDepositModal.emoji} Deposita in {showDepositModal.name}
            </h3>

            <form onSubmit={handleDepositGoalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Importo da Accantonare (€)</label>
                <input
                  type="text"
                  placeholder="50"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  autoFocus
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '16px', fontWeight: 'bold', marginTop: '4px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowDepositModal(null)}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text-primary)', fontSize: '12px', cursor: 'pointer' }}
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: 'var(--accent-primary)', color: '#fff', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Deposita
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Modifica Budget Mensile */}
      {showBudgetModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '20px', width: '100%', maxWidth: '340px', padding: '20px' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              ✏️ Imposta Budget Spesa Mensile
            </h3>

            <form onSubmit={handleSaveBudget} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Limite Budget Spesa (€)</label>
                <input
                  type="number"
                  placeholder="1000"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  autoFocus
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '16px', fontWeight: 'bold', marginTop: '4px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowBudgetModal(false)}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text-primary)', fontSize: '12px', cursor: 'pointer' }}
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: 'var(--accent-primary)', color: '#fff', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Salva Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
