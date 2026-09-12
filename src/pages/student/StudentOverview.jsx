import { useMemo } from 'react'
import StatusBadge from '../../components/StatusBadge.jsx'
import ProgressBar from '../../components/ProgressBar.jsx'
import StatCard from '../../components/StatCard.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useData } from '../../context/DataContext.jsx'
import { useL10n } from '../../i18n/LanguageContext.jsx'
import { classById, classOnDate, todayISO } from '../../utils/helpers.js'
import { rateTone, summarize } from '../../utils/stats.js'

export default function StudentOverview() {
  const { currentUser } = useAuth()
  const { classes, records } = useData()
  const { t, formatDate, formatDateLong, className, roomLabel } = useL10n()

  const today = todayISO()

  const myRecords = useMemo(
    () => records.filter((r) => r.studentId === currentUser.id),
    [records, currentUser.id],
  )

  const myClasses = useMemo(() => {
    return classes.filter((c) => c.studentIds.includes(currentUser.id))
  }, [classes, currentUser.id])

  const summary = summarize(myRecords)

  const todayClasses = useMemo(
    () => myClasses.filter((c) => classOnDate(c, today)),
    [myClasses, today],
  )

  const todayRecords = useMemo(() => {
    return todayClasses.map((c) => {
      const rec = myRecords.find((r) => r.classId === c.id && r.date === today)
      return { klass: c, record: rec || null }
    })
  }, [todayClasses, myRecords, today])

  const perClass = useMemo(() => {
    return myClasses.map((c) => {
      const s = summarize(myRecords.filter((r) => r.classId === c.id))
      return { klass: c, ...s }
    })
  }, [myClasses, myRecords])

  const recent = useMemo(
    () =>
      [...myRecords]
        .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
        .slice(0, 6),
    [myRecords],
  )

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">
          {new Date().getHours() < 12
            ? t('overview.greetingMorning', { name: currentUser.firstName })
            : t('overview.greetingAfternoon', { name: currentUser.firstName })}
        </h1>
        <p className="page-desc">
          {t('studentHome.enrolledLine', {
            classes: myClasses.length,
            date: formatDate(today),
          })}
        </p>
      </div>

      <div className="stat-grid">
        <StatCard
          label={t('studentHome.overallAttendance')}
          value={summary.rate == null ? '\u2014' : `${summary.rate}%`}
          tone="blue"
          foot={t('studentHome.attendedSessions', {
            n: summary.present + summary.late,
          })}
        />
        <StatCard
          label={t('common.statusPresent')}
          value={summary.present}
          tone="green"
          foot={t('studentHome.sessions')}
        />
        <StatCard
          label={t('common.statusLate')}
          value={summary.late}
          tone="amber"
          foot={t('studentHome.sessions')}
        />
        <StatCard
          label={t('common.statusAbsent')}
          value={summary.absent}
          tone="red"
          foot={t('studentHome.sessions')}
        />
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">{t('studentHome.todayClasses')}</div>
              <div className="card-sub">{formatDateLong(today)}</div>
            </div>
          </div>
          {todayRecords.length === 0 ? (
            <div className="empty">{t('studentHome.noClassesToday')}</div>
          ) : (
            todayRecords.map(({ klass, record }) => (
              <div className="list-row" key={klass.id}>
                <div className="list-row-main">
                  <div className="list-row-title">{className(klass.id)}</div>
                  <div className="list-row-sub">
                    {klass.code} &middot; {roomLabel(klass.room)}
                  </div>
                </div>
                <div className="timespan">
                  {record?.arrivalTime
                    ? t('studentHome.arrived', { time: record.arrivalTime })
                    : ''}
                  {record?.arrivalTime && record.departureTime ? ' \u00B7 ' : ''}
                  {record?.departureTime
                    ? t('studentHome.left', { time: record.departureTime })
                    : ''}
                </div>
                <StatusBadge status={record ? record.status : 'no-record'} />
              </div>
            ))
          )}
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">{t('studentHome.latestActivity')}</div>
              <div className="card-sub">{t('studentHome.yourRecent')}</div>
            </div>
          </div>
          {recent.length === 0 ? (
            <div className="empty">{t('studentHome.noRecordsYet')}</div>
          ) : (
            recent.map((r) => {
              const k = classById(classes, r.classId)
              return (
                <div className="list-row" key={r.id}>
                  <div className="list-row-main">
                    <div className="list-row-title">{className(k.id)}</div>
                    <div className="list-row-sub">
                      {formatDate(r.date)}
                      {r.arrivalTime
                        ? ` \u00B7 ${t('studentHome.arrived', { time: r.arrivalTime })}`
                        : ''}
                      {r.departureTime
                        ? ` \u00B7 ${t('studentHome.left', { time: r.departureTime })}`
                        : ''}
                    </div>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
              )
            })
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-head">
          <div>
            <div className="card-title">{t('studentHome.enrolledClasses')}</div>
            <div className="card-sub">{t('studentHome.yourAttendanceByClass')}</div>
          </div>
        </div>
        {perClass.map(({ klass, rate, present, late, absent }) => (
          <div className="list-row" key={klass.id}>
            <div className="list-row-main">
              <div className="list-row-title">{className(klass.id)}</div>
              <div className="list-row-sub">
                {klass.code} &middot; {roomLabel(klass.room)} &middot;{' '}
                {t('stats.breakdown', { present, late, absent })}
              </div>
            </div>
            <div className="percent-row">
              <div style={{ flex: 1, minWidth: 100 }}>
                <ProgressBar value={rate} tone={rateTone(rate)} />
              </div>
              <span className="percent-label">
                {rate == null ? '\u2014' : `${rate}%`}
              </span>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}