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

            {/* Tessera 5: Conteggio Inserimenti in Pianificazione Giornaliera */}
            {(editData?.scheduledCount > 0 || form.scheduledCount > 0) && (
              <div style={{ padding: '10px 14px', borderRadius: '14px', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#f59e0b', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>📌</span>
                <span>
                  Finito {editData?.scheduledCount || form.scheduledCount} {(editData?.scheduledCount || form.scheduledCount) === 1 ? 'volta' : 'volte'} tra le missioni del giorno
                </span>
              </div>
            )}
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
            <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '16px', border: '1px solid var(--glass-border)', textAlign: 'center' }}>
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

      default:
        if (type === 'health_goals' || type === 'health_goal') {
          const calculateTdee = () => {
            const currentWeight = parseFloat(form.currentWeight !== undefined ? form.currentWeight : editData?.currentWeight || form.calcWeight || 75) || 75;
            const fatPct = parseFloat(form.calcFatPct !== undefined ? form.calcFatPct : editData?.currentFat || 0);
            const height = parseFloat(form.calcHeight !== undefined ? form.calcHeight : 175) || 175;
            const age = parseFloat(form.calcAge !== undefined ? form.calcAge : 28) || 28;
            const gender = form.calcGender || 'male';
            const activity = parseFloat(form.calcActivity || 1.375) || 1.375;
            const goalType = form.calcGoalType || 'lose';

            let bmr = 0;
            let methodUsed = '';

            // If Fat % is provided (> 0 and < 60), use Katch-McArdle Formula based on Lean Body Mass
            if (fatPct > 0 && fatPct < 60) {
              const lbm = currentWeight * (1 - fatPct / 100);
              bmr = 370 + (21.6 * lbm);
              methodUsed = `Katch-McArdle (Massa Magra ${lbm.toFixed(1)}kg)`;
            } else {
              // Otherwise use Mifflin-St Jeor Formula
              bmr = (10 * currentWeight) + (6.25 * height) - (5 * age) + (gender === 'male' ? 5 : -161);
              methodUsed = 'Mifflin-St Jeor';
            }

            const tdee = Math.round(bmr * activity);

            let targetCalories = tdee;
            let targetProtein = Math.round(currentWeight * 1.6);
            let targetWater = 8;
            let targetSteps = 10000;
            let goalDescription = '';

            if (goalType === 'lose') {
              targetCalories = Math.round(tdee * 0.82);
              targetProtein = Math.round(currentWeight * 2.0);
              targetWater = 10;
              targetSteps = 10000;
              goalDescription = `📉 Dimagrimento: TDEE ${tdee} kcal (${methodUsed}) → Target ${targetCalories} kcal (Deficit 18%) • ${targetProtein}g Proteine (2.0g/kg)`;
            } else if (goalType === 'gain') {
              targetCalories = Math.round(tdee * 1.12);
              targetProtein = Math.round(currentWeight * 2.0);
              targetWater = 9;
              targetSteps = 8000;
              goalDescription = `🏋️ Massa Muscolare: TDEE ${tdee} kcal (${methodUsed}) → Target ${targetCalories} kcal (Surplus +12%) • ${targetProtein}g Proteine (2.0g/kg)`;
            } else {
              targetCalories = tdee;
              targetProtein = Math.round(currentWeight * 1.6);
              targetWater = 8;
              targetSteps = 10000;
              goalDescription = `⚖️ Tonificazione: Target ${targetCalories} kcal (${methodUsed}) • ${targetProtein}g Proteine (1.6g/kg)`;
            }

            setForm(prev => ({
              ...prev,
              calorieGoal: targetCalories,
              proteinGoal: targetProtein,
              waterGoal: targetWater,
              stepGoal: targetSteps,
              tdeeSummary: goalDescription
            }));
          };

          return (
            <div className="flex flex-col gap-3.5">
              {/* TOP SECTION: Integrated BMR / TDEE & Goal Calculator Card */}
              <div className="bg-[var(--bg-secondary)] p-3.5 rounded-2xl border border-[var(--glass-border)] flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-[var(--glass-border)] pb-1.5">
                  <span className="text-xs font-bold text-text-primary">⚡ 1. Fabbisogno TDEE & Composizione</span>
                  <span className="text-[10px] text-text-muted font-medium">Inserisci i tuoi dati</span>
                </div>

                {/* 1) Sesso, Età, Altezza */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-text-muted mb-0.5 font-bold">Sesso</label>
                    <select
                      name="calcGender"
                      value={form.calcGender || 'male'}
                      onChange={handleChange}
                      className="w-full h-8 bg-[var(--bg-card)] text-text-primary text-[11px] font-semibold rounded-lg px-1.5 border border-[var(--glass-border)]"
                    >
                      <option value="male">Uomo</option>
                      <option value="female">Donna</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-text-muted mb-0.5 font-bold">Età (anni)</label>
                    <input
                      type="number"
                      name="calcAge"
                      value={form.calcAge !== undefined ? form.calcAge : 28}
                      onChange={handleNumberChange}
                      className="w-full h-8 bg-[var(--bg-card)] text-text-primary text-[11px] font-semibold rounded-lg px-2 border border-[var(--glass-border)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-text-muted mb-0.5 font-bold">Altezza (cm)</label>
                    <input
                      type="number"
                      name="calcHeight"
                      value={form.calcHeight !== undefined ? form.calcHeight : 175}
                      onChange={handleNumberChange}
                      className="w-full h-8 bg-[var(--bg-card)] text-text-primary text-[11px] font-semibold rounded-lg px-2 border border-[var(--glass-border)]"
                    />
                  </div>
                </div>

                {/* 2) Peso Attuale, Massa Grassa %, Peso Target */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-text-muted mb-0.5 font-bold">Peso Attuale (kg)</label>
                    <input
                      type="number"
                      name="currentWeight"
                      step="0.1"
                      value={form.currentWeight !== undefined ? form.currentWeight : 75}
                      onChange={handleNumberChange}
                      className="w-full h-8 bg-[var(--bg-card)] text-text-primary text-[11px] font-semibold rounded-lg px-2 border border-[var(--glass-border)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-text-muted mb-0.5 font-bold">Massa Grassa %</label>
                    <input
                      type="number"
                      name="calcFatPct"
                      step="0.1"
                      placeholder="Es: 15%"
                      value={form.calcFatPct !== undefined ? form.calcFatPct : ''}
                      onChange={handleNumberChange}
                      className="w-full h-8 bg-[var(--bg-card)] text-text-primary text-[11px] font-semibold rounded-lg px-2 border border-[var(--glass-border)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-text-muted mb-0.5 font-bold">Peso Target (kg)</label>
                    <input
                      type="number"
                      name="targetWeight"
                      step="0.1"
                      value={form.targetWeight !== undefined ? form.targetWeight : 70}
                      onChange={handleNumberChange}
                      className="w-full h-8 bg-[var(--bg-card)] text-text-primary text-[11px] font-semibold rounded-lg px-2 border border-[var(--glass-border)]"
                    />
                  </div>
                </div>

                {/* 3) Stile di Vita & Attività */}
                <div>
                  <label className="block text-[10px] text-text-muted mb-0.5 font-bold">🏃 Stile di Vita & Attività Fisica:</label>
                  <select
                    name="calcActivity"
                    value={form.calcActivity || 1.375}
                    onChange={handleChange}
                    className="w-full h-9 bg-[var(--bg-card)] text-text-primary text-[11px] font-bold rounded-xl px-3 border border-[var(--glass-border)]"
                  >
                    <option value="1.2">Sedentario (Poco o nessun esercizio)</option>
                    <option value="1.375">Attività Leggera (1 - 3 allenamenti / settimana)</option>
                    <option value="1.55">Attività Moderata (3 - 5 allenamenti / settimana)</option>
                    <option value="1.725">Attività Intensa (6 - 7 allenamenti / settimana)</option>
                  </select>
                </div>

                {/* 4) MIDDLE SECTION: 3 Situations Goal Selector & Calculate Button */}
                <div className="pt-2 border-t border-[var(--glass-border)] flex flex-col gap-2.5">
                  <label className="block text-[10px] text-text-secondary font-bold">🎯 2. Scegli il tuo fine & Calcola:</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'lose', label: '📉 Dimagrimento', desc: 'Deficit' },
                      { id: 'maintain', label: '⚖️ Tonificazione', desc: 'Mantenimento' },
                      { id: 'gain', label: '🏋️ Massa', desc: 'Surplus' }
                    ].map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, calcGoalType: g.id }))}
                        className="flex flex-col items-center justify-center p-2 rounded-xl border text-[11px] font-bold transition-all cursor-pointer"
                        style={{
                          background: (form.calcGoalType || 'lose') === g.id ? 'var(--accent-primary)' : 'var(--bg-card)',
                          color: (form.calcGoalType || 'lose') === g.id ? '#ffffff' : 'var(--text-secondary)',
                          borderColor: (form.calcGoalType || 'lose') === g.id ? 'var(--accent-primary)' : 'var(--glass-border)'
                        }}
                      >
                        <span>{g.label}</span>
                        <span className="text-[9px] opacity-80 font-normal">{g.desc}</span>
                      </button>
                    ))}
                  </div>

                  {/* Centered Button: Less wide, taller, rectangular with rounded corners */}
                  <div className="flex justify-center my-1">
                    <button
                      type="button"
                      onClick={calculateTdee}
                      className="py-3 px-6 rounded-xl font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer hover:brightness-110 active:scale-95"
                      style={{
                        background: 'var(--accent-primary)',
                        color: '#ffffff',
                        boxShadow: '0 4px 15px rgba(124, 58, 237, 0.35)',
                        minWidth: '210px',
                        maxWidth: '250px'
                      }}
                    >
                      <span>⚡</span>
                      <span>Calcola & Applica Obiettivi</span>
                    </button>
                  </div>

                  {/* Calculated Summary Feedback Banner */}
                  {form.tdeeSummary && (
                    <div className="p-2.5 rounded-xl bg-accent-primary/10 border border-accent-primary/30 text-accent-primary text-[10px] font-bold text-center">
                      {form.tdeeSummary}
                    </div>
                  )}
                </div>
              </div>

              {/* BOTTOM SECTION: Daily Goals Result Boxes (Modificabili anche manualmente) */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between border-b border-[var(--glass-border)] pb-1">
                  <span className="text-xs font-bold text-text-primary uppercase tracking-wider">🎯 3. Obiettivi Giornalieri Risultanti</span>
                  <span className="text-[10px] text-text-muted font-medium">Modificabili anche manualmente</span>
                </div>

                {/* Goal Inputs Grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] text-text-secondary font-bold mb-1">🚩 Calorie Target (kcal)</label>
                    <input
                      type="number"
                      name="calorieGoal"
                      value={form.calorieGoal !== undefined ? form.calorieGoal : 1600}
                      onChange={handleNumberChange}
                      className="w-full h-9 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded-xl px-3 text-xs font-bold focus:border-accent-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-text-secondary font-bold mb-1">🍗 Proteine Target (g)</label>
                    <input
                      type="number"
                      name="proteinGoal"
                      value={form.proteinGoal !== undefined ? form.proteinGoal : 100}
                      onChange={handleNumberChange}
                      className="w-full h-9 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded-xl px-3 text-xs font-bold focus:border-accent-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-text-secondary font-bold mb-1">🥛 Acqua (Bicchieri)</label>
                    <input
                      type="number"
                      name="waterGoal"
                      value={form.waterGoal !== undefined ? form.waterGoal : 8}
                      onChange={handleNumberChange}
                      className="w-full h-9 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded-xl px-3 text-xs font-bold focus:border-accent-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-text-secondary font-bold mb-1">👟 Passi Giornalieri</label>
                    <input
                      type="number"
                      name="stepGoal"
                      value={form.stepGoal !== undefined ? form.stepGoal : 10000}
                      onChange={handleNumberChange}
                      className="w-full h-9 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded-xl px-3 text-xs font-bold focus:border-accent-primary focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        }

        if (type?.startsWith('health_')) {
          const field = type.split('_')[1];
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
    if (activeT?.startsWith('health_')) return 'Aggiorna Dati';
    return `${action} ${names[activeT] || 'Elemento'}`;
  };

  const activeT = currentType || type;
  const isCreatableItem = !editData && ['habit', 'oneshot', 'quest'].includes(activeT);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 flex items-center justify-center p-4 modal-overlay active animate-fade-in"
      style={{ zIndex: 99999, background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
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
          maxWidth: ['quest_detail', 'stat_detail', 'health_goals', 'health_goal'].includes(activeT) ? '440px' : '360px',
          width: '92%',
          maxHeight: ['quest_detail', 'stat_detail', 'health_goals', 'health_goal'].includes(activeT) ? '94vh' : '88vh'
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
