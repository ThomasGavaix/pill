import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [profiles, setProfiles] = useState([])
  const [activeProfile, setActiveProfile] = useState(null)
  const [medications, setMedications] = useState([])
  const [schedules, setSchedules] = useState([])
  const [doseLogs, setDoseLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Load profiles on mount
  useEffect(() => {
    loadProfiles()
  }, [])

  // Load medications and schedules when active profile changes
  useEffect(() => {
    if (activeProfile) {
      loadMedications(activeProfile.id)
      loadTodayDoseLogs(activeProfile.id)
    }
  }, [activeProfile])

  async function loadProfiles() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: true })
      if (error) throw error
      setProfiles(data || [])
      // Restore last active profile from localStorage
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
        .from('medications')
        .select('*')
        .eq('profile_id', profileId)
        .eq('active', true)
        .order('name')
      if (medsError) throw medsError

      const { data: scheds, error: schedsError } = await supabase
        .from('schedules')
        .select('*')
        .eq('profile_id', profileId)
        .eq('active', true)
      if (schedsError) throw schedsError

      setMedications(meds || [])
      setSchedules(scheds || [])
    } catch (err) {
      setError(err.message)
    }
  }

  async function loadTodayDoseLogs(profileId) {
    const today = new Date().toISOString().split('T')[0]
    try {
      const { data, error } = await supabase
        .from('dose_logs')
        .select('*')
        .eq('profile_id', profileId)
        .eq('scheduled_date', today)
      if (error) throw error
      setDoseLogs(data || [])
    } catch (err) {
      setError(err.message)
    }
  }

  const switchProfile = useCallback((profile) => {
    setActiveProfile(profile)
    localStorage.setItem('activeProfileId', profile.id)
    loadMedications(profile.id)
    loadTodayDoseLogs(profile.id)
  }, [])

  const createProfile = useCallback(async (profileData) => {
    const { data, error } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single()
    if (error) throw error
    setProfiles((prev) => [...prev, data])
    return data
  }, [])

  const updateProfile = useCallback(async (id, profileData) => {
    const { data, error } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', id)
      .select()
      .single()
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
      .from('medications')
      .insert({ ...medData, profile_id: activeProfile.id })
      .select()
      .single()
    if (error) throw error
    setMedications((prev) => [...prev, data])
    return data
  }, [activeProfile])

  const updateMedication = useCallback(async (id, medData) => {
    const { data, error } = await supabase
      .from('medications')
      .update(medData)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    setMedications((prev) => prev.map((m) => (m.id === id ? data : m)))
    return data
  }, [])

  const deleteMedication = useCallback(async (id) => {
    const { error } = await supabase
      .from('medications')
      .update({ active: false })
      .eq('id', id)
    if (error) throw error
    setMedications((prev) => prev.filter((m) => m.id !== id))
  }, [])

  const createSchedule = useCallback(async (schedData) => {
    const { data, error } = await supabase
      .from('schedules')
      .insert({ ...schedData, profile_id: activeProfile.id })
      .select()
      .single()
    if (error) throw error
    setSchedules((prev) => [...prev, data])
    return data
  }, [activeProfile])

  const deleteSchedule = useCallback(async (id) => {
    const { error } = await supabase.from('schedules').delete().eq('id', id)
    if (error) throw error
    setSchedules((prev) => prev.filter((s) => s.id !== id))
  }, [])

  const markDose = useCallback(async (scheduleId, medicationId, scheduledDate, scheduledTime, status) => {
    const { data, error } = await supabase
      .from('dose_logs')
      .upsert({
        schedule_id: scheduleId,
        medication_id: medicationId,
        profile_id: activeProfile.id,
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime,
        status,
        taken_at: status === 'taken' ? new Date().toISOString() : null,
      }, { onConflict: 'schedule_id,scheduled_date' })
      .select()
      .single()
    if (error) throw error
    setDoseLogs((prev) => {
      const existing = prev.findIndex(
        (l) => l.schedule_id === scheduleId && l.scheduled_date === scheduledDate
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

  const refreshToday = useCallback(() => {
    if (activeProfile) loadTodayDoseLogs(activeProfile.id)
  }, [activeProfile])

  return (
    <AppContext.Provider value={{
      profiles, activeProfile, medications, schedules, doseLogs,
      loading, error,
      switchProfile, createProfile, updateProfile, deleteProfile,
      createMedication, updateMedication, deleteMedication,
      createSchedule, deleteSchedule,
      markDose, refreshToday,
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
