import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db, firebaseConfigured } from './firebase'

const LOCAL_KEY='minha-rotina-firestore-backup'
const LEGACY_KEYS=['minha-rotina-v2','minha-rotina-v1']
const TIMEOUT_MS=3500

function isObject(value){
  return value && typeof value === 'object' && !Array.isArray(value)
}

function sanitizeState(value,fallback){
  if(!isObject(value)) return fallback
  return {
    ...fallback,
    ...value,
    routines:Array.isArray(value.routines)?value.routines:(fallback.routines||[]),
    tasks:Array.isArray(value.tasks)?value.tasks:(fallback.tasks||[]),
    priorities:isObject(value.priorities)?value.priorities:(fallback.priorities||{}),
    completions:isObject(value.completions)?value.completions:(fallback.completions||{}),
    notes:Array.isArray(value.notes)?value.notes:(fallback.notes||[]),
    noteCategories:Array.isArray(value.noteCategories)?value.noteCategories:(fallback.noteCategories||[]),
    quickTemplates:Array.isArray(value.quickTemplates)?value.quickTemplates:(fallback.quickTemplates||[]),
    yearPlans:isObject(value.yearPlans)?value.yearPlans:(fallback.yearPlans||{})
  }
}

function readLocal(fallback){
  try{
    const direct=localStorage.getItem(LOCAL_KEY)
    if(direct)return sanitizeState(JSON.parse(direct),fallback)
    for(const key of LEGACY_KEYS){
      const value=localStorage.getItem(key)
      if(value)return sanitizeState(JSON.parse(value),fallback)
    }
  }catch(error){
    console.warn('Backup local inválido; usando estado inicial.',error)
  }
  return fallback
}

function writeLocal(state){
  try{localStorage.setItem(LOCAL_KEY,JSON.stringify(state))}catch(error){
    console.warn('Não foi possível gravar backup local.',error)
  }
}

function userDoc(){
  const user=auth?.currentUser
  if(!firebaseConfigured||!db||!user)return null
  return doc(db,'users',user.uid,'app','state')
}

function withTimeout(promise,label='firestore-timeout'){
  return Promise.race([
    Promise.resolve(promise),
    new Promise((_,reject)=>setTimeout(()=>reject(new Error(label)),TIMEOUT_MS))
  ])
}

function syncFromFirestore(local){
  const ref=userDoc()
  if(!ref)return

  void withTimeout(getDoc(ref),'firestore-read-timeout')
    .then(snap=>{
      if(snap?.exists?.()){
        const remote=sanitizeState(snap.data()?.state,local)
        writeLocal(remote)
        return
      }
      return withTimeout(
        setDoc(ref,{state:local,updatedAt:Date.now()},{merge:true}),
        'firestore-first-write-timeout'
      )
    })
    .catch(error=>console.warn('Sincronização inicial do Firestore falhou; app segue localmente.',error))
}

export function loadState(fallback){
  const safeFallback=sanitizeState(fallback,fallback)
  const local=readLocal(safeFallback)

  // Nunca bloqueia a interface esperando o Firestore.
  // O app abre imediatamente e a sincronização remota acontece em segundo plano.
  queueMicrotask(()=>syncFromFirestore(local))
  return Promise.resolve(local)
}

export async function saveState(state){
  const safe=isObject(state)?state:{}
  writeLocal(safe)
  try{
    const ref=userDoc()
    if(!ref)return
    await withTimeout(
      setDoc(ref,{state:safe,updatedAt:Date.now()},{merge:true}),
      'firestore-write-timeout'
    )
  }catch(error){
    console.warn('Não foi possível sincronizar com o Firestore; backup local mantido.',error)
  }
}
