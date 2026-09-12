import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import StatCard from '../../components/StatCard.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import Avatar from '../../components/Avatar.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useData } from '../../context/DataContext.jsx'
import { useL10n } from '../../i18n/LanguageContext.jsx'
import {
  classById,
  classOnDate,
  lastSessionOnOrBefore,
  startOfWeek,
  teacherClasses,
  todayISO,
  userById,
} from '../../utils/helpers.js'
import { missingToday, summarize } from '../../utils/stats.js'

export default function TeacherOverview() {
  const { currentUser } = useAuth()
  const { users, classes, records } = useData()
  const { t, formatDate, className, roomLabel } = useL10n()

  const myClasses = useMemo(
    () => teacherClasses(classes, currentUser.id),
    [classes, currentUser.id],
  )

  const studentIds = useMemo(
    () => [...new Set(myClasses.flatMap((c) => c.studentIds))],
    [myClasses],
  )

  const today = todayISO()
  const weekStart = startOfWeek(today)

  const weekRecords = useMemo(
    () =>
      records.filter(
        (r) =>
          r.date >= weekStart &&
          r.date <= today &&
          myClasses.some((c) => c.id === r.classId),
      ),
    [records, weekStart, today, myClasses],
  )
  const weekSummary = summarize(weekRecords)

  const myRecords = useMemo(
    () => records.filter((r) => myClasses.some((c) => c.id === r.classId)),
    [records, myClasses],
  )

  const pending = useMemo(() => {
    return myClasses
      .map((klass) => {
        const date = lastSessionOnOrBefore(klass, today)
        const missing = date ? missingToday(klass, records, date) : 0
        return { klass, date, missing }
      })
      .filter((p) => p.missing > 0)
  }, [myClasses, records, today])

  const todayClasses = useMemo(
    () => myClasses.filter((c) => classOnDate(c, today)),
    [myClasses, today],
  )

  const latest = useMemo(() => {
    return [...myRecords]
      .sort((a, b) => (a.date === b.date ? (a.id < b.id ? 1 : -1) : a.date < b.date ? 1 : -1))
      .slice(0, 8)
  }, [myRecords])

  const homeLink = (klassId, date) =>
    `/teacher/attendance?class=${klassId}&date=${date}`

  const sep = t('overview.scheduleJoin')

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">
          {new Date().getHours() < 12
            ? t('overview.greetingMorning', { name: currentUser.firstName })
            : t('overview.greetingAfternoon', { name: currentUser.firstName })}
        </h1>
        <p className="page-desc">
          {t('overview.todayLine', {
            date: formatDate(today),
            classes: myClasses.length,
            students: studentIds.length,
          })}
        </p>
      </div>

      {pending.length > 0 ? (
        <div className="alert alert-warning">
          <div style={{ flex: 1 }}>
            <strong>{t('overview.attendancePending')}</strong>
            <div style={{ marginTop: 4 }}>
              {pending.map((p) => (
                <div key={p.klass.id} style={{ marginTop: 2 }}>
                  <Link to={homeLink(p.klass.id, p.date)}>
                    {className(p.klass.id)}
                  </Link>{' '}
                  {'\u2014'}{' '}
                  {t('overview.stillUnmarked', {
                    missing: p.missing,
                    total: p.klass.studentIds.length,
                    date: formatDate(p.date),
                  })}
                </div>
              ))}
            </div>
          </div>
          <Link to="/teacher/attendance" className="btn btn-sm">
            {t('overview.takeAttendanceLink')}
          </Link>
        </div>
      ) : null}

      <div className="stat-grid">
        <StatCard
          label={t('overview.statStudents')}
          value={studentIds.length}
          foot={t('overview.footAcrossClasses', { n: myClasses.length })}
        />
        <StatCard
          label={t('overview.statWeekRate')}
          value={weekSummary.rate == null ? '\u2014' : `${weekSummary.rate}%`}
          tone="blue"
          foot={t('overview.footAttendedOf', {
            attended: weekSummary.present + weekSummary.late,
            total: weekSummary.total,
          })}
        />
        <StatCard
          label={t('overview.statLate')}
          value={weekSummary.late}
          tone="amber"
          foot={t('overview.footThisWeek')}
        />
        <StatCard
          label={t('overview.statAbsent')}
          value={weekSummary.absent}
          tone="red"
          foot={t('overview.footThisWeek')}
        />
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">{t('overview.todayClasses')}</div>
              <div className="card-sub">{formatDate(today)}</div>
            </div>
          </div>
          {todayClasses.length === 0 ? (
            <div className="empty">
              {t('overview.noTodayClasses')}{' '}
              <Link to="/teacher/attendance">
                {t('overview.takeAttendanceLink')}
              </Link>
            </div>
          ) : (
            todayClasses.map((klass) => {
              const marked =
                klass.studentIds.length - missingToday(klass, records, today)
              return (
                <div className="list-row" key={klass.id}>
                  <div className="list-row-main">
                    <div className="list-row-title">{className(klass.id)}</div>
                    <div className="list-row-sub">
                      {klass.schedule
                        .map((s) => `${s.start}\u2013${s.end}`)
                        .join(` ${sep} `)}{' '}
                      {sep} {roomLabel(klass.room)}
                    </div>
                  </div>
                  <span className="timespan">
                    {t('overview.markedCount', {
                      marked,
                      total: klass.studentIds.length,
                    })}
                  </span>
                  <Link to={homeLink(klass.id, today)} className="btn btn-sm">
                    {t('overview.mark')}
                  </Link>
                </div>
              )
            })
          )}
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">{t('overview.latestAttendance')}</div>
              <div className="card-sub">{t('overview.mostRecent')}</div>
            </div>
            <Link to="/teacher/history" className="btn btn-sm">
              {t('overview.viewAll')}
            </Link>
          </div>
          {latest.length === 0 ? (
            <div className="empty">{t('overview.noRecordsYet')}</div>
          ) : (
            latest.map((r) => {
              const student = userById(users, r.studentId)
              const klass = classById(classes, r.classId)
              return (
                <div className="list-row" key={r.id}>
                  <Avatar user={student} size="sm" />
                  <div className="list-row-main">
                    <div className="list-row-title">
                      {student.firstName} {student.lastName}
                    </div>
                    <div className="list-row-sub">
                      {className(klass.id)} &middot; {formatDate(r.date)}
                    </div>
                  </div>
                  <div className="timespan">
                    {r.arrivalTime
                      ? t('overview.arrived', { time: r.arrivalTime })
                      : ''}
                    {r.arrivalTime && r.departureTime ? ' \u00B7 ' : ''}
                    {r.departureTime
                      ? t('overview.left', { time: r.departureTime })
                      : ''}
                  </div>
                  <StatusBadge status={r.status} />
                </div>
              )
            })
          )}
        </div>
      </div>
    </>
  )
}