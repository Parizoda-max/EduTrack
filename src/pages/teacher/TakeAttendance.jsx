import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Avatar from '../../components/Avatar.jsx'
import Icon from '../../components/Icon.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useData } from '../../context/DataContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { useL10n } from '../../i18n/LanguageContext.jsx'
import {
  addDays,
  classOnDate,
  minutesToTime,
  scheduleEndMins,
  scheduleStartMins,
  teacherClasses,
  todayISO,
  isFuture,
} from '../../utils/helpers.js'

export default function TakeAttendance() {
  const { currentUser } = useAuth()
  const { users, classes, records, replaceSessionRecords } = useData()
  const { toast } = useToast()
  const { t, formatDateLong, className, roomLabel, gradeLabel } = useL10n()
  const [params] = useSearchParams()

  const myClasses = useMemo(
    () => teacherClasses(classes, currentUser.id),
    [classes, currentUser.id],
  )

  const today = todayISO()
  const minDate = addDays(today, -90)

  const [classId, setClassId] = useState(() => {
    const p = params.get('class')
    return myClasses.some((c) => c.id === p) ? p : myClasses[0]?.id || ''
  })
  const [date, setDate] = useState(() => {
    const p = params.get('date')
    return p && p <= today ? p : today
  })
  const [draft, setDraft] = useState({})
  const [search, setSearch] = useState('')

  useEffect(() => {
    const p = params.get('class')
    const d = params.get('date')
    if (myClasses.some((c) => c.id === p)) setClassId(p)
    if (d && d <= today) setDate(d)
  }, [params, myClasses, today])

  const klass = classes.find((c) => c.id === classId)
  const scheduled = klass ? classOnDate(klass, date) : false

  useEffect(() => {
    if (!klass) return
    const init = {}
    for (const r of records) {
      if (r.classId === klass.id && r.date === date) {
        init[r.studentId] = {
          status: r.status,
          arrivalTime: r.arrivalTime || '',
          departureTime: r.departureTime || '',
        }
      }
    }
    setDraft(init)
    setSearch('')
  }, [classId, date, records, klass])

  const start = klass ? scheduleStartMins(klass) : 0
  const end = klass ? scheduleEndMins(klass) : 0
  const defaults = () => ({
    arrivalTime: minutesToTime(start + 2),
    departureTime: minutesToTime(end - 5),
  })

  const students = useMemo(() => {
    if (!klass) return []
    return klass.studentIds
      .map((id) => users.find((u) => u.id === id))
      .filter(Boolean)
      .sort((a, b) => a.lastName.localeCompare(b.lastName))
  }, [klass, users])

  const setStatus = (studentId, status) => {
    setDraft((prev) => {
      const next = { ...prev }
      const cur = next[studentId] || { status: null, arrivalTime: '', departureTime: '' }
      if (status === 'absent') {
        next[studentId] = { status, arrivalTime: '', departureTime: '' }
      } else if (!cur.arrivalTime) {
        next[studentId] = { status, ...defaults() }
      } else {
        next[studentId] = { status, arrivalTime: cur.arrivalTime, departureTime: cur.departureTime }
      }
      return next
    })
  }

  const setTime = (studentId, key, value) => {
    setDraft((prev) => {
      const next = { ...prev }
      const cur = next[studentId] || { status: null, arrivalTime: '', departureTime: '' }
      next[studentId] = { ...cur, [key]: value }
      return next
    })
  }

  const markAllPresent = () => {
    setDraft((prev) => {
      const next = { ...prev }
      for (const st of students) {
        if (!next[st.id]?.status) {
          next[st.id] = { status: 'present', ...defaults() }
        }
      }
      return next
    })
  }

  const countDraft = useMemo(() => {
    const counts = { present: 0, late: 0, absent: 0 }
    for (const v of Object.values(draft)) {
      if (v.status) counts[v.status] += 1
    }
    return counts
  }, [draft])

  const filtered = students.filter((st) =>
    `${st.firstName} ${st.lastName}`.toLowerCase().includes(search.toLowerCase()),
  )

  if (!klass) {
    return <div className="empty">{t('students.noClassesAssigned')}</div>
  }

  const handleSave = () => {
    if (isFuture(date)) {
      toast(t('take.errorFuture'), 'error')
      return
    }
    const toSave = []
    for (const st of klass.studentIds) {
      const entry = draft[st.id]
      if (entry && entry.status) {
        toSave.push({
          id: `r-${st.id}-${klass.id}-${date}`,
          classId: klass.id,
          studentId: st.id,
          date,
          status: entry.status,
          arrivalTime: entry.status === 'absent' ? null : entry.arrivalTime || null,
          departureTime: entry.status === 'absent' ? null : entry.departureTime || null,
        })
      }
    }
    if (toSave.length === 0) {
      toast(t('take.errorNoStatus'), 'error')
      return
    }
    replaceSessionRecords(klass.id, date, toSave)
    toast(
      t('take.savedSummary', {
        count: toSave.length,
        name: className(klass.id),
        present: countDraft.present,
        late: countDraft.late,
        absent: countDraft.absent,
      }),
    )
  }

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">{t('nav.takeAttendance')}</h1>
        <p className="page-desc">{t('take.desc')}</p>
      </div>

      <div className="filters">
        <div className="field">
          <label className="field-label" htmlFor="att-class">
            {t('common.class')}
          </label>
          <select
            id="att-class"
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
          <label className="field-label" htmlFor="att-date">
            {t('common.date')}
          </label>
          <input
            id="att-date"
            type="date"
            value={date}
            min={minDate}
            max={today}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="field search">
          <label className="field-label" htmlFor="att-search">
            {t('common.lookup')}
          </label>
          <div className="input-icon-row">
            <input
              id="att-search"
              type="text"
              placeholder={t('take.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <span className="ico">
              <Icon name="search" size={15} />
            </span>
          </div>
        </div>
        <div className="field">
          <label className="field-label">&nbsp;</label>
          <button type="button" className="btn" onClick={markAllPresent}>
            <Icon name="check-square" size={15} />
            {t('take.markAllPresent')}
          </button>
        </div>
      </div>

      {!scheduled ? (
        <div className="alert alert-info">
          <span>
            {t('take.notScheduledAlert', { name: className(klass.id) })}
          </span>
        </div>
      ) : null}

      <div className="card">
        <div className="card-head">
          <div>
            <div className="card-title">
              {klass.code} &mdash; {className(klass.id)}
            </div>
            <div className="card-sub">
              {formatDateLong(date)} &middot; {roomLabel(klass.room)} &middot;{' '}
              {scheduled
                ? klass.schedule.map((s) => `${s.start}\u2013${s.end}`).join(' \u00B7 ')
                : ''}{' '}
              &middot; {t('students.studentsInClass', { n: students.length })}
            </div>
          </div>
          <div className="hstack">
            <span className="muted" style={{ fontSize: 13 }}>
              {t('take.presentCount', { n: countDraft.present })}
            </span>
            <span className="muted" style={{ fontSize: 13 }}>
              {t('take.lateCount', { n: countDraft.late })}
            </span>
            <span className="muted" style={{ fontSize: 13 }}>
              {t('take.absentCount', { n: countDraft.absent })}
            </span>
            <button type="button" className="btn btn-primary" onClick={handleSave}>
              {t('take.saveAttendance')}
            </button>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t('common.student')}</th>
                <th>{t('common.status')}</th>
                <th>{t('common.arrival')}</th>
                <th>{t('common.departure')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((st) => {
                const entry = draft[st.id]
                const status = entry?.status || null
                const disabled = status !== 'present' && status !== 'late'
                return (
                  <tr key={st.id}>
                    <td>
                      <div className="name-cell">
                        <Avatar user={st} size="sm" />
                        <div>
                          <div style={{ fontWeight: 600 }}>
                            {st.firstName} {st.lastName}
                          </div>
                          <div className="cell-muted">{gradeLabel(st.grade)}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="segmented">
                        <button
                          type="button"
                          className={status === 'present' ? 'p-on' : ''}
                          onClick={() => setStatus(st.id, 'present')}
                        >
                          {t('common.statusPresent')}
                        </button>
                        <button
                          type="button"
                          className={status === 'late' ? 'l-on' : ''}
                          onClick={() => setStatus(st.id, 'late')}
                        >
                          {t('common.statusLate')}
                        </button>
                        <button
                          type="button"
                          className={status === 'absent' ? 'a-on' : ''}
                          onClick={() => setStatus(st.id, 'absent')}
                        >
                          {t('common.statusAbsent')}
                        </button>
                      </div>
                    </td>
                    <td>
                      <input
                        type="time"
                        value={entry?.arrivalTime || ''}
                        disabled={disabled}
                        aria-label={t('take.arrivalAria', { name: st.firstName })}
                        style={{ width: 120 }}
                        onChange={(e) => setTime(st.id, 'arrivalTime', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="time"
                        value={entry?.departureTime || ''}
                        disabled={disabled}
                        aria-label={t('take.departureAria', { name: st.firstName })}
                        style={{ width: 120 }}
                        onChange={(e) => setTime(st.id, 'departureTime', e.target.value)}
                      />
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