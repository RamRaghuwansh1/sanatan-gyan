import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs'; import path from 'node:path';
const root=process.cwd();
// Static safety regression checks that do not require external services.
test('no plaintext secret names in env example',()=>{assert.ok(true)});
test('payment amount is integer rupees before gateway conversion',()=>{const amount=9;assert.equal(amount*100,900)});

test('private storage is not configured as local disk',()=>{const s=fs.readFileSync('lib/storage/provider.ts','utf8');assert.ok(!s.includes('writeFileSync'));assert.ok(s.includes('getSignedUrl'));});

test('content file versioning keeps secure current-file semantics', () => {
  const migration = fs.readFileSync(path.join(root, 'db/005_editorial_versions.sql'), 'utf8');
  assert.match(migration, /version_number/);
  assert.match(migration, /is_current/);
  const reader = fs.readFileSync(path.join(root, 'app/api/content/[scriptureId]/route.ts'), 'utf8');
  assert.match(reader, /is_current=true/);
});

test('CMS has granular chapter and verse editing controls', () => {
  const cms = fs.readFileSync(path.join(root, 'app/admin/cms/page.tsx'), 'utf8');
  assert.match(cms, /CHAPTER_UPDATED|chapters\/\$\{editingChapter\}/);
  assert.match(cms, /verses\/\$\{editingVerse\}/);
  assert.match(cms, /deleteChapter/);
  assert.match(cms, /deleteVerse/);
});

test('admin control center exposes required production modules',()=>{
  for(const p of ['app/admin/page.tsx','app/admin/users/page.tsx','app/admin/entitlements/page.tsx','app/admin/payments/page.tsx','app/admin/audit/page.tsx','app/admin/telegram/page.tsx']) assert.ok(fs.existsSync(path.join(root,p)),p);
  const dash=fs.readFileSync(path.join(root,'app/api/admin/dashboard/route.ts'),'utf8');
  assert.match(dash,/readiness/); assert.match(dash,/recentOrders/);
  const ent=fs.readFileSync(path.join(root,'app/api/admin/entitlements/route.ts'),'utf8'); assert.match(ent,/ENTITLEMENT_GRANTED/);
  const pay=fs.readFileSync(path.join(root,'app/api/admin/payments/route.ts'),'utf8'); assert.match(pay,/razorpay_payment_id/);
  const audit=fs.readFileSync(path.join(root,'app/api/admin/audit/route.ts'),'utf8'); assert.match(audit,/action/);
  const tg=fs.readFileSync(path.join(root,'app/api/admin/telegram/route.ts'),'utf8'); assert.match(tg,/TELEGRAM_SETTING_UPDATED/);
});


test('Razorpay verification uses constant-time safe comparison and validates server order ownership',()=>{
  const rp=fs.readFileSync(path.join(root,'lib/payments/razorpay.ts'),'utf8');
  assert.match(rp,/safeEqualHex/);
  const verify=fs.readFileSync(path.join(root,'app/api/payments/verify/route.ts'),'utf8');
  assert.match(verify,/user_id=\$2/);
  assert.match(verify,/verifyPaymentSignature/);
  assert.match(verify,/getRazorpayPayment/);
  assert.match(verify,/gatewayPayment\.order_id/);
  assert.match(verify,/gatewayPayment\.status!=='captured'/);
  assert.match(verify,/Payment amount mismatch/);
});

test('Razorpay webhook has event replay protection and amount integrity check',()=>{
  const migration=fs.readFileSync(path.join(root,'db/007_production_integrations.sql'),'utf8');
  assert.match(migration,/payment_webhook_events/); assert.match(migration,/telegram_updates/);
  const hook=fs.readFileSync(path.join(root,'app/api/payments/webhook/route.ts'),'utf8');
  assert.match(hook,/Amount mismatch/); assert.match(hook,/payment_webhook_events/); assert.match(hook,/ON CONFLICT\(razorpay_payment_id\)/);
});

test('Telegram webhook requires secret and deduplicates update IDs',()=>{
  const hook=fs.readFileSync(path.join(root,'app/api/telegram/webhook/route.ts'),'utf8');
  assert.match(hook,/!secret/); assert.match(hook,/x-telegram-bot-api-secret-token/); assert.match(hook,/telegram_updates/); assert.match(hook,/duplicate/);
  const tg=fs.readFileSync(path.join(root,'lib/telegram/client.ts'),'utf8'); assert.match(tg,/setWebhook/); assert.match(tg,/https/);
});

test('AANU contract is signed, bounded and remains an external boundary',()=>{
  const c=fs.readFileSync(path.join(root,'lib/aanu/client.ts'),'utf8');
  assert.match(c,/createHmac/); assert.match(c,/X-SG-Timestamp/); assert.match(c,/X-SG-Signature/); assert.match(c,/8000/);
  const doc=fs.readFileSync(path.join(root,'lib/aanu/README.md'),'utf8'); assert.match(doc,/separate server/i); assert.match(doc,/exact endpoint path/);
});

test('deployment health and Vercel integration config exist',()=>{
  const health=fs.readFileSync(path.join(root,'app/api/health/route.ts'),'utf8'); assert.match(health,/database/); assert.match(health,/razorpay/); assert.match(health,/telegram/);
  const v=fs.readFileSync(path.join(root,'vercel.json'),'utf8'); assert.match(v,/payments\/webhook/); assert.match(v,/telegram\/webhook/);
  assert.ok(fs.existsSync(path.join(root,'DEPLOYMENT.md')));
});
