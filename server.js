import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes, timingSafeEqual, createHash } from 'node:crypto';
import { mkdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { criteria, grade, processGrade, csvCell } from './grading.js';
const password=process.env.TEACHER_PASSWORD, path=process.env.DATABASE_PATH;
const production=process.env.NODE_ENV==='production';
let db;
if(path){mkdirSync(dirname(resolve(path)),{recursive:true});db=new DatabaseSync(path);db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS groups(id INTEGER PRIMARY KEY, expedition TEXT NOT NULL, name TEXT NOT NULL, test INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS students(id INTEGER PRIMARY KEY, group_id INTEGER REFERENCES groups(id), name TEXT NOT NULL, code TEXT NOT NULL UNIQUE, honesty INTEGER CHECK(honesty BETWEEN 1 AND 4));
CREATE TABLE IF NOT EXISTS reviews(author INTEGER REFERENCES students(id), target INTEGER REFERENCES students(id), answers TEXT NOT NULL, created TEXT NOT NULL, PRIMARY KEY(author,target));`);
if(!db.prepare('SELECT id FROM groups LIMIT 1').get()){
 const insert=db.prepare('INSERT INTO students(group_id,name,code) VALUES(?,?,?)');
 for(const [exp,name,names] of [['Stad van de Toekomst','Testgroep van twee',['Alex Voorbeeld','Sam Test']],['Campus@Sea','Testgroep van vier',['Noor Voorbeeld','Jay Test','Robin Demo','Kim Fictief']]]){
 const id=db.prepare('INSERT INTO groups(expedition,name,test) VALUES(?,?,1)').run(exp,name).lastInsertRowid;
 for(const name of names)insert.run(id,name,randomBytes(8).toString('hex'));
 }
}}
const sessions=new Map(), attempts=new Map();
const hash=x=>createHash('sha256').update(x).digest();
const equal=(a,b)=>timingSafeEqual(hash(a),hash(b));
const cookie=(token,age)=>`dp_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${age}${production?'; Secure':''}`;
function snapshot(){
 const groups=db.prepare('SELECT * FROM groups').all(), students=db.prepare('SELECT * FROM students').all();
 const reviews=db.prepare('SELECT * FROM reviews').all().map(r=>{const answers=JSON.parse(r.answers),a=students.find(s=>s.id===r.author);return {...r,answers,grade:grade(answers.map(x=>x.score),a.honesty)};});
 return {groups,students:students.map(s=>{const received=reviews.filter(r=>r.target===s.id),members=students.filter(x=>x.group_id===s.group_id);return {...s,received,missing:members.filter(x=>!received.some(r=>r.author===x.id)).map(x=>x.name),processGrade:processGrade(received,members.length)};}),criteria};
}
async function body(req){let data='';for await(const chunk of req){data+=chunk;if(data.length>100000)throw Error('Aanvraag te groot.');}return JSON.parse(data||'{}');}
const server=http.createServer(async(req,res)=>{
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Cache-Control','no-store');res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
 const send=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(data));};
 try{
 const url=new URL(req.url,'http://localhost'), route=url.pathname;
 if(!route.startsWith('/api/')){const files={'/':'index.html','/app.js':'app.js','/style.css':'style.css','/maris-bohemen.png':'maris-bohemen.png'};const file=files[route];if(!file||!existsSync(new URL('./public/'+file,import.meta.url)))return send(404,{error:'Niet gevonden.'});res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.png')?'image/png':'text/html; charset=utf-8');return res.end(readFileSync(new URL('./public/'+file,import.meta.url)));}
 if(req.method!=='GET' && req.headers.origin){const origin=new URL(req.headers.origin);if(origin.host!==req.headers.host)return send(403,{error:'Ongeldige herkomst.'});}
 if(!db)return send(503,{error:'Centrale opslag ontbreekt. Stel DATABASE_PATH in op een blijvend servervolume en herstart de server. Er worden geen antwoorden in de browser opgeslagen.'});
 const token=req.headers.cookie?.split(';').map(x=>x.trim()).find(x=>x.startsWith('dp_session='))?.slice(11);
 let session=sessions.get(token);if(session&&session.expires<Date.now()){sessions.delete(token);session=null;}
 if(route==='/api/status'&&req.method==='GET')return send(200,{configured:!!password,criteria,expeditions:['Stad van de Toekomst','Campus@Sea'],role:session?.role||null});
 if(route==='/api/login'&&req.method==='POST'){
 if(!password)return send(503,{error:'Stel TEACHER_PASSWORD op de server in.'});
 const ip=req.socket.remoteAddress;const now=Date.now();let item=attempts.get(ip);if(!item||now-item.start>900000){item={start:now,count:0};attempts.set(ip,item);}if(item.count>=5)return send(429,{error:'Te veel pogingen. Probeer over 15 minuten opnieuw.'});item.count++;
 const b=await body(req);if(typeof b.password!=='string'||!equal(b.password,password))return send(401,{error:'Onjuist wachtwoord.'});
 if(token)sessions.delete(token);const t=randomBytes(32).toString('hex');sessions.set(t,{role:'teacher',expires:now+28800000});res.setHeader('Set-Cookie',cookie(t,28800));return send(200,{ok:true});}
 if(route==='/api/student-login'&&req.method==='POST'){
 const ip='student:'+req.socket.remoteAddress,now=Date.now();let item=attempts.get(ip);if(!item||now-item.start>900000){item={start:now,count:0};attempts.set(ip,item);}if(item.count>=30)return send(429,{error:'Te veel pogingen. Wacht 15 minuten.'});item.count++;
 const b=await body(req);const s=db.prepare('SELECT s.*,g.expedition FROM students s JOIN groups g ON g.id=s.group_id WHERE code=?').get(String(b.code||''));if(!s||s.name.toLocaleLowerCase('nl')!==String(b.name||'').trim().toLocaleLowerCase('nl')||s.expedition!==b.expedition)return send(401,{error:'Naam, expeditie of persoonlijke code klopt niet.'});
 const t=randomBytes(32).toString('hex');sessions.set(t,{role:'student',id:s.id,expires:now+7200000});res.setHeader('Set-Cookie',cookie(t,7200));return send(200,{ok:true});}
 if(route==='/api/logout'&&req.method==='POST'){sessions.delete(token);res.setHeader('Set-Cookie',cookie('',0));return send(200,{ok:true});}
 if(route==='/api/student'&&req.method==='GET'&&session?.role==='student'){
 const s=db.prepare('SELECT s.id,s.name,s.group_id,g.test,g.expedition FROM students s JOIN groups g ON g.id=s.group_id WHERE s.id=?').get(session.id);const members=db.prepare('SELECT id,name FROM students WHERE group_id=?').all(s.group_id);const submitted=!!db.prepare('SELECT author FROM reviews WHERE author=? LIMIT 1').get(s.id);return send(200,{student:s,members,submitted,criteria});}
 if(route==='/api/submit'&&req.method==='POST'&&session?.role==='student'){
 const s=db.prepare('SELECT * FROM students WHERE id=?').get(session.id),members=db.prepare('SELECT id FROM students WHERE group_id=?').all(s.group_id),b=await body(req);
 if(!Array.isArray(b.reviews)||b.reviews.length!==members.length||new Set(b.reviews.map(r=>r.target)).size!==members.length||!b.reviews.every(r=>members.some(m=>m.id===r.target)&&Array.isArray(r.answers)&&r.answers.length===6&&r.answers.every(a=>Number.isInteger(a.score)&&a.score>=1&&a.score<=4&&typeof a.comment==='string'&&a.comment.trim().length>=2&&a.comment.length<=500)))return send(400,{error:'Beoordeel ieder groepslid met zes scores en toelichtingen van 2–500 tekens.'});
 if(db.prepare('SELECT author FROM reviews WHERE author=? LIMIT 1').get(s.id))return send(409,{error:'Je hebt al ingeleverd.'});
 db.exec('BEGIN IMMEDIATE');try{for(const r of b.reviews)db.prepare('INSERT INTO reviews VALUES(?,?,?,?)').run(s.id,r.target,JSON.stringify(r.answers.map(a=>({score:a.score,comment:a.comment.trim()}))),new Date().toISOString());db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}return send(201,{ok:true});}
 if(route.startsWith('/api/teacher')&&session?.role!=='teacher')return send(401,{error:'Log in als docent.'});
 if(route==='/api/teacher'&&req.method==='GET')return send(200,snapshot());
 if(route==='/api/teacher/honesty'&&req.method==='POST'){const b=await body(req);if(!Number.isInteger(b.score)||b.score<1||b.score>4)return send(400,{error:'Kies 1–4.'});const result=db.prepare('UPDATE students SET honesty=? WHERE id=?').run(b.score,b.id);if(!result.changes)return send(404,{error:'Leerling ontbreekt.'});return send(200,{ok:true});}
 if(route==='/api/teacher/groups'&&req.method==='POST'){
 const b=await body(req);const names=Array.isArray(b.names)?b.names.map(n=>String(n).trim()):[];
 if(!['Stad van de Toekomst','Campus@Sea'].includes(b.expedition)||typeof b.name!=='string'||!b.name.trim()||b.name.length>80||names.length<1||names.length>12||names.some(n=>n.length>100||n.split(/\s+/).length<2)||new Set(names.map(n=>n.toLowerCase())).size!==names.length)return send(400,{error:'Vul een groepsnaam en 1–12 unieke volledige namen in.'});
 if(b.id){if(!db.prepare('SELECT id FROM groups WHERE id=?').get(b.id))return send(404,{error:'Groep ontbreekt.'});if(db.prepare('SELECT r.author FROM reviews r JOIN students s ON s.id=r.author WHERE s.group_id=? LIMIT 1').get(b.id))return send(409,{error:'Deze groep heeft al inzendingen. Maak een nieuwe groep om historische beoordelingen te behouden.'});}
 db.exec('BEGIN');try{let id=b.id;if(id){const old=db.prepare('SELECT id FROM students WHERE group_id=?').all(id);for(const [t,session] of sessions)if(old.some(s=>s.id===session.id))sessions.delete(t);db.prepare('DELETE FROM students WHERE group_id=?').run(id);db.prepare('UPDATE groups SET expedition=?,name=?,test=0 WHERE id=?').run(b.expedition,b.name.trim(),id);}else{id=db.prepare('INSERT INTO groups(expedition,name) VALUES(?,?)').run(b.expedition,b.name.trim()).lastInsertRowid;}for(const name of names)db.prepare('INSERT INTO students(group_id,name,code) VALUES(?,?,?)').run(id,name,randomBytes(8).toString('hex'));db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}return send(201,{ok:true});}
 if(route==='/api/teacher/export'&&req.method==='GET'){
 const data=snapshot(),rows=[['Expeditie','Groep','Testgegevens','Beoordelaar','Beoordeelde',...criteria.flatMap(c=>[c+' score',c+' toelichting']),'Eerlijkheid','Deelcijfer','Procescijfer','Status']];
 for(const s of data.students){const g=data.groups.find(g=>g.id===s.group_id);for(const r of s.received){const a=data.students.find(a=>a.id===r.author);rows.push([g.expedition,g.name,g.test?'Ja':'Nee',a.name,s.name,...r.answers.flatMap(x=>[x.score,x.comment]),a.honesty,r.grade===null?'':r.grade.toFixed(1).replace('.',','),s.processGrade===null?'':s.processGrade.toFixed(1).replace('.',','),s.processGrade===null?'Onvolledig':'Definitief']);}if(!s.received.length)rows.push([g.expedition,g.name,g.test?'Ja':'Nee','',s.name,...Array(15).fill(''),'Onvolledig']);}
 res.writeHead(200,{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="procesbeoordelingen.csv"'});return res.end('\uFEFF'+rows.map(r=>r.map(csvCell).join(';')).join('\r\n'));}
 return send(403,{error:'Geen toegang.'});
 }catch(e){console.error(e.message);send(400,{error:'Aanvraag kon niet worden verwerkt.'});}
});
server.listen(Number(process.env.PORT||3000),'0.0.0.0',()=>console.log(`Procescijfers gestart; centrale opslag ${db?'actief':'ONTBREEKT'}.`));
