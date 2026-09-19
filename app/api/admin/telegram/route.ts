import {NextResponse} from 'next/server';
import {dbQuery} from '@/lib/db';
import {requireAdmin} from '@/lib/auth/guards';
import {audit} from '@/lib/admin/audit';
import {telegramApi,setTelegramWebhook,getTelegramWebhookInfo} from '@/lib/telegram/client';
import {ADMIN_TELEGRAM_IDS} from '@/lib/telegram/admin-ids';

export async function GET(){
  try{
    await requireAdmin();
    const [settings,me,webhook]=await Promise.all([
      dbQuery(`SELECT key,value,updated_at FROM telegram_settings ORDER BY key`),
      (async()=>{try{return await telegramApi('getMe',{})}catch(e){return {ok:false,error:String(e)}}})(),
      (async()=>{try{return await getTelegramWebhookInfo()}catch(e){return {ok:false,error:String(e)}}})()
    ]);
    return NextResponse.json({configured:!!process.env.TELEGRAM_BOT_TOKEN,bot:me,webhook,settings:settings.rows,adminIds:ADMIN_TELEGRAM_IDS,webhookConfigured:!!process.env.TELEGRAM_WEBHOOK_SECRET});
  }catch(e){return NextResponse.json({error:String(e).includes('FORBIDDEN')?'Forbidden':'Unauthorized'},{status:String(e).includes('FORBIDDEN')?403:401});}
}

export async function POST(req:Request){
  try{
    const actor=await requireAdmin();
    if(actor.role!=='SUPER_ADMIN' && actor.role!=='TELEGRAM_ADMIN') return NextResponse.json({error:'Telegram admin role required'},{status:403});
    const b=await req.json();
    if(b.action==='configure_webhook') {
      const appUrl=process.env.NEXT_PUBLIC_APP_URL; const secret=process.env.TELEGRAM_WEBHOOK_SECRET;
      if(!appUrl||!secret) return NextResponse.json({error:'NEXT_PUBLIC_APP_URL and TELEGRAM_WEBHOOK_SECRET are required'},{status:400});
      const result=await setTelegramWebhook(`${appUrl.replace(/\/$/,'')}/api/telegram/webhook`,secret);
      await audit(actor.id,'TELEGRAM_WEBHOOK_CONFIGURED','telegram',undefined,{url:`${appUrl.replace(/\/$/,'')}/api/telegram/webhook`});
      return NextResponse.json({ok:true,result});
    }
    if(b.action==='test_message'){
      const text=String(b.text||'Sanatan Gyan admin test message').slice(0,4000);
      const results=[]; for(const chatId of ADMIN_TELEGRAM_IDS){try{results.push(await telegramApi('sendMessage',{chat_id:chatId,text}))}catch(err){results.push({ok:false,chatId,error:String(err)})}}
      await audit(actor.id,'TELEGRAM_TEST_MESSAGE_SENT','telegram',undefined,{recipients:ADMIN_TELEGRAM_IDS});
      return NextResponse.json({results});
    }
    if(b.action==='set_setting'){
      if(!b.key || !/^[a-zA-Z0-9_.-]{1,80}$/.test(String(b.key))) return NextResponse.json({error:'Invalid setting key'},{status:400});
      await dbQuery(`INSERT INTO telegram_settings(key,value,updated_at) VALUES($1,$2::jsonb,NOW()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()`,[b.key,JSON.stringify(b.value??null)]);
      await audit(actor.id,'TELEGRAM_SETTING_UPDATED','telegram_settings',String(b.key),{value:b.value});
      return NextResponse.json({ok:true});
    }
    return NextResponse.json({error:'Unknown action'},{status:400});
  }catch(e){return NextResponse.json({error:String(e).includes('FORBIDDEN')?'Forbidden':'Telegram action failed'},{status:String(e).includes('FORBIDDEN')?403:400});}
}
