import React from 'react';
import { _t } from '../../i18n';
import { SettingsGroup, SettingRow, Segmented, SelectValue, OptButton, NumberValue } from './SettingsUI';
import { DIETS, SEXES, ACTIVITY_LEVELS, GOAL_TYPES, getProfile, applyProfileField, computeGoals } from '../../utils/profile';
import { glassesToLiters } from '../../utils/hydration';
import { fmtSteps } from '../../utils/steps';

// Opzioni → "Il tuo profilo": dati di base del giocatore e obiettivi fisici, con i valori consigliati.
// Scrive negli stessi campi della Salute (vedi src/utils/profile.js): cambiare qui o dalla finestra
// "Obiettivi di Salute" è la stessa cosa. Gli obiettivi fisici compaiono quando la Salute è aperta (#64).

export default function ProfileSection({ health, setHealth, open, onToggle, showPhysical = true }) {
  if (!health || !setHealth) return null;
  const p = getProfile(health);
  const rec = computeGoals(p);
  const set = (field, value) => setHealth(prev => applyProfileField(prev, field, value));
  const setGoal = (key, value) => setHealth(prev => ({ ...prev, [key]: { ...(prev[key] || {}), goal: value } }));

  const diet = DIETS.find(d => d.id === p.diet) || DIETS[0];
  const summary = p.hasData
    ? _t("{0} anni • {1} cm • {2}", p.age, p.height, _t(diet.label))
    : _t("Da completare");

  const cur = {
    calories: Number(health?.calories?.goal) || 0,
    proteins: Number(health?.proteins?.goal) || 0,
    water: Number(health?.water?.goal) || 0,
    steps: Number(health?.steps?.goal) || 0,
  };
  const allMatch = cur.calories === rec.calories && cur.proteins === rec.proteins && cur.water === rec.water && cur.steps === rec.steps;
  const useAll = () => setHealth(prev => ({
    ...prev,
    calories: { ...prev.calories, goal: rec.calories },
    proteins: { ...prev.proteins, goal: rec.proteins },
    water: { ...prev.water, goal: rec.water },
    steps: { ...prev.steps, goal: rec.steps },
  }));
  const recDesc = (txt, same) => same ? _t("Come consigliato") : _t("Consigliato: {0}", txt);

  return (
    <SettingsGroup title={_t("👤 Il tuo profilo")} open={open} onToggle={onToggle} summary={!open ? summary : undefined}>
      <div className="opt-subhead">{_t("Dati di base")}</div>
      <SettingRow title={_t("Sesso")} desc={_t("Serve per il calcolo del fabbisogno")}>
        <Segmented options={SEXES.map(s => ({ value: s.id, label: _t(s.label) }))} value={p.sex} onChange={(v) => set('sex', v)} />
      </SettingRow>
      <SettingRow title={_t("Età")}>
        <NumberValue value={p.age} unit={_t("anni")} min={10} max={110} onChange={(v) => set('age', v)} label={_t("Età")} />
      </SettingRow>
      <SettingRow title={_t("Altezza")}>
        <NumberValue value={p.height} unit="cm" min={100} max={240} onChange={(v) => set('height', v)} label={_t("Altezza")} />
      </SettingRow>
      <SettingRow title={_t("Peso")} desc={_t("Lo stesso della tessera Peso in Salute")}>
        <NumberValue value={p.weight} unit="kg" decimals={1} min={25} max={350} onChange={(v) => set('weight', v)} label={_t("Peso")} />
      </SettingRow>
      <SettingRow title={_t("Alimentazione")} desc={_t("Cambia il cibo della finestra Proteine")}>
        <Segmented options={DIETS.map(d => ({ value: d.id, label: _t(d.label) }))} value={p.diet} onChange={(v) => set('diet', v)} />
      </SettingRow>
      <SettingRow title={_t("Attività fisica")} desc={_t((ACTIVITY_LEVELS.find(a => a.value === p.activity) || ACTIVITY_LEVELS[1]).desc)}>
        <SelectValue
          value={String(p.activity)}
          options={ACTIVITY_LEVELS.map(a => ({ value: String(a.value), label: `${_t(a.label)} · ${_t(a.desc)}`, short: _t(a.label) }))}
          onChange={(v) => set('activity', parseFloat(v))}
          label={_t("Attività fisica")}
        />
      </SettingRow>

      {showPhysical && (<>
        <div className="opt-subhead">{_t("Obiettivi fisici")}</div>
        <SettingRow title={_t("Obiettivo")}>
          <Segmented options={GOAL_TYPES.map(g => ({ value: g.id, label: _t(g.label) }))} value={p.goalType} onChange={(v) => set('goalType', v)} />
        </SettingRow>
        <SettingRow title={_t("Peso obiettivo")}>
          <NumberValue value={p.targetWeight} unit="kg" decimals={1} min={25} max={350} onChange={(v) => set('targetWeight', v)} label={_t("Peso obiettivo")} />
        </SettingRow>

        <div className="opt-subhead">
          {_t("Ogni giorno")}
          <span className="opt-subhead-note">{_t("Fabbisogno stimato {0} kcal ({1})", fmtSteps(rec.tdee), rec.method)}</span>
        </div>
        <SettingRow title={_t("Calorie")} desc={recDesc(`${fmtSteps(rec.calories)} kcal`, cur.calories === rec.calories)}>
          <NumberValue value={cur.calories} unit="kcal" min={800} max={6000} onChange={(v) => setGoal('calories', v)} label={_t("Calorie")} />
        </SettingRow>
        <SettingRow title={_t("Proteine")} desc={recDesc(`${rec.proteins} g`, cur.proteins === rec.proteins)}>
          <NumberValue value={cur.proteins} unit="g" min={10} max={400} onChange={(v) => setGoal('proteins', v)} label={_t("Proteine")} />
        </SettingRow>
        <SettingRow title={_t("Acqua")} desc={recDesc(_t("{0} bicchieri", rec.water), cur.water === rec.water) + ` • ${String(glassesToLiters(cur.water)).replace('.', ',')} L`}>
          <NumberValue value={cur.water} unit={_t("bicch.")} min={1} max={40} onChange={(v) => setGoal('water', v)} label={_t("Acqua")} />
        </SettingRow>
        <SettingRow title={_t("Passi")} desc={recDesc(fmtSteps(rec.steps), cur.steps === rec.steps)}>
          <NumberValue value={cur.steps} min={500} max={50000} onChange={(v) => setGoal('steps', v)} label={_t("Passi")} />
        </SettingRow>
        <SettingRow
          title={_t("Valori consigliati")}
          desc={allMatch ? _t("Stai già usando tutti i valori consigliati") : _t("Calcolati dai tuoi dati: indicazione di massima, non medica")}
        >
          <OptButton small variant="primary" disabled={allMatch} onClick={useAll}>{_t("Usa tutti")}</OptButton>
        </SettingRow>
      </>)}
    </SettingsGroup>
  );
}
