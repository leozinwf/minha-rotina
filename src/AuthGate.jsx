import React, { useEffect, useMemo, useState } from 'react'
import { createUserWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth'
import { auth, firebaseConfigured, firebaseMissingKeys } from './firebase'
import './auth.css'

const labels = {
  apiKey: 'VITE_FIREBASE_API_KEY', authDomain: 'VITE_FIREBASE_AUTH_DOMAIN', projectId: 'VITE_FIREBASE_PROJECT_ID',
  storageBucket: 'VITE_FIREBASE_STORAGE_BUCKET', messagingSenderId: 'VITE_FIREBASE_MESSAGING_SENDER_ID', appId: 'VITE_FIREBASE_APP_ID',
}

const friendlyName = user => user?.displayName?.trim() || user?.email?.split('@')?.[0] || 'Minha conta'
const initials = name => name.split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]?.toUpperCase()).join('') || 'MR'

export default function AuthGate({ children }) {
  const [user, setUser] = useState(null), [checking, setChecking] = useState(firebaseConfigured), [mode, setMode] = useState('login')
  const [name,setName]=useState(''), [email, setEmail] = useState(''), [password, setPassword] = useState(''), [showPassword,setShowPassword]=useState(false)
  const [error, setError] = useState(''), [busy, setBusy] = useState(false)
  const [accountOpen,setAccountOpen]=useState(false),[accountMsg,setAccountMsg]=useState(''),[accountName,setAccountName]=useState('')

  useEffect(() => {
    if (!firebaseConfigured || !auth) { setChecking(false); return }
    let finished = false
    const timeout = window.setTimeout(() => { if (!finished) { console.warn('Firebase Auth demorou para responder.'); setChecking(false) } }, 3000)
    const unsubscribe = onAuthStateChanged(auth,current=>{finished=true;clearTimeout(timeout);setUser(current);setAccountName(current?.displayName||'');setChecking(false)},err=>{finished=true;clearTimeout(timeout);console.error('Falha ao verificar sessão:',err);setChecking(false)})
    return()=>{finished=true;clearTimeout(timeout);unsubscribe()}
  }, [])

  const displayName=useMemo(()=>friendlyName(user),[user?.displayName,user?.email])

  if (!firebaseConfigured) return <main className="auth-shell"><section className="auth-card config-card"><span className="auth-kicker">Firebase</span><h1>Falta configurar o banco</h1><p>Adicione estas variáveis no Vercel e faça um novo deploy:</p><pre>{firebaseMissingKeys.map(key=>labels[key]).join('\n')}</pre></section></main>
  if (checking) return <main className="auth-shell"><section className="auth-card"><p>Verificando sessão...</p></section></main>

  if (!user) {
    const submit=async e=>{e.preventDefault();setError('');setBusy(true);try{
      if(mode==='register'){
        const result=await createUserWithEmailAndPassword(auth,email,password)
        await updateProfile(result.user,{displayName:name.trim()})
        setUser({...result.user,displayName:name.trim()})
      } else await signInWithEmailAndPassword(auth,email,password)
    }catch(err){const code=err?.code||'';if(code.includes('invalid-credential'))setError('E-mail ou senha inválidos.');else if(code.includes('email-already-in-use'))setError('Esse e-mail já possui uma conta.');else if(code.includes('weak-password'))setError('Use uma senha com pelo menos 6 caracteres.');else setError('Não foi possível autenticar.')}finally{setBusy(false)}}
    const forgot=async()=>{setError('');if(!email){setError('Digite seu e-mail primeiro para recuperar a senha.');return}try{await sendPasswordResetEmail(auth,email);setError('Enviamos um link de recuperação para seu e-mail.')}catch{setError('Não foi possível enviar a recuperação. Confira o e-mail informado.')}}
    return <main className="auth-shell"><section className="auth-card"><div className="auth-brand">MR</div><span className="auth-kicker">Minha Rotina</span><h1>{mode==='login'?'Entrar':'Criar conta'}</h1><p>Seus planejamentos ficam vinculados à sua conta.</p><form onSubmit={submit}>{mode==='register'&&<label><span>Nome</span><input type="text" required value={name} onChange={e=>setName(e.target.value)} placeholder="Como quer ser chamado?"/></label>}<label><span>E-mail</span><input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="voce@email.com"/></label><label><span>Senha</span><div className="auth-password"><input type={showPassword?'text':'password'} required minLength="6" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••"/><button type="button" onClick={()=>setShowPassword(v=>!v)}>{showPassword?'Ocultar':'Ver'}</button></div></label>{mode==='login'&&<button type="button" className="auth-forgot" onClick={forgot}>Esqueci minha senha</button>}{error&&<div className="auth-error">{error}</div>}<button className="auth-primary" disabled={busy}>{busy?'Aguarde...':mode==='login'?'Entrar':'Criar conta'}</button></form><button className="auth-link" onClick={()=>{setMode(mode==='login'?'register':'login');setError('');setShowPassword(false)}}>{mode==='login'?'Primeiro acesso? Criar conta':'Já tenho conta'}</button></section></main>
  }

  const resetPassword=async()=>{setAccountMsg('');try{await sendPasswordResetEmail(auth,user.email);setAccountMsg('E-mail para troca de senha enviado.')}catch(e){console.error(e);setAccountMsg('Não foi possível enviar o e-mail agora.')}}
  const saveName=async()=>{const clean=accountName.trim();if(!clean)return;setAccountMsg('');try{await updateProfile(auth.currentUser,{displayName:clean});setUser({...auth.currentUser,displayName:clean});setAccountMsg('Nome atualizado.')}catch(e){console.error(e);setAccountMsg('Não foi possível atualizar o nome agora.')}}

  return <div className="auth-app">
    <div className="auth-sidebar-account">
      <button className="auth-profile-button" onClick={()=>{setAccountName(user.displayName||'');setAccountOpen(true)}} title="Minha conta">
        <span className="auth-avatar">{initials(displayName)}</span>
        <span className="auth-profile-copy"><strong>{displayName}</strong><small>Minha conta</small></span>
      </button>
      <button className="auth-sidebar-logout" onClick={()=>signOut(auth)}>Sair</button>
    </div>
    {children}
    {accountOpen&&<div className="auth-modal-bg" onMouseDown={e=>e.target===e.currentTarget&&setAccountOpen(false)}><section className="auth-account-card"><button className="auth-close" onClick={()=>setAccountOpen(false)}>×</button><span className="auth-kicker">Conta</span><h2>Minha conta</h2><label><span>Nome</span><div className="auth-inline-field"><input value={accountName} onChange={e=>setAccountName(e.target.value)} placeholder="Seu nome"/><button onClick={saveName}>Salvar</button></div></label><label><span>E-mail</span><input value={user.email||''} readOnly/></label><p className="auth-hint">Sua senha atual não é exibida. Para alterá-la, enviamos um link seguro para seu e-mail.</p><button className="auth-primary" onClick={resetPassword}>Trocar senha por e-mail</button>{accountMsg&&<p className="auth-account-msg">{accountMsg}</p>}</section></div>}
  </div>
}
