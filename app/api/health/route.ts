import { dbQuery } from '@/lib/db';
import { razorpayConfigured } from '@/lib/payments/razorpay';

export async function GET(){
  const started=Date.now();
  try{
    await dbQuery('SELECT 1');
    return Response.json({ok:true,service:'sanatan-gyan-v2',phase:'production-integration',checks:{database:true,razorpay:razorpayConfigured(),telegram:Boolean(process.env.TELEGRAM_BOT_TOKEN&&process.env.TELEGRAM_WEBHOOK_SECRET),storage:Boolean(process.env.STORAGE_BUCKET&&process.env.STORAGE_ACCESS_KEY_ID&&process.env.STORAGE_SECRET_ACCESS_KEY),aanu:Boolean(process.env.AANU_BASE_URL&&process.env.AANU_SHARED_SECRET)},latency_ms:Date.now()-started});
  }catch{return Response.json({ok:false,service:'sanatan-gyan-v2',checks:{database:false}}, {status:503});}
}
