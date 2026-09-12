import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import Icon from './Icon.jsx'
import Avatar from './Avatar.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useL10n } from '../i18n/LanguageContext.jsx'
import { LANGUAGE_OPTIONS } from '../i18n/translations.js'

const TEACHER_NAV = [
  { to: '/teacher', labelKey: 'nav.dashboard', icon: 'grid', end: true },
  { to: '/teacher/classes', labelKey: 'nav.students', icon: 'users' },
  { to: '/teacher/attendance', labelKey: 'nav.takeAttendance', icon: 'check-square' },
  { to: '/teacher/history', labelKey: 'nav.history', icon: 'history' },
  { to: '/teacher/stats', labelKey: 'nav.statistics', icon: 'chart' },
]

const STUDENT_NAV = [
  { to: '/student', labelKey: 'nav.dashboard', icon: 'grid', end: true },
  { to: '/student/history', labelKey: 'nav.myHistory', icon: 'history' },
  { to: '/student/stats', labelKey: 'nav.statistics', icon: 'chart' },
]

function Sidebar({ nav, user, onNavigate }) {
  const { logout } = useAuth()
  const { t } = useL10n()
  const navigate = useNavigate()

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-logo">
          <Icon name="school" size={18} />
        </span>
        <div>
          <div className="brand-name">{t('brand.appName')}</div>
          <div className="brand-sub">{t('brand.schoolName')}</div>
        </div>
      </div>

      <nav className="nav">
        <div className="nav-label">{t('common.menu')}</div>
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            onClick={onNavigate}
          >
            <span className="nav-ico">
              <Icon name={item.icon} size={16} />
            </span>
            {t(item.labelKey)}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-user">
        <Avatar user={user} size="sm" />
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">
            {user.firstName} {user.lastName}
          </div>
          <div className="sidebar-user-role">
            {user.role === 'teacher' ? t('common.teacher') : t('common.student')}
          </div>
        </div>
        <button
          type="button"
          className="logout-btn"
          title={t('nav.signOut')}
          aria-label={t('nav.signOut')}
          onClick={() => {
            logout()
            navigate('/login')
          }}
        >
          <Icon name="logout" size={17} />
        </button>
      </div>
    </aside>
  )
}

export default function Layout({ role }) {
  const { currentUser } = useAuth()
  const { t, lang, setLang } = useL10n()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const nav = role === 'teacher' ? TEACHER_NAV : STUDENT_NAV
  const active = nav.find((item) =>
    item.end
      ? location.pathname === item.to
      : location.pathname.startsWith(item.to),
  )
  const title = active ? t(active.labelKey) : t('nav.dashboard')

  return (
    <div className="app">
      {menuOpen ? (
        <div className="sidebar-overlay" onClick={() => setMenuOpen(false)} />
      ) : null}
      <div className={`sidebar${menuOpen ? ' open' : ''}`}>
        <Sidebar
          nav={nav}
          user={currentUser}
          onNavigate={() => setMenuOpen(false)}
        />
      </div>

      <div className="main">
        <header className="topbar">
          <button
            type="button"
            className="icon-btn menu-btn"
            aria-label={t('common.menu')}
            onClick={() => setMenuOpen(true)}
          >
            <Icon name="menu" size={18} />
          </button>
          <div className="topbar-title">{title}</div>
          <div className="topbar-spacer" />
          <select
            className="lang-select"
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            aria-label={t('login.language')}
          >
            {LANGUAGE_OPTIONS.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
          <div className="user-chip">
            <Avatar user={currentUser} size="sm" />
          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}