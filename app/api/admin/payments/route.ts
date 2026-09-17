import {NextResponse} from 'next/server';
import {dbQuery} from '@/lib/db';
import {requireSuperAdmin} from '@/lib/auth/guards';

const select=`o.id,o.user_id,o.scripture_id,o.razorpay_order_id,o.amount_inr,o.currency,o.status,o.created_at,o.updated_at,
  u.email,u.name,u.telegram_user_id,s.slug,s.title_hi,s.title_en,
  p.id AS payment_id,p.razorpay_payment_id,p.amount_inr AS paid_amount,p.status AS payment_status,p.created_at AS paid_at`;

export async function GET(req:Request){
  try{
    await requireSuperAdmin();
    const u=new URL(req.url), q=(u.searchParams.get('q')||'').trim(), id=u.searchParams.get('id');
    if(id){
      const r=await dbQuery(`SELECT ${select} FROM orders o LEFT JOIN users u ON u.id=o.user_id LEFT JOIN scriptures s ON s.id=o.scripture_id
        LEFT JOIN LATERAL (SELECT * FROM payments WHERE order_id=o.id ORDER BY created_at DESC LIMIT 1) p ON true WHERE o.id=$1 OR o.razorpay_order_id=$1 LIMIT 1`,[id]);
      if(!r.rowCount)return NextResponse.json({error:'Order not found'},{status:404});
      return NextResponse.json({item:r.rows[0]});
    }
    const r=await dbQuery(`SELECT ${select} FROM orders o LEFT JOIN users u ON u.id=o.user_id LEFT JOIN scriptures s ON s.id=o.scripture_id
      LEFT JOIN LATERAL (SELECT * FROM payments WHERE order_id=o.id ORDER BY created_at DESC LIMIT 1) p ON true
      WHERE ($1='' OR LOWER(COALESCE(o.razorpay_order_id,'')) LIKE LOWER('%'||$1||'%') OR LOWER(COALESCE(u.email,'')) LIKE LOWER('%'||$1||'%') OR LOWER(COALESCE(u.name,'')) LIKE LOWER('%'||$1||'%') OR LOWER(COALESCE(s.title_en,'')) LIKE LOWER('%'||$1||'%'))
      ORDER BY o.created_at DESC LIMIT 500`,[q]);
    return NextResponse.json({items:r.rows});
  }catch(e){return NextResponse.json({error:String(e).includes('FORBIDDEN')?'Forbidden':'Unauthorized'},{status:String(e).includes('FORBIDDEN')?403:401});}
}
