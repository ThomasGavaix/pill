import { useState } from 'react'
import { useApp } from '../../contexts/AppContext'
import './ProfileCard.css'

export default function ProfileCard({ profile, isActive, onSelect, onEdit }) {
  const { deleteProfile, medications, schedules } = useApp()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const medCount = medications.length
  const schedCount = schedules.length

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteProfile(profile.id)
    } catch (err) {
      console.error(err)
      setDeleting(false)
    }
  }

  return (
    <div className={`profile-card card ${isActive ? 'profile-card--active' : ''}`}>
      <div className="profile-card-main">
        <button className="profile-select-area" onClick={onSelect}>
          <div
            className="profile-avatar"
            style={{ background: profile.avatar_color }}
          >
            {profile.avatar_emoji}
          </div>
          <div className="profile-details">
            <div className="profile-name">{profile.name}</div>
            {isActive && (
              <div className="profile-stats">
                {medCount} médicament{medCount !== 1 ? 's' : ''} · {schedCount} horaire{schedCount !== 1 ? 's' : ''}
              </div>
            )}
          </div>
          {isActive && (
            <span className="badge badge-blue">Actif</span>
          )}
        </button>

        <div className="profile-actions">
          <button className="btn btn-icon btn-sm" onClick={onEdit} title="Modifier">✏️</button>
          <button
            className="btn btn-icon btn-sm"
            style={{ color: 'var(--red-500)' }}
            onClick={() => setConfirmDelete(true)}
            title="Supprimer"
          >
            🗑️
          </button>
        </div>
      </div>

      {confirmDelete && (
        <div className="profile-confirm">
          <p>Supprimer <strong>{profile.name}</strong> et tous ses médicaments ?</p>
          <div className="row row-gap-sm" style={{ marginTop: 12 }}>
            <button
              className="btn btn-danger btn-sm"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? '...' : 'Supprimer'}
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setConfirmDelete(false)}
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
