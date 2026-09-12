import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { toDate } from '../utils/helpers.js'
import {
  DAY_FULL,
  DAY_SHORT,
  messages,
  MONTH_FULL,
  MONTH_SHORT,
} from './translations.js'

const LanguageContext = createContext(null)
const LANG_KEY = 'edutrack_lang'

function readStoredLang() {
  try {
    const value = localStorage.getItem(LANG_KEY)
    if (value === 'uz' || value === 'en') return value
  } catch {
    /* ignore */
  }
  return 'uz'
}

function lookup(messageSource, lang, key) {
  let str = messageSource[lang]?.[key]
  if (str === undefined) str = messageSource.en?.[key]
  return str
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(readStoredLang)

  useEffect(() => {
    try {
      localStorage.setItem(LANG_KEY, lang)
    } catch {
      /* ignore */
    }
    document.documentElement.lang = lang
  }, [lang])

  const t = useCallback(
    (key, vars) => {
      let str = lookup(messages, lang, key)
      if (str === undefined) return key
      if (vars) {
        str = str.replace(
          /\{(\w+)\}/g,
          (match, name) =>
            vars[name] !== undefined && vars[name] !== null
              ? String(vars[name])
              : match,
        )
      }
      return str
    },
    [lang],
  )

  const formatDate = useCallback(
    (iso) => {
      const d = toDate(iso)
      return `${DAY_SHORT[lang][d.getDay()]}, ${MONTH_SHORT[lang][d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
    },
    [lang],
  )

  const formatDateLong = useCallback(
    (iso) => {
      const d = toDate(iso)
      return `${DAY_FULL[lang][d.getDay()]}, ${MONTH_SHORT[lang][d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
    },
    [lang],
  )

  const formatDateShort = useCallback(
    (iso) => {
      const d = toDate(iso)
      return `${MONTH_SHORT[lang][d.getMonth()]} ${d.getDate()}`
    },
    [lang],
  )

  const formatMonthYear = useCallback(
    (ym) => {
      const parts = ym.split('-')
      const month = Number(parts[1])
      const year = parts[0]
      return `${MONTH_FULL[lang][month - 1]} ${year}`
    },
    [lang],
  )

  const className = useCallback(
    (id) => lookup(messages, lang, `classes.${id}`) ?? id,
    [lang],
  )

  const roomLabel = useCallback(
    (room) => {
      const match = /^Room\s+(\d+)$/i.exec(room)
      if (match) return lookup(messages, lang, 'common.room')?.replace('{n}', match[1])
      return room
    },
    [lang],
  )

  const gradeLabel = useCallback(
    (grade) => {
      const digits = String(grade).match(/\d+/)
      if (digits) {
        const label = lookup(messages, lang, 'common.grade')
        return label ? label.replace('{n}', digits[0]) : grade
      }
      return grade
    },
    [lang],
  )

  const value = {
    lang,
    setLang,
    t,
    formatDate,
    formatDateShort,
    formatDateLong,
    formatMonthYear,
    className,
    roomLabel,
    gradeLabel,
  }

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  )
}

export function useL10n() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useL10n must be used within LanguageProvider')
  return ctx
}