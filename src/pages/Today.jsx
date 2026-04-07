import { useMemo, useState } from 'react'
import { format, differenceInDays, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useApp } from '../contexts/AppContext'
import DoseCard from '../components/schedule/DoseCard'
import { useScheduleNotifications } from '../hooks/useScheduleNotifications'
import './Today.css'

export default function Today() {
  const { activeProfile, medications, schedules, doseLogs, prescriptions, markDose, loading } = useApp()
  const [marking, setMarking] = useState(null)

  useScheduleNotifications(schedules, medications, doseLogs)

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const todayDow = today.getDay()

  const todayDoses = useMemo(() => {
    const doses = []

    // ── Recurring schedule doses ─────────────────────────────────────────
    const medMap = Object.fromEntries(medications.map((m) => [m.id, m]))
    for (const s of schedules) {
      if (!s.active || !s.days_of_week.includes(todayDow)) continue
      const med = medMap[s.medication_id]
      if (!med) continue
      const log = doseLogs.find((l) => l.schedule_id === s.id && l.scheduled_date === todayStr)
      doses.push({
        key: `sched-${s.id}`,
        scheduleId: s.id,
        prescriptionTimeId: null,
        medicationId: s.medication_id,
        medicationName: med.name,
        dosage: med.dosage,
        unit: med.unit,
        color: med.color,
        time: s.time_of_day,
        status: log?.status || 'pending',
        source: 'recurring',
      })
    }

    // ── Prescription doses ───────────────────────────────────────────────
    for (const presc of prescriptions) {
      const start = parseISO(presc.start_date)
      const dayNumber = differenceInDays(today, start) + 1
      if (dayNumber < 1) continue

      for (const med of (presc.prescription_meds || [])) {
        for (const phase of (med.prescription_phases || [])) {
          const phaseEnd = phase.duration_days == null ? Infinity : phase.start_day + phase.duration_days - 1
          if (dayNumber < phase.start_day || dayNumber > phaseEnd) continue

          for (const time of (phase.prescription_times || [])) {
            const log = doseLogs.find(
              (l) => l.prescription_time_id === time.id && l.scheduled_date === todayStr
            )
            doses.push({
              key: `presc-${time.id}`,
              scheduleId: null,
              prescriptionTimeId: time.id,
              medicationId: null,
              medicationName: med.name,
              dosage: `${time.quantity} ${med.unit}`,
              unit: '',
              color: med.color,
              time: time.time_of_day,
              status: log?.status || 'pending',
              source: 'prescription',
              prescriptionName: presc.name,
            })
          }
        }
      }
    }

    return doses.sort((a, b) => a.time.localeCompare(b.time))
  }, [schedules, medications, doseLogs, prescriptions, todayStr, todayDow, today])

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
        {stats.total > 0 && (
          <div className="today-progress">
            <div className="today-progress-bar">
              <div className="today-progress-fill" style={{ width: `${stats.pct}%` }} />
            </div>
            <div className="today-progress-label">{stats.taken}/{stats.total} pris</div>
          </div>
        )}
      </div>

      {todayDoses.length === 0 ? (
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

      {stats.total > 0 && stats.taken === stats.total && (
        <div className="today-congrats">
          <span>🎉</span>
          <span>Tous les médicaments ont été pris !</span>
        </div>
      )}
    </div>
  )
}
