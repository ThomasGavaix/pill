import { useState } from 'react'
import { useApp } from '../../contexts/AppContext'
import AddToPrescriptionModal from './AddToPrescriptionModal'
import './MedicationCard.css'

function nowTime() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default function MedicationCard({ medication, onEdit }) {
  const { deleteMedication, logAdHocDose } = useApp()
  const [sheet, setSheet] = useState(null) // null | 'actions' | 'take' | 'delete'
  const [showPrescribeModal, setShowPrescribeModal] = useState(false)
  const [takeTime, setTakeTime] = useState(nowTime)
  const [taking, setTaking] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState(null)

  function openSheet(s) {
    setError(null)
    setTakeTime(nowTime())
    setSheet(s)
  }

  async function handleTake() {
    setTaking(true)
    setError(null)
    try {
      await logAdHocDose(medication.id, takeTime)
      setSheet(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setTaking(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteMedication(medication.id)
    } catch (err) {
      setError(err.message)
      setDeleting(false)
    }
  }

  return (
    <>
      <button className="med-row" onClick={() => openSheet('actions')}>
        <div className="med-row-color" style={{ background: medication.color }} />
        <div className="med-row-info">
          <span className="med-row-name">{medication.name}</span>
          <span className="med-row-unit">{medication.unit}</span>
        </div>
        {medication.stock_count != null && (
          <span className={`badge ${medication.stock_count <= 5 ? 'badge-red' : 'badge-gray'} med-row-stock`}>
            {medication.stock_count <= 0 ? '⚠️ Rupture' : medication.stock_count}
          </span>
        )}
        {medication.notes && <span className="med-row-notes-dot" title={medication.notes}>ℹ️</span>}
        <span className="med-row-chevron">›</span>
      </button>

      {/* Action sheet overlay */}
      {sheet && (
        <div className="action-sheet-overlay" onClick={() => setSheet(null)}>
          <div className="action-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="action-sheet-title">{medication.name}</div>

            {sheet === 'actions' && (
              <>
                <button className="action-sheet-btn action-sheet-btn--primary"
                  onClick={() => openSheet('take')}>
                  + Prendre maintenant
                </button>
                <button className="action-sheet-btn"
                  onClick={() => { setSheet(null); setShowPrescribeModal(true) }}>
                  📋 Planifier dans une ordonnance
                </button>
                <button className="action-sheet-btn" onClick={() => { setSheet(null); onEdit() }}>
                  ✏️ Modifier
                </button>
                <button className="action-sheet-btn action-sheet-btn--danger"
                  onClick={() => openSheet('delete')}>
                  🗑️ Supprimer
                </button>
              </>
            )}

            {sheet === 'take' && (
              <>
                <div className="action-sheet-time-picker">
                  <label>Heure de prise</label>
                  <input type="time" value={takeTime} onChange={(e) => setTakeTime(e.target.value)} />
                </div>
                {error && <div className="alert alert-error">{error}</div>}
                <button className="action-sheet-btn action-sheet-btn--primary"
                  onClick={handleTake} disabled={taking}>
                  {taking ? 'Enregistrement...' : 'Confirmer'}
                </button>
                <button className="action-sheet-btn" onClick={() => openSheet('actions')}>Retour</button>
              </>
            )}

            {sheet === 'delete' && (
              <>
                <p className="action-sheet-message">
                  Supprimer <strong>{medication.name}</strong> définitivement ?
                </p>
                <button className="action-sheet-btn action-sheet-btn--danger"
                  onClick={handleDelete} disabled={deleting}>
                  {deleting ? '...' : 'Supprimer'}
                </button>
                <button className="action-sheet-btn" onClick={() => openSheet('actions')}>Annuler</button>
              </>
            )}

            <button className="action-sheet-cancel" onClick={() => setSheet(null)}>Fermer</button>
          </div>
        </div>
      )}
      {showPrescribeModal && (
        <AddToPrescriptionModal
          medication={medication}
          onClose={() => setShowPrescribeModal(false)}
        />
      )}
    </>
  )
}
