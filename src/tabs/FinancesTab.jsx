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

const MONTH_NAMES_IT = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
];

const MONTH_NAMES_SHORT_IT = [
  'Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu',
  'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'
];

const formatMonthLabel = (monthKey) => {
  if (!monthKey || !monthKey.includes('-')) return monthKey || '';
  const [yr, mo] = monthKey.split('-');
  const idx = parseInt(mo, 10) - 1;
  return `${MONTH_NAMES_IT[idx] || mo} ${yr}`;
};

const formatMonthShort = (monthKey) => {
  if (!monthKey || !monthKey.includes('-')) return monthKey || '';
  const [, mo] = monthKey.split('-');
  const idx = parseInt(mo, 10) - 1;
  return MONTH_NAMES_SHORT_IT[idx] || mo;
};

const shiftMonthKey = (monthKey, delta) => {
  if (!monthKey || !monthKey.includes('-')) return monthKey;
  const [yrStr, moStr] = monthKey.split('-');
  const yr = parseInt(yrStr, 10);
  const mo = parseInt(moStr, 10);
  const d = new Date(yr, mo - 1 + delta, 1);
  const newYr = d.getFullYear();
  const newMo = String(d.getMonth() + 1).padStart(2, '0');
  return `${newYr}-${newMo}`;
};

export default function FinancesTab({
  finances = { baseAccountName: 'Conto Base', balance: 0, cashBalance: 0, monthlyBudget: 1000, hideBalances: false, transactions: [], savingGoals: [], secondaryAccounts: [], recurringTransactions: [] },
  setFinances,
  stats = [],
  onRewardXp,
  onOpenSettings
}) {
  const currentMonthPrefix = getGameDate().substring(0, 7);
  const [activeSubView, setActiveSubView] = useState('transactions'); // 'transactions' | 'categories' | 'history'
  const [selectedHistoryMonth, setSelectedHistoryMonth] = useState(currentMonthPrefix);
  const [historyRange, setHistoryRange] = useState('short'); // 'short' (settimanale) | 'long' (mensile 6-12m)
  const [longPeriodMonthsCount, setLongPeriodMonthsCount] = useState(6); // 6 | 12
  const [selectedHistoryWeek, setSelectedHistoryWeek] = useState(null);
  const [filterType, setFilterType] = useState('all'); // 'all', 'expense', 'income'
  const [filterCategory, setFilterCategory] = useState('all'); // 'all' or category id
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Modals
  const [showAddTxModal, setShowAddTxModal] = useState(false);
  const [txModalMode, setTxModalMode] = useState('expense'); // 'expense' | 'income'
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedAccountDetail, setSelectedAccountDetail] = useState(null); // 'base' | 'cash' | accId
  const [showRenameBaseModal, setShowRenameBaseModal] = useState(false);
  const [baseNameInput, setBaseNameInput] = useState('');

  // Cash Withdrawal Modal
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawSource, setWithdrawSource] = useState('base'); // 'base' or secondary account id
  const [withdrawAmount, setWithdrawAmount] = useState('');

  // Transfer Between Accounts Modal State
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferSource, setTransferSource] = useState('base');
  const [transferTarget, setTransferTarget] = useState('cash');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNote, setTransferNote] = useState('');
  const [transferDate, setTransferDate] = useState(getGameDate());

  // Secondary Account Modals
  const [showAddSecModal, setShowAddSecModal] = useState(false);
  const [secAccountAction, setSecAccountAction] = useState(null); // { account, type: 'deposit'|'withdraw'|'interest' }

  // Transaction Form States
  const [amountInput, setAmountInput] = useState('');
  const [categoryInput, setCategoryInput] = useState('cibo');
  const [txAccountInput, setTxAccountInput] = useState('base'); // 'base' | 'cash' | secondary account id
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

  // Account Label Helper
  const getAccountLabel = (accId) => {
    if (accId === 'base') return `💳 ${finances.baseAccountName || 'Conto Base'}`;
    if (accId === 'cash') return '💵 Contanti';
    const sec = (finances.secondaryAccounts || []).find(a => a.id === accId);
    return sec ? `${sec.emoji || '🏦'} ${sec.name}` : '🏦 Conto Secondario';
  };

  const handleSaveBaseAccountName = () => {
    const trimmed = (baseNameInput || '').trim();
    const finalName = trimmed || 'Conto Base';
    setFinances(prev => ({
      ...prev,
      baseAccountName: finalName
    }));
    setShowRenameBaseModal(false);
  };

  // Always default to hidden balances (*** €) whenever Finances tab opens
  useEffect(() => {
    setFinances(prev => ({ ...prev, hideBalances: true }));
  }, []);

  // Auto-process active recurring transactions for current month on their designated day of month
  // and auto-revert premature charges from previous buggy execution
  useEffect(() => {
    const todayStr = getGameDate();
    const currentMonthPrefix = todayStr.substring(0, 7);
    const currentDay = parseInt(todayStr.substring(8, 10), 10);
    const recurringList = finances.recurringTransactions || [];
    if (recurringList.length === 0) return;

    let updatedBalance = Number(finances.balance) || 0;
    let updatedCashBalance = Number(finances.cashBalance) || 0;
    let updatedSecAccounts = (finances.secondaryAccounts || []).map(a => ({
      ...a,
      balance: Number(a.balance) || 0
    }));
    let updatedTransactions = [...(finances.transactions || [])];
    let stateChanged = false;

    const updatedRecurring = recurringList.map(rec => {
      if (!rec.active) return rec;
      const scheduledDay = parseInt(rec.dayOfMonth || 1, 10);
      const dayStr = String(scheduledDay).padStart(2, '0');
      const targetTxDate = `${currentMonthPrefix}-${dayStr}`;
      const recAccount = rec.account || 'base';

      // 1. RECOVERY / AUTO-HEALING:
      // If marked as processed for currentMonthPrefix, BUT today is strictly BEFORE the scheduled day
      // (e.g. rent on day 4 or internet on day 25 was charged prematurely on Sept 1st when currentDay is 2):
      if (rec.lastProcessedMonth === currentMonthPrefix && currentDay < scheduledDay) {
        const prematureIdx = updatedTransactions.findIndex(t => 
          t.type === rec.type &&
          Math.abs((Number(t.amount) || 0) - (Number(rec.amount) || 0)) < 0.001 &&
          (t.date === targetTxDate || (t.date && t.date.startsWith(currentMonthPrefix) && (t.id?.startsWith('tx_rec_') || t.note?.includes('(Ricorrente)'))))
        );

        if (prematureIdx !== -1) {
          const [removedTx] = updatedTransactions.splice(prematureIdx, 1);
          const revAmt = Number(removedTx.amount) || 0;

          // Revert balance
          if (recAccount === 'base') {
            updatedBalance = rec.type === 'income'
              ? Math.round((updatedBalance - revAmt) * 100) / 100
              : Math.round((updatedBalance + revAmt) * 100) / 100;
          } else if (recAccount === 'cash') {
            updatedCashBalance = rec.type === 'income'
              ? Math.round((updatedCashBalance - revAmt) * 100) / 100
              : Math.round((updatedCashBalance + revAmt) * 100) / 100;
          } else {
            updatedSecAccounts = updatedSecAccounts.map(a => {
              if (a.id !== recAccount) return a;
              const cur = Number(a.balance) || 0;
              const newBal = rec.type === 'income' ? cur - revAmt : cur + revAmt;
              return { ...a, balance: Math.round(newBal * 100) / 100 };
            });
          }
        }

        stateChanged = true;
        // Reset lastProcessedMonth to prior month so it triggers exactly when scheduledDay arrives!
        return { ...rec, lastProcessedMonth: shiftMonthKey(currentMonthPrefix, -1) };
      }

      // 2. NORMAL EXECUTION:
      // Skip if already processed for this month
      if (rec.lastProcessedMonth === currentMonthPrefix) return rec;

      // DO NOT EXECUTE IF CURRENT DAY HAS NOT YET REACHED DESIGNATED DAY!
      if (currentDay < scheduledDay) return rec;

      // Designated day reached! Generate transaction
      const generatedTx = {
        id: 'tx_rec_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        type: rec.type,
        amount: rec.amount,
        category: rec.category,
        account: recAccount,
        note: `${rec.note || getCategoryObj(rec.category).label} (Ricorrente)`,
        date: targetTxDate,
        timestamp: Date.now()
      };

      updatedTransactions = [generatedTx, ...updatedTransactions];

      if (recAccount === 'base') {
        updatedBalance = rec.type === 'income'
          ? Math.round((updatedBalance + rec.amount) * 100) / 100
          : Math.round((updatedBalance - rec.amount) * 100) / 100;
      } else if (recAccount === 'cash') {
        updatedCashBalance = rec.type === 'income'
          ? Math.round((updatedCashBalance + rec.amount) * 100) / 100
          : Math.round((updatedCashBalance - rec.amount) * 100) / 100;
      } else {
        updatedSecAccounts = updatedSecAccounts.map(a => {
          if (a.id !== recAccount) return a;
          const cur = Number(a.balance) || 0;
          const newBal = rec.type === 'income' ? cur + rec.amount : cur - rec.amount;
          return { ...a, balance: Math.round(newBal * 100) / 100 };
        });
      }
      stateChanged = true;

      return { ...rec, lastProcessedMonth: currentMonthPrefix };
    });

    if (stateChanged) {
      setFinances(prev => ({
        ...prev,
        balance: updatedBalance,
        cashBalance: updatedCashBalance,
        secondaryAccounts: updatedSecAccounts,
        transactions: updatedTransactions,
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

  const handleOpenAddTxModal = (mode, defaultAccount = 'base') => {
    setTxModalMode(mode);
    setTxAccountInput(defaultAccount);
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
      account: txAccountInput,
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
        account: txAccountInput,
        note: noteInput.trim(),
        frequency: 'monthly',
        dayOfMonth: parseInt(recDay) || 1,
        lastProcessedMonth: currentMonthPrefix,
        active: true
      };
      newRecurring = [recItem, ...newRecurring];
    }

    setFinances(prev => {
      let newBalance = prev.balance;
      let newCashBalance = prev.cashBalance || 0;
      let newSecAccounts = prev.secondaryAccounts || [];

      if (txAccountInput === 'base') {
        newBalance = txModalMode === 'income' ? prev.balance + val : prev.balance - val;
      } else if (txAccountInput === 'cash') {
        newCashBalance = txModalMode === 'income' ? (prev.cashBalance || 0) + val : (prev.cashBalance || 0) - val;
      } else {
        newSecAccounts = (prev.secondaryAccounts || []).map(a => {
          if (a.id !== txAccountInput) return a;
          const updatedBal = txModalMode === 'income' ? a.balance + val : a.balance - val;
          return { ...a, balance: updatedBal };
        });
      }

      return {
        ...prev,
        balance: newBalance,
        cashBalance: newCashBalance,
        secondaryAccounts: newSecAccounts,
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
        let newBalance = prev.balance;
        let newCashBalance = prev.cashBalance || 0;
        let newSecAccounts = prev.secondaryAccounts || [];
        const targetAccount = tx.account || 'base';

        if (tx.type === 'transfer') {
          const src = tx.sourceAccount || 'base';
          const dst = tx.targetAccount || tx.account || 'cash';

          // 1. Revert source (+ tx.amount)
          if (src === 'base') {
            newBalance += tx.amount;
          } else if (src === 'cash') {
            newCashBalance += tx.amount;
          } else {
            newSecAccounts = newSecAccounts.map(a => 
              a.id === src ? { ...a, balance: a.balance + tx.amount } : a
            );
          }

          // 2. Revert destination (- tx.amount)
          if (dst === 'base') {
            newBalance -= tx.amount;
          } else if (dst === 'cash') {
            newCashBalance -= tx.amount;
          } else {
            newSecAccounts = newSecAccounts.map(a => 
              a.id === dst ? { ...a, balance: a.balance - tx.amount } : a
            );
          }
        } else if (targetAccount === 'base') {
          newBalance = tx.type === 'income' ? prev.balance - tx.amount : prev.balance + tx.amount;
        } else if (targetAccount === 'cash') {
          newCashBalance = tx.type === 'income' ? (prev.cashBalance || 0) - tx.amount : (prev.cashBalance || 0) + tx.amount;
        } else {
          newSecAccounts = (prev.secondaryAccounts || []).map(a => {
            if (a.id !== targetAccount) return a;
            const restoredBal = tx.type === 'income' ? a.balance - tx.amount : a.balance + tx.amount;
            return { ...a, balance: restoredBal };
          });
        }

        return {
          ...prev,
          balance: newBalance,
          cashBalance: newCashBalance,
          secondaryAccounts: newSecAccounts,
          transactions: prev.transactions.filter(t => t.id !== txId)
        };
      });
    }
  };

  const handleOpenTransferModal = (defaultSource = 'base', defaultTarget = 'cash') => {
    setTransferSource(defaultSource);
    let target = defaultTarget;
    if (defaultSource === target) {
      target = defaultSource === 'base' ? 'cash' : 'base';
    }
    setTransferTarget(target);
    setTransferAmount('');
    setTransferNote('');
    setTransferDate(getGameDate());
    setShowTransferModal(true);
  };

  const handleTransferSubmit = (e) => {
    e.preventDefault();
    const val = parseFloat(transferAmount.replace(',', '.'));
    if (isNaN(val) || val <= 0) return;
    if (transferSource === transferTarget) {
      alert("Seleziona due conti diversi per effettuare il trasferimento.");
      return;
    }

    const srcLabel = getAccountLabel(transferSource);
    const dstLabel = getAccountLabel(transferTarget);
    const defaultNote = `↔️ Trasferimento (${srcLabel} ➔ ${dstLabel})`;
    const note = transferNote.trim() || defaultNote;

    const newTx = {
      id: 'tx_trf_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      type: 'transfer',
      amount: val,
      category: 'trasferimento',
      sourceAccount: transferSource,
      targetAccount: transferTarget,
      account: transferTarget,
      note: note,
      date: transferDate || getGameDate(),
      timestamp: Date.now()
    };

    setFinances(prev => {
      let newBalance = Number(prev.balance) || 0;
      let newCashBalance = Number(prev.cashBalance) || 0;
      let newSecAccounts = (prev.secondaryAccounts || []).map(a => ({
        ...a,
        balance: Number(a.balance) || 0
      }));

      // Deduct from source account (allowing 0 and negative numbers)
      if (transferSource === 'base') {
        newBalance = Math.round((newBalance - val) * 100) / 100;
      } else if (transferSource === 'cash') {
        newCashBalance = Math.round((newCashBalance - val) * 100) / 100;
      } else {
        newSecAccounts = newSecAccounts.map(a => 
          a.id === transferSource ? { ...a, balance: Math.round(((Number(a.balance) || 0) - val) * 100) / 100 } : a
        );
      }

      // Add to target account
      if (transferTarget === 'base') {
        newBalance = Math.round((newBalance + val) * 100) / 100;
      } else if (transferTarget === 'cash') {
        newCashBalance = Math.round((newCashBalance + val) * 100) / 100;
      } else {
        newSecAccounts = newSecAccounts.map(a => 
          a.id === transferTarget ? { ...a, balance: Math.round(((Number(a.balance) || 0) + val) * 100) / 100 } : a
        );
      }

      return {
        ...prev,
        balance: newBalance,
        cashBalance: newCashBalance,
        secondaryAccounts: newSecAccounts,
        transactions: [newTx, ...(prev.transactions || [])]
      };
    });

    setTransferAmount('');
    setTransferNote('');
    setShowTransferModal(false);
  };

  const handleWithdrawCashSubmit = (e) => {
    e.preventDefault();
    const val = parseFloat(withdrawAmount.replace(',', '.'));
    if (isNaN(val) || val <= 0) return;

    let sourceName = finances.baseAccountName || 'Conto Base';
    if (withdrawSource !== 'base') {
      const sec = (finances.secondaryAccounts || []).find(a => a.id === withdrawSource);
      if (sec) sourceName = `${sec.emoji || '🏦'} ${sec.name}`;
    }

    const newTx = {
      id: 'tx_trf_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      type: 'transfer',
      amount: val,
      category: 'altro_entrata',
      account: 'cash',
      sourceAccount: withdrawSource,
      targetAccount: 'cash',
      note: `🏧 Prelievo Contanti (da ${sourceName})`,
      date: getGameDate(),
      timestamp: Date.now()
    };

    setFinances(prev => {
      let newBalance = Number(prev.balance) || 0;
      let newSecAccounts = (prev.secondaryAccounts || []).map(a => ({
        ...a,
        balance: Number(a.balance) || 0
      }));

      if (withdrawSource === 'base') {
        newBalance = Math.round((newBalance - val) * 100) / 100;
      } else {
        newSecAccounts = newSecAccounts.map(a => 
          a.id === withdrawSource ? { ...a, balance: Math.round(((Number(a.balance) || 0) - val) * 100) / 100 } : a
        );
      }

      return {
        ...prev,
        balance: newBalance,
        cashBalance: Math.round(((Number(prev.cashBalance) || 0) + val) * 100) / 100,
        secondaryAccounts: newSecAccounts,
        transactions: [newTx, ...(prev.transactions || [])]
      };
    });

    setWithdrawAmount('');
    setShowWithdrawModal(false);
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
        const currentBal = Number(a.balance) || 0;
        const newBal = type === 'deposit'
          ? Math.round((currentBal + val) * 100) / 100
          : Math.round((currentBal - val) * 100) / 100;
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

  // Total Net Worth (Conto Base + Contanti + Secondary Accounts)
  const secondaryAccountsTotal = (finances.secondaryAccounts || []).reduce((acc, a) => acc + (Number(a.balance) || 0), 0);
  const cashTotal = Number(finances.cashBalance) || 0;
  const totalPatrimonio = (Number(finances.balance) || 0) + cashTotal + secondaryAccountsTotal;

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
  const baseRecurringCount = (finances.recurringTransactions || []).filter(r => r.active && (r.account === 'base' || !r.account)).length;
  const cashRecurringCount = (finances.recurringTransactions || []).filter(r => r.active && r.account === 'cash').length;

  // --- STORICO & GRAFICI CALCULATIONS ---
  const selMonthTx = (finances.transactions || []).filter(t => t.date && t.date.startsWith(selectedHistoryMonth));
  const selMonthExpenses = selMonthTx.filter(t => t.type === 'expense').reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  const selMonthIncome = selMonthTx.filter(t => t.type === 'income').reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  const selMonthNet = Math.round((selMonthIncome - selMonthExpenses) * 100) / 100;
  const selMonthSavingsRate = selMonthIncome > 0 ? Math.round((selMonthNet / selMonthIncome) * 100) : (selMonthExpenses > 0 ? -100 : 0);

  // Breve Periodo: 5 finestre settimanali del mese selezionato (1-7, 8-14, 15-21, 22-28, 29-31)
  const weeksData = [
    { id: 1, label: '1-7', shortTitle: '1-7', title: `1 - 7 ${formatMonthShort(selectedHistoryMonth)}`, min: 1, max: 7 },
    { id: 2, label: '8-14', shortTitle: '8-14', title: `8 - 14 ${formatMonthShort(selectedHistoryMonth)}`, min: 8, max: 14 },
    { id: 3, label: '15-21', shortTitle: '15-21', title: `15 - 21 ${formatMonthShort(selectedHistoryMonth)}`, min: 15, max: 21 },
    { id: 4, label: '22-28', shortTitle: '22-28', title: `22 - 28 ${formatMonthShort(selectedHistoryMonth)}`, min: 22, max: 28 },
    { id: 5, label: '29-31', shortTitle: '29-31', title: `29 - 31 ${formatMonthShort(selectedHistoryMonth)}`, min: 29, max: 31 }
  ].map(wk => {
    const txInWeek = selMonthTx.filter(t => {
      if (!t.date) return false;
      const parts = t.date.split('-');
      if (parts.length < 3) return false;
      const dayNum = parseInt(parts[2], 10);
      return dayNum >= wk.min && dayNum <= wk.max;
    });
    const inc = txInWeek.filter(t => t.type === 'income').reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
    const exp = txInWeek.filter(t => t.type === 'expense').reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
    const net = Math.round((inc - exp) * 100) / 100;
    return {
      ...wk,
      income: inc,
      expenses: exp,
      net: net,
      txCount: txInWeek.length,
      transactions: txInWeek
    };
  });

  const maxWeekVal = Math.max(50, ...weeksData.map(w => Math.max(w.income, w.expenses)));

  // Lungo Periodo: ultimi N mesi (6 o 12)
  const longMonthsList = [];
  for (let i = longPeriodMonthsCount - 1; i >= 0; i--) {
    longMonthsList.push(shiftMonthKey(selectedHistoryMonth, -i));
  }
  const longPeriodData = longMonthsList.map(mKey => {
    const mTx = (finances.transactions || []).filter(t => t.date && t.date.startsWith(mKey));
    const inc = mTx.filter(t => t.type === 'income').reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
    const exp = mTx.filter(t => t.type === 'expense').reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
    const net = Math.round((inc - exp) * 100) / 100;
    return {
      monthKey: mKey,
      shortLabel: formatMonthShort(mKey),
      fullLabel: formatMonthLabel(mKey),
      income: inc,
      expenses: exp,
      net: net,
      isCurrent: mKey === currentMonthPrefix,
      isSelected: mKey === selectedHistoryMonth
    };
  });

  const maxLongVal = Math.max(100, ...longPeriodData.map(m => Math.max(m.income, m.expenses)));
  const totalPeriodIncome = longPeriodData.reduce((acc, m) => acc + m.income, 0);
  const totalPeriodExpenses = longPeriodData.reduce((acc, m) => acc + m.expenses, 0);
  const totalPeriodNet = Math.round((totalPeriodIncome - totalPeriodExpenses) * 100) / 100;
  const avgMonthlyExpense = Math.round(totalPeriodExpenses / (longPeriodData.length || 1));
  const avgMonthlyIncome = Math.round(totalPeriodIncome / (longPeriodData.length || 1));
  const bestSavingsMonth = [...longPeriodData].sort((a, b) => b.net - a.net)[0];

  // --- 6-MONTHS OVERVIEW & CHARTS ---
  const txMonthKeys = Array.from(new Set(
    (finances.transactions || [])
      .map(t => (t.date && typeof t.date === 'string' && t.date.length >= 7) ? t.date.substring(0, 7) : null)
      .filter(Boolean)
  )).sort();

  let overviewMonthsCount = 6;
  if (txMonthKeys.length > 0) {
    const earliestTxMonth = txMonthKeys[0];
    const [ey, em] = earliestTxMonth.split('-').map(Number);
    const [cy, cm] = currentMonthPrefix.split('-').map(Number);
    const diff = (cy - ey) * 12 + (cm - em) + 1;
    overviewMonthsCount = Math.min(6, Math.max(1, diff));
  } else {
    overviewMonthsCount = 1;
  }

  const overviewMonthsList = [];
  for (let i = overviewMonthsCount - 1; i >= 0; i--) {
    overviewMonthsList.push(shiftMonthKey(currentMonthPrefix, -i));
  }

  const overviewData = overviewMonthsList.map(mKey => {
    const mTx = (finances.transactions || []).filter(t => t.date && t.date.startsWith(mKey));
    const inc = mTx.filter(t => t.type === 'income').reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
    const exp = mTx.filter(t => t.type === 'expense').reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
    const net = Math.round((inc - exp) * 100) / 100;
    return {
      monthKey: mKey,
      shortLabel: formatMonthShort(mKey),
      fullLabel: formatMonthLabel(mKey),
      income: inc,
      expenses: exp,
      net: net,
      isCurrent: mKey === currentMonthPrefix
    };
  });

  const maxOverviewVal = Math.max(100, ...overviewData.map(m => Math.max(m.income, m.expenses)));
  const remainingBudget = (finances.monthlyBudget || 1000) - monthExpenses;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingBottom: '16px' }}>
      
      {/* 1. Header Compact Navigation Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 2px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            💰 Il Tesoro dell'Eroe
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {/* Total Net Worth Button -> Opens History & Charts Popup */}
          <button
            type="button"
            onClick={() => setShowHistoryModal(true)}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--accent-primary, #38bdf8)',
              borderRadius: '10px',
              padding: '5px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(56, 189, 248, 0.15)'
            }}
            title="Tocca per aprire lo Storico e i Grafici Finanziari"
          >
            <span style={{ fontSize: '13px' }}>📈</span>
            <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>Totale:</span>
            <span style={{ fontSize: '12px', fontWeight: '900', color: totalPatrimonio >= 0 ? '#38bdf8' : '#ef4444' }}>
              {fmtCurrency(totalPatrimonio)}
            </span>
          </button>

          {/* Privacy Eye Toggle */}
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

      {/* 1b. Top 4 Quick Actions Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
        <button
          type="button"
          onClick={() => { setWithdrawAmount(''); setWithdrawSource('base'); setShowWithdrawModal(true); }}
          style={{
            background: 'rgba(234, 179, 8, 0.15)',
            border: '1px solid rgba(234, 179, 8, 0.35)',
            color: '#fde047',
            borderRadius: '10px',
            padding: '8px 4px',
            fontSize: '11px',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px'
          }}
        >
          <span style={{ fontSize: '15px' }}>🏧</span>
          <span>Preleva</span>
        </button>

        <button
          type="button"
          onClick={() => handleOpenTransferModal('base', 'cash')}
          style={{
            background: 'rgba(56, 189, 248, 0.15)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            color: '#38bdf8',
            borderRadius: '10px',
            padding: '8px 4px',
            fontSize: '11px',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px'
          }}
        >
          <span style={{ fontSize: '15px' }}>↔️</span>
          <span>Trasferisci</span>
        </button>

        <button
          type="button"
          onClick={() => handleOpenAddTxModal('expense')}
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#f87171',
            borderRadius: '10px',
            padding: '8px 4px',
            fontSize: '11px',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px'
          }}
        >
          <span style={{ fontSize: '15px' }}>🔴</span>
          <span>Uscita</span>
        </button>

        <button
          type="button"
          onClick={() => handleOpenAddTxModal('income')}
          style={{
            background: 'rgba(34, 197, 94, 0.15)',
            border: '1px solid rgba(34, 197, 94, 0.35)',
            color: '#4ade80',
            borderRadius: '10px',
            padding: '8px 4px',
            fontSize: '11px',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px'
          }}
        >
          <span style={{ fontSize: '15px' }}>🟢</span>
          <span>Entrata</span>
        </button>
      </div>

      {/* 2. Riepilogo & Grafico Finanziario (ultimi 6 mesi o meno se meno dati) */}
      <div
        style={{
          background: 'var(--bg-card, #1e293b)',
          border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.1))',
          borderRadius: '16px',
          padding: '14px 16px',
          color: 'var(--text-primary)',
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        {/* Header Grafico */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            📊 Andamento Finanze ({overviewMonthsCount} {overviewMonthsCount === 1 ? 'Mese' : 'Mesi'})
          </div>
          <div style={{ display: 'flex', gap: '8px', fontSize: '9px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '2px', background: '#4ade80', display: 'inline-block' }}></span> Entrate
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '2px', background: '#f87171', display: 'inline-block' }}></span> Uscite
            </span>
          </div>
        </div>

        {/* Grafico a barre */}
        <div style={{ background: 'var(--bg-primary, rgba(0,0,0,0.2))', borderRadius: '12px', padding: '10px 8px 8px 8px', border: '1px solid var(--glass-border, rgba(255,255,255,0.06))' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: '80px', gap: '4px', padding: '0 2px', borderBottom: '1px solid var(--glass-border, rgba(255,255,255,0.08))' }}>
            {overviewData.map(m => {
              const incHeight = Math.max(3, Math.round((m.income / maxOverviewVal) * 65));
              const expHeight = Math.max(3, Math.round((m.expenses / maxOverviewVal) * 65));

              return (
                <div
                  key={m.monthKey}
                  style={{
                    flex: 1,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    padding: '2px 1px'
                  }}
                  title={`${m.fullLabel}: +${fmtCurrency(m.income)} / -${fmtCurrency(m.expenses)} (Netto: ${fmtCurrency(m.net)})`}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '65px', justifyContent: 'center', width: '100%' }}>
                    {/* Income */}
                    <div
                      style={{
                        width: '40%',
                        maxWidth: '12px',
                        height: `${m.income > 0 ? incHeight : 3}px`,
                        background: m.income > 0 ? '#4ade80' : 'rgba(255,255,255,0.06)',
                        borderRadius: '3px 3px 1px 1px',
                        boxShadow: m.income > 0 ? '0 1px 4px rgba(74, 222, 128, 0.3)' : 'none'
                      }}
                    />
                    {/* Expense */}
                    <div
                      style={{
                        width: '40%',
                        maxWidth: '12px',
                        height: `${m.expenses > 0 ? expHeight : 3}px`,
                        background: m.expenses > 0 ? '#f87171' : 'rgba(255,255,255,0.06)',
                        borderRadius: '3px 3px 1px 1px',
                        boxShadow: m.expenses > 0 ? '0 1px 4px rgba(248, 113, 113, 0.3)' : 'none'
                      }}
                    />
                  </div>
                  <div style={{ fontSize: '9px', color: m.isCurrent ? 'var(--accent-primary, #38bdf8)' : 'var(--text-muted, #94a3b8)', fontWeight: m.isCurrent ? 'bold' : 'normal', marginTop: '4px', textAlign: 'center' }}>
                    {m.shortLabel}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Riga Netto sotto i mesi */}
          <div style={{ display: 'flex', justifyContent: 'space-around', gap: '4px', marginTop: '4px' }}>
            {overviewData.map(m => (
              <div key={m.monthKey} style={{ flex: 1, textAlign: 'center' }}>
                <span style={{ fontSize: '8px', fontWeight: 'bold', color: m.net >= 0 ? (m.net === 0 ? 'var(--text-muted, #94a3b8)' : '#4ade80') : '#f87171' }}>
                  {m.net > 0 ? '+' : ''}{fmtCurrency(m.net)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Sotto il grafico: Barra Budget Spesa Mensile */}
        <div style={{ background: 'var(--bg-primary, rgba(0,0,0,0.2))', borderRadius: '12px', padding: '10px 12px', border: '1px solid var(--glass-border, rgba(255,255,255,0.06))' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', marginBottom: '6px' }}>
            <span style={{ color: 'var(--text-primary, #f1f5f9)', fontWeight: 'bold' }}>
              🎯 Budget Spesa Mensile
            </span>
            <span
              onClick={() => { setBudgetInput(finances.monthlyBudget || 1000); setShowBudgetModal(true); }}
              style={{ color: '#fbbf24', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}
              title="Tocca per modificare il massimale del budget"
            >
              <span>{fmtCurrency(monthExpenses)} / {fmtCurrency(finances.monthlyBudget || 1000)}</span>
              <span style={{ fontSize: '11px' }}>✏️</span>
            </span>
          </div>

          {/* Barra progresso */}
          <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${budgetPct}%`,
                height: '100%',
                background: budgetPct > 100 ? '#ef4444' : budgetPct > 80 ? '#f59e0b' : '#3b82f6',
                borderRadius: '4px',
                transition: 'width 0.3s'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px', fontSize: '9px', color: 'var(--text-muted, #94a3b8)' }}>
            <span>Speso finora: {budgetPct}%</span>
            <span style={{ fontWeight: 'bold', color: remainingBudget >= 0 ? '#4ade80' : '#ef4444' }}>
              {remainingBudget >= 0 ? `Disponibili: ${fmtCurrency(remainingBudget)}` : `Sforato di: ${fmtCurrency(Math.abs(remainingBudget))}`}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Tessere Contanti e Conto Base */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {/* Tessera Contanti */}
        <div
          onClick={() => setSelectedAccountDetail('cash')}
          style={{
            background: 'linear-gradient(135deg, rgba(20, 83, 45, 0.85), rgba(15, 23, 42, 0.95))',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: '14px',
            padding: '12px 14px',
            color: '#fff',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '75px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#86efac', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              💵 Contanti
            </span>
            {cashRecurringCount > 0 && (
              <span
                onClick={(e) => { e.stopPropagation(); setShowRecurringModal(true); }}
                style={{
                  background: 'rgba(34, 197, 94, 0.25)',
                  border: '1px solid rgba(34, 197, 94, 0.4)',
                  color: '#86efac',
                  padding: '2px 6px',
                  borderRadius: '5px',
                  fontSize: '9px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px'
                }}
                title="Ricorrenti Contanti"
              >
                🔄 {cashRecurringCount}
              </span>
            )}
          </div>
          <div style={{ fontSize: '20px', fontWeight: '900', color: (finances.cashBalance || 0) >= 0 ? '#4ade80' : '#ef4444', marginTop: '6px' }}>
            {fmtCurrency(finances.cashBalance || 0)}
          </div>
        </div>

        {/* Tessera Conto Base */}
        <div
          onClick={() => setSelectedAccountDetail('base')}
          style={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98))',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '14px',
            padding: '12px 14px',
            color: '#fff',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '75px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              💳 {finances.baseAccountName || 'Conto Base'}
            </span>
            {baseRecurringCount > 0 && (
              <span
                onClick={(e) => { e.stopPropagation(); setShowRecurringModal(true); }}
                style={{
                  background: 'rgba(59, 130, 246, 0.25)',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  color: '#60a5fa',
                  padding: '2px 6px',
                  borderRadius: '5px',
                  fontSize: '9px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px'
                }}
                title="Ricorrenti Conto Base"
              >
                🔄 {baseRecurringCount}
              </span>
            )}
          </div>
          <div style={{ fontSize: '20px', fontWeight: '900', color: finances.balance >= 0 ? '#38bdf8' : '#ef4444', marginTop: '6px' }}>
            {fmtCurrency(finances.balance)}
          </div>
        </div>
      </div>

      {/* 3. Card Conti Secondari & Risparmi (Cliccabili per Scheda) */}
      <div style={{ background: 'var(--bg-secondary)', borderRadius: '14px', border: '1px solid var(--glass-border)', padding: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h3 style={{ margin: 0, fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)', textTransform: 'uppercase' }}>
            🏦 Conti Secondari & Risparmi
          </h3>
          <button
            type="button"
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
            {finances.secondaryAccounts.map(acc => {
              const secRecurring = (finances.recurringTransactions || []).filter(r => r.active && r.account === acc.id);
              return (
                <div
                  key={acc.id}
                  onClick={() => setSelectedAccountDetail(acc.id)}
                  style={{
                    background: 'var(--bg-primary)',
                    borderRadius: '10px',
                    padding: '8px 10px',
                    border: '1px solid var(--glass-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer'
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
                    {secRecurring.length > 0 && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setShowRecurringModal(true); }}
                        style={{
                          background: 'rgba(56, 189, 248, 0.15)',
                          border: '1px solid rgba(56, 189, 248, 0.3)',
                          color: '#38bdf8',
                          padding: '2px 6px',
                          borderRadius: '5px',
                          fontSize: '9px',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                        title="Ricorrenti per questo conto"
                      >
                        🔄 {secRecurring.length}
                      </button>
                    )}
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--accent-gold, #f59e0b)' }}>
                      {fmtCurrency(acc.balance)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Tessera Unificata: Movimenti & Categorie (con Imbuto Filtro 🌪️) */}
      <div style={{ background: 'var(--bg-secondary)', borderRadius: '14px', border: '1px solid var(--glass-border)', padding: '12px' }}>
        
        {/* Header & Sub-view Switch + Filter Funnel */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ display: 'flex', gap: '3px', background: 'var(--bg-primary)', padding: '2px', borderRadius: '8px' }}>
            <button
              onClick={() => setActiveSubView('transactions')}
              style={{
                background: activeSubView === 'transactions' ? 'var(--bg-card)' : 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '10px',
                fontWeight: activeSubView === 'transactions' ? 'bold' : 'normal',
                padding: '4px 7px',
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
                padding: '4px 7px',
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
                {['all', 'expense', 'income', 'transfer'].map(t => (
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
                    {t === 'all' ? 'Tutti' : t === 'expense' ? 'Uscite' : t === 'income' ? 'Entrate' : 'Trasferimenti'}
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

                const getAccountBadge = (tx) => {
                  if (tx.type === 'transfer') {
                    const srcName = getAccountLabel(tx.sourceAccount || 'base');
                    const dstName = getAccountLabel(tx.targetAccount || tx.account || 'cash');
                    return (
                      <span style={{ fontSize: '8px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '1px 4px', borderRadius: '4px', fontWeight: 'bold' }}>
                        {srcName} ➔ {dstName}
                      </span>
                    );
                  }
                  const accKey = tx.account || 'base';
                  if (accKey === 'cash') {
                    return <span style={{ fontSize: '8px', background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', padding: '1px 4px', borderRadius: '4px', fontWeight: 'bold' }}>💵 Contanti</span>;
                  }
                  if (accKey !== 'base') {
                    const sec = (finances.secondaryAccounts || []).find(a => a.id === accKey);
                    return <span style={{ fontSize: '8px', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', padding: '1px 4px', borderRadius: '4px', fontWeight: 'bold' }}>{sec ? `${sec.emoji || '🏦'} ${sec.name}` : '🏦 Secondo'}</span>;
                  }
                  return <span style={{ fontSize: '8px', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', padding: '1px 4px', borderRadius: '4px', fontWeight: 'bold' }}>💳 Base</span>;
                };

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
                      <span style={{ fontSize: '15px', flexShrink: 0 }}>{t.type === 'transfer' ? '↔️' : catObj.emoji}</span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {t.note || catObj.label}
                        </div>
                        <div style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '1px' }}>
                          <span>{t.date}</span>
                          {getAccountBadge(t)}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      <span style={{ fontSize: '11px', fontWeight: 'bold', color: t.type === 'transfer' ? '#38bdf8' : (isIncome ? '#22c55e' : '#ef4444') }}>
                        {t.type === 'transfer' ? '↔️ ' : (isIncome ? '+' : '-')}{fmtCurrency(t.amount)}
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

      {/* MODAL: Storico & Grafici Finanziari (Aperto cliccando il Totale del Tesoro) */}
      {showHistoryModal && (
        <div
          onClick={() => setShowHistoryModal(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '14px' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '18px', width: '100%', maxWidth: '420px', maxHeight: '90vh', overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}
          >
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                📈 Storico & Grafici Finanziari
              </h3>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: 'var(--text-muted)', borderRadius: '6px', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ✖
              </button>
            </div>

            {/* 1. Month Navigator Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-primary)', padding: '6px 10px', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
              <button
                type="button"
                onClick={() => { setSelectedHistoryMonth(prev => shiftMonthKey(prev, -1)); setSelectedHistoryWeek(null); }}
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', borderRadius: '6px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '12px' }}
                title="Mese precedente"
              >
                ◀
              </button>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)', letterSpacing: '0.3px' }}>
                  📅 {formatMonthLabel(selectedHistoryMonth)}
                </div>
                {selectedHistoryMonth !== currentMonthPrefix && (
                  <button
                    type="button"
                    onClick={() => { setSelectedHistoryMonth(currentMonthPrefix); setSelectedHistoryWeek(null); }}
                    style={{ background: 'transparent', border: 'none', color: 'var(--accent-primary, #38bdf8)', fontSize: '9px', textDecoration: 'underline', cursor: 'pointer', padding: 0, marginTop: '2px' }}
                  >
                    Torna al mese corrente
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => { setSelectedHistoryMonth(prev => shiftMonthKey(prev, 1)); setSelectedHistoryWeek(null); }}
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', borderRadius: '6px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '12px' }}
                title="Mese successivo"
              >
                ▶
              </button>
            </div>

            {/* 2. Monthly Financial Health KPI Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.25)', borderRadius: '10px', padding: '8px 10px' }}>
                <div style={{ fontSize: '9px', color: '#86efac', textTransform: 'uppercase', fontWeight: 'bold' }}>🟢 Entrate Mese</div>
                <div style={{ fontSize: '15px', fontWeight: '900', color: '#4ade80', marginTop: '2px' }}>
                  +{fmtCurrency(selMonthIncome)}
                </div>
              </div>
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '10px', padding: '8px 10px' }}>
                <div style={{ fontSize: '9px', color: '#fca5a5', textTransform: 'uppercase', fontWeight: 'bold' }}>🔴 Uscite Mese</div>
                <div style={{ fontSize: '15px', fontWeight: '900', color: '#f87171', marginTop: '2px' }}>
                  -{fmtCurrency(selMonthExpenses)}
                </div>
              </div>
              <div style={{ background: selMonthNet >= 0 ? 'rgba(56, 189, 248, 0.1)' : 'rgba(239, 68, 68, 0.15)', border: `1px solid ${selMonthNet >= 0 ? 'rgba(56, 189, 248, 0.25)' : 'rgba(239, 68, 68, 0.35)'}`, borderRadius: '10px', padding: '8px 10px' }}>
                <div style={{ fontSize: '9px', color: selMonthNet >= 0 ? '#7dd3fc' : '#fca5a5', textTransform: 'uppercase', fontWeight: 'bold' }}>
                  {selMonthNet >= 0 ? '⚖️ Risparmio Netto' : '⚠️ Deficit Mese'}
                </div>
                <div style={{ fontSize: '15px', fontWeight: '900', color: selMonthNet >= 0 ? '#38bdf8' : '#ef4444', marginTop: '2px' }}>
                  {selMonthNet >= 0 ? '+' : ''}{fmtCurrency(selMonthNet)}
                </div>
              </div>
              <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', borderRadius: '10px', padding: '8px 10px' }}>
                <div style={{ fontSize: '9px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>📊 Tasso Risparmio</div>
                <div style={{ fontSize: '15px', fontWeight: '900', color: selMonthSavingsRate >= 20 ? '#4ade80' : selMonthSavingsRate >= 0 ? '#fbbf24' : '#ef4444', marginTop: '2px' }}>
                  {selMonthSavingsRate}%
                </div>
              </div>
            </div>

            {/* 3. Horizon Switcher (Breve Periodo vs Lungo Periodo) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-primary)', padding: '3px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => { setHistoryRange('short'); setSelectedHistoryWeek(null); }}
                  style={{
                    background: historyRange === 'short' ? 'var(--bg-card)' : 'transparent',
                    border: historyRange === 'short' ? '1px solid var(--glass-border)' : 'none',
                    color: historyRange === 'short' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontSize: '10px',
                    fontWeight: historyRange === 'short' ? 'bold' : 'normal',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  📅 Breve (Settimanale)
                </button>
                <button
                  type="button"
                  onClick={() => { setHistoryRange('long'); setSelectedHistoryWeek(null); }}
                  style={{
                    background: historyRange === 'long' ? 'var(--bg-card)' : 'transparent',
                    border: historyRange === 'long' ? '1px solid var(--glass-border)' : 'none',
                    color: historyRange === 'long' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontSize: '10px',
                    fontWeight: historyRange === 'long' ? 'bold' : 'normal',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  📆 Lungo (Trend Mesi)
                </button>
              </div>
              {historyRange === 'long' && (
                <div style={{ display: 'flex', gap: '2px', paddingRight: '2px' }}>
                  <button
                    type="button"
                    onClick={() => setLongPeriodMonthsCount(6)}
                    style={{
                      background: longPeriodMonthsCount === 6 ? 'var(--accent-primary)' : 'transparent',
                      color: longPeriodMonthsCount === 6 ? '#fff' : 'var(--text-muted)',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '9px',
                      fontWeight: 'bold',
                      padding: '2px 5px',
                      cursor: 'pointer'
                    }}
                  >
                    6M
                  </button>
                  <button
                    type="button"
                    onClick={() => setLongPeriodMonthsCount(12)}
                    style={{
                      background: longPeriodMonthsCount === 12 ? 'var(--accent-primary)' : 'transparent',
                      color: longPeriodMonthsCount === 12 ? '#fff' : 'var(--text-muted)',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '9px',
                      fontWeight: 'bold',
                      padding: '2px 5px',
                      cursor: 'pointer'
                    }}
                  >
                    12M
                  </button>
                </div>
              )}
            </div>

            {/* 4a. Grafico Breve Periodo (Settimane del Mese) */}
            {historyRange === 'short' && (
              <div>
                <div style={{ background: 'var(--bg-primary)', padding: '12px 10px', borderRadius: '12px', border: '1px solid var(--glass-border)', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '10px', color: 'var(--text-secondary)' }}>
                    <span style={{ fontWeight: 'bold' }}>Andamento per settimana ({formatMonthShort(selectedHistoryMonth)})</span>
                    <div style={{ display: 'flex', gap: '8px', fontSize: '9px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><span style={{ width: '7px', height: '7px', borderRadius: '2px', background: '#4ade80', display: 'inline-block' }}></span> Entrate</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><span style={{ width: '7px', height: '7px', borderRadius: '2px', background: '#f87171', display: 'inline-block' }}></span> Uscite</span>
                    </div>
                  </div>

                  {/* Weekly Bar Chart Container */}
                  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '90px', gap: '6px', padding: '0 2px', marginBottom: '6px', borderBottom: '1px solid var(--glass-border)' }}>
                    {weeksData.map(wk => {
                      const incHeight = Math.max(4, Math.round((wk.income / maxWeekVal) * 75));
                      const expHeight = Math.max(4, Math.round((wk.expenses / maxWeekVal) * 75));
                      const isSelected = selectedHistoryWeek === wk.id;

                      return (
                        <div
                          key={wk.id}
                          onClick={() => setSelectedHistoryWeek(isSelected ? null : wk.id)}
                          style={{
                            flex: 1,
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'flex-end',
                            alignItems: 'center',
                            cursor: 'pointer',
                            borderRadius: '6px',
                            background: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                            padding: '2px 1px',
                            transition: 'all 0.15s ease'
                          }}
                          title={`${wk.title}: +${fmtCurrency(wk.income)} / -${fmtCurrency(wk.expenses)} (Netto: ${fmtCurrency(wk.net)})`}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '75px', justifyContent: 'center', width: '100%' }}>
                            {/* Income Bar */}
                            <div
                              style={{
                                width: '42%',
                                maxWidth: '12px',
                                height: `${wk.income > 0 ? incHeight : 3}px`,
                                background: wk.income > 0 ? '#4ade80' : 'rgba(255,255,255,0.06)',
                                borderRadius: '3px 3px 1px 1px',
                                boxShadow: wk.income > 0 ? '0 1px 4px rgba(74, 222, 128, 0.3)' : 'none'
                              }}
                            />
                            {/* Expense Bar */}
                            <div
                              style={{
                                width: '42%',
                                maxWidth: '12px',
                                height: `${wk.expenses > 0 ? expHeight : 3}px`,
                                background: wk.expenses > 0 ? '#f87171' : 'rgba(255,255,255,0.06)',
                                borderRadius: '3px 3px 1px 1px',
                                boxShadow: wk.expenses > 0 ? '0 1px 4px rgba(248, 113, 113, 0.3)' : 'none'
                              }}
                            />
                          </div>
                          <div style={{ fontSize: '8px', color: isSelected ? 'var(--accent-primary, #38bdf8)' : 'var(--text-muted)', fontWeight: isSelected ? 'bold' : 'normal', marginTop: '4px', textAlign: 'center' }}>
                            {wk.shortTitle}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Net summary pill row under bars */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '6px' }}>
                    {weeksData.map(wk => (
                      <div key={wk.id} style={{ flex: 1, textAlign: 'center' }}>
                        <span style={{ fontSize: '8px', fontWeight: 'bold', color: wk.net >= 0 ? (wk.net === 0 ? 'var(--text-muted)' : '#4ade80') : '#f87171' }}>
                          {wk.net > 0 ? '+' : ''}{fmtCurrency(wk.net)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Detail of selected week */}
                {selectedHistoryWeek && (() => {
                  const activeWk = weeksData.find(w => w.id === selectedHistoryWeek);
                  if (!activeWk) return null;
                  return (
                    <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '10px', border: '1px solid var(--glass-border)', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--accent-primary, #38bdf8)' }}>
                          🔎 Dettaglio: {activeWk.title}
                        </span>
                        <span style={{ fontSize: '9px', fontWeight: 'bold', color: activeWk.net >= 0 ? '#4ade80' : '#f87171' }}>
                          Saldo: {activeWk.net >= 0 ? '+' : ''}{fmtCurrency(activeWk.net)}
                        </span>
                      </div>
                      {activeWk.transactions.length === 0 ? (
                        <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '4px 0' }}>
                          Nessun movimento registrato in questa settimana.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '130px', overflowY: 'auto' }}>
                          {activeWk.transactions.map(t => {
                            const catObj = getCategoryObj(t.category);
                            const isInc = t.type === 'income';
                            return (
                              <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', background: 'var(--bg-secondary)', padding: '4px 6px', borderRadius: '6px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                                  <span>{t.type === 'transfer' ? '↔️' : catObj.emoji}</span>
                                  <span style={{ color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.note || catObj.label}</span>
                                  <span style={{ fontSize: '8px', color: 'var(--text-muted)' }}>{t.date}</span>
                                </div>
                                <span style={{ fontWeight: 'bold', color: t.type === 'transfer' ? '#38bdf8' : (isInc ? '#4ade80' : '#f87171'), flexShrink: 0 }}>
                                  {t.type === 'transfer' ? '↔️ ' : (isInc ? '+' : '-')}{fmtCurrency(t.amount)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* 4b. Grafico Lungo Periodo (Multi-Mese) */}
            {historyRange === 'long' && (
              <div>
                <div style={{ background: 'var(--bg-primary)', padding: '12px 10px', borderRadius: '12px', border: '1px solid var(--glass-border)', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '10px', color: 'var(--text-secondary)' }}>
                    <span style={{ fontWeight: 'bold' }}>Trend Storico Ultimi {longPeriodMonthsCount} Mesi</span>
                    <div style={{ display: 'flex', gap: '8px', fontSize: '9px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><span style={{ width: '7px', height: '7px', borderRadius: '2px', background: '#4ade80', display: 'inline-block' }}></span> Entrate</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><span style={{ width: '7px', height: '7px', borderRadius: '2px', background: '#f87171', display: 'inline-block' }}></span> Uscite</span>
                    </div>
                  </div>

                  {/* Multi-Month Bar Chart */}
                  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '90px', gap: '4px', padding: '0 2px', marginBottom: '6px', borderBottom: '1px solid var(--glass-border)' }}>
                    {longPeriodData.map(m => {
                      const incHeight = Math.max(4, Math.round((m.income / maxLongVal) * 75));
                      const expHeight = Math.max(4, Math.round((m.expenses / maxLongVal) * 75));
                      const isSelected = selectedHistoryMonth === m.monthKey;

                      return (
                        <div
                          key={m.monthKey}
                          onClick={() => setSelectedHistoryMonth(m.monthKey)}
                          style={{
                            flex: 1,
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'flex-end',
                            alignItems: 'center',
                            cursor: 'pointer',
                            borderRadius: '6px',
                            background: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                            padding: '2px 1px',
                            transition: 'all 0.15s ease'
                          }}
                          title={`${m.fullLabel}: +${fmtCurrency(m.income)} / -${fmtCurrency(m.expenses)} (Netto: ${fmtCurrency(m.net)})`}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '75px', justifyContent: 'center', width: '100%' }}>
                            {/* Income */}
                            <div
                              style={{
                                width: '42%',
                                maxWidth: '12px',
                                height: `${m.income > 0 ? incHeight : 3}px`,
                                background: m.income > 0 ? '#4ade80' : 'rgba(255,255,255,0.06)',
                                borderRadius: '3px 3px 1px 1px',
                                boxShadow: m.income > 0 ? '0 1px 4px rgba(74, 222, 128, 0.3)' : 'none'
                              }}
                            />
                            {/* Expense */}
                            <div
                              style={{
                                width: '42%',
                                maxWidth: '12px',
                                height: `${m.expenses > 0 ? expHeight : 3}px`,
                                background: m.expenses > 0 ? '#f87171' : 'rgba(255,255,255,0.06)',
                                borderRadius: '3px 3px 1px 1px',
                                boxShadow: m.expenses > 0 ? '0 1px 4px rgba(248, 113, 113, 0.3)' : 'none'
                              }}
                            />
                          </div>
                          <div style={{ fontSize: '8px', color: isSelected ? 'var(--accent-primary, #38bdf8)' : 'var(--text-muted)', fontWeight: isSelected ? 'bold' : 'normal', marginTop: '4px', textAlign: 'center' }}>
                            {m.shortLabel}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Net summary pill row under bars */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '4px' }}>
                    {longPeriodData.map(m => (
                      <div key={m.monthKey} style={{ flex: 1, textAlign: 'center' }}>
                        <span style={{ fontSize: '7px', fontWeight: 'bold', color: m.net >= 0 ? (m.net === 0 ? 'var(--text-muted)' : '#4ade80') : '#f87171' }}>
                          {m.net > 0 ? '+' : ''}{fmtCurrency(m.net)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Long Term Period Aggregate Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                  <div style={{ background: 'var(--bg-primary)', padding: '8px 10px', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                    <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>📊 Media Spese Mensili</div>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#f87171', marginTop: '2px' }}>
                      -{fmtCurrency(avgMonthlyExpense)}
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg-primary)', padding: '8px 10px', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                    <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>📈 Media Entrate Mensili</div>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#4ade80', marginTop: '2px' }}>
                      +{fmtCurrency(avgMonthlyIncome)}
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg-primary)', padding: '8px 10px', borderRadius: '10px', border: '1px solid var(--glass-border)', gridColumn: 'span 2' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>🏦 Risparmio Netto Totale ({longPeriodMonthsCount} Mesi)</div>
                        <div style={{ fontSize: '14px', fontWeight: '900', color: totalPeriodNet >= 0 ? '#38bdf8' : '#ef4444', marginTop: '2px' }}>
                          {totalPeriodNet >= 0 ? '+' : ''}{fmtCurrency(totalPeriodNet)}
                        </div>
                      </div>
                      {bestSavingsMonth && bestSavingsMonth.net > 0 && (
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '8px', color: '#86efac' }}>🌟 Miglior Mese</div>
                          <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                            {bestSavingsMonth.fullLabel} (+{fmtCurrency(bestSavingsMonth.net)})
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 5. RPG Financial Health Badge */}
            <div
              style={{
                background: selMonthNet >= 0
                  ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.12), rgba(15, 23, 42, 0.4))'
                  : 'linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(15, 23, 42, 0.4))',
                border: `1px solid ${selMonthNet >= 0 ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                borderRadius: '12px',
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <span style={{ fontSize: '24px' }}>
                {selMonthNet >= 0 ? (selMonthSavingsRate >= 30 ? '👑' : '🛡️') : '⚠️'}
              </span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: selMonthNet >= 0 ? '#4ade80' : '#f87171' }}>
                  {selMonthNet >= 0
                    ? (selMonthSavingsRate >= 30 ? 'Capitale Florido & Crescita' : 'Bilancio in Attivo')
                    : 'Attenzione al Deficit'}
                </div>
                <div style={{ fontSize: '9px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: '1.3' }}>
                  {selMonthNet >= 0
                    ? `In questo mese hai risparmiato ${fmtCurrency(selMonthNet)}. Il tuo forziere ringrazia!`
                    : `Le spese di questo mese superano le entrate di ${fmtCurrency(Math.abs(selMonthNet))}. Monitora le categorie secondarie.`}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: Scheda Dettaglio Conto */}
      {selectedAccountDetail !== null && (() => {
        const isBase = selectedAccountDetail === 'base';
        const isCash = selectedAccountDetail === 'cash';
        const secAccount = (!isBase && !isCash)
          ? (finances.secondaryAccounts || []).find(a => a.id === selectedAccountDetail)
          : null;

        const accId = isBase ? 'base' : (isCash ? 'cash' : (secAccount?.id || 'base'));
        const accName = isBase ? (finances.baseAccountName || 'Conto Base') : (isCash ? 'Contanti Disponibili' : (secAccount?.name || 'Conto Secondario'));
        const accEmoji = isBase ? '💳' : (isCash ? '💵' : (secAccount?.emoji || '🏦'));
        const accBalance = isBase ? finances.balance : (isCash ? (finances.cashBalance || 0) : (secAccount?.balance || 0));

        // Transactions belonging to this account
        const accTxList = (finances.transactions || []).filter(t => (t.account || 'base') === accId);
        const accMonthTxList = accTxList.filter(t => t.date && t.date.startsWith(currentMonthPrefix));
        const accMonthIncome = accMonthTxList.filter(t => t.type === 'income').reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
        const accMonthExpenses = accMonthTxList.filter(t => t.type === 'expense').reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
        const accMonthNet = Math.round((accMonthIncome - accMonthExpenses) * 100) / 100;

        // Recurring transactions on this account
        const accRecurring = (finances.recurringTransactions || []).filter(r => (r.account || 'base') === accId);

        return (
          <div
            onClick={() => setSelectedAccountDetail(null)}
            style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '18px', width: '100%', maxWidth: '360px', maxHeight: '85vh', overflowY: 'auto', padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              
              {/* Header (senza tasto ✖, chiusura al tocco esterno) */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '28px', background: 'var(--bg-primary)', padding: '6px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                    {accEmoji}
                  </span>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                        {accName}
                      </h3>
                      {isBase && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setBaseNameInput(finances.baseAccountName || 'Conto Base');
                            setShowRenameBaseModal(true);
                          }}
                          style={{
                            background: 'rgba(56, 189, 248, 0.15)',
                            border: '1px solid rgba(56, 189, 248, 0.3)',
                            color: '#38bdf8',
                            borderRadius: '6px',
                            padding: '2px 6px',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}
                          title="Rinomina conto"
                        >
                          ✏️ Rinomina
                        </button>
                      )}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {isBase ? 'Conto Principale di Addebito/Accredito' : (isCash ? 'Liquidità fisica nel portafoglio' : 'Conto Risparmi / Secondario')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Saldo Hero */}
              <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '12px', border: '1px solid var(--glass-border)', textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 'bold', textTransform: 'uppercase' }}>
                  Saldo Attuale
                </div>
                <div style={{ fontSize: '24px', fontWeight: '900', color: accBalance >= 0 ? '#38bdf8' : '#ef4444', marginTop: '2px' }}>
                  {fmtCurrency(accBalance)}
                </div>
                {secAccount && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '6px' }}>
                    {secAccount.interestRate > 0 && (
                      <span style={{ fontSize: '9px', background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                        +{secAccount.interestRate}% p.a. interessi
                      </span>
                    )}
                    <span style={{ fontSize: '9px', background: 'var(--bg-secondary)', color: 'var(--text-muted)', padding: '2px 6px', borderRadius: '4px' }}>
                      {secAccount.lockPeriodMonths > 0 ? `⏳ Vincolo: ${secAccount.lockPeriodMonths} mesi` : '🔓 Svincolato'}
                    </span>
                  </div>
                )}
              </div>

              {/* Monthly Performance for this Account */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.25)', borderRadius: '8px', padding: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '8px', color: '#86efac', fontWeight: 'bold' }}>ENTRATE</div>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#4ade80', marginTop: '2px' }}>
                    +{fmtCurrency(accMonthIncome)}
                  </div>
                </div>
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '8px', padding: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '8px', color: '#fca5a5', fontWeight: 'bold' }}>USCITE</div>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#f87171', marginTop: '2px' }}>
                    -{fmtCurrency(accMonthExpenses)}
                  </div>
                </div>
                <div style={{ background: accMonthNet >= 0 ? 'rgba(56, 189, 248, 0.1)' : 'rgba(239, 68, 68, 0.15)', border: `1px solid ${accMonthNet >= 0 ? 'rgba(56, 189, 248, 0.25)' : 'rgba(239, 68, 68, 0.35)'}`, borderRadius: '8px', padding: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '8px', color: accMonthNet >= 0 ? '#7dd3fc' : '#fca5a5', fontWeight: 'bold' }}>FLUSSO NETTO</div>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: accMonthNet >= 0 ? '#38bdf8' : '#ef4444', marginTop: '2px' }}>
                    {accMonthNet >= 0 ? '+' : ''}{fmtCurrency(accMonthNet)}
                  </div>
                </div>
              </div>

              {/* Quick actions for this account */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Operazioni Conto</div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {secAccount && (
                    <>
                      <button
                        type="button"
                        onClick={() => { setSelectedAccountDetail(null); setSecActionAmount(''); setSecAccountAction({ account: secAccount, type: 'deposit' }); }}
                        style={{ flex: 1, minWidth: '80px', padding: '6px', borderRadius: '8px', background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.3)', color: '#4ade80', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        + Deposita
                      </button>
                      <button
                        type="button"
                        onClick={() => { setSelectedAccountDetail(null); setSecActionAmount(''); setSecAccountAction({ account: secAccount, type: 'withdraw' }); }}
                        style={{ flex: 1, minWidth: '80px', padding: '6px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        - Preleva
                      </button>
                      {secAccount.interestRate > 0 && (
                        <button
                          type="button"
                          onClick={() => { setSelectedAccountDetail(null); setSecAccountAction({ account: secAccount, type: 'interest' }); }}
                          style={{ flex: 1, minWidth: '100px', padding: '6px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#38bdf8', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                          📈 Accredita Interessi
                        </button>
                      )}
                    </>
                  )}
                  {isBase && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setBaseNameInput(finances.baseAccountName || 'Conto Base');
                          setShowRenameBaseModal(true);
                        }}
                        style={{ flex: 1, minWidth: '105px', padding: '6px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#38bdf8', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        ✏️ Rinomina Conto
                      </button>
                      <button
                        type="button"
                        onClick={() => { setSelectedAccountDetail(null); setBudgetInput(finances.monthlyBudget || 1000); setShowBudgetModal(true); }}
                        style={{ flex: 1, minWidth: '110px', padding: '6px', borderRadius: '8px', background: 'rgba(251, 191, 36, 0.15)', border: '1px solid rgba(251, 191, 36, 0.3)', color: '#fbbf24', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        🎯 Budget ({fmtCurrency(finances.monthlyBudget || 1000)})
                      </button>
                    </>
                  )}
                  {isCash && (
                    <button
                      type="button"
                      onClick={() => { setSelectedAccountDetail(null); setWithdrawAmount(''); setWithdrawSource('base'); setShowWithdrawModal(true); }}
                      style={{ flex: 1, minWidth: '100px', padding: '6px', borderRadius: '8px', background: 'rgba(234, 179, 8, 0.15)', border: '1px solid rgba(234, 179, 8, 0.3)', color: '#fde047', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      🏧 Preleva Contanti
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => { setSelectedAccountDetail(null); handleOpenTransferModal(accId, isBase ? 'cash' : 'base'); }}
                    style={{ flex: 1, minWidth: '100px', padding: '6px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    ↔️ Trasferisci Denaro
                  </button>
                  {secAccount && (
                    <button
                      type="button"
                      onClick={() => { setSelectedAccountDetail(null); handleDeleteSecAccount(secAccount.id); }}
                      style={{ padding: '6px 10px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#ef4444', fontSize: '10px', cursor: 'pointer' }}
                      title="Elimina conto secondario"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>

              {/* Recurring transactions on this account */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                    🔄 Ricorrenti su questo conto ({accRecurring.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => { setSelectedAccountDetail(null); setShowRecurringModal(true); }}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-primary, #38bdf8)', fontSize: '9px', textDecoration: 'underline', cursor: 'pointer', padding: 0 }}
                  >
                    Gestisci tutte
                  </button>
                </div>
                {accRecurring.length === 0 ? (
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontStyle: 'italic', background: 'var(--bg-primary)', padding: '6px 8px', borderRadius: '6px' }}>
                    Nessun pagamento o entrata ricorrente configurato su questo conto.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {accRecurring.map(r => {
                      const catObj = getCategoryObj(r.category);
                      const isInc = r.type === 'income';
                      return (
                        <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-primary)', padding: '6px 8px', borderRadius: '6px', fontSize: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{catObj.emoji}</span>
                            <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{r.note || catObj.label}</span>
                            <span style={{ fontSize: '8px', color: 'var(--text-muted)' }}>ogni {r.dayOfMonth}° del mese</span>
                          </div>
                          <span style={{ fontWeight: 'bold', color: isInc ? '#22c55e' : '#ef4444' }}>
                            {isInc ? '+' : '-'}{fmtCurrency(r.amount)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Recent Transactions list for this account */}
              <div>
                <div style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  📜 Movimenti del Conto ({accTxList.length})
                </div>
                {accTxList.length === 0 ? (
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontStyle: 'italic', background: 'var(--bg-primary)', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                    Nessun movimento registrato su questo conto.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '160px', overflowY: 'auto' }}>
                    {accTxList.slice(0, 30).map(t => {
                      const catObj = getCategoryObj(t.category);
                      const isInc = t.type === 'income';
                      return (
                        <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-primary)', padding: '5px 8px', borderRadius: '6px', fontSize: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                            <span>{t.type === 'transfer' ? '↔️' : catObj.emoji}</span>
                            <span style={{ color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {t.note || catObj.label}
                            </span>
                            <span style={{ fontSize: '8px', color: 'var(--text-muted)' }}>{t.date}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: 'bold', color: t.type === 'transfer' ? '#38bdf8' : (isInc ? '#4ade80' : '#f87171') }}>
                              {t.type === 'transfer' ? '↔️ ' : (isInc ? '+' : '-')}{fmtCurrency(t.amount)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteTransaction(t.id)}
                              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '9px', cursor: 'pointer', padding: 0 }}
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

              {/* Hint chiusura al tocco esterno */}
              <div style={{ textAlign: 'center', fontSize: '10px', color: 'var(--text-muted)', paddingTop: '4px' }}>
                Tocca all'esterno per chiudere
              </div>

            </div>
          </div>
        );
      })()}

      {/* MODAL: Nuova Uscita / Entrata */}
      {showAddTxModal && (
        <div
          onClick={() => setShowAddTxModal(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '18px', width: '100%', maxWidth: '320px', padding: '18px' }}
          >
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
                  {txModalMode === 'expense' ? 'Conto da Addebitare' : 'Conto di Accredito'}
                </label>
                <select
                  value={txAccountInput}
                  onChange={(e) => setTxAccountInput(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '12px', marginTop: '2px', boxSizing: 'border-box' }}
                >
                  <option value="base">💳 {finances.baseAccountName || 'Conto Base'} ({fmtCurrency(finances.balance)})</option>
                  <option value="cash">💵 Contanti Disponibili ({fmtCurrency(finances.cashBalance || 0)})</option>
                  {finances.secondaryAccounts && finances.secondaryAccounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.emoji || '🏦'} {acc.name} ({fmtCurrency(acc.balance)})</option>
                  ))}
                </select>
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
        <div
          onClick={() => setShowRecurringModal(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '18px', width: '100%', maxWidth: '340px', padding: '18px' }}
          >
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
        <div
          onClick={() => setShowAddSecModal(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '18px', width: '100%', maxWidth: '320px', padding: '18px' }}
          >
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
        <div
          onClick={() => setSecAccountAction(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '18px', width: '100%', maxWidth: '320px', padding: '18px' }}
          >
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
        <div
          onClick={() => setShowBudgetModal(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '18px', width: '100%', maxWidth: '320px', padding: '18px' }}
          >
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

      {/* MODAL: Preleva Contanti */}
      {showWithdrawModal && (
        <div
          onClick={() => setShowWithdrawModal(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '18px', width: '100%', maxWidth: '320px', padding: '18px' }}
          >
            <h3 style={{ margin: '0 0 14px 0', fontSize: '15px', fontWeight: 'bold', color: '#fde047', display: 'flex', alignItems: 'center', gap: '6px' }}>
              🏧 Preleva Contanti
            </h3>

            <form onSubmit={handleWithdrawCashSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Preleva Da (Conto Sorgente)</label>
                <select
                  value={withdrawSource}
                  onChange={(e) => setWithdrawSource(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '12px', marginTop: '2px', boxSizing: 'border-box' }}
                >
                  <option value="base">💳 {finances.baseAccountName || 'Conto Base'} ({fmtCurrency(finances.balance)})</option>
                  {finances.secondaryAccounts && finances.secondaryAccounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.emoji || '🏦'} {acc.name} ({fmtCurrency(acc.balance)})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Importo da Prelevare (€)*</label>
                <input
                  type="text"
                  placeholder="50"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  autoFocus
                  required
                  style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '15px', fontWeight: 'bold', marginTop: '2px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ fontSize: '10px', color: 'var(--text-secondary)', background: 'var(--bg-primary)', padding: '8px', borderRadius: '6px', border: '1px solid var(--glass-border)' }}>
                💡 L'importo verrà scalato dal conto selezionato e aggiunto al tuo fondo <b>💵 Contanti Disponibili</b>.
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  style={{ flex: 1, padding: '9px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text-primary)', fontSize: '11px', cursor: 'pointer' }}
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '9px', borderRadius: '8px', border: 'none', background: '#eab308', color: '#000', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Conferma Prelievo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Trasferimento tra Conti */}
      {showTransferModal && (
        <div
          onClick={() => setShowTransferModal(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '18px', width: '100%', maxWidth: '340px', padding: '18px' }}
          >
            <h3 style={{ margin: '0 0 14px 0', fontSize: '15px', fontWeight: 'bold', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
              ↔️ Trasferimento tra Conti
            </h3>

            <form onSubmit={handleTransferSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Conto di Origine (Da)*</label>
                <select
                  value={transferSource}
                  onChange={(e) => {
                    const newSrc = e.target.value;
                    setTransferSource(newSrc);
                    if (newSrc === transferTarget) {
                      setTransferTarget(newSrc === 'base' ? 'cash' : 'base');
                    }
                  }}
                  style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '12px', marginTop: '2px', boxSizing: 'border-box' }}
                >
                  <option value="base">💳 {finances.baseAccountName || 'Conto Base'} ({fmtCurrency(finances.balance)})</option>
                  <option value="cash">💵 Contanti Disponibili ({fmtCurrency(finances.cashBalance || 0)})</option>
                  {finances.secondaryAccounts && finances.secondaryAccounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.emoji || '🏦'} {acc.name} ({fmtCurrency(acc.balance)})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Conto di Destinazione (A)*</label>
                <select
                  value={transferTarget}
                  onChange={(e) => setTransferTarget(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '12px', marginTop: '2px', boxSizing: 'border-box' }}
                >
                  {transferSource !== 'base' && <option value="base">💳 {finances.baseAccountName || 'Conto Base'} ({fmtCurrency(finances.balance)})</option>}
                  {transferSource !== 'cash' && <option value="cash">💵 Contanti Disponibili ({fmtCurrency(finances.cashBalance || 0)})</option>}
                  {finances.secondaryAccounts && finances.secondaryAccounts.filter(acc => acc.id !== transferSource).map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.emoji || '🏦'} {acc.name} ({fmtCurrency(acc.balance)})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Importo da Trasferire (€)*</label>
                <input
                  type="text"
                  placeholder="0.00"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  autoFocus
                  required
                  style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '15px', fontWeight: 'bold', marginTop: '2px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Nota / Descrizione (Opzionale)</label>
                <input
                  type="text"
                  placeholder="Es. Spostamento risparmi, Ricarica contanti..."
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '12px', marginTop: '2px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Data Operazione</label>
                <input
                  type="date"
                  value={transferDate}
                  onChange={(e) => setTransferDate(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '12px', marginTop: '2px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ fontSize: '10px', color: 'var(--text-secondary)', background: 'var(--bg-primary)', padding: '8px', borderRadius: '6px', border: '1px solid var(--glass-border)', lineHeight: '1.4' }}>
                💡 I trasferimenti spostano liquidità tra i tuoi conti senza incidere sulle entrate, sulle uscite o sul budget mensile.
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  style={{ flex: 1, padding: '9px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text-primary)', fontSize: '11px', cursor: 'pointer' }}
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '9px', borderRadius: '8px', border: 'none', background: '#38bdf8', color: '#000', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Conferma Trasferimento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Rinomina Conto Base */}
      {showRenameBaseModal && (
        <div
          onClick={() => setShowRenameBaseModal(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 10001, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '16px', width: '100%', maxWidth: '320px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}
          >
            <h4 style={{ margin: 0, fontSize: '15px', color: 'var(--text-primary)' }}>✏️ Rinomina Conto Base</h4>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Personalizza il nome del tuo conto principale (es. Intesa Sanpaolo, Fineco, BBVA...)
            </div>
            <input
              type="text"
              value={baseNameInput}
              onChange={(e) => setBaseNameInput(e.target.value)}
              placeholder="Es. Intesa Sanpaolo, Fineco..."
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '14px', boxSizing: 'border-box' }}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveBaseAccountName();
                if (e.key === 'Escape') setShowRenameBaseModal(false);
              }}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => setShowRenameBaseModal(false)}
                style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px' }}
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={handleSaveBaseAccountName}
                style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'var(--accent-primary)', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}
              >
                Salva
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
