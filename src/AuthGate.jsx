import React, { useEffect, useState } from 'react'
import { createUserWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth, firebaseConfigured, firebaseMissingKeys } from './firebase'
import './auth.css'

const labels = {
  apiKey: 'VITE_FIREBASE_API_KEY', authDomain: 'VITE_FIREBASE_AUTH_DOMAIN', projectId: 'VITE_FIREBASE_PROJECT_ID',
  storageBucket: 'VITE_FIREBASE_STORAGE_BUCKET', messagingSenderId: 'VITE_FIREBASE_MESSAGING_SENDER_ID', appId: 'VITE_FIREBASE_APP_ID',
}

export default function AuthGate({ children }) {
  const [user, setUser] = useState(null), [checking, setChecking] = useState(firebaseConfigured), [mode, setMode] = useState('login')
  const [email, setEmail] = useState(''), [password, setPassword] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false)
  const [accountOpen,setAccountOpen]=useState(false),[accountMsg,setAccountMsg]=useState('')

  useEffect(() => {
    if (!firebaseConfigured || !auth) { setChecking(false); return }
    let finished = false
    const timeout = window.setTimeout(() => { if (!finished) { console.warn('Firebase Auth demorou para responder.'); setChecking(false) } }, 3000)
    const unsubscribe = onAuthStateChanged(auth,current=>{finished=true;clearTimeout(timeout);setUser(current);setChecking(false)},err=>{finished=true;clearTimeout(timeout);console.error('Falha ao verificar sessão:',err);setChecking(false)})
    return()=>{finished=true;clearTimeout(timeout);unsubscribe()}
  }, [])

  if (!firebaseConfigured) return <main className="auth-shell"><section className="auth-card config-card"><span className="auth-kicker">Firebase</span><h1>Falta configurar o banco</h1><p>Adicione estas variáveis no Vercel e faça um novo deploy:</p><pre>{firebaseMissingKeys.map(key=>labels[key]).join('\n')}</pre></section></main>
  if (checking) return <main className="auth-shell"><section className="auth-card"><p>Verificando sessão...</p></section></main>

  if (!user) {
    const submit=async e=>{e.preventDefault();setError('');setBusy(true);try{if(mode==='register')await createUserWithEmailAndPassword(auth,email,password);else await signInWithEmailAndPassword(auth,email,password)}catch(err){const code=err?.code||'';if(code.includes('invalid-credential'))setError('E-mail ou senha inválidos.');else if(code.includes('email-already-in-use'))setError('Esse e-mail já possui uma conta.');else if(code.includes('weak-password'))setError('Use uma senha com pelo menos 6 caracteres.');else setError('Não foi possível autenticar.')}finally{setBusy(false)}}
    return <main className="auth-shell"><section className="auth-card"><div className="auth-brand">MR</div><span className="auth-kicker">Minha Rotina</span><h1>{mode==='login'?'Entrar':'Criar conta'}</h1><p>Seus planejamentos ficam vinculados à sua conta.</p><form onSubmit={submit}><label><span>E-mail</span><input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="voce@email.com"/></label><label><span>Senha</span><input type="password" required minLength="6" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••"/></label>{error&&<div className="auth-error">{error}</div>}<button className="auth-primary" disabled={busy}>{busy?'Aguarde...':mode==='login'?'Entrar':'Criar conta'}</button></form><button className="auth-link" onClick={()=>{setMode(mode==='login'?'register':'login');setError('')}}>{mode==='login'?'Primeiro acesso? Criar conta':'Já tenho conta'}</button></section></main>
  }

  const resetPassword=async()=>{setAccountMsg('');try{await sendPasswordResetEmail(auth,user.email);setAccountMsg('E-mail para troca de senha enviado.')}catch(e){console.error(e);setAccountMsg('Não foi possível enviar o e-mail agora.')}}
  return <div className="auth-app"><div className="auth-account-actions"><button className="auth-account" onClick={()=>setAccountOpen(true)}>Minha conta</button><button className="auth-logout" onClick={()=>signOut(auth)}>Sair</button></div>{children}{accountOpen&&<div className="auth-modal-bg" onMouseDown={e=>e.target===e.currentTarget&&setAccountOpen(false)}><section className="auth-account-card"><button className="auth-close" onClick={()=>setAccountOpen(false)}>×</button><span className="auth-kicker">Conta</span><h2>Minha conta</h2><label><span>E-mail</span><input value={user.email||''} readOnly/></label><p className="auth-hint">A senha não é exibida por segurança. Para alterá-la, enviaremos um link para seu e-mail.</p><button className="auth-primary" onClick={resetPassword}>Trocar senha por e-mail</button>{accountMsg&&<p className="auth-account-msg">{accountMsg}</p>}<button className="auth-link" onClick={()=>signOut(auth)}>Sair da conta</button></section></div>}</div>
}
