import { useState } from 'react'
import { differenceInDays, parseISO, addDays, format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useApp } from '../contexts/AppContext'
import PrescriptionForm from '../components/prescriptions/PrescriptionForm'
import './Prescriptions.css'

function getPeriodInfo(time) {
  if (time >= '06:00' && time <= '11:59') return { label: 'le matin', order: 0 }
  if (time >= '12:00' && time <= '13:59') return { label: 'à midi', order: 1 }
  if (time >= '14:00' && time <= '20:59') return { label: 'le soir', order: 2 }
  return { label: 'la nuit', order: 3 }
}

function joinFr(items) {
  if (items.length === 1) return items[0]
  return items.slice(0, -1).join(', ') + ' et ' + items[items.length - 1]
}

function formatPhase(phase, unit) {
  const times = phase.prescription_times || []
  if (!times.length) return null
  const byQty = {}
  for (const t of times) {
    if (!byQty[t.quantity]) byQty[t.quantity] = []
    byQty[t.quantity].push(t.time_of_day)
  }
  return Object.entries(byQty).map(([qty, arr]) => {
    const periods = arr.map(getPeriodInfo).sort((a, b) => a.order - b.order).map((p) => p.label)
    return `${qty} ${unit} ${joinFr(periods)}`
  }).join(' · ')
}

function formatMedPosology(med) {
  const phases = med.prescription_phases || []
  if (!phases.length) return []
  return phases.map((phase) => {
    const line = formatPhase(phase, med.unit)
    if (!line) return null
    if (phases.length === 1) return line
    const range = phase.duration_days == null
      ? `À partir de J${phase.start_day}`
      : `J${phase.start_day}–J${phase.start_day + phase.duration_days - 1}`
    return `${range} : ${line}`
  }).filter(Boolean)
}

function prescriptionStatus(presc) {
  const today = new Date()
  const start = parseISO(presc.start_date)

  const isPermanent = (presc.prescription_meds || []).some((m) =>
    (m.prescription_phases || []).some((ph) => ph.duration_days == null)
  )
  if (isPermanent) {
    if (today < start) return { label: 'À venir', cls: 'badge-blue', end: null }
    return { label: 'Permanent', cls: 'badge-blue', end: null }
  }

  const maxDay = Math.max(...(presc.prescription_meds || []).flatMap((m) =>
    (m.prescription_phases || []).map((ph) => ph.start_day + ph.duration_days - 1)
  ), 1)
  const end = addDays(start, maxDay - 1)
  if (today < start) return { label: 'À venir', cls: 'badge-blue', end }
  if (today > end) return { label: 'Terminée', cls: 'badge-gray', end }
  const dayNum = differenceInDays(today, start) + 1
  return { label: `Jour ${dayNum}/${maxDay}`, cls: 'badge-green', end }
}

export default function Prescriptions() {
  const { activeProfile, prescriptions, deletePrescription, duplicatePrescription, loading } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [duplicating, setDuplicating] = useState(null)
  const [dupDate, setDupDate] = useState(new Date().toISOString().split('T')[0])
  const [confirmDelete, setConfirmDelete] = useState(null)

  if (!activeProfile) {
    return (
      <div className="page">
        <div className="empty-state">
          <div className="empty-state-icon">👨‍👩‍👧</div>
          <div className="empty-state-title">Aucun profil sélectionné</div>
          <div className="empty-state-text">Créez un profil dans l'onglet Famille.</div>
        </div>
      </div>
    )
  }

  if (loading) return <div className="loading-page"><div className="spinner" />Chargement...</div>

  async function handleDuplicate() {
    await duplicatePrescription(duplicating, dupDate)
    setDuplicating(null)
  }

  async function handleDelete(id) {
    await deletePrescription(id)
    setConfirmDelete(null)
  }

  return (
    <div className="page">
      <div className="row row-between" style={{ marginBottom: 20 }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Ordonnances</h1>
        <button className="btn btn-primary btn-sm" onClick={() => { setEditing(null); setShowForm(true) }}>
          + Nouvelle
        </button>
      </div>

      {prescriptions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-title">Aucune ordonnance</div>
          <div className="empty-state-text">Créez une ordonnance pour suivre un traitement temporaire.</div>
          <button className="btn btn-primary btn-lg" onClick={() => { setEditing(null); setShowForm(true) }}>
            + Nouvelle ordonnance
          </button>
        </div>
      ) : (
        <div className="stack stack-md">
          {prescriptions.map((presc) => {
            const status = prescriptionStatus(presc)
            return (
              <div key={presc.id} className="card presc-card">
                <div className="presc-card-header">
                  <div>
                    <div className="presc-card-name">{presc.name}</div>
                    <div className="presc-card-date">
                      Début : {format(parseISO(presc.start_date), 'd MMMM yyyy', { locale: fr })}
                      {status.end && <>{' · '}Fin : {format(status.end, 'd MMMM yyyy', { locale: fr })}</>}
                    </div>
                  </div>
                  <span className={`badge ${status.cls}`}>{status.label}</span>
                </div>

                {/* Medications summary */}
                <div className="presc-meds-list">
                  {presc.prescription_meds.map((med) => (
                    <div key={med.id} className="presc-med-summary">
                      <span className="presc-med-dot" style={{ background: med.color }} />
                      <div className="presc-med-summary-body">
                        <span className="presc-med-summary-name">
                          {med.name}{med.dosage ? ` ${med.dosage}` : ''}
                        </span>
                        {formatMedPosology(med).map((line, i) => (
                          <span key={i} className="presc-med-posology-line">{line}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {presc.notes && (
                  <div className="presc-notes">{presc.notes}</div>
                )}

                <div className="presc-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(presc); setShowForm(true) }}>
                    ✏️ Modifier
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setDuplicating(presc)}>
                    📋 Dupliquer
                  </button>
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red-500)' }}
                    onClick={() => setConfirmDelete(presc)}>
                    🗑️
                  </button>
                </div>

                {confirmDelete?.id === presc.id && (
                  <div className="med-confirm">
                    <p>Supprimer <strong>{presc.name}</strong> ?</p>
                    <div className="row row-gap-sm" style={{ marginTop: 12 }}>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(presc.id)}>Supprimer</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setConfirmDelete(null)}>Annuler</button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Duplicate modal */}
      {duplicating && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setDuplicating(null)}>
          <div className="modal">
            <div className="modal-handle" />
            <h2 className="modal-title">Dupliquer « {duplicating.name} »</h2>
            <div className="form-group" style={{ marginBottom: 24 }}>
              <label htmlFor="dup-date">Nouvelle date de début</label>
              <input id="dup-date" type="date" value={dupDate} onChange={(e) => setDupDate(e.target.value)} />
            </div>
            <div className="stack stack-sm">
              <button className="btn btn-primary btn-full btn-lg" onClick={handleDuplicate}>
                Créer une copie
              </button>
              <button className="btn btn-ghost btn-full" onClick={() => setDuplicating(null)}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <PrescriptionForm prescription={editing} onClose={() => setShowForm(false)} />
      )}
    </div>
  )
}
