import {NextResponse} from 'next/server';
import {dbQuery} from '@/lib/db';
import {requireSuperAdmin} from '@/lib/auth/guards';
import {audit} from '@/lib/admin/audit';

export async function GET(req:Request){
  try{
    await requireSuperAdmin();
    const u=new URL(req.url), q=(u.searchParams.get('q')||'').trim();
    const r=await dbQuery(`SELECT e.id,e.user_id,e.scripture_id,e.order_id,e.status,e.granted_at,
      u.email,u.name,s.title_hi,s.title_en,s.slug,o.razorpay_order_id
      FROM entitlements e JOIN users u ON u.id=e.user_id JOIN scriptures s ON s.id=e.scripture_id
      LEFT JOIN orders o ON o.id=e.order_id
      WHERE ($1='' OR LOWER(COALESCE(u.email,'')) LIKE LOWER('%'||$1||'%') OR LOWER(COALESCE(u.name,'')) LIKE LOWER('%'||$1||'%') OR LOWER(s.title_en) LIKE LOWER('%'||$1||'%') OR LOWER(s.slug) LIKE LOWER('%'||$1||'%'))
      ORDER BY e.granted_at DESC LIMIT 500`,[q]);
    return NextResponse.json({items:r.rows});
  }catch(e){return NextResponse.json({error:String(e).includes('FORBIDDEN')?'Forbidden':'Unauthorized'},{status:String(e).includes('FORBIDDEN')?403:401});}
}

export async function POST(req:Request){
  try{
    const actor=await requireSuperAdmin(); const b=await req.json();
    if(!b.user_id||!b.scripture_id) return NextResponse.json({error:'user_id and scripture_id are required'},{status:400});
    const r=await dbQuery(`INSERT INTO entitlements(user_id,scripture_id,status) VALUES($1,$2,'ACTIVE')
      ON CONFLICT(user_id,scripture_id) DO UPDATE SET status='ACTIVE',granted_at=NOW()
      RETURNING *`,[b.user_id,b.scripture_id]);
    await audit(actor.id,'ENTITLEMENT_GRANTED','entitlements',r.rows[0].id,{user_id:b.user_id,scripture_id:b.scripture_id,manual:true});
    return NextResponse.json({item:r.rows[0]},{status:201});
  }catch(e){return NextResponse.json({error:String(e).includes('FORBIDDEN')?'Forbidden':'Could not grant entitlement'},{status:String(e).includes('FORBIDDEN')?403:400});}
}

export async function PATCH(req:Request){
  try{
    const actor=await requireSuperAdmin(); const b=await req.json();
    if(!b.id || !['ACTIVE','REVOKED','EXPIRED'].includes(b.status)) return NextResponse.json({error:'id and valid status required'},{status:400});
    const r=await dbQuery(`UPDATE entitlements SET status=$1 WHERE id=$2 RETURNING *`,[b.status,b.id]);
    if(!r.rowCount) return NextResponse.json({error:'Not found'},{status:404});
    await audit(actor.id,b.status==='ACTIVE'?'ENTITLEMENT_ACTIVATED':'ENTITLEMENT_REVOKED','entitlements',b.id,{status:b.status});
    return NextResponse.json({item:r.rows[0]});
  }catch(e){return NextResponse.json({error:String(e).includes('FORBIDDEN')?'Forbidden':'Unauthorized'},{status:String(e).includes('FORBIDDEN')?403:401});}
}
