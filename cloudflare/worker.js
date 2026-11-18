import { buildPushPayload } from '@block65/webcrypto-web-push';
import catalog from './catalog.json';
const appURL='https://josecruzgg.github.io/explora-lugares-pwa/';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const allowedPush=url=>{try{const u=new URL(url);return u.protocol==='https:' && (['fcm.googleapis.com','updates.push.services.mozilla.com','web.push.apple.com'].includes(u.hostname)||u.hostname.endsWith('.notify.windows.com'));}catch{return false;}};
export default {async fetch(request,env){
 const url=new URL(request.url), origin=request.headers.get('Origin');
 const cors={'Access-Control-Allow-Origin':appURL.slice(0,appURL.indexOf('/explora')), 'Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type,Authorization','Vary':'Origin','Cache-Control':'no-store'};
 const json=(data,status=200)=>Response.json(data,{status,headers:cors});
 if(origin && origin!==new URL(appURL).origin && origin!==url.origin && !/^http:\/\/localhost(:\d+)?$/.test(origin))return json({error:'Origen no permitido'},403);
 if(origin?.startsWith('http://localhost'))cors['Access-Control-Allow-Origin']=origin;
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
 try{
 if(url.pathname==='/api/catalog' && request.method==='GET')return json(catalog);
 if(url.pathname==='/api/health')return json({ok:true,storage:'D1',service:'Explora Lugares API'});
 if(url.pathname==='/api/reviews'){
  if(request.method==='GET'){
   const {results}=await env.DB.prepare('SELECT id,placeId,text,createdAt FROM reviews WHERE placeId=? ORDER BY createdAt').bind(url.searchParams.get('placeId')||'').all();return json(results);
  }
  if(request.method==='POST'){
   const text=await request.text();if(text.length>8192)return json({error:'Solicitud demasiado grande'},413);
   const r=JSON.parse(text);
   if(typeof r.id!=='string'||r.id.length>100||!r.id||!catalog.some(p=>p.id===r.placeId)||typeof r.text!=='string'||!r.text.trim()||r.text.length>500)return json({error:'Reseña inválida'},400);
   await env.DB.prepare('INSERT OR IGNORE INTO reviews (id,placeId,text,createdAt) VALUES (?,?,?,?)').bind(r.id,r.placeId,r.text.trim(),new Date().toISOString()).run();return json({ok:true},201);
  }
 }
 if(url.pathname==='/api/push/key' && request.method==='GET')return json({publicKey:env.VAPID_PUBLIC_KEY});
 if(url.pathname==='/api/push/subscriptions' && request.method==='POST'){
  const body=await request.text();if(body.length>8192)return json({error:'Solicitud demasiado grande'},413);
  const s=JSON.parse(body);
  if(!allowedPush(s.endpoint)||typeof s.keys?.p256dh!=='string'||typeof s.keys?.auth!=='string'||s.keys.p256dh.length>200||s.keys.auth.length>100)return json({error:'Suscripción inválida'},400);
  await env.DB.prepare('INSERT INTO subscriptions (endpoint,payload) VALUES (?,?) ON CONFLICT(endpoint) DO UPDATE SET payload=excluded.payload').bind(s.endpoint,JSON.stringify(s)).run();return json({ok:true},201);
 }
 if(url.pathname==='/api/push/send' && request.method==='POST'){
  if(!env.PUSH_ADMIN_TOKEN||request.headers.get('Authorization')!=='Bearer '+env.PUSH_ADMIN_TOKEN)return json({error:'No autorizado'},403);
  const {results}=await env.DB.prepare('SELECT endpoint,payload FROM subscriptions LIMIT 100').all();
  const deliveries=await Promise.all(results.map(async row=>{
   try{
    const payload=await buildPushPayload({data:{title:'Explora Lugares',body:'Consulta las novedades de tus lugares.',url:appURL},options:{ttl:300}},JSON.parse(row.payload),{subject:'mailto:admin@example.com',publicKey:env.VAPID_PUBLIC_KEY,privateKey:env.VAPID_PRIVATE_KEY});
    const response=await fetch(row.endpoint,{...payload,redirect:'error'});
    if([404,410].includes(response.status))await env.DB.prepare('DELETE FROM subscriptions WHERE endpoint=?').bind(row.endpoint).run();
    return {status:response.status,accepted:response.ok};
   }catch{return {accepted:false,status:0};}
  }));return json({sent:deliveries.filter(r=>r.accepted).length,total:results.length,deliveries});
 }
 if(url.pathname.startsWith('/lugar/') && request.method==='GET'){
  const place=catalog.find(p=>p.id===decodeURIComponent(url.pathname.slice(7)));if(!place)return json({error:'Lugar no encontrado'},404);
  const shellResponse=await fetch(appURL+'index.html',{cf:{cacheTtl:60}});if(!shellResponse.ok)return json({error:'Shell no disponible'},502);
  let shell=await shellResponse.text();
  const detail='<article class="detail-card" data-ssr-place="'+esc(place.id)+'"><div class="detail-content"><h1>'+esc(place.name)+'</h1><p>'+esc(place.description)+'</p><span>Tiempo sugerido: '+esc(place.duration)+'</span></div></article><div id="hydrated-detail"></div>';
  shell=shell.replace('<head>','<head><base href="'+appURL+'">').replace('<title>Explora Lugares</title>','<title>'+esc(place.name)+' · Explora Lugares</title>').replace('<main id="app" class="container" tabindex="-1">','<main id="app" class="container" tabindex="-1">'+detail);
  return new Response(shell,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});
 }
 return json({error:'Ruta no encontrada'},404);
 }catch(e){return json({error:e instanceof SyntaxError?'JSON inválido':'No se pudo completar la solicitud'},e instanceof SyntaxError?400:500);}
}};
