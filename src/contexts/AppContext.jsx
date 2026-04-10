import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [profiles, setProfiles] = useState([])
  const [activeProfile, setActiveProfile] = useState(null)
  const [medications, setMedications] = useState([])
  const [schedules, setSchedules] = useState([])
  const [doseLogs, setDoseLogs] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => { loadProfiles() }, [])

  useEffect(() => {
    if (activeProfile) {
      loadMedications(activeProfile.id)
      loadTodayDoseLogs(activeProfile.id)
      loadPrescriptions(activeProfile.id)
    }
  }, [activeProfile])

  async function loadProfiles() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles').select('*').order('created_at', { ascending: true })
      if (error) throw error
      setProfiles(data || [])
      const savedId = localStorage.getItem('activeProfileId')
      const found = data?.find((p) => p.id === savedId)
      if (found) setActiveProfile(found)
      else if (data?.length > 0) setActiveProfile(data[0])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function loadMedications(profileId) {
    try {
      const { data: meds, error: medsError } = await supabase
        .from('medications').select('*').eq('profile_id', profileId).eq('active', true).order('name')
      if (medsError) throw medsError
      const { data: scheds, error: schedsError } = await supabase
        .from('schedules').select('*').eq('profile_id', profileId).eq('active', true)
      if (schedsError) throw schedsError
      setMedications(meds || [])
      setSchedules(scheds || [])
    } catch (err) { setError(err.message) }
  }

  async function loadTodayDoseLogs(profileId) {
    const today = new Date().toISOString().split('T')[0]
    try {
      const { data, error } = await supabase
        .from('dose_logs').select('*').eq('profile_id', profileId).eq('scheduled_date', today)
      if (error) throw error
      setDoseLogs(data || [])
    } catch (err) { setError(err.message) }
  }

  async function loadPrescriptions(profileId) {
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .select(`
          *,
          prescription_meds (
            *,
            prescription_phases (
              *,
              prescription_times (*)
            )
          )
        `)
        .eq('profile_id', profileId)
        .order('start_date', { ascending: false })
      if (error) throw error
      setPrescriptions(data || [])
    } catch (err) { setError(err.message) }
  }

  const switchProfile = useCallback((profile) => {
    setActiveProfile(profile)
    localStorage.setItem('activeProfileId', profile.id)
    loadMedications(profile.id)
    loadTodayDoseLogs(profile.id)
    loadPrescriptions(profile.id)
  }, [])

  const createProfile = useCallback(async (profileData) => {
    const { data, error } = await supabase.from('profiles').insert(profileData).select().single()
    if (error) throw error
    setProfiles((prev) => [...prev, data])
    return data
  }, [])

  const updateProfile = useCallback(async (id, profileData) => {
    const { data, error } = await supabase.from('profiles').update(profileData).eq('id', id).select().single()
    if (error) throw error
    setProfiles((prev) => prev.map((p) => (p.id === id ? data : p)))
    if (activeProfile?.id === id) setActiveProfile(data)
    return data
  }, [activeProfile])

  const deleteProfile = useCallback(async (id) => {
    const { error } = await supabase.from('profiles').delete().eq('id', id)
    if (error) throw error
    setProfiles((prev) => prev.filter((p) => p.id !== id))
    if (activeProfile?.id === id) {
      const remaining = profiles.filter((p) => p.id !== id)
      setActiveProfile(remaining[0] || null)
    }
  }, [activeProfile, profiles])

  const createMedication = useCallback(async (medData) => {
    const { data, error } = await supabase
      .from('medications').insert({ ...medData, profile_id: activeProfile.id }).select().single()
    if (error) throw error
    setMedications((prev) => [...prev, data])
    return data
  }, [activeProfile])

  const updateMedication = useCallback(async (id, medData) => {
    const { data, error } = await supabase.from('medications').update(medData).eq('id', id).select().single()
    if (error) throw error
    setMedications((prev) => prev.map((m) => (m.id === id ? data : m)))
    return data
  }, [])

  const deleteMedication = useCallback(async (id) => {
    const { error } = await supabase.from('medications').update({ active: false }).eq('id', id)
    if (error) throw error
    setMedications((prev) => prev.filter((m) => m.id !== id))
  }, [])

  const createSchedule = useCallback(async (schedData) => {
    const { data, error } = await supabase
      .from('schedules').insert({ ...schedData, profile_id: activeProfile.id }).select().single()
    if (error) throw error
    setSchedules((prev) => [...prev, data])
    return data
  }, [activeProfile])

  const deleteSchedule = useCallback(async (id) => {
    const { error } = await supabase.from('schedules').delete().eq('id', id)
    if (error) throw error
    setSchedules((prev) => prev.filter((s) => s.id !== id))
  }, [])

  const markDose = useCallback(async (scheduleId, medicationId, scheduledDate, scheduledTime, status, prescriptionTimeId) => {
    const conflictCol = prescriptionTimeId ? 'prescription_time_id,scheduled_date' : 'schedule_id,scheduled_date'
    const { data, error } = await supabase
      .from('dose_logs')
      .upsert({
        schedule_id: scheduleId || null,
        prescription_time_id: prescriptionTimeId || null,
        medication_id: medicationId,
        profile_id: activeProfile.id,
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime,
        status,
        taken_at: status === 'taken' ? new Date().toISOString() : null,
      }, { onConflict: conflictCol })
      .select().single()
    if (error) throw error
    setDoseLogs((prev) => {
      const key = prescriptionTimeId ? 'prescription_time_id' : 'schedule_id'
      const keyVal = prescriptionTimeId || scheduleId
      const existing = prev.findIndex(
        (l) => l[key] === keyVal && l.scheduled_date === scheduledDate
      )
      if (existing >= 0) {
        const updated = [...prev]
        updated[existing] = data
        return updated
      }
      return [...prev, data]
    })
    return data
  }, [activeProfile])

  // Prescriptions CRUD
  async function syncMedsTocatalog(meds, profileId, currentMeds) {
    for (const med of meds) {
      if (!med.name?.trim()) continue
      const exists = currentMeds.some(
        (m) => m.name.trim().toLowerCase() === med.name.trim().toLowerCase()
      )
      if (!exists) {
        const { data } = await supabase
          .from('medications')
          .insert({ name: med.name, dosage: med.dosage || null, unit: med.unit, color: med.color, profile_id: profileId, active: true })
          .select().single()
        if (data) currentMeds = [...currentMeds, data]
      }
    }
    return currentMeds
  }

  const createPrescription = useCallback(async (prescData) => {
    const { meds, ...prescBase } = prescData
    // Insert prescription
    const { data: presc, error: prescError } = await supabase
      .from('prescriptions').insert({ ...prescBase, profile_id: activeProfile.id }).select().single()
    if (prescError) throw prescError

    // Insert meds + phases + times
    for (let i = 0; i < meds.length; i++) {
      const { phases, ...medBase } = meds[i]
      const { data: med, error: medError } = await supabase
        .from('prescription_meds').insert({ ...medBase, prescription_id: presc.id, display_order: i }).select().single()
      if (medError) throw medError

      for (const phase of phases) {
        const { times, ...phaseBase } = phase
        const { data: ph, error: phError } = await supabase
          .from('prescription_phases').insert({ ...phaseBase, prescription_med_id: med.id }).select().single()
        if (phError) throw phError

        for (const time of times) {
          const { error: tError } = await supabase
            .from('prescription_times').insert({ ...time, phase_id: ph.id })
          if (tError) throw tError
        }
      }
    }

    const synced = await syncMedsTocatalog(meds, activeProfile.id, medications)
    setMedications(synced)
    await loadPrescriptions(activeProfile.id)
    return presc
  }, [activeProfile, medications])

  const updatePrescription = useCallback(async (id, prescData) => {
    const { meds, ...prescBase } = prescData
    const { error } = await supabase.from('prescriptions').update(prescBase).eq('id', id)
    if (error) throw error

    // Delete and recreate meds
    await supabase.from('prescription_meds').delete().eq('prescription_id', id)

    for (let i = 0; i < meds.length; i++) {
      const { phases, ...medBase } = meds[i]
      const { data: med, error: medError } = await supabase
        .from('prescription_meds').insert({ ...medBase, prescription_id: id, display_order: i }).select().single()
      if (medError) throw medError

      for (const phase of phases) {
        const { times, ...phaseBase } = phase
        const { data: ph, error: phError } = await supabase
          .from('prescription_phases').insert({ ...phaseBase, prescription_med_id: med.id }).select().single()
        if (phError) throw phError

        for (const time of times) {
          const { error: tError } = await supabase
            .from('prescription_times').insert({ ...time, phase_id: ph.id })
          if (tError) throw tError
        }
      }
    }

    const synced = await syncMedsTocatalog(meds, activeProfile.id, medications)
    setMedications(synced)
    await loadPrescriptions(activeProfile.id)
  }, [activeProfile, medications])

  const deletePrescription = useCallback(async (id) => {
    const { error } = await supabase.from('prescriptions').delete().eq('id', id)
    if (error) throw error
    setPrescriptions((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const duplicatePrescription = useCallback(async (prescription, newStartDate) => {
    const meds = prescription.prescription_meds.map((med) => ({
      name: med.name,
      dosage: med.dosage,
      unit: med.unit,
      color: med.color,
      phases: med.prescription_phases.map((phase) => ({
        start_day: phase.start_day,
        duration_days: phase.duration_days,
        times: phase.prescription_times.map((t) => ({
          time_of_day: t.time_of_day,
          quantity: t.quantity,
        })),
      })),
    }))
    return createPrescription({
      name: prescription.name,
      start_date: newStartDate,
      notes: prescription.notes,
      meds,
    })
  }, [createPrescription])

  const cancelAdHocDose = useCallback(async (logId) => {
    const { error } = await supabase.from('dose_logs').delete().eq('id', logId)
    if (error) throw error
    setDoseLogs((prev) => prev.filter((l) => l.id !== logId))
  }, [])

  const logAdHocDose = useCallback(async (medicationId, time) => {
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('dose_logs')
      .insert({
        medication_id: medicationId,
        profile_id: activeProfile.id,
        scheduled_date: today,
        scheduled_time: time,
        status: 'taken',
        taken_at: new Date().toISOString(),
      })
      .select().single()
    if (error) throw error
    setDoseLogs((prev) => [...prev, data])
    return data
  }, [activeProfile])

  const addMedToPrescription = useCallback(async (prescriptionId, medData) => {
    const { phases, ...medBase } = medData
    const presc = prescriptions.find((p) => p.id === prescriptionId)
    const displayOrder = presc?.prescription_meds?.length || 0
    const { data: med, error: medError } = await supabase
      .from('prescription_meds').insert({ ...medBase, prescription_id: prescriptionId, display_order: displayOrder }).select().single()
    if (medError) throw medError
    for (const phase of phases) {
      const { times, ...phaseBase } = phase
      const { data: ph, error: phError } = await supabase
        .from('prescription_phases').insert({ ...phaseBase, prescription_med_id: med.id }).select().single()
      if (phError) throw phError
      for (const time of times) {
        const { error: tError } = await supabase.from('prescription_times').insert({ ...time, phase_id: ph.id })
        if (tError) throw tError
      }
    }
    await loadPrescriptions(activeProfile.id)
  }, [activeProfile, prescriptions])

  const refreshToday = useCallback(() => {
    if (activeProfile) loadTodayDoseLogs(activeProfile.id)
  }, [activeProfile])

  return (
    <AppContext.Provider value={{
      profiles, activeProfile, medications, schedules, doseLogs, prescriptions,
      loading, error,
      switchProfile, createProfile, updateProfile, deleteProfile,
      createMedication, updateMedication, deleteMedication,
      createSchedule, deleteSchedule,
      markDose, logAdHocDose, cancelAdHocDose, refreshToday,
      createPrescription, updatePrescription, deletePrescription, duplicatePrescription, addMedToPrescription,
      reload: loadProfiles,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
