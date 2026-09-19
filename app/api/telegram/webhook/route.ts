import { NextResponse } from 'next/server';
import { sendTelegramMessage, telegramApi } from '@/lib/telegram/client';
import { dbQuery } from '@/lib/db';

type Lang = 'hi' | 'en';
type Btn = { text: string; callback_data?: string; url?: string };
const callback = (text:string,data:string):Btn => ({text,callback_data:data});
const urlBtn = (text:string,url:string):Btn => ({text,url});

const scriptures = {
  hi: {
    main: '🪔 *सनातन ज्ञान*\n\nधर्मग्रंथों, जीवन-दर्शन और आध्यात्मिक प्रश्नों के लिए आपका स्वागत है।\n\nभाषा चुनें और ग्रंथ खोलें:',
    menu: '📚 *ग्रंथ सूची*',
    gita: 'भगवद्गीता', ramayan:'रामायण', mahabharat:'महाभारत',
    ved:'चार वेद', puran:'१० चयनित पुराण', upanishad:'१० प्रमुख उपनिषद',
    read:'📖 यहाँ पढ़ें', download:'⬇️ डाउनलोड — ₹9',
    back:'⬅️ मुख्य मेनू', choose:'ग्रंथ चुनें:',
    unavailable:'इस ग्रंथ का पाठ अभी वेबसाइट/CMS में प्रकाशित नहीं है। कृपया बाद में देखें।',
    downloadInfo:'डाउनलोड खरीदने के लिए भुगतान व्यवस्था अभी सक्रिय रूप से सत्यापित नहीं है। कृपया वेबसाइट पर उपलब्ध भुगतान विकल्प देखें।',
    socials:'🔗 हमारे लिंक'
  },
  en: {
    main: '🪔 *Sanatan Gyan*\n\nWelcome! Explore scriptures, life wisdom, and spiritual questions.\n\nChoose your language and open a scripture:',
    menu: '📚 *Scripture Library*',
    gita:'Bhagavad Gita', ramayan:'Ramayan', mahabharat:'Mahabharat',
    ved:'Four Vedas', puran:'10 Selected Puranas', upanishad:'10 Principal Upanishads',
    read:'📖 Read here', download:'⬇️ Download — ₹9',
    back:'⬅️ Main menu', choose:'Choose a scripture:',
    unavailable:'This scripture text is not yet published in the website/CMS. Please check again later.',
    downloadInfo:'Paid downloads are not yet verified as active. Please use payment options available on the website.',
    socials:'🔗 Our links'
  }
} as const;

const books = {
  ved: [
    ['rigveda','ऋग्वेद','Rigveda'],['samaveda','सामवेद','Samaveda'],
    ['yajurveda','यजुर्वेद','Yajurveda'],['atharvaveda','अथर्ववेद','Atharvaveda']
  ],
  puran: [
    ['agni-purana','अग्नि पुराण','Agni Purana'],['bhagavata-purana','भागवत पुराण','Bhagavata Purana'],
    ['brahma-purana','ब्रह्म पुराण','Brahma Purana'],['brahmanda-purana','ब्रह्माण्ड पुराण','Brahmanda Purana'],
    ['brahmavaivarta-purana','ब्रह्मवैवर्त पुराण','Brahmavaivarta Purana'],['bhavishya-purana','भविष्य पुराण','Bhavishya Purana'],
    ['garuda-purana','गरुड़ पुराण','Garuda Purana'],['kurma-purana','कूर्म पुराण','Kurma Purana'],
    ['linga-purana','लिंग पुराण','Linga Purana'],['markandeya-purana','मार्कण्डेय पुराण','Markandeya Purana']
  ],
  upanishad: [
    ['isha-upanishad','ईश उपनिषद','Isha Upanishad'],['kena-upanishad','केन उपनिषद','Kena Upanishad'],
    ['katha-upanishad','कठ उपनिषद','Katha Upanishad'],['prashna-upanishad','प्रश्न उपनिषद','Prashna Upanishad'],
    ['mundaka-upanishad','मुण्डक उपनिषद','Mundaka Upanishad'],['mandukya-upanishad','माण्डूक्य उपनिषद','Mandukya Upanishad'],
    ['taittiriya-upanishad','तैत्तिरीय उपनिषद','Taittiriya Upanishad'],['aitareya-upanishad','ऐतरेय उपनिषद','Aitareya Upanishad'],
    ['chandogya-upanishad','छान्दोग्य उपनिषद','Chandogya Upanishad'],['brihadaranyaka-upanishad','बृहदारण्यक उपनिषद','Brihadaranyaka Upanishad']
  ]
} as const;

function mainKeyboard(lang:Lang) {
  const t=scriptures[lang];
  return [
    [callback(t.gita,'book:bhagavad-gita'),callback(t.ramayan,'book:ramayan')],
    [callback(t.mahabharat,'book:mahabharat')],
    [callback(t.ved,'group:ved'),callback(t.puran,'group:puran')],
    [callback(t.upanishad,'group:upanishad')],
    [callback('🌐 Hindi','lang:hi'),callback('🌐 English','lang:en')],
    [callback('❓ Ask a question','ask'),callback(t.socials,'social')]
  ];
}
function bookKeyboard(slug:string,lang:Lang) {
  const t=scriptures[lang];
  return [[callback(t.read,`read:${slug}`)],[callback(t.download,`download:${slug}`)],[callback(t.back,'menu')]];
}
function groupKeyboard(group:'ved'|'puran'|'upanishad',lang:Lang) {
  const arr=books[group];
  const rows:Btn[][]=[];
  for(let i=0;i<arr.length;i+=2) rows.push(arr.slice(i,i+2).map(([slug,hi,en])=>callback(lang==='hi'?hi:en,`book:${slug}`)));
  rows.push([callback(scriptures[lang].back,'menu')]);
  return rows;
}
function nameFor(slug:string,lang:Lang):string {
  for(const group of Object.values(books)) for(const [s,hi,en] of group) if(s===slug) return lang==='hi'?hi:en;
  const fixed:any={'bhagavad-gita':['भगवद्गीता','Bhagavad Gita'],'ramayan':['रामायण','Ramayan'],'mahabharat':['महाभारत','Mahabharat']};
  return fixed[slug]?.[lang==='hi'?0:1] || slug;
}
async function send(chatId:string,text:string,keyboard?:Btn[][]) {
  return telegramApi('sendMessage',{chat_id:chatId,text,parse_mode:'Markdown',...(keyboard?{reply_markup:{inline_keyboard:keyboard}}:{})});
}
async function getLang(tid:string):Promise<Lang>{
  try { const r=await dbQuery('SELECT language FROM users WHERE telegram_user_id=$1',[tid]); return r.rows?.[0]?.language==='en'?'en':'hi'; } catch { return 'hi'; }
}
export async function POST(req:Request) {
  const secret=process.env.TELEGRAM_WEBHOOK_SECRET;
  if(!secret || req.headers.get('x-telegram-bot-api-secret-token')!==secret) return NextResponse.json({error:'Forbidden'},{status:403});
  try {
    const u=await req.json();
    if(Number.isInteger(u?.update_id)) {
      const inserted=await dbQuery('INSERT INTO telegram_updates(update_id) VALUES($1) ON CONFLICT DO NOTHING RETURNING update_id',[u.update_id]);
      if(!inserted.rowCount) return NextResponse.json({ok:true,duplicate:true});
    }
    const m=u.message;
    const cq=u.callback_query;
    const chatId=String(m?.chat?.id ?? cq?.message?.chat?.id ?? '');
    const from=cq?.from ?? m?.from;
    if(!chatId || !from?.id) return NextResponse.json({ok:true});
    const tid=String(from.id);
    await dbQuery(`INSERT INTO users(telegram_user_id,name,language) VALUES($1,$2,'hi') ON CONFLICT(telegram_user_id) DO UPDATE SET name=EXCLUDED.name,updated_at=NOW()`,
      [tid,[from.first_name,from.last_name].filter(Boolean).join(' ')||null]);
    let lang:Lang=await getLang(tid);
    if(cq) {
      const data=String(cq.data||'');
      await telegramApi('answerCallbackQuery',{callback_query_id:cq.id});
      if(data.startsWith('lang:')) {
        lang=data.endsWith('en')?'en':'hi';
        await dbQuery('UPDATE users SET language=$2,updated_at=NOW() WHERE telegram_user_id=$1',[tid,lang]);
        await send(chatId,scriptures[lang].main,mainKeyboard(lang));
      } else if(data==='menu') await send(chatId,scriptures[lang].main,mainKeyboard(lang));
      else if(data==='group:ved'||data==='group:puran'||data==='group:upanishad') {
        const g=data.split(':')[1] as 'ved'|'puran'|'upanishad';
        await send(chatId,`${scriptures[lang].choose}\n\n${scriptures[lang][g]}`,groupKeyboard(g,lang));
      } else if(data.startsWith('book:')) {
        const slug=data.slice(5);
        await send(chatId,`📜 *${nameFor(slug,lang)}*\n\n${scriptures[lang].choose}`,bookKeyboard(slug,lang));
      } else if(data.startsWith('read:')) {
        const slug=data.slice(5);
        await send(chatId,`📖 *${nameFor(slug,lang)}*\n\n${scriptures[lang].unavailable}\n\n${scriptures[lang].back}`,[[callback(scriptures[lang].back,'menu')]]);
      } else if(data.startsWith('download:')) {
        await send(chatId,scriptures[lang].downloadInfo,[[callback(scriptures[lang].back,'menu')]]);
      } else if(data==='social') {
        const rows:Btn[][]=[];
        if(process.env.NEXT_PUBLIC_YOUTUBE_URL) rows.push([urlBtn('YouTube',process.env.NEXT_PUBLIC_YOUTUBE_URL)]);
        if(process.env.NEXT_PUBLIC_INSTAGRAM_URL) rows.push([urlBtn('Instagram',process.env.NEXT_PUBLIC_INSTAGRAM_URL)]);
        if(process.env.NEXT_PUBLIC_TELEGRAM_GROUP_URL) rows.push([urlBtn('Telegram Group',process.env.NEXT_PUBLIC_TELEGRAM_GROUP_URL)]);
        if(process.env.NEXT_PUBLIC_APP_URL) rows.push([urlBtn('Website',process.env.NEXT_PUBLIC_APP_URL)]);
        rows.push([callback(scriptures[lang].back,'menu')]);
        await send(chatId,scriptures[lang].socials,rows);
      } else if(data==='ask') {
        await send(chatId,lang==='hi'?'अपना प्रश्न इसी चैट में लिखें। सामान्य प्रश्नों का उत्तर देने के लिए AI integration अभी जोड़ा जाना बाकी है।':'Send your question in this chat. AI answering integration still needs to be connected.');
      }
      return NextResponse.json({ok:true});
    }
    if(m?.text) {
      const text=String(m.text).trim();
      if(/^\/start(?:@\w+)?(?:\s|$)/i.test(text)) {
        await send(chatId,scriptures[lang].main,[[callback('हिन्दी','lang:hi'),callback('English','lang:en')]]);
      } else if(/^\/(?:menu|help)(?:@\w+)?$/i.test(text)) {
        await send(chatId,scriptures[lang].main,mainKeyboard(lang));
      } else if(/^\/language(?:@\w+)?$/i.test(text)) {
        await send(chatId,lang==='hi'?'भाषा चुनें:':'Choose language:',[[callback('हिन्दी','lang:hi'),callback('English','lang:en')]]);
      } else {
        await send(chatId,lang==='hi'?'आपका प्रश्न मिला। अभी AI उत्तर और सत्यापित श्लोक-स्रोत जोड़ना बाकी है।':'Question received. AI answers and verified scripture citations still need to be connected.',[[callback(scriptures[lang].back,'menu')]]);
      }
    }
    return NextResponse.json({ok:true});
  } catch(e) {
    console.error('Sanatan Gyan Telegram webhook error',e);
    return NextResponse.json({error:'Telegram webhook processing failed'},{status:500});
  }
}
