import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { dbQuery } from '@/lib/db';
import { createSession } from '@/lib/auth/session';
import { audit } from '@/lib/admin/audit';
export async function POST(req:Request){
  try{
    const b=await req.json(); const email=String(b.email||'').trim().toLowerCase(); const password=String(b.password||''); const name=String(b.name||'').trim();
    if(!/^\S+@\S+\.\S+$/.test(email)||password.length<10) return NextResponse.json({error:'Valid email and password of at least 10 characters required'},{status:400});
    const exists=await dbQuery(`SELECT id FROM users WHERE email=$1`,[email]); if(exists.rowCount) return NextResponse.json({error:'Account already exists'},{status:409});
    const hash=await bcrypt.hash(password,12); const r=await dbQuery(`INSERT INTO users(email,name,password_hash) VALUES($1,$2,$3) RETURNING id,email,name,role,language`,[email,name||null,hash]);
    await createSession(r.rows[0].id); await audit(r.rows[0].id,'USER_REGISTERED','users',r.rows[0].id);
    return NextResponse.json({user:r.rows[0]},{status:201});
  }catch(e){ return NextResponse.json({error:'Registration failed'},{status:500}); }
}
