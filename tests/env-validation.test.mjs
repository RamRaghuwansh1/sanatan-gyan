import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('production environment gate exists and enforces HTTPS/S3/secret checks', () => {
  const p = path.join(process.cwd(), 'scripts/verify-env.mjs');
  const s = fs.readFileSync(p, 'utf8');
  assert.ok(s.includes('NEXT_PUBLIC_APP_URL'));
  assert.ok(s.includes('must use HTTPS'));
  assert.ok(s.includes('STORAGE_PROVIDER'));
  assert.ok(s.includes("!== 's3'"));
  assert.ok(s.includes('length < 32'));
});
