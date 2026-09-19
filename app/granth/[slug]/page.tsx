'use client';
import Link from 'next/link';
import {useEffect,useMemo,useState} from 'react';
import {useParams,useRouter} from 'next/navigation';

type Verse={id:string;verse_number:number;text_hi:string|null;text_en:string|null;source_reference:string|null};
type Chapter={id:string;chapter_number:number;title_hi:string|null;title_en:string|null;verses:Verse[]};

export default function ReaderPage(){
 const {slug}=useParams<{slug:string}>(); const router=useRouter();
 const [data,setData]=useState<any>(null); const [chapter,setChapter]=useState(0); const [verse,setVerse]=useState(0); const [lang,setLang]=useState<'hi'|'en'>('hi'); const [font,setFont]=useState(20); const [bookmarks,setBookmarks]=useState<Set<string>>(new Set()); const [error,setError]=useState(''); const [loading,setLoading]=useState(true);
 useEffect(()=>{(async()=>{const r=await fetch(`/api/reader/${slug}`); const j=await r.json(); if(r.status===401){router.push('/login');return} if(r.status===403){router.push(`/checkout/${slug}`);return} if(!r.ok){setError(j.error||'Reader unavailable');setLoading(false);return} setData(j);setBookmarks(new Set(j.bookmarkedVerseIds||[]));setLoading(false)})()},[slug,router]);
 const chapters:Chapter[]=data?.chapters||[]; const current=chapters[chapter]; const v=current?.verses?.[verse];
 const chapterTitle=useMemo(()=>current?.title_hi||current?.title_en||`अध्याय ${current?.chapter_number||''}`,[current]);
 async function toggleBookmark(){if(!v)return; const saved=bookmarks.has(v.id); setBookmarks(prev=>{const n=new Set(prev); saved?n.delete(v.id):n.add(v.id); return n}); const r=await fetch(`/api/user/bookmarks${saved?`?verseId=${encodeURIComponent(v.id)}`:''}`,{method:saved?'DELETE':'POST',headers:{'Content-Type':'application/json'},body:saved?undefined:JSON.stringify({verseId:v.id})}); if(!r.ok)setBookmarks(prev=>{const n=new Set(prev); saved?n.add(v.id):n.delete(v.id);return n});}
 async function openFile(){const r=await fetch(`/api/content/${data.item.id}`); const j=await r.json(); if(r.ok&&j.url) window.open(j.url,'_blank','noopener,noreferrer'); else alert(j.error||'File unavailable');}
 if(loading)return <main className="reader-page"><div className="reader-loading">Reader load ho raha hai…</div></main>;
 if(error)return <main className="reader-page"><div className="reader-loading"><h2>{error}</h2><Link className="secondary-link" href="/granth">Catalog par wapas</Link></div></main>;
 return <main className="reader-page">
  <header className="reader-topbar"><Link href="/granth" className="reader-brand">ॐ Sanatan Gyan</Link><div className="reader-title"><b>{data.item.title_hi}</b><span>{data.item.title_en}</span></div><div className="reader-actions"><button onClick={()=>setFont(Math.max(16,font-2))}>A−</button><button onClick={()=>setFont(Math.min(30,font+2))}>A+</button><button onClick={()=>setLang(lang==='hi'?'en':'hi')}>{lang==='hi'?'EN':'हिं'}</button><Link href="/account">Account</Link></div></header>
  <div className="reader-layout">
   <aside className="reader-sidebar"><div className="reader-sidebar-title">अध्याय</div>{chapters.map((c,i)=><button key={c.id} className={i===chapter?'chapter-btn active':'chapter-btn'} onClick={()=>{setChapter(i);setVerse(0)}}><span>अध्याय {c.chapter_number}</span><small>{c.title_hi||c.title_en}</small></button>)}{data.file&&<button className="file-btn" onClick={openFile}>↗ Verified file खोलें</button>}</aside>
   <section className="reader-main"><div className="reader-meta"><span>अध्याय {current?.chapter_number}</span><strong>{chapterTitle}</strong><span>{current?.verses?.length||0} श्लोक</span></div>
    {v?<article className="verse-card"><div className="verse-number">श्लोक {v.verse_number}</div><div className="verse-text" style={{fontSize:font}}>{lang==='hi'?(v.text_hi||v.text_en):(v.text_en||v.text_hi)}</div>{v.source_reference&&<div className="source-ref">स्रोत: {v.source_reference}</div>}<div className="verse-footer"><button className={bookmarks.has(v.id)?'bookmark active':'bookmark'} onClick={toggleBookmark}>{bookmarks.has(v.id)?'★ Saved':'☆ Bookmark'}</button><span>Verse {verse+1} / {current.verses.length}</span></div></article>:<div className="empty"><h2>इस अध्याय में अभी कोई verse उपलब्ध नहीं है।</h2><p>CMS में verified content publish होने के बाद यहाँ दिखाई देगा।</p></div>}
    <div className="reader-nav"><button disabled={verse===0} onClick={()=>setVerse(x=>x-1)}>← पिछला</button><select value={verse} onChange={e=>setVerse(Number(e.target.value))}>{(current?.verses||[]).map((x,i)=><option key={x.id} value={i}>श्लोक {x.verse_number}</option>)}</select><button disabled={!current||verse>=current.verses.length-1} onClick={()=>setVerse(x=>x+1)}>अगला →</button></div>
   </section>
  </div>
 </main>
}
