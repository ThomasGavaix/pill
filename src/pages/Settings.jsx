import { useState, useEffect } from 'react'
import { useApp } from '../contexts/AppContext'
import { useAuth } from '../contexts/AuthContext'
import { subscribeToPush, unsubscribeFromPush, isSubscribed } from '../lib/push'
import './Settings.css'

export default function Settings() {
  const { activeProfile } = useApp()
  const { user, signOut } = useAuth()
  const [pushEnabled, setPushEnabled] = useState(false)
  const [pushLoading, setPushLoading] = useState(false)
  const [pushError, setPushError] = useState(null)
  const [pushSuccess, setPushSuccess] = useState(null)

  useEffect(() => {
    isSubscribed().then(setPushEnabled)
  }, [])

  async function handleTogglePush() {
    setPushLoading(true)
    setPushError(null)
    setPushSuccess(null)
    try {
      if (pushEnabled) {
        await unsubscribeFromPush(activeProfile?.id)
        setPushEnabled(false)
        setPushSuccess('Notifications désactivées.')
      } else {
        await subscribeToPush(activeProfile?.id)
        setPushEnabled(true)
        setPushSuccess('Notifications activées ! Vous recevrez des rappels.')
      }
    } catch (err) {
      setPushError(err.message)
    } finally {
      setPushLoading(false)
    }
  }

  const pushSupported = 'serviceWorker' in navigator && 'PushManager' in window

  return (
    <div className="page">
      <h1 className="page-title">Réglages</h1>

      {/* Notifications section */}
      <div className="section">
        <div className="section-title">Notifications</div>
        <div className="card">
          {!pushSupported ? (
            <div className="alert alert-info" style={{ margin: 0 }}>
              Les notifications push ne sont pas supportées par votre navigateur.
            </div>
          ) : (
            <>
              <div className="settings-row">
                <div className="settings-info">
                  <div className="settings-label">Rappels médicaments</div>
                  <div className="settings-desc">
                    Recevez une notification aux heures programmées
                  </div>
                </div>
                <button
                  className={`toggle ${pushEnabled ? 'toggle--on' : ''}`}
                  onClick={handleTogglePush}
                  disabled={pushLoading || !activeProfile}
                  aria-label={pushEnabled ? 'Désactiver les notifications' : 'Activer les notifications'}
                >
                  <span className="toggle-thumb" />
                </button>
              </div>

              {pushError && (
                <div className="alert alert-error" style={{ marginTop: 12, marginBottom: 0 }}>
                  {pushError}
                </div>
              )}
              {pushSuccess && (
                <div className="alert alert-success" style={{ marginTop: 12, marginBottom: 0 }}>
                  {pushSuccess}
                </div>
              )}

              {!activeProfile && (
                <div className="alert alert-info" style={{ marginTop: 12, marginBottom: 0 }}>
                  Sélectionnez un profil pour activer les notifications.
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* About section */}
      <div className="section">
        <div className="section-title">À propos</div>
        <div className="card stack stack-sm">
          <div className="settings-row">
            <span className="settings-label">Application</span>
            <span className="settings-value">PilulierFamille</span>
          </div>
          <div className="divider" />
          <div className="settings-row">
            <span className="settings-label">Version</span>
            <span className="settings-value">1.0.0</span>
          </div>
          <div className="divider" />
          <div className="settings-row">
            <span className="settings-label">Stockage</span>
            <span className="settings-value">Supabase</span>
          </div>
        </div>
      </div>

      {/* Compte */}
      <div className="section">
        <div className="section-title">Compte</div>
        <div className="card">
          <div className="settings-row" style={{ marginBottom: 16 }}>
            <div className="settings-info">
              <div className="settings-label">Connecté en tant que</div>
              <div className="settings-desc">{user?.email}</div>
            </div>
          </div>
          <button className="btn btn-danger btn-full" onClick={signOut}>
            Se déconnecter
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="section">
        <div className="section-title">Installer l'application</div>
        <div className="card">
          <p style={{ fontSize: 'var(--font-base)', color: 'var(--gray-600)', lineHeight: 1.7 }}>
            Pour installer PilulierFamille sur votre téléphone :<br />
            <strong>iPhone :</strong> Appuyez sur <strong>Partager</strong> puis <strong>"Sur l'écran d'accueil"</strong><br />
            <strong>Android :</strong> Appuyez sur le menu <strong>⋮</strong> puis <strong>"Ajouter à l'écran d'accueil"</strong>
          </p>
        </div>
      </div>
    </div>
  )
}
