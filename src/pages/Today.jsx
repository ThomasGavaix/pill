import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useApp } from '../contexts/AppContext'
import DoseCard from '../components/schedule/DoseCard'
import WeekView from './WeekView'
import { useScheduleNotifications } from '../hooks/useScheduleNotifications'
import { getDosesForDate } from '../lib/doses'
import './Today.css'

export default function Today() {
  const { activeProfile, medications, schedules, doseLogs, prescriptions, markDose, loading } = useApp()
  const [marking, setMarking] = useState(null)
  const [view, setView] = useState('today')

  useScheduleNotifications(schedules, medications, doseLogs)

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  const todayDoses = useMemo(() => (
    getDosesForDate(today, { prescriptions, schedules, medications, doseLogs })
  ), [schedules, medications, doseLogs, prescriptions, todayStr])

  const stats = useMemo(() => {
    const taken = todayDoses.filter((d) => d.status === 'taken').length
    const total = todayDoses.length
    return { taken, total, pct: total > 0 ? Math.round((taken / total) * 100) : 0 }
  }, [todayDoses])

  async function handleMark(dose, status) {
    setMarking(dose.key + status)
    try {
      await markDose(
        dose.scheduleId, dose.medicationId, todayStr, dose.time, status, dose.prescriptionTimeId
      )
    } catch (err) {
      console.error(err)
    } finally {
      setMarking(null)
    }
  }

  if (loading) return <div className="loading-page"><div className="spinner" />Chargement...</div>

  if (!activeProfile) {
    return (
      <div className="page">
        <div className="empty-state">
          <div className="empty-state-icon">👨‍👩‍👧</div>
          <div className="empty-state-title">Aucun profil</div>
          <div className="empty-state-text">Créez un profil dans l'onglet Famille pour commencer.</div>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="today-header">
        <div className="today-date">{format(today, "EEEE d MMMM yyyy", { locale: fr })}</div>

        {/* View toggle */}
        <div className="today-toggle">
          <button
            className={`today-toggle-btn${view === 'today' ? ' today-toggle-btn--active' : ''}`}
            onClick={() => setView('today')}
          >
            Aujourd'hui
          </button>
          <button
            className={`today-toggle-btn${view === 'week' ? ' today-toggle-btn--active' : ''}`}
            onClick={() => setView('week')}
          >
            📋 7 jours
          </button>
        </div>

        {view === 'today' && stats.total > 0 && (
          <div className="today-progress">
            <div className="today-progress-bar">
              <div className="today-progress-fill" style={{ width: `${stats.pct}%` }} />
            </div>
            <div className="today-progress-label">{stats.taken}/{stats.total} pris</div>
          </div>
        )}
      </div>

      {view === 'week' ? (
        <WeekView />
      ) : todayDoses.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🌿</div>
          <div className="empty-state-title">Rien pour aujourd'hui</div>
          <div className="empty-state-text">Aucun médicament prévu.</div>
        </div>
      ) : (
        <div className="stack stack-md">
          {todayDoses.map((dose) => (
            <DoseCard
              key={dose.key}
              dose={dose}
              onMark={handleMark}
              isMarking={marking === dose.key + 'taken' || marking === dose.key + 'skipped'}
            />
          ))}
        </div>
      )}

      {view === 'today' && stats.total > 0 && stats.taken === stats.total && (
        <div className="today-congrats">
          <span>🎉</span>
          <span>Tous les médicaments ont été pris !</span>
        </div>
      )}
    </div>
  )
}
