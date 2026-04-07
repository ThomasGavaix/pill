import { NavLink } from 'react-router-dom'
import './BottomNav.css'

const NAV_ITEMS = [
  { to: '/', icon: '📅', label: "Aujourd'hui" },
  { to: '/medications', icon: '💊', label: 'Médicaments' },
  { to: '/prescriptions', icon: '📋', label: 'Ordonnances' },
  { to: '/profiles', icon: '👨‍👩‍👧', label: 'Famille' },
  { to: '/settings', icon: '⚙️', label: 'Réglages' },
]

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map(({ to, icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `bottom-nav-item${isActive ? ' bottom-nav-item--active' : ''}`
          }
        >
          <span className="bottom-nav-icon">{icon}</span>
          <span className="bottom-nav-label">{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
