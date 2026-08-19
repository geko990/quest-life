import React, { useState, useEffect } from 'react';
import { getGameDate } from '../utils/helpers';

const EXPENSE_CATEGORIES = [
  { id: 'cibo', label: 'Cibo & Ristorante', emoji: '🍕' },
  { id: 'casa', label: 'Casa & Bollette', emoji: '🏠' },
  { id: 'trasporti', label: 'Trasporti & Auto', emoji: '🚗' },
  { id: 'svago', label: 'Svago & Tempo Libero', emoji: '🎮' },
  { id: 'salute', label: 'Salute & Benessere', emoji: '💊' },
  { id: 'tecnologia', label: 'Tecnologia & Lavoro', emoji: '💻' },
  { id: 'altro_spesa', label: 'Altre Spese', emoji: '📦' }
];

const INCOME_CATEGORIES = [
  { id: 'stipendio', label: 'Stipendio / Salario', emoji: '💼' },
  { id: 'fattura', label: 'Fattura / Freelance', emoji: '📜' },
  { id: 'prestazione', label: 'Prestazione Occasionale', emoji: '🛠️' },
  { id: 'regalo', label: 'Regalo / Donazione', emoji: '🎁' },
  { id: 'investimenti', label: 'Rendimenti / Investimenti', emoji: '📈' },
  { id: 'rimborso', label: 'Rimborso / Note Spese', emoji: '🔄' },
  { id: 'vendita', label: 'Vendita Usato / Oggetti', emoji: '🏷️' },
  { id: 'altro_entrata', label: 'Altre Entrate', emoji: '💰' }
];

const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

const getCategoryObj = (catId) => {
  return ALL_CATEGORIES.find(c => c.id === catId) || { emoji: '📦', label: 'Altro' };
};

export default function FinancesTab({
  finances = { balance: 0, monthlyBudget: 1000, hideBalances: false, transactions: [], savingGoals: [], secondaryAccounts: [], recurringTransactions: [] },
  setFinances,
  stats = [],
  onRewardXp,
  onOpenSettings
}) {
  const [activeSubView, setActiveSubView] = useState('transactions'); // 'transactions' | 'categories'
  const [filterType, setFilterType] = useState('all'); // 'all', 'expense', 'income'
  const [filterCategory, setFilterCategory] = useState('all'); // 'all' or category id
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Modals
  const [showAddTxModal, setShowAddTxModal] = useState(false);
  const [txModalMode, setTxModalMode] = useState('expense'); // 'expense' | 'income'
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);

  // Secondary Account Modals
  const [showAddSecModal, setShowAddSecModal] = useState(false);
  const [secAccountAction, setSecAccountAction] = useState(null); // { account, type: 'deposit'|'withdraw'|'interest' }

  // Transaction Form States
  const [amountInput, setAmountInput] = useState('');
  const [categoryInput, setCategoryInput] = useState('cibo');
  const [noteInput, setNoteInput] = useState('');
  const [dateInput, setDateInput] = useState(getGameDate());
  const [isRecurring, setIsRecurring] = useState(false);
  const [recDay, setRecDay] = useState(1);

  // Secondary Account Form States
  const [secName, setSecName] = useState('');
  const [secEmoji, setSecEmoji] = useState('🛡️');
  const [secBalance, setSecBalance] = useState('');
  const [secRate, setSecRate] = useState('3.5');
  const [secLockMonths, setSecLockMonths] = useState('0'); // '0', '6', '12', '24'
  const [secActionAmount, setSecActionAmount] = useState('');

  // Budget Form State
  const [budgetInput, setBudgetInput] = useState(finances.monthlyBudget || 1000);

  // Currency Formatter Helper
  const fmtCurrency = (val) => {
    if (finances.hideBalances) return '*** €';
    const num = Number(val) || 0;
    return num.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });
  };

  const currentMonthPrefix = getGameDate().substring(0, 7);

  // Always default to hidden balances (*** €) whenever Finances tab opens
  useEffect(() => {
    setFinances(prev => ({ ...prev, hideBalances: true }));
  }, []);

  // Auto-process active recurring transactions for current month if not yet processed
  useEffect(() => {
    const todayStr = getGameDate();
    const currentMonthPrefix = todayStr.substring(0, 7);
    const recurringList = finances.recurringTransactions || [];
    if (recurringList.length === 0) return;

    let updatedBalance = finances.balance;
    const newTxList = [];
    let stateChanged = false;

    const updatedRecurring = recurringList.map(rec => {
      if (!rec.active) return rec;
      if (rec.lastProcessedMonth === currentMonthPrefix) return rec;

      const dayStr = String(rec.dayOfMonth || 1).padStart(2, '0');
      const txDate = `${currentMonthPrefix}-${dayStr}`;

      const generatedTx = {
        id: 'tx_rec_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        type: rec.type,
        amount: rec.amount,
        category: rec.category,
        note: `${rec.note || getCategoryObj(rec.category).label} (Ricorrente)`,
        date: txDate,
        timestamp: Date.now()
      };

      newTxList.push(generatedTx);
      if (rec.type === 'income') {
        updatedBalance += rec.amount;
      } else {
        updatedBalance -= rec.amount;
      }
      stateChanged = true;

      return { ...rec, lastProcessedMonth: currentMonthPrefix };
    });

    if (stateChanged) {
      setFinances(prev => ({
        ...prev,
        balance: updatedBalance,
        transactions: [...newTxList, ...(prev.transactions || [])],
        recurringTransactions: updatedRecurring
      }));
    }
  }, []);

  // Month Statistics for Conto Base
  const monthTransactions = (finances.transactions || []).filter(t => t.date && t.date.startsWith(currentMonthPrefix));
  const monthExpenses = monthTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const monthIncome = monthTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const budgetPct = Math.min(100, Math.round((monthExpenses / (finances.monthlyBudget || 1)) * 100));

  // Category Expenses & Income Breakdown
  const catExpensesMap = {};
  monthTransactions.filter(t => t.type === 'expense').forEach(t => {
    catExpensesMap[t.category] = (catExpensesMap[t.category] || 0) + t.amount;
  });

  const catIncomeMap = {};
  monthTransactions.filter(t => t.type === 'income').forEach(t => {
    catIncomeMap[t.category] = (catIncomeMap[t.category] || 0) + t.amount;
  });

  // Handlers
  const handleTogglePrivacy = () => {
    setFinances(prev => ({ ...prev, hideBalances: !prev.hideBalances }));
  };

  const handleOpenAddTxModal = (mode) => {
    setTxModalMode(mode);
    setCategoryInput(mode === 'income' ? 'stipendio' : 'cibo');
    setAmountInput('');
    setNoteInput('');
    setDateInput(getGameDate());
    setIsRecurring(false);
    setRecDay(1);
    setShowAddTxModal(true);
  };

  const handleSaveTransaction = (e) => {
    e.preventDefault();
    const val = parseFloat(amountInput.replace(',', '.'));
    if (isNaN(val) || val <= 0) return;

    const newTx = {
      id: 'tx_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      type: txModalMode,
      amount: val,
      category: categoryInput,
      note: noteInput.trim(),
      date: dateInput,
      timestamp: Date.now()
    };

    let newRecurring = finances.recurringTransactions || [];
    if (isRecurring) {
      const recItem = {
        id: 'rec_' + Date.now(),
        type: txModalMode,
        amount: val,
        category: categoryInput,
        note: noteInput.trim(),
        frequency: 'monthly',
        dayOfMonth: parseInt(recDay) || 1,
        lastProcessedMonth: currentMonthPrefix,
        active: true
      };
      newRecurring = [recItem, ...newRecurring];
    }

    setFinances(prev => {
      const newBalance = txModalMode === 'income' ? prev.balance + val : prev.balance - val;
      return {
        ...prev,
        balance: newBalance,
        transactions: [newTx, ...(prev.transactions || [])],
        recurringTransactions: newRecurring
      };
    });

    setShowAddTxModal(false);
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

  const handleToggleRecurringActive = (recId) => {
    setFinances(prev => ({
      ...prev,
      recurringTransactions: (prev.recurringTransactions || []).map(r => 
        r.id === recId ? { ...r, active: !r.active } : r
      )
    }));
  };

  const handleDeleteRecurring = (recId) => {
    if (window.confirm("Eliminare questa regola di pagamento ricorrente?")) {
      setFinances(prev => ({
        ...prev,
        recurringTransactions: (prev.recurringTransactions || []).filter(r => r.id !== recId)
      }));
    }
  };

  const handleSaveBudget = (e) => {
    e.preventDefault();
    const val = parseFloat(budgetInput);
    if (isNaN(val) || val <= 0) return;
    setFinances(prev => ({ ...prev, monthlyBudget: val }));
    setShowBudgetModal(false);
  };

  // Secondary Account Handlers
  const handleCreateSecAccount = (e) => {
    e.preventDefault();
    const initialBal = parseFloat(secBalance.replace(',', '.')) || 0;
    const rate = parseFloat(secRate.replace(',', '.')) || 0;
    if (!secName.trim()) return;

    const newAcc = {
      id: 'sec_' + Date.now(),
      name: secName.trim(),
      emoji: secEmoji || '🏦',
      balance: initialBal,
      interestRate: rate,
      lockPeriodMonths: parseInt(secLockMonths) || 0,
      createdAt: getGameDate()
    };

    setFinances(prev => ({
      ...prev,
      secondaryAccounts: [...(prev.secondaryAccounts || []), newAcc]
    }));

    setSecName('');
    setSecBalance('');
    setShowAddSecModal(false);
  };

  const handleSecAccountActionSubmit = (e) => {
    e.preventDefault();
    if (!secAccountAction) return;
    const { account, type } = secAccountAction;

    if (type === 'interest') {
      const interestEarned = Math.round((account.balance * (account.interestRate / 100)) * 100) / 100;
      if (interestEarned <= 0) {
        alert("Nessun interesse maturato disponibile su questo saldo!");
        setSecAccountAction(null);
        return;
      }

      setFinances(prev => ({
        ...prev,
        secondaryAccounts: (prev.secondaryAccounts || []).map(a => 
          a.id === account.id ? { ...a, balance: a.balance + interestEarned } : a
        )
      }));
      alert(`📈 Accredito effettuato! Maturati +${interestEarned} € di interessi!`);
      setSecAccountAction(null);
      return;
    }

    const val = parseFloat(secActionAmount.replace(',', '.'));
    if (isNaN(val) || val <= 0) return;

    setFinances(prev => ({
      ...prev,
      secondaryAccounts: (prev.secondaryAccounts || []).map(a => {
        if (a.id !== account.id) return a;
        const newBal = type === 'deposit' ? a.balance + val : Math.max(0, a.balance - val);
        return { ...a, balance: newBal };
      })
    }));

    setSecActionAmount('');
    setSecAccountAction(null);
  };

  const handleDeleteSecAccount = (accId) => {
    if (window.confirm("Sei sicuro di voler eliminare questo conto secondario?")) {
      setFinances(prev => ({
        ...prev,
        secondaryAccounts: (prev.secondaryAccounts || []).filter(a => a.id !== accId)
      }));
    }
  };

  // Filtered Transactions
  const filteredTransactions = (finances.transactions || []).filter(t => {
    if (filterType === 'expense' && t.type !== 'expense') return false;
    if (filterType === 'income' && t.type !== 'income') return false;
    if (filterCategory !== 'all' && t.category !== filterCategory) return false;
    return true;
  });

  // Dynamic Categories list for Filter modal
  const availableCategoriesForFilter = filterType === 'expense' 
    ? EXPENSE_CATEGORIES 
    : (filterType === 'income' ? INCOME_CATEGORIES : ALL_CATEGORIES);

  // Dynamic Categories list for Add modal
  const currentModalCategories = txModalMode === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const activeRecurringCount = (finances.recurringTransactions || []).filter(r => r.active).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingBottom: '16px' }}>
      
      {/* 1. Header Compact Navigation Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 2px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            💰 Il Tesoro dell'Eroe
          </h2>
          <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
            Gestione Finanziaria Privata
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={handleTogglePrivacy}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--glass-border)',
              borderRadius: '10px',
              padding: '6px 10px',
              fontSize: '14px',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title={finances.hideBalances ? 'Mostra saldi' : 'Nascondi saldi'}
          >
            <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              👁️
              {finances.hideBalances && (
                <span
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '-2px',
                    right: '-2px',
                    height: '2px',
                    background: '#ef4444',
                    transform: 'rotate(-45deg)',
                    borderRadius: '1px',
                    boxShadow: '0 0 2px rgba(0,0,0,0.5)'
                  }}
                />
              )}
            </span>
          </button>
        </div>
      </div>

      {/* 2. Compact Hero Card: Conto Base */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98))',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '16px',
          padding: '14px 16px',
          color: '#fff',
          boxShadow: '0 6px 18px rgba(0, 0, 0, 0.18)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
          <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            💳 Conto Base
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <button
              onClick={() => setShowRecurringModal(true)}
              style={{
                background: activeRecurringCount > 0 ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: activeRecurringCount > 0 ? '#60a5fa' : '#cbd5e1',
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '10px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="Gestisci Pagamenti ed Entrate Ricorrenti (Stipendio, Affitto...)"
            >
              <span>🔄</span> {activeRecurringCount > 0 ? activeRecurringCount : ''}
            </button>
            <button
              onClick={() => handleOpenAddTxModal('expense')}
              style={{ background: '#ef4444', border: 'none', color: '#fff', padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              - Uscita
            </button>
            <button
              onClick={() => handleOpenAddTxModal('income')}
              style={{ background: '#22c55e', border: 'none', color: '#fff', padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              + Entrata
            </button>
          </div>
        </div>

        <div style={{ fontSize: '26px', fontWeight: '900', color: finances.balance >= 0 ? '#38bdf8' : '#ef4444', margin: '2px 0 10px 0' }}>
          {fmtCurrency(finances.balance)}
        </div>

        {/* Monthly Summary Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.06)', padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ fontSize: '9px', color: '#94a3b8' }}>🟢 Entrate Mese</div>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#4ade80' }}>
              +{fmtCurrency(monthIncome)}
            </div>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.06)', padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ fontSize: '9px', color: '#94a3b8' }}>🔴 Uscite Mese</div>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#f87171' }}>
              -{fmtCurrency(monthExpenses)}
            </div>
          </div>
        </div>

        {/* Compact Monthly Budget Bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', marginBottom: '3px' }}>
            <span style={{ color: '#cbd5e1' }}>🎯 Budget Spesa Mensile</span>
            <span
              onClick={() => { setBudgetInput(finances.monthlyBudget || 1000); setShowBudgetModal(true); }}
              style={{ color: '#fbbf24', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Lim: {fmtCurrency(finances.monthlyBudget || 1000)} ✏️
            </span>
          </div>
          <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.15)', borderRadius: '3px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${budgetPct}%`,
                height: '100%',
                background: budgetPct > 90 ? '#ef4444' : budgetPct > 70 ? '#f59e0b' : '#3b82f6',
                borderRadius: '3px',
                transition: 'width 0.3s'
              }}
            />
          </div>
        </div>
      </div>

      {/* 3. Conti Secondari Card */}
      <div style={{ background: 'var(--bg-secondary)', borderRadius: '14px', border: '1px solid var(--glass-border)', padding: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h3 style={{ margin: 0, fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)', textTransform: 'uppercase' }}>
            🏦 Conti Secondari & Risparmi
          </h3>
          <button
            onClick={() => setShowAddSecModal(true)}
            style={{ background: 'var(--accent-primary)', border: 'none', color: '#fff', padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            + Nuovo Conto
          </button>
        </div>

        {(!finances.secondaryAccounts || finances.secondaryAccounts.length === 0) ? (
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '8px 0' }}>
            Nessun conto secondario attivo. Crea ad es. un 🛡️ Conto Emergenze o 🎁 Conto Desideri!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {finances.secondaryAccounts.map(acc => (
              <div
                key={acc.id}
                style={{
                  background: 'var(--bg-primary)',
                  borderRadius: '10px',
                  padding: '8px 10px',
                  border: '1px solid var(--glass-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                  <span style={{ fontSize: '18px', flexShrink: 0 }}>{acc.emoji || '🏦'}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {acc.name}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '1px' }}>
                      {acc.interestRate > 0 && (
                        <span style={{ fontSize: '9px', background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold' }}>
                          +{acc.interestRate}% p.a.
                        </span>
                      )}
                      <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                        {acc.lockPeriodMonths > 0 ? `⏳ Vincolo ${acc.lockPeriodMonths}M` : '🔓 Svincolato'}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--accent-gold, #f59e0b)' }}>
                    {fmtCurrency(acc.balance)}
                  </div>
                  <div style={{ display: 'flex', gap: '3px' }}>
                    <button
                      onClick={() => { setSecActionAmount(''); setSecAccountAction({ account: acc, type: 'deposit' }); }}
                      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontSize: '9px', padding: '3px 6px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}
                      title="Deposita nel conto"
                    >
                      +
                    </button>
                    <button
                      onClick={() => { setSecActionAmount(''); setSecAccountAction({ account: acc, type: 'withdraw' }); }}
                      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontSize: '9px', padding: '3px 6px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}
                      title="Preleva dal conto"
                    >
                      -
                    </button>
                    {acc.interestRate > 0 && (
                      <button
                        onClick={() => setSecAccountAction({ account: acc, type: 'interest' })}
                        style={{ background: 'rgba(34, 197, 94, 0.2)', border: '1px solid rgba(34, 197, 94, 0.4)', color: '#22c55e', fontSize: '9px', padding: '3px 6px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}
                        title="Calcola & Accredita Interessi Maturati"
                      >
                        📈
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteSecAccount(acc.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '10px', padding: '1px 3px', cursor: 'pointer' }}
                      title="Elimina conto"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Tessera Unificata: Movimenti & Categorie (con Imbuto Filtro 🌪️) */}
      <div style={{ background: 'var(--bg-secondary)', borderRadius: '14px', border: '1px solid var(--glass-border)', padding: '12px' }}>
        
        {/* Header & Sub-view Switch + Filter Funnel */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-primary)', padding: '2px', borderRadius: '8px' }}>
            <button
              onClick={() => setActiveSubView('transactions')}
              style={{
                background: activeSubView === 'transactions' ? 'var(--bg-card)' : 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '10px',
                fontWeight: activeSubView === 'transactions' ? 'bold' : 'normal',
                padding: '4px 8px',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              📜 Movimenti ({filteredTransactions.length})
            </button>
            <button
              onClick={() => setActiveSubView('categories')}
              style={{
                background: activeSubView === 'categories' ? 'var(--bg-card)' : 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '10px',
                fontWeight: activeSubView === 'categories' ? 'bold' : 'normal',
                padding: '4px 8px',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              📊 Categorie
            </button>
          </div>

          <button
            onClick={() => setShowFilterModal(!showFilterModal)}
            style={{
              background: (filterType !== 'all' || filterCategory !== 'all') ? 'var(--accent-primary)' : 'var(--bg-primary)',
              color: (filterType !== 'all' || filterCategory !== 'all') ? '#fff' : 'var(--text-primary)',
              border: '1px solid var(--glass-border)',
              borderRadius: '8px',
              padding: '4px 8px',
              fontSize: '11px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title="Filtra movimenti per tipo e categoria"
          >
            <span>🌪️ Filtri</span>
            {(filterType !== 'all' || filterCategory !== 'all') && <span style={{ fontSize: '9px' }}>•</span>}
          </button>
        </div>

        {/* Filter Selection Panel (Toggleable Popup/Row) */}
        {showFilterModal && (
          <div style={{ background: 'var(--bg-primary)', padding: '8px 10px', borderRadius: '10px', border: '1px solid var(--glass-border)', marginBottom: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Filtra Tipo:</span>
              <div style={{ display: 'flex', gap: '4px' }}>
                {['all', 'expense', 'income'].map(t => (
                  <button
                    key={t}
                    onClick={() => {
                      setFilterType(t);
                      setFilterCategory('all');
                    }}
                    style={{
                      background: filterType === t ? 'var(--accent-primary)' : 'transparent',
                      color: filterType === t ? '#fff' : 'var(--text-secondary)',
                      border: 'none',
                      fontSize: '9px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    {t === 'all' ? 'Tutti' : t === 'expense' ? 'Uscite' : 'Entrate'}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Categoria:</span>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)', borderRadius: '6px', fontSize: '10px', padding: '2px 4px' }}
              >
                <option value="all">Tutte le Categorie</option>
                {availableCategoriesForFilter.map(c => (
                  <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Content View: Transactions List */}
        {activeSubView === 'transactions' && (
          filteredTransactions.length === 0 ? (
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '12px 0' }}>
              Nessun movimento trovato con i filtri attuali.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '200px', overflowY: 'auto', paddingRight: '2px' }}>
              {filteredTransactions.map(t => {
                const catObj = getCategoryObj(t.category);
                const isIncome = t.type === 'income';

                return (
                  <div
                    key={t.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'var(--bg-primary)',
                      padding: '6px 8px',
                      borderRadius: '8px',
                      border: '1px solid var(--glass-border)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                      <span style={{ fontSize: '15px', flexShrink: 0 }}>{catObj.emoji}</span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {t.note || catObj.label}
                        </div>
                        <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>
                          {t.date}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      <span style={{ fontSize: '11px', fontWeight: 'bold', color: isIncome ? '#22c55e' : '#ef4444' }}>
                        {isIncome ? '+' : '-'}{fmtCurrency(t.amount)}
                      </span>
                      <button
                        onClick={() => handleDeleteTransaction(t.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '10px', cursor: 'pointer', padding: '1px' }}
                        title="Elimina movimento"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* Content View: Category Breakdown */}
        {activeSubView === 'categories' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '220px', overflowY: 'auto' }}>
            {/* Expense Categories Breakdown */}
            {(filterType === 'all' || filterType === 'expense') && (
              <div>
                <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#ef4444', marginBottom: '4px', textTransform: 'uppercase' }}>
                  🔴 Uscite per Categoria ({fmtCurrency(monthExpenses)})
                </div>
                {monthExpenses === 0 ? (
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '2px 0' }}>
                    Nessuna spesa registrata nel mese.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {EXPENSE_CATEGORIES.map(cat => {
                      const catSpent = catExpensesMap[cat.id] || 0;
                      if (catSpent === 0) return null;
                      const catPct = Math.round((catSpent / monthExpenses) * 100);

                      return (
                        <div key={cat.id} style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px' }}>
                            <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
                              {cat.emoji} {cat.label}
                            </span>
                            <span style={{ fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                              {fmtCurrency(catSpent)} ({catPct}%)
                            </span>
                          </div>
                          <div style={{ width: '100%', height: '4px', background: 'var(--bg-primary)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ width: `${catPct}%`, height: '100%', background: '#ef4444', borderRadius: '2px' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Income Categories Breakdown */}
            {(filterType === 'all' || filterType === 'income') && (
              <div>
                <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#22c55e', marginBottom: '4px', textTransform: 'uppercase' }}>
                  🟢 Entrate per Categoria ({fmtCurrency(monthIncome)})
                </div>
                {monthIncome === 0 ? (
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '2px 0' }}>
                    Nessuna entrata registrata nel mese.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {INCOME_CATEGORIES.map(cat => {
                      const catEarned = catIncomeMap[cat.id] || 0;
                      if (catEarned === 0) return null;
                      const catPct = Math.round((catEarned / monthIncome) * 100);

                      return (
                        <div key={cat.id} style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px' }}>
                            <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
                              {cat.emoji} {cat.label}
                            </span>
                            <span style={{ fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                              {fmtCurrency(catEarned)} ({catPct}%)
                            </span>
                          </div>
                          <div style={{ width: '100%', height: '4px', background: 'var(--bg-primary)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ width: `${catPct}%`, height: '100%', background: '#22c55e', borderRadius: '2px' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>

      {/* MODAL: Nuova Uscita / Entrata */}
      {showAddTxModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '18px', width: '100%', maxWidth: '320px', padding: '18px' }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '15px', fontWeight: 'bold', color: txModalMode === 'expense' ? '#ef4444' : '#22c55e' }}>
              {txModalMode === 'expense' ? '🔴 Registra Uscita' : '🟢 Registra Entrata'}
            </h3>

            <form onSubmit={handleSaveTransaction} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Importo (€)*</label>
                <input
                  type="text"
                  placeholder="0.00"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  autoFocus
                  required
                  style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '15px', fontWeight: 'bold', marginTop: '2px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                  Categoria {txModalMode === 'expense' ? '(Uscita)' : '(Entrata)'}
                </label>
                <select
                  value={categoryInput}
                  onChange={(e) => setCategoryInput(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '12px', marginTop: '2px', boxSizing: 'border-box' }}
                >
                  {currentModalCategories.map(c => (
                    <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Nota / Descrizione</label>
                <input
                  type="text"
                  placeholder={txModalMode === 'expense' ? "Es. Spesa, Affitto..." : "Es. Stipendio Mese, Consulenza..."}
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '12px', marginTop: '2px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Data Prima Esecuzione</label>
                <input
                  type="date"
                  value={dateInput}
                  onChange={(e) => setDateInput(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '12px', marginTop: '2px', boxSizing: 'border-box' }}
                />
              </div>

              {/* Recurring Payment Option */}
              <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '10px', border: '1px solid var(--glass-border)', marginTop: '2px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 'bold', color: 'var(--text-primary)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    style={{ width: '15px', height: '15px', cursor: 'pointer' }}
                  />
                  <span>🔄 Rendi Pagamento Ricorrente</span>
                </label>

                {isRecurring && (
                  <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                      Si ripeterà automaticamente ogni mese nel giorno stabilito.
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Giorno del mese:</span>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={recDay}
                        onChange={(e) => setRecDay(e.target.value)}
                        style={{ width: '60px', padding: '4px', borderRadius: '6px', border: '1px solid var(--glass-border)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '12px', textAlign: 'center' }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddTxModal(false)}
                  style={{ flex: 1, padding: '9px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text-primary)', fontSize: '11px', cursor: 'pointer' }}
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '9px', borderRadius: '8px', border: 'none', background: txModalMode === 'expense' ? '#ef4444' : '#22c55e', color: '#fff', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Salva
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Gestione Pagamenti Ricorrenti */}
      {showRecurringModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '18px', width: '100%', maxWidth: '340px', padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                🔄 Pagamenti Ricorrenti
              </h3>
              <button
                onClick={() => setShowRecurringModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '14px', cursor: 'pointer' }}
              >
                ✖
              </button>
            </div>

            {(!finances.recurringTransactions || finances.recurringTransactions.length === 0) ? (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '16px 0' }}>
                Nessun pagamento o entrata ricorrente salvato. Quando aggiungi un'uscita o un'entrata, spunta "Rendi Pagamento Ricorrente"!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
                {finances.recurringTransactions.map(rec => {
                  const catObj = getCategoryObj(rec.category);
                  const isIncome = rec.type === 'income';

                  return (
                    <div
                      key={rec.id}
                      style={{
                        background: 'var(--bg-primary)',
                        borderRadius: '10px',
                        padding: '10px',
                        border: '1px solid var(--glass-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        opacity: rec.active ? 1 : 0.6
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                        <span style={{ fontSize: '18px', flexShrink: 0 }}>{catObj.emoji}</span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {rec.note || catObj.label}
                          </div>
                          <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                            Mensile (giorno {rec.dayOfMonth || 1})
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        <span style={{ fontSize: '11px', fontWeight: 'bold', color: isIncome ? '#22c55e' : '#ef4444' }}>
                          {isIncome ? '+' : '-'}{fmtCurrency(rec.amount)}
                        </span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            onClick={() => handleToggleRecurringActive(rec.id)}
                            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: rec.active ? '#22c55e' : 'var(--text-muted)', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer' }}
                            title={rec.active ? 'Metti in pausa' : 'Attiva'}
                          >
                            {rec.active ? '▶️' : '⏸️'}
                          </button>
                          <button
                            onClick={() => handleDeleteRecurring(rec.id)}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '11px', cursor: 'pointer', padding: '1px' }}
                            title="Elimina regola"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ marginTop: '14px', textAlign: 'center' }}>
              <button
                onClick={() => setShowRecurringModal(false)}
                style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Nuovo Conto Secondario */}
      {showAddSecModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '18px', width: '100%', maxWidth: '320px', padding: '18px' }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '15px', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
              🏦 Crea Conto Secondario
            </h3>

            <form onSubmit={handleCreateSecAccount} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Nome Conto*</label>
                <input
                  type="text"
                  placeholder="Es. Conto Emergenze, Conto Desideri..."
                  value={secName}
                  onChange={(e) => setSecName(e.target.value)}
                  autoFocus
                  required
                  style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '12px', marginTop: '2px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Saldo Iniziale (€)</label>
                  <input
                    type="text"
                    placeholder="0"
                    value={secBalance}
                    onChange={(e) => setSecBalance(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '12px', marginTop: '2px', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ width: '70px' }}>
                  <label style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Emoji</label>
                  <input
                    type="text"
                    value={secEmoji}
                    onChange={(e) => setSecEmoji(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '14px', textAlign: 'center', marginTop: '2px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Interesse (% p.a.)</label>
                  <input
                    type="text"
                    placeholder="3.5"
                    value={secRate}
                    onChange={(e) => setSecRate(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '12px', marginTop: '2px', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Vincolo</label>
                  <select
                    value={secLockMonths}
                    onChange={(e) => setSecLockMonths(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '11px', marginTop: '2px', boxSizing: 'border-box' }}
                  >
                    <option value="0">Svincolato</option>
                    <option value="6">6 Mesi</option>
                    <option value="12">12 Mesi</option>
                    <option value="24">24 Mesi</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddSecModal(false)}
                  style={{ flex: 1, padding: '9px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text-primary)', fontSize: '11px', cursor: 'pointer' }}
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '9px', borderRadius: '8px', border: 'none', background: 'var(--accent-primary)', color: '#fff', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Crea Conto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Azione su Conto Secondario */}
      {secAccountAction && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '18px', width: '100%', maxWidth: '320px', padding: '18px' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              {secAccountAction.account.emoji} {secAccountAction.account.name}
            </h3>

            {secAccountAction.type === 'interest' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4', margin: 0 }}>
                  Calcolo degli interessi del <b>{secAccountAction.account.interestRate}% p.a.</b> sul saldo attuale di <b>{fmtCurrency(secAccountAction.account.balance)}</b>.
                </p>
                <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '8px', textAlign: 'center', fontSize: '14px', fontWeight: 'bold', color: '#22c55e' }}>
                  Interessi Maturati: +{fmtCurrency((secAccountAction.account.balance * secAccountAction.account.interestRate) / 100)}
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <button
                    type="button"
                    onClick={() => setSecAccountAction(null)}
                    style={{ flex: 1, padding: '9px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text-primary)', fontSize: '11px', cursor: 'pointer' }}
                  >
                    Annulla
                  </button>
                  <button
                    type="button"
                    onClick={handleSecAccountActionSubmit}
                    style={{ flex: 1, padding: '9px', borderRadius: '8px', border: 'none', background: '#22c55e', color: '#fff', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    Accredita
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSecAccountActionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                    {secAccountAction.type === 'deposit' ? 'Importo da Depositare (€)' : 'Importo da Prelevare (€)'}
                  </label>
                  <input
                    type="text"
                    placeholder="50"
                    value={secActionAmount}
                    onChange={(e) => setSecActionAmount(e.target.value)}
                    autoFocus
                    required
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '15px', fontWeight: 'bold', marginTop: '2px', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setSecAccountAction(null)}
                    style={{ flex: 1, padding: '9px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text-primary)', fontSize: '11px', cursor: 'pointer' }}
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    style={{ flex: 1, padding: '9px', borderRadius: '8px', border: 'none', background: 'var(--accent-primary)', color: '#fff', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    Conferma
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL: Modifica Budget Mensile */}
      {showBudgetModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '18px', width: '100%', maxWidth: '320px', padding: '18px' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              ✏️ Limite Budget Spesa Mensile
            </h3>

            <form onSubmit={handleSaveBudget} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Limite Budget Spesa (€)</label>
                <input
                  type="number"
                  placeholder="1000"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  autoFocus
                  required
                  style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '15px', fontWeight: 'bold', marginTop: '2px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowBudgetModal(false)}
                  style={{ flex: 1, padding: '9px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text-primary)', fontSize: '11px', cursor: 'pointer' }}
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '9px', borderRadius: '8px', border: 'none', background: 'var(--accent-primary)', color: '#fff', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
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
