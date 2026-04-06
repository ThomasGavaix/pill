import { useApp } from '../../contexts/AppContext'
import './Header.css'

export default function Header() {
  const { activeProfile } = useApp()

  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-brand">
          <span className="header-logo">💊</span>
          <span className="header-title">PilulierFamille</span>
        </div>
        {activeProfile && (
          <div className="header-profile">
            <span
              className="header-avatar"
              style={{ background: activeProfile.avatar_color }}
            >
              {activeProfile.avatar_emoji}
            </span>
            <span className="header-profile-name">{activeProfile.name}</span>
          </div>
        )}
      </div>
    </header>
  )
}
