import { NextResponse } from 'next/server';
import { dbQuery } from '@/lib/db';
import { requireUser } from '@/lib/auth/guards';

export async function GET(req: Request) {
  try {
    const user = await requireUser();
    const scriptureId = new URL(req.url).searchParams.get('scriptureId');
    const params: string[] = [user.id];
    let where = 'b.user_id=$1';
    if (scriptureId) { params.push(scriptureId); where += ' AND s.id=$2'; }
    const r = await dbQuery(`
      SELECT b.id,b.verse_id,v.verse_number,c.chapter_number,s.id AS scripture_id
      FROM bookmarks b
      JOIN scripture_verses v ON v.id=b.verse_id
      JOIN scripture_chapters c ON c.id=v.chapter_id
      JOIN scriptures s ON s.id=c.scripture_id
      WHERE ${where}
      ORDER BY c.chapter_number,v.verse_number
    `, params);
    return NextResponse.json({items:r.rows});
  } catch { return NextResponse.json({error:'Bookmarks unavailable'},{status:503}); }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const verseId = String(body?.verseId || '');
    if (!verseId) return NextResponse.json({error:'verseId required'},{status:400});
    const r = await dbQuery(`
      INSERT INTO bookmarks(user_id,verse_id) VALUES($1,$2)
      ON CONFLICT(user_id,verse_id) DO UPDATE SET created_at=NOW()
      RETURNING id,verse_id,created_at
    `,[user.id,verseId]);
    return NextResponse.json({item:r.rows[0]},{status:201});
  } catch { return NextResponse.json({error:'Bookmark could not be saved'},{status:503}); }
}

export async function DELETE(req: Request) {
  try {
    const user = await requireUser();
    const verseId = new URL(req.url).searchParams.get('verseId');
    if (!verseId) return NextResponse.json({error:'verseId required'},{status:400});
    await dbQuery('DELETE FROM bookmarks WHERE user_id=$1 AND verse_id=$2',[user.id,verseId]);
    return NextResponse.json({ok:true});
  } catch { return NextResponse.json({error:'Bookmark could not be removed'},{status:503}); }
}
