import { createContext, useCallback, useContext, useState } from 'react'
import { buildSeed, SEED_VERSION } from '../data/seedData.js'

const DataContext = createContext(null)
const STORE_KEY = 'edutrack_data'
const VERSION_KEY = 'edutrack_seed_version'

function loadData() {
  try {
    if (localStorage.getItem(VERSION_KEY) === SEED_VERSION) {
      const raw = localStorage.getItem(STORE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed && Array.isArray(parsed.users)) return parsed
      }
    }
  } catch {
    /* fall through to rebuild */
  }
  const seed = buildSeed()
  localStorage.setItem(VERSION_KEY, SEED_VERSION)
  localStorage.setItem(STORE_KEY, JSON.stringify(seed))
  return seed
}

export function DataProvider({ children }) {
  const [data, setData] = useState(loadData)

  const persist = useCallback((next) => {
    setData(next)
    localStorage.setItem(STORE_KEY, JSON.stringify(next))
  }, [])

  const saveRecords = useCallback(
    (newRecords) => {
      const existingIds = new Set(newRecords.map((r) => r.id))
      persist({
        ...data,
        records: [...data.records.filter((r) => !existingIds.has(r.id)), ...newRecords],
      })
    },
    [data, persist],
  )

  const updateRecord = useCallback(
    (updated) => {
      persist({
        ...data,
        records: data.records.map((r) => (r.id === updated.id ? updated : r)),
      })
    },
    [data, persist],
  )

  const deleteRecord = useCallback(
    (id) => {
      persist({ ...data, records: data.records.filter((r) => r.id !== id) })
    },
    [data, persist],
  )

  const replaceSessionRecords = useCallback(
    (classId, date, newRecords) => {
      const kept = data.records.filter(
        (r) => !(r.classId === classId && r.date === date),
      )
      persist({ ...data, records: [...kept, ...newRecords] })
    },
    [data, persist],
  )

  const resetData = useCallback(() => {
    localStorage.removeItem(VERSION_KEY)
    const seed = buildSeed()
    localStorage.setItem(VERSION_KEY, SEED_VERSION)
    localStorage.setItem(STORE_KEY, JSON.stringify(seed))
    setData(seed)
  }, [])

  return (
    <DataContext.Provider
      value={{
        users: data.users,
        classes: data.classes,
        records: data.records,
        saveRecords,
        updateRecord,
        deleteRecord,
        replaceSessionRecords,
        resetData,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}