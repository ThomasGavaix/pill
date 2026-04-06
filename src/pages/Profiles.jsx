import { useState } from 'react'
import { useApp } from '../contexts/AppContext'
import ProfileCard from '../components/profiles/ProfileCard'
import ProfileForm from '../components/profiles/ProfileForm'

export default function Profiles() {
  const { profiles, activeProfile, switchProfile, loading } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [editingProfile, setEditingProfile] = useState(null)

  if (loading) {
    return <div className="loading-page"><div className="spinner" /> Chargement...</div>
  }

  return (
    <div className="page">
      <div className="row row-between" style={{ marginBottom: 20 }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Famille</h1>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => { setEditingProfile(null); setShowForm(true) }}
        >
          + Ajouter
        </button>
      </div>

      {profiles.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👨‍👩‍👧</div>
          <div className="empty-state-title">Aucun profil créé</div>
          <div className="empty-state-text">
            Créez un profil pour chaque membre de la famille.
          </div>
          <button
            className="btn btn-primary btn-lg"
            onClick={() => { setEditingProfile(null); setShowForm(true) }}
          >
            + Créer un profil
          </button>
        </div>
      ) : (
        <div className="stack stack-md">
          {profiles.map((profile) => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              isActive={activeProfile?.id === profile.id}
              onSelect={() => switchProfile(profile)}
              onEdit={() => { setEditingProfile(profile); setShowForm(true) }}
            />
          ))}
        </div>
      )}

      {showForm && (
        <ProfileForm
          profile={editingProfile}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  )
}
