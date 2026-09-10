const DB_NAME = 'minha-rotina-db'
const STORE_NAME = 'state'
const STATE_KEY = 'app-state'
const AGENDA_MIGRATION_KEY = 'minha-rotina-agenda-sep-2026-installed'
const FALLBACK_KEY = 'minha-rotina-v2'
const DB_TIMEOUT_MS = 1500

function withTimeout(promise, ms = DB_TIMEOUT_MS) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('IndexedDB timeout')), ms))
  ])
}

function openDb() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB indisponível'))
      return
    }

    const request = indexedDB.open(DB_NAME, 1)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME)
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error || new Error('Erro ao abrir IndexedDB'))
    request.onblocked = () => reject(new Error('IndexedDB bloqueado por outra aba/conexão'))
  })
}

function safeLocalGet(key) {
  try { return localStorage.getItem(key) } catch { return null }
}

function safeLocalSet(key, value) {
  try { localStorage.setItem(key, value) } catch {}
}

function mergeAgendaOnce(current, fallback) {
  if (safeLocalGet(AGENDA_MIGRATION_KEY)) return current

  const routines = [...(current?.routines || [])]
  for (const routine of fallback.routines || []) {
    if (!routines.some(item => item.title === routine.title)) routines.push(routine)
  }

  const tasks = [...(current?.tasks || [])]
  for (const task of fallback.tasks || []) {
    if (!tasks.some(item => item.title === task.title && item.date === task.date)) tasks.push(task)
  }

  safeLocalSet(AGENDA_MIGRATION_KEY, '1')

  return {
    ...fallback,
    ...current,
    routines,
    tasks,
    priorities: current?.priorities || fallback.priorities || {},
    completions: current?.completions || fallback.completions || {}
  }
}

function loadLocalFallback(fallback) {
  try {
    const saved = safeLocalGet(FALLBACK_KEY) || safeLocalGet('minha-rotina-v1')
    if (!saved) return fallback
    return mergeAgendaOnce({ ...fallback, ...JSON.parse(saved) }, fallback)
  } catch {
    return fallback
  }
}

export async function loadState(fallback) {
  try {
    const db = await withTimeout(openDb())

    const value = await withTimeout(new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const request = tx.objectStore(STORE_NAME).get(STATE_KEY)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error || new Error('Erro ao ler IndexedDB'))
      tx.onabort = () => reject(tx.error || new Error('Leitura IndexedDB abortada'))
    }))

    db.close()

    if (value) {
      const merged = mergeAgendaOnce(value, fallback)
      safeLocalSet(FALLBACK_KEY, JSON.stringify(merged))
      return merged
    }

    const local = loadLocalFallback(fallback)
    safeLocalSet(AGENDA_MIGRATION_KEY, '1')
    safeLocalSet(FALLBACK_KEY, JSON.stringify(local))

    // Não bloqueia a abertura da aplicação esperando a persistência no IndexedDB.
    saveState(local)
    return local
  } catch (error) {
    console.warn('[Minha Rotina] IndexedDB indisponível; usando armazenamento local.', error)
    return loadLocalFallback(fallback)
  }
}

export async function saveState(state) {
  // Mantém sempre uma cópia local rápida para recuperação.
  safeLocalSet(FALLBACK_KEY, JSON.stringify(state))

  try {
    const db = await withTimeout(openDb())

    await withTimeout(new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).put(state, STATE_KEY)
      tx.oncomplete = resolve
      tx.onerror = () => reject(tx.error || new Error('Erro ao salvar IndexedDB'))
      tx.onabort = () => reject(tx.error || new Error('Gravação IndexedDB abortada'))
    }))

    db.close()
  } catch (error) {
    console.warn('[Minha Rotina] Salvamento no IndexedDB falhou; cópia local preservada.', error)
  }
}
