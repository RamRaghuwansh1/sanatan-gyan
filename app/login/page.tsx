'use client';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage(){
  const router=useRouter(); const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [error,setError]=useState(''); const [busy,setBusy]=useState(false);
  async function submit(e:FormEvent){e.preventDefault();setBusy(true);setError('');const r=await fetch('/api/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email,password})});const d=await r.json();if(!r.ok){setError(d.error||'Login failed');setBusy(false);return;}router.push('/admin');}
  return <main className="auth-page"><form className="auth-card" onSubmit={submit}><div className="eyebrow">SANATAN GYAN</div><h1>Admin Login</h1><p>Secure server-side authentication for the management center.</p><label>Email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Password<input type="password" required value={password} onChange={e=>setPassword(e.target.value)}/></label>{error&&<div className="error">{error}</div>}<button className="primary" disabled={busy}>{busy?'Signing in…':'Sign in'}</button><small>No demo credentials are embedded. Create the first admin through the database bootstrap process.</small></form></main>
}
