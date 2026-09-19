import crypto from 'node:crypto';

export function safeEqualHex(a: string, b: string) {
  if (!a || !b || a.length !== b.length) return false;
  try { return crypto.timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8')); }
  catch { return false; }
}

export function hmacSha256(secret: string, body: string) {
  return crypto.createHmac('sha256', secret).update(body).digest('hex');
}
