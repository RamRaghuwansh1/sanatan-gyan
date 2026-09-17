import {NextResponse} from 'next/server';
import {dbQuery} from '@/lib/db';
import {requireAdmin} from '@/lib/auth/guards';
import {audit} from '@/lib/admin/audit';

export async function GET(req:Request){
 try{await requireAdmin();const scriptureId=new URL(req.url).searchParams.get('scriptureId');
  if(!scriptureId)return NextResponse.json({error:'scriptureId required'},{status:400});
  const r=await dbQuery(`SELECT c.id,c.scripture_id,c.chapter_number,c.title_hi,c.title_en,COUNT(v.id)::int AS verse_count FROM scripture_chapters c LEFT JOIN scripture_verses v ON v.chapter_id=c.id WHERE c.scripture_id=$1 GROUP BY c.id ORDER BY c.chapter_number`,[scriptureId]);
  return NextResponse.json({items:r.rows});
 }catch{return NextResponse.json({error:'Could not load chapters'},{status:503})}
}
export async function POST(req:Request){try{const u=await requireAdmin();const b=await req.json();if(!b.scripture_id||!Number.isInteger(Number(b.chapter_number))||Number(b.chapter_number)<1)return NextResponse.json({error:'Valid scripture_id and chapter_number required'},{status:400});const r=await dbQuery(`INSERT INTO scripture_chapters(scripture_id,chapter_number,title_hi,title_en) VALUES($1,$2,$3,$4) RETURNING *`,[b.scripture_id,Number(b.chapter_number),b.title_hi||null,b.title_en||null]);await audit(u.id,'CHAPTER_CREATED','scripture_chapters',r.rows[0].id);return NextResponse.json({item:r.rows[0]},{status:201});}catch{return NextResponse.json({error:'Invalid chapter or duplicate chapter number'},{status:400})}}
