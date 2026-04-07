import './Login.css'
import { supabase } from '../lib/supabase'
import { useState } from 'react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSent(true)
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-logo">📬</div>
          <h1 className="login-title">Vérifiez vos emails</h1>
          <p className="login-subtitle">
            Un lien de connexion a été envoyé à<br />
            <strong>{email}</strong>
          </p>
          <p className="login-note">
            Cliquez sur le lien dans l'email pour accéder à l'application.<br />
            Le lien est valable 1 heure.
          </p>
          <button
            className="btn btn-ghost btn-full"
            style={{ marginTop: 24 }}
            onClick={() => setSent(false)}
          >
            Changer d'adresse email
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">💊</div>
        <h1 className="login-title">PilulierFamille</h1>
        <p className="login-subtitle">
          Entrez votre adresse email pour recevoir un lien de connexion
        </p>

        {error && (
          <div className="alert alert-error">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="stack stack-md">
          <div className="form-group">
            <label htmlFor="email">Adresse email</label>
            <input
              id="email"
              type="email"
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={loading}
          >
            {loading ? 'Envoi...' : 'Recevoir le lien de connexion'}
          </button>
        </form>

        <p className="login-note">
          Seuls les membres invités peuvent accéder à l'application.
        </p>
      </div>
    </div>
  )
}
