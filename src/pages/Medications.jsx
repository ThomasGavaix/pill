import { useState } from 'react'
import { useApp } from '../contexts/AppContext'
import MedicationCard from '../components/medications/MedicationCard'
import MedicationForm from '../components/medications/MedicationForm'

export default function Medications() {
  const { activeProfile, medications, loading } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [editingMed, setEditingMed] = useState(null)

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

  if (loading) return <div className="loading-page"><div className="spinner" />Chargement...</div>

  return (
    <div className="page">
      <div className="row row-between" style={{ marginBottom: 20 }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Médicaments</h1>
        <button className="btn btn-primary btn-sm"
          onClick={() => { setEditingMed(null); setShowForm(true) }}>
          + Ajouter
        </button>
      </div>

      <div className="alert alert-info" style={{ marginBottom: 16 }}>
        Gérez votre stock ici. La posologie se définit dans <strong>Ordonnances</strong>.
      </div>

      {medications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">💊</div>
          <div className="empty-state-title">Aucun médicament</div>
          <div className="empty-state-text">Ajoutez les médicaments de {activeProfile.name}.</div>
          <button className="btn btn-primary btn-lg"
            onClick={() => { setEditingMed(null); setShowForm(true) }}>
            + Ajouter un médicament
          </button>
        </div>
      ) : (
        <div className="ios-list">
          {medications.map((med) => (
            <MedicationCard key={med.id} medication={med}
              onEdit={() => { setEditingMed(med); setShowForm(true) }} />
          ))}
        </div>
      )}

      {showForm && (
        <MedicationForm medication={editingMed} onClose={() => setShowForm(false)} />
      )}
    </div>
  )
}
