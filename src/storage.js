import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db, firebaseConfigured } from './firebase'

const LOCAL_KEY='minha-rotina-firestore-backup'
const LEGACY_KEYS=['minha-rotina-v2','minha-rotina-v1']
const TIMEOUT_MS=3500

function readLocal(fallback){
  try{
    const direct=localStorage.getItem(LOCAL_KEY)
    if(direct)return JSON.parse(direct)
    for(const key of LEGACY_KEYS){
      const value=localStorage.getItem(key)
      if(value)return JSON.parse(value)
    }
  }catch{}
  return fallback
}

function writeLocal(state){
  try{localStorage.setItem(LOCAL_KEY,JSON.stringify(state))}catch{}
}

function userDoc(){
  const user=auth?.currentUser
  if(!firebaseConfigured||!db||!user)return null
  return doc(db,'users',user.uid,'app','state')
}

function withTimeout(promise,label='firestore-timeout'){
  return Promise.race([
    promise,
    new Promise((_,reject)=>setTimeout(()=>reject(new Error(label)),TIMEOUT_MS))
  ])
}

export async function loadState(fallback){
  const local=readLocal(fallback)
  const ref=userDoc()
  if(!ref)return local

  try{
    const snap=await withTimeout(getDoc(ref),'firestore-read-timeout')
    if(snap.exists()){
      const remote=snap.data()?.state||local
      writeLocal(remote)
      return remote
    }

    // Primeiro acesso: o app deve abrir imediatamente com o estado local.
    // A criação do documento remoto acontece em segundo plano e nunca bloqueia a UI.
    withTimeout(setDoc(ref,{state:local,updatedAt:Date.now()},{merge:true}),'firestore-first-write-timeout')
      .catch(error=>console.warn('Primeira sincronização do Firestore falhou; app continuará localmente.',error))
    return local
  }catch(error){
    console.warn('Firestore indisponível; usando backup local.',error)
    return local
  }
}

export async function saveState(state){
  writeLocal(state)
  const ref=userDoc()
  if(!ref)return
  try{
    await withTimeout(setDoc(ref,{state,updatedAt:Date.now()},{merge:true}),'firestore-write-timeout')
  }catch(error){
    console.warn('Não foi possível sincronizar com o Firestore; backup local mantido.',error)
  }
}
