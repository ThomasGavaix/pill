import { useState } from 'react'
import { useApp } from '../../contexts/AppContext'
import './MedicationCard.css'

const DAYS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

export default function MedicationCard({ medication, schedules, onEdit, onAddSchedule }) {
  const { deleteMedication, deleteSchedule } = useApp()
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
          <div className="med-dosage">{medication.dosage} {medication.unit}</div>
          {medication.notes && (
            <div className="med-notes">{medication.notes}</div>
          )}
        </div>
        <div className="med-actions-top">
          <button className="btn btn-icon btn-sm" onClick={onEdit} title="Modifier">✏️</button>
          <button
            className="btn btn-icon btn-sm"
            style={{ color: 'var(--red-500)' }}
            onClick={() => setConfirmDelete(true)}
            title="Supprimer"
          >
            🗑️
          </button>
        </div>
      </div>

      {schedules.length > 0 && (
        <div className="med-schedules">
          <div className="section-title">Horaires</div>
          {schedules.map((s) => (
            <div key={s.id} className="schedule-item">
              <span className="schedule-time">⏰ {s.time_of_day}</span>
              <span className="schedule-days">
                {s.days_of_week.length === 7
                  ? 'Tous les jours'
                  : s.days_of_week.map((d) => DAYS_FR[d]).join(', ')}
              </span>
              <button
                className="btn btn-icon btn-sm"
                style={{ fontSize: '0.75rem' }}
                onClick={() => deleteSchedule(s.id)}
                title="Supprimer cet horaire"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <button className="btn btn-ghost btn-sm" onClick={onAddSchedule} style={{ marginTop: 12 }}>
        + Ajouter un horaire
      </button>

      {confirmDelete && (
        <div className="med-confirm">
          <p>Supprimer <strong>{medication.name}</strong> ?</p>
          <div className="row row-gap-sm" style={{ marginTop: 12 }}>
            <button
              className="btn btn-danger btn-sm"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? '...' : 'Supprimer'}
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setConfirmDelete(false)}
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
