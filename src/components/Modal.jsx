import React, { useState, useEffect } from 'react';

export default function Modal({ isOpen, onClose, type, editData, onSave, onDelete, stats }) {
  if (!isOpen) return null;

  const [form, setForm] = useState({});
  const [subquests, setSubquests] = useState([]);
  const [newSubquestName, setNewSubquestName] = useState('');

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
                  className="w-full bg-slate-950/40 border border-border-color rounded px-3 py-2 text-center text-xl focus:border-accent-primary focus:outline-none"
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
                  className="w-full bg-slate-950/40 border border-border-color rounded px-3 py-2 text-sm focus:border-accent-primary focus:outline-none"
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
                className="w-full bg-slate-950/40 border border-border-color rounded px-3 py-2 text-sm focus:border-accent-primary focus:outline-none"
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
                  className="w-full bg-slate-950/40 border border-border-color rounded px-3 py-2 text-center text-xl focus:border-accent-primary focus:outline-none"
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
                  className="w-full bg-slate-950/40 border border-border-color rounded px-3 py-2 text-sm focus:border-accent-primary focus:outline-none"
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
                  className="w-full bg-slate-950/40 border border-border-color rounded px-3 py-2 text-sm focus:border-accent-primary focus:outline-none"
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
                    className="w-full bg-slate-950/40 border border-border-color rounded px-3 py-2 text-sm focus:border-accent-primary focus:outline-none"
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
                  className="w-full bg-slate-950/40 border border-border-color rounded px-3 py-2 text-sm focus:border-accent-primary focus:outline-none"
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
                  className="w-full bg-slate-950/40 border border-border-color rounded px-3 py-2 text-sm focus:border-accent-primary focus:outline-none"
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
                  className="w-full bg-slate-950/40 border border-border-color rounded px-3 py-2 text-center text-xl focus:border-accent-primary focus:outline-none"
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
                  className="w-full bg-slate-950/40 border border-border-color rounded px-3 py-2 text-sm focus:border-accent-primary focus:outline-none"
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
                  className="w-full bg-slate-950/40 border border-border-color rounded px-3 py-2 text-sm focus:border-accent-primary focus:outline-none"
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
                  className="w-full bg-slate-950/40 border border-border-color rounded px-3 py-2 text-sm focus:border-accent-primary focus:outline-none"
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
                  className="w-full bg-slate-950/40 border border-border-color rounded px-3 py-2 text-center text-xl focus:border-accent-primary focus:outline-none"
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
                  className="w-full bg-slate-950/40 border border-border-color rounded px-3 py-2 text-sm focus:border-accent-primary focus:outline-none"
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
                className="w-full bg-slate-950/40 border border-border-color rounded px-3 py-2 text-sm focus:border-accent-primary focus:outline-none"
              ></textarea>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs text-text-secondary font-bold mb-1">Stat. Primaria</label>
                <select
                  name="primaryTarget"
                  value={form.primaryTarget || ''}
                  onChange={handleChange}
                  className="w-full bg-slate-950/40 border border-border-color rounded px-3 py-2 text-sm focus:border-accent-primary focus:outline-none"
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
                  className="w-full bg-slate-950/40 border border-border-color rounded px-3 py-2 text-sm focus:border-accent-primary focus:outline-none"
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
                  className="flex-1 bg-slate-950/40 border border-border-color rounded px-3 py-2 text-xs focus:border-accent-primary focus:outline-none"
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
                  className="w-full bg-slate-950/40 border border-border-color rounded px-3 py-2 text-center text-xl focus:border-accent-primary focus:outline-none"
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
                  className="w-full bg-slate-950/40 border border-border-color rounded px-3 py-2 text-sm focus:border-accent-primary focus:outline-none"
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
                  className="w-full bg-slate-950/40 border border-border-color rounded px-3 py-2 text-sm focus:border-accent-primary focus:outline-none"
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
                  className="w-full bg-slate-950/40 border border-border-color rounded px-3 py-2 text-sm focus:border-accent-primary focus:outline-none"
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
                  className="w-full bg-slate-950/40 border border-border-color rounded px-3 py-2 text-sm focus:border-accent-primary focus:outline-none"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-xs text-text-secondary font-bold mb-1">Categoria Pasto</label>
              <select
                name="category"
                value={form.category || 'snack'}
                onChange={handleChange}
                className="w-full bg-slate-950/40 border border-border-color rounded px-3 py-2 text-sm focus:border-accent-primary focus:outline-none"
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
                  className="w-full bg-slate-950/40 border border-border-color rounded px-3 py-2 text-center text-xl focus:border-accent-primary focus:outline-none"
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
                  className="w-full bg-slate-950/40 border border-border-color rounded px-3 py-2 text-sm focus:border-accent-primary focus:outline-none"
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
                  className="w-full bg-slate-950/40 border border-border-color rounded px-3 py-2 text-sm focus:border-accent-primary focus:outline-none"
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
                  className="w-full bg-slate-950/40 border border-border-color rounded px-3 py-2 text-sm focus:border-accent-primary focus:outline-none"
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
                  className="w-full bg-slate-950/40 border border-border-color rounded px-3 py-2 text-sm focus:border-accent-primary focus:outline-none"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-xs text-text-secondary font-bold mb-1">Stat. Correlata</label>
              <select
                name="statId"
                value={form.statId || ''}
                onChange={handleChange}
                className="w-full bg-slate-950/40 border border-border-color rounded px-3 py-2 text-sm focus:border-accent-primary focus:outline-none"
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
                  className="w-full bg-slate-950/40 border border-border-color rounded px-3 py-2 text-sm focus:border-accent-primary focus:outline-none"
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
                  className="w-full bg-slate-950/40 border border-border-color rounded px-3 py-2 text-sm focus:border-accent-primary focus:outline-none"
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
                  className="w-full bg-slate-950/40 border border-border-color rounded px-3 py-2 text-sm focus:border-accent-primary focus:outline-none"
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
                  className="w-full bg-slate-950/40 border border-border-color rounded px-3 py-2 text-sm focus:border-accent-primary focus:outline-none"
                />
              </div>
            </div>
          </>
        );

      case 'stat_detail':
        const statData = editData || {};
        return (
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-accent-primary/10 border-2 border-accent-primary flex items-center justify-center text-3xl shadow-lg">
              {statData.icon || '⭐'}
            </div>
            <div>
              <h4 className="text-lg font-bold text-text-main font-cinzel">{statData.name}</h4>
              <p className="text-xs text-text-secondary">{statData.description || 'Statistica del personaggio'}</p>
            </div>
            <div className="bg-slate-950/40 p-3 rounded-xl border border-border-color/40 flex justify-around">
              <div>
                <span className="text-[10px] text-text-secondary uppercase block font-bold">Livello</span>
                <span className="text-lg font-bold text-accent-primary">{statData.level || 1}</span>
              </div>
              <div>
                <span className="text-[10px] text-text-secondary uppercase block font-bold">XP Accumulati</span>
                <span className="text-lg font-bold text-amber-400">{statData.xp || 0}</span>
              </div>
            </div>
            <p className="text-[11px] text-text-secondary/80 italic leading-relaxed">
              Man mano che completi abitudini e missioni collegate a {statData.name}, guadagnerai XP ed aumenterai il livello di questa statistica!
            </p>
          </div>
        );

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
                required
                className="w-full bg-slate-950/40 border border-border-color rounded px-3 py-2 text-center text-lg focus:border-accent-primary focus:outline-none font-bold"
              />
            </div>
          );
        }
        return null;
    }
  };

  const getTitle = () => {
    const action = editData ? 'Modifica' : 'Aggiungi';
    const names = {
      attribute: 'Attributo',
      ability: 'Abilità',
      habit: 'Abitudine',
      oneshot: 'Missione Singola',
      quest: 'Campagna',
      food: 'Alimento nel database',
      exercise: 'Esercizio nel database',
      weight: 'Statistiche Peso',
      stat_detail: 'Dettaglio Statistica'
    };
    if (type?.startsWith('health_')) return 'Aggiorna Dati';
    return `${action} ${names[type] || 'Elemento'}`;
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-bg-main border border-border-color rounded-2xl overflow-hidden shadow-2xl animate-scale-up"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-border-color/50 flex justify-between items-center">
          <h3 className="font-bold text-text-main text-base font-cinzel tracking-wide">{getTitle()}</h3>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-main font-bold text-lg"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave}>
          <div className="p-5 max-h-[70vh] overflow-y-auto no-scrollbar">
            {renderFormFields()}
          </div>

          {/* Footer Actions */}
          <div className="px-5 py-3.5 bg-slate-950/20 border-t border-border-color/40 flex justify-between items-center">
            {editData && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Sei sicuro di voler eliminare questo elemento?')) {
                    onDelete(editData.id || editData);
                    onClose();
                  }
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-red-400 hover:text-white hover:bg-red-500/80 border border-red-500/30 transition-all active:scale-95 flex items-center gap-1.5"
              >
                <span>🗑️</span>
                <span>Elimina</span>
              </button>
            ) : <div></div>}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-text-secondary hover:text-text-main border border-border-color hover:bg-slate-950/10 transition-colors"
              >
                Annulla
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-accent-primary to-accent-secondary hover:brightness-110 shadow-md transition-all active:scale-95"
              >
                Salva
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
