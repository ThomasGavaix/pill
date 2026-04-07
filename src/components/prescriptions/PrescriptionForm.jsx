import { useState } from 'react'
import { useApp } from '../../contexts/AppContext'
import './PrescriptionForm.css'

const COLORS = ['#2563eb', '#7c3aed', '#db2777', '#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#0891b2']
const UNITS = ['comprimé(s)', 'gélule(s)', 'ml', 'gouttes', 'bouffée(s)', 'sachet(s)', 'patch(s)', 'autre']

function newTime() { return { time_of_day: '08:00', quantity: '1' } }
function newPhase() { return { start_day: 1, duration_days: 7, times: [newTime()] } }
function newMed(base = {}) {
  return { name: '', dosage: '1', unit: 'comprimé(s)', color: '#2563eb', phases: [newPhase()], ...base }
}

export default function PrescriptionForm({ prescription, onClose }) {
  const { createPrescription, updatePrescription, medications } = useApp()

  const [name, setName] = useState(prescription?.name || '')
  const [startDate, setStartDate] = useState(
    prescription?.start_date || new Date().toISOString().split('T')[0]
  )
  const [notes, setNotes] = useState(prescription?.notes || '')
  const [meds, setMeds] = useState(() => {
    if (prescription?.prescription_meds?.length) {
      return prescription.prescription_meds.map((m) => ({
        name: m.name, dosage: m.dosage, unit: m.unit, color: m.color,
        phases: (m.prescription_phases || []).map((ph) => ({
          start_day: ph.start_day, duration_days: ph.duration_days,
          times: (ph.prescription_times || []).map((t) => ({ time_of_day: t.time_of_day, quantity: t.quantity })),
        })),
      }))
    }
    return [newMed()]
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [expandedMed, setExpandedMed] = useState(0)

  // ── Med helpers ──────────────────────────────────────────────────────────
  function setMed(mi, key, val) {
    setMeds((prev) => prev.map((m, i) => i === mi ? { ...m, [key]: val } : m))
  }

  function pickExistingMed(mi, medId) {
    const found = medications.find((m) => m.id === medId)
    if (!found) return
    setMeds((prev) => prev.map((m, i) => i !== mi ? m : {
      ...m,
      name: found.name,
      dosage: found.dosage,
      unit: found.unit,
      color: found.color,
    }))
  }

  function addMed() {
    setMeds((prev) => [...prev, newMed()])
    setExpandedMed(meds.length)
  }
  function removeMed(mi) {
    setMeds((prev) => prev.filter((_, i) => i !== mi))
    setExpandedMed(Math.max(0, expandedMed - 1))
  }

  // ── Phase helpers ────────────────────────────────────────────────────────
  function setPhase(mi, pi, key, val) {
    setMeds((prev) => prev.map((m, i) => i !== mi ? m : {
      ...m,
      phases: m.phases.map((ph, j) => j === pi ? { ...ph, [key]: val } : ph),
    }))
  }
  function addPhase(mi) {
    const lastPhase = meds[mi].phases[meds[mi].phases.length - 1]
    const nextStart = lastPhase.start_day + lastPhase.duration_days
    setMeds((prev) => prev.map((m, i) => i !== mi ? m : {
      ...m, phases: [...m.phases, { ...newPhase(), start_day: nextStart }],
    }))
  }
  function removePhase(mi, pi) {
    setMeds((prev) => prev.map((m, i) => i !== mi ? m : {
      ...m, phases: m.phases.filter((_, j) => j !== pi),
    }))
  }

  // ── Time helpers ─────────────────────────────────────────────────────────
  function setTime(mi, pi, ti, key, val) {
    setMeds((prev) => prev.map((m, i) => i !== mi ? m : {
      ...m,
      phases: m.phases.map((ph, j) => j !== pi ? ph : {
        ...ph, times: ph.times.map((t, k) => k === ti ? { ...t, [key]: val } : t),
      }),
    }))
  }
  function addTime(mi, pi) {
    setMeds((prev) => prev.map((m, i) => i !== mi ? m : {
      ...m,
      phases: m.phases.map((ph, j) => j !== pi ? ph : {
        ...ph, times: [...ph.times, newTime()],
      }),
    }))
  }
  function removeTime(mi, pi, ti) {
    setMeds((prev) => prev.map((m, i) => i !== mi ? m : {
      ...m,
      phases: m.phases.map((ph, j) => j !== pi ? ph : {
        ...ph, times: ph.times.filter((_, k) => k !== ti),
      }),
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const data = { name, start_date: startDate, notes, meds }
      if (prescription) {
        await updatePrescription(prescription.id, data)
      } else {
        await createPrescription(data)
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
        <h2 className="modal-title">{prescription ? "Modifier l'ordonnance" : 'Nouvelle ordonnance'}</h2>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="stack stack-lg">

          {/* Ordonnance info */}
          <div className="stack stack-md">
            <div className="form-group">
              <label htmlFor="presc-name">Nom de l'ordonnance</label>
              <input id="presc-name" type="text" placeholder="ex: Bronchite, Angine..."
                value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
            </div>
            <div className="form-group">
              <label htmlFor="presc-date">Date de début</label>
              <input id="presc-date" type="date" value={startDate}
                onChange={(e) => setStartDate(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="presc-notes">Notes (optionnel)</label>
              <textarea id="presc-notes" placeholder="Prescripteur, instructions..."
                value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>

          {/* Medications */}
          <div className="stack stack-md">
            <div className="presc-section-header">
              <div className="section-title" style={{ margin: 0 }}>Médicaments</div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={addMed}>+ Ajouter</button>
            </div>

            {meds.map((med, mi) => (
              <div key={mi} className="presc-med-block">
                {/* Med header */}
                <button type="button" className="presc-med-header"
                  onClick={() => setExpandedMed(expandedMed === mi ? -1 : mi)}>
                  <div className="presc-med-color" style={{ background: med.color }} />
                  <span className="presc-med-name">{med.name || 'Médicament ' + (mi + 1)}</span>
                  <span className="presc-med-chevron">{expandedMed === mi ? '▲' : '▼'}</span>
                </button>

                {expandedMed === mi && (
                  <div className="presc-med-body stack stack-md">

                    {/* Pick from existing medications */}
                    {medications.length > 0 && (
                      <div className="form-group">
                        <label>Choisir depuis mes médicaments</label>
                        <select onChange={(e) => pickExistingMed(mi, e.target.value)}
                          defaultValue="">
                          <option value="" disabled>Sélectionner un médicament...</option>
                          {medications.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} — {m.dosage} {m.unit}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="presc-divider" />

                    {/* Med fields */}
                    <div className="form-group">
                      <label>Nom</label>
                      <input type="text" placeholder="Amoxicilline, Ventoline..."
                        value={med.name} onChange={(e) => setMed(mi, 'name', e.target.value)} required />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Dosage</label>
                        <input type="text" placeholder="1, 500mg..." value={med.dosage}
                          onChange={(e) => setMed(mi, 'dosage', e.target.value)} required />
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
                          <button key={c} type="button"
                            className={`color-dot ${med.color === c ? 'selected' : ''}`}
                            style={{ background: c }} onClick={() => setMed(mi, 'color', c)} />
                        ))}
                      </div>
                    </div>

                    {/* Phases */}
                    <div className="stack stack-md">
                      <div className="presc-section-header">
                        <div className="section-title" style={{ margin: 0 }}>Phases</div>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => addPhase(mi)}>
                          + Phase
                        </button>
                      </div>

                      {med.phases.map((phase, pi) => (
                        <div key={pi} className="presc-phase-block">
                          <div className="presc-phase-header">
                            <span className="presc-phase-label">Phase {pi + 1}</span>
                            {med.phases.length > 1 && (
                              <button type="button" className="btn btn-ghost btn-sm"
                                style={{ color: 'var(--red-500)', padding: '4px 8px', minHeight: 'auto' }}
                                onClick={() => removePhase(mi, pi)}>✕</button>
                            )}
                          </div>

                          <div className="form-row">
                            <div className="form-group">
                              <label>Début (jour)</label>
                              <input type="number" min="1" value={phase.start_day}
                                onChange={(e) => setPhase(mi, pi, 'start_day', parseInt(e.target.value) || 1)} />
                            </div>
                            <div className="form-group">
                              <label>Durée (jours)</label>
                              <input type="number" min="1" value={phase.duration_days}
                                onChange={(e) => setPhase(mi, pi, 'duration_days', parseInt(e.target.value) || 1)} />
                            </div>
                          </div>

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
                            <button type="button" className="btn btn-ghost btn-sm"
                              onClick={() => addTime(mi, pi)}>+ Prise</button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {meds.length > 1 && (
                      <button type="button" className="btn btn-danger btn-sm"
                        onClick={() => removeMed(mi)}>Supprimer ce médicament</button>
                    )}
                  </div>
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
