import crypto from 'node:crypto';

export function sha256(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function safeEqual(a: string, b: string) {
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}

export function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('base64url');
}

export function hashIp(ip: string | null) {
  const salt = process.env.AUDIT_IP_SALT;
  return ip && salt ? sha256(`${salt}:${ip}`) : null;
}
