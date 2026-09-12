import { useMemo, useState } from 'react'
import StatusBadge from '../../components/StatusBadge.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useData } from '../../context/DataContext.jsx'
import { useL10n } from '../../i18n/LanguageContext.jsx'
import { classById, startOfMonth, todayISO } from '../../utils/helpers.js'

const PAGE_SIZE = 60

export default function StudentHistory() {
  const { currentUser } = useAuth()
  const { classes, records } = useData()
  const { t, formatDate, formatMonthYear, className } = useL10n()
  const today = todayISO()

  const myRecords = useMemo(
    () =>
      records
        .filter((r) => r.studentId === currentUser.id)
        .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [records, currentUser.id],
  )

  const myClasses = useMemo(
    () => classes.filter((c) => c.studentIds.includes(currentUser.id)),
    [classes, currentUser.id],
  )

  const availableMonths = useMemo(() => {
    const months = new Set(myRecords.map((r) => r.date.slice(0, 7)))
    return [...months].sort((a, b) => (a < b ? 1 : -1))
  }, [myRecords])

  const [classId, setClassId] = useState('all')
  const [status, setStatus] = useState('all')
  const [month, setMonth] = useState('all')
  const [limit, setLimit] = useState(PAGE_SIZE)

  const filtered = useMemo(() => {
    const list = myRecords.filter((r) => {
      if (classId !== 'all' && r.classId !== classId) return false
      if (status !== 'all' && r.status !== status) return false
      if (month !== 'all' && r.date.slice(0, 7) !== month) return false
      return true
    })
    return list.slice(0, limit)
  }, [myRecords, classId, status, month, limit])

  const summary = useMemo(() => {
    const byMonth = {}
    for (const r of myRecords) {
      const key = r.date.slice(0, 7)
      byMonth[key] ??= { present: 0, late: 0, absent: 0 }
      byMonth[key][r.status] += 1
    }
    return byMonth
  }, [myRecords])

  const defaults = startOfMonth(today)

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">{t('nav.myHistory')}</h1>
        <p className="page-desc">{t('studentHistory.desc')}</p>
      </div>

      <div className="filters">
        <div className="field">
          <label className="field-label" htmlFor="myhist-class">
            {t('common.class')}
          </label>
          <select
            id="myhist-class"
            value={classId}
            onChange={(e) => {
              setClassId(e.target.value)
              setLimit(PAGE_SIZE)
            }}
          >
            <option value="all">{t('common.allClasses')}</option>
            {myClasses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} &mdash; {className(c.id)}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="field-label" htmlFor="myhist-status">
            {t('common.status')}
          </label>
          <select
            id="myhist-status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              setLimit(PAGE_SIZE)
            }}
          >
            <option value="all">{t('common.allStatuses')}</option>
            <option value="present">{t('common.statusPresent')}</option>
            <option value="late">{t('common.statusLate')}</option>
            <option value="absent">{t('common.statusAbsent')}</option>
          </select>
        </div>
        <div className="field">
          <label className="field-label" htmlFor="myhist-month">
            {t('studentHistory.monthFilter')}
          </label>
          <select
            id="myhist-month"
            value={month}
            onChange={(e) => {
              setMonth(e.target.value)
              setLimit(PAGE_SIZE)
            }}
          >
            <option value="all">{t('common.allMonths')}</option>
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                {formatMonthYear(`${m}-01`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <div className="card-title">
              {t('history.records')}{' '}
              <span className="muted" style={{ fontWeight: 500 }}>
                ({t('studentHistory.recordsShown', { n: filtered.length })})
              </span>
            </div>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t('common.date')}</th>
                <th>{t('common.class')}</th>
                <th>{t('common.status')}</th>
                <th>{t('common.arrival')}</th>
                <th>{t('common.departure')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="5">
                    <div className="empty">{t('studentHistory.noMatch')}</div>
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const k = classById(classes, r.classId)
                  return (
                    <tr key={r.id}>
                      <td className="cell-muted" style={{ whiteSpace: 'nowrap' }}>
                        {formatDate(r.date)}
                      </td>
                      <td style={{ fontWeight: 550 }}>{className(k.id)}</td>
                      <td>
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="cell-muted">{r.arrivalTime || '\u2014'}</td>
                      <td className="cell-muted">{r.departureTime || '\u2014'}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {myRecords.length > limit ? (
          <div className="hstack" style={{ marginTop: 14, justifyContent: 'center' }}>
            <button
              type="button"
              className="btn"
              onClick={() => setLimit((l) => l + PAGE_SIZE)}
            >
              {t('common.showMore')}
            </button>
          </div>
        ) : null}
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <div className="card-title">{t('studentHistory.monthlySummary')}</div>
            <div className="card-sub">
              {t('studentHistory.fromText', { month: formatMonthYear(defaults) })}
            </div>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t('common.month')}</th>
                <th>{t('common.statusPresent')}</th>
                <th>{t('common.statusLate')}</th>
                <th>{t('common.statusAbsent')}</th>
                <th className="cell-right">{t('common.attendance')}</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(summary)
                .sort((a, b) => (a[0] < b[0] ? 1 : -1))
                .map(([key, s]) => {
                  const total = s.present + s.late + s.absent
                  const rate = total ? Math.round(((s.present + s.late) / total) * 100) : 0
                  return (
                    <tr key={key}>
                      <td style={{ fontWeight: 600 }}>
                        {formatMonthYear(`${key}-01`)}
                      </td>
                      <td className="cell-muted">{s.present}</td>
                      <td className="cell-muted">{s.late}</td>
                      <td className="cell-muted">{s.absent}</td>
                      <td className="cell-right" style={{ fontWeight: 650 }}>
                        {rate}%
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}