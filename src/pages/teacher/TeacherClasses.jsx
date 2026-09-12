import { useMemo, useState } from 'react'
import Avatar from '../../components/Avatar.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import ProgressBar from '../../components/ProgressBar.jsx'
import EditAttendanceModal from '../../components/EditAttendanceModal.jsx'
import Icon from '../../components/Icon.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useData } from '../../context/DataContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { useL10n } from '../../i18n/LanguageContext.jsx'
import {
  classOnDate,
  lastSessionOnOrBefore,
  teacherClasses,
  todayISO,
} from '../../utils/helpers.js'
import { rateTone, summarize } from '../../utils/stats.js'

export default function TeacherClasses() {
  const { currentUser } = useAuth()
  const { users, classes, records, saveRecords, updateRecord, deleteRecord } =
    useData()
  const { toast } = useToast()
  const { t, formatDateLong, className, roomLabel, gradeLabel } = useL10n()

  const myClasses = useMemo(
    () => teacherClasses(classes, currentUser.id),
    [classes, currentUser.id],
  )

  const today = todayISO()

  const [activeClassId, setActiveClassId] = useState(myClasses[0]?.id || '')
  const [viewDate, setViewDate] = useState(() => {
    const k = myClasses[0]
    return k ? lastSessionOnOrBefore(k, today) : today
  })
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [editing, setEditing] = useState(null)

  const klass = classes.find((c) => c.id === activeClassId) || myClasses[0]
  const isScheduled = klass ? classOnDate(klass, viewDate) : false

  const students = useMemo(() => {
    if (!klass) return []
    return klass.studentIds
      .map((id) => users.find((u) => u.id === id))
      .filter(Boolean)
      .sort((a, b) => a.lastName.localeCompare(b.lastName))
  }, [klass, users])

  const statusOf = (studentId) => {
    if (!klass) return null
    const rec = records.find(
      (r) => r.studentId === studentId && r.classId === klass.id && r.date === viewDate,
    )
    return rec || null
  }

  const filtered = useMemo(() => {
    if (!klass) return []
    return students.filter((st) => {
      const matchName = `${st.firstName} ${st.lastName}`
        .toLowerCase()
        .includes(search.toLowerCase())
      if (!matchName) return false
      if (statusFilter === 'all') return true
      const rec = records.find(
        (r) => r.studentId === st.id && r.classId === klass.id && r.date === viewDate,
      )
      const status = rec ? rec.status : 'no-record'
      if (statusFilter === 'no-record') return status === 'no-record'
      return status === statusFilter
    })
  }, [students, search, statusFilter, records, klass, viewDate])

  const summary = useMemo(() => {
    let present = 0
    let late = 0
    let absent = 0
    let unmarked = 0
    if (!klass) return { present, late, absent, unmarked }
    for (const st of students) {
      const rec = records.find(
        (r) => r.studentId === st.id && r.classId === klass.id && r.date === viewDate,
      )
      if (!rec) unmarked += 1
      else if (rec.status === 'present') present += 1
      else if (rec.status === 'late') late += 1
      else absent += 1
    }
    return { present, late, absent, unmarked }
  }, [students, records, klass, viewDate])

  if (!klass) {
    return <div className="empty">{t('students.noClassesAssigned')}</div>
  }

  const openEdit = (student) => {
    const rec = statusOf(student.id)
    setEditing({ student, rec })
  }

  const handleSave = (rec) => {
    if (editing.rec) {
      updateRecord(rec)
      toast(t('students.recordUpdated'))
    } else {
      saveRecords([rec])
      toast(
        t('students.recordedFor', {
          status: t(`common.status${rec.status[0].toUpperCase()}${rec.status.slice(1).toLowerCase()}`),
          name: editing.student.firstName,
        }),
      )
    }
    setEditing(null)
  }

  const handleDelete = (id) => {
    deleteRecord(id)
    toast(t('students.recordDeleted'))
    setEditing(null)
  }

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">{t('nav.students')}</h1>
        <p className="page-desc">{t('students.desc')}</p>
      </div>

      <div className="filters">
        <div className="field">
          <label className="field-label" htmlFor="class-tab">
            {t('common.class')}
          </label>
          <select
            id="class-tab"
            value={klass.id}
            onChange={(e) => {
              const k = classes.find((c) => c.id === e.target.value)
              setActiveClassId(k.id)
              setViewDate(lastSessionOnOrBefore(k, today))
              setStatusFilter('all')
              setSearch('')
            }}
          >
            {myClasses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} &mdash; {className(c.id)}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="field-label" htmlFor="view-date">
            {t('common.date')}
          </label>
          <input
            id="view-date"
            type="date"
            value={viewDate}
            max={today}
            onChange={(e) => setViewDate(e.target.value)}
          />
        </div>
        <div className="field search">
          <label className="field-label" htmlFor="student-search">
            {t('common.lookup')}
          </label>
          <div className="input-icon-row">
            <input
              id="student-search"
              type="text"
              placeholder={t('common.searchByNames')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <span className="ico">
              <Icon name="search" size={15} />
            </span>
          </div>
        </div>
        <div className="field">
          <label className="field-label" htmlFor="status-filter">
            {t('common.status')}
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">{t('common.allStatuses')}</option>
            <option value="present">{t('common.statusPresent')}</option>
            <option value="late">{t('common.statusLate')}</option>
            <option value="absent">{t('common.statusAbsent')}</option>
            <option value="no-record">{t('common.statusNotMarked')}</option>
          </select>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <div className="card-title">
              {klass.code} &mdash; {className(klass.id)}
            </div>
            <div className="card-sub">
              {roomLabel(klass.room)} &middot;{' '}
              {t('students.studentsInClass', { n: klass.studentIds.length })}{' '}
              &middot; {formatDateLong(viewDate)}
              {!isScheduled ? ` \u00B7 ${t('students.notScheduledDay')}` : ''}
            </div>
          </div>
          <div className="hstack">
            <StatusBadge status="present" />
            <span className="muted" style={{ fontSize: 12 }}>
              {summary.present}
            </span>
            <StatusBadge status="late" />
            <span className="muted" style={{ fontSize: 12 }}>
              {summary.late}
            </span>
            <StatusBadge status="absent" />
            <span className="muted" style={{ fontSize: 12 }}>
              {summary.absent}
            </span>
            <span className="timespan">
              {t('students.unmarkedCount', { n: summary.unmarked })}
            </span>
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
                <th>{t('common.attendance')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="6">
                    <div className="empty">{t('students.noStudentMatch')}</div>
                  </td>
                </tr>
              ) : (
                filtered.map((st) => {
                  const rec = statusOf(st.id)
                  const rate = summarize(
                    records.filter(
                      (r) => r.studentId === st.id && r.classId === klass.id,
                    ),
                  ).rate
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
                        <StatusBadge status={rec ? rec.status : 'no-record'} />
                      </td>
                      <td className="cell-muted">{rec?.arrivalTime || '\u2014'}</td>
                      <td className="cell-muted">{rec?.departureTime || '\u2014'}</td>
                      <td>
                        <div className="percent-row">
                          <div style={{ flex: 1 }}>
                            <ProgressBar value={rate} tone={rateTone(rate)} />
                          </div>
                          <span className="percent-label">
                            {rate == null ? '\u2014' : `${rate}%`}
                          </span>
                        </div>
                      </td>
                      <td className="cell-right">
                        <button
                          type="button"
                          className="btn btn-sm"
                          onClick={() => openEdit(st)}
                        >
                          <Icon name="edit" size={14} />
                          {rec ? t('common.edit') : t('common.mark')}
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editing ? (
        <EditAttendanceModal
          record={editing.rec}
          student={editing.student}
          klass={klass}
          date={viewDate}
          onClose={() => setEditing(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      ) : null}
    </>
  )
}