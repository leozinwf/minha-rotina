const DB_NAME = 'minha-rotina-db'
const STORE_NAME = 'state'
const STATE_KEY = 'app-state'

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

    if (value) return value

    const legacy = localStorage.getItem('minha-rotina-v1')
    if (legacy) {
      const parsed = JSON.parse(legacy)
      const migrated = { ...fallback, ...parsed, version: 2 }
      await saveState(migrated)
      return migrated
    }

    await saveState(fallback)
    return fallback
  } catch {
    const legacy = localStorage.getItem('minha-rotina-v2')
    return legacy ? JSON.parse(legacy) : fallback
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
