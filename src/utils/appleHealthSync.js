/**
 * Apple Health & iOS Shortcuts Sync Engine
 * Gestisce l'importazione di parametri da URL e Appunti per sincronizzare:
 * - Passi (steps)
 * - Calorie bruciate (burned)
 * - Calorie consumate (consumed)
 * - Biccheri/litri d'acqua (water)
 * - Minuti di Mindfulness
 * - Abitudini completate automaticamente (es. "Duolingo")
 */

export function parseSyncPayload(rawInput) {
  if (!rawInput) return null;

  let params = {};

  // Se è una stringa, controlla se è JSON o query string
  if (typeof rawInput === 'string') {
    const trimmed = rawInput.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        params = JSON.parse(trimmed);
      } catch (e) {
        console.warn('[Sync] Errore parsing JSON da appunti:', e);
      }
    } else {
      // Potrebbe essere una query string tipo "?steps=8000&burned=350" o "steps=8000&burned=350"
      let searchStr = trimmed;
      if (searchStr.includes('?')) {
        searchStr = searchStr.split('?')[1];
      }
      if (searchStr.includes('#')) {
        searchStr = searchStr.split('#')[0];
      }
      const urlParams = new URLSearchParams(searchStr);
      for (const [key, value] of urlParams.entries()) {
        params[key] = value;
      }
    }
  } else if (typeof rawInput === 'object') {
    params = { ...rawInput };
  }

  const payload = {};

  // 1. Passi
  const rawSteps = params.steps ?? params.step ?? params.passi;
  if (rawSteps !== undefined && rawSteps !== null && rawSteps !== '') {
    const num = Number(rawSteps);
    if (!isNaN(num) && num >= 0) {
      payload.steps = Math.round(num);
    }
  }

  // 2. Calorie Bruciate (Active Energy Burned)
  const rawBurned = params.burned ?? params.burned_cal ?? params.calories_burned ?? params.cal_burned ?? params.calorie_bruciate;
  if (rawBurned !== undefined && rawBurned !== null && rawBurned !== '') {
    const num = Number(rawBurned);
    if (!isNaN(num) && num >= 0) {
      payload.burned = Math.round(num);
    }
  }

  // 3. Calorie Consumate (Dietary Energy)
  const rawConsumed = params.consumed ?? params.consumed_cal ?? params.calories_consumed ?? params.calorie_assunte;
  if (rawConsumed !== undefined && rawConsumed !== null && rawConsumed !== '') {
    const num = Number(rawConsumed);
    if (!isNaN(num) && num >= 0) {
      payload.consumed = Math.round(num);
    }
  }

  // 4. Acqua
  const rawWater = params.water ?? params.acqua;
  if (rawWater !== undefined && rawWater !== null && rawWater !== '') {
    const num = Number(rawWater);
    if (!isNaN(num) && num >= 0) {
      payload.water = num;
    }
  }

  // 5. Mindfulness (minuti)
  const rawMindfulness = params.mindfulness ?? params.meditazione ?? params.mindful;
  if (rawMindfulness !== undefined && rawMindfulness !== null && rawMindfulness !== '') {
    const num = Number(rawMindfulness);
    if (!isNaN(num) && num >= 0) {
      payload.mindfulness = Math.round(num);
    }
  }

  // 6. Abitudine da completare (es. "Duolingo")
  const rawHabit = params.habit ?? params.complete_habit ?? params.abitudine;
  if (rawHabit && typeof rawHabit === 'string') {
    payload.habit = decodeURIComponent(rawHabit).trim();
  }

  // Ritorna null se nessun parametro valido è stato estratto
  if (Object.keys(payload).length === 0) {
    return null;
  }

  return payload;
}

/**
 * Applica i dati estratti allo stato di Quest Life
 */
export function applyHealthSync({
  payload,
  habits,
  completionLog,
  todayStr,
  setHealth,
  onToggleHabit,
  onRewardXp
}) {
  if (!payload) return { success: false, actions: [] };

  const actions = [];

  // Aggiorna metriche salute
  setHealth(prev => {
    let next = { ...prev };
    let changed = false;

    if (payload.steps !== undefined) {
      next.steps = { ...next.steps, current: payload.steps };
      actions.push(`👟 Passi impostati a ${payload.steps.toLocaleString()}`);
      changed = true;
    }

    if (payload.burned !== undefined) {
      next.calories = { ...next.calories, burned: payload.burned };
      actions.push(`🔥 Calorie bruciate impostate a ${payload.burned} kcal`);
      changed = true;
    }

    if (payload.consumed !== undefined) {
      next.calories = { ...next.calories, consumed: payload.consumed };
      actions.push(`🍽️ Calorie assunte impostate a ${payload.consumed} kcal`);
      changed = true;
    }

    if (payload.water !== undefined) {
      next.water = { ...next.water, consumed: payload.water };
      actions.push(`💧 Acqua impostata a ${payload.water} bicchieri`);
      changed = true;
    }

    return changed ? next : prev;
  });

  // Gestione Mindfulness
  if (payload.mindfulness !== undefined && payload.mindfulness > 0) {
    // Cerca se esiste un'abitudine dedicata alla meditazione/mindfulness
    const mindfulHabit = habits.find(h => {
      const n = (h.name || '').toLowerCase();
      return n.includes('mindful') || n.includes('medita') || n.includes('respiro');
    });

    if (mindfulHabit) {
      const isDone = completionLog[todayStr]?.habits?.includes(mindfulHabit.id);
      if (!isDone) {
        onToggleHabit(mindfulHabit.id, todayStr);
        actions.push(`🧘 Abitudine "${mindfulHabit.name}" completata (+XP!)`);
      } else {
        actions.push(`🧘 Mindfulness (${payload.mindfulness} min): abitudine già completata oggi.`);
      }
    } else {
      // Se non c'è l'abitudine specifica, assegna un piccolo bonus XP a Saggezza (wis)
      if (onRewardXp) {
        onRewardXp('wis', Math.min(25, Math.max(5, payload.mindfulness)), false, `Mindfulness (${payload.mindfulness} min)`, todayStr, 1, 'health');
      }
      actions.push(`🧘 Sessione Mindfulness registrata: ${payload.mindfulness} min (+XP Saggezza)`);
    }
  }

  // Gestione Abitudine Specifica (es. "Duolingo")
  if (payload.habit) {
    const targetQuery = payload.habit.toLowerCase();
    const habitMatch = habits.find(h => {
      const name = (h.name || '').toLowerCase();
      return name === targetQuery || name.includes(targetQuery) || h.id === payload.habit;
    });

    if (habitMatch) {
      const isDone = completionLog[todayStr]?.habits?.includes(habitMatch.id);
      if (!isDone) {
        onToggleHabit(habitMatch.id, todayStr);
        actions.push(`🦉 Abitudine "${habitMatch.name}" completata (+XP & Serie!)`);
      } else {
        actions.push(`🦉 Abitudine "${habitMatch.name}" era già stata completata oggi.`);
      }
    } else {
      actions.push(`⚠️ Abitudine "${payload.habit}" non trovata (creala nella scheda Abitudini con questo nome).`);
    }
  }

  return {
    success: actions.length > 0,
    actions
  };
}

/**
 * Pulisce la barra dell'URL rimuovendo i parametri di sync senza ricaricare la pagina
 */
export function cleanSyncUrl() {
  if (typeof window === 'undefined' || !window.history || !window.location) return;

  const url = new URL(window.location.href);
  const syncKeys = [
    'steps', 'step', 'passi',
    'burned', 'burned_cal', 'calories_burned', 'cal_burned', 'calorie_bruciate',
    'consumed', 'consumed_cal', 'calories_consumed', 'calorie_assunte',
    'water', 'acqua',
    'mindfulness', 'meditazione', 'mindful',
    'habit', 'complete_habit', 'abitudine',
    'sync'
  ];

  let found = false;
  syncKeys.forEach(k => {
    if (url.searchParams.has(k)) {
      url.searchParams.delete(k);
      found = true;
    }
  });

  if (found) {
    const newPath = url.pathname + (url.searchParams.toString() ? '?' + url.searchParams.toString() : '') + url.hash;
    window.history.replaceState({}, document.title, newPath);
  }
}
