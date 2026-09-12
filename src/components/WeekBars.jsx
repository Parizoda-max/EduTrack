import {
  addDays,
  startOfWeek,
  todayISO,
} from '../utils/helpers.js'
import { useL10n } from '../i18n/LanguageContext.jsx'
import { summarize, rateTone } from '../utils/stats.js'

export default function WeekBars({ records }) {
  const { t, formatDateShort } = useL10n()
  const today = todayISO()
  const base = startOfWeek(today)

  const weeks = []
  for (let i = 7; i >= 1; i--) {
    const start = addDays(base, -7 * i)
    const end = addDays(start, 6)
    const s = summarize(records.filter((r) => r.date >= start && r.date <= end))
    weeks.push({ start, rate: s.rate, total: s.total })
  }

  return (
    <div
      className="bars-chart"
      role="img"
      aria-label={t('week.chartAria')}
    >
      {weeks.map((w) => (
        <div className="bar-col" key={w.start}>
          <div className="bar-value">{w.rate == null ? '\u2014' : `${w.rate}%`}</div>
          <div className="bar-track">
            <div
              className={`bar ${rateTone(w.rate)}`}
              style={{ height: `${w.rate == null ? 0 : Math.max(2, w.rate)}%` }}
            />
          </div>
          <div className="bar-label">{formatDateShort(w.start)}</div>
        </div>
      ))}
    </div>
  )
}