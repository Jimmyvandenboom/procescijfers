import {validTeacher,issueSession,matchesPassword,sameOrigin} from '@/app/teacher-auth';
import {db} from '@/db/raw';
const cookie=(token:string,age=28800)=>`dp_teacher=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${age}`;
export async function GET(req:Request){return Response.json({authenticated:await validTeacher(req)},{headers:{'Cache-Control':'no-store'}});}
export async function DELETE(req:Request){if(!sameOrigin(req))return new Response(null,{status:403});return Response.json({ok:true},{headers:{'Set-Cookie':cookie('',0),'Cache-Control':'no-store'}});}
export async function POST(req:Request){if(!sameOrigin(req))return new Response(null,{status:403});try{const b=await req.json();if(typeof b.password!=='string'||b.password.length>200)return Response.json({error:'Vul het docentenwachtwoord in.'},{status:400});
const identity=req.headers.get('oai-authenticated-user-id')||req.headers.get('cf-connecting-ip')||'private-test';const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(identity));const id='login:'+Array.from(new Uint8Array(digest)).map(x=>x.toString(16).padStart(2,'0')).join('');
const stored=await db().prepare('SELECT payload FROM records WHERE id=?').bind(id).first<{payload:string}>();let attempts=stored?JSON.parse(stored.payload):{count:0,since:Date.now()};if(Date.now()-attempts.since>900000)attempts={count:0,since:Date.now()};if(attempts.count>=5)return Response.json({error:'Te veel pogingen. Probeer het over 15 minuten opnieuw.'},{status:429});
if(!matchesPassword(b.password)){attempts.count++;await db().prepare('INSERT INTO records(id,payload) VALUES (?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload').bind(id,JSON.stringify(attempts)).run();return Response.json({error:'Het wachtwoord klopt niet.'},{status:401});}
await db().prepare('DELETE FROM records WHERE id=?').bind(id).run();return Response.json({ok:true},{headers:{'Set-Cookie':cookie(await issueSession()),'Cache-Control':'no-store'}});
}catch(e){console.error(e);return Response.json({error:'Inloggen is tijdelijk niet beschikbaar. Probeer opnieuw.'},{status:503});}}
