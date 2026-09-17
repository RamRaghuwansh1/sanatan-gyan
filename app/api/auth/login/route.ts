import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { dbQuery } from '@/lib/db';
import { createSession } from '@/lib/auth/session';
export async function POST(req:Request){
  try{ const b=await req.json(); const email=String(b.email||'').trim().toLowerCase(); const password=String(b.password||'');
    const r=await dbQuery(`SELECT id,email,name,role,language,password_hash,is_active FROM users WHERE email=$1`,[email]); const u=r.rows[0];
    if(!u||!u.is_active||!u.password_hash||!(await bcrypt.compare(password,u.password_hash))) return NextResponse.json({error:'Invalid credentials'},{status:401});
    await createSession(u.id); return NextResponse.json({user:{id:u.id,email:u.email,name:u.name,role:u.role,language:u.language}});
  }catch{ return NextResponse.json({error:'Login failed'},{status:500}); }
}
