export function summarize(records) {
  let present = 0
  let late = 0
  let absent = 0
  for (const r of records) {
    if (r.status === 'present') present += 1
    else if (r.status === 'late') late += 1
    else if (r.status === 'absent') absent += 1
  }
  const total = present + late + absent
  const rate = total === 0 ? null : Math.round(((present + late) / total) * 100)
  return { present, late, absent, total, rate }
}

export function sumSummaries(summaries) {
  const acc = { present: 0, late: 0, absent: 0, total: 0 }
  for (const s of summaries) {
    acc.present += s.present
    acc.late += s.late
    acc.absent += s.absent
    acc.total += s.total
  }
  acc.rate = acc.total === 0 ? null : Math.round(((acc.present + acc.late) / acc.total) * 100)
  return acc
}

export function studentRecords(records, studentId) {
  return records.filter((r) => r.studentId === studentId)
}

export function classRecords(records, classId) {
  return records.filter((r) => r.classId === classId)
}

export function rateTone(rate) {
  if (rate == null) return 'primary'
  if (rate >= 90) return 'green'
  if (rate >= 70) return 'amber'
  return 'red'
}

export function missingToday(klass, records, date) {
  const marked = records.filter(
    (r) => r.classId === klass.id && r.date === date,
  )
  return klass.studentIds.length - marked.length
}

export function latenessCount(records) {
  return records.reduce((acc, r) => (r.status === 'late' ? acc + 1 : acc), 0)
}