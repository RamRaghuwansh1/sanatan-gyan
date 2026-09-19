import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { requireAdmin } from '@/lib/auth/guards';
import { dbQuery } from '@/lib/db';
import { getStorage } from '@/lib/storage/provider';
import { audit } from '@/lib/admin/audit';

export async function POST(req: Request) {
  try {
    const u = await requireAdmin();
    const form = await req.formData();
    const scriptureId = String(form.get('scripture_id') || '');
    const replaceId = String(form.get('replace_file_id') || '');
    const file = form.get('file');
    if (!scriptureId || !(file instanceof File)) return NextResponse.json({ error: 'scripture_id and file required' }, { status: 400 });
    if (file.size > 100 * 1024 * 1024) return NextResponse.json({ error: 'File too large' }, { status: 413 });
    const allowed = new Set(['application/pdf','application/epub+zip']);
    if (!allowed.has(file.type)) return NextResponse.json({ error: 'Only PDF/EPUB files are allowed' }, { status: 415 });

    const current = await dbQuery(`SELECT id,version_number,storage_key FROM content_files WHERE scripture_id=$1 AND is_current=true ORDER BY version_number DESC LIMIT 1`, [scriptureId]);
    if (replaceId && (!current.rowCount || current.rows[0].id !== replaceId)) return NextResponse.json({ error: 'Replacement target is not the current file' }, { status: 409 });

    const nextVersion = current.rowCount ? Number(current.rows[0].version_number) + 1 : 1;
    const key = `scriptures/${scriptureId}/v${nextVersion}-${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,'_')}`;
    const body = Buffer.from(await file.arrayBuffer());
    const checksum = crypto.createHash('sha256').update(body).digest('hex');
    await getStorage().put({ key, body, mimeType: file.type });

    const r = await dbQuery(`
      INSERT INTO content_files(scripture_id,storage_key,original_name,mime_type,size_bytes,checksum_sha256,is_private,version_number,is_current,replaced_file_id)
      VALUES($1,$2,$3,$4,$5,$6,true,$7,true,$8) RETURNING id,version_number,is_current
    `, [scriptureId,key,file.name,file.type,file.size,checksum,nextVersion, current.rowCount ? current.rows[0].id : null]);
    if (current.rowCount) await dbQuery(`UPDATE content_files SET is_current=false WHERE id=$1`, [current.rows[0].id]);
    await audit(u.id, replaceId ? 'CONTENT_FILE_REPLACED' : 'CONTENT_FILE_UPLOADED', 'content_files', r.rows[0].id, { previous_file_id: current.rows[0]?.id || null, version: nextVersion, checksum });
    return NextResponse.json({ id:r.rows[0].id, version:r.rows[0].version_number, replaced:!!current.rowCount });
  } catch { return NextResponse.json({ error: 'Storage not configured or upload failed' }, { status: 503 }); }
}
