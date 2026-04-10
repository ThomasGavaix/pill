import { useState } from 'react'
import { addDays, parseISO, differenceInDays, format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useApp } from '../../contexts/AppContext'
import {
  newTime, toLocalDate, dayToDate, dateToDay,
  newMed, buildPhasesFromMed, MedPhaseEditor,
} from '../prescriptions/PrescriptionForm'
import '../prescriptions/PrescriptionForm.css'
import './AddToPrescriptionModal.css'

function prescStatus(presc) {
  const today = new Date()
  const start = parseISO(presc.start_date)
  const isPermanent = (presc.prescription_meds || []).some((m) =>
    (m.prescription_phases || []).some((ph) => ph.duration_days == null)
  )
  if (isPermanent) return { label: 'Permanent', cls: 'badge-blue' }
  const maxDay = Math.max(...(presc.prescription_meds || []).flatMap((m) =>
    (m.prescription_phases || []).map((ph) => ph.start_day + (ph.duration_days || 1) - 1)
  ), 1)
  const end = addDays(start, maxDay - 1)
  if (today < start) return { label: 'À venir', cls: 'badge-blue' }
  if (today > end) return { label: 'Terminée', cls: 'badge-gray' }
  return { label: 'En cours', cls: 'badge-green' }
}

export default function AddToPrescriptionModal({ medication, onClose }) {
  const { prescriptions, createPrescription, addMedToPrescription } = useApp()

  // Prescription selection
  const [prescMode, setPrescMode] = useState(prescriptions.length > 0 ? 'existing' : 'new')
  const [selectedPrescId, setSelectedPrescId] = useState(prescriptions[0]?.id || null)
  const [newPrescName, setNewPrescName] = useState('')
  const [manualStartDate, setManualStartDate] = useState(toLocalDate(new Date()))

  const startDate = prescMode === 'existing'
    ? prescriptions.find((p) => p.id === selectedPrescId)?.start_date || toLocalDate(new Date())
    : manualStartDate

  // Med phase state (single medication)
  const baseMed = newMed(startDate)
  const [med, setMedState] = useState({
    ...baseMed,
    name: medication.name,
    dosage: medication.dosage || '',
    unit: medication.unit,
    color: medication.color,
    picked: true,
    dateMode: true,
    dayDateMode: true,
    phases: [{
      start_day: 1, duration_days: 7, no_end: false,
      date_start: startDate,
      date_end: toLocalDate(addDays(parseISO(startDate), 6)),
      times: [newTime()],
    }],
  })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Proxy setters to match MedPhaseEditor's (mi, key, val) API
  function setMed(_, key, val) { setMedState((m) => ({ ...m, [key]: val })) }
  function setPhase(_, pi, key, val) {
    setMedState((m) => ({ ...m, phases: m.phases.map((ph, j) => j === pi ? { ...ph, [key]: val } : ph) }))
  }
  function addPhase(_) {
    const last = med.phases[med.phases.length - 1]
    const nextStart = med.dateMode
      ? toLocalDate(addDays(parseISO(last.date_end), 1))
      : last.start_day + (last.duration_days || 7)
    const nextEnd = med.dateMode ? toLocalDate(addDays(parseISO(nextStart), 6)) : undefined
    setMedState((m) => ({
      ...m, phases: [...m.phases, {
        start_day: med.dateMode ? dateToDay(startDate, nextStart) : nextStart,
        duration_days: 7, no_end: false,
        date_start: nextStart, date_end: nextEnd || '', times: [newTime()],
      }],
    }))
  }
  function removePhase(_, pi) {
    setMedState((m) => ({ ...m, phases: m.phases.filter((_, j) => j !== pi) }))
  }
  function setTime(_, pi, ti, key, val) {
    setMedState((m) => ({
      ...m, phases: m.phases.map((ph, j) => j !== pi ? ph : {
        ...ph, times: ph.times.map((t, k) => k === ti ? { ...t, [key]: val } : t),
      }),
    }))
  }
  function addTime(_, pi) {
    setMedState((m) => ({
      ...m, phases: m.phases.map((ph, j) => j !== pi ? ph : { ...ph, times: [...ph.times, newTime()] }),
    }))
  }
  function removeTime(_, pi, ti) {
    setMedState((m) => ({
      ...m, phases: m.phases.map((ph, j) => j !== pi ? ph : { ...ph, times: ph.times.filter((_, k) => k !== ti) }),
    }))
  }
  function setSharedTime(_, ti, key, val) {
    setMedState((m) => ({ ...m, sharedTimes: m.sharedTimes.map((t, k) => k === ti ? { ...t, [key]: val } : t) }))
  }
  function addSharedTime(_) {
    setMedState((m) => ({ ...m, sharedTimes: [...m.sharedTimes, newTime()] }))
  }
  function removeSharedTime(_, ti) {
    setMedState((m) => ({ ...m, sharedTimes: m.sharedTimes.filter((_, k) => k !== ti) }))
  }
  function setDay(_, di, val) {
    setMedState((m) => ({ ...m, selectedDays: m.selectedDays.map((d, j) => j === di ? val : d) }))
  }
  function addDay(_) {
    const last = med.selectedDays[med.selectedDays.length - 1]
    const next = med.dayDateMode
      ? { date: last?.date ? toLocalDate(addDays(parseISO(last.date), 1)) : startDate }
      : { relDay: last ? (last.relDay || 1) + 1 : 1 }
    setMedState((m) => ({ ...m, selectedDays: [...m.selectedDays, next] }))
  }
  function removeDay(_, di) {
    setMedState((m) => ({ ...m, selectedDays: m.selectedDays.filter((_, j) => j !== di) }))
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const medData = {
        name: medication.name, dosage: medication.dosage, unit: medication.unit, color: medication.color,
        phases: buildPhasesFromMed(med, startDate),
      }
      if (prescMode === 'existing') {
        await addMedToPrescription(selectedPrescId, medData)
      } else {
        await createPrescription({
          name: newPrescName, start_date: manualStartDate, notes: '',
          meds: [medData],
        })
      }
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
        <h2 className="modal-title">Planifier dans une ordonnance</h2>
        <div className="atp-med-badge">
          <span className="atp-med-color" style={{ background: medication.color }} />
          <span className="atp-med-name">{medication.name}{medication.dosage ? ` ${medication.dosage}` : ''}</span>
          <span className="atp-med-unit">{medication.unit}</span>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="stack stack-lg">
          {/* ── Prescription picker ── */}
          <div className="stack stack-md">
            <div className="presc-mode-toggle">
              {prescriptions.length > 0 && (
                <button type="button"
                  className={`presc-mode-btn ${prescMode === 'existing' ? 'presc-mode-btn--active' : ''}`}
                  onClick={() => setPrescMode('existing')}>
                  Ordonnance existante
                </button>
              )}
              <button type="button"
                className={`presc-mode-btn ${prescMode === 'new' ? 'presc-mode-btn--active' : ''}`}
                onClick={() => setPrescMode('new')}>
                Nouvelle ordonnance
              </button>
            </div>

            {prescMode === 'existing' && (
              <div className="atp-presc-list">
                {prescriptions.map((p) => {
                  const st = prescStatus(p)
                  return (
                    <button key={p.id} type="button"
                      className={`atp-presc-row ${selectedPrescId === p.id ? 'atp-presc-row--selected' : ''}`}
                      onClick={() => setSelectedPrescId(p.id)}>
                      <div className="atp-presc-info">
                        <span className="atp-presc-name">{p.name}</span>
                        <span className="atp-presc-date">
                          {format(parseISO(p.start_date), 'd MMM yyyy', { locale: fr })}
                          {' · '}{p.prescription_meds?.length || 0} médicament{(p.prescription_meds?.length || 0) > 1 ? 's' : ''}
                        </span>
                      </div>
                      <span className={`badge ${st.cls}`}>{st.label}</span>
                      {selectedPrescId === p.id && <span className="atp-check">✓</span>}
                    </button>
                  )
                })}
              </div>
            )}

            {prescMode === 'new' && (
              <div className="stack stack-sm">
                <div className="form-group">
                  <label>Nom de l'ordonnance</label>
                  <input type="text" placeholder="ex: Bronchite, Angine..."
                    value={newPrescName} onChange={(e) => setNewPrescName(e.target.value)}
                    autoFocus />
                </div>
                <div className="form-group">
                  <label>Date de début</label>
                  <input type="date" value={manualStartDate}
                    onChange={(e) => setManualStartDate(e.target.value)} />
                </div>
              </div>
            )}
          </div>

          {/* ── Phase editor ── */}
          <MedPhaseEditor
            med={med} mi={0} startDate={startDate}
            setMed={setMed} setPhase={setPhase} addPhase={addPhase} removePhase={removePhase}
            setTime={setTime} addTime={addTime} removeTime={removeTime}
            setSharedTime={setSharedTime} addSharedTime={addSharedTime} removeSharedTime={removeSharedTime}
            setDay={setDay} addDay={addDay} removeDay={removeDay}
          />

          <div className="stack stack-sm">
            <button className="btn btn-primary btn-full btn-lg" onClick={handleSave} disabled={saving ||
              (prescMode === 'existing' && !selectedPrescId) ||
              (prescMode === 'new' && !newPrescName)}>
              {saving ? 'Enregistrement...' : 'Planifier'}
            </button>
            <button className="btn btn-ghost btn-full" onClick={onClose}>Annuler</button>
          </div>
        </div>
      </div>
    </div>
  )
}
