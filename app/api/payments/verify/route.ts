import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/guards';
import { dbQuery } from '@/lib/db';
import { getRazorpayPayment, verifyPaymentSignature } from '@/lib/payments/razorpay';

export async function POST(req:Request){
  try {
    const user=await requireUser();
    const b=await req.json();
    const orderId=String(b.razorpay_order_id||''); const paymentId=String(b.razorpay_payment_id||''); const signature=String(b.razorpay_signature||'');
    if(!orderId||!paymentId||!signature) return NextResponse.json({error:'Missing payment verification fields'},{status:400});
    if(!verifyPaymentSignature(orderId,paymentId,signature)) return NextResponse.json({error:'Invalid payment signature'},{status:400});
    const gatewayPayment=await getRazorpayPayment(paymentId);
    if(gatewayPayment.id!==paymentId || gatewayPayment.order_id!==orderId || gatewayPayment.currency!=='INR' || gatewayPayment.status!=='captured') return NextResponse.json({error:'Gateway payment verification failed'},{status:400});
    const order=await dbQuery(`SELECT id,user_id,scripture_id,amount_inr,status FROM orders WHERE razorpay_order_id=$1 AND user_id=$2`,[orderId,user.id]);
    if(!order.rowCount) return NextResponse.json({error:'Order not found'},{status:404});
    const o=order.rows[0];
    if(Math.round(Number(gatewayPayment.amount)/100)!==Number(o.amount_inr)) return NextResponse.json({error:'Payment amount mismatch'},{status:400});
    const existing=await dbQuery(`SELECT id,status FROM payments WHERE razorpay_payment_id=$1`,[paymentId]);
    if(!existing.rowCount){
      await dbQuery(`INSERT INTO payments(order_id,razorpay_payment_id,razorpay_signature,amount_inr,status,raw_event_id) VALUES($1,$2,$3,$4,'CAPTURED',$2)`,[o.id,paymentId,signature,o.amount_inr]);
    }
    await dbQuery(`UPDATE orders SET status='CAPTURED',updated_at=NOW() WHERE id=$1`,[o.id]);
    if(o.scripture_id) await dbQuery(`INSERT INTO entitlements(user_id,scripture_id,order_id) VALUES($1,$2,$3) ON CONFLICT(user_id,scripture_id) DO UPDATE SET status='ACTIVE',order_id=EXCLUDED.order_id`,[user.id,o.scripture_id,o.id]);
    return NextResponse.json({ok:true,orderId:o.id});
  } catch { return NextResponse.json({error:'Payment verification unavailable'},{status:503}); }
}
