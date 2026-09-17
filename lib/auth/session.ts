import { cookies } from 'next/headers';
import { dbQuery } from '../db';
import { randomToken, sha256 } from '../security/http';

const COOKIE = 'sg_session';
const DAYS = 7;

export async function createSession(userId: string) {
  const raw = randomToken(32);
  const hash = sha256(raw);
  await dbQuery(`DELETE FROM sessions WHERE user_id=$1 OR expires_at < NOW()`, [userId]);
  await dbQuery(`INSERT INTO sessions(user_id,token_hash,expires_at) VALUES($1,$2,NOW()+INTERVAL '7 days')`, [userId, hash]);
  const store = await cookies();
  store.set(COOKIE, raw, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: DAYS * 86400 });
}

export async function destroySession() {
  const store = await cookies();
  const raw = store.get(COOKIE)?.value;
  if (raw) await dbQuery(`DELETE FROM sessions WHERE token_hash=$1`, [sha256(raw)]);
  store.delete(COOKIE);
}

export async function getSessionUser() {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  const result = await dbQuery(`SELECT u.id,u.email,u.name,u.role,u.language,u.is_active FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>NOW() AND u.is_active=true`, [sha256(raw)]);
  const user = result.rows[0] ?? null;
  if (user) await dbQuery(`UPDATE sessions SET last_seen_at=NOW() WHERE token_hash=$1`, [sha256(raw)]);
  return user;
}
