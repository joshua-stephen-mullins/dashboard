import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import styles from './Navbar.module.css'

const TABS = [
  { to: '/soccer',   label: 'Soccer' },
  { to: '/recipes',  label: 'Recipes' },
  { to: '/stocks',   label: 'Stocks' },
  { to: '/calendar', label: 'Calendar' },
]

export default function Navbar() {
  const { logout } = useAuth()

  return (
    <nav className={styles.nav}>
      <span className={styles.brand}>Dashboard</span>
      <ul className={styles.tabs}>
        {TABS.map(({ to, label }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) => isActive ? `${styles.tab} ${styles.active}` : styles.tab}
            >
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
      <button className={styles.logout} onClick={logout}>Sign out</button>
    </nav>
  )
}
