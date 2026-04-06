import { useState } from 'react'
import { useApp } from '../../contexts/AppContext'

const DAYS = [
  { dow: 1, label: 'Lun' },
  { dow: 2, label: 'Mar' },
  { dow: 3, label: 'Mer' },
  { dow: 4, label: 'Jeu' },
  { dow: 5, label: 'Ven' },
  { dow: 6, label: 'Sam' },
  { dow: 0, label: 'Dim' },
]

export default function ScheduleForm({ medicationId, onClose }) {
  const { createSchedule } = useApp()
  const [time, setTime] = useState('08:00')
  const [selectedDays, setSelectedDays] = useState([0, 1, 2, 3, 4, 5, 6])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  function toggleDay(dow) {
    setSelectedDays((prev) =>
      prev.includes(dow) ? prev.filter((d) => d !== dow) : [...prev, dow]
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!selectedDays.length) return
    setSaving(true)
    setError(null)
    try {
      await createSchedule({
        medication_id: medicationId,
        time_of_day: time,
        days_of_week: selectedDays,
      })
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
        <h2 className="modal-title">Nouvel horaire</h2>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="stack stack-md">
          <div className="form-group">
            <label htmlFor="schedule-time">Heure</label>
            <input
              id="schedule-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
              style={{ fontSize: 'var(--font-2xl)', fontWeight: 700 }}
            />
          </div>

          <div className="form-group">
            <label>Jours</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {DAYS.map(({ dow, label }) => (
                <button
                  key={dow}
                  type="button"
                  className={`day-btn ${selectedDays.includes(dow) ? 'day-btn--active' : ''}`}
                  onClick={() => toggleDay(dow)}
                >
                  {label}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setSelectedDays([0, 1, 2, 3, 4, 5, 6])}
              >
                Tous les jours
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setSelectedDays([1, 2, 3, 4, 5])}
              >
                Semaine
              </button>
            </div>
          </div>

          <div className="stack stack-sm" style={{ marginTop: 8 }}>
            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={saving || !selectedDays.length}
            >
              {saving ? 'Enregistrement...' : 'Ajouter cet horaire'}
            </button>
            <button type="button" className="btn btn-ghost btn-full" onClick={onClose}>
              Annuler
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .day-btn {
          padding: 10px 14px;
          border-radius: var(--radius-md);
          border: 2px solid var(--gray-200);
          background: var(--white);
          font-size: var(--font-base);
          font-weight: 600;
          cursor: pointer;
          color: var(--gray-600);
          min-width: 52px;
          min-height: 48px;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
          transition: all 0.1s;
        }
        .day-btn--active {
          background: var(--blue-600);
          border-color: var(--blue-600);
          color: var(--white);
        }
        .day-btn:active { transform: scale(0.95); }
      `}</style>
    </div>
  )
}
