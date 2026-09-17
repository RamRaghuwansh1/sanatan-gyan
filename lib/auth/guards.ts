import { getSessionUser } from './session';
const ADMIN_ROLES = new Set(['EDITOR','TELEGRAM_ADMIN','SUPER_ADMIN']);
export async function requireUser(){ const u=await getSessionUser(); if(!u) throw new Error('UNAUTHENTICATED'); return u; }
export async function requireAdmin(){ const u=await requireUser(); if(!ADMIN_ROLES.has(u.role)) throw new Error('FORBIDDEN'); return u; }
export async function requireSuperAdmin(){ const u=await requireUser(); if(u.role!=='SUPER_ADMIN') throw new Error('FORBIDDEN'); return u; }
