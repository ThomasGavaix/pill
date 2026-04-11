import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const DAYS_MAP = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']

function fmtDate(dateStr: string, timeStr: string): string {
  return dateStr.replace(/-/g, '') + 'T' + timeStr.replace(':', '') + '00'
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

function uid(...parts: string[]): string {
  return parts.join('-') + '@pill-app'
}

function valarm(minutesBefore = 15): string {
  return [
    'BEGIN:VALARM',
    `TRIGGER:-PT${minutesBefore}M`,
    'ACTION:DISPLAY',
    'DESCRIPTION:Rappel médicament',
    'END:VALARM',
  ].join('\r\n')
}

function vevent(fields: Record<string, string>, alarm = true): string {
  const lines = ['BEGIN:VEVENT']
  for (const [k, v] of Object.entries(fields)) lines.push(`${k}:${v}`)
  if (alarm) lines.push(valarm())
  lines.push('END:VEVENT')
  return lines.join('\r\n')
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildEvents(profile: any, medications: any[], schedules: any[], prescriptions: any[]): string[] {
  const medMap = Object.fromEntries(medications.map((m) => [m.id, m]))
  const now = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z'
  const events: string[] = []

  // ── Recurring schedules ────────────────────────────────────────────────────
  for (const s of schedules) {
    const med = medMap[s.medication_id]
    if (!med) continue
    const byday = (s.days_of_week as number[]).map((d) => DAYS_MAP[d]).join(',')
    const summary = `💊 ${med.name}${med.dosage ? ' ' + med.dosage : ''}`
    events.push(vevent({
      UID: uid('sched', s.id),
      DTSTAMP: now,
      DTSTART: fmtDate('20200106', s.time_of_day), // 2020-01-06 = Monday
      DURATION: 'PT5M',
      [`RRULE`]: `FREQ=WEEKLY;BYDAY=${byday}`,
      SUMMARY: summary,
      DESCRIPTION: `${med.unit} — rappel récurrent`,
    }))
  }

  // ── Prescriptions ──────────────────────────────────────────────────────────
  for (const presc of prescriptions) {
    for (const med of (presc.prescription_meds ?? [])) {
      const summary = `💊 ${med.name}${med.dosage ? ' ' + med.dosage : ''} (${presc.name})`
      for (const phase of (med.prescription_phases ?? [])) {
        const phaseStart = addDays(presc.start_date, phase.start_day - 1)
        for (const time of (phase.prescription_times ?? [])) {
          const dtstart = fmtDate(phaseStart, time.time_of_day)
          const desc = `${time.quantity} ${med.unit}`

          if (phase.interval_days) {
            // 1 jour sur N pendant duration_days
            const count = Math.ceil(phase.duration_days / phase.interval_days)
            events.push(vevent({
              UID: uid('presc', time.id),
              DTSTAMP: now,
              DTSTART: dtstart,
              DURATION: 'PT5M',
              RRULE: `FREQ=DAILY;INTERVAL=${phase.interval_days};COUNT=${count}`,
              SUMMARY: summary,
              DESCRIPTION: desc,
            }))
          } else if (phase.duration_days == null) {
            // Traitement permanent
            events.push(vevent({
              UID: uid('presc', time.id),
              DTSTAMP: now,
              DTSTART: dtstart,
              DURATION: 'PT5M',
              RRULE: 'FREQ=DAILY',
              SUMMARY: summary,
              DESCRIPTION: desc,
            }))
          } else if (phase.duration_days === 1) {
            // Jour isolé
            events.push(vevent({
              UID: uid('presc', time.id, phaseStart),
              DTSTAMP: now,
              DTSTART: dtstart,
              DURATION: 'PT5M',
              SUMMARY: summary,
              DESCRIPTION: desc,
            }))
          } else {
            // Période continue
            events.push(vevent({
              UID: uid('presc', time.id),
              DTSTAMP: now,
              DTSTART: dtstart,
              DURATION: 'PT5M',
              RRULE: `FREQ=DAILY;COUNT=${phase.duration_days}`,
              SUMMARY: summary,
              DESCRIPTION: desc,
            }))
          }
        }
      }
    }
  }

  return events
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*' } })
  }

  const token = new URL(req.url).searchParams.get('token')
  if (!token) return new Response('Missing token', { status: 400 })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: profile, error: pErr } = await supabase
    .from('profiles').select('*').eq('calendar_token', token).single()
  if (pErr || !profile) return new Response('Invalid token', { status: 404 })

  const [{ data: meds }, { data: scheds }, { data: prescs }] = await Promise.all([
    supabase.from('medications').select('*').eq('profile_id', profile.id).eq('active', true),
    supabase.from('schedules').select('*').eq('profile_id', profile.id).eq('active', true),
    supabase.from('prescriptions').select(`
      *, prescription_meds(*, prescription_phases(*, prescription_times(*)))
    `).eq('profile_id', profile.id),
  ])

  const events = buildEvents(profile, meds ?? [], scheds ?? [], prescs ?? [])

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Pill//Medication Calendar//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:💊 ${profile.name} — Médicaments`,
    'X-WR-CALDESC:Calendrier des prises de médicaments',
    'X-APPLE-CALENDAR-COLOR:#2563EB',
    'X-WR-TIMEZONE:Europe/Paris',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n')

  return new Response(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  })
})
