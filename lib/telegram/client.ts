export async function telegramApi(method:string,payload:Record<string,unknown>){
 const token=process.env.TELEGRAM_BOT_TOKEN;if(!token)throw new Error('TELEGRAM_BOT_TOKEN not configured');
 const r=await fetch(`https://api.telegram.org/bot${token}/${method}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),cache:'no-store'});
 const data=await r.json().catch(()=>null);if(!r.ok||data?.ok===false)throw new Error(`Telegram API ${r.status}`);return data;
}
export async function sendTelegramMessage(chatId:string,text:string){return telegramApi('sendMessage',{chat_id:chatId,text});}
export async function setTelegramWebhook(webhookUrl:string,secretToken:string){
 if(!/^https:\/\//i.test(webhookUrl)) throw new Error('Webhook URL must use HTTPS');
 if(!secretToken || secretToken.length<16) throw new Error('Webhook secret is too short');
 return telegramApi('setWebhook',{url:webhookUrl,secret_token:secretToken,allowed_updates:['message'],drop_pending_updates:false});
}
export async function getTelegramWebhookInfo(){return telegramApi('getWebhookInfo',{});}
