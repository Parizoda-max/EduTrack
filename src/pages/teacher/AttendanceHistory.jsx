import { useMemo, useState } from 'react'
import Avatar from '../../components/Avatar.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import EditAttendanceModal from '../../components/EditAttendanceModal.jsx'
import Icon from '../../components/Icon.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useData } from '../../context/DataContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { useL10n } from '../../i18n/LanguageContext.jsx'
import { addDays, classById, teacherClasses, todayISO } from '../../utils/helpers.js'

const PAGE_SIZE = 100

export default function AttendanceHistory() {
  const { currentUser } = useAuth()
  const { users, classes, records, updateRecord, deleteRecord } = useData()
  const { toast } = useToast()
  const { t, formatDate, className } = useL10n()

  const myClasses = useMemo(
    () => teacherClasses(classes, currentUser.id),
    [classes, currentUser.id],
  )
  const today = todayISO()

  const [classId, setClassId] = useState('all')
  const [from, setFrom] = useState(addDays(today, -30))
  const [to, setTo] = useState(today)
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [limit, setLimit] = useState(PAGE_SIZE)
  const [editing, setEditing] = useState(null)

  const filtered = useMemo(() => {
    const list = records.filter((r) => {
      if (!myClasses.some((c) => c.id === r.classId)) return false
      if (classId !== 'all' && r.classId !== classId) return false
      if (from && r.date < from) return false
      if (to && r.date > to) return false
      if (status !== 'all' && r.status !== status) return false
      if (search) {
        const st = users.find((u) => u.id === r.studentId)
        const name = st ? `${st.firstName} ${st.lastName}`.toLowerCase() : ''
        if (!name.includes(search.toLowerCase())) return false
      }
      return true
    })
    return list
      .sort((a, b) => {
        if (a.date === b.date)
          return (users.find((u) => u.id === a.studentId)?.lastName || '').localeCompare(
            users.find((u) => u.id === b.studentId)?.lastName || '',
          )
        return a.date < b.date ? 1 : -1
      })
      .slice(0, limit)
  }, [records, myClasses, classId, from, to, status, search, limit, users])

  const totalCount = useMemo(() => {
    return records.filter((r) => {
      if (!myClasses.some((c) => c.id === r.classId)) return false
      if (classId !== 'all' && r.classId !== classId) return false
      if (from && r.date < from) return false
      if (to && r.date > to) return false
      if (status !== 'all' && r.status !== status) return false
      if (search) {
        const st = users.find((u) => u.id === r.studentId)
        const name = st ? `${st.firstName} ${st.lastName}`.toLowerCase() : ''
        if (!name.includes(search.toLowerCase())) return false
      }
      return true
    }).length
  }, [records, myClasses, classId, from, to, status, search, users])

  const handleSave = (rec) => {
    updateRecord(rec)
    toast(t('students.recordUpdated'))
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
        <h1 className="page-title">{t('nav.history')}</h1>
        <p className="page-desc">{t('history.desc')}</p>
      </div>

      <div className="filters">
        <div className="field">
          <label className="field-label" htmlFor="hist-class">
            {t('common.class')}
          </label>
          <select
            id="hist-class"
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
          <label className="field-label" htmlFor="hist-from">
            {t('history.from')}
          </label>
          <input
            id="hist-from"
            type="date"
            max={to}
            value={from}
            onChange={(e) => {
              setFrom(e.target.value)
              setLimit(PAGE_SIZE)
            }}
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="hist-to">
            {t('history.to')}
          </label>
          <input
            id="hist-to"
            type="date"
            min={from}
            max={today}
            value={to}
            onChange={(e) => {
              setTo(e.target.value)
              setLimit(PAGE_SIZE)
            }}
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="hist-status">
            {t('common.status')}
          </label>
          <select
            id="hist-status"
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
        <div className="field search">
          <label className="field-label" htmlFor="hist-search">
            {t('common.lookup')}
          </label>
          <div className="input-icon-row">
            <input
              id="hist-search"
              type="text"
              placeholder={t('common.searchByNames')}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setLimit(PAGE_SIZE)
              }}
            />
            <span className="ico">
              <Icon name="search" size={15} />
            </span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <div className="card-title">
              {t('history.records')}{' '}
              <span className="muted" style={{ fontWeight: 500 }}>
                ({t('history.found', { n: totalCount })}
                {limit < totalCount
                  ? `, ${t('history.showing', { n: limit })}`
                  : ''})
              </span>
            </div>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t('common.date')}</th>
                <th>{t('common.student')}</th>
                <th>{t('common.class')}</th>
                <th>{t('common.status')}</th>
                <th>{t('common.arrival')}</th>
                <th>{t('common.departure')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="7">
                    <div className="empty">{t('history.noMatch')}</div>
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const student = users.find((u) => u.id === r.studentId)
                  const klass = classById(classes, r.classId)
                  return (
                    <tr key={r.id}>
                      <td className="cell-muted" style={{ whiteSpace: 'nowrap' }}>
                        {formatDate(r.date)}
                      </td>
                      <td>
                        <div className="name-cell">
                          <Avatar user={student} size="sm" />
                          <span style={{ fontWeight: 550 }}>
                            {student.firstName} {student.lastName}
                          </span>
                        </div>
                      </td>
                      <td className="cell-muted">
                        {className(klass.id)}
                      </td>
                      <td>
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="cell-muted">{r.arrivalTime || '\u2014'}</td>
                      <td className="cell-muted">{r.departureTime || '\u2014'}</td>
                      <td className="cell-right">
                        <button
                          type="button"
                          className="btn btn-sm"
                          onClick={() => setEditing({ student, klass, record: r })}
                        >
                          {t('common.edit')}
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {limit < totalCount ? (
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

      {editing ? (
        <EditAttendanceModal
          record={editing.record}
          student={editing.student}
          klass={editing.klass}
          date={editing.record.date}
          onClose={() => setEditing(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      ) : null}
    </>
  )
}