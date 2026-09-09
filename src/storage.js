const DB_NAME = 'minha-rotina-db'
const STORE_NAME = 'state'
const STATE_KEY = 'app-state'
const AGENDA_MIGRATION_KEY = 'minha-rotina-agenda-sep-2026-installed'

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function mergeAgendaOnce(current, fallback) {
  if (localStorage.getItem(AGENDA_MIGRATION_KEY)) return current

  const routines = [...(current?.routines || [])]
  for (const routine of fallback.routines || []) {
    if (!routines.some(item => item.title === routine.title)) routines.push(routine)
  }

  const tasks = [...(current?.tasks || [])]
  for (const task of fallback.tasks || []) {
    if (!tasks.some(item => item.title === task.title && item.date === task.date)) tasks.push(task)
  }

  localStorage.setItem(AGENDA_MIGRATION_KEY, '1')
  return {
    ...fallback,
    ...current,
    routines,
    tasks,
    priorities: current?.priorities || fallback.priorities || {},
    completions: current?.completions || fallback.completions || {}
  }
}

export async function loadState(fallback) {
  try {
    const db = await openDb()
    const value = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const request = tx.objectStore(STORE_NAME).get(STATE_KEY)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    db.close()

    if (value) {
      const merged = mergeAgendaOnce(value, fallback)
      await saveState(merged)
      return merged
    }

    const legacy = localStorage.getItem('minha-rotina-v1')
    if (legacy) {
      const parsed = JSON.parse(legacy)
      const migrated = mergeAgendaOnce({ ...fallback, ...parsed, version: 2 }, fallback)
      await saveState(migrated)
      return migrated
    }

    localStorage.setItem(AGENDA_MIGRATION_KEY, '1')
    await saveState(fallback)
    return fallback
  } catch {
    const legacy = localStorage.getItem('minha-rotina-v2')
    const parsed = legacy ? JSON.parse(legacy) : fallback
    return mergeAgendaOnce(parsed, fallback)
  }
}

export async function saveState(state) {
  try {
    const db = await openDb()
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).put(state, STATE_KEY)
      tx.oncomplete = resolve
      tx.onerror = () => reject(tx.error)
    })
    db.close()
  } catch {
    localStorage.setItem('minha-rotina-v2', JSON.stringify(state))
  }
}
