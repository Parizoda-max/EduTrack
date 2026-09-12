import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../components/Icon.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { useL10n } from '../i18n/LanguageContext.jsx'
import { LANGUAGE_OPTIONS } from '../i18n/translations.js'

export default function Login() {
  const { login } = useAuth()
  const { toast } = useToast()
  const { t, lang, setLang } = useL10n()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const demoAccounts = [
    {
      name: 'Sarah Mitchell',
      role: t('login.roleTeacher', {
        subject: t('login.subjectComputerScience'),
      }),
      username: 'sarah.mitchell',
      password: 'sarah123',
    },
    {
      name: 'James Rodriguez',
      role: t('login.roleTeacher', { subject: t('login.subjectEnglish') }),
      username: 'james.rodriguez',
      password: 'james123',
    },
    {
      name: 'Alex Turner',
      role: t('login.roleStudent', { grade: t('common.grade', { n: 10 }) }),
      username: 'alex.turner',
      password: 'alex123',
    },
  ]

  const homeFor = (role) => (role === 'teacher' ? '/teacher' : '/student')

  const handleSubmit = (e) => {
    e.preventDefault()
    const result = login(username, password)
    if (!result.ok) {
      setError(t('login.error'))
      return
    }
    toast(t('login.welcomeBack', { name: result.user.firstName }))
    navigate(homeFor(result.user.role), { replace: true })
  }

  const fillDemo = (demo) => {
    setUsername(demo.username)
    setPassword(demo.password)
    setError('')
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-brand">
          <span className="brand-logo">
            <Icon name="school" size={20} />
          </span>
          <div>
            <div className="login-title">
              {t('login.greetingTitle', { app: t('brand.appName') })}
            </div>
            <div className="login-sub">{t('brand.schoolName')}</div>
          </div>
        </div>

        {error ? (
          <div className="alert alert-error" style={{ marginTop: 0 }}>
            <span>{error}</span>
          </div>
        ) : null}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="field">
            <label className="field-label" htmlFor="username">
              {t('login.username')}
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              placeholder={t('login.usernamePlaceholder')}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="password">
              {t('login.password')}
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder={t('login.passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block">
            {t('login.signIn')}
          </button>
        </form>

        <div className="demo-box">
          <div className="hstack" style={{ justifyContent: 'space-between' }}>
            <div className="demo-title">{t('login.demoTitle')}</div>
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
          </div>
          {demoAccounts.map((demo) => (
            <button
              key={demo.username}
              type="button"
              className="demo-user"
              onClick={() => fillDemo(demo)}
            >
              <span style={{ flex: 1 }}>
                <strong>{demo.name}</strong>
                <span className="muted" style={{ fontSize: 12, display: 'block' }}>
                  {demo.role}
                </span>
              </span>
              <span className="demo-user-code">
                {demo.username} / {demo.password}
              </span>
            </button>
          ))}
          <div className="faint" style={{ fontSize: 12, marginTop: 6 }}>
            {t('login.demoHint', { username: 'first.last', password: 'first123' })}
          </div>
        </div>
      </div>
    </div>
  )
}