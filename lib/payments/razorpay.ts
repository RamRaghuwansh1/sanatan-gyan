import { hmacSha256, safeEqualHex } from '@/lib/security/signature';

export type RazorpayOrder = { id:string; amount:number; currency:string; status:string; receipt:string };

function required(name:string){ const value=process.env[name]; if(!value) throw new Error(`${name} is not configured`); return value; }
export function razorpayAuth(){return Buffer.from(`${required('RAZORPAY_KEY_ID')}:${required('RAZORPAY_KEY_SECRET')}`).toString('base64');}

export async function getRazorpayPayment(paymentId:string){
  if(!paymentId) throw new Error('Missing Razorpay payment id');
  const r=await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`,{
    headers:{Authorization:`Basic ${razorpayAuth()}`},
    cache:'no-store'
  });
  if(!r.ok) throw new Error(`Razorpay payment lookup failed ${r.status}`);
  return r.json() as Promise<{id:string;order_id:string;amount:number;currency:string;status:string}>;
}

export async function createRazorpayOrder(amountInr:number,receipt:string){
  if(!Number.isInteger(amountInr)||amountInr<1) throw new Error('Invalid INR amount');
  const r=await fetch('https://api.razorpay.com/v1/orders',{method:'POST',headers:{Authorization:`Basic ${razorpayAuth()}`,'Content-Type':'application/json'},body:JSON.stringify({amount:amountInr*100,currency:'INR',receipt,payment_capture:1}),cache:'no-store'});
  if(!r.ok) throw new Error(`Razorpay order failed ${r.status}`);
  return r.json() as Promise<RazorpayOrder>;
}
export function verifyPaymentSignature(orderId:string,paymentId:string,signature:string){
  const expected=hmacSha256(required('RAZORPAY_KEY_SECRET'),`${orderId}|${paymentId}`); return safeEqualHex(expected,signature);
}
export function verifyWebhookSignature(body:string,signature:string){
  const expected=hmacSha256(required('RAZORPAY_WEBHOOK_SECRET'),body); return safeEqualHex(expected,signature);
}
export function razorpayConfigured(){return Boolean(process.env.RAZORPAY_KEY_ID&&process.env.RAZORPAY_KEY_SECRET&&process.env.RAZORPAY_WEBHOOK_SECRET);}
