// Riepilogo di una campagna appena completata (#69), per la schermata di celebrazione.
// Solo dati e calcoli, niente grafica (riusabile nell'app nativa, #24).
//   - i passi (sotto-obiettivi) con il giorno in cui sono stati spuntati, presi dal registro delle giornate
//     (completionLog[data].subquests contiene "idCampagna:idPasso");
//   - da quanti giorni era in corso (data di creazione, o il timestamp nell'id "quest_<ms>", o il primo passo);
//   - XP guadagnati e il premio scelto dall'utente (campo `reward` della campagna), se c'è.

const parseDay = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
};

function startOf(quest, firstStepDay) {
  if (quest.createdAt) {
    const d = new Date(quest.createdAt);
    if (!isNaN(d)) return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
  const m = /^quest_(\d{12,})/.exec(quest.id || '');
  if (m) {
    const d = new Date(Number(m[1]));
    if (!isNaN(d)) return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
  return firstStepDay ? parseDay(firstStepDay) : null;
}

export function buildCampaignRecap(quest, subquests, completionLog, todayStr, xp) {
  const doneOn = {};
  Object.keys(completionLog || {}).sort().forEach(day => {
    (completionLog[day]?.subquests || []).forEach(key => {
      if (typeof key === 'string' && key.startsWith(quest.id + ':') && !doneOn[key]) doneOn[key] = day;
    });
  });
  const steps = (subquests || []).map((sq, i) => {
    const id = sq.id || `sub_${quest.id}_${i}`;
    // il passo spuntato adesso non è ancora nel registro (si aggiorna insieme): è di oggi
    return { name: sq.name || '', day: doneOn[`${quest.id}:${id}`] || (sq.justDone ? todayStr : null) };
  });
  const days = steps.map(s => s.day).filter(Boolean).sort();
  const start = startOf(quest, days[0]);
  const end = parseDay(todayStr) || new Date();
  const totalDays = start ? Math.max(1, Math.round((end - start) / 86400000) + 1) : null;
  return {
    id: quest.id,
    name: quest.name || '',
    emoji: quest.emoji || '🏆',
    steps,
    totalDays,
    xp: xp || 0,
    reward: (quest.reward || '').trim(),
  };
}

// Passi da mostrare: tutti se sono pochi, altrimenti i primi 2, un segnaposto con quanti ne mancano, gli ultimi 3
export function visibleSteps(steps, max = 6) {
  if (steps.length <= max) return steps.map((s, i) => ({ ...s, index: i }));
  const head = steps.slice(0, 2).map((s, i) => ({ ...s, index: i }));
  const tail = steps.slice(-3).map((s, i) => ({ ...s, index: steps.length - 3 + i }));
  return [...head, { gap: steps.length - 5 }, ...tail];
}
