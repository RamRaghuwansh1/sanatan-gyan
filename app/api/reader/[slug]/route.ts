import {NextResponse} from 'next/server';
import {dbQuery} from '@/lib/db';
import {requireUser} from '@/lib/auth/guards';

export async function GET(_req:Request,{params}:{params:Promise<{slug:string}>}) {
  try {
    const user=await requireUser();
    const {slug}=await params;
    const s=await dbQuery(`
      SELECT s.id,s.slug,s.title_hi,s.title_en,s.description_hi,s.description_en,s.language,s.price_inr,s.status,
      EXISTS(SELECT 1 FROM entitlements e WHERE e.user_id=$1 AND e.scripture_id=s.id AND e.status='ACTIVE') AS purchased,
      EXISTS(SELECT 1 FROM content_files f WHERE f.scripture_id=s.id AND f.is_private=true AND f.is_current=true) AS has_file
      FROM scriptures s WHERE s.slug=$2 AND s.status='PUBLISHED'
    `,[user.id,slug]);
    if(!s.rowCount)return NextResponse.json({error:'Not found'},{status:404});
    const item=s.rows[0];
    if(!item.purchased)return NextResponse.json({error:'Purchase required',item:{id:item.id,title_hi:item.title_hi,title_en:item.title_en,price_inr:item.price_inr}},{status:403});
    const chapters=await dbQuery(`
      SELECT c.id,c.chapter_number,c.title_hi,c.title_en,
      COALESCE(json_agg(json_build_object('id',v.id,'verse_number',v.verse_number,'text_hi',v.text_hi,'text_en',v.text_en,'source_reference',v.source_reference) ORDER BY v.verse_number) FILTER (WHERE v.id IS NOT NULL),'[]') AS verses
      FROM scripture_chapters c LEFT JOIN scripture_verses v ON v.chapter_id=c.id
      WHERE c.scripture_id=$1 GROUP BY c.id ORDER BY c.chapter_number
    `,[item.id]);
    const bookmarks=await dbQuery(`SELECT b.verse_id FROM bookmarks b JOIN scripture_verses v ON v.id=b.verse_id JOIN scripture_chapters c ON c.id=v.chapter_id WHERE b.user_id=$1 AND c.scripture_id=$2`,[user.id,item.id]);
    const file=await dbQuery(`SELECT id,original_name,mime_type FROM content_files WHERE scripture_id=$1 AND is_private=true AND is_current=true ORDER BY version_number DESC,created_at DESC LIMIT 1`,[item.id]);
    return NextResponse.json({item,chapters:chapters.rows,bookmarkedVerseIds:bookmarks.rows.map(x=>x.verse_id),file:file.rows[0]||null});
  }catch{return NextResponse.json({error:'Reader unavailable'},{status:503});}
}
