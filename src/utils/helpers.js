export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const DAY_NAMES_FULL = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]
export const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

export const toDate = (iso) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const toISO = (date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export const todayISO = () => toISO(new Date())

export const addDays = (iso, n) => {
  const d = toDate(iso)
  d.setDate(d.getDate() + n)
  return toISO(d)
}

export const dayOfWeek = (iso) => toDate(iso).getDay()

export const formatDate = (iso) => {
  const d = toDate(iso)
  return `${DAY_NAMES[d.getDay()]}, ${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

export const formatDateShort = (iso) => {
  const d = toDate(iso)
  return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`
}

export const formatDateLong = (iso) => {
  const d = toDate(iso)
  return `${DAY_NAMES_FULL[d.getDay()]}, ${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

export const startOfWeek = (iso) => {
  const d = toDate(iso)
  const shift = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - shift)
  return toISO(d)
}

export const startOfMonth = (iso) => {
  const d = toDate(iso)
  return toISO(new Date(d.getFullYear(), d.getMonth(), 1))
}

export const weekdayInRange = (iso) => {
  if (iso > todayISO()) return false
  const start = addDays(todayISO(), -(7 * 8 + 1))
  return iso >= start
}

export const classOnDate = (klass, iso) => {
  const dow = dayOfWeek(iso)
  return klass.schedule.some((s) => s.day === dow)
}

export const isFuture = (iso) => iso > todayISO()

/* Local date/time helpers for <input type="date"> / <input type="time"> */
export const inputTime = (d = new Date()) => {
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

export const minutesToTime = (mins) => {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export const timeToMinutes = (time) => {
  if (!time) return null
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export const scheduleStartMins = (klass) => timeToMinutes(klass.schedule[0].start)
export const scheduleEndMins = (klass) => timeToMinutes(klass.schedule[0].end)

export const initials = (firstName, lastName) =>
  `${(firstName || '')[0] || ''}${(lastName || '')[0] || ''}`.toUpperCase()

export const teacherClasses = (classes, teacherId) =>
  classes.filter((c) => c.teacherId === teacherId)

export const studentsOf = (users, klass) =>
  klass.studentIds.map((id) => users.find((u) => u.id === id)).filter(Boolean)

export const userById = (users, id) =>
  users.find((u) => u.id === id) || {
    id,
    firstName: 'Unknown',
    lastName: 'Student',
    color: '#64748b',
  }

export const classById = (classes, id) => classes.find((c) => c.id === id)

export const lastSessionOnOrBefore = (klass, iso) => {
  let d = iso
  for (let i = 0; i < 21; i++) {
    if (classOnDate(klass, d)) return d
    d = addDays(d, -1)
  }
  return null
}