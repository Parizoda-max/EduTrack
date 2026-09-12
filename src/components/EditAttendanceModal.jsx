import { useState } from 'react'
import Modal from './Modal.jsx'
import { useL10n } from '../i18n/LanguageContext.jsx'
import {
  minutesToTime,
  scheduleEndMins,
  scheduleStartMins,
} from '../utils/helpers.js'

export default function EditAttendanceModal({
  record,
  student,
  klass,
  date,
  onClose,
  onSave,
  onDelete,
}) {
  const { t, formatDateLong } = useL10n()

  const start = scheduleStartMins(klass)
  const end = scheduleEndMins(klass)

  const [status, setStatus] = useState(record ? record.status : 'present')
  const [arrivalTime, setArrivalTime] = useState(
    record?.arrivalTime || minutesToTime(start + 3),
  )
  const [departureTime, setDepartureTime] = useState(
    record?.departureTime || minutesToTime(end - 5),
  )

  const changeStatus = (s) => {
    setStatus(s)
    if (s === 'absent') {
      setArrivalTime('')
      setDepartureTime('')
    } else if (!arrivalTime) {
      setArrivalTime(minutesToTime(start + 3))
      setDepartureTime(minutesToTime(end - 5))
    }
  }

  const handleSave = () => {
    const isAbsent = status === 'absent'
    const rec = {
      id: record?.id || `r-${student.id}-${klass.id}-${date}`,
      classId: klass.id,
      studentId: student.id,
      date,
      status,
      arrivalTime: isAbsent ? null : arrivalTime || null,
      departureTime: isAbsent ? null : departureTime || null,
    }
    onSave(rec)
  }

  return (
    <Modal
      title={t('modal.attendanceFor', {
        name: `${student.firstName} ${student.lastName}`,
      })}
      onClose={onClose}
      actions={
        <>
          {record ? (
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => onDelete(record.id)}
            >
              {t('common.deleteRecord')}
            </button>
          ) : null}
          <button type="button" className="btn" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave}>
            {t('common.saveChanges')}
          </button>
        </>
      }
    >
      <div className="muted" style={{ fontSize: 13 }}>
        {klass.code} &middot; {formatDateLong(date)}
      </div>

      <div className="field">
        <span className="field-label">{t('modal.statusField')}</span>
        <div className="segmented">
          <button
            type="button"
            className={status === 'present' ? 'p-on' : ''}
            onClick={() => changeStatus('present')}
          >
            {t('common.statusPresent')}
          </button>
          <button
            type="button"
            className={status === 'late' ? 'l-on' : ''}
            onClick={() => changeStatus('late')}
          >
            {t('common.statusLate')}
          </button>
          <button
            type="button"
            className={status === 'absent' ? 'a-on' : ''}
            onClick={() => changeStatus('absent')}
          >
            {t('common.statusAbsent')}
          </button>
        </div>
      </div>

      <div className="form-row">
        <div className="field">
          <label className="field-label" htmlFor="edit-arrival">
            {t('modal.arrivalTime')}
          </label>
          <input
            id="edit-arrival"
            type="time"
            value={arrivalTime || ''}
            disabled={status === 'absent'}
            onChange={(e) => setArrivalTime(e.target.value)}
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="edit-departure">
            {t('modal.departureTime')}
          </label>
          <input
            id="edit-departure"
            type="time"
            value={departureTime || ''}
            disabled={status === 'absent'}
            onChange={(e) => setDepartureTime(e.target.value)}
          />
        </div>
      </div>

      <div className="faint" style={{ fontSize: 12 }}>
        {status === 'absent'
          ? t('modal.absentTimesNote')
          : t('modal.leavingTimesNote')}
      </div>
    </Modal>
  )
}