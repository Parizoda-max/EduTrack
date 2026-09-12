import { useMemo } from 'react'
import ProgressBar from '../../components/ProgressBar.jsx'
import StatCard from '../../components/StatCard.jsx'
import WeekBars from '../../components/WeekBars.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useData } from '../../context/DataContext.jsx'
import { useL10n } from '../../i18n/LanguageContext.jsx'
import { rateTone, summarize } from '../../utils/stats.js'

export default function StudentStats() {
  const { currentUser } = useAuth()
  const { classes, records } = useData()
  const { t, className, roomLabel } = useL10n()

  const myRecords = useMemo(
    () => records.filter((r) => r.studentId === currentUser.id),
    [records, currentUser.id],
  )

  const myClasses = useMemo(
    () => classes.filter((c) => c.studentIds.includes(currentUser.id)),
    [classes, currentUser.id],
  )

  const summary = summarize(myRecords)

  const perClass = useMemo(() => {
    return myClasses.map((c) => {
      const s = summarize(myRecords.filter((r) => r.classId === c.id))
      return { klass: c, ...s }
    })
  }, [myClasses, myRecords])

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">{t('nav.statistics')}</h1>
        <p className="page-desc">{t('studentStats.desc')}</p>
      </div>

      <div className="stat-grid">
        <StatCard
          label={t('stats.attendanceRate')}
          value={summary.rate == null ? '\u2014' : `${summary.rate}%`}
          tone="blue"
          foot={t('studentStats.attendedOf', {
            attended: summary.present + summary.late,
            total: summary.total || 0,
          })}
        />
        <StatCard
          label={t('common.statusPresent')}
          value={summary.present}
          tone="green"
          foot={t('studentStats.sessions')}
        />
        <StatCard
          label={t('common.statusLate')}
          value={summary.late}
          tone="amber"
          foot={t('studentStats.sessions')}
        />
        <StatCard
          label={t('common.statusAbsent')}
          value={summary.absent}
          tone="red"
          foot={t('studentStats.sessions')}
        />
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">{t('studentStats.weeklyTrend')}</div>
              <div className="card-sub">{t('studentStats.trendSub')}</div>
            </div>
          </div>
          <WeekBars records={myRecords} />
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">{t('studentStats.byClass')}</div>
              <div className="card-sub">{t('studentStats.byClassSub')}</div>
            </div>
          </div>
          {perClass.length === 0 ? (
            <div className="empty">{t('studentStats.notEnrolled')}</div>
          ) : (
            perClass.map(({ klass, rate, present, late, absent }) => (
              <div className="list-row" key={klass.id}>
                <div className="list-row-main">
                  <div className="list-row-title">{className(klass.id)}</div>
                  <div className="list-row-sub">
                    {klass.code} &middot; {roomLabel(klass.room)} &middot;{' '}
                    {t('stats.breakdown', { present, late, absent })}
                  </div>
                </div>
                <div className="percent-row">
                  <div style={{ flex: 1, minWidth: 80 }}>
                    <ProgressBar value={rate} tone={rateTone(rate)} />
                  </div>
                  <span className="percent-label">
                    {rate == null ? '\u2014' : `${rate}%`}
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