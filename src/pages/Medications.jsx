import { useState } from 'react'
import { useApp } from '../contexts/AppContext'
import MedicationCard from '../components/medications/MedicationCard'
import MedicationForm from '../components/medications/MedicationForm'
import ScheduleForm from '../components/medications/ScheduleForm'

export default function Medications() {
  const { activeProfile, medications, schedules, loading } = useApp()
  const [showMedForm, setShowMedForm] = useState(false)
  const [editingMed, setEditingMed] = useState(null)
  const [showScheduleForm, setShowScheduleForm] = useState(null) // medicationId

  if (!activeProfile) {
    return (
      <div className="page">
        <div className="empty-state">
          <div className="empty-state-icon">👨‍👩‍👧</div>
          <div className="empty-state-title">Aucun profil sélectionné</div>
          <div className="empty-state-text">Créez un profil dans l'onglet Famille.</div>
        </div>
      </div>
    )
  }

  if (loading) {
    return <div className="loading-page"><div className="spinner" /> Chargement...</div>
  }

  return (
    <div className="page">
      <div className="row row-between" style={{ marginBottom: 20 }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Médicaments</h1>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => { setEditingMed(null); setShowMedForm(true) }}
        >
          + Ajouter
        </button>
      </div>

      {medications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">💊</div>
          <div className="empty-state-title">Aucun médicament</div>
          <div className="empty-state-text">
            Ajoutez les médicaments de {activeProfile.name}.
          </div>
          <button
            className="btn btn-primary btn-lg"
            onClick={() => { setEditingMed(null); setShowMedForm(true) }}
          >
            + Ajouter un médicament
          </button>
        </div>
      ) : (
        <div className="stack stack-md">
          {medications.map((med) => (
            <MedicationCard
              key={med.id}
              medication={med}
              schedules={schedules.filter((s) => s.medication_id === med.id)}
              onEdit={() => { setEditingMed(med); setShowMedForm(true) }}
              onAddSchedule={() => setShowScheduleForm(med.id)}
            />
          ))}
        </div>
      )}

      {showMedForm && (
        <MedicationForm
          medication={editingMed}
          onClose={() => setShowMedForm(false)}
        />
      )}

      {showScheduleForm && (
        <ScheduleForm
          medicationId={showScheduleForm}
          onClose={() => setShowScheduleForm(null)}
        />
      )}
    </div>
  )
}
