import { useMemo, useState } from 'react'
import { format, differenceInDays, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useApp } from '../contexts/AppContext'
import DoseCard from '../components/schedule/DoseCard'
import { useScheduleNotifications } from '../hooks/useScheduleNotifications'
import './Today.css'

const PERIODS = [
  { key: 'matin',  label: 'Matin',        icon: '🌅', from: '06:00', to: '11:59' },
  { key: 'midi',   label: 'Midi',          icon: '☀️',  from: '12:00', to: '13:59' },
  { key: 'soir',   label: 'Soir',          icon: '🌆', from: '14:00', to: '20:59' },
  { key: 'nuit',   label: 'Nuit',          icon: '🌙', from: '21:00', to: '05:59' },
]

function getPeriod(time) {
  if (time >= '06:00' && time <= '11:59') return 'matin'
  if (time >= '12:00' && time <= '13:59') return 'midi'
  if (time >= '14:00' && time <= '20:59') return 'soir'
  return 'nuit'
}

function formatTakenAt(isoString) {
  const d = new Date(isoString)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function DoseRow({ dose, onMark, isMarking }) {
  const isTaken = dose.status === 'taken'
  const isSkipped = dose.status === 'skipped'

  return (
    <div className={`dose-row ${isTaken ? 'dose-row--taken' : ''} ${isSkipped ? 'dose-row--skipped' : ''}`}>
      <div className="dose-row-dot" style={{ background: dose.color }} />
      <div className="dose-row-info">
        <span className="dose-row-name">{dose.medicationName}</span>
        {dose.dosage ? <span className="dose-row-dosage">{dose.dosage}</span> : null}
        <span className="dose-row-time">
          {isTaken && dose.takenAt ? formatTakenAt(dose.takenAt) : dose.time}
        </span>
      </div>
      <div className="dose-row-actions">
        {isTaken ? (
          <button className="dose-row-btn dose-row-btn--taken" onClick={() => onMark(dose, 'pending')} disabled={isMarking} title="Annuler">✓</button>
        ) : isSkipped ? (
          <button className="dose-row-btn dose-row-btn--skipped" onClick={() => onMark(dose, 'pending')} disabled={isMarking} title="Annuler">—</button>
        ) : (
          <>
            <button className="dose-row-btn dose-row-btn--take" onClick={() => onMark(dose, 'taken')} disabled={isMarking} title="Pris">✓</button>
            <button className="dose-row-btn dose-row-btn--skip" onClick={() => onMark(dose, 'skipped')} disabled={isMarking} title="Ignorer">—</button>
          </>
        )}
      </div>
    </div>
  )
}

export default function Today() {
  const { activeProfile, medications, schedules, doseLogs, prescriptions, markDose, cancelAdHocDose, loading } = useApp()
  const [marking, setMarking] = useState(null)
  const [markError, setMarkError] = useState(null)
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('todayView') || 'grouped')

  useScheduleNotifications(schedules, medications, doseLogs)

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const todayDow = today.getDay()

  const todayDoses = useMemo(() => {
    const doses = []
    const medMap = Object.fromEntries(medications.map((m) => [m.id, m]))

    for (const s of schedules) {
      if (!s.active || !s.days_of_week.includes(todayDow)) continue
      const med = medMap[s.medication_id]
      if (!med) continue
      const log = doseLogs.find((l) => l.schedule_id === s.id && l.scheduled_date === todayStr)
      doses.push({
        key: `sched-${s.id}`, scheduleId: s.id, prescriptionTimeId: null,
        medicationId: s.medication_id, medicationName: med.name,
        dosage: med.dosage, unit: med.unit, color: med.color,
        time: s.time_of_day, status: log?.status || 'pending', source: 'recurring',
        takenAt: log?.taken_at || null,
      })
    }

    for (const presc of prescriptions) {
      const start = parseISO(presc.start_date)
      const dayNumber = differenceInDays(today, start) + 1
      if (dayNumber < 1) continue
      for (const med of (presc.prescription_meds || [])) {
        for (const phase of (med.prescription_phases || [])) {
          const phaseEnd = phase.duration_days == null ? Infinity : phase.start_day + phase.duration_days - 1
          if (dayNumber < phase.start_day || dayNumber > phaseEnd) continue
          for (const time of (phase.prescription_times || [])) {
            const log = doseLogs.find((l) => l.prescription_time_id === time.id && l.scheduled_date === todayStr)
            doses.push({
              key: `presc-${time.id}`, scheduleId: null, prescriptionTimeId: time.id,
              medicationId: null, medicationName: med.name,
              dosage: `${time.quantity} ${med.unit}`, unit: '',
              color: med.color, time: time.time_of_day,
              status: log?.status || 'pending', source: 'prescription',
              prescriptionName: presc.name, takenAt: log?.taken_at || null,
            })
          }
        }
      }
    }

    for (const log of doseLogs) {
      if (log.schedule_id || log.prescription_time_id) continue
      if (log.scheduled_date !== todayStr) continue
      const med = medMap[log.medication_id]
      doses.push({
        key: `adhoc-${log.id}`, scheduleId: null, prescriptionTimeId: null,
        medicationId: log.medication_id, medicationName: med?.name || 'Médicament',
        dosage: '', unit: med?.unit || '', color: med?.color || '#6b7280',
        time: log.scheduled_time, status: log.status, source: 'adhoc', logId: log.id,
        takenAt: log.taken_at || null,
      })
    }

    return doses.sort((a, b) => a.time.localeCompare(b.time))
  }, [schedules, medications, doseLogs, prescriptions, todayStr, todayDow, today])

  const stats = useMemo(() => {
    const taken = todayDoses.filter((d) => d.status === 'taken').length
    const total = todayDoses.length
    return { taken, total, pct: total > 0 ? Math.round((taken / total) * 100) : 0 }
  }, [todayDoses])

  const grouped = useMemo(() => {
    return PERIODS.map((p) => ({
      ...p,
      doses: todayDoses.filter((d) => getPeriod(d.time) === p.key),
    })).filter((p) => p.doses.length > 0)
  }, [todayDoses])

  async function handleMark(dose, status) {
    setMarking(dose.key + status)
    setMarkError(null)
    try {
      if (dose.source === 'adhoc') {
        await cancelAdHocDose(dose.logId)
      } else {
        await markDose(dose.scheduleId, dose.medicationId, todayStr, dose.time, status, dose.prescriptionTimeId)
      }
    } catch (err) {
      setMarkError(err.message)
    } finally {
      setMarking(null)
    }
  }

  function toggleView() {
    const next = viewMode === 'grouped' ? 'list' : 'grouped'
    setViewMode(next)
    localStorage.setItem('todayView', next)
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
        <div className="today-header-top">
          <div className="today-date">{format(today, "EEEE d MMMM yyyy", { locale: fr })}</div>
          <button className="btn btn-ghost btn-sm today-view-toggle" onClick={toggleView} title="Changer de vue">
            {viewMode === 'grouped' ? '☰' : '⊞'}
          </button>
        </div>
        {stats.total > 0 && (
          <div className="today-progress">
            <div className="today-progress-bar">
              <div className="today-progress-fill" style={{ width: `${stats.pct}%` }} />
            </div>
            <div className="today-progress-label">{stats.taken}/{stats.total} pris</div>
          </div>
        )}
      </div>

      {markError && <div className="alert alert-error" style={{ marginBottom: 12 }}>{markError}</div>}

      {todayDoses.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🌿</div>
          <div className="empty-state-title">Rien pour aujourd'hui</div>
          <div className="empty-state-text">Aucun médicament prévu.</div>
        </div>
      ) : viewMode === 'grouped' ? (
        <div className="stack stack-lg">
          {grouped.map((period) => {
            const taken = period.doses.filter((d) => d.status === 'taken').length
            return (
              <div key={period.key} className="today-period">
                <div className="today-period-header">
                  <span className="today-period-icon">{period.icon}</span>
                  <span className="today-period-label">{period.label}</span>
                  <span className="today-period-count">{taken}/{period.doses.length}</span>
                </div>
                <div className="today-period-rows">
                  {period.doses.map((dose) => (
                    <DoseRow
                      key={dose.key}
                      dose={dose}
                      onMark={handleMark}
                      isMarking={!!marking}
                    />
                  ))}
                </div>
              </div>
            )
          })}
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
