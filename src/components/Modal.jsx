import React, { useState, useEffect } from 'react';

export default function Modal({ isOpen, onClose, type, editData, onSave, onDelete, stats, xpLog, oneshots = [], habits = [], quests = [], settings, onEditStat }) {
  if (!isOpen) return null;

  const [currentType, setCurrentType] = useState(type);
  const [form, setForm] = useState({});
  const [subquests, setSubquests] = useState([]);
  const [newSubquestName, setNewSubquestName] = useState('');
  const [selectedDayIndex, setSelectedDayIndex] = useState(6);

  useEffect(() => {
    setCurrentType(type);
  }, [type]);

  const handleTypeSwitch = (newType) => {
    setCurrentType(newType);
    if (newType === 'habit') {
      setForm({
        emoji: '📜',
        name: form.name || '',
        frequency: 'daily',
        freqTimes: 1,
        difficulty: form.difficulty || 3,
        primaryTarget: form.primaryTarget || stats?.[0]?.id || 'str',
        secondaryTarget: form.secondaryTarget || stats?.[1]?.id || 'con'
      });
    } else if (newType === 'oneshot') {
      setForm({
        emoji: '💥',
        name: form.name || '',
        difficulty: form.difficulty || 3,
        primaryTarget: form.primaryTarget || stats?.[0]?.id || 'str',
        secondaryTarget: form.secondaryTarget || stats?.[1]?.id || 'con',
        completed: false
      });
    } else if (newType === 'quest') {
      setForm({
        emoji: '🏆',
        name: form.name || '',
        description: form.description || '',
        difficulty: form.difficulty || 3,
        primaryTarget: form.primaryTarget || stats?.[0]?.id || 'str',
        secondaryTarget: form.secondaryTarget || stats?.[1]?.id || 'con',
        completed: false
      });
      setSubquests([]);
    }
  };

  const getStatHistory7Days = (statId) => {
    const today = new Date();
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = i === 0 ? 'Oggi' : `${d.getDate()}/${d.getMonth() + 1}`;

      const dayLogs = (xpLog || []).filter(
        log => log.statId === statId && log.date === dateStr && log.amount > 0
      );

      const totalXp = dayLogs.reduce((acc, curr) => acc + (curr.amount || 0), 0);

      days.push({
        dateStr,
        dayLabel,
        totalXp,
        logs: dayLogs
      });
    }
    return days;
  };

  // Prepopulate form fields if editing or set defaults
  useEffect(() => {
    if (editData) {
      setForm({ ...editData });
      if (type === 'quest' && editData.subquests) {
        setSubquests([...editData.subquests]);
      }
    } else {
      // Default initial states based on currentType
      const activeT = currentType || type;
      if (activeT === 'attribute' || activeT === 'ability') {
        setForm({ emoji: '⭐', name: '', description: '', type: activeT, visible: true, level: 1, xp: 0 });
      } else if (activeT === 'habit') {
        setForm({
          emoji: '📜',
          name: '',
          frequency: 'daily',
          freqTimes: 1,
          difficulty: 3,
          primaryTarget: stats[0]?.id || 'str',
          secondaryTarget: stats[1]?.id || 'con'
        });
      } else if (activeT === 'oneshot') {
        setForm({
          emoji: '💥',
          name: '',
          difficulty: 3,
          primaryTarget: stats[0]?.id || 'str',
          secondaryTarget: stats[1]?.id || 'con',
          completed: false
        });
      } else if (activeT === 'quest') {
        setForm({
          emoji: '🏆',
          name: '',
          description: '',
          difficulty: 3,
          primaryTarget: stats[0]?.id || 'str',
          secondaryTarget: stats[1]?.id || 'con',
          completed: false
        });
        setSubquests([]);
      } else if (activeT === 'food') {
        setForm({ emoji: '🍎', name: '', baseGrams: 100, baseCalories: 100, baseProteins: 10, category: 'snack' });
      } else if (activeT === 'exercise') {
        setForm({ emoji: '🏃', name: '', baseCount: 10, baseCalories: 50, xpReward: 10, statId: 'str' });
      } else if (activeT === 'weight') {
        setForm({ current: 75, target: 70, currentLean: 0, targetLean: 0, currentFat: 0, targetFat: 0 });
      } else if (activeT?.startsWith('health_')) {
        setForm({ value: 0 });
      }
    }
  }, [type, currentType, editData, stats]);

  const handleChange = (e) => {
    const { name, value, type: inputType, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: inputType === 'checkbox' ? checked : value
    }));
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    if (value === '' || value === null || value === undefined) {
      setForm(prev => ({
        ...prev,
        [name]: ''
      }));
    } else {
      const num = parseFloat(value);
      setForm(prev => ({
        ...prev,
        [name]: isNaN(num) ? '' : value
      }));
    }
  const handleCalculateTdee = () => {
    const weight = parseFloat(form.calcWeight || form.targetWeight) || 75;
    const height = parseFloat(form.calcHeight) || 175;
    const age = parseFloat(form.calcAge) || 28;
    const gender = form.calcGender || 'male';
    const activity = parseFloat(form.calcActivity) || 1.375;
    const goalType = form.calcGoalType || 'maintenance';

    let bmr = (10 * weight) + (6.25 * height) - (5 * age);
    if (gender === 'male') {
      bmr += 5;
    } else {
      bmr -= 161;
    }

    const tdeeBase = bmr * activity;
    let targetCal = tdeeBase;
    let proteinMultiplier = 1.6;

    if (goalType === 'loss') {
      targetCal = tdeeBase * 0.85;
      proteinMultiplier = 2.0;
    } else if (goalType === 'gain') {
      targetCal = tdeeBase * 1.15;
      proteinMultiplier = 1.8;
    } else {
      targetCal = tdeeBase;
      proteinMultiplier = 1.6;
    }

    setForm(prev => ({
      ...prev,
      calorieGoal: Math.round(targetCal),
      proteinGoal: Math.round(weight * proteinMultiplier)
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    const activeT = currentType || type;
    if (activeT === 'quest') {
      onSave({ ...form, _targetType: activeT, subquests });
    } else {
      onSave({ ...form, _targetType: activeT });
    }
    onClose();
  };

  // Subquest functions (for Quest creator)
  const addSubquest = () => {
    if (!newSubquestName.trim()) return;
    setSubquests([...subquests, {
      id: 'sub_' + Date.now() + '_' + Math.floor(Math.random() * 100),
      name: newSubquestName.trim(),
      completed: false
    }]);
    setNewSubquestName('');
  };

  const removeSubquest = (id) => {
    setSubquests(subquests.filter(sq => sq.id !== id));
  };

  // Render specific form contents based on type
  const renderFormFields = () => {
    const visibleStats = stats?.filter(s => s.visible) || [];

    switch (currentType || type) {
      case 'attribute':
      case 'ability':
        return (
          <div className="flex flex-col gap-4">
            <div className="flex gap-3">
              <div className="w-14">
                <label className="block text-xs text-text-secondary font-bold mb-1.5">Emoji</label>
                <input
                  type="text"
                  name="emoji"
                  value={form.emoji || ''}
                  onChange={handleChange}
                  className="w-full h-11 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded-2xl text-center text-xl focus:border-accent-primary focus:outline-none"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-text-secondary font-bold mb-1.5">Nome</label>
                <input
                  type="text"
                  name="name"
                  value={form.name || ''}
                  onChange={handleChange}
                  required
                  placeholder={type === 'attribute' ? 'Forza, Destrezza...' : 'Scrittura, Disegno...'}
                  className="w-full h-11 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded-2xl px-5 text-xs font-semibold focus:border-accent-primary focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-text-secondary font-bold mb-1.5">Descrizione</label>
              <textarea
                name="description"
                value={form.description || ''}
                onChange={handleChange}
                rows="3"
                placeholder="A cosa serve questo attributo/abilità..."
                className="w-full bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded-2xl p-3 px-5 text-xs font-semibold focus:border-accent-primary focus:outline-none resize-none"
              ></textarea>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="checkbox"
                name="visible"
                id="visible"
                checked={form.visible !== false}
                onChange={handleChange}
                className="rounded text-accent-primary focus:ring-accent-primary"
              />
              <label htmlFor="visible" className="text-xs text-text-main select-none font-medium">
                Mostra nel Radar Chart
              </label>
            </div>
          </div>
        );

      case 'habit':
        return (
          <div className="flex flex-col gap-4">
            {/* Row 1: Emoji + Nome Abitudine */}
            <div className="flex gap-3">
              <div className="w-14">
                <label className="block text-xs text-text-secondary font-bold mb-1.5">Emoji</label>
                <input
                  type="text"
                  name="emoji"
                  value={form.emoji || ''}
                  onChange={handleChange}
                  className="w-full h-11 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded-2xl text-center text-xl focus:border-accent-primary focus:outline-none"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-text-secondary font-bold mb-1.5">Nome Abitudine</label>
                <input
                  type="text"
                  name="name"
                  value={form.name || ''}
                  onChange={handleChange}
                  required
                  placeholder="Es: Leggere 10 min, Meditazione..."
                  className="w-full h-11 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded-2xl px-5 text-xs font-semibold focus:border-accent-primary focus:outline-none"
                />
              </div>
            </div>

            {/* Row 2: Frequenza (Full width if daily/weekly/monthly, 2 cols if times_) */}
            {form.frequency?.startsWith('times_') ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-text-secondary font-bold mb-1.5">Frequenza</label>
                  <select
                    name="frequency"
                    value={form.frequency || 'daily'}
                    onChange={handleChange}
                    className="w-full h-11 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded-2xl px-5 pr-9 text-xs font-bold focus:border-accent-primary focus:outline-none"
                  >
                    <option value="daily">Giornaliera</option>
                    <option value="weekly">Settimanale (1 volta)</option>
                    <option value="monthly">Mensile (1 volta)</option>
                    <option value="times_week">N volte a Settimana</option>
                    <option value="times_month">N volte al Mese</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-text-secondary font-bold mb-1.5">Ripetizioni</label>
                  <input
                    type="number"
                    name="freqTimes"
                    value={form.freqTimes || 1}
                    onChange={handleNumberChange}
                    min="1"
                    className="w-full h-11 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded-2xl px-5 text-xs font-semibold focus:border-accent-primary focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs text-text-secondary font-bold mb-1.5">Frequenza</label>
                <select
                  name="frequency"
                  value={form.frequency || 'daily'}
                  onChange={handleChange}
                  className="w-full h-11 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded-2xl px-5 pr-9 text-xs font-bold focus:border-accent-primary focus:outline-none"
                >
                  <option value="daily">Giornaliera</option>
                  <option value="weekly">Settimanale (1 volta)</option>
                  <option value="monthly">Mensile (1 volta)</option>
                  <option value="times_week">N volte a Settimana</option>
                  <option value="times_month">N volte al Mese</option>
                </select>
              </div>
            )}

            {/* Row 3: Difficoltà */}
            <div>
              <label className="block text-xs text-text-secondary font-bold mb-1.5">Difficoltà</label>
              <div
                className="w-full h-11 bg-[var(--bg-secondary)] border border-[var(--glass-border)] rounded-2xl flex justify-between items-center"
                style={{ paddingLeft: '24px', paddingRight: '24px' }}
              >
                <span className="text-xs text-text-muted font-semibold" style={{ paddingLeft: '6px' }}>
                  {(form.difficulty || 3) * 4} XP Bonus
                </span>
                <div className="flex gap-1.5 text-xl items-center" style={{ paddingRight: '6px' }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <span
                      key={star}
                      onClick={() => setForm(prev => ({ ...prev, difficulty: star }))}
                      className={`cursor-pointer transition-all duration-150 transform hover:scale-125 select-none ${
                        star <= (form.difficulty || 3) ? 'text-yellow-400 drop-shadow' : 'text-slate-600 opacity-30'
                      }`}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 4: Stat Primaria & Secondaria */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-text-secondary font-bold mb-1.5">Stat. Primaria</label>
                <select
                  name="primaryTarget"
                  value={form.primaryTarget || ''}
                  onChange={handleChange}
                  className="w-full h-11 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded-2xl px-5 pr-9 text-xs font-bold focus:border-accent-primary focus:outline-none"
                >
                  {visibleStats.map(s => (
                    <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-text-secondary font-bold mb-1.5">Stat. Secondaria</label>
                <select
                  name="secondaryTarget"
                  value={form.secondaryTarget || ''}
                  onChange={handleChange}
                  className="w-full h-11 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded-2xl px-5 pr-9 text-xs font-bold focus:border-accent-primary focus:outline-none"
                >
                  <option value="">Nessuna</option>
                  {visibleStats.map(s => (
                    <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        );

      case 'oneshot':
        return (
          <div className="flex flex-col gap-3.5">
            {/* Tessera 1: Emoji + Nome Task */}
            <div className="flex gap-3">
              <div className="w-14">
                <label className="block text-xs text-text-secondary font-bold mb-1.5">Emoji</label>
                <input
                  type="text"
                  name="emoji"
                  value={form.emoji || ''}
                  onChange={handleChange}
                  className="w-full h-11 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded-2xl text-center text-xl focus:border-accent-primary focus:outline-none"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-text-secondary font-bold mb-1.5">Nome Task</label>
                <input
                  type="text"
                  name="name"
                  value={form.name || ''}
                  onChange={handleChange}
                  required
                  placeholder="Es: Rispondere alle email, Riparare rubinetto..."
                  className="w-full h-11 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded-2xl px-5 text-xs font-semibold focus:border-accent-primary focus:outline-none"
                />
              </div>
            </div>

            {/* Tessera 2: Data Entro Cui Ultimare (Scadenza) */}
            <div>
              <label className="block text-xs text-text-secondary font-bold mb-1.5">📅 Ultimare Entro (Scadenza)</label>
              <input
                type="date"
                name="dueDate"
                value={form.dueDate || ''}
                onChange={handleChange}
                className="w-full h-11 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded-2xl px-5 text-xs font-semibold focus:border-accent-primary focus:outline-none"
              />
            </div>

            {/* Tessera 3: Difficoltà Stelle */}
            <div>
              <label className="block text-xs text-text-secondary font-bold mb-1.5">Difficoltà</label>
              <div
                className="w-full h-11 bg-[var(--bg-secondary)] border border-[var(--glass-border)] rounded-2xl flex justify-between items-center"
                style={{ paddingLeft: '24px', paddingRight: '24px' }}
              >
                <span className="text-xs text-text-muted font-semibold" style={{ paddingLeft: '6px' }}>
                  {(form.difficulty || 3) * 8} XP Bonus
                </span>
                <div className="flex gap-1.5 text-xl items-center" style={{ paddingRight: '6px' }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <span
                      key={star}
                      onClick={() => setForm(prev => ({ ...prev, difficulty: star }))}
                      className={`cursor-pointer transition-all duration-150 transform hover:scale-125 select-none ${
                        star <= (form.difficulty || 3) ? 'text-yellow-400 drop-shadow' : 'text-slate-600 opacity-30'
                      }`}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Tessera 4: Stat Primaria & Secondaria */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-text-secondary font-bold mb-1.5">Stat. Primaria</label>
                <select
                  name="primaryTarget"
                  value={form.primaryTarget || ''}
                  onChange={handleChange}
                  className="w-full h-11 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded-2xl px-5 pr-9 text-xs font-bold focus:border-accent-primary focus:outline-none"
                >
                  {visibleStats.map(s => (
                    <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-text-secondary font-bold mb-1.5">Stat. Secondaria</label>
                <select
                  name="secondaryTarget"
                  value={form.secondaryTarget || ''}
                  onChange={handleChange}
                  className="w-full h-11 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded-2xl px-5 pr-9 text-xs font-bold focus:border-accent-primary focus:outline-none"
                >
                  <option value="">Nessuna</option>
                  {visibleStats.map(s => (
                    <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        );

      case 'quest':
        return (
          <div className="flex flex-col gap-4">
            {/* Row 1: Emoji + Nome Campagna */}
            <div className="flex gap-3">
              <div className="w-14">
                <label className="block text-xs text-text-secondary font-bold mb-1.5">Emoji</label>
                <input
                  type="text"
                  name="emoji"
                  value={form.emoji || ''}
                  onChange={handleChange}
                  className="w-full h-11 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded-2xl text-center text-xl focus:border-accent-primary focus:outline-none"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-text-secondary font-bold mb-1.5">Nome Campagna</label>
                <input
                  type="text"
                  name="name"
                  value={form.name || ''}
                  onChange={handleChange}
                  required
                  placeholder="Es: Imparare React, Scrivere un libro..."
                  className="w-full h-11 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded-2xl px-5 text-xs font-semibold focus:border-accent-primary focus:outline-none"
                />
              </div>
            </div>

            {/* Row 2: Descrizione */}
            <div>
              <label className="block text-xs text-text-secondary font-bold mb-1.5">Descrizione</label>
              <textarea
                name="description"
                value={form.description || ''}
                onChange={handleChange}
                rows="2"
                placeholder="Spiega l'obiettivo finale di questa campagna..."
                className="w-full bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded-2xl p-3 px-5 text-xs font-semibold focus:border-accent-primary focus:outline-none resize-none"
              ></textarea>
            </div>

            {/* Premio al completamento */}
            <div>
              <label className="block text-xs text-text-secondary font-bold mb-1.5">🎁 Premio finale (Reward)</label>
              <input
                type="text"
                name="reward"
                value={form.reward || ''}
                onChange={handleChange}
                placeholder="Es: Cena al ristorante, Nuovo regalo, Giornata SPA..."
                className="w-full h-11 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded-2xl px-5 text-xs font-semibold focus:border-accent-primary focus:outline-none"
              />
            </div>

            {/* Row 3: Difficoltà */}
            <div>
              <label className="block text-xs text-text-secondary font-bold mb-1.5">Difficoltà</label>
              <div
                className="w-full h-11 bg-[var(--bg-secondary)] border border-[var(--glass-border)] rounded-2xl flex justify-between items-center"
                style={{ paddingLeft: '24px', paddingRight: '24px' }}
              >
                <span className="text-xs text-text-muted font-semibold" style={{ paddingLeft: '6px' }}>
                  {(form.difficulty || 3) * 35} XP alla fine
                </span>
                <div className="flex gap-1.5 text-xl items-center" style={{ paddingRight: '6px' }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <span
                      key={star}
                      onClick={() => setForm(prev => ({ ...prev, difficulty: star }))}
                      className={`cursor-pointer transition-all duration-150 transform hover:scale-125 select-none ${
                        star <= (form.difficulty || 3) ? 'text-yellow-400 drop-shadow' : 'text-slate-600 opacity-30'
                      }`}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 4: Stat Primaria & Secondaria */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-text-secondary font-bold mb-1.5">Stat. Primaria</label>
                <select
                  name="primaryTarget"
                  value={form.primaryTarget || ''}
                  onChange={handleChange}
                  className="w-full h-11 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded-2xl px-5 pr-9 text-xs font-bold focus:border-accent-primary focus:outline-none"
                >
                  {visibleStats.map(s => (
                    <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-text-secondary font-bold mb-1.5">Stat. Secondaria</label>
                <select
                  name="secondaryTarget"
                  value={form.secondaryTarget || ''}
                  onChange={handleChange}
                  className="w-full h-11 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded-2xl px-5 pr-9 text-xs font-bold focus:border-accent-primary focus:outline-none"
                >
                  <option value="">Nessuna</option>
                  {visibleStats.map(s => (
                    <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Subquests Section */}
            <div className="border-t border-[var(--glass-border)] pt-3 mt-0.5">
              <label className="block text-xs text-text-secondary font-bold mb-1.5">Sotto-obiettivi (Milestones)</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newSubquestName}
                  onChange={(e) => setNewSubquestName(e.target.value)}
                  placeholder="Es: Finire capitolo 1..."
                  className="flex-1 h-10 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded-2xl px-5 text-xs focus:border-accent-primary focus:outline-none"
                />
                <button
                  type="button"
                  onClick={addSubquest}
                  className="bg-accent-primary hover:bg-accent-primary/80 text-white text-xs px-4.5 py-1 rounded-2xl font-bold"
                >
                  +
                </button>
              </div>
              <ul className="max-h-36 overflow-y-auto space-y-1.5 no-scrollbar">
                {subquests.map((sq) => (
                  <li key={sq.id} className="flex justify-between items-center bg-[var(--bg-secondary)] p-2.5 px-4 rounded-xl text-xs border border-[var(--glass-border)]">
                    <span className={sq.completed ? 'line-through text-text-secondary' : ''}>{sq.name}</span>
                    <button
                      type="button"
                      onClick={() => removeSubquest(sq.id)}
                      className="text-red-500 hover:text-red-400 font-bold px-1"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );

      case 'quest_detail': {
        const questData = editData || form || {};
        const currentQuest = (quests || []).find(q => q.id === questData.id) || questData;
        const totalSub = currentQuest.subquests?.length || 0;
        const completedSub = currentQuest.subquests?.filter(sq => sq.completed).length || 0;
        const progressPct = totalSub > 0 ? Math.round((completedSub / totalSub) * 100) : 0;
        const primaryStat = stats?.find(s => s.id === currentQuest.primaryTarget);
        const secondaryStat = stats?.find(s => s.id === currentQuest.secondaryTarget);

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Header Tessera */}
            <div style={{ background: 'var(--bg-secondary)', padding: '12px 14px', borderRadius: '16px', border: '1px solid var(--glass-border)', textAlign: 'center' }}>
              {currentQuest.emoji && currentQuest.emoji !== '🏆' && (
                <div style={{ fontSize: '36px', lineHeight: '1', marginBottom: '4px' }}>
                  {currentQuest.emoji}
                </div>
              )}
              <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                {currentQuest.name}
              </h3>

              {/* Stars & XP */}
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: '#f59e0b' }}>
                  {'★'.repeat(currentQuest.difficulty || 1)}
                  <span style={{ opacity: 0.3 }}>{'★'.repeat(5 - (currentQuest.difficulty || 1))}</span>
                </span>
                <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.12)', padding: '2px 8px', borderRadius: '8px' }}>
                  +{(currentQuest.difficulty || 3) * 35} XP
                </span>
              </div>

              {/* Stats badges */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', flexWrap: 'wrap' }}>
                {primaryStat && (
                  <span style={{ fontSize: '10px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}>
                    {primaryStat.icon} {primaryStat.name} (Primaria)
                  </span>
                )}
                {secondaryStat && (
                  <span style={{ fontSize: '10px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
                    {secondaryStat.icon} {secondaryStat.name} (Secondaria)
                  </span>
                )}
              </div>
            </div>

            {/* Descrizione Tessera */}
            {currentQuest.description && (
              <div style={{ background: 'var(--bg-secondary)', padding: '10px 14px', borderRadius: '14px', border: '1px solid var(--glass-border)' }}>
                <div style={{ fontSize: '9px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '3px' }}>
                  📝 Descrizione Campagna
                </div>
                <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                  {currentQuest.description}
                </p>
              </div>
            )}

            {/* Premio Tessera */}
            <div style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(217, 119, 6, 0.2) 100%)', padding: '10px 14px', borderRadius: '14px', border: '1px solid rgba(245, 158, 11, 0.35)' }}>
              <div style={{ fontSize: '9px', fontWeight: 'bold', color: '#f59e0b', textTransform: 'uppercase', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>🎁 Premio al completamento</span>
              </div>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                {currentQuest.reward ? currentQuest.reward : <span style={{ fontStyle: 'italic', fontWeight: 'normal', fontSize: '11px', color: 'var(--text-secondary)' }}>Nessun premio impostato. Clicca ✏️ per aggiungerne uno!</span>}
              </div>
            </div>

            {/* Subquests / Milestones Progress Tessera */}
            <div style={{ background: 'var(--bg-secondary)', padding: '10px 14px', borderRadius: '14px', border: '1px solid var(--glass-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '9px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  🚩 Milestones ({completedSub}/{totalSub})
                </span>
                <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
                  {progressPct}%
                </span>
              </div>

              {/* Progress bar */}
              <div style={{ width: '100%', height: '5px', background: 'var(--bg-card)', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
                <div style={{ height: '100%', width: `${progressPct}%`, background: 'var(--accent-gradient, #7c3aed)', transition: 'width 0.3s ease' }}></div>
              </div>

              {/* Subquest Checklist */}
              {totalSub === 0 ? (
                <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '4px 0' }}>
                  Nessun sotto-obiettivo definito per questa campagna.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '130px', overflowY: 'auto' }} className="no-scrollbar">
                  {currentQuest.subquests?.map((sq) => (
                    <div
                      key={sq.id}
                      onClick={() => onToggleSubquest && onToggleSubquest(currentQuest.id, sq.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--glass-border)', cursor: 'pointer' }}
                    >
                      <div
                        style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '4px',
                          border: sq.completed ? 'none' : '1.5px solid var(--glass-border)',
                          background: sq.completed ? '#22c55e' : 'transparent',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          flexShrink: 0
                        }}
                      >
                        {sq.completed && '✓'}
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: '500', color: 'var(--text-primary)', textDecoration: sq.completed ? 'line-through' : 'none', opacity: sq.completed ? 0.6 : 1, flex: 1 }}>
                        {sq.name}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      }

      case 'food':
        return (
          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <div className="w-14">
                <label className="block text-xs text-text-secondary font-bold mb-1">Emoji</label>
                <input
                  type="text"
                  name="emoji"
                  value={form.emoji || ''}
                  onChange={handleChange}
                  className="w-full h-10 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded-xl text-center text-lg focus:border-accent-primary focus:outline-none"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-text-secondary font-bold mb-1">Nome Cibo</label>
                <input
                  type="text"
                  name="name"
                  value={form.name || ''}
                  onChange={handleChange}
                  required
                  placeholder="Es: Uova, Petto di Pollo..."
                  className="w-full h-10 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded-xl px-4 text-xs font-semibold focus:border-accent-primary focus:outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-text-secondary font-bold mb-1">Grammi Base</label>
                <input
                  type="number"
                  name="baseGrams"
                  value={form.baseGrams || 100}
                  onChange={handleNumberChange}
                  required
                  className="w-full h-10 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded-xl px-4 text-xs font-semibold focus:border-accent-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-text-secondary font-bold mb-1">Calorie Base</label>
                <input
                  type="number"
                  name="baseCalories"
                  value={form.baseCalories || 0}
                  onChange={handleNumberChange}
                  required
                  className="w-full h-10 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded-xl px-4 text-xs font-semibold focus:border-accent-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-text-secondary font-bold mb-1">Proteine (g)</label>
                <input
                  type="number"
                  name="baseProteins"
                  value={form.baseProteins || 0}
                  onChange={handleNumberChange}
                  required
                  className="w-full h-10 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded-xl px-4 text-xs font-semibold focus:border-accent-primary focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-text-secondary font-bold mb-1">Categoria Pasto</label>
              <select
                name="category"
                value={form.category || 'snack'}
                onChange={handleChange}
                className="w-full h-10 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded-xl px-4 pr-8 text-xs font-bold focus:border-accent-primary focus:outline-none"
              >
                <option value="breakfast">Colazione ☕</option>
                <option value="lunch">Pranzo 🍚</option>
                <option value="dinner">Cena 🍗</option>
                <option value="snack">Spuntino 🍌</option>
                <option value="cheat">Sgarro 🍕</option>
              </select>
            </div>
          </div>
        );

      case 'exercise':
        return (
          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <div className="w-14">
                <label className="block text-xs text-text-secondary font-bold mb-1">Emoji</label>
                <input
                  type="text"
                  name="emoji"
                  value={form.emoji || ''}
                  onChange={handleChange}
                  className="w-full h-10 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded-xl text-center text-lg focus:border-accent-primary focus:outline-none"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-text-secondary font-bold mb-1">Nome Esercizio</label>
                <input
                  type="text"
                  name="name"
                  value={form.name || ''}
                  onChange={handleChange}
                  required
                  placeholder="Es: Push-ups, Corsa..."
                  className="w-full h-10 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded-xl px-4 text-xs font-semibold focus:border-accent-primary focus:outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-text-secondary font-bold mb-1">Reps/Min</label>
                <input
                  type="number"
                  name="baseCount"
                  value={form.baseCount || 10}
                  onChange={handleNumberChange}
                  required
                  className="w-full h-10 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded-xl px-4 text-xs font-semibold focus:border-accent-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-text-secondary font-bold mb-1">Kcal Bruciate</label>
                <input
                  type="number"
                  name="baseCalories"
                  value={form.baseCalories || 0}
                  onChange={handleNumberChange}
                  required
                  className="w-full h-10 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded-xl px-4 text-xs font-semibold focus:border-accent-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-text-secondary font-bold mb-1">XP Premio</label>
                <input
                  type="number"
                  name="xpReward"
                  value={form.xpReward || 5}
                  onChange={handleNumberChange}
                  required
                  className="w-full h-10 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded-xl px-4 text-xs font-semibold focus:border-accent-primary focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-text-secondary font-bold mb-1">Stat. Correlata</label>
              <select
                name="statId"
                value={form.statId || ''}
                onChange={handleChange}
                className="w-full h-10 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded-xl px-4 pr-8 text-xs font-bold focus:border-accent-primary focus:outline-none"
              >
                {visibleStats.map(s => (
                  <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                ))}
              </select>
            </div>
          </div>
        );

      case 'weight':
        return (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-text-secondary font-bold mb-1">Peso Attuale (kg)</label>
                <input
                  type="number"
                  name="current"
                  value={form.current || ''}
                  onChange={handleNumberChange}
                  step="0.1"
                  required
                  className="w-full h-10 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded-xl px-4 text-xs font-semibold focus:border-accent-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-text-secondary font-bold mb-1">Peso Obiettivo (kg)</label>
                <input
                  type="number"
                  name="target"
                  value={form.target || ''}
                  onChange={handleNumberChange}
                  step="0.1"
                  className="w-full h-10 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded-xl px-4 text-xs font-semibold focus:border-accent-primary focus:outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-text-secondary font-bold mb-1">Massa Magra (%)</label>
                <input
                  type="number"
                  name="currentLean"
                  value={form.currentLean || ''}
                  onChange={handleNumberChange}
                  step="0.1"
                  className="w-full h-10 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded-xl px-4 text-xs font-semibold focus:border-accent-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-text-secondary font-bold mb-1">Massa Grassa (%)</label>
                <input
                  type="number"
                  name="currentFat"
                  value={form.currentFat || ''}
                  onChange={handleNumberChange}
                  step="0.1"
                  className="w-full h-10 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded-xl px-4 text-xs font-semibold focus:border-accent-primary focus:outline-none"
                />
              </div>
            </div>
          </div>
        );

      case 'stat_detail': {
        const statData = editData || {};
        const history7Days = getStatHistory7Days(statData.id);
        const maxDayXp = Math.max(20, ...history7Days.map(d => d.totalXp));

        const getEntryTitle = (log) => {
          if (log.title && log.title.trim() !== '' && log.title !== 'Azione RPG' && log.title !== 'Attività RPG') return log.title.trim();
          if (log.source && log.source.trim() !== '' && log.source !== 'Azione RPG' && log.source !== 'Attività RPG') return log.source.trim();

          const statObj = (stats || []).find(s => s.id === log.statId);
          if (statObj && statObj.name) return `Attività ${statObj.name}`;

          return 'Attività RPG';
        };

        const lastXpEntry = (xpLog || [])
          .filter(l => l.statId === statData.id && l.amount > 0)
          .slice(-1)[0];

        const selectedDay = selectedDayIndex !== null && selectedDayIndex >= 0 && selectedDayIndex < history7Days.length
          ? history7Days[selectedDayIndex]
          : null;

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* TESSERA 1: Emoji, Nome, Descrizione, Livello e XP */}
            <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '16px', border: '1px solid var(--glass-border)', textAlign: 'center', position: 'relative' }}>
              <button
                type="button"
                onClick={onClose}
                style={{ position: 'absolute', top: '10px', right: '12px', background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '18px', cursor: 'pointer', fontWeight: 'bold' }}
                title="Chiudi"
              >
                ✕
              </button>
              {/* Emoji in alto (senza cerchio) */}
              <div style={{ fontSize: '42px', lineHeight: '1', marginBottom: '4px' }}>
                {statData.icon || '⭐'}
              </div>

              {/* Nome e Descrizione */}
              <h3 style={{ margin: '0 0 2px 0', fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                {statData.name}
              </h3>
              <p style={{ margin: '0 0 12px 0', fontSize: '11px', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: '1.4' }}>
                {statData.description || 'Statistica del personaggio'}
              </p>

              {/* Linea Livello e XP Accumulati */}
              <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', background: 'var(--bg-card)', padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                <div>
                  <span style={{ fontSize: '9px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', letterSpacing: '0.5px' }}>LIVELLO</span>
                  <span style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--accent-primary)' }}>{statData.level || 1}</span>
                </div>
                <div style={{ width: '1px', height: '24px', background: 'var(--glass-border)' }}></div>
                <div>
                  <span style={{ fontSize: '9px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', letterSpacing: '0.5px' }}>XP ACCUMULATI</span>
                  <span style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--accent-gold, #f59e0b)' }}>{statData.xp || 0}</span>
                </div>
              </div>
            </div>

            {/* TESSERA 2: Grafico 7 Giorni + Tooltip + Ultimo XP Guadagnato */}
            <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '10px', textAlign: 'left' }}>
                📊 Ultimi 7 Giorni
              </div>

              {/* Grafico a barre */}
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '60px', padding: '0 4px', gap: '6px', marginBottom: '10px' }}>
                {history7Days.map((day, idx) => {
                  const heightPx = Math.max(6, Math.round((day.totalXp / maxDayXp) * 45));
                  const isSelected = selectedDayIndex === idx;

                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedDayIndex(idx)}
                      style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'pointer'
                      }}
                      title={`${day.dayLabel}: +${day.totalXp} XP`}
                    >
                      <div style={{ fontSize: '8px', fontWeight: 'bold', color: day.totalXp > 0 ? 'var(--accent-primary)' : 'transparent', height: '10px' }}>
                        {day.totalXp > 0 ? `+${day.totalXp}` : ''}
                      </div>
                      <div
                        style={{
                          width: '100%',
                          maxWidth: '20px',
                          height: `${heightPx}px`,
                          borderRadius: '4px',
                          background: isSelected
                            ? 'var(--accent-primary)'
                            : day.totalXp > 0
                            ? 'rgba(124, 58, 237, 0.45)'
                            : 'var(--glass-border)',
                          border: isSelected ? '1px solid var(--accent-primary)' : 'none',
                          transition: 'all 0.2s ease'
                        }}
                      ></div>
                      <div style={{ fontSize: '9px', color: isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)', fontWeight: isSelected ? 'bold' : 'normal' }}>
                        {day.dayLabel}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Tooltip con i titoli delle attività */}
              {selectedDay && (
                <div style={{ marginTop: '8px', padding: '8px 10px', background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '10px', fontSize: '10px', textAlign: 'left', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '4px' }}>
                    <span>📅 {selectedDay.dayLabel} ({selectedDay.dateStr})</span>
                    <span style={{ color: 'var(--accent-primary)' }}>+{selectedDay.totalXp} XP</span>
                  </div>
                  {selectedDay.logs.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Nessun XP guadagnato in questo giorno.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      {selectedDay.logs.map((l, lIdx) => (
                        <div key={lIdx} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                          <span>• {l.title || getEntryTitle(l)}</span>
                          <span style={{ fontWeight: 'bold', color: 'var(--accent-primary)' }}>+{l.amount} XP</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Ultimo XP Guadagnato */}
              <div style={{ background: 'var(--bg-card)', padding: '8px 10px', borderRadius: '10px', border: '1px solid var(--glass-border)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '15px' }}>⚡</span>
                <div style={{ textAlign: 'left', flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Ultimo XP Guadagnato</div>
                  {lastXpEntry ? (
                    <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {lastXpEntry.title || getEntryTitle(lastXpEntry)} <span style={{ color: 'var(--accent-primary)' }}>(+{lastXpEntry.amount} XP)</span>
                    </div>
                  ) : (
                    <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Nessuna attività registrata di recente</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      }

      case 'health_goals':
      case 'health_goal':
        return (
            <div className="flex flex-col gap-4">
              {/* Daily Goals Section Header */}
              <div className="flex items-center justify-between border-b border-[var(--glass-border)] pb-2">
                <span className="text-xs font-bold text-text-primary uppercase tracking-wider">🎯 Obiettivi Giornalieri</span>
                <span className="text-[10px] text-text-muted">Modifica direttamente i valori</span>
              </div>

              {/* Goal Inputs Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[var(--bg-secondary)] p-2.5 rounded-xl border border-[var(--glass-border)]">
                  <label className="block text-[11px] text-text-secondary font-bold mb-1">🚩 Calorie Obiettivo (kcal)</label>
                  <input
                    type="number"
                    name="calorieGoal"
                    value={form.calorieGoal !== undefined ? form.calorieGoal : ''}
                    onChange={handleNumberChange}
                    placeholder="1600"
                    className="w-full h-9 bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded-lg px-3 text-xs font-bold focus:border-accent-primary focus:outline-none"
                  />
                </div>

                <div className="bg-[var(--bg-secondary)] p-2.5 rounded-xl border border-[var(--glass-border)]">
                  <label className="block text-[11px] text-text-secondary font-bold mb-1">🍗 Proteine Obiettivo (g)</label>
                  <input
                    type="number"
                    name="proteinGoal"
                    value={form.proteinGoal !== undefined ? form.proteinGoal : ''}
                    onChange={handleNumberChange}
                    placeholder="100"
                    className="w-full h-9 bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded-lg px-3 text-xs font-bold focus:border-accent-primary focus:outline-none"
                  />
                </div>

                <div className="bg-[var(--bg-secondary)] p-2.5 rounded-xl border border-[var(--glass-border)]">
                  <label className="block text-[11px] text-text-secondary font-bold mb-1">🥛 Acqua (Bicchieri da 250ml)</label>
                  <input
                    type="number"
                    name="waterGoal"
                    value={form.waterGoal !== undefined ? form.waterGoal : ''}
                    onChange={handleNumberChange}
                    placeholder="8"
                    className="w-full h-9 bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded-lg px-3 text-xs font-bold focus:border-accent-primary focus:outline-none"
                  />
                </div>

                <div className="bg-[var(--bg-secondary)] p-2.5 rounded-xl border border-[var(--glass-border)]">
                  <label className="block text-[11px] text-text-secondary font-bold mb-1">👟 Passi Giornalieri</label>
                  <input
                    type="number"
                    name="stepGoal"
                    value={form.stepGoal !== undefined ? form.stepGoal : ''}
                    onChange={handleNumberChange}
                    placeholder="10000"
                    className="w-full h-9 bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded-lg px-3 text-xs font-bold focus:border-accent-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="bg-[var(--bg-secondary)] p-2.5 rounded-xl border border-[var(--glass-border)]">
                <label className="block text-[11px] text-text-secondary font-bold mb-1">⚖️ Peso Corporeo Target (kg)</label>
                <input
                  type="number"
                  name="targetWeight"
                  step="0.1"
                  value={form.targetWeight !== undefined ? form.targetWeight : ''}
                  onChange={handleNumberChange}
                  placeholder="70"
                  className="w-full h-9 bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded-lg px-3 text-xs font-bold focus:border-accent-primary focus:outline-none"
                />
              </div>

              {/* Integrated Smart BMR / TDEE Calculator */}
              <div className="bg-[var(--bg-secondary)] p-3 rounded-2xl border border-[var(--glass-border)] flex flex-col gap-3 mt-1">
                <div className="flex justify-between items-center border-b border-[var(--glass-border)] pb-2">
                  <div>
                    <span className="text-xs font-bold text-text-primary block">⚡ Calcolatore Fabbisogno TDEE</span>
                    <span className="text-[10px] text-text-muted">Calcola l'apporto in base al tuo obiettivo</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCalculateTdee}
                    className="text-xs font-bold text-white bg-[var(--accent-primary)] px-3 py-1.5 rounded-xl shadow-md hover:opacity-90 transition-opacity"
                  >
                    Calcola & Applica
                  </button>
                </div>

                {/* 3 Goal Situations Selector */}
                <div>
                  <label className="block text-[10px] font-bold text-text-secondary mb-1.5 uppercase">1. Scegli il tuo Obiettivo</label>
                  <div className="grid grid-cols-3 gap-1.5 bg-[var(--bg-card)] p-1 rounded-xl border border-[var(--glass-border)]">
                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, calcGoalType: 'loss' }))}
                      className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all ${
                        (form.calcGoalType || 'maintenance') === 'loss'
                          ? 'bg-accent-primary text-white shadow-sm'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      📉 Dimagrire
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, calcGoalType: 'maintenance' }))}
                      className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all ${
                        (form.calcGoalType || 'maintenance') === 'maintenance'
                          ? 'bg-accent-primary text-white shadow-sm'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      ⚖️ Tonificare
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, calcGoalType: 'gain' }))}
                      className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all ${
                        (form.calcGoalType || 'maintenance') === 'gain'
                          ? 'bg-accent-primary text-white shadow-sm'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      🏋️ Massa
                    </button>
                  </div>
                </div>

                {/* Physical Data Inputs */}
                <div>
                  <label className="block text-[10px] font-bold text-text-secondary mb-1.5 uppercase">2. Parametri Fisici</label>
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <label className="block text-[9px] text-text-muted mb-0.5">Sesso</label>
                      <select
                        name="calcGender"
                        value={form.calcGender || 'male'}
                        onChange={handleChange}
                        className="w-full h-8 bg-[var(--bg-card)] text-text-primary text-[10px] font-semibold rounded-lg px-1 border border-[var(--glass-border)]"
                      >
                        <option value="male">Uomo</option>
                        <option value="female">Donna</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] text-text-muted mb-0.5">Età</label>
                      <input
                        type="number"
                        name="calcAge"
                        value={form.calcAge !== undefined ? form.calcAge : 28}
                        onChange={handleNumberChange}
                        className="w-full h-8 bg-[var(--bg-card)] text-text-primary text-[10px] font-semibold rounded-lg px-2 border border-[var(--glass-border)]"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-text-muted mb-0.5">Altezza (cm)</label>
                      <input
                        type="number"
                        name="calcHeight"
                        value={form.calcHeight !== undefined ? form.calcHeight : 175}
                        onChange={handleNumberChange}
                        className="w-full h-8 bg-[var(--bg-card)] text-text-primary text-[10px] font-semibold rounded-lg px-2 border border-[var(--glass-border)]"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-text-muted mb-0.5">Attività</label>
                      <select
                        name="calcActivity"
                        value={form.calcActivity || 1.375}
                        onChange={handleChange}
                        className="w-full h-8 bg-[var(--bg-card)] text-text-primary text-[9px] font-semibold rounded-lg px-1 border border-[var(--glass-border)]"
                      >
                        <option value="1.2">Sedentario</option>
                        <option value="1.375">Leggero</option>
                        <option value="1.55">Moderato</option>
                        <option value="1.725">Intenso</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );

      default:
        const currentActiveT = currentType || type;
        if (currentActiveT?.startsWith('health_')) {
          const field = currentActiveT.split('_')[1];
          const labels = {
            consumed: 'Aggiungi Calorie Cibo',
            burned: 'Aggiungi Calorie Allenamento',
            steps: 'Passi Effettuati',
            water: 'Litri d\'Acqua Bevuti',
            proteins: 'Proteine Consumate (g)',
            protein: 'Obiettivo Proteine (g)',
            water_goal: 'Obiettivo Acqua (L)'
          };
          return (
            <div className="flex flex-col gap-2">
              <label className="block text-xs text-text-secondary font-bold">
                {labels[field] || labels[type.substring(7)] || 'Inserisci Valore'}
              </label>
              <input
                type="number"
                name="value"
                value={form.value !== undefined ? form.value : ''}
                onChange={handleNumberChange}
                step={type === 'health_water' || type === 'health_water_goal' ? '0.1' : '1'}
                className="w-full h-10 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded-xl px-4 text-xs font-semibold focus:border-accent-primary focus:outline-none"
              />
            </div>
          );
        }
        return null;
      case 'pomodoro':
        return (
          <div className="flex flex-col gap-3">
            <div>
              <label className="block text-xs text-text-secondary font-bold mb-1 uppercase tracking-wider">Allena Abilità</label>
              <select
                name="targetStatId"
                value={form.targetStatId || stats[0]?.id || 'int'}
                onChange={handleChange}
                className="w-full h-10 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded-xl px-4 pr-8 text-xs font-bold focus:border-accent-primary focus:outline-none"
              >
                {visibleStats.map(s => (
                  <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-text-secondary font-bold mb-1 uppercase tracking-wider">Durata Lavoro (minuti)</label>
              <input
                type="number"
                name="workDuration"
                value={form.workDuration || 25}
                onChange={handleNumberChange}
                min="1"
                max="120"
                required
                className="w-full h-10 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded-xl px-4 text-xs font-bold focus:border-accent-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-text-secondary font-bold mb-1 uppercase tracking-wider">XP Premio a fine sessione</label>
              <input
                type="number"
                name="xpPerSession"
                value={form.xpPerSession || 25}
                onChange={handleNumberChange}
                min="1"
                max="500"
                required
                className="w-full h-10 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded-xl px-4 text-xs font-bold focus:border-accent-primary focus:outline-none"
              />
            </div>
          </div>
        );

        return null;
    }
  };

  const getTitle = () => {
    const activeT = currentType || type;
    const action = editData ? 'Modifica' : 'Crea';
    const names = {
      attribute: 'Attributo',
      ability: 'Abilità',
      habit: 'Abitudine',
      oneshot: 'Task Singolo',
      quest: 'Campagna',
      quest_detail: 'Dettaglio Campagna',
      food: 'Alimento nel database',
      exercise: 'Esercizio nel database',
      weight: 'Statistiche Peso',
      stat_detail: '',
      pomodoro: 'Timer Pomodoro'
    };
    if (activeT === 'quest_detail') return 'Dettaglio Campagna';
    if (activeT === 'health_goals' || activeT === 'health_goal') return '🎯 Obiettivi Salute & Calcolatore TDEE';
    if (activeT?.startsWith('health_')) return 'Aggiorna Dati';
    return `${action} ${names[activeT] || 'Elemento'}`;
  };

  const activeT = currentType || type;
  const isCreatableItem = !editData && ['habit', 'oneshot', 'quest'].includes(activeT);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay active animate-fade-in"
      style={{ background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="modal w-full rounded-3xl overflow-hidden shadow-2xl animate-scale-up flex flex-col justify-between"
        style={{
          background: 'var(--bg-card)',
          color: 'var(--text-primary)',
          border: '1px solid var(--glass-border)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.35)',
          aspectRatio: ['quest_detail', 'stat_detail', 'health_goals', 'health_goal'].includes(activeT) ? 'auto' : '3 / 4',
          maxWidth: ['quest_detail', 'stat_detail', 'health_goals', 'health_goal'].includes(activeT) ? '420px' : '360px',
          width: '92%',
          maxHeight: ['quest_detail', 'stat_detail', 'health_goals', 'health_goal'].includes(activeT) ? '92vh' : '88vh'
        }}
      >
        {/* Header (Hidden for stat_detail) */}
        {activeT !== 'stat_detail' && (
          <div
            className="px-7 pt-6 pb-2 flex justify-center items-center text-center shrink-0"
            style={{ background: 'var(--bg-card)' }}
          >
            <h3 className="font-bold text-base font-cinzel tracking-wide" style={{ color: 'var(--text-primary)' }}>
              {getTitle()}
            </h3>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSave} style={{ margin: 0, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, justifyContent: 'space-between' }}>
          <div className="px-7 py-2 overflow-y-auto no-scrollbar flex flex-col justify-start flex-1" style={{ gap: '14px' }}>
            {/* Top 3-way Creation Type Selector */}
            {isCreatableItem && (
              <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '14px', border: '1px solid var(--glass-border)', marginBottom: '16px', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => handleTypeSwitch('habit')}
                  style={{
                    flex: 1,
                    padding: '8px 4px',
                    borderRadius: '10px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    border: 'none',
                    cursor: 'pointer',
                    background: activeT === 'habit' ? 'var(--accent-gradient, #7c3aed)' : 'transparent',
                    color: activeT === 'habit' ? '#ffffff' : 'var(--text-secondary)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  📜 Abitudine
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeSwitch('oneshot')}
                  style={{
                    flex: 1,
                    padding: '8px 4px',
                    borderRadius: '10px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    border: 'none',
                    cursor: 'pointer',
                    background: activeT === 'oneshot' ? 'var(--accent-gradient, #7c3aed)' : 'transparent',
                    color: activeT === 'oneshot' ? '#ffffff' : 'var(--text-secondary)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  💥 Task Singolo
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeSwitch('quest')}
                  style={{
                    flex: 1,
                    padding: '8px 4px',
                    borderRadius: '10px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    border: 'none',
                    cursor: 'pointer',
                    background: activeT === 'quest' ? 'var(--accent-gradient, #7c3aed)' : 'transparent',
                    color: activeT === 'quest' ? '#ffffff' : 'var(--text-secondary)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  🏆 Campagna
                </button>
              </div>
            )}

            {renderFormFields()}
          </div>

          {/* Footer Actions (Centered Coherent 44x44 Emoji Buttons) */}
          <div
            style={{
              padding: '12px 28px 24px 28px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '14px',
              background: 'transparent',
              borderTop: 'none'
            }}
            className="shrink-0"
          >
            {editData && onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Sei sicuro di voler eliminare questo elemento?')) {
                    onDelete(editData.id || editData);
                    onClose();
                  }
                }}
                title="Elimina"
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  fontSize: '15px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  color: '#ef4444',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                }}
              >
                🗑️
              </button>
            )}

            {(type === 'stat_detail' || activeT === 'quest_detail') && (
              <button
                type="button"
                onClick={() => {
                  if (activeT === 'quest_detail') {
                    handleTypeSwitch('quest');
                  } else if (onEditStat) {
                    onEditStat(editData);
                  }
                }}
                title="Modifica"
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  fontSize: '15px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                }}
              >
                ✏️
              </button>
            )}

            <button
              type="submit"
              title="Salva / Chiudi"
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: 'bold',
                background: 'var(--accent-gradient, linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%))',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)',
                transition: 'all 0.2s ease'
              }}
            >
              💾
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
}
