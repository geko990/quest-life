// Giornate tipo (modelli di routine): logica pura, separata dalla grafica (regola #24 della Roadmap).
// Una giornata tipo è { id, name, emoji, description, steps: [{ id, time: 'HH:MM', title }] }.

// "8", "8:5", "08.30", "830" → "08:00", "08:05", "08:30", "08:30". Orario non valido → ''.
export function normalizeTime(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  let h, m;
  const parts = raw.split(/[:.,h ]/).filter(Boolean);
  if (parts.length >= 2) {
    h = parseInt(parts[0], 10); m = parseInt(parts[1], 10);
  } else if (/^\d{3,4}$/.test(raw)) {
    h = parseInt(raw.slice(0, -2), 10); m = parseInt(raw.slice(-2), 10);
  } else {
    h = parseInt(raw, 10); m = 0;
  }
  if (!Number.isFinite(h) || !Number.isFinite(m) || h < 0 || h > 23 || m < 0 || m > 59) return '';
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function timeToMinutes(time) {
  const t = normalizeTime(time);
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

// Ordina per orario; le azioni senza orario vanno in fondo, nell'ordine in cui erano.
// A parità di orario resta l'ordine precedente (sort stabile).
export function sortSteps(steps) {
  const list = Array.isArray(steps) ? steps : [];
  return list
    .map((s, i) => ({ s, i, min: timeToMinutes(s?.time) }))
    .sort((a, b) => {
      if (a.min == null && b.min == null) return a.i - b.i;
      if (a.min == null) return 1;
      if (b.min == null) return -1;
      return a.min - b.min || a.i - b.i;
    })
    .map(x => x.s);
}

// Orario proposto per una nuova azione: un'ora dopo l'ultima (massimo 23:30), oppure 08:00 se la lista è vuota.
export function suggestNextTime(steps) {
  const mins = (Array.isArray(steps) ? steps : []).map(s => timeToMinutes(s?.time)).filter(v => v != null);
  if (mins.length === 0) return '08:00';
  const next = Math.min(Math.max(...mins) + 60, 23 * 60 + 30);
  return `${String(Math.floor(next / 60)).padStart(2, '0')}:${String(next % 60).padStart(2, '0')}`;
}

// Pulizia prima del salvataggio: orari normalizzati, azioni vuote tolte, ordine per orario.
export function cleanPreset(preset) {
  const steps = (Array.isArray(preset?.steps) ? preset.steps : [])
    .map(s => ({ ...s, time: normalizeTime(s?.time), title: String(s?.title ?? '').trim() }))
    .filter(s => s.title);
  return { ...preset, name: String(preset?.name ?? '').trim(), steps: sortSteps(steps) };
}
