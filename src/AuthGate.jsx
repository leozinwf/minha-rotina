import React, { useEffect, useState } from 'react'
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth, firebaseConfigured, firebaseMissingKeys } from './firebase'
import './auth.css'

const labels = {
  apiKey: 'VITE_FIREBASE_API_KEY',
  authDomain: 'VITE_FIREBASE_AUTH_DOMAIN',
  projectId: 'VITE_FIREBASE_PROJECT_ID',
  storageBucket: 'VITE_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'VITE_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'VITE_FIREBASE_APP_ID',
}

export default function AuthGate({ children }) {
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(firebaseConfigured)
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!firebaseConfigured || !auth) {
      setChecking(false)
      return
    }

    let finished = false
    const timeout = window.setTimeout(() => {
      if (!finished) {
        console.warn('Firebase Auth demorou para responder; liberando a interface.')
        setChecking(false)
      }
    }, 3000)

    const unsubscribe = onAuthStateChanged(
      auth,
      current => {
        finished = true
        window.clearTimeout(timeout)
        setUser(current)
        setChecking(false)
      },
      err => {
        finished = true
        window.clearTimeout(timeout)
        console.error('Falha ao verificar sessão do Firebase:', err)
        setChecking(false)
      }
    )

    return () => {
      finished = true
      window.clearTimeout(timeout)
      unsubscribe()
    }
  }, [])

  if (!firebaseConfigured) {
    return <main className="auth-shell"><section className="auth-card config-card">
      <span className="auth-kicker">Firebase</span>
      <h1>Falta configurar o banco</h1>
      <p>O app está pronto para usar Firebase Authentication + Firestore. Adicione estas variáveis no Vercel e faça um novo deploy:</p>
      <pre>{firebaseMissingKeys.map(key => labels[key]).join('\n')}</pre>
      <p className="auth-hint">Depois disso, habilite Email/Senha em Authentication e crie o Cloud Firestore no console do Firebase.</p>
    </section></main>
  }

  if (checking) return <main className="auth-shell"><section className="auth-card"><p>Verificando sessão...</p></section></main>

  if (!user) {
    const submit = async e => {
      e.preventDefault()
      setError('')
      setBusy(true)
      try {
        if (mode === 'register') await createUserWithEmailAndPassword(auth, email, password)
        else await signInWithEmailAndPassword(auth, email, password)
      } catch (err) {
        const code = err?.code || ''
        if (code.includes('invalid-credential')) setError('E-mail ou senha inválidos.')
        else if (code.includes('email-already-in-use')) setError('Esse e-mail já possui uma conta.')
        else if (code.includes('weak-password')) setError('Use uma senha com pelo menos 6 caracteres.')
        else setError('Não foi possível autenticar. Verifique a configuração do Firebase.')
      } finally { setBusy(false) }
    }
    return <main className="auth-shell"><section className="auth-card">
      <div className="auth-brand">MR</div>
      <span className="auth-kicker">Minha Rotina</span>
      <h1>{mode === 'login' ? 'Entrar' : 'Criar conta'}</h1>
      <p>Seus planejamentos ficam sincronizados entre seus dispositivos.</p>
      <form onSubmit={submit}>
        <label><span>E-mail</span><input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="voce@email.com" /></label>
        <label><span>Senha</span><input type="password" required minLength="6" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" /></label>
        {error && <div className="auth-error">{error}</div>}
        <button className="auth-primary" disabled={busy}>{busy ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}</button>
      </form>
      <button className="auth-link" onClick={()=>{setMode(mode==='login'?'register':'login');setError('')}}>{mode==='login'?'Primeiro acesso? Criar conta':'Já tenho conta'}</button>
    </section></main>
  }

  return <div className="auth-app"><button className="auth-logout" onClick={()=>signOut(auth)}>Sair</button>{children}</div>
}
