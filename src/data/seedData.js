import {
  addDays,
  classOnDate,
  minutesToTime,
  scheduleEndMins,
  scheduleStartMins,
  todayISO,
} from '../utils/helpers.js'

export const SEED_VERSION = '1.0'
export const SCHOOL_NAME = 'Brightwood Learning Center'
export const APP_NAME = 'EduTrack'

const FIRST = [
  'Alex', 'Maya', 'Liam', 'Sofia', 'Noah', 'Isabella', 'Ethan', 'Ava',
  'Lucas', 'Mia', 'Daniel', 'Zoe', 'Mateo', 'Chloe', 'Leo', 'Nora',
  'Ryan', 'Grace', 'Owen', 'Lily', 'Gabriel', 'Elena', 'Sam', 'Aria',
  'David', 'Emma', 'Oscar', 'Luna',
]

const LAST = [
  'Turner', 'Patel', 'Nguyen', 'Kim', 'Garcia', 'Rossi', 'Silva',
  'Costa', 'Ivanov', 'Chen', 'Brown', 'Wilson', 'Moore', 'Taylor',
  'Anderson', 'Thomas', 'White', 'Martin', 'Harris', 'Clark',
  'Lewis', 'Walker', 'Hall', 'Young', 'King', 'Wright', 'Lopez', 'Hill',
]

const GRADES = ['Grade 9', 'Grade 10', 'Grade 10', 'Grade 11', 'Grade 11', 'Grade 12']
const AVATAR_COLORS = [
  '#2563eb', '#0f766e', '#7c3aed', '#b45309', '#0e7490', '#be123c', '#4d7c0f', '#4f46e5',
]

const rnd = (min, max) => Math.round(min + Math.random() * (max - min))
const dice = (pct) => Math.random() < pct / 100

function buildUsers() {
  const teachers = [
    {
      id: 't1',
      role: 'teacher',
      firstName: 'Sarah',
      lastName: 'Mitchell',
      username: 'sarah.mitchell',
      password: 'sarah123',
      email: 'sarah.mitchell@brightwood.edu',
      subject: 'Computer Science',
      color: '#2563eb',
    },
    {
      id: 't2',
      role: 'teacher',
      firstName: 'James',
      lastName: 'Rodriguez',
      username: 'james.rodriguez',
      password: 'james123',
      email: 'james.rodriguez@brightwood.edu',
      subject: 'English',
      color: '#0f766e',
    },
  ]

  const students = FIRST.map((first, i) => {
    const last = LAST[i]
    return {
      id: `s${i + 1}`,
      role: 'student',
      firstName: first,
      lastName: last,
      username: `${first}.${last}`.toLowerCase(),
      password: `${first.toLowerCase()}123`,
      email: `${first}.${last}`.toLowerCase().replaceAll(' ', '') + '@brightwood.edu',
      grade: GRADES[i % GRADES.length],
      color: AVATAR_COLORS[i % AVATAR_COLORS.length],
    }
  })

  return { teachers, students }
}

function buildClasses(students) {
  const byIndex = (idx) => students.map((s) => s.id)[idx]

  const c1Students = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26].map(byIndex)
  const c2Students = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27].map(byIndex)
  const c3Students = [0, 1, 4, 5, 8, 9, 12, 13, 16, 17, 20, 21, 24, 25].map(byIndex)
  const c4Students = [2, 3, 6, 7, 10, 11, 14, 15, 18, 19, 22, 23, 26, 27].map(byIndex)

  return [
    {
      id: 'c1',
      name: 'Intro to Programming',
      code: 'CS-101',
      teacherId: 't1',
      room: 'Room 204',
      schedule: [
        { day: 1, start: '09:00', end: '10:30' },
        { day: 3, start: '09:00', end: '10:30' },
        { day: 5, start: '09:00', end: '10:30' },
      ],
      studentIds: c1Students,
    },
    {
      id: 'c2',
      name: 'Calculus I',
      code: 'MA-201',
      teacherId: 't1',
      room: 'Room 108',
      schedule: [
        { day: 2, start: '11:00', end: '12:30' },
        { day: 4, start: '11:00', end: '12:30' },
      ],
      studentIds: c2Students,
    },
    {
      id: 'c3',
      name: 'English Literature',
      code: 'EN-110',
      teacherId: 't2',
      room: 'Room 315',
      schedule: [
        { day: 2, start: '10:00', end: '11:30' },
        { day: 4, start: '10:00', end: '11:30' },
      ],
      studentIds: c3Students,
    },
    {
      id: 'c4',
      name: 'Environmental Science',
      code: 'SC-105',
      teacherId: 't2',
      room: 'Room 112',
      schedule: [
        { day: 1, start: '14:00', end: '15:30' },
        { day: 3, start: '14:00', end: '15:30' },
        { day: 5, start: '14:00', end: '15:30' },
      ],
      studentIds: c4Students,
    },
  ]
}

function lastScheduledDate(klass, from) {
  let d = from
  for (let i = 0; i < 14; i++) {
    if (classOnDate(klass, d)) return d
    d = addDays(d, -1)
  }
  return null
}

function buildTime(status, klass, isToday) {
  const start = scheduleStartMins(klass)
  const end = scheduleEndMins(klass)

  if (status === 'late') {
    return {
      arrivalTime: minutesToTime(start + rnd(10, 32)),
      departureTime: minutesToTime(end - rnd(0, 10)),
    }
  }

  const arrival = minutesToTime(start + rnd(0, 8))
  let departure = end - rnd(0, 10)
  if (dice(14)) departure -= rnd(20, 50) // left class early
  return {
    arrivalTime: arrival,
    departureTime: isToday ? null : minutesToTime(departure),
  }
}

function buildRecords(classes) {
  const records = []
  const today = todayISO()

  const partialDates = classes
    .filter((c) => c.id === 'c2' || c.id === 'c4')
    .map((c) => ({ classId: c.id, date: lastScheduledDate(c, today) }))

  let cursor = addDays(today, -63)
  while (cursor <= today) {
    for (const klass of classes) {
      if (!classOnDate(klass, cursor)) continue

      const partial = partialDates.find(
        (p) => p.classId === klass.id && p.date === cursor,
      )
      const isToday = cursor === today

      for (const studentId of klass.studentIds) {
        if (partial && !dice(65)) continue

        const r = Math.random()
        let status = 'present'
        if (r > 0.76 && r <= 0.89) status = 'late'
        else if (r > 0.89) status = 'absent'

        const times =
          status === 'absent'
            ? { arrivalTime: null, departureTime: null }
            : buildTime(status, klass, isToday)

        records.push({
          id: `r-${studentId}-${klass.id}-${cursor}`,
          classId: klass.id,
          studentId,
          date: cursor,
          status,
          arrivalTime: times.arrivalTime,
          departureTime: times.departureTime,
        })
      }
    }
    cursor = addDays(cursor, 1)
  }

  return records
}

export function buildSeed() {
  const { teachers, students } = buildUsers()
  const users = [...teachers, ...students]
  const classes = buildClasses(students)
  const records = buildRecords(classes)
  return { users, classes, records }
}