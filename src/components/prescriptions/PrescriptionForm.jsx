import { useState } from 'react'
import { differenceInDays, addDays, parseISO, format } from 'date-fns'
import { useApp } from '../../contexts/AppContext'
import './PrescriptionForm.css'

const COLORS = ['#2563eb', '#7c3aed', '#db2777', '#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#0891b2']
const UNITS = ['comprimé(s)', 'gélule(s)', 'ml', 'gouttes', 'bouffée(s)', 'sachet(s)', 'patch(s)', 'autre']

export function newTime() { return { time_of_day: '08:00', quantity: '1' } }

export function toLocalDate(date) { return format(date, 'yyyy-MM-dd') }
export function dayToDate(prescStart, day) {
  return toLocalDate(addDays(parseISO(prescStart), day - 1))
}
export function dateToDay(prescStart, date) {
  return Math.max(1, differenceInDays(parseISO(date), parseISO(prescStart)) + 1)
}

export function buildPhasesFromMed(m, startDate) {
  if (m.phaseMode === 'recurrence') {
    const startDay = m.dateMode ? dateToDay(startDate, m.recurrenceDateStart) : m.recurrenceStart
    const totalDays = m.dateMode
      ? Math.max(1, differenceInDays(parseISO(m.recurrenceDateEnd), parseISO(m.recurrenceDateStart)) + 1)
      : m.recurrenceTotalDays
    return [{ start_day: startDay, duration_days: totalDays, interval_days: m.recurrenceInterval, times: m.sharedTimes }]
  }
  if (m.phaseMode === 'days') {
    return m.selectedDays.map((d) => {
      const start_day = m.dayDateMode ? dateToDay(startDate, d.date) : (d.relDay || 1)
      return { start_day, duration_days: 1, times: m.sharedTimes }
    })
  }
  return m.phases.map(({ no_end, date_start, date_end, ...ph }) => {
    if (m.dateMode) {
      const start_day = dateToDay(startDate, date_start)
      const duration_days = no_end ? null : Math.max(1, differenceInDays(parseISO(date_end), parseISO(date_start)) + 1)
      return { start_day, duration_days, times: ph.times }
    }
    return { start_day: ph.start_day, duration_days: no_end ? null : ph.duration_days, times: ph.times }
  })
}

function detectDaysMode(phases) {
  if (!phases.length) return false
  if (!phases.every((ph) => ph.duration_days === 1 && !ph.interval_days)) return false
  const ref = JSON.stringify(phases[0].prescription_times?.map((t) => ({ time_of_day: t.time_of_day, quantity: t.quantity })))
  return phases.every((ph) => JSON.stringify(ph.prescription_times?.map((t) => ({ time_of_day: t.time_of_day, quantity: t.quantity }))) === ref)
}

function detectRecurrence(phases) {
  // New format: single phase with interval_days
  if (phases.length === 1 && phases[0].interval_days) {
    const ph = phases[0]
    return { interval: ph.interval_days, startDay: ph.start_day, totalDays: ph.duration_days }
  }
  // Old format: backward compat — detect from expanded individual days
  if (phases.length < 2) return null
  if (!phases.every((ph) => ph.duration_days === 1 && !ph.interval_days)) return null
  const ref = JSON.stringify(phases[0].prescription_times?.map((t) => ({ time_of_day: t.time_of_day, quantity: t.quantity })))
  if (!phases.every((ph) => JSON.stringify(ph.prescription_times?.map((t) => ({ time_of_day: t.time_of_day, quantity: t.quantity }))) === ref)) return null
  const days = phases.map((ph) => ph.start_day).sort((a, b) => a - b)
  const interval = days[1] - days[0]
  if (interval < 2) return null
  if (!days.every((d, i) => i === 0 || d - days[i - 1] === interval)) return null
  return { interval, startDay: days[0], totalDays: days[days.length - 1] - days[0] + interval }
}

function initMed(m, prescStart) {
  const phases = m.prescription_phases || []
  const rec = detectRecurrence(phases)
  if (rec) {
    return {
      picked: true, name: m.name, dosage: m.dosage || '', unit: m.unit, color: m.color,
      phaseMode: 'recurrence', dateMode: false,
      recurrenceStart: rec.startDay,
      recurrenceInterval: rec.interval,
      recurrenceTotalDays: rec.totalDays,
      recurrenceDateStart: dayToDate(prescStart, rec.startDay),
      recurrenceDateEnd: dayToDate(prescStart, rec.startDay + rec.totalDays - 1),
      sharedTimes: (phases[0]?.prescription_times || []).map((t) => ({ time_of_day: t.time_of_day, quantity: t.quantity })),
      phases: [], selectedDays: [], dayDateMode: false,
    }
  }
  const isDays = detectDaysMode(phases)
  if (isDays) {
    return {
      picked: true, name: m.name, dosage: m.dosage || '', unit: m.unit, color: m.color,
      phaseMode: 'days', dayDateMode: false,
      selectedDays: phases.map((ph) => ({ relDay: ph.start_day, date: dayToDate(prescStart, ph.start_day) })),
      sharedTimes: (phases[0]?.prescription_times || []).map((t) => ({ time_of_day: t.time_of_day, quantity: t.quantity })),
      phases: [],
    }
  }
  return {
    picked: true, name: m.name, dosage: m.dosage || '', unit: m.unit, color: m.color,
    phaseMode: 'period', dateMode: false,
    phases: phases.map((ph) => ({
      start_day: ph.start_day,
      duration_days: ph.duration_days ?? 7,
      no_end: ph.duration_days == null,
      date_start: dayToDate(prescStart, ph.start_day),
      date_end: ph.duration_days == null ? dayToDate(prescStart, ph.start_day) : dayToDate(prescStart, ph.start_day + ph.duration_days - 1),
      times: (ph.prescription_times || []).map((t) => ({ time_of_day: t.time_of_day, quantity: t.quantity })),
    })),
    selectedDays: [], sharedTimes: [newTime()], dayDateMode: false,
  }
}

export function newMed(prescStart) {
  return {
    picked: false, name: '', dosage: '', unit: 'comprimé(s)', color: '#2563eb',
    phaseMode: 'period', dateMode: false,
    phases: [{ start_day: 1, duration_days: 7, no_end: false, date_start: prescStart, date_end: toLocalDate(addDays(parseISO(prescStart), 6)), times: [newTime()] }],
    selectedDays: [], sharedTimes: [newTime()], dayDateMode: false,
    recurrenceStart: 1, recurrenceInterval: 2, recurrenceTotalDays: 120,
    recurrenceDateStart: prescStart, recurrenceDateEnd: toLocalDate(addDays(parseISO(prescStart), 119)),
  }
}

// ── Picker inline ────────────────────────────────────────────────────────────
function MedPickerInline({ medications, onPick, onNew }) {
  const [search, setSearch] = useState('')
  const filtered = medications.filter((m) =>
    `${m.name} ${m.dosage || ''}`.toLowerCase().includes(search.toLowerCase())
  )
  return (
    <div className="stack stack-sm" style={{ padding: '12px 16px 16px' }}>
      {medications.length > 0 && (
        <>
          <input
            type="text" placeholder="Rechercher un médicament..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ marginBottom: 4 }}
          />
          <div className="med-picker-list">
            {filtered.map((m) => (
              <button key={m.id} type="button" className="med-picker-row" onClick={() => onPick(m)}>
                <span className="med-picker-color" style={{ background: m.color }} />
                <span className="med-picker-name">{m.name}{m.dosage ? ` ${m.dosage}` : ''}</span>
                <span className="med-picker-unit">{m.unit}</span>
                <span style={{ color: 'var(--gray-400)', fontSize: 18 }}>›</span>
              </button>
            ))}
            {filtered.length === 0 && <div className="med-picker-empty">Aucun résultat</div>}
          </div>
        </>
      )}
      <button type="button" className="btn btn-ghost btn-sm btn-full" onClick={onNew}>
        + Nouveau médicament
      </button>
    </div>
  )
}

// ── Phase editor (shared between Période and Jours modes) ────────────────────
export function MedPhaseEditor({ med, mi, startDate, setMed, setPhase, addPhase, removePhase, setTime, addTime, removeTime, setSharedTime, addSharedTime, removeSharedTime, setDay, addDay, removeDay }) {
  const [showEndDay, setShowEndDay] = useState(true)
  return (
    <>
      <div className="presc-mode-toggle">
        <button type="button"
          className={`presc-mode-btn ${med.phaseMode === 'period' ? 'presc-mode-btn--active' : ''}`}
          onClick={() => setMed(mi, 'phaseMode', 'period')}>
          Période
        </button>
        <button type="button"
          className={`presc-mode-btn ${med.phaseMode === 'recurrence' ? 'presc-mode-btn--active' : ''}`}
          onClick={() => setMed(mi, 'phaseMode', 'recurrence')}>
          Alternance
        </button>
        <button type="button"
          className={`presc-mode-btn ${med.phaseMode === 'days' ? 'presc-mode-btn--active' : ''}`}
          onClick={() => setMed(mi, 'phaseMode', 'days')}>
          Jours isolés
        </button>
      </div>

      {med.phaseMode === 'period' && (
        <div className="stack stack-md">
          <div className="presc-section-header">
            <div className="section-title" style={{ margin: 0 }}>Périodes</div>
            <div className="row row-gap-sm">
              <button type="button" className={`btn btn-sm ${med.dateMode ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setMed(mi, 'dateMode', !med.dateMode)}>
                {med.dateMode ? '📅 Dates' : '🔢 Jours'}
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => addPhase(mi)}>+ Période</button>
            </div>
          </div>

          {med.phases.map((phase, pi) => (
            <div key={pi} className="presc-phase-block">
              <div className="presc-phase-header">
                <span className="presc-phase-label">Période {pi + 1}</span>
                {med.phases.length > 1 && (
                  <button type="button" className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--red-500)', padding: '4px 8px', minHeight: 'auto' }}
                    onClick={() => removePhase(mi, pi)}>✕</button>
                )}
              </div>

              {med.dateMode ? (
                <div className="form-row">
                  <div className="form-group">
                    <label>Début</label>
                    <input type="date" value={phase.date_start} onChange={(e) => {
                      setPhase(mi, pi, 'date_start', e.target.value)
                      if (!phase.date_end || e.target.value > phase.date_end) setPhase(mi, pi, 'date_end', e.target.value)
                    }} />
                  </div>
                  {!phase.no_end && (
                    <div className="form-group">
                      <label>Fin</label>
                      <input type="date" value={phase.date_end} min={phase.date_start}
                        onChange={(e) => setPhase(mi, pi, 'date_end', e.target.value)} />
                    </div>
                  )}
                </div>
              ) : (
                <div className="form-row">
                  <div className="form-group">
                    <label>Début (jour)</label>
                    <input type="number" inputMode="numeric" min="1" value={phase.start_day}
                      onChange={(e) => setPhase(mi, pi, 'start_day', parseInt(e.target.value) || 1)} />
                  </div>
                  {!phase.no_end && (
                    <div className="form-group">
                      <div className="presc-field-toggle">
                        <button type="button"
                          className={`presc-field-btn ${showEndDay ? 'presc-field-btn--active' : ''}`}
                          onClick={() => setShowEndDay(true)}>Fin</button>
                        <button type="button"
                          className={`presc-field-btn ${!showEndDay ? 'presc-field-btn--active' : ''}`}
                          onClick={() => setShowEndDay(false)}>Durée</button>
                      </div>
                      {showEndDay ? (
                        <input type="number" inputMode="numeric" min={phase.start_day}
                          value={phase.start_day + phase.duration_days - 1}
                          onChange={(e) => {
                            const endDay = parseInt(e.target.value) || phase.start_day
                            setPhase(mi, pi, 'duration_days', Math.max(1, endDay - phase.start_day + 1))
                          }} />
                      ) : (
                        <input type="number" inputMode="numeric" min="1" value={phase.duration_days}
                          onChange={(e) => setPhase(mi, pi, 'duration_days', parseInt(e.target.value) || 1)} />
                      )}
                    </div>
                  )}
                </div>
              )}

              <label className="presc-no-end-label">
                <input type="checkbox" checked={phase.no_end}
                  onChange={(e) => setPhase(mi, pi, 'no_end', e.target.checked)} />
                Sans fin (traitement permanent)
              </label>

              <div className="stack stack-sm" style={{ marginTop: 8 }}>
                <label>Prises</label>
                {phase.times.map((time, ti) => (
                  <div key={ti} className="presc-time-row">
                    <input type="time" value={time.time_of_day}
                      onChange={(e) => setTime(mi, pi, ti, 'time_of_day', e.target.value)} />
                    <div className="presc-time-qty">
                      <input type="text" value={time.quantity} placeholder="qté"
                        style={{ width: 60, textAlign: 'center' }}
                        onChange={(e) => setTime(mi, pi, ti, 'quantity', e.target.value)} />
                      <span className="presc-time-unit">{med.unit}</span>
                    </div>
                    {phase.times.length > 1 && (
                      <button type="button" className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--red-500)', padding: '4px 8px', minHeight: 'auto' }}
                        onClick={() => removeTime(mi, pi, ti)}>✕</button>
                    )}
                  </div>
                ))}
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => addTime(mi, pi)}>+ Prise</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {med.phaseMode === 'recurrence' && (
        <div className="stack stack-md">
          <div className="presc-section-header">
            <div className="section-title" style={{ margin: 0 }}>Alternance</div>
            <button type="button" className={`btn btn-sm ${med.dateMode ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setMed(mi, 'dateMode', !med.dateMode)}>
              {med.dateMode ? '📅 Dates' : '🔢 Jours'}
            </button>
          </div>

          <div className="presc-phase-block">
            <div className="form-row">
              <div className="form-group">
                <label>Début</label>
                {med.dateMode ? (
                  <input type="date" value={med.recurrenceDateStart}
                    onChange={(e) => setMed(mi, 'recurrenceDateStart', e.target.value)} />
                ) : (
                  <input type="number" inputMode="numeric" min="1" value={med.recurrenceStart}
                    onChange={(e) => setMed(mi, 'recurrenceStart', parseInt(e.target.value) || 1)} />
                )}
              </div>
              <div className="form-group">
                <label>Fin</label>
                {med.dateMode ? (
                  <input type="date" value={med.recurrenceDateEnd} min={med.recurrenceDateStart}
                    onChange={(e) => setMed(mi, 'recurrenceDateEnd', e.target.value)} />
                ) : (
                  <input type="number" inputMode="numeric" min="1" value={med.recurrenceTotalDays}
                    onChange={(e) => setMed(mi, 'recurrenceTotalDays', parseInt(e.target.value) || 1)}
                    placeholder="durée (jours)" />
                )}
              </div>
            </div>
            {!med.dateMode && (
              <div style={{ fontSize: 'var(--font-xs)', color: 'var(--gray-400)', marginTop: -4 }}>
                Durée totale de la période (ex: 120 pour 4 mois)
              </div>
            )}

            <div className="form-group" style={{ marginTop: 8 }}>
              <label>Fréquence</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: 'var(--gray-500)', fontSize: 'var(--font-sm)', whiteSpace: 'nowrap' }}>1 jour sur</span>
                <input type="number" inputMode="numeric" min="2" value={med.recurrenceInterval} style={{ width: 72 }}
                  onChange={(e) => setMed(mi, 'recurrenceInterval', parseInt(e.target.value) || 2)} />
              </div>
            </div>

            <div className="stack stack-sm" style={{ marginTop: 8 }}>
              <label>Prises</label>
              {med.sharedTimes.map((time, ti) => (
                <div key={ti} className="presc-time-row">
                  <input type="time" value={time.time_of_day}
                    onChange={(e) => setSharedTime(mi, ti, 'time_of_day', e.target.value)} />
                  <div className="presc-time-qty">
                    <input type="text" value={time.quantity} placeholder="qté"
                      style={{ width: 60, textAlign: 'center' }}
                      onChange={(e) => setSharedTime(mi, ti, 'quantity', e.target.value)} />
                    <span className="presc-time-unit">{med.unit}</span>
                  </div>
                  {med.sharedTimes.length > 1 && (
                    <button type="button" className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--red-500)', padding: '4px 8px', minHeight: 'auto' }}
                      onClick={() => removeSharedTime(mi, ti)}>✕</button>
                  )}
                </div>
              ))}
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => addSharedTime(mi)}>+ Prise</button>
            </div>
          </div>
        </div>
      )}

      {med.phaseMode === 'days' && (
        <div className="stack stack-md">
          <div className="presc-section-header">
            <div className="section-title" style={{ margin: 0 }}>Jours</div>
            <button type="button" className={`btn btn-sm ${med.dayDateMode ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setMed(mi, 'dayDateMode', !med.dayDateMode)}>
              {med.dayDateMode ? '📅 Dates' : '🔢 Jours'}
            </button>
          </div>

          <div className="stack stack-sm">
            {med.selectedDays.map((d, di) => (
              <div key={di} className="presc-time-row">
                {med.dayDateMode ? (
                  <input type="date" value={d.date || startDate}
                    onChange={(e) => setDay(mi, di, { date: e.target.value })} />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                    <span style={{ color: 'var(--gray-500)', fontSize: 'var(--font-sm)', whiteSpace: 'nowrap' }}>Jour</span>
                    <input type="number" inputMode="numeric" min="1" value={d.relDay || 1} style={{ width: 80 }}
                      onChange={(e) => setDay(mi, di, { relDay: parseInt(e.target.value) || 1 })} />
                  </div>
                )}
                <button type="button" className="btn btn-ghost btn-sm"
                  style={{ color: 'var(--red-500)', padding: '4px 8px', minHeight: 'auto' }}
                  onClick={() => removeDay(mi, di)}>✕</button>
              </div>
            ))}
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => addDay(mi)}>+ Ajouter un jour</button>
          </div>

          <div className="stack stack-sm">
            <label>Prises (identiques pour tous les jours)</label>
            {med.sharedTimes.map((time, ti) => (
              <div key={ti} className="presc-time-row">
                <input type="time" value={time.time_of_day}
                  onChange={(e) => setSharedTime(mi, ti, 'time_of_day', e.target.value)} />
                <div className="presc-time-qty">
                  <input type="text" value={time.quantity} placeholder="qté"
                    style={{ width: 60, textAlign: 'center' }}
                    onChange={(e) => setSharedTime(mi, ti, 'quantity', e.target.value)} />
                  <span className="presc-time-unit">{med.unit}</span>
                </div>
                {med.sharedTimes.length > 1 && (
                  <button type="button" className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--red-500)', padding: '4px 8px', minHeight: 'auto' }}
                    onClick={() => removeSharedTime(mi, ti)}>✕</button>
                )}
              </div>
            ))}
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => addSharedTime(mi)}>+ Prise</button>
          </div>
        </div>
      )}
    </>
  )
}

// ── Main form ────────────────────────────────────────────────────────────────
export default function PrescriptionForm({ prescription, onClose }) {
  const { createPrescription, updatePrescription, medications } = useApp()
  const [name, setName] = useState(prescription?.name || '')
  const [startDate, setStartDate] = useState(prescription?.start_date || toLocalDate(new Date()))
  const [notes, setNotes] = useState(prescription?.notes || '')
  const [meds, setMeds] = useState(() =>
    prescription?.prescription_meds?.length
      ? prescription.prescription_meds.map((m) => initMed(m, prescription.start_date))
      : [newMed(prescription?.start_date || toLocalDate(new Date()))]
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [expandedMed, setExpandedMed] = useState(-1)

  function setMed(mi, key, val) {
    setMeds((prev) => prev.map((m, i) => i === mi ? { ...m, [key]: val } : m))
  }
  function setPhase(mi, pi, key, val) {
    setMeds((prev) => prev.map((m, i) => i !== mi ? m : {
      ...m, phases: m.phases.map((ph, j) => j === pi ? { ...ph, [key]: val } : ph),
    }))
  }
  function addPhase(mi) {
    const med = meds[mi]
    const last = med.phases[med.phases.length - 1]
    const nextStart = med.dateMode
      ? toLocalDate(addDays(parseISO(last.date_end), 1))
      : last.start_day + (last.duration_days || 7)
    const nextEnd = med.dateMode ? toLocalDate(addDays(parseISO(nextStart), 6)) : undefined
    setMeds((prev) => prev.map((m, i) => i !== mi ? m : {
      ...m, phases: [...m.phases, {
        start_day: med.dateMode ? dateToDay(startDate, nextStart) : nextStart,
        duration_days: 7, no_end: false,
        date_start: nextStart, date_end: nextEnd || '', times: [newTime()],
      }],
    }))
  }
  function removePhase(mi, pi) {
    setMeds((prev) => prev.map((m, i) => i !== mi ? m : { ...m, phases: m.phases.filter((_, j) => j !== pi) }))
  }
  function setTime(mi, pi, ti, key, val) {
    setMeds((prev) => prev.map((m, i) => i !== mi ? m : {
      ...m, phases: m.phases.map((ph, j) => j !== pi ? ph : {
        ...ph, times: ph.times.map((t, k) => k === ti ? { ...t, [key]: val } : t),
      }),
    }))
  }
  function addTime(mi, pi) {
    setMeds((prev) => prev.map((m, i) => i !== mi ? m : {
      ...m, phases: m.phases.map((ph, j) => j !== pi ? ph : { ...ph, times: [...ph.times, newTime()] }),
    }))
  }
  function removeTime(mi, pi, ti) {
    setMeds((prev) => prev.map((m, i) => i !== mi ? m : {
      ...m, phases: m.phases.map((ph, j) => j !== pi ? ph : { ...ph, times: ph.times.filter((_, k) => k !== ti) }),
    }))
  }
  function setSharedTime(mi, ti, key, val) {
    setMeds((prev) => prev.map((m, i) => i !== mi ? m : {
      ...m, sharedTimes: m.sharedTimes.map((t, k) => k === ti ? { ...t, [key]: val } : t),
    }))
  }
  function addSharedTime(mi) {
    setMeds((prev) => prev.map((m, i) => i !== mi ? m : { ...m, sharedTimes: [...m.sharedTimes, newTime()] }))
  }
  function removeSharedTime(mi, ti) {
    setMeds((prev) => prev.map((m, i) => i !== mi ? m : { ...m, sharedTimes: m.sharedTimes.filter((_, k) => k !== ti) }))
  }
  function setDay(mi, di, val) {
    setMeds((prev) => prev.map((m, i) => i !== mi ? m : {
      ...m, selectedDays: m.selectedDays.map((d, j) => j === di ? val : d),
    }))
  }
  function addDay(mi) {
    const med = meds[mi]
    const last = med.selectedDays[med.selectedDays.length - 1]
    const next = med.dayDateMode
      ? { date: last?.date ? toLocalDate(addDays(parseISO(last.date), 1)) : startDate }
      : { relDay: last ? (last.relDay || 1) + 1 : 1 }
    setMeds((prev) => prev.map((m, i) => i !== mi ? m : { ...m, selectedDays: [...m.selectedDays, next] }))
  }
  function removeDay(mi, di) {
    setMeds((prev) => prev.map((m, i) => i !== mi ? m : { ...m, selectedDays: m.selectedDays.filter((_, j) => j !== di) }))
  }

  function pickMed(mi, found) {
    setMeds((prev) => prev.map((m, i) => i !== mi ? m : {
      ...m, name: found.name, dosage: found.dosage || '', unit: found.unit, color: found.color, picked: true,
    }))
    setExpandedMed(mi)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const data = {
        name, start_date: startDate, notes,
        meds: meds.map((m) => ({ name: m.name, dosage: m.dosage, unit: m.unit, color: m.color, phases: buildPhasesFromMed(m, startDate) })),
      }
      if (prescription) await updatePrescription(prescription.id, data)
      else await createPrescription(data)
      onClose()
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-handle" />
        <h2 className="modal-title">{prescription ? "Modifier l'ordonnance" : 'Nouvelle ordonnance'}</h2>
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="stack stack-lg">
          <div className="stack stack-md">
            <div className="form-group">
              <label>Nom de l'ordonnance</label>
              <input type="text" placeholder="ex: Bronchite, Angine..."
                value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Date de début</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Notes (optionnel)</label>
              <textarea placeholder="Prescripteur, instructions..." value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>

          <div className="stack stack-md">
            <div className="presc-section-header">
              <div className="section-title" style={{ margin: 0 }}>Médicaments</div>
              <button type="button" className="btn btn-ghost btn-sm"
                onClick={() => { setMeds((p) => [...p, newMed(startDate)]); setExpandedMed(meds.length) }}>
                + Ajouter
              </button>
            </div>

            {meds.map((med, mi) => (
              <div key={mi} className="presc-med-block">
                {!med.picked ? (
                  /* ── Picker step ── */
                  <>
                    <div className="presc-med-header" style={{ cursor: 'default' }}>
                      <span className="presc-med-name" style={{ color: 'var(--gray-400)' }}>
                        Médicament {mi + 1}
                      </span>
                      {meds.length > 1 && (
                        <button type="button" className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--red-500)', padding: '4px 8px', minHeight: 'auto' }}
                          onClick={() => setMeds((p) => p.filter((_, i) => i !== mi))}>✕</button>
                      )}
                    </div>
                    <MedPickerInline
                      medications={medications}
                      onPick={(found) => pickMed(mi, found)}
                      onNew={() => { setMed(mi, 'picked', true); setExpandedMed(mi) }}
                    />
                  </>
                ) : (
                  /* ── Editing step ── */
                  <>
                    <button type="button" className="presc-med-header"
                      onClick={() => setExpandedMed(expandedMed === mi ? -1 : mi)}>
                      <div className="presc-med-color" style={{ background: med.color }} />
                      <span className="presc-med-name">{med.name || 'Nouveau médicament'}</span>
                      <button type="button" className="btn btn-ghost" tabIndex={-1}
                        style={{ fontSize: 'var(--font-xs)', padding: '2px 8px', minHeight: 'auto', color: 'var(--blue-500)' }}
                        onClick={(e) => { e.stopPropagation(); setMed(mi, 'picked', false) }}>
                        Changer
                      </button>
                      <span className="presc-med-chevron">{expandedMed === mi ? '▲' : '▼'}</span>
                    </button>

                    {expandedMed === mi && (
                      <div className="presc-med-body stack stack-md">
                        <div className="form-group">
                          <label>Nom</label>
                          <input type="text" placeholder="Amoxicilline, Ventoline..."
                            value={med.name} onChange={(e) => setMed(mi, 'name', e.target.value)} required />
                        </div>
                        <div className="form-row">
                          <div className="form-group">
                            <label>Concentration <span style={{ fontWeight: 400, color: 'var(--gray-400)' }}>(optionnel)</span></label>
                            <input type="text" placeholder="ex: 500mg..." value={med.dosage}
                              onChange={(e) => setMed(mi, 'dosage', e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>Unité</label>
                            <select value={med.unit} onChange={(e) => setMed(mi, 'unit', e.target.value)}>
                              {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                            </select>
                          </div>
                        </div>
                        <div className="form-group">
                          <label>Couleur</label>
                          <div className="color-grid">
                            {COLORS.map((c) => (
                              <button key={c} type="button" className={`color-dot ${med.color === c ? 'selected' : ''}`}
                                style={{ background: c }} onClick={() => setMed(mi, 'color', c)} />
                            ))}
                          </div>
                        </div>

                        <MedPhaseEditor
                          med={med} mi={mi} startDate={startDate}
                          setMed={setMed} setPhase={setPhase} addPhase={addPhase} removePhase={removePhase}
                          setTime={setTime} addTime={addTime} removeTime={removeTime}
                          setSharedTime={setSharedTime} addSharedTime={addSharedTime} removeSharedTime={removeSharedTime}
                          setDay={setDay} addDay={addDay} removeDay={removeDay}
                        />

                        {meds.length > 1 && (
                          <button type="button" className="btn btn-danger btn-sm"
                            onClick={() => { setMeds((p) => p.filter((_, i) => i !== mi)); setExpandedMed(Math.max(0, expandedMed - 1)) }}>
                            Supprimer ce médicament
                          </button>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="stack stack-sm">
            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={saving}>
              {saving ? 'Enregistrement...' : prescription ? 'Enregistrer' : "Créer l'ordonnance"}
            </button>
            <button type="button" className="btn btn-ghost btn-full" onClick={onClose}>Annuler</button>
          </div>
        </form>
      </div>
    </div>
  )
}
