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
    <div className="med-row">
      <div className="med-row-color" style={{ background: medication.color }} />

      <div className="med-row-info">
        <span className="med-row-name">{medication.name}</span>
        <span className="med-row-unit">{medication.unit}</span>
        {medication.notes && <span className="med-row-notes">{medication.notes}</span>}
      </div>

      {medication.stock_count != null && (
        <span className={`badge ${medication.stock_count <= 0 ? 'badge-red' : medication.stock_count <= 5 ? 'badge-red' : 'badge-gray'}`}>
          {medication.stock_count <= 0 ? '⚠️ Rupture' : `${medication.stock_count}`}
        </span>
      )}

      <button className="med-row-take" onClick={() => { setShowTake(!showTake); setTakeTime(nowTime()); setTakeError(null) }}
        title="Prendre maintenant">+</button>

      <button className="btn btn-icon btn-sm" onClick={onEdit} title="Modifier">✏️</button>
      <button className="btn btn-icon btn-sm" style={{ color: 'var(--red-400)' }}
        onClick={() => setConfirmDelete(true)} title="Supprimer">🗑️</button>

      {showTake && (
        <div className="med-row-panel">
          <span className="med-row-panel-label">Heure de prise</span>
          <input type="time" value={takeTime} onChange={(e) => setTakeTime(e.target.value)} />
          {takeError && <span className="med-row-error">{takeError}</span>}
          <div className="row row-gap-sm">
            <button className="btn btn-success btn-sm" onClick={handleTake} disabled={taking}>
              {taking ? '...' : 'Confirmer'}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowTake(false)}>Annuler</button>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="med-row-panel med-row-panel--danger">
          <span>Supprimer <strong>{medication.name}</strong> ?</span>
          <div className="row row-gap-sm">
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
