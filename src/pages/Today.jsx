import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useApp } from '../contexts/AppContext'
import DoseCard from '../components/schedule/DoseCard'
import { useScheduleNotifications } from '../hooks/useScheduleNotifications'
import './Today.css'

const DAY_MAP = { 0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat' }

export default function Today() {
  const { activeProfile, medications, schedules, doseLogs, markDose, loading } = useApp()
  const [marking, setMarking] = useState(null)

  // Schedule local push notifications for today's doses
  useScheduleNotifications(schedules, medications, doseLogs)

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const todayDow = today.getDay()

  // Build list of today's scheduled doses
  const todayDoses = useMemo(() => {
    if (!schedules.length) return []

    const medMap = Object.fromEntries(medications.map((m) => [m.id, m]))

    const doses = schedules
      .filter((s) => s.active && s.days_of_week.includes(todayDow))
      .map((s) => {
        const med = medMap[s.medication_id]
        if (!med) return null
        const log = doseLogs.find(
          (l) => l.schedule_id === s.id && l.scheduled_date === todayStr
        )
        return {
          id: s.id,
          scheduleId: s.id,
          medicationId: s.medication_id,
          medicationName: med.name,
          dosage: med.dosage,
          unit: med.unit,
          color: med.color,
          time: s.time_of_day,
          status: log?.status || 'pending',
          logId: log?.id,
        }
      })
      .filter(Boolean)
      .sort((a, b) => a.time.localeCompare(b.time))

    return doses
  }, [schedules, medications, doseLogs, todayStr, todayDow])

  const stats = useMemo(() => {
    const taken = todayDoses.filter((d) => d.status === 'taken').length
    const total = todayDoses.length
    return { taken, total, pct: total > 0 ? Math.round((taken / total) * 100) : 0 }
  }, [todayDoses])

  async function handleMark(dose, status) {
    setMarking(dose.scheduleId + status)
    try {
      await markDose(dose.scheduleId, dose.medicationId, todayStr, dose.time, status)
    } catch (err) {
      console.error(err)
    } finally {
      setMarking(null)
    }
  }

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner" />
        Chargement...
      </div>
    )
  }

  if (!activeProfile) {
    return (
      <div className="page">
        <div className="empty-state">
          <div className="empty-state-icon">👨‍👩‍👧</div>
          <div className="empty-state-title">Aucun profil</div>
          <div className="empty-state-text">
            Créez un profil dans l'onglet Famille pour commencer.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      {/* Date header */}
      <div className="today-header">
        <div className="today-date">
          {format(today, "EEEE d MMMM yyyy", { locale: fr })}
        </div>
        {stats.total > 0 && (
          <div className="today-progress">
            <div className="today-progress-bar">
              <div
                className="today-progress-fill"
                style={{ width: `${stats.pct}%` }}
              />
            </div>
            <div className="today-progress-label">
              {stats.taken}/{stats.total} pris
            </div>
          </div>
        )}
      </div>

      {todayDoses.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🌿</div>
          <div className="empty-state-title">Rien pour aujourd'hui</div>
          <div className="empty-state-text">
            Aucun médicament prévu. Ajoutez-en dans l'onglet Médicaments.
          </div>
        </div>
      ) : (
        <div className="stack stack-md">
          {todayDoses.map((dose) => (
            <DoseCard
              key={dose.scheduleId}
              dose={dose}
              onMark={handleMark}
              isMarking={marking === dose.scheduleId + 'taken' || marking === dose.scheduleId + 'skipped'}
            />
          ))}
        </div>
      )}

      {stats.total > 0 && stats.taken === stats.total && (
        <div className="today-congrats">
          <span>🎉</span>
          <span>Tous les médicaments ont été pris !</span>
        </div>
      )}
    </div>
  )
}
