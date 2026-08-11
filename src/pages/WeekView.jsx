import { useMemo } from 'react'
import { addDays, format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useApp } from '../contexts/AppContext'
import { getDosesForDate, getPeriodKey, PERIODS } from '../lib/doses'
import './WeekView.css'

export default function WeekView() {
  const { prescriptions, schedules, medications, doseLogs } = useApp()

  const days = useMemo(() => {
    const today = new Date()
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(today, i)
      const doses = getDosesForDate(date, { prescriptions, schedules, medications, doseLogs })

      // Group by period
      const byPeriod = {}
      for (const dose of doses) {
        const pk = getPeriodKey(dose.time)
        if (!byPeriod[pk]) byPeriod[pk] = []
        byPeriod[pk].push(dose)
      }

      return { date, doses, byPeriod, isToday: i === 0 }
    })
  }, [prescriptions, schedules, medications, doseLogs])

  return (
    <div className="week-view">
      <p className="week-subtitle">Prises sur 7 jours — idéal pour préparer votre pilulier</p>
      <div className="stack stack-md">
        {days.map(({ date, byPeriod, isToday, doses }) => (
          <div key={date.toISOString()} className={`week-day-card card${isToday ? ' week-day-card--today' : ''}`}>
            <div className="week-day-header">
              <span className="week-day-name">
                {isToday ? "Aujourd'hui" : format(date, 'EEEE', { locale: fr })}
              </span>
              <span className="week-day-date">{format(date, 'd MMM', { locale: fr })}</span>
              <span className="week-day-count">{doses.length} prise{doses.length !== 1 ? 's' : ''}</span>
            </div>

            {doses.length === 0 ? (
              <p className="week-day-empty">Aucune prise prévue</p>
            ) : (
              <div className="week-periods">
                {PERIODS.filter((p) => byPeriod[p.key]?.length > 0).map((period) => (
                  <div key={period.key} className="week-period">
                    <div className="week-period-label">
                      <span>{period.icon}</span>
                      <span>{period.label}</span>
                    </div>
                    <div className="week-meds">
                      {byPeriod[period.key].map((dose) => (
                        <div key={dose.key} className="week-med-row">
                          <span
                            className="week-med-dot"
                            style={{ background: dose.color || '#94a3b8' }}
                          />
                          <span className="week-med-name">{dose.medicationName}</span>
                          <span className="week-med-dose">{dose.dosage}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
