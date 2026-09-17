import { NextResponse } from 'next/server';
import { dbQuery } from '@/lib/db';
import { verifyWebhookSignature } from '@/lib/payments/razorpay';

export async function POST(req:Request){
  const body=await req.text(); const sig=req.headers.get('x-razorpay-signature')||'';
  try{
    if(!verifyWebhookSignature(body,sig)) return NextResponse.json({error:'Invalid signature'},{status:400});
    const event=JSON.parse(body); const eventId=String(event?.id||'');
    if(eventId){ const seen=await dbQuery(`SELECT 1 FROM payment_webhook_events WHERE event_id=$1`,[eventId]); if(seen.rowCount) return NextResponse.json({ok:true,duplicate:true}); }
    const entity=event?.payload?.payment?.entity; const paymentId=String(entity?.id||''); const razorpayOrderId=String(entity?.order_id||'');
    const status=event.event==='payment.captured'?'CAPTURED':event.event==='payment.failed'?'FAILED':null;
    if(!paymentId||!razorpayOrderId||!status){ if(eventId) await dbQuery(`INSERT INTO payment_webhook_events(event_id,event_type) VALUES($1,$2) ON CONFLICT DO NOTHING`,[eventId,String(event.event||'unknown')]); return NextResponse.json({ok:true}); }
    const order=await dbQuery(`SELECT id,user_id,scripture_id,amount_inr FROM orders WHERE razorpay_order_id=$1`,[razorpayOrderId]);
    if(!order.rowCount){ if(eventId) await dbQuery(`INSERT INTO payment_webhook_events(event_id,event_type) VALUES($1,$2) ON CONFLICT DO NOTHING`,[eventId,String(event.event)]); return NextResponse.json({ok:true}); }
    const o=order.rows[0]; const gatewayAmount=Math.round(Number(entity.amount||0)/100);
    if(gatewayAmount!==Number(o.amount_inr)) return NextResponse.json({error:'Amount mismatch'},{status:400});
    await dbQuery(`INSERT INTO payments(order_id,razorpay_payment_id,amount_inr,status,raw_event_id) VALUES($1,$2,$3,$4,$5) ON CONFLICT(razorpay_payment_id) DO UPDATE SET status=EXCLUDED.status`,[o.id,paymentId,gatewayAmount,status,eventId||paymentId]);
    await dbQuery(`UPDATE orders SET status=$1,updated_at=NOW() WHERE id=$2`,[status,o.id]);
    if(status==='CAPTURED'&&o.scripture_id) await dbQuery(`INSERT INTO entitlements(user_id,scripture_id,order_id) VALUES($1,$2,$3) ON CONFLICT(user_id,scripture_id) DO UPDATE SET status='ACTIVE',order_id=EXCLUDED.order_id`,[o.user_id,o.scripture_id,o.id]);
    if(eventId) await dbQuery(`INSERT INTO payment_webhook_events(event_id,event_type) VALUES($1,$2) ON CONFLICT DO NOTHING`,[eventId,String(event.event)]);
    return NextResponse.json({ok:true});
  }catch{return NextResponse.json({error:'Webhook rejected'},{status:400});}
}
