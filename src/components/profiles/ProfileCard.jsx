import { useState } from 'react'
import { useApp } from '../../contexts/AppContext'
import './ProfileCard.css'

export default function ProfileCard({ profile, isActive, onSelect, onEdit }) {
  const { deleteProfile, medications, schedules } = useApp()
  const [sheet, setSheet] = useState(null) // null | 'actions' | 'delete'
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

  function handleRowTap() {
    if (isActive) {
      setSheet('actions')
    } else {
      onSelect()
    }
  }

  return (
    <>
      <button className={`profile-row ${isActive ? 'profile-row--active' : ''}`} onClick={handleRowTap}>
        <div className="profile-avatar" style={{ background: profile.avatar_color }}>
          {profile.avatar_emoji}
        </div>
        <div className="profile-row-info">
          <span className="profile-row-name">{profile.name}</span>
          {isActive && (
            <span className="profile-row-stats">
              {medCount} médicament{medCount !== 1 ? 's' : ''} · {schedCount} horaire{schedCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        {isActive
          ? <span className="badge badge-blue">Actif</span>
          : <span className="profile-row-hint">Sélectionner</span>
        }
        <span className="med-row-chevron">›</span>
      </button>

      {sheet && (
        <div className="action-sheet-overlay" onClick={() => setSheet(null)}>
          <div className="action-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="action-sheet-title">{profile.name}</div>

            {sheet === 'actions' && (
              <>
                <button className="action-sheet-btn" onClick={() => { setSheet(null); onEdit() }}>
                  ✏️ Modifier
                </button>
                <button className="action-sheet-btn action-sheet-btn--danger"
                  onClick={() => setSheet('delete')}>
                  🗑️ Supprimer
                </button>
              </>
            )}

            {sheet === 'delete' && (
              <>
                <p className="action-sheet-message">
                  Supprimer <strong>{profile.name}</strong> et tous ses médicaments ?
                </p>
                <button className="action-sheet-btn action-sheet-btn--danger"
                  onClick={handleDelete} disabled={deleting}>
                  {deleting ? '...' : 'Supprimer'}
                </button>
                <button className="action-sheet-btn" onClick={() => setSheet('actions')}>Annuler</button>
              </>
            )}

            <button className="action-sheet-cancel" onClick={() => setSheet(null)}>Fermer</button>
          </div>
        </div>
      )}
    </>
  )
}
