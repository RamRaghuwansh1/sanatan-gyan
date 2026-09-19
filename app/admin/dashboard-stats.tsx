'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';

export default function DashboardStats(){
 const [d,setD]=useState<any>(null),[error,setError]=useState('');
 useEffect(()=>{fetch('/api/admin/dashboard').then(async r=>{const j=await r.json();if(!r.ok)throw new Error(j.error);setD(j)}).catch(e=>setError(e.message))},[]);
 if(error)return <div className="error">{error}</div>;
 if(!d)return <div className="panel">Loading dashboard…</div>;
 const s=d.stats;
 const cards=[['Users',s.users],['Published Granth',s.published_scriptures],['Active Access',s.active_entitlements],['Orders',s.orders],['Captured Orders',s.captured_orders],['Revenue',`₹${s.captured_revenue}`],['Current Files',s.current_files]];
 return <>
  <div className="stats-grid">{cards.map(([a,b])=><div className="stat-card" key={String(a)}><small>{a}</small><strong>{b}</strong></div>)}</div>
  <div className="adminGrid">
   <div className="panel"><div className="cms-section-head"><h2>Publishing readiness</h2><Link className="secondary-link" href="/admin/cms">Open CMS →</Link></div><div className="readiness-list">{d.readiness.map((x:any)=>{const ready=!!x.rights_status&&Number(x.chapters)>0&&Number(x.verses)>0&&Number(x.current_files)>0;return <div className="readiness-row" key={x.id}><span><b>{x.title_hi}</b><small>{x.title_en} · {x.status}</small></span><span className={ready?'check-ok':'check-no'}>{ready?'Ready to publish':'Needs work'}</span></div>})}</div></div>
   <div className="panel"><div className="cms-section-head"><h2>Recent orders</h2><Link className="secondary-link" href="/admin/payments">View payments →</Link></div><div className="audit-mini">{d.recentOrders.map((x:any)=><div key={x.id}><b>{x.title_en||x.razorpay_order_id||'Order'}</b><span>₹{x.amount_inr} · {x.status} · {new Date(x.created_at).toLocaleString()}</span></div>)}</div></div>
  </div>
  <div className="panel" style={{marginTop:18}}><div className="cms-section-head"><h2>Recent admin activity</h2><Link className="secondary-link" href="/admin/audit">View full log →</Link></div><div className="audit-mini">{d.recentAudit.map((x:any)=><div key={x.id}><b>{x.action}</b><span>{x.actor_name||x.actor_email||'System'} · {x.entity_type||'system'} · {new Date(x.created_at).toLocaleString()}</span></div>)}</div></div>
 </>
}
