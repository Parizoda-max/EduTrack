import { useMemo, useState } from 'react'
import Avatar from '../../components/Avatar.jsx'
import ProgressBar from '../../components/ProgressBar.jsx'
import StatCard from '../../components/StatCard.jsx'
import WeekBars from '../../components/WeekBars.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useData } from '../../context/DataContext.jsx'
import { useL10n } from '../../i18n/LanguageContext.jsx'
import {
  startOfMonth,
  startOfWeek,
  teacherClasses,
  todayISO,
} from '../../utils/helpers.js'
import { rateTone, summarize } from '../../utils/stats.js'

function periodStart(endISO, period) {
  if (period === 'week') return startOfWeek(endISO)
  if (period === 'month') return startOfMonth(endISO)
  return null
}

export default function TeacherStats() {
  const { currentUser } = useAuth()
  const { users, classes, records } = useData()
  const { t, className } = useL10n()

  const myClasses = useMemo(
    () => teacherClasses(classes, currentUser.id),
    [classes, currentUser.id],
  )
  const today = todayISO()

  const [classId, setClassId] = useState(myClasses[0]?.id || '')
  const [period, setPeriod] = useState('month')

  const klass = classes.find((c) => c.id === classId)

  const classStudentIds = useMemo(() => klass?.studentIds || [], [klass])

  const periodRecords = useMemo(() => {
    if (!klass) return []
    const start = periodStart(today, period)
    const list = records.filter((r) => {
      if (r.classId !== klass.id) return false
      if (start && r.date < start) return false
      if (r.date > today) return false
      return true
    })
    return list
  }, [records, klass, period, today])

  const summary = summarize(periodRecords)

  const allRecords = useMemo(
    () => (klass ? records.filter((r) => r.classId === klass.id) : []),
    [records, klass],
  )

  const perStudent = useMemo(() => {
    return classStudentIds
      .map((id) => {
        const student = users.find((u) => u.id === id)
        const s = summarize(allRecords.filter((r) => r.studentId === id))
        return { student, ...s }
      })
      .sort((a, b) => b.rate - a.rate)
  }, [classStudentIds, allRecords, users])

  if (!klass) {
    return <div className="empty">{t('students.noClassesAssigned')}</div>
  }

  const periodFoot =
    period === 'week'
      ? t('stats.footThisWeek')
      : period === 'month'
        ? t('stats.footThisMonth')
        : t('stats.footAllTime')

  const outOf = t('stats.outOf', { n: summary.total || 0 })

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">{t('nav.statistics')}</h1>
        <p className="page-desc">{t('stats.desc')}</p>
      </div>

      <div className="filters">
        <div className="field">
          <label className="field-label" htmlFor="stats-class">
            {t('common.class')}
          </label>
          <select
            id="stats-class"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
          >
            {myClasses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} &mdash; {className(c.id)}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="field-label" htmlFor="stats-period">
            {t('stats.period')}
          </label>
          <select
            id="stats-period"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="week">{t('stats.thisWeek')}</option>
            <option value="month">{t('stats.thisMonth')}</option>
            <option value="all">{t('stats.allTime')}</option>
          </select>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard
          label={t('stats.attendanceRate')}
          value={summary.rate == null ? '\u2014' : `${summary.rate}%`}
          tone="blue"
          foot={periodFoot}
        />
        <StatCard
          label={t('stats.present')}
          value={summary.present}
          tone="green"
          foot={outOf}
        />
        <StatCard
          label={t('stats.late')}
          value={summary.late}
          tone="amber"
          foot={outOf}
        />
        <StatCard
          label={t('stats.absent')}
          value={summary.absent}
          tone="red"
          foot={outOf}
        />
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">{t('stats.weeklyTrend')}</div>
              <div className="card-sub">
                {t('stats.trendSub')} &middot; {className(klass.id)}
              </div>
            </div>
          </div>
          <WeekBars records={allRecords} />
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">{t('stats.studentsByAttendance')}</div>
              <div className="card-sub">
                {t('stats.allTimeRateFor', { class: className(klass.id) })}
              </div>
            </div>
          </div>
          {perStudent.length === 0 ? (
            <div className="empty">{t('stats.noStudentsInClass')}</div>
          ) : (
            perStudent.map((row) => (
              <div className="list-row" key={row.student.id}>
                <Avatar user={row.student} size="sm" />
                <div className="list-row-main">
                  <div className="list-row-title">
                    {row.student.firstName} {row.student.lastName}
                  </div>
                  <div className="list-row-sub">
                    {t('stats.breakdown', {
                      present: row.present,
                      late: row.late,
                      absent: row.absent,
                    })}
                  </div>
                </div>
                <div className="percent-row">
                  <div style={{ flex: 1, minWidth: 70 }}>
                    <ProgressBar value={row.rate} tone={rateTone(row.rate)} />
                  </div>
                  <span className="percent-label">
                    {row.rate == null ? '\u2014' : `${row.rate}%`}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}