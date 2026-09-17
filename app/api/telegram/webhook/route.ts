import { NextResponse } from 'next/server';
import { sendTelegramMessage } from '@/lib/telegram/client';
import { dbQuery } from '@/lib/db';

export async function POST(req:Request){
  const secret=process.env.TELEGRAM_WEBHOOK_SECRET;
  if(!secret || req.headers.get('x-telegram-bot-api-secret-token')!==secret) return NextResponse.json({error:'Forbidden'},{status:403});
  try{
    const u=await req.json();
    if(Number.isInteger(u?.update_id)){
      const inserted=await dbQuery(`INSERT INTO telegram_updates(update_id) VALUES($1) ON CONFLICT DO NOTHING RETURNING update_id`,[u.update_id]);
      if(!inserted.rowCount) return NextResponse.json({ok:true,duplicate:true});
    }
    const m=u.message;
    if(!m?.chat?.id) return NextResponse.json({ok:true});
    const tid=String(m.from?.id??m.chat.id);
    await dbQuery(`INSERT INTO users(telegram_user_id,name,language) VALUES($1,$2,'hi') ON CONFLICT(telegram_user_id) DO UPDATE SET name=EXCLUDED.name,updated_at=NOW()`,[tid,[m.from?.first_name,m.from?.last_name].filter(Boolean).join(' ')||null]);
    if(m.text==='/start') await sendTelegramMessage(String(m.chat.id),'🪔 Sanatan Gyan\n\nGranth, Jiwan Charitra aur Sanatan Gyan ke liye menu ka upyog karein.');
    return NextResponse.json({ok:true});
  }catch{return NextResponse.json({error:'Telegram webhook processing failed'},{status:500});}
}
