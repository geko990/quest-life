import React, { useState, useEffect } from 'react';

export default function Modal({ isOpen, onClose, type, editData, onSave, onDelete, stats, xpLog, oneshots = [], habits = [], quests = [], settings, onEditStat }) {
  if (!isOpen) return null;

  const [form, setForm] = useState({});
  const [subquests, setSubquests] = useState([]);
  const [newSubquestName, setNewSubquestName] = useState('');
  const [selectedDayIndex, setSelectedDayIndex] = useState(6);

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
      // Default initial states based on type
      if (type === 'attribute' || type === 'ability') {
        setForm({ emoji: '⭐', name: '', description: '', type: type, visible: true, level: 1, xp: 0 });
      } else if (type === 'habit') {
        setForm({
          emoji: '📜',
          name: '',
          frequency: 'daily',
          freqTimes: 1,
          difficulty: 3,
          primaryTarget: stats[0]?.id || 'str',
          secondaryTarget: stats[1]?.id || 'con'
        });
      } else if (type === 'oneshot') {
        setForm({
          emoji: '💥',
          name: '',
          difficulty: 3,
          primaryTarget: stats[0]?.id || 'str',
          secondaryTarget: stats[1]?.id || 'con',
          completed: false
        });
      } else if (type === 'quest') {
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
      } else if (type === 'food') {
        setForm({ emoji: '🍎', name: '', baseGrams: 100, baseCalories: 100, baseProteins: 10, category: 'snack' });
      } else if (type === 'exercise') {
        setForm({ emoji: '🏃', name: '', baseCount: 10, baseCalories: 50, xpReward: 10, statId: 'str' });
      } else if (type === 'weight') {
        setForm({ current: 75, target: 70, currentLean: 0, targetLean: 0, currentFat: 0, targetFat: 0 });
      } else if (type.startsWith('health_')) {
        setForm({ value: 0 });
      }
    }
  }, [type, editData, stats]);

  const handleChange = (e) => {
    const { name, value, type: inputType, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: inputType === 'checkbox' ? checked : value
    }));
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (type === 'quest') {
      onSave({ ...form, subquests });
    } else {
      onSave(form);
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

    switch (type) {
      case 'attribute':
      case 'ability':
        return (
          <>
            <div className="flex gap-4 mb-4">
              <div className="w-16">
                <label className="block text-xs text-text-secondary font-bold mb-1">Emoji</label>
                <input
                  type="text"
                  name="emoji"
                  value={form.emoji || ''}
                  onChange={handleChange}
                  className="w-full bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded px-3 py-2 text-center text-xl focus:border-accent-primary focus:outline-none"
                  maxLength="2"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-text-secondary font-bold mb-1">Nome</label>
                <input
                  type="text"
                  name="name"
                  value={form.name || ''}
                  onChange={handleChange}
                  required
                  placeholder={type === 'attribute' ? 'Forza, Destrezza...' : 'Scrittura, Disegno...'}
                  className="w-full bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded px-3 py-2 text-sm focus:border-accent-primary focus:outline-none"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-xs text-text-secondary font-bold mb-1">Descrizione</label>
              <textarea
                name="description"
                value={form.description || ''}
                onChange={handleChange}
                rows="3"
                placeholder="A cosa serve questo attributo/abilità..."
                className="w-full bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded px-3 py-2 text-sm focus:border-accent-primary focus:outline-none"
              ></textarea>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                name="visible"
                id="visible"
                checked={form.visible !== false}
                onChange={handleChange}
                className="rounded text-accent-primary focus:ring-accent-primary"
              />
              <label htmlFor="visible" className="text-sm text-text-main select-none">
                Mostra nel Radar Chart
              </label>
            </div>
          </>
        );

      case 'habit':
        return (
          <>
            <div className="flex gap-4 mb-4">
              <div className="w-16">
                <label className="block text-xs text-text-secondary font-bold mb-1">Emoji</label>
                <input
                  type="text"
                  name="emoji"
                  value={form.emoji || ''}
                  onChange={handleChange}
                  className="w-full bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded px-3 py-2 text-center text-xl focus:border-accent-primary focus:outline-none"
                  maxLength="2"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-text-secondary font-bold mb-1">Nome Abitudine</label>
                <input
                  type="text"
                  name="name"
                  value={form.name || ''}
                  onChange={handleChange}
                  required
                  placeholder="Es: Leggere, Allenamento..."
                  className="w-full bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded px-3 py-2 text-sm focus:border-accent-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs text-text-secondary font-bold mb-1">Frequenza</label>
                <select
                  name="frequency"
                  value={form.frequency || 'daily'}
                  onChange={handleChange}
                  className="w-full bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded px-3 py-2 text-sm focus:border-accent-primary focus:outline-none"
                >
                  <option value="daily">Giornaliera</option>
                  <option value="weekly">Settimanale (1 volta)</option>
                  <option value="monthly">Mensile (1 volta)</option>
                  <option value="times_week">N volte a Settimana</option>
                  <option value="times_month">N volte al Mese</option>
                </select>
              </div>
              {form.frequency?.startsWith('times_') && (
                <div>
                  <label className="block text-xs text-text-secondary font-bold mb-1">Ripetizioni</label>
                  <input
                    type="number"
                    name="freqTimes"
                    value={form.freqTimes || 1}
                    onChange={handleNumberChange}
                    min="1"
                    className="w-full bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded px-3 py-2 text-sm focus:border-accent-primary focus:outline-none"
                  />
                </div>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-xs text-text-secondary font-bold mb-1">Difficoltà (1-5 stelle)</label>
              <div className="flex gap-2 text-xl mt-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <span
                    key={star}
                    onClick={() => setForm(prev => ({ ...prev, difficulty: star }))}
                    className={`cursor-pointer transition-colors ${
                      star <= (form.difficulty || 3) ? 'text-yellow-400' : 'text-slate-600'
                    }`}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-text-secondary font-bold mb-1">Stat. Primaria</label>
                <select
                  name="primaryTarget"
                  value={form.primaryTarget || ''}
                  onChange={handleChange}
                  className="w-full bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded px-3 py-2 text-sm focus:border-accent-primary focus:outline-none"
                >
                  {visibleStats.map(s => (
                    <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-text-secondary font-bold mb-1">Stat. Secondaria</label>
                <select
                  name="secondaryTarget"
                  value={form.secondaryTarget || ''}
                  onChange={handleChange}
                  className="w-full bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded px-3 py-2 text-sm focus:border-accent-primary focus:outline-none"
                >
                  {visibleStats.map(s => (
                    <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </>
        );

      case 'oneshot':
        return (
          <>
            <div className="flex gap-4 mb-4">
              <div className="w-16">
                <label className="block text-xs text-text-secondary font-bold mb-1">Emoji</label>
                <input
                  type="text"
                  name="emoji"
                  value={form.emoji || ''}
                  onChange={handleChange}
                  className="w-full bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded px-3 py-2 text-center text-xl focus:border-accent-primary focus:outline-none"
                  maxLength="2"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-text-secondary font-bold mb-1">Nome Missione</label>
                <input
                  type="text"
                  name="name"
                  value={form.name || ''}
                  onChange={handleChange}
                  required
                  placeholder="Es: Preparare esame, Riparare rubinetto..."
                  className="w-full bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded px-3 py-2 text-sm focus:border-accent-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs text-text-secondary font-bold mb-1">Difficoltà (1-5 stelle)</label>
              <div className="flex gap-2 text-xl mt-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <span
                    key={star}
                    onClick={() => setForm(prev => ({ ...prev, difficulty: star }))}
                    className={`cursor-pointer transition-colors ${
                      star <= (form.difficulty || 3) ? 'text-yellow-400' : 'text-slate-600'
                    }`}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-text-secondary font-bold mb-1">Stat. Primaria</label>
                <select
                  name="primaryTarget"
                  value={form.primaryTarget || ''}
                  onChange={handleChange}
                  className="w-full bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded px-3 py-2 text-sm focus:border-accent-primary focus:outline-none"
                >
                  {visibleStats.map(s => (
                    <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-text-secondary font-bold mb-1">Stat. Secondaria</label>
                <select
                  name="secondaryTarget"
                  value={form.secondaryTarget || ''}
                  onChange={handleChange}
                  className="w-full bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded px-3 py-2 text-sm focus:border-accent-primary focus:outline-none"
                >
                  {visibleStats.map(s => (
                    <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </>
        );

      case 'quest':
        return (
          <>
            <div className="flex gap-4 mb-4">
              <div className="w-16">
                <label className="block text-xs text-text-secondary font-bold mb-1">Emoji</label>
                <input
                  type="text"
                  name="emoji"
                  value={form.emoji || ''}
                  onChange={handleChange}
                  className="w-full bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded px-3 py-2 text-center text-xl focus:border-accent-primary focus:outline-none"
                  maxLength="2"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-text-secondary font-bold mb-1">Nome Campagna</label>
                <input
                  type="text"
                  name="name"
                  value={form.name || ''}
                  onChange={handleChange}
                  required
                  placeholder="Es: Imparare React, Scrivere un libro..."
                  className="w-full bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded px-3 py-2 text-sm focus:border-accent-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs text-text-secondary font-bold mb-1">Descrizione</label>
              <textarea
                name="description"
                value={form.description || ''}
                onChange={handleChange}
                rows="2"
                placeholder="Spiega l'obiettivo finale di questa campagna..."
                className="w-full bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded px-3 py-2 text-sm focus:border-accent-primary focus:outline-none"
              ></textarea>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs text-text-secondary font-bold mb-1">Stat. Primaria</label>
                <select
                  name="primaryTarget"
                  value={form.primaryTarget || ''}
                  onChange={handleChange}
                  className="w-full bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded px-3 py-2 text-sm focus:border-accent-primary focus:outline-none"
                >
                  {visibleStats.map(s => (
                    <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-text-secondary font-bold mb-1">Stat. Secondaria</label>
                <select
                  name="secondaryTarget"
                  value={form.secondaryTarget || ''}
                  onChange={handleChange}
                  className="w-full bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded px-3 py-2 text-sm focus:border-accent-primary focus:outline-none"
                >
                  {visibleStats.map(s => (
                    <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs text-text-secondary font-bold mb-1">Difficoltà (1-5 stelle)</label>
              <div className="flex gap-2 text-xl mt-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <span
                    key={star}
                    onClick={() => setForm(prev => ({ ...prev, difficulty: star }))}
                    className={`cursor-pointer transition-colors ${
                      star <= (form.difficulty || 3) ? 'text-yellow-400' : 'text-slate-600'
                    }`}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>

            {/* Subquests Section */}
            <div className="border-t border-border-color/50 pt-4 mt-4">
              <label className="block text-xs text-text-secondary font-bold mb-1">Sotto-obiettivi (Milestones)</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newSubquestName}
                  onChange={(e) => setNewSubquestName(e.target.value)}
                  placeholder="Es: Finire capitolo 1..."
                  className="flex-1 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded px-3 py-2 text-xs focus:border-accent-primary focus:outline-none"
                />
                <button
                  type="button"
                  onClick={addSubquest}
                  className="bg-accent-primary hover:bg-accent-primary/80 text-white text-xs px-3 py-1 rounded font-bold"
                >
                  +
                </button>
              </div>
              <ul className="max-h-36 overflow-y-auto space-y-1.5 no-scrollbar">
                {subquests.map((sq) => (
                  <li key={sq.id} className="flex justify-between items-center bg-slate-950/20 p-2 rounded text-xs border border-border-color/30">
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
          </>
        );

      case 'food':
        return (
          <>
            <div className="flex gap-4 mb-4">
              <div className="w-16">
                <label className="block text-xs text-text-secondary font-bold mb-1">Emoji</label>
                <input
                  type="text"
                  name="emoji"
                  value={form.emoji || ''}
                  onChange={handleChange}
                  className="w-full bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded px-3 py-2 text-center text-xl focus:border-accent-primary focus:outline-none"
                  maxLength="2"
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
                  className="w-full bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded px-3 py-2 text-sm focus:border-accent-primary focus:outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div>
                <label className="block text-xs text-text-secondary font-bold mb-1">Grammi Base</label>
                <input
                  type="number"
                  name="baseGrams"
                  value={form.baseGrams || 100}
                  onChange={handleNumberChange}
                  required
                  className="w-full bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded px-3 py-2 text-sm focus:border-accent-primary focus:outline-none"
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
                  className="w-full bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded px-3 py-2 text-sm focus:border-accent-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-text-secondary font-bold mb-1">Proteine Base (g)</label>
                <input
                  type="number"
                  name="baseProteins"
                  value={form.baseProteins || 0}
                  onChange={handleNumberChange}
                  required
                  className="w-full bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded px-3 py-2 text-sm focus:border-accent-primary focus:outline-none"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-xs text-text-secondary font-bold mb-1">Categoria Pasto</label>
              <select
                name="category"
                value={form.category || 'snack'}
                onChange={handleChange}
                className="w-full bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded px-3 py-2 text-sm focus:border-accent-primary focus:outline-none"
              >
                <option value="breakfast">Colazione ☕</option>
                <option value="lunch">Pranzo 🍚</option>
                <option value="dinner">Cena 🍗</option>
                <option value="snack">Spuntino 🍌</option>
                <option value="cheat">Sgarro 🍕</option>
              </select>
            </div>
          </>
        );

      case 'exercise':
        return (
          <>
            <div className="flex gap-4 mb-4">
              <div className="w-16">
                <label className="block text-xs text-text-secondary font-bold mb-1">Emoji</label>
                <input
                  type="text"
                  name="emoji"
                  value={form.emoji || ''}
                  onChange={handleChange}
                  className="w-full bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded px-3 py-2 text-center text-xl focus:border-accent-primary focus:outline-none"
                  maxLength="2"
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
                  className="w-full bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded px-3 py-2 text-sm focus:border-accent-primary focus:outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div>
                <label className="block text-xs text-text-secondary font-bold mb-1">Reps/Min Base</label>
                <input
                  type="number"
                  name="baseCount"
                  value={form.baseCount || 10}
                  onChange={handleNumberChange}
                  required
                  className="w-full bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded px-3 py-2 text-sm focus:border-accent-primary focus:outline-none"
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
                  className="w-full bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded px-3 py-2 text-sm focus:border-accent-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-text-secondary font-bold mb-1">Ricompensa XP</label>
                <input
                  type="number"
                  name="xpReward"
                  value={form.xpReward || 5}
                  onChange={handleNumberChange}
                  required
                  className="w-full bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded px-3 py-2 text-sm focus:border-accent-primary focus:outline-none"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-xs text-text-secondary font-bold mb-1">Stat. Correlata</label>
              <select
                name="statId"
                value={form.statId || ''}
                onChange={handleChange}
                className="w-full bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded px-3 py-2 text-sm focus:border-accent-primary focus:outline-none"
              >
                {visibleStats.map(s => (
                  <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                ))}
              </select>
            </div>
          </>
        );

      case 'weight':
        return (
          <>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs text-text-secondary font-bold mb-1">Peso Attuale (kg)</label>
                <input
                  type="number"
                  name="current"
                  value={form.current || ''}
                  onChange={handleNumberChange}
                  step="0.1"
                  required
                  className="w-full bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded px-3 py-2 text-sm focus:border-accent-primary focus:outline-none"
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
                  className="w-full bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded px-3 py-2 text-sm focus:border-accent-primary focus:outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-text-secondary font-bold mb-1">Massa Magra (%)</label>
                <input
                  type="number"
                  name="currentLean"
                  value={form.currentLean || ''}
                  onChange={handleNumberChange}
                  step="0.1"
                  className="w-full bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded px-3 py-2 text-sm focus:border-accent-primary focus:outline-none"
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
                  className="w-full bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded px-3 py-2 text-sm focus:border-accent-primary focus:outline-none"
                />
              </div>
            </div>
          </>
        );

      case 'stat_detail': {
        const statData = editData || {};
        const history7Days = getStatHistory7Days(statData.id);
        const maxDayXp = Math.max(20, ...history7Days.map(d => d.totalXp));

        const getEntryTitle = (log) => {
          if (log.title) return log.title;
          const foundOneshot = (oneshots || []).find(o => o.primaryTarget === log.statId || o.secondaryTarget === log.statId);
          if (foundOneshot) return foundOneshot.name;
          const foundHabit = (habits || []).find(h => h.primaryTarget === log.statId || h.secondaryTarget === log.statId);
          if (foundHabit) return foundHabit.name;
          return 'Azione RPG';
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
        if (type?.startsWith('health_')) {
          const field = type.split('_')[1];
          const labels = {
            goal: 'Obiettivo Calorie Giornaliero',
            consumed: 'Aggiungi Calorie Cibo',
            burned: 'Aggiungi Calorie Allenamento',
            steps: 'Passi Effettuati',
            water: 'Litri d\'Acqua Bevuti',
            proteins: 'Proteine Consumate (g)',
            protein: 'Obiettivo Proteine (g)',
            water_goal: 'Obiettivo Acqua (L)'
          };
          return (
            <div className="mb-4">
              <label className="block text-xs text-text-secondary font-bold mb-2">
                {labels[field] || labels[type.substring(7)] || 'Inserisci Valore'}
              </label>
              <input
                type="number"
                name="value"
                value={form.value !== undefined ? form.value : ''}
                onChange={handleNumberChange}
                step={type === 'health_water' || type === 'health_water_goal' ? '0.1' : '1'}
                className="w-full bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded-xl px-3 py-2.5 text-xs text-text-main focus:border-accent-primary focus:outline-none"
              />
            </div>
          );
        }
        return null;
      case 'pomodoro':
        return (
          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-xs text-text-secondary font-bold mb-1 uppercase tracking-wider">Allena Abilità</label>
              <select
                name="targetStatId"
                value={form.targetStatId || stats[0]?.id || 'int'}
                onChange={handleChange}
                className="w-full bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded-xl px-3 py-2.5 text-xs text-text-main focus:border-accent-primary focus:outline-none"
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
                className="w-full bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded-xl px-3 py-2.5 text-xs text-text-main focus:border-accent-primary focus:outline-none font-bold"
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
                className="w-full bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded-xl px-3 py-2.5 text-xs text-text-main focus:border-accent-primary focus:outline-none font-bold"
              />
            </div>
          </div>
        );

        return null;
    }
  };

  const getTitle = () => {
    const action = editData ? 'Modifica' : 'Imposta';
    const names = {
      attribute: 'Attributo',
      ability: 'Abilità',
      habit: 'Abitudine',
      oneshot: 'Missione Singola',
      quest: 'Campagna',
      food: 'Alimento nel database',
      exercise: 'Esercizio nel database',
      weight: 'Statistiche Peso',
      stat_detail: '',
      pomodoro: 'Timer Pomodoro'
    };
    if (type?.startsWith('health_')) return 'Aggiorna Dati';
    return `${action} ${names[type] || 'Elemento'}`;
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay active animate-fade-in"
      style={{ background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="modal w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-scale-up"
        style={{
          background: 'var(--bg-card)',
          color: 'var(--text-primary)',
          border: '1px solid var(--glass-border)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.35)'
        }}
      >
        {/* Header (Hidden for stat_detail) */}
        {type !== 'stat_detail' && (
          <div
            className="px-5 py-4 flex justify-center items-center text-center"
            style={{ borderBottom: '1px solid var(--glass-border)', background: 'var(--bg-card)' }}
          >
            <h3 className="font-bold text-base font-cinzel tracking-wide" style={{ color: 'var(--text-primary)' }}>
              {getTitle()}
            </h3>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSave}>
          <div className="p-5 max-h-[70vh] overflow-y-auto no-scrollbar">
            {renderFormFields()}
          </div>

          {/* Footer Actions (Compact 3 Emoji Icons) */}
          <div
            className="px-5 py-3 flex justify-between items-center"
            style={{ borderTop: '1px solid var(--glass-border)', background: 'var(--bg-secondary)' }}
          >
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
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
                    padding: '6px 12px',
                    borderRadius: '10px',
                    fontSize: '15px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#ef4444',
                    cursor: 'pointer'
                  }}
                >
                  🗑️
                </button>
              )}

              {type === 'stat_detail' && onEditStat && (
                <button
                  type="button"
                  onClick={() => {
                    if (onEditStat) onEditStat(editData);
                  }}
                  title="Modifica"
                  style={{
                    padding: '6px 12px',
                    borderRadius: '10px',
                    fontSize: '15px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer'
                  }}
                >
                  ✏️
                </button>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="submit"
                title="Salva"
                style={{
                  padding: '6px 16px',
                  borderRadius: '10px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  background: 'var(--accent-gradient, linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%))',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(124, 58, 237, 0.25)'
                }}
              >
                💾
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
