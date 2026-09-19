import { dbQuery } from '../db';
import { hashIp } from '../security/http';
export async function audit(actorUserId:string|null, action:string, entityType?:string, entityId?:string, metadata?:unknown, ip?:string|null){
  await dbQuery(`INSERT INTO audit_logs(actor_user_id,action,entity_type,entity_id,metadata,ip_hash) VALUES($1,$2,$3,$4,$5,$6)`, [actorUserId,action,entityType??null,entityId??null,metadata??null,hashIp(ip??null)]);
}
