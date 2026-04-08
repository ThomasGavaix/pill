import './DoseCard.css'

const STATUS_CONFIG = {
  pending: { label: 'À prendre', className: 'dose-status--pending' },
  taken: { label: 'Pris ✓', className: 'dose-status--taken' },
  skipped: { label: 'Ignoré', className: 'dose-status--skipped' },
  missed: { label: 'Manqué', className: 'dose-status--missed' },
}

export default function DoseCard({ dose, onMark, isMarking }) {
  const status = STATUS_CONFIG[dose.status] || STATUS_CONFIG.pending
  const isTaken = dose.status === 'taken'

  return (
    <div className={`dose-card card ${isTaken ? 'dose-card--taken' : ''}`}>
      <div className="dose-card-header">
        <div className="dose-time">
          {isTaken && dose.takenAt
            ? new Date(dose.takenAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
            : dose.time}
        </div>
        <span className={`badge ${status.className}`}>{status.label}</span>
      </div>

      <div className="dose-card-body">
        <div className="dose-color-dot" style={{ background: dose.color }} />
        <div className="dose-info">
          <div className="dose-name">{dose.medicationName}</div>
          <div className="dose-dosage">{dose.dosage}{dose.unit ? ` ${dose.unit}` : ''}</div>
          {dose.prescriptionName && (
            <div className="dose-prescription">📋 {dose.prescriptionName}</div>
          )}
        </div>
      </div>

      {!isTaken && (
        <div className="dose-actions">
          <button
            className="btn btn-success btn-full btn-lg"
            onClick={() => onMark(dose, 'taken')}
            disabled={isMarking}
          >
            {isMarking ? '...' : '✓ Médicament pris'}
          </button>
          {dose.status !== 'skipped' && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => onMark(dose, 'skipped')}
              disabled={isMarking}
            >
              Ignorer
            </button>
          )}
        </div>
      )}

      {isTaken && (
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => onMark(dose, 'pending')}
        >
          Annuler
        </button>
      )}
    </div>
  )
}
