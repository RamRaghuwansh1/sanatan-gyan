import {NextResponse} from 'next/server';
import {dbQuery} from '@/lib/db';
import {requireSuperAdmin} from '@/lib/auth/guards';
export async function GET(req:Request){
  try{
    await requireSuperAdmin();
    const u=new URL(req.url), limit=Math.min(Math.max(Number(u.searchParams.get('limit')||100),1),500), action=u.searchParams.get('action'), q=(u.searchParams.get('q')||'').trim();
    const r=await dbQuery(`SELECT a.id,a.action,a.entity_type,a.entity_id,a.metadata,a.created_at,a.ip_hash,u.email AS actor_email,u.name AS actor_name
      FROM audit_logs a LEFT JOIN users u ON u.id=a.actor_user_id
      WHERE ($1::text IS NULL OR a.action=$1) AND ($2='' OR LOWER(COALESCE(a.entity_type,'')) LIKE LOWER('%'||$2||'%') OR LOWER(COALESCE(u.email,'')) LIKE LOWER('%'||$2||'%') OR LOWER(COALESCE(u.name,'')) LIKE LOWER('%'||$2||'%'))
      ORDER BY a.created_at DESC LIMIT $3`,[action||null,q,limit]);
    return NextResponse.json({items:r.rows});
  }catch(e){return NextResponse.json({error:String(e).includes('FORBIDDEN')?'Forbidden':'Unauthorized'},{status:String(e).includes('FORBIDDEN')?403:401});}
}
