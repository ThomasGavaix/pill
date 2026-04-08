import { useState } from 'react'
import { useApp } from '../../contexts/AppContext'
import './MedicationCard.css'

function nowTime() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default function MedicationCard({ medication, onEdit }) {
  const { deleteMedication, logAdHocDose } = useApp()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showTake, setShowTake] = useState(false)
  const [takeTime, setTakeTime] = useState(nowTime)
  const [taking, setTaking] = useState(false)
  const [takeError, setTakeError] = useState(null)

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteMedication(medication.id)
    } catch (err) {
      console.error(err)
      setDeleting(false)
    }
  }

  async function handleTake() {
    setTaking(true)
    setTakeError(null)
    try {
      await logAdHocDose(medication.id, takeTime)
      setShowTake(false)
    } catch (err) {
      setTakeError(err.message)
    } finally {
      setTaking(false)
    }
  }

  return (
    <div className="med-card card">
      <div className="med-card-header">
        <div className="med-color-bar" style={{ background: medication.color }} />
        <div className="med-info">
          <div className="med-name">{medication.name}</div>
          <div className="med-dosage">{medication.unit}</div>
          {medication.notes && <div className="med-notes">{medication.notes}</div>}
        </div>
        <div className="med-stock-badge">
          {medication.stock_count != null ? (
            <span className={`badge ${medication.stock_count <= 5 ? 'badge-red' : 'badge-gray'}`}>
              {medication.stock_count <= 0 ? '⚠️ Rupture' : `Stock : ${medication.stock_count}`}
            </span>
          ) : null}
        </div>
        <div className="med-actions-top">
          <button className="btn btn-icon btn-sm" onClick={onEdit} title="Modifier">✏️</button>
          <button className="btn btn-icon btn-sm" style={{ color: 'var(--red-500)' }}
            onClick={() => setConfirmDelete(true)} title="Supprimer">🗑️</button>
        </div>
      </div>

      <button className="btn btn-success btn-full" style={{ marginTop: 8 }}
        onClick={() => { setShowTake(true); setTakeTime(nowTime()); setTakeError(null) }}>
        + Prendre maintenant
      </button>

      {showTake && (
        <div className="med-confirm">
          <p>Heure de prise — <strong>{medication.name}</strong></p>
          <input type="time" value={takeTime} onChange={(e) => setTakeTime(e.target.value)}
            style={{ marginTop: 8, marginBottom: 8 }} />
          {takeError && <div className="alert alert-error" style={{ marginBottom: 8 }}>{takeError}</div>}
          <div className="row row-gap-sm">
            <button className="btn btn-success btn-sm" onClick={handleTake} disabled={taking}>
              {taking ? '...' : 'Confirmer'}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowTake(false)}>Annuler</button>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="med-confirm">
          <p>Supprimer <strong>{medication.name}</strong> ?</p>
          <div className="row row-gap-sm" style={{ marginTop: 12 }}>
            <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={deleting}>
              {deleting ? '...' : 'Supprimer'}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setConfirmDelete(false)}>Annuler</button>
          </div>
        </div>
      )}
    </div>
  )
}
