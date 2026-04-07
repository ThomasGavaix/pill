import { useState } from 'react'
import { useApp } from '../../contexts/AppContext'
import './MedicationCard.css'

export default function MedicationCard({ medication, onEdit }) {
  const { deleteMedication } = useApp()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteMedication(medication.id)
    } catch (err) {
      console.error(err)
      setDeleting(false)
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
