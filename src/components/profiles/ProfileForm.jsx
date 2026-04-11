import { useState } from 'react'
import { useApp } from '../../contexts/AppContext'

const COLORS = [
  '#2563eb', '#7c3aed', '#db2777', '#dc2626',
  '#ea580c', '#ca8a04', '#16a34a', '#0891b2',
]

const EMOJIS = ['👴', '👵', '👨', '👩', '🧑', '👦', '👧', '🧒', '👶', '🧓']

export default function ProfileForm({ profile, onClose }) {
  const { createProfile, updateProfile, switchProfile } = useApp()
  const [name, setName] = useState(profile?.name || '')
  const [color, setColor] = useState(profile?.avatar_color || '#2563eb')
  const [emoji, setEmoji] = useState(profile?.avatar_emoji || '👤')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError(null)
    try {
      if (profile) {
        await updateProfile(profile.id, {
          name: name.trim(),
          avatar_color: color,
          avatar_emoji: emoji,
        })
      } else {
        const newProfile = await createProfile({
          name: name.trim(),
          avatar_color: color,
          avatar_emoji: emoji,
        })
        switchProfile(newProfile)
      }
      onClose()
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-handle" />
        <h2 className="modal-title">
          {profile ? 'Modifier le profil' : 'Nouveau profil'}
        </h2>

        {error && (
          <div className="alert alert-error" style={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem', wordBreak: 'break-all' }}>
            {error}
          </div>
        )}

        {/* Preview */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <div
            style={{
              width: 80, height: 80,
              borderRadius: '50%',
              background: color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2.5rem',
            }}
          >
            {emoji}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="stack stack-md">
          <div className="form-group">
            <label htmlFor="profile-name">Prénom</label>
            <input
              id="profile-name"
              type="text"
              placeholder="ex: Grand-mère, Papa..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Avatar</label>
            <div className="emoji-grid">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  className={`emoji-btn ${emoji === e ? 'selected' : ''}`}
                  onClick={() => setEmoji(e)}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Couleur</label>
            <div className="color-grid">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`color-dot ${color === c ? 'selected' : ''}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>

          <div className="stack stack-sm" style={{ marginTop: 8 }}>
            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={saving}>
              {saving ? 'Enregistrement...' : profile ? 'Enregistrer' : 'Créer le profil'}
            </button>
            <button type="button" className="btn btn-ghost btn-full" onClick={onClose}>
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
