import crypto from 'node:crypto';

export async function aanuRequest(path:string,init:RequestInit={}){
 const base=process.env.AANU_BASE_URL, secret=process.env.AANU_SHARED_SECRET;
 if(!base||!secret)throw new Error('AANU integration is not configured');
 const url=`${base.replace(/\/$/,'')}/${path.replace(/^\//,'')}`;
 const body=typeof init.body==='string'?init.body:(init.body?JSON.stringify(init.body):'');
 const timestamp=Math.floor(Date.now()/1000).toString();
 const signature=crypto.createHmac('sha256',secret).update(`${timestamp}.${body}`).digest('hex');
 const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),8000);
 try{return await fetch(url,{...init,body:body||undefined,signal:controller.signal,headers:{...(init.headers||{}),'Authorization':`Bearer ${secret}`,'X-SG-Timestamp':timestamp,'X-SG-Signature':signature,'Content-Type':'application/json'},cache:'no-store'});}
 finally{clearTimeout(timer);}
}
