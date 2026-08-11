import { differenceInDays, parseISO } from 'date-fns'

export const PERIODS = [
  { key: 'matin',  label: 'Matin',      icon: '🌅', from: '06:00', to: '11:59' },
  { key: 'midi',   label: 'Midi',       icon: '☀️',  from: '12:00', to: '13:59' },
  { key: 'apmidi', label: 'Après-midi', icon: '🌤️', from: '14:00', to: '17:59' },
  { key: 'soir',   label: 'Soir',       icon: '🌆', from: '18:00', to: '20:59' },
  { key: 'nuit',   label: 'Nuit',       icon: '🌙', from: '21:00', to: '05:59' },
]

export function getPeriodKey(time) {
  if (time >= '06:00' && time <= '11:59') return 'matin'
  if (time >= '12:00' && time <= '13:59') return 'midi'
  if (time >= '14:00' && time <= '17:59') return 'apmidi'
  if (time >= '18:00' && time <= '20:59') return 'soir'
  return 'nuit'
}

export function getDosesForDate(date, { prescriptions, schedules, medications, doseLogs }) {
  const dateStr = date.toISOString().split('T')[0]
  const dow = date.getDay()
  const doses = []

  // Recurring schedules
  const medMap = Object.fromEntries(medications.map((m) => [m.id, m]))
  for (const s of schedules) {
    if (!s.active || !s.days_of_week.includes(dow)) continue
    const med = medMap[s.medication_id]
    if (!med) continue
    const log = doseLogs?.find((l) => l.schedule_id === s.id && l.scheduled_date === dateStr)
    doses.push({
      key: `sched-${s.id}-${dateStr}`,
      scheduleId: s.id,
      prescriptionTimeId: null,
      medicationId: s.medication_id,
      medicationName: med.name,
      dosage: med.dosage,
      quantity: null,
      unit: med.unit,
      color: med.color,
      time: s.time_of_day,
      status: log?.status || 'pending',
      source: 'recurring',
    })
  }

  // Prescription doses
  for (const presc of prescriptions) {
    const start = parseISO(presc.start_date)
    const dayNumber = differenceInDays(date, start) + 1
    if (dayNumber < 1) continue

    for (const med of (presc.prescription_meds || [])) {
      for (const phase of (med.prescription_phases || [])) {
        const phaseEnd = phase.duration_days == null
          ? Infinity
          : phase.start_day + phase.duration_days - 1
        if (dayNumber < phase.start_day || dayNumber > phaseEnd) continue

        // Handle alternating doses (e.g. every 2 days)
        if (phase.interval_days && phase.interval_days > 1) {
          const phaseOffset = dayNumber - phase.start_day
          if (phaseOffset % phase.interval_days !== 0) continue
        }

        for (const time of (phase.prescription_times || [])) {
          const log = doseLogs?.find(
            (l) => l.prescription_time_id === time.id && l.scheduled_date === dateStr
          )
          doses.push({
            key: `presc-${time.id}-${dateStr}`,
            scheduleId: null,
            prescriptionTimeId: time.id,
            medicationId: null,
            medicationName: med.name,
            dosage: `${time.quantity} ${med.unit}`,
            quantity: time.quantity,
            unit: med.unit,
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
}
