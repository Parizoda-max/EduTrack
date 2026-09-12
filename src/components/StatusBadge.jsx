import { useL10n } from '../i18n/LanguageContext.jsx'

const STATUS_KEY = {
  present: 'common.statusPresent',
  absent: 'common.statusAbsent',
  late: 'common.statusLate',
  'no-record': 'common.statusNotMarked',
  'no-session': 'common.statusNoSession',
}

export default function StatusBadge({ status, className = '' }) {
  const { t } = useL10n()

  if (status === null || status === undefined || status === 'no-record') {
    return (
      <span className={`badge badge-no-record ${className}`}>
        {t('common.statusNotMarked')}
      </span>
    )
  }
  if (status === 'no-session') {
    return (
      <span className={`badge badge-na ${className}`}>
        {t('common.statusNoSession')}
      </span>
    )
  }
  return (
    <span className={`badge badge-${status} ${className}`}>
      {t(STATUS_KEY[status])}
    </span>
  )
}