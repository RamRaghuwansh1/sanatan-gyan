import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { dbQuery } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/guards';
import { audit } from '@/lib/admin/audit';
import { getStorage } from '@/lib/storage/provider';

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const scriptureId = new URL(req.url).searchParams.get('scriptureId');
    if (!scriptureId) return NextResponse.json({ error: 'scriptureId required' }, { status: 400 });
    const r = await dbQuery(`
      SELECT id,original_name,mime_type,size_bytes,checksum_sha256,is_private,created_at,version_number,is_current,replaced_file_id
      FROM content_files WHERE scripture_id=$1 ORDER BY version_number DESC,created_at DESC
    `, [scriptureId]);
    return NextResponse.json({ items: r.rows });
  } catch { return NextResponse.json({ error: 'Could not load files' }, { status: 503 }); }
}

export async function DELETE(req: Request) {
  try {
    const u = await requireAdmin();
    const id = new URL(req.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const r = await dbQuery(`SELECT id,storage_key,is_current,scripture_id FROM content_files WHERE id=$1`, [id]);
    if (!r.rowCount) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (r.rows[0].is_current) {
      const next = await dbQuery(`SELECT id,storage_key FROM content_files WHERE scripture_id=$1 AND id<>$2 ORDER BY version_number DESC,created_at DESC LIMIT 1`, [r.rows[0].scripture_id,id]);
      if (next.rowCount) {
        await dbQuery(`UPDATE content_files SET is_current=true WHERE id=$1`, [next.rows[0].id]);
        await dbQuery(`UPDATE content_files SET is_current=false WHERE id=$1`, [id]);
      } else {
        await dbQuery(`DELETE FROM content_files WHERE id=$1`, [id]);
      }
    } else {
      await dbQuery(`DELETE FROM content_files WHERE id=$1`, [id]);
    }
    await getStorage().delete(r.rows[0].storage_key);
    await audit(u.id,'CONTENT_FILE_DELETED','content_files',id,{was_current:r.rows[0].is_current});
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: 'File could not be deleted' }, { status: 503 }); }
}
