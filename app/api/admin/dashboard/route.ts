import {NextResponse} from 'next/server';
import {dbQuery} from '@/lib/db';
import {requireAdmin} from '@/lib/auth/guards';

export async function GET(){
  try{
    await requireAdmin();
    const [stats,recent,readiness,recentOrders] = await Promise.all([
      dbQuery(`SELECT
        (SELECT COUNT(*) FROM users) AS users,
        (SELECT COUNT(*) FROM users WHERE is_active=true) AS active_users,
        (SELECT COUNT(*) FROM scriptures) AS scriptures,
        (SELECT COUNT(*) FROM scriptures WHERE status='PUBLISHED') AS published_scriptures,
        (SELECT COUNT(*) FROM entitlements WHERE status='ACTIVE') AS active_entitlements,
        (SELECT COUNT(*) FROM orders) AS orders,
        (SELECT COUNT(*) FROM orders WHERE status='CAPTURED') AS captured_orders,
        (SELECT COALESCE(SUM(amount_inr),0) FROM payments WHERE status='CAPTURED') AS captured_revenue,
        (SELECT COUNT(*) FROM content_files WHERE is_private=true AND is_current=true) AS current_files`),
      dbQuery(`SELECT a.id,a.action,a.entity_type,a.entity_id,a.metadata,a.created_at,u.email AS actor_email,u.name AS actor_name
        FROM audit_logs a LEFT JOIN users u ON u.id=a.actor_user_id ORDER BY a.created_at DESC LIMIT 8`),
      dbQuery(`SELECT s.id,s.slug,s.title_hi,s.title_en,s.status,s.rights_status,
        (SELECT COUNT(*) FROM scripture_chapters c WHERE c.scripture_id=s.id) AS chapters,
        (SELECT COUNT(*) FROM scripture_verses v JOIN scripture_chapters c ON c.id=v.chapter_id WHERE c.scripture_id=s.id) AS verses,
        (SELECT COUNT(*) FROM content_files f WHERE f.scripture_id=s.id AND f.is_private=true AND f.is_current=true) AS current_files
        FROM scriptures s WHERE s.status <> 'ARCHIVED' ORDER BY s.updated_at DESC LIMIT 12`),
      dbQuery(`SELECT o.id,o.razorpay_order_id,o.amount_inr,o.status,o.created_at,u.email,u.name,s.title_en,s.slug
        FROM orders o LEFT JOIN users u ON u.id=o.user_id LEFT JOIN scriptures s ON s.id=o.scripture_id
        ORDER BY o.created_at DESC LIMIT 8`)
    ]);
    return NextResponse.json({stats:stats.rows[0],recentAudit:recent.rows,readiness:readiness.rows,recentOrders:recentOrders.rows});
  }catch(e){return NextResponse.json({error:String(e).includes('FORBIDDEN')?'Forbidden':'Unauthorized'},{status:String(e).includes('FORBIDDEN')?403:401});}
}
