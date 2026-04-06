import { useEffect } from 'react'
import { scheduleLocalNotification } from '../lib/push'

/**
 * Schedules local browser notifications for today's doses.
 * Only fires for doses that haven't been taken and are due in the future.
 */
export function useScheduleNotifications(schedules, medications, doseLogs) {
  useEffect(() => {
    if (!schedules.length || Notification.permission !== 'granted') return

    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]
    const todayDow = now.getDay()
    const medMap = Object.fromEntries(medications.map((m) => [m.id, m]))

    const timeouts = []

    for (const schedule of schedules) {
      if (!schedule.active) continue
      if (!schedule.days_of_week.includes(todayDow)) continue

      const med = medMap[schedule.medication_id]
      if (!med) continue

      const log = doseLogs.find(
        (l) => l.schedule_id === schedule.id && l.scheduled_date === todayStr
      )
      if (log?.status === 'taken' || log?.status === 'skipped') continue

      const [hours, minutes] = schedule.time_of_day.split(':').map(Number)
      const doseTime = new Date(now)
      doseTime.setHours(hours, minutes, 0, 0)

      const delay = doseTime.getTime() - now.getTime()
      if (delay <= 0) continue // Already passed

      const title = `💊 ${med.name} — ${schedule.time_of_day}`
      const body = `${med.dosage} ${med.unit}`
      const id = scheduleLocalNotification(title, body, delay)
      timeouts.push(id)
    }

    return () => {
      timeouts.forEach((id) => clearTimeout(id))
    }
  }, [schedules, medications, doseLogs])
}
